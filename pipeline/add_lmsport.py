"""The sports centre (Raseinių kūno kultūros ir sporto centras, c19), drawn from a Blender model (lmsport.js; model
pipeline/lmsport/sportas.glb, made by research/assets/houses/sportas/make.sh). Runs after assets and facades.
usage: add_lmsport.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
assert 'const ASSETS=' in h, 'run after add_assets.py'
assert 'function buildFacadeDetails(' in h, 'run after add_facades.py'
assert h.count('// ---------- boot ----------') == 1
h = h.replace('// ---------- boot ----------', open(os.path.join(d, 'lmsport.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
glb = open(os.path.join(d, 'lmsport', 'sportas.glb'), 'rb').read()
assert h.count('</body>') == 1
h = h.replace('</body>', '<script type="application/octet-stream" id="asset_sportas">%s</script>\n</body>' % base64.b64encode(glb).decode())
open(path, 'w', encoding='utf-8').write(h)
print('lmsport ok: %d B of model' % len(glb))
