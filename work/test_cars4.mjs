// cars4 checks (also paint colours): node test_cars4.mjs page.html [shotdir]   (page = build.sh + add_cars4.py)
// Real length per model, wheels on the ground, every traffic and parked car textured cars4 (the police car is its own cars4 model, never a civilian one),
// parked instances textured, wheels turn, lamps glow only at night or braking, a car sinks, a parked car is solid, no errors.
// Also: the van collides along its whole length, the route bus wears the coach, standing vehicles are solid, and a detailed
// model shows its close-up version within 40 m and its distant one beyond, both inside their triangle budgets.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,shotArg]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,out=shotArg||dir+'shots_cars4/';fs.mkdirSync(out,{recursive:true});
const o='function drawMini(){';
let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={enterExit,get heat(){return heat},set heat(v){heat=v},set paused(v){mapOpen=v},set sinkS(v){sinkS=v},get world(){return world},get player(){return player},
get CARS2(){return CARS2},get CARS4(){return CARS4},get CARS4_FLEET(){return CARS4_FLEET},get PARKED2(){return PARKED2},get bus(){return bus},get placeBus(){return placeBus},get CARS4_STATIC(){return CARS4_STATIC},get CARS4_POLICE(){return CARS4_POLICE},skodaGeo,flash,copRed,copBlue,copOff,get LL(){return LL},get collideCar(){return collideCar},get PARKED(){return PARKED},get LOT_GEOS(){return LOT_GEOS},get TRAFFIC_GEOS(){return TRAFFIC_GEOS},get cops(){return cops},get ENV(){return ENV},
THREE,driveCar,syncCar,resetToRoad,get makeCarMesh(){return makeCarMesh},makeCop,spawnCop,dent,breakLamps,fixCar,lampsSet,carLamps,get carOverlap(){return carOverlap},parkedNear,inWater,worldGroup,renderer,scene,camera,get GY(){return GY},
step(n,dt=.033){for(let i=0;i<n&&player.car;i++)driveCar(player.car,dt);},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();const f=scene.fog;scene.fog=null;renderer.render(scene,camera);scene.fog=f;return renderer.domElement.toDataURL('image/jpeg',.9);}};`;
fs.writeFileSync(dir+'_cars4.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:900,height:560}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_cars4.html',{timeout:180000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});await p.waitForTimeout(1500);
await p.evaluate(()=>{__t.paused=true;});
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};

await check('realLengthAndGround',()=>{const T=__t,M=T.CARS4.models,r={};let ok=Object.keys(M).length>=7;
  for(const k in M){const F=M[k],R=T.CARS4_FLEET[k],a=F.paint.attributes.position.array;let z0=1e9,z1=-1e9,y0=1e9,y1=0;
    for(let i=0;i<a.length;i+=3){z0=Math.min(z0,a[i+2]);z1=Math.max(z1,a[i+2]);y0=Math.min(y0,a[i+1]);y1=Math.max(y1,a[i+1]);}
    // on the ground: separate wheels by their tyre bottom (hub height minus radius), fused ones by the body's lowest point
    const w=F.wheel.attributes.position.array;let wy=0;for(let i=1;i<w.length;i+=3)wy=Math.min(wy,w[i]);const tyre=R.wheels?+(F.r+wy).toFixed(3):null;
    const e=Math.abs((z1-z0)/R.dims[0]-1);if(e>.03||(R.wheels&&Math.abs(tyre)>.02)||(!R.wheels&&y0>.02))ok=false;
    r[k]={L:+(z1-z0).toFixed(3),realL:R.dims[0],H:+y1.toFixed(3),lowestBody:+y0.toFixed(3),tyreBottom:tyre,wheels:R.wheels,tris:F.paint.index.count/3+(R.wheels?4*F.wheel.index.count/3:0)};}
  return{ok,...r};});

// every model: four visible wheels that turn with distance, fronts that steer, and no copy of a wheel left in the body
await check('allWheelsTurnAndSteer',()=>{const T=__t,M=T.CARS4.models,pc=T.player.car,r={};let ok=true;
  for(const k in M){const F=M[k],g=T.makeCarMesh(0x888888,F);T.worldGroup.add(g);const c={g,x:pc.x+30,z:pc.z,h:0,speed:0,steer:0,wx:pc.x+30,wz:pc.z,spin:0};T.syncCar(c);
    const W=g.userData.wheels,x0=W.map(w=>w.rotation.x);c.z+=1;T.syncCar(c);const spin=W.map((w,i)=>+(w.rotation.x-x0[i]).toFixed(3));
    const y0=W.map(w=>w.rotation.y);c.steer=1;T.syncCar(c);const steer=W.map((w,i)=>+(w.rotation.y-y0[i]).toFixed(3));T.worldGroup.remove(g);
    const wt=F.wheel.index.count/3,p=F.paint.attributes.position.array,ix=F.paint.index.array;let left=0;
    for(let t=0;t<ix.length;t+=3){let inW=true;for(let v=0;v<3;v++){const i=ix[t+v]*3,x=Math.abs(p[i]),y=p[i+1],z=p[i+2];if(!(Math.abs(x-F.track)<.06&&F.axles.some(a=>Math.hypot(y-F.r,z-a)<F.r*.6)))inW=false;}if(inW)left++;}
    const good=W.length===4&&spin.every(v=>Math.abs(Math.abs(v)-1/.3)<.01)&&steer.filter(v=>Math.abs(v-.28)<1e-3).length===2&&wt>=40&&left===0;if(!good)ok=false;
    r[k]={spin,steer,wheelTris:wt,wheelTrisLeftInBody:left};}
  return{ok,...r};});

await check('startCarIsAudi80',()=>{const T=__t,c=T.player.car,F=c.g.userData.car2,ch=c.g.userData.body.children,m=ch[0];
  const tex=!!F&&F.key==='audi80'&&m.material.map===F.tex;
  const n0=T.ENV.night.value;T.ENV.night.value=1;T.lampsSet(c,1,false);const spot=T.carLamps(c).sl.map(l=>l.intensity);ch[4].onBeforeRender();const glow=ch[4].material.userData.uHead.value;T.lampsSet(c,0,false);T.ENV.night.value=n0;
  const g0=m.geometry;T.dent(c,Math.sin(c.h),Math.cos(c.h),.18);const dented=m.geometry!==g0;T.breakLamps(c,Math.sin(c.h),Math.cos(c.h),20);const smashed=!ch[2].visible;
  T.fixCar(c);const fixed=m.geometry===g0&&ch[2].visible;
  c.speed=0;T.enterExit();const out=T.player.mode;T.player.x=c.x+1.2;T.player.z=c.z+1.2;T.heat=0;T.enterExit();const back=T.player.mode==='car'&&T.player.car===c;
  return{ok:tex&&spot.every(x=>x>0)&&glow>.9&&dented&&smashed&&fixed&&out!=='car'&&back,key:F&&F.key,textured:tex,spot,nightGlow:glow,dented,smashed,fixed,leftAs:out,reentered:back};});

// paint: varied colours in traffic and car parks, recolour touches masked paint only, respray reaches the textured paint
const parkedSig=()=>p.evaluate(()=>__t.PARKED.cars.map(c=>Math.round(c.x)+','+Math.round(c.z)+':'+c.c+':'+c.k).join('|'));
const sig1=await parkedSig();
await check('paintColoursVaried',()=>{const T=__t,M=T.CARS4.models,hex=c=>c.getHex?c.getHex():c;
  const traffic=new Set(T.world.cars.filter(c=>c.ai&&c.g.userData.car2&&c.g.userData.car2.mask).map(c=>c.g.userData.body.children[0].material.userData.paint.getHex()));
  const parked=new Set(T.PARKED.cars.filter(c=>{const F=M[T.LOT_GEOS[c.k].cars4];return F&&F.mask;}).map(c=>c.c));
  return{ok:traffic.size>=5&&parked.size>=5,trafficColours:traffic.size,parkedColours:parked.size};});

await check('recolourOnlyPaint',async()=>{const T=__t,r=T.renderer,gl=r.getContext(),out={};let ok=true;
  for(const k of['audi80','primera','ibiza2']){const F=T.CARS4.models[k],g=T.makeCarMesh(0x888888,F),pc=T.player.car;T.worldGroup.add(g);
    const c={g,x:pc.x+40,z:pc.z+40,h:0,speed:0,steer:0,wx:pc.x+40,wz:pc.z+40,spin:0};T.syncCar(c);const y=T.GY(c.x,c.z),ch=g.userData.body.children;
    T.camera.position.set(c.x+6,y+1,c.z);T.camera.lookAt(c.x,y+.7,c.z);T.camera.updateMatrixWorld();
    const W=r.domElement.width,H=r.domElement.height,shot=()=>{T.renderer.render(T.scene,T.camera);const a=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
    const Basic=ch[4].material.constructor,Mat=ch[0].material.constructor;
    ch[0].material=new Mat({color:0xffffff});ch[0].material=ch[0].material;const A=shot();
    ch[0].material=new Mat({color:0x1e2d4f});const B=shot();
    const own=Object.getOwnPropertyDescriptor(ch[0],'material');delete ch[0].material;ch[0].material=new Basic({map:F.mask});const K=shot();delete ch[0].material;Object.defineProperty(ch[0],'material',own);
    let un=0,unDiff=0,pa=0,paDiff=0;for(let i=0;i<A.length;i+=4){const d=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);
      if(K[i]<8&&K[i+1]<8&&K[i+2]<8){un++;if(d>6)unDiff++;}else if(K[i]>247&&K[i+1]>247&&K[i+2]>247){pa++;if(d>30)paDiff++;}}
    T.worldGroup.remove(g);out[k]={unmaskedPx:un,unmaskedChanged:unDiff,paintPx:pa,paintChanged:paDiff};if(unDiff>un*.002||paDiff<pa*.5||pa<500)ok=false;}
  return{ok,...out};});

await check('resprayStartCar',()=>{const T=__t,c=T.player.car,F=c.g.userData.car2,ch=c.g.userData.body.children,before=ch[0].material.userData.paint.getHex();
  const target=before===0x5a181c?0x1e2d4f:0x5a181c;ch[0].material=new (ch[0].material.constructor)({color:target});const m=ch[0].material;
  return{ok:F.key==='audi80'&&m.map===F.tex&&m.userData.paint.getHex()===target,before:before.toString(16),after:m.userData.paint.getHex().toString(16)};});

await check('everyCarIsCars4',()=>{const T=__t,keys=new Set(Object.keys(T.CARS4.models)),ai=T.world.cars.filter(c=>c.ai);
  const tex=c=>{const F=c.g.userData.car2;return F&&keys.has(F.key)&&c.g.userData.body.children[0].material.map===F.tex;};
  const loaded=Object.values(T.CARS4.models).every(F=>F.tex.image&&F.tex.image.width>0);
  const pc=T.player.car,q=T.makeCop(pc.x+8,pc.z,pc.h);T.syncCar(q);const cop=q.g.userData.car2;T.worldGroup.remove(q.g);T.world.cars.splice(T.world.cars.indexOf(q),1);
  const lots=T.LOT_GEOS,mine=new Set(Object.values(T.CARS4.models).map(F=>F.lot));
  return{ok:ai.length>0&&ai.every(tex)&&loaded&&lots.every(G=>mine.has(G))&&T.PARKED.cars.length>100&&cop&&cop.police,traffic:ai.length,textured:ai.filter(tex).length,
    texturesLoaded:loaded,parked:T.PARKED.cars.length,lotModels:lots.length,cop:cop&&cop.key,mix:Object.fromEntries([...keys].map(k=>[k,T.TRAFFIC_GEOS.filter(G=>G.key===k).length]))};});

await check('parkedInstancesTextured',()=>{const T=__t,P=T.PARKED2,tex=P.filter(m=>m.geometry.userData.cars4);
  return{ok:tex.length===Object.keys(T.CARS4.models).length&&tex.every(m=>m.material.map&&m.material.map.image)&&P.length<=3*T.LOT_GEOS.length+1&&tex.every(m=>!T.CARS4.models[m.geometry.userData.cars4].mask||m.material.customProgramCacheKey()==='cars4painti'),
    meshes:P.length,textured:tex.length};});

await check('stealCars4Car',()=>{const T=__t,c=T.world.cars.find(q=>q.ai&&q.g.userData.car2);T.player.car.speed=0;T.enterExit();T.player.x=c.x+1.2;T.player.z=c.z+1.2;T.heat=0;T.enterExit();T.heat=0;
  return{ok:T.player.car===c&&T.player.mode==='car',key:c.g.userData.car2.key};});

// a detailed car near the camera draws its wheels from its close-up instances (instHi)
await check('wheelsTurnAndSteer',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.speed=0;c.steer=0;T.syncCar(c);const W=c.g.userData.wheels,x0=W.map(w=>w.rotation.x);
  c.x+=Math.sin(c.h);c.z+=Math.cos(c.h);T.syncCar(c);const d=W.map((w,i)=>+(w.rotation.x-x0[i]).toFixed(3));const y0=W.map(w=>w.rotation.y);c.steer=1;T.syncCar(c);
  const st=W.map((w,i)=>+(w.rotation.y-y0[i]).toFixed(3));c.steer=0;T.syncCar(c);const y=T.GY(c.x,c.z);T.camera.position.set(c.x+5,y+2,c.z+5);T.camera.lookAt(c.x,y+.5,c.z);T.camera.updateMatrixWorld();T.renderer.render(T.scene,T.camera);const F=c.g.userData.car2;
  return{ok:W.length===4&&d.every(v=>Math.abs(Math.abs(v)-1/.3)<.01)&&st.filter(v=>Math.abs(v-.28)<1e-3).length===2&&F.inst.count+(F.instHi?F.instHi.count:0)>=4,spinPerMetre:d,steer:st,wheelInstances:F.inst.count+(F.instHi?F.instHi.count:0)};});

await check('lampsGlowAtNightOnly',()=>{const T=__t,c=T.player.car,F=c.g.userData.car2,lm=c.g.userData.body.children[4],u=lm.material.userData,n0=T.ENV.night.value,tail=c.g.userData.body.children[3];
  const at=(n,brake)=>{T.ENV.night.value=n;const t=tail.material.color.r;if(brake)tail.material.color.setScalar(1.8);lm.onBeforeRender();const r=[+u.uHead.value.toFixed(2),+u.uTail.value.r.toFixed(2)];tail.material.color.setScalar(t);return r;};
  const day=at(0),night=at(1),brake=at(0,true);T.lampsSet(c,1,false);T.ENV.night.value=1;T.lampsSet(c,1,false);const spot=T.carLamps(c).sl.map(l=>l.intensity);T.lampsSet(c,0,false);T.ENV.night.value=n0;
  return{ok:!!F.cars4&&day[0]===0&&day[1]===0&&night[0]>.9&&night[1]>0&&brake[1]>1&&lm.material.blending===2&&spot.every(x=>x>0),day,night,dayBraking:brake,spot};});

await check('parkedCarIsSolid',()=>{const T=__t,c=T.player.car,q=T.PARKED.cars[Math.floor(T.PARKED.cars.length/2)];
  c.x=q.x+Math.sin(q.h)*.4;c.z=q.z+Math.cos(q.h)*.4;c.h=q.h;c.speed=3;c.ride=null;T.syncCar(c);const near=T.parkedNear(c.x,c.z).includes(q),before=!!T.carOverlap(c,q,1.8);
  T.step(8);const after=T.carOverlap(c,q,1.8),d=Math.hypot(c.x-q.x,c.z-q.z);T.resetToRoad();c.speed=0;T.syncCar(c);
  return{ok:near&&before&&!after,overlapBefore:before,overlapAfter:!!after,separation:+d.toFixed(2)};});

// the van is 5.9 m: a car nose to tail with it must touch at the bumpers (centres 5.2 m apart), not 0.7 m inside it
await check('vanCollidesAlongItsLength',()=>{const T=__t,F=T.CARS4.models.sprinter;if(!F)return{ok:true,skipped:'no van in the mix'};
  const pc=T.player.car,v={g:T.makeCarMesh(0x888888,F),x:pc.x+60,z:pc.z,h:0},car=d=>({g:pc.g,x:v.x,z:v.z-d,h:0});
  const touch=!!T.carOverlap(car(4.9),v,1.8),clear=!T.carOverlap(car(5.4),v,1.8),same=!!T.carOverlap(car(4.3),{g:pc.g,x:v.x,z:v.z,h:0},1.8)&&!T.carOverlap(car(4.7),{g:pc.g,x:v.x,z:v.z,h:0},1.8);
  return{ok:touch&&clear&&same,len:F.len,circles:F.offs.length,touchAt4_9:touch,clearAt5_4:clear,carsUnchanged:same};});

await check('routeBusIsCoach',()=>{const T=__t,b=T.bus,F=T.CARS4.bus;if(!F)return{ok:true,skipped:'no bus model'};if(!b)return{ok:false,why:'no bus'};
  const W=b.mesh.userData.wheels||[],s0=b.s,x0=W.map(w=>w.rotation.x);b.s+=1;T.placeBus(0);const d=W.map((w,i)=>+(w.rotation.x-x0[i]).toFixed(3));b.s=s0;T.placeBus(0);
  const body=b.mesh.children[0];
  return{ok:W.length===4&&d.every(v=>Math.abs(Math.abs(v)-1/F.r)<.01)&&body.geometry===F.paint&&body.material.map===F.tex&&F.len>11&&F.len<12.5,len:F.len,wheels:W.length,spinPerMetre:d,tris:F.paint.index.count/3+4*F.wheel.index.count/3};});

await check('standingVehiclesAreSolid',()=>{const T=__t,r={};let ok=true;
  for(const k in T.CARS4_STATIC)for(const[la,lo,deg]of T.CARS4_STATIC[k]){const F=T.CARS4.extra[k],[x,z]=T.LL(la,lo),h=deg*Math.PI/180;
    // a 1 m circle pushed at the middle of its side from outside must be stopped at the side
    const sx=Math.cos(h),sz=-Math.sin(h),o=T.collideCar(x+sx*(F.wid/2+.4),z+sz*(F.wid/2+.4),1,null),d=(o.x-x)*sx+(o.z-z)*sz;
    const drawn=T.worldGroup.children.some(m=>m.geometry===F.lot.paint&&Math.hypot(m.position.x-x,m.position.z-z)<.01);
    if(!o.hit||d<F.wid/2+.95||!drawn)ok=false;r[k]={pushedOutTo:+d.toFixed(2),half:F.wid/2,drawn};}
  return{ok,...r};});

await check('detailedModelsSwitchByDistance',async()=>{const T=__t,L=Object.values(T.CARS4.models).filter(F=>F.M.lod);if(!L.length)return{ok:true,models:0};
  for(let i=0;i<300&&!T.CARS4.hi;i++)await new Promise(r=>setTimeout(r,100));if(!T.CARS4.hi)return{ok:false,why:'close-up versions never arrived'};
  const tri=g=>g.index.count/3,over=[];
  // the budgets are the converted model's; the underside added at load (undersideClosed) has its own ceiling of 300
  for(const F of L){const ua=F.hi.paint.userData.under||0,ub=F.paint.userData.under||0,hi=tri(F.hi.paint)+4*tri(F.hi.wheel)-ua,lo=tri(F.paint)+4*tri(F.wheel)-ub;if(hi>15500||lo>2600||hi<=lo||ua>300||ub>300)over.push([F.key,hi,lo,ua,ub]);}
  const F=L[0],pc=T.player.car,g=T.makeCarMesh(0x888888,F),c={g,x:pc.x+25,z:pc.z+25,h:0,speed:0,steer:0,wx:pc.x+25,wz:pc.z+25,spin:0};T.worldGroup.add(g);T.syncCar(c);
  const y=T.GY(c.x,c.z),body=g.userData.body.children[0],look=d=>{T.camera.position.set(c.x+d,y+1.5,c.z);T.camera.lookAt(c.x,y+.7,c.z);T.camera.updateMatrixWorld();T.renderer.render(T.scene,T.camera);T.renderer.render(T.scene,T.camera);};
  look(12);const near=body.geometry===F.hi.paint,nearWheels=F.instHi.count;look(70);const far=body.geometry===F.paint,farWheels=F.inst.count;
  look(12);T.dent(c,1,0,.2);look(70);const dentStays=body.geometry!==F.paint&&body.geometry!==F.hi.paint;T.fixCar(c);look(70);const back=body.geometry===F.paint;T.worldGroup.remove(g);
  const parkedHi=T.PARKED2.filter(m=>m.geometry.userData.cars4hi).length,farLast=!T.PARKED2[T.PARKED2.length-1].geometry.userData.cars4;
  return{ok:!over.length&&near&&nearWheels>=4&&far&&farWheels>=4&&dentStays&&back&&parkedHi>0&&parkedHi<=L.length&&farLast,models:L.length,overBudget:over,nearIsCloseUp:near,nearWheels,farIsDistant:far,farWheels,dentKept:dentStays,repaired:back,parkedCloseUpMeshes:parkedHi};});

// every model with wheels (traffic, police, route bus), both versions, has an underside: a ray upward from below the centre
// and from below each axle hits the car, and no underside part (u >= 2) reaches below the tyres' contact plane or outside
// the body (the length, and the body's own half width within 15 cm along the car)
await check('undersideClosed',async()=>{const T=__t,C=T.CARS4,r={};let ok=true;for(let i=0;i<300&&!C.hi;i++)await new Promise(r=>setTimeout(r,100));
  const TH=T.THREE,Fs=[...Object.values(C.models),C.police,C.bus].filter(F=>F&&F.M.wheels),rc=new TH.Raycaster(),mat=new TH.MeshBasicMaterial({side:TH.DoubleSide});
  for(const F of Fs)for(const[v,G]of[['far',F.paint],['near',F.hi&&F.hi.paint]]){if(!G)continue;const a=G.attributes.position.array,u=G.attributes.uv.array,m=new TH.Mesh(G,mat);
    const hits=[0,...F.axles].map(z=>{rc.set(new TH.Vector3(0,-1,z),new TH.Vector3(0,1,0));return rc.intersectObject(m).length>0;});
    const zs=[],xs=[];for(let i=0;i<u.length/2;i++)if(u[i*2]<1.5){zs.push(a[i*3+2]);xs.push(Math.abs(a[i*3]));}
    const half=new Map();zs.forEach((z,i)=>{const k=Math.round(z/.05);half.set(k,Math.max(half.get(k)||0,xs[i]));});
    // where a sparse body (a van's flat side) has no vertex within 15 cm, the narrower of the nearest widths fore and aft
    const ks=[...half.keys()].sort((a,b)=>a-b),wAt=z=>{const k0=Math.round(z/.05);let w=0;for(let k=k0-3;k<=k0+3;k++)w=Math.max(w,half.get(k)||0);if(w)return w;
      const lo=ks.filter(k=>k<k0).pop(),hi=ks.find(k=>k>k0);return lo==null||hi==null?0:Math.min(half.get(lo),half.get(hi));};
    let n=0,low=1e9,out=0;for(let i=0;i<u.length/2;i++)if(u[i*2]>1.5){n++;const x=Math.abs(a[i*3]),y=a[i*3+1],z=a[i*3+2];low=Math.min(low,y);if(x>wAt(z)+.005||Math.abs(z)>F.len/2)out++;}
    const good=hits.every(Boolean)&&n>0&&low>.03&&!out&&G.userData.under<=300;if(!good)ok=false;r[F.key+'_'+v]={hits,underVerts:n,underTris:G.userData.under,lowest:+low.toFixed(3),outside:out};}
  return{ok,models:Fs.length,...r};});

// the police car: the Octavia II model with police set, liveried, four wheels that spin and steer, its bar on this roof flashing,
// close-up and distant versions by distance, and never a civilian car (traffic, car parks, the mix)
await check('policeCar',async()=>{const T=__t,F=T.CARS4.police,pc=T.player.car;if(!F)return{ok:false,why:'no police model'};
  const q=T.makeCop(pc.x+25,pc.z+25,0);T.syncCar(q);const g=q.g,body=g.userData.body,ch=body.children;
  const model=g.userData.car2===F&&F.key===T.CARS4_POLICE&&!!T.CARS4_FLEET[F.key].police&&ch[0].material===F.mat&&F.mat.customProgramCacheKey()==='cars4police';
  const W=g.userData.wheels,x0=W.map(w=>w.rotation.x);q.z+=1;T.syncCar(q);const spin=W.map((w,i)=>+(w.rotation.x-x0[i]).toFixed(3));
  const y0=W.map(w=>w.rotation.y);q.steer=1;T.syncCar(q);const steer=W.map((w,i)=>+(w.rotation.y-y0[i]).toFixed(3));q.steer=0;T.syncCar(q);
  const wheels=W.length===4&&spin.every(v=>Math.abs(Math.abs(v)-1/F.r)<.05)&&steer.filter(v=>Math.abs(v-.28)<1e-3).length===2&&F.wheel.index.count/3>=40;
  // the roof: the highest body point under the bar, on the close-up version too
  const top=G=>{const a=G.attributes.position.array;let y=0;for(let i=0;i<a.length;i+=3)if(Math.abs(a[i])<.35&&Math.abs(a[i+2]-F.roofZ)<.15)y=Math.max(y,a[i+1]);return y;};
  for(let i=0;i<300&&!T.CARS4.hi;i++)await new Promise(r=>setTimeout(r,100));
  const box=ch.find(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&Array.isArray(o.material));
  const bar=q.bar.length===2&&q.bar.every(l=>Math.abs(l.position.y-F.roof-.065)<1e-6&&Math.abs(l.position.z-F.roofZ)<1e-6)&&!!box&&Math.abs(box.position.y-F.roof-.06)<1e-6&&Math.abs(box.position.z-F.roofZ)<1e-6
    &&top(F.paint)<=F.roof+.005&&!!F.hi&&Math.abs(top(F.hi.paint)-F.roof)<.015&&!ch[5].visible;
  const ph=[];for(let i=0;i<4;i++){T.flash(q);ph.push(q.bar.map(l=>l.material===T.copRed?'R':l.material===T.copBlue?'B':'-').join(''));await new Promise(r=>setTimeout(r,140));}
  const flashes=ph.includes('R-')&&ph.includes('-B');
  // distance switch, as the fleet's detailed cars
  const y=T.GY(q.x,q.z),look=d=>{T.camera.position.set(q.x+d,y+1.5,q.z);T.camera.lookAt(q.x,y+.7,q.z);T.camera.updateMatrixWorld();T.renderer.render(T.scene,T.camera);T.renderer.render(T.scene,T.camera);};
  look(12);const near=ch[0].geometry===F.hi.paint,nearWheels=F.instHi.count;look(70);const far=ch[0].geometry===F.paint,farWheels=F.inst.count;
  const tri=G=>G.index.count/3,hi=tri(F.hi.paint)+4*tri(F.hi.wheel),lo=tri(F.paint)+4*tri(F.wheel),budget=hi<=26000&&lo<=4200&&hi>lo;
  T.worldGroup.remove(g);T.world.cars.splice(T.world.cars.indexOf(q),1);
  // never civilian: not in the models (mix), traffic slots, car-park models, live traffic or parked cars; skodaGeo asks for it
  const civ=!(F.key in T.CARS4.models)&&!T.TRAFFIC_GEOS.includes(F)&&!T.LOT_GEOS.some(G=>G.cars4===F.key)&&!T.world.cars.some(c=>c.ai&&c.g.userData.car2===F)&&T.CARS2.swap.get(T.skodaGeo)===F&&T.CARS2.police===F;
  return{ok:model&&wheels&&bar&&flashes&&near&&nearWheels>=4&&far&&farWheels>=4&&budget&&civ,model:F.key,liveried:model,spin,steer,roof:+F.roof.toFixed(3),roofZ:+F.roofZ.toFixed(3),
    roofHi:+top(F.hi.paint).toFixed(3),bar:q.bar.map(l=>+l.position.y.toFixed(3)),flashPhases:ph,nearIsCloseUp:near,nearWheels,farIsDistant:far,farWheels,tris:{near:hi,far:lo},notCivilian:civ};});

const shots=await p.evaluate(()=>{const T=__t,r={};T.resetToRoad();const c=T.player.car;c.speed=0;c.ride=null;T.syncCar(c);c.g.visible=false;
  const s=Math.sin(c.h),k=Math.cos(c.h),rx=k,rz=-s,y=T.GY(c.x,c.z),P=(a,b,u)=>[c.x+s*a+rx*b,y+u,c.z+k*a+rz*b];
  for(const key in T.CARS4.models){const g=T.makeCarMesh(0x8a9099,T.CARS4.models[key]);g.position.copy(c.g.position);g.rotation.copy(c.g.rotation);T.worldGroup.add(g);
    r[key+'_f34']=T.shot(P(4.6,3.9,1.15),P(.1,0,.62));r[key+'_side']=T.shot(P(.1,-6.6,1.0),P(.1,0,.7));r[key+'_r34']=T.shot(P(-4.6,3.9,1.15),P(-.1,0,.62));T.worldGroup.remove(g);}
    c.g.visible=true;return r;});
for(const k in shots)fs.writeFileSync(out+k+'.jpg',Buffer.from(shots[k].split(',')[1],'base64'));
console.log('shots',Object.keys(shots).length,'in',out);

await check('sinksInWater',()=>{const T=__t,W=T.world,c=T.player.car;T.sinkS=null;let spot=null;
  for(const poly of W.water||[]){let x=0,z=0;for(const q of poly){x+=q[0]/poly.length;z+=q[1]/poly.length;}if(T.inWater(x,z)){spot=[x,z];break;}}
  if(!spot)return{ok:false,why:'no water spot'};c.x=spot[0];c.z=spot[1];c.speed=6;c.ride=null;T.syncCar(c);const y0=c.g.position.y;T.step(20);const dy=c.g.position.y-y0;
  T.step(110);return{ok:dy<-.3&&!!c.g.userData.car2,key:c.g.userData.car2&&c.g.userData.car2.key,drop:+dy.toFixed(2),after:T.player.mode};});

// the same car park on a second load
await p.reload({timeout:180000});await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length&&__t.PARKED.cars.length,null,{timeout:180000});await p.waitForTimeout(1500);
{const sig2=await parkedSig(),r={ok:sig1===sig2&&sig1.length>1000,parked:sig1.split('|').length};console.log('parkedColoursStableAcrossLoads',JSON.stringify(r));if(!r.ok)fails.push('parkedColoursStableAcrossLoads');}
// a phone (coarse pointer) never unpacks the close-up versions, the police car's included
{await p.close();const ctx=await b.newContext({viewport:{width:800,height:500},hasTouch:true,isMobile:true}),q=await ctx.newPage();q.on('pageerror',e=>errs.push(e.message));
  await q.goto('file://'+dir+'_cars4.html',{timeout:300000});await q.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});await q.waitForTimeout(6000);
  const r=await q.evaluate(()=>{const T=__t,F=T.CARS4.police,phone=matchMedia('(pointer:coarse)').matches,c=T.makeCop(T.player.car.x+8,T.player.car.z,0);T.syncCar(c);const m=c.g.userData.car2===F;
    return{ok:phone&&!!F&&m&&!F.hi&&!T.CARS4.hi&&Object.values(T.CARS4.models).every(M=>!M.hi),phone,police:m,policeCloseUp:!!(F&&F.hi),anyCloseUp:T.CARS4.hi};});
  console.log('phoneGetsDistantOnly',JSON.stringify(r));if(!r.ok)fails.push('phoneGetsDistantOnly');await ctx.close();}
console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('page errors');
await b.close();
if(fails.length){console.log('FAIL\n  '+fails.join('\n  '));process.exit(1);}
console.log('PASS');
