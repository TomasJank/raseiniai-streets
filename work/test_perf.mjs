// perf2: node test_perf.mjs page.html   (Metal; exits 1 on a failed check; writes _perf.html beside itself)
// Draw calls and triangles per frame are counted on one render with the main loop paused and traffic and people hidden,
// so they do not depend on machine load. Budgets sit about 8% over the perf2 build and under the build before it.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get scene(){return scene},get camera(){return camera},get renderer(){return renderer},THREE,resetToRoad,syncCar,
 get bus(){return typeof bus!=='undefined'?bus:null},get PERF(){return typeof PERF!=='undefined'?PERF:null},get GFX(){return GFX},get sun(){return sun},get frame(){return frame},
 perfLevel(L){perfLevel(L);},perfAuto(){perfAuto();},gfxRender(){gfxRender();},perfTick(){perfT=0;perfTick(.016);},
 place(x,z,hd){tod=13;weather.kind='clear';weather.amt=weather.want=0;for(let i=0;i<40;i++)updateEnv(.05);player.x=x;player.z=z;resetToRoad();const c=player.car;if(hd!=null){c.h=c.trav=player.h=hd;syncCar(c);}}};`;
fs.writeFileSync(dir+'_perf.html',h.replace(o,api+o));
const args=['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files'];
const b=await chromium.launch({args});
let fails=0;const errs=[];
const say=(ok,name,r)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(r));if(!ok)fails++;};
const open=async(gfx,w=1280,ht=720)=>{const ctx=await b.newContext({viewport:{width:w,height:ht}});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));if(gfx)await p.addInitScript(g=>{window.__GFX=g;},gfx);
  await p.goto('file://'+dir+'_perf.html',{timeout:300000,waitUntil:'commit'});
  await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length&&document.getElementById('loader').hidden,null,{timeout:300000});
  await p.waitForTimeout(3000);return {p,ctx};};
// one render with the loop paused: calls and triangles per pass, and how many matrices were composed
const count=()=>new Promise(res=>{const T=__t,R=T.renderer,S=T.scene,raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  setTimeout(()=>{if(T.PERF)T.perfTick();T.gfxRender();const acc={shadow:[0,0],ao:[0,0],beauty:[0,0]};R.info.autoReset=false;R.info.reset();
    const sr=R.shadowMap.render;R.shadowMap.render=function(...a){const c=R.info.render.calls,t=R.info.render.triangles;sr.apply(this,a);acc.shadow[0]+=R.info.render.calls-c;acc.shadow[1]+=R.info.render.triangles-t;};
    const rr=R.render;R.render=function(sc,cam){const c=R.info.render.calls,t=R.info.render.triangles,s0=acc.shadow.slice();rr.call(this,sc,cam);
      if(sc===S){const k=sc.overrideMaterial?'ao':'beauty';acc[k][0]+=R.info.render.calls-c-(acc.shadow[0]-s0[0]);acc[k][1]+=R.info.render.triangles-t-(acc.shadow[1]-s0[1]);}};
    const M=T.THREE.Matrix4.prototype,co=M.compose;let nc=0;M.compose=function(...a){nc++;return co.apply(this,a);};
    T.gfxRender();M.compose=co;R.shadowMap.render=sr;R.render=rr;R.info.autoReset=true;
    const r={calls:acc.shadow[0]+acc.ao[0]+acc.beauty[0],Mtris:+((acc.shadow[1]+acc.ao[1]+acc.beauty[1])/1e6).toFixed(2),pass:acc,compose:nc};
    window.requestAnimationFrame=raf;raf(T.frame);res(r);},50);});
const still=()=>{const T=__t,H=window.__hid=[];for(const c of T.world.cars)if(c.g.visible){c.g.visible=false;H.push(c.g);}T.scene.traverse(o=>{if(o.visible&&(o.isSkinnedMesh||(o.isInstancedMesh&&o.frustumCulled===false&&!o.userData.keep))){o.visible=false;H.push(o);}});};
const unstill=()=>{for(const o of window.__hid||[])o.visible=true;window.__hid=[];};
const placeAt=async(p,pl)=>{await p.evaluate(pl=>{const T=__t,W=T.world;let q;
  if(pl==='start')q=window.__start||(window.__start=[T.player.x,T.player.z,T.player.h]);
  else if(pl==='square'){const l=W.labels.find(l=>/Žemaičio aikštė/.test(l.text));q=[l.x,l.z,null];}
  else{const l=W.labels.find(l=>/Raseinių parkas/.test(l.text));q=[l.x,l.z,null];}
  T.place(q[0],q[1],q[2]);},pl);await p.waitForTimeout(2500);};

// budgets, level 0 (full quality) at three busy places
const BUD={start:{calls:620,Mtris:5.4},square:{calls:600,Mtris:5.1},park:{calls:500,Mtris:6.3}};
const {p,ctx}=await open({auto:false});
await p.evaluate(()=>{window.__start=[__t.player.x,__t.player.z,__t.player.h];});
for(const pl of ['start','square','park']){await placeAt(p,pl);await p.evaluate(still);
  const r=await p.evaluate(count);await p.evaluate(unstill);const B=BUD[pl];
  say(r.calls<=B.calls&&r.Mtris<=B.Mtris,`${pl}: draw calls and triangles per frame within budget`,{...r,budget:B});
  if(pl==='start')say(r.compose<200,'static objects: matrices composed in one render (was about 10,000)',{compose:r.compose});}

// every moving thing keeps its matrix in step with its position: compose(p,q,s) and parent x local, after real frames
await placeAt(p,'start');
const mv=await p.evaluate(()=>new Promise(res=>{const T=__t,W=T.world,TH=T.THREE;
  const cars=W.cars.filter(c=>c.ai&&c.g).slice(0,40).map(c=>[c,c.x,c.z]),B=T.bus,b0=B&&[B.x,B.z];
  const bones=[],cp=T.camera.position;T.scene.traverse(o=>{if(o.isSkinnedMesh&&o.visible&&o.skeleton&&Math.hypot(o.matrixWorld.elements[12]-cp.x,o.matrixWorld.elements[14]-cp.z)<120)for(const q of o.skeleton.bones)bones.push([q,q.matrixWorld.elements[12],q.matrixWorld.elements[14]]);});
  let n=0;const f=()=>{if(++n<90)return requestAnimationFrame(f);
    const raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;setTimeout(()=>{T.gfxRender();
      const m=new TH.Matrix4(),w=new TH.Matrix4();let stale=0,checked=0;const bad=[];
      T.scene.traverse(o=>{if(!o.matrixAutoUpdate)return;checked++;m.compose(o.position,o.quaternion,o.scale);if(o.pivot)return;
        if(o.parent&&o.matrixWorldAutoUpdate)w.multiplyMatrices(o.parent.matrixWorld,m);else w.copy(m);
        let d=0;for(let i=0;i<16;i++)d=Math.max(d,Math.abs(w.elements[i]-o.matrixWorld.elements[i]));if(d>1e-3){stale++;if(bad.length<4)bad.push(o.name||o.type);}});
      const moved=cars.filter(([c,x,z])=>Math.hypot(c.x-x,c.z-z)>1),follow=moved.filter(([c])=>Math.hypot(c.g.matrixWorld.elements[12]-c.x,c.g.matrixWorld.elements[14]-c.z)<.5);
      const bonesMoved=bones.filter(([o,x,z])=>Math.hypot(o.matrixWorld.elements[12]-x,o.matrixWorld.elements[14]-z)>.05).length;
      const busMoved=B?Math.hypot(B.x-b0[0],B.z-b0[1]):null,busFollow=B&&B.mesh?Math.hypot(B.mesh.matrixWorld.elements[12]-B.x,B.mesh.matrixWorld.elements[14]-B.z):null;
      window.requestAnimationFrame=raf;raf(T.frame);res({checked,stale,bad,cars:cars.length,moved:moved.length,follow:follow.length,bones:bones.length,bonesMoved,busMoved,busFollow});},50);};
  requestAnimationFrame(f);}));
say(mv.stale===0&&mv.checked>3000,'no object has a stale world matrix after 90 frames',{checked:mv.checked,stale:mv.stale,bad:mv.bad});
say(mv.moved>=3&&mv.follow===mv.moved,'traffic cars move and their meshes follow',{cars:mv.cars,moved:mv.moved,follow:mv.follow});
say(mv.bonesMoved>10,'walking people: skeleton bones move',{bones:mv.bones,moved:mv.bonesMoved});
say(mv.busMoved==null||mv.busFollow<.5,'the bus mesh is where the bus is',{busMoved:mv.busMoved,busFollow:mv.busFollow});

// each forced level changes what it says; draw calls fall level by level
if(!await p.evaluate(()=>!!__t.PERF)){say(false,'quality levels exist (PERF)',{});await b.close();console.log(`${fails} FAILED`);process.exit(1);}
const lv=[];await placeAt(p,'start');await p.evaluate(still);
for(let L=0;L<=5;L++){await p.evaluate(L=>__t.perfLevel(L),L);await p.waitForTimeout(300);
  const r=await p.evaluate(count);const s=await p.evaluate(()=>{const T=__t,P=T.PERF;return{pr:T.renderer.getPixelRatio(),ao:T.GFX.ao,sh:T.sun.shadow.mapSize.x,cast:T.sun.castShadow,px:P.px,tree:P.tree};});
  lv.push({L,...s,calls:r.calls,Mtris:r.Mtris,ao_calls:r.pass.ao[0],shadow_calls:r.pass.shadow[0]});}
const base=lv[0];
console.log('levels',JSON.stringify(lv));
say(base.ao&&base.cast&&base.sh>=2048&&base.ao_calls>0,'level 0: full quality (AO, 2048 sun shadows)',base);
say(lv[1].pr<=1,'level 1: pixel ratio at most 1',lv[1]);
say(!lv[2].ao&&lv[2].ao_calls===0&&lv[2].calls<lv[1].calls,'level 2: no AO pass',lv[2]);
say(lv[3].sh<=1024&&lv[3].tree<base.tree&&lv[3].shadow_calls<lv[2].shadow_calls,'level 3: 1024 shadow map, fewer shadow casters',lv[3]);
say(lv[4].px>base.px&&lv[4].calls<lv[3].calls,'level 4: shorter draw distance for small things',lv[4]);
say(!lv[5].cast&&lv[5].shadow_calls===0&&lv[5].pr<=.75,'level 5: no sun shadows, pixel ratio .75',lv[5]);
// a window longer than 5 s is a hidden or stalled tab, not a slow machine
const hid=await p.evaluate(()=>{const P=__t.PERF;__t.perfLevel(0);P.wait=0;P.slow=1;P.t0=performance.now()-9000;P.f=Array(20).fill(400);__t.perfAuto();return{level:P.level};});
say(hid.level===0,'a hidden-tab gap does not lower the level',hid);
// stepping (each window has one 400 ms hitch, which must not count): two slow windows go down (over a level that changes nothing here), three fast ones come back, a quick relapse
// makes the next try wait twice as long
const st=await p.evaluate(()=>{const P=__t.PERF,win=fps=>{P.t0=performance.now()-2100;P.f=Array(Math.round(2.1*fps)).fill(1000/fps);P.f.push(400);__t.perfAuto();return P.level;};
  __t.perfLevel(0);P.wait=0;P.slow=P.fast=0;P.bad=[];P.up=0;P.hold=0;P.chk=null;const pr1=__t.renderer.getPixelRatio()<=1,seq=[];
  seq.push(win(20),win(20));P.wait=0;seq.push(win(60),win(60),win(60));P.wait=0;seq.push(win(20),win(20));P.wait=0;seq.push(win(60),win(60),win(60));
  const bad=P.bad.slice();
  // capped at 30 Hz: the step down does not help, so it is undone and held
  __t.perfLevel(0);P.wait=0;P.slow=P.fast=0;P.bad=[];P.up=0;P.hold=0;P.chk=null;const cap=[];cap.push(win(30),win(30));P.wait=0;cap.push(win(30),win(30),win(30),win(30));
  const r={pr1,seq,bad,cap,held:P.hold>performance.now()};__t.perfLevel(0);P.hold=0;return r;});
{const d=st.pr1?2:1;say(JSON.stringify(st.seq)===JSON.stringify([0,d,d,d,0,0,d,d,d,d])&&st.bad[0]===6,'auto steps down, back up, and backs off after a relapse',st);
  say(JSON.stringify(st.cap)===JSON.stringify([0,d,0,0,0,0])&&st.held,'a 30 Hz cap: a step down that does not help is undone and held',{cap:st.cap,held:st.held});}
await ctx.close();

// __GFX.level forces a level at load and holds it
{const {p,ctx}=await open({level:3});await p.waitForTimeout(6000);
  const r=await p.evaluate(()=>({level:__t.PERF.level,ao:__t.GFX.ao}));say(r.level===3&&!r.ao,'__GFX.level=3 holds',r);await ctx.close();}
// automatic: a CPU four times slower steps down; this machine at full speed stays at level 0
{const {p,ctx}=await open(null);const c=await ctx.newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:4});
  await p.waitForTimeout(25000);const r=await p.evaluate(()=>({level:__t.PERF.level}));await c.send('Emulation.setCPUThrottlingRate',{rate:1});
  say(r.level>=2,'4x slower CPU: automatic level steps down to 2 or more within 25 s',r);await ctx.close();}
{const {p,ctx}=await open(null);await p.waitForTimeout(15000);const r=await p.evaluate(()=>({level:__t.PERF.level,pr:__t.renderer.getPixelRatio(),ao:__t.GFX.ao}));
  say(r.level===0,'full speed: level stays 0 (needs an idle machine)',r);await ctx.close();}
say(!errs.length,'no page errors',errs.slice(0,4));
// F2 readout: shows a frame rate, the card and the level, and the loop keeps running through the swapped requestAnimationFrame
{const {p,ctx}=await open();await p.keyboard.press('F2');await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{const e=document.getElementById('perfDbg');return e&&!e.hidden?e.textContent:null;});
  const x0=await p.evaluate(()=>__t.world.cars.map(c=>c.x+c.z).join());await p.waitForTimeout(1000);const moved=await p.evaluate(x=>__t.world.cars.map(c=>c.x+c.z).join()!==x,x0);
  await p.keyboard.press('F2');const hid=await p.evaluate(()=>document.getElementById('perfDbg').hidden);
  say(!!r&&/^[1-9]\d* fps · frame [\d.]+ ms/.test(r)&&/quality \d\/5 · \d+x\d+/.test(r)&&/ANGLE|Apple|Metal/.test(r)&&moved&&hid,'F2 readout',{r,moved,hid});await ctx.close();}
await b.close();
console.log(fails?`${fails} FAILED`:'ALL PASS');process.exit(fails?1:0);
