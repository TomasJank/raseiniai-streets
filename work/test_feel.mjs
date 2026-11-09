// car feel checks: node test_feel.mjs page.html
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get snd(){return snd},get camRoll(){return camRoll},ENV,set shake(v){shake=v},
KEY,driveCar,collideCar,carHitCar,camFeel,updateAudio,resetToRoad,syncCar,toastText:()=>document.getElementById('toast').textContent,
drive(n,keys,dt=.033){for(const k of keys)KEY[k]=true;for(let i=0;i<n;i++)driveCar(player.car,dt);for(const k of keys)KEY[k]=false;}};`;
fs.writeFileSync(dir+'_feel.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_feel.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
await p.keyboard.press('KeyH');await p.waitForTimeout(300);
const ev=async(name,fn)=>{try{const r=await p.evaluate(fn);console.log(name,JSON.stringify(r));return r;}catch(e){console.log(name,'FAILED',e.message.split('\n')[0]);return null;}};
// a straight run of 70 m on one kind of ground with nothing in the way
const finder=`(want)=>{const W=__t.world,B=W.box;for(let k=0;k<15000;k++){const x=B.minX+Math.random()*(B.maxX-B.minX),z=B.minZ+Math.random()*(B.maxZ-B.minZ),a=Math.random()*Math.PI*2;let ok=true;
  for(let t=0;t<=(want===1?35:70)&&ok;t+=2){const px=x+Math.sin(a)*t,pz=z+Math.cos(a)*t;if(W.ground(px,pz)!==want||W.inBuilding(px,pz)||__t.collideCar(px,pz,1.6,null).hit)ok=false;}if(ok)return[x,z,a];}return null;}`;
await p.evaluate(f=>{window.__find=eval(f);},finder);
await ev('ground',()=>{const T=__t,W=T.world,G=W.graph;let road=0,n=0;for(const v of [...G.values()].slice(0,400)){if(v.cls<=1){n++;if(W.ground(v.x,v.z)===2)road++;}}
  const P=W.lotPoly,cx=P.reduce((s,q)=>s+q[0],0)/P.length,cz=P.reduce((s,q)=>s+q[1],0)/P.length;
  return{roadNodesOnTarmac:road+'/'+n,lotCentre:W.ground(cx,cz),grassRun:!!__find(0),gravelRun:!!__find(1)};});
await ev('accel',()=>{const T=__t,c=T.player.car,out={};
  for(const [name,g] of [['tarmac',2],['gravel',1],['grass',0]]){const s=__find(g);if(!s){out[name]=null;continue;}
    c.x=s[0];c.z=s[1];c.h=c.trav=s[2];c.speed=0;c.steer=0;c.hp=1;c.dead=false;c.yawK=0;T.syncCar(c);T.drive(75,['KeyW']);out[name]={after2_5s:+c.speed.toFixed(1),ground:c.gnd};}
  return out;});
await ev('damagePull',()=>{const T=__t,c=T.player.car,s=__find(2)||__find(0),run=hp=>{c.x=s[0];c.z=s[1];c.h=c.trav=s[2];c.speed=14;c.steer=0;c.hp=hp;c.dead=false;c.pull=1;c.yawK=0;T.syncCar(c);T.drive(45,['KeyW']);return+((c.h-s[2])*57.3).toFixed(1);};
  const r={healthyTurnDeg:run(1),wreckedTurnDeg:run(.15)};c.hp=1;return r;});
await ev('spin',()=>{const T=__t,c=T.player.car,s=__find(2)||__find(0);c.x=s[0];c.z=s[1];c.h=c.trav=s[2];c.speed=14;c.yawK=0;c.hp=1;T.syncCar(c);
  const o=T.world.cars.find(q=>q.ai);o.hitT=-1e9;o.x=c.x+Math.sin(c.h)*2+Math.cos(c.h)*1.3;o.z=c.z+Math.cos(c.h)*2-Math.sin(c.h)*1.3;
  T.carHitCar(c,o,-Math.cos(c.h),Math.sin(c.h),14);const sp=c.yawK,h0=c.h;T.drive(15,[]);return{spin:+sp.toFixed(2),headingTurnDeg:+((c.h-h0)*57.3).toFixed(1)};});
await ev('stuck',()=>{const T=__t,W=T.world,c=T.player.car;
  // nose into a building wall
  let put=false;for(const bo of W.buildings){const x=(bo.mnx+bo.mxx)/2,z=bo.mxz+2.6;if(!W.inBuilding(x,z)&&W.inBuilding(x,z-3)&&!W.collide(x,z,1.2).hit){c.x=x;c.z=z;c.h=c.trav=Math.PI;c.speed=0;c.hp=1;c.dead=false;T.syncCar(c);put=true;break;}}
  if(!put)return'no wall';const x0=c.x,z0=c.z;let toastAt=null,resetAt=null;
  for(let i=0;i<300&&resetAt==null;i++){T.drive(1,['KeyW']);if(toastAt==null&&/Stuck/.test(T.toastText()))toastAt=+(i*.033).toFixed(1);if(Math.hypot(c.x-x0,c.z-z0)>4)resetAt=+(i*.033).toFixed(1);}
  return{toastAtS:toastAt,resetAtS:resetAt};});
await ev('camera',()=>{const T=__t;T.shake=.9;T.camFeel(.016);const peak=[];for(let i=0;i<90;i++){T.camFeel(.016);peak.push(Math.abs(T.camRoll));}
  return{peakRollDeg:+(Math.max(...peak)*57.3).toFixed(2),after1_5sDeg:+(peak[peak.length-1]*57.3).toFixed(3)};});
await ev('audio',()=>{const T=__t,c=T.player.car,s=__find(0);if(!T.snd)return'no audio';c.x=s[0];c.z=s[1];c.h=s[2];c.speed=15;c.gnd=0;T.updateAudio(true);return{gravelVoice:!!T.snd.grav};});
console.log('errors',JSON.stringify(errs.slice(0,6)));
await b.close();
