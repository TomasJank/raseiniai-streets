// node sim.mjs page.html out.json N seed   -> dumps dialogue tables + N simulated conversations (real pickTalk/tickGroups)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,outf,N='40',seed='777']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get pedGroups(){return pedGroups},set tod(v){tod=v},get tod(){return tod},
get TALKS(){return TALKS},get TALK_BYE(){return TALK_BYE},get TALK_HM(){return TALK_HM},get TALK_GO(){return typeof TALK_GO!=='undefined'?TALK_GO:null},get STREETS(){return STREETS},LL:(a,b)=>LL(a,b),
get weather(){return weather},randomLook:(i,a)=>randomLook(i,a),get camera(){return camera},resetToRoad:()=>resetToRoad(),resetPed:q=>resetPed(q),startTalk:(...a)=>startTalk(...a),pedTarget:q=>pedTarget(q),
steps(n,dt=.033){for(let i=0;i<n;i++){updateTraffic(dt);updatePeople(dt);pedBubbles();}}};`;
fs.writeFileSync(dir+'_sim.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:640,height:400}});
await p.addInitScript(s0=>{let s=s0;Math.random=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};},+seed);
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'_sim.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(800);
const R=await p.evaluate(N=>{const T=__t,G=T.world.graph;
  const tables={TALKS:T.TALKS,TALK_BYE:T.TALK_BYE,TALK_HM:T.TALK_HM,TALK_GO:T.TALK_GO,labels:T.world.labels.map(l=>l.text),streets:T.STREETS.map(s=>s.slug)};
  const spots=[...T.STREETS.map(s=>({name:s.slug,ll:s.views[0].ll})),...T.world.labels.filter(l=>/maxima|norfa|iki|stot|bažny|aikšt|stadion/i.test(l.text)).map(l=>({name:l.text,xz:[l.x,l.z]}))];
  const TYPES=['strangers2','companions2','strangers3','kid','companions3','strangers+kid'],TODS=[8,13,17,22];
  const led=()=>new Set(T.peds.map(q=>q.lead).filter(Boolean));
  const free=()=>{const L=led();return T.peds.filter(q=>q.mode!=='talk'&&!q.grp&&!q.lead&&!L.has(q)&&q.look&&q.look.age!=='kid');};
  const kindOf=q=>q.look&&q.look.age==='kid'?'kid':q.look&&q.look.male?'m':'f';
  const conv=[];
  for(let c=0;c<N;c++){const sp=spots[c%spots.length],ty=TYPES[c%TYPES.length],tod=TODS[Math.floor(c/TYPES.length)%TODS.length];
    const car=T.player.car,[x,z]=sp.xz||T.LL(...sp.ll);car.x=x;car.z=z;T.player.x=x;T.player.z=z;car.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=tod;T.steps(90);
    const P={x,z},dd=e=>{const A=G.get(e.a),B=G.get(e.b);return A&&B?Math.hypot((A.x+B.x)/2-P.x,(A.z+B.z)/2-P.z):1e9;},es=T.world.edges.filter(e=>dd(e)<1e8).sort((a,b)=>dd(a)-dd(b)).slice(0,4);
    if(!es.length){conv.push({spot:sp.name,skip:'no edge'});continue;}
    const e=es[Math.floor(Math.random()*es.length)],n=/3|\+kid/.test(ty)?3:2,mem=free().slice(0,n);
    mem.forEach((q,i)=>{T.resetPed(q);Object.assign(q,{e,t:.45+i*.05,dir:1,side:1,mode:'walk',sp:1.3,lastTalk:undefined,guard:null});const s=T.pedTarget(q);q.x=s[0];q.z=s[1];});
    if(ty==='kid'){mem[1].look=T.randomLook(T.peds.indexOf(mem[1]),'kid');mem[1].guard=mem[0];mem[1].lead=mem[0];}
    if(ty.startsWith('companions'))for(let i=1;i<mem.length;i++)mem[i].lead=mem[0];
    if(ty==='strangers+kid'){mem[2].look=T.randomLook(T.peds.indexOf(mem[2]),'kid');mem[2].guard=mem[1];mem[2].lead=mem[1];}
    T.startTalk(mem,mem[0].x,mem[0].z);const g=T.pedGroups[T.pedGroups.length-1];
    const street=T.world.street(g.x,g.z),kinds=mem.map(kindOf),lines=[];let last=-9;
    for(let k=0;k<6000&&T.pedGroups.includes(g);k++){T.steps(1);if(g.i!==last){last=g.i;if(g.i>=0&&g.i<g.script.length)lines.push([g.mem.indexOf(g.mem[g.spk]),kindOf(g.mem[g.spk]),g.text,g.script[g.i][0]]);}}
    conv.push({c,spot:sp.name,street,tod,type:ty,kinds,temp:Math.round(T.weather.temp??99),wx:T.weather.kind,lines,script:g.script.map(s=>s[1])});}
  return{tables,conv};},+N);
R.errs=errs;fs.writeFileSync(outf,JSON.stringify(R,null,1));await b.close();console.log('done',R.conv.length,'errs',errs.length);
