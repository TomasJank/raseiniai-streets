"""The player as a marozas: black three-stripe tracksuit, white trainers, buzz cut (marozas.js).
usage: add_marozas.py page.html   (edits in place; run after fixgear)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'marozas.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


assert 'const fgMk0=clMake;' in h, 'run add_fixgear.py first'
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('marozas ok')
