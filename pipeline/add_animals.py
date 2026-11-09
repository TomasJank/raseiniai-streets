"""Animals: the pooled rigs and update loop (animals.js) plus every species file in animals/*.js (see animals/README.md).

usage: add_animals.py page.html   (edits in place)
"""
import glob, os, re, sys

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'animals.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


seen = {}
for f in sorted(glob.glob(os.path.join(here, 'animals', '*.js'))):
    src = open(f, encoding='utf-8').read()
    names = re.findall(r'^SPECIES\.(\w+)\s*=', src, re.M)
    assert names, f'{f}: no SPECIES.<name>={{...}}'
    for n in names:
        assert n not in seen, f'SPECIES.{n} in {seen.get(n)} and {f}'
        seen[n] = f
    for top in re.findall(r'^(?:function|const|let|var|class)\s+(\w+)', src, re.M):
        assert any(top.startswith(n + '_') for n in names), f'{f}: top-level {top} is not prefixed with a species name'
    js += '\n' + src

rep("function buildExtra(){", js + "\nfunction buildExtra(){")
rep("updateFalling(dt);updateDebris(dt);", "updateAnimals(dt);updateFalling(dt);updateDebris(dt);")
# green polygons for hares and deer: [pts, isForest]
rep("if(g){flatPoly(GR,pts,0.02,g);mm.green.push(pts);", "if(g){flatPoly(GR,pts,0.02,g);mm.green.push(pts);(W.green||(W.green=[])).push([pts,isForest]);")
# fence height as a fifth number, so a cat sits on top of the fence it is on (addWall ignores it)
rep("        (W.hedgeSegs||(W.hedgeSegs=[])).push([a[0],a[1],b[0],b[1]]);\n        if(style==='picket')",
    "        (W.hedgeSegs||(W.hedgeSegs=[])).push([a[0],a[1],b[0],b[1],style==='picket'?1.25:style==='mesh'?1.45:style==='wall'?1.8:1.2+hash(key)*.6]);\n        if(style==='picket')")

open(path, 'w', encoding='utf-8').write(h)
print('animals ok')
