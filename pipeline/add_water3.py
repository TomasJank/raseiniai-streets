"""Water3: the cadastre's (GRPK) ponds, islands and wider streams replace the hand-traced water; one matte surface, no mirror planes; drowning on foot, every car sinks.
usage: add_water3.py page.html   (edits in place; run after add_sounds.py, the last step)
"""
import json, math, os, sys
here = os.path.dirname(os.path.abspath(__file__))
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'water3.js'), encoding='utf-8').read()
g = json.load(open(os.path.join(here, 'geo', 'grpk.json'), encoding='utf-8'))

# play area of the v37 base (building bbox plus 260 m)
BOX = (-2806.7, -2784.9, 2806.7, 2784.9)
MIN_AREA = 60      # m2 of pond
MIN_WIDTH = 8      # PLOTIS (m) of a stream drawn unless it is named
WATER_SHARE = .45  # drawn width as a share of PLOTIS: the cadastre gives the channel, not the water


def inbox(q):
    return BOX[0] < q[0] < BOX[2] and BOX[1] < q[1] < BOX[3]


def rdp(p, e):
    if len(p) < 3:
        return p
    a, b = p[0], p[-1]
    dx, dz = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dz) or 1e-9
    m, i = 0, 0
    for k in range(1, len(p) - 1):
        d = abs((p[k][0] - a[0]) * dz - (p[k][1] - a[1]) * dx) / n
        if d > m:
            m, i = d, k
    return rdp(p[:i + 1], e)[:-1] + rdp(p[i:], e) if m > e else [a, b]


def ring(r, e=.25):
    i = max(range(len(r)), key=lambda k: math.hypot(r[k][0] - r[0][0], r[k][1] - r[0][1]))
    return rdp(r[:i + 1], e)[:-1] + rdp(r[i:] + [r[0]], e)[:-1]


def pip(x, z, p):
    c = False
    for i in range(len(p)):
        a, b = p[i], p[i - 1]
        if (a[1] > z) != (b[1] > z) and x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]:
            c = not c
    return c


def flat(r):
    return [round(v, 1) for q in r for v in q]


bodies = []
for w in g['water']:
    if w['SHAPE_Area'] < MIN_AREA or not any(inbox(q) for q in w['rings'][0]):
        continue
    parts = []
    for r in w['rings']:
        r = ring(r)
        host = next((p for p in parts if pip(r[0][0], r[0][1], p[0])), None)
        host[1].append(r) if host else parts.append((r, []))
    bodies += [[flat(o)] + [flat(x) for x in hs] for o, hs in parts]

streams = []
for s in g['streams']:
    pl = s.get('PLOTIS') or 0
    if not (pl >= MIN_WIDTH or (s.get('VARDAS') and (pl >= 3 or not pl))):
        continue
    for p in s['paths']:
        if any(inbox(q) for q in p):
            streams.append([round(max(2.5, (pl or 6) * WATER_SHARE), 1), flat(rdp(p, 1))])

data = json.dumps({'b': bodies, 's': streams}, separators=(',', ':'))


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("function buildExtra(){", js.replace('/*WATER3_DATA*/null', data) + "function buildExtra(){")
rep("  for(const A of [RD,MK,GR])if(A.pos.length){", "  water3Build(WA,GR,mm,W,GY);\n  for(const A of [RD,MK,GR])if(A.pos.length){")
rep("  W.map={canvas:mc,mpp};", "  for(const b of W.w3)for(const r of b.H)poly(r,'#26402d');\n  W.map={canvas:mc,mpp};")
rep("const WATER2={planes:!PHONE,", "const WATER2={planes:false,")
rep("for(const p of W.water||[]){if(!pip(x,z,p))continue;const o=(W.ponds||[]).find(q=>q.p===p);if(!o||!o.H.some(r=>pip(x,z,r)))return true;}",
    "if(water3At(x,z))return true;")
open(path, 'w', encoding='utf-8').write(h)
print('water3 ok: %d ponds, %d stream lines, %d KB data' % (len(bodies), len(streams), len(data) // 1024))
