"""Two ordinary houses on Vilniaus g. (buildings c2467 and c1525) drawn from Blender models instead of the generated houses (lmvil3.js; models
pipeline/lmvil3/vil3{a,b}.glb, made by research/assets/houses/vil3/make.sh). Runs after assets (and after house5a and maxima in the trial chain).
usage: add_lmvil3.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
assert 'const ASSETS=' in h, 'run after add_assets.py'
assert h.count('// ---------- boot ----------') == 1
h = h.replace('// ---------- boot ----------', open(os.path.join(d, 'lmvil3.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
tot = 0
for k in 'ab':
    glb = open(os.path.join(d, 'lmvil3', 'vil3%s.glb' % k), 'rb').read(); tot += len(glb)
    assert h.count('</body>') == 1
    h = h.replace('</body>', '<script type="application/octet-stream" id="asset_lmvil3%s">%s</script>\n</body>' % (k, base64.b64encode(glb).decode()))
open(path, 'w', encoding='utf-8').write(h)
print('lmvil3 ok: %d B models' % tot)
