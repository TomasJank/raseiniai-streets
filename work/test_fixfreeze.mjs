// theft + 8 car hits for 30 s of game time, real loop functions stepped like frame(): node test_fixfreeze.mjs page.html [night]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,night]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get heat(){return heat},set heat(v){heat=v},set tod(v){tod=v},KEY,enterExit,scene,renderer,
 loop(dt){if(player.mode==='car')driveCar(player.car,dt);else walk(dt);updateTraffic(dt);updateMission(dt);updateStreet(dt);updatePolice(dt);updatePeople(dt);updateSmoke(dt);updateMore(dt);updateExtra(dt);updateEnv(dt);updateGrass(dt);drawMini();perfTick(dt);gfxRender();}};`;
fs.writeFileSync(dir+'_fixfreeze.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'_fixfreeze.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});
await p.waitForTimeout(3000);
const r=await p.evaluate(night=>{
 const T=__t,R=T.renderer;document.getElementById('loader').hidden=true;if(night)T.tod=23;
 const count=()=>{let l=0,sp=0;T.scene.traverse(o=>{if(o.isLight)l++;if(o.isSprite)sp++;});return{lights:l,sprites:sp,geo:R.info.memory.geometries,tex:R.info.memory.textures};};
 const steal=()=>{const cs=T.world.cars.filter(q=>q.ai&&q!==T.player.car);const c=cs[Math.floor(Math.random()*cs.length)];T.player.car.speed=0;if(T.player.mode==='car')T.enterExit();
   T.player.x=c.x+1.2;T.player.z=c.z+1.2;T.heat=0;T.enterExit();return c;};
 for(let i=0;i<20;i++)T.loop(.033);
 const spots=()=>{const a=[];T.scene.traverse(o=>{if(o.isSpotLight)a.push(o)});return a;};
 const base=count();
 const ts=[];const timed=n=>{for(let i=0;i<n;i++){const s=performance.now();T.loop(.033);ts.push(performance.now()-s);}};
 // four thefts in a row: the old pair used to stay behind each time
 let ok=true,lit=false;for(let k=0;k<4;k++){const c=steal();T.KEY.KeyW=true;timed(30);const sp=spots();ok=ok&&T.player.car===c&&sp.every(l=>l.parent===c.g.userData.body);lit=sp.some(l=>l.intensity>0)||c.lampsOut||c.dead;}
 const afterThefts=count();
 const car=T.player.car;let t=0,hits=0,hitT=1,mid=null;const dt=.033;
 while(t<30){
  if(t>=hitT&&hits<8){const q=T.peds.filter(z=>z.mode==='walk'||z.mode==='idle').sort((a,b)=>Math.hypot(a.x-car.x,a.z-car.z)-Math.hypot(b.x-car.x,b.z-car.z))[0];
   if(q){const fx=Math.sin(car.h),fz=Math.cos(car.h);q.x=car.x+fx*3;q.z=car.z+fz*3;car.speed=Math.max(car.speed,10);hits++;}hitT+=2.2;}
  T.KEY.KeyW=true;const s=performance.now();T.loop(dt);ts.push(performance.now()-s);t+=dt;
  if(ts.at(-1)>2000)return{hang:true};
  if(!mid&&t>10)mid=count();
 }
 T.KEY.KeyW=false;const end=count();
 return{hang:false,ok,base,afterThefts,mid,end,hits,max:Math.max(...ts),mean:ts.reduce((a,b)=>a+b,0)/ts.length,n:ts.length,lit};
},!!night);
const fails=[];const A=(n,c)=>{console.log(c?'ok  ':'FAIL',n);if(!c)fails.push(n);};
console.log(JSON.stringify({...r,mean:+r.mean?.toFixed(2),max:+r.max?.toFixed(1)}));
A('no hang',!r.hang);A('8 hits landed',r.hits===8);A('headlamps follow the stolen car',r.ok);
A('light count constant over 4 thefts',r.afterThefts.lights===r.base.lights);
A('max step < 50 ms',r.max<50);A('mean step < 8 ms',r.mean<8);
A('no growth during hits (lights, sprites, geometries, textures)',r.mid.lights===r.end.lights&&r.end.sprites<=r.mid.sprites+4&&r.end.geo<=r.mid.geo+4&&r.end.tex<=r.mid.tex+2);
if(night)A('headlamps lit at night',r.lit);
A('no page errors',!errs.length);if(errs.length)console.log(errs.slice(0,4));
console.log(fails.length?'FAIL '+fails.join(' | '):'PASS');await b.close();process.exit(fails.length?1:0);
