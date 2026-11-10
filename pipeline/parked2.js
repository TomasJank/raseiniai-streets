// ---------- parked2: parked cars through InstancedMesh2 (per-instance frustum culling, distance LOD) ----------
// addParkedCars still fills PARKED.cars (collision, parkedNear); its own meshes are swapped for these. Per fleet model one
// paint and one trim mesh (full body < 120 m), one shared silhouette mesh past 120 m (3D distance), nothing past 400 m on the ground plane (perfTick's car cull).
// Without the library (offline, blocked CDN) the cars2 path stays as it was.
let PARKED2=[],IM2=null;
import('@three.ez/instanced-mesh').then(m=>{IM2=m.InstancedMesh2;if(PARKED.cars.length&&CARS2.on)parked2Build();},e=>console.warn('parked2: library not loaded, keeping instanced path',e));
function parked2Build(){
  clearInterval(PARKED.t);for(const m of PARKED.meshes)worldGroup.remove(m);
  const cp=camera.position,mk=(geo,mat,list,lo,hi,tint)=>{
    const X=Float32Array.from(list,c=>c.x),Y=Float32Array.from(list,c=>c.y),Z=Float32Array.from(list,c=>c.z),m=new IM2(geo.clone(),mat,{capacity:list.length,renderer});
    m.addInstances(list.length,(o,i)=>{const c=list[i];o.position.set(c.x,c.y,c.z);o.quaternion.setFromAxisAngle(Y_AXIS,c.h);if(tint)o.color=c.c;});
    m.computeBVH();
    m.onFrustumEnter=i=>{const h=(X[i]-cp.x)**2+(Z[i]-cp.z)**2,d=h+(Y[i]-cp.y)**2;return h<160000&&d>=lo&&d<hi;};
    m.castShadow=tint&&!PHONE;m.frustumCulled=false;worldGroup.add(m);return m;};
  const out=[];
  LOT_GEOS.forEach((G,k)=>{const l=PARKED.cars.filter(c=>c.k===k);if(!l.length)return;
    out.push(mk(G.paint,new THREE.MeshPhongMaterial({color:0xffffff,specular:0x383838,shininess:60,vertexColors:true}),l,0,14400,true),mk(G.trim,trimM.clone(),l,0,14400,false));});
  out.push(mk(parkedFar,new THREE.MeshLambertMaterial({vertexColors:true}),PARKED.cars,14400,1e12,true));
  PARKED.meshes=PARKED2=out;
}
function addParkedCars(list){
  const old=PARKED2;addParkedCars1(list);
  for(const m of old)m.dispose();
  if(IM2&&CARS2.on)parked2Build();
}
