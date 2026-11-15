"""Mapillary frames round houses: mly.py outdir c2514 c2515 ...  -> outdir/cand_<id>.json, outdir/th/<frame>.jpg, outdir/cands_<id>.jpg
(frames 8-30 m from the house whose heading, from the next frame of the sequence, is 20-75 degrees off it; MLY=dmin,dmax,amin,amax)"""
import json, math, os, sys, urllib.request, collections
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
from street_ids import Town  # noqa: E402
out, ids = sys.argv[1], sys.argv[2:]
DMIN, DMAX, AMIN, AMAX = map(float, os.environ.get('MLY', '8,30,20,75').split(','))
os.makedirs(out + '/th', exist_ok=True)
TOK = open(os.path.expanduser('~/.mapillary_token')).read().strip()
T = Town()
F = 'id,captured_at,computed_geometry,geometry,compass_angle,sequence,thumb_1024_url'


def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'Authorization': 'OAuth ' + TOK}), timeout=60))


for bid in ids:
    p = [T.xz(*q) for q in T.ll[int(bid[1:])]][:-1]
    cx, cz = sum(q[0] for q in p) / len(p), sum(q[1] for q in p) / len(p)
    la, lo = T.latlon(cx, cz)
    rows = {}
    for dx in (-1, 1):
        for dy in (-1, 1):
            b = [lo + min(0, dx) * .0008, la + min(0, dy) * .00045, lo + max(0, dx) * .0008, la + max(0, dy) * .00045]
            d = get('https://graph.mapillary.com/images?fields=%s&bbox=%s&limit=2000' % (F, ','.join('%.6f' % v for v in b)))
            for r in d.get('data', []):
                rows[r['id']] = r
    seqs = collections.defaultdict(list)
    for r in rows.values():
        g = (r.get('computed_geometry') or r['geometry'])['coordinates']
        r['x'], r['z'] = T.xz(g[1], g[0])
        seqs[r['sequence']].append(r)
    cand = []
    for l in seqs.values():
        l.sort(key=lambda r: r['captured_at'])
        for i, r in enumerate(l):
            j = i + 1 if i + 1 < len(l) else i - 1
            if j < 0 or j == i or abs(l[j]['captured_at'] - r['captured_at']) > 4000:
                continue
            dx, dz = l[j]['x'] - r['x'], l[j]['z'] - r['z']
            if math.hypot(dx, dz) < 1.5:
                continue
            if j < i:
                dx, dz = -dx, -dz
            r['head'] = math.degrees(math.atan2(dx, -dz)) % 360
            dist = math.hypot(cx - r['x'], cz - r['z'])
            br = math.degrees(math.atan2(cx - r['x'], -(cz - r['z']))) % 360
            da = (br - r['head'] + 180) % 360 - 180
            if DMIN < dist < DMAX and AMIN <= abs(da) < AMAX and r.get('thumb_1024_url'):
                cand.append(dict(id=r['id'], t=r['captured_at'], x=r['x'], z=r['z'], head=r['head'], dist=dist, da=da, url=r['thumb_1024_url']))
    cand.sort(key=lambda c: c['dist'])
    cand = cand[:40]
    for c in cand:
        f = '%s/th/%s.jpg' % (out, c['id'])
        if not os.path.exists(f):
            open(f, 'wb').write(urllib.request.urlopen(c.pop('url'), timeout=60).read())
        else:
            c.pop('url')
    json.dump(cand, open('%s/cand_%s.json' % (out, bid), 'w'), indent=0)
    W = 256
    s = Image.new('RGB', (W * 8, (len(cand) + 7) // 8 * (W * 3 // 4 + 14) or 1), 'black'); d = ImageDraw.Draw(s)
    for k, c in enumerate(cand):
        im = Image.open('%s/th/%s.jpg' % (out, c['id'])).convert('RGB')
        x0, y0 = (k % 8) * W, (k // 8) * (W * 3 // 4 + 14)
        s.paste(im.resize((W, W * im.height // im.width)).crop((0, 0, W, W * 3 // 4)), (x0, y0 + 14))
        d.text((x0 + 2, y0), '%d %s %.0fm %+.0f' % (k, c['id'][-6:], c['dist'], c['da']), fill='yellow')
    s.save('%s/cands_%s.jpg' % (out, bid), quality=80)
    print(bid, len(rows), 'frames,', len(cand), 'candidates')
