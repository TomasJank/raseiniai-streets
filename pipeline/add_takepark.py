"""takepark: the player can take a parked car (E next to it turns the parked instance into a real car).
usage: add_takepark.py page.html   (edits in place; after cars4 and fixpeds)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'takepark.js'), encoding='utf-8').read()
a = '// ---------- boot ----------'
assert h.count(a) == 1
open(path, 'w', encoding='utf-8').write(h.replace(a, js + a))
print('takepark ok')
