"""Vyšnių g. 5A (building c1583) drawn from a Blender model instead of the code-built house (house5a.js; model pipeline/house5a/house5a.glb,
made by research/assets/houses/vysniu5a/make.sh). Runs after assets and props2.
usage: add_house5a.py page.html   (edits in place)
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
# the plot's own fence, gate and drive replace the generated yard boundary, its gap and the driveway through it
rep("if(!b||(b.kind!=='house'&&b.kind!=='shed')||nearJ(", "if(!b||h5aPlot(b)||(b.kind!=='house'&&b.kind!=='shed')||nearJ(")
rep('// ---------- boot ----------', open(os.path.join(d, 'house5a.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
glb = open(os.path.join(d, 'house5a', 'house5a.glb'), 'rb').read()
rep('</body>', '<script type="application/octet-stream" id="asset_house5a">%s</script>\n</body>' % base64.b64encode(glb).decode())
open(path, 'w', encoding='utf-8').write(h)
print('house5a ok: %d B model' % len(glb))
