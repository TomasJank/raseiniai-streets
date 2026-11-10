"""Graphics fixes: AO normal pass no longer draws sprites (black smoke squares); the midday sun is capped at GFX_SUN_MAX degrees (walls went dark at 70 degrees).
usage: add_fixgfx.py page.html   (edits in place; run after add_cars2.py, the last step)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_gfx.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("const gfxSunEl=()=>", js + "const gfxSunEl=()=>")
rep("  const c=S.comp;\n  if(c&&(GFX.ao||GFX.tone)){", "  gfxFix(S);const c=S.comp;\n  if(c&&(GFX.ao||GFX.tone)){")
rep("const e=Math.max(el,12)*Math.PI/180,az=", "const e=Math.min(Math.max(el,12),GFX_SUN_MAX)*Math.PI/180,az=")
open(path, 'w', encoding='utf-8').write(h)
print('fixgfx ok')
