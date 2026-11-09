// ---------- animals2: skinned GLB animals over the instanced quad rig; the rig stays for far animals and for species without a model ----------
const CREDITS_ANIMALS='';  // Quaternius Asset License v1.0: no credit required
const AG={
  // species -> model, bbox height in metres (head included), yaw offset of the model's forward axis
  MAP:{dog_lead:{m:'shiba',h:.6},dog_lead_small:{m:'shiba',h:.4},dog_lead_big:{m:'husky',h:.8},dog_yard:{m:'husky',h:.7},
    fox:{m:'fox',h:.5},deer:{m:'deer',h:1},cat:{m:'cat',h:.3}},
  NEAR:60,FAR:68,src:{},free:{},rigs:[],dt:0,started:false,
  CLIP:{idle:'idle',walk:'walk',run:'run',eat:'eat',bark:'bark',death:'death'}
};
const AG_MAT=new THREE.MeshLambertMaterial({vertexColors:true});
const AG_BOX=new THREE.Box3(),AG_V=new THREE.Vector3();
// the GLBs are embedded deflated (add_animals2.py): inflate into the plain-base64 block ASSETS.load reads
async function agUnpack(n){
  if(ASSETS.has('animal_'+n))return;
  const e=document.getElementById('agz_'+n),s=atob(e.textContent.trim()),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);
  const u=new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  let t='';for(let i=0;i<u.length;i+=8192)t+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
  const d=document.createElement('script');d.type='application/octet-stream';d.id='asset_animal_'+n;d.textContent=btoa(t);document.body.appendChild(d);
}
function agStart(){
  AG.started=true;
  for(const n of new Set(Object.values(AG.MAP).map(q=>q.m)))
    agUnpack(n).then(()=>ASSETS.load('animal_'+n)).then(g=>{
      g.scene.updateMatrixWorld(true);AG_BOX.setFromObject(g.scene,true);
      AG.src[n]={g,h:AG_BOX.max.y-AG_BOX.min.y,y0:AG_BOX.min.y,clips:Object.fromEntries(g.animations.map(c=>[c.name,c]))};AG.free[n]=[];
    }).catch(e=>console.error('animals2',n,e));
}
function agMake(n){
  const s=AG.src[n],obj=ASSETS.clone(s.g.scene),holder=new THREE.Group(),r={n,holder,obj,mx:new THREE.AnimationMixer(obj),act:{},w:{},bark:0,cur:'idle',fresh:true};
  obj.traverse(o=>{if(o.isMesh){o.material=AG_MAT;o.frustumCulled=false;o.castShadow=false;}});
  holder.add(obj);holder.visible=false;scene.add(holder);
  for(const k in s.clips){const a=r.act[k]=r.mx.clipAction(s.clips[k]);a.play();a.setEffectiveWeight(0);r.w[k]=0;
    if(k==='death'||k==='bark'){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}}
  return r;
}
function agAcquire(a){
  const sp=AG.MAP[a.name],s=AG.src[sp.m];let r=AG.free[sp.m].pop();
  if(!r){if(AG.rigs.filter(q=>q.a).length>=ANIMAL_N)return;r=agMake(sp.m);AG.rigs.push(r);}
  const k=sp.h/s.h;r.obj.scale.setScalar(k);r.obj.position.y=-s.y0*k;r.holder.visible=true;r.fresh=true;r.a=a;a.glb=r;r.cur='';
  for(const m of quadMesh)m.setMatrixAt(a.i,ZERO_M);
}
function agRelease(a){const r=a.glb;a.glb=null;if(!r)return;r.a=null;r.holder.visible=false;AG.free[r.n].push(r);}
function agPose(a){
  const r=a.glb,sp=AG.MAP[a.name],k=sp.h,v=a.sp,A=r.act;let want='idle',ts=1;
  r.holder.position.set(a.x,GY(a.x,a.z)+world.surf(a.x,a.z)+a.y,a.z);r.holder.rotation.y=a.h+(sp.yaw||0);
  if(a.mode==='down')want='death';
  else if(r.bark>0&&A.bark)want='bark';
  else if(a.mode==='run'||v>4.5*k){want='run';ts=clamp(v/(9*k),.6,1.7);if(!A.run){want='walk';ts=1.8;}}
  else if(v>.08){want='walk';ts=clamp(v/(2*k),.35,1.8);}
  else if(A.eat&&a.mode==='walk')want='eat';
  if(r.cur!==want){if(want==='death'||want==='bark')A[want].reset().play();r.cur=want;}
  if(A[want])A[want].timeScale=ts;
  const step=r.fresh?1:Math.min(1,AG.dt*12);r.fresh=false;
  for(const c in A){const t=c===want?1:0;r.w[c]+=clamp(t-r.w[c],-step,step);A[c].setEffectiveWeight(r.w[c]);}
}
// animals.js entry points, wrapped
function poseQuad(a){
  const sp=AG.MAP[a.name];
  if(sp&&AG.src[sp.m]&&a.d<(a.glb?AG.FAR:AG.NEAR)){if(!a.glb)agAcquire(a);if(a.glb){agPose(a);return;}}
  if(a.glb)agRelease(a);
  poseQuad_0(a);
}
function animHide(a){if(a.glb)agRelease(a);animHide_0(a);}
function animSound(a){
  animSound_0(a);const r=a.glb;
  if(r&&r.act.bark&&a.S.sound&&a.S.sound.kind==='bark'&&a.mode!=='down'&&a.sp<AG.MAP[a.name].h*2){r.bark=Math.min(1.1,r.act.bark.getClip().duration);r.act.bark.reset().play();r.cur='bark';}
}
function updateAnimals(dt){
  if(!AG.started)agStart();
  AG.dt=dt;updateAnimals_0(dt);
  for(const r of AG.rigs)if(r.a){if(r.bark>0)r.bark-=dt;r.mx.update(dt);}
}
