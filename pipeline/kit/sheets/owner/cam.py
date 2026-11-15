"""game camera of Mapillary frames: cam.py id ... -> {frame, x, z, head, compass} per frame (head from the neighbouring frame of its sequence)"""
import json, math, os, sys, urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
from street_ids import Town  # noqa: E402
TOK = open(os.path.expanduser('~/.mapillary_token')).read().strip()
T = Town()


def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'Authorization': 'OAuth ' + TOK}), timeout=60))


def pos(r):
    g = (r.get('computed_geometry') or r['geometry'])['coordinates']
    return T.xz(g[1], g[0])


out = []
for fid in sys.argv[1:]:
    r = get('https://graph.mapillary.com/%s?fields=id,captured_at,computed_geometry,geometry,compass_angle,computed_compass_angle,sequence' % fid)
    x, z = pos(r)
    la, lo = T.latlon(x, z)
    nb = get('https://graph.mapillary.com/images?fields=id,captured_at,computed_geometry,geometry&bbox=%.6f,%.6f,%.6f,%.6f&limit=500' % (lo - .0006, la - .0004, lo + .0006, la + .0004))
    same = sorted((q for q in nb.get('data', []) if q['id'] != fid and abs(q['captured_at'] - r['captured_at']) < 5000), key=lambda q: abs(q['captured_at'] - r['captured_at']))
    head = None
    for q in same:
        qx, qz = pos(q)
        if math.hypot(qx - x, qz - z) > 1.5:
            dx, dz = qx - x, qz - z
            if q['captured_at'] < r['captured_at']:
                dx, dz = -dx, -dz
            head = math.degrees(math.atan2(dx, -dz)) % 360
            break
    out.append(dict(frame=fid, x=round(x, 2), z=round(z, 2), head=None if head is None else round(head, 1), compass=round(r.get('computed_compass_angle') or r.get('compass_angle') or 0, 1)))
print(json.dumps(out, indent=0))
