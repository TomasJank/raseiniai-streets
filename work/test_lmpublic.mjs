// lmpublic: the police station (c2158) drawn from a Blender model, the code-built box gone, the streets step's "POLICIJA" sign
// replaced by the model's; the station solid, its doors reachable from Maironio g., flagpoles and ramp rail solid and off the roads;
// the name label (delivery target) kept with a road node near it; the health centre (c170, not modelled) still drawn and labelled.
// node test_lmpublic.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const names=['LPU','lpuOn','lpuHere','lpuFrame','lpuBuild'].map(n=>[n,(h.match(new RegExp('(?:const|let|function) '+n+'\\b','g'))||[]).length]);
check('top-level names defined once',names.every(([,c])=>c===1),names);
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get LPU(){return typeof LPU==='undefined'?null:LPU},get GY(){return GY},get collideCar(){return collideCar},pip,THREE,
  get FX(){return FX},get STREETS(){return STREETS},nearestNode:(...a)=>nearestNode(...a),shortName:s=>shortName(s)};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html',{timeout:0});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:600000});
await p.waitForFunction(()=>__t.LPU&&__t.LPU.loaded,null,{timeout:180000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,B=T.LPU,V=new T.THREE.Vector3(),M=new T.THREE.Matrix4(),out={};if(!B)return{noStep:true};
  // anything drawn inside an outline from 2.2 m above the ground to `top` (meshes vertex by vertex, instanced meshes by instance), skipping `skip`
  const drawn=(poly,top,skip)=>{const c=poly[0],who=new Set();let n=0;
    const hit=(x,y,z,name)=>{const g=T.GY(x,z);if(T.pip(x,z,poly)&&y>g+2.2&&y<top){n++;if(who.size<10)who.add(name);}};
    T.wg.traverse(q=>{if(!q.isMesh)return;let a=q.parent;while(a&&a!==skip)a=a.parent;if(skip&&a===skip)return;
      const g=q.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(q.matrixWorld);
      if(Math.hypot(s.center.x-c[0],s.center.z-c[1])>s.radius+90)return;
      if(q.isInstancedMesh){for(let i=0;i<q.count;i++){q.getMatrixAt(i,M);V.setFromMatrixPosition(M).applyMatrix4(q.matrixWorld);hit(V.x,V.y,V.z,q.name||'inst');}return;}
      const pa=g.attributes.position;for(let i=0;i<pa.count;i++){V.fromBufferAttribute(pa,i).applyMatrix4(q.matrixWorld);hit(V.x,V.y,V.z,q.name||q.material.type);}});
    return{n,who:[...who]};};
  const F=B.F;
  if(F&&B.loaded){
    const loc=(x,z)=>{const dx=x-F.o[0],dz=z-F.o[1];return[dx*F.R[0]+dz*F.R[1],dx*F.N[0]+dz*F.N[1]];};
    let tris=0,lambert=true,glow=0;B.group.traverse(q=>{if(q.isMesh){tris+=(q.geometry.index?q.geometry.index.count:q.geometry.attributes.position.count)/3;
      lambert=lambert&&q.material.type==='MeshLambertMaterial';if(q.material.onBeforeCompile&&String(q.material.onBeforeCompile).includes('uNight'))glow++;}});
    const walk=(a,c)=>{let[x,z]=F.at(...a);const[tx,tz]=F.at(...c);for(let i=0;i<3000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
      const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(k=>+k.toFixed(2));};
    const near=(a,c,q)=>{let[x,z]=F.at(...a);const[tx,tz]=F.at(...c),[px,pz]=F.at(...q);let m=1e9;for(let i=0;i<600;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
      const r=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=r.x;z=r.z;m=Math.min(m,Math.hypot(x-px,z-pz));}return+m.toFixed(2);};
    const onRoad=(x,z)=>{for(const s of W.roadSegs(x,z)){const dx=s[2]-s[0],dz=s[3]-s[1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/l2));
      if(Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<s[4].w/2)return true;}return false;};
    const pts=[...B.walls.flatMap(w=>[[w[0],w[1]],[w[2],w[3]]]),...B.round.map(([x,y])=>F.at(x,y))];
    Object.assign(out,{tris,lambert,glow,other:drawn(B.poly,F.y0+B.h+6,B.group),road:pts.filter(q=>onRoad(...q)).map(q=>loc(...q).map(v=>v.toFixed(1))),walls:B.walls.length,
      front:walk([15,-8],[15,3]),sw:walk([-8,7],[5,7]),back:walk([10,30],[10,8]),ne:walk([50,20],[30,20]),
      doors:walk([B.door[0],-12],[B.door[0],.6]),rail:walk([36,-1.2],[30,-1.2]),poles:B.round.map(([x,y])=>near([x-3,y],[x+3,y],[x,y]))});
  }else out.noFrame=true;
  out.sign=T.STREETS.flatMap(S=>S.signs||[]).filter(g=>g.text==='POLICIJA').length;
  // name labels (delivery targets) and the road node a delivery to each would use
  const lab=re=>{const L=W.labels.find(l=>re.test(l.text));if(!L)return null;const n=T.nearestNode(L.x,L.z,2);
    return{name:T.shortName(L.text),node:n?+Math.hypot(n.x-L.x,n.z-L.z).toFixed(1):null,nodeFree:n?!W.inBuilding(n.x,n.z):false};};
  out.police=lab(/policijos komisariatas/);out.health=lab(/sveikatos/);
  const hr=T.FX.recs.find(q=>q.id==='c170');out.healthDrawn=hr?drawn(hr.pts,hr.specs[0][1].y0+30,null).n:-1;
  return out;});
if(r.noStep){check('step present',false,r);}else{
  if(r.noFrame)check('c2158 model placed and loaded',false,r);
  else{
    check('model loaded, Lambert, night windows and sign',r.tris>1000&&r.lambert&&r.glow>=2,{tris:r.tris,lambert:r.lambert,glow:r.glow});
    check('nothing else drawn inside the outline',r.other.n===0,r.other);
    check('step solids clear of roads',r.road.length===0&&r.walls>0,{onRoad:r.road,walls:r.walls});
    check('station blocked from Maironio g., the SW lane and both car parks',r.front[1]<-.2&&r.sw[0]<-.2&&r.back[1]>13.8&&r.ne[0]>35.4,{front:r.front,sw:r.sw,back:r.back,ne:r.ne});
    check('walk from Maironio g. under the canopy to the doors',Math.abs(r.doors[0]-27.2)<.3&&r.doors[1]>-.5,r.doors);
    check('ramp rail and flagpoles solid',r.rail[0]>33.3&&r.poles.every(m=>m>.5),{rail:r.rail,poles:r.poles});}
  check('streets step POLICIJA sign replaced by the model',r.sign===0,r.sign);
  check('police label kept, a road node for deliveries near it',!!r.police&&r.police.node!=null&&r.police.node<80&&r.police.nodeFree,r.police);
  check('health centre (not modelled) still drawn and labelled, road node near it',r.healthDrawn>0&&!!r.health&&r.health.node!=null&&r.health.node<80&&r.health.nodeFree,{drawn:r.healthDrawn,label:r.health});}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
