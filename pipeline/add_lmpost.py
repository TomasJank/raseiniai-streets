"""The post office building, Maironio g. 8 (c2683), drawn from a Blender model (lmpost.js; model pipeline/lmpost/pastas.glb, made by
research/assets/houses/pastas/make.sh). Runs after assets, facades and props2. Swedbank (c2940) is not built: no photo of it.
usage: add_lmpost.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
assert 'const ASSETS=' in h, 'run after add_assets.py'
assert 'const P2_SITES=' in h, 'run after add_props2.py'
assert h.count('// ---------- boot ----------') == 1
h = h.replace('// ---------- boot ----------', open(os.path.join(d, 'lmpost.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
glb = open(os.path.join(d, 'lmpost', 'pastas.glb'), 'rb').read()
assert h.count('</body>') == 1
h = h.replace('</body>', '<script type="application/octet-stream" id="asset_pastas">%s</script>\n</body>' % base64.b64encode(glb).decode())
open(path, 'w', encoding='utf-8').write(h)
print('lmpost ok: %d B of model' % len(glb))
