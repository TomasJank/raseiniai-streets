// audition page logic: runs carsound.js's core (csEngine, csVoice, csDrive ...) on the clips of every candidate
// a drive in the game's own model: idle, full throttle through three gears, cruise in third, brake to a stop, idle
function simDrive(){
  const F=[],dt=1/60;let v=0,g=0,r=850,ld=0,shiftT=0,t=0,ph='idle',ph0=0;
  while(t<22){
    const pt=t-ph0;
    if(ph==='idle'&&pt>1.5){ph='go';ph0=t;}
    else if(ph==='go'&&v>=21){ph='cruise';ph0=t;}
    else if(ph==='cruise'&&pt>4){ph='brake';ph0=t;}
    else if(ph==='brake'&&v<=0){ph='stop';ph0=t;}
    const th=ph==='go'||ph==='cruise';
    if(ph==='go'&&shiftT<=0)v+=9.5*(1-v/37)*dt;
    if(ph==='brake')v=Math.max(0,v-5.5*dt);
    const ng=csGear(g,v);if(ng>g)shiftT=.26;else if(ng<g)shiftT=.16;g=ng;shiftT=Math.max(0,shiftT-dt);
    const want=csWant(v,g,th);r+=(want-r)*(1-Math.exp(-dt*60*(want>r?.08:.15)));
    const load=ph==='go'&&shiftT<=0?1:ph==='cruise'?.4:0;ld+=(load-ld)*Math.min(1,dt*(load>ld?12:5));
    const cut=shiftT>0?.35+.65*(1-shiftT/.26):1;
    F.push({t,rpm:r,load:ld,gear:g+1,cut,v,ph});t+=dt;}
  return F;}
// schedule a drive on a voice from time t0; the engine kind decides the rpm mapping like the game does
function playDrive(v,kind,t0,F,vol=.5){
  for(const f of F){const rpm=kind==='diesel'?csDieselRpm(f.rpm):f.rpm;csDrive(v,rpm,f.load,vol*csLoud(rpm,f.load)*f.cut,t0+f.t);}
  csDrive(v,850,0,0,t0+F[F.length-1].t+.1);}
// offline render for the check pictures: {drive: wav of the drive per engine, seams: each loop played three times}
async function renderChecks(){
  const D=JSON.parse(document.getElementById('rasCarSnd').textContent),sr=48000,out={};
  const wav=b=>{const d=b.getChannelData(0),n=d.length,a=new DataView(new ArrayBuffer(44+n*2));const S=(o,s)=>[...s].forEach((c,i)=>a.setUint8(o+i,c.charCodeAt(0)));
    S(0,'RIFF');a.setUint32(4,36+n*2,true);S(8,'WAVEfmt ');a.setUint32(16,16,true);a.setUint16(20,1,true);a.setUint16(22,1,true);a.setUint32(24,sr,true);a.setUint32(28,sr*2,true);a.setUint16(32,2,true);a.setUint16(34,16,true);S(36,'data');a.setUint32(40,n*2,true);
    for(let i=0;i<n;i++)a.setInt16(44+i*2,Math.max(-1,Math.min(1,d[i]))*32767,true);let s='';const u=new Uint8Array(a.buffer);for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s);};
  const F=simDrive(),dur=F[F.length-1].t+.6;
  for(const[pre,kind]of CANDS.map(c=>[c.pre,c.kind])){
    const ctx=new OfflineAudioContext(1,Math.ceil(sr*dur),sr),buf=await csDecode(ctx,D),E=csEngine(D,buf,pre),v=csVoice(ctx,ctx.destination);
    csSetEngine(v,E,0);playDrive(v,kind,0,F,.9);out['drive_'+pre]=wav(await ctx.startRendering());}
  // seams: a loop source plays each loop region three times, so the joins sit at len and 2*len
  const lens={};for(const[k,m]of Object.entries(D.meta)){if(!Array.isArray(m))continue;
    const ctx=new OfflineAudioContext(1,Math.ceil(sr*m[3]*3),sr),buf=await csDecode(ctx,{meta:D.meta,clips:{[k]:D.clips[k]}}),s=ctx.createBufferSource();
    s.buffer=buf[k];s.loop=true;s.loopStart=m[2];s.loopEnd=m[2]+m[3];s.connect(ctx.destination);s.start(0,m[2]);out['seam_'+k]=wav(await ctx.startRendering());lens[k]=m[3];}
  out.frames=F.map(f=>[+f.t.toFixed(3),Math.round(f.rpm),+f.load.toFixed(2),f.gear,+f.cut.toFixed(2),+f.v.toFixed(2)]);out.lens=lens;
  return out;}

// ---- the page ----
let ctx=null,master=null,BUF=null,D=null;const live={};
function ensure(){if(ctx)return Promise.resolve();ctx=new AudioContext();master=ctx.createGain();master.gain.value=+document.getElementById('vol').value;master.connect(ctx.destination);
  D=JSON.parse(document.getElementById('rasCarSnd').textContent);return csDecode(ctx,D).then(b=>{BUF=b;});}
function stopAll(){for(const k in live){const v=live[k];if(v.stop)v.stop();delete live[k];}}
function playLoop(name,vol=.6){ensure().then(()=>{stopAll();const m=D.meta[name],s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=BUF[name];s.loop=true;s.loopStart=m[2];s.loopEnd=m[2]+m[3];
  g.gain.value=vol;s.connect(g);g.connect(master);s.start(0,m[2]);live.loop={stop:()=>{g.gain.setTargetAtTime(0,ctx.currentTime,.03);s.stop(ctx.currentTime+.2);}};});}
function playShot(name,vol=.7){ensure().then(()=>{const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=BUF[name];g.gain.value=vol;s.connect(g);g.connect(master);s.start();});}
function voiceFor(c){if(live['v'+c.pre])return live['v'+c.pre];stopAll();const v=csVoice(ctx,master);csSetEngine(v,csEngine(D,BUF,c.pre),ctx.currentTime);
  v.stop=()=>{csDrive(v,v.rpm,0,0,ctx.currentTime);setTimeout(()=>v.out.disconnect(),400);};live['v'+c.pre]=v;return v;}
function slider(c){ensure().then(()=>{const v=voiceFor(c),r=+document.getElementById('rpm_'+c.pre).value,ld=document.getElementById('load_'+c.pre).checked?1:0;
  const rpm=c.kind==='diesel'?csDieselRpm(r):r;csDrive(v,rpm,ld,.5*csLoud(rpm,ld),ctx.currentTime,1,.05);
  document.getElementById('rr_'+c.pre).textContent=Math.round(r)+' rpm (game)'+(c.kind==='diesel'?' = '+Math.round(rpm)+' diesel':'')+' · '+
    v.E.L.map((l,k)=>v.w[k]>.05?l.k+' '+Math.round(v.w[k]*100)+'%':'').filter(Boolean).join(', ');});}
function drive(c){ensure().then(()=>{stopAll();const v=csVoice(ctx,master);csSetEngine(v,csEngine(D,BUF,c.pre),ctx.currentTime);const F=simDrive(),t0=ctx.currentTime+.1;playDrive(v,c.kind,t0,F);
  const el=document.getElementById('rr_'+c.pre);let id=0;const tick=()=>{const t=ctx.currentTime-t0,f=F[Math.min(F.length-1,Math.max(0,Math.floor(t*60)))];
    el.textContent=f.ph+' · gear '+f.gear+' · '+Math.round(f.v*3.6)+' km/h · '+Math.round(f.rpm)+' rpm'+(f.cut<1?' · shift':'');if(t<F[F.length-1].t)id=requestAnimationFrame(tick);};tick();
  live.drive={stop:()=>{cancelAnimationFrame(id);v.out.gain.cancelScheduledValues(ctx.currentTime);v.out.gain.setTargetAtTime(0,ctx.currentTime,.03);setTimeout(()=>v.out.disconnect(),300);}};});}
let hold=null;
function holdLoop(name,on,vol=.5){ensure().then(()=>{if(on){const m=D.meta[name],s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=BUF[name];s.loop=true;s.loopStart=m[2];s.loopEnd=m[2]+m[3];
  g.gain.value=0;g.gain.setTargetAtTime(vol,ctx.currentTime,.01);s.connect(g);g.connect(master);s.start(0,m[2]);hold={s,g};}
  else if(hold){hold.g.gain.setTargetAtTime(0,ctx.currentTime,.04);hold.s.stop(ctx.currentTime+.3);hold=null;}});}
function build(){
  const E=document.getElementById('engines');
  for(const c of CANDS){
    const names=Object.keys(JSON.parse(document.getElementById('rasCarSnd').textContent).meta).filter(k=>k.startsWith(c.pre+'_'));
    const meta=JSON.parse(document.getElementById('rasCarSnd').textContent).meta;names.sort((a,b)=>meta[a][0]-meta[b][0]);
    const sec=document.createElement('section');sec.innerHTML=`<h2>${c.name} <small>${c.tag}</small></h2><p>${c.note}</p>
      <div class="row">${names.map(n=>`<button data-loop="${n}">${meta[n][0]} rpm ${meta[n][1]?'pulling':'no load / coasting'}</button>`).join('')}<button data-stop>Stop</button></div>
      <div class="row"><label>rpm (the game's scale) <input type="range" id="rpm_${c.pre}" min="850" max="5600" step="10" value="850"></label>
      <label><input type="checkbox" id="load_${c.pre}"> throttle (pulling)</label><button data-drive>Simulated drive (22 s)</button></div><p class="rr" id="rr_${c.pre}"></p>`;
    sec.querySelectorAll('[data-loop]').forEach(b=>b.onclick=()=>playLoop(b.dataset.loop));sec.querySelector('[data-stop]').onclick=stopAll;
    sec.querySelector('#rpm_'+c.pre).oninput=()=>slider(c);sec.querySelector('#load_'+c.pre).onchange=()=>slider(c);sec.querySelector('[data-drive]').onclick=()=>drive(c);E.appendChild(sec);}
  document.querySelectorAll('[data-shot]').forEach(b=>b.onclick=()=>playShot(b.dataset.shot));
  document.querySelectorAll('[data-hold]').forEach(b=>{const n=b.dataset.hold;b.onpointerdown=()=>holdLoop(n,true);b.onpointerup=b.onpointerleave=()=>holdLoop(n,false);});
  const sir=document.getElementById('siren');sir.onclick=()=>{if(live.siren){live.siren.stop();delete live.siren;sir.textContent='Siren: play';return;}
    ensure().then(()=>{const m=D.meta.siren,s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=BUF.siren;s.loop=true;s.loopStart=m[2];s.loopEnd=m[2]+m[3];g.gain.value=.4;s.connect(g);g.connect(master);s.start(0,m[2]);
      live.siren={stop:()=>{g.gain.setTargetAtTime(0,ctx.currentTime,.05);s.stop(ctx.currentTime+.4);}};sir.textContent='Siren: stop';});};
  document.getElementById('vol').oninput=e=>{if(master)master.gain.value=+e.target.value;};}
build();
