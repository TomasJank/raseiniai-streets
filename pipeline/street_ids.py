"""Buildings along one named street, for the street agents (read-only).

usage: street_ids.py "Kalno g." [--page work/build/v37.html] [--within 45]

There is no addr:street in the data, so a building belongs to a street by distance from its bbox centre to the
street's highway centrelines. Projection is the game's own (buildWorld): origin at the centre of all buildings' bbox,
kx=111320*cos(lat0), kz=110540, x=(lon-lon0)*kx, z=-(lat-lat0)*kz. Ids are 'c'+index into rasData.w.
"""
import argparse, json, math, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'work', 'build', 'v37.html')
COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']


class Town:
    def __init__(self, page=PAGE):
        h = open(page, encoding='utf-8').read()
        a = h.index('id="rasData">') + len('id="rasData">')
        d = json.loads(h[a:h.index('</script>', a)])
        a = h.index('\nconst LOOK={')
        self.look = set(re.findall(r'\b(c\d+):\{', h[a:h.index('\n\n', a)]))
        n, la, lo = d['n'], d['lat0'], d['lon0']
        self.tags = [d['t'][w[0]] for w in d['w']]
        self.ll = [[(la + n[2 * k] / 1e6, lo + n[2 * k + 1] / 1e6) for k in w[1:]] for w in d['w']]
        self.refs = [w[1:] for w in d['w']]
        pool = [i for i, t in enumerate(self.tags) if t.get('building') and self.ll[i]]
        lats = [p[0] for i in pool for p in self.ll[i]]
        lons = [p[1] for i in pool for p in self.ll[i]]
        self.lat0, self.lon0 = (min(lats) + max(lats)) / 2, (min(lons) + max(lons)) / 2
        self.kx, self.kz = 111320 * math.cos(self.lat0 * math.pi / 180), 110540
        self.buildings = pool

    def xz(self, lat, lon):
        return (lon - self.lon0) * self.kx, -(lat - self.lat0) * self.kz

    def latlon(self, x, z):
        return self.lat0 - z / self.kz, self.lon0 + x / self.kx

    def street_ways(self, name):
        return [i for i, t in enumerate(self.tags) if t.get('highway') and t.get('name') == name]

    def street_names(self):
        return {t['name'] for t in self.tags if t.get('highway') and t.get('name')}

    def segments(self, ways):
        out = []
        for i in ways:
            p = [self.xz(*q) for q in self.ll[i]]
            out += [(p[k][0], p[k][1], p[k + 1][0], p[k + 1][1]) for k in range(len(p) - 1)]
        return out

    def centre(self, i):
        p = [self.xz(*q) for q in self.ll[i]]
        xs, zs = [q[0] for q in p], [q[1] for q in p]
        return (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2, max(xs) - min(xs), max(zs) - min(zs)


def seg_dist(x, z, s):
    dx, dz = s[2] - s[0], s[3] - s[1]
    t = max(0, min(1, ((x - s[0]) * dx + (z - s[1]) * dz) / (dx * dx + dz * dz or 1)))
    px, pz = s[0] + dx * t, s[1] + dz * t
    return math.hypot(x - px, z - pz), px, pz


def nearest(x, z, segs):
    return min((seg_dist(x, z, s) for s in segs), key=lambda r: r[0])


def along(T, name, within=45):
    """[(id, dist, side, x, z, w, d, tags)] for buildings within `within` m of the street, nearest first."""
    segs = T.segments(T.street_ways(name))
    if not segs:
        return []
    x0 = min(min(s[0], s[2]) for s in segs) - within
    x1 = max(max(s[0], s[2]) for s in segs) + within
    z0 = min(min(s[1], s[3]) for s in segs) - within
    z1 = max(max(s[1], s[3]) for s in segs) + within
    out = []
    for i in T.buildings:
        x, z, w, d = T.centre(i)
        if not (x0 < x < x1 and z0 < z < z1):
            continue
        dist, px, pz = nearest(x, z, segs)
        if dist <= within:
            side = COMPASS[round(math.degrees(math.atan2(x - px, pz - z)) / 45) % 8]
            out.append(('c%d' % i, dist, side, x, z, w, d, T.tags[i]))
    return sorted(out, key=lambda r: (r[1], int(r[0][1:])))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('street')
    ap.add_argument('--page', default=PAGE)
    ap.add_argument('--within', type=float, default=45)
    a = ap.parse_args()
    T = Town(a.page)
    ways = T.street_ways(a.street)
    if not ways:
        close = sorted(n for n in T.street_names() if n[:4].lower() == a.street[:4].lower())
        raise SystemExit('no highway named %r; similar: %s' % (a.street, ', '.join(close) or '-'))
    segs = T.segments(ways)
    print('%s: %d ways, %.0f m of centreline' % (a.street, len(ways), sum(math.hypot(s[2] - s[0], s[3] - s[1]) for s in segs)))
    for i in ways:
        t, p = T.tags[i], T.ll[i]
        L = sum(math.hypot(*(u - v for u, v in zip(T.xz(*p[k + 1]), T.xz(*p[k])))) for k in range(len(p) - 1))
        print('  way %d %s %.0f m  %.6f,%.6f -> %.6f,%.6f' % (i, t['highway'], L, *p[0], *p[-1]))
    mine = {r for i in ways for r in T.refs[i]}
    cross = {}
    for i, t in enumerate(T.tags):
        nm = t.get('name')
        if t.get('highway') and nm and nm != a.street:
            for k, r in enumerate(T.refs[i]):
                if r in mine:
                    cross.setdefault(nm, T.ll[i][k])
    print('crossings: ' + ('; '.join('%s @ %.6f,%.6f' % (n, *q) for n, q in sorted(cross.items())) or '-'))
    rows = along(T, a.street, a.within)
    print('%d buildings within %.0f m (* = already in LOOK, keep it)' % (len(rows), a.within))
    print('%-7s %-12s %-26s %-18s %11s %8s %8s %10s %10s %5s %4s' % ('id', 'kind', 'name', 'shop/amenity', 'w x d', 'x', 'z', 'lat', 'lon', 'dist', 'side'))
    for bid, dist, side, x, z, w, d, t in rows:
        lat, lon = T.latlon(x, z)
        print('%-7s %-12s %-26s %-18s %5.1fx%-5.1f %8.1f %8.1f %10.6f %10.6f %5.1f %4s' % (
            bid + ('*' if bid in T.look else ''), t.get('building', '')[:12], (t.get('name') or '')[:26],
            (t.get('shop') or t.get('amenity') or '')[:18], w, d, x, z, lat, lon, dist, side))


if __name__ == '__main__':
    main()
