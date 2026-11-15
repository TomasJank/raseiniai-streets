// lmsport: the sports centre (c19) drawn from a Blender model; nothing else drawn in its outline; Kalno school (c44) and the stadium
// untouched; solid on every side; the entrance porch reachable from the paved path; the story stop "Sporto centras" at the porch and
// reachable by car from Savanoriu g.; names unique in the page.
// node test_lmsport.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const names=['const LSP=','const lspOn=','const lspNear=','function lspEdge(','function lspMine(','const lspRec=','function lspFrame(','function lspMat(','function lspBuild('];
check('step names defined once in the page',names.every(n=>h.split(n).length===2),names.map(n=>h.split(n).length-1));
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get LSP(){return typeof LSP==='undefined'?null:LSP},get storyPts(){return storyPts},get GY(){return GY},get collideCar(){return collideCar},pip,lspEdge,LL,STAD,THREE,FX};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html',{timeout:0});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:600000});
await p.waitForFunction(()=>__t.LSP&&__t.LSP.loaded,null,{timeout:180000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,B=T.LSP,V=new T.THREE.Vector3(),M=new T.THREE.Matrix4();if(!B)return{noStep:true};
  const F=B.F;if(!F||!B.loaded)return{noFrame:true};
  const loc=(x,z)=>{const dx=x-F.o[0],dz=z-F.o[1];return[dx*F.R[0]+dz*F.R[1],dx*F.V[0]+dz*F.V[1]];};
  let tris=0,lambert=true,glow=0;B.group.traverse(q=>{if(q.isMesh){tris+=(q.geometry.index?q.geometry.index.count:q.geometry.attributes.position.count)/3;
    lambert=lambert&&q.material.type==='MeshLambertMaterial';if(q.material.onBeforeCompile&&String(q.material.onBeforeCompile).includes('uNight'))glow++;}});
  const school=T.FX.recs.find(q=>q.id==='c44').pts;
  const segD=(x,z,P)=>{let d=1e9;for(let i=0;i<P.length;i++){const a=P[i],c=P[(i+1)%P.length],dx=c[0]-a[0],dz=c[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
    d=Math.min(d,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return d;};
  // anything else drawn inside the outline or within 2.5 m of it, 2.2 m above the ground up to 6 m above the roof (the school's own
  // wall and eaves, which share the outline's west edge, are left out); meshes vertex by vertex, instanced meshes by instance
  let root=T.wg;while(root.parent)root=root.parent;const who=new Set();let n=0,inSchool=0;
  const hit=(x,y,z,name)=>{const g=T.GY(x,z);if(y<g+2.2||y>F.y0+B.h+6)return;
    if(T.pip(x,z,school)||segD(x,z,school)<1.5){if(T.pip(x,z,school))inSchool++;return;}
    if(T.pip(x,z,B.poly)||T.lspEdge(x,z)<2.5){n++;if(who.size<12)who.add(name+'@'+loc(x,z).map(v=>v.toFixed(0))+','+(y-g).toFixed(0));}};
  root.traverse(q=>{if(!q.isMesh||!q.geometry||!q.geometry.attributes.position)return;let a=q.parent;while(a&&a!==B.group)a=a.parent;if(a===B.group)return;
    if(q.isInstancedMesh){for(let i=0;i<q.count;i++){q.getMatrixAt(i,M);V.setFromMatrixPosition(M).applyMatrix4(q.matrixWorld);hit(V.x,V.y,V.z,(q.name||'inst'));}return;}
    const g=q.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(q.matrixWorld);
    if(Math.hypot(s.center.x-B.at[0],s.center.z-B.at[1])>s.radius+120)return;
    const pa=g.attributes.position;for(let i=0;i<pa.count;i++){V.fromBufferAttribute(pa,i).applyMatrix4(q.matrixWorld);hit(V.x,V.y,V.z,q.name||q.material.type);}});
  // the stadium (buildStadium: track, stands, fence on the OSM outline) at least 5 m from the outline and from the model's walls
  const ring=T.STAD.poly.map(([la,lo])=>T.LL(la,lo));
  const stad=Math.min(...ring.map(q=>segD(q[0],q[1],B.poly)),...ring.flatMap(q=>B.walls.map(w=>segD(q[0],q[1],[[w[0],w[1]],[w[2],w[3]]]))));
  const walk=(a,c,rad=.35)=>{let[x,z]=F.at(...a);const[tx,tz]=F.at(...c);for(let i=0;i<4000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
    const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,rad,null);x=q.x;z=q.z;}return loc(x,z).map(k=>+k.toFixed(2));};
  const sp=T.storyPts.sale,stop=sp&&loc(sp.x,sp.z).map(v=>+v.toFixed(2)),pers=sp&&loc(sp.px,sp.pz).map(v=>+v.toFixed(2));
  return{tris,lambert,glow,other:n,who:[...who],inSchool,skipped:B.skipped,stad:+stad.toFixed(1),stop,pers,
    ne:walk([7,-6],[7,3]),nw:walk([-6,20],[3,20]),se:walk([34,30],[20,30]),sw:walk([15,80],[15,62]),porchSide:walk([1.3,-6],[1.3,3]),
    door:walk(B.stop,[3,B.door[1]]),car:walk([-7,-23],B.stop,1.0),carBack:walk(B.stop,[-7,-23],1.0)};});
if(r.noStep)check('step present',false,r);else if(r.noFrame)check('model placed and loaded',false,r);else{
  check('model loaded, Lambert, lit windows',r.tris>1500&&r.lambert&&r.glow>=1,{tris:r.tris,lambert:r.lambert,glow:r.glow});
  check('nothing else drawn inside or beside the outline',r.other===0&&r.skipped>=1,{verts:r.other,who:r.who,skipped:r.skipped});
  check('Kalno school still drawn',r.inSchool>20,{schoolVerts:r.inSchool});
  check('stadium 5 m or more from the outline and the step walls',r.stad>=5,{metres:r.stad});
  check('blocked from every side',r.ne[1]<-.3&&r.nw[0]<-.3&&r.se[0]>26.4&&r.sw[1]>69.5,{ne:r.ne,nw:r.nw,se:r.se,sw:r.sw});
  check('walk from the paved path to the entrance door',r.door[0]>-.5&&Math.abs(r.door[1]-1.4)<.2,r.door);
  check('story stop at the entrance, the person at the door',!!r.stop&&Math.hypot(r.stop[0]+7,r.stop[1]-1.4)<.1&&Math.hypot(r.pers[0]+.8,r.pers[1]-1.4)<.1,{stop:r.stop,person:r.pers});
  check('a car (r 1 m) drives from Savanoriu g. to the stop and back',Math.hypot(r.car[0]+7,r.car[1]-1.4)<.2&&Math.hypot(r.carBack[0]+7,r.carBack[1]+23)<.2,{car:r.car,back:r.carBack});}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
