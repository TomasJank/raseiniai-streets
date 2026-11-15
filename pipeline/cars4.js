// ---------- cars4: textured Sketchfab cars behind the cars2/cars3 seam ----------
// Each model is a .bin (body, one wheel) and a texture atlas made offline by research/assets/vehicles/cars4/convert.mjs.
// Paint is recoloured per car through a paint mask made offline (models without a mask keep their texture); the wheels (cut out of the body offline where the model had them fused)
// spin and steer through cars2's wheel instancing. Lamps are glow quads that only add light at night (and the tail when braking).
// Paint: the texel's lightness against the model's own paint colour (uBase), carried onto the target colour, where the
// mask says paint; bright reflections fade to their own grey, so no trace of the old hue is left. White (1,1,1) as the target means the texture's own colour.
// The target comes from a uniform (moving cars) or the per-instance colour (parked cars).
// A model whose paint is one flat material is stored with that paint grey (M.own is its real colour), so on it every colour is exact.
// Detailed models carry two versions: the .bin is the distant one, a deflated close-up one is unpacked after the world shows and drawn within 40 m.
function cars4Paint(tex,mask,base,inst,col=0xffffff){
  const m=new THREE.MeshLambertMaterial({map:tex,vertexColors:inst});if(!mask)return m;
  const u={uMask:{value:mask},uBase:{value:new THREE.Color(...base)},uPaint:{value:new THREE.Color(col)}};m.userData.paint=u.uPaint.value;
  m.customProgramCacheKey=()=>'cars4paint'+(inst?'i':'');
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uMask;uniform vec3 uBase,uPaint;')
      .replace('#include <color_fragment>',`{vec3 T=${inst?'vColor.rgb':'uPaint'};if(T.r+T.g+T.b<2.99){float k=texture2D(uMask,vMapUv).r,L=dot(diffuseColor.rgb,vec3(.3,.59,.11))/max(dot(uBase,vec3(.3,.59,.11)),.03);
        diffuseColor.rgb=mix(diffuseColor.rgb,mix(T*min(L,1.6),vec3(dot(diffuseColor.rgb,vec3(.3,.59,.11))),smoothstep(1.4,2.6,L)),k);}}`);};
  return m;
}
// a Lithuanian car park around 2005-2015: silver, greys, black and dark blue first; 0xffffff keeps the model's own colour
const CARS4_PALETTE=[[0xb7bbbf,6],[0x8d9196,3],[0x5e6268,4],[0x17181a,5],[0x1e2d4f,4],[0xe6e6e1,2],[0x2b3b31,2],[0x5a181c,2],[0xa6976f,2],[0x9b2420,1],[0x2c6fb4,1],[0xffffff,4]];
const cars4Colour=h=>{let t=CARS4_PALETTE.reduce((a,c)=>a+c[1],0)*h;for(const[c,w]of CARS4_PALETTE)if((t-=w)<0)return c;return 0xffffff;};
// a model whose photo paint only takes dark (or light) colours cleanly shows its own colour instead of the others
const cars4Tone=(F,c)=>{const t=F.M&&F.M.tone,l=((c>>16&255)*.3+(c>>8&255)*.59+(c&255)*.11)/255;return t==='dark'&&l>.45||t==='light'&&l<.3?0xffffff:c;};
const cars4Bytes=id=>{const s=atob(document.getElementById(id).textContent.trim()),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;};
// the two parts of a .bin (body, wheel) as geometries, and the parked twin: the four wheels baked into the body
function cars4Geos(b,M){
  const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);let o=0;
  const part=()=>{const n=dv.getUint32(o,true),m=dv.getUint32(o+4,true);o+=8;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2),I=new Uint16Array(m);
    for(let i=0;i<n*3;i++,o+=2)P[i]=dv.getInt16(o,true)/1000;for(let i=0;i<n*3;i++,o++)N[i]=dv.getInt8(o)/127;for(let i=0;i<n*2;i++,o+=2)U[i]=dv.getUint16(o,true)/65535;for(let i=0;i<m;i++,o+=2)I[i]=dv.getUint16(o,true);
    return{P,N,U,I};};
  const geo=q=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(q.P,3));g.setAttribute('normal',new THREE.BufferAttribute(q.N,3));
    g.setAttribute('uv',new THREE.BufferAttribute(q.U,2));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(q.P.length).fill(1),3));g.setIndex(new THREE.BufferAttribute(q.I,1));g.userData.keep=true;return g;};
  const B=part(),W=part();
  const lot={P:[],N:[],U:[],I:[]};const add=(q,f)=>{const n=lot.P.length/3;for(let i=0;i<q.P.length;i+=3){const[x,y,z]=f(q.P[i],q.P[i+1],q.P[i+2]);lot.P.push(x,y,z);const[a,c,d]=f(q.N[i],q.N[i+1],q.N[i+2],1);lot.N.push(a,c,d);}
    for(const u of q.U)lot.U.push(u);for(const k of q.I)lot.I.push(k+n);};
  add(B,(x,y,z)=>[x,y,z]);
  if(W.I.length)for(const z of M.axles)for(const sx of[-1,1])add(W,(x,y,zz,n)=>n?[sx*x,y,sx*zz]:[sx*x+sx*M.track,y+M.r,sx*zz+z]);
  return{paint:geo(B),wheel:W.I.length?geo(W):null,lot:geo({P:new Float32Array(lot.P),N:new Float32Array(lot.N),U:new Float32Array(lot.U),I:new Uint32Array(lot.I)})};
}
function cars4Model(key,M){
  const G=cars4Geos(cars4Bytes('asset_cars4_'+key),M);
  // lamps: head quads (z>0) white, tail (z<0) red, in the cars2 lamp material
  const lp=[],lc=[],li=[];for(const[x0,y0,x1,y1,z,d]of M.lamps){const n=lp.length/3,c=d>0?[1,.95,.82]:[.9,.08,.05];
    lp.push(x0,y0,z,x1,y0,z,x1,y1,z,x0,y1,z);for(let k=0;k<4;k++)lc.push(...c);li.push(...(d>0?[n,n+1,n+2,n,n+2,n+3]:[n,n+2,n+1,n,n+3,n+2]));}
  const flat=(P,C,I)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(P.length),3));
    g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(C),3));g.setIndex(I);g.userData.keep=true;return g;};
  const lamps=flat(lp,lc,li),trim=flat(new Array(9).fill(0),new Array(9).fill(1),[0,1,2]);
  const img=(id,type)=>{const t=new THREE.Texture();t.flipY=false;const im=new Image();im.onload=()=>{t.image=im;t.needsUpdate=true;};im.src='data:'+type+';base64,'+document.getElementById(id).textContent.trim();return t;};
  const tex=img('asset_cars4_'+key+'_tex','image/jpeg');tex.anisotropy=4;const mask=M.mask?img('asset_cars4_'+key+'_mask','image/png'):null;
  G.paint.userData.cars4=G.lot.userData.cars4=key;
  const F={paint:G.paint,trim,lamps,wheel:G.wheel||trim,axles:M.axles,track:M.track,r:M.r,glb:true,key,tex,mask,cars4:true,base:new THREE.Color(...(M.base||M.paint)),own:M.own,
    mat:cars4Paint(tex,mask,M.base,false),mats:new Map(),color:new THREE.Color(...M.paint),len:M.dims[0],wid:M.dims[1],M};
  // collision circles along the vehicle's own length: cars2's five were laid out for a 4.5 m car and serve cars up to 5 m
  if(F.len>5){const e=F.len/2-.9,n=Math.ceil(2*e/.68);F.offs=Array.from({length:n+1},(_,i)=>-e+2*e*i/n);}
  F.mat.userData.keep=true;
  F.lot={paint:G.lot,trim,axles:M.axles,glb:true,cars4:key};
  return F;
}
// the colour a car is drawn in: white means the model's own, which a flat-paint model keeps in F.own
const cars4Own=(F,c)=>c===0xffffff&&F.own!=null?F.own:c;
const CARS4=(()=>{
  const S={models:{},extra:{},on:false,hi:false};if(PHONE||!CARS2.on)return S;S.on=true;
  // traffic share per model
  const MIX=CARS4_MIX;
  for(const F of CARS2.inst)scene.remove(F.inst);
  for(const k in CARS4_FLEET){const F=cars4Model(k,CARS4_FLEET[k]);if(!(k in MIX)){S.extra[k]=F;continue;}S.models[k]=F;
    F.inst=new THREE.InstancedMesh(F.wheel,F.mat,4*96);F.inst.count=0;F.inst.frustumCulled=false;F.inst.userData.keep=true;scene.add(F.inst);}
  const keys=Object.keys(MIX),weighted=keys.flatMap(k=>Array(MIX[k]).fill(S.models[k]));
  for(const[G,F]of CARS2.swap)if(!F.police)CARS2.swap.set(G,weighted[0]);
  // the player's starting car (carGeo, the hand-built Audi 80) becomes the Sketchfab Audi 80
  if(S.models.audi80)CARS2.swap.set(carGeo,S.models.audi80);
  TRAFFIC_GEOS.splice(0,TRAFFIC_GEOS.length,...weighted);
  LOT_GEOS.splice(0,LOT_GEOS.length,...keys.map(k=>S.models[k].lot));
  // the police Octavia (cars3) keeps its wheels drawn
  Object.assign(CARS2,{models:S.models,inst:[...keys.map(k=>S.models[k]),...(CARS2.police?[CARS2.police]:[])],
    lotPick:c=>keys.indexOf(weighted[Math.floor(hash(c[0]*.71+c[2]*1.37)*weighted.length)].key)});
  if(CARS2.police)scene.add(CARS2.police.inst);
  S.bus=S.extra[CARS4_BUS];
  return S;
})();
{const make=makeCarMesh;makeCarMesh=function(color,G){const g=make(color,G),F=g.userData.car2;if(!F||!F.cars4)return g;
  const ch=g.userData.body.children,lm=ch[4],m=lm.material,tail=ch[3],before=lm.onBeforeRender;
  // the garage's respray assigns a plain colour material to the body: take its colour for the textured paint instead
  const matFor=c=>{if(!F.mask)return F.mat;c=cars4Own(F,c);if(!F.mats.has(c)){const q=cars4Paint(F.tex,F.mask,[F.base.r,F.base.g,F.base.b],false,c);q.userData.keep=true;F.mats.set(c,q);}return F.mats.get(c);};
  // the player's starting car keeps the model's own grey; traffic takes a palette colour
  let cur=matFor(!G&&color===0x74767a?0xffffff:cars4Tone(F,cars4Colour(hash(color+':'+F.key))));
  Object.defineProperty(ch[0],'material',{configurable:true,get:()=>cur,set:v=>{cur=v&&v.color&&!v.map?matFor(v.color.getHex()):v;}});
  m.blending=THREE.AdditiveBlending;m.depthWrite=false;m.transparent=true;
  // glow by night; by day only a braking tail lamp shows
  lm.onBeforeRender=function(){before.apply(this,arguments);const k=clamp(ENV.night.value*1.25,0,1),u=m.userData;u.uHead.value*=k;u.uTail.value.multiplyScalar(tail.material.color.r>1?1:k);};
  return g;};}
// parked cars: instanced through parked2, textured; a detailed model gets its close-up version within 40 m
function cars4Parked(){
  const cp=camera.position,band=(l,lo,hi)=>{const X=Float32Array.from(l,c=>c.x),Y=Float32Array.from(l,c=>c.y),Z=Float32Array.from(l,c=>c.z);
    return i=>{const h=(X[i]-cp.x)**2+(Z[i]-cp.z)**2,d=h+(Y[i]-cp.y)**2;return h<160000&&d>=lo&&d<hi;};};
  const far=PARKED2[PARKED2.length-1],out=[];
  for(const m of PARKED2){out.push(m);const k=m.geometry.userData.cars4;if(!k||!m.material.vertexColors)continue;const F=CARS4.models[k];
    m.material=cars4Paint(F.tex,F.mask,[F.base.r,F.base.g,F.base.b],true);
    if(!F.hi)continue;const l=PARKED.cars.filter(c=>LOT_GEOS[c.k]===F.lot);
    m.onFrustumEnter=band(l,1600,14400);
    const h=new IM2(F.hi.lot.clone(),m.material,{capacity:l.length,renderer});
    h.addInstances(l.length,(o,i)=>{const c=l[i];o.position.set(c.x,c.y,c.z);o.quaternion.setFromAxisAngle(Y_AXIS,c.h);o.color=c.c;});
    h.computeBVH();h.onFrustumEnter=band(l,0,1600);h.castShadow=!PHONE;h.frustumCulled=false;worldGroup.add(h);out.splice(out.length-1,0,h);}
  // the far silhouette stays last
  out.splice(out.indexOf(far),1);out.push(far);PARKED.meshes=PARKED2=out;
  // far silhouettes take the car's colour, or the model's own where it keeps its texture
  const col=new THREE.Color();if(far&&far.setColorAt)PARKED.cars.forEach((c,i)=>{const G=LOT_GEOS[c.k],F=G&&CARS4.models[G.cars4];if(F)far.setColorAt(i,c.c===0xffffff||!F.mask?F.color:col.setHex(c.c));});
}
{const build=parked2Build;parked2Build=function(){build();cars4Parked();};}
// parked cars: a palette colour from the spot, so the same place shows the same car on every load
{const park=addParkedCars;addParkedCars=function(list){return park(!CARS4.on?list:list.map(c=>{const d=c.slice(),F=CARS4.models[LOT_GEOS[CARS2.lotPick(c)].cars4];d[4]=F.mask?cars4Own(F,cars4Tone(F,cars4Colour(hash(c[0]*3.17+c[2]*1.91)))):0xffffff;return d;}));};}
// a van is longer than the five circles cars2 collides with: every vehicle brings its own row
{const offs=o=>{const F=o.g?o.g.userData.car2:CARS4.models[(LOT_GEOS[o.k]||0).cars4];return F&&F.offs||CAR_O;};
  carOverlap=function(a,b,R){let best=null;const fa=Math.sin(a.h),ga=Math.cos(a.h),fb=Math.sin(b.h),gb=Math.cos(b.h),B=offs(b);
    for(const i of offs(a))for(const j of B){const dx=a.x+fa*i-b.x-fb*j,dz=a.z+ga*i-b.z-gb*j,d2=dx*dx+dz*dz;if(d2>=R*R||d2<1e-6)continue;const d=Math.sqrt(d2);if(!best||R-d>best.ov)best={ov:R-d,nx:dx/d,nz:dz/d};}
    return best;};}
// the route bus (one bus looping the stops, with its own driving and a collision as long as it is) wears the Sketchfab coach
{const box=busMesh;busMesh=function(){const F=CARS4.bus;if(!F)return box();
    const g=new THREE.Group(),b=new THREE.Mesh(F.paint,F.mat);b.castShadow=true;g.add(b);g.userData.wheels=[];
    for(const z of F.axles)for(const x of[-F.track,F.track]){const w=new THREE.Mesh(F.wheel,F.mat);w.position.set(x,F.r,z);w.rotation.order='YXZ';if(x<0)w.rotation.y=Math.PI;g.add(w);g.userData.wheels.push(w);}
    return g;};
  const place=placeBus;placeBus=function(dt){place(dt);const W=bus.mesh.userData.wheels;if(W)for(const w of W)w.rotation.x=(w.position.x<0?-1:1)*bus.s/CARS4.bus.r;};}
// vehicles that only stand (CARS4_STATIC: key -> [lat, lon, heading in degrees]): one mesh each and their outline as walls
{const build=buildBus;buildBus=function(){build();const B=world.box;
    for(const k in CARS4_STATIC){const F=CARS4.extra[k];if(!F)continue;
      for(const[la,lo,deg]of CARS4_STATIC[k]){const[x,z]=LL(la,lo),h=deg*Math.PI/180;if(x<B.minX||x>B.maxX||z<B.minZ||z>B.maxZ)continue;
        const m=new THREE.Mesh(F.lot.paint,F.mat);m.position.set(x,GY(x,z)+world.surf(x,z),z);m.rotation.y=h;m.castShadow=true;worldGroup.add(m);
        const s=Math.sin(h),c=Math.cos(h),q=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>[x+c*u*F.wid/2+s*v*F.len/2,z-s*u*F.wid/2+c*v*F.len/2]);
        for(let i=0;i<4;i++)addWall(...q[i],...q[(i+1)%4]);}}};}
// close-up versions: unpacked off the main path, then swapped in by distance (bodies and wheels of moving cars here, parked cars in cars4Parked)
if(CARS4.on){const lod=Object.values(CARS4.models).filter(F=>F.M.lod);
  Promise.all(lod.map(async F=>{const u=new Uint8Array(await new Response(new Blob([cars4Bytes('agz_cars4_'+F.key)]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    const G=cars4Geos(u,F.M);G.lot.userData.cars4hi=F.key;F.hi=G;
    F.instHi=new THREE.InstancedMesh(G.wheel||F.trim,F.mat,4*24);F.instHi.count=0;F.instHi.frustumCulled=false;F.instHi.userData.keep=true;scene.add(F.instHi);})).then(()=>{
    if(!lod.length)return;CARS4.hi=true;if(IM2&&PARKED2.length){for(const m of PARKED2)m.dispose();parked2Build();}
    const pre=scene.onBeforeRender,post=scene.onAfterRender,p=new THREE.Vector3();let nest=0;
    scene.onBeforeRender=function(r,s,cam){pre.call(this,r,s,cam);if(nest++)return;const e=cam.matrixWorld.elements,cx=e[12],cy=e[13],cz=e[14];
      for(const g of CARS2.live){const F=g.userData.car2,b=g.userData.body.children[0];if(!F.hi||b.userData.base)continue;
        p.setFromMatrixPosition(g.matrixWorld);const d=(p.x-cx)**2+(p.y-cy)**2+(p.z-cz)**2,hi=b.geometry===F.hi.paint;
        if(d<1600&&!hi)b.geometry=F.hi.paint;else if(d>1936&&hi)b.geometry=F.paint;}
      for(const F of lod){const I=F.inst,a=I.instanceMatrix.array,H=F.instHi,ha=H.instanceMatrix.array;let n=0,k=0;
        for(let i=0;i<I.count;i++){const o=i*16;if((a[o+12]-cx)**2+(a[o+13]-cy)**2+(a[o+14]-cz)**2<1764&&k<96){ha.set(a.subarray(o,o+16),k++*16);}else{if(n!==i)a.copyWithin(n*16,o,o+16);n++;}}
        I.count=n;I.visible=n>0;H.count=k;if(H.visible=k>0)H.instanceMatrix.needsUpdate=true;}};
    scene.onAfterRender=function(){post.apply(this,arguments);nest--;};});}
