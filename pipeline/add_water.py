"""Cars can't swim: driven off the road into a pond, lake or a river 8 m+ wide, the car splashes, glides on a little, noses
down and sinks; the screen fades and, as GTA does after drowning, you wake up on foot at the door of Raseinių ligoninė
with a hospital bill (up to €100), the police gone and the car repaired at the kerb outside (the start point if the
hospital is missing). Bridges and culverts (any road surface) never sink. Errands and jobs carry on.
usage: add_water.py page.html   (edits in place; run after add_fix.py)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'water.js'), encoding='utf-8').read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)

rep("W.map={canvas:mc,mpp};", "W.map={canvas:mc,mpp};W.water=mm.water;W.waterLines=mm.waterLines;")
rep("const mine=newCar(sx,sz,sh,0x74767a);", "W.start=[sx,sz,sh];const mine=newCar(sx,sz,sh,0x74767a);")
rep("function driveCar(c,dt){", js + "function driveCar(c,dt){if(sinkStep(c,dt))return;")
rep("function walk(dt){", "function walk(dt){waterTick(dt);")
open(path, 'w', encoding='utf-8').write(h)
print('water ok')
