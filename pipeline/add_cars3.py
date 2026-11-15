"""European fleet rebuilt from reference profiles (cars3.js + pipeline/cars3/*.js), behind the cars2 seam.

Drops the cars2 GLB blocks (the fleet they held is no longer drawn) and inserts the models and builder before the boot.
usage: add_cars3.py page.html   (edits in place; after fixgear in build.sh)
"""
import glob, os, re, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
models = ''.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(d, 'cars3', '*.js'))))
js = 'const CARS3_MODELS={};\n' + models + open(os.path.join(d, 'cars3.js'), encoding='utf-8').read()


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


assert 'const CARS2=(()=>{' in h, 'run add_cars2.py first'
h, n = re.subn(r'<script type="application/octet-stream" id="asset_car2_[a-z0-9]+">[^<]*</script>\n?', '', h)
assert n == 10, n
rep("// ---------- boot ----------", js + "\n// ---------- boot ----------")
open(path, 'w', encoding='utf-8').write(h)
print('cars3 ok: %d models, %d B' % (models.count('CARS3_MODELS.'), len(js)))
