"""Add saving, garages, car damage, taxi fares, landmarks, races, day and night, weather and water.

Wheels and feet now rest on the road and pavement surface instead of the bare terrain.
usage: add_more.py page.html   (edits in place; run after add_play.py and add_car.py)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
more = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'more.js'), encoding='utf-8').read()


def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)


# surface heights: roads sit 5-12 cm above the terrain and pavements 14 cm, so cars and people sank into them
rep("nameGrid=new Map(),NCELL=30;", "nameGrid=new Map(),NCELL=30,surfGrid=new Map();")
rep("roadsAll.push({pts,raw:w.pts.map(P),refs:w.refs,w:ri.w,cls:ri.cls,t,unpaved});",
    "roadsAll.push({pts,raw:w.pts.map(P),refs:w.refs,w:ri.w,cls:ri.cls,t,unpaved});\n"
    "      {const r=roadsAll[roadsAll.length-1];for(let i=0;i<pts.length-1;i++){const p=pts[i],q=pts[i+1];addTo(surfGrid,NCELL,Math.min(p[0],q[0])-9,Math.min(p[1],q[1])-9,Math.max(p[0],q[0])+9,Math.max(p[1],q[1])+9,[p[0],p[1],q[0],q[1],r,y]);}}")
rep("  W.graph=graph;W.edges=edges;",
    "  W.surf=(x,z)=>{const l=surfGrid.get(gk(Math.floor(x/NCELL),Math.floor(z/NCELL)));let y=0;if(l)for(const s of l){const dx=s[2]-s[0],dz=s[3]-s[1],L2=dx*dx+dz*dz||1,t=clamp(((x-s[0])*dx+(z-s[1])*dz)/L2,0,1),dd=Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t),hw=s[4].w/2;\n"
    "    if(dd<hw+.2)y=Math.max(y,s[5]);else if(s[4].pave&&dd<hw+2.2)y=Math.max(y,.14);}return y;};\n"
    "  W.graph=graph;W.edges=edges;")
rep("function syncCar(c){const fx=Math.sin(c.h)*1.4,fz=Math.cos(c.h)*1.4;c.g.position.set(c.x,GY(c.x,c.z),c.z);c.g.rotation.order='YXZ';c.g.rotation.y=c.h;c.g.rotation.x=-Math.atan2(GY(c.x+fx,c.z+fz)-GY(c.x-fx,c.z-fz),2.8);",
    "function syncCar(c){const fx=Math.sin(c.h)*1.4,fz=Math.cos(c.h)*1.4,rx=Math.cos(c.h)*.74,rz=-Math.sin(c.h)*.74,H=(x,z)=>GY(x,z)+world.surf(x,z),hf=H(c.x+fx,c.z+fz),hb=H(c.x-fx,c.z-fz),hr=H(c.x+rx,c.z+rz),hl=H(c.x-rx,c.z-rz);\n"
    "  c.g.position.set(c.x,(hf+hb+hr+hl)/4,c.z);c.g.rotation.order='YXZ';c.g.rotation.y=c.h;c.g.rotation.x=-Math.atan2(hf-hb,2.8);c.g.rotation.z=Math.atan2(hr-hl,1.48);")

# places the new features need: fuel stations and street lamps
rep("if(t.name)labels.push({x:cx0,z:cz0,y:top+3,text:t.name,kind:s.kind});", "if(t.name)labels.push({x:cx0,z:cz0,y:top+3,text:t.name,kind:s.kind,fuel:t.amenity==='fuel'});")
rep("const W={lat0,lon0,kx,kz,meta,cars:[],box:null,buildings:[],nb:0,roadKm:0};", "const W={lat0,lon0,kx,kz,meta,cars:[],box:null,buildings:[],nb:0,roadKm:0,lamps:[]};")
rep("L2=inst(new THREE.BoxGeometry(.6,.14,.28),0xd9dcd8,nl);", "L2=inst(new THREE.BoxGeometry(.6,.14,.28),0xd9dcd8,nl);W.lampMat=L2.material;")
rep("L2.setMatrixAt(li++,m4);}});", "L2.setMatrixAt(li++,m4);W.lamps.push([pv.x,pv.y-.15,pv.z]);}});")

# water gets its own material; a darker river colour lets the sky reflection carry it
rep("[.24,.45,.58]", "[.09,.16,.17]", 2)
# a darker muddy bank around rivers and ponds so the water doesn't sit on bright lawn
rep("ribbon(WA,pts,ww,0.03,[.09,.16,.17]);", "ribbon(GR,pts,ww+3.5,0.024,[.27,.30,.19]);ribbon(WA,pts,ww,0.03,[.09,.16,.17]);")
rep("{flatPoly(WA,pts,0.035,[.09,.16,.17]);", "{ribbon(GR,[...pts,pts[0]],3.5,0.026,[.27,.30,.19]);flatPoly(WA,pts,0.035,[.09,.16,.17]);")
rep("(w.position.z>0?c.steer*.45:0)", "(w.position.z>0?c.steer*.28:0)")
rep("for(const A of [RD,MK,WA,GR])if(A.pos.length){const m=new THREE.Mesh(mkGeo(A.pos,A.col,A.nor),flatMat);m.receiveShadow=true;worldGroup.add(m);}",
    "for(const A of [RD,MK,GR])if(A.pos.length){const m=new THREE.Mesh(mkGeo(A.pos,A.col,A.nor),flatMat);m.receiveShadow=true;worldGroup.add(m);}\n"
    "  if(WA.pos.length){const m=new THREE.Mesh(mkGeo(WA.pos,WA.col,WA.nor),waterMat);m.receiveShadow=true;worldGroup.add(m);}")

# night windows and snow on roofs
rep("sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\\nattribute float sty;\\nvarying float vSty;').replace('#include <uv_vertex>','#include <uv_vertex>\\nvSty=sty;');",
    "sh.uniforms.uNight=ENV.night;sh.uniforms.uSnow=ENV.snow;\n"
    "  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\\nattribute float sty;\\nvarying float vSty;\\nvarying float vUp;').replace('#include <uv_vertex>','#include <uv_vertex>\\nvSty=sty;').replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\\nvUp=objectNormal.y;');")
rep("sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\\nvarying float vSty;')",
    "sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\\nvarying float vSty;\\nvarying float vUp;\\nuniform float uNight,uSnow;')")
rep("tx.a)*(vSty<7.5?mix(.72,1.,smoothstep(0.,.6,vUv.y)):1.);\n    }",
    "tx.a)*(vSty<7.5?mix(.72,1.,smoothstep(0.,.6,vUv.y)):1.);\n"
    "      if(vSty<7.5&&tx.a>.5&&tx.b>tx.r+.04&&max(tx.r,max(tx.g,tx.b))<.45){float hh=fract(sin(dot(floor(vUv)+floor(vColor.rg*16.)*7.,vec2(12.9898,78.233)))*43758.5453);totalEmissiveRadiance+=vec3(1.,.74,.42)*uNight*step(.42,hh)*(.5+.5*hh);}\n"
    "    }\n    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.94,.96),uSnow*smoothstep(.55,.85,vUp)*.9);")
# wet and snowy ground: asphalt and paving (low saturation) darken in rain, everything whitens in snow
rep("function grainShader(sh){\n", "function grainShader(sh){\n  sh.uniforms.uWet=ENV.wet;sh.uniforms.uSnow=ENV.snow;\n")
rep("float gn(vec2 p){vec2 i=floor(p),f=fract(p);", "uniform float uWet,uSnow;\nfloat gn(vec2 p){vec2 i=floor(p),f=fract(p);")
rep("+.05*gn(vWXZ*4.);');",
    "+.05*gn(vWXZ*4.);\\n{float sat=max(max(diffuseColor.r,diffuseColor.g),diffuseColor.b)-min(min(diffuseColor.r,diffuseColor.g),diffuseColor.b);diffuseColor.rgb*=1.-uWet*.32*step(sat,.09);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.93,.95),uSnow*(sat<.09?.5:.85));}');")

# driving: less grip in rain and snow, no throttle once the engine is dead, damage from crashes
rep("const grip=c.speed<1?30:hand?1.7:Math.abs(c.steer)>.6&&c.speed>25?4:9;",
    "const grip=(c.speed<1?30:hand?1.7:Math.abs(c.steer)>.6&&c.speed>25?4:9)*(1-.3*ENV.wet.value-.5*ENV.snow.value);")
rep("const up=down('KeyW','ArrowUp'),dn=down('KeyS','ArrowDown'),hand=down('Space');",
    "const up=!c.dead&&down('KeyW','ArrowUp'),dn=down('KeyS','ArrowDown'),hand=down('Space');")
rep("hit(Math.min(1,Math.abs(c.speed)/28));hurtCargo(Math.abs(c.speed)*.012);", "hit(Math.min(1,Math.abs(c.speed)/28));hurtCargo(Math.abs(c.speed)*.012);hurtCar(c,Math.abs(c.speed)*.011);")
rep("hit(Math.min(.8,Math.abs(c.speed)/34));hurtCargo(.06);", "hit(Math.min(.8,Math.abs(c.speed)/34));hurtCargo(.06);hurtCar(c,.03+Math.abs(c.speed)*.0025);")

# taxi fares share the mission panel with deliveries
rep("function newMission(){\n  if(!world)return;", "function newDelivery(){\n  if(!world)return;")
rep("  if(!mission)return;\n  mission.time-=dt;", "  if(!mission)return;\n  if(mission.stage==='pickup'){updatePickup(dt);return;}\n  mission.time-=dt;")
rep("toast('Delivered +€'+pay.toLocaleString('en'),", "toast((mission.kind==='taxi'?'Fare paid +€':'Delivered +€')+pay.toLocaleString('en'),")
rep("streak++;cargo=1;showBonus();", "streak++;cargo=1;store();showBonus();")
rep('<div class="lbl">Delivery to</div>', '<div class="lbl" id="mLbl">Delivery to</div>')

rep("else if(code==='KeyN'){if(streak){streak=0;showBonus();}cargo=1;showBonus();newMission();toast('New delivery',mission&&mission.name);}",
    "else if(code==='KeyN'){if(race){endRace(false);return;}if(streak){streak=0;showBonus();}cargo=1;fare=null;mission=null;newMission();toast(mission&&mission.kind==='taxi'?'New fare':'New delivery',mission&&mission.name);}")
rep("  else if(code==='KeyR')resetToRoad();", "  else if(code==='KeyT')skipTime();\n  else if(code==='KeyY')nextWeather(true);\n  else if(code==='KeyR')resetToRoad();")
rep("updatePolice(dt);updatePeople(dt);updateSmoke(dt);}\n  updateAudio(playing);",
    "updatePolice(dt);updatePeople(dt);updateSmoke(dt);updateMore(dt);}\n  updateEnv(playing?dt:0);\n  updateAudio(playing);")

# maps: garages and race starts as squares, the next checkpoint as a blip, landmarks once found
rep("\n  mctx.restore();\n  const blip=",
    "\n  for(const [x,z,col] of MARKS()){mctx.fillStyle=col;const s=3.4/zoom*(w/176);mctx.fillRect((x-W.box.minX)/M.mpp-s,(z-W.box.minZ)/M.mpp-s,s*2,s*2);}\n  mctx.restore();\n  const blip=")
rep("  if(mission)blip(mission.x,mission.z,'#f2b705');", "  if(mission)blip(mission.x,mission.z,'#f2b705');\n  if(race)blip(race.cps[race.i].x,race.cps[race.i].z,MARK_COL.race);")
rep("  if(mission)dot(mission.x,mission.z,'#f2b705',8);",
    "  for(const [x,z,col] of MARKS())dot(x,z,col,6);\n  for(const m of landmarks)if(m.found)dot(m.x,m.z,'#f2b705',3.5);\n"
    "  $('#bigCount').textContent=`Landmarks found: ${landmarks.filter(m=>m.found).length} of ${landmarks.length} · Blue: garage · Pink: race`;\n"
    "  if(mission)dot(mission.x,mission.z,'#f2b705',8);")
rep("Drag to move, scroll to zoom.</div>", "Drag to move, scroll to zoom.<br><span id=\"bigCount\"></span></div>")

# HUD
rep('<div id="speedo">', '<div id="clock" class="num"></div>\n  <div id="speedo">')
rep('<small>KM/H</small></div>\n', '<small>KM/H</small></div>\n  <div id="hpWrap" hidden><span id="hp"></span></div>\n')
rep("#speedo{display:flex;", "#clock{font-family:var(--mono);font-size:13px;opacity:.9;text-shadow:0 1px 2px #000}\n"
    "#hpWrap{width:130px;height:6px;background:rgba(14,21,19,.7);border-radius:3px;overflow:hidden}\n#hp{display:block;height:100%;width:100%;background:#5fbf7a}\n#speedo{display:flex;")
rep("<kbd>V</kbd><span>Sound on or off</span>",
    "<kbd>V</kbd><span>Sound on or off</span>\n    <kbd>T</kbd><span>Skip ahead 3 hours</span>\n    <kbd>Y</kbd><span>Change the weather</span>")
rep("<kbd>N</kbd><span>New delivery</span>",
    "<kbd>N</kbd><span>New job, or cancel a race</span>\n    <kbd>Rings</kbd><span>Yellow: job · Blue: garage, repairs the car and loses the police · Pink: race</span>")
rep('<button class="tb" id="tCam"', '<button class="tb" id="tQ" data-k="KeyQ" type="button" aria-label="Horn">HORN</button>\n  <button class="tb" id="tCam"')
rep("  #prompt{bottom:calc(200px + env(safe-area-inset-bottom,0px))}\n}",
    "  #prompt{bottom:calc(200px + env(safe-area-inset-bottom,0px))}\n  #tQ{left:max(16px,env(safe-area-inset-left,0px));bottom:calc(98px + env(safe-area-inset-bottom,0px));width:52px;height:52px;font-size:11px;font-weight:600}\n}")

rep("// ---------- HUD ----------\n", more + "\n// ---------- HUD ----------\n")
open(path, 'w', encoding='utf-8').write(h)
print('wrote', path, len(h))
