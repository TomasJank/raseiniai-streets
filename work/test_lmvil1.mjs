// lmvil1: Vilniaus g. houses c2910 and c2911 drawn from Blender models, generated boxes gone, footprints solid, no road or door blocked.
// node test_lmvil1.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get FX(){return FX},get LV1(){return typeof LV1==='undefined'?null:LV1},get GY(){return GY},get collideCar(){return collideCar},THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html',{timeout:300000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});
await p.waitForFunction(()=>__t.LV1&&__t.LV1.groups&&__t.LV1.groups.length===2&&__t.LV1.groups.every(g=>g.userData.loaded),null,{timeout:120000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,L=T.LV1;if(!L||!L.groups||L.groups.length!==2)return{noGroups:L&&L.groups?L.groups.length:-1};
  const V3=T.THREE.Vector3,v=new V3(),out={};
  for(const hh of L){const r=T.FX.recs.find(q=>q.id===hh.id),G=L.groups.find(g=>g.name==='lmvil1_'+hh.id);
    let tris=0,lambert=true,glow=0;G.traverse(o=>{if(o.isMesh){tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;lambert=lambert&&o.material.type==='MeshLambertMaterial';
      if(o.material.onBeforeCompile&&String(o.material.onBeforeCompile).includes('uNight'))glow++;}});
    // nothing else drawn inside the footprint above 1.5 m (the generated box, its roof)
    const P=r.pts,inside=(x,z)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){if((P[i][1]>z)!==(P[j][1]>z)&&x<(P[j][0]-P[i][0])*(z-P[i][1])/(P[j][1]-P[i][1])+P[i][0])c=!c;}return c;};
    let n=0;const who=new Set();T.wg.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;let q=o.parent;while(q&&q!==G)q=q.parent;if(q===G)return;
      const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(o.matrixWorld);if(Math.hypot(s.center.x-hh.c[0],s.center.z-hh.c[1])>s.radius+25)return;
      const pa=g.attributes.position;for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);
        if(inside(v.x,v.z)&&v.y>T.GY(v.x,v.z)+1.5&&v.y<T.GY(v.x,v.z)+14){n++;who.add(o.name||o.material.type);}}});
    // walking at the walls from the street side stops at the footprint
    const l=Math.hypot(hh.r[0]-hh.o[0],hh.r[1]-hh.o[1]),R=[(hh.r[0]-hh.o[0])/l,(hh.r[1]-hh.o[1])/l],N=[R[1],-R[0]];
    const at=(x,y)=>[hh.o[0]+R[0]*x+N[0]*y,hh.o[1]+R[1]*x+N[1]*y];
    const walk=(a,bq)=>{let[x,z]=at(...a);const[tx,tz]=at(...bq);for(let i=0;i<2000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}
      const dx=x-hh.o[0],dz=z-hh.o[1];return[dx*R[0]+dz*R[1],dx*N[0]+dz*N[1]].map(k=>+k.toFixed(2));};
    out[hh.id]={tris,lambert,glow,other:n,who:[...who],front:walk([hh.id==='c2910'?5:4.5,-4],[hh.id==='c2910'?5:4.5,3]),side:walk([hh.id==='c2910'?-4:-3,3],[hh.id==='c2910'?4:3,3])};}
  return out;});
if(r.noGroups!==undefined)check('both models loaded',false,r);else for(const id of['c2910','c2911']){const q=r[id];
  check(id+' model loaded, Lambert, lit windows',q.tris>500&&q.tris<8000&&q.lambert&&q.glow>=1,{tris:q.tris,lambert:q.lambert,glow:q.glow});
  check(id+' generated box not drawn',q.other===0,{verts:q.other,who:q.who});
  check(id+' walking into the street wall is blocked, walking into the side wall is blocked',q.front[1]<-.2&&q.side[0]<-.2,{front:q.front,side:q.side});}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
