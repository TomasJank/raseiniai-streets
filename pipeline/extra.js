// ---------- crashes, roadblocks, traffic lights, the bus and the church bells ----------
const LL=(lat,lon)=>[(lon-world.lon0)*world.kx,-(lat-world.lat0)*world.kz];
const nearPlayer=(x,z)=>1/(1+Math.hypot(x-player.x,z-player.z)/40);

// sound: noise bursts and decaying tones on the shared master bus
function burst(type,freq,q,vol,dur,delay=0,out){
  if(!snd||vol<.003)return;const t=AC.currentTime+delay,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=snd.buf;f.type=type;f.frequency.value=freq;f.Q.value=q;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(g);g.connect(out||snd.master);s.start(t,Math.random());s.stop(t+dur+.02);
}
function tone(f0,f1,vol,dur,type='sine',delay=0,out){
  if(!snd||vol<.003)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;
  o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(out||snd.master);o.start(t);o.stop(t+dur+.02);
}
const sCrunch=v=>{for(const f of[173,311,487,733])tone(f*(1+Math.random()*.06),f*.8,.05*v,.5,'triangle');burst('lowpass',900,.7,.3*v,.35);};
const sCrack=v=>{burst('highpass',2400,.7,.35*v,.1);burst('bandpass',650,2,.25*v,.3,.04);};
const sThud=v=>{tone(62,38,.35*v,.35);burst('lowpass',260,.7,.3*v,.3);};
const sThunk=v=>{tone(92,52,.4*v,.28);burst('lowpass',700,1,.3*v,.2);};
const sGlass=v=>{for(let i=0;i<6;i++)burst('bandpass',3800+Math.random()*3500,9,.14*v,.07,i*.035);};
const sHiss=v=>burst('highpass',3000,.5,.12*v,.7);

function puff(x,y,z,col,size){
  if(REDUCED)return;const s=smoke[smokeI=(smokeI+1)%smoke.length];
  s.position.set(x,y,z);s.scale.setScalar(size);s.material.color.setHex(col);s.material.opacity=.6;s.userData.life=1.1;s.visible=true;
}

// debris: one pool of points, glass, paint and black plastic
const DEB=160,debPos=new Float32Array(DEB*3).fill(-1e4),debCol=new Float32Array(DEB*3),debV=new Float32Array(DEB*3),debL=new Float32Array(DEB);let debI=0;
const debGeo=new THREE.BufferGeometry();debGeo.setAttribute('position',new THREE.BufferAttribute(debPos,3));debGeo.setAttribute('color',new THREE.BufferAttribute(debCol,3));
const debris=new THREE.Points(debGeo,new THREE.PointsMaterial({size:.09,vertexColors:true}));debris.frustumCulled=false;scene.add(debris);
function emitDebris(x,z,vx,vz,sp,c){
  const paint=c&&c.g.userData.body.children[0].material.color,y=GY(x,z)+.6,n=Math.min(30,Math.round(sp*1.2));
  for(let k=0;k<n;k++){const i=debI=(debI+1)%DEB,r=Math.random(),col=r<.4?[.62,.7,.75]:r<.7&&paint?[paint.r,paint.g,paint.b]:[.05,.05,.06];
    debPos.set([x,y,z],i*3);debCol.set(col,i*3);debV.set([vx*.25+(Math.random()-.5)*sp*.35,1.5+Math.random()*sp*.18,vz*.25+(Math.random()-.5)*sp*.35],i*3);debL[i]=2.5+Math.random();}
  debGeo.attributes.color.needsUpdate=true;
}
function updateDebris(dt){
  let any=false;
  for(let i=0;i<DEB;i++){if(debL[i]<=0)continue;any=true;const o=i*3;
    if((debL[i]-=dt)<=0){debPos[o+1]=-1e4;continue;}
    debV[o+1]-=9.8*dt;debPos[o]+=debV[o]*dt;debPos[o+1]+=debV[o+1]*dt;debPos[o+2]+=debV[o+2]*dt;
    const g=GY(debPos[o],debPos[o+2])+.03;if(debPos[o+1]<g){debPos[o+1]=g;debV[o+1]*=-.25;debV[o]*=.5;debV[o+2]*=.5;}}
  if(any)debGeo.attributes.position.needsUpdate=true;
}

// dents: a car gets its own copy of the shared paint mesh on its first hit; (wx,wz) points from its centre to the impact
function dent(c,wx,wz,depth){
  const m=c&&c.g.userData.body.children[0];if(!m||depth<.01)return;
  if(!m.userData.base){m.userData.base=m.geometry;m.geometry=m.geometry.clone();}
  const ch=Math.cos(c.h),sh=Math.sin(c.h),lx=wx*ch-wz*sh,lz=wx*sh+wz*ch,L=Math.hypot(lx,lz)||1,ux=lx/L,uz=lz/L;
  const t=Math.min(.87/Math.max(1e-3,Math.abs(ux)),2.2/Math.max(1e-3,Math.abs(uz))),px=ux*t,pz=uz*t,a=m.geometry.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),d=Math.hypot(x-px,(y-.6)*.8,z-pz);if(d>.7)continue;const k=depth*(1-d/.7)**2;a.setXYZ(i,x-ux*k,y-k*.25,z-uz*k);}
  a.needsUpdate=true;
}
function breakLamps(c,wx,wz,sp){
  if(sp<12||!c)return;const lz=wx*Math.sin(c.h)+wz*Math.cos(c.h),ch=c.g.userData.body.children;
  if(lz>.6&&ch[2].visible){ch[2].visible=false;c.lampsOut=true;sGlass(nearPlayer(c.x,c.z));}
  else if(lz<-.6&&ch[3].visible){ch[3].visible=false;sGlass(nearPlayer(c.x,c.z));}
}
function fixCar(c){
  const ch=c.g.userData.body.children,m=ch[0];
  if(m.userData.base){m.geometry.dispose();m.geometry=m.userData.base;m.userData.base=null;}
  ch[2].visible=ch[3].visible=true;c.lampsOut=false;
}
// called from the wall branch of driveCar; a pole hit carries the prop on the normal
function crashFX(c,n,sp){
  dent(c,-n.nx,-n.nz,Math.min(.2,sp*.009));breakLamps(c,-n.nx,-n.nz,sp);
  emitDebris(c.x-n.nx*1.6,c.z-n.nz*1.6,Math.sin(c.h)*c.speed,Math.cos(c.h)*c.speed,sp,c);
  kick(c,sp*.02,-(n.nx*Math.sin(c.h)+n.nz*Math.cos(c.h))*sp*.05,(n.nx*Math.cos(c.h)-n.nz*Math.sin(c.h))*sp*.08);
  const v=Math.min(1,sp/25);if(n.prop)sThunk(v);else sCrunch(v);
}
// called from the car-vs-car branch of driveCar; (nx,nz) points from o to c
function carHitCar(c,o,nx,nz,sp){
  // the overlap branch runs every frame two cars touch; one hit per contact
  if(sp<4||(o.hitT||0)>ENV.t.value)return;o.hitT=ENV.t.value+.4;
  const vx=Math.sin(c.h)*c.speed,vz=Math.cos(c.h)*c.speed;
  o.pvx=(o.pvx||0)+vx*.6;o.pvz=(o.pvz||0)+vz*.6;o.pspin=clamp(((o.x-c.x)*vz-(o.z-c.z)*vx)*.08,-2.5,2.5);
  const dep=Math.min(.18,sp*.008);dent(c,-nx,-nz,dep);dent(o,nx,nz,dep*.8);breakLamps(c,-nx,-nz,sp);breakLamps(o,nx,nz,sp);
  emitDebris(c.x-nx*1.3,c.z-nz*1.3,vx,vz,sp,o);
  if(sp>9)sCrunch(Math.min(1,sp/25));
  if(o.cop)o.hp=(o.hp??1)-sp*.02;
  const lx=-nx*Math.cos(o.h)+nz*Math.sin(o.h),lz=-nx*Math.sin(c.h)-nz*Math.cos(c.h);
  kick(o,sp*.03,0,-lx*sp*.36);kick(c,0,lz*sp*.045,0);
}
// shoves left over from a hit slide and spin the car until they die out
function updateShoved(dt){
  const k=Math.exp(-3*dt);
  for(const c of world.cars){
    if(!c.pvx&&!c.pvz&&!c.pspin)continue;
    c.x+=c.pvx*dt;c.z+=c.pvz*dt;c.h+=c.pspin*dt;c.pvx*=k;c.pvz*=k;c.pspin*=k;
    const r=world.collide(c.x,c.z,1.1);c.x=r.x;c.z=r.z;
    if(Math.hypot(c.pvx,c.pvz)<.05&&Math.abs(c.pspin)<.05)c.pvx=c.pvz=c.pspin=0;
    syncCar(c);if(c===player.car){player.x=c.x;player.z=c.z;player.h=c.h;}
  }
  for(const c of world.cars)if(!c.ai&&!c.cop&&c!==player.car&&c.ride&&!c.ride.rest)ride(c,dt);
}

// the car as a rigid body on four sprung wheels: each wheel feels the ground on its own, so the car pitches, rolls,
// leaves the road over crests and lands on two wheels; corners, shoulders and roof touch down when it tips or rolls over
const CG=.55,KW=25,CW=4,D0=9.8/(4*KW),IP=1.3,IR=.55;
const PTS=[...[1.33,-1.22].flatMap(z=>[[-.74,0,z],[.74,0,z]]),...[[.8,.5,2.15],[.87,.95,1.2],[.6,1.4,.8]].flatMap(([x,y,z])=>[[x,y,z],[-x,y,z],[x,y,-z],[-x,y,-z]])].map(([x,y,z])=>[x,y-CG,z]);
const _q=new THREE.Quaternion(),_e=new THREE.Euler(0,0,0,'YXZ'),_v=new THREE.Vector3();
function rideState(c){if(c.ride&&Math.hypot(c.x-c.ride.x,c.z-c.ride.z)>6)c.ride=null;return c.ride||(c.ride={x:c.x,z:c.z,y:GY(c.x,c.z)+world.surf(c.x,c.z)+CG,vy:0,p:0,vp:0,r:0,vr:0,sp:c.speed,h:c.h,ax:0,wd:[D0,D0,D0,D0],air:0,tip:0,rest:false});}
function kick(c,vy,vp,vr){const s=rideState(c);s.vy+=vy;s.vp+=vp;s.vr+=vr;s.rest=false;}
function poseCar(c){
  const s=c.ride,g=c.g;g.rotation.set(s.p,c.h,s.r);_v.set(0,-CG,0).applyEuler(g.rotation);g.position.set(c.x+_v.x,s.y+_v.y,c.z+_v.z);
  g.userData.wheels.forEach((w,i)=>{w.position.y=WHEEL_R+clamp(s.wd[i],0,.3)-D0;});
}
function ride(c,dt){
  if(dt<=0)return;const s=rideState(c);s.x=c.x;s.z=c.z;
  s.ax+=((c.speed-s.sp)/dt-s.ax)*Math.min(1,dt*10);s.sp=c.speed;
  const lat=clamp(c.speed*wrapA(c.h-s.h)/dt,-9,9);s.h=c.h;
  _e.set(s.p,c.h,s.r);_q.setFromEuler(_e);
  const gh=PTS.map(([x,y,z],i)=>{_v.set(x,y,z).applyQuaternion(_q);const px=c.x+_v.x,pz=c.z+_v.z;return GY(px,pz)+(i<4?world.surf(px,pz):0);});
  const n=4,h=dt/n,vy0=s.vy;let onW=0;
  for(let k=0;k<n;k++){
    const sp=Math.sin(s.p),cp=Math.cos(s.p),sr=Math.sin(s.r),cr=Math.cos(s.r);let fy=-9.8,tp=0,tr=0;onW=0;
    PTS.forEach(([x,y,z],i)=>{
      const A=x*sr+y*cr,dP=-A*sp-z*cp,dR=(x*cr-y*sr)*cp,py=s.y+A*cp-z*sp,v=s.vy+dP*s.vp+dR*s.vr;let f=0;
      if(i<4){const d=gh[i]-py+D0;s.wd[i]=d;if(d>0){onW++;f=KW*d-CW*v+(d>.25?300*(d-.25):0);}}
      else if(py<gh[i])f=80*(gh[i]-py)-12*v;
      if(f>0){fy+=f;tp+=f*dP;tr+=f*dR;}});
    const grip=onW/4;tp-=CG*clamp(s.ax,-12,12)*grip;tr+=CG*lat*grip;
    s.vy+=fy*h;s.vp+=tp/IP*h;s.vr+=tr/IR*h;s.vp*=1-.4*h;s.vr*=1-.4*h;
    s.y+=s.vy*h;s.p=clamp(s.p+s.vp*h,-1.4,1.4);s.r+=s.vr*h;}
  s.r=wrapA(s.r);
  if(!onW)s.air+=dt;else{if(s.air>.15&&c===player.car&&vy0<-2.5){sThud(Math.min(1,-vy0/9));shake=Math.max(shake,Math.min(.6,-vy0/14));}s.air=0;}
  const up=Math.cos(s.p)*Math.cos(s.r);
  if(up<.35){s.tip+=dt;c.speed*=Math.exp(-2.5*dt);if(c.cop)c.hp=0;if(c.ai)c.stun=Math.max(c.stun,1);
    if(c===player.car&&s.tip>1.5&&!s.told){s.told=true;toast(up<0?'On its roof':'On its side','Press R to put it back on the road.');}}
  else{s.tip=0;s.told=false;}
  s.rest=onW===4&&Math.abs(s.vy)+Math.abs(s.vp)+Math.abs(s.vr)<.02&&!c.speed;
  poseCar(c);
}

// trunks and poles in an 8 m grid; trees under 14 m snap, poles and old trees stop the car
let props=new Map(),falling=[],walls=new Map();
function addProp(p){const k=Math.floor(p.x/8)+','+Math.floor(p.z/8);let l=props.get(k);if(!l)props.set(k,l=[]);l.push(p);}
// fences and railings: segments in the same 8 m grid
function addWall(x0,z0,x1,z1){const s=[x0,z0,x1,z1];
  for(let i=Math.floor(Math.min(x0,x1)/8);i<=Math.floor(Math.max(x0,x1)/8);i++)for(let j=Math.floor(Math.min(z0,z1)/8);j<=Math.floor(Math.max(z0,z1)/8);j++){const k=i+','+j;let l=walls.get(k);if(!l)walls.set(k,l=[]);l.push(s);}}
function collideCar(x,z,r,c){
  const o=world.collide(x,z,r);x=o.x;z=o.z;let hit=o.hit;
  const ci=Math.floor(x/8),cj=Math.floor(z/8);
  for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++){const l=props.get(i+','+j);if(!l)continue;
    for(const p of l){if(p.down)continue;const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),m=r+p.r;if(d>=m||d<1e-5)continue;
      if(p.snap&&c&&Math.abs(c.speed)>4){snapTree(p,c);continue;}
      x=p.x+dx/d*m;z=p.z+dz/d*m;hit={nx:dx/d,nz:dz/d,prop:p};}}
  for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++){const l=walls.get(i+','+j);if(!l)continue;
    for(const s of l){const dx=s[2]-s[0],dz=s[3]-s[1],t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1),0,1),ex=x-s[0]-dx*t,ez=z-s[1]-dz*t,d=Math.hypot(ex,ez);
      if(d<r&&d>1e-5){x+=ex/d*(r-d);z+=ez/d*(r-d);hit={nx:ex/d,nz:ez/d,prop:s};}}}
  return{x,z,hit};
}
const _m=new THREE.Matrix4(),_r=new THREE.Matrix4(),_t=new THREE.Matrix4(),_ax=new THREE.Vector3();
function snapTree(p,c){
  p.down=true;const sg=Math.sign(c.speed)||1,dx=Math.sin(c.h)*sg,dz=Math.cos(c.h)*sg,sp=Math.abs(c.speed);
  const parts=[p.tree.tk,p.tree.cr].filter(Boolean).map(([mesh,i])=>{const m0=new THREE.Matrix4();mesh.getMatrixAt(i,m0);return{mesh,i,m0};});
  falling.push({p,ax:dz,az:-dx,th:.02,w:.4+sp*.04,h:p.tree[2],parts,landed:false});
  c.speed*=.7;hurtCar(c,.04+sp*.003);dent(c,dx,dz,Math.min(.12,sp*.006));
  if(c===player.car)shake=Math.min(1,.3+sp/40);
  sCrack(nearPlayer(p.x,p.z));puff(p.x,GY(p.x,p.z)+1.5,p.z,0x6f7a52,1.2);
}
function updateFalling(dt){
  for(const f of falling){
    if(f.done)continue;
    f.w+=14.7/Math.max(3,f.h)*Math.sin(f.th+.05)*dt;f.th+=f.w*dt;
    if(f.th>=1.52){f.th=1.52;if(!f.landed){f.landed=true;sThud(nearPlayer(f.p.x,f.p.z));puff(f.p.x+f.az*-f.h*.6,GY(f.p.x,f.p.z)+1,f.p.z+f.ax*f.h*.6,0x5d6b3c,2.2);}
      if(f.w>.5)f.w*=-.22;else{f.w=0;f.done=true;}}
    const gy=GY(f.p.x,f.p.z);_ax.set(f.ax,0,f.az).normalize();_r.makeRotationAxis(_ax,f.th);
    for(const q of f.parts){_m.makeTranslation(f.p.x,gy,f.p.z).multiply(_r).multiply(_t.makeTranslation(-f.p.x,-gy,-f.p.z)).multiply(q.m0);q.mesh.setMatrixAt(q.i,_m);q.mesh.instanceMatrix.needsUpdate=true;}
  }
}

// police: wrecked cops drop out, roadblocks from three stars, ramming from four
function flash(c){const on=Math.floor(performance.now()/130)%2;c.bar[0].material=on?copRed:copOff;c.bar[1].material=on?copOff:copBlue;}
function copDown(c,dt){
  if((c.hp??1)>0)return false;
  if(!c.dead){c.dead=true;c.deadT=0;c.bar[0].material=c.bar[1].material=copOff;}
  c.deadT+=dt;c.speed*=Math.exp(-2*dt);c.x+=Math.sin(c.h)*c.speed*dt;c.z+=Math.cos(c.h)*c.speed*dt;syncCar(c);ride(c,dt);
  if(Math.random()<dt*6)puff(c.x+Math.sin(c.h)*1.7,GY(c.x,c.z)+1,c.z+Math.cos(c.h)*1.7,0x2a2a2a,.7);
  return true;
}
function copRam(c,dt){
  c.ramT=(c.ramT||0)-dt;
  if(stars()<4||player.mode!=='car'||c.ramT>0)return;
  const pc=player.car,dx=pc.x-c.x,dz=pc.z-c.z,d=Math.hypot(dx,dz);if(d>2.9||d<.01)return;
  const nx=dx/d,nz=dz/d,f=3+Math.abs(c.speed)*.25;
  pc.pvx=(pc.pvx||0)+nx*f;pc.pvz=(pc.pvz||0)+nz*f;pc.pspin=(c.ramSide||1)*1.2;
  hurtCar(pc,.04);dent(pc,-nx,-nz,.08);shake=.6;sCrunch(.6);c.ramT=1.5;
}
function makeCop(x,z,h){
  const c=newCar(x,z,h,0xcfd2d3,skodaGeo),l=new THREE.Mesh(copBarGeo,copRed),r=new THREE.Mesh(copBarGeo,copBlue);
  l.position.set(.43,1.53,-.12);r.position.set(-.43,1.53,-.12);c.g.userData.body.add(l,r);c.bar=[l,r];c.cop=true;c.block=true;return c;
}
let blocks=[],blockT=10,blockAge=0;
function clearBlocks(){for(const c of blocks){worldGroup.remove(c.g);const i=world.cars.indexOf(c);if(i>=0)world.cars.splice(i,1);}blocks=[];}
function updateBlocks(dt){
  for(const c of blocks)if(!copDown(c,dt))flash(c);
  if(blocks.length){
    const b=blocks[0],dx=b.x-player.x,dz=b.z-player.z,ahead=dx*Math.sin(player.h)+dz*Math.cos(player.h);
    if(stars()<3||(Math.hypot(dx,dz)>200&&ahead<0)||(blockAge+=dt)>120)clearBlocks();
    return;
  }
  if(stars()<3||!field||(blockT-=dt)>0)return;
  blockT=5;
  const G=world.graph;let best=null,ba=.61;
  for(const [k,d] of field.dist){if(d<120||d>220)continue;const n=G.get(k),adj=roadAdj.get(k)||[];if(adj.length!==2)continue;
    const a=Math.abs(wrapA(Math.atan2(n.x-player.x,n.z-player.z)-player.h));if(a<ba){ba=a;best=n;}}
  if(!best)return;
  const [a,b]=(roadAdj.get(best.id)||[]).map(k=>G.get(k)),dir=Math.atan2(b.x-a.x,b.z-a.z),px=Math.cos(dir),pz=-Math.sin(dir);
  for(const s of[-1,1]){const x=best.x+px*s*2.4,z=best.z+pz*s*2.4;if(world.inBuilding(x,z))continue;blocks.push(makeCop(x,z,dir+Math.PI/2+s*.25));}
  blockAge=0;if(blocks.length){blockT=40;toast('Roadblock ahead','Find another way round.');}
}
function updateCopsExtra(dt){
  for(const c of cops.slice())if(c.dead&&(c.deadT>25||Math.hypot(c.x-player.x,c.z-player.z)>140))removeCop(c);
  updateBlocks(dt);
}

// traffic lights at the three signals mapped in OpenStreetMap; two phases split by road direction
const SIGNALS=[[55.37478,23.12413],[55.37941,23.11505],[55.38116,23.10941]];
let signals=[],ranT=0;
const LAMP_ON=[0xff2a1f,0xffb300,0x2fe06a].map(c=>new THREE.MeshBasicMaterial({color:c})),LAMP_OFF=[0x3a1512,0x3a2a10,0x123a1e].map(c=>new THREE.MeshBasicMaterial({color:c}));
function light(s,h){const g=Math.abs(Math.cos(wrapA(h-s.a0)))>.707?0:1,T=s.t%30,u=g?(T+15)%30:T;return u<12?'g':u<15?'a':'r';}
function redAhead(x,z,h){
  const fx=Math.sin(h),fz=Math.cos(h);
  for(const s of signals){const dx=s.n.x-x,dz=s.n.z-z,al=dx*fx+dz*fz;if(al<5||al>18||Math.abs(dx*fz-dz*fx)>7)continue;const l=light(s,h);if(l==='r'||(l==='a'&&al>9))return true;}
  return false;
}
function buildSignals(){
  signals=[];const G=world.graph,box=new THREE.BoxGeometry(.32,.9,.22),lens=new THREE.SphereGeometry(.09,10,8),poleG=new THREE.CylinderGeometry(.07,.09,3.4,8),dark=new THREE.MeshLambertMaterial({color:0x22262a});
  for(const [la,lo] of SIGNALS){
    const [x,z]=LL(la,lo),k=nearestKey(x,z),n=k&&G.get(k);if(!n||Math.hypot(n.x-x,n.z-z)>30)continue;
    const nb=(roadAdj.get(k)||[]).map(o=>G.get(o));if(!nb.length)continue;
    const s={n,a0:Math.atan2(nb[0].x-n.x,nb[0].z-n.z),t:Math.random()*30,heads:[],pAl:null};
    for(const m of nb){
      const ux=(m.x-n.x),uz=(m.z-n.z),L=Math.hypot(ux,uz)||1,u=[ux/L,uz/L],px=n.x+u[0]*7+u[1]*5.5,pz=n.z+u[1]*7-u[0]*5.5;
      if(world.inBuilding(px,pz))continue;
      const g=new THREE.Group(),gy=GY(px,pz),pole=new THREE.Mesh(poleG,dark),head=new THREE.Mesh(box,dark);pole.position.y=1.7;head.position.y=3.6;g.add(pole,head);
      const lamps=[0,1,2].map(i=>{const l=new THREE.Mesh(lens,LAMP_OFF[i]);l.position.set(0,3.88-i*.28,.12);g.add(l);return l;});
      g.position.set(px,gy,pz);g.rotation.y=Math.atan2(u[0],u[1]);worldGroup.add(g);addProp({x:px,z:pz,r:.12});
      s.heads.push({lamps,h:Math.atan2(-u[0],-u[1])});
    }
    signals.push(s);
  }
}
function updateSignals(dt){
  ranT-=dt;
  for(const s of signals){
    s.t+=dt;
    for(const hd of s.heads){const l=light(s,hd.h),on=l==='r'?0:l==='a'?1:2;hd.lamps.forEach((m,i)=>m.material=i===on?LAMP_ON[i]:LAMP_OFF[i]);}
    if(player.mode!=='car')continue;
    const c=player.car,dx=s.n.x-c.x,dz=s.n.z-c.z,al=dx*Math.sin(c.h)+dz*Math.cos(c.h),lat=Math.abs(dx*Math.cos(c.h)-dz*Math.sin(c.h));
    if(s.pAl!=null&&s.pAl>0&&al<=0&&lat<7&&c.speed>4&&light(s,c.h)==='r'&&ranT<=0){
      const seen=cops.concat(blocks).some(o=>!o.dead&&Math.hypot(o.x-c.x,o.z-c.z)<80&&clearLine(o.x,o.z,c.x,c.z));
      if(seen){ranT=8;addHeat(1);toast('Ran a red light','The police saw it.');}
    }
    s.pAl=al;
  }
}

// one bus looping the stops mapped in OpenStreetMap, from the bus station out east to Norgėlai and back west to Stonų sodai
const STOPS=[[55.37898,23.115592,'Raseinių autobusų stotis'],[55.373307,23.126489,''],[55.361184,23.153475,'Norgėlai'],[55.378121,23.115132,'Raseiniai AS'],[55.3748,23.099262,''],[55.377025,23.086748,'Stonų sodai'],[55.385381,23.085706,'']];
let bus=null;
function roadPath(a,b){
  const G=world.graph,dist=new Map([[a,0]]),prev=new Map(),hp=[[0,a]];
  const push=e=>{hp.push(e);let i=hp.length-1;while(i>0){const p=(i-1)>>1;if(hp[p][0]<=hp[i][0])break;[hp[p],hp[i]]=[hp[i],hp[p]];i=p;}};
  const pop=()=>{const t=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let i=0;for(;;){let m=i;const x=2*i+1,y=x+1;if(x<hp.length&&hp[x][0]<hp[m][0])m=x;if(y<hp.length&&hp[y][0]<hp[m][0])m=y;if(m===i)break;[hp[m],hp[i]]=[hp[i],hp[m]];i=m;}}return t;};
  while(hp.length){const [d,k]=pop();if(k===b)break;if(d>dist.get(k))continue;const n=G.get(k);
    for(const o of roadAdj.get(k)||[]){const m=G.get(o),nd=d+Math.hypot(m.x-n.x,m.z-n.z);if(nd<(dist.has(o)?dist.get(o):Infinity)){dist.set(o,nd);prev.set(o,k);push([nd,o]);}}}
  if(!dist.has(b))return null;const out=[b];while(out[out.length-1]!==a)out.push(prev.get(out[out.length-1]));return out.reverse().map(k=>G.get(k));
}
const busTex=(()=>{const c=document.createElement('canvas');c.width=256;c.height=48;const x=c.getContext('2d');x.fillStyle='#111';x.fillRect(0,0,256,48);x.fillStyle='#ffb22e';x.font='bold 30px Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('RASEINIAI AS',128,26);return new THREE.CanvasTexture(c);})();
const stopTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#1f5aa6';x.fillRect(0,0,64,64);x.fillStyle='#fff';x.fillRect(14,16,36,24);x.fillStyle='#1f5aa6';x.fillRect(18,20,12,8);x.fillRect(34,20,12,8);x.fillStyle='#fff';x.beginPath();x.arc(22,44,5,0,TAU);x.arc(42,44,5,0,TAU);x.fill();return new THREE.CanvasTexture(c);})();
function busMesh(){
  const g=new THREE.Group(),M=c=>new THREE.MeshLambertMaterial({color:c}),glass=M(0x1d2830),B=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;};
  B(2.5,2.55,11.8,M(0xd9d8d2),0,1.78,0);B(2.52,.95,9.9,glass,0,2.25,-.6);B(2.3,1.35,.06,glass,0,2.05,5.91);B(2.3,.9,.06,glass,0,2.3,-5.91);
  B(2.52,.24,11.82,M(0x1f5aa6),0,1.32,0);B(2.54,.3,11.84,M(0x26292c),0,.62,0);B(.06,1.9,1.1,glass,1.26,1.55,4.6);
  const board=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.32),new THREE.MeshBasicMaterial({map:busTex}));board.position.set(0,2.88,5.95);g.add(board);
  const wg=new THREE.CylinderGeometry(.5,.5,.32,16).rotateZ(Math.PI/2),wm=M(0x161718);
  for(const z of[3.9,-3.4])for(const x of[-1.1,1.1]){const w=new THREE.Mesh(wg,wm);w.position.set(x,.5,z);g.add(w);}
  for(const [y,col] of[[1.05,0xfff3d6],[1.05,0xb01818]])for(const x of[-.95,.95]){const l=new THREE.Mesh(new THREE.BoxGeometry(.32,.16,.04),new THREE.MeshBasicMaterial({color:col}));l.position.set(x,y,col===0xb01818?-5.92:5.92);g.add(l);}
  return g;
}
function buildBus(){
  bus=null;const G=world.graph,stops=[];
  for(const [la,lo,name] of STOPS){const [x,z]=LL(la,lo),k=nearestKey(x,z),n=k&&G.get(k);if(n&&Math.hypot(n.x-x,n.z-z)<60)stops.push({k,name,n});}
  if(stops.length<2)return;
  const pts=[],cum=[],at=[];let L=0;
  for(let i=0;i<stops.length;i++){
    const p=roadPath(stops[i].k,stops[(i+1)%stops.length].k);if(!p)return;
    at.push({s:L,name:stops[i].name});
    for(let j=pts.length?1:0;j<p.length;j++){if(pts.length)L+=Math.hypot(p[j].x-pts[pts.length-1][0],p[j].z-pts[pts.length-1][1]);pts.push([p[j].x,p[j].z]);cum.push(L);}
  }
  const sm=new THREE.MeshBasicMaterial({map:stopTex}),sp=new THREE.CylinderGeometry(.04,.04,2.6,6),pm=new THREE.MeshLambertMaterial({color:0x8d9196});
  for(const st of stops){const P=busAt({pts,cum,L},cumAtNode(pts,cum,st.n)),x=P.x+P.ox*2.6,z=P.z+P.oz*2.6,g=new THREE.Group(),y=GY(x,z);
    const pole=new THREE.Mesh(sp,pm);pole.position.y=1.3;const sign=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),sm);sign.position.y=2.4;sign.material.side=THREE.DoubleSide;g.add(pole,sign);
    g.position.set(x,y,z);g.rotation.y=P.h;worldGroup.add(g);addProp({x,z,r:.1});}
  const mesh=busMesh();worldGroup.add(mesh);
  bus={pts,cum,L,at,mesh,s:at[0].s,v:0,next:1,wait:5,x:0,z:0,h:0};placeBus(0);
}
function cumAtNode(pts,cum,n){let bi=0,bd=Infinity;for(let i=0;i<pts.length;i++){const d=Math.hypot(pts[i][0]-n.x,pts[i][1]-n.z);if(d<bd){bd=d;bi=i;}}return cum[bi];}
// position on the loop at distance s, with the right-hand lane offset
function busAt(b,s){
  s=((s%b.L)+b.L)%b.L;let lo=0,hi=b.cum.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(b.cum[m]<=s)lo=m;else hi=m;}
  const a=b.pts[lo],c=b.pts[hi],seg=b.cum[hi]-b.cum[lo]||1,t=(s-b.cum[lo])/seg,dx=c[0]-a[0],dz=c[1]-a[1],L=Math.hypot(dx,dz)||1,hx=dx/L,hz=dz/L;
  return{x:a[0]+dx*t-hz*1.9,z:a[1]+dz*t+hx*1.9,h:Math.atan2(dx,dz),ox:-hz,oz:hx};
}
function placeBus(dt){
  const f=busAt(bus,bus.s+5),r=busAt(bus,bus.s-5);
  bus.x=(f.x+r.x)/2;bus.z=(f.z+r.z)/2;bus.h=Math.atan2(f.x-r.x,f.z-r.z);
  const yf=GY(f.x,f.z)+world.surf(f.x,f.z),yr=GY(r.x,r.z)+world.surf(r.x,r.z);
  bus.mesh.position.set(bus.x,(yf+yr)/2,bus.z);bus.mesh.rotation.order='YXZ';bus.mesh.rotation.y=bus.h;bus.mesh.rotation.x=-Math.atan2(yf-yr,10);
}
function busBlocked(){
  const fx=Math.sin(bus.h),fz=Math.cos(bus.h),chk=(x,z)=>{const dx=x-bus.x,dz=z-bus.z,al=dx*fx+dz*fz;return al>5&&al<16&&Math.abs(dx*fz-dz*fx)<2.4;};
  return chk(player.x,player.z)||world.cars.some(o=>chk(o.x,o.z));
}
function updateBus(dt){
  if(!bus)return;
  const nx=bus.at[bus.next%bus.at.length],toStop=((nx.s-bus.s)%bus.L+bus.L)%bus.L;
  if(bus.wait>0){bus.wait-=dt;bus.v=0;if(bus.wait<=0)sHiss(nearPlayer(bus.x,bus.z));}
  else{
    let target=9;
    const h2=busAt(bus,bus.s+20).h;if(Math.abs(wrapA(h2-bus.h))>.45)target=5;
    if(toStop<25)target=Math.min(target,Math.max(1.2,toStop*.45));
    if(busBlocked()||redAhead(bus.x+Math.sin(bus.h)*5,bus.z+Math.cos(bus.h)*5,bus.h))target=0;
    bus.v+=clamp(target-bus.v,-6*dt,2*dt);bus.s+=bus.v*dt;
    if(toStop<.8){bus.next++;bus.wait=8;sHiss(nearPlayer(bus.x,bus.z));}
  }
  placeBus(dt);
  // the player bounces off its length, not just its centre
  const fx=Math.sin(bus.h),fz=Math.cos(bus.h),px=player.x-bus.x,pz=player.z-bus.z,t=clamp(px*fx+pz*fz,-5.6,5.6),qx=px-fx*t,qz=pz-fz*t,d=Math.hypot(qx,qz),R=player.mode==='car'?2.3:1.5;
  if(d<R&&d>.01){
    const nx=qx/d,nz=qz/d;
    if(player.mode==='car'){const c=player.car,sp=Math.abs(c.speed);c.x+=nx*(R-d);c.z+=nz*(R-d);
      if(sp>8){shake=Math.min(1,sp/25);hit(Math.min(1,sp/28));hurtCar(c,sp*.011);crashFX(c,{nx,nz},sp);}c.speed*=-.2;syncCar(c);player.x=c.x;player.z=c.z;}
    else{player.x+=nx*(R-d);player.z+=nz*(R-d);}
  }
}
const busAhead=(c,chk)=>bus&&(chk(bus.x,bus.z)||chk(bus.x-Math.sin(bus.h)*5,bus.z-Math.cos(bus.h)*5)||chk(bus.x+Math.sin(bus.h)*5,bus.z+Math.cos(bus.h)*5));

// church bells at noon and six from the main church
let lastTod=null,bellsRung=0,bellChurch=null;
function bell(t,v,out){
  for(const [r,a,d] of[[.5,.55,4.5],[1,1,3.2],[1.19,.45,2.6],[1.5,.3,2],[2,.3,1.6],[2.74,.12,1]]){
    const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=311*r;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*a,t+.008);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(out);o.start(t);o.stop(t+d+.05);}
}
function ringBells(n){
  bellsRung+=n;const ch=bellChurch;if(!ch||!snd)return;
  const dx=ch.x-camera.position.x,dz=ch.z-camera.position.z,d=Math.hypot(dx,dz),v=.2/(1+d/120);if(v<.004)return;
  const f=new THREE.Vector3();camera.getWorldDirection(f);const fl=Math.hypot(f.x,f.z)||1,pan=AC.createStereoPanner();
  pan.pan.value=clamp((dx*-f.z/fl+dz*f.x/fl)/(d||1),-1,1);pan.connect(snd.master);
  for(let i=0;i<n;i++)bell(AC.currentTime+.2+i*2.2,v,pan);
}
function updateBells(){
  if(lastTod!=null)for(const [hr,n] of[[12,12],[18,6]])if(lastTod<hr&&tod>=hr&&tod-lastTod<1)ringBells(n);
  lastTod=tod;
}

// ---------- the sports centre stadium and the Vilniaus g. pavement beside it ----------
// OSM maps only the outline (way 104108266); the 400 m track, pitch, tower and fences inside it are laid out by eye
const STAD={lat:55.3714813,lon:23.1290762,brg:127.7,poly:[[55.3720707,23.1280698],[55.3720047,23.1279561],[55.3719319,23.127872],[55.3718497,23.1278161],[55.3717464,23.1277817],[55.3716554,23.127821],[55.3715894,23.1278756],[55.3715418,23.1278059],[55.3708758,23.1293135],[55.3708319,23.129552],[55.3708399,23.1297898],[55.3708801,23.1300329],[55.3710109,23.1302677],[55.3711256,23.1303398],[55.3712449,23.1303459],[55.3713688,23.1303013],[55.371475,23.1301753],[55.3721468,23.1287047],[55.3721138,23.1286341],[55.3721274,23.1284617],[55.3721162,23.1282608],[55.3720707,23.1280698]]};
const SPORT=[55.3722196,23.1275741];
function canvasTex(w,h,draw,rx=1,ry=1){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=4;return t;}
function quadsMesh(Q,mat){
  const pos=[],uv=[],nor=[];
  for(const [a,b,y0,y1,u0,u1] of Q){const ga=GY(a[0],a[1]),gb=GY(b[0],b[1]),nx=b[1]-a[1],nz=a[0]-b[0],l=Math.hypot(nx,nz)||1;
    pos.push(a[0],ga+y0,a[1],b[0],gb+y0,b[1],b[0],gb+y1,b[1],a[0],ga+y0,a[1],b[0],gb+y1,b[1],a[0],ga+y1,a[1]);
    uv.push(u0,0,u1,0,u1,1,u0,0,u1,1,u0,1);for(let i=0;i<6;i++)nor.push(nx/l,0,nz/l);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  const m=new THREE.Mesh(g,mat);worldGroup.add(m);return m;
}
function instances(geo,col,list){
  const m=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({color:col}),list.length),M=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
  list.forEach(([x,y,z,h,sx,sy,sz,tilt=0],i)=>{e.set(0,h,tilt,'YXZ');q.setFromEuler(e);M.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(sx,sy,sz));m.setMatrixAt(i,M);});
  m.castShadow=true;worldGroup.add(m);return m;
}
const chainTex=canvasTex(64,64,x=>{x.strokeStyle='rgba(165,170,165,1)';x.lineWidth=1.3;for(let i=-64;i<=64;i+=8){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.moveTo(i+64,0);x.lineTo(i,64);x.stroke();}});
const barTex=canvasTex(16,128,x=>{x.fillStyle='#2b3530';x.fillRect(6,0,4,128);x.fillRect(0,6,16,6);x.fillRect(0,112,16,6);});

function buildStadium(){
  const [cx,cz]=LL(STAD.lat,STAD.lon),br=STAD.brg*Math.PI/180,ux=Math.sin(br),uz=-Math.cos(br),vx=-Math.cos(br),vz=-Math.sin(br);
  const at=(u,v)=>[cx+u*ux+v*vx,cz+u*uz+v*vz],local=(x,z)=>[(x-cx)*ux+(z-cz)*uz,(x-cx)*vx+(z-cz)*vz],hu=Math.atan2(ux,uz);
  const a=42.2,R1=31.2,R2=38.5,FL=49,FW=29;
  // ground: track, pitch and the tartan corner painted on one canvas laid over the oval
  const tex=canvasTex(2048,1024,x=>{
    x.setTransform(2048/184,0,0,-1024/92,1024,512);
    const oval=r=>{x.beginPath();x.moveTo(-a,-r);x.lineTo(a,-r);x.arc(a,0,r,-Math.PI/2,Math.PI/2);x.lineTo(-a,r);x.arc(-a,0,r,Math.PI/2,Math.PI*1.5);x.closePath();};
    x.fillStyle='#7a7364';x.fillRect(-92,-46,184,92);
    oval(R2);x.fillStyle='#7f7a71';x.fill();
    for(let i=0;i<300;i++){x.fillStyle=`rgba(${i%2?70:150},${i%2?66:140},${i%2?58:125},.25)`;x.fillRect(Math.random()*184-92,Math.random()*92-46,Math.random()*3,Math.random()*1.5);}
    x.strokeStyle='rgba(225,225,215,.35)';x.lineWidth=.06;for(let k=1;k<6;k++){oval(R1+k*1.22);x.stroke();}
    x.save();oval(R1);x.clip();
    for(let i=0;i<27;i++){x.fillStyle=i%2?'#456331':'#4d6c37';x.fillRect(-81+i*6,-46,6,92);}
    for(const s of[-1,1]){const g=x.createRadialGradient(s*(FL-4),0,0,s*(FL-4),0,9);g.addColorStop(0,'rgba(120,105,70,.55)');g.addColorStop(1,'rgba(120,105,70,0)');x.fillStyle=g;x.fillRect(s*(FL-4)-9,-9,18,18);}
    x.fillStyle='#8f8a7e';x.fillRect(FL+3,-R1,30,R1);x.fillStyle='#8a3d30';x.fillRect(FL+3,0,30,R1);
    x.restore();
    x.strokeStyle='rgba(235,235,228,.92)';x.lineWidth=.12;
    x.strokeRect(-FL,-FW,FL*2,FW*2);x.beginPath();x.moveTo(0,-FW);x.lineTo(0,FW);x.stroke();
    x.beginPath();x.arc(0,0,9.15,0,Math.PI*2);x.stroke();
    for(const s of[-1,1]){
      x.strokeRect(Math.min(s*FL,s*(FL-16.5)),-20.16,16.5,40.32);x.strokeRect(Math.min(s*FL,s*(FL-5.5)),-9.16,5.5,18.32);
      x.beginPath();const c=s*(FL-11),t=Math.acos(5.5/9.15);if(s>0)x.arc(c,0,9.15,Math.PI-t,Math.PI+t);else x.arc(c,0,9.15,-t,t);x.stroke();
      x.fillStyle='#eee';x.fillRect(c-.15,-.15,.3,.3);}
    x.strokeRect(FL+6,4,24,R1-8);
  });
  const N1=16,N2=20,N=2*(N1+N2),RS=[0,6,12,18,24,R1,R1+3.6,R2,R2+1.5],pos=[],uv=[],nor=[],idx=[];
  const P=(i,r)=>{i%=N;if(i<N1)return[-a+2*a*i/N1,-r];i-=N1;if(i<N2){const t=-Math.PI/2+Math.PI*i/N2;return[a+r*Math.cos(t),r*Math.sin(t)];}
    i-=N2;if(i<N1)return[a-2*a*i/N1,r];i-=N1;const t=Math.PI/2+Math.PI*i/N2;return[-a+r*Math.cos(t),r*Math.sin(t)];};
  for(const r of RS)for(let i=0;i<N;i++){const [u,v]=P(i,r),[X,Z]=at(u,v);pos.push(X,GY(X,Z)+.07,Z);uv.push((u+92)/184,(v+46)/92);nor.push(0,1,0);}
  for(let k=0;k<RS.length-1;k++)for(let i=0;i<N;i++){const a0=k*N+i,a1=k*N+(i+1)%N;idx.push(a0,a0+N,a1+N,a0,a1+N,a1);}
  const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));fg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));fg.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));fg.setIndex(idx);
  const field=new THREE.Mesh(fg,new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}));field.receiveShadow=true;worldGroup.add(field);

  // goals: two full size on the pitch, a small one on the tartan
  const white=new THREE.MeshLambertMaterial({color:0xe8e8e4}),net=new THREE.MeshLambertMaterial({map:chainTex,transparent:true,alphaTest:.3,side:THREE.DoubleSide,depthWrite:false});
  const goal=(u,v,face,w,h,d)=>{const g=new THREE.Group(),[X,Z]=at(u,v);g.position.set(X,GY(X,Z),Z);g.rotation.y=hu+(face<0?Math.PI:0);
    const bar=(sx,sy,sz,px,py,pz)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),white);m.position.set(px,py,pz);m.castShadow=true;g.add(m);};
    bar(.12,h,.12,-w/2,h/2,0);bar(.12,h,.12,w/2,h/2,0);bar(w+.12,.12,.12,0,h,0);bar(.05,.05,d,-w/2,.03,d/2);bar(.05,.05,d,w/2,.03,d/2);bar(w,.05,.05,0,.03,d);
    const pl=(sx,sy,px,py,pz,ry,rx=0)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),net);m.position.set(px,py,pz);m.rotation.set(rx,ry,0);g.add(m);};
    const back=Math.hypot(h,d);pl(w,back,0,h/2,d/2,0,-Math.atan2(d,h));pl(d,h,-w/2,h/2,d/2,Math.PI/2);pl(d,h,w/2,h/2,d/2,Math.PI/2);
    worldGroup.add(g);};
  goal(-FL,0,-1,7.32,2.44,1.8);goal(FL,0,1,7.32,2.44,1.8);goal(FL+28,R1/2,1,3,2,1.2);

  // the judges' tower on the far side from Vilniaus g.: a brick arch, a timber cabin on top, steel stairs both ways
  {const T=new THREE.Group(),[X,Z]=at(-a+12,-R2-2.9);T.position.set(X,GY(X,Z),Z);T.rotation.y=hu-Math.PI/2;
    const brick=canvasTex(64,64,x=>{x.fillStyle='#8e4a36';x.fillRect(0,0,64,64);x.fillStyle='#b9ad9a';for(let r=0;r<4;r++){x.fillRect(0,r*16,64,2);const o=r%2?0:16;for(let k=0;k<2;k++)x.fillRect(o+k*32,r*16,2,16);}},2,2);
    const wood=canvasTex(64,64,x=>{x.fillStyle='#a8743e';x.fillRect(0,0,64,64);for(let k=0;k<8;k++){x.fillStyle=`rgba(60,35,15,${.25+.2*(k%3)/2})`;x.fillRect(k*8,0,1.5,64);x.fillStyle=`rgba(255,220,170,${.05*(k%2)})`;x.fillRect(k*8+2,0,5,64);}},.25,.25);
    const sh=new THREE.Shape();sh.moveTo(-1.8,0);sh.lineTo(-.9,0);sh.lineTo(-.9,1.5);sh.absarc(0,1.5,.9,Math.PI,0,true);sh.lineTo(.9,0);sh.lineTo(1.8,0);sh.lineTo(1.8,2.9);sh.lineTo(-1.8,2.9);sh.lineTo(-1.8,0);
    const base=new THREE.ExtrudeGeometry(sh,{depth:3,bevelEnabled:false});base.translate(0,0,-1.5);
    const add=(geo,mat,px,py,pz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.castShadow=m.receiveShadow=true;T.add(m);return m;};
    const steel=new THREE.MeshLambertMaterial({color:0x2b2d2f}),woodM=new THREE.MeshLambertMaterial({map:wood});
    add(base,new THREE.MeshLambertMaterial({map:brick}),0,0,0);
    add(new THREE.BoxGeometry(6.6,.16,3.6),new THREE.MeshLambertMaterial({color:0x8d8a84}),0,2.98,0);
    add(new THREE.BoxGeometry(4.4,2.5,3.8),woodM,0,4.31,0);
    add(new THREE.BoxGeometry(3.4,.85,.06),new THREE.MeshLambertMaterial({color:0x1d2326}),0,4.75,-1.92);
    for(const s of[-1,1])add(new THREE.BoxGeometry(.06,.6,.9),new THREE.MeshLambertMaterial({color:0x1d2326}),s*2.22,4.8,-.6);
    const roof=new THREE.ConeGeometry(1,1,4,1);roof.rotateY(Math.PI/4);add(roof,new THREE.MeshLambertMaterial({color:0x5b3f2c}),0,6.22,0).scale.set(3.6,1.3,3.25);
    for(const s of[-1,1]){
      const st=new THREE.Group();st.position.set(s*3.3,0,-.6);st.scale.x=s;T.add(st);
      const L=Math.hypot(3.4,2.98),ang=Math.atan2(2.98,3.4);
      for(const z of[-.45,.45]){const m=new THREE.Mesh(new THREE.BoxGeometry(L,.18,.05),steel);m.position.set(1.7,1.49,z);m.rotation.z=-ang;st.add(m);}
      for(let k=1;k<12;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.26,.04,.9),steel);m.position.set(3.4*k/12,2.98*(1-k/12),0);st.add(m);}
      const hr=new THREE.Mesh(new THREE.BoxGeometry(L,.04,.04),steel);hr.position.set(1.7,2.39,.45);hr.rotation.z=-ang;st.add(hr);
      for(let k=0;k<4;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.9,.04),steel);m.position.set(3.4*k/3,2.98*(1-k/3)+.45,.45);st.add(m);}
      add(new THREE.BoxGeometry(.04,.04,3.6),steel,s*3.28,3.95,0);add(new THREE.BoxGeometry(.04,.9,.04),steel,s*3.28,3.5,1.78);}
    add(new THREE.BoxGeometry(1.15,1.1,1.15),new THREE.MeshLambertMaterial({color:0xd6d6cf}),6.4,.72,.9);
    add(new THREE.BoxGeometry(1.2,.15,1.2),new THREE.MeshLambertMaterial({color:0x8a6a48}),6.4,.08,.9);
    worldGroup.add(T);
    const cs=Math.cos(T.rotation.y),sn=Math.sin(T.rotation.y),cn=[[-1.8,-1.5],[1.8,-1.5],[1.8,1.5],[-1.8,1.5]].map(([px,pz])=>[X+px*cs+pz*sn,Z-px*sn+pz*cs]);
    for(let i=0;i<4;i++)addWall(...cn[i],...cn[(i+1)%4]);}

  // fence along the OSM outline: tall bars facing Vilniaus g., rusty chain-link elsewhere, a gate towards the sports hall
  const ring=STAD.poly.map(([la,lo])=>LL(la,lo)),[gx,gz]=LL(...SPORT);let gate=ring[0],gd=1e9;
  for(const q of ring){const d=Math.hypot(q[0]-gx,q[1]-gz);if(d<gd){gd=d;gate=q;}}
  const MQ=[],BQ=[],posts=[],bposts=[];
  for(let i=0;i<ring.length-1;i++){const A=ring[i],B=ring[i+1],L=Math.hypot(B[0]-A[0],B[1]-A[1]),n=Math.max(1,Math.ceil(L/3)),mx=(A[0]+B[0])/2,mz=(A[1]+B[1])/2;
    const tall=local(mx,mz)[1]>30;
    for(let k=0;k<n;k++){const p=[A[0]+(B[0]-A[0])*k/n,A[1]+(B[1]-A[1])*k/n],q=[A[0]+(B[0]-A[0])*(k+1)/n,A[1]+(B[1]-A[1])*(k+1)/n],l=L/n;
      if(Math.hypot((p[0]+q[0])/2-gate[0],(p[1]+q[1])/2-gate[1])<4)continue;
      addWall(p[0],p[1],q[0],q[1]);
      if(tall){BQ.push([p,q,0,1.9,0,l/.15]);bposts.push([p[0],GY(p[0],p[1])+.95,p[1],0,.07,1.9,.07]);}
      else{MQ.push([p,q,.05,1.3,0,l]);posts.push([p[0],GY(p[0],p[1])+.7,p[1],0,.06,1.4,.06]);}}}
  quadsMesh(MQ,new THREE.MeshLambertMaterial({map:chainTex,transparent:true,alphaTest:.3,side:THREE.DoubleSide,depthWrite:false})).material.map.repeat.set(1,1.3);
  quadsMesh(BQ,new THREE.MeshLambertMaterial({map:barTex,transparent:true,alphaTest:.4,side:THREE.DoubleSide}));
  const unit=new THREE.BoxGeometry(1,1,1);instances(unit,0x6b4630,posts);instances(unit,0x2b3530,bposts);

  // Vilniaus g. on the stadium side: red brick pavement behind a steel railing at the kerb
  const deg=new Map();for(const e of world.edges)for(const k of[e.a,e.b])deg.set(k,(deg.get(k)||0)+1);
  const G=world.graph,RQ=[],rp=[],rr=[];
  for(const e of world.edges){if(e.cls)continue;const A=G.get(e.a),B=G.get(e.b);if(!A||!B)continue;
    const [mu,mv]=local((A.x+B.x)/2,(A.z+B.z)/2);if(Math.abs(mu)>95||mv<38||mv>80)continue;
    const dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz),tx=dx/L,tz=dz/L;let nx=-tz,nz=tx;if(nx*vx+nz*vz>0){nx=-nx;nz=-nz;}
    const e2=e.w/2,n=Math.ceil(L/2.5);
    for(let k=0;k<n;k++){const s0=L*k/n,s1=L*(k+1)/n,x0=A.x+tx*s0,z0=A.z+tz*s0,x1=A.x+tx*s1,z1=A.z+tz*s1;
      if(Math.abs(local(x0,z0)[0])>92||[A,B].some(q=>deg.get(q.id)>2&&Math.hypot(q.x-(x0+x1)/2,q.z-(z0+z1)/2)<12))continue;
      const o=(x,z,d)=>[x+nx*d,z+nz*d];
      RQ.push([o(x0,z0,e2+.02),o(x1,z1,e2+.02),o(x1,z1,e2+2.6),o(x0,z0,e2+2.6)]);
      const [px,pz]=o(x0,z0,e2+.45),[qx,qz]=o(x1,z1,e2+.45),h=Math.atan2(qx-px,qz-pz),my=(GY(px,pz)+GY(qx,qz))/2+.14;
      rp.push([px,GY(px,pz)+.64,pz,h,.05,1,.05]);
      for(const y of[.5,.95])rr.push([(px+qx)/2,my+y,(pz+qz)/2,h,.04,.04,s1-s0]);
      addWall(px,pz,qx,qz);}}
  if(RQ.length){const p=[],c=[],nr=[];
    for(const q of RQ)for(const i of[0,1,2,0,2,3]){const [x,z]=q[i];p.push(x,GY(x,z)+.15,z);c.push(.42,.27,.23);nr.push(0,1,0);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nr,3));
    const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}));m.receiveShadow=true;worldGroup.add(m);
    instances(unit,0x3a3e40,rp);instances(unit,0x3a3e40,rr);}
}

function buildExtra(){
  props=new Map();walls=new Map();falling=[];blocks=[];blockT=10;lastTod=null;
  for(const t of world.treeData||[])addProp({x:t[0],z:t[1],r:.12+t[2]*.012,snap:t[2]<14,tree:t});
  for(const q of world.poles||[])addProp({x:q.x,z:q.z,r:.16});
  const L=world.labels||[];bellChurch=L.find(l=>l.kind==='church'&&/Švč/.test(l.text))||L.find(l=>l.kind==='church')||null;
  buildSignals();buildBus();buildStadium();
}
function updateExtra(dt){
  updateFalling(dt);updateDebris(dt);updateShoved(dt);updateCopsExtra(dt);updateSignals(dt);updateBus(dt);updateBells();
}
