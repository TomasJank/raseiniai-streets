"""Recorded car sounds: embeds research/assets/sounds/cars/clips/*.ogg (mono 24 kHz Opus, cut by make.py there, sources in
SOURCE.md) as one rasCarSnd JSON block and splices carsound.js, which wraps updateAudio, enterExit, crashFX, carHitCar,
breakLamps, tone and burst at run time and adds carBumpSound(strength). Only the engine sets named in CS_PICK go in.

usage: add_carsound.py page.html   (edits in place; after drive and every step that wraps those functions, before hud2)
"""
import base64, glob, json, os, re, sys

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'carsound.js'), encoding='utf-8').read()
cdir = os.path.join(here, '..', 'research', 'assets', 'sounds', 'cars', 'clips')
meta = json.load(open(os.path.join(cdir, 'meta.json')))


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


pick = set(re.search(r"const CS_PICK=\{petrol:'(\w+)',diesel:'(\w+)'\}", js).groups())
keep = lambda n: not isinstance(meta[n], list) or meta[n][0] == 0 or n.split('_')[0] in pick
clips = {n: base64.b64encode(open(os.path.join(cdir, n + '.ogg'), 'rb').read()).decode() for n in sorted(meta) if keep(n)}
for p in pick:
    assert sum(1 for n in clips if n.startswith(p + '_')) >= 4, 'engine set %s has too few loops' % p
block = json.dumps({'meta': {n: meta[n] for n in clips}, 'clips': clips}, sort_keys=True, separators=(',', ':'))

rep('// ---------- boot ----------', js + '// ---------- boot ----------')
rep('</body>', '<script type="application/json" id="rasCarSnd">%s</script>\n</body>' % block)
m = re.search(r'<div class="hud" id="credit">.*?</div>', h, re.S)
h = h[:m.end() - 6] + ' · Car sounds: freesound.org (CC0)' + h[m.end() - 6:]
open(path, 'w', encoding='utf-8').write(h)
print('carsound ok: %d clips, %.0f KB embedded' % (len(clips), len(block) / 1024))
