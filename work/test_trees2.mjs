// trees2: node test_trees2.mjs page.html   (SwiftShader; exits 1 on a failed assertion; writes _trees2.html and _trees2_ref.html beside itself)
// _trees2_ref.html is the same page with the trees2 call taken out, so the old tree code runs: the reference for the scanned trees
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){',call='  trees2Build(trees,W,P,inBox,mm,TR);trees.length=0;\n';
if(h.split(o).length!==2||h.split(call).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get TREES(){return TREES},get props(){return props},get falling(){return falling},get scene(){return scene},get camera(){return camera},get renderer(){return renderer},get GY(){return GY},
inWater,snapTree,updateFalling,perfTick(){perfT=0;perfTick(.016);},env(k,t){tod=t;weather.kind=k;weather.amt=weather.want=k==='clear'?0:1;for(let i=0;i<40;i++)updateEnv(.05);},wg:worldGroup,THREE};`;
fs.writeFileSync(dir+'_trees2.html',h.replace(o,api+o));fs.writeFileSync(dir+'_trees2_ref.html',h.replace(o,api+o).replace(call,''));
const g=JSON.parse(fs.readFileSync('/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/pipeline/geo/grpk.json','utf8'));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const errs=[];
const open=async f=>{const p=await b.newPage({viewport:{width:640,height:400}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
  await p.goto('file://'+dir+f,{timeout:180000});await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});await p.waitForTimeout(1000);return p;};
let fails=0;
const check=async(p,name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(r&&r.ok?'PASS':'FAIL',name,JSON.stringify(r));if(!r||!r.ok)fails++;return r;};
const pos=()=>__t.world.treeData.map(t=>[t[0],t[1],t[2],t[3]]);

const ref=await open('_trees2_ref.html');
const refTrees=await ref.evaluate(pos);
const cover=await ref.evaluate(()=>{const W=__t.world,M=W.meta.trees,k=111320*Math.cos(M.lat0*Math.PI/180),P=(lat,lon)=>[(lon-W.lon0)*W.kx,(W.lat0-lat)*W.kz];
  return M.cover.map(c=>{const a=P(M.lat0+c[1]/110540,M.lon0+c[0]/k),q=P(M.lat0+c[3]/110540,M.lon0+c[2]/k);return[Math.min(a[0],q[0]),Math.min(a[1],q[1]),Math.max(a[0],q[0]),Math.max(a[1],q[1])];});});
// the largest GRPK forest with a stretch outside the LiDAR tiles: a point 15 m or more inside it and outside them
const pip=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],q=p[j];if((a[1]>z)!==(q[1]>z)&&x<(q[0]-a[0])*(z-a[1])/(q[1]-a[1])+a[0])c=!c;}return c;};
const edge=(x,z,r)=>{let d=1e9;for(let i=0;i<r.length;i++){const a=r[i],c=r[(i+1)%r.length],dx=c[0]-a[0],dz=c[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));d=Math.min(d,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return d;};
const inCover=(x,z)=>cover.some(c=>x>c[0]-20&&x<c[2]+20&&z>c[1]-20&&z<c[3]+20);
let forest=null;
for(const l of g.land.filter(l=>l.GKODAS==='ms0').sort((a,c)=>c.SHAPE_Area-a.SHAPE_Area)){const r=l.rings[0],xs=r.map(q=>q[0]),zs=r.map(q=>q[1]);
  for(let x=Math.min(...xs);x<Math.max(...xs)&&!forest;x+=5)for(let z=Math.min(...zs);z<Math.max(...zs)&&!forest;z+=5)
    if(Math.abs(x)<2780&&Math.abs(z)<2760&&!inCover(x,z)&&pip(x,z,r)&&edge(x,z,r)>15)forest={x,z,area:Math.round(l.SHAPE_Area)};
  if(forest)break;}
const around=(T,x,z,d)=>T.filter(t=>Math.hypot(t[0]-x,t[1]-z)<d).length;
await ref.close();

const p=await open('_trees2.html');
const newTrees=await p.evaluate(pos);
const S=await p.evaluate(()=>__t.world.trees2);
console.log('counts',JSON.stringify({ref:refTrees.length,now:newTrees.length,...S}));
{const have=new Map(newTrees.map(t=>[t[0]+','+t[1],t])),miss=refTrees.filter(t=>{const q=have.get(t[0]+','+t[1]);return!q||q[2]!==t[2]||q[3]!==t[3];});
  const r={ok:!miss.length&&newTrees.length===refTrees.length+S.added+S.split&&S.lidar+S.fill===refTrees.length,ref:refTrees.length,now:newTrees.length,added:S.added,split:S.split,missingOrMoved:miss.length};
  console.log(r.ok?'PASS':'FAIL','every scanned and old fill tree is still there, same place and size',JSON.stringify(r));if(!r.ok)fails++;}
{const r={ok:!!forest&&around(refTrees,forest.x,forest.z,12)===0&&around(newTrees,forest.x,forest.z,12)>=3,forest,before:forest&&around(refTrees,forest.x,forest.z,12),after:forest&&around(newTrees,forest.x,forest.z,12)};
  console.log(r.ok?'PASS':'FAIL','a GRPK forest outside the LiDAR tiles has trees (within 12 m of a point inside it)',JSON.stringify(r));if(!r.ok)fails++;}
await check(p,'no tree in water, on a road surface or in a building',()=>{const W=__t.world;let water=0,road=0,bld=0,inst=0;
  const on=(x,z)=>W.roadSegs(x,z).some(s=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<s[4].w/2;});
  for(const t of W.treeData){if(__t.inWater(t[0],t[1]))water++;if(on(t[0],t[1]))road++;if(W.inBuilding(t[0],t[1]))bld++;}
  const seen=new Set();for(const e of __t.TREES){if(seen.has(e.Tk))continue;seen.add(e.Tk);const a=e.Tk.instanceMatrix.array;for(let i=0;i<e.Tk.count;i++)if(__t.inWater(a[i*16+12],a[i*16+14]))inst++;}
  return{ok:W.treeData.length>40000&&!water&&!road&&!bld&&!inst,trees:W.treeData.length,water,road,bld,trunkInstancesInWater:inst};});
await check(p,'broadleaf crowns as drawn: no wider than the tree is tall, at least 3/4 as tall as wide; trunk 15-75% of the height',()=>{const W=__t.world,T=__t.THREE,m=new T.Matrix4(),v=new T.Vector3(),q=new T.Quaternion(),sc=new T.Vector3();
  let n=0,wide=0,flat=0,trunk=0;const bad=[];
  for(const t of W.treeData){if(t.k>4)continue;n++;t.cr[0].getMatrixAt(t.cr[1],m);m.decompose(v,q,sc);const r=Math.max(sc.x,sc.z),cv=sc.y,h=t[2];
    t.tk[0].getMatrixAt(t.tk[1],m);const s2=new T.Vector3();m.decompose(v,q,s2);const th=s2.y-1;
    const w=2*r>h+.5,f=cv<.75*r,tr=th<.15*h||th>.75*h;if(w)wide++;if(f)flat++;if(tr)trunk++;if((w||f||tr)&&bad.length<5)bad.push({k:t.k,h,r:+r.toFixed(2),cv:+cv.toFixed(2),th:+th.toFixed(2)});}
  return{ok:n>40000&&!wide&&!flat&&!trunk,broadleaf:n,wide,flat,trunk,bad};});
await check(p,'species: all eight kinds drawn, three crown shapes, LOD switches with distance',()=>{const W=__t.world,k=W.trees2.kinds,shapes=new Set(__t.TREES.map(e=>e.hi.attributes.position.count+':'+e.hi.attributes.position.array[1].toFixed(3)));
  const e=__t.TREES[0],c=__t.camera,c0=c.position.clone();c.position.set(e.s.center.x+3000,50,e.s.center.z);__t.perfTick();const far=e.L.geometry===e.lo0;
  c.position.set(e.s.center.x,e.s.center.y,e.s.center.z);__t.perfTick();const near=e.L.geometry===e.hi;c.position.copy(c0);__t.perfTick();
  return{ok:k.every(n=>n>300)&&shapes.size>=3&&far&&near,kinds:k,shapes:shapes.size,far,near};});
await check(p,'a roadside tree, scanned and added, snaps and falls when a car hits it',()=>{const W=__t.world,car=__t.player.car,out=[];
  const added=new Set(W.treeData.slice(W.treeData.length-W.trees2.added));
  const road=(x,z)=>W.roadSegs(x,z).some(s=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<s[4].w/2+6;});
  for(const want of[false,true]){let q=null;for(const l of __t.props.values()){for(const p of l)if(p.tree&&p.snap&&!p.down&&added.has(p.tree)===want&&road(p.x,p.z)){q=p;break;}if(q)break;}
    if(!q){out.push({added:want,found:false});continue;}
    const [mesh,i]=q.tree.cr,m0=new __t.THREE.Matrix4(),m1=new __t.THREE.Matrix4();mesh.getMatrixAt(i,m0);
    car.x=q.x;car.z=q.z-2;car.h=0;car.speed=15;__t.snapTree(q,car);for(let k=0;k<120;k++)__t.updateFalling(1/60);car.speed=0;
    mesh.getMatrixAt(i,m1);const f=__t.falling.find(f=>f.p===q),y0=m0.elements[13],y1=m1.elements[13];
    out.push({added:want,kind:q.tree.k,down:q.down,th:f&&+f.th.toFixed(2),crownY:[+y0.toFixed(1),+y1.toFixed(1)]});}
  return{ok:out.length===2&&out.every(r=>r.down&&r.th>1.4&&r.crownY[1]<r.crownY[0]-1),out};});
await check(p,'snow whitens the crowns',()=>{const T=__t,W=T.world,gl=T.renderer.getContext(),Wd=gl.drawingBufferWidth,Hd=gl.drawingBufferHeight;
  const e=T.TREES.find(e=>e.L.count>200),cx=e.s.center.x,cz=e.s.center.z,gy=T.GY(cx,cz);const keep=new Set();for(const q of T.TREES){keep.add(q.L);keep.add(q.Tk);}
  const vis=[];T.scene.traverse(o=>{if(o.isMesh||o.isSprite||o.isPoints||o.isLine){vis.push([o,o.visible]);if(!keep.has(o))o.visible=false;}});const bg=T.scene.background,black=new T.THREE.Color(0,0,0);
  const sat=k=>{T.env(k,13);T.camera.position.set(cx+60,gy+70,cz+60);T.camera.lookAt(cx,gy,cz);T.camera.updateMatrixWorld();T.perfTick();T.scene.background=black;T.renderer.render(T.scene,T.camera);T.scene.background=bg;
    const a=new Uint8Array(Wd*Hd*4);gl.readPixels(0,0,Wd,Hd,gl.RGBA,gl.UNSIGNED_BYTE,a);let s=0,n=0;for(let i=0;i<a.length;i+=4){const mx=Math.max(a[i],a[i+1],a[i+2]);if(mx<12)continue;s+=(mx-Math.min(a[i],a[i+1],a[i+2]))/mx;n++;}return{sat:n?s/n:0,px:n};};
  const clear=sat('clear'),snow=sat('snow');T.env('clear',13);for(const [o,v] of vis)o.visible=v;
  return{ok:clear.px>1000&&snow.px>1000&&snow.sat<clear.sat*.7,clear,snow};});
console.log((errs.length?'FAIL':'PASS')+' no console errors',JSON.stringify(errs.slice(0,5)));if(errs.length)fails++;
await b.close();
console.log(fails?'FAILED '+fails:'PASS');process.exit(fails?1:0);
