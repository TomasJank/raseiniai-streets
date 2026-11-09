"""Rebuild building outlines and roofs in the game's rasData from Lidar_DR_LT class 6 points.

usage: trace.py game.html out.html compare.png tile.laz [tile.laz ...]
"""
import json, math, re, sys
import numpy as np, laspy
from PIL import Image, ImageDraw
from pyproj import Transformer
from scipy import ndimage as ni
from shapely import STRtree
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

game, out_html, out_png, tiles = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:]
R = .5              # analysis grid, m
EAVE = .35          # roof points reach past the walls by the overhang plus half a cell
BIG = 300           # m2; larger outlines already fit, so they only get nudged
ROADS = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'primary_link', 'secondary_link', 'tertiary_link'}
KEEP = {1583, 2134, 2220}  # hand-styled in LOOK
MIN_SIDE, MIN_PART, MAX_PARTS = 2.0, 6.0, 6
TOL = .4            # m; a point this close to a fitted roof counts as on it
ON_ROOF = .8        # share of single-echo points: roofs stop the laser, tree crowns split it
NEAR = 6.0          # m; roof cells further than this from an outline are a separate building

html = open(game, encoding='utf-8').read()
m = re.search(r'(id="rasData">)(.*?)(</script>)', html, re.S)
d = json.loads(m.group(2))
n, lat0, lon0 = d['n'], d['lat0'], d['lon0']
to_lks = Transformer.from_crs(4326, 3346, always_xy=True)
to_ll = Transformer.from_crs(3346, 4326, always_xy=True)

P, Z, C, N = [], [], [], []
for t in tiles:
    las = laspy.read(t)
    P.append(np.c_[las.x, las.y]); Z.append(np.asarray(las.z)); C.append(np.asarray(las.classification)); N.append(np.asarray(las.number_of_returns))
P, Z, C, N = np.concatenate(P), np.concatenate(Z), np.concatenate(C), np.concatenate(N)
x0, y0 = P.min(0); x1, y1 = P.max(0)
W, H = int((x1 - x0) / R) + 1, int((y1 - y0) / R) + 1
cell = lambda q: (((y1 - q[..., 1]) / R).astype(int), ((q[..., 0] - x0) / R).astype(int))
roof_pts, roof_z, roof_single = P[C == 6], Z[C == 6], N[C == 6] == 1
ry, rx = cell(roof_pts)

hit = np.zeros((H, W), bool); hit[ry, rx] = True
mask = ni.binary_opening(ni.binary_fill_holes(ni.binary_closing(hit, iterations=1)), iterations=1)
lab, nlab = ni.label(mask)
gy, gx = cell(P[C == 2])
gs = np.zeros((H // 4 + 1, W // 4 + 1)); gc = gs.copy()
np.add.at(gs, (gy // 4, gx // 4), Z[C == 2]); np.add.at(gc, (gy // 4, gx // 4), 1)
dtm = gs / np.maximum(gc, 1)
dtm = dtm[tuple(ni.distance_transform_edt(gc == 0, return_distances=False, return_indices=True))]
ground_hit = np.zeros((H, W), bool); ground_hit[gy, gx] = True


def corners(w):
    r = w[1:-1] if w[1] == w[-1] else w[1:]
    X, Y = to_lks.transform([lon0 + n[2 * k + 1] / 1e6 for k in r], [lat0 + n[2 * k] / 1e6 for k in r])
    return np.c_[X, Y]


def raster(q, ox, oy, w, h):
    im = Image.new('1', (w, h))
    ImageDraw.Draw(im).polygon([((a - x0) / R - ox, (y1 - b) / R - oy) for a, b in q], fill=1)
    return np.array(im, bool)


ways = {}
for i, w in enumerate(d['w']):
    if 'building' not in d['t'][w[0]] or len(w) < 4:
        continue
    q = corners(w)
    if q[:, 0].min() > x0 + 15 and q[:, 0].max() < x1 - 15 and q[:, 1].min() > y0 + 15 and q[:, 1].max() < y1 - 15:
        ways[i] = q
kind_skip = lambda i: i in KEEP or re.search('bažnyč|koplyč|cerkv', d['t'][d['w'][i][0]].get('name', ''), re.I) or d['t'][d['w'][i][0]].get('building') in ('church', 'chapel')

owner = np.zeros((H, W), 'int32')
area = {}
for i, q in ways.items():
    ox, oy = int(((q[:, 0] - x0) / R).min()) - 1, int(((y1 - q[:, 1]) / R).min()) - 1
    w_, h_ = int(((q[:, 0] - x0) / R).max()) + 2 - ox, int(((y1 - q[:, 1]) / R).max()) + 2 - oy
    F = raster(q, ox, oy, w_, h_)
    owner[oy:oy + h_, ox:ox + w_][F] = i + 1
    area[i] = Polygon(q).area
dist, (iy, ix) = ni.distance_transform_edt(owner == 0, return_indices=True)
near = owner[iy, ix] - 1
near[dist * R > NEAR] = -1
assign = np.where(mask & (lab > 0), near, -2)  # -2 no roof, -1 roof with no outline nearby

rcell = {}
order = np.argsort(assign[ry, rx], kind='stable')
keys = assign[ry, rx][order]
for k, a, b in zip(*np.unique(keys, return_index=True, return_counts=True)[0:1], np.unique(keys, return_index=True)[1], np.unique(keys, return_counts=True)[1]):
    if k >= 0:
        rcell[int(k)] = order[a:a + b]


def angle_of(p, around=None):
    best, ba = -1, 0
    cand = np.arange(around - 8, around + 8.5, 1) if around is not None else np.arange(0, 90, 1)
    for deg in cand:
        t = math.radians(deg); a = p[:, 0] * math.cos(t) + p[:, 1] * math.sin(t); b = -p[:, 0] * math.sin(t) + p[:, 1] * math.cos(t)
        s = (np.bincount(((a - a.min()) / R).astype(int)) ** 2).sum() + (np.bincount(((b - b.min()) / R).astype(int)) ** 2).sum()
        if s > best:
            best, ba = s, deg
    return float(ba)


def max_rect(g):
    best = (0, 0, 0, 0, 0); hgt = np.zeros(g.shape[1], int)
    for y in range(g.shape[0]):
        hgt = (hgt + 1) * g[y]
        st = []
        for x in range(g.shape[1] + 1):
            h = hgt[x] if x < g.shape[1] else 0
            s = x
            while st and st[-1][1] >= h:
                s, hh = st.pop()
                if hh * (x - s) > best[0]:
                    best = (hh * (x - s), y - hh + 1, s, y + 1, x)
            st.append((s, h))
    return best[1:]


def rects(p, deg):
    t = math.radians(deg); u, v = np.array([math.cos(t), math.sin(t)]), np.array([-math.sin(t), math.cos(t)])
    a, b = p @ u, p @ v
    a0, b0 = a.min(), b.min()
    g = np.zeros((int((b.max() - b0) / R) + 1, int((a.max() - a0) / R) + 1), bool)
    g[((b - b0) / R).astype(int), ((a - a0) / R).astype(int)] = True
    g = ni.binary_fill_holes(ni.binary_closing(np.pad(g, 1), iterations=1))[1:-1, 1:-1]
    left, out = g.copy(), []
    side = int(MIN_SIDE / R)
    core = np.ones((side, side), bool)
    for _ in range(MAX_PARTS):
        # jagged edges leave long thin strips that would out-score real wings, so only look where a minimum-width block fits
        usable = ni.binary_opening(left, structure=core)
        if not usable.any():
            break
        r0, c0, r1, c1 = max_rect(usable.astype(int))
        # the largest empty-free rectangle sits inside jagged edges, so grow it while most of the next row is roof
        grow = True
        while grow:
            grow = False
            for dr0, dc0, dr1, dc1, sl in ((-1, 0, 0, 0, lambda: g[r0 - 1, c0:c1]), (0, 0, 1, 0, lambda: g[r1, c0:c1]), (0, -1, 0, 0, lambda: g[r0:r1, c0 - 1]), (0, 0, 0, 1, lambda: g[r0:r1, c1])):
                if (dr0 and r0 == 0) or (dr1 and r1 == g.shape[0]) or (dc0 and c0 == 0) or (dc1 and c1 == g.shape[1]):
                    continue
                if sl().mean() >= .6:
                    r0 += dr0; c0 += dc0; r1 += dr1; c1 += dc1; grow = True
        if (r1 - r0) * (c1 - c0) * R * R < MIN_PART:
            break
        out.append(box(a0 + c0 * R, b0 + r0 * R, a0 + c1 * R, b0 + r1 * R))
        left[r0:r1, c0:c1] = False
    return out, u, v


def fit(f, z):
    A = np.c_[np.ones_like(z), f]; ok = np.ones(len(z), bool)
    for _ in range(3):
        (h, r), *_ = np.linalg.lstsq(A[ok], z[ok], rcond=None)
        res = z - h - r * f; ok = np.abs(res) < .6
        if ok.sum() < 8:
            ok = np.abs(res) < np.abs(res).max()
    return float(h), float(r), float(np.sqrt(np.mean(res[ok] ** 2))), res


def roof(q, pts, z):
    """q corners in EPSG:3346. Returns type, wall h, rise (types as in buildingSpec) and the share of points on the fitted roof."""
    u = q[1] - q[0]; A_ = np.hypot(*u); u = u / A_
    v = q[2] - q[1]; B_ = np.hypot(*v); v = v / B_
    s, t = np.clip((pts - q[0]) @ u, 0, A_), np.clip((pts - q[1]) @ v, 0, B_)
    wm = min(A_, B_)
    M = {1: 1 - np.abs(2 * t / B_ - 1), 2: 1 - np.abs(2 * s / A_ - 1),
         3: np.minimum(np.minimum(s, A_ - s), np.minimum(t, B_ - t)) / (wm / 2), 4: s / A_, 5: t / B_}
    F = {k: fit(f, z) for k, f in M.items()}
    # judge on all points: rms over inliers alone rewards a model that fits a sliver and ignores the rest of the roof
    share = {k: float((np.abs(F[k][3]) < TOL).mean()) for k in F}
    share = {k: v - (.08 if k >= 4 else 0) for k, v in share.items() if (k < 4 and F[k][1] >= 1 and F[k][0] >= 1.8) or (k >= 4 and abs(F[k][1]) >= .5)}
    fh = float(np.median(z)); fon = float((np.abs(z - fh) < TOL).mean())
    k = max(share, key=share.get) if share else 0
    if not share or fon >= share[k] - .05:
        k, h, r, res = 0, fh, 0., z - fh
    else:
        h, r, _, res = F[k]
    if k >= 4 and r < 0:
        h += r
    if k < 4:
        r = min(r, (A_ if k == 2 else B_ if k == 1 else wm) * .9)
    return k, round(max(2.2, h), 1), round(r, 1), float((np.abs(res) < TOL).mean())


def ground_at(q):
    y, x = cell(q)
    return float(np.median(dtm[np.clip(y // 4, 0, dtm.shape[0] - 1), np.clip(x // 4, 0, dtm.shape[1] - 1)]))


def ll(q):
    lon, lat = to_ll.transform(q[:, 0], q[:, 1])
    return [[round((a - lat0) * 1e6), round((b - lon0) * 1e6)] for a, b in zip(lat, lon)]


def build(cells, around=None):
    p = roof_pts[cells]; c0 = p.mean(0); p0 = p - c0
    deg = angle_of(p0, around)
    boxes, u, v = rects(p0, deg)
    if not boxes:
        return None
    u0 = unary_union(boxes).buffer(-EAVE, join_style=2)
    if u0.is_empty:
        return None
    u0 = max(u0.geoms, key=lambda g: g.area) if u0.geom_type == 'MultiPolygon' else u0
    parts = []
    for b in boxes:
        c = b.intersection(u0)
        if c.is_empty or c.area < 4:
            continue
        a0, b0, a1, b1 = c.envelope.bounds
        parts.append(np.array([[a0, b0], [a1, b0], [a1, b1], [a0, b1]]))
    if not parts:
        return None
    to_world = lambda e: np.outer(e[:, 0], u) + np.outer(e[:, 1], v) + c0
    ring = np.array(Polygon(u0.exterior).simplify(.01).exterior.coords)[:-1]
    worldp = [to_world(e) for e in parts]
    g = ground_at(to_world(ring))
    z = roof_z[cells] - g
    pa = p0 @ u; pb = p0 @ v
    fitted = []
    for e, wp in zip(parts, worldp):
        s = (pa >= e[0, 0]) & (pa <= e[1, 0]) & (pb >= e[0, 1]) & (pb <= e[2, 1])
        if s.sum() < 15:
            continue
        k, h, r, on = roof(wp, p[s], z[s])
        checks.append((on, h + max(r, 0) - float(np.percentile(z[s], 97)), float(np.percentile(z[s], 97)), g))
        fitted.append((wp, k, h, r, float(roof_single[cells][s].mean())))
    if not fitted:
        return None
    return to_world(ring), fitted


def new_node(q):
    ids = []
    for a, b in ll(q):
        ids.append(len(n) // 2); n.extend([a, b])
    return ids


stats = dict(osm_shifted=0, traced=0, parts=0, nudged=0, kept=0, removed=0, new=0, rejected_tree=0, ret_failed=0, rect_before=0, rect_after=0)
replaced = {}
for k in ('lh', 'lr', 'lp', 'sk'):
    d.setdefault(k, {})


def apply_parts(i, ring, fitted):
    d['w'][i] = [d['w'][i][0]] + (lambda r: r + r[:1])(new_node(ring))
    for k in ('lh', 'lr', 'sk'):
        d[k].pop(str(i), None)
    d['lp'][str(i)] = [[ll(wp), kk, h, r] for wp, kk, h, r, _ in fitted]


def shift_way(i, dx, dy):
    q = ways[i] + [dx, dy]
    dd = np.array(ll(q)) - np.array(ll(ways[i]))
    dlat, dlon = int(np.median(dd[:, 0])), int(np.median(dd[:, 1]))
    w = d['w'][i]; r = w[1:-1]
    d['w'][i] = [w[0]] + (lambda x: x + x[:1])(new_node(q))
    for pt in d['lp'].get(str(i), []):
        pt[0] = [[c[0] + dlat, c[1] + dlon, *c[2:]] for c in pt[0]]
        if len(pt) > 4 and pt[4]:
            pt[4] = [[c[0] + dlat, c[1] + dlon, c[2]] for c in pt[4]]
    if str(i) in d['lr'] and len(d['lr'][str(i)]) > 3:
        d['lr'][str(i)][3] = [[c[0] + dlat, c[1] + dlon, c[2]] for c in d['lr'][str(i)][3]]
    if str(i) in d['sk']:
        d['sk'][str(i)][2] = [[v[0] + dlat, v[1] + dlon, v[2]] for v in d['sk'][str(i)][2]]


def fit_iou(pl, A, dx=0, dy=0):
    q = np.array(pl.exterior.coords)[:-1] + [dx, dy]
    ox, oy = max(int(((q[:, 0] - x0) / R).min()) - 2, 0), max(int(((y1 - q[:, 1]) / R).min()) - 2, 0)
    w_, h_ = int(((q[:, 0] - x0) / R).max()) + 3 - ox, int(((y1 - q[:, 1]) / R).max()) + 3 - oy
    F = raster(q, ox, oy, w_, h_)
    a = A[oy:oy + h_, ox:ox + w_]
    if F.shape != a.shape:
        return 0
    extra = A.sum() - a.sum()
    return (F & a).sum() / max(1, (F | a).sum() + extra)


def best_shift(q, A):
    pl = Polygon(q).buffer(EAVE, join_style=2)
    best, bs = -1, (0., 0.)
    for dy in np.arange(-3, 3.1, R):
        for dx in np.arange(-3, 3.1, R):
            v = fit_iou(pl, A, dx, dy) - .002 * math.hypot(dx, dy)
            if v > best:
                best, bs = v, (float(dx), float(dy))
    return bs, fit_iou(pl, A, *bs)


def xy(k):
    return to_lks.transform(lon0 + n[2 * k + 1] / 1e6, lat0 + n[2 * k] / 1e6)


road_lines = [LineString([xy(k) for k in w[1:]]) for w in d['w'] if d['t'][w[0]].get('highway') in ROADS and len(w) > 2]
road_tree = STRtree(road_lines)
on_road = lambda pl: any(pl.intersects(road_lines[j]) for j in road_tree.query(pl))
new_outlines = {}
polys = {}
extras, mains, checks = [], [], []
for i, q in ways.items():
    cells = rcell.get(i)
    stats['rect_before'] += len(q) == 4
    if kind_skip(i):
        stats['kept'] += 1
        polys[i] = Polygon(q)
        continue
    if cells is None or len(cells) < 30:
        qp = (q - [x0, y1]) / [R, -R]
        ox, oy = int(qp[:, 0].min()), int(qp[:, 1].min()); w_, h_ = int(qp[:, 0].max()) + 2 - ox, int(qp[:, 1].max()) + 2 - oy
        F = raster(q, ox, oy, w_, h_)
        if ground_hit[oy:oy + h_, ox:ox + w_][F].mean() > .8:
            d['w'][i] = d['w'][i][:1]
            for k in ('lh', 'lr', 'lp', 'sk'):
                d[k].pop(str(i), None)
            stats['removed'] += 1
            continue
        stats['kept'] += 1
        polys[i] = Polygon(q)
        continue
    if area[i] >= BIG:
        # ponytail: big buildings get a best-fit nudge only; re-tracing them would flatten courtyards
        best, bs = -1, (0, 0)
        ox, oy = int(((q[:, 0] - x0) / R).min()) - 8, int(((y1 - q[:, 1]) / R).min()) - 8
        w_, h_ = int(((q[:, 0] - x0) / R).max()) + 8 - ox, int(((y1 - q[:, 1]) / R).max()) + 8 - oy
        ox, oy = max(ox, 0), max(oy, 0)
        F = raster(q, ox, oy, w_, h_); A = mask[oy:oy + h_, ox:ox + w_]
        if F.shape != A.shape:
            polys[i] = Polygon(q); stats['kept'] += 1; continue
        base = (F & A).sum()
        for dy in range(-6, 7):
            for dx in range(-6, 7):
                val = (np.roll(np.roll(F, dy, 0), dx, 1) & A).sum()
                if val > best:
                    best, bs = val, (dx, dy)
        if best > base * 1.02:
            shift_way(i, bs[0] * R, -bs[1] * R)
            polys[i] = Polygon(q + [bs[0] * R, -bs[1] * R]); stats['nudged'] += 1
        else:
            polys[i] = Polygon(q); stats['kept'] += 1
        continue
    k = int(np.argmax(np.hypot(*(np.roll(q, -1, 0) - q).T)))
    e = np.roll(q, -1, 0)[k] - q[k]
    around = math.degrees(math.atan2(e[1], e[0])) % 90
    res = build(cells, around)
    if res is None:
        stats['ret_failed'] += 1
        polys[i] = Polygon(q)
        continue
    ring, fitted = res
    # extra rectangles that don't sit on a clean roof plane are tree crowns classed as building
    extras.extend(f[4] for f in fitted[1:]); mains.append(fitted[0][4])
    keep = [fitted[0]] + [f for f in fitted[1:] if f[4] >= ON_ROOF]
    if len(keep) < len(fitted):
        stats['rejected_tree'] += len(fitted) - len(keep)
        un = unary_union([Polygon(f[0]) for f in keep]).buffer(.01, join_style=2)
        un = max(un.geoms, key=lambda g: g.area) if un.geom_type == 'MultiPolygon' else un
        ring = np.array(Polygon(un.exterior).simplify(.02).exterior.coords)[:-1]
    # a shifted OSM outline wins when it fits at least as well: mappers often have real detail the scan can't resolve
    A = assign == i
    (dx, dy), osm_iou = best_shift(q, A)
    blocked = on_road(Polygon(ring))
    if blocked or osm_iou >= fit_iou(Polygon(ring).buffer(EAVE, join_style=2), A) - .02:
        if on_road(Polygon(q + [dx, dy])):
            dx, dy = 0., 0.
        if dx or dy:
            shift_way(i, dx, dy)
        polys[i] = Polygon(q + [dx, dy]); new_outlines[i] = q + [dx, dy]; stats['osm_shifted'] += 1
        continue
    apply_parts(i, ring, keep)
    polys[i] = Polygon(ring)
    new_outlines[i] = ring
    stats['traced'] += 1; stats['parts'] += len(keep); stats['rect_after'] += len(ring) == 4

# roofs with no outline nearby become new buildings
orphans, no = ni.label(assign == -1)
tag_yes = next(j for j, t in enumerate(d['t']) if t == {'building': 'yes'}) if {'building': 'yes'} in d['t'] else (d['t'].append({'building': 'yes'}) or len(d['t']) - 1)
cell_o = orphans[ry, rx]
ordr = np.argsort(cell_o, kind='stable'); ks, st, ct = np.unique(cell_o[ordr], return_index=True, return_counts=True)
on_scores = []
for k, a, b in zip(ks, st, ct):
    if k == 0 or b < 120:
        continue
    cells = ordr[a:a + b]
    yy, xx = ry[cells], rx[cells]
    if yy.min() < 30 or xx.min() < 30 or yy.max() > H - 30 or xx.max() > W - 30:
        continue
    res = build(cells)
    if res is None:
        continue
    ring, fitted = res
    fitted = [f for f in fitted if f[4] >= ON_ROOF]
    on_scores.append(len(fitted))
    pl = Polygon(ring)
    if not fitted or pl.area < 15 or on_road(pl) or any(pl.intersection(o).area > .2 * pl.area for o in polys.values() if o.distance(pl) < 1):
        stats['rejected_tree'] += 1
        continue
    if len(fitted) < len(res[1]):
        un = unary_union([Polygon(f[0]) for f in fitted]).buffer(.01, join_style=2)
        un = max(un.geoms, key=lambda g: g.area) if un.geom_type == 'MultiPolygon' else un
        ring = np.array(Polygon(un.exterior).simplify(.02).exterior.coords)[:-1]
        pl = Polygon(ring)
    i = len(d['w']); d['w'].append([tag_yes])
    apply_parts(i, ring, fitted)
    polys[i] = pl; new_outlines[i] = ring; stats['new'] += 1; stats['parts'] += len(fitted)

overlaps = 0
items = list(polys.items())
for a in range(len(items)):
    for b in range(a + 1, len(items)):
        if items[a][1].distance(items[b][1]) == 0 and items[a][1].buffer(0).intersection(items[b][1].buffer(0)).area > 1:
            overlaps += 1
print(stats, 'overlapping pairs', overlaps)
c = np.array(checks)
print('parts', len(c), 'points within 50 cm of fitted roof: p10 p50 p90', np.round(np.percentile(c[:, 0], [10, 50, 90]), 2), '| model top minus scan top: p5 p50 p95', np.round(np.percentile(c[:, 1], [5, 50, 95]), 2), '| scan top above 15 m:', int((c[:, 2] > 15).sum()), 'above 25 m:', int((c[:, 2] > 25).sum()))
print('single-echo share p5 p10 p25 p50 p75: main parts', np.round(np.percentile(mains, [5, 10, 25, 50, 75]), 2), 'extra parts', np.round(np.percentile(extras, [5, 10, 25, 50, 75]), 2), 'n', len(mains), len(extras))

# overlap of old and new outlines with the roof mask (not independent: the new ones are traced from it)
def score(q):
    ox, oy = int(((q[:, 0] - x0) / R).min()) - 2, int(((y1 - q[:, 1]) / R).min()) - 2
    w_, h_ = int(((q[:, 0] - x0) / R).max()) + 4 - ox, int(((y1 - q[:, 1]) / R).max()) + 4 - oy
    F = raster(q, ox, oy, w_, h_); A = mask[oy:oy + h_, ox:ox + w_]
    if F.shape != A.shape or not F.any():
        return None
    return (F & A).sum() / (F | A).sum()


rows = [(area[i], fit_iou(Polygon(ways[i]).buffer(EAVE, join_style=2), assign == i), fit_iou(Polygon(new_outlines[i]).buffer(EAVE, join_style=2), assign == i)) for i in new_outlines if i in ways]
rows = [r for r in rows if r[1] is not None and r[2] is not None]
print('traced vs old overlap with LiDAR roof mask: old %.2f new %.2f' % (np.median([r[1] for r in rows]), np.median([r[2] for r in rows])))

s = '{' + ','.join(f'{json.dumps(k)}:{json.dumps(v, separators=(",", ":"), ensure_ascii=False)}' for k, v in d.items()) + '}'
open(out_html, 'w', encoding='utf-8').write(html[:m.start(2)] + s + html[m.end(2):])

# same window as measure.py: LiDAR roofs, old outlines yellow, new ones cyan
top = np.full((H, W), np.nan); o = np.argsort(roof_z); top[ry[o], rx[o]] = roof_z[o]
ctr = np.array([q.mean(0) for q in ways.values()]); gxc, gyc = np.median((ctr[:, 0] - x0) / R), np.median((y1 - ctr[:, 1]) / R)
sz = 600; cx0, cy0 = int(gxc - sz / 2), int(gyc - sz / 2); K = 3
tt = top[cy0:cy0 + sz, cx0:cx0 + sz]; lo, hi = np.nanpercentile(tt, 2), np.nanpercentile(tt, 99)
gg = np.nan_to_num((tt - lo) / (hi - lo), nan=-1)
rgb = np.where(gg[..., None] < 0, np.array([24, 26, 30]), np.stack([60 + 195 * gg.clip(0, 1), 90 + 150 * gg.clip(0, 1), 150 + 60 * gg.clip(0, 1)], -1)).astype('uint8')
base = Image.fromarray(rgb).resize((sz * K, sz * K), Image.NEAREST)
def draw(im, group, col):
    dr = ImageDraw.Draw(im)
    for q in group:
        c = [(((a - x0) / R - cx0) * K, ((y1 - b) / R - cy0) * K) for a, b in q]
        dr.line(c + c[:1], fill=col, width=3)
old = base.copy(); draw(old, ways.values(), (255, 210, 0))
new = base.copy(); draw(new, [np.array(p.exterior.coords)[:-1] for p in polys.values()], (0, 240, 255))
pair = Image.new('RGB', (sz * K * 2 + 20, sz * K), 'white'); pair.paste(old, (0, 0)); pair.paste(new, (sz * K + 20, 0)); pair.save(out_png)
