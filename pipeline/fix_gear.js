// ---------- fixgear: hats, caps, packs, bags, scarves and sticks fitted to the outfit bodies ----------
// wraps clothes.js (clMake, clOutfit, charInit, charTick). Each piece stays one InstancedMesh, rebuilt at load in its old part frame (so the far rig wears it too),
// and each outfit body gets a part-to-bone offset that maps the old rig's head or torso onto its own, measured from its bind-pose vertices.
// Under a hat or cap the hair is pulled inside the crown in the outfit shader; outfits with a hat or pack of their own drop the instanced one.
const FG={own:{farmer:{hat:1,cap:1},worker:{hat:1,cap:1},trek:{pack:1}},ready:false,K:{},hat:{},tor:{},
  // old rig shells in their part frames: head (hair sphere) and torso (lathe at chest height)
  oldHead:{c:[0,.13,-.008],r:[.11,.131,.121]},oldTor:{hx:.196,hz:.115},
  // brim line in unit-crown space: y = a + b*z (front is +z)
  brim:{hat:[.12,.24],cap:[.2,.14]},P:2.6};
const fgV=new THREE.Vector3();
// every outfit of a body in the idle pose (arms down), each vertex put back relative to the bind pose of spine_03 (of Head for head vertices):
// metres, dominant bone and colour region; out.T holds the triangles
function fgVerts(b){
  const k=CL.body[b].k,out=[],sk=CL.body[b].scene.getObjectByProperty('isSkinnedMesh',true).skeleton;out.T=[];
  CL.body[b].scene.updateMatrixWorld(true);
  const bind=n=>new THREE.Matrix4().makeScale(k,k,k).multiply(sk.getBoneByName(n).matrixWorld);
  for(const o of CL.outfits[b]){
    const st=clMake(b,o),m=st.mesh,g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,uv=g.attributes.uv,B=m.skeleton.bones,n0=out.length;
    st.o.scale.setScalar(k);st.act.idle.play().setEffectiveWeight(1);st.act.idle.time=0;st.mx.update(0);st.o.updateMatrixWorld(true);
    const back={Head:bind('Head').multiply(st.bone.Head.matrixWorld.clone().invert()),spine_03:bind('spine_03').multiply(st.bone.spine_03.matrixWorld.clone().invert())};
    if(g.index)for(const i of g.index.array)out.T.push(n0+i);else for(let i=0;i<si.count;i++)out.T.push(n0+i);
    for(let i=0;i<si.count;i++){let bi=0,w=-1;for(let j=0;j<4;j++)if(sw.getComponent(i,j)>w){w=sw.getComponent(i,j);bi=si.getComponent(i,j);}
      const bn=B[bi].name;m.getVertexPosition(i,fgV).applyMatrix4(m.matrixWorld).applyMatrix4(back[bn==='Head'?'Head':'spine_03']);
      out.push({x:fgV.x,y:fgV.y,z:fgV.z,bone:bn,reg:Math.round(uv.getX(i)*8),o});}
    st.o.removeFromParent();}
  return out;}
// grid surface f(u,v) -> [x,y,z], u wraps when `loop`
function fgGrid(nu,nv,f,loop){
  const p=[],ix=[],U=loop?nu:nu+1;
  for(let j=0;j<=nv;j++)for(let i=0;i<U;i++)p.push(...f(i/nu,j/nv));
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*U+i,b=j*U+(i+1)%U,c=a+U,d=b+U;ix.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}
// polar angle where the unit sphere meets the brim line y=a+b*z at azimuth f (z=cos f is front)
function fgTheta(a,b,f){let lo=0,hi=Math.PI;for(let n=0;n<30;n++){const t=(lo+hi)/2;if(Math.cos(t)-b*Math.sin(t)*Math.cos(f)>a)lo=t;else hi=t;}return lo;}
// the crown is a superellipsoid (p-norm FG.P): a low-poly skull is boxier than an ellipsoid
const fgPn=(x,y,z)=>(Math.abs(x)**FG.P+Math.abs(y)**FG.P+Math.abs(z)**FG.P)**(1/FG.P);
const fgS=(t,f,r)=>{const x=Math.sin(t)*Math.sin(f),y=Math.cos(t),z=Math.sin(t)*Math.cos(f),n=r/fgPn(x,y,z);return[x*n,y*n,z*n];};
// knit hat in unit-crown space: a crown with a little slack on top, and a turned-up cuff
function fgBeanie(){const[a,b]=FG.brim.hat,cu=.42;
  // knit ribs: 18 round the head, three grid columns each
  const rib=f=>.012*Math.cos(18*f);
  const crown=fgGrid(54,10,(u,v)=>{const f=u*TAU,t=v*(fgTheta(a,b,f)-cu*.6);const s=fgS(t,f,1.01+rib(f)*.5*Math.sin(t));s[1]*=1+.05*Math.cos(t);return s;},true);
  const cuff=fgGrid(54,3,(u,v)=>{const f=u*TAU,tb=fgTheta(a,b,f),R=1.055+rib(f);
    return v<1/3?fgS(tb-cu*.6,f,1.01+v*3*(R-1.01)):v<2/3?fgS(tb-cu*.6+(v-1/3)*3*cu*.6,f,R):fgS(tb,f,R-(v-2/3)*3*(R-1.01));},true);
  return cat(crown,cuff);}
// cap: a shallow crown and a curved peak at the front
function fgCap(){const[a,b]=FG.brim.cap;
  const crown=fgGrid(28,9,(u,v)=>{const f=u*TAU;return fgS(v*fgTheta(a,b,f),f,1.02);},true);
  const peak=s=>fgGrid(12,4,(u,v)=>{const f=(u-.5)*1.9,tb=fgTheta(a,b,f),p=fgS(tb,f,1.02),L=.62*v*Math.cos(f*.8);
    return[p[0]*(1+.15*v),p[1]-.06*v*v+s,p[2]+L];},false);
  const top=peak(.035),bot=peak(0);bot.index.array.reverse();bot.computeVertexNormals();
  return cat(crown,top,bot);}
// a strap of width w and thickness t lying on the outermost surface round c in the plane (e1,e2): each edge follows its own section, so the strap lies flat on a curved body.
// a0..a1 picks an arc (angle 0 is e1, pi/2 is e2), `keep` drops points; without a0 it closes round
function fgStrap(P,c,e1,e2,steps,w,t,a0,a1,keep=()=>true,ok,round){
  const nr=e1.clone().cross(e2).normalize(),E=[-1,1].map(s=>fgRing(P,c.clone().addScaledVector(nr,s*w/2),e1,e2,steps,ok)),loop=a0==null;
  // round: a soft wrap rather than a flat strap, both edges at the larger radius
  if(round)E[0].forEach((q,i)=>{const r=E[1][i],d=Math.max(q.p.clone().sub(c).dot(q.n),r.p.clone().sub(c).dot(r.n));q.p.addScaledVector(q.n,d-q.p.clone().sub(c).dot(q.n));r.p.addScaledVector(r.n,d-r.p.clone().sub(c).dot(r.n));});
  const ix=E[0].map((q,i)=>[i,q.a>a1?q.a-TAU:q.a]).filter(([i,a])=>(loop||a>=a0&&a<=a1)&&keep(E[0][i].p)).sort((x,y)=>x[1]-y[1]).map(x=>x[0]),M=ix.length;
  return fgGrid(4,loop?M:M-1,(u,v)=>{const i=ix[Math.round(v*(loop?M:M-1))%M],q=Math.round(u*4)%4,e=E[q===1||q===2?1:0][i];
    return e.p.clone().addScaledVector(e.n,.009+(q>=2?t:0)).toArray();},true);}
// outermost surface in the plane through c spanned by e1,e2 (the section of P's triangles P.T, vertices passing `ok`): points and normals per angle step
function fgRing(P,c,e1,e2,steps,ok){
  const nrm=e1.clone().cross(e2).normalize(),R=new Float32Array(steps),d=new THREE.Vector3(),T=P.T,D=P.map(v=>d.subVectors(v,c).dot(nrm));
  const add=(v,w,s)=>{d.subVectors(v,c).lerp(d.clone().subVectors(w,c),s);const a=Math.atan2(d.dot(e2),d.dot(e1)),i=Math.round((a/TAU+1)*steps)%steps,r=Math.hypot(d.dot(e1),d.dot(e2));if(r>R[i])R[i]=r;};
  for(let t=0;t<T.length;t+=3){const q=[T[t],T[t+1],T[t+2]];if(ok&&!q.every(ok))continue;
    for(let e=0;e<3;e++){const i=q[e],j=q[(e+1)%3];if(D[i]*D[j]<0)add(P[i],P[j],D[i]/(D[i]-D[j]));}}
  for(let n=0;n<2;n++)for(let i=0;i<steps;i++)if(!R[i])R[i]=(R[(i+steps-1)%steps]+R[(i+1)%steps])/2;
  const w=Math.max(1,Math.round(steps/48)),S=Array.from(R,(r,i)=>{for(let j=-w;j<=w;j++)r=Math.max(r,R[(i+j+steps)%steps]*Math.cos(j*TAU/steps));return r;});// a strap bridges dips
  for(let n=0;n<2;n++)for(let i=0;i<steps;i++)S[i]=Math.max(S[i],(S[(i+steps-1)%steps]+S[(i+1)%steps])/2);
  return S.map((r,i)=>{const a=i/steps*TAU,u=e1.clone().multiplyScalar(Math.cos(a)).addScaledVector(e2,Math.sin(a));return{p:c.clone().addScaledVector(u,r),n:u,a};});}
// torso space: the old rig's torso frame (origin 0.9 m up), each outfit's chest scaled onto the old chest, so one shape fits every body and the far rig
function fgTorso(V,b,o){
  let hx=0,z0=9,z1=-9;for(const v of V)if(v.o===o&&v.y>1.25&&v.y<1.38&&!/arm|hand|Head/.test(v.bone)){hx=Math.max(hx,Math.abs(v.x));z0=Math.min(z0,v.z);z1=Math.max(z1,v.z);}
  return{zc:(z0+z1)/2,sx:hx/FG.oldTor.hx,sz:(z1-z0)/2/FG.oldTor.hz};}
const fgToN=(v,t)=>new THREE.Vector3(v.x/t.sx,v.y-.9,(v.z-t.zc)/t.sz);
function fgSetup(RB){
  PARTS.forEach((p,k)=>{if(p.opt)FG.K[p.opt]=k;});
  const N=[],M=new THREE.Matrix4(),bone={};N.T=[];
  for(const b of['m','f']){
    const V=fgVerts(b),NI=new Int32Array(V.length).fill(-1),k=CL.body[b].k,sk=CL.body[b].scene.getObjectByProperty('isSkinnedMesh',true).skeleton;
    for(const n of['Head','spine_03'])bone[b+n]=new THREE.Matrix4().makeScale(k,k,k).multiply(sk.getBoneByName(n).matrixWorld);
    // crown: the skull above the brim line, ears left out (the shader tucks them in)
    const S=V.filter(v=>v.bone==='Head'&&v.reg===0&&v.o===CL.outfits[b][0]),mn=[9,9,9],mx=[-9,-9,-9];
    for(const v of S)[v.x,v.y,v.z].forEach((q,a)=>{mn[a]=Math.min(mn[a],q);mx[a]=Math.max(mx[a],q);});
    const c=new THREE.Vector3((mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2),r=new THREE.Vector3((mx[0]-mn[0])/2,(mx[1]-mn[1])/2,(mx[2]-mn[2])/2);
    let f=0;for(const v of S){const q=new THREE.Vector3(v.x,v.y,v.z).sub(c).divide(r),l=fgPn(q.x,q.y,q.z);if(q.y>FG.brim.hat[0]*l+FG.brim.hat[1]*q.z&&Math.abs(q.x)<.85)f=Math.max(f,l);}
    r.multiplyScalar(f).addScalar(.006);
    const O=FG.oldHead,unitOld=new THREE.Matrix4().makeTranslation(...O.c).multiply(new THREE.Matrix4().makeScale(...O.r));
    const unitNew=new THREE.Matrix4().makeTranslation(c.x,c.y,c.z).multiply(new THREE.Matrix4().makeScale(r.x,r.y,r.z));
    FG.hat[b]={c,r,f,U:unitNew.clone().invert().multiply(bone[b+'Head']),off:bone[b+'Head'].clone().invert().multiply(unitNew).multiply(unitOld.clone().invert())};
    // the trek outfit's own pack would swell its chest: it borrows the tee's fit
    for(const o of CL.outfits[b]){const t=FG.tor[b+o]=fgTorso(V,b,o==='trek'?'tee':o);
      t.off=bone[b+'spine_03'].clone().invert().multiply(M.makeTranslation(0,.9,t.zc)).multiply(new THREE.Matrix4().makeScale(t.sx,1,t.sz));
      if(o!=='trek')V.forEach((v,i)=>{if(v.o===o&&!/arm|hand|Head|calf|foot|ball/.test(v.bone)){NI[i]=N.length;N.push(Object.assign(fgToN(v,t),{bone:v.bone,k:b+o}));}});}
    for(let t=0;t<V.T.length;t+=3){const q=[NI[V.T[t]],NI[V.T[t+1]],NI[V.T[t+2]]];if(q.every(x=>x>=0))N.T.push(...q);}
  }
  FG.N=N;
  fgShapes(N,RB);
  FG.ready=true;
}
const fgV3=(x,y,z)=>new THREE.Vector3(x,y,z);
// shapes in the old part frames (head part for hat and cap, torso part for the rest)
function fgShapes(N,RB){
  const O=FG.oldHead,unitOld=new THREE.Matrix4().makeTranslation(...O.c).multiply(new THREE.Matrix4().makeScale(...O.r)),G={};
  G.hat=fgBeanie().applyMatrix4(unitOld);G.cap=fgCap().applyMatrix4(unitOld);
  const T=N.filter(v=>!/neck|clavicle/.test(v.bone)||v.y<.5);
  // pack: against the shoulder blades, straps over both shoulders down to the chest
  // pack: leaning with the back it rests on, straps over both shoulders to the armpits
  const B=T.filter(v=>Math.abs(v.x)<.12&&v.y>.15&&v.y<.5),zb=(y0,y1)=>Math.min(...B.filter(v=>v.y>y0&&v.y<y1).map(v=>v.z)),sl=(zb(.4,.5)-zb(.15,.25))/.25;
  const zo=k=>Math.min(...B.filter(v=>!k||v.k===k).map(v=>v.z-sl*(v.y-.33))),z0=zo(),lean=g=>g.rotateX(Math.atan(sl)).translate(0,.33,z0);
  // fitted to the bulkiest back (a hoodie's hood): every other outfit wears it that much closer
  for(const k in FG.tor)FG.tor[k].offPack=FG.tor[k].off.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,k==='ftrek'?0:zo(k)-z0));
  // the back rounds off toward the sides (about 1.4 x^2 in torso space), so the pack does too
  const bend=g=>{const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+1.4*p.getX(i)**2);g.computeVertexNormals();return g;};
  const pk=[lean(bend(new RB.RoundedBoxGeometry(.32,.37,.15,3,.05).translate(0,0,-.071))),lean(bend(new RB.RoundedBoxGeometry(.22,.14,.06,2,.025).translate(0,-.09,-.16)))];
  for(const s of[-1,1])pk.push(fgStrap(N,fgV3(s*.13,.33,0),fgV3(0,0,1),fgV3(0,1,0),72,.045,.01,.1,2.3));
  G.pack=cat(...pk);
  // shoulder bag: a strap across the body from the right shoulder, the bag on the left hip
  const top=fgV3(-.13,.56,0),hip=fgV3(.2,.06,0),e2=top.clone().sub(hip).normalize();
  let hx=0;for(const v of T)if(v.y>.02&&v.y<.2&&Math.abs(v.z)<.08)hx=Math.max(hx,v.x);
  G.bag=cat(fgStrap(N,top.clone().add(hip).multiplyScalar(.5),fgV3(0,0,1),e2,96,.035,.008,-1.45,4.6,p=>p.y>.05,i=>!/thigh/.test(N[i].bone)),new RB.RoundedBoxGeometry(.09,.2,.27,3,.03).translate(hx+.051,.1,.02));
  // scarf: a wrap round the neck base and one end down the chest
  // the neck is short: the wrap sits where it meets the shoulders, front a little lower
  const nk=i=>Math.abs(N[i].x)<.1;let zn=0,nn=0;N.forEach((v,i)=>{if(nk(i)&&Math.abs(v.y-.575)<.01){zn+=v.z;nn++;}});zn/=nn||1;
  G.scarf=cat(fgStrap(N,fgV3(0,.575,zn),fgV3(0,-.3,.95),fgV3(1,0,0),36,.045,.03,null,0,undefined,nk,true),
    fgStrap(N,fgV3(.04,.33,0),fgV3(0,0,1),fgV3(0,1,0),72,.065,.014,-.3,1.05),fgStrap(N,fgV3(-.03,.33,0),fgV3(0,0,1),fgV3(0,1,0),72,.06,.012,.1,1.05));
  for(const o in G){const k=FG.K[o];G[o].userData.keep=true;PARTS[k].g=pedMesh[k].geometry=G[o];}
  // an outfit's own hat replaces the instanced one: a speck where the hat would be
  FG.speck={};for(const o of['hat','cap']){G[o].computeBoundingBox();FG.speck[o]=new THREE.Matrix4().makeTranslation(G[o].boundingBox.getCenter(new THREE.Vector3())).multiply(CL.speck);}
}
// hair (anything above the brim line near the crown) is pulled inside the crown under a hat or cap; ears too
const fgMk0=clMake;
clMake=function(b,k){
  const st=fgMk0(b,k),m=st.mesh,mat=m.material,ob=mat.onBeforeCompile,H=m.skeleton.bones.findIndex(n=>n.name==='Head');
  st.hatU={on:{value:0},M:{value:new THREE.Matrix4()},Mi:{value:new THREE.Matrix4()},B:{value:new THREE.Vector2()}};
  st.hatL=m.skeleton.boneInverses[H].clone().multiply(m.bindMatrix);
  mat.onBeforeCompile=s=>{ob(s);const u=st.hatU;Object.assign(s.uniforms,{hatOn:u.on,hatM:u.M,hatMi:u.Mi,hatB:u.B});
    s.vertexShader=s.vertexShader.replace('uniform vec3 rc[8];','uniform vec3 rc[8];uniform float hatOn;uniform mat4 hatM,hatMi;uniform vec2 hatB;const float P='+FG.P.toFixed(1)+';')
      .replace('vRc=rc[int(uv.x*8.+.5)];','vRc=rc[int(uv.x*8.+.5)];\nif(hatOn>.5){vec3 q=(hatM*vec4(transformed,1.)).xyz;vec3 a=abs(q);float l=pow(pow(a.x,P)+pow(a.y,P)+pow(a.z,P),1./P);if(l>.95&&l<1.7&&q.y>(hatB.x-.05)*l+hatB.y*q.z)transformed=(hatMi*vec4(q*(.95/l),1.)).xyz;}');};
  mat.customProgramCacheKey=()=>'clothes_fg';
  return st;};
// hat or cap the outfit does not already have
function fgHat(st){const l=st.look,own=FG.own[st.ok]||{};return l.hat&&!own.hat?'hat':l.cap&&!own.cap?'cap':null;}
const fgTick0=charTick,_fgI=new THREE.Matrix4(),_fgm=new THREE.Matrix4(),_fgv=new THREE.Vector3(),_fgq=new THREE.Quaternion(),_fge=new THREE.Euler();
charTick=function(){
  fgTick0();
  if(!FG.ready)return;
  CHAR.list.forEach((st,i)=>{if(!st||!st.o.visible||!st.hatU)return;
    const l=st.look,own=FG.own[st.ok]||{},hh=fgHat(st),u=st.hatU,t=FG.tor[st.b+st.ok];
    if(hh){if(u.cur!==hh+st.b){u.cur=hh+st.b;u.M.value.multiplyMatrices(FG.hat[st.b].U,st.hatL);u.Mi.value.copy(u.M.value).invert();u.B.value.set(...FG.brim[hh]);}u.on.value=1;}else u.on.value=0;
    // gear the outfit already has is shrunk to a speck at its bone, as clothes.js does for coats, so it stays with its person
    for(const o of['hat','cap']){const k=FG.K[o];pedMesh[k].setMatrixAt(i,!l[o]?ZERO_M:_fgm.multiplyMatrices(st.bone.Head.matrixWorld,FG.hat[st.b].off).multiply(hh===o?_fgI:FG.speck[o]));}
    for(const o of['pack','bag','scarf']){const k=FG.K[o];pedMesh[k].setMatrixAt(i,!l[o]?ZERO_M:own[o]?_fgm.multiplyMatrices(st.bone.spine_03.matrixWorld,CL.speck):_fgm.multiplyMatrices(st.bone.spine_03.matrixWorld,o==='pack'?t.offPack:t.off));}
    if(l.stick)pedMesh[FG.K.stick].setMatrixAt(i,fgStick(st));});
};
// a cane stands on the ground: from the lower hand straight down, or beside the right thigh when both hands are busy
function fgStick(st){
  const s=st.o.scale.x/CHAR.body[st.b].k,y0=st.o.position.y,B=st.bone,ry=st.o.rotation.y;
  const hr=B.hand_r.getWorldPosition(new THREE.Vector3()),hl=B.hand_l.getWorldPosition(new THREE.Vector3()),h=hr.y<=hl.y+.05?hr:hl;
  if(h.y-y0>.95*s||st.mode==='sit'){B.thigh_r.getWorldPosition(h);h.x+=-Math.cos(ry)*.12*s;h.z+=Math.sin(ry)*.12*s;h.y=y0+.85*s;}
  _fgq.setFromEuler(_fge.set(-.06,ry,0,'YXZ'));
  return _fgm.compose(h,_fgq,_fgv.set(s,(h.y-y0)/.88,s));
}
const fgInit0=charInit;
charInit=async function(){
  await fgInit0();
  if(!CL.ready)return;
  try{fgSetup(await import('three/addons/geometries/RoundedBoxGeometry.js'));}catch(e){console.warn('gear keeps its old fit:',e.message);}
};
// a kid or a pensioner does not wear the hard-hat work outfit, and kid girls dress as kids
const fgOut0=clOutfit;
clOutfit=function(look,i){
  if(!look.clo&&look.age!=='adult'){const f=look.male===false;if(look.age==='kid'&&f)look.clo=look.pack?'trek':look.skirt||Math.random()<.4?'dress':'tee';}
  const o=fgOut0(look,i);
  if(o==='worker'&&look.age!=='adult')return look.clo=look.male===false?'tee':'casual';
  return o;};
