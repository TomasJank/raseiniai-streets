"""camshots.mjs views square-on and at 45 degrees to a house's walls: sqviews.py out.json c2462:front c2466:front:right ...
name: front/back/left/right or an edge index; camera 1.4 m up, far enough to frame the wall"""
import json, math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
from street_ids import Town  # noqa: E402
from add_kit import edges, segs_of, side_map  # noqa: E402
T = Town(); segs = segs_of(T); out = []
for arg in sys.argv[2:]:
    bid, *names = arg.split(':')
    E = edges(T, bid, segs); S = side_map(E)
    p = [T.xz(*q) for q in T.ll[int(bid[1:])]][:-1]
    for nm in names:
        i = S[nm] if nm in S else int(nm)
        a, b = p[i], p[(i + 1) % len(p)]; n = E[i][1]; L = E[i][0]
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); D = max(14, L * 1.3)
        u = ((b[0] - a[0]) / L, (b[1] - a[1]) / L)
        for tag, k in (('sq', 0), ('l45', -1), ('r45', 1)):
            c = (m[0] + n[0] * D * (1 if k == 0 else .72) + u[0] * k * D * .72, m[1] + n[1] * D * (1 if k == 0 else .72) + u[1] * k * D * .72)
            head = math.degrees(math.atan2(m[0] - c[0], -(m[1] - c[1]))) % 360
            out.append({'bid': bid, 'frame': '%s_%s' % (nm, tag), 'x': c[0], 'z': c[1], 'head': head, 'w': 800, 'h': 600, 'f': 700})
json.dump(out, open(sys.argv[1], 'w'), indent=0)
