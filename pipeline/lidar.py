"""Per-building heights, roof rise and roof colour from Lidar_DR_LT tiles; LiDAR ground for the terrain grid.

usage: lidar.py SCRATCH tile.laz [tile.laz ...]
"""
import json, re, sys
import numpy as np, laspy
from pyproj import Transformer
from rasterio.features import rasterize
from rasterio.transform import from_origin
from scipy import ndimage

S, tiles = sys.argv[1], sys.argv[2:]
X0, Y0, X1, Y1 = 439400, 6133700, 449040, 6143060  # game ground plane in LKS-94 (EPSG:3346)
TX0, TY0, TX1, TY1 = 441400, 6135650, 447050, 6141100  # buildings live in here
CS, RS = 2.0, 1.0  # ground cell, footprint raster cell (m)

html = open(f'{S}/work/game.html', encoding='utf-8').read()
d = json.loads(re.search(r'id="rasData">(.*?)</script>', html, re.S).group(1))
n = d['n']
to_lks = Transformer.from_crs(4326, 3346, always_xy=True)

rw, rh = int((TX1 - TX0) / RS), int((TY1 - TY0) / RS)
shapes, ways = [], {}
for i, w in enumerate(d['w']):
    t = d['t'][w[0]]
    if not t.get('building') or t['building'] == 'no' or w[1] != w[-1] or len(w) < 5:
        continue
    lon = [d['lon0'] + n[2 * kk + 1] / 1e6 for kk in w[1:]]
    lat = [d['lat0'] + n[2 * kk] / 1e6 for kk in w[1:]]
    xs, ys = to_lks.transform(lon, lat)
    ways[i] = (np.array(xs), np.array(ys))
    shapes.append(({'type': 'Polygon', 'coordinates': [list(zip(xs, ys))]}, i + 1))
ids = rasterize(shapes, out_shape=(rh, rw), transform=from_origin(TX0, TY1, RS, RS), fill=0, dtype='int32')

nx, ny = int((X1 - X0) / CS), int((Y1 - Y0) / CS)
gsum = np.zeros(nx * ny); gcnt = np.zeros(nx * ny)
keep, has_rgb = [], False
for path in tiles:
    with laspy.open(path) as f:
        h = f.header
        has_rgb = 'red' in h.point_format.dimension_names
        print(path, 'points', h.point_count, 'format', h.point_format.id, 'rgb', has_rgb, 'bounds', h.mins.round(0), h.maxs.round(0), flush=True)
        for ch in f.chunk_iterator(5_000_000):
            c = np.asarray(ch.classification)
            x, y, z = np.asarray(ch.x), np.asarray(ch.y), np.asarray(ch.z)
            m = (c == 2) & (x > X0) & (x < X1) & (y > Y0) & (y < Y1)
            k = ((Y1 - y[m]) / CS).astype(int) * nx + ((x[m] - X0) / CS).astype(int)
            gsum += np.bincount(k, z[m], minlength=nx * ny); gcnt += np.bincount(k, minlength=nx * ny)
            m = (c == 6) & (x > TX0) & (x < TX1) & (y > TY0) & (y < TY1)
            b = ids[((TY1 - y[m]) / RS).astype(int), ((x[m] - TX0) / RS).astype(int)] - 1
            sel = b >= 0
            cols = [b[sel].astype('float64'), z[m][sel]]
            if has_rgb:
                cols += [np.asarray(ch.red)[m][sel], np.asarray(ch.green)[m][sel], np.asarray(ch.blue)[m][sel]]
            keep.append(np.c_[tuple(cols)])
B = np.concatenate(keep); del keep
print('ground hits', int(gcnt.sum()), 'roof points on OSM buildings', len(B), flush=True)

cnt = gcnt.reshape(ny, nx)
dtm = gsum.reshape(ny, nx) / np.maximum(cnt, 1)
covered = ndimage.binary_closing(cnt > 0, iterations=15)
idx = ndimage.distance_transform_edt(cnt == 0, return_distances=False, return_indices=True)
dtm = dtm[tuple(idx)]; del idx
print('dtm range', dtm[covered].min().round(1), dtm[covered].max().round(1), 'coverage', covered.mean().round(3), flush=True)

B = B[np.argsort(B[:, 0], kind='stable')]
bid = B[:, 0].astype(int)
starts = np.r_[0, np.flatnonzero(np.diff(bid)) + 1]
out = {}
for s0, s1 in zip(starts, np.r_[starts[1:], len(bid)]):
    i = int(bid[s0])
    if s1 - s0 < 12:
        continue
    xs, ys = ways[i]
    gx = np.clip(((xs - X0) / CS).astype(int), 0, nx - 1); gy = np.clip(((Y1 - ys) / CS).astype(int), 0, ny - 1)
    ground = float(np.median(dtm[gy, gx]))
    z = B[s0:s1, 1] - ground
    top, med, mx = np.percentile(z, 97), np.percentile(z, 50), np.percentile(z, 99.7)
    if top < 1.5:
        continue
    rec = [round(float(top), 1), round(float(med), 1), round(float(mx), 1)]
    if has_rgb:
        rgb = np.median(B[s0:s1, 2:5], axis=0)
        rgb = rgb / (256 if rgb.max() > 255 else 1)
        rec.append('%02x%02x%02x' % tuple(int(min(255, v)) for v in rgb))
    out[i] = rec
print('buildings with LiDAR', len(out), 'of', len(ways))
tops = sorted(v[0] for v in out.values())
print('top quantiles', [tops[int(len(tops) * q)] for q in (.1, .25, .5, .75, .9, .99)], 'max', tops[-1])
json.dump(out, open(f'{S}/work/lidar_heights.json', 'w'), separators=(',', ':'))

# terrain grid: replace Copernicus values with LiDAR ground where covered
dem = json.load(open(f'{S}/work/dem.json'))
lat = np.linspace(dem['n'], dem['s'], dem['ny']); lon = np.linspace(dem['w'], dem['e'], dem['nx'])
LO, LA = np.meshgrid(lon, lat)
X, Y = to_lks.transform(LO, LA)
cx, cy = (X - X0) / CS, (Y1 - Y) / CS
ok = (cx >= 0) & (cx < nx - 1) & (cy >= 0) & (cy < ny - 1)
smooth = ndimage.uniform_filter(dtm, 15)  # 30 m average so one 60 m sample is representative
lid = ndimage.map_coordinates(smooth, [cy.clip(0, ny - 1), cx.clip(0, nx - 1)], order=1)
cov = ndimage.map_coordinates(covered.astype(float), [cy.clip(0, ny - 1), cx.clip(0, nx - 1)], order=1) > .99
old = np.array(dem['v'], float).reshape(dem['ny'], dem['nx']) / 10 + dem['z0']
use = ok & cov
print('terrain cells from LiDAR', int(use.sum()), 'of', use.size, 'mean diff vs Copernicus', (lid[use] - old[use]).mean().round(2))
new = np.where(use, lid, old)
dem['z0'] = float(np.floor(new.min()))
dem['v'] = [int(round((v - dem['z0']) * 10)) for v in new.ravel()]
json.dump(dem, open(f'{S}/work/dem_lidar.json', 'w'), separators=(',', ':'))
