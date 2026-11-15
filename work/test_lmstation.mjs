// lmstation: the bus station (c5290) and its canopy (c7167) drawn from the Blender model; the code-built box, the canopy's fuel-station
// slab and pillars, the generated yard fence and the hay bale gone; box, posts, benches and barriers solid; platform and bays walkable;
// the bus route, the roads and the parked minibus clear of everything the step adds.
// node test_lmstation.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get LMT(){return typeof LMT==='undefined'?null:LMT},get bus(){return bus},get P2(){return typeof P2==='undefined'?null:P2},
  get GY(){return GY},get collideCar(){return collideCar},get p2Road(){return p2Road},THREE};`;
fs.writeFileSync(dir+'_lms.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_lms.html',{timeout:180000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});
await p.waitForFunction(()=>__t.LMT&&__t.LMT.loaded,null,{timeout:60000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,H=T.LMT;if(!H||!H.loaded)return{none:true,step:!!H};
  const at=(x,y)=>[H.o[0]+H.U[0]*x+H.N[0]*y,H.o[1]+H.U[1]*x+H.N[1]*y],loc=(x,z)=>{const dx=x-H.o[0],dz=z-H.o[1];return[dx*H.U[0]+dz*H.U[1],dx*H.N[0]+dz*H.N[1]];};
  let tris=0,meshes=0,lambert=true,glow=0;H.group.traverse(q=>{if(q.isMesh){meshes++;tris+=(q.geometry.index?q.geometry.index.count:q.geometry.attributes.position.count)/3;
    lambert=lambert&&q.material.type==='MeshLambertMaterial';if(q.material.onBeforeCompile&&String(q.material.onBeforeCompile).includes('uNight'))glow++;}});
  // anything else drawn over the box, the canopy or the platform edge, .4 to 9 m above the ground (old box, canopy slab, pillars, fence)
  const mine=(u,v)=>u>-31&&u<21&&v>-1.4&&v<(u<0?14.27+(u+.73)*3.19/30.2:14.27+(u+.73)*2.22/20.52)-.3;
  const V=new T.THREE.Vector3(),c=at(-5,6),cv=new T.THREE.Vector3(c[0],H.y0,c[1]),who=new Set();let n=0;
  T.wg.traverse(q=>{if(!q.isMesh)return;let a=q.parent;while(a&&a!==H.group)a=a.parent;if(a===H.group)return;
    const g=q.geometry;if(!g.attributes||!g.attributes.position)return;if(!g.boundingSphere)g.computeBoundingSphere();
    const look=(m)=>{const s=g.boundingSphere.clone().applyMatrix4(m);if(s.center.distanceTo(cv)>s.radius+40)return;
      const pa=g.attributes.position;for(let i=0;i<pa.count;i++){V.fromBufferAttribute(pa,i).applyMatrix4(m);const[u,v]=loc(V.x,V.z),gy=T.GY(V.x,V.z);
        if(mine(u,v)&&V.y>gy+.4&&V.y<gy+9){n++;who.add((q.name||q.userData.props2||q.material.type)+'@'+u.toFixed(0)+','+v.toFixed(0)+','+(V.y-gy).toFixed(1));}}};
    if(q.isInstancedMesh){const M=new T.THREE.Matrix4();for(let i=0;i<q.count;i++){q.getMatrixAt(i,M);look(M.premultiply(q.matrixWorld));}}else look(q.matrixWorld);});
  const fence=(W.hedgeSegs||[]).filter(s=>{const[u,v]=loc(s[0],s[1]);return u>-37&&u<22&&v>-6&&v<16;}).length;
  const sites=T.P2?T.P2.sites.filter(q=>{const[u,v]=loc(q.x,q.z);return mine(u,v)||(u>-31&&u<21&&v>-5.5&&v<0);}).map(q=>q.r.kind):[];
  const walk=(a,bq)=>{let[x,z]=at(...a);const[tx,tz]=at(...bq);for(let i=0;i<3000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
      const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(k=>+k.toFixed(2));};
  // the bus route: no step collider within 2.5 m of it; nothing the step adds stands on a carriageway or a path
  const cols=[...H.props.map(q=>[q.x,q.z,q.r]),...H.walls.flatMap(w=>[[w[0],w[1],0],[w[2],w[3],0],[(w[0]+w[2])/2,(w[1]+w[3])/2,0]])];
  let route=1e9;const P=T.bus.pts;for(let i=0;i<P.length-1;i++){const A=P[i],B=P[i+1],dx=B[0]-A[0],dz=B[1]-A[1],l2=dx*dx+dz*dz||1;
    for(const[x,z,rr]of cols){const t=Math.max(0,Math.min(1,((x-A[0])*dx+(z-A[1])*dz)/l2));route=Math.min(route,Math.hypot(x-A[0]-dx*t,z-A[1]-dz*t)-rr);}}
  const onRoad=cols.map(([x,z,rr])=>T.p2Road(x,z,true).d-rr).reduce((a,b)=>Math.min(a,b),1e9);
  // the parked minibus: in the bays, off every road
  let mb=null;T.wg.traverse(q=>{if(q.isMesh&&!q.isInstancedMesh&&q.parent===T.wg&&q.geometry&&q.geometry.attributes&&q.rotation.y!==0){const[u,v]=loc(q.position.x,q.position.z);if(u>-31&&u<0&&v>-5&&v<0)mb={u:+u.toFixed(1),v:+v.toFixed(1),h:+(q.rotation.y*57.3).toFixed(1)};}});
  const mbRoad=mb?Math.min(...[[-3.5,-1.3],[3.5,-1.3],[3.5,1.3],[-3.5,1.3]].map(([a,bb])=>{const[x,z]=at(mb.u+a,mb.v+bb);return T.p2Road(x,z).d;})):null;
  return{tris,meshes,lambert,glow,other:n,who:[...who].slice(0,12),fence,sites,lm:!!W.landmarks.station,
    box:walk([10,-5],[10,6]),boxNE:walk([26,8],[15,8]),plat:walk([-30,5.5],[-1.2,5.5]),cross:walk([-20.3,-5],[-20.3,8]),dep:walk([-20.6,15],[-20.6,4]),push:H.props.filter(q=>{const o=T.collideCar(q.x+.1,q.z+.05,.35,null);return !o.hit||Math.hypot(o.x-q.x,o.z-q.z)<q.r+.3;}).length,nprops:H.props.length,
    bench:walk([-15.5,12.5],[-15.5,6]),wait:(()=>{const a=T.bus.at.find(q=>q.name==='Raseiniai AS');return a&&a.st?loc(a.st.x,a.st.z).map(k=>+k.toFixed(1)):null;})(),route,onRoad,mb,mbRoad};});
if(r.none){check('step present and model loaded',false,r);}else{
check('model loaded, Lambert, lit glass',r.meshes>0&&r.tris>3000&&r.lambert&&r.glow>=1&&r.lm,{meshes:r.meshes,tris:r.tris,lambert:r.lambert,glow:r.glow,landmark:r.lm});
check('code-built box, canopy slab and pillars not drawn',r.other===0,{verts:r.other,who:r.who});
check('no generated yard fence and no props2 piece on the station ground',r.fence===0&&r.sites.length===0,{fence:r.fence,sites:r.sites});
check('walking into the box is blocked (bus face and street face)',r.box[1]<-.2&&r.boxNE[0]>20.5,{se:r.box,ne:r.boxNE});
check('walking the platform end to end under the canopy is not blocked',r.plat[0]>-1.3,r.plat);
check('walking onto the platform between posts is not blocked (from the departure bays and from the arrivals side)',r.dep[1]<4.1&&r.cross[1]>7.9,{dep:r.dep,arr:r.cross});
check('people wait for the bus on the departures platform',!!r.wait&&r.wait[0]>-28&&r.wait[0]<-18&&r.wait[1]>3&&r.wait[1]<9,r.wait);
check('posts, barriers and benches are solid (every post and barrier pushes the player out)',r.nprops===15&&r.push===0&&r.bench[1]>9.4,{props:r.nprops,notPushing:r.push,bench:r.bench});
check('bus route at least 2.5 m from every collider the step adds',r.route>2.5,+r.route.toFixed(2));
check('nothing the step adds stands on a road or path',r.onRoad>0,+r.onRoad.toFixed(2));
check('parked minibus stands in the arrivals area, off the roads',!!r.mb&&r.mbRoad>0,{mb:r.mb,road:r.mbRoad&&+r.mbRoad.toFixed(2)});}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
