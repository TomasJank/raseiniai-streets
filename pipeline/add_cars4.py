"""Textured Sketchfab cars behind the car seam (cars4.js; data in pipeline/cars4/, made by
research/assets/vehicles/cars4/convert.mjs). Runs after cars3 and fixgear.
mix.json: mix = traffic share per model (parked cars use the same shares), bus = the model the route bus wears,
static = vehicles that only stand ({key: [[lat, lon, heading in degrees], ...]}), credit = the credit line.
usage: add_cars4.py page.html   (edits in place)
"""
import base64, json, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
fleet = json.load(open(os.path.join(d, 'cars4', 'fleet.json')))
cfg = json.load(open(os.path.join(d, 'cars4', 'mix.json')))
# a model listed here keeps its own texture colour (its paint mask is not good enough to recolour)
for k in cfg.get('own_colour', []):
    fleet[k]['mask'] = False


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


assert 'const CARS3=(()=>{' in h, 'run add_cars3.py first'
bus, static = cfg.get('bus'), cfg.get('static', {})
keys = list(cfg['mix']) + ([bus] if bus else []) + list(static)
assert all(k in fleet for k in keys), [k for k in keys if k not in fleet]
# every model in the page is credited
for k in keys:
    assert fleet[k]['author'] in cfg['credit'], 'credit line lacks ' + fleet[k]['author'] + ' (' + k + ')'
blocks = ''
for k in keys:
    for tag, f in (('asset_cars4_' + k, k + '.bin'), ('asset_cars4_' + k + '_tex', k + '.jpg'),
                   ('asset_cars4_' + k + '_mask', k + '_mask.png' if fleet[k].get('mask') else None),
                   ('agz_cars4_' + k, k + '_hi.bin' if fleet[k].get('lod') else None)):
        if f:
            b = base64.b64encode(open(os.path.join(d, 'cars4', f), 'rb').read()).decode()
            blocks += '<script type="application/octet-stream" id="%s">%s</script>\n' % (tag, b)
dump = lambda o: json.dumps(o, separators=(',', ':'))
drop = ('name', 'src', 'images', 'swatches', 'parts', 'cut', 'seen', 'uvOut', 'author', 'credit', 'page', 'pageBytes', 'tris', 'wheelTris')
js = ('const CARS4_FLEET=%s;\nconst CARS4_MIX=%s,CARS4_BUS=%s,CARS4_STATIC=%s;\n' % (
    dump({k: {a: v for a, v in fleet[k].items() if a not in drop} for k in keys}), dump(cfg['mix']), dump(bus), dump(static))
      + open(os.path.join(d, 'cars4.js'), encoding='utf-8').read())
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
rep('</body>', blocks + '</body>')
a = 'GRPK © Lietuvos Respublikos aplinkos ministerija (CC BY 4.0)</div>'
rep(a, a[:-6] + ' · ' + cfg['credit'] + '</div>')
open(path, 'w', encoding='utf-8').write(h)
print('cars4 ok: %d models, %d B data, %d B js' % (len(keys), len(blocks), len(js)))
