"""Parked cars through @three.ez/instanced-mesh (parked2.js): per-instance frustum culling + distance LOD.
Wraps the addParkedCars that cars2 left (renamed addParkedCars1); the library loads lazily, so a failed import keeps the old path.

usage: add_parked2.py page.html   (edits in place; appended after fixtalk in build.sh)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'parked2.js'), encoding='utf-8').read()


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


rep('"three/addons/":"https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/"}}</script>',
    '"three/addons/":"https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/",'
    '"bvh.js":"https://cdn.jsdelivr.net/npm/bvh.js@0.0.13/build/index.js",'
    '"@three.ez/instanced-mesh":"https://cdn.jsdelivr.net/npm/@three.ez/instanced-mesh@0.3.16/build/index.js"}}</script>')
rep("function addParkedCars(list){\n  if(!CARS2.on)", "function addParkedCars1(list){\n  if(!CARS2.on)")
rep("// ---------- boot ----------", js + "\n// ---------- boot ----------")

open(path, 'w', encoding='utf-8').write(h)
print('parked2 ok')
