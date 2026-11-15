"""Sketchfab street objects (props2.js; models in pipeline/props2/, made by research/assets/sketchfab/props_convert.mjs).
Runs after jump. The older builders ask p2Take() before they draw a bench, lamp, bin or shelter out of boxes.
usage: add_props2.py page.html   (edits in place)
"""
import base64, json, os, re, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
d = os.path.dirname(os.path.abspath(__file__))
table = json.load(open(os.path.join(d, 'props2', 'props.json')))


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


assert 'const ASSETS=' in h and 'function jumpTable(){' in h and ',STREET_KINDS=' in h, 'run after add_assets.py, add_streets.py and add_jump.py'
# park benches (buildStadium) and the benches by block doors and on the square (buildTown)
rep("(world.benches||(world.benches=[])).push([x,z,Math.atan2(fx,fz)]);",
    "(world.benches||(world.benches=[])).push([x,z,Math.atan2(fx,fz)]);if(p2Take('bench',x,z,Math.atan2(fx,fz)))return;")
rep("const bench=(w,t,o)=>{const [bx,bz]=w.at(t,o),[kx,kz]=w.at(t,o-.2),g=GY(bx,bz);",
    "const bench=(w,t,o)=>{const [bx,bz]=w.at(t,o),[kx,kz]=w.at(t,o-.2),g=GY(bx,bz);if(p2Take('bench',bx,bz,Math.atan2(w.nx,w.nz)))return;")
# park lamps and bins
a = "if(j%3===0)kn.push({x:bx,z:bz,r:.12,snap:true,minSp:7,h:4.6,parts:[['lamp',put('lamp',bx,bz,2.25,0,.13,4.5,.13)-1],['lampH',put('lampH',bx,bz,4.55,0,.42,.18,.42)-1]]});"
rep(a, "if(j%3===0){if(!p2Take('lamp',bx,bz,Math.atan2(-nx,-nz),7))" + a[len('if(j%3===0)'):] + "}")
rep("if(j%2){const x=bx+ux*1.4,z=bz+uz*1.4;kn.push({", "if(j%2){const x=bx+ux*1.4,z=bz+uz*1.4;if(!p2Take('bin',x,z,Math.atan2(-nx,-nz),5))kn.push({")
# bus shelters; every mapped stop is also a mark (kiosks stand by stops)
rep("if(sh===0||/stotis|AS$/.test(name))continue;",
    "p2Mark('stop',cx,cz,Math.atan2(-nx,-nz));if(sh===0||/stotis|AS$/.test(name)||p2Take('shelter',cx,cz,Math.atan2(-nx,-nz)))continue;")
# blocks of flats: the spot beside the recycling bells and the yard behind the block
rep("const [rx,rz]=F.at(-4,6);if(!W.inBuilding(rx,rz)&&!onRoad(rx,rz,1)){const g=GY(rx,rz);",
    "p2Mark('yard',...B.at(B.l/2,14),B.hd);const [rx,rz]=F.at(-4,6);if(!W.inBuilding(rx,rz)&&!onRoad(rx,rz,1)){const g=GY(rx,rz);p2Mark('bells',rx-F.ux*2.6,rz-F.uz*2.6,Math.atan2(F.nx,F.nz));")

rep("put(k,[x,g+.75,z,0,1,1,1]);addWall(x-.8,z,x+.8,z);", "if(p2Take('bell',x,z,Math.atan2(F.nx,F.nz),0,0,q))return;put(k,[x,g+.75,z,0,1,1,1]);addWall(x-.8,z,x+.8,z);")
# bus stop signs: the mapped stops (instanced boxes) and the stops of the bus loop (groups)
a = "kn.push({x:sx,z:sz,r:.1,snap:true,minSp:5,h:2.6,parts:[['lamp',put('lamp',sx,sz,1.3,hd,.07,2.6,.07)-1],['sign',put('sign',...at(-2.6,-.62),2.4,hd,.5,.5,.03)-1]]});"
rep(a, "if(!p2Take('stopsign',sx,sz,Math.atan2(-nx,-nz),5))" + a)
a = "worldGroup.add(g);addProp({x,z,r:.1,snap:true,minSp:5,h:2.6,parts:[{obj:g}]});"
rep(a, "if(!p2Take('stopsign',x,z,P.h,5)){" + a + "}")
# traffic lights: the model takes the place of the pole and head, the live lenses stay
a = "g.position.set(px,gy,pz);g.rotation.y=Math.atan2(u[0],u[1]);worldGroup.add(g);"
rep(a, a + "p2Signal(g,pole,head,lamps);")
# street-file fences of a style that has a model are not drawn as boxes
# garden hedges from the town code (thuja/clipped/loose plants, placed by p2Build)
rep("else if(style==='hedge')hedge(HG,a,b,1.2+hash(key)*.6,", "else if(style==='hedge'&&p2Hedge(a,b,1.2+hash(key)*.6,key)){}else if(style==='hedge')hedge(HG,a,b,1.2+hash(key)*.6,")
rep("if(k.startsWith('fence:')){const [st,fc]=k.slice(6).split('|'),m=instances(",
    "if(k.startsWith('fence:')&&P2.kinds['fence_'+k.slice(6).split('|')[0]])continue;if(k.startsWith('fence:')){const [st,fc]=k.slice(6).split('|'),m=instances(")

blocks = ''.join('<script type="application/octet-stream" id="asset_props2_%s">%s</script>\n'
                 % (k, base64.b64encode(open(os.path.join(d, 'props2', k + '.glb'), 'rb').read()).decode()) for k in table)
game = {k: {a: b for a, b in r.items() if a not in ('src', 'faces', 'bytes')} for k, r in table.items()}
js = 'const PROPS2=%s;\n' % json.dumps(game, separators=(',', ':')) + open(os.path.join(d, 'props2.js'), encoding='utf-8').read()
rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
rep('</body>', blocks + '</body>')
# credit: one entry per source model, in table order
seen, by = [], {}
for r in table.values():
    s = r['src']
    if s['i'] not in seen:
        seen.append(s['i'])
        by.setdefault(s['user'], []).append(s['name'])
credit = 'Street objects from Sketchfab, CC BY 4.0 (modified): ' + '; '.join('%s by %s' % (', '.join(n), u) for u, n in by.items())
m = re.search(r'<div class="hud" id="credit">.*?</div>', h, re.S)
assert m and table
h = h[:m.end() - 6] + ' · ' + credit + h[m.end() - 6:]
open(path, 'w', encoding='utf-8').write(h)
print('props2 ok: %d models, %d B data, %d B js' % (len(table), len(blocks), len(js)))
