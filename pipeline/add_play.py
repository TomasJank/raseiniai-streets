"""Add sound, drifting, police, people and delivery streaks to a game page.

usage: add_play.py base.html out.html
"""
import os, sys

src, out = sys.argv[1], sys.argv[2]
h = open(src, encoding='utf-8').read()
play = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'play.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("""const personMesh=(()=>{const g=new THREE.Group();
  const jacket=new THREE.MeshLambertMaterial({color:0x2f6f4b});jacket.userData.keep=true;
  const skin=new THREE.MeshLambertMaterial({color:0xe2b493});skin.userData.keep=true;
  const jeans=new THREE.MeshLambertMaterial({color:0x2c3a55});jeans.userData.keep=true;
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.3,.26,.75,10),jacket);torso.position.y=1.22;torso.castShadow=true;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),skin);head.position.y=1.8;head.castShadow=true;g.add(head);
  const l1=new THREE.Mesh(new THREE.BoxGeometry(.17,.85,.2),jeans),l2=l1.clone();l1.position.set(-.12,.43,0);l2.position.set(.12,.43,0);l1.castShadow=l2.castShadow=true;g.add(l1,l2);
  g.userData.legs=[l1,l2];g.traverse(o=>{if(o.geometry)o.geometry.userData.keep=true;});return g;})();""",
    "// the player on foot is drawn by the crowd's instanced meshes; this group only carries visibility\nconst personMesh=new THREE.Group();")
rep("const sw=mv?Math.sin(player.walk)*.5:0;personMesh.userData.legs[0].rotation.x=sw;personMesh.userData.legs[1].rotation.x=-sw;",
    "player.gait=mv?(run?.9:.5):0;")

# drifting: the car travels along c.trav, which lags the way it points
rep("""  if(hand)c.speed-=Math.sign(c.speed)*Math.min(Math.abs(c.speed),11*dt);
  const yaw=c.steer*(hand?2.9:2.05)*clamp(c.speed/6,-1,1)/(1+Math.abs(c.speed)/30);
  c.h+=yaw*dt;
""", """  if(hand)c.speed-=Math.sign(c.speed)*Math.min(Math.abs(c.speed),(Math.abs(st)?4.5:11)*dt);
  const yaw=c.steer*(hand?2.9:2.05)*clamp(c.speed/6,-1,1)/(1+Math.abs(c.speed)/30);
  c.h+=yaw*dt;
  if(c.trav==null)c.trav=c.h;
  const grip=c.speed<1?30:hand?1.7:Math.abs(c.steer)>.6&&c.speed>25?4:9;
  c.trav=lerpAngle(c.trav,c.h,1-Math.exp(-grip*dt));
  const slip=wrapA(c.h-c.trav);
  c.speed-=Math.sign(c.speed)*Math.abs(Math.sin(slip))*Math.abs(c.speed)*.5*dt;
  c.sliding=(Math.abs(slip)>.17&&Math.abs(c.speed)>5)||(hand&&Math.abs(c.speed)>9)||(dn&&!up&&c.speed>15);
  const dir=c.speed<0?c.h:c.trav;
""")
rep("c.x+=Math.sin(c.h)*total/steps;c.z+=Math.cos(c.h)*total/steps;\n    const fx=Math.sin(c.h),fz=Math.cos(c.h);\n    for(const o of[1.25,-1.25]){\n      const px",
    "c.x+=Math.sin(dir)*total/steps;c.z+=Math.cos(dir)*total/steps;\n    const fx=Math.sin(c.h),fz=Math.cos(c.h);\n    for(const o of[1.25,-1.25]){\n      const px")
rep("if(imp<-.5){if(Math.abs(c.speed)>8)shake=Math.min(1,Math.abs(c.speed)/25);c.speed*=-.22;}",
    "if(imp<-.5){if(Math.abs(c.speed)>8){shake=Math.min(1,Math.abs(c.speed)/25);hit(Math.min(1,Math.abs(c.speed)/28));hurtCargo(Math.abs(c.speed)*.012);}c.speed*=-.22;c.trav=c.h;}")
rep("if(Math.abs(c.speed)>6)shake=Math.min(1,Math.abs(c.speed)/30);c.speed*=.55;if(o.ai)o.stun=2.5;syncCar(o);}",
    "if(Math.abs(c.speed)>6){shake=Math.min(1,Math.abs(c.speed)/30);hit(Math.min(.8,Math.abs(c.speed)/34));hurtCargo(.06);if(o.ai)addHeat(.34);if(o.cop)addHeat(1);}c.speed*=.55;if(o.ai)o.stun=2.5;syncCar(o);}")
rep("  c.g.userData.body.rotation.z=-c.steer*clamp(Math.abs(c.speed)/22,0,1)*.06;",
    "  tyreFX(c,dt);\n  c.g.userData.body.rotation.z=-c.steer*clamp(Math.abs(c.speed)/22,0,1)*.06-slip*.08;")

rep("if(c.ai){c.ai=null;toast('Car taken','The driver ran off.');}\n    player.mode='car';player.car=c;c.stun=0;",
    "if(c.ai){c.ai=null;toast('Car taken','The driver ran off.');driverRunsOff(c);addHeat(1);}\n    player.mode='car';player.car=c;c.stun=0;c.trav=c.h;")
rep("function nearestCar(r){let best=null,bd=r;for(const c of world.cars){const d=",
    "function nearestCar(r){let best=null,bd=r;for(const c of world.cars){if(c.cop)continue;const d=")
rep("c.h=h;c.speed=0;syncCar(c);player.x=c.x;", "c.h=h;c.trav=h;c.speed=0;syncCar(c);player.x=c.x;")
rep("  const W=world,G=W.graph,rnd=Math.random;\n  const nodes=[...G.values()];\n  // start position",
    "  const W=world,G=W.graph,rnd=Math.random;\n  resetPlay();\n  const nodes=[...G.values()];\n  // start position")

# streaks: pay grows with each on-time delivery, crashes eat into it
rep("if(d<8){const pay=100+Math.round(mission.time*12);cash+=pay;$('#cash').textContent='€'+cash.toLocaleString('en');toast('Delivered +€'+pay,mission.name);mission=null;",
    "if(d<8){const pay=Math.round((100+mission.time*12)*(1+streak*.25)*(.3+cargo*.7));cash+=pay;streak++;cargo=1;showBonus();notes([[523,.09],[659,.09],[784,.2]],'triangle',.14);$('#cash').textContent='€'+cash.toLocaleString('en');toast('Delivered +€'+pay.toLocaleString('en'),streak>1?mission.name+' · streak ×'+streak:mission.name);mission=null;")
rep("else if(mission.time<=0){toast('Too late','The delivery to '+mission.name+' failed.');mission=null;",
    "else if(mission.time<=0){toast('Too late',streak?'Streak lost.':'The delivery to '+mission.name+' failed.');streak=0;cargo=1;showBonus();mission=null;")
rep("else if(code==='KeyN'){newMission();toast('New delivery',mission&&mission.name);}",
    "else if(code==='KeyN'){if(streak){streak=0;showBonus();}cargo=1;showBonus();newMission();toast('New delivery',mission&&mission.name);}\n  else if(code==='KeyV'){muted=!muted;if(snd)snd.master.gain.value=muted?0:.6;toast(muted?'Sound off':'Sound on');}")

rep("// ---------- HUD ----------\n", play + "\n// ---------- HUD ----------\n")
rep("for(const c of W.cars){if(c===player.car)continue;mctx.fillStyle=c.ai?'#e8e6dc':'#8b938c';",
    "for(const c of W.cars){if(c===player.car)continue;mctx.fillStyle=c.cop?(Math.floor(performance.now()/200)%2?'#ff3b30':'#3b78ff'):c.ai?'#e8e6dc':'#8b938c';")
rep("  updateTraffic(playing?dt:0);\n  if(playing){updateMission(dt);updateStreet(dt);}",
    "  updateTraffic(playing?dt:0);\n  if(playing){updateMission(dt);updateStreet(dt);updatePolice(dt);updatePeople(dt);updateSmoke(dt);}\n  updateAudio(playing);")

rep('<div id="cash" class="num">€0</div>\n', '<div id="cash" class="num">€0</div>\n  <div id="stars"><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></div>\n  <div id="bustWrap" hidden><span id="bust"></span></div>\n')
rep('<div id="mMeta" class="num"><span id="mDist">— m</span><span id="mTime">0:00</span></div>\n',
    '<div id="mMeta" class="num"><span id="mDist">— m</span><span id="mTime">0:00</span></div>\n    <div id="mBonus" class="num"></div>\n')
rep("#cash{font-family:var(--display);", """#stars{font-size:20px;line-height:1;letter-spacing:2px;text-align:right;margin:4px 0 6px;opacity:.28;text-shadow:0 1px 2px rgba(0,0,0,.6)}
#stars.live{opacity:1}
#stars i{font-style:normal;color:#fff}
#stars i.on{color:#ff3b30}
#bustWrap{height:6px;background:rgba(14,21,19,.7);border-radius:3px;overflow:hidden;margin-bottom:6px}
#bust{display:block;height:100%;width:0;background:#ff3b30}
#mBonus{font-size:12.5px;opacity:.85;margin-top:3px}
#mBonus.hurt{color:#ff8a70;opacity:1}
#cash{font-family:var(--display);""")
rep("<kbd>Space</kbd><span>Handbrake</span>", "<kbd>Space</kbd><span>Handbrake: hold while steering to drift</span>\n    <kbd>Q</kbd><span>Horn, clears people out of the way</span>\n    <kbd>V</kbd><span>Sound on or off</span>")
open(out, 'w', encoding='utf-8').write(h)
print('wrote', out, len(h))
