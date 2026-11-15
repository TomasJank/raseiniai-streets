// cars3 fleet checks: node test_cars3.mjs page.html [shotdir]   (page = build.sh + ... + add_cars3.py)
// Real length/height/wheelbase per model, distinct side silhouettes, every traffic/parked/police car is a cars3 model,
// plates front and rear, wheels turn, lamps light at night, a car sinks, a parked car is solid, no page errors.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,shotArg]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,out=shotArg||dir+'shots_cars3/';fs.mkdirSync(out,{recursive:true});
const o='function drawMini(){';
let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={enterExit,get heat(){return heat},set heat(v){heat=v},set paused(v){mapOpen=v},set sinkS(v){sinkS=v},get world(){return world},get player(){return player},
get CARS2(){return CARS2},get CARS3(){return CARS3},get CARS3_MODELS(){return CARS3_MODELS},get PARKED(){return PARKED},get LOT_GEOS(){return LOT_GEOS},get TRAFFIC_GEOS(){return TRAFFIC_GEOS},get cops(){return cops},get ENV(){return ENV},
driveCar,syncCar,resetToRoad,makeCarMesh,makeCop,spawnCop,lampsSet,carLamps,carOverlap,parkedNear,inWater,worldGroup,renderer,scene,camera,get GY(){return GY},
step(n,dt=.033){for(let i=0;i<n&&player.car;i++)driveCar(player.car,dt);},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();const f=scene.fog;scene.fog=null;renderer.render(scene,camera);scene.fog=f;return renderer.domElement.toDataURL('image/jpeg',.9);}};`;
fs.writeFileSync(dir+'_cars3.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:900,height:560}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_cars3.html',{timeout:180000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});await p.waitForTimeout(1500);
await p.evaluate(()=>{__t.paused=true;});
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};

await check('realDimensions',()=>{const T=__t,M=T.CARS3.models,r={};let ok=Object.keys(M).length>=10;
  for(const k in M){const F=M[k],R=T.CARS3_MODELS[k],pa=F.paint.attributes.position.array,tr=F.trim.attributes.position.array;let z0=1e9,z1=-1e9,y1=0;
    // length over paint and trim (the RAV4's spare wheel is trim); the plates stand 1-3 cm proud of the bumpers
    for(const q of[pa,tr])for(let i=0;i<q.length;i+=3){z0=Math.min(z0,q[i+2]);z1=Math.max(z1,q[i+2]);y1=Math.max(y1,q[i+1]);}
    const got=[z1-z0,y1,F.axles[0]-F.axles[1]],real=[R.dims[0],R.dims[2],R.wb],err=got.map((v,i)=>Math.abs(v/real[i]-1));if(err.some(e=>e>.03))ok=false;
    const tris=['paint','trim','lamps'].reduce((s,q)=>s+F[q].index.count/3,0)+4*F.wheel.index.count/3;
    r[k]={L:[+got[0].toFixed(3),real[0]],H:[+got[1].toFixed(3),real[1]],WB:[+got[2].toFixed(3),real[2]],maxErrPct:+(Math.max(...err)*100).toFixed(1),tris};}
  return{ok,...r};});

// every model alone, side on through an orthographic camera at true scale, flat black on white; intersection over union
await check('distinctSilhouettes',()=>{const T=__t,M=T.CARS3.models,r=T.renderer,gl=r.getContext(),c0=T.world.cars.find(q=>q.g.userData.car2).g.userData.body.children;
  const Mesh=c0[0].constructor,Basic=c0[4].material.constructor,Sc=T.scene.constructor,Col=c0[4].material.color.constructor;
  const W=r.domElement.width,H=r.domElement.height,px=new Uint8Array(W*H*4),sil={};
  for(const k in M){const F=M[k],sc=new Sc();sc.background=new Col(1,1,1);const m=new Basic({color:new Col(0,0,0),side:2});
    for(const g of[F.paint,F.trim])sc.add(new Mesh(g,m));for(const z of F.axles){const w=new Mesh(F.wheel,m);w.position.set(F.track,F.r,z);sc.add(w);}
    // the page's perspective camera with an orthographic projection set by hand (THREE is not a page global)
    const k2=W/H,cam2=T.camera.clone();cam2.position.set(20,1,0);cam2.lookAt(0,1,0);cam2.updateMatrixWorld();
    cam2.projectionMatrix.makeOrthographic(-3*k2*.5,3*k2*.5,2.2,-.2,.1,60);cam2.projectionMatrixInverse.copy(cam2.projectionMatrix).invert();
    r.render(sc,cam2);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);const s=new Uint8Array(W*H);for(let i=0;i<W*H;i++)s[i]=px[i*4]<128?1:0;sil[k]=s;}
  const K=Object.keys(sil),pairs=[];let max=0,maxPair=null;
  for(let i=0;i<K.length;i++)for(let j=i+1;j<K.length;j++){let a=0,u=0;const A=sil[K[i]],B=sil[K[j]];for(let q=0;q<A.length;q++){a+=A[q]&B[q];u+=A[q]|B[q];}const iou=a/u;if(iou>max){max=iou;maxPair=[K[i],K[j]];}}
  return{ok:max<.95,maxIoU:+max.toFixed(3),closestPair:maxPair};});

await check('everyCarIsCars3',()=>{const T=__t,keys=new Set(Object.keys(T.CARS3.models)),is=g=>!!g.userData.car2&&keys.has(g.userData.car2.key);
  const ai=T.world.cars.filter(c=>c.ai),lots=T.LOT_GEOS,mine=new Set(Object.values(T.CARS3.models).map(F=>F.lot));
  const pc=T.player.car,q=T.makeCop(pc.x+8,pc.z,pc.h);T.syncCar(q);const cops=[...T.cops.map(c=>c.g.userData.car2),q.g.userData.car2];T.worldGroup.remove(q.g);T.world.cars.splice(T.world.cars.indexOf(q),1);
  return{ok:ai.length>0&&ai.every(c=>is(c.g))&&T.TRAFFIC_GEOS.every(G=>keys.has(G.key))&&lots.every(G=>mine.has(G))&&T.PARKED.cars.length>100&&T.PARKED.cars.every(c=>c.k<lots.length)
      &&cops.length>0&&cops.every(F=>F&&F.police&&F.key==='octavia3'),traffic:ai.length,parked:T.PARKED.cars.length,lotModels:lots.length,cops:cops.length,copModel:cops.map(F=>F&&F.key),
    mix:Object.fromEntries([...keys].map(k=>[k,T.TRAFFIC_GEOS.filter(G=>G.key===k).length]))};});

await check('platesFrontAndRear',()=>{const T=__t,M=T.CARS3.models,r={};let ok=true;
  for(const k in M){const g=M[k].trim,p=g.attributes.position.array,n=g.attributes.normal.array,c=g.attributes.color.array;let f=0,b=0;
    for(let i=0;i<p.length;i+=3)if(Math.abs(c[i]-.93)<.01&&Math.abs(c[i+2]-.9)<.01){if(n[i+2]>.9&&p[i+2]>0)f++;if(n[i+2]<-.9&&p[i+2]<0)b++;}
    r[k]=[f,b];if(!f||!b)ok=false;}
  return{ok,plateVerts:r};});

await check('stealCars3Car',()=>{const T=__t,c=T.world.cars.find(q=>q.ai&&q.g.userData.car2);T.player.car.speed=0;T.enterExit();T.player.x=c.x+1.2;T.player.z=c.z+1.2;T.heat=0;T.enterExit();T.heat=0;
  return{ok:T.player.car===c&&T.player.mode==='car',key:c.g.userData.car2.key};});

await check('wheelsTurnAndSteer',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.speed=0;c.steer=0;T.syncCar(c);const W=c.g.userData.wheels,x0=W.map(w=>w.rotation.x);
  c.x+=Math.sin(c.h);c.z+=Math.cos(c.h);T.syncCar(c);const d=W.map((w,i)=>+(w.rotation.x-x0[i]).toFixed(3));const y0=W.map(w=>w.rotation.y);c.steer=1;T.syncCar(c);
  const st=W.map((w,i)=>+(w.rotation.y-y0[i]).toFixed(3));c.steer=0;T.syncCar(c);T.renderer.render(T.scene,T.camera);const F=c.g.userData.car2;
  return{ok:W.length===4&&d.every(v=>Math.abs(Math.abs(v)-1/.3)<.01)&&st.filter(v=>Math.abs(v-.28)<1e-3).length===2&&F.inst.count>=4,spinPerMetre:d,steer:st,wheelInstances:F.inst.count};});

await check('lampsAtNight',()=>{const T=__t,c=T.player.car,F=c.g.userData.car2,z=F.lamps.attributes.position.array;let head=0,tail=0;for(let i=2;i<z.length;i+=3)z[i]>0?head++:tail++;
  const n0=T.ENV.night.value;T.ENV.night.value=1;T.lampsSet(c,1,false);const L=T.carLamps(c),on=L.sl.map(l=>l.intensity);const lm=c.g.userData.body.children[4];lm.onBeforeRender();
  const u=lm.material.userData;const r={head,tail,spot:on,uHead:u.uHead.value,uTail:+u.uTail.value.r.toFixed(2)};T.lampsSet(c,0,false);T.ENV.night.value=n0;
  return{ok:head>0&&tail>0&&(on.length===0||on.every(x=>x>0))&&u.uHead.value===1&&u.uTail.value.r>0,...r};});

await check('parkedCarIsSolid',()=>{const T=__t,c=T.player.car,q=T.PARKED.cars[Math.floor(T.PARKED.cars.length/2)];
  c.x=q.x+Math.sin(q.h)*.4;c.z=q.z+Math.cos(q.h)*.4;c.h=q.h;c.speed=3;c.ride=null;T.syncCar(c);const near=T.parkedNear(c.x,c.z).includes(q),before=!!T.carOverlap(c,q,1.8);
  T.step(8);const after=T.carOverlap(c,q,1.8),d=Math.hypot(c.x-q.x,c.z-q.z);T.resetToRoad();c.speed=0;T.syncCar(c);
  return{ok:near&&before&&!after,overlapBefore:before,overlapAfter:!!after,separation:+d.toFixed(2)};});

const shots=await p.evaluate(()=>{const T=__t,r={};T.resetToRoad();const c=T.player.car;c.speed=0;c.ride=null;T.syncCar(c);c.g.visible=false;
  const s=Math.sin(c.h),k=Math.cos(c.h),rx=k,rz=-s,y=T.GY(c.x,c.z),P=(a,b,u)=>[c.x+s*a+rx*b,y+u,c.z+k*a+rz*b];
  for(const key in T.CARS3.models){const g=T.makeCarMesh(0x8a9099,T.CARS3.models[key]);g.position.copy(c.g.position);g.rotation.copy(c.g.rotation);T.worldGroup.add(g);
    r[key+'_f34']=T.shot(P(4.6,3.9,1.15),P(.1,0,.62));r[key+'_side']=T.shot(P(.1,-6.6,1.0),P(.1,0,.7));r[key+'_r34']=T.shot(P(-4.6,3.9,1.15),P(-.1,0,.62));T.worldGroup.remove(g);}
  const q=T.CARS3.police,g=T.makeCarMesh(0,q);g.position.copy(c.g.position);g.rotation.copy(c.g.rotation);T.worldGroup.add(g);r.police_f34=T.shot(P(4.6,3.9,1.15),P(.1,0,.62));T.worldGroup.remove(g);
  c.g.visible=true;return r;});
for(const k in shots)fs.writeFileSync(out+k+'.jpg',Buffer.from(shots[k].split(',')[1],'base64'));
console.log('shots',Object.keys(shots).length,'in',out);

await check('sinksInWater',()=>{const T=__t,W=T.world,c=T.player.car;T.sinkS=null;let spot=null;
  for(const poly of W.water||[]){let x=0,z=0;for(const q of poly){x+=q[0]/poly.length;z+=q[1]/poly.length;}if(T.inWater(x,z)){spot=[x,z];break;}}
  if(!spot)return{ok:false,why:'no water spot'};c.x=spot[0];c.z=spot[1];c.speed=6;c.ride=null;T.syncCar(c);const y0=c.g.position.y;T.step(20);const dy=c.g.position.y-y0;
  T.step(110);return{ok:dy<-.3&&!!c.g.userData.car2,key:c.g.userData.car2&&c.g.userData.car2.key,drop:+dy.toFixed(2),after:T.player.mode};});

console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('page errors');
await b.close();
if(fails.length){console.log('FAIL\n  '+fails.join('\n  '));process.exit(1);}
console.log('PASS');
