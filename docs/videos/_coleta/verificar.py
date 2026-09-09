import hashlib
import json
from pathlib import Path
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parents[1]
project = root.parents[1]
videos = json.loads((project / 'site/src/data/videos.json').read_text(encoding='utf-8-sig'))
validation = json.loads((root / '_coleta/validacao.json').read_text(encoding='utf-8'))
summaries = json.loads((root / '_coleta/resumos.json').read_text(encoding='utf-8'))
required = ['relatorio.txt','dados.json','transcricao.md','comentarios.md','descricao.md','fontes.md']
checks = []
for v in videos:
    vid = v['id']
    folder = root / vid
    for name in required:
        assert (folder/name).is_file() and (folder/name).stat().st_size > 0, (vid,name)
    report = (folder/'relatorio.txt').read_text(encoding='utf-8-sig')
    origin = Path(re.findall(r'JSON completo[^\n]*?:\s*(.+\.json)\s*$',report,re.M)[-1].strip())
    assert (folder/'dados.json').read_bytes() == origin.read_bytes(), (vid,'JSON alterado')
    d = json.loads((folder/'dados.json').read_text(encoding='utf-8'))
    info = json.loads((folder/(vid+'.info.json')).read_text(encoding='utf-8'))
    evidence = validation['videos'][vid]
    assert d['video']['id'] == info['id'] == vid
    assert d['video']['publicado_em'] == v['date'].replace('-',''), (vid,'data')
    m,s = [int(x) for x in v['duration'].split(':')]
    assert info['duration'] == d['video']['duracao_seg'] == m*60+s
    assert evidence['vtt_igual_json3_texto'], (vid,'transcricao divergente')
    assert abs(evidence['primeira_fala_seg']-d['transcricao'][0]['t']) <= 0.1, (vid,'primeiro timestamp')
    assert abs(evidence['ultima_fala_seg']-d['transcricao'][-1]['t']) <= 0.1, (vid,'ultimo timestamp')
    transcript=(folder/'transcricao.md').read_text(encoding='utf-8')
    blocks=re.findall(r'(?m)^\[(\d+):(\d{2})\] (.+)$',transcript)
    joined=' '.join(b[2] for b in blocks).split()
    assert joined == ' '.join(e['txt'] for e in d['transcricao']).split(), (vid,'texto markdown')
    ts=[int(a)*60+int(b) for a,b,_ in blocks]
    assert all(59<=b-a<=80 for a,b in zip(ts,ts[1:])), (vid,'intervalo de paragrafo')
    comments=d['comentarios']['lista']
    assert len(comments)==d['comentarios']['baixados']==evidence['comentarios']
    assert all(a['likes']>=b['likes'] for a,b in zip(comments,comments[1:]))
    comment_md=(folder/'comentarios.md').read_text(encoding='utf-8')
    main=comment_md.split('## Todos os comentários coletados\n\n',1)[1]
    assert len(re.findall(r'(?m)^### C\d+',main))==len(comments)
    for c in comments:
        assert ' '.join(c['texto'].split()) in ' '.join(re.sub(r'(?m)^> ', '', main).split()), (vid,'comentario omitido')
    assert info['description'] in (folder/'descricao.md').read_text(encoding='utf-8')
    sources=json.loads((folder/'fontes-status.json').read_text(encoding='utf-8-sig'))
    assert len(sources['documentos'])==1 and all(x['status']=='ok' for x in sources['documentos'])
    source_text=(folder/'fontes.md').read_text(encoding='utf-8')
    for source in sources['documentos']:
        raw=Path(source['arquivo_texto']).read_text(encoding='utf-8-sig')
        assert raw in source_text, (vid,'fonte truncada')
    assert len(summaries[vid]['linhas'])==5
    for line in summaries[vid]['linhas']:
        for ref in re.findall(r'\bC(\d{3})\b',line):
            assert 1<=int(ref)<=len(comments), (vid,'referencia de comentario invalida')
    for i,line in enumerate(summaries[vid]['linhas'][:3]):
        assert comments[i]['autor'] in line and f'{comments[i]["likes"]} likes' in line
    checks.append({'id':vid,'arquivos_obrigatorios':6,'json_identico_motor':True,'vtt_texto_e_tempos_verificados':True,
        'comentarios_preservados':len(comments),'fontes_integrais':len(sources['documentos']),
        'sha256_dados':hashlib.sha256((folder/'dados.json').read_bytes()).hexdigest()})
index=(root/'INDICE.md').read_text(encoding='utf-8')
assert len(re.findall(r'(?m)^\| (?:'+ '|'.join(re.escape(v['id']) for v in videos)+r') \|', index))==14
assert len(re.findall(r'(?m)^- ',index))==70
result={'status':'ok','videos':14,'arquivos_obrigatorios':84,'indice_linhas_resumos':70,
    'comentarios':sum(x['comentarios_preservados'] for x in checks),'verificacoes':checks}
(root/'_coleta/verificacao-final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
files = sorted(p for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts)
manifest = 'Arquivos desta coleta (caminhos absolutos)\n\n' + '\n'.join(str(p) for p in files)
(root/'ARQUIVOS.txt').write_text(manifest+'\n'+str(root/'ARQUIVOS.txt')+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='verificacoes'},ensure_ascii=False))
