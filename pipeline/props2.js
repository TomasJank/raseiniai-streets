// ---------- props2: Sketchfab street objects in place of the box-built ones (add_props2.py; models made by research/assets/sketchfab/props_convert.mjs) ----------
// PROPS2 is pipeline/props2/props.json: key -> {kind, s:[w,h,d] m, f:[x,z] collision footprint m, knock, solid}. Every model is a unit box
// (x, z centred, y 0..1, front to +z), so an instance matrix scaled by a size in metres draws it at that size.
// A kind with a model is drawn from the model; a kind without one stays as it was. Three ways a model gets its places:
//  1. street-file kinds (bench, bin, lamp, bollard, planter, post, box, bush, treeS): STREET_KINDS takes the model's size before the
//     streets are built, so the walls, props and jump tops the street step registers are the model's; the box mesh is hidden.
//  2. p2Take(kind,...) called from the older builders (park and yard benches, park lamps and bins, bus shelters): true means
//     props2 draws it and makes it solid, so the builder skips its boxes and its wall.
//  3. P2_SITES: places nothing stood on before (crossing signs, kiosks, playground pieces, wells, letter boxes, dumpsters, dog houses,
//     wood piles, hay bales, concrete blocks), from map data.
//  4. fence_<style> (hedge, picket, panel, wall, slat): one model panel repeated along every street-file fence of that style, stretched
//     to whole panels and to the fence's own height; the street step keeps the wall and the jump top and skips its boxes.
// Traffic lights (kind signal) keep the three live lenses the game already switches; the model replaces the pole and the head only.
// Each model is drawn as one InstancedMesh per 200 m cell, so the camera frustum and the fog cull most of the town.
// Several models of one kind are variants picked per place by hash. Street-file kinds share one size (the first row's) so the
// collision the street step made fits every variant; other kinds keep each model's own size.
const P2={kinds:{},sites:[],marks:{},tops:[],mat:{},rows:new Map()};
for(const k in PROPS2){const r=PROPS2[k];r.key=k;(P2.kinds[r.kind]||(P2.kinds[r.kind]=[])).push(r);}
for(const k in P2.kinds){const K=STREET_KINDS[k],r=P2.kinds[k][0];if(K){K.s=r.s;K.f=r.f||[r.s[0],r.s[2]];}}
// plants: hedges and shrubs built here from faceted leafy lumps, the same low-poly look as the game's trees (the Sketchfab hedges
// on disk are textured boxes). Unit box like the models: x, z centred, y 0..1 (top exactly 1, so the drawn height is the place's
// height), front +z. Vertex colours: darker low down and inside, mottled per face; each place multiplies a tint of its own.
// look: n lumps along x (hedge) or round a centre (shrub), lump radii r, top jitter jy, surface noise amp, peak narrows the
// tops (thuja), flat clips the top (clipped hedge). Two variants of each, seeded differently.
const P2_PLANTS={
  thuja:{hedge:1,len:1.4,col:[.2,.38,.22],n:5,r:[.17,.62,.5],jy:.08,amp:.09,peak:.3},
  clipped:{hedge:1,len:1.6,col:[.31,.49,.22],n:4,r:[.2,.58,.56],jy:.03,amp:.06,flat:.9},
  loose:{hedge:1,len:1.8,col:[.38,.52,.24],n:6,r:[.18,.46,.46],jy:.32,amp:.18,zj:.3},
  round:{n:6,col:[.32,.5,.22],r:[.34,.34,.34],jy:.1,amp:.1},
  mound:{n:7,col:[.37,.53,.25],r:[.32,.26,.32],jy:.12,amp:.12},
  upright:{n:5,col:[.24,.42,.21],r:[.26,.4,.26],jy:.08,amp:.09,peak:.3},
};
function p2Plant(L,seed){
  const T=THREE,pos=[],col=[],ico=new T.IcosahedronGeometry(1,1).toNonIndexed().attributes.position.array,lumps=[];
  if(L.hedge)for(let i=0;i<L.n;i++){const j=hash(seed+i*1.7);lumps.push([(i+.5)/L.n-.5+(j-.5)*.3/L.n,1-L.r[1]-j*L.jy,(hash(seed+i*2.3)-.5)*(L.zj||.08),L.r[0]*(1+.3*hash(seed+i*3.1)),L.r[1]*(L.zj?.8+.4*hash(seed+i*5.3):1),L.r[2]]);}
  else for(let i=0;i<L.n;i++){const a=i/(L.n-1)*6.283+hash(seed+i)*.8,d=i?.22+.08*hash(seed+i*2.9):0,j=hash(seed+i*4.1);
    lumps.push([Math.sin(a)*d,(i?.32:.5)+j*L.jy,Math.cos(a)*d,L.r[0]*(i?.75+.3*j:1),L.r[1]*(i?.75+.3*j:1),L.r[2]*(i?.75+.3*j:1)]);}
  for(const[cx,cy,cz,rx,ry,rz]of lumps)for(let v=0;v<ico.length;v+=3){
    const ux=ico[v],uy=ico[v+1],uz=ico[v+2],n=1+(hash(ux*12.9+uy*78.2+uz*37.7+cx*91.3+seed)-.5)*2*L.amp,t=L.peak?1-L.peak*Math.max(0,uy):1;
    pos.push(cx+ux*rx*n*t,Math.max(0,cy+uy*ry*n),cz+uz*rz*n*t);}
  // fit: y 0..1 (clipped hedges flattened near the top), z (and x for a shrub) to -.5..5
  let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=0;i<pos.length;i++){mn[i%3]=Math.min(mn[i%3],pos[i]);mx[i%3]=Math.max(mx[i%3],pos[i]);}
  for(let i=0;i<pos.length;i+=3){let y=pos[i+1]/mx[1];if(L.flat&&y>L.flat)y=L.flat+(y-L.flat)*.35;pos[i+1]=y/(L.flat?L.flat+(1-L.flat)*.35:1);
    pos[i+2]=(pos[i+2]-(mn[2]+mx[2])/2)/(mx[2]-mn[2]);if(!L.hedge)pos[i]=(pos[i]-(mn[0]+mx[0])/2)/(mx[0]-mn[0]);}
  for(let i=0;i<pos.length;i+=9){const y=(pos[i+1]+pos[i+4]+pos[i+7])/3,f=(.5+.5*y)*(.82+.36*hash(i*.137+seed));for(let k=0;k<3;k++)col.push(L.col[0]*f,L.col[1]*f*(1.02+.06*hash(i*.31)),L.col[2]*f);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();g.userData.keep=true;return g;
}
// procedural rows: hedge looks serve street-file hedge fences (kind fence_hedge) and garden hedges (P2.yh); shrubs join the street-file bush models
P2.hedges={};
for(const k in P2_PLANTS){const L=P2_PLANTS[k],bush=P2.kinds.bush&&P2.kinds.bush[0];
  for(const v of[0,1]){const r={key:'plant_'+k+v,kind:L.hedge?'fence_hedge':'bush',geo:p2Plant(L,v*13.7+k.length),s:L.hedge?[L.len,1,.78]:bush?bush.s:[1.3,.9,1.3],f:L.hedge?null:bush&&bush.f};
    if(L.hedge)(P2.hedges[k]||(P2.hedges[k]=[])).push(r);(P2.kinds[r.kind]||(P2.kinds[r.kind]=[])).push(r);}}
// a garden hedge from the town code: its box is not drawn, the pieces are placed in p2Build
P2.yh=[];const p2Hedge=(a,b,hgt,key)=>{P2.yh.push([a,b,hgt,key]);return true;};
const p2Var=(kind,x,z)=>{const V=P2.kinds[kind];return V[Math.floor(hash(x*.37+z*.91)*V.length)];};
// free ground for a w x d footprint: no corner in a building or (road=true) on a carriageway
function p2Free(x,z,h,w,d,road){
  const c=Math.cos(h),s=Math.sin(h);
  for(const[a,b]of[[0,0],[-1,-1],[1,-1],[1,1],[-1,1]]){const px=x+a*w/2*c+b*d/2*s,pz=z-a*w/2*s+b*d/2*c;
    if(world.inBuilding(px,pz)||(road&&p2Road(px,pz).d<0))return false;}
  return true;
}
// nearest carriageway (not paths): d metres from its edge (negative on it), the point on its centre line, its direction, its width
function p2Road(x,z,paths){
  let best={d:1e9};
  for(const s of world.roadSegs(x,z)){if(s[4].cls>2&&!paths)continue;const dx=s[2]-s[0],dz=s[3]-s[1],l=Math.hypot(dx,dz)||1,t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(l*l),0,1),px=s[0]+dx*t,pz=s[1]+dz*t,
      d=Math.hypot(x-px,z-pz)-s[4].w/2;if(d<best.d)best={d,px,pz,ux:dx/l,uz:dz/l,w:s[4].w};}
  return best;
}
// two mapped stops a few metres apart (or a mapped stop and a stop of the bus loop) get one sign and one shelter: true = taken, nothing drawn
const P2_GAP={stopsign:10,shelter:15};
function p2Take(kind,x,z,h,knock,road,vi){
  if(!P2.kinds[kind])return false;
  if(P2_GAP[kind]&&P2.sites.some(q=>q.r.kind===kind&&Math.hypot(q.x-x,q.z-z)<P2_GAP[kind]))return true;
  // shelters are few: take the models in turn so each is seen
  if(vi==null&&kind==='shelter')vi=P2.sites.filter(q=>q.r.kind==='shelter').length;
  const V=P2.kinds[kind],r=vi==null?p2Var(kind,x,z):V[vi%V.length],s=STREET_KINDS[kind]?P2.kinds[kind][0].s:r.s,
    sign=kind==='shelter'?(q=>q.r.kind==='stopsign'):(()=>false);
  if(!p2Free(x,z,h,s[0],s[2],road)||P2.sites.some(q=>!sign(q)&&Math.hypot(q.x-x,q.z-z)<(Math.min(s[0],s[2])+Math.min(q.s[0],q.s[2]))/2))return false;
  // a stop sign inside the shelter goes to the shelter's end, on the side it was on
  if(kind==='shelter'){const c=Math.cos(h),sn=Math.sin(h);for(const q of P2.sites)if(sign(q)){const a=(q.x-x)*c-(q.z-z)*sn,b=(q.x-x)*sn+(q.z-z)*c;
    if(Math.abs(a)<s[0]/2+.3&&Math.abs(b)<s[2]/2+.3){const e=(a<0?-1:1)*(s[0]/2+.4);q.x=x+e*c;q.z=z-e*sn;}}}
  P2.sites.push({r,x,z,h,s,knock:knock||r.knock});return true;
}
const p2Mark=(k,x,z,h)=>{(P2.marks[k]||(P2.marks[k]=[])).push([x,z,h]);};
// places from map data, run after the town is built; each calls p2Take, which refuses buildings and anything already standing there
const P2_SITES={
  // a sign each side of every mapped crossing, on the driver's right, facing the traffic that meets it
  sign_crossing(){for(const[la,lo]of CROSSINGS){const[x,z]=LL(la,lo),R=p2Road(x,z);if(R.d>3)continue;
    for(const e of[1,-1]){const o=R.w/2+.9;p2Take('sign_crossing',R.px-R.uz*e*o+R.ux*e*-2.2,R.pz+R.ux*e*o+R.uz*e*-2.2,Math.atan2(-R.ux*e,-R.uz*e),5);}}},
  // where a side street meets a main road: give way on the side street, the yellow diamond on the main road, each on the driver's right
  sign_giveway(){p2Junctions((n,m,e,main)=>{if(!main)p2Sign('sign_giveway',n,m,e);});},
  sign_main(){p2Junctions((n,m,e,main)=>{if(main)p2Sign('sign_main',n,m,e);});},
  // a kiosk beside about half the bus stops, facing the road
  kiosk(){for(const[x,z,h]of P2.marks.stop||[]){if(hash(x*.19+z*.83)>.55)continue;const ux=Math.cos(h),uz=-Math.sin(h);
    for(const e of[7,-7])if(p2Take('kiosk',x+ux*e-Math.sin(h)*1,z+uz*e-Math.cos(h)*1,h,0,true))break;}},
  // playground pieces: every model once, in a ring, at the mapped playground and behind every third block of flats
  play(){const V=P2.kinds.play,at=[...FAC.play.map(q=>LL(...q)),...(P2.marks.yard||[]).filter(q=>hash(q[0]*.31+q[1]*.77)<.34)],done=[];
    for(const[x,z]of at){if(done.some(q=>Math.hypot(q[0]-x,q[1]-z)<60))continue;let n=0;
      V.forEach((r,i)=>{const a=i/V.length*TAU+hash(x+z)*TAU,R=3+V.length*.9,px=x+Math.sin(a)*R,pz=z+Math.cos(a)*R;
        if(p2Free(px,pz,a,r.s[0],r.s[2],true)&&p2Road(px,pz).d>2){P2.sites.push({r,x:px,z:pz,h:a+Math.PI/2,s:r.s});n++;}});
      if(n)done.push([x,z]);}},
  // a well in one garden in twenty, a few steps in and to the side of the gate, clear of the driveway car
  well(){for(const[gx,gz,b]of world.gaps||[]){if(b.kind!=='house'||hash(gx*.53+gz*.17)>.05)continue;const R=p2Road(gx,gz);if(R.d>8)continue;
    const nx=(gx-R.px)/(R.d+R.w/2),nz=(gz-R.pz)/(R.d+R.w/2);p2Take('well',gx+nx*3.5+R.ux*5,gz+nz*3.5+R.uz*5,Math.atan2(-nx,-nz),0,true);}},
  // a letter box by one garden gate in eight
  mailbox(){for(const[gx,gz,b]of world.gaps||[]){if(b.kind!=='house'||hash(gx*.29+gz*.61)>.12)continue;const R=p2Road(gx,gz);if(R.d>8)continue;
    const nx=(gx-R.px)/(R.d+R.w/2),nz=(gz-R.pz)/(R.d+R.w/2);p2Take('mailbox',gx-R.ux*1.5+nx*.25,gz-R.uz*1.5+nz*.25,Math.atan2(-nx,-nz),4);}},
  // a dumpster beside the recycling bells of each block
  dumpster(){for(const[x,z,h]of P2.marks.bells||[])p2Take('dumpster',x,z,h,0,true);},
  // a dog house in one garden in eight, to the side of the gate
  doghouse(){for(const[gx,gz,b]of world.gaps||[]){if(b.kind!=='house'||hash(gx*.71+gz*.23)>.12)continue;const R=p2Road(gx,gz);if(R.d>8)continue;
    const nx=(gx-R.px)/(R.d+R.w/2),nz=(gz-R.pz)/(R.d+R.w/2);p2Take('doghouse',gx+nx*2.4-R.ux*3.2,gz+nz*2.4-R.uz*3.2,Math.atan2(-nx,-nz),0,true);}},
  // firewood against the long wall of one shed in eight; hay bales by one big shed in six
  logs(){p2Wall('logs',b=>b.kind==='shed'&&hash(b.mnx*.41+b.mnz*.67)<.12,0);},
  bale(){p2Wall('bale',b=>b.kind==='shed'&&(b.mxx-b.mnx)*(b.mxz-b.mnz)>90&&hash(b.mnx*.23+b.mnz*.59)<.17,1.5);},
  // a concrete block across the end of one dead-end lane in four
  block(){for(const[k,a]of roadAdj){if(a.length!==1)continue;const n=world.graph.get(k),m=world.graph.get(a[0]);if(n.cls<1||hash(n.x*.17+n.z*.43)>.25)continue;
    const l=Math.hypot(n.x-m.x,n.z-m.z)||1,ux=(n.x-m.x)/l,uz=(n.z-m.z)/l;p2Take('block',n.x+ux*.6,n.z+uz*.6,Math.atan2(ux,uz));}},
};
// every arm of every junction where a street (class 1) meets at least two arms of a main road (class 0): f(junction, arm's far node, edge, arm is main)
function p2Junctions(f){
  if(!P2.edge){P2.edge=new Map();for(const e of world.edges){P2.edge.set(e.a+'|'+e.b,e);P2.edge.set(e.b+'|'+e.a,e);}}
  for(const[k,a]of roadAdj){if(a.length<3)continue;const es=a.map(o=>P2.edge.get(k+'|'+o));if(es.some(e=>!e)||es.filter(e=>e.cls===0).length<2||!es.some(e=>e.cls===1))continue;
    a.forEach((o,i)=>{if(es[i].cls<=1)f(world.graph.get(k),world.graph.get(o),es[i],es[i].cls===0);});}
}
// a sign for the driver coming along arm m->n: 9 m before the junction, on his right, facing him
function p2Sign(kind,n,m,e){
  const l=Math.hypot(m.x-n.x,m.z-n.z);if(l<14)return;const ux=(m.x-n.x)/l,uz=(m.z-n.z)/l,o=e.w/2+.9;
  p2Take(kind,n.x+ux*9+uz*o,n.z+uz*9-ux*o,Math.atan2(ux,uz),5);
}
// against the longest wall of every building that passes: the model's back to the wall, gap metres out
function p2Wall(kind,pass,gap){
  for(const b of world.buildings){if(!pass(b))continue;const p=b.pts;let bi=0,bl=0,cx=0,cz=0;
    for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length],l=Math.hypot(q[0]-p[i][0],q[1]-p[i][1]);if(l>bl){bl=l;bi=i;}cx+=p[i][0]/p.length;cz+=p[i][1]/p.length;}
    const a=p[bi],c=p[(bi+1)%p.length],ux=(c[0]-a[0])/bl,uz=(c[1]-a[1])/bl,mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2;let nx=uz,nz=-ux;if((mx-cx)*nx+(mz-cz)*nz<0){nx=-nx;nz=-nz;}
    const r=p2Var(kind,mx,mz),o=gap+r.s[2]/2+.15;p2Take(kind,mx+nx*o,mz+nz*o,Math.atan2(nx,nz),0,true);}
}
// a traffic light: the model on the game's own group (it still falls when hit), the three lenses moved onto the model's
function p2Signal(g,pole,head,lamps){
  const V=P2.kinds.signal;if(!V)return;const r=V[0],m=new THREE.Mesh(P2.blank||(P2.blank=new THREE.BufferGeometry()),p2Mat(r));
  pole.visible=head.visible=false;m.scale.set(...r.s);m.castShadow=true;m.visible=false;m.userData.props2=r.key;g.add(m);
  (r.lens||[]).forEach((q,i)=>{lamps[i].position.set(...q);lamps[i].scale.setScalar((r.lensR||.09)/.09);});
  p2Load(r,m);
}
const p2VMat=()=>{const m=new THREE.MeshLambertMaterial({vertexColors:true});m.userData.keep=true;return m;};
const p2Mat=r=>{const m=P2.mat[r.key]||(P2.mat[r.key]=new THREE.MeshLambertMaterial());m.userData.keep=true;if(r.tint)m.color.setRGB(...r.tint);return m;};
function p2Load(r,mesh,then){
  ASSETS.load('props2_'+r.key).then(g=>{const o=g.scene.getObjectByProperty('isMesh',true),mat=P2.mat[r.key];
    if(!mat.map){const t=o.material.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;mat.map=t;mat.alphaTest=o.material.alphaTest;mat.side=o.material.side;mat.needsUpdate=true;}
    o.geometry.userData.keep=true;mesh.geometry=o.geometry;if(mesh.isInstancedMesh)mesh.boundingSphere=null;mesh.visible=true;if(then)then();});
}
// collision for one place (q.col keeps what it made, for work/test_props2.mjs): a knockable or small squarish thing is a round prop, a long thin one a wall, anything else four walls
function p2Solid(q,part){
  const{r,x,z,h,s}=q;if(r.solid===false)return;const col=q.col=[],prop=o=>{addProp(o);col.push(o);};
  const f=r.f||[r.s[0],r.s[2]],fx=f[0]*s[0]/r.s[0],fz=f[1]*s[2]/r.s[2],c=Math.cos(h),sn=Math.sin(h),top=s[1];
  const wall=(a,b,d,e)=>{const x0=x+a*c+b*sn,z0=z-a*sn+b*c,x1=x+d*c+e*sn,z1=z-d*sn+e*c;addWall(x0,z0,x1,z1);col.push([x0,z0,x1,z1]);P2.tops.push([(x0+x1)/2,(z0+z1)/2,top]);};
  if(q.knock)prop({x,z,r:Math.max(fx,fz)/2,snap:true,minSp:q.knock,h:top,parts:[part]});
  else if(Math.max(fx,fz)<=1.6&&Math.max(fx,fz)<2*Math.min(fx,fz))prop({x,z,r:Math.max(fx,fz)/2,h:top});
  else if(fx>2*fz&&fz<.9)wall(-fx/2,0,fx/2,0);
  else if(fz>2*fx&&fx<.9)wall(0,-fz/2,0,fz/2);
  else{const k=[[-fx/2,-fz/2],[fx/2,-fz/2],[fx/2,fz/2],[-fx/2,fz/2]];for(let i=0;i<4;i++)wall(...k[i],...k[(i+1)%4]);}
}
function p2Build(){
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),SC=new THREE.Vector3(),rows=P2.rows=new Map(),cell=(r,x,z)=>r.key+'|'+Math.floor(x/200)+'|'+Math.floor(z/200),
    list=(r,x,z)=>{const k=cell(r,x,z);return(rows.get(k)||rows.set(k,{r,l:[]}).get(k)).l;};
  for(const k in P2_SITES)if(P2.kinds[k])P2_SITES[k]();
  // the street step's own instances move over to the models: same matrices, the box mesh hidden once the model is in
  const boxes=[];worldGroup.traverse(m=>{if(m.isInstancedMesh&&P2.kinds[m.userData.street])boxes.push(m);});
  const moved=new Map();
  for(const m of boxes){const kind=m.userData.street,to=[];moved.set(m,to);
    for(let i=0;i<m.count;i++){m.getMatrixAt(i,M);const e=M.elements,r=p2Var(kind,e[12],e[14]),l=list(r,e[12],e[14]);
      // a lamp's arm reaches over the nearest road or path
      if(P2.kinds[kind][0].face){const R=p2Road(e[12],e[14],true);if(R.d<25){M.decompose(V,Q,SC);M.compose(V,Q.setFromAxisAngle(Y_AXIS,Math.atan2(R.px-V.x,R.pz-V.z)),SC);m.setMatrixAt(i,M);}}
      // a bush: its own turn and width (the street step's round prop widens with it; the height stays, so the jump top does too)
      if(kind==='bush'){const k=.85+.35*hash(e[12]*.61+e[14]*.17);M.decompose(V,Q,SC);Q.setFromAxisAngle(Y_AXIS,hash(e[12]*.13+e[14]*.77)*TAU);SC.x*=k;SC.z*=k;M.compose(V,Q,SC);
        for(const p of world.streets.solids)if(p.x===e[12]&&p.z===e[14]&&!p.k2){p.r*=k;p.k2=k;}}
      to.push([l,l.length]);l.push({m4:M.clone(),box:m});}}
  // street-file fences: whole panels along each stretch, at the fence's own height
  for(const S of STREETS)for(const f of S.fences||[]){const V=P2.kinds['fence_'+f.style];if(!V)continue;
    const P=f.ll.map(q=>LL(...q)),r=V[Math.floor(hash(P[0][0]*.37+P[0][1]*.91)*V.length)],hgt=f.h||STREET_FENCE[f.style][0];
    for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.05)continue;const n=Math.max(1,Math.round(l/r.s[0])),ux=(b[0]-a[0])/l,uz=(b[1]-a[1])/l;
      for(let k=0;k<n;k++){const t=(k+.5)*l/n;P2.sites.push({r,x:a[0]+ux*t,z:a[1]+uz*t,h:Math.atan2(-uz,ux),s:[l/n,hgt,r.s[2]],made:true});}}}
  // garden hedges: thuja half of them, clipped three in ten, loose the rest; pieces about one look-length long, overlapping a little
  for(const[a,b,hgt,key]of P2.yh){const l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.05)continue;const s=hash(key*.71+.3),V=P2.hedges[s<.5?'thuja':s<.8?'clipped':'loose'],
      ux=(b[0]-a[0])/l,uz=(b[1]-a[1])/l,n=Math.max(1,Math.round(l/V[0].s[0]));
    for(let k=0;k<n;k++){const t=(k+.5)*l/n,x=a[0]+ux*t,z=a[1]+uz*t,j=hash(x*.53+z*.29);
      P2.sites.push({r:V[j<.5?0:1],x,z,h:Math.atan2(-uz,ux)+(j<.25||j>.75?Math.PI:0),s:[l/n*1.08,hgt,.8],made:true});}}
  P2.yh=[];
  // `back` (m) slides a model back along its facing: a bench whose seat sits forward of its box centre would put sitters in the backrest
  for(const q of P2.sites){const bk=q.r.back||0;Q.setFromAxisAngle(Y_AXIS,q.h);q.m4=new THREE.Matrix4().compose(V.set(q.x-Math.sin(q.h)*bk,GY(q.x,q.z),q.z-Math.cos(q.h)*bk),Q,SC.set(...q.s));list(q.r,q.x,q.z).push(q);}
  const meshOf=new Map();
  const C=new THREE.Color();
  for(const{r,l}of rows.values()){const mesh=new THREE.InstancedMesh(r.geo||P2.blank||(P2.blank=new THREE.BufferGeometry()),r.geo?P2.vmat||(P2.vmat=p2VMat()):p2Mat(r),l.length);
    if(P2.blank)P2.blank.userData.keep=true;mesh.visible=!!r.geo;mesh.castShadow=true;mesh.userData.props2=r.key;meshOf.set(l,mesh);
    l.forEach((q,i)=>{mesh.setMatrixAt(i,q.m4);if(!q.box&&!q.made)p2Solid(q,[mesh,i]);
      // each plant its own shade: lighter or darker, a touch yellower or bluer
      if(r.geo){const e=q.m4.elements,j=hash(e[12]*.37+e[14]*.11),d=(hash(e[12]*.19+e[14]*.83)-.5)*.12;mesh.setColorAt(i,C.setRGB((.86+.28*j)*(1+d),.86+.28*j,(.86+.28*j)*(1-d)));}});
    worldGroup.add(mesh);
    if(r.geo){for(const q of l)if(q.box)q.box.visible=false;}else p2Load(r,mesh,()=>{for(const q of l)if(q.box)q.box.visible=false;});}
  // knockable street props fall as the model now
  for(const p of world.streets.solids){const to=p.parts&&moved.get(p.parts[0][0]);if(to){const[l,j]=to[p.parts[0][1]];p.parts=[[meshOf.get(l),j]];}}
  JUMP.w=null;
}
{const be0=buildExtra,jt0=jumpTable;
  buildExtra=function(){P2.sites=[];P2.marks={};P2.tops=[];be0();p2Build();};
  // walls props2 added: their tops, by wall midpoint, as jump.js keeps them
  jumpTable=function(){jt0();
    // jump.js puts a .96 m backrest top beside every park bench; a model bench's top is its own height
    for(const q of P2.sites)if(q.r.kind==='bench'){for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const kk=(Math.floor(q.x)+i)+','+(Math.floor(q.z)+j),l=JUMP.tab.get(kk);
      if(l)JUMP.tab.set(kk,l.filter(e=>!(e[2]===.96&&Math.hypot(e[0]-q.x,e[1]-q.z)<.3)));}}
    for(const[x,z,h]of P2.tops){const k=Math.floor(x)+','+Math.floor(z);(JUMP.tab.get(k)||JUMP.tab.set(k,[]).get(k)).push([x,z,h]);}};
}
