"""before/after sheet per house from views.py + camshots.mjs renders: sheet.py before_dir after_dir out_dir id ..."""
import sys
from PIL import Image, ImageDraw
bdir, adir, odir, *ids = sys.argv[1:]
V = ('front', 'left', 'right', 'back', 'street'); W, H = 400, 300
for bid in ids:
    s = Image.new('RGB', (W * 5 + 16, 2 * H + 48), 'white'); d = ImageDraw.Draw(s)
    for r, (dd, lab) in enumerate(((bdir, 'v71'), (adir, 'now'))):
        for k, v in enumerate(V):
            try:
                s.paste(Image.open('%s/%s_%s.jpg' % (dd, bid, v)).resize((W, H)), (k * (W + 4), 24 + r * (H + 24)))
            except FileNotFoundError:
                pass
            d.text((k * (W + 4) + 4, 6 + r * (H + 24)), '%s %s %s' % (bid, lab, v), fill='black')
    s.save('%s/%s.jpg' % (odir, bid), quality=85)
