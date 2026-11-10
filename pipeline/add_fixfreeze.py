"""Freeze fix (fix_freeze.js): the headlamp SpotLights are shared across cars instead of accumulating per steal.

usage: add_fixfreeze.py page.html   (edits in place; last step of build.sh)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_freeze.js'), encoding='utf-8').read()


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


rep("// ---------- boot ----------", js + "\n// ---------- boot ----------")

open(path, 'w', encoding='utf-8').write(h)
print('fixfreeze ok')
