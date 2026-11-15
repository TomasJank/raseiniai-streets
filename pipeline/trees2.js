// ---------- trees2: the trees the LiDAR list missed (orthophoto canopy, GRPK forest, belts and orchards) and a species for each tree ----------
// kinds: 0 lime/maple/oak, 1 birch, 2 apple/plum, 3 alder, 4 willow, 5 pine, 6 spruce, 7 thuja. Slot 0 round crown, 1 weeping crown, 2 tiered cone
const T2K=[
  {slot:0,c:[.24,.07,.36,.28,.09],tc:0x5a4634},
  {slot:0,c:[.23,.03,.40,.33,.06],tc:0xd8d4c8},
  {slot:0,c:[.25,.04,.32,.31,.06],tc:0x6b5a48},
  {slot:0,c:[.28,.04,.30,.20,.06],tc:0x4a3c30},
  {slot:1,c:[.24,.03,.34,.34,.06],tc:0x5e5446},
  {slot:0,c:[.31,.04,.30,.17,.05],tc:0x8a5a3a},
  {slot:2,c:[.33,.04,.34,.16,.07],tc:0x4a3a2c},
  {slot:2,c:[.27,.04,.40,.19,.06],tc:0x4a3a2c}];
// crown radius, crown half height, crown centre below the top, trunk height, for a tree of height h and scanned crown radius cr.
// A broadleaf crown stays about as tall as it is wide (fruit trees and willows a little wider), never a flat slab: a scanned
// crown wider than that is usually several trees merged, and trees2Build draws it as two or three (see t2Split)
function t2Shape(k,h,cr){
  if(k===1){const r=Math.min(cr*.7,h*.2+.3),cv=Math.max(h*.34,r*1.3);return[r,cv,cv,h-cv*1.2];}
  if(k===2){const r=Math.min(Math.max(cr*.8,h*.35),h*.48),cv=Math.max(r*.82,h*.3);return[r,cv,cv,Math.max(1.2,h-cv*1.75)];}
  if(k===3){const r=Math.min(cr*.75,h*.3+.3),cv=Math.max(h*.38,r*1.15);return[r,cv,cv,h-cv*1.4];}
  if(k===4){const r=Math.min(cr*.85,h*.42+.3),cv=Math.max(h*.4,r*.85);return[r,cv,cv,h-cv*1.1];}
  if(k===5){const r=Math.min(cr*.9,h*.2+.8),cv=Math.max(h*.2,r*.75);return[r,cv,cv,h-cv*.9];}
  if(k===6){const r=Math.min(cr,h*.28),cv=h*.4;return[r,cv,cv,h-h*.8*.95];}
  if(k===7){const r=Math.min(cr*.6,h*.16+.25),cv=h*.45;return[r,cv,cv,h*.2];}
  const r=Math.min(cr*.85,h*.32+.5),cv=Math.max(h*.37,r*1.05);return[r,cv,cv,h-h*.62*.75];}
function t2Kind(t,i){const u=hash(t[0]*1.7+t[1]*.3+i);return t[4]?(t[2]<7?7:u<.6?6:5):(t[2]<6.5&&u<.4?2:u<.3?1:0);}
function trees2Build(trees,W,P,inBox,mm,TR){
  const S={lidar:0,flip:0,fill:0,added:0,split:0,cut:{box:0,building:0,road:0,water:0,pitch:0,near:0,split:0},kinds:[0,0,0,0,0,0,0,0]};
  const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const LK=new Map();
  if(TR){const v=new Int16Array(bytes(TR.b64).buffer),kk=bytes(TREES2.k),k=111320*Math.cos(TR.lat0*Math.PI/180);
    for(let i=0;i<v.length;i+=4){const q=P([TR.lat0+v[i+1]/2/110540,TR.lon0+v[i]/2/k]);LK.set(q[0]+','+q[1],kk[i/4]);}}
  for(const t of trees){const k=LK.get(t[0]+','+t[1]);if(k==null){t.k=t2Kind(t,1);S.fill++;}else{if(t[4]!==k>=5)S.flip++;t.k=k;t[4]=k>=5;S.lidar++;}}
  const G=new Map(),key=(x,z)=>Math.floor(x/8)+','+Math.floor(z/8),put=t=>{const k=key(t[0],t[1]);let l=G.get(k);if(!l)G.set(k,l=[]);l.push(t);};
  for(const t of trees)put(t);
  const near=(x,z,r)=>{const i0=Math.floor(x/8),j0=Math.floor(z/8);for(let i=i0-1;i<=i0+1;i++)for(let j=j0-1;j<=j0+1;j++){const l=G.get(i+','+j);if(l)for(const t of l)if(Math.hypot(t[0]-x,t[1]-z)<.6*(t[3]+r))return true;}return false;};
  const seg=(x,z,s,m)=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<m;};
  const WL=new Map();for(const r of mm.waterLines||[])for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1],m=r.w/2+.8,s=[a[0],a[1],b[0],b[1],m];
    for(let gx=Math.floor((Math.min(a[0],b[0])-m)/16);gx<=Math.floor((Math.max(a[0],b[0])+m)/16);gx++)for(let gz=Math.floor((Math.min(a[1],b[1])-m)/16);gz<=Math.floor((Math.max(a[1],b[1])+m)/16);gz++){const k=gx+','+gz;let l=WL.get(k);if(!l)WL.set(k,l=[]);l.push(s);}}
  const wet=(x,z)=>water3At(x,z)||(WL.get(Math.floor(x/16)+','+Math.floor(z/16))||[]).some(s=>seg(x,z,s,s[4]));
  const pit=FAC.pitches.map(f=>f[3].map(q=>P(q))),sq=sqLayout(P);
  const v=bytes(TREES2.n),dv=new DataView(v.buffer);
  for(let o=0;o<v.length;o+=7){const x=dv.getInt16(o,true)/4,z=dv.getInt16(o+2,true)/4,h=v[o+4]/4,r=v[o+5]/20,k=v[o+6],c=S.cut;
    if(!inBox(x,z,0)){c.box++;continue;}
    if(W.inBuilding(x,z)||W.inBuilding(x+1.2,z)||W.inBuilding(x-1.2,z)||W.inBuilding(x,z+1.2)||W.inBuilding(x,z-1.2)){c.building++;continue;}
    if(W.ground(x,z)||W.roadSegs(x,z).some(s=>seg(x,z,s,s[4].w/2+1))){c.road++;continue;}
    if(wet(x,z)){c.water++;continue;}
    if(pit.some(q=>pip(x,z,q))||(sq&&pip(x,z,sq.p)&&!sq.lawns.some(l=>pip(x,z,l)))){c.pitch++;continue;}
    if(near(x,z,r)){c.near++;continue;}
    const t=[x,z,h,r,k>=5];t.k=k;trees.push(t);put(t);S.added++;}
  // a broadleaf scanned crown far wider than its tree can be drawn: two or three trees, the scanned one kept in place
  for(let n=trees.length,i=0;i<n;i++){const p=trees[i];if(p.k>4)continue;const r=t2Shape(p.k,p[2],p[3])[0],q=p[3]/r;if(q<1.6)continue;
    const m=q>2.3?2:1,d=Math.min(Math.max(p[3]-r,r*.9),r*1.6),a0=hash(p[0]*3.1+p[1])*6.28;
    for(let j=0;j<m;j++){const a=a0+j*2.1+1.05,x=p[0]+Math.cos(a)*d,z=p[1]+Math.sin(a)*d,h=p[2]*(.78+.17*hash(x+z*1.3)),c=S.cut;
      if(!inBox(x,z,0)||W.inBuilding(x,z)||W.ground(x,z)||W.roadSegs(x,z).some(s=>seg(x,z,s,s[4].w/2+1))||wet(x,z)||pit.some(q=>pip(x,z,q))){c.split++;continue;}
      const t=[x,z,h,t2Shape(p.k,h,99)[0],false];t.k=p.k;trees.push(t);put(t);S.split++;}}
  for(const t of trees)S.kinds[t.k]++;
  W.trees2=S;
  // chunked so each block is culled on its own, for the camera and the sun's shadow map; one mesh per crown shape per chunk
  const blob=det=>{const g=new THREE.IcosahedronGeometry(1,det),p=g.attributes.position,v=new THREE.Vector3(),L=[];for(let i=0;i<7;i++){const a=i*2.4,y=i/6*1.4-.5,r=Math.sqrt(1-y*y*.6);L.push(new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r).normalize());}
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).normalize();let s=.72;for(const l of L)s+=.42*Math.pow(Math.max(0,v.dot(l)),6);s+=.06*Math.sin(v.x*17+v.y*11)*Math.sin(v.z*13);v.multiplyScalar(s);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;};
  // weeping: the lower half hangs out and down like a curtain
  const weep=det=>{const g=blob(det),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),s=y<0?1+.35*Math.min(1,-y*1.6):1-.12*y;p.setXYZ(i,p.getX(i)*s,y<0?y*1.25-.08*Math.sin(p.getX(i)*9+p.getZ(i)*7):y*.85,p.getZ(i)*s);}g.computeVertexNormals();return g;};
  const tiers=()=>{const parts=[[1,.55,-.5],[.74,.5,-.18],[.46,.42,.08]].map(([r,h,y0])=>{const c=new THREE.ConeGeometry(r,h,7,1).toNonIndexed();c.translate(0,y0+h/2,0);return c;}),n=parts.reduce((a,c)=>a+c.attributes.position.count,0),pos=new Float32Array(n*3);let o=0;for(const c of parts){pos.set(c.attributes.position.array,o);o+=c.attributes.position.array.length;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.computeVertexNormals();return g;};
  const cone=new THREE.ConeGeometry(1,1,7),GEO=[[blob(3),blob(1),blob(0)],[weep(3),weep(1),weep(0)],[tiers(),tiers(),cone]],trunkG=new THREE.CylinderGeometry(.6,1,1,5);
  const crownM=new THREE.MeshLambertMaterial();crownM.onBeforeCompile=sh=>{sh.uniforms.uSnow=ENV.snow;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLp;varying float vNy;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLp=position;\n#ifdef USE_INSTANCING\nvNy=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*objectNormal).y;\n#else\nvNy=normalize(mat3(modelMatrix)*objectNormal).y;\n#endif');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLp;varying float vNy;uniform float uSnow;float lh(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7)))*43758.5);}').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=(.55+.45*smoothstep(-1.,.9,vLp.y))*(.8+.35*lh(floor(vLp*9.)));\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.92,.95),uSnow*.85*smoothstep(.1,.6,vNy));');};
  const trunkM=new THREE.MeshLambertMaterial();
  const CH=320,chunks=new Map();
  for(const t of trees){const k=Math.floor(t[0]/CH)+','+Math.floor(t[1]/CH);let c=chunks.get(k);if(!c)chunks.set(k,c=[]);c.push(t);}
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sv=new THREE.Vector3(),pv=new THREE.Vector3(),col=new THREE.Color();
  for(const list of chunks.values()){
    let cx=0,cz=0,top=0;for(const t of list){cx+=t[0];cz+=t[1];top=Math.max(top,t[2]);}cx/=list.length;cz/=list.length;
    let R=0;for(const t of list)R=Math.max(R,Math.hypot(t[0]-cx,t[1]-cz)+t[3]);
    const sphere=new THREE.Sphere(new THREE.Vector3(cx,GY(cx,cz)+top/2,cz),R+top);
    // geometries are shared by every chunk (one upload each, none on a LOD switch); the chunk sphere culls the instanced mesh itself
    const mk=(g,mat,n)=>{const m=new THREE.InstancedMesh(g,mat,n);m.boundingSphere=sphere;m.castShadow=true;worldGroup.add(m);return m;};
    const Tk=mk(trunkG,trunkM,list.length);
    list.forEach((t,i)=>{const [,,cv,th]=t2Shape(t.k,t[2],t[3]),gy=GY(t[0],t[1]),w=(.12+t[2]*.012)*(t.k===1?.7:1);
      sv.set(w,th+1,w);pv.set(t[0],gy+th/2-.5,t[1]);q.identity();m4.compose(pv,q,sv);Tk.setMatrixAt(i,m4);Tk.setColorAt(i,col.setHex(T2K[t.k].tc));t.tk=[Tk,i];});
    for(let s=0;s<3;s++){const L=list.filter(t=>T2K[t.k].slot===s);if(!L.length)continue;
      const [hi,lo1,lo0]=GEO[s],M=mk(hi,crownM,L.length);
      TREES.push({L:M,C:null,Tk,s:sphere,hi,lo1,lo0});
      L.forEach((t,i)=>{const [r,cv,cc]=t2Shape(t.k,t[2],t[3]),hs=hash(t[0]*1.7+t[1]),c=T2K[t.k].c;
        sv.set(r,s===2?cv*2:cv,r*(s===2?1:.85+hs*.15));pv.set(t[0],GY(t[0],t[1])+t[2]-cc,t[1]);q.setFromAxisAngle(Y_AXIS,hs*6.28);m4.compose(pv,q,sv);M.setMatrixAt(i,m4);t.cr=[M,i];
        M.setColorAt(i,col.setHSL(c[0]+hs*c[1],c[2],c[3]+hs*c[4]));});}
  }
  W.trees=trees.map(t=>[t[0],t[1]]);W.treeData=trees.slice();
}
