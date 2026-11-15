"""kit: doors, windows per wall, porches, extensions, gable colour, plinth, chimneys, dormers and balconies for ordinary houses,
read from pipeline/kit/looks/{slug}.json (one file per street, keyed by building id; every id must have a look in
pipeline/streets/{slug}.json). Side names (front/back/left/right) are resolved to outline edges here; kit.js draws the parts.

usage: add_kit.py page.html                        (last step of the chain; edits in place)
       add_kit.py --check pipeline/kit/looks/jurbarko.json
       add_kit.py --sides c1298 [c1302 ...]        (each edge: index, length, compass side, metres to the road, side name)
"""
import argparse, glob, json, math, os, sys

OWN = os.path.dirname(os.path.abspath(__file__))  # kit 2 sheets: this copy is the kit before kit 2
HERE = os.path.abspath(os.path.join(OWN, '..', '..', '..', '..'))
sys.path.insert(0, HERE)
from street_ids import Town, COMPASS, nearest, PAGE  # noqa: E402

KEYS = {'front', 'win', 'winShape', 'frame', 'door', 'gable', 'gableSty', 'plinth', 'plinthH', 'ext', 'balc', 'chim', 'dorm'}
SIDED = ('door', 'ext', 'balc', 'dorm')
SIDES = ('front', 'back', 'left', 'right')
# Vilniaus g. buildings other agents are replacing with models
TAKEN = {'c2913', 'c2911', 'c2910', 'c2909', 'c2904', 'c2185', 'c1525', 'c2467', 'c2504'}


def edges(T, bid, segs):
    """[(length, outward normal, metres to the nearest named street, compass)] in OSM order"""
    p = [T.xz(*q) for q in T.ll[int(bid[1:])]][:-1]
    area = sum(p[k][0] * p[(k + 1) % len(p)][1] - p[(k + 1) % len(p)][0] * p[k][1] for k in range(len(p))) / 2
    out = []
    for k, u in enumerate(p):
        v = p[(k + 1) % len(p)]
        dx, dz = v[0] - u[0], v[1] - u[1]
        L = math.hypot(dx, dz) or 1
        n = (dz / L, -dx / L) if area > 0 else (-dz / L, dx / L)
        road = nearest((u[0] + v[0]) / 2, (u[1] + v[1]) / 2, segs)[0]
        out.append((L, n, road, COMPASS[round(math.degrees(math.atan2(n[0], -n[1])) / 45) % 8]))
    return out


def side_map(E, front=None):
    """side name -> edge index. front: nearest the road (walls of 2 m or more); left/right as seen from the street"""
    f = front if front is not None else min((k for k in range(len(E)) if E[k][0] >= 2), key=lambda k: E[k][2])
    nf = E[f][1]
    left = (-nf[1], nf[0])  # the viewer faces -nf; their left

    def pick(v):
        dots = [E[k][1][0] * v[0] + E[k][1][1] * v[1] for k in range(len(E))]
        return max(range(len(E)), key=lambda k: (dots[k] > .7, E[k][0] if dots[k] > .7 else dots[k]))
    return {'front': f, 'back': pick((-nf[0], -nf[1])), 'left': pick(left), 'right': pick((-left[0], -left[1]))}


STREETS_DIR = None  # --streets: street files to check ids against (the kit-2 fixture keeps its own)


def segs_of(T):
    return [s for i, t in enumerate(T.tags) if t.get('highway') and t.get('name') for s in T.segments([i])]


def resolve(T, segs, bid, K, err):
    """the look with side names turned into edge indices `e` (OSM order) and the front edge as `f`"""
    E = edges(T, bid, segs)
    n = len(E)
    for k in sorted(set(K) - KEYS):
        err('%s.%s: unknown key (allowed: %s)' % (bid, k, ', '.join(sorted(KEYS))))
    fr = K.get('front')
    if fr is not None and not (isinstance(fr, int) and not isinstance(fr, bool) and 0 <= fr < n):
        err('%s.front: want an edge index 0..%d (add_kit.py --sides %s)' % (bid, n - 1, bid))
        fr = None
    S = side_map(E, fr)

    def edge(where, v):
        if isinstance(v, str) and v in S:
            return S[v]
        if isinstance(v, str) and v.isdigit():
            v = int(v)
        if isinstance(v, int) and not isinstance(v, bool) and 0 <= v < n:
            return v
        err('%s.%s: side %r is not one of %s or an edge index 0..%d' % (bid, where, v, '/'.join(SIDES), n - 1))
    out = {k: v for k, v in K.items() if k in KEYS and k not in SIDED and k not in ('front', 'win')}
    out['f'] = S['front']
    if 'win' in K:
        if isinstance(K['win'], dict):
            out['win'] = [[e, rows] for e, rows in ((edge('win', s), r) for s, r in K['win'].items()) if e is not None]
        else:
            err('%s.win: want {"front": [2, 1], ...}' % bid)
    for k in SIDED:
        if k not in K:
            continue
        items = K[k] if isinstance(K[k], list) else [K[k]]
        lst = []
        for it in items:
            if not isinstance(it, dict):
                err('%s.%s: want an object with "side"' % (bid, k))
                continue
            e = edge(k, it.get('side', 'front'))
            if e is not None:
                lst.append(dict({q: v for q, v in it.items() if q != 'side'}, e=e))
        out[k] = lst
    return out


def load(T, paths, err):
    segs, kit = segs_of(T), {}
    for path in paths:
        slug = os.path.basename(path)[:-5]
        st = os.path.join(STREETS_DIR or os.path.join(HERE, 'streets'), slug + '.json')
        looks = json.load(open(st, encoding='utf-8')).get('looks', {}) if os.path.exists(st) else {}
        for bid, K in json.load(open(path, encoding='utf-8')).items():
            e = lambda m: err('%s: %s' % (os.path.basename(path), m))
            if bid not in looks:
                e('%s has no look in streets/%s.json; describe only buildings the street owns' % (bid, slug))
            elif bid in TAKEN:
                e('%s is being replaced by a model; leave it' % bid)
            elif T.tags[int(bid[1:])].get('parts'):
                e('%s is built from several parts (wings); kit keys need a single-outline building' % bid)
            elif not isinstance(K, dict):
                e('%s: want an object' % bid)
            else:
                kit[bid] = resolve(T, segs, bid, K, e)
    return kit


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('page', nargs='?')
    ap.add_argument('--check')
    ap.add_argument('--sides', nargs='+')
    ap.add_argument('--dir', default=os.path.join(HERE, 'kit', 'looks'))
    ap.add_argument('--streets')
    a = ap.parse_args()
    global STREETS_DIR
    STREETS_DIR = a.streets
    if a.sides:
        T = Town(a.page or PAGE)
        segs = segs_of(T)
        for bid in a.sides:
            E = edges(T, bid, segs)
            names = {v: k for k, v in reversed(list(side_map(E).items()))}
            print('%s: %d edges (edge i runs from outline vertex i to i+1, OSM order)' % (bid, len(E)))
            for k, (L, n, road, cp) in enumerate(E):
                print('  edge %d  %5.1f m  faces %-2s  road %3.0f m  %s' % (k, L, cp, min(road, 99), names.get(k, '')))
        return
    if a.check:
        E = []
        load(Town(), [a.check], E.append)
        if E:
            raise SystemExit('\n'.join(E) + '\n%d error(s)' % len(E))
        print('%s ok: %d houses' % (os.path.basename(a.check), len(json.load(open(a.check, encoding='utf-8')))))
        return
    if not a.page:
        ap.error('page.html, --check or --sides')
    h = open(a.page, encoding='utf-8').read()
    warn = []
    kit = load(Town(a.page), sorted(p for p in glob.glob(os.path.join(a.dir, '*.json')) if not os.path.basename(p).startswith('_')), warn.append)
    for w in warn:
        print('add_kit: skipped: ' + w)
    js = open(os.path.join(OWN, 'kit.js'), encoding='utf-8').read()
    data = json.dumps({k: kit[k] for k in sorted(kit, key=lambda b: int(b[1:]))}, sort_keys=True, separators=(',', ':'))
    anchor = '// ---------- boot ----------'
    assert h.count(anchor) == 1
    n0 = len(h)
    h = h.replace(anchor, 'const KIT=%s;\n%s%s' % (data, js, anchor))
    open(a.page, 'w', encoding='utf-8').write(h)
    print('kit ok: %d houses, %d B data, %d B added' % (len(kit), len(data), len(h) - n0))


if __name__ == '__main__':
    main()
