// deterministic talk checks (seeded Math.random, adults only): node test_talk2.mjs page.html   (page must include fixtalk)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get pedGroups(){return pedGroups},set tod(v){tod=v},
get TALK_BYE(){return TALK_BYE},get talkSpr(){return talkSpr},get camera(){return camera},resetToRoad:()=>resetToRoad(),resetPed:q=>resetPed(q),startTalk:(...a)=>startTalk(...a),pedTarget:q=>pedTarget(q),talkRested:m=>talkRested(m),pickBye:(...a)=>pickBye(...a),get pedClock(){return pedClock},
steps(n,dt=.033){for(let i=0;i<n;i++){updateTraffic(dt);updatePeople(dt);pedBubbles();}}};`;
fs.writeFileSync(dir+'_talk2.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:900,height:560}});
await p.addInitScript(()=>{let s=12345;Math.random=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'_talk2.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1000);
let fails=0;
const check=(name,ok,info)=>{console.log(ok?'ok  ':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};

const R=await p.evaluate(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;T.steps(300);
  const G=T.world.graph,led=()=>new Set(T.peds.map(q=>q.lead).filter(Boolean));
  const talkAt=(n,companions)=>{const P=T.player,es=T.world.edges.filter(e=>{const A=G.get(e.a),B=G.get(e.b);if(!A||!B)return false;const d=Math.hypot((A.x+B.x)/2-P.x,(A.z+B.z)/2-P.z);return d>8&&d<22&&!e.cls;});
    const e=es[Math.floor(Math.random()*es.length)],L=led(),mem=T.peds.filter(q=>q.mode!=='talk'&&!q.grp&&!q.lead&&!L.has(q)).slice(0,n);
    mem.forEach((q,i)=>{T.resetPed(q);Object.assign(q,{e,t:.45+i*.05,dir:1,side:1,mode:'walk',sp:1.3,lastTalk:undefined});const s=T.pedTarget(q);q.x=s[0];q.z=s[1];});
    if(companions)for(let i=1;i<mem.length;i++)mem[i].lead=mem[0];
    T.startTalk(mem,mem[0].x,mem[0].z);const g=T.pedGroups[T.pedGroups.length-1];g.comp=companions;return g;};
  const out=[];
  const run=(g,hook)=>{const sc=g.script,r={n:sc.length,script:sc.map(s=>s[1]),shown:[],idx:[],badSpk:0,badBub:0,rescript:false,comp:!!g.comp};let last=-9,k=0;
    for(;k<6000&&T.pedGroups.includes(g);k++){T.steps(1);if(hook)hook(g,k);
      if(g.script!==sc)r.rescript=true;
      if(g.i!==last){last=g.i;if(g.i>=0&&g.i<sc.length){r.shown.push(g.text);r.idx.push(g.i);if(g.text!==sc[g.i][1])r.badSpk++;}}
      const s=g.mem[g.spk];if(g.say>0&&s&&s.mode==='talk'&&s.gait<.1&&Math.hypot(s.x-T.camera.position.x,s.z-T.camera.position.z)<28&&
        !T.talkSpr.some(x=>x.visible&&Math.hypot(x.position.x-s.x,x.position.z-s.z)<.05))r.badBub++;}
    r.done=!T.pedGroups.includes(g);r.last=g.i;return r;};
  for(let c=0;c<30;c++){T.tod=13;T.steps(60);out.push(run(talkAt(c%3==2?3:2,c%2==1)));}
  const pull=[];for(let c=0;c<6;c++){T.tod=13;T.steps(60);const g=talkAt(3,c%2==1);let did=false;
    pull.push(run(g,(g,k)=>{if(!did&&g.i>=1){did=true;g.mem[g.mem.length-1].mode='hide';}}));}
  const rest={fresh:T.talkRested([{}]),just:T.talkRested([{lastTalk:T.pedClock}]),later:T.talkRested([{lastTalk:T.pedClock-200}])};
  const byes=new Set();for(let i=0;i<40;i++)byes.add(T.pickBye(false,[]).join('/'));
  let adj=0,prev=null;for(let i=0;i<60;i++){const b=T.pickBye(false,[]);if(b===prev)adj++;prev=b;}
  return{out,pull,rest,byeKinds:byes.size,adj};});

const mono=r=>r.idx.every((v,i)=>!i||v>r.idx[i-1]),uniq=r=>new Set(r.shown).size===r.shown.length;
const full=R.out.filter(r=>r.done);
check('30 conversations finish',full.length===30,{done:full.length});
check('no line repeats within a conversation',R.out.every(uniq),R.out.filter(r=>!uniq(r)).map(r=>r.shown));
check('g.i monotonic, no gaps, same script, bubbles match',R.out.every(r=>mono(r)&&!r.rescript&&r.badSpk===0&&r.idx.every((v,i)=>v===i)),R.out.filter(r=>!mono(r)||r.rescript||r.badSpk).map(r=>r.idx));
check('every conversation ends with its closing pair',R.out.every(r=>r.shown.length===r.n&&r.shown[r.n-1]===r.script[r.n-1]),R.out.filter(r=>r.shown.length!==r.n).map(r=>[r.shown.length,r.n]));
check('companions never say goodbye',R.out.filter(r=>r.comp).every(r=>!/Iki|Sėkmės|Tu irgi/.test(r.script.slice(-2).join(' '))&&r.comp),R.out.filter(r=>r.comp).map(r=>r.script.slice(-2)));
check('strangers do say goodbye',R.out.filter(r=>!r.comp).every(r=>/Iki|Sėkmės|Tu irgi/.test(r.script.slice(-2).join(' '))),R.out.filter(r=>!r.comp).length);
check('bubble sits on the speaker',R.out.every(r=>r.badBub===0),R.out.map(r=>r.badBub).filter(Boolean));
check('member pulled out: ends cleanly after the remaining pair finishes',R.pull.every(r=>r.done&&mono(r)&&!r.rescript&&uniq(r)&&r.shown.length>=r.n-2),R.pull.map(r=>[r.done,r.shown.length,r.n]));
check('companions rest 150 s before talking again',R.rest.fresh&&!R.rest.just&&R.rest.later,R.rest);
check('goodbye pairs rotate, never twice in a row',R.byeKinds===4&&R.adj===0,{kinds:R.byeKinds,adj:R.adj});
check('no page errors',errs.length===0,errs.slice(0,4));
await b.close();
if(fails){console.log(fails,'failed');process.exit(1);}
console.log('all passed');
