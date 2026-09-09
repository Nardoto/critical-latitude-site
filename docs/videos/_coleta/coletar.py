"""Coleta auditável com o motor e o yt-dlp instalados no Studio."""
import concurrent.futures
import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import threading
import time

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'docs' / 'videos'
PY = Path(r'C:\Program Files\Nardoto Studio\NardotoStudio\resources\python-runtime\python.exe')
ENGINE = PY.parents[1] / 'studio-skills' / 'pesquisa-mercado' / 'scripts' / 'pesquisa.py'
YTDLP = PY.parents[1] / 'python' / 'yt-dlp.exe'
LOCK = threading.Lock()
START_LOCK = threading.Lock()
LAST_START = 0
VIDEOS = json.loads((ROOT / 'site/src/data/videos.json').read_text(encoding='utf-8-sig'))

def log(message):
    with LOCK:
        line = datetime.datetime.now().isoformat(timespec='seconds') + ' ' + message
        print(line, flush=True)
        with (OUT / '_coleta/progresso.log').open('a', encoding='utf-8') as f:
            f.write(line + '\n')

def run(args, stdout, stderr, env, timeout):
    with stdout.open('wb') as out, stderr.open('wb') as err:
        try:
            proc = subprocess.run([str(x) for x in args], stdout=out, stderr=err,
                                  env=env, timeout=timeout,
                                  creationflags=subprocess.CREATE_NO_WINDOW)
            return proc.returncode
        except subprocess.TimeoutExpired:
            err.write(b'\nTimeout do coletor. Nao repetido automaticamente.\n')
            return 124

def collect(v, supplement_only=False):
    global LAST_START
    with START_LOCK:
        time.sleep(max(0, 5 - (time.monotonic() - LAST_START)))
        LAST_START = time.monotonic()
    vid = v['id']
    folder = OUT / vid
    folder.mkdir(parents=True, exist_ok=True)
    (folder / 'origem.json').write_text(json.dumps(v, ensure_ascii=False, indent=2), encoding='utf-8')
    env = os.environ.copy()
    env['NARDOTO_PESQUISA_DIR'] = str(folder / '_motor')
    env['NARDOTO_YTDLP'] = str(YTDLP)
    env['PYTHONIOENCODING'] = 'utf-8'
    env['PYTHONUNBUFFERED'] = '1'
    url = 'https://www.youtube.com/watch?v=' + vid
    status = {'id': vid, 'iniciado_em': datetime.datetime.now().astimezone().isoformat(), 'motor': []}
    if not supplement_only:
        for attempt in (1, 2):
            suffix = '' if attempt == 1 else '-tentativa-2'
            stdout = folder / ('relatorio' + suffix + '.txt')
            stderr = folder / ('motor-stderr' + suffix + '.txt')
            log(f'MOTOR {vid} tentativa {attempt}')
            args = [PY, ENGINE, 'video', url, '--comentarios', '150']
            code = run(args, stdout, stderr, env, 1100)
            status['motor'].append({'tentativa': attempt, 'exit_code': code, 'comando': [str(x) for x in args]})
            combined = stdout.read_text(encoding='utf-8', errors='replace') + stderr.read_text(encoding='utf-8', errors='replace')
            if code == 0 or not re.search(r'429|Too Many Requests', combined, re.I) or attempt == 2:
                break
            log(f'429 {vid}; pausa de 60 segundos antes da unica repeticao externa')
            time.sleep(60)
    reports = sorted(folder.glob('relatorio*.txt'))
    copied = False
    for report in reports:
        matches = re.findall(r'JSON completo[^\n]*?:\s*(.+\.json)\s*$', report.read_text(encoding='utf-8-sig', errors='replace'), re.M)
        if matches and Path(matches[-1].strip()).is_file():
            shutil.copy2(Path(matches[-1].strip()), folder / 'dados.json')
            status['json_motor_origem'] = matches[-1].strip()
            copied = True
    if not copied:
        # Nunca apresentar um registro de falha como JSON produzido pelo motor.
        status['problema_motor'] = 'O motor nao produziu JSON completo.'
        (folder / 'dados.json').write_text(json.dumps({'status': 'falha', 'origem': 'coletor, nao motor', 'id': vid,
            'erro': status['problema_motor']}, ensure_ascii=False, indent=2), encoding='utf-8')
    else:
        d = json.loads((folder / 'dados.json').read_text(encoding='utf-8'))
        log(f'MOTOR OK {vid}: {d["comentarios"]["baixados"]} comentarios, {len(d["transcricao"])} eventos, {d["retencao"]["pontos"]} pontos')
    # Uma coleta suplementar entrega a descrição não truncada e a legenda integral.
    # info-json é escrito antes da tentativa de legenda, preservando metadados mesmo em 429.
    for attempt in (1, 2):
        suffix = '' if attempt == 1 else '-tentativa-2'
        stdout = folder / ('yt-dlp' + suffix + '.txt')
        stderr = folder / ('yt-dlp-stderr' + suffix + '.txt')
        log(f'LEGENDA+DESCRICAO {vid} tentativa {attempt}')
        args = [YTDLP, '--skip-download', '--write-auto-sub', '--write-sub', '--sub-lang', 'en',
                '--sub-format', 'vtt/json3', '--write-info-json', '-o', str(folder / '%(id)s'), url]
        code = run(args, stdout, stderr, env, 300)
        status.setdefault('suplemento', []).append({'tentativa': attempt, 'exit_code': code, 'comando': [str(x) for x in args]})
        combined = stdout.read_text(encoding='utf-8', errors='replace') + stderr.read_text(encoding='utf-8', errors='replace')
        if code == 0 or not re.search(r'429|Too Many Requests', combined, re.I) or attempt == 2:
            break
        log(f'429 legenda {vid}; pausa de 60 segundos')
        time.sleep(60)
    status['finalizado_em'] = datetime.datetime.now().astimezone().isoformat()
    (folder / 'coleta-status.json').write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding='utf-8')
    log(f'FIM {vid}')
    return vid

if __name__ == '__main__':
    if '--primeiro-suplemento' in sys.argv:
        collect(VIDEOS[0], True)
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            futures = []
            for v in VIDEOS[1:]:
                futures.append(pool.submit(collect, v))
                time.sleep(5)
            for future in concurrent.futures.as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    log(f'FALHA coletor: {type(e).__name__}: {e}')
