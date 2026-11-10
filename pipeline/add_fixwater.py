"""Water fixes: no mirror render during GTAO's override-material pass (purple reflections); every water body shares Water.js's look.
usage: add_fixwater.py page.html   (edits in place; run after add_fixtalk.py, the last step)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_water.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("const gfxSunEl=()=>", js + "const gfxSunEl=()=>")
rep("  gfxFix(S);const c=S.comp;", "  fixWater();gfxFix(S);const c=S.comp;")
open(path, 'w', encoding='utf-8').write(h)
print('fixwater ok')
