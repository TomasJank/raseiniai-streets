// GLB fleet checks: node test_cars2.mjs page.html [shotdir]   (page = build.sh + add_cars2.py)
// Every car the game makes is GLB-backed with 4 spinning/steering wheels, lamps still answer drive.js and breakLamps,
// police keep their bar, parked cars stay at <= 3 instanced meshes per model, dent/smoke/tip/sink still act on the body.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,shotArg]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,out=shotArg||dir+'shots_cars2/';fs.mkdirSync(out,{recursive:true});
const o='function drawMini(){';
let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={set paused(v){mapOpen=v},set sinkS(v){sinkS=v},get world(){return world},get player(){return player},get CARS2(){return CARS2},get PARKED(){return PARKED},get LOT_GEOS(){return LOT_GEOS},get smoke(){return smoke},
get cops(){return cops},get drv(){return drv},get ENV(){return ENV},KEY,driveCar,syncCar,resetToRoad,makeCarMesh,makeCop,dent,fixCar,breakLamps,kick,fumes,inWater,worldGroup,renderer,scene,camera,get GY(){return GY},
step(n,dt=.033,each){for(let i=0;i<n&&player.car;i++){driveCar(player.car,dt);if(each)each(i);}},
render(){renderer.render(scene,camera);},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();const f=scene.fog;scene.fog=null;renderer.render(scene,camera);scene.fog=f;return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_cars2.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:900,height:560}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_cars2.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
// the page's own frame loop would keep driving the player's car between checks (into the river, once); hold it
await p.evaluate(()=>{__t.paused=true;});
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};

await check('assetsDecode',()=>{const C=__t.CARS2,M=C.models,k=Object.keys(M);
  return{ok:C.on&&k.length>=10&&k.every(q=>M[q].paint.index.count>0&&M[q].wheel.index.count>0),models:k.length,
    tris:Object.fromEntries(k.map(q=>[q,(M[q].paint.index.count+M[q].trim.index.count+M[q].lamps.index.count+4*M[q].wheel.index.count)/3]))};});

await check('glbBacked',()=>{const T=__t,cs=T.world.cars,ai=cs.filter(c=>c.ai),g=c=>!!c.g.userData.car2;
  const share=ai.filter(g).length/ai.length;
  return{ok:g(T.player.car)&&share>=.8&&cs.every(c=>c.g.userData.wheels.length===4),player:T.player.car.g.userData.car2.key,traffic:ai.length,glbShare:+share.toFixed(2),all:cs.length,allGlb:cs.filter(g).length};});

await check('drawCallsPerCar',()=>{const T=__t,c=T.world.cars.find(q=>q.ai),meshes=[];c.g.traverse(o=>{if(o.isMesh)meshes.push(o.name||o.geometry.type);});
  return{ok:meshes.length<=3,meshes:meshes.length};});

await check('wheelsSpinAndSteer',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.speed=0;c.steer=0;T.syncCar(c);const W=c.g.userData.wheels,x0=W.map(w=>w.rotation.x);
  c.x+=Math.sin(c.h);c.z+=Math.cos(c.h);T.syncCar(c);const d=W.map((w,i)=>+(w.rotation.x-x0[i]).toFixed(3));
  const y0=W.map(w=>w.rotation.y);c.steer=1;T.syncCar(c);const st=W.map((w,i)=>+(w.rotation.y-y0[i]).toFixed(3));c.steer=0;T.syncCar(c);
  const front=W.map(w=>w.position.z>0),left=W.map(w=>w.position.x<0);
  return{ok:d.every((v,i)=>Math.abs(Math.abs(v)-1/.3)<.01&&Math.sign(v)===(left[i]?-1:1))&&st.every((v,i)=>front[i]?Math.abs(v-.28)<1e-3:v===0)&&front.filter(Boolean).length===2&&left.filter(Boolean).length===2,
    spinPerMetre:d,steer:st};});

await check('wheelsDrawnOnGround',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.speed=0;c.ride=null;T.syncCar(c);
  const y=T.GY(c.x,c.z);T.shot([c.x+Math.sin(c.h)*4.3+Math.cos(c.h)*3.6,y+.95,c.z+Math.cos(c.h)*4.3-Math.sin(c.h)*3.6],[c.x,y+.6,c.z]);
  const F=c.g.userData.car2,I=F.inst,e=c.g.matrixWorld.clone(),pos=[];for(let i=0;i<I.count;i++){I.getMatrixAt(i,e);pos.push([e.elements[12],e.elements[13],e.elements[14]]);}
  const mine=c.g.userData.wheels.map(w=>{w.updateWorldMatrix(true,false);const x=w.matrixWorld.elements[12],z=w.matrixWorld.elements[14];const q=pos.find(p=>Math.hypot(p[0]-x,p[2]-z)<.05);return q&&+(q[1]-F.r-T.GY(x,z)-T.world.surf(x,z)).toFixed(3);});
  let vis=0;for(const g of T.CARS2.live){let s=true;for(let o=g;o;o=o.parent)if(!o.visible)s=false;if(s)vis++;}
  const total=T.CARS2.inst.reduce((s,F)=>s+F.inst.count,0);
  // only cars in the camera's view get wheel instances
  return{ok:mine.every(y=>y!=null&&Math.abs(y)<.05)&&total%4===0&&total>=4&&total<=4*vis,tyreBottomAboveGround:mine,instances:total,visibleCars:vis};});

await check('brakeLights',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.speed=14;c.hp=1;for(const k in T.KEY)T.KEY[k]=false;T.step(10,.033,()=>{c.speed=14;});
  const m=c.lamps.tm,lamp=c.g.userData.body.children[4].material.userData,tail=()=>(T.render(),+lamp.uTail.value.r.toFixed(2));const idle=m.color.r,idleL=tail();
  T.KEY.KeyS=true;T.step(4);const on=m.color.r,onL=tail();T.KEY.KeyS=false;T.step(3);const off=m.color.r;
  return{ok:c.g.userData.body.children[3].material===m&&on>1.5&&idle<1&&off<1&&onL>1.5&&idleL<1,tail:[idle,on,off].map(x=>+x.toFixed(2)),lampUniform:[idleL,onL]};});

await check('breakAndFixLamps',()=>{const T=__t,c=T.world.cars.find(q=>q.ai),ch=c.g.userData.body.children,u=ch[4].material.userData;
  // the lamps mesh reads its stand-ins when it is drawn; call that hook directly so a car off screen counts too
  T.breakLamps(c,Math.sin(c.h),Math.cos(c.h),20);T.breakLamps(c,-Math.sin(c.h),-Math.cos(c.h),20);ch[4].onBeforeRender();const broken=[u.uHead.value,u.uTail.value.r];
  T.fixCar(c);ch[4].onBeforeRender();const fixed=[u.uHead.value,u.uTail.value.r];
  return{ok:broken[0]===0&&broken[1]===0&&fixed[0]===1&&fixed[1]===1&&c.lampsOut===false,broken,fixed};});

await check('policeBar',()=>{const T=__t,c=T.player.car,q=T.makeCop(c.x+8,c.z,c.h);T.syncCar(q);const F=q.g.userData.car2,body=q.g.userData.body;
  const box=body.children.find(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&Array.isArray(o.material));
  const r={ok:!!F&&F.police&&q.bar.length===2&&q.bar.every(l=>Math.abs(l.position.y-F.roof-.065)<1e-6)&&!!box&&Math.abs(box.position.y-F.roof-.06)<1e-6&&body.children[0].material.type==='MeshPhongMaterial',
    model:F&&F.key,roof:+F.roof.toFixed(3),bar:q.bar.map(l=>+l.position.y.toFixed(3)),box:box&&+box.position.y.toFixed(3)};
  T.worldGroup.remove(q.g);T.world.cars.splice(T.world.cars.indexOf(q),1);return r;});

await check('parkedInstancing',()=>{const T=__t,P=T.PARKED,L=T.LOT_GEOS,per={};
  for(const m of P.meshes){const k=L.findIndex(G=>G.paint===m.geometry||G.trim===m.geometry);if(k>=0){per[k]=(per[k]||0)+1;continue;}}
  // the hidden stand-in wheel mesh follows its model's paint and trim in PARKED.meshes
  let cyl=0,cylVisible=0;for(const m of P.meshes)if(m.geometry.type==='CylinderGeometry'){cyl++;if(m.visible)cylVisible++;}
  const unique=new Set(L).size===L.length,maxPer=Math.max(...Object.values(per))+1;
  return{ok:unique&&L.every(G=>G.glb)&&maxPer<=3&&cylVisible===0&&P.cars.length>100,models:L.length,meshes:P.meshes.length,maxPerModel:maxPer,parked:P.cars.length,cylinders:cyl,cylVisible};});

await check('dentAndRepair',()=>{const T=__t,c=T.world.cars.find(q=>q.ai),m=c.g.userData.body.children[0],g0=m.geometry;
  T.dent(c,Math.sin(c.h),Math.cos(c.h),.18);const a=m.geometry.attributes.position.array,b=g0.attributes.position.array;let moved=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>1e-4)moved++;
  const own=m.geometry!==g0;T.fixCar(c);return{ok:own&&moved>20&&m.geometry===g0,movedCoords:moved};});

await check('smokeWhenHurt',()=>{const T=__t,c=T.player.car;c.hp=.3;for(let i=0;i<10;i++)T.fumes(.2);const n=T.smoke.filter(s=>s.visible).length;c.hp=1;return{ok:n>0,visibleSmoke:n};});

await check('tipsOver',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.speed=0;c.ride=null;T.syncCar(c);T.kick(c,2,0,9);let mx=0;T.step(60,.033,()=>{mx=Math.max(mx,Math.abs(c.g.rotation.z));});
  T.resetToRoad();c.ride=null;T.syncCar(c);T.sinkS=null;return{ok:mx>.6,maxRollRad:+mx.toFixed(2)};});

// close-ups of every fleet model with the car close-up camera from playtest.mjs
const shots=await p.evaluate(()=>{const T=__t,r={};T.resetToRoad();const c=T.player.car;c.speed=0;c.ride=null;T.syncCar(c);c.g.visible=false;
  const s=Math.sin(c.h),k=Math.cos(c.h),rx=k,rz=-s,y=T.GY(c.x,c.z),P=(a,b,u)=>[c.x+s*a+rx*b,y+u,c.z+k*a+rz*b];
  for(const key in T.CARS2.models){const g=T.makeCarMesh(0x8f1f22,T.CARS2.models[key]);g.position.copy(c.g.position);g.rotation.copy(c.g.rotation);T.worldGroup.add(g);
    r[key]=T.shot(P(4.3,3.6,.95),P(.1,0,.62));r[key+'_side']=T.shot(P(.1,-5.8,.9),P(.1,0,.65));r[key+'_rear']=T.shot(P(-4.6,3,1.2),P(-.4,0,.7));T.worldGroup.remove(g);}
  c.g.visible=true;return r;});
for(const k in shots)fs.writeFileSync(out+k+'.png',Buffer.from(shots[k].split(',')[1],'base64'));
console.log('shots',Object.keys(shots).length,'in',out);
await check('sinksInWater',()=>{const T=__t,W=T.world,c=T.player.car;T.sinkS=null;let spot=null;
  for(const poly of W.water||[]){let x=0,z=0;for(const q of poly){x+=q[0]/poly.length;z+=q[1]/poly.length;}if(T.inWater(x,z)){spot=[x,z];break;}}
  if(!spot)return{ok:false,why:'no water spot'};c.x=spot[0];c.z=spot[1];c.speed=6;c.ride=null;T.syncCar(c);const y0=c.g.position.y;T.step(20);const dy=c.g.position.y-y0;
  T.step(110);const back=T.player.mode;return{ok:dy<-.3&&!!c.g.userData.car2,drop:+dy.toFixed(2),after:back};});

console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('page errors');
await b.close();
if(fails.length){console.log('FAIL\n  '+fails.join('\n  '));process.exit(1);}
console.log('PASS');
