// drive3 checks (per-model performance, speed bumps): node test_drive3.mjs page.html [out.json]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,outJson]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get shake(){return shake},set shake(v){shake=v},KEY,get D3(){return D3},
  driveCar,updateTraffic,updatePeople,updateBus,newCar,syncCar,ride,get peds(){return peds},get cops(){return cops},get CARS4(){return CARS4},get bus(){return bus},
  d3Cap,d3H,d3P,driveCop,get camera(){return camera},get GY(){return GY},get csWant(){return csWant},get CS(){return CS},
  stub(on){if(on){this.s={cc:collideCar,iw:inWater,gr:world.ground,pn:parkedNear,cars:world.cars};collideCar=(x,z)=>({x,z,hit:null});inWater=()=>false;world.ground=()=>2;parkedNear=()=>[];world.cars=[];}
    else{collideCar=this.s.cc;inWater=this.s.iw;world.ground=this.s.gr;parkedNear=this.s.pn;world.cars=this.s.cars;}},
  bumps:[],hookSound(){if(this.hooked)return;this.hooked=1;const f=carBumpSound,L=this.bumps;carBumpSound=function(s){L.push(s);return f(s);};},
  model(k){const F=CARS4.models[k]||CARS4.extra[k];const c=newCar(world.start[0],world.start[1],0,0x74767a,F);world.cars.splice(world.cars.indexOf(c),1);
    player.car=c;player.mode='car';return c;}};`;
fs.writeFileSync(dir+'_drive3.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:900,height:520}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_drive3.html',{timeout:300000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});await p.waitForTimeout(3000);
await p.keyboard.press('KeyH');await p.waitForTimeout(500);
const fails=[],out={};
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}out[name]=r;console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};

await check('bumpsPlacedOneMesh',()=>{const D=__t.D3,m=D.mesh;let n=0;__t.world&&m&&m.parent.traverse(o=>{if(o.name==='bumps')n++;});
  return{ok:D.B.length>=7&&n===1&&!!m.geometry.attributes.position.count,bumps:D.B.map(B=>[B.id,B.kind,+B.x.toFixed(1),+B.z.toFixed(1),+(2*B.hw).toFixed(1)]),meshes:n,verts:m&&m.geometry.attributes.position.count};});

// each model on a straight: asphalt, no walls, full throttle from rest; 0-100 km/h (27.78 m/s) and the speed after 45 s
await check('perModelTopAndAccel',()=>{const T=__t,keys=Object.keys(T.D3.P).filter(k=>k!=='aero_bus'),dt=1/60,res={};let ok=true;T.stub(true);const p0=T.player.car;
  for(const k of keys){const c=T.model(k),P=T.d3P(c);c.x=T.world.start[0];c.z=T.world.start[1];c.h=0;c.trav=0;c.speed=0;c.hp=1;c.ride=null;
    for(const q in T.KEY)T.KEY[q]=false;T.KEY.KeyW=true;let t=0,t100=null;
    for(let i=0;i<45*60;i++){c.x=T.world.start[0];c.z=T.world.start[1];T.driveCar(c,dt);t+=dt;if(t100==null&&c.speed>=27.78)t100=t;}
    T.KEY.KeyW=false;const top=c.speed,e1=Math.abs(top/P.T-1),e2=t100&&P.t100g?Math.abs(t100/P.t100g-1):1;
    res[k]={key:P.key,real:[P.top,P.t100,P.kg],game:[+P.T.toFixed(2),+P.A.toFixed(2),+(P.t100g||0).toFixed(2)],measured:[+top.toFixed(2),t100&&+t100.toFixed(2)],ok:e1<.1&&e2<.1};
    if(!res[k].ok)ok=false;}
  T.stub(false);T.player.car=p0;return{ok,res};});

await check('heavierStopsLonger',()=>{const T=__t,dt=1/60,res={};T.stub(true);const p0=T.player.car;
  for(const k of['ibiza2','audi80','w124','sprinter']){const c=T.model(k);c.h=0;c.trav=0;c.speed=25;c.hp=1;for(const q in T.KEY)T.KEY[q]=false;T.KEY.KeyS=true;let d=0;
    for(let i=0;i<600&&c.speed>0;i++){const x=c.x,z=c.z;T.driveCar(c,dt);d+=Math.hypot(c.x-x,c.z-z);}T.KEY.KeyS=false;res[k]={kg:T.d3P(c).kg,brake:+T.d3P(c).brake.toFixed(2),stopM:+d.toFixed(1)};}
  T.stub(false);T.player.car=p0;const s=Object.values(res).map(r=>r.stopM);return{ok:s.every((v,i)=>!i||v>s[i-1]),res};});

await check('policeQuickerThanStartCar',()=>{const P=__t.D3.P,a=P.audi80,c=P.octavia2_pol;return{ok:c.T>a.T&&c.t100g<a.t100g,audi:[+a.T.toFixed(1),+a.t100g.toFixed(2)],police:[+c.T.toFixed(1),+c.t100g.toFixed(2)]};});

// a traffic car on the edge through a bump, and the same run with the bumps hidden
await check('aiSlowsBeforeBump',()=>{const T=__t,W=T.world,G=W.graph,D=T.D3,res=[];
  for(const B of D.B){let e=null;
    for(const [k,n] of G)for(const o of n.out){const m=G.get(o);if(!m)continue;const dx=m.x-n.x,dz=m.z-n.z,L=Math.hypot(dx,dz);if(L<40)continue;
      const t=((B.x-n.x)*dx+(B.z-n.z)*dz)/L/L,d=Math.abs((B.x-n.x)*dz-(B.z-n.z)*dx)/L;if(t*L>35&&t<.95&&d<3){e={from:k,to:o,len:L,t};break;}}
    if(!e)continue;
    const run=hide=>{const keep=D.B;if(hide)D.B=[];const c=T.newCar(0,0,0,0xffffff,T.CARS4.models.audi80),others=W.cars.filter(q=>q!==c&&q.ai);for(const q of others)q.ai0=q.ai,q.ai=null;
      c.ai={from:e.from,to:e.to,t:0,len:e.len,cruise:13};const A=G.get(e.from);c.x=A.x;c.z=A.z;c.h=Math.atan2(G.get(e.to).x-A.x,G.get(e.to).z-A.z);c.speed=12;let vAt=null,best=9;
      for(let i=0;i<400;i++){T.updateTraffic(1/60);const d=Math.hypot(c.x-B.x,c.z-B.z);if(d<best){best=d;vAt=c.speed;}}
      for(const q of others)q.ai=q.ai0;W.cars.splice(W.cars.indexOf(c),1);c.g.parent&&c.g.parent.remove(c.g);D.B=keep;return vAt;};
    const v1=run(false),v0=run(true);res.push({id:B.id,withBump:v1&&+v1.toFixed(2),noBump:v0&&+v0.toFixed(2)});if(res.length>=3)break;}
  const cap=T.d3Cap({x:D.B[0].x-D.B[0].ux*20,z:D.B[0].z-D.B[0].uz*20,h:Math.atan2(D.B[0].ux,D.B[0].uz)},3),copCap=T.d3Cap({x:D.B[0].x-D.B[0].ux*20,z:D.B[0].z-D.B[0].uz*20,h:Math.atan2(D.B[0].ux,D.B[0].uz)},9);
  return{ok:res.length>0&&res.every(r=>r.withBump!=null&&r.withBump<6&&r.noBump>r.withBump+3),res,busCapAt20m:+cap.toFixed(2),copCapAt20m:+copCap.toFixed(2)};});

// the player's Audi 80 over a table at a held speed: air time from ride(), camera shake, the bump sound
const pass=v=>{const T=__t,W=T.world,B=T.D3.B.find(q=>q.kind==='table'),c=T.player.car,dt=1/60;T.hookSound();T.bumps.length=0;
  c.h=Math.atan2(B.ux,B.uz);c.trav=c.h;c.x=B.x-B.ux*Math.max(25,v*1.6);c.z=B.z-B.uz*Math.max(25,v*1.6);c.hp=1;c.ride=null;c.speed=v;for(const q in T.KEY)T.KEY[q]=false;
  T.stub(true);for(let i=0;i<30;i++){c.speed=v;T.driveCar(c,dt);}T.shake=0;let air=0,maxAir=0,shk=0,lift=0,y0=c.ride.y;
  for(let i=0;i<Math.ceil((Math.max(25,v*1.6)+12)/v/dt);i++){c.speed=v;T.driveCar(c,dt);if(c.ride.air>0)air+=dt;maxAir=Math.max(maxAir,c.ride.air);shk=Math.max(shk,T.shake);
    lift=Math.max(lift,c.ride.y-T.GY(c.x,c.z)-T.world.surf0(c.x,c.z)-.55);}
  T.stub(false);return{kmh:Math.round(v*3.6),bump:B.id,airS:+air.toFixed(3),longestAirS:+maxAir.toFixed(3),maxShake:+shk.toFixed(2),maxBodyRiseM:+lift.toFixed(3),sounds:T.bumps.map(s=>+s.toFixed(2))};};
await check('fastPassLiftsAndShakes',v=>{const r=(0,eval)('('+v+')')(20);r.ok=r.airS>.08&&r.maxShake>.5&&r.sounds.length>=1&&r.sounds[0]>.5;return r;},pass.toString());
await check('slowPassRocksOnly',v=>{const r=(0,eval)('('+v+')')(4);r.ok=r.airS===0&&r.maxShake<.1;return r;},pass.toString());

// a pedestrian sent across every bump: walks it at the usual pace on the raised deck and finishes the crossing. Traffic is lifted out
// for the run (a car passing can make the ped flee, which is the game working, not the bump); the player's car waits 25 m down the road.
await check('pedCrossesBumps',()=>{const T=__t,W=T.world,cars=W.cars,res=[];W.cars=[];let ok=true;
  for(const B of T.D3.B){const pc=T.player.car;pc.x=B.x+B.ux*25;pc.z=B.z+B.uz*25;pc.speed=0;T.player.x=pc.x;T.player.z=pc.z;const w=B.hw+1.2;T.camera.position.set(pc.x,T.GY(pc.x,pc.z)+4,pc.z);T.camera.updateMatrixWorld();
    // the crowd follows the player and the camera: let it settle round the new spot, then take a walking ped from it
    for(let i=0;i<120;i++)T.updatePeople(1/60);
    // a ped the crowd recycles before it reaches the deck (hidden, respawned elsewhere: never touched the bump) is replaced by the next nearest, up to eight;
    // a ped that got onto the deck and then failed fails the check
    const cand=T.peds.filter(q=>q.mode==='walk').sort((a,b)=>Math.hypot(a.x-B.x,a.z-B.z)-Math.hypot(b.x-B.x,b.z-B.z)).slice(0,8);let r={id:B.id,why:'no walking ped'},tries=0;
    for(const ped of cand){tries++;
      ped.x=B.x+B.uz*w;ped.z=B.z-B.ux*w;ped.cx=B.x-B.uz*w;ped.cz=B.z+B.ux*w;ped.mode='cross';const d0=Math.hypot(ped.cx-ped.x,ped.cz-ped.z);
      let t=0,top=0,done=false;for(let i=0;i<60*20&&!done;i++){T.updatePeople(1/60);t+=1/60;top=Math.max(top,W.surf(ped.x,ped.z)-W.surf0(ped.x,ped.z));if(ped.mode!=='cross')done=true;}
      const end=Math.hypot(ped.x-ped.cx,ped.z-ped.cz);r={id:B.id,mode:ped.mode,endM:+end.toFixed(2),m:+d0.toFixed(1),s:+t.toFixed(1),deck:+top.toFixed(3),tries};
      r.ok=done&&ped.mode==='walk'&&end<1&&top>.06&&t<d0/(ped.sp*1.15)*1.6+1;if(r.ok||top>0)break;}
    if(!r.ok)ok=false;res.push(r);}
  W.cars=cars;return{ok,res};});

await check('carsoundGears',()=>{const T=__t,P=T.D3.P,r={};for(const k of['sprinter','e34','audi80'])r[k]={gears:P[k].ratios.length,bandsMs:P[k].bands.slice(1,-1).map(v=>+v.toFixed(1)),
  rpmAt60kmh:[0,1,2,3,4].map(g=>Math.round(T.csWant(16.7,g,true,{d3p:P[k],g:1})))};return{ok:r.sprinter.bandsMs[0]<r.e34.bandsMs[0]&&T.CS.DIESEL.has('sprinter')&&!T.CS.DIESEL.has('passat_b3'),r};});

await check('noErrors',e=>({ok:e.length===0,errs:e}),errs);
if(outJson)fs.writeFileSync(outJson,JSON.stringify(out,null,1));
await b.close();fs.unlinkSync(dir+'_drive3.html');
console.log(fails.length?'FAIL '+fails.join(', '):'PASS');process.exit(fails.length?1:0);
