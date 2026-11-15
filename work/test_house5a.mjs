// house5a: Vyšnių g. 5A drawn from the Blender model, the code-built house gone, house/fence/hedge/bay solid, the gateway open.
// node test_house5a.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get FX(){return FX},get H5A(){return typeof H5A==='undefined'?null:H5A},get GY(){return GY},get collideCar(){return collideCar},get ENV(){return ENV},THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});
await p.waitForFunction(()=>__t.H5A&&__t.H5A.loaded,null,{timeout:60000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,H=T.H5A,F=H&&H.F;if(!F)return{noFrame:true,step:!!H};
  const at=F.at,loc=(x,z)=>{const dx=x-F.p1[0],dz=z-F.p1[1];return[dx*F.R[0]+dz*F.R[1],dx*F.N[0]+dz*F.N[1]];};
  // the model
  let tris=0,meshes=0,lambert=true,glow=0;H.group.traverse(o=>{if(o.isMesh){meshes++;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;
    lambert=lambert&&o.material.type==='MeshLambertMaterial';if(o.material.onBeforeCompile&&String(o.material.onBeforeCompile).includes('uNight'))glow++;}});
  const inst={};T.wg.traverse(o=>{if(o.isInstancedMesh&&/^house5a_/.test(o.name))inst[o.name]=o.count;});
  // nothing else drawn inside the footprint above head height: the code-built house's walls and roof would be
  const rec=T.FX.recs.find(q=>q.id==='c1583'),P=rec.pts,y0=rec.specs[0][1].y0,inside=(x,z)=>{const[u,v]=loc(x,z);return u>.6&&u<12.24-.6&&v>.6&&v<12.31-.6;};
  const V3=T.THREE.Vector3,c=at(6.1,6.1),cv=new V3(c[0],y0,c[1]),v=new V3();let other=0;const who=new Set();
  T.wg.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;let q=o.parent;while(q&&q!==H.group)q=q.parent;if(q===H.group)return;
    const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(o.matrixWorld);if(s.center.distanceTo(cv)>s.radius+12)return;
    const pa=g.attributes.position;for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);if(v.y>y0+2&&inside(v.x,v.z)){other++;who.add(o.name||o.material.type);}}});
  // walking: 5 cm steps against the game's own collision (house walls, props, walls), radius of a person
  const walk=(a,bq)=>{let[x,z]=at(...a);const[tx,tz]=at(...bq);for(let i=0;i<600;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
      const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(n=>+n.toFixed(2));};
  const yardSegs=(W.hedgeSegs||[]).filter(s=>{const a=loc(s[0],s[1]);return a[0]>-6.5&&a[0]<17&&a[1]>-3.6&&a[1]<-.8;}).length;
  const gaps=(W.gaps||[]).filter(g=>{const a=loc(g[0],g[1]);return a[0]>-6.5&&a[0]<17&&a[1]>-4&&a[1]<25;}).length;
  return{tris,meshes,lambert,glow,inst,other,who:[...who],walls:H.walls.length,yardSegs,gaps,
    house:walk([9.5,-2.1],[9.5,4]),fence:walk([10,-5.5],[10,-1]),fenceL:walk([-6.6,-5.5],[-6.6,-1]),hedge:walk([-3.6,-2.05],[1,-2.05]),
    bay:walk([5.75,-2.3],[5.75,.5]),gate:walk([-3.8,-5.5],[-3.8,3]),drive:walk([-3.8,-5.5],[-2.7,14])};});
if(r.noFrame){check('step present and frame found',false,r);}else{
check('model loaded, Lambert, glow windows',r.meshes>0&&r.tris>2000&&r.lambert&&r.glow>0,{meshes:r.meshes,tris:r.tris,lambert:r.lambert,glow:r.glow});
check('fence, gate and drive drawn',r.inst.house5a_f_post>=8&&r.inst.house5a_f_bay>=7&&r.inst.house5a_f_gate===2,r.inst);
check('code-built house not drawn',r.other===0,{vertsInside:r.other,who:r.who});
check('generated yard fence and gap gone from the plot',r.yardSegs===0&&r.gaps===0,{yardSegs:r.yardSegs,gaps:r.gaps});
check('walking into the house is blocked',r.house[1]<-.2,r.house);
check('walking into the fence is blocked',r.fence[1]<-2.9&&r.fenceL[1]<-2.9,{right:r.fence,left:r.fenceL});
check('walking into the hedge is blocked',r.hedge[0]<-2.4,r.hedge);
check('walking into the bay is blocked',r.bay[1]<-1.2,r.bay);
check('walking through the gateway is not blocked',r.gate[1]>2.9&&r.drive[1]>13.9,{gate:r.gate,drive:r.drive});}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
