// lmvil3: Vilniaus g. c2467 and c1525 drawn from Blender models, the generated houses and the facades step's chimneys gone, both solid.
// node test_lmvil3.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
// run it from a scratch copy: it writes _x.html next to itself
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get FX(){return FX},get VL3(){return typeof VL3==='undefined'?null:VL3},get collideCar(){return collideCar},THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html',{timeout:300000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});
await p.waitForFunction(()=>__t.VL3&&__t.VL3.every(v=>v.loaded),null,{timeout:120000}).catch(()=>{});
const SIZE={c2467:[13.75,9.74],c1525:[13.77,10.8]};
const r=await p.evaluate(SIZE=>{const T=__t,out={};
  for(const v of T.VL3){
    const rec=T.FX.recs.find(q=>q.id===v.id),P=rec.pts,o=P[v.o],e=P[v.e],l=Math.hypot(e[0]-o[0],e[1]-o[1]),R=[(e[0]-o[0])/l,(e[1]-o[1])/l],N=[R[1],-R[0]],y0=rec.specs[0][1].y0;
    const at=(x,y)=>[o[0]+R[0]*x+N[0]*y,o[1]+R[1]*x+N[1]*y],loc=(x,z)=>{const dx=x-o[0],dz=z-o[1];return[dx*R[0]+dz*R[1],dx*N[0]+dz*N[1]];};
    const[FW,FD]=SIZE[v.id];let tris=0,meshes=0,lambert=true,glow=0;
    if(v.group)v.group.traverse(q=>{if(q.isMesh){meshes++;tris+=(q.geometry.index?q.geometry.index.count:q.geometry.attributes.position.count)/3;
      lambert=lambert&&q.material.type==='MeshLambertMaterial';if(q.material.onBeforeCompile&&String(q.material.onBeforeCompile).includes('uNight'))glow++;}});
    const inside=(x,z)=>{const[u,w]=loc(x,z);return u>.8&&u<FW-.8&&w>.8&&w<FD-.8;};
    const V3=T.THREE.Vector3,c=at(FW/2,FD/2),cv=new V3(c[0],y0,c[1]),vv=new V3();let other=0;const who=new Set();
    T.wg.traverse(q=>{if(!q.isMesh)return;let a=q.parent;while(a&&a!==v.group)a=a.parent;if(a===v.group)return;
      if(q.isInstancedMesh){const m=new T.THREE.Matrix4();for(let i=0;i<q.count;i++){q.getMatrixAt(i,m);vv.setFromMatrixPosition(m).applyMatrix4(q.matrixWorld);
          if(vv.y>y0+1.5&&inside(vv.x,vv.z)){other++;who.add(q.name);}}return;}
      const g=q.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(q.matrixWorld);if(s.center.distanceTo(cv)>s.radius+14)return;
      const pa=g.attributes.position;for(let i=0;i<pa.count;i++){vv.fromBufferAttribute(pa,i).applyMatrix4(q.matrixWorld);if(vv.y>y0+2&&inside(vv.x,vv.z)){other++;who.add(q.name||q.material.type);}}});
    // walking: 5 cm steps against the game's own collision, radius of a person; from outside each wall straight at the house
    const walk=(a,bq)=>{let[x,z]=at(...a);const[tx,tz]=at(...bq);for(let i=0;i<800;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
        const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(n=>+n.toFixed(2));};
    const front=walk([FW*.3,-2.2],[FW*.3,FD/2]),back=walk([FW*.6,FD+2.2],[FW*.6,FD/2]),west=walk([-2.2,FD*.5],[FW/2,FD*.5]),east=walk([FW+2.2,FD*.4],[FW/2,FD*.4]);
    out[v.id]={tris,meshes,lambert,glow,other,who:[...who],front,back,west,east,FW,FD,loaded:!!v.loaded,asset:v.asset};}
  return out;},SIZE);
for(const[id,q]of Object.entries(r)){
  check(id+' model loaded, Lambert, glow windows',q.loaded&&q.meshes>0&&q.tris>800&&q.lambert&&q.glow>0,{meshes:q.meshes,tris:q.tris,lambert:q.lambert,glow:q.glow});
  check(id+' generated house and chimney not drawn',q.other===0,{vertsInside:q.other,who:q.who});
  check(id+' solid from the street side',q.front[1]<.1,q.front);
  check(id+' solid from the back',q.back[1]>q.FD-.1,q.back);
  check(id+' solid from the west and east',q.west[0]<.1&&q.east[0]>q.FW-.1,{west:q.west,east:q.east});}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
