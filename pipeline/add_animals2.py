"""GLB animals over the instanced quad rig: wraps poseQuad / animHide / animSound / updateAnimals (animals2.js), embeds the deflated GLBs from research/assets/animals/built.

usage: add_animals2.py page.html   (edits in place; run after add_assets.py and add_animals.py, i.e. last)
"""
import base64, glob, os, sys, zlib

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'animals2.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


assert 'const ASSETS=' in h and 'function poseQuad(a){' in h, 'run after add_assets.py and add_animals.py'
blocks, raw, packed = [], 0, 0
for f in sorted(glob.glob(os.path.join(here, '..', 'research', 'assets', 'animals', 'built', 'animal_*.glb'))):
    n = os.path.basename(f)[7:-4]
    b = open(f, 'rb').read()
    z = zlib.compress(b, 9)
    raw += len(b); packed += len(z)
    blocks.append('<script type="application/octet-stream" id="agz_%s">%s</script>\n' % (n, base64.b64encode(z).decode()))
assert blocks, 'no GLBs in research/assets/animals/built'
rep('</body>', ''.join(blocks) + '</body>')
rep('function poseQuad(a){', 'function poseQuad_0(a){')
rep('function animHide(a){', 'function animHide_0(a){')
rep('function animSound(a){', 'function animSound_0(a){')
rep('function updateAnimals(dt){', 'function updateAnimals_0(dt){')
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('animals2 ok: %d GLBs, %d KB raw, %d KB embedded' % (len(blocks), raw // 1024, sum(map(len, blocks)) // 1024))
