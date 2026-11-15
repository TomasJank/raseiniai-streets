"""Ground colour map: embeds pipeline/geo/ground_{in,out}.webp (made by geo/ground_map.py) and ground.js, which paints the ground with them.
usage: add_ground.py page.html   (edits in place)
"""
import base64, os, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(here, 'geo'))
from ground_map import IN_E, OUT_E, TOWN

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = "const GMAP_IN_E=%d,GMAP_OUT_E=%d,GMAP_TOWN='%s';\n" % (IN_E, OUT_E, ','.join('vec3(%.3f,%.3f,%.3f)' % tuple(v / 255 for v in TOWN[k]) for k in sorted(TOWN))) + open(os.path.join(here, 'ground.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


blocks, n = '', 0
for k in ('in', 'out'):
    raw = open(os.path.join(here, 'geo', 'ground_%s.webp' % k), 'rb').read()
    n += len(raw)
    blocks += '<script type="application/octet-stream" id="ground%s">%s</script>\n' % (k.capitalize(), base64.b64encode(raw).decode())
rep('</body>', blocks + '</body>')
rep('function buildExtra(){', js + 'function buildExtra(){')
rep('buildLandmarks();buildStreets();', 'buildLandmarks();buildStreets();groundInstall();')
open(path, 'w', encoding='utf-8').write(h)
print('ground ok: %d KB raw, %d KB embedded' % (n // 1024, (len(blocks) + len(js)) // 1024))
