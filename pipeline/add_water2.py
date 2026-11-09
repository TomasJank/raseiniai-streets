"""Water2: flat ponds and lakes (outline over near-flat terrain, 8000 m2+) become planar Water.js surfaces with reflection (water2.js).
Flags live in the WATER2 object at the top of water2.js; planes:false keeps the original ripple/Fresnel water.
usage: add_water2.py page.html   (edits in place; run after add_gfx.py)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'water2.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("const waterMat=new THREE.MeshPhongMaterial(", js + "const waterMat=new THREE.MeshPhongMaterial(")
rep("  if(WA.pos.length){const m=new THREE.Mesh(mkGeo(WA.pos,WA.col,WA.nor),waterMat);m.receiveShadow=true;worldGroup.add(m);}",
    "  water2Install(WA,mm.water,worldGroup,GY);\n  if(WA.pos.length){const m=new THREE.Mesh(mkGeo(WA.pos,WA.col,WA.nor),waterMat);m.receiveShadow=true;worldGroup.add(m);water2Mesh=m;}")
open(path, 'w', encoding='utf-8').write(h)
print('water2 ok')
