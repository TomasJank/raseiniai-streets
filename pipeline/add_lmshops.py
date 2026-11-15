"""The Lidl (c8100) and the IKI (c2181) on Vilniaus g. drawn from Blender models (lmshops.js; models pipeline/lmshops/lidl.glb and
iki.glb, made by research/assets/houses/lidl/make.sh and iki/make.sh). Runs after assets and facades.
usage: add_lmshops.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


assert 'const ASSETS=' in h and 'function buildFacadeDetails' in h, 'run after add_assets.py and the facades step'
rep('// ---------- boot ----------', open(os.path.join(d, 'lmshops.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
sizes = []
for name, f in (('lshlidl', 'lidl.glb'), ('lshiki', 'iki.glb')):
    glb = open(os.path.join(d, 'lmshops', f), 'rb').read(); sizes.append(len(glb))
    rep('</body>', '<script type="application/octet-stream" id="asset_%s">%s</script>\n</body>' % (name, base64.b64encode(glb).decode()))
open(path, 'w', encoding='utf-8').write(h)
print('lmshops ok: %d + %d B models' % tuple(sizes))
