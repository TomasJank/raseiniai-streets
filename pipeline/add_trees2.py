"""Trees2: trees where the orthophoto and the cadastre have them but the LiDAR list does not, and a species for every tree.
usage: add_trees2.py page.html   (edits in place; data from pipeline/geo/trees2_map.py)
"""
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'trees2.js'), encoding='utf-8').read()
d = json.load(open(os.path.join(here, 'geo', 'trees2_data.json'), encoding='utf-8'))


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


data = 'const TREES2=%s;\n' % json.dumps({'n': d['n'], 'k': d['k']}, separators=(',', ':'))
rep("function buildExtra(){", data + js + "function buildExtra(){")
a = "  if(trees.length){\n    // chunked so each block of trees is culled on its own"
rep(a, "  trees2Build(trees,W,P,inBox,mm,TR);trees.length=0;\n" + a)
open(path, 'w', encoding='utf-8').write(h)
print('trees2 ok: %d B data' % len(data))
