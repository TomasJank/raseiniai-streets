"""Trees the LiDAR list missed, and a species for every tree. PIL only, deterministic.

usage: python3 pipeline/geo/trees2_map.py   writes pipeline/geo/trees2_data.json for pipeline/add_trees2.py

New trees come from the 2024 orthophoto canopy (bright broadleaf canopy as ground_map.py finds it, plus dark textured
canopy for conifers away from buildings, whose shadows look the same), minus what a LiDAR tree already explains, and
from the GRPK land cover past the photo's edge. Orchards (GRPK ms4) are planted as rows of small fruit trees.
Species are assigned from the GRPK class around the tree, the LiDAR conifer flag, the tree's height and its distance to
water. The mix per context is judgement (Lithuanian forest statistics for forests: pine, birch and spruce lead,
then alders), not a survey of individual trees.
"""
import base64, json, math, os, re, struct, sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageMath

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
sys.path.insert(0, HERE)
import ground_map as gm
import lks94

E, N = 2560, 4096
PX = 2 * E / N
BOX = 2810  # the page's world.box, plus a little
# kinds: 0 lime/maple/oak, 1 birch, 2 apple/plum, 3 alder, 4 willow, 5 pine, 6 spruce, 7 thuja
FOREST, BELT, ORCH, BUILT, OPEN = 1, 2, 3, 4, 0


def h01(*a):
    v = 0
    for x in a:
        v = (v * 1000003 + int(x * 1000) & 0xffffffff) & 0xffffffff
    v ^= v >> 15
    v = v * 2246822519 & 0xffffffff
    v ^= v >> 13
    v = v * 3266489917 & 0xffffffff
    v ^= v >> 16
    return v / 4294967296


def g2p(x, z):
    return (x + E) / PX, (z + E) / PX


def page_data():
    h = open(os.path.join(ROOT, 'work', 'build', 'v37.html'), encoding='utf8').read()
    return json.loads(re.search(r'<script type="application/json" id="rasData">(.*?)</script>', h, re.S).group(1))


def lidar(d):
    """the page's own decode of rasData.tr, same order and floats as buildWorld"""
    v = struct.unpack('<%dh' % (len(base64.b64decode(d['tr']['b64'])) // 2), base64.b64decode(d['tr']['b64']))
    k = 111320 * math.cos(d['lat0'] * math.pi / 180)
    out = []
    for i in range(0, len(v), 4):
        lat, lon = d['lat0'] + v[i + 1] / 2 / 110540, d['lon0'] + v[i] / 2 / k
        out.append(((lon - lks94.LON0) * lks94.KX, -(lat - lks94.LAT0) * lks94.KZ, abs(v[i + 2]) / 10, v[i + 3] / 10, v[i + 2] < 0))
    return out


def classes(G):
    lab = Image.new('L', (N, N), OPEN)
    tr = lambda x, z: g2p(x, z)
    for code, v in (('pu0', BUILT), ('vp1', BUILT)):
        for p in G['built']:
            if p['GKODAS'] == code:
                gm.paint(lab, p['rings'], tr, v)
    for code, v in (('sd15', BELT), ('ms0', FOREST), ('ms4', ORCH)):
        for p in G['land']:
            if p['GKODAS'] == code:
                gm.paint(lab, p['rings'], tr, v)
    return lab


def water_mask(G, owat):
    m = Image.new('L', (N, N), 0)
    d = ImageDraw.Draw(m)
    for p in G['water'] + [{'rings': r} for r in owat]:
        gm.paint(m, p['rings'], g2p, 255)
    for s in G['streams']:
        if (s.get('PLOTIS') or 3) < 8 and not s.get('VARDAS'):
            continue  # a ditch the game does not draw; the belt along it stands over it
        w = max(2, (s.get('PLOTIS') or 3) * .45) / PX
        for path in s['paths']:
            d.line([g2p(*q) for q in path], fill=255, width=max(1, round(w)))
    return m


def main():
    G = json.load(open(os.path.join(HERE, 'grpk.json')))
    d = page_data()
    obld, owat = gm.osm()
    gb = json.load(open(os.path.join(HERE, 'grpk_buildings.json')))
    gb = gb['buildings']

    photo, cov, can, _ = gm.ortho_layer(E, N, 11, 4)
    L = photo.convert('L')
    r, g, b = photo.split()
    tex = ImageChops.difference(L, L.filter(ImageFilter.GaussianBlur(2))).filter(ImageFilter.GaussianBlur(1.5))
    dcan = ImageMath.lambda_eval(lambda a: ((a['L'] < 82) & (a['L'] > 18) & (a['t'] > 5) & (a['g'] + 4 >= a['r'])) * 255,
                                 L=L, t=tex, g=g, r=r).convert('L').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(5))

    bld = Image.new('L', (N, N), 0)
    for rings in obld:
        gm.paint(bld, rings, g2p, 255)
    for f in gb:
        gm.paint(bld, f['rings'], g2p, 255)
    bld3 = bld.filter(ImageFilter.MaxFilter(5))           # 3 m round a footprint
    shade = bld.filter(ImageFilter.MaxFilter(25))         # 15 m: a dark patch here is a cast shadow as likely as a conifer
    wat = water_mask(G, owat)
    wet = wat.filter(ImageFilter.MaxFilter(3))
    side = wat.reduce(4).filter(ImageFilter.MaxFilter(5)).resize((N, N))  # within about 10 m of water
    lab = classes(G)

    LT = [t for t in lidar(d) if abs(t[0]) < BOX + 200 and abs(t[1]) < BOX + 200]
    expl = Image.new('L', (N, N), 0)
    de = ImageDraw.Draw(expl)
    lb, sd = lab.load(), side.load()
    for x, z, h, cr, c in LT:
        px, pz = g2p(x, z)
        # in a belt or a forest a scanned crown is often a thicket the game draws narrower: fill round it
        wild = 0 <= px < N and 0 <= pz < N and (lb[int(px), int(pz)] in (FOREST, BELT) or sd[int(px), int(pz)])
        rr = (cr * .6 + .5 if wild else cr + 1.2) / PX
        de.ellipse((px - rr, pz - rr, px + rr, pz + rr), fill=255)

    P = dict(can=can.load(), dcan=dcan.load(), cov=cov.load(), bld=bld3.load(), shade=shade.load(), wet=wet.load(),
             side=side.load(), lab=lab.load(), expl=expl.load(), L=L.load(), rgb=photo.load())

    def at(name, x, z):
        px, pz = g2p(x, z)
        i, j = int(px), int(pz)
        if not (0 <= i < N and 0 <= j < N):
            return 0
        return P[name][i, j]

    # LiDAR height by 30 m cell, for the height of a new tree next to scanned ones
    cell = {}
    for x, z, h, cr, c in LT:
        cell.setdefault((int(x // 30), int(z // 30), c), []).append(h)

    def local_h(x, z, c, lo, hi, salt):
        hs = []
        for i in (-1, 0, 1):
            for j in (-1, 0, 1):
                hs += cell.get((int(x // 30) + i, int(z // 30) + j, c), [])
        if len(hs) >= 3:
            hs.sort()
            base = hs[len(hs) // 2]
        else:
            base = lo + (hi - lo) * .5
        return max(lo, min(hi, base * (.85 + .3 * h01(x, z, salt))))

    def ctx(x, z):
        if at('side', x, z) > 0:
            return 'water'
        return {FOREST: 'forest', BELT: 'belt', ORCH: 'orch', BUILT: 'built'}.get(at('lab', x, z), 'open')

    def kind(x, z, h, con, c, cr=0):
        u = h01(x, z, 7)
        if not con and c in ('water', 'belt', 'forest', 'open') and h < 10 and cr > h * .55:
            return 4 if c == 'water' and u < .6 else 3  # low and wide: a willow or alder thicket
        if con:
            if c == 'built':
                return 7 if h < 7 else (6 if u < .8 else 5)
            if c == 'forest':
                return 5 if u < .6 else 6
            return 6 if u < .6 else 5
        if c == 'water':
            return 1 if h > 16 else (4 if u < .45 else 3 if u < .85 else 1)
        if c == 'orch':
            return 2 if h < 8 else (1 if u < .3 else 0)
        if c == 'built':
            return 2 if h < 7.5 and u < .7 else (1 if u < .3 else 0)
        if c == 'forest':
            return 1 if u < .45 else 3 if u < .65 else 0
        if c == 'belt':
            return 1 if u < .35 else 3 if u < .6 else 4 if u < .75 else 0
        return 1 if u < .3 else 0

    new = []

    def free(x, z):
        return (abs(x) < BOX and abs(z) < BOX and not at('bld', x, z) and not at('wet', x, z) and not at('expl', x, z))

    # 1. canopy in the photo that no scanned tree explains
    SP = {FOREST: 4.6, BELT: 4.4, ORCH: 5.0, BUILT: 5.5, OPEN: 4.8}
    for s, salt in ((4.4, 1),):
        n = int(2 * E / s)
        for j in range(n):
            for i in range(n):
                x = -E + (i + .15 + .7 * h01(i, j, 11)) * s
                z = -E + (j + .15 + .7 * h01(i, j, 12)) * s
                if not at('cov', x, z) or not free(x, z):
                    continue
                cl = at('lab', x, z)
                if SP[cl] > s and h01(i, j, 13) > (s / SP[cl]) ** 2:
                    continue
                bright = at('can', x, z) > 0
                dark = at('dcan', x, z) > 0 and not at('shade', x, z) and not bright
                if not (bright or dark):
                    continue
                if dark and cl not in (FOREST, BELT) and not at('side', x, z):
                    continue  # elsewhere a dark textured patch is as often a furrow, a ditch or a shadow
                c = ctx(x, z)
                con = dark and not (c == 'water' and h01(x, z, 3) < .5)
                hh = local_h(x, z, con, 6 if c in ('built', 'open', 'water') else 8, 26 if con else 22, 5)
                new.append([x, z, hh, min(4.5, .9 + hh * (.25 if c in ('belt', 'water') else .14)), con, c])

    # 2. past the photo's edge: GRPK forest and tree belts at their density
    for p in G['land']:
        cl = {'ms0': FOREST, 'sd15': BELT}.get(p['GKODAS'])
        if not cl:
            continue
        ring = p['rings'][0]
        xs, zs = [q[0] for q in ring], [q[1] for q in ring]
        s = 5.0 if cl == FOREST else 5.5
        for j in range(int(min(zs) // s), int(max(zs) // s) + 1):
            for i in range(int(min(xs) // s), int(max(xs) // s) + 1):
                x = (i + .15 + .7 * h01(i, j, 21)) * s
                z = (j + .15 + .7 * h01(i, j, 22)) * s
                if at('cov', x, z) or abs(x) > BOX or abs(z) > BOX or not gm.inside((x, z), ring):
                    continue
                if any(gm.inside((x, z), hole) for hole in p['rings'][1:] if gm.inside(hole[0], ring)):
                    continue
                if cl == BELT and h01(i, j, 23) < .3:
                    continue
                c = 'water' if at('side', x, z) else ('forest' if cl == FOREST else 'belt')
                con = cl == FOREST and h01(i, j, 24) < .56
                hh = local_h(x, z, con, 8, 24 if con else 20, 25)
                new.append([x, z, hh, min(4.2, .9 + hh * .14), con, c])

    # 3. orchards: rows along the polygon's longest edge, about 6 m by 4.5 m, a tree missing here and there
    for p in G['land']:
        if p['GKODAS'] != 'ms4':
            continue
        ring = p['rings'][0]
        xs, zs = [q[0] for q in ring], [q[1] for q in ring]
        n = sum(1 for t in LT if min(xs) < t[0] < max(xs) and min(zs) < t[1] < max(zs) and gm.inside(t[:2], ring))
        if n * 150 > p['SHAPE_Area']:
            continue  # an old orchard or a garden: the scan has its trees; rows are for the young plantations it missed
        bi = max(range(len(ring)), key=lambda k: math.dist(ring[k], ring[k - 1]))
        a, b2 = ring[bi - 1], ring[bi]
        ln = math.dist(a, b2)
        ux, uz = (b2[0] - a[0]) / ln, (b2[1] - a[1]) / ln
        us = [(q[0] - a[0]) * ux + (q[1] - a[1]) * uz for q in ring]
        vs = [-(q[0] - a[0]) * uz + (q[1] - a[1]) * ux for q in ring]
        for vi in range(int(min(vs) // 6), int(max(vs) // 6) + 1):
            for ui in range(int(min(us) // 4.5), int(max(us) // 4.5) + 1):
                u, v = (ui + .5) * 4.5, (vi + .5) * 6
                x, z = a[0] + ux * u - uz * v, a[1] + uz * u + ux * v
                if not gm.inside((x, z), ring) or not free(x, z) or h01(ui, vi, 31) < .15:
                    continue
                hh = 2.8 + 1.6 * h01(x, z, 32)
                new.append([x, z, hh, .5 + hh * .22, False, 'orch'])

    lg = {}
    for t in LT:
        lg.setdefault((int(t[0] // 8), int(t[1] // 8)), []).append(t)
    new = [t for t in new if not any(math.hypot(q[0] - t[0], q[1] - t[1]) < .6 * (q[3] + t[3]) for i in (-1, 0, 1) for j in (-1, 0, 1)
                                     for q in lg.get((int(t[0] // 8) + i, int(t[1] // 8) + j), []))]

    # thin the new trees against each other (the jittered grids of 1-3 overlap at polygon edges)
    grid, kept = {}, []
    for t in new:
        k = (int(t[0] // 4), int(t[1] // 4))
        near = [q for i in (-1, 0, 1) for j in (-1, 0, 1) for q in grid.get((k[0] + i, k[1] + j), [])]
        if any(math.hypot(q[0] - t[0], q[1] - t[1]) < (3 if t[5] == 'orch' else 3.6) for q in near):
            continue
        grid.setdefault(k, []).append(t)
        kept.append(t)

    # the LiDAR conifer flag misses most of the spruce and pine: the 2024 photo (spring, broadleaf light green, conifers
    # near black) decides where it is clear, away from building shadows
    def conifer(x, z, cr, c):
        if not at('cov', x, z) or at('shade', x, z):
            return c
        rr, nb, nd, n = max(1.5, cr * .6), 0, 0, 0
        k = 0
        while k * PX <= rr:
            k += 1
        for i in range(-k + 1, k):
            for j in range(-k + 1, k):
                n += 1
                nb += at('can', x + i * PX, z + j * PX) > 0
                nd += at('dcan', x + i * PX, z + j * PX) > 0
        return True if nd > .5 * n and nb < .2 * n else False if nb > .4 * n else c

    lk = bytes(kind(x, z, h, cn, ctx(x, z), cr) for x, z, h, cr, c in lidar(d) for cn in (conifer(x, z, cr, c),))
    nb = bytearray()
    counts = {}
    for x, z, h, cr, con, c in kept:
        k = kind(x, z, h, con, c)
        counts[k] = counts.get(k, 0) + 1
        nb += struct.pack('<hhBBB', round(x * 4), round(z * 4), min(255, round(h * 4)), min(255, round(cr * 20)), k)
    out = {'credit': 'GRPK (c) Lietuvos Respublikos aplinkos ministerija, CC BY 4.0; ORT10LT (c) Nacionaline zemes tarnyba, 2024',
           'n': base64.b64encode(bytes(nb)).decode(), 'k': base64.b64encode(lk).decode()}
    json.dump(out, open(os.path.join(HERE, 'trees2_data.json'), 'w'), separators=(',', ':'))
    lc = {}
    for v in lk:
        lc[v] = lc.get(v, 0) + 1
    print('trees2_map: %d new trees %s, %d lidar kinds %s, %d B' % (len(kept), dict(sorted(counts.items())), len(lk), dict(sorted(lc.items())), len(nb) + len(lk)))


if __name__ == '__main__':
    main()
