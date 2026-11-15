"""Contact sheets of the review shots: python3 pages.py <shots dir> <json dir> <out prefix> [per_page=6] [cols=2] [views=front,back,face]"""
import glob, json, os, sys
from PIL import Image, ImageDraw

shots, metas, prefix = sys.argv[1:4]
per, cols = (int(v) for v in (sys.argv[4:6] + ["6", "2"][len(sys.argv[4:6]):]))
views = (sys.argv[6] if len(sys.argv) > 6 else "front,back,face").split(",")
names = sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(metas, "*.json")))
for page in range(0, len(names), per):
    cells = []
    for name in names[page:page + per]:
        meta = json.load(open(os.path.join(metas, name + ".json")))
        imgs = [Image.open(os.path.join(shots, f"{name}_{v}.jpg")) for v in views]
        cell = Image.new("RGB", (sum(i.width for i in imgs), imgs[0].height + 20), (30, 30, 30))
        x = 0
        for i in imgs:
            cell.paste(i, (x, 20))
            x += i.width
        hair = f"{meta.get('hair')} {meta.get('hair_colour') or ''}".strip()
        ImageDraw.Draw(cell).text((4, 4), f"{name}  {meta['desc']}  {sum(meta.get('tris', {}).values())} tris  hair={hair}  {'+'.join(meta.get('wear', []))}"[:cell.width // 6], fill=(255, 255, 255))
        cells.append(cell)
    w, h = cells[0].size
    sheet = Image.new("RGB", (w * min(cols, len(cells)), h * -(-len(cells) // cols)), (221, 221, 221))
    for k, cell in enumerate(cells):
        sheet.paste(cell, (k % cols * w, k // cols * h))
    sheet.save(f"{prefix}{page // per}.jpg", quality=88)
