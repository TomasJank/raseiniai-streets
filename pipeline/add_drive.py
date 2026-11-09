"""Drive feel (drive.js): sprung body layer, brake lights, headlight spotlights, damage sag, engine/tyre/wet/gravel sound.

usage: add_drive.py page.html   (edits in place; run after build.sh)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'drive.js'), encoding='utf-8').read()


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


rep("function driveCar(c,dt){", "function driveCar0(c,dt){")
rep("function walk(dt){", "function walk0(dt){")
rep("function collideCar(x,z,r,c){", "function collideCar0(x,z,r,c){")
rep("function updateAudio(playing){", "function updateAudio0(playing){")
rep("// ---------- boot ----------", js + "\n// ---------- boot ----------")

open(path, 'w', encoding='utf-8').write(h)
print('drive ok')
