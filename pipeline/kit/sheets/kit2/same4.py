"""same-angle proof: photo | v70 | before kit 2 | kit 2, cut to the photo's box. same4.py views.json v70_dir before_dir after_dir out.jpg [ids]"""
import json, sys
from PIL import Image, ImageDraw
views, dirs, out, ids = sys.argv[1], sys.argv[2:5], sys.argv[5], sys.argv[6:]
W, rows = 380, []
for v in json.load(open(views)):
    if ids and v['bid'] not in ids:
        continue
    ims = [Image.open(v['photo'])] + [Image.open('%s/%s_%s.jpg' % (d, v['bid'], v['frame'])) for d in dirs]
    b = [int(max(0, t)) for t in v['box']]
    cs = [im.convert('RGB').crop((b[0], b[1], min(b[2], im.width), min(b[3], im.height))) for im in ims]
    h = int(W * cs[0].height / cs[0].width)
    r = Image.new('RGB', (W * 4 + 12, h + 18), 'white')
    D = ImageDraw.Draw(r)
    for k, (c, lab) in enumerate(zip(cs, (v['bid'] + ' photo ' + v['frame'][-6:], 'v70', 'before kit 2', 'kit 2'))):
        r.paste(c.resize((W, h)), (k * (W + 4), 18))
        D.text((k * (W + 4) + 3, 3), lab, fill='black')
    rows.append(r)
m = Image.new('RGB', (rows[0].width, sum(r.height + 6 for r in rows)), 'white')
y = 0
for r in rows:
    m.paste(r, (0, y))
    y += r.height + 6
m.save(out, quality=86)
print(out, len(rows))
