"""Same-angle proof sheets: real photo | game before | game after, cut to the same box of the frame.
usage: camsheet.py views.json before_dir after_dir out.jpg [rows per sheet, default 5]
views.json as for camshots.mjs, plus per view `photo` (path of the frame image, same pixel size as w x h) and `box`
([x0, y0, x1, y1] in photo pixels: where the house is in the frame). before_dir / after_dir are camshots.mjs output.
"""
import json, sys
from PIL import Image, ImageDraw

views, bdir, adir, out = sys.argv[1:5]
per = int(sys.argv[5]) if len(sys.argv) > 5 else 5
W = 520
rows = []
for v in json.load(open(views)):
    ims = [Image.open(v['photo'])] + [Image.open('%s/%s_%s.jpg' % (d, v['bid'], v['frame'])) for d in (bdir, adir)]
    cs = []
    for im in ims:
        im = im.convert('RGB')
        b = [int(max(0, t)) for t in v['box']]
        cs.append(im.crop((b[0], b[1], min(b[2], im.width), min(b[3], im.height))))
    h = int(W * cs[0].height / cs[0].width)
    r = Image.new('RGB', (W * 3 + 8, h + 24), 'white')
    d = ImageDraw.Draw(r)
    for k, (c, lab) in enumerate(zip(cs, (v['bid'] + '  photo', 'game before', 'game after'))):
        r.paste(c.resize((W, h)), (k * (W + 4), 24))
        d.text((k * (W + 4) + 4, 6), lab, fill='black')
    rows.append(r)
for n in range(0, len(rows), per):
    rs = rows[n:n + per]
    m = Image.new('RGB', (rs[0].width, sum(r.height + 8 for r in rs)), 'white')
    y = 0
    for r in rs:
        m.paste(r, (0, y))
        y += r.height + 8
    name = out if len(rows) <= per else out.replace('.jpg', '_%d.jpg' % (n // per + 1))
    m.save(name, quality=86)
    print(name)
