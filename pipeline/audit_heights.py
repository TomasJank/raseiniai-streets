"""Described houses against the LiDAR the page carries: which street-file looks contradict the measured height or roof.
usage: audit_heights.py page.html [out.json]   (reads rasData from the page and pipeline/streets/*.json; prints a table)
A look is flagged when its mid-roof height (h + half the roof rise) differs from the LiDAR mid-roof height by more than 2 m.
"""
import glob, json, os, sys

page = sys.argv[1]
h = open(page, encoding='utf-8').read()
i = h.index('id="rasData">') + 13
d = json.loads(h[i:h.index('</script>', i)])
here = os.path.dirname(os.path.abspath(__file__))


def measured(k):
    """What buildWorld derives when no look overrides it: (eaves, rise, mid-roof height, source), or None.
    The mid-roof height is the robust number: for the plain LiDAR table it is the median of the roof points, which a tree
    over the roof or a chimney does not move, while the top does."""
    sk, R, L = d['sk'].get(k), d['lr'].get(k), d['lh'].get(k)
    npts = len(d['w'][int(k)]) - 2
    if sk:
        return sk[0] / 10, 2.0, (L[1] if L else sk[0] / 10 + 1.0), 'skeleton'
    if R and npts == 4:
        rise = R[2] if R[0] in (1, 2, 3) else 0
        return R[1], rise, R[1] + rise / 2, 'roof fit'
    if L:
        rise = max(0, min(9, 2 * (L[0] - L[1])))
        if rise >= 1.2 and npts == 4:
            return max(2.4, L[0] - rise), rise, L[1], 'lidar'
        return max(2.4, (L[0] + L[1]) / 2 if npts == 4 else L[1]), 0, L[1], 'lidar'
    return None


rows, nolidar, n = [], [], 0
for f in sorted(glob.glob(os.path.join(here, 'streets', '*.json'))):
    slug = os.path.basename(f)[:-5]
    if slug.startswith('_'):
        continue
    for bid, look in json.load(open(f)).get('looks', {}).items():
        if 'h' not in look:
            continue
        n += 1
        m = measured(bid[1:])
        if not m:
            nolidar.append((slug, bid, look['h']))
            continue
        ev, mrise, mid, src = m
        pitched = look['pitched'] if 'pitched' in look else ('rh' in look or mrise > 0)
        rise = look.get('rh', mrise if mrise > 0 else 2.5) if pitched else 0
        lmid = look['h'] + rise / 2
        st, mst = max(1, round(look['h'] / 3)), max(1, round(max(2.4, mid - mrise / 2) / 3))
        if abs(lmid - mid) > 2.0:
            rows.append(dict(street=slug, id=bid, look_h=look['h'], look_mid=round(lmid, 1), lidar_mid=round(mid, 1), lidar_eaves=round(ev, 1), storeys=st, lidar_storeys=mst, src=src, diff=round(lmid - mid, 1)))
rows.sort(key=lambda r: -abs(r['diff']))
print('%d looks set a height; %d differ from LiDAR by more than 2 m at mid-roof; %d have no LiDAR to check against' % (n, len(rows), len(nolidar)))
for r in rows:
    print('%-16s %-6s look h %4.1f (mid %4.1f, %d st) | lidar mid %4.1f eaves %4.1f (%d st, %s) | %+.1f m' % (r['street'], r['id'], r['look_h'], r['look_mid'], r['storeys'], r['lidar_mid'], r['lidar_eaves'], r['lidar_storeys'], r['src'], r['diff']))
if len(sys.argv) > 2:
    json.dump(dict(flagged=rows, nolidar=nolidar), open(sys.argv[2], 'w'), indent=1)
