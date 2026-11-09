"""Fists on foot (fight.js): X, a left click or the HIT button punches; people fight back, run, or watch; bouncers at L klubas.

usage: add_fight.py page.html   (edits in place)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fight.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("function buildStory(){", js + "function buildStory(){")
rep("function press(code){\n", "function press(code){\n  if(code==='KeyX'){punch();return;}\n")
rep('<button class="tb" id="tCam"', '<button class="tb" id="tHit" data-press="KeyX" type="button" aria-label="Punch" style="right:calc(max(16px,env(safe-area-inset-right,0px)) + 128px);'
    'bottom:calc(98px + env(safe-area-inset-bottom,0px));width:52px;height:52px;font-size:12px;font-weight:600">HIT</button>\n  <button class="tb" id="tCam"')
rep("<kbd>E</kbd><span>Get out, or take the nearest car</span>\n", "<kbd>E</kbd><span>Get out, or take the nearest car</span>\n    <kbd>X</kbd><span>On foot: punch (or left click)</span>\n")
rep("function walk(dt){waterTick(dt);", "function walk(dt){waterTick(dt);if(fight.pDown>0){player.speed=player.gait=0;return;}")
rep("poseAt(PLAYER_I,PLAYER_LOOK,player.x,player.z,player.h,0,0,player.walk,player.gait||0)", "posePlayer()")
rep("}else if(p.mode==='down'){", "}else if(FIGHT_MODES[p.mode]){[rate,gait]=fightStep(p,dt);\n  }else if(p.mode==='down'){")
# a follower stays beside a leader who stopped to watch instead of running off
rep("if(!CALM[L.mode]){", "if(!CALM[L.mode]&&L.mode!=='watch'){")
rep("const A=pedAct(p);", "const A=fightAct(p)||pedAct(p);")
rep("tickGroups(dt);pedAvoid(dt);", "tickGroups(dt);pedAvoid(dt);updateFight(dt);")

open(path, 'w', encoding='utf-8').write(h)
print('fight ok')
