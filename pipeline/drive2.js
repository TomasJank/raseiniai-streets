// ---------- drive2: traffic corners by pure pursuit, handbrake drift counter-steers toward the velocity ----------
// traffic: the car owns its position and heading; it steers at the lane point LD metres ahead along the planned node walk
// (rate-limited), and ai.t is only the car's projection on its edge. Signals, blockedAhead and speed stay in updateTraffic.
const D2={off:1.7,rmax:2.8,cs:3,s0:.7};
function aiPlan(c){
  const G=world.graph,q=c.ai.q||(c.ai.q=[]);
  while(q.length<3){
    const last=q.length?q[q.length-1]:c.ai.to,prev=q.length>1?q[q.length-2]:q.length?c.ai.to:c.ai.from,node=G.get(last);
    let opts=node.out.filter(k=>k!==prev&&G.has(k));if(!opts.length)opts=node.out.filter(k=>G.has(k));
    if(!opts.length)return;
    q.push(opts[Math.floor(Math.random()*opts.length)]);
  }
}
function aiSteer(c,dt){
  const G=world.graph,ai=c.ai;let A=G.get(ai.from),B=G.get(ai.to),s;
  for(let g=0;;g++){
    const dx=B.x-A.x,dz=B.z-A.z;s=((c.x-A.x)*dx+(c.z-A.z)*dz)/ai.len;
    if(g>3||(s<ai.len-2&&Math.hypot(c.x-B.x,c.z-B.z)>2.5))break;
    if(!aiNext(c))break;A=G.get(ai.from);B=G.get(ai.to);
  }
  aiPlan(c);
  const ld=3+.5*Math.abs(c.speed);
  let rem=ld,hx=(B.x-A.x)/ai.len,hz=(B.z-A.z)/ai.len,sp=clamp(s,0,ai.len),cx=A.x+hx*sp-hz*D2.off,cz=A.z+hz*sp+hx*D2.off,tx=cx,tz=cz;
  ai.t=sp/ai.len;
  let pa=A,pb=B,qi=0;
  for(;;){
    const l=Math.hypot(pb.x-pa.x,pb.z-pa.z)||1,ox=-(pb.z-pa.z)/l*D2.off,oz=(pb.x-pa.x)/l*D2.off,
      sx=qi?pa.x+ox:cx,sz=qi?pa.z+oz:cz,ex=pb.x+ox,ez=pb.z+oz;
    let d=Math.hypot(sx-cx,sz-cz);
    if(d>=rem){tx=cx+(sx-cx)*rem/d;tz=cz+(sz-cz)*rem/d;break;}
    rem-=d;d=Math.hypot(ex-sx,ez-sz);
    if(d>=rem){tx=sx+(ex-sx)*rem/d;tz=sz+(ez-sz)*rem/d;break;}
    rem-=d;cx=tx=ex;cz=tz=ez;
    if(qi>=ai.q.length)break;
    pa=pb;pb=G.get(ai.q[qi++]);
  }
  const al=wrapA(Math.atan2(tx-c.x,tz-c.z)-c.h),r=clamp(Math.max(c.speed,2)*2*Math.sin(clamp(al,-1.57,1.57))/ld,-D2.rmax,D2.rmax);
  ai.w=(ai.w||0)+(r-(ai.w||0))*Math.min(1,dt*8);
  c.h+=ai.w*dt;c.x+=Math.sin(c.h)*c.speed*dt;c.z+=Math.cos(c.h)*c.speed*dt;
  if((ai.free=(ai.free||0)-dt)<=0){ // a lane that runs through a wall pins the car; after 1.5 s it drives through for 3 s rather than wedge for good
    let hit=false;
    for(const o of[1.25,-1.25]){const px=c.x+Math.sin(c.h)*o,pz=c.z+Math.cos(c.h)*o,r=world.collide(px,pz,1.05);if(r.hit){c.x+=r.x-px;c.z+=r.z-pz;hit=true;}}
    ai.pin=hit?(ai.pin||0)+dt:0;if(ai.pin>1.5){ai.free=3;ai.pin=0;}
  }
  c.steer+=(clamp(ai.w/2.2,-1,1)-c.steer)*Math.min(1,dt*8);
}
function driftCS(c){
  if(!c.sliding||c.speed<=5)return 0;
  const sl=wrapA(c.h-c.trav);
  return D2.cs*sl*clamp((Math.abs(sl)-D2.s0)/.4,0,1)*clamp((c.speed-5)/5,0,1);
}
