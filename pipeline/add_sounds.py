"""Recorded animal calls: embeds research/assets/sounds/*.ogg (mono 24 kHz Opus, see SOURCE.md there) as one rasAnim JSON block and
splices sounds.js over voice.js's synthesised sfxAnimal, which is kept as the fallback. Run after voice and animals2.

usage: add_sounds.py page.html   (edits in place)
"""
import base64, glob, json, os, sys

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'sounds.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


clips = {os.path.basename(f)[:-4]: base64.b64encode(open(f, 'rb').read()).decode()
         for f in sorted(glob.glob(os.path.join(here, '..', 'research', 'assets', 'sounds', '*.ogg')))}
assert len(clips) == 11, sorted(clips)
block = json.dumps(clips, sort_keys=True, separators=(',', ':'))

rep('function sfxAnimal(kind,x,z,o={}){const S=SFX_ANIMAL[kind];', 'function sfxAnimal_0(kind,x,z,o={}){const S=SFX_ANIMAL[kind];')
rep('sfxAnimal(q.kind,a.x,a.z)', 'sfxAnimal(q.kind,a.x,a.z,{sp:a.name})')
rep('function updateBells(){', js + 'function updateBells(){')
rep('</body>', '<script type="application/json" id="rasAnim">%s</script>\n</body>' % block)
open(path, 'w', encoding='utf-8').write(h)
print('sounds ok: %d clips, %.0f KB embedded' % (len(clips), len(block) / 1024))
