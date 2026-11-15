"""shots.mjs views of each house: the four sides square-on and the street side from across the road at eye level.
usage: views.py out.json c2462:1 c2463 ...   (`:N` = the front edge when the automatic one is wrong)"""
import json, math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
from street_ids import Town  # noqa: E402
from add_kit import edges, segs_of, side_map  # noqa: E402
T = Town(); segs = segs_of(T); out = []
for arg in sys.argv[2:]:
    bid, *fr = arg.split(':')
    E = edges(T, bid, segs); S = side_map(E, int(fr[0]) if fr else None)
    p = [T.xz(*q) for q in T.ll[int(bid[1:])]][:-1]
    for nm in ('front', 'left', 'right', 'back', 'street'):
        i = S['front' if nm == 'street' else nm]
        a, b = p[i], p[(i + 1) % len(p)]; n = E[i][1]; L = E[i][0]
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        D = E[i][2] + 6 if nm == 'street' else max(13, L * 1.3)
        c = (m[0] + n[0] * D, m[1] + n[1] * D)
        head = math.degrees(math.atan2(m[0] - c[0], -(m[1] - c[1]))) % 360
        out.append({'bid': bid, 'frame': nm, 'x': c[0], 'z': c[1], 'head': head, 'w': 800, 'h': 600, 'f': 560 if nm == 'street' else 620,
                    'lift': 1.6 if nm == 'street' else 3.5, 'ty': 2.6 if nm == 'street' else 3.2, 'dist': D})
json.dump(out, open(sys.argv[1], 'w'), indent=0)
