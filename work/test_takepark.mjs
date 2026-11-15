// takepark: node test_takepark.mjs page.html   (Metal; exits 1 on a failed check; writes _takepark.html and takepark_*.png beside itself)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const dir=new URL('.',import.meta.url).pathname,o='function drawMini(){';
const h=fs.readFileSync(process.argv[2],'utf8');if(h.split(o).length!==2)throw new Error('hook');
fs.writeFileSync(dir+'_takepark.html',h.replace(o,'window.__e=s=>eval(s);'+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'_takepark.html',{timeout:300000});
await p.waitForFunction(()=>window.__e&&__e('typeof CARS4!=="undefined"&&CARS4.hi&&PARKED.cars.length>0'),null,{timeout:300000,polling:500});await p.waitForTimeout(1500);
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};
const E=s=>p.evaluate(s=>__e(s),s);
// a parked car with no real car within 12 m; the player stands 2.5 m to its side, on foot
const pick=await E(`(()=>{tod=13;if(player.mode==='car')enterExit();
  const o=PARKED.cars.find(q=>!world.cars.some(c=>Math.hypot(c.x-q.x,c.z-q.z)<12)&&!world.inBuilding(q.x+Math.cos(q.h)*2.5,q.z-Math.sin(q.h)*2.5));
  player.x=o.x+Math.cos(o.h)*2.5;player.z=o.z-Math.sin(o.h)*2.5;player.h=o.h;window.__o=o;
  return{x:o.x,z:o.z,h:o.h,c:o.c,key:LOT_GEOS[o.k].cars4,parked:PARKED.cars.length,cars:world.cars.length,mode:player.mode};})()`);
await p.waitForTimeout(800);await p.screenshot({path:dir+'takepark_before.png'});
await p.keyboard.press('KeyE');await p.waitForTimeout(800);await p.screenshot({path:dir+'takepark_after.png'});
const got=await E(`(()=>{const c=player.car,F=c&&c.g.userData.car2;return{mode:player.mode,parked:PARKED.cars.length,cars:world.cars.length,gone:!PARKED.cars.includes(__o),
  dx:c?Math.hypot(c.x-__o.x,c.z-__o.z):null,dh:c?Math.abs(c.h-__o.h):null,key:F&&F.key,near:parkedNear(__o.x,__o.z).includes(__o),
  col:c?(m=>m.userData.cars4c!=null?m.userData.cars4c:null)(c.g.userData.body.children[0].material):null,same:c&&F?c.g.userData.body.children[0].material===(F.mask?F.mats.get(cars4Own(F,__o.c)):F.mat):null};})()`);
check('E by a parked car puts the player in a car of that model and colour in its place',got.mode==='car'&&got.dx<1&&got.dh<.05&&got.key===pick.key&&got.same===true,{pick,got});
check('the parked one is gone from the list and from collision',got.gone&&!got.near&&got.parked===pick.parked-1&&got.cars===pick.cars+1,{parked:[pick.parked,got.parked],cars:[pick.cars,got.cars]});
const box=await E(`(()=>{const hit=(x,z)=>{const r=collideCar(x,z,1.05,{speed:0});return Math.hypot(r.x-x,r.z-z)>.02&&Array.isArray(r.hit&&r.hit.prop);};
  const q=PARKED.cars.find(q=>Math.hypot(q.x-__o.x,q.z-__o.z)>30);return{taken:hit(__o.x,__o.z),other:hit(q.x,q.z)};})()`);
check('its wall box is gone, another parked car keeps its own',!box.taken&&box.other,box);
// forwards, or backwards out of a bay that faces a tree or a wall
const drive=async k=>{await p.keyboard.down(k);await p.waitForTimeout(2500);await p.keyboard.up(k);return E(`(()=>{const c=player.car;return{moved:Math.hypot(c.x-__o.x,c.z-__o.z),speed:c.speed};})()`);};
// 2 m is clear of the old box; this bay has a tree in front and a row of cars behind
let mv=await drive('KeyW');if(mv.moved<2)mv=await drive('KeyS');
check('the taken car drives',mv.moved>2,mv);
// on foot with nothing near: E does nothing and no parked car is lost
const none=await E(`(()=>{player.car.speed=0;enterExit();const n=PARKED.cars.length,w=world.cars.length;
  let x=player.x,z=player.z;for(let k=0;k<400;k++){x+=7;if(!world.inBuilding(x,z)&&!world.cars.some(c=>Math.hypot(c.x-x,c.z-z)<8)&&!parkedNear(x,z).some(q=>Math.hypot(q.x-x,q.z-z)<8))break;}
  player.x=x;player.z=z;enterExit();return{mode:player.mode,same:PARKED.cars.length===n&&world.cars.length===w};})()`);
check('E away from any car changes nothing',none.mode==='foot'&&none.same,none);
check('no page errors',!errs.length,errs.slice(0,3));
await b.close();process.exit(fails?1:0);
