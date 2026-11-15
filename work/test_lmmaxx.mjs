// lmmaxx: Maxima X (c3293) drawn from the Blender model, the code-built box and its tall SW wing gone, the store solid, the
// entrance doors on the front reachable from the main road, the parcel lockers and the annex beyond the footprint solid.
// node test_lmmaxx.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
for(const n of ['LMX','lmxHere','lmxFrame','lmxBuild','lmxPave','lmxPaving'])check(`top-level name ${n} defined once`,h.split(new RegExp(`(const|let|function) ${n}\\b`)).length===3,n);
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get LMX(){return typeof LMX==='undefined'?null:LMX},get GY(){return GY},get collideCar(){return collideCar},get grassMap(){return grassMap},get buildGrass(){return buildGrass},get grass(){return grass},get renderer(){return renderer},GR_S,GR_PX,THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});
await p.waitForFunction(()=>__t.LMX&&__t.LMX.loaded,null,{timeout:120000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,H=T.LMX,F=H&&H.F;if(!F||!H.loaded)return{noFrame:true,step:!!H};
  const at=F.at,loc=(x,z)=>{const dx=x-F.o[0],dz=z-F.o[1];return[dx*F.R[0]+dz*F.R[1],dx*F.N[0]+dz*F.N[1]];};
  let tris=0,meshes=0,lambert=true,glow=0;H.group.traverse(o=>{if(o.isMesh){meshes++;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;
    lambert=lambert&&o.material.type==='MeshLambertMaterial';if(o.material.onBeforeCompile&&String(o.material.onBeforeCompile).includes('uNight'))glow++;}});
  // anything else drawn inside the footprint and the annex strip (the old box, its wing), 1 to 9.5 m above the ground
  const mine=(u,b)=>(u>.3&&u<20.9&&b>.3&&b<15.7)||(u>.3&&u<14.7&&b>=15.7&&b<17.3);
  const V3=T.THREE.Vector3,v=new V3(),c=at(10,8),cv=new V3(c[0],F.y0,c[1]),who=new Set();let n=0;
  T.wg.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;let q=o.parent;while(q&&q!==H.group)q=q.parent;if(q===H.group)return;
    const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(o.matrixWorld);if(s.center.distanceTo(cv)>s.radius+30)return;
    // triangle centroids, not vertices: the old box's corners sit on the footprint outline, its roof and the wing's inner wall do not
    const pa=g.attributes.position,ix=g.index,nt=ix?ix.count/3:pa.count/3,w=new V3(),x=new V3(),id=k=>ix?ix.getX(k):k;
    for(let t=0;t<nt;t++){v.fromBufferAttribute(pa,id(3*t));w.fromBufferAttribute(pa,id(3*t+1));x.fromBufferAttribute(pa,id(3*t+2));
      v.add(w).add(x).multiplyScalar(1/3).applyMatrix4(o.matrixWorld);const[u,b]=loc(v.x,v.z),gy=T.GY(v.x,v.z);
      if(mine(u,b)&&v.y>gy+1&&v.y<gy+9.5){n++;who.add((o.name||o.material.type)+'@'+u.toFixed(0)+','+b.toFixed(0)+','+(v.y-gy).toFixed(0));}}});
  const walk=(a,bq)=>{let[x,z]=at(...a);const[tx,tz]=at(...bq);for(let i=0;i<2000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
      const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(k=>+k.toFixed(2));};
  // grass tufts grow where the top-down grass map reads ground (green channel 1); sample the paved cells in it
  if(!T.grass)T.buildGrass();const c0=at(12,6);T.grassMap(c0[0],c0[1]);const G=T.grass,PX=T.GR_PX,S=T.GR_S,buf=new Uint16Array(PX*PX*4);
  T.renderer.readRenderTargetPixels(G.rt,0,0,PX,PX,buf);const cells=H.cells||[];let tuft=0,seen=0;const tw=[];
  for(let i=0;i<cells.length;i+=3){const[x,z]=cells[i],px=Math.floor(((x-c0[0])/S+.5)*PX),py=Math.floor(((c0[1]-z)/S+.5)*PX);
    if(px<0||py<0||px>=PX||py>=PX)continue;seen++;if(buf[(py*PX+px)*4+1]>=0x3800){tuft++;if(tw.length<5)tw.push(loc(x,z).map(k=>+k.toFixed(1)));}}
  return{cells:cells.length,seen,tuft,tw,paved:!!H.paveMesh,tris,meshes,lambert,glow,other:n,who:[...who].slice(0,12),walls:H.walls.length,
    label:(W.labels||[]).some(l=>l.text==='Maxima X'),
    front:walk([5,-6],[5,6]),sw:walk([26,8],[16,8]),ne:walk([-5,8],[5,8]),doors:walk([18.6,-8],[18.6,.5]),
    locker:walk([10.5,-5],[10.5,0]),along:walk([4,-1.4],[16,-1.4]),annexB:walk([18,22],[18,15]),bollard:walk([9.7,22],[9.7,15])};});
if(r.noFrame){check('step present and model loaded',false,r);}else{
check('model loaded, Lambert, lit windows and band',r.meshes>0&&r.tris>1000&&r.lambert&&r.glow>=2,{meshes:r.meshes,tris:r.tris,lambert:r.lambert,glow:r.glow});
check('code-built box and its wing not drawn',r.other===0,{tris:r.other,who:r.who});
check('front, west side and yard paved, no grass tuft inside the paving',r.paved&&r.cells>1500&&r.seen>500&&r.tuft===0,{cells:r.cells,sampled:r.seen,tufts:r.tuft,at:r.tw});
check('name label kept',r.label,r.label);
check('walking into the store is blocked (front, SW, NE)',r.front[1]<-.2&&r.sw[0]>21.4&&r.ne[0]<-.2,{front:r.front,sw:r.sw,ne:r.ne});
check('walking from the main road to the entrance doors is not blocked',Math.abs(r.doors[0]-18.6)<.3&&r.doors[1]>-.5,r.doors);
check('parcel lockers are solid, the pavement in front of them is open',r.locker[1]<-.95&&r.along[0]>15.9,{locker:r.locker,along:r.along});
check('annex beyond the footprint step and the bollards are solid',r.annexB[1]>17.1&&r.bollard[1]>18.3,{annexB:r.annexB,bollard:r.bollard});}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
