"""Near people and the player become rigged GLB mannequins behind the poseAt/hidePed/dress seam (chars.js); far people stay instanced.

usage: add_chars.py page.html   (edits in place; run after add_assets.py)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chars.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


assert 'const ASSETS=' in h, 'run add_assets.py first'
rep("function buildExtra(){", js + "function buildExtra(){")
rep("function dress(i,cols){", "function dress(i,cols){charCols(i,cols);")
rep("function hidePed(i){", "function hidePed(i){charHide(i);")
rep("function poseAt(i,look,x,z,h,fall,lift,ph,gait,wave,yaw=0,act=null){\n",
    "function poseAt(i,look,x,z,h,fall,lift,ph,gait,wave,yaw=0,act=null){\n  if(charPose(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act))return;\n")
rep("  for(const m of pedMesh)m.instanceMatrix.needsUpdate=true;\n}", "  charTick();\n  for(const m of pedMesh)m.instanceMatrix.needsUpdate=true;\n}")
open(path, 'w', encoding='utf-8').write(h)
print('chars ok')
