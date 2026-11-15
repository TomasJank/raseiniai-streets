"""The police station (c2158) drawn from a Blender model (lmpublic.js; model pipeline/lmpublic/policija.glb, made by
research/assets/houses/policija/make.sh). The health centre (c170) is not modelled. Runs after assets, facades and streets.
usage: add_lmpublic.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
assert 'const ASSETS=' in h and 'const STREETS=' in h, 'run after add_assets.py and add_streets.py'
assert 'const LPU=' not in h, 'lmpublic already in the page'
assert h.count('// ---------- boot ----------') == 1
h = h.replace('// ---------- boot ----------', open(os.path.join(d, 'lmpublic.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
glb = open(os.path.join(d, 'lmpublic', 'policija.glb'), 'rb').read()
assert h.count('</body>') == 1
h = h.replace('</body>', '<script type="application/octet-stream" id="asset_policija">%s</script>\n</body>' % base64.b64encode(glb).decode())
open(path, 'w', encoding='utf-8').write(h)
print('lmpublic ok: %d B of model' % len(glb))
