"""Roof shape per four-corner building from Lidar_DR_LT roof points: flat, gable (ridge direction) or hip, plus chimneys.

usage: roofs.py SCRATCH tile.laz [tile.laz ...]
writes work/roofs.json: {way index: [type, wall h, rise, [[dlat, dlon, top], ...]]}
type 0 flat, 1 gable with ridge along edge 0->1, 2 gable with ridge along edge 1->2, 3 hip
"""
import json, re, sys
import numpy as np, laspy
from pyproj import Transformer
from rasterio.features import rasterize
from rasterio.transform import from_origin
from scipy import ndimage

S, tiles = sys.argv[1], sys.argv[2:]
TX0, TY0, TX1, TY1 = 441400, 6135650, 447050, 6141100
CS, RS = 2.0, 0.5

html = open(f'{S}/work/game.html', encoding='utf-8').read()
d = json.loads(re.search(r'id="rasData">(.*?)</script>', html, re.S).group(1))
n = d['n']
to_lks = Transformer.from_crs(4326, 3346, always_xy=True)
to_ll = Transformer.from_crs(3346, 4326, always_xy=True)

rw, rh = int((TX1 - TX0) / RS), int((TY1 - TY0) / RS)
shapes, quads = [], {}
for i, w in enumerate(d['w']):
    t = d['t'][w[0]]
    if not t.get('building') or t['building'] == 'no' or w[1] != w[-1] or len(w) != 6:
        continue
    lon = [d['lon0'] + n[2 * k + 1] / 1e6 for k in w[1:5]]
    lat = [d['lat0'] + n[2 * k] / 1e6 for k in w[1:5]]
    xs, ys = to_lks.transform(lon, lat)
    quads[i] = np.c_[xs, ys]
    shapes.append(({'type': 'Polygon', 'coordinates': [list(zip(xs, ys)) + [(xs[0], ys[0])]]}, i + 1))
ids = rasterize(shapes, out_shape=(rh, rw), transform=from_origin(TX0, TY1, RS, RS), fill=0, dtype='int32')

nx, ny = int((TX1 - TX0) / CS), int((TY1 - TY0) / CS)
gsum = np.zeros(nx * ny); gcnt = np.zeros(nx * ny)
keep = []
for path in tiles:
    with laspy.open(path) as f:
        for ch in f.chunk_iterator(5_000_000):
            c = np.asarray(ch.classification)
            x, y, z = np.asarray(ch.x), np.asarray(ch.y), np.asarray(ch.z)
            inb = (x > TX0) & (x < TX1) & (y > TY0) & (y < TY1)
            m = (c == 2) & inb
            k = ((TY1 - y[m]) / CS).astype(int) * nx + ((x[m] - TX0) / CS).astype(int)
            gsum += np.bincount(k, z[m], minlength=nx * ny); gcnt += np.bincount(k, minlength=nx * ny)
            m = (c == 6) & inb
            b = ids[((TY1 - y[m]) / RS).astype(int), ((x[m] - TX0) / RS).astype(int)] - 1
            sel = b >= 0
            keep.append(np.c_[b[sel], x[m][sel] - TX0, y[m][sel] - TY0, z[m][sel]].astype('float64'))
    print(path, flush=True)
B = np.concatenate(keep); del keep
cnt = gcnt.reshape(ny, nx)
dtm = gsum.reshape(ny, nx) / np.maximum(cnt, 1)
idx = ndimage.distance_transform_edt(cnt == 0, return_distances=False, return_indices=True)
dtm = dtm[tuple(idx)]; del idx

B = B[np.argsort(B[:, 0], kind='stable')]
bid = B[:, 0].astype(int)
starts = np.r_[0, np.flatnonzero(np.diff(bid)) + 1]


def fit(f, z):
    A = np.c_[np.ones_like(z), f]
    ok = np.ones(len(z), bool)
    for _ in range(3):  # drop chimneys, antennas and overhanging branches
        (h, r), *_ = np.linalg.lstsq(A[ok], z[ok], rcond=None)
        res = z - h - r * f
        ok = np.abs(res) < 0.6
        if ok.sum() < 8:
            ok = np.abs(res) < np.abs(res).max()
    return h, r, float(np.sqrt(np.mean(res[ok] ** 2))), res


out, types = {}, [0, 0, 0, 0]
for s0, s1 in zip(starts, np.r_[starts[1:], len(bid)]):
    i = int(bid[s0])
    if s1 - s0 < 20:
        continue
    q = quads[i] - [TX0, TY0]
    gx = np.clip((q[:, 0] / CS).astype(int), 0, nx - 1); gy = np.clip(((TY1 - TY0 - q[:, 1]) / CS).astype(int), 0, ny - 1)
    ground = float(np.median(dtm[gy, gx]))
    P, z = B[s0:s1, 1:3], B[s0:s1, 3] - ground
    u = q[1] - q[0]; A_ = np.hypot(*u); u /= A_
    v = q[2] - q[1]; B_ = np.hypot(*v); v /= B_
    s = np.clip((P - q[0]) @ u, 0, A_); t = np.clip((P - q[1]) @ v, 0, B_)
    W = min(A_, B_)
    models = {
        1: 1 - np.abs(2 * t / B_ - 1),
        2: 1 - np.abs(2 * s / A_ - 1),
        3: np.minimum(np.minimum(s, A_ - s), np.minimum(t, B_ - t)) / (W / 2),
    }
    flat_h = float(np.median(z)); flat_rms = float(np.sqrt(np.mean((z - flat_h) ** 2)))
    fits = {k: fit(f, z) for k, f in models.items()}
    k = min(fits, key=lambda k: fits[k][2])
    h, r, rms, res = fits[k]
    if r < 1.0 or flat_rms < rms * 1.3 or h < 1.8:
        k, h, r, res = 0, flat_h, 0.0, z - flat_h
    span = A_ if k == 2 else B_ if k == 1 else W
    r = min(r, span * 0.9)
    edge = np.minimum(np.minimum(s, A_ - s), np.minimum(t, B_ - t))
    hi = (res > 0.8) & (res < 4) & (edge > 0.6)
    chim = []
    if hi.sum() >= 3:
        cell = np.floor(P[hi] / 0.5).astype(int)
        cell -= cell.min(0)
        grid = np.zeros(cell.max(0) + 1, int)
        np.add.at(grid, (cell[:, 0], cell[:, 1]), 1)
        lab, nl = ndimage.label(grid > 0)
        for L in range(1, nl + 1):
            m = lab[cell[:, 0], cell[:, 1]] == L
            if m.sum() >= 3 and (lab == L).sum() <= 6:
                cx, cy = P[hi][m].mean(0) + [TX0, TY0]
                lon, lat = to_ll.transform(cx, cy)
                chim.append([round((lat - d['lat0']) * 1e6), round((lon - d['lon0']) * 1e6), round(float(np.percentile(z[hi][m], 95)), 1)])
        chim = sorted(chim, key=lambda c: -c[2])[:2]
    types[k] += 1
    out[i] = [k, round(float(max(2.2, h)), 1), round(float(r), 1)] + ([chim] if chim else [])

print('roofs', len(out), 'of', len(quads), 'flat/gable0/gable1/hip', types, 'with chimneys', sum(len(v) > 3 for v in out.values()))
for i in (1583, 1594, 1588):
    print(i, out.get(i))
json.dump(out, open(f'{S}/work/roofs.json', 'w'), separators=(',', ':'))
