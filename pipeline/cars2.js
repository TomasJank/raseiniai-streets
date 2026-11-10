// ---------- cars2: low-poly GLB fleet behind the car seam ----------
// research/assets/vehicles/fleet/build.py bakes each vehicle to four meshes (paint/trim/lamps/wheel) in the procedural
// builder's frame; they are decoded synchronously here, before the world spawns, and slot in for buildCar's geometries.
// A car stays the same object for every other system: body.children = [paint, trim, head, tail, lamps]; head and tail are
// empty stand-ins whose .visible / .material breakLamps, fixCar and drive.js keep using, the one lamps mesh reads them.
// Wheels are empty pivots (syncCar/poseCar spin and droop them as before), drawn by one InstancedMesh per model.
const CREDITS_CARS='Vehicles: Quaternius Cars Pack and Zombie Apocalypse Kit (CC0). "Car" (poly.pizza/m/75h3mi6uHuC) and "Van" (poly.pizza/m/aT_24cDaW1a) by Poly by Google, CC-BY 3.0. "Generic Van" (poly.pizza/m/BbRojf2v3H) by PuKkBuMXDD, CC-BY 3.0.';
const CARS2=(()=>{
  const S={on:false,swap:new Map(),models:{},live:new Set(),inst:[]};
  // fleet mix: one entry per share of the traffic; parked cars use the same weights
  const MIX={estate:4,estate80:2,sedan:3,saloon90:3,hatch:3,liftback:2,suv:2,van:1,truck:1,pickup:1};
  if(PHONE||!document.getElementById('asset_car2_sedan'))return S;
  const glb=name=>{
    const s=atob(document.getElementById('asset_'+name).textContent.trim()),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);
    const jl=new DataView(b.buffer).getUint32(12,true),J=JSON.parse(new TextDecoder().decode(b.subarray(20,20+jl))),bo=20+jl+8;
    const read=(i,k)=>{const a=J.accessors[i],v=J.bufferViews[a.bufferView],T={5122:Int16Array,5120:Int8Array,5121:Uint8Array,5123:Uint16Array}[a.componentType],
      n={SCALAR:1,VEC3:3,VEC4:4}[a.type],st=(v.byteStride||n*T.BYTES_PER_ELEMENT)/T.BYTES_PER_ELEMENT,src=new T(b.buffer,bo+(v.byteOffset||0)+(a.byteOffset||0),(a.count-1)*st+n),
      m=Math.min(n,3),o=new (n===1?Uint16Array:Float32Array)(a.count*(n===1?1:m));
      for(let j=0;j<a.count;j++)for(let q=0;q<m;q++)o[j*m+q]=src[j*st+q]*k;return o;};
    const geo={};for(const me of J.meshes){const p=me.primitives[0].attributes,g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.BufferAttribute(read(p.POSITION,.001),3));g.setAttribute('normal',new THREE.BufferAttribute(read(p.NORMAL,1/127),3));
      g.setAttribute('color',new THREE.BufferAttribute(read(p.COLOR_0,1/255),3));g.setIndex(new THREE.BufferAttribute(read(me.primitives[0].indices,1),1));
      g.userData.keep=true;geo[me.name]=g;}
    return{...geo,...J.extras};
  };
  // parked twin: the four wheels baked into trim (they never turn), one draw for both
  const lotTrim=F=>{const parts=[F.trim];
    for(const z of F.axles)for(const x of[-F.track,F.track]){const w=F.wheel.clone();if(x<0)w.rotateY(Math.PI);w.translate(x,F.r,z);parts.push(w);}
    const g=new THREE.BufferGeometry(),I=[];let n=0;
    for(const k of['position','normal','color'])g.setAttribute(k,new THREE.BufferAttribute(new Float32Array(parts.reduce((s,p)=>s+p.attributes[k].array.length,0)),3));
    for(const p of parts){for(const k of['position','normal','color'])g.attributes[k].array.set(p.attributes[k].array,n*3);for(const i of p.index.array)I.push(i+n);n+=p.attributes.position.count;}
    g.setIndex(I);g.userData.keep=true;return g;};
  // highest point of the body near (x≈0, z): where the police lettering and light bar sit
  const topAt=(F,z)=>{const p=F.paint.attributes.position.array;let y=0;for(let i=0;i<p.length;i+=3)if(Math.abs(p[i+2]-z)<.12&&Math.abs(p[i])<.35)y=Math.max(y,p[i+1]);return y;};
  const wheelM=trimM;
  for(const k in MIX){const F=S.models[k]=glb('car2_'+k);F.key=k;F.glb=true;F.lot={paint:F.paint,trim:lotTrim(F),axles:F.axles,glb:true};
    F.inst=new THREE.InstancedMesh(F.wheel,wheelM,4*96);F.inst.count=0;F.inst.frustumCulled=false;F.inst.userData.keep=true;scene.add(F.inst);S.inst.push(F);}
  const P=S.models.liftback;S.police={...P,police:true,hood:topAt(P,1.6),roof:topAt(P,-.12)};
  const keys=Object.keys(MIX),weighted=keys.flatMap(k=>Array(MIX[k]).fill(S.models[k]));
  // the procedural slots map onto the fleet; the arrays are edited in place so every caller picks GLB cars
  S.swap.set(skodaGeo,S.police); // carGeo (the Audi 80 'bulka', the starting car) stays procedural on purpose
  TRAFFIC_GEOS.forEach(G=>S.swap.set(G,S.models[keys[0]]));
  TRAFFIC_GEOS.splice(0,TRAFFIC_GEOS.length,...weighted);
  LOT_GEOS.splice(0,LOT_GEOS.length,...keys.map(k=>S.models[k].lot));
  S.lotPick=c=>{const w=hash(c[0]*.71+c[2]*1.37)*weighted.length;return keys.indexOf(weighted[Math.floor(w)].key);};
  S.on=true;return S;
})();
const CARS2_LAMP=new THREE.MeshBasicMaterial({vertexColors:true});
// lamps: head lamps (z>0) scaled by uHead, tail lamps by uTail; each car has its own copy, the program is shared
CARS2_LAMP.onBeforeCompile=function(sh){sh.uniforms.uHead=this.userData.uHead;sh.uniforms.uTail=this.userData.uTail;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vTail;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTail=position.z<0.?1.:0.;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vTail;uniform float uHead;uniform vec3 uTail;')
    .replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(vec3(uHead),uTail,vTail);');};
function cars2Lamps(F,head,tail){
  const m=CARS2_LAMP.clone();m.onBeforeCompile=CARS2_LAMP.onBeforeCompile;m.userData={uHead:{value:1},uTail:{value:new THREE.Color(1,1,1)}};
  const l=new THREE.Mesh(F.lamps,m);
  // a smashed lamp is a dead lens, not a hole: .3 of its colour (black read as a missing panel)
  l.onBeforeRender=()=>{m.userData.uHead.value=head.visible?1:.3;m.userData.uTail.value.copy(tail.material.color).multiplyScalar(tail.visible?1:.3);};
  return l;
}
function makeCarMesh(color,G=carGeo){
  const F=G&&G.glb?G:CARS2.swap.get(G);if(!F)return makeCarMesh0(color,G);
  let m=F.police?policeM:carMats[color];if(!m){m=carMats[color]=new THREE.MeshPhongMaterial({color,specular:0x383838,shininess:60,vertexColors:true});m.userData.keep=true;}
  const g=new THREE.Group(),body=new THREE.Group(),b=new THREE.Mesh(F.paint,m),t=new THREE.Mesh(F.trim,trimM),head=new THREE.Object3D(),tail=new THREE.Object3D();
  b.castShadow=t.castShadow=true;tail.material=tailM;
  body.add(b,t,head,tail,cars2Lamps(F,head,tail));g.add(body);
  g.userData.wheels=[];
  for(const z of F.axles)for(const x of[-F.track,F.track]){const w=new THREE.Object3D();w.position.set(x,WHEEL_R,z);w.rotation.order='YXZ';if(x<0)w.rotation.y=Math.PI;g.add(w);g.userData.wheels.push(w);}
  g.userData.body=body;g.userData.car2=F;
  g.addEventListener('added',()=>CARS2.live.add(g));g.addEventListener('removed',()=>CARS2.live.delete(g));
  if(F.police){policeExtras(g);const ch=body.children,hood=ch[ch.length-2],bar=ch[ch.length-1];hood.position.y=F.hood+.006;bar.position.y+=F.roof+.06-1.53;}
  return g;
}
// police light bars are added by spawnCop/makeCop at the Octavia's roof height; move them onto this roof
function cars2Bar(c){if(c&&c.bar&&c.g.userData.car2)for(const l of c.bar)l.position.y=c.g.userData.car2.roof+.065;}
function spawnCop(){const n=cops.length;spawnCop0();if(cops.length>n)cars2Bar(cops[cops.length-1]);}
function makeCop(x,z,h){const c=makeCop0(x,z,h);cars2Bar(c);return c;}
function addParkedCars(list){
  if(!CARS2.on)return addParkedCars0(list);
  addParkedCars0(list.map(c=>{const d=c.slice(0,5);d[5]=CARS2.lotPick(c);return d;}));
  // the 8-sided stand-in wheels are already baked into each model's parked trim
  for(const m of PARKED.meshes)if(m.geometry.type==='CylinderGeometry')m.visible=false;
}
// wheels: copy the pivots of each visible car in the camera's view into its model's InstancedMesh once per frame, before
// anything is drawn (the shadow pass reuses them; wheels cast no shadow, as before)
{const _m=new THREE.Matrix4(),_f=new THREE.Frustum(),_s=new THREE.Sphere(undefined,3.5);let nest=0;
  const seen=g=>{for(let o=g;o;o=o.parent){if(!o.visible)return false;if(o===scene)return true;}return false;};
  scene.onBeforeRender=(r,s,cam)=>{if(nest++)return;
    _f.setFromProjectionMatrix(_m.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));
    for(const F of CARS2.inst)F.inst.count=0;
    for(const g of CARS2.live){if(!seen(g)||!_f.intersectsSphere(_s.set(_s.center.setFromMatrixPosition(g.matrixWorld),3.5)))continue;const F=g.userData.car2,I=F.inst;
      // ponytail: 96 cars per model; past that the extra cars just lose their wheels
      for(const w of g.userData.wheels){if(I.count>=I.instanceMatrix.count)break;_m.copy(w.matrix);_m.elements[13]+=F.r-WHEEL_R;_m.premultiply(g.matrixWorld);I.setMatrixAt(I.count++,_m);}}
    for(const F of CARS2.inst)if(F.inst.visible=F.inst.count>0){const a=F.inst.instanceMatrix;a.clearUpdateRanges();a.addUpdateRange(0,F.inst.count*16);a.needsUpdate=true;}};
  scene.onAfterRender=()=>{nest--;};}
