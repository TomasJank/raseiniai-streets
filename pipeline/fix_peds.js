// ---------- fixpeds: a walker whose pavement spot is inside a wall steps toward the road until it is clear (add_fixpeds.py, fixwalk) ----------
{const pt=pedTarget;pedTarget=p=>{
  const q=pt(p);if(!world.inBuilding(q[0],q[1]))return q;
  const G=world.graph,A=G.get(p.e.a),B=G.get(p.e.b),dx=B.x-A.x,dz=B.z-A.z,L=q[2],hw=p.e.w/2;
  for(const s of[p.side,-p.side])for(let off=hw+.5;off>=0;off-=.4){
    const x=A.x+dx*p.t-dz/L*off*s,z=A.z+dz*p.t+dx/L*off*s;
    if(!world.inBuilding(x,z)&&!water3At(x,z))return[x,z,L];}
  return q;};}
// fixwalk: pedPush is the last move before anyone is drawn (updatePeople pushes everyone, then poses), so the guards live there.
// Bodies (0.25 m) stay off building walls and out of cars, the player's moving car excepted (runOver knocks those down).
// Whoever still ends inside a building (a follower beside his leader, a corner cut by the straight walk, a knock-down or flight
// into a wall, a long frame) goes back to where he last stood clear and a walker turns round.
{const pp=pedPush,R=.25;
  const car=(p,o,hl,r)=>{const dx=p.x-o.x,dz=p.z-o.z;if(dx*dx+dz*dz>(hl+r)*(hl+r))return;
    const fx=Math.sin(o.h),fz=Math.cos(o.h),t=clamp(dx*fx+dz*fz,-hl,hl),qx=dx-fx*t,qz=dz-fz*t,d=Math.hypot(qx,qz);if(d<r&&d>.01){p.x+=qx/d*(r-d);p.z+=qz/d*(r-d);}};
  pedPush=p=>{const dn=p.mode==='down';
    if(p.mode==='hide'||p.mode==='sit'||p.mode==='goto'&&p.then==='hide')return pp(p);
    // building walls first: where a fence runs along a house the fence push (pp) has the last word
    const c=world.collide(p.x,p.z,R);p.x=c.x;p.z=c.z;
    // pp skips the knocked down, who then slid through benches and fences
    if(dn){p.mode='walk';pp(p);p.mode='down';}else pp(p);
    for(const o of world.cars)if(dn||o!==player.car||Math.abs(o.speed)<2.5)car(p,o,1.35,.9+R);
    for(const o of parkedNear(p.x,p.z))car(p,o,1.35,.9+R);
    if(bus)car(p,bus,4.6,1.25+R);
    if(!world.inBuilding(p.x,p.z)){p.sx=p.x;p.sz=p.z;return;}
    if(p.sx!=null&&Math.hypot(p.x-p.sx,p.z-p.sz)<3){p.x=p.sx;p.z=p.sz;if(p.mode==='walk'&&!p.lead)p.dir=-p.dir;return;}
    for(let r=.4;r<=6;r+=.4)for(let k=0;k<16;k++){const x=p.x+Math.cos(k*.3927)*r,z=p.z+Math.sin(k*.3927)*r;if(!world.inBuilding(x,z)&&!water3At(x,z)){p.x=p.sx=x;p.z=p.sz=z;return;}}
    p.mode='hide';};}
