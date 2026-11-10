// ---------- clothes: near people wear real outfits (Quaternius Ultimate Modular Men / Women, re-rigged onto the mannequin skeleton by build_townsfolk.mjs) ----------
// the outfits share the UAL bone names and rest rotations, so every clip (and the kick) plays on them unchanged. Wraps chars.js / fix_people.js: charInit, charMake, charPose, charTick.
// Colours come from `look` by region (skin, shirt, legs, shoe, hair); anything off the main colours (belts, gloves, helmets) keeps its own. Hats, packs, bags and scarves stay instanced gear with smooth shapes.
const CL={speck:new THREE.Matrix4().makeScale(1e-4,1e-4,1e-4),ready:false,body:{},want:null,hid:[],fit:{hat:[1,1,1,0,-.055,0],cap:[1,1,1,0,-.06,0],pack:[1,1,1,0,-.03,.04],bag:[1,1,1,0,0,0],scarf:[.85,.9,.85,0,-.09,0],stick:[1,1,1,0,0,0]},
  outfits:{m:['casual','hoodie','suit','farmer','beach','worker'],f:['dress','tee','suit','worker','trek']}};
async function clLoad(id){
  const e=document.getElementById('agz_'+id),s=atob(e.textContent.trim()),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);
  const u=new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  let t='';for(let i=0;i<u.length;i+=8192)t+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
  const d=document.createElement('script');d.type='application/octet-stream';d.id='asset_'+id;d.textContent=btoa(t);document.body.appendChild(d);
  const g=await ASSETS.load(id);
  d.remove();e.remove();// the parsed scene is cached; the base64 text is not needed again
  return g;
}
// one outfit per look, kept for the person's lifetime; shorts mean warm weather
function clOutfit(look,i){
  const f=look.male===false;
  if(look.clo&&CL.outfits[f?'f':'m'].includes(look.clo))return look.clo;
  const c=charCols.a[i]||{},r=Math.random(),pk=a=>a[Math.min(a.length-1,r*a.length|0)];
  look.clo=f?(look.skirt?'dress':look.coat?'suit':look.pack?'trek':r<.5?'tee':r<.75?'dress':r<.9?'suit':'worker')
    :(c.shin!==undefined&&c.shin===c.skin?'beach':look.coat?(r<.65?'suit':'hoodie'):look.age==='old'?(r<.4?'farmer':'casual'):look.age==='kid'?pk(['casual','hoodie']):r<.4?'casual':r<.65?'hoodie':r<.8?'suit':r<.9?'farmer':'worker');
  return look.clo;
}
// the outfits have eyes and brows; the decal adds the mouth, a nose shade and an old face's lines on a head-hugging ellipsoid patch (same mapping as fix_people.js, measured on these heads)
const CLF={dim:{},mat:{},geo:{}};
function clFaceTex(kind,b){
  const W=256,cv=document.createElement('canvas');cv.width=cv.height=W;const g=cv.getContext('2d'),{c:[,cy],r:[rx,ry]}=CLF.dim[b];
  const uv=(x,y)=>{const a=x/rx,v=(y-cy)/ry,s=Math.sqrt(Math.max(1e-4,1-v*v)),f=Math.acos(Math.max(-1,Math.min(1,-a/s))),t=Math.acos(Math.max(-1,Math.min(1,v)));
    return[(f-FACE.p0)/FACE.pl*W,(t-FACE.t0)/FACE.tl*W];};
  const line=(pts,w,col)=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.beginPath();pts.forEach(([x,y],i)=>{const[u,v]=uv(x,y);i?g.lineTo(u,v):g.moveTo(u,v);});g.stroke();};
  const kid=kind==='kid',old=kind==='old',fem=kind==='f',my=cy+ry*(kid?-.5:-.5),mw=kid?.016:.022;
  line([[-mw,my+.005],[-mw/2,my-.003],[0,my-.005],[mw/2,my-.003],[mw,my+.005]],fem?5:4,fem?'#b4454c':'#8a3f3f');
  line([[0,my+.045],[.004,my+.025],[-.003,my+.022]],3,'rgba(120,70,50,.4)');
  if(old){line([[-.03,my+.022],[-.026,my+.01]],2,'rgba(110,80,60,.4)');line([[.03,my+.022],[.026,my+.01]],2,'rgba(110,80,60,.4)');}
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const clFM0=faceMat;
faceMat=function(kind,b){if(!CLF.dim[b])return clFM0(kind,b);const k=kind+b;return CLF.mat[k]||(CLF.mat[k]=new THREE.MeshLambertMaterial({map:clFaceTex(kind,b),alphaTest:.4,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));};
function clFaceGeo(b){return CLF.geo[b]||(CLF.geo[b]=(()=>{const{c:[cx,cy,cz],r:[rx,ry,rz]}=CLF.dim[b],e=.004;
  return new THREE.SphereGeometry(1,22,16,FACE.p0,FACE.pl,FACE.t0,FACE.tl).scale(rx+e,ry+e,rz+e).translate(cx,cy,cz);})());}
function clMake(b,k){
  const B=CL.body[b],o=ASSETS.clone(B.scene),bone={},drop=[];let mesh;
  o.traverse(n=>{if(n.isBone)bone[n.name]=n;if(n.isSkinnedMesh){if(n.name==='o_'+k)mesh=n;else drop.push(n);}});
  drop.forEach(n=>n.removeFromParent());
  const rc=Array.from({length:8},()=>new THREE.Color(0xffffff)),mat=new THREE.MeshLambertMaterial({vertexColors:true});
  mat.onBeforeCompile=s=>{s.uniforms.rc={value:rc};
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform vec3 rc[8];varying vec3 vRc;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRc=rc[int(uv.x*8.+.5)];');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vRc;').replace('vec4 diffuseColor = vec4( diffuse, opacity );','vec4 diffuseColor = vec4( diffuse*vRc, opacity );');};
  mat.customProgramCacheKey=()=>'clothes';mesh.material=mat;
  const mx=new THREE.AnimationMixer(o),act={};for(const n in CHAR.clips)act[n]=mx.clipAction(CHAR.clips[n]);
  pedMesh[1].add(o);
  const face=new THREE.Mesh(clFaceGeo(b),faceMat('m',b));face.frustumCulled=false;bone.Head.add(face);
  return{b,o,mesh,face,rc,mx,act,bone,ok:k,t:0,one:null,oneT:0,mode:null,swing:null,cols:null,clip:'idle',phone:false,look:null};
}
const clInit0=charInit,clMake0=charMake,clPose0=charPose,clTick0=charTick;
charInit=async function(){
  await clInit0();
  try{await clSetup();}catch(e){console.warn('mannequins stay naked:',e.message);}
};
async function clSetup(){
  const [bm,bf,RB]=await Promise.all([clLoad('clothes_m'),clLoad('clothes_f'),import('three/addons/geometries/RoundedBoxGeometry.js')]);
  const rb=(w,h,d,r,x,y,z)=>new RB.RoundedBoxGeometry(w,h,d,3,r).translate(x,y,z);
  const sph=(x,y,z,sx,sy,sz,t0=0,t1=Math.PI)=>new THREE.SphereGeometry(1,20,12,0,TAU,t0,t1).scale(sx,sy,sz).translate(x,y,z);
  // smooth replacements in the old part frames (same offsets), so far people get them too
  const G={hat:cat(sph(0,.125,-.006,.112,.125,.122,0,1.75),new THREE.TorusGeometry(.108,.02,8,24).rotateX(Math.PI/2).scale(1,1,1.08).translate(0,.1,-.006)),
    cap:cat(sph(0,.15,-.006,.114,.11,.122,0,1.6),sph(0,.148,.125,.072,.011,.07).rotateX(-.1)),
    pack:rb(.27,.34,.13,.05,0,.28,-.185),
    bag:cat(rb(.07,.2,.25,.03,.26,.02,.03),rb(.025,.56,.014,.006,.06,.29,.115).rotateZ(.75)),
    scarf:cat(new THREE.TorusGeometry(.075,.033,8,16).rotateX(Math.PI/2).scale(1,1,.85).translate(0,.53,.005),rb(.06,.2,.03,.014,.05,.43,.1))};
  PARTS.forEach((p,k)=>{if(G[p.opt]){p.g=pedMesh[k].geometry=G[p.opt];}if(['coat','skirt','long','tail'].includes(p.opt))CL.hid.push(k);});
  const _b=new THREE.Box3();
  for(const [b,g] of [['m',bm],['f',bf]]){
    const meshes=[];g.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
    g.scene.updateMatrixWorld(true);
    let h=0;
    for(const m of meshes){m.computeBoundingSphere();m.boundingSphere.radius*=1.8;m.castShadow=true;_b.setFromObject(m,true);h+=_b.max.y-_b.min.y;}
    {const m=meshes.find(q=>q.name==='o_'+CL.outfits[b][0]),gm=m.geometry,uv=gm.attributes.uv,si=gm.attributes.skinIndex,sw=gm.attributes.skinWeight,hb=m.skeleton.bones.find(n=>n.name==='Head'),inv=hb.matrixWorld.clone().invert(),v=new THREE.Vector3(),mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
      for(let i=0;i<si.count;i++){let bb=0,w=-1;for(let j=0;j<4;j++)if(sw.getComponent(i,j)>w){w=sw.getComponent(i,j);bb=si.getComponent(i,j);}
        if(m.skeleton.bones[bb]!==hb||Math.round(uv.getX(i)*8)!==0)continue;m.getVertexPosition(i,v).applyMatrix4(m.matrixWorld).applyMatrix4(inv);
        for(let a=0;a<3;a++){mn[a]=Math.min(mn[a],v.getComponent(a));mx[a]=Math.max(mx[a],v.getComponent(a));}}
      CLF.dim[b]={c:mn.map((q,a)=>(q+mx[a])/2),r:mn.map((q,a)=>(mx[a]-q)/2)};}
    CL.body[b]={scene:g.scene,k:1.76/(h/meshes.length)};
    CHAR.body[b].k=CL.body[b].k;
  }
  CHAR.body.f.hip=1;
  // gear offsets from the idle pose, as chars.js did for the old mannequins
  const all={s:1};for(const p of PARTS)if(p.opt)all[p.opt]=true;
  poseAt(FARE_I,all,0,0,0,0,0,0,0,false);const inv=new THREE.Matrix4().copy(_pb).invert(),M=new THREE.Matrix4();
  for(const b of['m','f']){const st=clMake(b,CL.outfits[b][0]),o=st.o;o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.setScalar(CL.body[b].k);
    st.act.idle.play().setEffectiveWeight(1);st.act.idle.time=0;st.mx.update(0);o.updateMatrixWorld(true);
    const off=CHAR.off[b]={};
    for(const k of[...CHAR.G,8]){const src=k===8?'hand_r':CHAR.SRC[PARTS[k].opt],bone=st.bone[src];
      off[k]=bone.matrixWorld.clone().invert().multiply(new THREE.Matrix4().multiplyMatrices(inv,PM[k]));
      if(src==='hand_r')off[k].setPosition(0,0,0);
      const f=CL.fit[k===8?'':PARTS[k].opt];if(f)off[k].multiply(M.makeTranslation(f[3],f[4],f[5])).multiply(new THREE.Matrix4().makeScale(f[0],f[1],f[2]));}
    o.removeFromParent();}
  hidePed(FARE_I);
  CL.ready=true;
}
charMake=function(b){
  if(!CL.ready||CL.want==null)return clMake0(b);
  return clMake(b,CL.want);
};
charPose=function(i,look,...r){
  if(CL.ready&&CHAR.use[i]){
    const b=look.male===false?'f':'m',k=clOutfit(look,i),st=CHAR.list[i];
    if(st&&(st.b!==b||st.ok!==k)){st.o.removeFromParent();st.mx.stopAllAction();CHAR.list[i]=null;}
    CL.want=k;
  }
  return clPose0(i,look,...r);
};
charTick=function(){
  clTick0();
  if(!CL.ready)return;
  // coat, skirt and hair parts are the outfit now: shrunk to a speck at their bone rather than zeroed, so each stays next to the person it belongs to
  CHAR.list.forEach((st,i)=>{if(st&&st.o.visible&&CL.outfits[st.b].includes(st.ok))for(const k of CL.hid)
    pedMesh[k].setMatrixAt(i,st.look[PARTS[k].opt]?_cm.multiplyMatrices(st.bone[CHAR.SRC[PARTS[k].opt]].matrixWorld,CHAR.off[st.b][k]).multiply(CL.speck):ZERO_M);});
};
