// pedestrian spots and a stress run: node test_fixpeds.mjs page.html [base.html]   (base = chain without fixpeds; its count of walled-in spots is reported)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,base]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,o='function drawMini(){';
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const errs=[];
const count=async(f,tag)=>{
  fs.writeFileSync(dir+`_fixpeds_${tag}.html`,fs.readFileSync(f,'utf8').replace(o,`window.__t={get world(){return world},pedTarget,
run(L,F,seed){
  const W=world,G=W.graph;let s=seed;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  tod=13;weather.kind='clear';weather.amt=weather.want=0;
  const dts=[.033,.1,.25,.5],ev=[],tab={};let frames=0,insideFrames=0;
  const sp=stepPed,pp=pedPlace;
  let cur=null;
  const edges=W.edges.filter(e=>e.cls<=1&&G.get(e.a)&&G.get(e.b));
  const note=(p,how,extra)=>{const k=how+'|'+extra.prev+'>'+p.mode;tab[k]=(tab[k]||0)+1;if(ev.length<400)ev.push({how,x:+p.x.toFixed(1),z:+p.z.toFixed(1),...extra});};
  stepPed=function(p,dt,M){const pre={x:p.x,z:p.z,mode:p.mode,in:!!W.inBuilding(p.x,p.z)};sp(p,dt,M);
    if(p.mode!=='hide'&&!pre.in&&W.inBuilding(p.x,p.z))p._ent={how:'stepPed',prev:pre.mode,dt,from:[+pre.x.toFixed(1),+pre.z.toFixed(1)],e:p.e&&[p.e.a,p.e.b],dir:p.dir};};
  pedPlace=function(p){const r=pp(p);if(r&&W.inBuilding(p.x,p.z))p._ent={how:'place',prev:'hide',dt:0};return r;};
  for(let l=0;l<L;l++){
    const e=edges[Math.floor(rnd()*edges.length)],A=G.get(e.a),B=G.get(e.b),t=rnd();
    player.x=A.x+(B.x-A.x)*t;player.z=A.z+(B.z-A.z)*t;if(player.car){player.car.x=player.x;player.car.z=player.z;}
    for(const p of peds){p.mode='hide';p._ent=null;}
    for(let f=0;f<F;f++){
      const dt=dts[(f+l)%4];
      if(rnd()<.08){const a=peds.filter(p=>p.mode!=='hide');if(a.length){const p=a[Math.floor(rnd()*a.length)],r=rnd();
        if(r<.4)pedFlee(p,rnd()-.5,rnd()-.5,2,6);else if(r<.7){p.mode='down';p.timer=1.5;p.vx=(rnd()-.5)*8;p.vz=(rnd()-.5)*8;}else{p.mode='cower';p.timer=1.5;}}}
      const before=new Map(peds.map(p=>[p,{in:p.mode!=='hide'&&!!W.inBuilding(p.x,p.z),mode:p.mode,x:p.x,z:p.z}]));
      updatePeople(dt);frames++;
      for(const p of peds){if(p.mode==='hide'){p._ent=null;continue;}const b=before.get(p),now=!!W.inBuilding(p.x,p.z);
        if(now&&!b.in&&!p._ent)p._ent={how:'other',prev:b.mode,dt,from:[+b.x.toFixed(1),+b.z.toFixed(1)]};
        if(!now)p._ent=null;
        if(p.mode==='walk'&&now){insideFrames++;if(!p._rep){p._rep=1;note(p,p._ent?p._ent.how:'unknown',{prev:p._ent?p._ent.prev:'?',dt:p._ent&&p._ent.dt,from:p._ent&&p._ent.from,e:p._ent&&p._ent.e});}}
        else if(!now)p._rep=0;}
    }
  }
  stepPed=sp;pedPlace=pp;
  return{frames,insideFrames,events:Object.values(tab).reduce((a,b)=>a+b,0),tab,ev:ev.slice(0,12)};}};`+o));
  const p=await b.newPage({viewport:{width:900,height:600}});p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+dir+`_fixpeds_${tag}.html`);
  await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:200000});await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{const W=__t.world,G=W.graph;let n=0,inside=0,b2=0;
    for(const e of W.edges){if(e.cls>1)continue;const A=G.get(e.a),B=G.get(e.b);if(!A||!B)continue;const L=Math.hypot(B.x-A.x,B.z-A.z),k=Math.max(1,Math.ceil(L/2));
      for(let i=0;i<=k;i++)for(const side of[1,-1])for(const lane of[-.4,0,.4]){n++;const q=__t.pedTarget({e,t:i/k,side,lane,avo:0}),bb=W.inBuilding(q[0],q[1]);if(bb){inside++;if(bb.b2)b2++;}}}
    return{n,inside,b2};});
  const s=await p.evaluate(()=>__t.run(600,40,12345));
  await p.close();return{...r,stress:{frames:s.frames,walkInsideFrames:s.insideFrames,events:s.events,causes:s.tab}};};
const a=await count(file,'new'),bs=base?await count(base,'base'):null;
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};
check('no pavement spot on any road edge is inside a building',a.inside===0,{n:a.n,inside:a.inside});
check('stress: 600 respawns x 40 steps of 0.033-0.5 s with knock-downs and flights, no walking pedestrian inside a building',a.stress.events===0,a.stress);
if(bs){check('the base page had some spots (the bug)',bs.inside>0,{inside:bs.inside});check('the stress run shows the bug on the base page',bs.stress.events>0,bs.stress);}
check('no page errors',errs.length===0,errs.slice(0,3));
await b.close();console.log(fails?'FAIL':'PASS');process.exit(fails?1:0);
