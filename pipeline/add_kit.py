"""kit: doors, windows per wall, porches, extensions, gable colour, plinth, chimneys, dormers, balconies, cross gables, wing roofs,
shutters, wall and roof materials and tree-free plot fronts for ordinary houses, and (kit 3) window size, half-hipped roofs,
wall dormers, wings cut short, recessed doorways, part of a wall in another material, windows and a door on an extension,
read from pipeline/kit/looks/{slug}.json (one file per street, keyed by building id; every id must have a look in
pipeline/streets/{slug}.json). Side names (front/back/left/right) are resolved to outline edges here; kit.js draws the parts.

usage: add_kit.py page.html                        (last step of the chain; edits in place)
       add_kit.py --check pipeline/kit/looks/jurbarko.json
       add_kit.py --sides c1298 [c1302 ...]        (each edge: index, length, compass side, metres to the road, side name;
                                                    and the rectangles (wings) the game splits the outline into)
"""
import argparse, glob, json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from street_ids import Town, COMPASS, nearest, PAGE  # noqa: E402
from add_streets import ridge_dir  # noqa: E402

KEYS = {'front', 'win', 'winShape', 'frame', 'door', 'gable', 'gableSty', 'plinth', 'plinthH', 'ext', 'balc', 'chim', 'dorm',
        'xg', 'wings', 'noTree', 'noFence', 'roof2', 'walls', 'shut', 'winSize', 'halfHip'}
SIDED = ('door', 'ext', 'balc', 'dorm', 'xg')
SHAPES = ('normal', 'wide', 'narrow')
SIZES = ('small', 'normal', 'large')


def size_ok(v):
    return v in SIZES if isinstance(v, str) else num_ok(v, .4, 3)
TEX = ('brick', 'silicate', 'plaster', 'roughcast', 'planks', 'boards', 'concrete', 'corrugated', 'asbestos', 'tiles', 'profile', 'bitumen')
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


def parts_of(page):
    """building index -> the rectangles the game draws instead of its outline: [(corners in game x/z, LiDAR roof code)]"""
    h = open(page, encoding='utf-8').read()
    a = h.index('id="rasData">') + len('id="rasData">')
    d = json.loads(h[a:h.index('</script>', a)])
    return d.get('lp', {}), d['lat0'], d['lon0']


def col_ok(v):
    return isinstance(v, list) and len(v) == 3 and all(isinstance(x, (int, float)) and not isinstance(x, bool) and 0 <= x <= 1 for x in v)


def num_ok(v, a, b):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and a <= v <= b


STREETS_DIR = None  # --streets: street files to check ids against (the kit-2 fixture keeps its own)


def segs_of(T):
    return [s for i, t in enumerate(T.tags) if t.get('highway') and t.get('name') for s in T.segments([i])]


def resolve(T, segs, bid, K, err, street=None, nparts=1):
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
    out = {k: v for k, v in K.items() if k in KEYS and k not in SIDED and k not in ('front', 'win', 'winShape', 'winSize', 'walls', 'noTree', 'noFence', 'wings')}
    out['f'] = S['front']
    ws = K.get('winShape')
    if isinstance(ws, dict):
        out['winShape'] = [[e, v] for e, v in ((edge('winShape', q), v) for q, v in ws.items()) if e is not None]
        for v in ws.values():
            if v not in SHAPES:
                err('%s.winShape: %r is not one of %s' % (bid, v, ' '.join(SHAPES)))
    elif ws is not None:
        out['winShape'] = ws
    ws = K.get('winSize')
    if isinstance(ws, dict):
        out['winSize'] = [[e, v] for e, v in ((edge('winSize', q), v) for q, v in ws.items()) if e is not None]
        if not all(size_ok(v) for v in ws.values()):
            err('%s.winSize: want small / normal / large or the frame width in metres 0.4..3, per side' % bid)
    elif ws is not None:
        out['winSize'] = ws
        if not size_ok(ws):
            err('%s.winSize: want small / normal / large or the frame width in metres 0.4..3' % bid)
    hh = K.get('halfHip')
    if hh is not None and not (hh is True or num_ok(hh, .15, .6)) or hh is not None and nparts > 1:
        err('%s.halfHip: want true or the clipped share of the gable 0.15..0.6, on a house the game draws as one rectangle' % bid)
    if 'walls' in K:
        if isinstance(K['walls'], dict):
            out['walls'] = [[e, v] for e, v in ((edge('walls', q), v) for q, v in K['walls'].items()) if e is not None]
            for v in K['walls'].values():
                at = v.get('at') if isinstance(v, dict) else None
                if not (isinstance(v, dict) and set(v) <= {'col', 'sty', 'at'} and (v.get('col') or v.get('sty')) and (v.get('col') is None or col_ok(v['col'])) and v.get('sty', 'brick') in TEX
                        and (at is None or isinstance(at, list) and len(at) == 2 and all(num_ok(x, 0, 1) for x in at) and at[0] < at[1])):
                    err('%s.walls: want {"left": {"col": [r, g, b], "sty": "boards", "at": [from, to]}}, sty one of %s' % (bid, ' '.join(TEX)))
        else:
            err('%s.walls: want {"left": {"col": [r, g, b], "sty": "boards"}}' % bid)
    nt = K.get('noTree')
    if nt is True or isinstance(nt, str):
        e = S['front'] if nt is True else edge('noTree', nt)
        if e is not None:
            out['nt'] = {'d': round(max(1.0, E[e][2]), 1), 'e': e}
    elif num_ok(nt, .5, 30):
        out['nt'] = {'r': nt}
    elif nt is not None and nt is not False:
        err('%s.noTree: want true (the plot between the front wall and the road), a side, or metres 0.5..30 round the house' % bid)
    nf = K.get('noFence')
    if nf is True or isinstance(nf, str):
        e = S['front'] if nf is True else edge('noFence', nf)
        if e is not None:
            out['nf'] = {'d': round(max(1.0, E[e][2]), 1), 'e': e}
    elif nf is not None and nf is not False:
        err('%s.noFence: want true (the plot between the front wall and the road) or a side' % bid)
    if 'wings' in K:
        W = K['wings']
        if not isinstance(W, list) or len(W) > nparts:
            err('%s.wings: want a list of at most %d entries (one per rectangle, `--sides %s` lists them); this house has %d' % (bid, nparts, bid, nparts))
        else:
            lst = []
            for k, q in enumerate(W):
                if q is None:
                    lst.append(None)
                    continue
                if not isinstance(q, dict) or set(q) - {'ridge', 'rh', 'h', 'roof', 'd'} or q.get('ridge', 'street') not in ('street', 'across') \
                        or not (q.get('d') is None or num_ok(q['d'], 1, 40)) \
                        or not (q.get('rh') is None or num_ok(q['rh'], .5, 8)) or not (q.get('h') is None or num_ok(q['h'], 2.2, 30)) \
                        or q.get('roof', 'gable') not in ('gable', 'hip', 'flat'):
                    err('%s.wings[%d]: want {"ridge": "street"|"across", "rh": 0.5..8, "h": 2.2..30, "roof": "gable"|"hip"|"flat", "d": 1..40 m}' % (bid, k))
                    lst.append(None)
                    continue
                o = {k2: v for k2, v in q.items() if k2 != 'ridge'}
                if 'ridge' in q and street:
                    o['rdir'] = ridge_dir(T, street, bid, q['ridge'])
                if 'd' in q:
                    o['fn'] = [round(x, 4) for x in E[S['front']][1]]
                lst.append(o)
            out['wings'] = lst
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
                if k == 'xg' and not (set(it) <= {'side', 'at', 'w', 'd', 'rise', 'wall', 'gable', 'roofCol', 'win', 'up', 'size'}
                                      and (it.get('up') is None or num_ok(it['up'], .4, 4)) and (it.get('size') is None or size_ok(it['size']))
                                      and (it.get('at') is None or num_ok(it['at'], 0, 1)) and (it.get('w') is None or num_ok(it['w'], 1, 16))
                                      and (it.get('d') is None or num_ok(it['d'], 0, 12)) and (it.get('rise') is None or num_ok(it['rise'], .3, 1.4))
                                      and all(it.get(c) is None or col_ok(it[c]) for c in ('wall', 'gable', 'roofCol'))
                                      and (it.get('win') is None or isinstance(it['win'], list))):
                    err('%s.xg: want {"side", "at" 0..1, "w" 1..16 m, "d" 0..12 m, "rise" 0.3..1.4, "wall", "gable", "roofCol", "win": [rows], "up" 0.4..4 m, "size"}' % bid)
                lst.append(dict({q: v for q, v in it.items() if q != 'side'}, e=e))
        out[k] = lst
    for q in (K.get('roof2') if isinstance(K.get('roof2'), list) else [K['roof2']] if 'roof2' in K else []):
        if not (isinstance(q, dict) and isinstance(q.get('at'), list) and len(q['at']) == 2 and all(num_ok(x, 0, 1) for x in q['at'])
                and q['at'][0] < q['at'][1] and q.get('side', 'front') in ('front', 'back', 'both') and (q.get('col') is None or col_ok(q['col']))
                and q.get('sty', 'tiles') in ('tiles', 'sheet', 'flat', 'corrugated', 'asbestos') and ('col' in q or 'sty' in q)):
            err('%s.roof2: want {"at": [from, to], "side": "front"|"back"|"both", "col": [r, g, b], "sty": "sheet"}' % bid)
    if isinstance(out.get('roof2'), dict):
        out['roof2'] = [out['roof2']]
    if 'shut' in K and not col_ok(K['shut']):
        err('%s.shut: want a colour [r, g, b]' % bid)
    return out


def load(T, paths, err, page=PAGE):
    segs, kit, lp = segs_of(T), {}, parts_of(page)[0]
    for path in paths:
        slug = os.path.basename(path)[:-5]
        st = os.path.join(STREETS_DIR or os.path.join(HERE, 'streets'), slug + '.json')
        sj = json.load(open(st, encoding='utf-8')) if os.path.exists(st) else {}
        looks, street = sj.get('looks', {}), sj.get('street')
        for bid, K in json.load(open(path, encoding='utf-8')).items():
            e = lambda m: err('%s: %s' % (os.path.basename(path), m))
            if bid not in looks:
                e('%s has no look in streets/%s.json; describe only buildings the street owns' % (bid, slug))
            elif bid in TAKEN:
                e('%s is being replaced by a model; leave it' % bid)
            elif not isinstance(K, dict):
                e('%s: want an object' % bid)
            else:
                kit[bid] = resolve(T, segs, bid, K, e, street, len(lp.get(bid[1:]) or [1]))
    return kit


def on_line(a, b, u, v):
    """outline edge a-b and rectangle side u-v are parallel, within 0.6 m and overlap"""
    L, M = math.hypot(b[0] - a[0], b[1] - a[1]) or 1, math.hypot(v[0] - u[0], v[1] - u[1]) or 1
    if abs((b[0] - a[0]) * (v[1] - u[1]) - (b[1] - a[1]) * (v[0] - u[0])) / (L * M) > .1:
        return False
    if abs((u[0] - a[0]) * (b[1] - a[1]) - (u[1] - a[1]) * (b[0] - a[0])) / L > .6:
        return False
    t = sorted(((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / L for p in (u, v))
    return t[1] > .3 and t[0] < L - .3


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
            lp, la, lo = parts_of(a.page or PAGE)
            P = lp.get(bid[1:]) or []
            if len(P) > 1:
                pts = [T.xz(*q) for q in T.ll[int(bid[1:])]][:-1]
                print('  drawn as %d rectangles (wings; `wings` entry k is rectangle k):' % len(P))
                for k, q in enumerate(P):
                    c = [T.xz(la + v[0] / 1e6, lo + v[1] / 1e6) for v in q[0]]
                    ls = [math.hypot(c[(j + 1) % 4][0] - c[j][0], c[(j + 1) % 4][1] - c[j][1]) for j in range(4)]
                    on = sorted({i for i in range(len(pts)) for j in range(4) if on_line(pts[i], pts[(i + 1) % len(pts)], c[j], c[(j + 1) % 4])})
                    print('    wing %d  %4.1f x %4.1f m  walls on edges %s' % (k, ls[0], ls[1], ' '.join(map(str, on)) or '-'))
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
    kit = load(Town(a.page), sorted(p for p in glob.glob(os.path.join(a.dir, '*.json')) if not os.path.basename(p).startswith('_')), warn.append, a.page)
    for w in warn:
        print('add_kit: skipped: ' + w)
    js = open(os.path.join(HERE, os.path.basename(__file__).replace('add_', '').replace('.py', '.js')), encoding='utf-8').read()
    data = json.dumps({k: kit[k] for k in sorted(kit, key=lambda b: int(b[1:]))}, sort_keys=True, separators=(',', ':'))
    anchor = '// ---------- boot ----------'
    assert h.count(anchor) == 1
    n0 = len(h)
    h = h.replace(anchor, 'const KIT=%s;\n%s%s' % (data, js, anchor))
    open(a.page, 'w', encoding='utf-8').write(h)
    print('kit ok: %d houses, %d B data, %d B added' % (len(kit), len(data), len(h) - n0))


if __name__ == '__main__':
    main()
