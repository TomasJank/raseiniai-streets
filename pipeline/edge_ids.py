"""Outline edges of buildings, for the `faces` look key (read-only).

usage: edge_ids.py c4185 [c4161 ...] [--page work/build/v37.html]

Edge i runs from outline vertex i to vertex i+1 in the order of the OSM way. `side` is the compass side the wall faces,
`road` the metres from the wall's middle to the nearest street centreline (0..99, smaller = the front wall).
"""
import argparse, math
from street_ids import PAGE, Town, COMPASS, nearest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ids', nargs='+')
    ap.add_argument('--page', default=PAGE)
    a = ap.parse_args()
    T = Town(a.page)
    segs = [s for i, t in enumerate(T.tags) if t.get('highway') and t.get('name') for s in T.segments([i])]
    for bid in a.ids:
        i = int(bid[1:])
        p = [T.xz(*q) for q in T.ll[i]][:-1]
        area = sum(p[k][0] * p[(k + 1) % len(p)][1] - p[(k + 1) % len(p)][0] * p[k][1] for k in range(len(p))) / 2
        print('%s: %d edges' % (bid, len(p)))
        for k, u in enumerate(p):
            v = p[(k + 1) % len(p)]
            dx, dz = v[0] - u[0], v[1] - u[1]
            L = math.hypot(dx, dz)
            nx, nz = (dz, -dx) if area > 0 else (-dz, dx)
            side = COMPASS[round(math.degrees(math.atan2(nx, -nz)) / 45) % 8]
            road = nearest((u[0] + v[0]) / 2, (u[1] + v[1]) / 2, segs)[0]
            print('  edge %d  %5.1f m  faces %-2s  road %3.0f m' % (k, L, side, min(road, 99)))


if __name__ == '__main__':
    main()
