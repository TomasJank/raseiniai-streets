import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get cops(){return cops},get peds(){return peds},get heat(){return heat},set heat(v){heat=v},get cash(){return cash},set cash(v){cash=v},get streak(){return streak},get mission(){return mission},set mission(v){mission=v},
get race(){return race},get garages(){return garages},get landmarks(){return landmarks},get races(){return races},get fare(){return fare},get tod(){return tod},set tod(v){tod=v},weather,ENV,save,
KEY,driveCar,walk,updateTraffic,updatePolice,updatePeople,updateMission,updateSmoke,updateMore,updateEnv,enterExit,addHeat,newMission,startTaxi,hurtCar,nextWeather,renderer,scene,camera,get GY(){return GY},syncCar,resetToRoad,
toastText:()=>document.getElementById('toast').textContent,
step(n,dt=.033){for(let i=0;i<n;i++){if(player.mode==='car')driveCar(player.car,dt);else walk(dt);updateTraffic(dt);updatePolice(dt);updatePeople(dt);updateMission(dt);updateSmoke(dt);updateMore(dt);updateEnv(dt);}},
shot(from,to,fog){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();const f=scene.fog;if(!fog)scene.fog=null;renderer.render(scene,camera);const u=renderer.domElement.toDataURL('image/png');scene.fog=f;return u;}};`;
fs.writeFileSync(dir+'_play.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+dir+'_play.html');await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:90000});await p.waitForTimeout(1500);
const save=async(n,u)=>{if(u)fs.writeFileSync(`${dir}${out}/${n}.png`,Buffer.from(u.split(',')[1],'base64'));};
const ev=async(name,fn,arg)=>{try{const r=await p.evaluate(fn,arg);console.log(name,JSON.stringify(r));return r;}catch(e){console.log(name,'FAILED',e.message.split('\n')[0]);return null;}};
await p.keyboard.press('KeyH');
await ev('places',()=>({garages:__t.garages.map(g=>g.name),landmarks:__t.landmarks.length,races:__t.races.map(r=>r.name+' '+r.cps.length),lamps:__t.world.lamps.length}));
await ev('surface',()=>{const T=__t,c=T.player.car;T.resetToRoad();T.syncCar(c);const out=[];for(const q of T.world.cars.slice(0,12))out.push(+(q.g.position.y-T.GY(q.x,q.z)).toFixed(3));return{lift:out,surfHere:T.world.surf(c.x,c.z)};});
// wheels: side view at road level, and full steering lock from the front
for(const [n,st] of [['wheel_side',0],['wheel_lock',1]]){
  await save(n,await p.evaluate(([st])=>{const T=__t,c=T.player.car;T.resetToRoad();c.speed=0;c.steer=st;T.syncCar(c);const s=Math.sin(c.h),k=Math.cos(c.h),rx=k,rz=-s,y=c.g.position.y;const P=(a,b,u)=>[c.x+s*a+rx*b,y+u,c.z+k*a+rz*b];
    return st?T.shot(P(4.2,2.4,.7),P(1.2,0,.35)):T.shot(P(0,-5,.25),P(0,0,.35));},[st]));}
// a car on the steepest nearby slope
await save('wheel_slope',await p.evaluate(()=>{const T=__t,c=T.player.car,G=T.GY;let best=null,bs=0;for(const n of T.world.graph.values()){if(n.cls>1)continue;const s=Math.abs(G(n.x+3,n.z)-G(n.x-3,n.z))+Math.abs(G(n.x,n.z+3)-G(n.x,n.z-3));if(s>bs){bs=s;best=n;}}
  c.x=best.x;c.z=best.z;c.speed=0;c.steer=0;T.syncCar(c);const s=Math.sin(c.h),k=Math.cos(c.h),y=c.g.position.y;return T.shot([c.x+k*5.5,y+.6,c.z-s*5.5],[c.x,y+.4,c.z]);}));
// people: let them walk, then frame the nearest few
await ev('people',()=>{const T=__t;T.resetToRoad();T.player.car.speed=0;T.step(150);return{walking:T.peds.filter(q=>q.mode==='walk').length};});
for(let i=0;i<2;i++)await save('people'+i,await p.evaluate(i=>{const T=__t;T.step(8);const q=T.peds.filter(z=>z.mode==='walk').sort((a,b)=>Math.hypot(a.x-T.player.x,a.z-T.player.z)-Math.hypot(b.x-T.player.x,b.z-T.player.z))[i];if(!q)return null;const y=T.GY(q.x,q.z),a=q.h+1.2;return T.shot([q.x+Math.sin(a)*3.2,y+1.6,q.z+Math.cos(a)*3.2],[q.x,y+.95,q.z]);},i));
await save('player_walk',await p.evaluate(()=>{const T=__t;T.player.car.speed=0;T.enterExit();T.KEY.KeyW=true;T.step(20);T.KEY.KeyW=false;T.KEY.ShiftLeft=false;const P=T.player,y=T.GY(P.x,P.z),a=P.h+1.4;return T.shot([P.x+Math.sin(a)*3,y+1.4,P.z+Math.cos(a)*3],[P.x,y+.9,P.z]);}));
await p.evaluate(()=>{const T=__t;T.step(1);T.enterExit();});
// water
await save('water',await p.evaluate(()=>{const T=__t;let m=null;T.scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.shininess===110)m=o;});if(!m)return null;const a=m.geometry.attributes.position,c=T.player.car;let bi=0,bd=Infinity;for(let i=0;i<a.count;i+=3){const d=Math.hypot(a.getX(i)-c.x,a.getZ(i)-c.z);if(d<bd){bd=d;bi=i;}}
  const x=a.getX(bi),y=a.getY(bi),z=a.getZ(bi);T.ENV.t.value=3;return T.shot([x+30,y+9,z+22],[x,y,z]);}));
await save('water_pond',await p.evaluate(()=>{const T=__t;let m=null;T.scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.shininess===110)m=o;});const a=m.geometry.attributes.position;let best=0,bc=null;
  for(let i=0;i<a.count;i+=3){const ux=a.getX(i+1)-a.getX(i),uz=a.getZ(i+1)-a.getZ(i),vx=a.getX(i+2)-a.getX(i),vz=a.getZ(i+2)-a.getZ(i),ar=Math.abs(ux*vz-uz*vx)/2;if(ar>best){best=ar;bc=[(a.getX(i)+a.getX(i+1)+a.getX(i+2))/3,a.getY(i),(a.getZ(i)+a.getZ(i+1)+a.getZ(i+2))/3];}}
  const [x,y,z]=bc,L=Math.hypot(70,45);return T.shot([x-70/L*35,y+6,z-45/L*35],[x+70/L*10,y,z+45/L*10]);}));
// day, dusk, night, rain, snow on the same street
const street=async(n,setup)=>save(n,await p.evaluate(s=>{const T=__t;eval(s);T.updateEnv(0);T.step(1,.001);const c=T.player.car,sn=Math.sin(c.h),k=Math.cos(c.h),y=T.GY(c.x,c.z);return T.shot([c.x-sn*9,y+3.6,c.z-k*9],[c.x+sn*6,y+1.4,c.z+k*6],true);},setup));
await p.evaluate(()=>{const T=__t,W=T.world,G=W.graph,c=T.player.car;let best=null,bd=1e9;for(const n of G.values()){if(n.cls>0||!n.out.length)continue;const d=Math.hypot(n.x-W.center[0],n.z-W.center[1]);if(d<bd){bd=d;best=n;}}const nx=G.get(best.out[0]);c.x=best.x;c.z=best.z;c.h=Math.atan2(nx.x-best.x,nx.z-best.z);c.speed=0;T.syncCar(c);T.player.x=c.x;T.player.z=c.z;T.player.h=c.h;T.step(40);c.speed=0;});
await street('env_day',"T.tod=13;T.weather.kind='clear';T.weather.amt=T.weather.want=0;");
await street('env_dusk',"T.tod=20;");
await street('env_night',"T.tod=23;");
await street('env_rain',"T.tod=14;T.weather.kind='rain';T.weather.amt=T.weather.want=1;");
await street('env_snow',"T.tod=11;T.weather.kind='snow';T.weather.amt=T.weather.want=1;");
await p.evaluate(()=>{const T=__t;T.weather.kind='clear';T.weather.amt=T.weather.want=0;T.weather.next=1e9;T.tod=13;T.updateEnv(0);});
// mechanics
await ev('damage',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.hp=1;c.dead=false;T.hurtCar(c,.5);const half=c.hp;T.step(30);const fumes=T.world&&document.getElementById('hpWrap').hidden===false;T.hurtCar(c,.6);T.KEY.KeyW=true;T.step(60);T.KEY.KeyW=false;return{half,dead:c.dead,speedWithThrottle:+c.speed.toFixed(2),barShown:fumes,toast:T.toastText()};});
await ev('garage',()=>{const T=__t,c=T.player.car,g=T.garages[0];if(!g)return'no garage';T.cash=1000;T.heat=0;T.addHeat(2.2);c.hp=.4;c.dead=false;c.x=g.x+40;c.z=g.z;T.syncCar(c);T.player.x=c.x;T.player.z=c.z;T.step(2);while(T.cops.length)T.cops[0]&&T.cops.splice(0,1);
  c.x=g.x;c.z=g.z;c.speed=0;T.player.x=g.x;T.player.z=g.z;T.syncCar(c);T.updateMore(.03);return{garage:g.name,cash:T.cash,stars:Math.floor(T.heat),hp:c.hp,toast:T.toastText()};});
await ev('landmark',()=>{const T=__t,m=T.landmarks.find(q=>!q.found);if(!m)return'none';const c=T.player.car,a=T.cash;c.x=m.x;c.z=m.z;T.player.x=m.x;T.player.z=m.z;T.updateMore(.03);return{name:m.name,found:m.found,paid:T.cash-a,saved:JSON.parse(localStorage.getItem('raseiniai-streets-save')).found.length,toast:T.toastText()};});
await ev('race',()=>{const T=__t,r=T.races[0];if(!r)return'none';const c=T.player.car,a=T.cash;const go=(x,z)=>{c.x=x;c.z=z;c.speed=0;T.player.x=x;T.player.z=z;T.syncCar(c);};go(r.x,r.z);T.updateMore(.03);const started=!!T.race;for(let i=0;i<110;i++)T.updateMore(.033);
  const log=[];for(const cp of r.cps){T.updateMore(2);go(cp.x,cp.z);T.updateMore(.03);log.push(T.race?T.race.i:'done');}return{started,checkpoints:r.cps.length,log,paid:T.cash-a,best:T.save.races[r.name],toast:T.toastText(),mission:T.mission&&T.mission.name};});
await ev('taxi',()=>{const T=__t,c=T.player.car;T.resetToRoad();T.mission=null;if(!T.startTaxi())return'no spot';const m=T.mission,f=T.fare;const pick={stage:m.stage,fareShown:!!f};c.x=m.x;c.z=m.z;c.speed=0;T.player.x=m.x;T.player.z=m.z;T.syncCar(c);T.updateMission(.03);
  const ride=T.mission;const st={after:ride.stage||ride.kind,dest:ride.name,fareGone:!T.fare,toast:T.toastText()};const a=T.cash;ride.time=40;c.x=ride.x;c.z=ride.z;T.player.x=ride.x;T.player.z=ride.z;T.updateMission(.03);return{pick,st,paid:T.cash-a,toast:T.toastText()};});
await save('taxi_fare',await p.evaluate(()=>{const T=__t;T.mission=null;T.startTaxi();T.step(3);const f=T.fare;const y=T.GY(f.x,f.z);return T.shot([f.x+Math.sin(f.h)*3.5+1,y+1.5,f.z+Math.cos(f.h)*3.5],[f.x,y+1.1,f.z]);}));
await save('landmark_token',await p.evaluate(()=>{const T=__t,m=T.landmarks.find(q=>!q.found);T.player.x=m.x+20;T.player.z=m.z;T.updateMore(.03);const y=T.GY(m.x,m.z);return T.shot([m.x+9,y+4,m.z+6],[m.x,y+1.2,m.z]);}));
await save('hud',await p.screenshot().then(x=>'data:image/png;base64,'+x.toString('base64')));
const kept=await p.evaluate(()=>{const T=__t;T.cash=4321;T.updateMore(6);return localStorage.getItem('raseiniai-streets-save');});
await p.reload();await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:90000});
await ev('reload',k=>({cash:__t.cash,shown:document.getElementById('cash').textContent,found:__t.landmarks.filter(m=>m.found).length,wasSaved:JSON.parse(k).cash}),kept);
await p.waitForTimeout(1000);console.log('errors',errs.slice(0,8));await b.close();
