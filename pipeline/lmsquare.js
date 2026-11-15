// ---------- lmsquare: Žemaičio aikštė with the Žemaitis monument (Blender model), Nepriklausomybės gynėjų aikštė (add_lmsquare.py) ----------
// Žemaičio aikštė frame: u along the square's south-east side towards the north-east (the municipality), v towards the north-west,
// metres from the monument (OSM way 187957583). The square is a rectangle in this frame: u -49.5..43, v -20.3..51.7.
// Lawns, beds and plaza edges are read off the 2024 orthophoto and the photos (research/reports/lmsquare.md; sizes are guesses to
// about 2 m). sqLayout is replaced, so the ground step's lawns, the town step's benches round them and the trees2 cut on the paving
// follow the real lawns. The old box monument (buildStadium) and its walls go; the model's plinth gets its own.
const LMS={mon:[55.3811914,23.1170424],old:[55.38119,23.11704],plinth:[4.9,4.3],
  // [u0,u1,v0,v1, chamfer corner (sign of u, sign of v)]: the corner nearest the monument is cut, its edge gets the two benches
  lawns:[[-48.5,-21,-15.5,20,1,1],[-21,-2.5,-15.5,-7,1,1],[2.5,43,-15.5,-7,-1,1],[3,20,20,42,-1,-1],[-48.5,-29,20,50.5,1,-1],[-29,23,43,50.5,1,-1]],
  beds:[[-25,-2.3,30.5,33.5],[-17,-1,23.5,26.5]],
  // Nepriklausomybės gynėjų aikštė (OSM way 1037185679), game x/z: the light slab plaza and its dark beds
  ngs:{plaza:[-340,-305,-295,-262],beds:[[-336,-326.6,-298.2,-291.6],[-343.1,-338.5,-282.6,-277.6],[-303.6,-297.4,-278.9,-270.3],[-325.2,-318.2,-259.7,-253.7],[-359.3,-354.4,-280.2,-274.9]]},
  // keep clear of the buildings other agents are rebuilding (5 m from their walls)
  keep:['c92','c219','c2159','c171','c5290'],walls:[]};
function lmsFrame(P){
  const f=FAC.parks.find(q=>q[0]==='Žemaičio aikštė');if(!f||f[1].length!==6)return null;
  const p=f[1].map(q=>P(q)),l=Math.hypot(p[5][0]-p[4][0],p[5][1]-p[4][1]),e1=[(p[5][0]-p[4][0])/l,(p[5][1]-p[4][1])/l],e2=[e1[1],-e1[0]],M=P(LMS.mon);
  return{p,M,e1,e2,at:(u,v)=>[M[0]+e1[0]*u+e2[0]*v,M[1]+e1[1]*u+e2[1]*v],uv:(x,z)=>[(x-M[0])*e1[0]+(z-M[1])*e1[1],(x-M[0])*e2[0]+(z-M[1])*e2[1]]};
}
{const sq=sqLayout;sqLayout=function(P){const S=sq(P),F=S&&lmsFrame(P);if(!F)return S;
  const lawns=LMS.lawns.map(([u0,u1,v0,v1,su,sv])=>{const cu=su>0?u1:u0,cv=sv>0?v1:v0,ou=su>0?u0:u1,ov=sv>0?v0:v1,c=2.5;
    // v0 on the u edge at the cut, round the far corners, v4 on the v edge at the cut: edges 0 and 3 face the plaza, edge 4 is the cut
    return[[cu-su*c,cv],[ou,cv],[ou,ov],[cu,ov],[cu,cv-sv*c]].map(([u,v])=>F.at(u,v));});
  return{p:S.p,lawns};};}
function lmsNear(x,z,ids,d){for(const r of FX.recs){if(!ids.includes(r.id))continue;const p=r.pts;if(pip(x,z,p))return true;
  for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
    if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<d)return true;}}return false;}
// draped flat cells: rows of `st` metres in a (u,v) frame, runs of included cells cut into pieces of at most 2 m, world-space UVs
function lmsDrape(at,u0,u1,v0,v1,st,inc,y,tex,rep){
  const pos=[],uv=[],nor=[],q=(u,v)=>{const [x,z]=at(u,v);pos.push(x,GY(x,z)+y,z);uv.push(u/rep,v/rep);nor.push(0,1,0);};
  // faces up in either handedness of the frame
  const o=at(0,0),p=at(1,0),r=at(0,1),fl=(p[0]-o[0])*(r[1]-o[1])-(p[1]-o[1])*(r[0]-o[0])>0;
  for(let v=v0;v<v1-1e-6;v+=st){let a=null;
    for(let u=u0;u<=u1+1e-6;u+=st){const ok=u<u1-1e-6&&inc(u+st/2,v+st/2);
      if(ok&&a===null)a=u;
      if((!ok||u-a>=2-1e-6)&&a!==null){const b=u;if(fl){q(a,v);q(b,v+st);q(b,v);q(a,v);q(a,v+st);q(b,v+st);}else{q(a,v);q(b,v);q(b,v+st);q(a,v);q(b,v+st);q(a,v+st);}a=ok?u:null;}}}
  if(!pos.length)return null;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  const m=new THREE.MeshLambertMaterial({map:tex,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const me=new THREE.Mesh(g,m);me.receiveShadow=true;worldGroup.add(me);return me;
}
// textures: what the eye sees (the game shows them as they are)
function lmsTex(px,draw){const t=canvasTex(px,px,draw);t.colorSpace=THREE.NoColorSpace;t.anisotropy=8;return t;}
// warm grey-brown concrete pavers (the 2022 photo in sun) 20 x 10 cm in running bond (2 m per tile), each a little lighter or darker
const lmsPaving=()=>lmsTex(256,x=>{x.fillStyle='rgb(116,102,94)';x.fillRect(0,0,256,256);
  for(let r=0;r<20;r++)for(let c=-1;c<10;c++){const o=r&1?12.8:0,h=hash(r*31.7+c*7.3),k=-9+h*18|0;
    x.fillStyle=`rgb(${162+k},${141+k},${127+k})`;x.fillRect(c*25.6+o+1,r*12.8+1,23.6,10.8);}});
// light concrete slabs 1 x 1 m, about a quarter of them darker grey (Nepriklausomybės gynėjų aikštė, as the orthophoto shows)
const lmsSlabs=()=>lmsTex(512,x=>{x.fillStyle='rgb(140,139,135)';x.fillRect(0,0,512,512);
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const h=hash(r*13.1+c*5.7+.3),k=h<.22?-34:-5+h*10|0;x.fillStyle=`rgb(${192+k},${191+k},${186+k})`;x.fillRect(c*64+1.5,r*64+1.5,61,61);}});
// dark mulch with low red-leaved and green plants
const lmsBed=()=>lmsTex(128,x=>{x.fillStyle='rgb(66,50,42)';x.fillRect(0,0,128,128);
  for(let i=0;i<260;i++){const h=hash(i*1.37),g=hash(i*2.91);x.fillStyle=g<.5?'rgb(96,48,46)':'rgb(58,78,44)';x.beginPath();x.arc(h*128,hash(i*4.13)*128,2+g*3,0,7);x.fill();}});
function lmsBuild(){
  const W=world;LMS.walls=[];const F=LMS.F=lmsFrame(q=>LL(q[0],q[1]));if(!F)return;
  // the old box monument from buildStadium: two instanced meshes in its colours, its four walls
  const [ox,oz]=LL(...LMS.old),v=new THREE.Vector3(),Mt=new THREE.Matrix4();
  for(const o of[...worldGroup.children])if(o.isInstancedMesh&&[0xe7e5de,0xc9c6bd].includes(o.material.color.getHex())){o.getMatrixAt(0,Mt);v.setFromMatrixPosition(Mt);
    if(Math.hypot(v.x-ox,v.z-oz)<8){worldGroup.remove(o);o.dispose();LMS.removed=(LMS.removed||0)+1;}}
  for(const [k,l] of walls)walls.set(k,l.filter(s=>!(Math.hypot(s[0]-ox,s[1]-oz)<5.4&&Math.hypot(s[2]-ox,s[3]-oz)<5.4&&Math.abs(Math.hypot(s[2]-s[0],s[3]-s[1])-7.5)<.1)));
  // plinth walls
  const {at,e1,e2,M}=F,[pw,pd]=LMS.plinth,R=[-e1[1],e1[0]],B=e1,pa=(x,y)=>[M[0]+R[0]*x+B[0]*y,M[1]+R[1]*x+B[1]*y];
  const C=[[-pw/2,-pd/2],[pw/2,-pd/2],[pw/2,pd/2],[-pw/2,pd/2]].map(q=>pa(...q));
  for(let i=0;i<4;i++){const a=C[i],b=C[(i+1)%4];addWall(a[0],a[1],b[0],b[1]);LMS.walls.push([...a,...b]);}
  // paving: the square minus its lawns and beds, off the roads and 5 m clear of the buildings being rebuilt
  const S=sqLayout(q=>LL(q[0],q[1])),inL=(u,v)=>LMS.lawns.some(l=>u>l[0]&&u<l[1]&&v>l[2]&&v<l[3]),inB=(u,v)=>LMS.beds.some(l=>u>l[0]&&u<l[1]&&v>l[2]&&v<l[3]);
  const road=(x,z,m)=>W.roadSegs(x,z).some(s=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<s[4].w/2+m;});
  const free=(x,z)=>!W.inBuilding(x,z)&&!road(x,z,.6)&&!lmsNear(x,z,LMS.keep,5);
  LMS.pave=lmsDrape(at,-50,43.5,-21,52,.5,(u,v)=>{const [x,z]=at(u,v);return pip(x,z,S.p)&&!inL(u,v)&&!inB(u,v)&&free(x,z);},.07,lmsPaving(),2);
  const bt=lmsBed();LMS.bedMeshes=[];
  for(const [u0,u1,v0,v1] of LMS.beds)LMS.bedMeshes.push(lmsDrape(at,u0,u1,v0,v1,.5,()=>true,.1,bt,2));
  // Nepriklausomybės gynėjų aikštė: slab plaza and beds in game axes
  const G=(u,v)=>[u,v],N=LMS.ngs,[a0,a1,b0,b1]=N.plaza;
  // over the square's own ground mesh, which stands 13 cm up
  LMS.ngsPlaza=lmsDrape(G,a0,a1,b0,b1,.5,(x,z)=>free(x,z),.16,lmsSlabs(),8);
  for(const [u0,u1,v0,v1] of N.beds)LMS.bedMeshes.push(lmsDrape(G,u0,u1,v0,v1,.5,(x,z)=>free(x,z),.19,bt,2));
  // the monument: X along R (the viewer's right seen from the front), Blender Y back = glTF -z, so glTF z maps to -B
  const y0=GY(M[0],M[1]),Gm=new THREE.Group();Gm.name='zemaitis';Gm.matrixAutoUpdate=false;
  Gm.matrix.set(R[0],0,-B[0],M[0],0,1,0,y0,R[1],0,-B[1],M[1],0,0,0,1);Gm.matrixWorldNeedsUpdate=true;worldGroup.add(Gm);LMS.group=Gm;
  ASSETS.load('zemaitis').then(g=>{if(LMS.group!==Gm)return;const b=g.scene.getObjectByName('building');let mat=null;
    b.traverse(q=>{if(!q.isMesh)return;if(!mat){const t=q.material.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;mat=new THREE.MeshLambertMaterial({map:t});}
      q.material=mat;q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;W.landmarks.zemaitis=q;});
    Gm.add(b);if(grass)grass.world=null;LMS.loaded=true;});
}
{const be=buildExtra;buildExtra=function(){be();lmsBuild();};}
