// people behaviour checks: node test_people.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_people']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get bus(){return bus},get signals(){return signals},get tod(){return tod},set tod(v){tod=v},
get heat(){return heat},set heat(v){heat=v},get GY(){return GY},KEY,updatePeople,updateTraffic,updateBus,crashFX,light,resetToRoad,syncCar,renderer,scene,camera,
steps(n,dt=.033,traffic=true){for(let i=0;i<n;i++){if(traffic)updateTraffic(dt);updatePeople(dt);}},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_people.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_people.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const ev=async(name,fn,arg)=>{try{const r=await p.evaluate(fn,arg);console.log(name,JSON.stringify(r));return r;}catch(e){console.log(name,'FAILED',e.message.split('\n')[0]);return null;}};
const CALM="['walk','idle','wait','stop','cross','goto']";

// move the player to the centre (Maxima) and park
await ev('setup',()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text));const c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;return{at:[Math.round(T.player.x),Math.round(T.player.z)]};});
await ev('density',()=>{const T=__t,n=()=>T.peds.filter(q=>q.mode!=='hide').length;T.tod=13;T.steps(400);const day=n();T.tod=2.5;T.steps(500);const night=n();T.tod=13;T.steps(400);return{day,night,max:T.peds.length};});
await ev('spacing',(C)=>{const T=__t,calm=eval(C);T.steps(300);const q=T.peds.filter(z=>calm.includes(z.mode));let min=Infinity,pairs=0;
  for(let i=0;i<q.length;i++)for(let j=i+1;j<q.length;j++){if(q[i].lead===q[j]||q[j].lead===q[i]){pairs++;continue;}min=Math.min(min,Math.hypot(q[i].x-q[j].x,q[i].z-q[j].z));}
  const modes={};for(const z of T.peds)modes[z.mode]=(modes[z.mode]||0)+1;return{minGapM:+min.toFixed(2),partnersTogether:pairs,modes,withDest:T.peds.filter(z=>z.dest).length};},CALM);
await ev('crossing',()=>{const T=__t,seen=new Map(),cnt={wait:0,cross:0,done:0,gaveUp:0};
  for(let i=0;i<1800;i++){T.steps(1);for(const q of T.peds){const was=seen.get(q);if(was!==q.mode){if(q.mode==='wait')cnt.wait++;if(q.mode==='cross')cnt.cross++;if(was==='cross'&&q.mode==='walk')cnt.done++;if(was==='wait'&&q.mode==='walk')cnt.gaveUp++;seen.set(q,q.mode);}}}
  return cnt;});
await ev('redLight',()=>{const T=__t,G=T.world.graph,s=T.signals[0];if(!s)return'no signal';
  const key=[...G].find(([k,n])=>n===s.n)[0],e=T.world.edges.find(e=>(e.a===key||e.b===key)&&e.cls<=1);if(!e)return'no edge';
  const out=[];for(const q of T.peds.filter(z=>z.mode==='walk'&&!z.lead).slice(0,3)){q.e=e;q.t=e.a===key?0:1;q.dir=1;q.side=1;q.dest=null;q.nerv=0;q.react=0;q.mode='wait';q.node=key;q.cx=q.x+1e3;q.cz=q.z;q.timer=60;q.sig=s;}
  const A=G.get(e.a),B=G.get(e.b),hd=Math.atan2(B.x-A.x,B.z-A.z),ws=T.peds.filter(z=>z.sig===s&&z.mode==='wait');let crossed=[],waited=0;
  for(let i=0;i<1200&&crossed.length<ws.length;i++){s.t+=.033;T.steps(1,.033,false);waited++;for(const q of ws)if(q.mode==='cross'&&!q.logged){q.logged=1;crossed.push(T.light(s,hd));q.mode='walk';}}
  return{crossedOn:crossed,waitedS:+(waited*.033).toFixed(1)};});
await ev('panic',()=>{const T=__t,c=T.player.car,cx=c.x,cz=c.z,pool=T.peds.filter(z=>z.mode!=='hide').slice(0,7);
  // five around the crash looking at it, one 20 m away facing away (can't see or hear it), one beside that one facing the others
  pool.forEach((q,i)=>{q.lead=null;q.mode='idle';q.timer=99;q.react=0;q.nerv=0;q.seen=1e9;});
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2,q=pool[i];q.x=cx+Math.sin(a)*12;q.z=cz+Math.cos(a)*12;q.h=Math.atan2(cx-q.x,cz-q.z);}
  const far=pool[5],near=pool[6];far.x=cx+20;far.z=cz;far.h=Math.PI/2;near.x=cx+27;near.z=cz;near.h=-Math.PI/2;
  for(const q of pool)q.seen=0;T.steps(1,.033,false);for(const q of pool)q.seen=1e9;for(const q of pool)q.seen=0;
  for(const z of T.world.cars)if(z.ai)z.speed=0;T.crashFX(c,{nx:1,nz:0},22);const fled=new Map();let ring1=0;
  for(let i=0;i<120;i++){T.steps(1,.033,false);for(const q of pool)if(q.mode==='flee'&&!fled.has(q))fled.set(q,+(i*.033).toFixed(2));if(i===30)ring1=pool.slice(0,5).filter(q=>fled.has(q)).length;}
  return{ringFledWithin1s:ring1+'/5',farFledAtS:fled.get(far)??'never',neighbourFledAtS:fled.get(near)??'never'};});
await ev('dodgeTraffic',()=>{const T=__t,q=T.peds.find(z=>z.mode==='walk'&&!z.lead),car=T.world.cars.find(z=>z.ai&&!z.cop);if(!q||!car)return'none';
  q.nerv=0;const h=q.h;car.x=q.x-Math.sin(h)*8;car.z=q.z-Math.cos(h)*8;car.h=h;car.speed=12;car.stun=0;T.syncCar(car);T.updatePeople(.033);return{pedMode:q.mode};});
await ev('brakesForCrossing',()=>{const T=__t,car=T.world.cars.find(z=>z.ai&&!z.cop&&Math.abs(z.speed)>3);if(!car)return'no moving car';
  const q=T.peds.find(z=>z.mode!=='hide'&&!z.lead);q.mode='cross';q.cx=q.cz=1e6;q.sp=0;q.x=car.x+Math.sin(car.h)*7;q.z=car.z+Math.cos(car.h)*7;q.node=q.e?q.e.a:null;
  const v0=car.speed;let v1=v0,gap=9;for(let i=0;i<60;i++){T.updateTraffic(.033);v1=Math.min(v1,car.speed);gap=Math.min(gap,Math.hypot(q.x-car.x,q.z-car.z));}q.sp=1.4;q.mode='walk';return{before:+v0.toFixed(1),slowest:+v1.toFixed(1),closestM:+gap.toFixed(1)};});
await ev('bus',()=>{const T=__t,B=T.bus;if(!B)return'no bus';const k=B.at.findIndex(a=>a.st&&a.st.x!=null);const st=B.at[k].st;for(const z of T.world.cars)if(z.ai)z.speed=0;
  const riders=T.peds.filter(z=>z.mode!=='hide'&&!z.lead).slice(0,2);riders.forEach((q,i)=>{q.mode='stop';q.stop=st;q.x=st.x+i;q.z=st.z+.5;q.lead=null;q.react=0;});
  T.player.x=st.x+20;T.player.z=st.z;B.s=B.at[k].s;B.next=k+1;B.wait=8;T.updateBus(.033);
  const got=new Set();for(let i=0;i<150;i++){T.steps(1,.033,false);for(const q of riders)if(q.mode==='hide')got.add(q);}
  return{boarded:got.size+'/2',busToStopM:+Math.hypot(B.x-st.x,B.z-st.z).toFixed(1),stillAtStop:riders.map(q=>q.mode)};});
await ev('groups',()=>{const T=__t;T.steps(200);const f=T.peds.filter(z=>z.lead&&z.mode!=='hide');return{followers:f.length,gapToLeaderM:f.map(z=>+Math.hypot(z.x-z.lead.x,z.z-z.lead.z).toFixed(2))};});
const sh=await p.evaluate(()=>{const T=__t;T.steps(60);const q=T.peds.filter(z=>z.mode!=='hide').sort((a,b)=>Math.hypot(a.x-T.player.x,a.z-T.player.z)-Math.hypot(b.x-T.player.x,b.z-T.player.z))[0];if(!q)return null;const y=T.GY(q.x,q.z);return T.shot([q.x+9,y+5,q.z+9],[q.x,y+1,q.z]);});
if(sh)fs.writeFileSync(`${dir}${out}/crowd.png`,Buffer.from(sh.split(',')[1],'base64'));
console.log('errors',JSON.stringify(errs.slice(0,6)));
await b.close();
