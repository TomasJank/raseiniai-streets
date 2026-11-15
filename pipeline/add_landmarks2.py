"""Landmarks: the Ėmimo į Dangų church rebuilt from photos, the Dominican monastery as plastered masonry, GRPK tower structures.
usage: add_landmarks2.py page.html   (edits in place; runs after ground and water3, the last step)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'landmarks2.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("function buildExtra(){", js + "function buildExtra(){")
rep("buildLandmarks();buildStreets();", "buildLandmarks();buildStreets();landmarks2();")
open(path, 'w', encoding='utf-8').write(h)
print('landmarks2 ok')
