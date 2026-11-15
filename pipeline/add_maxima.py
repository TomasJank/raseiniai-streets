"""Maxima XX (building c2134) drawn from a Blender model instead of the code-built box and its hand-made front (maxima.js; model
pipeline/maxima/maxima.glb, made by research/assets/houses/maxima/make.sh). Runs after assets and facades; independent of house5a.
usage: add_maxima.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


assert 'const ASSETS=' in h, 'run after add_assets.py'
# the base page's store walls, signs, canopy and canopy posts are skipped when the model is in the page; its lot, cars and lamps stay
a = "      box(16,58,-.35,.1,yb,top,BRONZE);"
rep(a, "      if(!mxrOn()){" + a[6:])
a = "box(u-.1,u+.1,v-.1,v+.1,yb,y0+3.4,DARK);}\n"
rep(a, a[:-1] + "}\n")
rep('// ---------- boot ----------', open(os.path.join(d, 'maxima.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
glb = open(os.path.join(d, 'maxima', 'maxima.glb'), 'rb').read()
rep('</body>', '<script type="application/octet-stream" id="asset_maxima">%s</script>\n</body>' % base64.b64encode(glb).decode())
open(path, 'w', encoding='utf-8').write(h)
print('maxima ok: %d B model' % len(glb))
