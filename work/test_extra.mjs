import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_extra']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get cops(){return cops},get heat(){return heat},set heat(v){heat=v},get tod(){return tod},set tod(v){tod=v},
get props(){return props},get falling(){return falling},get blocks(){return blocks},set blockT(v){blockT=v},get signals(){return signals},get bus(){return bus},get bellsRung(){return bellsRung},get bellChurch(){return bellChurch},get walls(){return walls},
KEY,driveCar,updateTraffic,updatePolice,updateMore,updateEnv,updateExtra,updateBells,copRam,redAhead,light,addHeat,carGeo,syncCar,resetToRoad,spawnCop,renderer,scene,camera,get GY(){return GY},
step(n,dt=.033){for(let i=0;i<n;i++){if(player.mode==='car')driveCar(player.car,dt);updateTraffic(dt);updatePolice(dt);updateMore(dt);updateExtra(dt);updateEnv(dt);}},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();const f=scene.fog;scene.fog=null;renderer.render(scene,camera);scene.fog=f;return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_extra.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+dir+'_extra.html');await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:90000});await p.waitForTimeout(1500);
await p.keyboard.press('KeyH');
const save=async(n,u)=>{if(u)fs.writeFileSync(`${dir}${out}/${n}.png`,Buffer.from(u.split(',')[1],'base64'));};
const ev=async(name,fn,arg)=>{try{const r=await p.evaluate(fn,arg);console.log(name,JSON.stringify(r));return r;}catch(e){console.log(name,'FAILED',e.message.split('\n')[0]);return null;}};
// aim the player's car at a point from d metres back, with nothing but open ground between
const aimJs=`(x,z,d,skip)=>{const T=__t,W=T.world,c=T.player.car;for(let k=0;k<24;k++){const a=k/24*Math.PI*2,sx=x-Math.sin(a)*d,sz=z-Math.cos(a)*d;let ok=true;
  for(let i=0;i<=10&&ok;i++){const px=sx+(x-sx)*i/10,pz=sz+(z-sz)*i/10;if(W.inBuilding(px,pz))ok=false;if(i<9)for(const l of T.props.values())for(const q of l)if(q!==skip&&!q.down&&Math.hypot(q.x-px,q.z-pz)<1.8)ok=false;}
  if(ok){c.x=sx;c.z=sz;c.h=a;c.trav=a;c.speed=0;c.steer=0;c.hp=1;c.dead=false;c.pvx=c.pvz=c.pspin=0;T.syncCar(c);T.player.x=sx;T.player.z=sz;T.player.h=a;return true;}}return false;}`;

await p.evaluate(()=>{const c=__t.player.car;window.__start=[c.x,c.z,c.h];});
await ev('built',()=>{const T=__t;let n=0,snap=0;for(const l of T.props.values())for(const q of l){n++;if(q.snap)snap++;}
  return{props:n,snappable:snap,signals:T.signals.length,heads:T.signals.map(s=>s.heads.length),busLoopKm:T.bus&&+(T.bus.L/1000).toFixed(2),busStops:T.bus&&T.bus.at.length,church:T.bellChurch&&T.bellChurch.text};});

// a thin tree snaps and falls; the car keeps going
const tree=await ev('tree',(aim)=>{const T=__t,aimAt=eval(aim);let tp=null;
  for(const l of T.props.values()){for(const q of l)if(q.snap&&q.tree&&q.tree.tk&&aimAt(q.x,q.z,9,q)){tp=q;break;}if(tp)break;}
  if(!tp)return'no tree';const c=T.player.car;c.speed=15;T.KEY.KeyW=true;T.step(25);T.KEY.KeyW=false;
  const f=T.falling.find(f=>f.p===tp);const mid={down:tp.down,speed:+c.speed.toFixed(1),hp:+c.hp.toFixed(2),th:f&&+f.th.toFixed(2)};
  c.speed=0;T.step(90);window.__tp=tp;return{...mid,fallenTh:f&&+f.th.toFixed(2),landed:f&&f.landed};},aimJs);
await save('tree_fallen',await p.evaluate(()=>{const T=__t,q=window.__tp;if(!q)return null;const y=T.GY(q.x,q.z);return T.shot([q.x+11,y+5,q.z+11],[q.x,y+1.5,q.z]);}));

// a pole stops the car and stays up; the car gets a dent and loses its lamps
await ev('pole',(aim)=>{const T=__t,aimAt=eval(aim);let pp=null;
  for(const l of T.props.values()){for(const q of l)if(!q.tree&&!q.snap&&q.r>.15&&aimAt(q.x,q.z,10,q)){pp=q;break;}if(pp)break;}
  if(!pp)return'no pole';const c=T.player.car,base=Array.from(T.carGeo.paint.attributes.position.array.slice(0,3000));c.speed=16;T.KEY.KeyW=true;let minSp=99;
  for(let i=0;i<30;i++){T.step(1);minSp=Math.min(minSp,c.speed);}T.KEY.KeyW=false;
  const m=c.g.userData.body.children[0],own=m.geometry!==T.carGeo.paint,a=m.geometry.attributes.position.array,b=T.carGeo.paint.attributes.position.array;let moved=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>1e-4)moved++;
  const sharedSame=base.every((v,i)=>v===T.carGeo.paint.attributes.position.array[i]);
  window.__pp=pp;return{minSpeed:+minSp.toFixed(1),hp:+c.hp.toFixed(2),poleStanding:!pp.down,ownGeometry:own,dentedVerts:moved,sharedUntouched:sharedSame,headlampsOut:!!c.lampsOut,dist:+Math.hypot(c.x-pp.x,c.z-pp.z).toFixed(2)};},aimJs);
await save('pole_dent',await p.evaluate(()=>{const T=__t,c=T.player.car,y=T.GY(c.x,c.z),s=Math.sin(c.h),k=Math.cos(c.h);return T.shot([c.x+s*4.5+k*2.5,y+1.6,c.z+k*4.5-s*2.5],[c.x+s*1.5,y+.6,c.z+k*1.5]);}));

// ramming a parked car shoves it
await ev('shove',(aim)=>{const T=__t,aimAt=eval(aim);const o=T.world.cars.find(q=>!q.ai&&!q.cop&&q!==T.player.car&&aimAt(q.x,q.z,9,null));if(!o)return'no parked car';
  const x0=o.x,z0=o.z,h0=o.h,c=T.player.car;c.speed=15;T.KEY.KeyW=true;T.step(20);T.KEY.KeyW=false;c.speed=0;T.step(40);
  return{moved:+Math.hypot(o.x-x0,o.z-z0).toFixed(2),turned:+Math.abs(o.h-h0).toFixed(2),otherDented:o.g.userData.body.children[0].geometry!==T.carGeo.paint};},aimJs);

// red light: a car 12 m short of the stop line sees red, then green
await ev('redLight',()=>{const T=__t,s=T.signals[0];if(!s)return'no signal';const h=s.a0+Math.PI,x=s.n.x-Math.sin(h)*12,z=s.n.z-Math.cos(h)*12,out={};
  for(const t of[0,13,20]){s.t=t;out[T.light(s,h)]=T.redAhead(x,z,h);}return out;});

// roadblock at three stars, cleared when the heat drops
await ev('roadblock',()=>{const T=__t,c=T.player.car;[c.x,c.z,c.h]=window.__start;c.trav=c.h;c.speed=0;c.pvx=c.pvz=c.pspin=0;T.syncCar(c);T.player.x=c.x;T.player.z=c.z;T.player.h=c.h;T.heat=0;T.addHeat(3.2);T.blockT=0;T.step(70);
  const n=T.blocks.length,near=T.blocks.map(b=>Math.round(Math.hypot(b.x-c.x,b.z-c.z)));window.__bl=T.blocks.slice();T.heat=0;T.step(5);while(T.cops.length)T.cops.pop();return{built:n,metresAway:near,clearedAfter:T.blocks.length===0};});
await save('roadblock',await p.evaluate(()=>{const T=__t,b=window.__bl;if(!b||!b.length)return null;T.addHeat(3.2);
  for(const c of b){T.world.cars.push(c);T.scene.add(c.g);}const m=b[0],y=T.GY(m.x,m.z);const u=T.shot([m.x+9,y+3.5,m.z+9],[m.x,y+.8,m.z]);for(const c of b)T.scene.remove(c.g);T.heat=0;return u;}));

// ramming at four stars
await ev('ram',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.hp=1;c.dead=false;T.heat=4.5;T.step(60);const k=T.cops[0];if(!k)return'no cop';
  k.x=c.x-Math.sin(c.h)*2.4;k.z=c.z-Math.cos(c.h)*2.4;k.ramT=0;k.speed=14;T.copRam(k,.03);const hp=c.hp;T.heat=0;while(T.cops.length)T.cops.pop();return{hpAfterRam:+hp.toFixed(2),shoved:+Math.hypot(c.pvx||0,c.pvz||0).toFixed(1)};});

// the bus pulls into its next stop and waits
await ev('bus',()=>{const T=__t,B=T.bus;if(!B)return'no bus';const nx=B.at[B.next%B.at.length];B.s=nx.s-40;B.v=8;B.wait=0;const n0=B.next;
  let reached=-1;for(let i=0;i<400;i++){T.step(1);if(B.next>n0){reached=i;break;}}return{next:B.next>n0,stopName:nx.name||'(unnamed)',secs:+(reached*.033).toFixed(1),waiting:B.wait>0};});
await save('bus',await p.evaluate(()=>{const T=__t,B=T.bus;if(!B)return null;const y=T.GY(B.x,B.z),s=Math.sin(B.h),k=Math.cos(B.h);return T.shot([B.x+s*11+k*7,y+3,B.z+k*11-s*7],[B.x,y+1.6,B.z]);}));
await save('signal',await p.evaluate(()=>{const T=__t,s=T.signals[0];if(!s)return null;const y=T.GY(s.n.x,s.n.z),h=s.a0+Math.PI;return T.shot([s.n.x-Math.sin(h)*22,y+2.2,s.n.z-Math.cos(h)*22],[s.n.x,y+2.5,s.n.z]);}));

// bells at noon
await ev('bells',()=>{const T=__t,a=T.bellsRung;T.tod=11.99;T.updateBells();T.tod=12.01;T.updateBells();const noon=T.bellsRung-a;T.tod=17.99;T.updateBells();T.tod=18.02;T.updateBells();return{noon,six:T.bellsRung-a-noon};});
// suspension: hard braking dives the nose, then the chassis settles; a T-bone at speed rolls the other car, a slow one doesn't
await ev('suspension',()=>{const T=__t,c=T.player.car;T.resetToRoad();c.hp=1;c.dead=false;c.speed=20;T.step(40);const p0=c.ride.p;
  T.KEY.KeyS=true;let maxDive=0;for(let i=0;i<15;i++){T.step(1);maxDive=Math.max(maxDive,c.ride.p-p0);}T.KEY.KeyS=false;c.speed=0;
  const tr=[];for(let i=0;i<90;i++){T.step(1);tr.push(c.ride.p-p0);}let peaks=0;for(let i=1;i<tr.length-1;i++)if(Math.abs(tr[i])>.004&&Math.abs(tr[i])>=Math.abs(tr[i-1])&&Math.abs(tr[i])>=Math.abs(tr[i+1]))peaks++;
  return{maxDiveDeg:+(maxDive*57.3).toFixed(1),bounces:peaks,settledDeg:+(Math.abs(tr[tr.length-1])*57.3).toFixed(2),wheelsOnGround:c.ride.wd.filter(d=>d>0).length};});
await ev('rollover',()=>{const T=__t,c=T.player.car,out={};
  for(const sp of[12,26]){T.resetToRoad();c.speed=0;T.step(30);const o=T.world.cars.find(q=>!q.ai&&!q.cop&&q!==c&&Math.hypot(q.x-c.x,q.z-c.z)<300);if(!o)return'no parked car';
    o.ride=null;o.pvx=o.pvz=o.pspin=0;c.x=o.x-Math.cos(o.h)*2.6;c.z=o.z+Math.sin(o.h)*2.6;c.h=Math.atan2(Math.cos(o.h),-Math.sin(o.h));c.trav=c.h;c.speed=sp;T.syncCar(c);
    T.step(4);c.speed=0;let minUp=1;for(let i=0;i<120;i++){T.step(1);if(o.ride)minUp=Math.min(minUp,Math.cos(o.ride.p)*Math.cos(o.ride.r));}
    out['hit'+sp]={minUp:+minUp.toFixed(2),endUp:o.ride&&+(Math.cos(o.ride.p)*Math.cos(o.ride.r)).toFixed(2),tipped:minUp<.35};}
  return out;});
// stadium: fence and tower are solid
await ev('stadium',()=>{const T=__t;let n=0;for(const l of T.walls.values())n+=l.length;return{wallSegs:n};});
console.log('errors',errs.slice(0,8));await b.close();
