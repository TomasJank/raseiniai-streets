"""Faces, fitted gear, sleeves, kid heads, old stoop and the car-hit tumble for the mannequins (fix_people.js).

usage: add_fixpeople.py page.html   (edits in place; run after chars, after cars2 and fixgfx)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_people.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


assert 'function charMake(b){' in h, 'run add_chars.py first'
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('fixpeople ok')
