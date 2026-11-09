"""Add crashes into trees and poles, dents and debris, suspension, roadblocks and ramming cops, traffic lights, a bus, church bells, and the sports centre stadium.

Traffic signals and bus stops are the ones mapped in OpenStreetMap (queried 2026-11-02).
usage: add_extra.py page.html   (edits in place; run last, after add_skoda.py)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
extra = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extra.js'), encoding='utf-8').read()


def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)


# trees and poles remember their instances so a hit tree can fall over
rep("Tk.setMatrixAt(i,m4);", "Tk.setMatrixAt(i,m4);t.tk=[Tk,i];")
rep("L.setMatrixAt(i,m4);", "L.setMatrixAt(i,m4);t.cr=[L,i];")
rep("C.setMatrixAt(i,m4);", "C.setMatrixAt(i,m4);t.cr=[C,i];")
rep("W.trees=trees.map(t=>[t[0],t[1]]);", "W.trees=trees.map(t=>[t[0],t[1]]);W.treeData=trees;")
rep("if(poles.length){", "W.poles=poles;if(poles.length){")

# cars and walkers collide with trunks and poles as well as walls
rep("world.collide(px,pz,1.05)", "collideCar(px,pz,1.05,c)", 2)
rep("world.collide(player.x,player.z,.42)", "collideCar(player.x,player.z,.42,null)")
rep("hurtCar(c,Math.abs(c.speed)*.011);}c.speed*=-.22;", "hurtCar(c,Math.abs(c.speed)*.011);crashFX(c,hitN,Math.abs(c.speed));}c.speed*=-.22;")
rep("if(o.cop)addHeat(1);}c.speed*=.55;", "if(o.cop)addHeat(1);}carHitCar(c,o,nx,nz,Math.abs(c.speed));c.speed*=.55;")
rep("const on=lit>0&&(c.ai||c.cop||c===player.car);", "const on=lit>0&&(c.ai||c.cop||c===player.car)&&!c.lampsOut;")
rep("c.hp=1;c.dead=false;", "c.hp=1;c.dead=false;fixCar(c);")

# police: wrecked cops stop, four stars and up go for the rear quarter and close in, roadblock cops can bust you
rep("function driveCop(c,dt){", "function driveCop(c,dt){\n  if(copDown(c,dt))return;")
rep("else if(player.mode==='car'&&dp>10){const lead=Math.min(1.1,dp/40);tx+=Math.sin(player.h)*ps*lead;tz+=Math.cos(player.h)*ps*lead;}",
    "else if(player.mode==='car'&&dp>10){const lead=Math.min(1.1,dp/40);tx+=Math.sin(player.h)*ps*lead;tz+=Math.cos(player.h)*ps*lead;}\n"
    "  if(stars()>=4&&player.mode==='car'&&dp<14&&dp>2){const s=c.ramSide??(c.ramSide=Math.random()<.5?-1:1);tx=player.x-Math.sin(player.h)*2+Math.cos(player.h)*s*1.2;tz=player.z-Math.cos(player.h)*2-Math.sin(player.h)*s*1.2;}")
rep("dp<9?Math.max(0,Math.abs(ps)+(dp-5)*1.5)", "dp<9?(stars()>=4&&player.mode==='car'?Math.abs(ps)+4:Math.max(0,Math.abs(ps)+(dp-5)*1.5))")
rep("  syncCar(c);\n  const on=Math.floor(performance.now()/130)%2;", "  syncCar(c);ride(c,dt);copRam(c,dt);\n  const on=Math.floor(performance.now()/130)%2;")
rep("let closest=Infinity;for(const c of cops)closest=Math.min(closest,Math.hypot(c.x-player.x,c.z-player.z));",
    "let closest=Infinity;for(const c of cops.concat(blocks))if(!c.dead)closest=Math.min(closest,Math.hypot(c.x-player.x,c.z-player.z));")

# traffic stops at red lights and for the bus
rep("const target=bl?0:c.ai.cruise*", "const target=bl||redAhead(c.x,c.z,c.h)?0:c.ai.cruise*")
rep("for(const o of world.cars)if(o!==c&&chk(o.x,o.z))return true;", "for(const o of world.cars)if(o!==c&&chk(o.x,o.z))return true;\n  if(busAhead(c,chk))return true;")

rep("updateMore(dt);}", "updateMore(dt);updateExtra(dt);}")

# every car is a rigid body on four sprung wheels instead of a fixed lean
rep("  c.g.userData.body.rotation.z=-c.steer*clamp(Math.abs(c.speed)/22,0,1)*.06-slip*.08;\n  c.g.userData.body.rotation.x=(up&&c.speed<12?-.012:0)+(dn&&c.speed>2?.02:0);\n", "  ride(c,dt);\n")
rep("aiPlace(c,false);syncCar(c);", "aiPlace(c,false);syncCar(c);ride(c,dt);")
rep("c.speed*=.9;syncCar(c);continue;", "c.speed*=.9;syncCar(c);ride(c,dt);continue;")
rep("c.spin+=((c.x-c.wx)", "if(c.ride)poseCar(c);c.spin+=((c.x-c.wx)")
rep("const up=!c.dead&&down('KeyW','ArrowUp')", "const up=!c.dead&&!(c.ride&&c.ride.tip)&&down('KeyW','ArrowUp')")
rep("c.h=h;c.trav=h;c.speed=0;syncCar(c);", "c.h=h;c.trav=h;c.speed=0;c.ride=null;syncCar(c);")

# Vilniaus g.: wider pavements with a red brick band along the kerb, and walkers favour the main streets
rep("let wv=0;for(const dd of [.8,1.4,2])", "let wv=0;for(const dd of r.t.name==='Vilniaus g.'?[.8,1.4,2,2.6]:[.8,1.4,2])")
rep("const flush=()=>{if(run.length>1){strip(PV,run,rw,.14,PAVE);", "const flush=()=>{if(run.length>1){strip(PV,run,rw,.14,PAVE);if(r.t.name==='Vilniaus g.')strip(PV,inner.map(p=>[p[0]+p[2]*.2,p[1]+p[3]*.2]),.32,.15,[.5,.25,.19]);")
rep("if(d>150||d<35||(ahead>0&&d<75))continue;", "if(d>150||d<35||(ahead>0&&d<75)||e.cls&&Math.random()<.6)continue;")
rep("buildMore();showBonus();", "buildMore();buildExtra();showBonus();")
rep("// ---------- HUD ----------\n", extra + "\n// ---------- HUD ----------\n")
open(path, 'w', encoding='utf-8').write(h)
print('extra ok')
