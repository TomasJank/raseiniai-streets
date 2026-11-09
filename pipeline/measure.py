import glob, json, re, sys
import numpy as np, laspy
from PIL import Image, ImageDraw
from pyproj import Transformer
from scipy import ndimage as ni

S = sys.argv[1]
las = laspy.read(glob.glob(f'{S}/lidar/**/*.la[sz]', recursive=True)[0])
x, y, z, c = np.asarray(las.x), np.asarray(las.y), np.asarray(las.z), np.asarray(las.classification)
x0, y0, x1, y1 = x.min(), y.min(), x.max(), y.max()
print('tile', round(x0), round(y0), round(x1), round(y1), 'points', len(x),
      'pts/m2 %.1f' % (len(x) / ((x1 - x0) * (y1 - y0))), 'classes', dict(zip(*np.unique(c, return_counts=True))))
b = c == 6
print('building pts/m2 of roof: see below')

R = .5
W, H = int((x1 - x0) / R) + 1, int((y1 - y0) / R) + 1
ix = ((x - x0) / R).astype(int); iy = ((y1 - y) / R).astype(int)
top = np.full((H, W), np.nan)
o = np.argsort(z[b])
top[iy[b][o], ix[b][o]] = z[b][o]
hit = ~np.isnan(top)
print('building cells hit share of closed area', end=' ')
B = ni.binary_opening(ni.binary_closing(hit, iterations=3), iterations=2)
print('%.2f' % (hit[B].mean()), 'roof pts/m2 %.1f' % (b.sum() / (B.sum() * R * R)))
lab, nlab = ni.label(B)

html = open(f'{S}/game/index.html', encoding='utf-8').read()
d = json.loads(re.search(r'id="rasData">(.*?)</script>', html, re.S).group(1))
tf = Transformer.from_crs(4326, 3346, always_xy=True)
n = d['n']
fp = []
for i, w in enumerate(d['w']):
    if 'building' not in d['t'][w[0]]:
        continue
    r = w[1:-1] if w[1] == w[-1] else w[1:]
    lon = [d['lon0'] + n[2 * k + 1] / 1e6 for k in r]
    lat = [d['lat0'] + n[2 * k] / 1e6 for k in r]
    X, Y = tf.transform(lon, lat)
    if min(X) < x0 + 15 or max(X) > x1 - 15 or min(Y) < y0 + 15 or max(Y) > y1 - 15:
        continue
    fp.append((i, [((a - x0) / R, (y1 - e) / R) for a, e in zip(X, Y)]))
print('footprints in tile', len(fp))


def raster(pts, ox, oy, w, h):
    im = Image.new('1', (w, h))
    ImageDraw.Draw(im).polygon([(p[0] - ox, p[1] - oy) for p in pts], fill=1)
    return np.array(im, bool)


res = []
used = set()
pad, M = 16, 10
for i, pts in fp:
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    ox, oy = int(min(xs)) - pad, int(min(ys)) - pad
    w, h = int(max(xs)) + pad - ox, int(max(ys)) + pad - oy
    if ox < 0 or oy < 0 or ox + w > W or oy + h > H:
        continue
    F = raster(pts, ox, oy, w, h)
    L = lab[oy:oy + h, ox:ox + w]
    ids, cnt = np.unique(L[F & (L > 0)], return_counts=True)
    keep = [a for a, k in zip(ids, cnt) if k > .25 * F.sum() or k > .5 * (L == a).sum()]
    used.update(int(a) for a in ids if a)
    A = np.isin(L, keep)
    area = F.sum() * R * R
    if not A.any():
        res.append((i, area, 0, 0, 0, 0, 0, len(pts), 0, 0, F, A))
        continue
    iou = (F & A).sum() / (F | A).sum()
    best, bs = -1, (0, 0)
    for dy in range(-M, M + 1):
        for dx in range(-M, M + 1):
            v = (np.roll(np.roll(F, dy, 0), dx, 1) & A).sum()
            if v > best:
                best, bs = v, (dx, dy)
    F2 = np.roll(np.roll(F, bs[1], 0), bs[0], 1)
    iou2 = (F2 & A).sum() / (F2 | A).sum()
    edge = A ^ ni.binary_erosion(A)
    dist = ni.distance_transform_edt(~edge) * R
    fedge = F2 ^ ni.binary_erosion(F2)
    res.append((i, area, iou, iou2, np.hypot(*bs) * R, np.median(dist[fedge]), np.percentile(dist[fedge], 90), len(pts), bs[0], bs[1], F, A))

meta = [(r[10], r[11]) for r in res]
sh = np.array([(r[8], r[9], r[2], r[1]) for r in res])
res = [r[:10] for r in res]
a = np.array(res)
g = sh[sh[:, 2] > .3]
print('best shift east m: median %.2f IQR %.2f..%.2f | north m: median %.2f IQR %.2f..%.2f' % (np.median(g[:,0])*R, *(np.percentile(g[:,0],[25,75])*R), -np.median(g[:,1])*R, *(-np.percentile(g[:,1],[75,25])*R)))
mx, my = int(np.median(g[:,0])), int(np.median(g[:,1]))
ious = np.array([(np.roll(np.roll(F, my, 0), mx, 1) & A).sum() / max(1, (np.roll(np.roll(F, my, 0), mx, 1) | A).sum()) for F, A in meta])
base = sh[:, 2] > 0
print('one shared shift for all buildings -> median overlap %.2f (was %.2f); below .7: %.0f%%' % (np.median(ious[base]), np.median(sh[base, 2]), (ious[base] < .7).mean()*100))
for lo, hi, nm in [(45, 120, '45-120'), (120, 300, '120-300'), (300, 1e9, '>300')]:
    q = base & (sh[:, 3] >= lo) & (sh[:, 3] < hi)
    print(' ', nm, 'east %.2f north %.2f overlap %.2f' % (np.median(sh[q,0])*R, -np.median(sh[q,1])*R, np.median(ious[q])))
print('total LiDAR building area m2', int(B.sum()*R*R))
real = a[a[:, 2] > 0]
area_all = a[:, 1]
print('footprints', len(a), 'no LiDAR building at all', (a[:, 2] == 0).sum())


def rep(g, name):
    print(f'{name}: n={len(g)} IoU median {np.median(g[:,2]):.2f} after-shift {np.median(g[:,3]):.2f} | shift median {np.median(g[:,4]):.1f} m p90 {np.percentile(g[:,4],90):.1f} | edge error median {np.median(g[:,5]):.2f} m p90-of-p90 {np.percentile(g[:,6],90):.1f} | IoU<.7: {(g[:,2]<.7).mean()*100:.0f}%')


rep(real, 'all')
for lo, hi, nm in [(0, 45, '<45'), (45, 120, '45-120'), (120, 300, '120-300'), (300, 1e9, '>300')]:
    rep(real[(real[:, 1] >= lo) & (real[:, 1] < hi)], nm)
miss = [k for k in range(1, nlab + 1) if k not in used]
sz = ni.sum(B, lab, miss) * R * R if miss else []
print('LiDAR building blobs', nlab, 'with no game outline', len(miss), '>=20 m2:', int((np.array(sz) >= 20).sum()), 'total area %.0f m2' % sum(a for a in sz if a >= 20))

# picture: LiDAR roof height with the game's outlines on top, around the densest 300 m square
G = np.zeros((H, W), bool)
ctr = np.array([np.mean(p, axis=0) for _, p in fp])
gx, gy = np.median(ctr[:, 0]), np.median(ctr[:, 1])
sz_ = 600
cx0, cy0 = int(gx - sz_ / 2), int(gy - sz_ / 2)
t = top[cy0:cy0 + sz_, cx0:cx0 + sz_]
lo, hi = np.nanpercentile(t, 2), np.nanpercentile(t, 99)
g = np.nan_to_num((t - lo) / (hi - lo), nan=-1)
rgb = np.where(g[..., None] < 0, np.array([24, 26, 30]), np.stack([60 + 195 * g.clip(0, 1), 90 + 150 * g.clip(0, 1), 150 + 60 * g.clip(0, 1)], -1)).astype('uint8')
K = 3
im = Image.fromarray(rgb).resize((sz_ * K, sz_ * K), Image.NEAREST)
dr = ImageDraw.Draw(im)
for i, pts in fp:
    q = [((p[0] - cx0) * K, (p[1] - cy0) * K) for p in pts]
    dr.line(q + q[:1], fill=(255, 210, 0), width=2)
im.save(f'{S}/compare.png')
print('picture window EPSG:3346', round(x0 + cx0 * R), round(y1 - cy0 * R))
print('worst big ones (way idx, area, IoU, shift):', [(int(r[0]), int(r[1]), round(r[2], 2), round(r[4], 1)) for r in sorted(real[real[:, 1] > 100].tolist(), key=lambda r: r[2])[:8]])
