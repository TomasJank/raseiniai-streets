"""Two ordinary houses on Vilniaus g. (c2910, c2911) drawn from Blender models instead of the code-built boxes (lmvil1.js; models
pipeline/lmvil1/c2910.glb, c2911.glb, made by research/assets/houses/vil1/make.sh). Runs after assets; independent of house5a and maxima.
usage: add_lmvil1.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
assert 'const ASSETS=' in h, 'run after add_assets.py'
assert h.count('// ---------- boot ----------') == 1
h = h.replace('// ---------- boot ----------', open(os.path.join(d, 'lmvil1.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
tags, sizes = '', []
for id in ('c2910', 'c2911'):
    glb = open(os.path.join(d, 'lmvil1', id + '.glb'), 'rb').read()
    sizes.append(len(glb))
    tags += '<script type="application/octet-stream" id="asset_lmvil1_%s">%s</script>\n' % (id, base64.b64encode(glb).decode())
assert h.count('</body>') == 1
h = h.replace('</body>', tags + '</body>')
open(path, 'w', encoding='utf-8').write(h)
print('lmvil1 ok: %s B models' % sizes)
