"""Car feel: tarmac, gravel and grass handle differently; a damaged car pulls to one side and loses speed; off-centre hits spin you;
a car stuck for 3 s offers R and is put back on the road after 8 s; the camera rolls on crashes and widens with speed;
tyre squeal follows the slip angle, gravel and grass crunch, and sounds rise fast and fade slowly.
usage: add_feel.py page.html   (edits in place; run after add_people.py)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'feel.js'), encoding='utf-8').read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)

rep('function driveCar(c,dt){', js + 'function driveCar(c,dt){')
# what is under a point: road segments know their width and whether they are unpaved; the hand-built Maxima car park is tarmac too
rep("flatPoly(LOT,[[47.6,0],[47.6,-32],[-46,-32],[-46,16.8],[-25,16.8],[-25,42],[-13,35],[0,30],[0,0]].map(q=>F(q[0],q[1])),.085,ROADCOL[2]);",
    "flatPoly(LOT,(W.lotPoly=[[47.6,0],[47.6,-32],[-46,-32],[-46,16.8],[-25,16.8],[-25,42],[-13,35],[0,30],[0,0]].map(q=>F(q[0],q[1]))),.085,ROADCOL[2]);")
rep("  W.graph=graph;W.edges=edges;",
    "  W.ground=(x,z)=>{const l=surfGrid.get(gk(Math.floor(x/NCELL),Math.floor(z/NCELL)));let g=0;\n"
    "    if(l)for(const s of l){const dx=s[2]-s[0],dz=s[3]-s[1],L2=dx*dx+dz*dz||1,t=clamp(((x-s[0])*dx+(z-s[1])*dz)/L2,0,1),dd=Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t),hw=s[4].w/2;\n"
    "      if(dd<hw+.4)g=Math.max(g,s[4].unpaved?1:2);else if(s[4].pave&&dd<hw+2.2)g=2;if(g===2)return 2;}\n"
    "    const P=W.lotPoly;if(P){let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++)if((P[i][1]>z)!==(P[j][1]>z)&&x<(P[j][0]-P[i][0])*(z-P[i][1])/(P[j][1]-P[i][1])+P[i][0])inside=!inside;if(inside)return 2;}\n"
    "    return g;};\n  W.graph=graph;W.edges=edges;")
# driving: surface and damage
rep("  c.steer+=(st-c.steer)*Math.min(1,dt*7);\n  const MAX=37;\n  if(up&&!dn)c.speed+=(c.speed<0?20:9.5*(1-c.speed/MAX))*dt;",
    "  const hp=c.hp??1,gnd=c.gnd=world.ground?world.ground(c.x,c.z):2,SF=SURF[gnd];\n"
    "  const pull=hp<.6?(c.pull||(c.pull=Math.random()<.5?-1:1))*(.6-hp)*.45*clamp(Math.abs(c.speed)/8,0,1):0;\n"
    "  c.steer+=(st+pull-c.steer)*Math.min(1,dt*7*(.45+.55*Math.min(1,hp*1.6)));\n"
    "  const MAX=37*SF.max*(.7+.3*Math.min(1,hp*2));\n"
    "  if(up&&!dn)c.speed+=(c.speed<0?20:9.5*SF.acc*(1-c.speed/MAX))*dt;")
rep("  else c.speed-=Math.sign(c.speed)*Math.min(Math.abs(c.speed),(1.6+Math.abs(c.speed)*.12)*dt);",
    "  else c.speed-=Math.sign(c.speed)*Math.min(Math.abs(c.speed),(1.6+SF.drag+Math.abs(c.speed)*.12)*dt);")
rep("*(1-.3*ENV.wet.value-.5*ENV.snow.value);", "*(1-.3*ENV.wet.value-.5*ENV.snow.value)*SF.grip;")
rep("  const slip=wrapA(c.h-c.trav);", "  const slip=c.slip=wrapA(c.h-c.trav);")
rep("  c.h+=yaw*dt;\n  if(c.trav==null)c.trav=c.h;",
    "  c.h+=yaw*dt;\n  if(c.yawK){c.h+=c.yawK*dt;c.yawK*=Math.exp(-3*dt);if(Math.abs(c.yawK)<.02)c.yawK=0;}\n  if(c.trav==null)c.trav=c.h;")
rep("  player.x=c.x;player.z=c.z;player.h=c.h;\n}\nfunction walk(dt){", "  player.x=c.x;player.z=c.z;player.h=c.h;\n  stuckCheck(c,up,dn,dt);\n}\nfunction walk(dt){")
# an off-centre hit turns the player's car
rep("  kick(o,sp*.03,0,-lx*sp*.36);kick(c,0,lz*sp*.045,0);\n}",
    "  kick(o,sp*.03,0,-lx*sp*.36);kick(c,0,lz*sp*.045,0);\n"
    "  if(c===player.car){const al=(o.x-c.x)*Math.sin(c.h)+(o.z-c.z)*Math.cos(c.h),lt=(o.x-c.x)*Math.cos(c.h)-(o.z-c.z)*Math.sin(c.h);c.yawK=clamp((c.yawK||0)-Math.sign(al||1)*lt*sp*.025,-1.8,1.8);}\n}")
# camera
rep("if(shake>0&&!REDUCED){camera.position.x+=(Math.random()-.5)*shake*.6;camera.position.y+=(Math.random()-.5)*shake*.4;",
    "if(shake>0&&!REDUCED){camera.position.x+=(Math.random()-.5)*shake*.25;camera.position.y+=(Math.random()-.5)*shake*.18;")
rep("  look.set(player.x+fx*(camMode===1?0:2),gp+(camMode===1?0:1.3),player.z+fz*(camMode===1?0:2));\n  camera.lookAt(look);",
    "  look.set(player.x+fx*(camMode===1?0:2),gp+(camMode===1?0:1.3),player.z+fz*(camMode===1?0:2));\n  camera.lookAt(look);camFeel(dt);")
# sound
rep("  setG(snd.wind,inCar?Math.min(.22,s*.007):0);\n  setG(snd.tyre,inCar&&c.sliding?.2:0);", "  feelAudio(inCar,c,s);")
open(path, 'w', encoding='utf-8').write(h)
print('feel ok')
