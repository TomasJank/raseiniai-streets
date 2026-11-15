"""The municipality (c2159) and the culture centre (c171) drawn from Blender models (lmcivic.js; models pipeline/lmcivic/*.glb,
made by research/assets/houses/savivaldybe/make.sh and research/assets/houses/kultura/make.sh). Runs after assets and facades.
usage: add_lmcivic.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
assert 'const ASSETS=' in h, 'run after add_assets.py'
assert h.count('// ---------- boot ----------') == 1
h = h.replace('// ---------- boot ----------', open(os.path.join(d, 'lmcivic.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
tags, n = '', 0
for name in ('savivaldybe', 'kultura'):
    f = os.path.join(d, 'lmcivic', name + '.glb')
    if not os.path.exists(f): continue
    glb = open(f, 'rb').read(); n += len(glb)
    tags += '<script type="application/octet-stream" id="asset_%s">%s</script>\n' % (name, base64.b64encode(glb).decode())
assert h.count('</body>') == 1
h = h.replace('</body>', tags + '</body>')
open(path, 'w', encoding='utf-8').write(h)
print('lmcivic ok: %d B of models' % n)
