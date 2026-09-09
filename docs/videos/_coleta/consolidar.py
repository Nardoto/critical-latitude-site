import collections
import datetime
import hashlib
import html
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'docs/videos'
VIDEOS = json.loads((ROOT / 'site/src/data/videos.json').read_text(encoding='utf-8-sig'))

def read_json(path, default=None):
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else default

def write(path, text):
    path.write_text(text.rstrip() + '\n', encoding='utf-8')

def stamp(t):
    t = int(t)
    return f'{t // 60:02d}:{t % 60:02d}'

def urls(text):
    return list(dict.fromkeys(u.rstrip('.,;)') for u in re.findall(r'https?://[^\s<>"\]]+', text)))

def header(v, section):
    return f'# {section} — {v["title"]}\n\nID: {v["id"]}  \nURL: https://www.youtube.com/watch?v={v["id"]}  \nDuração: {v["duration"]}  \nData: {v["date"]}\n\n'

def vtt_events(path):
    """Remove somente a sobreposição das janelas móveis exibidas pelo VTT."""
    text = path.read_text(encoding='utf-8-sig').replace('\r\n', '\n')
    result, emitted = [], []
    # Uma linha vazia no início de um cue automático não encerra seu texto.
    cue_pattern = r'^(\d+:\d{2}:\d{2}\.\d+)\s+-->[^\n]*\n(.*?)(?=^\d+:\d{2}:\d{2}\.\d+\s+-->|\Z)'
    for match in re.finditer(cue_pattern, text, re.M | re.S):
        h, m, s = match[1].split(':')
        t = int(h) * 3600 + int(m) * 60 + float(s)
        cleaned = html.unescape(re.sub(r'<[^>]+>', '', match[2]))
        words = cleaned.split()
        overlap = 0
        for n in range(min(len(words), len(emitted)), 0, -1):
            if emitted[-n:] == words[:n]:
                overlap = n
                break
        new = words[overlap:]
        if new:
            result.append({'t': round(t, 3), 'txt': ' '.join(new)})
            emitted.extend(new)
    return result

def paragraphs(events):
    chunks = []
    start, words = None, []
    for ev in events:
        if start is None:
            start = ev['t']
        if ev['t'] - start >= 60 and words:
            chunks.append(f'[{stamp(start)}] ' + ' '.join(words))
            start, words = ev['t'], []
        words.append(ev['txt'])
    if words:
        chunks.append(f'[{stamp(start)}] ' + ' '.join(words))
    return '\n\n'.join(chunks)

def escape(s):
    return str(s).replace('|', '\\|').replace('\n', ' ')

def comment_text(c, rank):
    flags = []
    if c.get('do_dono'): flags.append('autor do canal')
    if c.get('fixado'): flags.append('fixado')
    if c.get('resposta'): flags.append('resposta')
    extra = '; ' + ', '.join(flags) if flags else ''
    return f'### C{rank:03d} — {c.get("autor") or "autor não informado"} — {c["likes"]} likes{extra}\n\n' + '\n'.join('> ' + line for line in c['texto'].splitlines()) + '\n'

def run():
    rows, reviews, evidence, problems = [], [], {}, []
    summaries = read_json(OUT / '_coleta/resumos.json', {})
    for v in VIDEOS:
        vid = v['id']
        folder = OUT / vid
        folder.mkdir(parents=True, exist_ok=True)
        d = read_json(folder / 'dados.json', {})
        info = read_json(folder / (vid + '.info.json'), {})
        comments = sorted(d.get('comentarios', {}).get('lista', []), key=lambda c: c.get('likes', 0), reverse=True)
        engine_events = d.get('transcricao', [])
        vtt = folder / (vid + '.en.vtt')
        events = vtt_events(vtt) if vtt.exists() else []
        source = vtt.name
        if not events and str(d.get('video', {}).get('idioma_legenda') or '').startswith('en'):
            events, source = engine_events, 'dados.json (transcricao em inglês)'
        if events:
            transcript = header(v, 'Transcrição') + f'Origem: {source}. Legenda do YouTube preservada sem correção editorial; erros de reconhecimento podem permanecer. Marcas indicam o início de cada parágrafo, aproximadamente a cada 60 segundos.\n\n' + paragraphs(events)
            # Comparação integral com o JSON3 que o próprio motor preservou.
            vt = ' '.join(e['txt'] for e in events).split()
            et = ' '.join(e['txt'] for e in engine_events).split()
            parity = vt == et
            if engine_events and not parity:
                problems.append(f'{vid}: texto VTT difere do JSON3 do motor; comparação registrada na validação.')
            trans_status = 'ok'
        else:
            transcript = header(v, 'Transcrição') + 'sem transcrição\n\nNão foi obtida legenda em inglês nesta coleta. Consulte os logs para distinguir ausência de legenda de falha de acesso.'
            parity, trans_status = None, 'sem'
        write(folder / 'transcricao.md', transcript)
        comment_md = header(v, 'Comentários') + f'{len(comments)} comentários coletados, ordenados por likes decrescentes. Limite solicitado ao motor: 150; a amostra não representa todos os comentários publicados. Empates mantêm a ordem do motor.\n\n## Os 15 mais curtidos\n\n'
        comment_md += '\n'.join(comment_text(c, i) for i, c in enumerate(comments[:15], 1)) or 'Nenhum comentário coletado.\n'
        comment_md += '\n## Todos os comentários coletados\n\n'
        comment_md += '\n'.join(comment_text(c, i) for i, c in enumerate(comments, 1)) or 'Nenhum comentário coletado.\n'
        write(folder / 'comentarios.md', comment_md)
        description = info.get('description')
        if description is None:
            description = d.get('video', {}).get('descricao', '')
            problems.append(f'{vid}: descrição integral não confirmada; só trecho do motor disponível.')
        desc_md = header(v, 'Descrição') + 'Origem: ' + (vid + '.info.json' if info else 'dados.json; pode estar truncada pelo motor') + '\n\n## Descrição completa\n\n' + description + '\n\n## Capítulos\n\n'
        chapters = info.get('chapters') or []
        desc_md += '\n'.join(f'- [{stamp(c["start_time"])}] {c["title"]}' for c in chapters) if chapters else 'Sem capítulos informados pelo YouTube.'
        desc_md += '\n\n## Todas as URLs da descrição\n\n' + ('\n'.join('- ' + u for u in urls(description)) or 'Sem URLs.')
        write(folder / 'descricao.md', desc_md)
        sources = read_json(folder / 'fontes-status.json', {'documentos': [], 'links': []})
        # URLs comerciais em linhas adjacentes não pertencem à seção Sources.
        docs = [x for x in sources['documentos'] if 'payhip.com/' not in x['url']]
        if len(docs) != len(sources['documentos']):
            sources['documentos'] = docs
            sources['links'] = [x['url'] for x in docs]
            write(folder / 'fontes-status.json', json.dumps(sources, ensure_ascii=False, indent=2))
        source_md = header(v, 'Fontes')
        all_urls = []
        if not docs:
            source_status = 'sem link' if (folder / 'fontes-status.json').exists() else 'não acessível'
            source_md += 'sem link de Sources na descrição.' if source_status == 'sem link' else 'não acessível — coleta das fontes pendente ou descrição indisponível.'
        else:
            source_status = 'ok' if all(x['status'] == 'ok' for x in docs) else 'não acessível'
            for i, doc in enumerate(docs, 1):
                source_md += f'## Documento {i}\n\nLink da descrição: {doc["url"]}  \nDestino: {doc.get("url_final", "não resolvido")}  \nExportação: {doc.get("export_url", "indisponível")}  \nEstado: {doc["status"]}  \nColetado em: {doc["verificado_em"]}\n\n'
                all_urls.extend([doc['url']] + [doc[k] for k in ('url_final', 'export_url') if k in doc])
                if doc['status'] == 'ok':
                    full_text = Path(doc['arquivo_texto']).read_text(encoding='utf-8-sig')
                    source_md += '### Texto integral do documento, incluindo suas referências\n\n' + full_text + '\n\n'
                    all_urls.extend(urls(full_text))
                else:
                    source_md += 'não acessível — ' + doc.get('erro', 'falha não detalhada') + '\n\n'
                    problems.append(f'{vid}: fonte não acessível: {doc["url"]}; {doc.get("erro", "")}.')
            source_md += '## Todas as URLs das fontes\n\n' + '\n'.join('- ' + u for u in dict.fromkeys(all_urls))
        write(folder / 'fontes.md', source_md)
        peaks = d.get('retencao', {}).get('picos', [])
        peak = (f'{stamp(peaks[0]["ini"])} — {peaks[0].get("fala") or "fala indisponível"}') if peaks else 'Não exposto'
        view = d.get('video', {}).get('views')
        row = [vid, v['title'], v['date'], v['duration'], str(view) if view is not None else 'Não informado', str(len(comments)), trans_status, source_status, peak]
        rows.append('| ' + ' | '.join(escape(x) for x in row) + ' |')
        reviews.append('\n### ' + vid + ' — ' + v['title'])
        for i, c in enumerate(comments[:3], 1):
            reviews.append(f'TOP C{i:03d} {c["likes"]} likes {c["autor"]}: {c["texto"]}')
        for i, c in enumerate(comments, 1):
            if not c.get('do_dono') and (re.search(r'\?|\b(?:why|how|what|when|where|could you|can you|please|wonder|is this|are you|ai|artificial|voice|pronounc)\b', c['texto'], re.I)):
                reviews.append(f'C{i:03d} {c["likes"]} likes {c["autor"]}: {c["texto"]}')
        evidence[vid] = {'comentarios': len(comments), 'vtt_eventos': len(events), 'motor_eventos': len(engine_events),
            'vtt_igual_json3_texto': parity, 'primeira_fala_seg': events[0]['t'] if events else None,
            'ultima_fala_seg': events[-1]['t'] if events else None, 'duracao_seg': info.get('duration'),
            'descricao_caracteres': len(description), 'capitulos': len(chapters), 'fontes': source_status,
            'documentos': len(docs), 'retencao_pontos': d.get('retencao', {}).get('pontos', 0)}
    index = '# Índice de material — Critical Latitude\n\nColeta em 09/09/2026. Lista de vídeos: `site/src/data/videos.json`. Views e comentários são o retrato desta coleta; limite de 150 comentários por vídeo. Datas, títulos e durações da tabela seguem a lista solicitada.\n\nTranscrições integrais em inglês vieram das legendas do YouTube; descrições completas e capítulos, do yt-dlp do Studio; fontes, da exportação TXT dos Google Docs vinculados em Sources. “Não exposto” indica ausência do heatmap de trechos mais revistos, que não equivale à retenção privada do YouTube Analytics.\n\n| ID | Título | Data | Duração | Views | Comentários coletados | Transcrição | Fontes | Pico de retenção e fala |\n| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |\n' + '\n'.join(rows)
    index += '\n\nOs três primeiros itens de cada vídeo resumem os comentários mais curtidos, incluindo respostas do próprio canal quando presentes no topo. Os dois últimos registram dúvidas e pedidos recorrentes da amostra. “Sintetizada” ou “agrupada” identifica uma formulação em português a partir de comentários sobre o mesmo assunto, não uma citação literal. As referências apresentadas são evidências de recorrência, não contagens exaustivas; não se afirma um ranking estatístico entre temas. Perguntas isoladas e ausência de uma segunda recorrência são indicadas. C001, C002 etc. remetem à ordenação de `comentarios.md`. Relatos, opiniões e alegações dos comentários não foram verificados como fatos. Textos originais preservados nos arquivos individuais.\n'
    for v in VIDEOS:
        index += '\n## ' + v['id'] + ' — ' + v['title'] + '\n\n'
        entry = summaries.get(v['id'])
        index += '\n'.join('- ' + s for s in entry['linhas']) if entry else '- Consolidação dos comentários pendente.'
        index += '\n'
    write(OUT / 'INDICE.md', index)
    write(OUT / '_coleta/revisao-comentarios.txt', '\n'.join(reviews))
    write(OUT / '_coleta/validacao.json', json.dumps({'videos': evidence, 'problemas': problems}, ensure_ascii=False, indent=2))
    print(json.dumps({'videos': len(evidence), 'problemas': problems, 'transcricoes': sum(x['vtt_eventos'] > 0 for x in evidence.values()),
        'comentarios': sum(x['comentarios'] for x in evidence.values()), 'fontes_ok': sum(x['fontes'] == 'ok' for x in evidence.values())}, ensure_ascii=False))

if __name__ == '__main__':
    run()
