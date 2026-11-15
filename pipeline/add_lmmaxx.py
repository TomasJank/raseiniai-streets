"""Maxima X (building c3293) drawn from a Blender model instead of the code-built box (lmmaxx.js; model pipeline/lmmaxx/lmmaxx.glb,
made by research/assets/houses/maximax/make.sh). Needs the assets step; independent of maxima.
usage: add_lmmaxx.py page.html   (edits in place)
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
rep('// ---------- boot ----------', open(os.path.join(d, 'lmmaxx.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
glb = open(os.path.join(d, 'lmmaxx', 'lmmaxx.glb'), 'rb').read()
rep('</body>', '<script type="application/octet-stream" id="asset_lmmaxx">%s</script>\n</body>' % base64.b64encode(glb).decode())
open(path, 'w', encoding='utf-8').write(h)
print('lmmaxx ok: %d B model' % len(glb))
