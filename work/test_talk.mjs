// talks play to the goodbye: node test_talk.mjs page.html   (exit 1 on a failed assertion)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get pedGroups(){return pedGroups},set tod(v){tod=v},
TALK_BYE,talkSpr,camera,resetToRoad,resetPed,startTalk,pedTarget,pedEvent,
steps(n,dt=.033){for(let i=0;i<n;i++){updateTraffic(dt);updatePeople(dt);}}};`;
fs.writeFileSync(dir+'_talk.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:900,height:560}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_talk.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1000);
let fails=0;
const check=(name,ok,info)=>{console.log(ok?'ok  ':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};

await p.evaluate(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;
  T.tod=13;T.steps(300);
  const G=T.world.graph;
  // two (or n) peds walking on a pavement dmin..dmax m from the player, then talking
  T.talkAt=(dmin,dmax,n=2)=>{const P=T.player,es=T.world.edges.filter(e=>{const A=G.get(e.a),B=G.get(e.b);if(!A||!B)return false;const d=Math.hypot((A.x+B.x)/2-P.x,(A.z+B.z)/2-P.z);return d>dmin&&d<dmax&&!e.cls;});
    const e=es[Math.floor(Math.random()*es.length)],mem=T.peds.filter(q=>q.mode!=='talk'&&!q.grp).slice(0,n);
    mem.forEach((q,i)=>{T.resetPed(q);Object.assign(q,{e,t:.45+i*.05,dir:1,side:1,mode:'walk',sp:1.3});const s=T.pedTarget(q);q.x=s[0];q.z=s[1];});
    T.startTalk(mem,mem[0].x,mem[0].z);return T.pedGroups[T.pedGroups.length-1];};
  // steps until g leaves pedGroups; logs every line shown and every group that ends with a timeout before its goodbye
  T.badEnds=[];T.seen=new Set();
  T.watch=(g,max=4000)=>{const said=[];let last=null,k=0;
    for(;k<max&&T.pedGroups.includes(g);k++){T.steps(1);if(g.i!==last&&g.i>=0&&g.i<g.script.length){said.push(g.text);last=g.i;}
      for(const x of T.pedGroups)T.seen.add(x);for(const x of T.seen)if(!T.pedGroups.includes(x)){T.seen.delete(x);if(x.end<=0&&x.i<x.script.length-2)T.badEnds.push([x.i,x.script.length]);}}
    const bye=said.slice(-2),isBye=T.TALK_BYE.some(([a,c])=>a===bye[0]&&c===bye[1]);
    return{done:!T.pedGroups.includes(g),i:g.i,n:g.script.length,end:+g.end.toFixed(1),isBye,bye,s:+(k*.033).toFixed(1),mem:g.mem.length};};
  T.active=()=>T.peds.filter(q=>q.mode!=='hide').length;});

for(let r=0;r<6;r++){const band=r<3?[60,80]:[95,130];
  const res=await p.evaluate(([a,c])=>{const T=__t;T.tod=13;T.steps(200);const before=T.active(),g=T.talkAt(a,c);T.tod=2.5;const w=T.watch(g);return{...w,activeBefore:before,activeAfter:T.active()};},band);
  check(`talk ${band.join('-')} m, tod 2.5, run ${r+1}`,res.done&&res.i>=res.n&&res.isBye,res);}

const jump=await p.evaluate(()=>{const T=__t;T.tod=13;const g=T.talkAt(15,40);for(let k=0;k<2000&&g.i<1;k++)T.steps(1);g.end=.01;return T.watch(g);});
check('timeout jumps to the goodbye',jump.done&&jump.i>=jump.n&&jump.isBye,jump);

const three=await p.evaluate(()=>{const T=__t;T.tod=13;const g=T.talkAt(15,40,3);for(let k=0;k<2000&&g.i<1;k++)T.steps(1);
  const q=g.mem.find((m,i)=>i!==g.spk);q.mode='hide';return T.watch(g);});
check('3-member talk finishes after one member hides',three.done&&three.i>=three.n&&three.isBye&&three.mem===2,three);

const panic=await p.evaluate(()=>{const T=__t;T.tod=13;const g=T.talkAt(10,30);const mem=g.mem.slice();for(let k=0;k<2000&&!(g.say>0&&g.i>=1);k++)T.steps(1);
  const shown=T.talkSpr.some(s=>s.visible&&mem.some(m=>Math.hypot(s.position.x-m.x,s.position.z-m.z)<.5));
  T.pedEvent(g.x,g.z,25,8);T.steps(90);
  const stuck=T.talkSpr.some(s=>s.visible&&mem.some(m=>Math.hypot(s.position.x-m.x,s.position.z-m.z)<.5));
  return{ended:!T.pedGroups.includes(g),modes:mem.map(m=>m.mode),stuckBubble:stuck,cam:+Math.hypot(T.camera.position.x-g.x,T.camera.position.z-g.z).toFixed(1),shownBefore:shown};});
check('panic ends the talk cleanly',panic.ended&&!panic.stuckBubble&&panic.modes.every(m=>m!=='talk'),panic);

const four=await p.evaluate(()=>{const T=__t;T.tod=13;const cx=T.camera.position.x,cz=T.camera.position.z,gs=[];
  for(const [ox,oz] of [[-9,-9],[9,-9],[-9,9],[9,9]]){const mem=T.peds.filter(q=>q.mode!=='talk'&&!q.grp).slice(0,2);
    mem.forEach((q,i)=>{T.resetPed(q);Object.assign(q,{mode:'walk',x:cx+ox+i*1.1,z:cz+oz,sp:1.3,e:T.world.edges[0],t:.5,dir:1,side:1});});T.startTalk(mem,cx+ox+.55,cz+oz);gs.push(T.pedGroups[T.pedGroups.length-1]);}
  for(let k=0;k<200&&gs.some(g=>g.i<0);k++)T.steps(1,.033);for(const g of gs)g.say=5;T.steps(1,.016);
  const has=gs.map(g=>{const s=g.mem[g.spk];return!!s&&T.talkSpr.some(x=>x.visible&&Math.hypot(x.position.x-s.x,x.position.z-s.z)<.05);});
  return{has,live:gs.map(g=>T.pedGroups.includes(g)),sprites:T.talkSpr.length,visible:T.talkSpr.filter(s=>s.visible).length};});
check('4 nearby groups all get a bubble',four.has.every(Boolean),four);

// soak: the player circles the centre for 10 game minutes; a talk may only stop early for a real event or the 190 m recycle
const soak=await p.evaluate(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car,first=new Map(),out={full:0,real:0,far:0,bad:[]};T.tod=13;
  for(let k=0;k<18000;k++){const a=k/18000*6.28;c.x=T.player.x=L.x+Math.cos(a)*120;c.z=T.player.z=L.z+Math.sin(a)*120;T.steps(1);
    for(const g of T.pedGroups)if(!first.has(g))first.set(g,g.mem.slice());
    for(const [g,mem] of first)if(!T.pedGroups.includes(g)){first.delete(g);
      if(g.i>=g.script.length){out.full++;continue;}
      if(mem.some(m=>m.mode==='down'||m.nerv>=9||(m.mode==='flee'||m.mode==='cower')&&!m.back)){out.real++;continue;}
      if(mem.some(m=>Math.hypot(m.x-T.player.x,m.z-T.player.z)>180)){out.far++;continue;}
      out.bad.push({i:g.i,n:g.script.length,end:+g.end.toFixed(1),modes:mem.map(m=>m.mode)});}
    for(const x of T.pedGroups)T.seen.add(x);for(const x of T.seen)if(!T.pedGroups.includes(x)){T.seen.delete(x);if(x.end<=0&&x.i<x.script.length-2)T.badEnds.push([x.i,x.script.length]);}}
  return out;});
check('soak: no talk cut without a real event',soak.bad.length===0&&soak.full>10,soak);
const bad=await p.evaluate(()=>__t.badEnds);
check('no group ends on a timeout before its goodbye',bad.length===0,bad);
check('no page errors',errs.length===0,errs.slice(0,4));
await b.close();
if(fails){console.log(fails,'failed');process.exit(1);}
console.log('all passed');
