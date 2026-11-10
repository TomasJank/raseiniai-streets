// ---------- fixpeople: faces, sleeves, gear fitted to the mannequins, kid heads, old stoop, car-hit tumble ----------
// wraps chars.js (charInit / charMake / charPose / charAnim); nothing in chars.js or people2.js is edited
const FIX={
  // gear fit on the mannequin, per look option: [sx,sy,sz, dx,dy,dz] applied in the part's own frame (metres before scale), after the old-rig offset
  fit:{hat:[.92,.78,.92,0,.05,0],cap:[.92,1,.92,0,0,.01],long:[1,1,1,0,-.08,-.03],tail:[1,1.25,1,0,-.03,.01],
    pack:[1.1,1.05,1.1,0,.05,0],bag:[1,1,1,0,0,0],scarf:[1.1,1,1.1,0,0,0],coat:[1.2,1.55,1.5,0,.03,-.02],skirt:[1.42,1.15,1.55,0,.04,-.02],stick:[1,1,1,0,0,0]},
  kidHead:1.32,
  tumble:{up:.28,hold:.55,down:1.25,max:1.65}};
const _fq=new THREE.Quaternion(),_fp=new THREE.Quaternion(),_fv=new THREE.Vector3(),_fm=new THREE.Matrix4();
// rotate a bone by `ang` about a world axis
function fixTilt(b,ax,ay,az,ang){b.parent.getWorldQuaternion(_fp);_fq.setFromAxisAngle(_fv.set(ax,ay,az),ang);
  b.quaternion.premultiply(_fp).premultiply(_fq).premultiply(_fp.invert());b.updateMatrixWorld(true);}
// face decal: an ellipsoid patch hugging the front of each body's head (dims measured per body in charInit), painted in head-local metres so features are not distorted by the sphere mapping
const FACE={p0:Math.PI/2-1,pl:2,t0:.45,tl:1.8,mat:{},geo:{},dim:{}};
function faceTex(kind,b){
  const W=256,cv=document.createElement('canvas');cv.width=cv.height=W;const g=cv.getContext('2d'),{c:[,cy],r:[rx,ry]}=FACE.dim[b];
  const uv=(x,y)=>{const a=x/rx,v=(y-cy)/ry,s=Math.sqrt(Math.max(1e-4,1-v*v)),f=Math.acos(Math.max(-1,Math.min(1,-a/s))),t=Math.acos(Math.max(-1,Math.min(1,v)));
    return[(f-FACE.p0)/FACE.pl*W,(t-FACE.t0)/FACE.tl*W];};
  const path=pts=>{pts.forEach(([x,y],i)=>{const[u,v]=uv(x,y);i?g.lineTo(u,v):g.moveTo(u,v);});};
  const ell=(x,y,a,b,col)=>{g.fillStyle=col;g.beginPath();path(Array.from({length:20},(_,i)=>[x+Math.cos(i/20*TAU)*a,y+Math.sin(i/20*TAU)*b]));g.closePath();g.fill();};
  const line=(pts,w,col)=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.beginPath();path(pts);g.stroke();};
  const kid=kind==='kid',old=kind==='old',fem=kind==='f';
  const ey=cy+ry*(kid?-.1:.05),ex=rx*(kid?.45:.42),ew=kid?.022:.019,eh=kid?.019:.0125;
  for(const s of[-1,1]){
    ell(s*ex,ey,ew,eh,'#f6f2ec');ell(s*ex,ey-.0005,kid?.012:.0093,kid?.012:.0093,'#2a1f17');ell(s*ex+s*.002,ey+.003,.0022,.0022,'#fff');
    if(fem)line([[s*(ex-ew),ey+.002],[s*ex,ey+eh+.002],[s*(ex+ew+.002),ey+.001]],3.5,'#2a1f17');
    const by=ey+(kid?.026:.03);
    line([[s*(ex-ew),by-.002],[s*ex,by+(fem?.005:.002)],[s*(ex+ew),by-(fem?.003:.006)]],kid?3:fem?4:6.5,old?'#8a8782':kid?'#6a5038':'#3a2c20');
    if(old)line([[s*(ex-ew),ey-eh-.005],[s*(ex+ew+.003),ey-eh-.003]],2,'rgba(110,80,60,.45)');}
  line([[0,ey-.018],[.0035,ey-.043],[-.003,ey-.046]],3,'rgba(120,70,50,.4)');
  const my=cy+ry*(kid?-.5:-.52),mw=kid?.017:.022;
  line([[-mw,my+.006],[-mw/2,my-.003],[0,my-.005],[mw/2,my-.003],[mw,my+.006]],fem?5:4,fem?'#b4454c':'#8a3f3f');
  if(old){line([[-.03,my+.025],[-.026,my+.012]],2,'rgba(110,80,60,.4)');line([[.03,my+.025],[.026,my+.012]],2,'rgba(110,80,60,.4)');}
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function faceMat(kind,b){const k=kind+b;return FACE.mat[k]||(FACE.mat[k]=new THREE.MeshLambertMaterial({map:faceTex(kind,b),alphaTest:.4,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));}
function faceGeo(b){return FACE.geo[b]||(FACE.geo[b]=(()=>{const{c:[cx,cy,cz],r:[rx,ry,rz]}=FACE.dim[b],e=.004;
  return new THREE.SphereGeometry(1,22,16,FACE.p0,FACE.pl,FACE.t0,FACE.tl).scale(rx+e,ry+e,rz+e).translate(cx,cy,cz);})());}

const fxInit0=charInit,fxMake0=charMake,fxPose0=charPose,fxAnim0=charAnim;
charInit=async function(){
  await fxInit0();
  for(const k of['m','f']){
    const sc=CHAR.body[k].scene;let mesh;sc.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});
    const g=mesh.geometry,bones=mesh.skeleton.bones,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,reg=g.attributes.region,v=new THREE.Vector3();
    const wp=n=>bones.find(b=>b.name===n).getWorldPosition(new THREE.Vector3());
    sc.updateMatrixWorld(true);
    {const hb=bones.find(n=>n.name==='Head'),inv=hb.matrixWorld.clone().invert(),mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
      for(let i=0;i<si.count;i++){let bb=0,w=-1;for(let j=0;j<4;j++)if(sw.getComponent(i,j)>w){w=sw.getComponent(i,j);bb=si.getComponent(i,j);}
        if(bones[bb]!==hb)continue;mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);
        for(let a=0;a<3;a++){mn[a]=Math.min(mn[a],v.getComponent(a));mx[a]=Math.max(mx[a],v.getComponent(a));}}
      FACE.dim[k]={c:mn.map((m,a)=>(m+mx[a])/2),r:mn.map((m,a)=>(mx[a]-m)/2)};}
    // a short sleeve ends mid upper arm: the lower half of the upper arm takes the forearm colour (the shirt when long sleeved, skin when bare)
    const arm={l:[wp('upperarm_l'),wp('lowerarm_l')],r:[wp('upperarm_r'),wp('lowerarm_r')]};
    for(let i=0;i<si.count;i++){let b=0,w=-1;for(let j=0;j<4;j++)if(sw.getComponent(i,j)>w){w=sw.getComponent(i,j);b=si.getComponent(i,j);}
      const n=bones[b].name;if(!n.startsWith('upperarm'))continue;
      const[a,e]=arm[n.endsWith('_l')?'l':'r'];mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);
      const d=e.clone().sub(a),t=v.clone().sub(a).dot(d)/d.lengthSq();if(t>.55)reg.setX(i,2);}
    reg.needsUpdate=true;}
  CHAR.off0={};for(const b of['m','f']){CHAR.off0[b]={};for(const k in CHAR.off[b])CHAR.off0[b][k]=CHAR.off[b][k].clone();}
  charFit();
};
function charFit(){
  for(const b of['m','f'])for(const k of CHAR.G){const f=FIX.fit[PARTS[k].opt];if(!f)continue;
    CHAR.off[b][k].copy(CHAR.off0[b][k]).multiply(_fm.makeTranslation(f[3],f[4],f[5])).multiply(new THREE.Matrix4().makeScale(f[0],f[1],f[2]));}
}
charMake=function(b){
  const st=fxMake0(b);
  if(!FACE.dim[b])return st;// the throwaway mannequins charInit poses gear on
  const f=new THREE.Mesh(faceGeo(b),faceMat('m',b));f.frustumCulled=false;f.name='face';st.bone.Head.add(f);st.face=f;return st;};
charPose=function(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act){
  const p=i<PED_N?peds[i]:null,dn=p&&p.mode==='down';
  if(dn){
    if(p.dnH===undefined){const sp=Math.hypot(p.vx,p.vz);p.dnH=sp>2.5?Math.atan2(p.vx,p.vz)+Math.PI:null;}
    if(p.dnH!==null){h=p.dnH;lift=0;}
  }else if(p)p.dnH=undefined;
  if(!fxPose0(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act))return false;
  const st=CHAR.list[i];st.tum=dn&&p.dnH!==null;
  if(st.face&&st.fl!==look){st.fl=look;st.face.material=faceMat(look.age==='kid'?'kid':look.age==='old'?'old':look.male===false?'f':'m',st.b);}
  return true;};
// the mixer rewrites a bone only when its animated value changed, so a bone tilted last frame is restored before the mixer runs
charAnim=function(st,dt){
  if(st.sv){for(const[b,q]of st.sv)b.quaternion.copy(q);st.sv=null;}
  fxAnim0(st,dt);
  const l=st.look,hs=l&&l.age==='kid'?FIX.kidHead:1,H=st.bone.Head,ry=st.o.rotation.y,ax=Math.cos(ry),az=-Math.sin(ry),B=st.bone;
  let dirty=H.scale.x!==hs;
  if(dirty)H.scale.setScalar(hs);
  const tilt=(b,a)=>{(st.sv||(st.sv=[])).push([b,b.quaternion.clone()]);fixTilt(b,ax,0,az,a);dirty=false;};
  if(l&&l.age==='old'&&st.mode!=='down'&&st.mode!=='sit'&&st.mode!=='cower'){tilt(B.spine_01,.1);tilt(B.spine_02,.12);}
  if(st.tum&&st.mode==='down'){
    const T=FIX.tumble,t=st.t,a=T.max*(t<T.up?smooth(0,T.up,t):1-smooth(T.hold,T.down,t));
    if(a>.001)tilt(B.pelvis,-a);}
  if(dirty)H.updateMatrixWorld(true);
};
