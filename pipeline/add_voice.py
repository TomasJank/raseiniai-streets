"""Spoken Lithuanian dialogue and animal sounds: embeds the clips voice.py cached in work/voice as one rasVoice JSON block
and splices voice.js (talkVoice, sfxAnimal) into the game. Lines without a clip stay silent and are listed.

usage: add_voice.py page.html   (edits in place; run voice.py page.html first to make missing clips)
"""
import base64, json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

from voice import EDGE, MALE_RATE, SAY, cast, clip, lines, rejected

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voice.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


def seconds(f):
    out = subprocess.run(['/opt/homebrew/bin/ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
                         check=True, capture_output=True, text=True).stdout
    return round(float(out), 3)


clips, table, missing = {}, {}, []
roles, bad, eleven = cast(h), rejected(), 0
for t in lines(h):
    if all(os.path.exists(clip(v, t)) for v in EDGE):
        # each slot takes the conversation's ElevenLabs voice where that clip exists, else stays on Edge
        f, m = (clip(e, t) if (e, t) not in bad and os.path.exists(clip(e, t)) else clip(d, t) for e, d in zip(roles.get(t, EDGE), EDGE))
        eleven += (f != clip(EDGE[0], t)) + (m != clip(EDGE[1], t))
        rate = 1
    elif os.path.exists(clip(SAY[0], t)):
        f = m = clip(SAY[0], t)
        rate = MALE_RATE
    else:
        missing.append(t)
        continue
    table[t] = [os.path.basename(f)[:12], os.path.basename(m)[:12], rate]
    clips[os.path.basename(f)[:12]] = f
    clips[os.path.basename(m)[:12]] = m
with ThreadPoolExecutor(8) as ex:
    secs = dict(zip(clips, ex.map(seconds, clips.values())))
data = {'clips': {k: [base64.b64encode(open(f, 'rb').read()).decode(), secs[k]] for k, f in clips.items()}, 'lines': table}
block = json.dumps(data, sort_keys=True, ensure_ascii=False, separators=(',', ':'))

rep('</body>', '<script type="application/json" id="rasVoice">%s</script>\n</body>' % block)
rep('function updateBells(){', js + 'function updateBells(){')
rep('g.text=t;g.say=1.2+t.length*.07;', 'g.text=t;g.say=Math.max(1.2+t.length*.07,talkVoice(g));')

open(path, 'w', encoding='utf-8').write(h)
if missing:
    print('voice: %d lines without a clip stay silent (run pipeline/voice.py on the page): %s' % (len(missing), ' | '.join(missing)))
print('voice ok: %d lines, %d clips (%d of %d slots ElevenLabs), %.0f KB embedded' % (len(table), len(clips), eleven, 2 * len(table), len(block) / 1024))
