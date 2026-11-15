"""Ground colour map for the page: the 2024 orthophoto (buildings, canopy and shadows filled from their surroundings,
haze removed, posterised and graded toward the game's palette), tile level 11 (0.26 m) over the town and level 8 (2.6 m)
out to the edge of the ground plane, with GRPK land cover where the photo has nothing usable (forest interiors) and a
dark bank colour under GRPK/OSM water.

usage: python3 pipeline/geo/ground_map.py [--fetch]   (--fetch first downloads the level 8 tiles, gitignored like the level 11 ones)
writes pipeline/geo/ground_in.webp (orthophoto area, IN_E m either side of the origin) and ground_out.webp (whole plane, OUT_E)
pixel (0,0) is the corner at game (-E,-E); x east to the right, z south down. PIL only, deterministic.
"""
import concurrent.futures as cf, json, os, re, sys, urllib.request, zlib
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageMath

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
sys.path.insert(0, HERE)
import lks94

IN_E, IN_N = 2560, 4096
OUT_E, OUT_N = 3620, 1024
RES = {11: 0.26458386250105836, 8: 2.6458386250105836}  # m/px of the ORT10LT tile levels used

LAND = {'sd11': None, 'sd2': (104, 124, 70), 'sd15': (80, 100, 58), 'ms0': (66, 78, 50), 'sd4': (122, 124, 82), 'ms4': (94, 116, 62)}
BUILT = {'pu3': (126, 122, 108), 'vk1': (92, 124, 64), 'vp1': (88, 104, 66), 'vg2': (118, 116, 102), 'vg1': (128, 126, 116)}
FIELDS = [(118, 96, 70), (134, 110, 80), (160, 146, 102), (88, 118, 58), (104, 128, 64)]  # ploughed, harrowed, stubble, crop, young crop
BG = (104, 124, 70)
SAT, LIFT, FLAT = 1.3, 40, .62
SCREEN = (1.1, 1.1, 1.25)  # rendered ground / map colour at midday, measured
BANK = (64, 64, 54)
# the ground is painted by surface class, not graded photo colour: the photo decides where, the palette what colour.
# 1 grass or crop, 2 soil and beds, 3 gravel, dirt or dry stubble, 4 paving or sand, 5 asphalt or wet earth
TOWN = {1: (90, 124, 56), 2: (118, 96, 70), 3: (132, 124, 104), 4: (140, 138, 130), 5: (92, 92, 88)}
FARM = {1: (84, 114, 50), 2: (120, 98, 72), 3: (146, 134, 98), 4: (158, 148, 116), 5: (88, 86, 66)}
LAWN_BIAS = 40  # of 255: a masked pixel stays lawn unless most of what surrounds it is something else
BOG = (78, 86, 60)


def grid(E, N):
    return lambda x, z: ((x + E) * N / (2 * E), (z + E) * N / (2 * E))


def poly_mask(rings, tr, size):
    """outer ring filled, rings whose first point lies inside it cut out, other rings added"""
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    pts = [[tr(*p) for p in r] for r in rings if len(r) > 2]
    if not pts:
        return m
    d.polygon(pts[0], fill=255)
    for r in pts[1:]:
        d.polygon(r, fill=0 if inside(r[0], pts[0]) else 255)
    return m


def inside(p, ring):
    x, y, c = p[0], p[1], False
    for i in range(len(ring)):
        x0, y0 = ring[i - 1]
        x1, y1 = ring[i]
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            c = not c
    return c


def paint(img, rings, tr, col):
    """paste col through the polygon mask, working on the bbox only"""
    pts = [p for r in rings for p in r]
    xs = [tr(*p)[0] for p in pts]
    ys = [tr(*p)[1] for p in pts]
    x0, y0 = max(0, int(min(xs)) - 1), max(0, int(min(ys)) - 1)
    x1, y1 = min(img.width, int(max(xs)) + 2), min(img.height, int(max(ys)) + 2)
    if x1 <= x0 or y1 <= y0:
        return
    m = poly_mask(rings, lambda x, z: (tr(x, z)[0] - x0, tr(x, z)[1] - y0), (x1 - x0, y1 - y0))
    img.paste(col, (x0, y0, x1, y1), m)


def field_colour(i, rings):
    c = sum(rings[0][0]) * 7 + i
    return FIELDS[zlib.crc32(('%d' % round(c)).encode()) % len(FIELDS)]


def osm():
    """building footprints and water polygons from the page's rasData, game metres"""
    h = open(os.path.join(ROOT, 'work', 'build', 'v37.html'), encoding='utf8').read()
    d = json.loads(re.search(r'<script type="application/json" id="rasData">(.*?)</script>', h, re.S).group(1))
    n, bld, wat = d['n'], [], []
    for w in d['w']:
        t = d['t'][w[0]]
        refs = w[1:]
        if len(refs) < 4 or refs[0] != refs[-1]:
            continue
        pts = []
        for k in refs[:-1]:
            lat, lon = d['lat0'] + n[2 * k] / 1e6, d['lon0'] + n[2 * k + 1] / 1e6
            pts.append(((lon - lks94.LON0) * lks94.KX, -(lat - lks94.LAT0) * lks94.KZ))
        if t.get('building') and t['building'] != 'no':
            bld.append([pts])
        elif t.get('natural') == 'water' or t.get('waterway') == 'riverbank' or t.get('landuse') in ('reservoir', 'basin'):
            wat.append([pts])
    return bld, wat


def ortho_layer(E, N, level, F):
    """orthophoto at one tile level resampled to the grid, plus its coverage, tree canopy and dark pixels"""
    d = os.path.join(ROOT, 'research', 'geodata', 'ortho', 'tiles', *(['L%d' % level] if level != 11 else []))
    rc = sorted(tuple(int(v) for v in f[:-4].split('_')) for f in os.listdir(d) if f.endswith('.jpg'))
    r0, c0 = min(r for r, c in rc), min(c for r, c in rc)
    res = RES[level]
    T = 256 // F
    mo = Image.new('RGB', ((max(c for r, c in rc) - c0 + 1) * T, (max(r for r, c in rc) - r0 + 1) * T))
    cov = Image.new('L', mo.size, 0)
    for r, c in rc:
        box = ((c - c0) * T, (r - r0) * T)
        mo.paste(Image.open(os.path.join(d, '%d_%d.jpg' % (r, c))).convert('RGB').reduce(F), box)
        cov.paste(255, box + (box[0] + T, box[1] + T))
    L = mo.convert('L')
    rr, gg, bb = mo.split()
    tex = ImageChops.difference(L, L.filter(ImageFilter.GaussianBlur(2))).filter(ImageFilter.GaussianBlur(1.5))
    exg = ImageMath.lambda_eval(lambda a: a['g'] * 2 - a['r'] - a['b'] + 128, r=rr, g=gg, b=bb).convert('L')
    near = L.point(lambda v: 255 * (v > 140)).filter(ImageFilter.MaxFilter(5))
    can = ImageMath.lambda_eval(lambda a: ((a['e'] > 142) & (a['t'] > 6) & (a['n'] < 1)) * 255, e=exg, t=tex, n=near).convert('L')
    can = can.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(7))
    dark = L.point(lambda v: 255 * (v < 72)).filter(ImageFilter.MaxFilter(3))

    def src(x, z):
        X, Y = lks94.game_to_lks(x, z)
        return ((X - lks94.OX) / res - c0 * 256) / F, ((lks94.OY - Y) / res - r0 * 256) / F

    S, step = 2 * E / N, 128
    mesh = []
    for j in range(0, N, step):
        for i in range(0, N, step):
            x0, z0, x1, z1 = -E + i * S, -E + j * S, -E + (i + step) * S, -E + (j + step) * S
            mesh.append(((i, j, i + step, j + step), src(x0, z0) + src(x0, z1) + src(x1, z1) + src(x1, z0)))
    t = lambda im, f: im.transform((N, N), Image.MESH, mesh, f)
    m = lambda im: t(im, Image.BILINEAR).point(lambda v: 255 * (v > 100))
    return t(mo, Image.BILINEAR), t(cov, Image.BILINEAR).point(lambda v: 255 * (v > 250)), m(can), m(dark)


def fill(img, valid):
    """pull-push: masked pixels take the average of the nearest valid ones, coarser the further away"""
    a = img.copy()
    a.putalpha(valid)
    lv = [a.convert('RGBa')]
    while min(lv[-1].size) > 4:
        lv.append(lv[-1].reduce(2))
    cur = lv[-1].convert('RGBA')
    for l in reversed(lv[:-1]):
        base = cur.resize(l.size, Image.BILINEAR)
        base.putalpha(255)
        cur = Image.alpha_composite(base, l.convert('RGBA'))
    return cur.convert('RGB')


def grade(c):
    """haze off (dark-object subtraction, bright pixels neutral), more colour, flatter tones, grass warmer and soil less pink;
    divided by what the sun and sky add on screen so the rendered ground lands on these values. Continuous, so neighbouring
    palette entries stay neighbours."""
    r, g, b = [max(0., (v - h) * k) for v, h, k in zip(c, (30, 45, 58), (1.19, 1.39, 1.5))]
    l = .3 * r + .59 * g + .11 * b + 1
    wg = min(1, max(0, ((g - r) / l - .08) / .12))
    wr = min(1, max(0, ((r - g) / l - .04) / .1))
    b = min(b + (.8 * g - b) * wg, max(r, g) + 6)  # haze left in dark crops turns them teal; nothing on the ground is blue
    l = .3 * r + .59 * g + .11 * b
    k = SAT + .35 * wg * min(1, l / 90)  # lawns, not the dark crops
    r, g, b = l + (r - l) * k, l + (g - l) * k + 4 * wg + 5 * wr, l + (b - l) * k - 14 * wg - 14 * wr - 8  # shade on this ground is lit by a blue sky
    l2 = LIFT + FLAT * l
    return tuple(max(0, min(255, round(v * l2 / (l + 1e-6) / s))) for v, s in zip((r, g, b), SCREEN))


def odd(v):
    return 2 * round(v / 2 - .5) + 1


def stylise(img, px):
    img = img.filter(ImageFilter.MedianFilter(max(3, odd(8 * px)))).filter(ImageFilter.ModeFilter(max(3, odd(6 * px))))
    q = img.quantize(40, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    p = q.getpalette()[:40 * 3]
    q.putpalette([v for i in range(40) for v in grade(p[i * 3:i * 3 + 3])])
    return q.convert('RGB').filter(ImageFilter.ModeFilter(max(3, odd(6 * px)))).filter(ImageFilter.GaussianBlur(px))  # no single-texel confetti


def grpk_layer(E, N, G):
    """land cover, for where the photo has nothing usable nearby (inside forests, under big roofs)"""
    tr = grid(E, N)
    img = Image.new('RGB', (N, N), BG)
    for k in ('sd11', 'sd2', 'sd4', 'ms4', 'sd15', 'ms0'):
        for i, p in enumerate(G['land']):
            if p['GKODAS'] == k:
                paint(img, p['rings'], tr, LAND[k] or field_colour(i, p['rings']))
    for p in G['built']:
        if p['GKODAS'] in BUILT:
            paint(img, p['rings'], tr, BUILT[p['GKODAS']])
    for p in G['bog']:
        paint(img, p['rings'], tr, BOG)
    return img


def banks(img, tr, E, N, G, water):
    """water bodies and streams in a dark neutral bank colour, a few metres wider than the water"""
    m = Image.new('L', (N, N), 0)
    d = ImageDraw.Draw(m)
    for rings in [p['rings'] for p in G['water']] + water:
        d.polygon([tr(*q) for q in rings[0]], fill=255)
    px = N / (2 * E)
    for s in G['streams']:
        if not s['GKODAS'].startswith('hc') or 'op' in s['GKODAS']:  # op: piped under ground, fhc: the line through a lake
            continue
        w = max(1, round((s.get('PLOTIS') or 2) * px))
        for path in s['paths']:
            d.line([tr(*q) for q in path], fill=255, width=w, joint='curve')
    grow = 2 * round(3 * px) + 1
    if grow > 1:
        m = m.filter(ImageFilter.MaxFilter(grow))
    m = m.filter(ImageFilter.GaussianBlur(.7))
    img.paste(BANK, (0, 0), m)
    return m


def surface(c):
    """surface class of one photo colour, haze removed: 0 unknown (deep shade), else a TOWN/FARM key"""
    r, g, b = [max(0., (v - h) * k) for v, h, k in zip(c, (30, 45, 58), (1.19, 1.39, 1.5))]
    l = .3 * r + .59 * g + .11 * b + 1
    if l < 28:
        return 0
    if (g - r) / l > .04:
        return 1
    if (r - g) / l > .05:
        return 2 if l < 115 else 3
    return 4 if l > 140 else 3 if l > 80 else 5


def classes(photo, valid, roofs):
    """surface class per pixel, masked and unknown pixels taking the class most common around them (lawn if close).
    Bright pixels near a footprint are taken as roof the footprint missed (the photo leans), not paving."""
    q = photo.filter(ImageFilter.MedianFilter(3)).quantize(64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    p = q.getpalette()[:64 * 3]
    q.putpalette([v for i in range(64) for v in (surface(p[i * 3:i * 3 + 3]),) * 3])
    raw = q.convert('L')
    valid = ImageChops.multiply(valid, raw.point(lambda v: 255 * (v > 0)))
    valid = ImageChops.subtract(valid, ImageChops.multiply(roofs, raw.point(lambda v: 255 * (v == 4))))
    best, lab = None, None
    for k in TOWN:
        a = Image.merge('RGB', (raw.point(lambda v, k=k: 255 * (v == k)),) * 3)
        f = fill(a, valid).getchannel(0).point(lambda v, k=k: min(255, v + LAWN_BIAS) if k == 1 else v)
        if best is None:
            best, lab = f, Image.new('L', f.size, k)
        else:
            win = ImageChops.subtract(f, best).point(lambda v: 255 * (v > 0))
            lab.paste(k, (0, 0), win)
            best = ImageChops.lighter(best, f)
    return lab.filter(ImageFilter.ModeFilter(5))


def paint_classes(lab, photo, px, pal):
    """palette colours, shaded +-6% by the photo's local light and dark so lawns and yards are not flat"""
    P = Image.frombytes('P', lab.size, lab.tobytes())
    P.putpalette([v for i in range(256) for v in pal.get(i, pal[1])])
    L = photo.convert('L')
    m = ImageMath.lambda_eval(lambda a: (a['f'] + 8) / (a['c'] + 8) * 128, f=L.filter(ImageFilter.GaussianBlur(1.5 * px)).convert('F'), c=L.filter(ImageFilter.GaussianBlur(12 * px)).convert('F'))
    m = m.convert('L').point(lambda v: max(120, min(136, v)))
    return Image.merge('RGB', [ImageMath.lambda_eval(lambda a: a['c'] * a['m'] / 128, c=ch.convert('F'), m=m.convert('F')).convert('L') for ch in P.convert('RGB').split()])


def grow(m, r):
    """dilate (r > 0) or erode (r < 0) a 0/255 mask by about |r| px"""
    b = m.filter(ImageFilter.GaussianBlur(abs(r) / 2))
    return b.point(lambda v: 255 * (v > 8)) if r > 0 else b.point(lambda v: 255 * (v > 247))


def ground(E, N, level, F, G, bld, water, under):
    """under: what shows where the photo has nothing usable nearby (inside forests, under big roofs, past its edge)"""
    tr, px = grid(E, N), N / (2 * E)
    photo, cov, can, dark = ortho_layer(E, N, level, F)
    bm = Image.new('L', (N, N), 0)
    d = ImageDraw.Draw(bm)
    for rings in bld:
        d.polygon([tr(*q) for q in rings[0]], fill=255)
    if 2.5 * px >= 1:
        bm = grow(bm, 2.5 * px)
    shade = ImageChops.multiply(dark, grow(ImageChops.lighter(bm, can), 20 * px))  # cast shadows lie next to what casts them
    valid = ImageChops.subtract(cov, ImageChops.lighter(ImageChops.lighter(bm, can), shade))
    filled = fill(photo, valid)
    styl = stylise(filled, px)
    town = Image.new('L', (N, N), 0)
    d = ImageDraw.Draw(town)
    for p in G['built']:
        d.polygon([tr(*q) for q in p['rings'][0]], fill=255)
    town = grow(town, 15 * px).filter(ImageFilter.GaussianBlur(10 * px))
    lab = classes(photo, valid, grow(bm, 6 * px))
    farm = Image.blend(paint_classes(lab, filled, px, FARM), styl, .5)  # fields keep some of the photo's own variety
    styl = Image.composite(paint_classes(lab, filled, px, TOWN), farm, town)
    near = valid.filter(ImageFilter.GaussianBlur(8 * px)).point(lambda v: min(255, v * 4))
    edge = grow(cov, -30 * px).filter(ImageFilter.GaussianBlur(24 * px))
    img = Image.composite(styl, under, ImageChops.multiply(edge, near))
    wet = banks(img, tr, E, N, G, water)
    # alpha carries the town class exactly (255 - 16k, lossless in WebP) so the shader can draw class edges sharp up close; 255 = no class
    town = ImageChops.subtract(town.point(lambda v: 255 * (v > 127)), wet.point(lambda v: 255 * (v > 0)))
    code = lab.point(lambda v: 255 - 16 * v if v in TOWN else 255)
    img.putalpha(Image.composite(code, Image.new('L', (N, N), 255), town))
    return img


def main():
    if '--fetch' in sys.argv:
        fetch()
    G = json.load(open(os.path.join(HERE, 'grpk.json')))
    bld, water = osm()
    bld += [b['rings'] for b in json.load(open(os.path.join(HERE, 'grpk_buildings.json')))['buildings']]
    outer = ground(OUT_E, OUT_N, 8, 1, G, bld, water, grpk_layer(OUT_E, OUT_N, G)).convert('RGB')
    s = IN_E * OUT_N / OUT_E
    o = (OUT_N - s) / 2
    inner = ground(IN_E, IN_N, 11, 4, G, bld, water, outer.resize((IN_N, IN_N), Image.BICUBIC, (o, o, o + s, o + s)))
    # under the inner square the outer map carries the inner one, so the two agree where the shader blends them
    outer.paste(inner.convert('RGB').resize((round(s), round(s)), Image.BOX), (round(o),) * 2)
    inner.save(os.path.join(HERE, 'ground_in.webp'), quality=72, method=6, alpha_quality=100)
    outer.save(os.path.join(HERE, 'ground_out.webp'), quality=80, method=6)
    for f in ('ground_in.webp', 'ground_out.webp'):
        print(f, os.path.getsize(os.path.join(HERE, f)))


if __name__ == '__main__':
    main()
