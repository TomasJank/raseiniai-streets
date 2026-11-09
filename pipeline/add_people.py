"""People who notice: panic that spreads, dodging every car and the bus, crossing at crossings and on red at the three lights,
waiting for and boarding the bus, walking into shops, walking in pairs, looking at the player, more of them by day and in the centre.
Crossings are the highway=crossing nodes in OpenStreetMap (queried 2026-11-03).
usage: add_people.py page.html   (edits in place; run after add_extra.py)
"""
import os, sys
path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'people.js'), encoding='utf-8').read()
js = js.replace('__CROSSINGS__', open(os.path.join(here, 'crossings.txt')).read().strip())
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)
def body(name):
    i = h.index(name); k = h.index('{', i); d = 0
    for j in range(k, len(h)):
        d += h[j] == '{'
        d -= h[j] == '}'
        if d == 0:
            return h[i:j + 1]

rep(body('function updatePeople(dt){'), js.strip())
rep(body('function pedPlace(p){') + '\n', '')
rep('const PED_N=28,', 'const PED_N=40,')
rep('let off=p.e.w/2+1.5,', 'let off=p.e.w/2+1.5+(p.lane||0),')
# head turns: parts 3-5 are head, hair and long hair
rep('function poseAt(i,look,x,z,h,fall,lift,ph,gait,wave){', 'function poseAt(i,look,x,z,h,fall,lift,ph,gait,wave,yaw=0){')
rep('_pj.set(ang[k],0,(p.z||0)+(wave&&k===9?.45:0));', '_pj.set(ang[k],k>=3&&k<=5?yaw:0,(p.z||0)+(wave&&k===9?.45:0));')
rep('function crashFX(c,n,sp){', 'function crashFX(c,n,sp){\n  if(sp>6)pedEvent(c.x,c.z,30,14);')
# bus stops remember where their pole and kerb are
rep('at.push({s:L,name:stops[i].name});', 'at.push({s:L,name:stops[i].name,st:stops[i]});')
rep('for(const st of stops){const P=busAt({pts,cum,L},cumAtNode(pts,cum,st.n)),x=P.x+P.ox*2.6,z=P.z+P.oz*2.6,g=new THREE.Group(),y=GY(x,z);',
    'for(const st of stops){const P=busAt({pts,cum,L},cumAtNode(pts,cum,st.n)),x=P.x+P.ox*2.6,z=P.z+P.oz*2.6,g=new THREE.Group(),y=GY(x,z);st.x=x;st.z=z;st.rx=P.x;st.rz=P.z;')
# traffic and the bus stop for people on the road
rep('for(const o of world.cars)if(o!==c&&chk(o.x,o.z))return true;\n  if(busAhead(c,chk))return true;',
    "for(const o of world.cars)if(o!==c&&chk(o.x,o.z))return true;\n  if(busAhead(c,chk))return true;\n  for(const p of peds)if((p.mode==='cross'||p.mode==='flee'||p.mode==='down')&&chk(p.x,p.z))return true;")
rep('return chk(player.x,player.z)||world.cars.some(o=>chk(o.x,o.z));',
    "return chk(player.x,player.z)||world.cars.some(o=>chk(o.x,o.z))||peds.some(p=>(p.mode==='cross'||p.mode==='down')&&chk(p.x,p.z));")
rep('  for(const p of peds)p.mode=\'hide\';\n  buildRoads();', "  for(const p of peds){p.mode='hide';p.lead=null;}crossPts=null;pedEvents=[];\n  buildRoads();")
open(path, 'w', encoding='utf-8').write(h)
print('people ok')
