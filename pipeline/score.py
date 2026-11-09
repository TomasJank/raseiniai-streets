"""Share of real roof points that land on the modelled buildings: outline and roof together.

usage: score.py tile.laz game.html [game.html ...]
Same test for every version, so old and new compare fairly.
"""
import json, re, sys, collections
import numpy as np, laspy
from pyproj import Transformer
from scipy import ndimage as ni
from shapely import contains_xy
from shapely.geometry import Polygon

las = laspy.read(sys.argv[1])
X, Y, Z, C = np.asarray(las.x), np.asarray(las.y), np.asarray(las.z), np.asarray(las.classification)
x0, y0, x1, y1 = X.min(), Y.min(), X.max(), Y.max()
G = 2.0
nx, ny = int((x1 - x0) / G) + 1, int((y1 - y0) / G) + 1
gi = (((y1 - Y[C == 2]) / G).astype(int), ((X[C == 2] - x0) / G).astype(int))
gs = np.zeros((ny, nx)); gc = np.zeros((ny, nx))
np.add.at(gs, gi, Z[C == 2]); np.add.at(gc, gi, 1)
dtm = (gs / np.maximum(gc, 1))[tuple(ni.distance_transform_edt(gc == 0, return_distances=False, return_indices=True))]

M = 30  # keep clear of the tile edge, where buildings are cut off
keep = (C == 6) & (X > x0 + M) & (X < x1 - M) & (Y > y0 + M) & (Y < y1 - M)
px, py, pz = X[keep], Y[keep], Z[keep]
CELL = 25.
bins = collections.defaultdict(list)
for i, k in enumerate(zip((px // CELL).astype(int), (py // CELL).astype(int))):
    bins[k].append(i)
bins = {k: np.array(v) for k, v in bins.items()}
tf = Transformer.from_crs(4326, 3346, always_xy=True)


def near(minx, miny, maxx, maxy):
    a = [bins[(i, j)] for i in range(int(minx // CELL), int(maxx // CELL) + 1) for j in range(int(miny // CELL), int(maxy // CELL) + 1) if (i, j) in bins]
    return np.concatenate(a) if a else np.array([], int)


def score(path):
    d = json.loads(re.search(r'id="rasData">(.*?)</script>', open(path, encoding='utf-8').read(), re.S).group(1))
    n, la, lo = d['n'], d['lat0'], d['lon0']
    world = lambda c: np.c_[tf.transform([lo + q[1] / 1e6 for q in c], [la + q[0] / 1e6 for q in c])]
    best = np.full(len(px), np.inf)
    covered = np.zeros(len(px), bool)

    def apply(q, ground, kind, h, r):
        pl = Polygon(q).buffer(.5, join_style=2)
        mnx, mny, mxx, mxy = pl.bounds
        idx = near(mnx, mny, mxx, mxy)
        if not len(idx):
            return
        idx = idx[contains_xy(pl, px[idx], py[idx])]
        if not len(idx):
            return
        covered[idx] = True
        z = pz[idx] - ground
        if kind == 0 or len(q) != 4:
            model = np.full(len(idx), h)
        else:
            u = q[1] - q[0]; A = np.hypot(*u); u = u / A
            v = q[2] - q[1]; B = np.hypot(*v); v = v / B
            p = np.c_[px[idx], py[idx]]
            s, t = np.clip((p - q[0]) @ u, 0, A), np.clip((p - q[1]) @ v, 0, B)
            if kind == 1:
                f = 1 - np.abs(2 * t / B - 1)
            elif kind == 2:
                f = 1 - np.abs(2 * s / A - 1)
            elif kind == 3:
                f = np.minimum(np.minimum(s, A - s), np.minimum(t, B - t)) / (min(A, B) / 2)
            else:
                f = s / A if kind == 4 else t / B
                model = h + abs(r) / 2 + r * (f - .5)
            if kind < 4:
                model = h + r * f
        best[idx] = np.minimum(best[idx], np.abs(z - model))

    for i, w in enumerate(d['w']):
        if 'building' not in d['t'][w[0]] or len(w) < 4 or w[1] != w[-1]:
            continue
        q = np.c_[tf.transform([lo + n[2 * k + 1] / 1e6 for k in w[1:-1]], [la + n[2 * k] / 1e6 for k in w[1:-1]])]
        if q[:, 0].max() < x0 or q[:, 0].min() > x1 or q[:, 1].max() < y0 or q[:, 1].min() > y1:
            continue
        gy = np.clip(((y1 - q[:, 1]) / G).astype(int), 0, ny - 1); gx = np.clip(((q[:, 0] - x0) / G).astype(int), 0, nx - 1)
        g = float(np.median(dtm[gy, gx]))
        s = str(i)
        if s in d['lp']:
            for part in d['lp'][s]:
                apply(world(part[0]), g, part[1], part[2], part[3])
        elif s in d['lr'] and len(q) == 4:
            R = d['lr'][s]
            apply(q, g, R[0], R[1], R[2])
        elif s in d.get('lh', {}):
            L = d['lh'][s]
            rise = min(max(2 * (L[0] - L[1]), 0), 9)
            if len(q) == 4 and rise >= 1.2:
                apply(q, g, 1 if np.hypot(*(q[1] - q[0])) >= np.hypot(*(q[2] - q[1])) else 2, L[0] - rise, rise)
            else:
                apply(q, g, 0, (L[0] + L[1]) / 2 if len(q) == 4 else L[1], 0)
    tot = len(px)
    return dict(points=tot, inside_a_building=round(covered.mean() * 100, 1),
                within_50cm=round((best < .5).mean() * 100, 1), within_1m=round((best < 1).mean() * 100, 1),
                outside=round((~covered).mean() * 100, 1))


for f in sys.argv[2:]:
    print(f.rsplit('/', 1)[-1], score(f))
