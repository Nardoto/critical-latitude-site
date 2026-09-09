import json
from pathlib import Path
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parents[1]
videos = json.loads((root.parents[1] / 'site/src/data/videos.json').read_text(encoding='utf-8-sig'))
start = int(sys.argv[1]) if len(sys.argv)>1 else 0
end = int(sys.argv[2]) if len(sys.argv)>2 else len(videos)
for v in videos[start:end]:
    p = root / v['id'] / 'dados.json'
    if not p.exists(): continue
    d = json.loads(p.read_text(encoding='utf-8'))
    print('\n###', v['id'], v['title'])
    comments = d.get('comentarios',{}).get('lista',[])
    for i,c in enumerate(comments,1):
        if i<=3:
            print(f'TOP C{i:03d} {c["likes"]} {c["autor"]}: {c["texto"][:1100]}')
    for i,c in enumerate(comments,1):
        if c['do_dono']: continue
        if '?' in c['texto'] or re.search(r'\b(please|could you|can you|wonder|how does|how can|ai|artificial|metric|unit)\b',c['texto'],re.I):
            print(f'C{i:03d} {c["likes"]} {c["autor"]}: {c["texto"][:650]}')
