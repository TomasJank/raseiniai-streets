"""Graphics: GTAO ambient occlusion via EffectComposer, soft shadows, optional tod-driven Sky, tone mapping (gfx.js).
Flags live in the GFX object at the top of gfx.js.
usage: add_gfx.py page.html   (edits in place; run after add_voice.py, before add_water2.py)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gfx.js'), encoding='utf-8').read()
head, late = js.split('//@@late\n')


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.LinearSRGBColorSpace;",
    "renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.LinearSRGBColorSpace;\n" + head)
rep("function frame(now){", late + "function frame(now){")
rep("  perfTick(dt);\n  renderer.render(scene,camera);\n}", "  perfTick(dt);\n  gfxRender();\n}")
open(path, 'w', encoding='utf-8').write(h)
print('gfx ok')
