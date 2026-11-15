"""Two blocks on Vilniaus g. (buildings c2909 and c2904) drawn from Blender models instead of the code-built boxes (lmvil2.js; models
pipeline/lmvil2/*.glb, made by research/assets/houses/vil2/make.sh). Runs after assets; independent of house5a and maxima.
usage: add_lmvil2.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
assert 'const ASSETS=' in h, 'run after add_assets.py'
assert h.count('// ---------- boot ----------') == 1
h = h.replace('// ---------- boot ----------', open(os.path.join(d, 'lmvil2.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
sizes = []
for i in ('c2909', 'c2904'):
    glb = open(os.path.join(d, 'lmvil2', i + '.glb'), 'rb').read()
    sizes.append(len(glb))
    assert h.count('</body>') == 1
    h = h.replace('</body>', '<script type="application/octet-stream" id="asset_lmvil2_%s">%s</script>\n</body>' % (i, base64.b64encode(glb).decode()))
open(path, 'w', encoding='utf-8').write(h)
print('lmvil2 ok: %s B models' % sizes)
