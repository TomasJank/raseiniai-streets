"""Ground layering: the ground mesh sinks under green sheets and the stadium field, not just roads and water.
usage: add_fixground.py page.html   (edits in place; run after add_fixwater.py, the last step)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_ground.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("function buildExtra(){", js + "function buildExtra(){")
rep("buildLandmarks();buildStreets();", "buildLandmarks();buildStreets();fixGround();")
# depth precision falls with 1/near; a camera well above the ground has nothing within a few metres
rep("const f=scene.fog.far+60;if(Math.abs(camera.far-f)>20){camera.far=f;camera.updateProjectionMatrix();}",
    "const f=scene.fog.far+60,nr=Math.min(2.5,Math.max(.4,(camera.position.y-GY(px,pz))*.05));if(Math.abs(camera.far-f)>20||Math.abs(camera.near-nr)>.05){camera.far=f;camera.near=nr;camera.updateProjectionMatrix();}")
open(path, 'w', encoding='utf-8').write(h)
print('fixground ok')
