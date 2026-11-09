// solids and knockable props: node test_solid.mjs page.html   (exits 1 on a failed assertion)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get props(){return props},get walls(){return walls},get falling(){return falling},
get tod(){return tod},set tod(v){tod=v},driveCar,updateFalling,updatePeople,updateTraffic,resetToRoad,syncCar,parkedNear,
steps(n,dt=.033){for(let i=0;i<n;i++){updateTraffic(dt);updatePeople(dt);}}};`;
fs.writeFileSync(dir+'_solid.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_solid.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};

const a=await p.evaluate(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;
  const seg=(x,z,s)=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t);};
  const bad=new Map(),S=T.world.solids;let checked=0,nearNew=0;
  for(let f=1;f<=600;f++){T.steps(1);if(f%20)continue;
    for(const q of T.peds){if(q.mode==='down'||q.mode==='hide'||q.mode==='sit')continue;checked++;if(S.some(s=>Array.isArray(s)?seg(q.x,q.z,s)<2:Math.hypot(q.x-s.x,q.z-s.z)<2))nearNew++;const k=Math.floor(q.x/8)+','+Math.floor(q.z/8);let why=null;
      for(const s of T.walls.get(k)||[]){const d=seg(q.x,q.z,s);if(d<.25&&(!why||d<why.d))why={d:+d.toFixed(2),wall:s.map(v=>+v.toFixed(1))};}
      for(const o of T.props.get(k)||[])if(!o.down){const d=Math.hypot(q.x-o.x,q.z-o.z);if(d<o.r+.25&&(!why||d<why.d))why={d:+d.toFixed(2),prop:{x:+o.x.toFixed(1),z:+o.z.toFixed(1),r:o.r}};}
      if(T.world.inBuilding(q.x,q.z))why={...why,building:true};
      if(why)bad.set(q,{mode:q.mode,at:[+q.x.toFixed(1),+q.z.toFixed(1)],frame:f,...why});}}
  return{checked,nearNew,offenders:[...bad.values()]};});
check('peds clear of solids',a.checked>0&&a.offenders.length===0,{checked:a.checked,nearWorldSolids:a.nearNew,offenders:a.offenders.slice(0,12)});

// walk a person straight at every world.solids entry and every knockable park prop; nobody may pass through
const w=await p.evaluate(()=>{const T=__t,P=T.player,items=[...T.world.solids];for(const l of T.props.values())for(const o of l)if(o.minSp===5&&!o.down&&!o.parts[0].obj)items.push(o);
  const seg=(x,z,s)=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t);};
  const q=T.peds.find(z=>z.mode!=='hide'&&!z.lead)||T.peds[0],bad=[];let n=0;
  for(const it of items){const isSeg=Array.isArray(it),cx=isSeg?(it[0]+it[2])/2:it.x,cz=isSeg?(it[1]+it[3])/2:it.z;
    let ux=1,uz=0;if(isSeg){const L=Math.hypot(it[2]-it[0],it[3]-it[1])||1;ux=-(it[3]-it[1])/L;uz=(it[2]-it[0])/L;}
    const R=isSeg?2:it.r+2;if(T.world.inBuilding(cx-ux*R,cz-uz*R))continue;n++;
    P.x=cx+30;P.z=cz;Object.assign(q,{mode:'goto',then:'test',lead:null,grp:null,seat:null,x:cx-ux*R,z:cz-uz*R,tx:cx+ux*R,tz:cz+uz*R,sp:1.4,timer:99,nerv:0,react:0});
    for(let f=0;f<60&&q.mode==='goto';f++){T.updatePeople(.033);const d=isSeg?seg(q.x,q.z,it):Math.hypot(q.x-it.x,q.z-it.z)-it.r;
      if(d<.25){bad.push({item:isSeg?it.map(v=>+v.toFixed(1)):{x:+it.x.toFixed(1),z:+it.z.toFixed(1),r:it.r},d:+d.toFixed(2),frame:f});break;}}}
  return{tried:n,of:items.length,offenders:bad};});
check('walking into each new solid',w.tried>20&&w.offenders.length===0,{tried:w.tried,of:w.of,offenders:w.offenders.slice(0,12)});

// aim the player's car at a prop from 14 m back along a clear line, hold the speed until impact, run 2 s (5 s when slow)
const hitJs=`(pick,v)=>{const T=__t,W=T.world,c=T.player.car;
  const all=[];for(const l of T.props.values())for(const q of l)if(!q.down&&pick(q))all.push(q);
  all.sort((a,b)=>Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z));
  const clear=(q,sx,sz)=>{for(let t=2.6;t<=14;t+=.5){const x=q.x+(sx-q.x)*t/14,z=q.z+(sz-q.z)*t/14;if(W.inBuilding(x,z)||W.collide(x,z,1.2).hit)return false;
      const ci=Math.floor(x/8),cj=Math.floor(z/8);for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++){for(const o of T.props.get(i+','+j)||[])if(o!==q&&!o.down&&Math.hypot(o.x-x,o.z-z)<1.6)return false;
        for(const s of T.walls.get(i+','+j)||[]){const dx=s[2]-s[0],dz=s[3]-s[1],u=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-s[0]-dx*u,z-s[1]-dz*u)<1.4)return false;}}
      if(T.parkedNear(x,z).some(o=>Math.hypot(o.x-x,o.z-z)<3.2)||W.cars.some(o=>o!==c&&Math.hypot(o.x-x,o.z-z)<3.5))return false;}return true;};
  for(const q of all.slice(0,60))for(let k=0;k<16;k++){const an=k/16*Math.PI*2,sx=q.x+Math.sin(an)*14,sz=q.z+Math.cos(an)*14;if(!clear(q,sx,sz))continue;
    const h=Math.atan2(q.x-sx,q.z-sz);Object.assign(c,{x:sx,z:sz,h,trav:h,speed:v,steer:0,hp:1,dead:false,pvx:0,pvz:0,pspin:0});T.syncCar(c);T.player.x=sx;T.player.z=sz;T.player.h=h;
    const n0=T.falling.length;let closest=99;
    for(let i=0;i<(v<5?150:60);i++){if(!q.down)c.speed=v;T.driveCar(c,.033);T.updateFalling(.033);closest=Math.min(closest,Math.hypot(c.x-q.x,c.z-q.z));}
    const f=T.falling.find(f=>f.p===q);
    return{at:[+q.x.toFixed(1),+q.z.toFixed(1)],down:!!q.down,falling:T.falling.length-n0,tilt:f?+f.th.toFixed(2):0,hp:+(c.hp??1).toFixed(3),closest:+closest.toFixed(2)};}
  return null;}`;
const hit=(name,pick,v)=>p.evaluate(`(${hitJs})(${pick},${v})`).then(r=>{if(!r)console.log('no clear approach for',name);return r;});
const isPole=`q=>q.minSp===7&&q.h===8.6`,isSignal=`q=>q.minSp===7&&q.h===4&&q.parts[0].obj`,isBusSign=`q=>q.minSp===5&&q.h===2.6&&q.parts[0].obj`;
for(const [name,pick] of [['pole',isPole],['signal',isSignal],['bus-stop sign',isBusSign]]){
  const r=await hit(name,pick,12);check(name+' falls at 12 m/s',!!r&&r.down&&r.falling>0&&r.hp<1,r);}
const slow=await hit('slow pole',isPole,3);
check('pole stays up at 3 m/s',!!slow&&!slow.down&&slow.falling===0&&slow.closest<2.7,slow);

check('no page errors',errs.length===0,errs.slice(0,6));
await b.close();
if(fails){console.log(fails+' failed');process.exit(1);}
console.log('all passed');
