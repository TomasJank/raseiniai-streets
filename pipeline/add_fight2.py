"""Combat upgrade on top of fight.js and chars.js: kick, block, dodge, knockback, hitstop, combos, opponent AI (fight2.js).

usage: add_fight2.py page.html   (edits in place; run after add_water2.py)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fight2.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


assert 'function charAnim(' in h and 'const fight={' in h, 'run add_fight.py and add_chars.py first'
for name, new in [('punch(){', 'punch0(){'), ('fightStep(p,dt){', 'fightStep0(p,dt){'), ('hurtPlayer(){', 'hurtPlayer0(){'),
                  ('updateFight(dt){', 'updateFight0(dt){'), ('walk0(dt){', 'walk0_(dt){'), ('press(code){', 'press0(code){'),
                  ('charAnim(st,dt){', 'charAnim0(st,dt){')]:
    rep('function ' + name, 'function ' + new)
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')

def btn(i, label, aria, attr, right, bottom):
    return ('  <button class="tb" id="%s" %s type="button" aria-label="%s" style="right:calc(max(16px,env(safe-area-inset-right,0px)) + %dpx);'
            'bottom:calc(%dpx + env(safe-area-inset-bottom,0px));width:52px;height:52px;font-size:12px;font-weight:600">%s</button>\n' % (i, attr, aria, right, bottom, label))

rep('  <button class="tb" id="tCam"',
    btn('tKick', 'KICK', 'Kick', 'data-press="KeyZ"', 128, 160) + btn('tBlock', 'BLOCK', 'Hold to block', 'data-k="KeyB"', 64, 160) +
    btn('tDodge', 'DODGE', 'Dodge', 'data-press="KeyJ"', 0, 160) + '  <button class="tb" id="tCam"')
rep('    <kbd>X</kbd><span>On foot: punch (or left click)</span>\n',
    '    <kbd>X</kbd><span>On foot: punch (or left click); press again as you recover to chain jab, cross, kick</span>\n'
    '    <kbd>Z</kbd><span>On foot: kick</span>\n    <kbd>B</kbd><span>On foot: hold to block what comes from the front</span>\n'
    '    <kbd>J</kbd><span>On foot: dodge sideways (or double-tap A / D)</span>\n')
open(path, 'w', encoding='utf-8').write(h)
print('fight2 ok')
