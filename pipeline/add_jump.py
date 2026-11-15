"""Jump on foot with Space (jump.js): an arc with gravity, low obstacles passed over, crouch, tuck and landing dip.
usage: add_jump.py page.html   (edits in place; after fixmoney)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'jump.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


a = '<kbd>Space</kbd><span>Handbrake: hold while steering to drift</span>\n'
rep(a, a + '    <kbd>Space</kbd><span>On foot: jump, clears low things like benches, bins and bollards</span>\n')
a = '  <button class="tb" id="tCam"'
rep(a, '  <button class="tb" id="tJump" data-press="Space" type="button" aria-label="Jump" style="right:calc(max(16px,env(safe-area-inset-right,0px)) + 192px);bottom:calc(98px + env(safe-area-inset-bottom,0px));width:52px;height:52px;font-size:12px;font-weight:600">JUMP</button>\n' + a)
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('jump ok')
