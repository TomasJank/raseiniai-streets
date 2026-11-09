// ---------- animals: pooled instanced rigs (quadrupeds, birds, bats); species in pipeline/animals/*.js fill SPECIES ----------
const ANIMAL_N=24,BIRD_N=16,BAT_N=32,SPECIES={};
const animMat=new THREE.MeshLambertMaterial({color:0xffffff});animMat.userData.keep=true;
const animEll=(x,y,z,w=8,h=6)=>new THREE.SphereGeometry(1,w,h).scale(x,y,z);
const animEars=(()=>{const c=new THREE.ConeGeometry(.045,.12,4).toNonIndexed(),p=c.attributes.position.array,o=new Float32Array(p.length*2);
  for(let i=0;i<p.length;i+=3)for(const [k,s] of[[0,-1],[p.length,1]]){o[k+i]=p[i]+s*.065;o[k+i+1]=p[i+1];o[k+i+2]=p[i+2];}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(o,3));g.computeVertexNormals();return g;})();
const animLeg=new THREE.CylinderGeometry(.05,.035,1,6).translate(0,-.5,0);
// body length 1 at scale 1, +z forward; legs pivot at the hip, the tail at its base, the head at the neck
const QUAD_G=[animEll(.17,.16,.5,10,7),animEll(.12,.11,.15).translate(0,.02,.1),animLeg,animLeg,animLeg,animLeg,new THREE.CylinderGeometry(.045,.02,1,5).translate(0,.5,0),animEars];
const QUAD_COL=[0,0,1,1,1,1,0,0];
const BIRD_G=[animEll(.13,.12,.5).translate(0,.13,0),new THREE.BoxGeometry(.6,.02,.32).translate(.3,0,0),new THREE.BoxGeometry(.6,.02,.32).translate(-.3,0,0)];
const animInst=(g,n)=>{const m=new THREE.InstancedMesh(g,animMat,n);m.frustumCulled=false;for(let i=0;i<n;i++){m.setMatrixAt(i,ZERO_M);m.setColorAt(i,_pc.setHex(0xffffff));}scene.add(m);return m;};
const quadMesh=QUAD_G.map(g=>animInst(g,ANIMAL_N)),birdMesh=BIRD_G.map(g=>animInst(g,BIRD_N));
const batPos=new Float32Array(BAT_N*3).fill(-1e4),batPts=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(batPos,3)),new THREE.PointsMaterial({color:0x17130f,size:.32}));
batPts.frustumCulled=false;scene.add(batPts);
const ANIMALS={quad:Array.from({length:ANIMAL_N},(_,i)=>({rig:'quad',i,mode:'hide'})),bird:Array.from({length:BIRD_N},(_,i)=>({rig:'bird',i,mode:'hide'})),bat:Array.from({length:BAT_N},(_,i)=>({rig:'bat',i,mode:'hide'}))};
const _ab=new THREE.Matrix4(),_at=new THREE.Matrix4(),_ar=new THREE.Matrix4(),_aq=new THREE.Quaternion(),_ae=new THREE.Euler(0,0,0,'YXZ'),_aj=new THREE.Euler(),_av=new THREE.Vector3(),_as=new THREE.Vector3(),_acd=new THREE.Vector3(),
  AM=QUAD_G.map(()=>new THREE.Matrix4()),_ash={x:0,z:0,mode:'walk'},animGrids=new WeakMap();
let animTurn=0;

// sfxAnimal comes from add_voice.py (runs last); without it animals are silent
function animSound(a){const q=a.S.sound;if(q&&a.d<60&&typeof sfxAnimal==='function')sfxAnimal(q.kind,a.x,a.z);}
const animEvery=S=>{const e=S.sound&&S.sound.every;return e?e[0]+Math.random()*(e[1]-e[0]):Infinity;};
const todIn=(w,t)=>w[0]<=w[1]?t>=w[0]&&t<w[1]:t>=w[0]||t<w[1];
function animFar(x,z){const d=Math.hypot(x-player.x,z-player.z),ahead=(x-player.x)*Math.sin(player.h)+(z-player.z)*Math.cos(player.h);return d<150&&d>35&&!(ahead>0&&d<75);}
// items of a static list within roughly 120-180 m of x,z, through a lazily built 120 m grid keyed by the list itself
function nearOf(list,at,x,z){
  let G=animGrids.get(list);
  if(!G||G.n!==list.length){G=new Map();G.n=list.length;animGrids.set(list,G);for(const q of list){const [qx,qz]=at(q),k=Math.floor(qx/120)+':'+Math.floor(qz/120);let l=G.get(k);if(!l)G.set(k,l=[]);l.push(q);}}
  const o=[],cx=Math.floor(x/120),cz=Math.floor(z/120);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const l=G.get((cx+i)+':'+(cz+j));if(l)o.push(...l);}return o;
}
const segAt=s=>[(s[0]+s[2])/2,(s[1]+s[3])/2],poleAt=q=>[q.x,q.z],lampAt=q=>[q[0],q[2]];
function animPlace(a,where){
  const px=player.x,pz=player.z,G=world.graph;let polys=null;
  if(where==='field'||where==='forest'){const f=where==='forest';polys=(world.green||[]).filter(([p,isF])=>{if(isF!==f)return false;
      if(!p.bb){p.bb=[Infinity,Infinity,-Infinity,-Infinity];for(const q of p){p.bb[0]=Math.min(p.bb[0],q[0]);p.bb[1]=Math.min(p.bb[1],q[1]);p.bb[2]=Math.max(p.bb[2],q[0]);p.bb[3]=Math.max(p.bb[3],q[1]);}}
      return p.bb[2]>px-150&&p.bb[0]<px+150&&p.bb[3]>pz-150&&p.bb[1]<pz+150;});if(!polys.length)return false;}
  for(let k=0;k<8;k++){
    let x,z,y=0,h=Math.random()*TAU,mode='walk';
    if(where==='fence'){const l=nearOf(world.hedgeSegs||[],segAt,px,pz);if(!l.length)return false;const s=pick(l),t=.15+Math.random()*.7;
      x=s[0]+(s[2]-s[0])*t;z=s[1]+(s[3]-s[1])*t;y=s[4]??1.3;h=Math.atan2(s[2]-s[0],s[3]-s[1])+(Math.random()<.5?0:Math.PI);mode='sit';a.seg=s;}
    else if(where==='pole'){const l=nearOf(world.poles||[],poleAt,px,pz);if(!l.length)return false;const q=pick(l);if(q.down)continue;x=q.x;z=q.z;y=8.75;mode='perch';a.pole=q;}
    else if(where==='lamp'){const l=nearOf(world.lamps||[],lampAt,px,pz);if(!l.length)return false;const q=pick(l),li=world.lamps.indexOf(q);a.pole=(world.poles||[]).find(o=>o.li===li)||null;if(a.pole&&a.pole.down)continue;x=q[0]+1;z=q[2];y=q[1]-GY(x,z);mode='fly';a.lamp=q;}
    else if(polys){const [p]=pick(polys),b=p.bb;x=clamp(b[0]+Math.random()*(b[2]-b[0]),px-150,px+150);z=clamp(b[1]+Math.random()*(b[3]-b[1]),pz-150,pz+150);if(!pip(x,z,p))continue;a.green=p;}
    else{const l=edgesNear(px,pz);if(!l.length)return false;const e=pick(l),A=G.get(e.a),B=G.get(e.b),t=Math.random(),dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz)||1,off=(e.w/2+.9)*(Math.random()<.5?1:-1);
      x=A.x+dx*t-dz/L*off;z=A.z+dz*t+dx/L*off;h=Math.atan2(dx,dz);a.e=e;}
    if(!animFar(x,z)||world.inBuilding(x,z))continue;
    Object.assign(a,{x,z,y,h,mode});return true;
  }
  return false;
}
function animSpawn(pool,name,S){
  const free=pool.find(q=>q.mode==='hide');if(!free)return;
  const a={S,name,rig:S.rig,i:free.i,mode:'walk',x:0,z:0,y:0,h:0,sp:0,vx:0,vz:0,timer:0,phase:Math.random()*TAU,d:0,leave:false,lt:0,seg:null,pole:null,lamp:null,green:null,e:null,st:animEvery(S)};
  if(!(S.place?S.place(a):animPlace(a,S.where)))return;
  pool[a.i]=a;const c=pick(S.colours||[[0x8a7f72,0x5a5148]]),M=a.rig==='quad'?quadMesh:a.rig==='bird'?birdMesh:null;
  if(M){M.forEach((m,k)=>m.setColorAt(a.i,_pc.setHex(c[a.rig==='quad'?QUAD_COL[k]:k?1:0]??c[0])));for(const m of M)m.instanceColor.needsUpdate=true;}
}
function animHide(a){a.mode='hide';if(a.rig==='quad')for(const m of quadMesh)m.setMatrixAt(a.i,ZERO_M);else if(a.rig==='bird')for(const m of birdMesh)m.setMatrixAt(a.i,ZERO_M);else batPos[a.i*3+1]=-1e4;}

// helpers for species behave(): run from x,z for t seconds, move with walls/props/buildings (turning away from the player at a wall), wander, caught in the player's headlights
function fleeFrom(a,x,z,sp=a.S.speed,t=3){const dx=a.x-x,dz=a.z-z,l=Math.hypot(dx,dz)||1;a.vx=dx/l*sp;a.vz=dz/l*sp;a.mode='run';a.timer=t;animSound(a);}
function animGo(a,dt){
  const nx=a.x+a.vx*dt,nz=a.z+a.vz*dt;
  if(world.inBuilding(nx,nz)){const s=(a.z-player.z)*a.vx-(a.x-player.x)*a.vz>=0?1:-1,vx=a.vx;a.vx=-a.vz*s;a.vz=vx*s;a.sp=0;return false;}
  _ash.x=nx;_ash.z=nz;pedPush(_ash);const mx=_ash.x-a.x,mz=_ash.z-a.z;a.x=_ash.x;a.z=_ash.z;a.sp=Math.hypot(mx,mz)/Math.max(dt,1e-4);
  if(a.sp>.05)a.h=lerpAngle(a.h,Math.atan2(mx,mz),Math.min(1,dt*8));return true;
}
function animWander(a,dt,sp){
  if((a.timer-=dt)<=0){a.timer=2+Math.random()*4;const h=a.h+(Math.random()-.5)*2,go=Math.random()<.7?sp:0;a.vx=Math.sin(h)*go;a.vz=Math.cos(h)*go;}
  if(a.vx||a.vz)animGo(a,dt);else a.sp=0;
}
function inLights(a){if(player.mode!=='car'||ENV.night.value<.5||a.d>35)return false;const c=player.car,fx=Math.sin(c.h),fz=Math.cos(c.h),dx=a.x-c.x,dz=a.z-c.z,al=dx*fx+dz*fz;return al>0&&Math.abs(dx*fz-dz*fx)<al*.35+1.5;}

// the player's car hits whatever is inside its outline on the ground, once: fine, heat, a dent for big ones
function animRunOver(a){
  if(player.mode!=='car'||a.y>.6)return;const c=player.car;if(!c||Math.abs(c.speed)<2.5)return;
  const fx=Math.sin(c.h),fz=Math.cos(c.h),dx=a.x-c.x,dz=a.z-c.z,r=a.S.scale*.3;if(Math.abs(dx*fx+dz*fz)>2.45+r||Math.abs(dx*fz-dz*fx)>1.2+r)return;
  const H=a.S.hit||{};a.mode='down';a.timer=10;a.vx=a.vz=a.sp=0;a.y=0;
  toast(a.S.msg||'Partrenkei gyvūną',H.cash?'−€'+H.cash:undefined);
  if(H.cash){cash=Math.max(0,cash-H.cash);money();}
  if(H.heat)addHeat(H.heat);
  if(H.dent){dent(c,dx,dz,Math.min(.12,H.dent*.6));hurtCar(c,H.dent);c.speed*=.6;}else c.speed*=.95;
  hit(Math.min(1,.15+(H.dent||0)*3));shake=Math.max(shake,H.dent?.6:.15);pedEvent(a.x,a.z,20,6);animSound(a);
}

function animPart(M,k,i,par,ox,oy,oz,rx,ry,rz,sx=1,sy=1,sz=1){
  AM[k].copy(par).multiply(_at.makeTranslation(ox,oy,oz)).multiply(_ar.makeRotationFromEuler(_aj.set(rx,ry,rz))).scale(_as.set(sx,sy,sz));M[k].setMatrixAt(i,AM[k]);return AM[k];
}
function animBase(a,lift){const s=a.S.scale;_ae.set(0,a.h,a.mode==='down'?Math.PI/2:0);_aq.setFromEuler(_ae);_av.set(a.x,GY(a.x,a.z)+world.surf(a.x,a.z)+a.y+lift,a.z);_as.setScalar(s);return _ab.compose(_av,_aq,_as);}
function poseQuad(a){
  const S=a.S,i=a.i,M=quadMesh,sit=a.mode==='sit',down=a.mode==='down',L=sit?.06:S.legs??.5,amp=sit||down?0:Math.min(.7,a.sp/(S.scale*3)),sw=Math.sin(a.phase)*amp,bob=amp*.05*Math.abs(Math.cos(a.phase));
  const B=animBase(a,down?.17*S.scale:0),e=S.ears??1,tl=(S.tail??1)*.5;
  animPart(M,0,i,B,0,L+.1+bob,0,0,0,0);
  animPart(M,7,i,animPart(M,1,i,B,0,L+.2+bob,.45,sit?-.15:.1,0,0),0,.1,.07,0,0,0,e,e,e);
  animPart(M,2,i,B,-.1,L+.08,.33,sw,0,0,1,L+.02,1);animPart(M,3,i,B,.1,L+.08,.33,-sw,0,0,1,L+.02,1);
  animPart(M,4,i,B,-.1,L+.08,-.33,-sw,0,0,1,L+.02,1);animPart(M,5,i,B,.1,L+.08,-.33,sw,0,0,1,L+.02,1);
  animPart(M,6,i,B,0,L+.14,-.47,sit?-.3:down?-1.57:-1+Math.sin(a.phase*.5)*.25,0,sit?2.6:0,1,tl,1);
}
function poseBird(a){
  const i=a.i,M=birdMesh,B=animBase(a,0),fly=a.mode==='fly',f=Math.sin(a.phase)*.9;
  animPart(M,0,i,B,0,0,0,0,0,0);
  if(fly){animPart(M,1,i,B,.08,.14,0,0,0,f);animPart(M,2,i,B,-.08,.14,0,0,0,-f);}
  else{animPart(M,1,i,B,.08,.15,0,0,1.4,0,.55,1,1);animPart(M,2,i,B,-.08,.15,0,0,-1.4,0,.55,1,1);}
}

function updateAnimals(dt){
  const names=Object.keys(SPECIES);
  if(names.length){animTurn=(animTurn+1)%names.length;const name=names[animTurn],S=SPECIES[name],pool=ANIMALS[S.rig];
    if(pool&&todIn(S.tod||[0,24],tod)&&pool.filter(q=>q.S===S&&q.mode!=='hide'&&!q.leave).length<(S.n??2))animSpawn(pool,name,S);}
  camera.getWorldDirection(_acd);
  for(const rig in ANIMALS)for(const a of ANIMALS[rig]){
    if(a.mode==='hide')continue;
    a.d=Math.hypot(a.x-player.x,a.z-player.z);
    if(a.d>190){animHide(a);continue;}
    if(!a.leave&&(!todIn(a.S.tod||[0,24],tod)||a.pole&&a.pole.down))a.leave=true;
    if(a.leave&&((a.lt+=dt)>20||a.d>70||(a.x-camera.position.x)*_acd.x+(a.z-camera.position.z)*_acd.z<0)){animHide(a);continue;}
    if(a.mode==='down'){if((a.timer-=dt)<=0){animHide(a);continue;}}
    else{if((a.st-=dt)<=0){a.st=animEvery(a.S);animSound(a);}a.S.behave(a,dt);if(a.mode==='hide'){animHide(a);continue;}if(rig!=='bat')animRunOver(a);}
    if(rig==='quad'){a.phase+=dt*a.sp/(a.S.scale*(a.S.legs??.5))*1.8;poseQuad(a);}
    else if(rig==='bird'){a.phase+=a.mode==='fly'?dt*(a.S.flap||14):0;poseBird(a);}
    else{batPos[a.i*3]=a.x;batPos[a.i*3+1]=GY(a.x,a.z)+a.y;batPos[a.i*3+2]=a.z;}
  }
  for(const m of quadMesh)m.instanceMatrix.needsUpdate=true;for(const m of birdMesh)m.instanceMatrix.needsUpdate=true;batPts.geometry.attributes.position.needsUpdate=true;
}
