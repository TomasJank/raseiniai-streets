"""Bakes the Poly Haven maps (research/assets/textures/raw, fetched by fetch.py there) into pipeline/tex/atlas.webp + layers.json.

One 512 px tile per material, stacked top to bottom. A tile is diffuse x AO x relief light from the normal map (the diffuse maps are
delit, so corrugations and plaster grain only exist in the normals), with the low frequencies divided out (no blotch to betray the
tiling) and each channel scaled so its mean is 128: the shader multiplies the building's own colour by tile/128, so the far view,
where mipmaps average a tile to its mean, keeps exactly the colour it had.

usage: python make.py [preview.png]     (needs numpy and pillow; cwebp on PATH)
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
raw = os.path.join(here, '..', '..', 'research', 'assets', 'textures', 'raw')
N = 512
# name, source, metres across one tile, relief light strength, AO strength, flatten radius (fraction of the tile, 0 = off), contrast, colour kept
LAYERS = [
    ('brick',      'red_brick',               1.40, .9, .8, .20, 1.0, 1.0),
    ('silicate',   'whitewashed_brick',       2.60, .9, .6, .20, 1.0, .3),
    ('plaster',    'painted_plaster_wall',    2.00, .8, .6, .12, 1.0, .3),
    ('roughcast',  'white_stucco_02',         1.20, .8, .7, .12, .7, .3),
    ('planks',     'brown_planks_05',         1.00, .9, .8, .25, 1.0, .5),
    ('concrete',   'concrete_wall_006',       2.00, .8, .7, .15, .75, .3),
    ('corrugated', 'corrugated_iron_02',      2.70, .9, .7, .25, 1.0, .5),
    ('asbestos',   'asbestos_sheet_02',       1.80, .6, .7, .25, .6, .5),
    ('tiles',      'roof_09',                 2.70, .8, .8, .20, 1.0, .7),
    ('profile',    'box_profile_metal_sheet', 2.00, .9, .7, .25, 1.0, .4),
    ('bitumen',    'bitumen',                 3.00, .8, .6, 0,   .7,  .5),
]
L = np.array([-.45, .5, .74])  # light from the upper left of the tile, as the sky lights a wall


def load(src, f, mode):
    return np.asarray(Image.open(os.path.join(raw, src, f + '.jpg')).convert(mode).resize((N, N), Image.LANCZOS), np.float32) / 255


def blur(a, r):  # gaussian that wraps round the tile, done in the frequency domain
    f = np.fft.fftfreq(N)
    g = np.exp(-2 * (np.pi * r) ** 2 * (f[:, None] ** 2 + f[None, :] ** 2))
    return np.stack([np.fft.ifft2(np.fft.fft2(a[..., c]) * g).real for c in range(3)], -1)


def bake(name, src, m, kl, ka, flat, gain, sat):
    d = load(src, 'diff', 'RGB')
    n = load(src, 'nor', 'RGB') * 2 - 1
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    ao = load(src, 'ao', 'L')
    shade = 1 + kl * ((n @ L) / (L[2] * np.maximum(n[..., 2], .2)) - 1)
    o = d * (np.clip(shade, .25, 1.9) * (1 - ka + ka * ao))[..., None]
    if flat:
        o = o / np.maximum(blur(o, flat * N), 1e-3)
    for _ in range(3):  # clipping moves the mean, so settle it
        o = o / o.mean((0, 1))
        lum = o.mean(-1, keepdims=True)
        o = np.clip(1 + ((lum + (o - lum) * sat) - 1) * gain, 0, 255 / 128)
        sat, gain = 1, 1
    return o / o.mean((0, 1))


tiles = [bake(*l) for l in LAYERS]
strip = np.concatenate([np.clip(t * 128 + .5, 0, 255).astype(np.uint8) for t in tiles])
png = os.path.join(here, '_atlas.png')
Image.fromarray(strip).save(png)
subprocess.run(['cwebp', '-quiet', '-q', '72', '-m', '6', '-sharp_yuv', png, '-o', os.path.join(here, 'atlas.webp')], check=True)
os.remove(png)
json.dump([{'n': l[0], 'src': l[1], 'm': l[2]} for l in LAYERS], open(os.path.join(here, 'layers.json'), 'w'), separators=(',', ':'))
print('atlas.webp %d B, %d layers' % (os.path.getsize(os.path.join(here, 'atlas.webp')), len(LAYERS)))
if len(sys.argv) > 1:  # contact sheet of the decoded tiles on a mid-tone wall colour, 2 x 2 repeats to show the seams
    back = np.asarray(Image.open(os.path.join(here, 'atlas.webp')).convert('RGB'), np.float32) / 128
    cols = 4; rows = -(-len(LAYERS) // cols); sheet = np.zeros((rows * N, cols * N, 3), np.float32)
    for i in range(len(LAYERS)):
        t = np.tile(back[i * N:(i + 1) * N], (2, 2, 1))[::2, ::2]
        sheet[(i // cols) * N:(i // cols + 1) * N, (i % cols) * N:(i % cols + 1) * N] = t * [.78, .72, .62]
    Image.fromarray(np.clip(sheet * 255, 0, 255).astype(np.uint8)).save(sys.argv[1])
