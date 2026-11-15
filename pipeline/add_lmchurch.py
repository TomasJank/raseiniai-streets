"""The Ėmimo į Dangų church (c92) and the Trejybės cerkvė (c219) drawn from Blender models (lmchurch.js; models pipeline/lmchurch/*.glb,
made by research/assets/houses/church/make.sh). Runs after assets, facades and landmarks2; independent of house5a and maxima.
usage: add_lmchurch.py page.html   (edits in place)
"""
import base64, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


assert 'const ASSETS=' in h and 'function landmarks2(' in h, 'run after add_assets.py and add_landmarks2.py'
rep('// ---------- boot ----------', open(os.path.join(d, 'lmchurch.js'), encoding='utf-8').read() + '\n// ---------- boot ----------')
n = 0
for m in ('church', 'cerkve'):
    glb = open(os.path.join(d, 'lmchurch', m + '.glb'), 'rb').read(); n += len(glb)
    rep('</body>', '<script type="application/octet-stream" id="asset_lmchurch_%s">%s</script>\n</body>' % (m, base64.b64encode(glb).decode()))
open(path, 'w', encoding='utf-8').write(h)
print('lmchurch ok: %d B models' % n)
