// props2: node test_props2.mjs page.html [page2.html]   (SwiftShader; exits 1 on a failed assertion; writes _props2.html beside itself)
// page2: a second build of the same chain, which must be byte-identical
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const say=(ok,name,r)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(r));if(!ok)fails++;};
const h=fs.readFileSync(file,'utf8'),o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
if(file2)say(Buffer.compare(fs.readFileSync(file),fs.readFileSync(file2))===0,'two builds are byte-identical',{a:fs.statSync(file).size,b:fs.statSync(file2).size});
fs.writeFileSync(dir+'_props2.html',h.replace(o,`window.__t={get world(){return world},get P2(){return P2},get PROPS2(){return PROPS2},get STREET_KINDS(){return STREET_KINDS},get props(){return props},get walls(){return walls},jumpTop,get worldGroup(){return worldGroup},THREE};`+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:640,height:400}});const errs=[];
p.on('pageerror',e=>errs.push(e.stack.split('\n').slice(0,4).join(' | ')));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300));});
await p.goto('file://'+dir+'_props2.html',{timeout:180000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:240000}).catch(e=>{console.log('FAIL page did not start',errs.slice(0,5));process.exit(1);});
// models decode asynchronously; wait until every props2 mesh has its geometry
await p.waitForFunction(()=>{let n=0,ok=0;__t.worldGroup.traverse(m=>{if(m.userData.props2){n++;if(m.geometry.attributes.position)ok++;}});return n&&n===ok;},null,{timeout:60000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,P2=T.P2,keys=Object.keys(T.PROPS2),meshes={},inst={};
  T.worldGroup.traverse(m=>{const k=m.userData.props2;if(!k)return;(meshes[k]||(meshes[k]=[])).push(m);inst[k]=(inst[k]||0)+(m.isInstancedMesh?m.count:1);});
  const out={};
  // every model in the table has its data block, and every mesh drawing it has loaded and is shown
  out.blocks=keys.filter(k=>!document.getElementById('asset_props2_'+k));
  out.notLoaded=Object.entries(meshes).filter(([k,l])=>l.some(m=>!m.geometry.attributes.position||!m.visible)).map(([k])=>k);
  out.unused=keys.filter(k=>!inst[k]);
  // instance counts: what each mesh draws is exactly the places props2 collected for that model
  const want={};for(const{r,l}of P2.rows.values())want[r.key]=(want[r.key]||0)+l.length;
  for(const g of T.worldGroup.children)if(g.userData.props2===undefined)g.traverse(m=>{if(m.userData.props2&&!m.isInstancedMesh)want[m.userData.props2]=(want[m.userData.props2]||0)+1;});
  out.countDiff=Object.keys({...want,...inst}).filter(k=>want[k]!==inst[k]).map(k=>[k,want[k],inst[k]]);
  out.inst=inst;
  // nothing drawn twice: the street step's box meshes for model kinds are hidden, its fence boxes for model styles absent,
  // and no box-built bench seat, lamp, bin, shelter roof or stop sign pole stands within .3 m of a props2 place of that kind
  const M=new T.THREE.Matrix4(),V=new T.THREE.Vector3(),proc={'7a5a3c':'bench','3a3f42':['lamp','stopsign'],'2e4636':'bin','4a4f53':'shelter'},near=[];
  out.boxShown=[];T.worldGroup.traverse(m=>{if(m.isInstancedMesh&&P2.kinds[m.userData.street]&&m.visible)out.boxShown.push(m.userData.street);});
  T.worldGroup.traverse(m=>{if(m.isInstancedMesh&&!m.userData.props2&&!m.userData.street&&m.material.color){const c=m.material.color.getHexString(),k=[].concat(proc[c]||[]);
    if(!k.length)return;for(let i=0;i<m.count;i++){m.getMatrixAt(i,M);V.setFromMatrixPosition(M);for(const q of P2.sites)if(k.includes(q.r.kind)&&Math.hypot(q.x-V.x,q.z-V.z)<.3)near.push([q.r.kind,V.x|0,V.z|0]);}}});
  out.doubled=near;
  // collision and jump: every collider a props2 place made has the model's top, and the street step's kinds took the model's size
  let solid=0;const bad=[];
  for(const q of P2.sites){if(!q.col)continue;solid++;for(const c of q.col){const t=T.jumpTop(c);if(Math.abs(t-q.s[1])>.01)bad.push([q.r.key,+t.toFixed(2),q.s[1]]);}
    if(!q.col.length&&q.r.solid!==false)bad.push([q.r.key,'no collider']);}
  for(const k in P2.kinds){const K=T.STREET_KINDS[k];if(K&&K.s.join()!==P2.kinds[k][0].s.join())bad.push([k,'street size',K.s,P2.kinds[k][0].s]);}
  out.solidPlaces=solid;out.badTops=bad.slice(0,20);out.badN=bad.length;
  out.sites=P2.sites.length;
  return out;});
say(!r.blocks.length,'every model has its asset block',r.blocks);
say(!r.notLoaded.length,'every props2 mesh loaded and shown',r.notLoaded);
say(!r.countDiff.length,'instances drawn = places collected, per model',r.countDiff);
say(!r.boxShown.length&&!r.doubled.length,'replaced box objects are not drawn as well',{boxShown:r.boxShown,doubled:r.doubled.slice(0,10),n:r.doubled.length});
say(!r.badN,'collision tops = model heights (jump), street kinds use the model size',{solidPlaces:r.solidPlaces,bad:r.badTops,n:r.badN});
const mine=errs.filter(e=>/p2[A-Z]|props2/i.test(e)),other=[...new Set(errs.filter(e=>!mine.includes(e)))];
say(!mine.length,'no console errors from props2',mine.slice(0,5));
if(other.length)console.log('NOTE errors from other steps:',other.length,other.slice(0,3));
console.log('instances',JSON.stringify(r.inst),'sites',r.sites,'unused models',JSON.stringify(r.unused));
await b.close();
process.exit(fails?1:0);
