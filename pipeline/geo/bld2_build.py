"""GRPK cadastre footprints against the game's OSM buildings -> bld2_data.json (read by pipeline/add_bld2.py).

usage: python3 pipeline/geo/bld2_build.py base.html [photo_dir ...]
  base.html   any built page before add_bld2 (only its rasData block is read)
  photo_dir   extra folders of ORT10LT level-11 tiles {row}_{col}.jpg besides research/geodata/ortho/tiles
Needs PIL; the orthophoto tiles are not in git (research/geodata/fetch_tiles.py), so the output is committed and
add_bld2.py never touches them. Game metres are the equirectangular frame of buildWorld (lat0/lon0 of the OSM building bbox).

PASK = main use from the Real Estate Cadastre / Infostatyba (GRPK spec D1-415, 2023, table 18). Code meanings are the
Registrų centras classifier "NTR paskirčių tipai" (get.data.gov.lt, ntr_paskirtys): 110 Vienbučių, 120 Dvibučių,
140 Daugiabučių, 220 Garažų, 240 Pagalbinio ūkio, 266 Mėgėjų sodų. The portal blocked the full list, so the other codes stay unread.
"""
import collections, json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
LAT0, LON0 = 55.377401, 23.120024700000002
KX, KZ = 111320 * math.cos(LAT0 * math.pi / 180), 110540
LIM = 3600  # the ground plane ends here
ROADS = {'trunk': 10, 'primary': 8, 'secondary': 7.5, 'tertiary': 7, 'unclassified': 5.5, 'residential': 5.5, 'living_street': 4.5, 'road': 5.5,
         'service': 3.5, 'track': 3, 'pedestrian': 5, 'footway': 2.2, 'cycleway': 2.2, 'steps': 2, 'path': 1.8, 'bridleway': 1.8}
GAIN = (1.027 * .85, 1.062 * .85, .948 * .85)  # gray-world correction and GAIN of add_roofs.py


def area(p):
    return abs(sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))) / 2


def bb(p):
    xs = [q[0] for q in p]; zs = [q[1] for q in p]
    return min(xs), max(xs), min(zs), max(zs)


def pip(x, z, p):
    c = False; j = len(p) - 1
    for i in range(len(p)):
        xi, zi = p[i]; xj, zj = p[j]
        if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi) + xi: c = not c
        j = i
    return c


def dseg(x, z, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]; l = dx * dx + dz * dz or 1e-9
    t = max(0, min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l))
    return math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)


def dpoly(x, z, p):
    return min(dseg(x, z, p[i], p[(i + 1) % len(p)]) for i in range(len(p)))


def cross(a, b, c):
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def segx(a, b, c, d):
    return cross(a, b, c) * cross(a, b, d) < 0 and cross(c, d, a) * cross(c, d, b) < 0


def overlap(p, q):
    a, b = bb(p), bb(q)
    if a[1] < b[0] or b[1] < a[0] or a[3] < b[2] or b[3] < a[2]: return False
    for i in range(len(p)):
        for j in range(len(q)):
            if segx(p[i], p[(i + 1) % len(p)], q[j], q[(j + 1) % len(q)]): return True
    return pip(*p[0], q) or pip(*q[0], p)


class Grid:
    def __init__(s, cell=32): s.c = cell; s.g = collections.defaultdict(list)

    def add(s, k, p):
        a, b, c, d = bb(p)
        for i in range(int(a // s.c), int(b // s.c) + 1):
            for j in range(int(c // s.c), int(d // s.c) + 1): s.g[(i, j)].append(k)

    def near(s, p, m=0):
        a, b, c, d = bb(p); r = set()
        for i in range(int((a - m) // s.c), int((b + m) // s.c) + 1):
            for j in range(int((c - m) // s.c), int((d + m) // s.c) + 1): r.update(s.g.get((i, j), ()))
        return r


def sample_in(p, step=.5):
    a, b, c, d = bb(p); nx = max(1, int((b - a) / step)); nz = max(1, int((d - c) / step))
    for i in range(nx):
        x = a + (i + .5) * (b - a) / nx
        for j in range(nz):
            z = c + (j + .5) * (d - c) / nz
            if pip(x, z, p): yield x, z


def cover(p, polys, grid):
    n = 0; hits = collections.Counter()
    cand = [k for k in grid.near(p) if not (bb(polys[k])[1] < bb(p)[0] or bb(polys[k])[0] > bb(p)[1] or bb(polys[k])[3] < bb(p)[2] or bb(polys[k])[2] > bb(p)[3])]
    for x, z in sample_in(p):
        n += 1
        for k in cand:
            if pip(x, z, polys[k]): hits[k] += 1; break
    return n, hits


def load_osm(page):
    h = open(page, encoding='utf-8').read()
    i = h.index('id="rasData"'); s = h.index('>', i) + 1
    d = json.loads(h[s:h.index('</script>', s)]); n = d['n']
    P = lambda k: ((d['lon0'] + n[2 * k + 1] / 1e6 - LON0) * KX, -(d['lat0'] + n[2 * k] / 1e6 - LAT0) * KZ)
    blds, roads, water = {}, [], []
    for i, w in enumerate(d['w']):
        t = d['t'][w[0]]; refs = w[1:]
        pts = [P(k) for k in refs]
        if t.get('building') and t['building'] != 'no' and len(refs) > 3 and refs[0] == refs[-1]: blds[i] = pts[:-1]
        elif t.get('highway') in ROADS: roads.append((pts, ROADS[t['highway']]))
        elif t.get('natural') == 'water' and len(refs) > 3: water.append(pts)
    return blds, roads, water


def photo(poly, tiles):
    xs = []
    a, b, c, d = bb(poly)
    for x, z in sample_in(poly, .4):
        if dpoly(x, z, poly) < .6: continue
        v = tiles.px(x, z)
        if v: xs.append(v)
    if len(xs) < 4:
        v = tiles.px(sum(q[0] for q in poly) / len(poly), sum(q[1] for q in poly) / len(poly))
        if not v: return None
        xs = [v]
    n = len(xs); m = [sum(v[i] for v in xs) / n for i in range(3)]
    green = sum(1 for v in xs if v[1] > v[0] + 4 and v[1] > v[2] + 4) / n
    xs.sort(key=sum); top = xs[int(n * .4):] or xs
    rgb = [sum(v[i] for v in top) / len(top) for i in range(3)]
    return m, green, rgb


class Tiles:
    def __init__(s, dirs):
        from PIL import Image
        sys.path.insert(0, HERE)
        import lks94
        s.L, s.Image, s.dirs, s.c = lks94, Image, dirs, {}

    def px(s, x, z):
        L = s.L
        X, Y = L.fwd(LAT0 - z / KZ, LON0 + x / KX)
        res = 0.26458386250105836
        gx = (X - L.OX) / res; gy = (L.OY - Y) / res; r, c = int(gy // 256), int(gx // 256)
        k = (r, c)
        if k not in s.c:
            if len(s.c) > 300: s.c.clear()
            s.c[k] = None
            for d in s.dirs:
                f = os.path.join(d, '%d_%d.jpg' % k)
                if os.path.exists(f): s.c[k] = s.Image.open(f).convert('RGB').load(); break
        t = s.c[k]
        return t[min(255, int(gx - c * 256)), min(255, int(gy - r * 256))] if t else None


def code(b):
    g, p = b['GKODAS'], b.get('PASK')
    if g == 'pa6': return 't'
    if g == 'pa58': return 'h'
    if g == 'pa23' or p == '220': return 'g'
    if p == '240': return 'f'
    if p == '266': return 'a'
    if p in ('110', '120', '140'): return 'r'
    return 'x' if p else 'n'


def main():
    page = sys.argv[1]
    tiles = Tiles([os.path.join(HERE, '..', '..', 'research', 'geodata', 'ortho', 'tiles')] + sys.argv[2:])
    osm, roads, water = load_osm(page)
    G = json.load(open(os.path.join(HERE, 'grpk_buildings.json')))['buildings']
    grp = json.load(open(os.path.join(HERE, 'grpk.json')))
    gp = [b['rings'][0] for b in G]
    ok_, gk = list(osm), None
    op = [osm[k] for k in ok_]
    og, gg = Grid(), Grid()
    for i, p in enumerate(op): og.add(i, p)
    for i, p in enumerate(gp): gg.add(i, p)

    # existing building -> cadastre code (dominant footprint covering at least half of it)
    codes, stat = {}, collections.Counter()
    ocov = []
    for i, p in enumerate(op):
        n, hits = cover(p, gp, gg)
        f = sum(hits.values()) / n if n else 0
        ocov.append(f)
        if f < .1: stat['osm_only'] += 1; continue
        if f < .5: stat['osm_partial'] += 1; continue
        stat['osm_matched'] += 1
        if len(hits) > 1: stat['osm_split_by_several_cadastre'] += 1
        k, v = hits.most_common(1)[0]
        if v >= n * .5:
            c = code(G[k])
            if c in 'ghfa': codes[ok_[i]] = c
    gcov = []
    cands = []
    for k, p in enumerate(gp):
        n, hits = cover(p, op, og)
        f = sum(hits.values()) / n if n else 0
        gcov.append(f)
        if f >= .5:
            stat['cad_matched'] += 1
            if len(hits) > 1: stat['cad_over_several_osm'] += 1
        elif f >= .1: stat['cad_partial'] += 1
        else: cands.append(k)
    stat['cad_only'] = len(cands)

    # candidates -> added
    og2 = Grid()
    for i, p in enumerate(op): og2.add(i, p)
    rg = Grid()
    for i, (p, w) in enumerate(roads): rg.add(i, p)
    wpoly = [[tuple(q) for q in w['rings'][0]] for w in grp['water']] + water
    wg = Grid()
    for i, p in enumerate(wpoly): wg.add(i, p)
    streams = [(s['paths'][0], max(s.get('PLOTIS', 2), 2)) for s in grp['streams'] if 'paths' in s and not s['GKODAS'].endswith('op0')]
    sg = Grid()
    for i, (p, w) in enumerate(streams): sg.add(i, p)
    added, why = [], collections.Counter()
    ag = Grid(); apolys = []
    for k in sorted(cands, key=lambda k: (gp[k][0][0], gp[k][0][1], k)):
        p = [tuple(q) for q in gp[k]]; c = code(G[k]); a = area(p)
        if c == 't': why['tower'] += 1; continue
        if max(abs(q[0]) for q in p) > LIM or max(abs(q[1]) for q in p) > LIM: why['beyond_ground'] += 1; continue
        if a < 6: why['tiny'] += 1; continue
        if len(p) > 12 and a < 150: why['round_tank'] += 1; continue
        cx, cz = sum(q[0] for q in p) / len(p), sum(q[1] for q in p) / len(p)
        edge = [(p[i][0] + (p[(i + 1) % len(p)][0] - p[i][0]) * t, p[i][1] + (p[(i + 1) % len(p)][1] - p[i][1]) * t) for i in range(len(p)) for t in (0, .5)]
        pts = edge + [(cx, cz)]
        if any(overlap(p, op[j]) for j in og2.near(p)): why['overlaps_osm_building'] += 1; continue
        if any(overlap(p, apolys[j]) for j in ag.near(p)): why['overlaps_added'] += 1; continue
        if any(dseg(x, z, rp[i], rp[i + 1]) < rw / 2 + .3 for x, z in pts for j in rg.near(p, 8) for rp, rw in [roads[j]] for i in range(len(rp) - 1)): why['on_road'] += 1; continue
        if any(pip(x, z, wpoly[j]) or dpoly(x, z, wpoly[j]) < 1 for x, z in pts for j in wg.near(p, 2)) or any(dseg(x, z, sp[i], sp[i + 1]) < sw / 2 + .3 for x, z in pts for j in sg.near(p, 6) for sp, sw in [streams[j]] for i in range(len(sp) - 1)):
            why['in_water'] += 1; continue
        # a building the photo shows but OSM drew a few metres off
        sh = [j for j in og2.near(p, 10) if ocov[j] < .1 and .4 < area(op[j]) / a < 2.5 and math.hypot(sum(q[0] for q in op[j]) / len(op[j]) - cx, sum(q[1] for q in op[j]) / len(op[j]) - cz) < 10]
        if sh: why['osm_drawn_offset'] += 1; continue
        ph = photo(p, tiles)
        if not ph: why['no_photo'] += 1; continue
        m, green, rgb = ph
        if green > .35: why['photo_vegetation'] += 1; continue
        if m[0] > m[1] > m[2] and m[0] - m[2] >= 10: why['photo_bare_soil'] += 1; continue
        col = ''.join('%02x' % min(255, round(rgb[i] * GAIN[i])) for i in range(3))
        added.append({'g': k, 'c': c, 'rgb': col, 'in': abs(cx) < 2550 and abs(cz) < 2525})
        ag.add(len(apolys), p); apolys.append(p)
    for a in added: stat['added_' + ('town' if a['in'] else 'outside')] += 1
    out = {'credit': 'GRPK (c) Lietuvos Respublikos aplinkos ministerija, CC BY 4.0; roof colours derived from ORT10LT (c) Nacionaline zemes tarnyba, 2024',
           'codes': {str(k): codes[k] for k in sorted(codes)}, 'added': added}
    json.dump(out, open(os.path.join(HERE, 'bld2_data.json'), 'w'), separators=(',', ':'))
    stat['restyle_existing'] = len(codes)
    print(json.dumps(dict(stat), indent=1), json.dumps(dict(why)), collections.Counter(a['c'] for a in added))


main()
