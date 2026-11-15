"""Road surface from the 2024 orthophoto (ORT10LT): samples each OSM road way of the page's rasData along its centreline,
classifies it as asphalt, gravel or dirt, and writes pipeline/geo/roads2_surface.json: {way index: [surface, confidence, decisive stations, highway]}
as "set" for ways without an OSM surface tag (the surface to write: asphalt, gravel, or unpaved for a track the photo cannot read), "overrides" for
explicit tags the photo flatly contradicts (same shape plus the old tag and the median blue minus red), and counts of the rest.
usage: python3 pipeline/geo/roads2_classify.py [page.html]   (default: build the page's rasData from work/build/v37.html)
PIL only, deterministic. Orthophoto tiles are gitignored (research/geodata/ortho/tiles).
"""
import json, math, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
sys.path.insert(0, HERE)
import lks94

TILES = os.path.join(ROOT, 'research', 'geodata', 'ortho', 'tiles')
RES = json.load(open(os.path.join(TILES, '..', 'meta.json')))['res']
HW = {'trunk': 10, 'primary': 8, 'secondary': 7.5, 'tertiary': 7, 'unclassified': 5.5, 'residential': 5.5, 'living_street': 4.5,
      'road': 5.5, 'service': 3.5, 'track': 3, 'pedestrian': 5, 'footway': 2.2, 'cycleway': 2.2, 'steps': 2, 'path': 1.8, 'bridleway': 1.8}
_cache = {}


def tile(r, c):
    k = (r, c)
    if k not in _cache:
        try:
            im = Image.open(os.path.join(TILES, '%d_%d.jpg' % k)).convert('RGB')
            _cache[k] = (im.load(), im.size[0])
        except OSError:
            _cache[k] = None
    return _cache[k]


def px(X, Y):
    gx, gy = (X - lks94.OX) / RES, (lks94.OY - Y) / RES
    t = tile(int(gy // 256), int(gx // 256))
    if not t:
        return None
    return t[0][int(gx % 256), int(gy % 256)]


def patch(X, Y, n=2):
    """mean colour of a (2n+1)^2 pixel patch, None if a pixel is missing"""
    s = [0, 0, 0]
    for i in range(-n, n + 1):
        for j in range(-n, n + 1):
            p = px(X + i * RES, Y + j * RES)
            if p is None:
                return None
            s[0] += p[0]; s[1] += p[1]; s[2] += p[2]
    k = (2 * n + 1) ** 2
    return [v / k for v in s]


def ok(c):
    """not shade (it reads bluish like asphalt), glare, vegetation, a red roof or a car"""
    r, g, b = c
    return 120 < (r + g + b) / 3 < 235 and g - max(r, b) < 3 and r - b < 60 and r - g < 28


def load_ways(page):
    h = open(page, encoding='utf8').read()
    i = h.index('id="rasData">') + 13
    return json.loads(h[i:h.index('</script>', i)])


def stations(d, w):
    """one colour per 2.5 m of centreline: median of up to three lateral patches inside the carriageway, None where all are shade, canopy or glare"""
    hw = HW.get(d['t'][w[0]]['highway'].replace('_link', ''), 3)
    pts = [lks94.fwd(d['lat0'] + d['n'][2 * k] / 1e6, d['lon0'] + d['n'][2 * k + 1] / 1e6) for k in w[1:]]
    out = []
    for a, b in zip(pts, pts[1:]):
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L < .1:
            continue
        ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        for s in [i * 2.5 + 1.25 for i in range(int(L / 2.5))] or [L / 2]:
            got = []
            for off in (-hw * .22, 0, hw * .22):
                c = patch(a[0] + ux * s - uy * off, a[1] + uy * s + ux * off)
                if c and ok(c):
                    got.append(c)
            out.append([sorted(c[i] for c in got)[len(got) // 2] for i in range(3)] if len(got) >= 2 else None)
    return out


def kind(c):
    """blue minus red separates grey asphalt (+) from beige gravel and dirt (-); in between is not told apart"""
    r, g, b = c
    if b - r >= 4:
        return 'asphalt'
    if b - r <= -4 and g <= r + 1:
        return 'gravel'
    return None


def classify(d, w):
    """(surface, confidence, decisive stations, median blue minus red); surface None when unreadable, mostly undecided or split. Confidence is the winning
    share of decisive stations, scaled down when more than half the readable ones were undecided"""
    st = [c for c in stations(d, w) if c]
    dec = [(kind(c), c[2] - c[0]) for c in st if kind(c)]
    if len(dec) < 4:
        return None, 0, len(dec), 0
    asph = sum(k == 'asphalt' for k, _ in dec) / len(dec)
    br = sorted(b for _, b in dec)[len(dec) // 2]
    conf = max(asph, 1 - asph) * min(1, 2 * len(dec) / len(st))
    if conf < .7:
        return None, round(conf, 2), len(dec), br
    return 'asphalt' if asph >= .5 else 'gravel', round(conf, 2), len(dec), br


UNPAVED = {'gravel', 'unpaved', 'dirt', 'ground', 'compacted', 'fine_gravel', 'sand', 'earth', 'grass', 'pebblestone'}
MIN_CONF = .7


def run(d):
    res = {'set': {}, 'overrides': {}, 'kept': 0, 'left': {}}
    for i, w in enumerate(d['w']):
        t = d['t'][w[0]]
        hw = t.get('highway')
        if not hw or t.get('area') == 'yes' or hw.replace('_link', '') not in HW:
            continue
        surf, conf, n, br = classify(d, w)
        tag = t.get('surface')
        if tag in UNPAVED | {'asphalt'}:
            res['kept'] += 1
            if surf and conf >= .85 and (surf == 'asphalt') != (tag == 'asphalt') and abs(br) >= 12:  # flat contradiction only; pale old asphalt and gravel overlap
                res['overrides'][i] = [surf, conf, n, hw, tag, round(br)]
        elif tag:
            res['kept'] += 1  # paved, paving_stones, concrete: not told apart from asphalt by colour
        elif surf and conf >= MIN_CONF:
            res['set'][i] = [surf, conf, n, hw]
        elif hw == 'track':
            res['set'][i] = ['unpaved', 0, n, hw]
        else:
            res['left'][i] = 'unreadable' if not conf else 'mixed or ambiguous'
    return res


if __name__ == '__main__':
    d = load_ways(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'work', 'build', 'v37.html'))
    res = run(d)
    json.dump(res, open(os.environ.get('OUT', os.path.join(HERE, 'roads2_surface.json')), 'w'), sort_keys=True)
    from collections import Counter
    print(Counter(v[0] for v in res['set'].values()), res['kept'], len(res['overrides']), Counter(res['left'].values()))
