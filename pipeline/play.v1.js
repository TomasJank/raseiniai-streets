// ---------- sound ----------
let AC=null,snd=null,muted=false;
function initAudio(){
  if(AC){if(AC.state==='suspended')AC.resume().catch(()=>{});return;}
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
  try{AC=new Ctx();}catch(e){return;}
  const master=AC.createGain();master.gain.value=muted?0:.6;master.connect(AC.destination);
  const buf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),nd=buf.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  const voice=(type,freq,q)=>{const f=AC.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=AC.createGain();g.gain.value=0;f.connect(g);g.connect(master);return{f,g};};
  const noise=(type,freq,q)=>{const v=voice(type,freq,q),s=AC.createBufferSource();s.buffer=buf;s.loop=true;s.connect(v.f);s.start();return v;};
  const osc=(type,freq,to)=>{const o=AC.createOscillator();o.type=type;o.frequency.value=freq;o.connect(to);o.start();return o;};
  const eng=voice('lowpass',500,1);const e1=osc('sawtooth',60,eng.f),e2=osc('square',30,eng.f);
  const horn=voice('lowpass',1500,.7);osc('square',392,horn.f);osc('square',494,horn.f);
  const siren=voice('bandpass',1000,.6),sirenO=osc('sawtooth',720,siren.f),lfo=AC.createOscillator(),lg=AC.createGain();
  lfo.frequency.value=.8;lg.gain.value=220;lfo.connect(lg);lg.connect(sirenO.frequency);lfo.start();
  snd={master,buf,eng,e1,e2,horn,siren,tyre:noise('bandpass',1500,2.5),wind:noise('lowpass',420,.5)};
}
addEventListener('keydown',initAudio);addEventListener('pointerdown',initAudio);
document.addEventListener('visibilitychange',()=>{if(AC)document.hidden?AC.suspend():AC.resume();});
const setG=(v,x)=>v.g.gain.setTargetAtTime(x,AC.currentTime,.06);
function updateAudio(playing){
  if(!snd)return;
  const inCar=playing&&player.mode==='car',c=player.car,s=inCar?Math.abs(c.speed):0;
  const BANDS=[0,8,15,22,29,37,99];let g=0;while(s>=BANDS[g+1])g++;
  const fr=(s-BANDS[g])/(BANDS[g+1]-BANDS[g]),hz=48+fr*62+g*7,th=inCar&&down('KeyW','ArrowUp');
  snd.e1.frequency.setTargetAtTime(hz,AC.currentTime,.04);snd.e2.frequency.setTargetAtTime(hz/2,AC.currentTime,.04);
  snd.eng.f.frequency.setTargetAtTime(th?1500:650,AC.currentTime,.08);
  setG(snd.eng,inCar?(th?.13:.075):0);
  setG(snd.wind,inCar?Math.min(.22,s*.007):0);
  setG(snd.tyre,inCar&&c.sliding?.2:0);
  setG(snd.horn,playing&&down('KeyQ')?.1:0);
  let dc=Infinity;for(const o of cops)dc=Math.min(dc,Math.hypot(o.x-player.x,o.z-player.z));
  setG(snd.siren,playing&&cops.length?clamp(1-dc/320,.02,1)*.11:0);
}
function hit(v){
  if(!snd)return;const t=AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=snd.buf;f.type='lowpass';f.frequency.value=500+v*1400;g.gain.setValueAtTime(.2+v*.55,t);g.gain.exponentialRampToValueAtTime(.001,t+.32);
  s.connect(f);f.connect(g);g.connect(snd.master);s.start(t,Math.random());s.stop(t+.35);
}
function notes(list,type,vol){
  if(!snd)return;let t=AC.currentTime;
  for(const [hz,d] of list){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=hz;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(snd.master);o.start(t);o.stop(t+d);t+=d*.7;}
}

// ---------- skid marks and tyre smoke ----------
const SKIDS=1200,skidPos=new Float32Array(SKIDS*18),skidGeo=new THREE.BufferGeometry();
skidGeo.setAttribute('position',new THREE.BufferAttribute(skidPos,3));skidGeo.setDrawRange(0,0);
const skidMesh=new THREE.Mesh(skidGeo,new THREE.MeshBasicMaterial({color:0x15120f,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}));
skidMesh.frustumCulled=false;scene.add(skidMesh);
let skidI=0,skidCount=0,skidLast=[null,null];
const smokeTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,'rgba(235,235,232,.85)');r.addColorStop(1,'rgba(235,235,232,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const smoke=Array.from({length:26},()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,transparent:true,opacity:0,depthWrite:false}));s.visible=false;s.userData.life=0;scene.add(s);return s;});
let smokeI=0,smokeT=0;
function skidQuad(a,b,wx,wz){
  const y=q=>GY(q[0],q[1])+.15,w=.11,v=[[a[0]-wx*w,a[1]-wz*w],[a[0]+wx*w,a[1]+wz*w],[b[0]+wx*w,b[1]+wz*w],[b[0]-wx*w,b[1]-wz*w]],o=skidI*18;
  [0,1,2,0,2,3].forEach((k,i)=>{skidPos[o+i*3]=v[k][0];skidPos[o+i*3+1]=y(v[k]);skidPos[o+i*3+2]=v[k][1];});
  skidI=(skidI+1)%SKIDS;skidCount=Math.min(SKIDS,skidCount+1);
}
function tyreFX(c,dt){
  if(!c.sliding){skidLast=[null,null];return;}
  const fx=Math.sin(c.h),fz=Math.cos(c.h),rx=fz,rz=-fx;
  [-.75,.75].forEach((o,i)=>{const p=[c.x-fx*1.25+rx*o,c.z-fz*1.25+rz*o],l=skidLast[i];
    if(l){const d=Math.hypot(p[0]-l[0],p[1]-l[1]);if(d<.5)return;if(d<5)skidQuad(l,p,rx,rz);}
    skidLast[i]=p;});
  skidGeo.attributes.position.needsUpdate=true;skidGeo.setDrawRange(0,skidCount*6);
  if((smokeT-=dt)<=0&&!REDUCED){smokeT=.05;const s=smoke[smokeI=(smokeI+1)%smoke.length],o=Math.random()<.5?-.75:.75;
    s.position.set(c.x-fx*1.3+rx*o,GY(c.x,c.z)+.4,c.z-fz*1.3+rz*o);s.scale.setScalar(.9);s.material.opacity=.5;s.userData.life=.9;s.visible=true;}
}
function updateSmoke(dt){for(const s of smoke){if(s.userData.life<=0)continue;s.userData.life-=dt;s.position.y+=dt*.7;s.scale.setScalar(s.scale.x+dt*3.2);s.material.opacity=Math.max(0,s.userData.life*.55);if(s.userData.life<=0)s.visible=false;}}

// ---------- wanted level and police ----------
let heat=0,lostT=0,bustT=0,copSpawnT=0,fieldT=0,streak=0,cargo=1,shownStars=-1;
let cops=[],roadAdj=null,field=null;
const wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));
const stars=()=>Math.floor(heat);
function showWanted(){
  const n=stars();
  if(n!==shownStars){if(n>shownStars&&shownStars>=0)notes([[660,.09],[880,.14]],'triangle',.12);shownStars=n;
    $('#stars').querySelectorAll('i').forEach((e,i)=>e.classList.toggle('on',i<n));$('#stars').classList.toggle('live',n>0);}
}
function addHeat(v){heat=Math.min(5.99,heat+v);lostT=0;showWanted();}
function showBonus(){$('#mBonus').textContent=`Streak ×${streak} · Cargo ${Math.round(cargo*100)}%`;$('#mBonus').classList.toggle('hurt',cargo<.6);}
function hurtCargo(v){cargo=Math.max(0,cargo-v);showBonus();}
function buildRoads(){
  const G=world.graph;roadAdj=new Map();
  const link=(a,b)=>{let l=roadAdj.get(a);if(!l)roadAdj.set(a,l=[]);if(!l.includes(b))l.push(b);};
  for(const [k,n] of G){if(n.cls>3)continue;for(const o of n.out){const m=G.get(o);if(m&&m.cls<=3){link(k,o);link(o,k);}}}
}
function nearestKey(x,z){let best=null,bd=Infinity;const G=world.graph;for(const k of roadAdj.keys()){const n=G.get(k),d=(n.x-x)**2+(n.z-z)**2;if(d<bd){bd=d;best=k;}}return best;}
// shortest road distance to the player from every node within reach; cops read their next turn from it
function buildField(){
  const G=world.graph,src=nearestKey(player.x,player.z);if(src==null){field=null;return;}
  const dist=new Map([[src,0]]),next=new Map(),heap=[[0,src]];
  const push=e=>{heap.push(e);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const t=heap[0],l=heap.pop();if(heap.length){heap[0]=l;let i=0;for(;;){let m=i;const a=2*i+1,b=a+1;if(a<heap.length&&heap[a][0]<heap[m][0])m=a;if(b<heap.length&&heap[b][0]<heap[m][0])m=b;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return t;};
  while(heap.length){const [d,k]=pop();if(d>dist.get(k)||d>1500)continue;const n=G.get(k);for(const o of roadAdj.get(k)||[]){const m=G.get(o),nd=d+Math.hypot(m.x-n.x,m.z-n.z);if(nd<(dist.has(o)?dist.get(o):Infinity)){dist.set(o,nd);next.set(o,k);push([nd,o]);}}}
  field={dist,next};
}
const copBarGeo=new THREE.BoxGeometry(.5,.13,.28);copBarGeo.userData.keep=true;
const copRed=new THREE.MeshBasicMaterial({color:0xff2a22});copRed.userData.keep=true;
const copBlue=new THREE.MeshBasicMaterial({color:0x2f6bff});copBlue.userData.keep=true;
const copOff=new THREE.MeshBasicMaterial({color:0x30343a});copOff.userData.keep=true;
function spawnCop(){
  if(!field)return;const G=world.graph,cand=[];
  for(const [k,d] of field.dist)if(d>170&&d<340)cand.push(k);
  if(!cand.length)return;
  const k=cand[Math.floor(Math.random()*cand.length)],n=G.get(k),to=G.get(field.next.get(k));
  const c=newCar(n.x,n.z,to?Math.atan2(to.x-n.x,to.z-n.z):0,0x96999d);
  c.cop=true;c.nk=k;c.chk=0;c.px=c.x;c.pz=c.z;c.rev=0;c.stuck=0;c.nkT=0;
  const l=new THREE.Mesh(copBarGeo,copRed),r=new THREE.Mesh(copBarGeo,copBlue);l.position.set(-.27,1.47,-.2);r.position.set(.27,1.47,-.2);c.g.add(l,r);c.bar=[l,r];
  cops.push(c);
}
function removeCop(c){worldGroup.remove(c.g);const i=world.cars.indexOf(c);if(i>=0)world.cars.splice(i,1);cops.splice(cops.indexOf(c),1);}
function clearLine(x0,z0,x1,z1){for(let i=1;i<=5;i++){const t=i/6;if(world.inBuilding(x0+(x1-x0)*t,z0+(z1-z0)*t))return false;}return true;}
function driveCop(c,dt){
  const G=world.graph,dp=Math.hypot(player.x-c.x,player.z-c.z),ps=player.mode==='car'?player.car.speed:0;
  let tx=player.x,tz=player.z;
  if(!(dp<55&&clearLine(c.x,c.z,player.x,player.z))&&field){
    if((c.nkT-=dt)<=0){c.nkT=.4;c.nk=nearestKey(c.x,c.z);}
    let k=c.nk,run=0,a=G.get(k);
    for(let i=0;i<8&&run<16&&field.next.has(k);i++){const nk=field.next.get(k),b=G.get(nk);run+=Math.hypot(b.x-a.x,b.z-a.z);k=nk;a=b;}
    if(a){tx=a.x;tz=a.z;}
  }else if(player.mode==='car'&&dp>10){const lead=Math.min(1.1,dp/40);tx+=Math.sin(player.h)*ps*lead;tz+=Math.cos(player.h)*ps*lead;}
  const ang=wrapA(Math.atan2(tx-c.x,tz-c.z)-c.h);
  let target=0;
  if(c.rev>0){c.rev-=dt;c.speed+=clamp(-7-c.speed,-16*dt,16*dt);c.steer+=(clamp(-ang*1.6,-1,1)-c.steer)*Math.min(1,dt*6);}
  else{
    target=player.mode==='foot'&&dp<9?0:dp<9?Math.max(0,Math.abs(ps)+(dp-5)*1.5):(24+stars()*2.5+(dp>240?6:0))*Math.max(.28,1-Math.abs(ang)*.75);
    c.speed+=clamp(target-c.speed,-20*dt,10*dt);c.steer+=(clamp(ang*1.7,-1,1)-c.steer)*Math.min(1,dt*7);
  }
  c.h+=c.steer*2.15*clamp(c.speed/6,-1,1)/(1+Math.abs(c.speed)/30)*dt;
  const total=c.speed*dt,steps=Math.max(1,Math.ceil(Math.abs(total)/.8));
  for(let i=0;i<steps;i++){
    c.x+=Math.sin(c.h)*total/steps;c.z+=Math.cos(c.h)*total/steps;
    const fx=Math.sin(c.h),fz=Math.cos(c.h);
    for(const o of[1.25,-1.25]){const px=c.x+fx*o,pz=c.z+fz*o,r=world.collide(px,pz,1.05);if(r.hit){c.x+=r.x-px;c.z+=r.z-pz;c.speed*=.97;}}
  }
  for(const o of world.cars){if(o===c||o===player.car)continue;const dx=c.x-o.x,dz=c.z-o.z,d=Math.hypot(dx,dz);if(d<2.7&&d>.01){c.x+=dx/d*(2.7-d)*.6;c.z+=dz/d*(2.7-d)*.6;if(o.ai)o.stun=1.5;}}
  const B=world.box;c.x=clamp(c.x,B.minX,B.maxX);c.z=clamp(c.z,B.minZ,B.maxZ);
  if((c.chk+=dt)>1.2){
    const moved=Math.hypot(c.x-c.px,c.z-c.pz);
    if(moved<1.6&&target>4&&c.rev<=0){c.stuck++;c.rev=1;
      if(c.stuck>=3&&dp>60&&field){let k=nearestKey(c.x,c.z);for(let i=0;i<5&&field.next.has(k);i++)k=field.next.get(k);const n=G.get(k);c.x=n.x;c.z=n.z;c.speed=0;c.rev=0;c.stuck=0;}}
    else if(moved>=1.6)c.stuck=0;
    c.px=c.x;c.pz=c.z;c.chk=0;
  }
  syncCar(c);
  const on=Math.floor(performance.now()/130)%2;c.bar[0].material=on?copRed:copOff;c.bar[1].material=on?copOff:copBlue;
}
function updatePolice(dt){
  const n=stars();
  if(n>0){
    if((fieldT-=dt)<=0){fieldT=1;buildField();}
    if(cops.length<n&&(copSpawnT-=dt)<=0){copSpawnT=1.5;spawnCop();}
  }
  for(const c of cops.slice())driveCop(c,dt);
  let closest=Infinity;for(const c of cops)closest=Math.min(closest,Math.hypot(c.x-player.x,c.z-player.z));
  if(n>0){
    lostT=closest<140?0:lostT+dt;
    if(lostT>10){lostT=0;heat=n-1;showWanted();if(heat<1){heat=0;while(cops.length)removeCop(cops[0]);toast('Lost the police','They gave up the chase.');showWanted();}}
    while(cops.length>Math.max(1,stars())&&closest>160)removeCop(cops[cops.length-1]);
  }else if(heat>0)heat=Math.max(0,heat-dt*.03);
  const ps=player.mode==='car'?Math.abs(player.car.speed):0;
  bustT=closest<(player.mode==='car'?7:9)&&ps<3?bustT+dt:Math.max(0,bustT-dt*2);
  $('#bust').style.width=(bustT/2.6*100)+'%';$('#bust').parentNode.hidden=bustT<=0;
  if(bustT>=2.6){
    const fine=Math.round(cash*.25);cash-=fine;$('#cash').textContent='€'+cash.toLocaleString('en');
    toast('Busted',fine?`Fined €${fine.toLocaleString('en')}. Streak lost.`:'Streak lost.');notes([[196,.3],[147,.5]],'sawtooth',.14);
    heat=0;bustT=0;streak=0;cargo=1;showBonus();showWanted();while(cops.length)removeCop(cops[0]);
  }
}

// ---------- people ----------
const PED_N=28,pedMats=new THREE.MeshLambertMaterial({color:0xffffff});pedMats.userData.keep=true;
const SHIRTS=[0x8d3b3b,0x3d5f8a,0x4e7a52,0xc9a23d,0x6b4d7c,0xd8d4c8,0x2f3236,0x9b6a3c,0xb0553a,0x5a7f8f],TROUSERS=[0x2c3a55,0x34302b,0x54565a,0x5a4a38,0x1f2328,0x6a6f78],SKINS=[0xe8bfa0,0xe2b493,0xd9a884,0xf0cdb0],HAIRS=[0x3a2c20,0x6b5136,0xb59a6a,0x9c9c98,0x23201c,0xd0cfc9];
const PARTS=[{g:PG.torso,x:0,y:1.16,sw:0,col:'shirt'},{g:PG.head,x:0,y:1.6,sw:0,col:'skin'},{g:PG.hair,x:0,y:1.63,sw:0,col:'hair'},{g:PG.arm,x:-.27,y:1.42,sw:1,col:'shirt'},{g:PG.arm,x:.27,y:1.42,sw:-1,col:'shirt'},{g:PG.leg,x:-.095,y:.86,sw:-1,col:'legs'},{g:PG.leg,x:.095,y:.86,sw:1,col:'legs'}];
const pedMesh=PARTS.map(p=>{const m=new THREE.InstancedMesh(p.g,pedMats,PED_N);m.frustumCulled=false;m.castShadow=true;scene.add(m);return m;});
const ZERO_M=new THREE.Matrix4().makeScale(0,0,0),_pb=new THREE.Matrix4(),_pl=new THREE.Matrix4(),_pr=new THREE.Matrix4(),_pq=new THREE.Quaternion(),_pe=new THREE.Euler(0,0,0,'YXZ'),_pv=new THREE.Vector3(),_ps=new THREE.Vector3(1,1,1),_pc=new THREE.Color();
const pick=a=>a[Math.floor(Math.random()*a.length)];
const peds=Array.from({length:PED_N},(_,i)=>{
  const cols={shirt:pick(SHIRTS),skin:pick(SKINS),hair:pick(HAIRS),legs:pick(TROUSERS)};
  PARTS.forEach((p,k)=>pedMesh[k].setColorAt(i,_pc.setHex(cols[p.col])));
  return{mode:'hide',x:0,z:0,h:0,e:null,dir:1,t:0,side:1,sp:1.2+Math.random()*.6,phase:Math.random()*6,fall:0,hop:0,timer:0,vx:0,vz:0};
});
pedMesh.forEach(m=>{if(m.instanceColor)m.instanceColor.needsUpdate=true;});
let pedGrid=null,pedEdgeAt=null,hornWas=false;
const PCELL=120;
function buildPeople(){
  const G=world.graph;pedGrid=new Map();pedEdgeAt=new Map();
  for(const e of world.edges){if(e.cls>1)continue;const A=G.get(e.a),B=G.get(e.b);if(!A||!B)continue;
    const k=Math.floor((A.x+B.x)/2/PCELL)+':'+Math.floor((A.z+B.z)/2/PCELL);let l=pedGrid.get(k);if(!l)pedGrid.set(k,l=[]);l.push(e);
    for(const n of[e.a,e.b]){let a=pedEdgeAt.get(n);if(!a)pedEdgeAt.set(n,a=[]);a.push(e);}}
}
function edgesNear(x,z){const o=[],cx=Math.floor(x/PCELL),cz=Math.floor(z/PCELL);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const l=pedGrid.get((cx+i)+':'+(cz+j));if(l)o.push(...l);}return o;}
function pedTarget(p){
  const G=world.graph,A=G.get(p.e.a),B=G.get(p.e.b),dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz)||1;
  let off=p.e.w/2+1.5,x=A.x+dx*p.t+(-dz/L)*off*p.side,z=A.z+dz*p.t+(dx/L)*off*p.side;
  if(world.inBuilding(x,z)){off=p.e.w/2+.5;x=A.x+dx*p.t+(-dz/L)*off*p.side;z=A.z+dz*p.t+(dx/L)*off*p.side;}
  return[x,z,L];
}
function pedPlace(p){
  const list=edgesNear(player.x,player.z);if(!list.length)return false;
  const fx=Math.sin(player.h),fz=Math.cos(player.h),G=world.graph;
  for(let i=0;i<8;i++){
    const e=pick(list),A=G.get(e.a),B=G.get(e.b),t=Math.random(),mx=A.x+(B.x-A.x)*t,mz=A.z+(B.z-A.z)*t,d=Math.hypot(mx-player.x,mz-player.z),ahead=(mx-player.x)*fx+(mz-player.z)*fz;
    if(d>150||d<35||(ahead>0&&d<75))continue;
    p.e=e;p.t=t;p.dir=Math.random()<.5?1:-1;p.side=Math.random()<.5?1:-1;p.mode='walk';p.fall=0;p.hop=0;
    const q=pedTarget(p);p.x=q[0];p.z=q[1];return true;
  }
  return false;
}
function pedRejoin(p){
  let best=null,bd=Infinity,bt=0;const G=world.graph;
  for(const e of edgesNear(p.x,p.z)){const A=G.get(e.a),B=G.get(e.b),dx=B.x-A.x,dz=B.z-A.z,l2=dx*dx+dz*dz||1,t=clamp(((p.x-A.x)*dx+(p.z-A.z)*dz)/l2,0,1),d=Math.hypot(A.x+dx*t-p.x,A.z+dz*t-p.z);if(d<bd){bd=d;best=e;bt=t;}}
  if(!best||bd>45){p.mode='hide';return;}
  p.e=best;p.t=bt;p.mode='walk';p.fall=0;p.hop=0;
}
function pedFlee(p,vx,vz,time,sp){p.mode='flee';p.timer=time;const l=Math.hypot(vx,vz)||1;p.vx=vx/l*sp;p.vz=vz/l*sp;}
function driverRunsOff(c){
  let p=peds.find(q=>q.mode==='hide');if(!p){p=peds[0];let far=-1;for(const q of peds){const d=Math.hypot(q.x-player.x,q.z-player.z);if(d>far){far=d;p=q;}}}
  const rx=Math.cos(c.h),rz=-Math.sin(c.h),side=world.inBuilding(c.x+rx*2,c.z+rz*2)?-1:1;
  p.x=c.x+rx*1.7*side;p.z=c.z+rz*1.7*side;p.fall=0;p.hop=0;pedFlee(p,rx*side+Math.sin(c.h)*.4,rz*side+Math.cos(c.h)*.4,3.5,6);
}
function updatePeople(dt){
  if(!pedGrid)return;
  const G=world.graph,c=player.mode==='car'?player.car:null,cs=c?Math.abs(c.speed):0,horn=down('KeyQ'),hornNow=horn&&!hornWas;hornWas=horn;
  let placed=0;
  peds.forEach((p,i)=>{
    if(p.mode==='hide'){if(placed<3){placed++;pedPlace(p);}}
    else if(Math.hypot(p.x-player.x,p.z-player.z)>190)p.mode='hide';
    if(p.mode==='hide'){for(const m of pedMesh)m.setMatrixAt(i,ZERO_M);return;}
    let moving=true,rate=9;
    if(p.mode==='walk'){
      const prev=[p.x,p.z],q0=pedTarget(p);p.t+=p.dir*p.sp*dt/q0[2];
      if(p.t>1||p.t<0){
        const at=p.t>1?p.e.b:p.e.a,opts=(pedEdgeAt.get(at)||[]).filter(e=>e!==p.e),e=opts.length?pick(opts):p.e;
        if(e===p.e){p.dir=-p.dir;p.t=clamp(p.t,0,1);}else{p.e=e;p.dir=e.a===at?1:-1;p.t=p.dir>0?0:1;}
      }
      const q=pedTarget(p),k=Math.min(1,dt*3);p.x+=(q[0]-p.x)*k;p.z+=(q[1]-p.z)*k;
      const mx=p.x-prev[0],mz=p.z-prev[1];if(mx*mx+mz*mz>1e-5)p.h=lerpAngle(p.h,Math.atan2(mx,mz),Math.min(1,dt*6));
      rate=5.4*p.sp;
    }else if(p.mode==='flee'){
      p.timer-=dt;const nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;if(!world.inBuilding(nx,nz)){p.x=nx;p.z=nz;}
      p.h=lerpAngle(p.h,Math.atan2(p.vx,p.vz),Math.min(1,dt*10));p.hop=Math.abs(Math.sin(p.phase*.5))*.14;rate=13;
      if(p.timer<=0){p.hop=0;pedRejoin(p);}
    }else{
      p.timer-=dt;moving=false;p.x+=p.vx*dt;p.z+=p.vz*dt;const dr=Math.exp(-dt*3.2);p.vx*=dr;p.vz*=dr;
      p.fall=lerpAngle(p.fall,p.timer>.7?-1.5:0,Math.min(1,dt*7));p.hop=p.timer>.7?.15:0;
      if(p.timer<=0){p.fall=0;p.hop=0;pedRejoin(p);}
    }
    if(p.mode==='hide'){for(const m of pedMesh)m.setMatrixAt(i,ZERO_M);return;}
    p.phase+=rate*dt;
    if(c&&cs>4&&p.mode!=='down'){
      const dx=p.x-c.x,dz=p.z-c.z,fx=Math.sin(c.h)*Math.sign(c.speed||1),fz=Math.cos(c.h)*Math.sign(c.speed||1),al=dx*fx+dz*fz,lt=dx*fz-dz*fx;
      if(Math.hypot(dx,dz)<2&&cs>5){
        p.mode='down';p.timer=3.2;p.vx=Math.sin(c.h)*c.speed*.55;p.vz=Math.cos(c.h)*c.speed*.55;c.speed*=.82;
        shake=Math.max(shake,.35);hit(.3);addHeat(1);hurtCargo(.15);
      }else if(p.mode==='walk'&&al>-1&&al<7+cs*.45&&Math.abs(lt)<2.9){
        const s=Math.abs(lt)<.3?(Math.random()<.5?1:-1):Math.sign(lt);pedFlee(p,fz*s,-fx*s,.95,6.5);
      }
    }
    if(hornNow&&p.mode==='walk'){const dx=p.x-player.x,dz=p.z-player.z,d=Math.hypot(dx,dz);if(d<24&&d>.1)pedFlee(p,dx,dz,1.2,5.5);}
    const sw=moving?Math.sin(p.phase)*(p.mode==='flee'?.95:.5):0;
    _pe.set(p.fall,p.h,0);_pq.setFromEuler(_pe);_pv.set(p.x,GY(p.x,p.z)+p.hop,p.z);_pb.compose(_pv,_pq,_ps);
    PARTS.forEach((pt,k)=>{_pl.makeTranslation(pt.x,pt.y,0);_pl.premultiply(_pb);_pr.makeRotationX(pt.sw*sw);_pl.multiply(_pr);pedMesh[k].setMatrixAt(i,_pl);});
  });
  for(const m of pedMesh)m.instanceMatrix.needsUpdate=true;
}
function resetPlay(){
  cops=[];field=null;heat=0;lostT=0;bustT=0;streak=0;cargo=1;shownStars=-1;skidCount=0;skidI=0;skidLast=[null,null];skidGeo.setDrawRange(0,0);
  for(const p of peds)p.mode='hide';
  buildRoads();buildPeople();showBonus();showWanted();
}
