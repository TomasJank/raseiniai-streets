// recorded car sounds: node test_carsound.mjs page.html  (exit 1 on a failed check)
// headless chromium has no audio output: this reads the graph back (gains, rates, which buffers play, where they connect)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get snd(){return snd},get AC(){return AC},get drv(){return drv},get bus(){return bus},get cops(){return cops},get muted(){return muted},
get CS(){return CS},get D3(){return typeof D3!=='undefined'?D3:null},get CS_PICK(){return CS_PICK},get CS_RATE(){return CS_RATE},KEY,csEngine,csWeights,csVoice,csSetEngine,csDrive,get csKind(){return csKind},csUpdate,driveCar,resetToRoad,initAudio,carBumpSound,syncCar,
// wrapped after this object is made: read them when called
get updateAudio(){return updateAudio},get enterExit(){return enterExit},get crashFX(){return crashFX},
step(n,dt=.033,each){CS.dtFix=dt;for(let i=0;i<n;i++){driveCar(player.car,dt);this.updateAudio(true);if(each)each(i,dt);}CS.dtFix=0;}};`;
fs.writeFileSync(dir+'_carsound.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:900,height:520}});
// every connect() of the page is recorded, so the check on sound off can see where the car sound nodes really go
await p.addInitScript(()=>{const pc=AudioNode.prototype.connect,M=window.__dst=new WeakMap();AudioNode.prototype.connect=function(d,...a){M.set(this,d);return pc.call(this,d,...a);};});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_carsound.html',{timeout:300000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});await p.waitForTimeout(1500);
let fails=0;
const check=(name,ok,info)=>{console.log(ok?'ok  ':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};
const R=x=>+(+x).toFixed(3);

const blk=await p.evaluate(()=>{const el=document.getElementById('rasCarSnd');if(!el)return{block:false};const D=JSON.parse(el.textContent);
  return{block:true,n:Object.keys(D.clips).length,kb:Math.round(el.textContent.length/1024),pick:__t.CS_PICK,eng:Object.keys(D.clips).filter(k=>/^[a-z]_/.test(k)).length};});
check('rasCarSnd block: clips of the picked engines, at most 600 KB',blk.block&&blk.n>=20&&blk.kb<=600,blk);

// fallback first: with the block gone the game starts its audio as before and the synthesised engine plays
const fb=await p.evaluate(async()=>{const T=__t,el=document.getElementById('rasCarSnd');el.remove();
  T.resetToRoad();T.initAudio();const c=T.player.car;c.speed=0;for(const k in T.KEY)T.KEY[k]=false;T.KEY.KeyW=true;T.step(40);T.KEY.KeyW=false;
  await new Promise(r=>setTimeout(r,300));
  const r={ok:T.CS.ok,ready:!!T.CS.ready,synthOff:T.CS.synthOff,engGain:R(T.snd.eng.g.gain.value),voice:!!T.CS.player};
  document.body.appendChild(el);window.__el=el;return r;function R(x){return+x.toFixed(4);}});
check('no clips: the synthesised engine plays (fallback)',!fb.ok&&!fb.ready&&!fb.synthOff&&fb.engGain>0&&!fb.voice,fb);

// a block whose diesel clips do not decode: still the synth
const bad=await p.evaluate(async()=>{const T=__t,el=window.__el,good=el.textContent,D=JSON.parse(good);
  for(const k in D.clips)if(k.startsWith(T.CS_PICK.diesel+'_'))D.clips[k]=btoa('not an ogg file');
  el.textContent=JSON.stringify(D);T.CS.ready=null;T.step(2);await T.CS.ready;T.step(2);
  const r={ok:T.CS.ok,synthOff:T.CS.synthOff,decoded:Object.keys(T.CS.buf).length};
  el.textContent=good;T.CS.ready=null;T.step(1);await T.CS.ready;T.step(2);r.after=T.CS.ok;return r;});
check('diesel clips failing to decode: synth stays, real clips then take over',!bad.ok&&!bad.synthOff&&bad.after===true,bad);

const dec=await p.evaluate(()=>{const T=__t,B=T.CS.buf,D=JSON.parse(document.getElementById('rasCarSnd').textContent),out={};
  // the clip carries the loop's own wrap on both sides: after loopEnd it must continue as from loopStart
  let worst=1;for(const k in D.meta){const m=D.meta[k];if(!Array.isArray(m)||!B[k])continue;const b=B[k].getChannelData(0),sr=B[k].sampleRate,a=Math.round(m[2]*sr),e=Math.round((m[2]+m[3])*sr),n=Math.round(.02*sr);
    let xy=0,xx=0,yy=0;for(let i=0;i<n;i++){xy+=b[a+i]*b[e+i];xx+=b[a+i]**2;yy+=b[e+i]**2;}const c=xy/Math.sqrt(xx*yy+1e-12);out[k]=+c.toFixed(3);worst=Math.min(worst,c);}
  return{n:Object.keys(B).length,clips:Object.keys(D.clips).length,durOk:Object.values(B).every(b=>b.duration>0),worst:+worst.toFixed(3),seam:out,rate:T.AC.sampleRate};});
check('every clip decodes; each loop continues past loopEnd as from loopStart (corr > .9, decoder alignment)',dec.n===dec.clips&&dec.durOk&&dec.worst>.9,dec);

// crossfade: which loops a voice plays at idle, mid and high rpm, gains read back from the nodes after they settle
const xf=await p.evaluate(async()=>{const T=__t,E=T.CS.eng.petrol,v=T.csVoice(T.AC,T.snd.master),r={};T.csSetEngine(v,E,T.AC.currentTime);
  for(const [rpm,load] of [[850,0],[2600,1],[3200,0],[5000,1]]){T.csDrive(v,rpm,load,.001,T.AC.currentTime,1,.01);await new Promise(q=>setTimeout(q,250));
    const g={};v.src.forEach((s,k)=>{if(s&&s.g.gain.value>.1)g[E.L[k].k]=[+s.g.gain.value.toFixed(2),+s.s.playbackRate.value.toFixed(3)];});r[rpm+'/'+load]=g;}
  T.csDrive(v,850,0,0,T.AC.currentTime);v.out.disconnect();
  r.loops=E.L.map(l=>l.k+':'+l.rpm+(l.load?'+':'-'));return r;});
const names=g=>Object.keys(g).sort().join();
const near=(g,rpm,cands)=>Object.keys(g).length>=1&&Object.keys(g).length<=2&&Object.keys(g).every(k=>cands.includes(k));
check('crossfade picks the loops either side: idle -> p_idle; 2600 pulling -> 2500/3000; 3200 coasting -> c2800/c3600; 5000 pulling -> 4800/5600',
  near(xf['850/0'],850,['p_idle'])&&near(xf['2600/1'],2600,['p_2500','p_3000'])&&near(xf['3200/0'],3200,['p_c2800','p_c3600'])&&near(xf['5000/1'],5000,['p_4800','p_5600']),xf);

// the player's engine through three gears: rpm drops on every upshift, the voice dips (shift cut), pitch stays in range
const drive=await p.evaluate(()=>{const T=__t,c=T.player.car;T.resetToRoad();c.speed=0;c.hp=1;for(const k in T.KEY)T.KEY[k]=false;T.CS.startT=0;T.step(30);
  const P=T.CS.player,rows=[];let rmin=9,rmax=0,dmin=9,dmax=0;T.KEY.KeyW=true;
  T.step(420,.033,()=>{let wm=0,dr=1;P.src.forEach(s=>{if(!s)return;if(s.w>.002){rmin=Math.min(rmin,s.r);rmax=Math.max(rmax,s.r);}if(s.w>wm){wm=s.w;dr=s.r;}});dmin=Math.min(dmin,dr);dmax=Math.max(dmax,dr);
    rows.push([T.drv.gear,P.r,P.vol,c.speed]);});
  T.KEY.KeyW=false;
  const shifts=[];for(let i=1;i<rows.length;i++)if(rows[i][0]>rows[i-1][0]){const before=rows[i-1][1],after=Math.min(...rows.slice(i,i+10).map(r=>r[1])),vb=rows[i-1][2],va=Math.min(...rows.slice(i,i+6).map(r=>r[2]));
    // the drop this car's own gear step implies from that rpm (old builds: the shared model's fall back to about 2,400)
    const Rt=T.D3&&T.D3.P[c.g.userData.car2&&c.g.userData.car2.key]&&T.D3.P[c.g.userData.car2.key].ratios,g=rows[i][0];
    const want=Rt?before*(1-Rt[g-1]/Rt[g-2]):1000;
    shifts.push({gear:g,rpm:[Math.round(before),Math.round(after)],want:Math.round(want),vol:[+vb.toFixed(3),+va.toFixed(3)]});}
  return{shifts,rate:[+rmin.toFixed(3),+rmax.toFixed(3)],dominant:[+dmin.toFixed(3),+dmax.toFixed(3)],limits:T.CS_RATE,top:Math.round(c.speed),engine:P.E&&P.E.pre};});
check('upshifts drop the rpm voice (within 0.3 s, at least half the drop the car\'s own gear step implies from the rpm it shifted at; the rest is the smoothing and the speed gained during the 0.3 s) and cut its gain (to < 70%), at least two shifts',
  drive.shifts.length>=2&&drive.shifts.every(s=>s.rpm[0]-s.rpm[1]>=.5*s.want&&s.vol[1]<s.vol[0]*.7),drive);
check('pitch: every heard loop within CS_RATE, the loudest within 0.8-1.25',drive.rate[0]>=drive.limits[0]&&drive.rate[1]<=drive.limits[1]&&drive.dominant[0]>=.8&&drive.dominant[1]<=1.25,{rate:drive.rate,dominant:drive.dominant,limits:drive.limits});

// diesel for vans and the bus: the kinds by model, then a traffic voice on the bus
// the diesel set is the game's own spec data (drive3: fuel per model); older builds: the shared list
const kinds=await p.evaluate(()=>{const T=__t,k={};for(const c of T.world.cars){const key=c.g.userData.car2&&c.g.userData.car2.key;if(key)k[key]=T.csKind(c);}k.bus=T.csKind({bus:true});
  const D=T.D3?Object.keys(T.D3.P).filter(m=>T.D3.P[m].fuel==='d'):['sprinter','w124','w210','a4_b55','passat_b3'];return{k,D};});
check('diesel exactly for the models whose spec says diesel, and the bus; petrol for the rest (Audi 80 petrol)',kinds.k.bus==='diesel'&&kinds.k.audi80==='petrol'&&Object.keys(kinds.k).length>10&&Object.entries(kinds.k).every(([m,v])=>v===(m==='bus'||kinds.D.includes(m)?'diesel':'petrol')),kinds);
const busv=await p.evaluate(async()=>{const T=__t,B=T.bus;if(!B)return{bus:false};
  if(T.player.mode==='car'){T.player.car.speed=0;T.enterExit();}T.player.x=B.x+Math.cos(B.h)*6;T.player.z=B.z-Math.sin(B.h)*6;await new Promise(r=>setTimeout(r,1500));
  const v=T.CS.tv.find(v=>v.car&&v.car.bus);return{bus:true,voice:!!v,engine:v&&v.E&&v.E.pre,vol:v&&+v.vol.toFixed(3),pick:T.CS_PICK.diesel};});
check('a traffic voice plays the bus with the diesel loops',busv.voice&&busv.engine===busv.pick&&busv.vol>0,busv);

// traffic voices: never more than N, all on the shared pool
const tv=await p.evaluate(async()=>{const T=__t,c=T.world.cars.find(c=>c.ai&&!c.dead);if(c){T.player.x=c.x+3;T.player.z=c.z+3;}await new Promise(r=>setTimeout(r,1200));
  let max=0,src=0;for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,50));max=Math.max(max,T.CS.tv.filter(v=>v.car&&v.vol>0).length);
    src=Math.max(src,T.CS.tv.reduce((a,v)=>a+v.src.filter(Boolean).length,0));}
  return{N:T.CS.N,pool:T.CS.tv.length,maxActive:max,maxSources:src,moving:T.world.cars.filter(c=>c.ai).length};});
check('no more than N traffic voices (one shared pool, a few sources each)',tv.pool===tv.N&&tv.maxActive<=tv.N&&tv.maxActive>=1&&tv.maxSources<=tv.N*5,tv);

// getting in and out, the crash, the bump: recorded buffers, no oscillators for the crash
const ev=await p.evaluate(async()=>{const T=__t,AC=T.AC,B=T.CS.buf,name=b=>Object.keys(B).find(k=>B[k]===b)||'?';const log=[];let osc=0;
  const fs=AC.createBufferSource.bind(AC),fo=AC.createOscillator.bind(AC);AC.createBufferSource=()=>{const s=fs(),st=s.start.bind(s);s.start=(...a)=>{log.push(name(s.buffer));return st(...a);};return s;};AC.createOscillator=()=>{osc++;return fo();};
  const r={};const c=T.world.cars.find(c=>!c.ai&&!c.cop&&c!==T.player.car)||T.player.car;
  if(T.player.mode==='car'){T.player.car.speed=0;T.enterExit();}T.player.x=c.x+1.5;T.player.z=c.z+1;log.length=0;T.enterExit();r.in=[...log];log.length=0;
  c.speed=0;T.enterExit();r.out=[...log];await new Promise(q=>setTimeout(q,1200));log.length=0;osc=0;
  T.crashFX(c,{nx:1,nz:0},22);r.crash=[...log];r.crashOsc=osc;log.length=0;
  r.bump=+T.carBumpSound(.6).toFixed(2);r.bumpClip=[...log];
  AC.createBufferSource=fs;AC.createOscillator=fo;return r;});
check('in: door + starter; out: switch-off + doors; crash: recorded metal, synth hushed; carBumpSound plays the bump',
  ev.in.includes('door_close')&&ev.in.some(n=>n.startsWith('start_'))&&ev.out.includes('stop_p')&&ev.out.includes('door_open')&&ev.crash.includes('crash_big')&&ev.crashOsc===0&&ev.bump>0&&ev.bumpClip.includes('bump'),ev);

// sound off silences everything: every carsound node ends on the master bus, and V zeroes it
const off=await p.evaluate(async()=>{const T=__t,P=T.CS.player;
  const outs=[P.out,...T.CS.tv.map(v=>v.p),T.CS.horn&&T.CS.horn.p,T.CS.siren&&T.CS.siren.p,T.CS.sq&&T.CS.sq.p].filter(Boolean);
  const allMaster=outs.length>=4&&outs.every(n=>window.__dst.get(n)===T.snd.master);
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV',key:'v'}));await new Promise(r=>setTimeout(r,100));
  const r={allMaster,muted:T.muted,master:T.snd.master.gain.value,shot:T.carBumpSound(1)};
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV',key:'v'}));await new Promise(r=>setTimeout(r,100));r.unmuted=T.snd.master.gain.value;return r;});
check('sound off (V): master gain 0, all carsound outputs on the master, one-shots refused',off.allMaster&&off.muted&&off.master===0&&off.shot===0&&off.unmuted>0,off);

const hid=await p.evaluate(async()=>{const T=__t;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(r=>setTimeout(r,300));const a=T.AC.state;Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(r=>setTimeout(r,300));return{hidden:a,back:T.AC.state};});
check('hidden tab suspends the context (and every car sound with it), visible resumes',hid.hidden==='suspended'&&hid.back==='running',hid);

const cost=await p.evaluate(()=>{const T=__t;T.resetToRoad();const t0=performance.now();for(let i=0;i<300;i++)T.csUpdate(true,1/60);return{msPerCall:+((performance.now()-t0)/300).toFixed(3)};});
check('csUpdate costs under 0.2 ms a frame',cost.msPerCall<.2,cost);

check('no console errors',errs.length===0,errs.slice(0,3));
await b.close();process.exit(fails?1:0);
