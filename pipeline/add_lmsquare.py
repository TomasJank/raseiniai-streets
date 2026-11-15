"""Žemaičio aikštė and its Žemaitis monument from a Blender model, and the slab plaza of Nepriklausomybės gynėjų aikštė (lmsquare.js;
model pipeline/lmsquare/zemaitis.glb, made by research/assets/houses/squares/make.sh). Runs after assets; independent of house5a and maxima.
usage: add_lmsquare.py page.html   (edits in place)
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
rep('// ---------- boot ----------', open(os.path.join(d, 'lmsquare.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
glb = open(os.path.join(d, 'lmsquare', 'zemaitis.glb'), 'rb').read()
rep('</body>', '<script type="application/octet-stream" id="asset_zemaitis">%s</script>\n</body>' % base64.b64encode(glb).decode())
open(path, 'w', encoding='utf-8').write(h)
print('lmsquare ok: %d B model' % len(glb))
