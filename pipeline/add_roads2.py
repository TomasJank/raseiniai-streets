"""Road surfaces from the 2024 orthophoto: writes a surface tag onto the rasData ways listed in geo/roads2_surface.json
(made by geo/roads2_classify.py). The game's own handling of surface=gravel/unpaved does the rest: road colour, grip, tyre sound, no sidewalks.
Ways keep their index; new tag sets are appended to the end of rasData.t.
usage: add_roads2.py page.html   (edits in place; run after add_landmarks2.py)
"""
import json, os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
here = os.path.dirname(os.path.abspath(__file__))
res = json.load(open(os.path.join(here, 'geo', 'roads2_surface.json')))

a = h.index('id="rasData">') + len('id="rasData">')
b = h.index('</script>', a)
d = json.loads(h[a:b])
tags = {json.dumps(t, sort_keys=True): i for i, t in enumerate(d['t'])}
n = added = 0
for i, (surf, _, _, hw, *_) in sorted({**res['set'], **res['overrides']}.items(), key=lambda kv: int(kv[0])):
    w = d['w'][int(i)]
    t = d['t'][w[0]]
    assert t.get('highway') == hw, (i, t, hw)
    key = json.dumps({**t, 'surface': surf}, sort_keys=True)
    if key not in tags:
        tags[key] = len(d['t'])
        d['t'].append(json.loads(key))
        added += 1
    w[0] = tags[key]
    n += 1
h = h[:a] + json.dumps(d, separators=(',', ':'), ensure_ascii=False) + h[b:]

def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


# the photo's gravel is paler than the old unpaved colour
rep("unpaved?[.58,.54,.46]:", "unpaved?[.68,.63,.54]:")
open(path, 'w', encoding='utf-8').write(h)
print('roads2 ok: %d ways, %d tag sets added' % (n, added))
