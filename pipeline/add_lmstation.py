"""Raseiniai bus station (c5290) and its platform canopy (c7167) drawn from a Blender model with platforms, posts, bays and forecourt
(lmstation.js; model pipeline/lmstation/stotis.glb, made by research/assets/houses/stotis/make.sh). Runs after assets, props2 and cars4.
usage: add_lmstation.py page.html   (edits in place)
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
# the generated yard boundary (a fence across the bays and round the canopy) skips the station's two buildings
rep("(b.kind!=='house'&&b.kind!=='shed')||nearJ(", "lmtPlot(b)||(b.kind!=='house'&&b.kind!=='shed')||nearJ(")
rep('// ---------- boot ----------', open(os.path.join(d, 'lmstation.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
glb = open(os.path.join(d, 'lmstation', 'stotis.glb'), 'rb').read()
rep('</body>', '<script type="application/octet-stream" id="asset_lmstation">%s</script>\n</body>' % base64.b64encode(glb).decode())
open(path, 'w', encoding='utf-8').write(h)
print('lmstation ok: %d B model' % len(glb))
