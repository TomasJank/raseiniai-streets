"""Roof colours from the ORT10LT orthophoto (research/geodata/roofs.json, made by research/geodata/roofs.py).

Per building with conf >= 0.5 and footprint >= 12 m2 the roof colour becomes the measured one; clay tile and
standing seam (conf >= 0.6) also set the roof material. Other classes keep the facades rule with the measured colour.
Buildings whose LOOK entry has a roof, and tour-video facade tags with a roof colour, are left alone.
Only ~55 KB of per-building colours ship, no imagery.

usage: add_roofs.py page.html   (edits in place; run after add_facades.py (hooks facadeRefine/roofSty); roofSty uses facades2's string key convention)
"""
import json, math, os, sys

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
geo = os.path.join(here, '..', 'research', 'geodata')
GAIN = 0.85  # photo value -> vertex colour. Colour management is off, so no sRGB conversion; the game lights lit slopes ~1.2x and the photo is already sunlit
h = open(path, encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


roofs = json.load(open(os.path.join(geo, 'roofs.json')))
fps = {o['id']: o['pts'] for o in json.load(open(os.path.join(geo, 'footprints.json')))}


def area(pts):
    k = math.cos(math.radians(pts[0][0]))
    xy = [(p[1] * 111320 * k, p[0] * 110540) for p in pts]
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(xy, xy[1:] + xy[:1]))) / 2


out = []
for id_ in sorted(roofs, key=lambda s: int(s[1:])):
    r = roofs[id_]
    if r['conf'] < .5 or id_ not in fps or area(fps[id_]) < 12:
        continue
    c = ''.join('%02x' % min(255, round(v * GAIN)) for v in r['rgb'])
    k = 't' if r['sty'] == 'clay tile' and r['conf'] >= .6 else 's' if r['sty'] == 'standing seam' and r['conf'] >= .6 else ''
    out.append('%s:%s%s' % (id_[1:], c, k))
blob = ';'.join(out)
assert len(blob) < 120_000, len(blob)

js = """const ROOFS=new Map(\"""" + blob + """\".split(';').map(e=>{const[i,v]=e.split(':');return['c'+i,{col:[0,2,4].map(k=>parseInt(v.slice(k,k+2),16)/255),k:{t:'tiles',s:'sheet'}[v[6]]}];}));
// measured orthophoto roof colour; LOOK roofs and tour-video facade roofs win, the rest of the spec is untouched
function roofsApply(sp,w){
  const L=LOOK[w.id],r=ROOFS.get(w.id),f=w.tags.facade;
  if(!r||(L&&(L.roof||L.roofSty))||(f&&f[1]))return;
  sp.roof=r.col;if(r.k)sp.roofSty=r.k;
}
function roofSty(s){
"""
rep("function roofSty(s){\n", js)
rep("const r=s.roof;if(r[0]>r[2]+.12)return STY.tiles;", "const r=s.roof;if(typeof s.roofSty==='string'&&STY[s.roofSty]!=null)return STY[s.roofSty];if(r[0]>r[2]+.12)return STY.tiles;")
rep("sp.rid=w.id;Object.assign(sp,FX.over[w.id]);", "sp.rid=w.id;Object.assign(sp,FX.over[w.id]);roofsApply(sp,w);")
rep("Terrain: Copernicus DEM GLO-30 © DLR, Airbus, EU/ESA (filtered)</div>",
    "Terrain: Copernicus DEM GLO-30 © DLR, Airbus, EU/ESA (filtered) · Roof colours derived from ORT10LT orthophoto, National Land Service (NŽT), geoportal.lt</div>")
open(path, 'w', encoding='utf-8').write(h)
print('roofs ok: %d buildings, %d B, %d clay tile, %d seam' % (len(out), len(blob), sum(e.endswith('t') for e in out), sum(e.endswith('s') for e in out)))
