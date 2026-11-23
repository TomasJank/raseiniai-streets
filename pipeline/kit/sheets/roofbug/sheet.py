"""roofbug proof sheets: sheet.py before_dir after_dir out_dir. c2707.jpg = v74 | fixed from the owner's viewpoint and four sides;
sweep.jpg = every other house the roof sweep flagged on v74, four diagonal views each, v74 left | fixed right."""
import sys, json
from PIL import Image, ImageDraw
bd, ad, od = sys.argv[1:4]
W, H = 400, 300
s = Image.new('RGB', (W * 5 + 16, 2 * H + 48), 'white'); d = ImageDraw.Draw(s)
for r, (dd, lab) in enumerate(((bd, 'v74'), (ad, 'fixed'))):
    for k, v in enumerate(('owner', 'front', 'left', 'back', 'right')):
        s.paste(Image.open('%s/c2707_%s.jpg' % (dd, v)).resize((W, H)), (k * (W + 4), 24 + r * (H + 24)))
        d.text((k * (W + 4) + 4, 6 + r * (H + 24)), 'c2707 %s %s' % (lab, v), fill='black')
s.save(od + '/c2707.jpg', quality=88)
ids = ['c7174', 'c3752', 'c1622', 'c1624', 'c1850', 'c1858', 'c5129', 'c7400', 'c2189', 'c2913', 'c7618', 'c3590', 'c4552', 'c1835', 'c2205', 'c2270']
w, h = 240, 180
s = Image.new('RGB', (w * 8 + 40, len(ids) * (h + 18) + 8), 'white'); d = ImageDraw.Draw(s)
for i, bid in enumerate(ids):
    y = i * (h + 18) + 16
    for j, (dd, lab) in enumerate(((bd, 'v74'), (ad, 'fixed'))):
        for k, v in enumerate(('ne', 'se', 'sw', 'nw')):
            x = j * (4 * w + 30) + k * w
            s.paste(Image.open('%s/%s_%s.jpg' % (dd, bid, v)).resize((w, h)), (x, y))
            d.text((x + 3, y - 13), '%s %s %s' % (bid, lab, v), fill='black')
s.save(od + '/sweep.jpg', quality=85)
