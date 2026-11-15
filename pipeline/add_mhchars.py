"""Embeds the MakeHuman townsfolk GLBs (mh_00.glb.. with .json metadata) and mhchars.js into a built page.

usage: add_mhchars.py page.html [glb_dir]   (default research/mh/glb, made by research/mh/scripts/sheet.py)
"""
import base64, glob, json, os, sys

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
glbs = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, '..', 'research', 'mh', 'glb')
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'mhchars.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


# the townsfolk, then the player's own body (research/mh/glb_player), which no pedestrian wears
player = sorted(glob.glob(os.path.join(glbs + '_player', '*.glb')))
files = sorted(glob.glob(os.path.join(glbs, '*.glb'))) + player
meta, blocks = [], []
for k, f in enumerate(files):
    meta.append({**json.load(open(f[:-4] + '.json')), 'player': f in player})
    blocks.append('<script type="application/octet-stream" id="asset_mh_%02d">%s</script>\n' % (k, base64.b64encode(open(f, 'rb').read()).decode()))
# the fields mhchars.js reads; the appearance ones are optional (it measures the model itself when they are missing)
KEYS = ('sex', 'age', 'desc', 'height', 'player', 'hair', 'pal', 'skirt', 'bare_legs', 'long_hair', 'hat', 'tint')
assert js.count('/*MH_META*/[]') == 1
js = js.replace('/*MH_META*/[]', json.dumps([{k: m[k] for k in KEYS if k in m} for m in meta], separators=(',', ':')))
# the phone people hold: the Sketchfab model of research/assets/sketchfab/phone_download.json once downloaded, else mhchars.js draws a box
PHONE = os.path.join(here, '..', 'research', 'assets', 'sketchfab', 'glb', '3100.glb')
if os.path.exists(PHONE):
    blocks.append('<script type="application/octet-stream" id="asset_mh_phone">%s</script>\n' % base64.b64encode(open(PHONE, 'rb').read()).decode())
rep('</body>', ''.join(blocks) + '</body>')
rep('\n// ---------- boot ----------', '\n' + js + '\n// ---------- boot ----------')
# authors of the CC BY clothes and hair the crowd wears: from the models' own credits, or the list for the crowd of 2026-11-11
by = sorted({c['author'] for m in meta for c in m.get('credits', []) if 'BY' in c.get('license', '')}, key=str.lower)
a = ' (modified)</div>'  # the end of the cars4 credit
phone = ' · Phone: "Free Low Poly Smartphone" by warcool (CC BY 4.0)' if os.path.exists(PHONE) else ''
rep(a, a[:-6] + ' · Townsfolk made with MakeHuman (MPFB); clothes and hair CC BY: %s%s</div>' % (', '.join(by or ['Elvaerwyn', 'Mindfront', 'punkduck', 'culturalibre']), phone))
open(path, 'w', encoding='utf-8').write(h)
print('mhchars ok: %d people, %d KB' % (len(files), sum(os.path.getsize(f) for f in files) // 1024))
