"""People answer back: walk into someone on foot or hit them and they snap at him in Lithuanian (react.js, react/lines.json).
Clips cached by react/clips.py are merged into the rasVoice block; a line without a clip still gets its bubble.

usage: add_react.py page.html   (edits in place; after voice and fight2; run react/clips.py first for new lines)
"""
import base64, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from react.clips import clip, slots  # noqa: E402

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(HERE, 'react.js'), encoding='utf-8').read()
L = json.load(open(os.path.join(HERE, 'react', 'lines.json'), encoding='utf-8'))


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


def seconds(f):
    out = subprocess.run(['/opt/homebrew/bin/ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
                         check=True, capture_output=True, text=True).stdout
    return round(float(out), 3)


assert 'function dmgPed(' in h and 'id="rasVoice"' in h, 'run add_fight2.py and add_voice.py first'
a = h.index('<script type="application/json" id="rasVoice">') + len('<script type="application/json" id="rasVoice">')
b = h.index('</script>', a)
V = json.loads(h[a:b])
n0, missing, added = len(V['clips']), [], 0
for who, t in sorted({(w, t) for pool in L.values() for w, ts in pool.items() for t in ts}):
    fv, mv = slots(who, t)  # ElevenLabs where its clip exists, else Edge
    have = [v for v in dict.fromkeys((fv, mv)) if v and os.path.exists(clip(v, t))]
    if not have:
        missing.append(t)
        continue
    ids = {}
    for v in have:
        f = clip(v, t)
        ids[v] = os.path.basename(f)[:12]
        if ids[v] not in V['clips']:
            V['clips'][ids[v]] = [base64.b64encode(open(f, 'rb').read()).decode(), seconds(f)]
            added += len(V['clips'][ids[v]][0])
    if t not in V['lines']:
        fid, mid = ids.get(fv, ids.get(mv)), ids.get(mv, ids.get(fv))
        V['lines'][t] = [fid, mid, 1]
h = h[:a] + json.dumps(V, sort_keys=True, ensure_ascii=False, separators=(',', ':')) + h[b:]

rep('// ---------- boot ----------', 'const REACT_LINES=%s;\n%s\n// ---------- boot ----------' % (json.dumps(L, ensure_ascii=False, separators=(',', ':')), js))
open(path, 'w', encoding='utf-8').write(h)
if missing:
    print('react: %d lines without a clip only show a bubble (run pipeline/react/clips.py): %s' % (len(missing), ' | '.join(missing)))
print('react ok: %d clips, %d B of audio added' % (len(V['clips']) - n0, added))
