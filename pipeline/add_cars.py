"""One parametrised car builder: buildCar(M,lot) (cars.js) and one model file per car (cars/*.js, contract in
cars/README.md) replace the twelve copies of the lofted Audi builder that add_skoda.py and add_views.py left behind.
The twelve old geometries come out identical (work/test_cars.mjs checks it against v37).

usage: add_cars.py page.html   (edits in place; first step of build.sh)
"""
import glob, os, re, sys

# traffic and parked-car mix: each key is a cars/{key}.js model, listed once per share of the fleet
TRAFFIC = ['saloon', 'estate', 'mpv', 'hatch', 'suv',
           'passat_b5', 'passat_b5', 'passat_b5', 'passat_b6', 'golf4', 'golf4', 'golf5', 'a4_b6', 'a4_b6', 'a6_c5_avant', 'a6_c5_avant',
           'e46', 'e46', 'e39', 'astra_g', 'zafira_a',
           'avensis', 'avensis', 'rav4', 'corolla', 'qashqai', 'sportage']

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
here = os.path.dirname(os.path.abspath(__file__))


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


models = []
for f in sorted(glob.glob(os.path.join(here, 'cars', '*.js'))):
    key = os.path.basename(f)[:-3]
    js = open(f, encoding='utf-8').read()
    assert re.search(r'^CAR_MODELS\.%s=\{' % re.escape(key), js, re.M), 'cars/%s.js must define CAR_MODELS.%s' % (key, key)
    models.append((key, js.rstrip('\n') + '\n'))
keys = [k for k, _ in models]
for k in TRAFFIC:
    assert k in keys, 'TRAFFIC key %s has no cars/%s.js' % (k, k)

a = h.index('const carGeo=(()=>{')
b = h.index('})();\n', h.index('const skodaGeo=(()=>{')) + 6
assert h[a:b].count('=(()=>{') == 2, h[a:b].count('=(()=>{')
builder = open(os.path.join(here, 'cars.js'), encoding='utf-8').read()
h = h[:a] + 'const CAR_MODELS={};\n' + builder + ''.join(js for _, js in models) + \
    'const carGeo=buildCar(CAR_MODELS.audi80);\nconst skodaGeo=buildCar(CAR_MODELS.octavia);\n' + h[b:]

a = h.index('const saloonGeo=(()=>{')
b = h.index('];\n', h.index('const TRAFFIC_GEOS=[', a)) + 3
assert h[a:b].count('=(()=>{') == 10, h[a:b].count('=(()=>{')
uniq = list(dict.fromkeys(TRAFFIC))
h = h[:a] + 'const ' + ','.join('%sGeo=buildCar(CAR_MODELS.%s),%sLotGeo=buildCar(CAR_MODELS.%s,true)' % (k, k, k, k) for k in uniq) + ';\n' + \
    'const TRAFFIC_GEOS=[%s],LOT_GEOS=[%s];\n' % (','.join(k + 'Geo' for k in TRAFFIC), ','.join(k + 'LotGeo' for k in TRAFFIC)) + h[b:]

# wheels sit on each model's own axles
rep("for(const z of AXLES)for(const x of[-.74,.74]){const w=new THREE.Mesh(G.wheel,trimM);", "for(const z of G.axles)for(const x of[-.74,.74]){const w=new THREE.Mesh(G.wheel,trimM);")
rep("let j=0;for(const az of AXLES)for(const ax of[-.74,.74]){Mw.", "let j=0;for(const az of LOT_GEOS[c.k].axles)for(const ax of[-.74,.74]){Mw.")

# paint carries vertex colours (white, or darkened by a model's grime), so the material must read them
n = h.count('specular:0x383838,shininess:60}')
assert n == 3, n
h = h.replace('specular:0x383838,shininess:60}', 'specular:0x383838,shininess:60,vertexColors:true}')

open(path, 'w', encoding='utf-8').write(h)
print('cars ok')
