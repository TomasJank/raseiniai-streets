"""Real kick animation on the mannequins: embeds the retargeted KayKit kick as a deflated agz_kick_clips block and wraps charInit / charAnim (kick.js).

usage: add_kick.py page.html   (edits in place; run last, after add_fixtalk.py)
"""
import base64, os, sys, zlib

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'kick.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


assert 'function charAnim0(' in h and 'charAnim=function(st,dt){' in h, 'run add_fight2.py and add_fixpeople.py first'
raw = open(os.path.join(here, '..', 'research', 'assets', 'characters', 'clips_kick.glb'), 'rb').read()
z = base64.b64encode(zlib.compress(raw, 9)).decode()
rep('</body>', '<script type="application/octet-stream" id="agz_kick_clips">%s</script>\n</body>' % z)
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('kick ok: %d B raw, %d B embedded' % (len(raw), len(z)))
