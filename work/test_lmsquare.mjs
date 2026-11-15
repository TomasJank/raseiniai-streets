// lmsquare: the Žemaitis monument from the Blender model, the old box monument gone, the plinth solid and the paving round it walkable;
// Žemaičio aikštė paving, lawns and beds; the slab plaza of Nepriklausomybės gynėjų aikštė; nothing within 5 m of the buildings
// other agents rebuild. node test_lmsquare.mjs page.html [page2.html]   (a second build: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get FX(){return FX},get LMS(){return typeof LMS==='undefined'?null:LMS},get GY(){return GY},get collideCar(){return collideCar},get sq(){return sqLayout(q=>LL(q[0],q[1]))},LL:(a,b)=>LL(a,b),THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});
await p.waitForFunction(()=>__t.LMS&&__t.LMS.loaded,null,{timeout:60000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,L=T.LMS,F=L&&L.F;if(!F||!L.loaded)return{noFrame:true,step:!!L};
  const V3=T.THREE.Vector3,v=new V3(),Mt=new T.THREE.Matrix4();
  let tris=0,lambert=true;L.group.traverse(o=>{if(o.isMesh){tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;lambert=lambert&&o.material.type==='MeshLambertMaterial';}});
  const lm=W.landmarks.zemaitis,lmIn=!!lm&&(()=>{let q=lm;while(q&&q!==L.group)q=q.parent;return q===L.group;})();
  // plinth frame: x along R (half 2.45), y along B = e1 (half 2.15)
  const R=[-F.e1[1],F.e1[0]],B=F.e1,loc=(x,z)=>{const dx=x-F.M[0],dz=z-F.M[1];return[dx*R[0]+dz*R[1],dx*B[0]+dz*B[1]];};
  const inP=(x,z,m=0)=>{const [a,c]=loc(x,z);return Math.abs(a)<2.45+m&&Math.abs(c)<2.15+m;};
  // anything else drawn over the plinth from 1.2 to 9 m up (the old box monument's pedestal and figure stood there to 12.6 m)
  const who=new Set();let n=0;const g0=T.GY(F.M[0],F.M[1]);
  T.wg.traverse(o=>{if(!o.isMesh)return;let q=o;while(q&&q!==L.group)q=q.parent;if(q===L.group)return;
    if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,Mt);v.setFromMatrixPosition(Mt).applyMatrix4(o.matrixWorld);if(inP(v.x,v.z,-.3)&&v.y>g0+1.2&&v.y<g0+9){n++;who.add('inst:'+o.material.color.getHexString());}}return;}
    const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(o.matrixWorld);if(Math.hypot(s.center.x-F.M[0],s.center.z-F.M[1])>s.radius+6)return;
    const pa=g.attributes.position;for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);if(inP(v.x,v.z,-.3)&&v.y>g0+1.2&&v.y<g0+9){n++;who.add(o.name||o.material.type);}}});
  const walk=(a,bq)=>{let[x,z]=F.at(...a);const[tx,tz]=F.at(...bq);for(let i=0;i<2000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
      const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return F.uv(x,z).map(k=>+k.toFixed(2));};
  // walks in (u,v); the plinth spans u -2.15..2.15, v -2.45..2.45
  const into=[walk([-8,0],[0,0]),walk([8,0],[0,0]),walk([0,-8],[0,0]),walk([0,8],[0,0])];
  const past=[walk([-12,-3.4],[12,-3.4]),walk([-12,3.4],[12,3.4]),walk([-3,-10],[-3,10]),walk([3,-10],[3,10])];
  const S=T.sq,inBed=(x,z)=>L.beds.some(([u0,u1,v0,v1])=>{const [u,w]=F.uv(x,z);return u>u0&&u<u1&&w>v0&&w<v1;});
  const benches=(W.benches||[]).filter(q=>inP(q[0],q[1],.5)||inBed(q[0],q[1])).length;
  // trees standing on the plinth (trees2 instances near the monument)
  let trees=0;T.wg.traverse(o=>{if(!o.isInstancedMesh||!/tree|trunk/i.test(o.name||''))return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,Mt);v.setFromMatrixPosition(Mt);if(inP(v.x,v.z,.3))trees++;}});
  // paving and beds stay 5 m (less half a cell) from the walls of the buildings other agents are rebuilding
  let near=0;const keep=T.FX.recs.filter(q=>L.keep.includes(q.id));
  for(const m of[L.pave,L.ngsPlaza,...L.bedMeshes]){if(!m)continue;const pa=m.geometry.attributes.position;
    for(let i=0;i<pa.count;i+=3){const x=pa.getX(i),z=pa.getZ(i);for(const r of keep){const P=r.pts;for(let k=0;k<P.length;k++){const a=P[k],c=P[(k+1)%P.length],dx=c[0]-a[0],dz=c[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
      if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<4.4){near++;break;}}}}}
  // what is seen from above on the squares: our surfaces win over the ground meshes under them
  const ms=[];T.wg.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)ms.push(o);});
  const top=(x,z)=>{const rc=new T.THREE.Raycaster(new V3(x,T.GY(x,z)+3,z),new V3(0,-1,0));const h=rc.intersectObjects(ms,false)[0];return h?h.object:null;};
  const pc=F.at(-10,10),nc=[-322,-278],bc=F.at(-10,32);
  // the outstretched right arm: vertices 6.8 to 8 m up and more than 0.9 m off the monument's axis are the forearm and hand;
  // the principal direction of those on the hand's side must point at Swedbank (Dominikonų g. 2A), the owner's request
  const arm=[];L.group.traverse(o=>{if(!o.isMesh)return;const pa=o.geometry.attributes.position;for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);
    const d=Math.hypot(v.x-F.M[0],v.z-F.M[1]);if(v.y>g0+6.8&&v.y<g0+8&&d>.9)arm.push([v.x,v.z,d]);}});
  let armErr=null;if(arm.length){const far=arm.reduce((a,b)=>b[2]>a[2]?b:a),fa=Math.atan2(far[1]-F.M[1],far[0]-F.M[0]);
    const pts=arm.filter(q=>Math.cos(Math.atan2(q[1]-F.M[1],q[0]-F.M[0])-fa)>.7),c=[0,0];for(const q of pts){c[0]+=q[0]/pts.length;c[1]+=q[1]/pts.length;}
    // principal axis of the forearm and hand points (2D), turned towards the hand
    let sxx=0,sxz=0,szz=0;for(const q of pts){const a=q[0]-c[0],b=q[1]-c[1];sxx+=a*a;sxz+=a*b;szz+=b*b;}
    let a1=.5*Math.atan2(2*sxz,sxx-szz);if(Math.cos(a1-Math.atan2(far[1]-c[1],far[0]-c[0]))<0)a1+=Math.PI;
    const sb=T.LL(55.3808209,23.1160864),a2=Math.atan2(sb[1]-c[1],sb[0]-c[0]);
    armErr=+(Math.abs(Math.atan2(Math.sin(a1-a2),Math.cos(a1-a2)))*180/Math.PI).toFixed(1);}
  return{armErr,armN:arm.length,tris,lambert,lmIn,removed:L.removed,other:n,who:[...who].slice(0,8),into,past,lawns:S.lawns.length,benches,trees,near,
    paveTop:top(...pc)===L.pave,ngsTop:top(...nc)===L.ngsPlaza,bedTop:L.bedMeshes.includes(top(...bc)),walls:L.walls.length};});
if(r.noFrame){check('step present and model loaded',false,r);}else{
check('model loaded, Lambert, landmark set',r.tris>1000&&r.tris<9000&&r.lambert&&r.lmIn,{tris:r.tris,lambert:r.lambert,lmIn:r.lmIn});
check('the right arm points at Swedbank (within 5 degrees)',r.armErr!==null&&r.armErr<5,{deg:r.armErr,verts:r.armN});
check('old box monument removed, nothing else drawn over the plinth',r.removed===2&&r.other===0,{removed:r.removed,verts:r.other,who:r.who});
check('walking into the monument stops at the plinth from all four sides',r.into[0][0]<-2.4&&r.into[1][0]>2.4&&r.into[2][1]<-2.7&&r.into[3][1]>2.7,r.into);
check('walking past the plinth on the paving is not blocked (the old 7.5 m walls are gone)',r.past[0][0]>11.9&&r.past[1][0]>11.9&&r.past[2][1]>9.9&&r.past[3][1]>9.9,r.past);
check('six real lawns; no bench on the plinth or in a bed; no tree on the plinth',r.lawns===6&&r.benches===0&&r.trees===0,{lawns:r.lawns,benches:r.benches,trees:r.trees});
check('paving, beds and the slab plaza are the visible surface',r.paveTop&&r.ngsTop&&r.bedTop,{pave:r.paveTop,ngs:r.ngsTop,bed:r.bedTop});
check('nothing laid within 5 m of the buildings being rebuilt',r.near===0,r.near);}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
