// ---------- water: cars can't swim ----------
// off the road over a pond, lake or river the car glides on a little, noses down and goes under; the screen fades and,
// as GTA does after drowning, you wake up on foot at Raseinių ligoninė with a bill, the police gone, the car towed outside
let sinkS=null,splash=null,fadeEl=null,fadeT=0;
function inWater(x,z){
  const W=world,near=(s,m)=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<m;};
  if(W.roadSegs(x,z).some(s=>near(s,s[4].w/2+.3)))return false; // bridges and culverts
  for(const p of W.water||[]){if(!pip(x,z,p))continue;const o=(W.ponds||[]).find(q=>q.p===p);if(!o||!o.H.some(r=>pip(x,z,r)))return true;}
  for(const r of W.waterLines||[])if(r.w>=8)for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1];if(near([a[0],a[1],b[0],b[1]],r.w/2))return true;}
  return false;
}
function fade(a){if(!fadeEl){fadeEl=document.createElement('div');fadeEl.style.cssText='position:fixed;inset:0;background:#05090c;opacity:0;pointer-events:none;z-index:4';document.body.appendChild(fadeEl);}fadeEl.style.opacity=a;}
// the hospital door: middle of the outline wall that faces the nearest road; the car goes to that road's kerb
function hospitalSpot(){
  const W=world,b=W.buildings.find(q=>q.name==='Raseinių ligoninė');if(!b)return null;
  const P=b.pts;let c=[0,0];for(const q of P){c[0]+=q[0]/P.length;c[1]+=q[1]/P.length;}
  let best=null;
  for(let i=0;i<P.length;i++){const a=P[i],e=P[(i+1)%P.length],l=Math.hypot(e[0]-a[0],e[1]-a[1]);if(l<6)continue;
    let nx=(e[1]-a[1])/l,nz=-(e[0]-a[0])/l;const mx=(a[0]+e[0])/2,mz=(a[1]+e[1])/2;if((mx-c[0])*nx+(mz-c[1])*nz<0){nx=-nx;nz=-nz;}
    const dx=mx+nx*2.5,dz=mz+nz*2.5;if(W.inBuilding(dx,dz))continue;
    for(const sg of W.roadSegs(dx,dz)){if(sg[4].cls>2)continue;const vx=sg[2]-sg[0],vz=sg[3]-sg[1],t=clamp(((dx-sg[0])*vx+(dz-sg[1])*vz)/(vx*vx+vz*vz||1),0,1),px=sg[0]+vx*t,pz=sg[1]+vz*t,d=Math.hypot(dx-px,dz-pz);
      if(!best||d<best.d){const vl=Math.hypot(vx,vz)||1,o=sg[4].w/2-1.2,kx=(dx-px)/(d||1),kz=(dz-pz)/(d||1);best={d,door:[dx,dz,Math.atan2(nx,nz)],car:[px+kx*o+vx/vl*6,pz+kz*o+vz/vl*6,Math.atan2(vx/vl,vz/vl)]};}}}
  return best;
}
function waterTick(dt){
  if(fadeT>0){fadeT=Math.max(0,fadeT-dt);fade(fadeT/.8);}
  if(splash){splash.t+=dt;const k=splash.t/1.1;splash.m.scale.setScalar(1+k*5);splash.m.material.opacity=.7*(1-k);if(k>=1){worldGroup.remove(splash.m);splash.m.geometry.dispose();splash.m.material.dispose();splash=null;}}
}
function sinkStep(c,dt){
  waterTick(dt);
  if(!sinkS){
    if(!inWater(c.x,c.z))return false;
    sinkS={t:0,v:c.speed,y:c.g.position.y,rx:c.g.rotation.x};
    const m=new THREE.Mesh(new THREE.RingGeometry(.8,1.3,24),new THREE.MeshBasicMaterial({color:0xe8f0f2,transparent:true,opacity:.7,depthWrite:false}));
    m.rotation.x=-Math.PI/2;m.position.set(c.x,GY(c.x,c.z)+.08,c.z);worldGroup.add(m);splash={m,t:0};
    hit(Math.min(1,.4+Math.abs(c.speed)/30));shake=Math.max(shake,.4);toast('Sunk','Cars can’t swim.');
    notes([[392,.16],[330,.16],[262,.5]],'triangle',.12);
  }
  const s=sinkS,t=s.t+=dt,v=s.v*Math.exp(-2.4*t);
  c.speed=0;c.x+=Math.sin(c.h)*v*dt;c.z+=Math.cos(c.h)*v*dt;player.x=c.x;player.z=c.z;
  c.g.position.set(c.x,s.y-Math.min(3,.3*t+.5*t*t),c.z);c.g.rotation.x=s.rx+Math.min(.5,t*.22);
  if(t>2.2)fade(Math.min(1,(t-2.2)/.8));
  if(t>3.2){
    sinkS=null;const H=hospitalSpot(),bill=Math.min(cash,100);
    const [x,z,h]=H?H.car:world.start;c.x=x;c.z=z;c.h=h;c.trav=h;c.speed=0;c.ride=null;c.hp=1;c.dead=false;fixCar(c);syncCar(c);
    if(H){player.mode='foot';player.car=null;personMesh.visible=true;[player.x,player.z,player.h]=H.door;}else{player.x=x;player.z=z;player.h=h;}
    cash-=bill;money();store();heat=0;showWanted();while(cops.length)removeCop(cops[0]);snapCamera();fadeT=.8;
    toast(H?'Raseinių ligoninė':'Back on dry land',(bill?'Hospital bill −€'+bill+'. ':'')+(H?'Your car was towed outside.':'The police lost you.'));
  }
  return true;
}
