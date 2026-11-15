"""GRPK (national reference base cadastre) layers for the game extent, in game coordinates.

usage: python3 pipeline/geo/fetch_grpk.py      (writes grpk.json and grpk_buildings.json beside itself)
Source: geoportal.lt ArcGIS service NZT/GRPK, (c) Lietuvos Respublikos aplinkos ministerija, opened under CC BY 4.0.
Game coordinates: x east, z south, metres, same projection as buildWorld (equirectangular round LAT0/LON0).
"""
import json, math, os, time, urllib.parse, urllib.request

B = 'https://www.geoportal.lt/arcgis/rest/services/NZT/GRPK/MapServer'
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
ENV = '439400,6133700,449040,6143060'  # game ground plane, LKS-94 (same box as lidar.py)
LAT0, LON0 = 55.377401, 23.120024700000002  # world.lat0 / world.lon0 in the built page
KX, KZ = 111320 * math.cos(LAT0 * math.pi / 180), 110540
LAYERS = {'towers': 3, 'names': 0, 'shores': 18, 'water': 19, 'streams': 20, 'bog': 21, 'built': 23, 'rides': 25, 'land': 27, 'buildings': 22}
DROP = {'SHAPE', 'TOP_ID', 'META', 'RED_PRIEZASTIS', 'RED_SALTINIS', 'Suk_DATA', 'Red_DATA', 'SHAPE_Length', 'OBJECTID'}


def get(path, **q):
    q['f'] = 'json'
    url = f'{B}/{path}?{urllib.parse.urlencode(q)}'
    for i in range(5):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))
        except Exception:
            time.sleep(2 + 3 * i)
    raise SystemExit('failed ' + url)


def xz(p):
    return [round((p[0] - LON0) * KX, 1), round(-(p[1] - LAT0) * KZ, 1)]


def layer(lid):
    ids = get(f'{lid}/query', where='1=1', geometry=ENV, geometryType='esriGeometryEnvelope', inSR=3346,
              spatialRel='esriSpatialRelIntersects', returnIdsOnly='true').get('objectIds') or []
    out = []
    for i in range(0, len(ids), 200):
        r = get(f'{lid}/query', objectIds=','.join(map(str, ids[i:i + 200])), outFields='*', outSR=4326)
        for f in r['features']:
            a = {k: v for k, v in f['attributes'].items() if k not in DROP and v not in (None, '', ' ')}
            g = f.get('geometry') or {}
            if 'rings' in g:
                a['rings'] = [[xz(p) for p in ring[:-1]] for ring in g['rings']]  # first ring outer, rest holes or parts
            elif 'paths' in g:
                a['paths'] = [[xz(p) for p in path] for path in g['paths']]
            elif 'x' in g:
                a['x'], a['z'] = xz([g['x'], g['y']])
            out.append(a)
    return sorted(out, key=lambda a: json.dumps(a, sort_keys=True))


here = os.path.dirname(os.path.abspath(__file__))
d = {k: layer(v) for k, v in LAYERS.items()}
meta = {'source': B, 'credit': 'GRPK (c) Lietuvos Respublikos aplinkos ministerija, CC BY 4.0', 'fetched': time.strftime('%Y-%m-%d'),
        'lat0': LAT0, 'lon0': LON0, 'coords': 'game metres [x east, z south], 0.1 m', 'env_lks94': ENV}
bld = d.pop('buildings')
json.dump({'meta': meta, **d}, open(f'{here}/grpk.json', 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump({'meta': meta, 'buildings': bld}, open(f'{here}/grpk_buildings.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print({k: len(v) for k, v in d.items()}, 'buildings', len(bld))
