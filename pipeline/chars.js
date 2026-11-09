// ---------- characters: people near the camera are rigged mannequins (Quaternius Universal Animation Library) ----------
// behaviour is untouched: poseAt still gets called for everyone, and for the nearest people it moves a SkinnedMesh instead of
// the instanced rig. Far people, the taxi fare (it waves, no clip does) and everyone before the assets decode stay instanced.
// Hats, bags, coats, long hair and sticks stay instanced too, carried by the mannequin's bones.
const CHAR={ready:false,near:60,keep:70,max:24,list:[],use:new Uint8Array(PED_ALL),body:{},clips:null,G:[],off:{},phoneOff:null,ms:0,
  // region per vertex from its heaviest bone: skin, shirt, forearm, legs, shin, shoe, hair
  REG:[['Head',0],['neck',0],['hand',0],['index',0],['middle',0],['ring',0],['pinky',0],['thumb',0],['spine',1],['clavicle',1],['upperarm',1],['lowerarm',2],['pelvis',3],['thigh',3],['calf',4],['foot',5],['ball',5]],
  // which bone carries each instanced gear part, keyed by its look option
  SRC:{hat:'Head',cap:'Head',long:'Head',tail:'Head',pack:'spine_03',bag:'spine_03',scarf:'spine_03',coat:'pelvis',skirt:'pelvis',stick:'hand_r'}};
function charCols(i,c){(charCols.a||(charCols.a=[]))[i]=c;}
async function charInit(){
  const [bm,bf,cl,U]=await Promise.all([ASSETS.load('char_body_m'),ASSETS.load('char_body_f'),ASSETS.load('char_clips'),import('three/addons/utils/BufferGeometryUtils.js')]);
  CHAR.clips=Object.fromEntries(cl.animations.map(c=>[c.name,c]));
  for(const [k,g] of [['m',bm],['f',bf]]){
    const sk=[];g.scene.traverse(o=>{if(o.isSkinnedMesh)sk.push(o);});
    const s0=sk[0],bones=s0.skeleton.bones,geo=U.mergeGeometries(sk.map(m=>m.geometry));
    for(const m of sk.slice(1))m.removeFromParent();
    g.scene.updateMatrixWorld(true);const hp=bones.find(b=>b.name==='Head').getWorldPosition(new THREE.Vector3()),v=new THREE.Vector3();
    const si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight,pos=geo.attributes.position,reg=new Float32Array(si.count),top=new Float32Array(si.count);
    let ht=-1e9;
    for(let i=0;i<si.count;i++){let b=0,w=-1;for(let j=0;j<4;j++)if(sw.getComponent(i,j)>w){w=sw.getComponent(i,j);b=si.getComponent(i,j);}
      const n=bones[b].name;reg[i]=(CHAR.REG.find(e=>n.startsWith(e[0]))||[0,3])[1];
      if(n==='Head'){v.fromBufferAttribute(pos,i).applyMatrix4(s0.matrixWorld);top[i]=1;ht=Math.max(ht,v.y);}}
    // hair: the crown and the back of the head
    const H=ht-hp.y;for(let i=0;i<si.count;i++)if(top[i]){v.fromBufferAttribute(pos,i).applyMatrix4(s0.matrixWorld);
      if(v.y>hp.y+.62*H||v.z<hp.z-.1*H&&v.y>hp.y+.3*H)reg[i]=6;}
    geo.setAttribute('region',new THREE.BufferAttribute(reg,1));s0.geometry=geo;s0.castShadow=true;
    // the bind-pose sphere misses a body lying down or mid-punch
    s0.computeBoundingSphere();s0.boundingSphere.radius*=1.8;
    const box=new THREE.Box3().setFromObject(g.scene,true);
    CHAR.body[k]={scene:g.scene,k:1.76/(box.max.y-box.min.y),pelvis:bones.find(b=>b.name==='pelvis').position.clone()};
  }
  // the clips were made on the male mannequin: the female hips sit at her own height
  CHAR.body.f.hip=CHAR.body.f.pelvis.z/CHAR.body.m.pelvis.z;
  // gear offsets: where each part sat on the old rig at rest, relative to the bone that now carries it, measured in the idle pose
  const all={s:1};for(const p of PARTS)if(p.opt)all[p.opt]=true;
  poseAt(FARE_I,all,0,0,0,0,0,0,0,false);const inv=new THREE.Matrix4().copy(_pb).invert();
  CHAR.G=PARTS.map((p,k)=>p.opt&&CHAR.SRC[p.opt]?k:-1).filter(k=>k>=0);
  for(const b of['m','f']){const st=charMake(b),o=st.o;o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.setScalar(CHAR.body[b].k);
    st.act.idle.play().setEffectiveWeight(1);st.act.idle.time=0;st.mx.update(0);o.updateMatrixWorld(true);
    const off=CHAR.off[b]={},ib=new THREE.Matrix4();
    for(const k of[...CHAR.G,8]){const src=k===8?'hand_r':CHAR.SRC[PARTS[k].opt],bone=st.bone[src];
      off[k]=ib.copy(bone.matrixWorld).invert().multiply(new THREE.Matrix4().multiplyMatrices(inv,PM[k]));
      if(src==='hand_r')off[k].setPosition(0,0,0);}
    scene.remove(o);}
  hidePed(FARE_I);CHAR.ready=true;
}
function charMake(b){
  const B=CHAR.body[b],o=ASSETS.clone(B.scene),mesh=o.getObjectByProperty('isSkinnedMesh',true),bone={};
  o.traverse(n=>{if(n.isBone)bone[n.name]=n;});
  const rc=Array.from({length:7},()=>new THREE.Color(0x808080)),mat=new THREE.MeshLambertMaterial();
  mat.onBeforeCompile=s=>{s.uniforms.rc={value:rc};
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float region;uniform vec3 rc[7];varying vec3 vRc;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRc=rc[int(region+.5)];');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vRc;').replace('vec4 diffuseColor = vec4( diffuse, opacity );','vec4 diffuseColor = vec4( diffuse*vRc, opacity );');};
  mat.customProgramCacheKey=()=>'char';mesh.material=mat;
  const mx=new THREE.AnimationMixer(o),act={};for(const n in CHAR.clips)act[n]=mx.clipAction(CHAR.clips[n]);
  scene.add(o);return{b,o,mesh,rc,mx,act,bone,w:{},t:0,one:null,oneT:0,mode:null,swing:null,stag:0,cols:null,clip:'idle',phone:false,look:null};
}
function charHide(i){const st=CHAR.list[i];if(st)st.o.visible=false;CHAR.use[i]=0;}
// called at the top of poseAt: true means the mannequin has this person and the instanced rig stays hidden
function charPose(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act){
  let st=CHAR.list[i];
  if(!CHAR.use[i]){if(st)st.o.visible=false;return false;}
  const b=look.male===false?'f':'m';
  if(!st||st.b!==b){if(st){scene.remove(st.o);st.mx.stopAllAction();}st=CHAR.list[i]=charMake(b);st.cols=null;}
  if(st.cols!==charCols.a[i]){const c=st.cols=charCols.a[i]||{};[c.skin,c.shirt,c.fore??c.shirt,c.legs,c.shin??c.legs,c.shoe,c.hair??c.skin].forEach((v,k)=>st.rc[k].setHex(v??0x808080));}
  const p=i<PED_N?peds[i]:null,o=st.o;
  if(!o.visible){o.visible=true;st.snap=true;}
  // sitting height and lying down come from the clips; only a hop lifts the mannequin
  o.position.set(x,GY(x,z)+world.surf(x,z)+(p&&p.mode!=='sit'?lift:0),z);o.rotation.set(0,h,0);o.scale.setScalar(look.s*CHAR.body[b].k);
  st.look=look;st.gait=gait;st.ph=ph;st.phone=!!(act&&act.phone);
  if(p){st.mode=p.mode;st.talk=p.mode==='talk'&&gait<.1&&p.grp&&p.grp.mem[p.grp.spk]===p&&p.grp.say>0;st.pr=p.pr||0;st.swingAt=p.mode==='fight'?p.swing:null;}
  else{const dn=fight.pDown>0;st.mode=dn?'down':fight.pStag>0?'stagger':pedClock-fight.last<4&&gait<.1?'fight':'walk';st.talk=false;st.pr=1;st.swingAt=fight.anim;}
  for(const m of pedMesh)m.setMatrixAt(i,ZERO_M);
  return true;
}
const _cm=new THREE.Matrix4(),_cv=new THREE.Vector3();
// the nearest people within CHAR.near of the camera (the player always) get a mannequin; then every mannequin animates
function charTick(){
  if(!CHAR.ready){if(!CHAR.busy&&world&&ASSETS.has('char_clips')){CHAR.busy=1;charInit().catch(e=>console.warn('characters stay instanced:',e.message));}return;}
  const t0=performance.now(),dt=pedDt,on=pedMesh[1].visible;
  const cand=[];
  if(on){peds.forEach((p,i)=>{if(p.mode==='hide')return;const d=Math.hypot(p.x-camera.position.x,p.z-camera.position.z);if(d<(CHAR.use[i]?CHAR.keep:CHAR.near))cand.push([d,i]);});
    cand.sort((a,b)=>a[0]-b[0]);cand.length=Math.min(cand.length,CHAR.max-1);}
  const want=new Uint8Array(PED_ALL);for(const c of cand)want[c[1]]=1;
  if(on&&player.mode==='foot'&&personMesh.visible)want[PLAYER_I]=1;
  CHAR.use.set(want);
  CHAR.n=0;
  CHAR.list.forEach((st,i)=>{if(!st||!st.o.visible)return;CHAR.n++;charAnim(st,dt);
    const off=CHAR.off[st.b];
    for(const k of CHAR.G)pedMesh[k].setMatrixAt(i,st.look[PARTS[k].opt]?_cm.multiplyMatrices(st.bone[CHAR.SRC[PARTS[k].opt]].matrixWorld,off[k]):ZERO_M);
    if(i<PED_N)pedPhone.setMatrixAt(i,st.phone?_cm.multiplyMatrices(st.bone.hand_r.matrixWorld,off[8]):ZERO_M);});
  pedPhone.instanceMatrix.needsUpdate=true;
  CHAR.ms=performance.now()-t0;
}
const CHAR_ONE={jab:1,cross:1,hit_chest:1,hit_head:1,knockback:1,getup:1,sit_in:1};
function charAnim(st,dt){
  const C=CHAR.clips,w={},m=st.mode,g=st.gait;
  // one-shots: a new swing, a hit, getting up, sitting down
  if(st.swingAt!=null&&st.swingAt!==st.swing&&st.swing!=null&&pedClock-st.swingAt<.3)charOne(st,(st.n^=1)?'cross':'jab');
  st.swing=st.swingAt;
  if(m!==st.prev){if(m==='stagger')charOne(st,st.look===PLAYER_LOOK?'hit_head':'hit_chest');
    else if(st.prev==='down')charOne(st,'getup');else if(m==='sit')charOne(st,'sit_in');
    if(m==='down')st.t=0;st.prev=m;}
  st.t+=dt;let base,hold=false;
  if(m==='down'){base='death';hold=true;}
  else if(m==='cower')base='crouch';
  else if(m==='sit')base=st.talk?'sit_talk':'sit';
  else if(g<.1&&(m==='fight'))base='guard',hold=true;
  else if(g<.1&&m==='watch')base=st.phone?'phone':'fold';
  else if(g<.1&&m==='talk')base=st.talk?'talk':st.pr<.3?'fold':'idle';
  else if(g<.1&&st.phone)base='phone';
  if(st.one){st.oneT+=dt*(st.one==='getup'?1.4:1);if(st.oneT>=C[st.one].duration-.12||m==='down')st.one=null;}
  if(st.one){w[st.one]=1;st.act[st.one].time=Math.min(st.oneT,C[st.one].duration-1e-3);st.clip=st.one;}
  else if(base){w[base]=1;const d=C[base].duration;st.act[base].time=hold?Math.min(st.t,d-1e-3):st.t%d;st.clip=base;}
  else{// walk and run follow the game's own stride phase, so feet keep the step rhythm they had
    const u=((st.ph/TAU)%1+1)%1,run=smooth(.6,.85,g),idle=1-smooth(.02,.12,g);
    w.idle=idle;w.walk=(1-idle)*(1-run);w.jog=(1-idle)*run;
    st.act.idle.time=st.t%C.idle.duration;st.act.walk.time=u*C.walk.duration;st.act.jog.time=u*C.jog.duration;
    st.clip=idle>.5?'idle':run>.5?'jog':'walk';}
  const k=st.snap?1:Math.min(1,dt*12);st.snap=false;
  for(const n in st.act){const a=st.act[n],cur=a.isRunning()?a.getEffectiveWeight():0,tw=w[n]||0;if(!tw&&cur<.01){if(a.isRunning())a.stop();continue;}
    if(!a.isRunning())a.play();a.setEffectiveWeight(cur+(tw-cur)*k);}
  st.mx.update(0);
  if(st.b==='f')st.bone.pelvis.position.multiplyScalar(CHAR.body.f.hip);
  st.o.updateMatrixWorld(true);
}
function charOne(st,n){st.one=n;st.oneT=0;st.clip=n;}
