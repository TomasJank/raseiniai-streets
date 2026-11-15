"""Hats, caps, packs, bags, scarves and sticks fitted to the outfit bodies (fix_gear.js).
usage: add_fixgear.py page.html   (edits in place; run after clothes, i.e. last)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_gear.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


assert 'function clOutfit(look,i){' in h, 'run add_clothes.py first'
# the hat colours are picked when the first crowd is rolled, before any module code below runs: a knit hat is not pink
rep('let pedCold=0;', 'HATS[HATS.indexOf(0xb03a6a)]=0x5a4038;let pedCold=0;')
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('fixgear ok')
