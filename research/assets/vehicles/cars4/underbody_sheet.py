"""Underside sheets from underbody.mjs shots: python3 underbody_sheet.py beforedir afterdir outdir
One row per model: on its roof from behind and from the side (v73 before, this build after), the distant version from 60 m,
then right way up after: low chase camera, nose up on a crest, on foot beside it."""
import os, sys
from PIL import Image, ImageDraw

before, after, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
W, H, T = 360, 225, 22
cols = [('before', 'flipRear'), ('after', 'flipRear'), ('before', 'flipSide'), ('after', 'flipSide'),
        ('before', 'flipRearFar'), ('after', 'flipRearFar'), ('after', 'chaseLow'), ('after', 'crest'), ('after', 'foot')]
keys = sorted({f.rsplit('_', 1)[0] for f in os.listdir(after) if f.endswith('_flipRear.jpg')})
detailed = ['a4_b55', 'accord7', 'e34', 'e46_roh', 'e90', 'megane2_gt', 'p206_2000', 'p406', 'punto1', 'v70', 'w124', 'w210', 'zafira_a']
groups = {'detailed': [k for k in keys if k in detailed],
          'lowpoly_police_bus': [k for k in keys if k not in detailed]}
for name, ks in groups.items():
    im = Image.new('RGB', (W * len(cols), T + (H + T) * len(ks)), '#1a1a1a')
    d = ImageDraw.Draw(im)
    for j, (src, v) in enumerate(cols):
        d.text((j * W + 6, 5), src + ' ' + v, fill='#fff')
    for i, k in enumerate(ks):
        y = T + i * (H + T)
        d.text((6, y + 4), k, fill='#ff0')
        for j, (src, v) in enumerate(cols):
            f = os.path.join(before if src == 'before' else after, k + '_' + v + '.jpg')
            if os.path.exists(f):
                im.paste(Image.open(f).resize((W, H)), (j * W, y + T))
    im.save(os.path.join(out, name + '.jpg'), quality=86)
    print(name, len(ks))
