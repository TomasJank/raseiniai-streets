"""Outfits for the mannequins: embeds the re-rigged Quaternius modular characters as deflated agz_clothes_m / agz_clothes_f blocks and wraps charInit / charMake / charPose / charTick (clothes.js).

usage: add_clothes.py page.html   (edits in place; run after drive2, i.e. last)
"""
import base64, os, sys, zlib

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'clothes.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


assert 'function charMake(b){' in h and 'charPose=function(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act){' in h, 'run add_chars.py and add_fixpeople.py first'
blocks, raw = [], 0
for g in 'mf':
    b = open(os.path.join(here, '..', 'research', 'assets', 'characters', 'clothes_body_%s.glb' % g), 'rb').read()
    raw += len(b)
    blocks.append('<script type="application/octet-stream" id="agz_clothes_%s">%s</script>\n' % (g, base64.b64encode(zlib.compress(b, 9)).decode()))
rep('</body>', ''.join(blocks) + '</body>')
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('clothes ok: %d KB raw, %d KB embedded' % (raw // 1024, sum(map(len, blocks)) // 1024))
