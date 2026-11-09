// animal core checks, exits 1 on any failure: node test_animals.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_animals']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get tod(){return tod},set tod(v){tod=v},get heat(){return heat},set heat(v){heat=v},
get cash(){return cash},set cash(v){cash=v},get GY(){return GY},SPECIES,ANIMALS,ANIMAL_N,updateAnimals,animWander,resetToRoad,renderer,scene,camera,
live(){return Object.values(ANIMALS).flat().filter(a=>a.mode!=='hide')},
steps(n,dt=.033){for(let i=0;i<n;i++)updateAnimals(dt);},
segD(x,z,s){const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t);},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_animals.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_animals.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const fails=[];
const ev=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={fail:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(r&&r.fail)fails.push(name+': '+r.fail);return r;};

// park the car 50 m from the densest patch of garden fences
await ev('setup',()=>{const T=__t,S=T.world.hedgeSegs,P=T.player;let best=null,bn=0;
  for(let i=0;i<S.length;i+=7){const s=S[i];let n=0;for(const q of S)if(Math.abs(q[0]-s[0])<150&&Math.abs(q[1]-s[1])<150)n++;if(n>bn){bn=n;best=s;}}
  const c=P.car;c.x=best[0]+50;c.z=best[1];c.speed=0;T.resetToRoad();P.car.speed=0;P.x=P.car.x;P.z=P.car.z;
  T.SPECIES.zz_day={rig:'bird',scale:.35,where:'pole',tod:[6,20],n:4,speed:5,colours:[[0x7d8088,0x5d6068]],behave(a,dt){if((a.timer-=dt)<=0){a.timer=1+Math.random()*2;a.mode=a.mode==='fly'?'perch':'fly';}}};
  const stay=(a,dt)=>{a.sp=0;};
  T.SPECIES.zz_field={rig:'quad',scale:.5,where:'field',tod:[21,5],n:2,speed:6,behave:stay};T.SPECIES.zz_forest={rig:'quad',scale:1.2,legs:.8,where:'forest',tod:[21,5],n:2,speed:8,behave:stay};
  T.SPECIES.zz_night={rig:'bat',scale:1,where:'lamp',tod:[21,5],n:12,speed:6,behave(a,dt){a.phase+=dt*3;a.x=a.lamp[0]+Math.cos(a.phase)*2.5;a.z=a.lamp[2]+Math.sin(a.phase)*2.5;}};
  return{fencesIn150m:bn,at:[Math.round(P.x),Math.round(P.z)],species:Object.keys(T.SPECIES),green:T.world.green.length,forests:T.world.green.filter(g=>g[1]).length};});

await ev('day',()=>{const T=__t,W=T.world,P=T.player;T.tod=13;T.steps(300);const L=T.live(),n=s=>L.filter(a=>a.name===s).length;
  const quads=L.filter(a=>a.rig==='quad').length,far=L.filter(a=>Math.hypot(a.x-P.x,a.z-P.z)>190).length,inB=L.filter(a=>a.rig!=='bat'&&W.inBuilding(a.x,a.z)).length;
  const cats=L.filter(a=>a.name==='cat'),sitting=cats.filter(a=>a.mode==='sit'),offFence=sitting.filter(a=>Math.min(...W.hedgeSegs.map(s=>T.segD(a.x,a.z,s)))>.5).length;
  const r={quads,cats:cats.length,sitting:sitting.length,offFence,far,inB,day:n('zz_day'),night:n('zz_night'),fenceTop:sitting.map(a=>+a.y.toFixed(2))};
  const f=[];if(quads>T.ANIMAL_N)f.push('too many');if(far)f.push('beyond 190 m');if(inB)f.push('inside a building');if(!sitting.length)f.push('no cat on a fence');if(offFence)f.push('cat off its fence');if(r.night)f.push('night species by day');if(!r.day)f.push('no day species');
  if(f.length)r.fail=f.join(', ');return r;});

const sh=await p.evaluate(()=>{const T=__t,a=T.live().find(q=>q.name==='cat'&&q.mode==='sit');if(!a)return null;const y=T.GY(a.x,a.z)+a.y,s=a.seg,dx=s[2]-s[0],dz=s[3]-s[1],L=Math.hypot(dx,dz);
  return T.shot([a.x-dz/L*2.2+dx/L*.8,y+.7,a.z+dx/L*2.2+dz/L*.8],[a.x,y+.15,a.z]);});
if(sh)fs.writeFileSync(`${dir}${out}/cat_fence.png`,Buffer.from(sh.split(',')[1],'base64'));

await ev('approachOnFoot',()=>{const T=__t,P=T.player,a=T.live().find(q=>q.name==='cat'&&q.mode==='sit');if(!a)return{fail:'no sitting cat'};
  const s=a.seg,dx=s[2]-s[0],dz=s[3]-s[1],L=Math.hypot(dx,dz),car=P.car,keep=[P.x,P.z,P.h];
  P.mode='foot';P.x=a.x-dz/L*2.5;P.z=a.z+dx/L*2.5;P.h=Math.atan2(a.x-P.x,a.z-P.z);let off=0;for(let i=0;i<60;i++){T.steps(1);off=Math.max(off,T.segD(a.x,a.z,s));}
  const r={mode:a.mode,y:+a.y.toFixed(2),fromFence:+off.toFixed(2),fromPlayer:+Math.hypot(a.x-P.x,a.z-P.z).toFixed(2)};
  P.mode='car';P.car=car;[P.x,P.z,P.h]=keep;if(a.mode==='sit'||r.fromFence<.5||r.y>.01)r.fail='cat stayed on the fence';window.__cat=a;return r;});

const sh2=await p.evaluate(()=>{const T=__t,a=window.__cat;if(!a)return null;T.steps(8);const y=T.GY(a.x,a.z);return T.shot([a.x+Math.cos(a.h)*1.6,y+.6,a.z-Math.sin(a.h)*1.6],[a.x,y+.2,a.z]);});
if(sh2)fs.writeFileSync(`${dir}${out}/cat_run.png`,Buffer.from(sh2.split(',')[1],'base64'));

// without add_voice the core falls through to a page-level sfxAnimal, so a stub there counts the calls
await ev('runOver',(voice)=>{const T=__t,P=T.player,c=P.car,a=window.__cat,calls=[];if(!a||a.mode==='hide')return{fail:'cat gone'};window.sfxAnimal=k=>calls.push(k);
  T.cash=500;T.heat=0;const hp0=c.hp??1;let ups=0,downs=0,h0=T.heat,m0=T.cash;
  c.h=a.h+Math.PI;c.x=a.x-Math.sin(c.h)*4;c.z=a.z-Math.cos(c.h)*4;P.x=c.x;P.z=c.z;P.h=c.h;
  for(let i=0;i<60;i++){c.speed=10;c.x+=Math.sin(c.h)*10*.033;c.z+=Math.cos(c.h)*10*.033;P.x=c.x;P.z=c.z;T.steps(1);
    if(T.heat>h0)ups++;if(T.cash<m0)downs++;h0=T.heat;m0=T.cash;}
  const r={heat:T.heat,cash:T.cash,heatRises:ups,cashDrops:downs,catMode:a.mode,hp:+((c.hp??1)-hp0).toFixed(3),sounds:calls};T.heat=0;c.speed=0;delete window.sfxAnimal;
  if(ups!==1||downs!==1||T.cash!==480||r.heat!==1||a.mode!=='down')r.fail='hit not counted exactly once';else if(!voice&&!calls.includes('meow'))r.fail='no sound on the hit';return r;},h.includes('function sfxAnimal('));

await ev('fallenPole',()=>{const T=__t,b=T.live().find(q=>q.name==='zz_day'&&q.pole);if(!b)return{fail:'no perched bird'};const q=b.pole;q.down=true;T.steps(1);const left=b.leave;T.steps(700);
  const on=T.live().filter(o=>o.pole===q&&!o.leave).length;q.down=false;const r={leftAtOnce:left,newOnFallen:on,gone:b.mode==='hide'};if(!left||on||!r.gone)r.fail='bird stayed on a fallen pole';return r;});

await ev('night',()=>{const T=__t,W=T.world;T.tod=23;T.steps(700);const L=T.live(),n=s=>L.filter(a=>a.name===s).length;
  const r={day:n('zz_day'),night:n('zz_night'),cats:n('cat'),inB:L.filter(a=>a.rig!=='bat'&&W.inBuilding(a.x,a.z)).length};
  const f=[];if(r.day)f.push('day species at 23:00');if(!r.night)f.push('no night species');
  const isF=a=>W.green.find(g=>g[0]===a.green)[1];if(L.some(a=>a.name==='zz_forest'&&!isF(a)||a.name==='zz_field'&&isF(a)))f.push('wrong green kind');if(r.inB)f.push('inside a building');if(f.length)r.fail=f.join(', ');return r;});

// hares and deer: beside the nearest field and forest polygon, each spawns inside its own kind
await ev('greenEdge',()=>{const T=__t,W=T.world,P=T.player,c=P.car,keep=[c.x,c.z],r={};
  for(const [k,isF] of[['field',false],['forest',true]]){
    const F=W.green.filter(g=>g[1]===isF).map(g=>g[0]).sort((a,b)=>Math.hypot(a[0][0]-keep[0],a[0][1]-keep[1])-Math.hypot(b[0][0]-keep[0],b[0][1]-keep[1]))[0];
    c.x=F[0][0]+60;c.z=F[0][1];c.speed=0;P.x=c.x;P.z=c.z;T.tod=23;T.steps(300);
    const L=T.live().filter(a=>a.name==='zz_'+k);r[k]=L.length;r[k+'Right']=L.filter(a=>W.green.find(g=>g[0]===a.green)[1]===isF&&!W.inBuilding(a.x,a.z)).length;}
  c.x=keep[0];c.z=keep[1];P.x=c.x;P.z=c.z;T.steps(1);if(!r.field||!r.forest||r.fieldRight!==r.field||r.forestRight!==r.forest)r.fail='green spawn';return r;});

// full quadruped pool: a stub walker fills the remaining slots on pavements
await ev('budget',()=>{const T=__t,P=T.player,W=T.world;T.tod=13;
  T.SPECIES.zz_walker={rig:'quad',scale:.8,where:'pavement',tod:[0,24],n:T.ANIMAL_N,speed:3,colours:[[0x6b5038,0x3a2a1c]],behave(a,dt){T.animWander(a,dt,1.2);}};
  T.steps(200);let tot=0,worst=0;for(let i=0;i<300;i++){const t0=performance.now();T.updateAnimals(.033);const t=performance.now()-t0;tot+=t;worst=Math.max(worst,t);}
  const L=T.live(),quads=L.filter(a=>a.rig==='quad');
  const r={quads:quads.length,birds:L.filter(a=>a.rig==='bird').length,bats:L.filter(a=>a.rig==='bat').length,avgMs:+(tot/300).toFixed(4),worstMs:+worst.toFixed(3),
    far:L.filter(a=>Math.hypot(a.x-P.x,a.z-P.z)>190).length,inB:quads.filter(a=>W.inBuilding(a.x,a.z)).length};
  const f=[];if(r.quads>T.ANIMAL_N)f.push('pool overflow');if(r.avgMs>=.3)f.push('over 0.3 ms');if(r.far)f.push('beyond 190 m');if(r.inB)f.push('inside a building');if(f.length)r.fail=f.join(', ');return r;});

console.log('errors',JSON.stringify(errs.slice(0,6)));
if(errs.length)fails.push('page errors');
await b.close();
if(fails.length){console.log('FAIL',JSON.stringify(fails));process.exit(1);}
console.log('PASS');
