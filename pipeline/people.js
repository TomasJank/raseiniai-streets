// ---------- people: they notice things, panic spreads, they cross at crossings and lights, ride the bus, go into shops, walk in pairs ----------
// pedestrian crossings mapped in OpenStreetMap (highway=crossing, queried 2026-11-03)
const CROSSINGS=__CROSSINGS__;
let pedEvents=[],pedEvN=0,pedClock=0,crossPts=null,densT=0,pedDens=1,sirenT=0,busWas=-1;
const CALM={walk:1,idle:1,wait:1,stop:1,cross:1,goto:1};
// something happened at x,z: seen within r inside a 120 degree cone, heard within hear from any side
function pedEvent(x,z,r,hear){pedEvents.push({x,z,r,hear,t:pedClock,id:++pedEvN});}
function nearCross(x,z){for(const c of crossPts)if((c[0]-x)**2+(c[1]-z)**2<144)return true;return false;}
function signalAt(x,z){for(const s of signals)if(Math.hypot(s.n.x-x,s.n.z-z)<16)return s;return null;}
function resetPed(p){Object.assign(p,{fall:0,hop:0,lead:null,dest:null,react:0,nerv:0,yaw:0,gait:0,panicT:0,idleT:15+Math.random()*40,seen:pedEvN,lane:(Math.random()-.5)*.8,stop:null,then:null});}
function pickDest(x,z){
  const r=Math.random();
  if(r<.4){const shops=world.labels.filter(L=>L.kind!=='park'&&Math.hypot(L.x-x,L.z-z)<400);if(shops.length){const L=pick(shops);return{x:L.x,z:L.z,kind:'shop'};}}
  if(r<.6&&bus){const st=pick(bus.at).st;if(st&&st.x!=null)return{x:st.x,z:st.z,kind:'stop',st};}
  return null;
}
function addFollower(L){const q=peds.find(o=>o.mode==='hide'&&o!==L);if(!q)return;resetPed(q);q.lead=L;q.mode='walk';q.x=L.x;q.z=L.z;q.h=L.h;q.sp=L.sp;}
function pedPlace(p){
  const fx=Math.sin(player.h),fz=Math.cos(player.h),G=world.graph;
  const far=(x,z)=>{const d=Math.hypot(x-player.x,z-player.z),ahead=(x-player.x)*fx+(z-player.z)*fz;return d<150&&d>35&&!(ahead>0&&d<75);};
  resetPed(p);
  if(bus&&Math.random()<.15){const st=pick(bus.at).st;if(st&&st.x!=null&&far(st.x,st.z)){const a=Math.random()*TAU,r=.8+Math.random()*1.6;
    p.x=st.x+Math.cos(a)*r;p.z=st.z+Math.sin(a)*r;p.mode='stop';p.stop=st;p.h=Math.atan2(st.rx-p.x,st.rz-p.z);return true;}}
  const list=edgesNear(player.x,player.z);if(!list.length)return false;
  for(let i=0;i<8;i++){
    const e=pick(list),A=G.get(e.a),B=G.get(e.b),t=Math.random(),mx=A.x+(B.x-A.x)*t,mz=A.z+(B.z-A.z)*t;
    if(!far(mx,mz)||e.cls&&Math.random()<.6)continue;
    p.e=e;p.t=t;p.dir=Math.random()<.5?1:-1;p.side=Math.random()<.5?1:-1;p.mode='walk';p.dest=pickDest(mx,mz);
    const q=pedTarget(p);p.x=q[0];p.z=q[1];
    if(Math.random()<.25)addFollower(p);
    return true;
  }
  return false;
}
// at the end of an edge: cross the road here (residential anywhere, main roads only at crossings and lights), else take the next edge, heading for the destination
function pedAtNode(p,at,crossed){
  const G=world.graph,n=G.get(at);
  if(!crossed&&n){const main=p.e.cls===0;
    if(main?nearCross(n.x,n.z)&&Math.random()<.6:Math.random()<.3){
      const sv=p.side;p.side=-sv;const q=pedTarget(p);p.side=sv;
      p.mode='wait';p.node=at;p.cx=q[0];p.cz=q[1];p.timer=main?25:6;p.sig=signalAt(n.x,n.z);p.h=Math.atan2(p.cx-p.x,p.cz-p.z);return;}}
  const opts=(pedEdgeAt.get(at)||[]).filter(e=>e!==p.e);let e=opts.length?pick(opts):p.e;
  if(p.dest&&opts.length>1&&Math.random()<.75){let bd=Infinity;for(const o of opts){const m=G.get(o.a===at?o.b:o.a),d=Math.hypot(m.x-p.dest.x,m.z-p.dest.z);if(d<bd){bd=d;e=o;}}}
  if(e===p.e)p.dir=-p.dir;else{p.e=e;p.dir=e.a===at?1:-1;p.t=p.dir>0?0:1;}
}
function canCross(p,M){
  if(p.sig){const A=world.graph.get(p.e.a),B=world.graph.get(p.e.b);return light(p.sig,Math.atan2(B.x-A.x,B.z-A.z))==='r';}
  for(const m of M){const dx=p.x-m.x,dz=p.z-m.z;if(dx*dx+dz*dz>900)continue;const s=Math.sign(m.v);if(dx*Math.sin(m.h)*s+dz*Math.cos(m.h)*s>-3)return false;}
  return true;
}
function movers(){
  const o=[];
  if(player.mode==='car'&&Math.abs(player.car.speed)>2){const c=player.car;o.push({x:c.x,z:c.z,h:c.h,v:c.speed,w:2.9,len:0,me:c});}
  for(const c of world.cars)if(c!==player.car&&!c.dead&&Math.abs(c.speed)>2)o.push({x:c.x,z:c.z,h:c.h,v:c.speed,w:2.2,len:0});
  if(bus&&bus.v>2)o.push({x:bus.x,z:bus.z,h:bus.h,v:bus.v,w:2.6,len:5.5});
  return o;
}
function perceive(p,dt){
  if(p.react>0){p.react-=dt;if(p.react<=0){pedFlee(p,p.x-p.rx,p.z-p.rz,2.5+Math.random()*1.5,6);p.nerv=20;}return;}
  if(p.nerv>0)p.nerv-=dt;
  if(!CALM[p.mode]){p.seen=pedEvN;return;}
  const k=p.nerv>0?1.4:1,fx=Math.sin(p.h),fz=Math.cos(p.h);
  for(const e of pedEvents){if(e.id<=p.seen)continue;const dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz);
    if(d<e.hear*k||(d<e.r*k&&dx*fx+dz*fz>d*.5)){p.react=.2+Math.random()*.3;p.rx=e.x;p.rz=e.z;break;}}
  p.seen=pedEvN;
}
// a car heading at someone: they step aside, or freeze and cover up when it is too close and fast; the player's car knocks them down
function dodge(p,M){
  if(!CALM[p.mode])return;
  for(const m of M){
    const dx=p.x-m.x,dz=p.z-m.z,s=Math.sign(m.v),fx=Math.sin(m.h)*s,fz=Math.cos(m.h)*s,al=dx*fx+dz*fz,lt=dx*fz-dz*fx,av=Math.abs(m.v);
    if(m.me&&Math.hypot(dx,dz)<2&&av>5){const c=m.me;
      p.mode='down';p.lead=null;p.timer=3.2;p.vx=Math.sin(c.h)*c.speed*.55;p.vz=Math.cos(c.h)*c.speed*.55;c.speed*=.82;
      shake=Math.max(shake,.35);hit(.3);addHeat(1);hurtCargo(.15);pedEvent(p.x,p.z,25,8);return;}
    if(al>-1-m.len&&al<7+av*.45+m.len&&Math.abs(lt)<m.w){
      if(av>14&&al<3.5&&Math.random()<.5){p.mode='cower';p.timer=1.6;p.lead=null;}
      else{const sd=Math.abs(lt)<.3?(Math.random()<.5?1:-1):Math.sign(lt);pedFlee(p,fz*sd,-fx*sd,.95,6.5);p.lead=null;}
      p.nerv=Math.max(p.nerv,8);return;}
  }
}
function gotoStep(p,dt){
  const dx=p.tx-p.x,dz=p.tz-p.z,d=Math.hypot(dx,dz),st=Math.min(d,p.sp*dt);
  if(d>.01){p.x+=dx/d*st;p.z+=dz/d*st;p.h=lerpAngle(p.h,Math.atan2(dx,dz),Math.min(1,dt*6));}
  return d;
}
function stepPed(p,dt,M){
  let rate=0,gait=0;
  if(p.lead){
    const L=p.lead;
    if(L.mode==='hide'){p.mode='hide';p.lead=null;return;}
    if(!CALM[L.mode]){if(L.mode==='flee')pedFlee(p,L.vx,L.vz,L.timer,6);else pedFlee(p,p.x-L.x,p.z-L.z,2,6);p.lead=null;p.nerv=20;return;}
    const k=Math.min(1,dt*4),px=p.x,pz=p.z;
    p.x+=(L.x+Math.cos(L.h)*.65-p.x)*k;p.z+=(L.z-Math.sin(L.h)*.65-p.z)*k;p.h=lerpAngle(p.h,L.h,Math.min(1,dt*6));p.yaw=L.yaw;
    const mv=Math.hypot(p.x-px,p.z-pz)/Math.max(dt,1e-3);p.gait=mv>.3?.5:0;p.phase+=(mv>.3?5.4*p.sp:0)*dt;
    dodge(p,M);return;
  }
  perceive(p,dt);
  const fast=p.nerv>0?1.35:1;
  if(p.mode==='walk'){
    const prev=[p.x,p.z],q0=pedTarget(p);p.t+=p.dir*p.sp*fast*dt/q0[2];
    if(p.t>1||p.t<0){const at=p.t>1?p.e.b:p.e.a;p.t=clamp(p.t,0,1);pedAtNode(p,at,false);}
    if(p.mode==='walk'){
      const q=pedTarget(p),k=Math.min(1,dt*3);p.x+=(q[0]-p.x)*k;p.z+=(q[1]-p.z)*k;
      const mx=p.x-prev[0],mz=p.z-prev[1];if(mx*mx+mz*mz>1e-5)p.h=lerpAngle(p.h,Math.atan2(mx,mz),Math.min(1,dt*6));
      rate=5.4*p.sp*fast;gait=.5;
      if(p.dest&&Math.hypot(p.x-p.dest.x,p.z-p.dest.z)<(p.dest.kind==='shop'?45:8)){
        p.mode='goto';p.tx=p.dest.x;p.tz=p.dest.z;p.then=p.dest.kind==='shop'?'hide':'stop';if(p.dest.st)p.stop=p.dest.st;p.dest=null;}
      else if((p.idleT-=dt)<=0){p.mode='idle';p.timer=3+Math.random()*6;}
    }
  }else if(p.mode==='idle'){
    p.timer-=dt;if(p.timer<=0){p.mode='walk';p.idleT=20+Math.random()*50;}
  }else if(p.mode==='wait'){
    p.timer-=dt;
    if(canCross(p,M))p.mode='cross';
    else if(p.timer<=0){p.mode='walk';pedAtNode(p,p.node,true);}
  }else if(p.mode==='cross'){
    p.tx=p.cx;p.tz=p.cz;p.sp*=1.15;const d=gotoStep(p,dt);p.sp/=1.15;rate=6.2*p.sp;gait=.6;
    if(d<.3){p.side=-p.side;p.mode='walk';pedAtNode(p,p.node,true);}
  }else if(p.mode==='goto'){
    const d=gotoStep(p,dt);rate=5.4*p.sp;gait=.5;
    if(p.then==='hide'&&(d<1||world.inBuilding(p.x,p.z))){p.mode='hide';return;}
    if(d<.6){if(p.then==='stop'&&p.stop){p.mode='stop';p.h=Math.atan2(p.stop.rx-p.x,p.stop.rz-p.z);}else if(p.then==='hide'){p.mode='hide';return;}else pedRejoin(p);}
  }else if(p.mode==='stop'){
  }else if(p.mode==='flee'){
    p.timer-=dt;const nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;if(!world.inBuilding(nx,nz)){p.x=nx;p.z=nz;}
    p.h=lerpAngle(p.h,Math.atan2(p.vx,p.vz),Math.min(1,dt*10));p.hop=Math.abs(Math.sin(p.phase*.5))*.14;rate=13;gait=.95;
    if((p.panicT-=dt)<=0){p.panicT=.6;pedEvent(p.x,p.z,10,3);}
    if(p.timer<=0){p.hop=0;pedRejoin(p);}
  }else if(p.mode==='cower'){
    p.timer-=dt;p.fall=lerpAngle(p.fall,-.35,Math.min(1,dt*8));p.hop=-.12;
    if(p.timer<=0){p.fall=0;p.hop=0;pedRejoin(p);}
  }else if(p.mode==='down'){
    p.timer-=dt;p.x+=p.vx*dt;p.z+=p.vz*dt;const dr=Math.exp(-dt*3.2);p.vx*=dr;p.vz*=dr;
    p.fall=lerpAngle(p.fall,p.timer>.7?-1.5:0,Math.min(1,dt*7));p.hop=p.timer>.7?.15:0;
    if(p.timer<=0){p.fall=0;p.hop=0;pedRejoin(p);}
  }
  if(p.mode==='hide')return;
  dodge(p,M);
  // idle people look around; anyone calm turns their head to the player walking or crawling past
  let ty=p.mode==='idle'||p.mode==='stop'?Math.sin(pedClock*.7+p.phase)*.8:0;
  const dx=player.x-p.x,dz=player.z-p.z;
  if(CALM[p.mode]&&dx*dx+dz*dz<36&&(player.mode==='foot'||Math.abs(player.car.speed)<3))ty=clamp(wrapA(Math.atan2(dx,dz)-p.h),-1.1,1.1);
  p.yaw+=(ty-p.yaw)*Math.min(1,dt*4);
  p.gait=gait;p.phase+=rate*dt;
}
// bus: people at the stop get on, a few get off
function busStops(){
  if(!bus||!bus.at.length)return;
  const cur=bus.at[(bus.next-1+bus.at.length)%bus.at.length],st=cur&&cur.st;
  if(!(bus.wait>0&&st&&st.x!=null&&Math.hypot(bus.x-st.x,bus.z-st.z)<16)){busWas=-1;return;}
  const rx=Math.cos(bus.h),rz=-Math.sin(bus.h),sd=Math.sign((st.x-bus.x)*rx+(st.z-bus.z)*rz)||1;
  const dx=bus.x+Math.sin(bus.h)*4.4+rx*1.4*sd,dz=bus.z+Math.cos(bus.h)*4.4+rz*1.4*sd;
  for(const p of peds)if(p.mode==='stop'&&p.stop===st&&!p.lead){p.mode='goto';p.tx=dx;p.tz=dz;p.then='hide';}
  if(busWas===bus.next)return;busWas=bus.next;
  if(Math.hypot(bus.x-player.x,bus.z-player.z)>160)return;
  let n=Math.floor(Math.random()*3);
  for(const p of peds){if(!n)break;if(p.mode!=='hide')continue;resetPed(p);p.x=dx;p.z=dz;pedRejoin(p);if(p.mode==='walk'){p.dest=pickDest(p.x,p.z);n--;}}
}
function updatePeople(dt){
  if(!pedGrid)return;
  pedClock+=dt;if(pedEvents.length)pedEvents=pedEvents.filter(e=>pedClock-e.t<1.5);
  if(!crossPts){crossPts=CROSSINGS.map(([la,lo])=>LL(la,lo));for(const s of signals)crossPts.push([s.n.x,s.n.z]);}
  const horn=down('KeyQ'),M=movers();
  const hornNow=horn&&!hornWas;hornWas=horn;
  if(stars()>=3&&(sirenT-=dt)<=0){sirenT=1;for(const c of cops)if(!c.dead)pedEvent(c.x,c.z,0,18);}
  if((densT-=dt)<=0){densT=2;let n=0;for(const L of world.labels)if(L.kind!=='park'&&Math.hypot(L.x-player.x,L.z-player.z)<350)n++;
    pedDens=(.25+.75*smooth(5.5,8,tod)*(1-smooth(20,23,tod)))*clamp(.4+n*.06,.4,1);}
  busStops();
  let active=0,placed=0;for(const p of peds)if(p.mode!=='hide')active++;
  const want=Math.round(PED_N*pedDens);
  for(const p of peds){
    if(p.mode==='hide'){if(active<want&&placed<3&&pedPlace(p)){placed++;active++;}}
    else{const d=Math.hypot(p.x-player.x,p.z-player.z);if(d>190||(active>want+2&&d>90&&!p.lead&&CALM[p.mode])){p.mode='hide';p.lead=null;active--;}}
    if(p.mode!=='hide')stepPed(p,dt,M);
    if(hornNow&&CALM[p.mode]){const dx=p.x-player.x,dz=p.z-player.z,d=Math.hypot(dx,dz);if(d<24&&d>.1){pedFlee(p,dx,dz,1.2,5.5);p.nerv=10;p.lead=null;}}
  }
  // nobody walks through anybody: calm people push apart, partners excepted
  for(let i=0;i<PED_N;i++){const a=peds[i];if(!CALM[a.mode])continue;
    for(let j=i+1;j<PED_N;j++){const b=peds[j];if(!CALM[b.mode]||a.lead===b||b.lead===a)continue;
      const dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz;if(d2>.64||d2<1e-6)continue;const d=Math.sqrt(d2),k=(.8-d)/2/d;a.x-=dx*k;a.z-=dz*k;b.x+=dx*k;b.z+=dz*k;}}
  peds.forEach((p,i)=>{if(p.mode==='hide')hidePed(i);else poseAt(i,p.look,p.x,p.z,p.h,p.fall,p.hop,p.phase,p.gait,p.mode==='cower',p.yaw);});
  if(personMesh.visible&&player.mode==='foot')poseAt(PLAYER_I,PLAYER_LOOK,player.x,player.z,player.h,0,0,player.walk,player.gait||0);else hidePed(PLAYER_I);
  if(fare)poseAt(FARE_I,fare.look,fare.x,fare.z,fare.h,0,0,fare.ph+=dt*4,0,true);else hidePed(FARE_I);
  for(const m of pedMesh)m.instanceMatrix.needsUpdate=true;
}
