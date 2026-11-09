"""Police cars become a Skoda Octavia Mk3 in Lithuanian police livery.

The Octavia is derived from the Audi builder's own source (same loft, arches and wheels), with its own
profile, front, rear and a white body with the green stripe, hood lettering and a POLICIJA light bar.
Modelled by eye from Tomas's reference photos; no pixels are used.
usage: add_skoda.py page.html   (edits in place; run after add_car.py and add_more.py)
"""
import re, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()


def rep(a, b, src=None):
    global h
    s = h if src is None else src
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
    if src is None:
        h = s
    return s


a = h.index('const carGeo=(()=>{')
b = h.index('})();\n', a) + 6
g = h[a:b].replace('const carGeo=', 'const skodaGeo=', 1)

# liftback: lower hood, higher belt, tall roof falling into a short tail
g = re.sub(r"const LOWER=\[.*?\];", lambda m: "const LOWER=[[2.24,.74,.32,.56,.6],[2.2,.8,.27,.617,.657],[2.12,.85,.23,.73,.77],[1.95,.865,.22,.77,.81],[1.715,.87,.22,.81,.85],[1.33,.87,.22,.88,.92],[.945,.87,.22,.92,.96],[.6,.87,.22,.94,.98],[0,.87,.22,.96,1],[-.6,.87,.22,.975,1.01],[-.835,.87,.22,.98,1.015],[-1.22,.87,.22,.99,1.025],[-1.45,.87,.22,.995,1.03],[-1.605,.87,.22,1,1.035],[-1.9,.86,.22,1.005,1.04],[-2.1,.84,.27,1,1.035],[-2.2,.76,.32,.95,1]];", g, count=1)
g = re.sub(r"const UPPER=\[.*?\];", lambda m: "const UPPER=[[1.02,0],[.86,1.03],[.66,1.17],[.46,1.3],[.28,1.39],[.08,1.445],[-.08,1.46],[-.16,1.46],[-.6,1.455],[-.9,1.435],[-1.08,1.4],[-1.14,1.39],[-1.3,1.33],[-1.5,1.24],[-1.7,1.15],[-1.9,1.07],[-2.02,0]];", g, count=1)
g = rep("side=z<.65&&z>-1.3,pillar=(z<-.12&&z>-.2)||(z<-.95&&z>-1.02);",
        "side=z<.66&&z>-1.6,pillar=(z<-.08&&z>-.16)||(z<-1.08&&z>-1.14);", g)
g = rep("return z>.38||z<-.72?[trim,GLASS]:[paint,PAINT];", "return z>.28||z<-1.0?[trim,GLASS]:[paint,PAINT];", g)
g = rep("for(const[a,b]of[[[.08,.96,.975],[.6,.96,.915]],[[-.5,.96,.975],[.02,.96,.915]]]){", "for(const[a,b]of[]){", g)

# front: sloped fascia with the tall slatted grille, badge, big swept lamps, lower intake and fog lamps
f0, f1 = g.index('  // front: black grille'), g.index('  // rear: boot lid')
g = g[:f0] + """  // front: the fascia leans back from the bumper; grille, lamps and badge sit on that slope
  const zf=y=>y<=.6?2.24:2.24-(y-.6)*.706,F=(x,y,o=.007)=>[x,y,zf(y)+o],FN=[0,.577,.817];
  // tall grille: chrome frame, black field, vertical slats, narrower at the bottom
  quad(trim,F(-.41,.75,.005),F(.41,.75,.005),F(.33,.585,.005),F(-.33,.585,.005),FN,CHROME,false);
  quad(trim,F(-.385,.738),F(.385,.738),F(.315,.598),F(-.315,.598),FN,BLACK,false);
  for(let i=-6;i<=6;i++){const t=i*.055,u=i*.045;quad(trim,F(t-.008,.734,.009),F(t+.008,.734,.009),F(u+.008,.602,.009),F(u-.008,.602,.009),FN,[.3,.31,.32],false);}
  // badge on the bonnet lip
  const disc=(cy,r,o,col)=>{for(let i=0;i<16;i++){const a=i/16*TAU,b=(i+1)/16*TAU;quad(trim,F(0,cy,o),F(0,cy,o),F(Math.cos(b)*r,cy+Math.sin(b)*r,o),F(Math.cos(a)*r,cy+Math.sin(a)*r,o),FN,col,false);}};
  disc(.785,.036,.012,CHROME);disc(.785,.026,.014,[.04,.22,.12]);
  // big swept lamps from the grille corner round onto the wing
  quad(trim,F(.405,.59,.006),F(.8,.62,.006),F(.8,.775,.006),F(.405,.752,.006),FN,BLACK);
  quad(head,F(.43,.605,.009),F(.6,.618,.009),F(.6,.745,.009),F(.43,.738,.009),FN,[.95,.96,.9]);
  quad(head,F(.61,.62,.009),F(.79,.632,.009),F(.79,.764,.009),F(.61,.748,.009),FN,[.8,.85,.88]);
  quad(head,[.836,.635,2.16],[.866,.665,1.96],[.866,.77,1.96],[.836,.77,2.16],[.95,0,.3],[.8,.85,.88]);
  // lower intake and fog lamps
  quad(trim,F(-.53,.25,.018),F(.53,.25,.018),F(.45,.4,.018),F(-.45,.4,.018),[0,0,1],BLACK,false);
  for(let i=0;i<4;i++)quad(trim,F(-.5+i*.03,.27+i*.032,.02),F(.5-i*.03,.27+i*.032,.02),F(.5-i*.03,.278+i*.032,.02),F(-.5+i*.03,.278+i*.032,.02),[0,0,1],[.16,.16,.17],false);
  quad(trim,[.6,.28,2.258],[.74,.28,2.238],[.73,.38,2.239],[.6,.38,2.258],[0,0,1],BLACK);
  quad(trim,[.63,.3,2.262],[.71,.3,2.247],[.705,.36,2.248],[.63,.36,2.262],[0,0,1],[.8,.8,.76]);
""" + g[f1:]
# rear: C-shaped lamps at the corners, plate on the tailgate, no black panel
r0, r1 = g.index('  // rear: boot lid'), g.index('  // deep plastic bumpers')
g = g[:r0] + """  // rear: plate on the tailgate between big C-shaped lamps that wrap round the corners
  // Lithuanian plate: dark frame, blue EU band, three letters and three digits
  const plate=(y,z,d)=>{const q=(x0,x1,y0,y1,o,col)=>quad(trim,[x0,y0,z+d*o],[x1,y0,z+d*o],[x1,y1,z+d*o],[x0,y1,z+d*o],[0,0,d],col,false);
    q(-.268,.268,y-.004,y+.114,0,BLACK);q(-.26,.26,y,y+.11,.002,WHITE);q(-.26,-.22,y,y+.11,.004,[.1,.2,.6]);
    for(let i=0;i<7;i++)if(i!==3)q(-.2+i*.064,-.155+i*.064,y+.02,y+.09,.004,[.08,.08,.09]);};
  plate(.74,-2.21,-1);plate(.42,2.256,1);
  quad(trim,[-.33,.885,-2.209],[.33,.885,-2.209],[.33,.893,-2.209],[-.33,.893,-2.209],[0,0,-1],CHROME,false);
  quad(tail,[.4,.81,-2.206],[.755,.79,-2.206],[.755,.94,-2.206],[.4,.93,-2.206],[0,0,-1],RED);
  quad(tail,[.49,.84,-2.209],[.7,.83,-2.209],[.7,.905,-2.209],[.49,.9,-2.209],[0,0,-1],[.42,.05,.07]);
  quad(tail,[.755,.79,-2.206],[.846,.79,-2.1],[.846,.94,-2.1],[.755,.94,-2.206],[.7,0,-.7],RED);
  quad(tail,[.848,.8,-2.1],[.864,.83,-1.9],[.864,.95,-1.9],[.848,.94,-2.1],[1,0,-.1],RED);
  quad(tail,[.68,.45,-2.247],[.76,.45,-2.232],[.76,.48,-2.232],[.68,.48,-2.247],[0,0,-1],[.6,.05,.07]);
""" + g[r1:]
# bumpers are body colour with a black lip; no rub strip
g = rep("quad(trim,[a,y0,z0],[b,y0,z1],[b,y1,z1],[a,y1,z0],w,col);quad(trim,[a,y1,z0],",
        "quad(col===PAINT?paint:trim,[a,y0,z0],[b,y0,z1],[b,y1,z1],[a,y1,z0],w,col);quad(col===PAINT?paint:trim,[a,y1,z0],", g)
g = rep("bumper(FR,.21,.54,PLASTIC);bumper(RR,.3,.58,PLASTIC);", "bumper(FR,.21,.6,PAINT);bumper(RR,.3,.62,PAINT);bumper(FR.map(([x,z])=>[x*1.002,z+.003]),.21,.27,BLACK);bumper(RR.map(([x,z])=>[x*1.002,z-.003]),.3,.37,BLACK);", g)
g = rep("bumper(FR.map(([x,z])=>[x*.995,z-.004*Math.sign(z)]),.54,.556,CHROME);", "", g)
g = rep("bumper(RR.map(([x,z])=>rib(x,z)),.44,.452,BLACK);bumper(RR.map(([x,z])=>rib(x,z)),.35,.36,BLACK);", "", g)
g = rep("quad(trim,[-.56,.26,2.254],[.56,.26,2.254],[.56,.32,2.254],[-.56,.32,2.254],[0,0,1],BLACK,false);", "", g)
g = rep("quad(trim,[-.26,.38,2.254],[.26,.38,2.254],[.26,.49,2.254],[-.26,.49,2.254],[0,0,1],WHITE,false);", "", g)
g = rep("quad(trim,[.858,.46,.94],[.858,.46,-.83],[.858,.56,-.83],[.858,.56,.94],side,PLASTIC);", "", g)
# shut lines, handles in the Octavia's places, body-colour mirrors
g = rep("for(const[z,y0]of[[.72,.33],[-.17,.33],[-1.1,.68]]){", "for(const[z,y0]of[[.74,.33],[-.12,.33],[-1.12,.69]]){", g)
g = rep("quad(trim,[.855,Math.max(y0,.6),z],[.855,Math.max(y0,.6),z+.012],[.83,.92,z+.012],[.83,.92,z],side,BLACK);",
        "quad(trim,[.875,Math.max(y0,.6),z],[.875,Math.max(y0,.6),z+.012],[.86,.93,z+.012],[.86,.93,z],side,BLACK);", g)
g = rep("if(y0<.6)quad(trim,[.838,y0,z],[.838,y0,z+.012],[.855,.6,z+.012],[.855,.6,z],side,BLACK);",
        "if(y0<.6)quad(trim,[.86,y0,z],[.86,y0,z+.012],[.875,.6,z+.012],[.875,.6,z],side,BLACK);", g)
g = rep("for(const z of[-.13,-1.05])quad(trim,[.832,.85,z],[.832,.85,z+.12],[.829,.89,z+.12],[.829,.89,z],side,BLACK);",
        "for(const z of[-.06,-1.04])quad(paint,[.874,.83,z],[.874,.83,z+.13],[.872,.86,z+.13],[.872,.86,z],side);", g)
g = rep("box(trim,.77,.92,.97,1.06,.52,.63,BLACK);", "box(paint,.8,.97,.99,1.09,.66,.78,PAINT);box(trim,.79,.8,.99,1.09,.66,.78,BLACK);", g)

h = h[:b] + g + h[b:]

# the police paint: white with the green stripe drawn in the shader so it stays crisp over the arch cuts
rep("function makeCarMesh(color){", """const policeM=(()=>{const m=new THREE.MeshPhongMaterial({color:0xcfd2d3,specular:0x2a2a2a,shininess:50});m.userData.keep=true;
  m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\\nvarying vec3 vCp,vCn;').replace('#include <begin_vertex>','#include <begin_vertex>\\nvCp=position;vCn=normal;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\\nvarying vec3 vCp,vCn;').replace('#include <color_fragment>','#include <color_fragment>\\n{float lo=.645+.02*smoothstep(.9,1.8,vCp.z),hi=lo+.15;if(abs(vCn.x)>.45&&vCp.y>lo&&vCp.y<hi&&vCp.z<1.95&&vCp.z>-2.12)diffuseColor.rgb=vec3(.03,.36,.21);}');};
  return m;})();
const policeTex=(()=>{const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d');x.fillStyle='#1d2a24';x.font='bold 52px Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('POLICIJA',256,34);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;})();
const policeBarTex=(()=>{const c=document.createElement('canvas');c.width=256;c.height=32;const x=c.getContext('2d');x.fillStyle='#e9ecee';x.fillRect(0,0,256,32);x.fillStyle='#1b2f6b';x.font='bold 24px Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('POLICIJA',128,17);return new THREE.CanvasTexture(c);})();
function policeExtras(g){
  // hood lettering reads from the front, laid on the hood slope
  const hood=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.156),new THREE.MeshLambertMaterial({map:policeTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  hood.position.set(0,.874,1.6);hood.rotation.x=-Math.PI/2+.18;g.userData.body.add(hood);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(.56,.12,.26),[0,1,2,3,4,5].map(i=>i===4||i===5?new THREE.MeshBasicMaterial({map:policeBarTex}):new THREE.MeshLambertMaterial({color:0xe9ecee})));
  bar.position.set(0,1.53,-.12);g.userData.body.add(bar);
}
function makeCarMesh(color,G=carGeo){""")
rep("let m=carMats[color];if(!m){", "let m=G===skodaGeo?policeM:carMats[color];if(!m){")
rep("const b=new THREE.Mesh(carGeo.paint,m);", "const b=new THREE.Mesh(G.paint,m);")
rep("const c=new THREE.Mesh(carGeo.trim,trimM);", "const c=new THREE.Mesh(G.trim,trimM);")
rep("body.add(new THREE.Mesh(carGeo.head,headM),new THREE.Mesh(carGeo.tail,tailM));", "body.add(new THREE.Mesh(G.head,headM),new THREE.Mesh(G.tail,tailM));")
rep("const w=new THREE.Mesh(carGeo.wheel,trimM);", "const w=new THREE.Mesh(G.wheel,trimM);")
rep("g.userData.body=body;\n  return g;", "g.userData.body=body;if(G===skodaGeo)policeExtras(g);\n  return g;")
rep("function newCar(x,z,h,color){\n  const g=makeCarMesh(color);", "function newCar(x,z,h,color,G){\n  const g=makeCarMesh(color,G);")
# cops: Octavia, red on the driver's side and blue on the passenger's, at each end of the bar
rep("const c=newCar(n.x,n.z,to?Math.atan2(to.x-n.x,to.z-n.z):0,0x96999d);", "const c=newCar(n.x,n.z,to?Math.atan2(to.x-n.x,to.z-n.z):0,0xcfd2d3,skodaGeo);")
rep("const copBarGeo=new THREE.BoxGeometry(.5,.13,.28);", "const copBarGeo=new THREE.BoxGeometry(.3,.13,.27);")
rep("l.position.set(-.27,1.47,-.2);r.position.set(.27,1.47,-.2);c.g.add(l,r);",
    "l.position.set(.43,1.53,-.12);r.position.set(-.43,1.53,-.12);c.g.userData.body.add(l,r);")

open(path, 'w', encoding='utf-8').write(h)
print('skoda ok')
