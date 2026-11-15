"""Pedestrians never stand inside a building: pedTarget falls back toward the road when its pavement spot is walled in.
usage: add_fixpeds.py page.html   (edits in place; run after the whole chain, it wraps pedTarget last)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_peds.js'), encoding='utf-8').read()
a = "function buildExtra(){"
assert h.count(a) == 1, h.count(a)
open(path, 'w', encoding='utf-8').write(h.replace(a, js + a))
print('fixpeds ok')
