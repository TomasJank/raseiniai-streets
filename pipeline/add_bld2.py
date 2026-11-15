"""Cadastre buildings: add the ones OSM lacks and style outbuildings by cadastre class (data: geo/bld2_data.json from geo/bld2_build.py).
usage: add_bld2.py page.html   (edits in place; run after the whole chain, in either order with add_roads2.py)
Appends ways, nodes and tag entries to the rasData block; existing indices never move.
"""
import json, math, os, sys, zlib
here = os.path.dirname(os.path.abspath(__file__))
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'bld2.js'), encoding='utf-8').read()
data = json.load(open(os.path.join(here, 'geo', 'bld2_data.json')))
cad = json.load(open(os.path.join(here, 'geo', 'grpk_buildings.json')))['buildings']
LAT0, LON0 = 55.377401, 23.120024700000002
KX, KZ = 111320 * math.cos(LAT0 * math.pi / 180), 110540


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


def area(p):
    return abs(sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))) / 2


a = '<script type="application/json" id="rasData">'
i = h.index(a) + len(a)
j = h.index('</script>', i)
d = json.loads(h[i:j])
nw0 = len(d['w'])
tags = {}
ents = []
for k in sorted(data['codes'], key=int):
    ents.append('%s:%s' % (k, data['codes'][k]))
for ad in data['added']:
    b = cad[ad['g']]
    p = b['rings'][0]
    ar = area(p)
    c = ad['c']
    if c in 'nx':
        c = 's' if ar < 45 else 'm' if ar < 250 else 'f'
    kind = {'g': 'garages', 'h': 'greenhouse', 'f': 'farm_auxiliary', 'a': 'shed', 's': 'shed', 'm': 'yes',
            'r': 'apartments' if b.get('PASK') == '140' else 'house'}[c]
    key = (kind, c)
    if key not in tags:
        tags[key] = len(d['t'])
        d['t'].append({'building': kind, 'bld2': c})
    ref0 = len(d['n']) // 2
    for q in p:
        d['n'] += [round((LAT0 - q[1] / KZ - d['lat0']) * 1e6), round((LON0 + q[0] / KX - d['lon0']) * 1e6)]
    d['w'].append([tags[key]] + list(range(ref0, ref0 + len(p))) + [ref0])
    ents.append('%d:%s:%s' % (len(d['w']) - 1, c, ad['rgb']))
h = h[:i] + json.dumps(d, separators=(',', ':'), ensure_ascii=False) + h[j:]

rep("function buildExtra(){", 'const BLD2D="%s";\n' % ';'.join(ents) + js + "function buildExtra(){")
rep("let pool=ways.filter(w=>w.tags.building);", "let pool=ways.filter(w=>w.tags.building&&!w.tags.bld2);")
rep("if(!inBox(pts[0][0],pts[0][1],100))continue;", "if(!inBox(pts[0][0],pts[0][1],t.bld2?900:100))continue;")
# the start point is the road node nearest the building centroid: added buildings must not move it
rep("look:!!LOOK[w.id]&&!LOOK[w.id].street};", "look:!!LOOK[w.id]&&!LOOK[w.id].street,b2:!!t.bld2};")
rep("for(const bb of W.buildings){sx+=(bb.mnx+bb.mxx)/2;sz+=(bb.mnz+bb.mxz)/2;}sx/=W.buildings.length;sz/=W.buildings.length;}",
    "let sn=0;for(const bb of W.buildings)if(!bb.b2){sx+=(bb.mnx+bb.mxx)/2;sz+=(bb.mnz+bb.mxz)/2;sn++;}sx/=sn;sz/=sn;}")
open(path, 'w', encoding='utf-8').write(h)
print('bld2 ok: %d ways added, %d restyled, %d B' % (len(d['w']) - nw0, len(data['codes']), len(';'.join(ents))))
