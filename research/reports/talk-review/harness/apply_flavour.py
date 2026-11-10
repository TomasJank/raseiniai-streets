# usage: apply_flavour.py streets_dir   -> rewrites only the "flavour" array of each {slug}.json, keeping the rest byte-identical
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from flavour_new import F
d = sys.argv[1]
for slug, fl in F.items():
    p = os.path.join(d, slug + '.json'); s = open(p, encoding='utf-8').read()
    i = s.index('"flavour":'); j = s.index('[', i)
    _, end = json.JSONDecoder().raw_decode(s, j)
    line = s.rfind('\n', 0, i) + 1; ind = s[line:i]
    step = ind if ind.strip() == '' and ind else ' '
    body = json.dumps(fl, ensure_ascii=False, indent=len(step))
    body = body.replace('\n', '\n' + ind)
    s = s[:j] + body + s[end:]
    json.loads(s); open(p, 'w', encoding='utf-8').write(s)
    print(slug, len(fl))
