"""Low-poly GLB fleet behind the car seam (cars2.js). The GLBs are embedded by add_assets.py (manifest entries car2_*),
so this step must run after `assets`; it wraps makeCarMesh, addParkedCars, spawnCop and makeCop by rename.

usage: add_cars2.py page.html   (edits in place; appended after fight2 in build.sh)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cars2.js'), encoding='utf-8').read()


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


assert 'id="asset_car2_sedan"' in h, 'run add_assets.py first (manifest car2_* entries)'
rep("function makeCarMesh(color,G=carGeo){", "function makeCarMesh0(color,G=carGeo){")
rep("function addParkedCars(list){", "function addParkedCars0(list){")
rep("function spawnCop(){", "function spawnCop0(){")
rep("function makeCop(x,z,h){", "function makeCop0(x,z,h){")
rep("// ---------- boot ----------", js + "\n// ---------- boot ----------")

open(path, 'w', encoding='utf-8').write(h)
print('cars2 ok')
