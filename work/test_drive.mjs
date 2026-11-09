// driving-feel checks: node test_drive.mjs page.html
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.R=x=>+x.toFixed(4);window.__t={get world(){return world},get player(){return player},get ENV(){return ENV},get snd(){return snd},get AC(){return AC},get drv(){return drv},get tod(){return tod},set tod(v){tod=v},
KEY,driveCar,walk,updateAudio,resetToRoad,syncCar,collideCar,get smoke(){return smoke},get GY(){return GY},
step(n,dt=.033,each){for(let i=0;i<n;i++){driveCar(player.car,dt);updateAudio(true);if(each)each(i,dt);}}};`;
fs.writeFileSync(dir+'_drive.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:900,height:520}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_drive.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
await p.keyboard.press('KeyH');await p.waitForTimeout(500);
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};
const R=x=>+x.toFixed(4);

await check('setup',()=>{const T=__t;T.resetToRoad();const c=T.player.car;c.speed=0;c.hp=1;T.tod=13;for(let k in T.KEY)T.KEY[k]=false;T.step(60);
  return{ok:T.player.mode==='car'&&!!c.sus&&!!c.lamps,audio:T.AC&&T.AC.state,gear:T.drv.gear};});

await check('accelPitchesNoseUpThenSettles',()=>{const T=__t,c=T.player.car,P=c=>c.g.rotation.x+c.g.userData.body.rotation.x,B=c=>c.g.userData.body.rotation.x;
  c.speed=0;T.step(90);const rest=P(c);T.KEY.KeyW=true;const tot=[],bod=[];T.step(150,.033,()=>{tot.push(P(c)-rest);bod.push(B(c));});T.KEY.KeyW=false;
  const min=Math.min(...tot),bodMin=Math.min(...bod),end=bod[149],late=bod.slice(45,100);const dev=Math.max(...late.map(v=>Math.abs(v-bod[100])));
  return{ok:min<-.004&&bodMin<-.004&&dev<.01,totalMinRad:R(min),bodyMinRad:R(bodMin),bodyDrift1p5to3s:R(dev),speed:R(c.speed)};});

await check('hardBrakePitchesNoseDown',()=>{const T=__t,c=T.player.car,P=c=>c.g.rotation.x+c.g.userData.body.rotation.x,body=c=>c.g.userData.body.rotation.x;
  c.speed=26;T.KEY.KeyW=true;T.step(5);T.KEY.KeyW=false;const before=P(c);T.KEY.KeyS=true;let mx=-9,bx=-9;T.step(30,.033,()=>{mx=Math.max(mx,P(c)-before);bx=Math.max(bx,body(c));});T.KEY.KeyS=false;
  return{ok:mx>.006&&bx>.004,totalMaxRad:R(mx),bodyMaxRad:R(bx),speedAfter:R(c.speed)};});

await check('curbBounceDecays',()=>{const T=__t,c=T.player.car,W=T.world;T.step(120);c.speed=0;T.resetToRoad();T.step(60);
  const x0=c.x+Math.sin(c.h)*14,z0=c.z+Math.cos(c.h)*14,fx=Math.sin(c.h),fz=Math.cos(c.h),old=W.surf;
  W.surf=(x,z)=>((x-x0)*fx+(z-z0)*fz>0?.16:0)+old(x,z);
  const by=[],ys=[];let t=0;
  T.step(160,.033,()=>{c.speed=8;by.push(c.g.userData.body.position.y);ys.push(c.g.position.y);});
  W.surf=old;
  const pk=Math.max(...by.map(Math.abs)),pi=by.findIndex(v=>Math.abs(v)===pk),tail=Math.max(...by.slice(pi+45).map(Math.abs));
  return{ok:pk>.004&&tail<pk*.25,peakBodyHeaveM:R(pk),peakAtFrame:pi,after1p5sM:R(tail)};});

await check('engineFreqRisesWithSpeed',()=>{const T=__t,c=T.player.car,out={};
  // rpm is a sawtooth across gears: it must rise with speed inside a gear and fall back at each shift
  for(const v of[2,4.5,7,10,13.5,17,20,24]){c.speed=v;T.KEY.KeyW=true;for(let i=0;i<50;i++)T.updateAudio(true);out[v]=[R(T.drv.eo),T.drv.gear];}
  T.KEY.KeyW=false;const f=(a,b)=>out[a][0]<out[b][0];
  return{ok:f(2,4.5)&&f(4.5,7)&&f(10,13.5)&&f(17,20)&&out[10][0]<out[7][0]&&out[17][1]>out[10][1],freqAndGearBySpeed:out};});

await check('gearShiftCutsTorque',()=>{const T=__t,c=T.player.car;c.speed=0;T.KEY.KeyW=true;let g0=T.drv.gear,seen=[],cut=0;
  for(let i=0;i<500;i++){c.speed=i*.08;T.updateAudio(true);if(T.drv.gear!==g0){g0=T.drv.gear;seen.push(g0);}if(T.drv.shiftT>0)cut++;}
  T.KEY.KeyW=false;c.speed=0;return{ok:seen.length>=4&&cut>10&&seen.every((g,i)=>!i||g>seen[i-1]),gears:seen,framesWithTorqueCut:cut};});

await check('brakeLightsChange',()=>{const T=__t,c=T.player.car,m=c.lamps.tm;c.speed=14;T.step(10,.033,()=>{c.speed=14;});const idle=m.color.r;
  T.KEY.KeyS=true;T.step(4);const on=m.color.r,op=c.lamps.spr[0].material.opacity;T.KEY.KeyS=false;T.step(3);const off=m.color.r;
  return{ok:on>idle*2&&Math.abs(off-idle)<.01&&op>.5,idle:R(idle),braking:R(on),released:R(off),glowOpacity:op,note:'tail material is MeshBasic, so colour (not emissive) is the lamp level'};});

await check('skidGainWhileSliding',()=>{const T=__t,c=T.player.car;c.speed=24;T.KEY.KeyW=true;T.step(20,.033,()=>{c.speed=Math.max(c.speed,22);});
  T.KEY.Space=true;T.KEY.KeyA=true;let sl=false,sq=0,maxSq=0;T.step(25,.033,()=>{if(c.sliding){sl=true;sq=T.drv.sq;maxSq=Math.max(maxSq,sq);}});
  T.KEY.Space=T.KEY.KeyA=T.KEY.KeyW=false;return{ok:sl&&maxSq>0,sliding:sl,squealTargetGain:R(maxSq),tyreNoiseGain:R(T.snd.tyre.g.gain.value)};});
await p.waitForTimeout(100);
await check('audioNodesAlive',()=>{const T=__t;return{ok:T.AC.state==='running'&&T.snd.eo.o.frequency.value>=28,ctx:T.AC.state,eoHz:R(T.snd.eo.o.frequency.value)};});

await check('damageSagAndSmoke',()=>{const T=__t,c=T.player.car;c.speed=0;c.hp=.3;T.step(120);const s=c.sus;const sag={roll:R(s.br),heave:R(s.by),pitch:R(s.bp)};
  c.hp=.7;const before=T.smoke.filter(q=>q.visible).length;T.step(90);const wisps=T.smoke.filter(q=>q.visible).length;c.hp=1;T.step(120);
  return{ok:Math.abs(sag.roll)>.02&&sag.heave<-.01&&wisps>0&&Math.abs(s.br)<.005,hp03:sag,wispsAtHp07:wisps,rollAfterRepair:R(s.br)};});

await check('impactKicksBody',()=>{const T=__t,c=T.player.car,W=T.world;T.resetToRoad();T.step(60);c.speed=15;
  const bd=W.buildings.find(q=>q.pts&&q.pts.length>3),cx=bd.pts.reduce((a,q)=>a+q[0],0)/bd.pts.length,cz=bd.pts.reduce((a,q)=>a+q[1],0)/bd.pts.length,px=(bd.pts[0][0]+bd.pts[1][0])/2,pz=(bd.pts[0][1]+bd.pts[1][1])/2;
  const L=Math.hypot(px-cx,pz-cz),qx=px+(px-cx)/L*.4,qz=pz+(pz-cz)/L*.4;c.x=qx;c.z=qz;c.h=Math.atan2(cx-px,cz-pz);const s=c.sus,t0=T.drv.impT;s.bv=0;const r=T.collideCar(qx,qz,1.05,c);
  return{ok:!!r.hit&&T.drv.impT>t0&&s.bv>.5,hit:!!r.hit,bodyPitchVel:R(s.bv)};});

// night: headlights on, cone and spotlights; day: off
await p.evaluate(()=>{__t.tod=23;});await p.waitForFunction(()=>__t.ENV.night.value>.8,null,{timeout:60000});
await check('headlightsAtNight',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.speed=0;c.hp=1;c.dead=false;c.lampsOut=false;T.ENV.night.value=1;T.step(5);const on=c.lamps.sl.map(l=>l.intensity);
  c.lampsOut=true;T.step(2);const out=c.lamps.sl[0].intensity;c.lampsOut=false;return{ok:on.every(v=>v>100)&&out===0,onIntensity:on,whenSmashed:out};});
await p.evaluate(()=>{__t.tod=13;});await p.waitForFunction(()=>__t.ENV.night.value<.1,null,{timeout:60000});
await check('headlightsOffByDay',()=>{const T=__t,c=T.player.car;T.step(5);return{ok:c.lamps.sl.every(l=>l.intensity===0),v:c.lamps.sl.map(l=>l.intensity)};});

await p.waitForTimeout(500);
console.log('errors',errs);if(errs.length)fails.push('console');
console.log(fails.length?'FAIL '+fails.join(','):'PASS');await b.close();process.exit(fails.length?1:0);
