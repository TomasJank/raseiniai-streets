# Restores the embedded GLB build inputs from a shipped build, so a fresh clone can run build.sh
# without the raw Quaternius files (not redistributed, QAL v1.0). Usage: python3 pipeline/extract_assets.py work/build/v41.html
import base64, os, re, sys, zlib
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.join(here, '..')
h = open(sys.argv[1], encoding='utf-8').read()
cd = os.path.join(root, 'research/assets/characters'); ad = os.path.join(root, 'research/assets/animals/built'); vd = os.path.join(root, 'research/assets/vehicles/fleet/built')
for d in (cd, ad, vd): os.makedirs(d, exist_ok=True)
n = 0
for m in re.finditer(r'<script type="application/octet-stream" id="asset_car2_(\w+)">([A-Za-z0-9+/=]+)</script>', h):
    open(os.path.join(vd, 'car2_' + m.group(1) + '.glb'), 'wb').write(base64.b64decode(m.group(2))); n += 1
for m in re.finditer(r'<script type="application/octet-stream" id="asset_char_(\w+)">([A-Za-z0-9+/=]+)</script>', h):
    open(os.path.join(cd, m.group(1) + '.glb'), 'wb').write(base64.b64decode(m.group(2))); n += 1
for m in re.finditer(r'<script type="application/octet-stream" id="agz_(\w+)">([A-Za-z0-9+/=]+)</script>', h):
    raw = zlib.decompress(base64.b64decode(m.group(2)))
    out = os.path.join(cd, 'clips_kick.glb') if m.group(1) == 'kick_clips' else os.path.join(ad, 'animal_' + m.group(1) + '.glb')
    open(out, 'wb').write(raw); n += 1
print('restored', n, 'GLBs')
