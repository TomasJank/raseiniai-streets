"""Review sheets for kit houses: photo | game before | game after from the photo's viewpoint, then the house square-on
(front, left, right, back) before and after.

usage: sheet.py before_dir after_dir out_dir c1298=jurbarko/2026-03-12_952019340597023.jpg [...]
before_dir/after_dir hold shots.mjs output for the photo records and the {id}_{front,left,right,back}.jpg house views.
"""
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'refs', 'mapillary')
bdir, adir, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
W = 520
for arg in sys.argv[4:]:
    bid, photo = arg.split('=')
    shot = photo.replace('/', '_')
    fit = lambda im, w: im.convert('RGB').resize((w, int(w * im.height / im.width)))
    top = [fit(Image.open(os.path.join(ROOT, photo)), W), fit(Image.open(os.path.join(bdir, shot)), W), fit(Image.open(os.path.join(adir, shot)), W)]
    sides = [s for s in ('front', 'left', 'right', 'back') if os.path.exists(os.path.join(adir, '%s_%s.jpg' % (bid, s)))]
    w2 = W * 3 // len(sides)
    rows = [[fit(Image.open(os.path.join(d, '%s_%s.jpg' % (bid, s))), w2) for s in sides] for d in (bdir, adir)]
    H = top[0].height + max(r[0].height for r in rows) * 2 + 60
    S = Image.new('RGB', (W * 3, H), 'white')
    g = ImageDraw.Draw(S)
    for k, (im, lab) in enumerate(zip(top, ('photo ' + photo, 'game before', 'game after'))):
        S.paste(im, (k * W, 20))
        g.text((k * W + 4, 4), lab, fill='black')
    y = 20 + top[0].height + 20
    for r, lab in zip(rows, ('before', 'after')):
        for k, im in enumerate(r):
            S.paste(im, (k * w2, y))
            g.text((k * w2 + 4, y + 4), '%s %s %s' % (bid, sides[k], lab), fill='red')
        y += r[0].height + 20
    S.save(os.path.join(out, bid + '.jpg'), quality=82)
    print(bid)
