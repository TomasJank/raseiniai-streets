// drive2 checks: node test_drive2.mjs page.html   (page = build.sh + add_drive2.py; also runs on a pre-drive2 page for a baseline)
// traffic turn rate / lane offset / building clip over 300 cars x 60 s, signal stop, blocked-ahead gap, updateTraffic cost, handbrake drift numbers
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
const o='function drawMini(){';
let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get signals(){return signals},get TRAFFIC_GEOS(){return TRAFFIC_GEOS},get CAR_COLORS(){return CAR_COLORS},
get D2(){return D2},get tod(){return tod},set tod(v){tod=v},set paused(v){mapOpen=v},KEY,driveCar,updateTraffic,aiPlace,light,resetToRoad,newCar,
step(n,dt=.033){for(let i=0;i<n;i++)driveCar(player.car,dt);}};`;
fs.writeFileSync(dir+'_drive2.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:900,height:520}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
p.setDefaultTimeout(240000);await p.goto('file://'+dir+'_drive2.html',{timeout:240000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:240000});await p.waitForTimeout(1500);
await p.keyboard.press('KeyH');await p.waitForTimeout(500);
const fails=[];
const CS=process.env.CS&&JSON.parse(process.env.CS);if(CS)await p.evaluate(v=>{window.__cs=v},CS);
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}if(r&&r.bcells){if(process.env.CELLS)fs.writeFileSync(process.env.CELLS,JSON.stringify(r.bcells));delete r.bcells;}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};

await check('drift',()=>{const T=__t;if(window.__cs)Object.assign(T.D2,window.__cs);T.resetToRoad();const c=T.player.car;c.speed=0;c.hp=1;T.tod=13;for(const k in T.KEY)T.KEY[k]=false;T.step(60);
  const run=(steer,n)=>{T.resetToRoad();c.speed=0;c.steer=0;T.step(30);T.KEY.KeyW=true;T.step(70);const s0=c.speed;T.KEY.Space=true;if(steer)T.KEY.KeyA=true;let mx=0,sl=0;
    for(let i=0;i<n;i++){T.step(1);mx=Math.max(mx,Math.abs(Math.atan2(Math.sin(c.h-c.trav),Math.cos(c.h-c.trav))));if(c.sliding)sl++;}
    const end=Math.abs(Math.atan2(Math.sin(c.h-c.trav),Math.cos(c.h-c.trav)));for(const k of['KeyW','Space','KeyA'])T.KEY[k]=false;
    return{speedBefore:+s0.toFixed(1),speedAfter:+c.speed.toFixed(1),maxSlipDeg:+(mx*57.3).toFixed(1),endSlipDeg:+(end*57.3).toFixed(1),slidingFrames:sl};};
  const a=run(true,30),long=run(true,120),brake=run(false,60);
  return{ok:true,playtest:a,steer4s:long,handbrakeOnly2s:brake};});

await p.evaluate(()=>{window.fresh=()=>{const T=__t,W=T.world;T.paused=true;for(const c of W.cars)if(c!==T.player.car&&c.ai){c.x=-9999;c.z=-9999;c.ai=null;}return W;};
window.edgeFor=(minLen)=>{const T=__t,G=T.world.graph;for(const [k,n] of G){for(const o of n.out){const m=G.get(o);if(m&&Math.hypot(m.x-n.x,m.z-n.z)>=minLen)return[k,o];}}};});
if(process.env.ONLY==='drift'){await b.close();process.exit(0);}

const cost=await check('updateTrafficCost26',()=>{const T=__t;T.paused=true;const n=T.world.cars.filter(c=>c.ai).length;for(let i=0;i<300;i++)T.updateTraffic(1/60);
  let ms=1e9;const N=1000;for(let r=0;r<7;r++){const t=performance.now();for(let i=0;i<N;i++)T.updateTraffic(1/60);ms=Math.min(ms,(performance.now()-t)/N);}return{ok:true,aiCars:n,msPerCall:+ms.toFixed(4)};});


await check('signalStop',()=>{const T=__t,W=fresh(),G=W.graph,res=[];
  const keyOf=n=>{for(const [k,v] of G)if(v===n)return k;};
  for(const s of T.signals){const kn=keyOf(s.n);if(!kn)continue;let from=null;
    for(const [k,v] of G)if(v.out.includes(kn)&&Math.hypot(v.x-s.n.x,v.z-s.n.z)>=45){from=k;break;}
    if(!from)continue;
    const c=T.newCar(0,0,0,0xaa2222,T.TRAFFIC_GEOS[0]);c.ai={from,to:kn,t:.1,len:Math.hypot(s.n.x-G.get(from).x,s.n.z-G.get(from).z),cruise:11};T.aiPlace(c,true);c.speed=11;
    const hd=Math.atan2(s.n.x-G.get(from).x,s.n.z-G.get(from).z);let tr=-1;for(let T0=0;T0<30;T0+=.5){s.t=T0;if(T.light(s,hd)==='r'&&(T.light(s,hd)==='r')){tr=T0;break;}}
    const al=()=>(s.n.x-c.x)*Math.sin(c.h)+(s.n.z-c.z)*Math.cos(c.h);
    let min=1e9;const t0=tr;for(let i=0;i<60*14;i++){s.t=t0;T.updateTraffic(1/60);min=Math.min(min,al());}
    res.push({stopAl:+al().toFixed(1),minAl:+min.toFixed(1),speed:+c.speed.toFixed(2),passed:min<4});
    c.x=-9999;c.z=-9999;c.ai=null;if(res.length>=4)break;}
  return{ok:res.length>0&&res.every(r=>!r.passed&&r.speed<.2),cases:res};});

await check('blockedAhead',()=>{const T=__t,W=fresh(),G=W.graph,[k,o]=edgeFor(45),A=G.get(k),B=G.get(o),L=Math.hypot(B.x-A.x,B.z-A.z);
  const c=T.newCar(0,0,0,0xaa2222,T.TRAFFIC_GEOS[0]);c.ai={from:k,to:o,t:.1,len:L,cruise:11};T.aiPlace(c,true);c.speed=11;
  const ob=T.newCar(c.x+Math.sin(c.h)*16,c.z+Math.cos(c.h)*16,c.h,0x2222aa,T.TRAFFIC_GEOS[0]);
  let gap=99,min=99;for(let i=0;i<60*3.5;i++){T.updateTraffic(1/60);gap=Math.hypot(ob.x-c.x,ob.z-c.z);min=Math.min(min,gap);}
  const stopped=c.speed;ob.x=-9999;ob.z=-9999;for(let i=0;i<60*4;i++)T.updateTraffic(1/60);
  c.ai=null;return{ok:min>3.2&&stopped<.3&&c.speed>3,minGapM:+min.toFixed(2),speedAt3p5s:+stopped.toFixed(2),speed4sAfterClear:+c.speed.toFixed(2)};});

await check('traffic300',()=>{const T=__t,W=T.world,G=W.graph;T.paused=true;
  let sd=1234;Math.random=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const de=W.edges.filter(e=>e.cls<=1);
  while(W.cars.filter(c=>c.ai).length<300){const e=de[Math.floor(Math.random()*de.length)];let from=e.a,to=e.b;if(!G.get(from).out.includes(to)){from=e.b;to=e.a;}
    const A=G.get(from),B=G.get(to);if(!A||!B)continue;const c=T.newCar(A.x,A.z,0,T.CAR_COLORS[0],T.TRAFFIC_GEOS[Math.floor(Math.random()*T.TRAFFIC_GEOS.length)]);
    c.ai={from,to,t:Math.random(),len:Math.max(.1,Math.hypot(B.x-A.x,B.z-A.z)),cruise:8+Math.random()*5};T.aiPlace(c,true);}
  const cars=W.cars.filter(c=>c.ai),dt=1/60,wr=a=>Math.atan2(Math.sin(a),Math.cos(a));
  for(let i=0;i<300;i++)T.updateTraffic(dt);
  const prev=cars.map(c=>c.h),rates=[],offs=[],clip={building:0,wall:0,samples:0},cl=new Set(),hot=new Map(),bc=new Set(),hotc=new Map();
  const corners=[[.9,2],[-.9,2],[.9,-2],[-.9,-2]];
  const t0=performance.now();
  for(let f=0;f<3600;f++){T.updateTraffic(dt);
    cars.forEach((c,i)=>{rates.push(Math.abs(wr(c.h-prev[i]))/dt);prev[i]=c.h;
      const ai=c.ai;if(f%3)return;
      const A=G.get(ai.from),B=G.get(ai.to);if(!A||!B)return;
      if(ai.len>=30&&ai.t>.35&&ai.t<.65){const hx=(B.x-A.x)/ai.len,hz=(B.z-A.z)/ai.len;offs.push(-(c.x-A.x)*hz+(c.z-A.z)*hx);}
      if(c.speed<.5)return;clip.samples++;const fx=Math.sin(c.h),fz=Math.cos(c.h);
      let bld=false;for(const [l,a] of corners){if(W.inBuilding(c.x+Math.cos(c.h)*l+fx*a,c.z-Math.sin(c.h)*l+fz*a)){bld=true;break;}}
      if(bld){clip.building++;cl.add(i);bc.add(Math.round(c.x/6)*6+','+Math.round(c.z/6)*6);}
      if(W.collide(c.x,c.z,1.0).hit){clip.wall++;const kk=Math.round(c.x/6)*6+','+Math.round(c.z/6)*6;hot.set(kk,(hot.get(kk)||0)+1);hotc.set(kk,(hotc.get(kk)||new Set()).add(i));}});}
  const wall=performance.now()-t0;let iso=1e9;for(let r=0;r<5;r++){const a=performance.now();for(let i=0;i<300;i++)T.updateTraffic(dt);iso=Math.min(iso,(performance.now()-a)/300);}
  rates.sort((a,b)=>a-b);const q=x=>rates[Math.min(rates.length-1,Math.floor(x*rates.length))];
  const od=offs.map(v=>Math.abs(v-1.7)).sort((a,b)=>a-b);
  return{ok:true,bcells:[...bc],cars:cars.length,simSeconds:60,carSeconds:cars.length*60,turnRate:{p50:+q(.5).toFixed(3),p99:+q(.99).toFixed(2),p999:+q(.999).toFixed(2),max:+rates[rates.length-1].toFixed(2)},
    laneOffset:{samples:offs.length,mean:+(offs.reduce((a,b)=>a+b,0)/offs.length).toFixed(3),devMedian:+od[od.length>>1].toFixed(3),devP95:+od[Math.floor(od.length*.95)].toFixed(3),devP99:+od[Math.floor(od.length*.99)].toFixed(3),devMax:+od[od.length-1].toFixed(2)},
    clip:{movingSamples:clip.samples,buildingCornerHits:clip.building,carsWithBuildingHit:cl.size,wallHits:clip.wall,hotCells:[...hot].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>k+':'+v+'/cars'+hotc.get(k).size)},msPerCall300:+iso.toFixed(3)};});

console.log('errors',JSON.stringify(errs));
if(errs.length)fails.push('pageerrors');
await b.close();process.exit(fails.length?1:0);
