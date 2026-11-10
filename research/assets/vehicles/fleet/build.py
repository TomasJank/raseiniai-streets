"""Fleet build: downloaded vehicle GLBs -> one small GLB per game model (pipeline/cars2.js reads them synchronously).

usage (from research/assets/vehicles):  python3 -I fleet/build.py fleet/built [key ...]

Each output GLB has four meshes, all in car-local metres (+z nose, y up, ground at y=0, centred in x and z):
  paint  body panels, vertex colour = shade (white = full body colour; the game's material tints it)
  trim   glass, plastic, chrome, lights' surrounds: final vertex colours, drawn with the game's trimM
  lamps  head lamps (z>0) and tail lamps (z<0), unlit
  wheel  ONE wheel centred on its hub, axle along x, outer face at +x (left wheels are this rotated 180 deg about y)
and four empty hub nodes (wheel_fl, wheel_fr, wheel_rl, wheel_rr). extras: {r (wheel radius), axles [zf, zr], track, dims}.
Positions are int16 millimetres (node scale .001, KHR_mesh_quantization), normals int8, colours uint8, indices uint16.
"""
import json, math, os, struct, sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glb

GLASS, BLACK, PLASTIC, CHROME, HEAD, TAIL = (.13, .17, .2), (.035, .035, .04), (.14, .14, .15), (.62, .63, .64), (.95, .93, .82), (.77, .125, .165)


def near(c, ref, tol=.06):
    return max(abs(c[i] - ref[i]) for i in range(3)) < tol


def quat(names):
    """Quaternius Cars Pack material table -> class"""
    def f(t):
        m = t['mat']
        if m in names:
            return names[m]
        return {'Windows': 'glass', 'Black': ('trim', BLACK), 'Grey': ('trim', PLASTIC), 'Headlights': 'lamp', 'TailLights': 'lamp'}.get(m, ('trim', t['c'][0]))
    return f


def zombie(paint):
    def f(t):
        if t['mat'] in ('Headlights', 'BrakeLight'):
            return 'lamp'
        if any(near(t['c'][0], p, .03) for p in paint):
            return ('paint', 1)
        return ('trim', t['c'][0])
    return f


def google(t):
    c = t['c'][0]
    if near(c, (0, .46, .7)):
        return ('paint', 1)
    if near(c, (.75, .92, 1)):
        return 'glass'
    if near(c, (1, .6, .08)):
        return 'lamp'
    if near(c, (.93, .93, .93)):
        return 'lamp?'
    if near(c, (.5, .5, .5)):
        return ('trim', CHROME)
    return ('trim', PLASTIC if c[0] > .1 else BLACK)


def van(t):
    m = t['mat']
    if m == 'bodywork':
        return ('paint', 1)
    if m == 'glass':
        return 'glass'
    if m in ('front_lights', 'back_lights'):
        return 'lamp'
    if m == 'front_lights_down':
        return ('trim', (.86, .36, .07))
    if m in ('front_plate', 'back_plate.001'):
        return ('trim', (.93, .93, .9))
    return ('trim', PLASTIC if m in ('plastic', 'details') else BLACK if m == 'wheel' else (.5, .5, .5))


Q = 'quaternius-cars/'
# key: source, class rule, how wheels are found, yaw to put the nose on +z, target [length, width, height] in metres,
# wr wheel size factor, wheel_from: borrow another model's (lighter) wheel
MODELS = {
    'sedan':    dict(src=Q + 'Car_Cz6yDaUcM9.glb', rule=quat({'Blue': ('paint', 1)}), wheels='node', dims=[4.6, 1.76, 1.42]),
    'saloon90': dict(src=Q + 'SportsCar_OyqKvX9xNh.glb', rule=quat({'Orange': ('paint', 1), 'DarkOrange': ('paint', .82)}), wheels='node', dims=[4.45, 1.72, 1.38]),
    'hatch':    dict(src=Q + 'Car_unqqkULtRU.glb', rule=quat({'LightBlue': ('paint', 1), 'Material.007': ('trim', PLASTIC)}), wheels='node', dims=[4.0, 1.7, 1.45]),
    'liftback': dict(src=Q + 'SportsCar_1mkmFkAz5v.glb', rule=quat({'White': ('paint', 1)}), wheels='node', dims=[4.62, 1.8, 1.46]),
    'suv':      dict(src=Q + 'SUV_xsMtZhBkxL.glb', rule=quat({'White': ('paint', 1)}), wheels='node', dims=[4.5, 1.84, 1.68]),
    'estate':   dict(src='poly-google/Car_75h3mi6uHuC.glb', rule=google, wheels='parts', dims=[4.55, 1.72, 1.42], wr=.8),
    'estate80': dict(src='poly-google/Van_aT_24cDaW1a.glb', rule=google, wheels='parts', dims=[4.8, 1.8, 1.55], wr=.75),
    'van':      dict(src='pukkbumxdd-van/GenericVan_BbRojf2v3H.glb', rule=van, wheels='node', yaw=90, dims=[4.9, 1.9, 1.98], wr=.85),
    'truck':    dict(src='quaternius-zombie-kit/Truck_cXw6oiFtZ8.glb', rule=zombie([(.58, .62, .24)]), wheels='node', dims=[5.6, 2.05, 2.75], wheel_from='sedan', wr=.85),
    'pickup':   dict(src='quaternius-zombie-kit/PickupTruck_qn4grQgHm8.glb', rule=zombie([(.31, .54, .67)]), wheels='node', dims=[5.1, 1.85, 1.75], wheel_from='sedan', wr=.72),
}


def bbox(tris):
    lo, hi = [1e9] * 3, [-1e9] * 3
    for t in tris:
        for p in t['p']:
            for d in range(3):
                lo[d] = min(lo[d], p[d]); hi[d] = max(hi[d], p[d])
    return lo, hi


def components(tris):
    """connected triangle islands (shared positions)"""
    par = list(range(len(tris)))

    def find(a):
        while par[a] != a:
            par[a] = par[par[a]]; a = par[a]
        return a
    own = {}
    for i, t in enumerate(tris):
        for p in t['p']:
            k = tuple(round(v, 4) for v in p)
            if k in own:
                par[find(i)] = find(own[k])
            else:
                own[k] = i
    g = defaultdict(list)
    for i in range(len(tris)):
        g[find(i)].append(tris[i])
    return list(g.values())


def wheel_sets(tris, how):
    """-> (body tris, [4 lists of wheel tris])"""
    if how == 'node':
        W = [t for t in tris if 'wheel' in t['node'].lower()]
        body = [t for t in tris if 'wheel' not in t['node'].lower()]
    else:
        # wheels are islands that reach the ground and are round in side view; rims/hubs are islands inside a tyre's disc
        lo, hi = bbox(tris)
        body, W = [], []
        comps = [(c, *bbox(c)) for c in components(tris)]
        tyres = [(c, l, h) for c, l, h in comps if l[1] - lo[1] < (hi[1] - lo[1]) * .03 and abs((h[1] - l[1]) - (h[2] - l[2])) < (h[1] - l[1]) * .15]
        disc = [((l[0] + h[0]) / 2, (l[1] + h[1]) / 2, (l[2] + h[2]) / 2, (h[1] - l[1]) / 2) for _, l, h in tyres]
        for c, l, h in comps:
            m = [(l[d] + h[d]) / 2 for d in range(3)]
            if any(abs(m[0] - d[0]) < d[3] * .8 and math.hypot(m[1] - d[1], m[2] - d[2]) < d[3] * .5 and h[1] - l[1] <= 2.05 * d[3] for d in disc):
                W += c
            else:
                body += c
    groups = defaultdict(list)
    lo, hi = bbox(W)
    zm = (lo[2] + hi[2]) / 2
    for t in W:
        c = [sum(p[d] for p in t['p']) / 3 for d in range(3)]
        groups[(c[0] > 0, c[2] > zm)].append(t)
    assert len(groups) == 4, [k for k in groups]
    return body, groups


def build(key, cfg, cache):
    tris = glb.triangles(cfg['src'])
    yaw = math.radians(cfg.get('yaw', 0))
    cy, sy_ = math.cos(yaw), math.sin(yaw)
    for t in tris:
        t['p'] = [(p[0] * cy + p[2] * sy_, p[1], -p[0] * sy_ + p[2] * cy) for p in t['p']]
        t['n'] = [(p[0] * cy + p[2] * sy_, p[1], -p[0] * sy_ + p[2] * cy) for p in t['n']]
    body, W = wheel_sets(tris, cfg['wheels'])
    lo, hi = bbox(body)
    size = [hi[d] - lo[d] for d in range(3)]
    L, Wd, H = cfg['dims']
    sx, sz = Wd / size[0], L / size[2]
    hub = {k: [(a + b) / 2 for a, b in zip(*bbox(v))] for k, v in W.items()}
    rad = {k: max(h[1] - l[1], h[2] - l[2]) / 2 for k, (l, h) in ((k, bbox(v)) for k, v in W.items())}
    r0 = sum(rad.values()) / 4
    hy = sum(h[1] for h in hub.values()) / 4
    # height is set by the roof over the hubs: a wheel keeps its own shape (uniform scale ws), the body stretches to dims
    sy = (H - 0) / (hi[1] - lo[1] + 0)
    # wr shrinks an oversized wheel; the body comes down with it, so the arch keeps its shape and gains a gap
    ws = (sy + sz) / 2 * cfg.get('wr', 1)
    r = r0 * ws
    ty = r - hy * sy
    cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
    X0 = lambda p: ((p[0] - cx) * sx, p[1] * sy + ty, (p[2] - cz) * sz)
    # a shrunk wheel (wr < 1) leaves a ring of open arch around it that reads as a hole into the body; pull the arch in
    # with it: body points near a hub move towards it by the radius lost, fading out over .35 m (same map for every list,
    # so panels stay joined). This was the owner's "hole behind the rear wheel": the dark well showing round a small wheel
    rf, dr = r / cfg.get('wr', 1), r / cfg.get('wr', 1) - r
    H4 = [((v[0] - cx) * sx, (v[2] - cz) * sz) for v in hub.values()]

    def X(p):
        q = X0(p)
        for hx, hz in H4:
            d = math.hypot(q[1] - r, q[2] - hz)
            if dr <= 0 or q[0] * hx <= 0 or abs(q[0]) < abs(hx) - .35 or d >= rf + .35 or d < 1e-6:
                continue
            # never closer than 3 cm to the tyre, so nothing already near it is pushed into it
            k = min(dr * min(1, (rf + .35 - d) / .32), max(0, d - r - .03)) / d
            q = (q[0], q[1] - (q[1] - r) * k, q[2] - (q[2] - hz) * k)
        return q
    Nn = lambda n: (lambda v: tuple(x / (math.sqrt(sum(y * y for y in v)) or 1) for x in v))((n[0] / sx, n[1] / sy, n[2] / sz))
    out = {'paint': [], 'trim': [], 'lamps': [], 'wheel': []}
    Hc = H
    n_drop = 0
    for t in body:
        k = cfg['rule'](t)
        P = [X(p) for p in t['p']]
        NN = [Nn(n) for n in t['n']]
        cz_ = sum(p[2] for p in P) / 3
        if k == 'lamp?':
            # white google parts: lamps only where they face forward/back at the very ends
            k = 'lamp' if abs(cz_) > L * .44 and abs(sum(n[2] for n in NN) / 3) > .5 else ('trim', CHROME)
        if k == 'drop':
            n_drop += 1
            continue
        if k == 'glass':
            cols = []
            for p in P:
                q = min(1, max(0, (p[1] - Hc * .66) / (Hc * .32)))
                cols.append((.05 + .2 * q, .07 + .24 * q, .09 + .27 * q))
            out['trim'].append((P, NN, cols))
        elif k == 'lamp':
            out['lamps'].append((P, NN, [HEAD if cz_ > 0 else TAIL] * 3))
        elif k[0] == 'paint':
            out['paint'].append((P, NN, [(k[1],) * 3] * 3))
        else:
            out['trim'].append((P, NN, [k[1]] * 3))
    # wheel template: the front +x wheel, centred on its hub; its own scale so it stays round
    src = W[(True, True)]
    h = hub[(True, True)]
    wfrom = cfg.get('wheel_from')
    if wfrom:
        tpl, tr = cache[wfrom]
        k = r / tr
        out['wheel'] = [([(p[0] * k * sx / cache[wfrom + ':sx'], p[1] * k, p[2] * k) for p in P], NN, C) for P, NN, C in tpl]
    else:
        for t in src:
            P = [((p[0] - h[0]) * sx, (p[1] - h[1]) * ws, (p[2] - h[2]) * ws) for p in t['p']]
            NN = [Nn((n[0], n[1] * sy / ws, n[2] * sz / ws)) for n in t['n']]
            c = t['c'][0]
            col = BLACK if max(c) < .1 else (.2, .2, .21) if max(c) < .3 else tuple(min(1, v * 1.1) for v in c)
            out['wheel'].append((P, NN, [col] * 3))
        cache[key] = (out['wheel'], r)
        cache[key + ':sx'] = sx
    hubs = {k: ((v[0] - cx) * sx, r, (v[2] - cz) * sz) for k, v in hub.items()}
    zf = (hubs[(True, True)][2] + hubs[(False, True)][2]) / 2
    zr = (hubs[(True, False)][2] + hubs[(False, False)][2]) / 2
    track = (hubs[(True, True)][0] - hubs[(False, True)][0]) / 2
    # the +x wheel's outer face must be at +x
    wx = [p[0] for P, _, _ in out['wheel'] for p in P]
    extras = {'r': round(r, 4), 'axles': [round(zf, 4), round(zr, 4)], 'track': round(track, 4), 'dims': [L, Wd, H],
              'tris': {k: len(v) for k, v in out.items()}, 'dropped': n_drop, 'wheelX': [round(min(wx), 3), round(max(wx), 3)]}
    return out, extras


def write(path, out, extras):
    bin_ = bytearray()
    J = {'asset': {'version': '2.0', 'generator': 'raseiniai fleet/build.py'}, 'extensionsUsed': ['KHR_mesh_quantization'],
         'extensionsRequired': ['KHR_mesh_quantization'], 'buffers': [], 'bufferViews': [], 'accessors': [], 'meshes': [], 'nodes': [],
         'materials': [{'name': 'vertex', 'pbrMetallicRoughness': {'metallicFactor': 0, 'roughnessFactor': 1}}]}

    def view(data, target, stride=None):
        while len(bin_) % 4:
            bin_.append(0)
        v = {'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(data), 'target': target}
        if stride:
            v['byteStride'] = stride
        bin_.extend(data)
        J['bufferViews'].append(v)
        return len(J['bufferViews']) - 1

    def acc(v, ctype, count, typ, norm=False, mn=None, mx=None):
        a = {'bufferView': v, 'componentType': ctype, 'count': count, 'type': typ}
        if norm:
            a['normalized'] = True
        if mn is not None:
            a['min'], a['max'] = mn, mx
        J['accessors'].append(a)
        return len(J['accessors']) - 1
    for name in ('paint', 'trim', 'lamps', 'wheel'):
        idx, verts, I = {}, [], []
        for P, NN, C in out[name]:
            for p, n, c in zip(P, NN, C):
                k = (tuple(round(v * 1000) for v in p), tuple(round(v * 127) for v in n), tuple(round(v * 255) for v in c))
                if k not in idx:
                    idx[k] = len(verts); verts.append(k)
                I.append(idx[k])
        assert len(verts) < 65536
        pos = b''.join(struct.pack('<hhhh', *k[0], 0) for k in verts)
        nor = b''.join(struct.pack('<bbbb', *k[1], 0) for k in verts)
        col = b''.join(struct.pack('<BBBB', *k[2], 255) for k in verts)
        mn = [min(k[0][d] for k in verts) for d in range(3)]
        mx = [max(k[0][d] for k in verts) for d in range(3)]
        a = {'POSITION': acc(view(pos, 34962, 8), 5122, len(verts), 'VEC3', False, mn, mx),
             'NORMAL': acc(view(nor, 34962, 4), 5120, len(verts), 'VEC3', True),
             'COLOR_0': acc(view(col, 34962, 4), 5121, len(verts), 'VEC4', True)}
        ind = acc(view(struct.pack('<%dH' % len(I), *I), 34963), 5123, len(I), 'SCALAR')
        J['meshes'].append({'name': name, 'primitives': [{'attributes': a, 'indices': ind, 'material': 0}]})
        J['nodes'].append({'name': name, 'mesh': len(J['meshes']) - 1, 'scale': [.001] * 3})
    for nm, x, z in (('wheel_fl', 1, 0), ('wheel_fr', -1, 0), ('wheel_rl', 1, 1), ('wheel_rr', -1, 1)):
        J['nodes'].append({'name': nm, 'translation': [x * extras['track'], extras['r'], extras['axles'][z]]})
    J['scenes'] = [{'nodes': list(range(len(J['nodes'])))}]
    J['scene'] = 0
    J['extras'] = extras
    while len(bin_) % 4:
        bin_.append(0)
    J['buffers'] = [{'byteLength': len(bin_)}]
    js = json.dumps(J, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    with open(path, 'wb') as f:
        f.write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(bin_)))
        f.write(struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(bin_)) + b'BIN\0' + bin_)


if __name__ == '__main__':
    dst = sys.argv[1]
    only = sys.argv[2:]
    os.makedirs(dst, exist_ok=True)
    cache = {}
    for key, cfg in MODELS.items():
        if only and key not in only and not any(MODELS[o].get('wheel_from') == key for o in only):
            continue
        out, ex = build(key, cfg, cache)
        p = os.path.join(dst, 'car2_%s.glb' % key)
        write(p, out, ex)
        tot = ex['tris']['paint'] + ex['tris']['trim'] + ex['tris']['lamps'] + 4 * ex['tris']['wheel']
        print('%-9s %6d B  tris %5d (%s)  r %.3f axles %s track %.3f' % (key, os.path.getsize(p), tot, ex['tris'], ex['r'], ex['axles'], ex['track']))
