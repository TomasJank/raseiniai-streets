"""side-by-side sheet of camshots outputs: mont.py out.jpg label1=dir1 label2=dir2 ... -- name_prefix ...   (one row per image name)"""
import os, sys
from PIL import Image, ImageDraw
out = sys.argv[1]; k = sys.argv.index('--'); cols = [a.split('=', 1) for a in sys.argv[2:k]]; pre = sys.argv[k + 1:]
names = sorted(f for f in os.listdir(cols[0][1]) if f.endswith('.jpg') and any(f.startswith(p) for p in pre))
W = 480; rows = []
for nm in names:
    ims = [Image.open(os.path.join(d, nm)).convert('RGB') for _, d in cols]
    h = int(W * ims[0].height / ims[0].width); r = Image.new('RGB', (len(ims) * (W + 4), h + 16), 'white'); D = ImageDraw.Draw(r)
    for i, (im, (lab, _)) in enumerate(zip(ims, cols)):
        r.paste(im.resize((W, h)), (i * (W + 4), 16)); D.text((i * (W + 4) + 3, 2), '%s  %s' % (nm[:-4], lab), fill='black')
    rows.append(r)
m = Image.new('RGB', (rows[0].width, sum(r.height for r in rows)), 'white'); y = 0
for r in rows:
    m.paste(r, (0, y)); y += r.height
m.save(out, quality=85); print(out, len(rows))
