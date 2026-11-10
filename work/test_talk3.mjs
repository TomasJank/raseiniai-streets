// dialogue content checks on a full build (with fixtalk2): node test_talk3.mjs page.html
// structure of every script, closers, fillers, tags, kid/companion rules, a voice clip in both voices for every line; then test_talk2
import {createRequire} from 'module';import fs from 'fs';import {execFileSync} from 'child_process';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get pedGroups(){return pedGroups},set tod(v){tod=v},set heat(v){heat=v},
get TALKS(){return TALKS},get TALK_BYE(){return TALK_BYE},get TALK_HM(){return TALK_HM},get TALK_GO(){return TALK_GO},get STREETS(){return STREETS},get STREET_SLUG(){return STREET_SLUG},get weather(){return weather},
LL:(a,b)=>LL(a,b),randomLook:(i,a)=>randomLook(i,a),pickTalk:(m,x,z)=>pickTalk(m,x,z),resetToRoad:()=>resetToRoad(),resetPed:q=>resetPed(q),startTalk:(...a)=>startTalk(...a),pedTarget:q=>pedTarget(q),
steps(n,dt=.033){for(let i=0;i<n;i++){updateTraffic(dt);updatePeople(dt);pedBubbles();}}};`;
fs.writeFileSync(dir+'_talk3.html',h.replace(o,api+o));
let fails=0;const check=(name,ok,info)=>{console.log(ok?'ok  ':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};

// static: every tag a script uses is a key of pickTalk's tag object (or a street slug), every line has two voice clips
const tagSrc=h.slice(h.indexOf('const tag={'),h.indexOf('};',h.indexOf('const tag={')));
const voice=JSON.parse(h.slice(h.indexOf('>',h.indexOf('id="rasVoice"'))+1,h.indexOf('</script>',h.indexOf('id="rasVoice"'))));

const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:640,height:400}});
await p.addInitScript(()=>{let s=4242;Math.random=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'_talk3.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(800);
const R=await p.evaluate(()=>{const T=__t,G=T.world.graph;
  const tables={TALKS:T.TALKS,BYE:T.TALK_BYE,HM:T.TALK_HM,GO:T.TALK_GO,slugs:Object.values(T.STREET_SLUG)};
  const isKid=q=>q.look&&q.look.age==='kid';
  // pickTalk sweep: every group kind, places, times, weather, police
  const adults=T.peds.filter(q=>q.look&&!isKid(q)).slice(0,6);
  const spots=[...T.STREETS.map(s=>T.LL(...s.views[0].ll)),...T.world.labels.map(l=>[l.x,l.z])];
  const KINDS=['s2','s3','c2','c3','kid','ck','sk'],picks=[];
  for(let n=0;n<1400;n++){const kind=KINDS[n%KINDS.length],[x,z]=spots[n%spots.length];
    T.tod=[3,8,13,17,21,23][n%6];T.weather.temp=[-3,4,15][n%3];T.weather.kind=['clear','rain','snow'][(n>>2)%3];T.heat=n%11==0?1:0;
    const mem=adults.slice(0,kind.endsWith('3')||kind==='ck'||kind==='sk'?3:2).map(q=>{const c=Object.assign(Object.create(Object.getPrototypeOf(q)),q);c.look={...q.look};c.lead=null;c.stop=n%13==0;return c;});
    if(kind==='kid')mem[1].look.age='kid';
    if(kind==='ck')mem[2].look.age='kid';
    if(kind==='sk'){mem[2].look.age='kid';mem[2].lead=mem[1];}
    if(kind[0]==='c'||kind==='kid')for(let i=1;i<mem.length;i++)mem[i].lead=mem[0];
    if(kind==='ck'){/* pedIdle puts the adult follower first */}
    const sc=T.pickTalk(mem,x,z),k=T.TALKS.findIndex(t=>t[1].every((l,i)=>sc.some(s=>s[1]===l))&&sc.filter(s=>t[1].includes(s[1])).length===t[1].length);
    picks.push({kind,comp:kind[0]==='c'||kind==='kid',kid:kind==='kid',n:mem.length,sc,k,tag:k>=0?T.TALKS[k][0]:null,meet:k>=0&&!!T.TALKS[k][2]});}
  // real conversations through tickGroups: who actually speaks each line
  const runs=[],led=()=>new Set(T.peds.map(q=>q.lead).filter(Boolean));
  for(let c=0;c<14;c++){const [x,z]=spots[(c*5)%spots.length];T.player.x=x;T.player.z=z;T.player.car.x=x;T.player.car.z=z;T.resetToRoad();T.tod=13;T.steps(60);
    const dd=e=>{const A=G.get(e.a),B=G.get(e.b);return A&&B?Math.hypot((A.x+B.x)/2-x,(A.z+B.z)/2-z):1e9;},e=T.world.edges.filter(e=>dd(e)<1e8).sort((a,b)=>dd(a)-dd(b))[c%3];
    const L=led(),n=c%7==3||c%7==5?3:2,mem=T.peds.filter(q=>q.mode!=='talk'&&!q.grp&&!q.lead&&!L.has(q)&&q.look&&!isKid(q)).slice(0,n);
    mem.forEach((q,i)=>{T.resetPed(q);Object.assign(q,{e,t:.45+i*.05,dir:1,side:1,mode:'walk',sp:1.3,lastTalk:undefined,guard:null});const s=T.pedTarget(q);q.x=s[0];q.z=s[1];});
    if(c%7==4){mem[1].look=T.randomLook(T.peds.indexOf(mem[1]),'kid');mem[1].guard=mem[0];}
    if(c%7==5){mem[2].look=T.randomLook(T.peds.indexOf(mem[2]),'kid');mem[2].guard=mem[1];mem[2].lead=mem[1];}
    if(c%2==1||c%7==4)for(let i=1;i<mem.length&&!(c%7==5);i++)mem[i].lead=mem[0];
    T.startTalk(mem,mem[0].x,mem[0].z);const g=T.pedGroups[T.pedGroups.length-1],who=[];let last=-9;
    for(let k=0;k<6000&&T.pedGroups.includes(g);k++){T.steps(1);if(g.i!==last){last=g.i;if(g.i>=0&&g.i<g.script.length)who.push([T.peds.indexOf(g.mem[g.spk]),g.text]);}}
    runs.push({who,done:!T.pedGroups.includes(g),n:g.script.length});}
  return{tables,picks,runs};});
await b.close();
const {TALKS,BYE,HM,GO,slugs}=R.tables,isQ=l=>/\?$/.test(l),byes=new Set(BYE.map(x=>x.join('|'))),gos=new Set(GO.map(x=>x.join('|')));
const tags=[...new Set(TALKS.map(t=>t[0]))];
const tagOk=t=>t===''||(t.startsWith('street:')?slugs.includes(t.slice(7)):new RegExp('[{,\\s]'+t+':').test(tagSrc));
check('every tag resolves in pickTalk',tags.every(tagOk),{tags:tags.length,bad:tags.filter(t=>!tagOk(t))});
check('every script has 2-6 lines and does not end on a question',TALKS.every(t=>t[1].length>=2&&t[1].length<=6&&!isQ(t[1].at(-1))),TALKS.filter(t=>t[1].length<2||t[1].length>6||isQ(t[1].at(-1))).map(t=>t[1]));
check('no line repeats inside a script',TALKS.every(t=>new Set(t[1]).size===t[1].length),TALKS.filter(t=>new Set(t[1]).size!==t[1].length).map(t=>t[1]));
check('fillers and companion closers are statements',HM.every(l=>!isQ(l))&&GO.every(c=>!isQ(c[1])),{HM,GO});
check('goodbye pairs and closers are disjoint',GO.every(c=>!/Iki|Sėkmės|Tu irgi/.test(c.join(' '))),GO);
const P=R.picks.filter(x=>x.k>=0);
check('pickTalk returned a known script every time',P.length===R.picks.length,R.picks.length-P.length);
const alt=x=>x.sc.every((s,i)=>!i||s[0]%x.n!==x.sc[i-1][0]%x.n);
check('speakers alternate (incl. the closing pair)',P.every(alt),P.filter(x=>!alt(x)).slice(0,3).map(x=>x.sc));
check('no filler directly after a question',P.every(x=>x.sc.every((s,i)=>!(s[0]>=2&&HM.includes(s[1])&&isQ(x.sc[i-1][1])))),P.filter(x=>x.sc.some((s,i)=>s[0]>=2&&isQ(x.sc[i-1][1]))).slice(0,3).map(x=>x.sc));
const close=x=>x.sc.slice(-2).map(s=>s[1]).join('|');
check('strangers end with a goodbye pair',P.filter(x=>!x.comp).every(x=>byes.has(close(x))),P.filter(x=>!x.comp&&!byes.has(close(x))).slice(0,3).map(close));
check('companions (and a parent with a kid) end with a let\'s-go pair',P.filter(x=>x.comp).every(x=>gos.has(close(x))),P.filter(x=>x.comp&&!gos.has(close(x))).slice(0,3).map(close));
check('kid talks only and always when the kid is the second speaker',P.every(x=>(x.tag==='kid')===x.kid),P.filter(x=>(x.tag==='kid')!==x.kid).slice(0,3).map(x=>[x.kind,x.tag]));
check('meet talks never for people walking together',P.filter(x=>x.comp).every(x=>!x.meet),P.filter(x=>x.comp&&x.meet).map(x=>x.sc[0]));
const used=new Set(P.map(x=>x.tag));
check('every tag actually gets picked (nov only in November)',tags.filter(t=>!used.has(t)&&!(t==='nov'&&new Date().getMonth()!==10)).length===0,tags.filter(t=>!used.has(t)));
const rAlt=r=>r.who.every((w,i)=>!i||w[0]!==r.who[i-1][0]);
check('14 real conversations: finish, nobody speaks twice in a row',R.runs.every(r=>r.done&&r.who.length===r.n&&rAlt(r)),R.runs.filter(r=>!r.done||!rAlt(r)).map(r=>r.who));
const all=[...new Set([...TALKS.flatMap(t=>t[1]),...BYE.flat(),...HM,...GO.flat()])];
const miss=all.filter(l=>{const v=voice.lines[l];return !v||v[0]===v[1]||!voice.clips[v[0]]||!voice.clips[v[1]];});
check('every line has a clip in both voices',miss.length===0,{lines:all.length,missing:miss});
check('no page errors',errs.length===0,errs.slice(0,4));
let t2='';try{t2=execFileSync('node',[dir+'test_talk2.mjs',file],{encoding:'utf8'});}catch(e){t2=(e.stdout||'')+e.message;}
check('test_talk2 passes',/all passed/.test(t2),t2.trim().split('\n').filter(l=>l.startsWith('FAIL')));
if(fails){console.log(fails,'failed');process.exit(1);}
console.log('all passed');
