// lmshops: the Lidl (c8100) and the IKI (c2181) drawn from Blender models; the code-built boxes and facade details gone; both shops
// solid; the Lidl's canopy posts solid and off the roads; the doors reachable from the car parks; names prefixed and unique.
// node test_lmshops.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
{const a=h.indexOf('// ---------- lmshops:'),b=h.indexOf('// ----------',a+10),js=h.slice(a,b);
  const names=[...js.matchAll(/^(?:const |let |function )([A-Za-z_$][\w$]*)/gm)].map(m=>m[1]);
  const bad=names.filter(n=>!/^(LSH|lsh)/.test(n)),dup=names.filter(n=>h.split(new RegExp(`(?:const |let |function )${n}[=(]`)).length!==2);
  check('top-level names prefixed LSH/lsh and declared once in the page',a>0&&names.length>3&&!bad.length&&!dup.length,{names,bad,dup});}
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get LSH(){return typeof LSH==='undefined'?null:LSH},
  get GY(){return GY},get collideCar(){return collideCar},get p2Road(){return p2Road},THREE};`;
fs.writeFileSync(dir+'_lsh.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_lsh.html',{timeout:300000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});
await p.waitForFunction(()=>__t.LSH&&__t.LSH.b.every(L=>L.loaded),null,{timeout:120000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,S=T.LSH;if(!S)return{none:true};const out={};
  const inPoly=(x,z,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
  for(const L of S.b){const at=(x,y)=>[L.o[0]+L.U[0]*x+L.N[0]*y,L.o[1]+L.U[1]*x+L.N[1]*y],loc=(x,z)=>{const dx=x-L.o[0],dz=z-L.o[1];return[dx*L.U[0]+dz*L.U[1],dx*L.N[0]+dz*L.N[1]];};
    if(!L.loaded){out[L.k]={loaded:false};continue;}
    let tris=0,meshes=0,lambert=true,glow=0;L.group.traverse(q=>{if(q.isMesh){meshes++;tris+=(q.geometry.index?q.geometry.index.count:q.geometry.attributes.position.count)/3;
      lambert=lambert&&q.material.type==='MeshLambertMaterial';if(q.material.onBeforeCompile&&String(q.material.onBeforeCompile).includes('uNight'))glow++;}});
    // anything else drawn over the footprint (0.6 m in from its edge), 0.6 to 11 m above the ground: the old box, facade details
    const P=L.pts,c=at(15,15),cv=new T.THREE.Vector3(c[0],L.y0,c[1]),V=new T.THREE.Vector3(),who=new Set();let n=0;
    const inside=(x,z)=>inPoly(x,z,P)&&[[.6,0],[-.6,0],[0,.6],[0,-.6]].every(([a,b])=>inPoly(x+a,z+b,P));
    T.wg.traverse(q=>{if(!q.isMesh)return;let a=q.parent;while(a&&a!==L.group)a=a.parent;if(a===L.group)return;
      const g=q.geometry;if(!g.attributes||!g.attributes.position)return;if(!g.boundingSphere)g.computeBoundingSphere();
      const look=m=>{const s=g.boundingSphere.clone().applyMatrix4(m);if(s.center.distanceTo(cv)>s.radius+70)return;
        const pa=g.attributes.position;for(let i=0;i<pa.count;i++){V.fromBufferAttribute(pa,i).applyMatrix4(m);const gy=T.GY(V.x,V.z);
          if(V.y>gy+.6&&V.y<gy+11&&inside(V.x,V.z)){n++;const[u,v]=loc(V.x,V.z);who.add((q.name||q.material.type)+'@'+u.toFixed(0)+','+v.toFixed(0)+','+(V.y-gy).toFixed(1));}}};
      if(q.isInstancedMesh){const M=new T.THREE.Matrix4();for(let i=0;i<q.count;i++){q.getMatrixAt(i,M);look(M.premultiply(q.matrixWorld));}}else look(q.matrixWorld);});
    const walk=(a,bq)=>{let[x,z]=at(...a);const[tx,tz]=at(...bq);for(let i=0;i<4000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
        const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(k=>+k.toFixed(2));};
    const props=S.props.filter(q=>{const[u,v]=loc(q.x,q.z);return u>-10&&u<60&&v>-10&&v<70;});
    out[L.k]={loaded:true,tris,meshes,lambert,glow,lm:!!W.landmarks[L.k],other:n,who:[...who].slice(0,10),
      push:props.filter(q=>{const o=T.collideCar(q.x+.1,q.z+.05,.35,null);return Math.hypot(o.x-q.x,o.z-q.z)<q.r+.3;}).length,nprops:props.length,
      onRoad:props.map(q=>T.p2Road(q.x,q.z,true).d-q.r).reduce((a,b)=>Math.min(a,b),1e9),
      walks:L.k==='lidl'?{front:walk([20,-12],[20,10]),side:walk([60,25],[30,25]),door:walk([62,7],[30,7]),pave:walk([1.2,-1],[38,-1]),under:walk([42.5,-3],[42.5,16])}
        :{front:walk([8,-14],[8,10]),door:walk([12.1,-14],[12.1,5]),east:walk([-12,10],[10,10]),pave:walk([-1,-1],[26,-1])}};}
  return out;});
if(r.none)check('step present',false,r);else{
const L=r.lidl,I=r.iki;
for(const[k,q]of[['lidl',L],['iki',I]])check(`${k}: model loaded, Lambert, lit glass and name`,q.loaded&&q.meshes>0&&q.tris>1000&&q.lambert&&q.glow>=1&&q.lm,q.loaded?{meshes:q.meshes,tris:q.tris,lambert:q.lambert,glow:q.glow,landmark:q.lm}:q);
if(L.loaded&&I.loaded){
for(const[k,q]of[['lidl',L],['iki',I]])check(`${k}: nothing else drawn over the footprint (code-built box, facade details)`,q.other===0,{verts:q.other,who:q.who});
check('lidl: walking into the store is blocked (front and car park face)',L.walks.front[1]<-.2&&L.walks.side[0]>39.9,{front:L.walks.front,side:L.walks.side});
check('lidl: from the car park under the canopy to the entrance glass',L.walks.door[0]<40.4&&L.walks.door[0]>39.9,L.walks.door);
check('lidl: the pavement along the glass and the walk under the canopy are not blocked',L.walks.pave[0]>37.9&&L.walks.under[1]>15.9,{pave:L.walks.pave,under:L.walks.under});
check('lidl: the canopy posts are solid and off the roads',L.nprops===2&&L.push===0&&L.onRoad>0,{props:L.nprops,notPushing:L.push,road:+L.onRoad.toFixed(2)});
check('iki: walking into the shop is blocked (front and east end)',I.walks.front[1]<-.2&&I.walks.east[0]<-.2,{front:I.walks.front,east:I.walks.east});
check('iki: from the car park to the doors, and along the front',I.walks.door[1]<-.2&&I.walks.door[1]>-.5&&I.walks.pave[0]>25.9,{door:I.walks.door,pave:I.walks.pave});}}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
