// ---------- carsound: recorded engines and car sounds over the synthesised ones (research/reports/carsound.md) ----------
// ---- core: no game globals; the audition page (research/assets/sounds/cars/audition.html) runs this part on its own ----
// Engine sets by clip prefix. The choice of engine is this one line (the build embeds only the sets named here):
// p = Ford Escort Mk3 1985 petrol, d = VW New Beetle 1.9 TDI; the audition page has the other candidates.
const CS_PICK={petrol:'p',diesel:'d'};
// a loop never plays further than this from its own pitch; neighbouring loops are at most 1.6x apart, so the louder of the two stays within 0.8-1.25
const CS_RATE=[.7,1.4];
// the game's gear bands (m/s) and rpm model (updateAudio0): first gear pulls from idle, the others drop back to about 2400 rpm
const CS_B=[0,8,15,22,29,37,99];
function csGear(g,s){let n=0;while(s>=CS_B[n+1])n++;if(n>g&&s<CS_B[g+1]+.5||n<g&&s>CS_B[g]-.8)n=g;return n;}
function csWant(s,g,th){const fr=Math.min(1.1,Math.max(-.1,(s-CS_B[g])/(CS_B[g+1]-CS_B[g])));return s<1?(th?3500:850):g===0?900+fr*4300:2400+fr*2900;}
// diesels rev lower: the game's 850-5300 rpm becomes 900-3125
const csDieselRpm=r=>900+(r-850)*.5;
function csDecode(ctx,D){
  const buf={};
  return Promise.all(Object.entries(D.clips).map(([k,v])=>{const s=atob(v),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);
    return ctx.decodeAudioData(a.buffer).then(b=>{buf[k]=b;},()=>{});})).then(()=>buf);}
// one engine: its loops by rpm, and two lists to crossfade along, pulling (on) and coasting (off); each list borrows the other's
// loops beyond its own range, so the coasting list reaches the top and the pulling one starts at idle
function csEngine(D,buf,pre){
  const L=Object.keys(D.meta).filter(k=>k.startsWith(pre+'_')&&Array.isArray(D.meta[k])&&D.meta[k][0]>0&&buf[k])
    .map(k=>{const[r,ld,ps,ln]=D.meta[k];return{k,b:buf[k],rpm:r,load:ld,ls:ps,le:ps+ln};}).sort((a,b)=>a.rpm-b.rpm);
  if(L.length<2)return null;
  const on=L.filter(l=>l.load),off=L.filter(l=>!l.load),lo=on.length?on[0].rpm:Infinity,hi=off.length?off[off.length-1].rpm:-Infinity,ix=l=>L.indexOf(l);
  return{pre,L,on:(on.length?[...off.filter(l=>l.rpm<lo),...on]:L).map(ix),off:(off.length?[...off,...on.filter(l=>l.rpm>hi)]:L).map(ix)};}
// gains per loop: equal-power crossfade between the two loops either side of rpm (in log rpm), then between the lists by load
function csWeights(E,rpm,load,w){
  w.fill(0);
  const add=(list,a)=>{if(a<=0)return;let i=0;while(i<list.length-1&&E.L[list[i+1]].rpm<=rpm)i++;
    const A=E.L[list[i]];if(rpm<=A.rpm||i===list.length-1){w[list[i]]+=a;return;}
    const x=Math.log(rpm/A.rpm)/Math.log(E.L[list[i+1]].rpm/A.rpm);w[list[i]]+=a*Math.cos(x*Math.PI/2)**2;w[list[i+1]]+=a*Math.sin(x*Math.PI/2)**2;};
  add(E.on,load);add(E.off,1-load);
  for(let k=0;k<w.length;k++)w[k]=Math.sqrt(w[k]);
  return w;}
// a voice: one engine's loops into a lowpass (opens with load) and a gain; sources exist only while their loop is heard
function csVoice(ctx,dest){
  const lp=ctx.createBiquadFilter(),out=ctx.createGain();lp.type='lowpass';lp.frequency.value=6000;lp.Q.value=.5;out.gain.value=0;lp.connect(out);if(dest)out.connect(dest);
  return{ctx,lp,out,E:null,src:[],w:null,rpm:850,load:0,vol:0};}
function csSetEngine(v,E,t){
  if(v.E===E)return;for(const s of v.src)if(s){s.g.gain.setTargetAtTime(0,t,.02);s.s.stop(t+.15);}
  v.E=E;v.src=E?E.L.map(()=>null):[];v.w=E?new Float32Array(E.L.length):null;}
function csDrive(v,rpm,load,vol,t,dop=1,tc=.03){
  const E=v.E;if(!E)return;v.rpm=rpm;v.load=load;v.vol=vol;csWeights(E,rpm,load,v.w);
  for(let k=0;k<E.L.length;k++){
    const l=E.L[k],w=vol>0?v.w[k]:0;let s=v.src[k];
    if(w>.002&&!s){const c=v.ctx,b=c.createBufferSource(),g=c.createGain();b.buffer=l.b;b.loop=true;b.loopStart=l.ls;b.loopEnd=l.le;g.gain.value=0;b.connect(g);g.connect(v.lp);
      b.start(t,l.ls+Math.random()*(l.le-l.ls));s=v.src[k]={s:b,g,idle:t,r:1};}
    if(!s)continue;
    s.r=Math.min(CS_RATE[1],Math.max(CS_RATE[0],rpm/l.rpm));s.w=w;
    s.s.playbackRate.setTargetAtTime(s.r*dop,t,tc);s.g.gain.setTargetAtTime(w,t,tc);
    if(w>.002)s.idle=t;else if(t-s.idle>.6){s.s.stop(t+.05);v.src[k]=null;}}
  v.out.gain.setTargetAtTime(vol,t,tc);v.lp.frequency.setTargetAtTime(1600+4400*load+rpm*.5,t,.06);}
// loudness of an engine voice: louder with rpm and when pulling
const csLoud=(rpm,load)=>(.55+.45*load)*(.55+rpm/7000);
// ---- game ----
// clips come from add_carsound.py as {meta,clips}; decoded once after the first gesture, and until then (or if any engine
// clip fails) the synthesised engine of updateAudio0/drive.js keeps playing untouched
const CS={ready:null,ok:false,buf:{},eng:{},player:null,tv:[],N:3,R:70,hush:false,startT:0,hand:false,horn:null,siren:null,sq:null,synthOff:false,
  DIESEL:new Set(['sprinter','w124','w210','a4_b55','passat_b3']),VOL:.5,TVOL:.55};
function csInit(){
  if(CS.ready||!AC||!snd)return;
  const el=document.getElementById('rasCarSnd');if(!el)return;
  const D=JSON.parse(el.textContent);
  CS.ready=csDecode(AC,D).then(buf=>{CS.buf=buf;
    for(const[k,p]of Object.entries(CS_PICK))CS.eng[k]=csEngine(D,buf,p);
    CS.ok=!!(CS.eng.petrol&&CS.eng.diesel);
    for(const n of['horn','squeal','siren'])if(buf[n]&&Array.isArray(D.meta[n]))CS[n==='squeal'?'sq':n]={b:buf[n],ls:D.meta[n][2],le:D.meta[n][2]+D.meta[n][3]};});}
const csKey=c=>{const F=c&&c.g&&c.g.userData.car2;return F&&F.key||'';};
const csKind=c=>c&&(c.bus||CS.DIESEL.has(csKey(c)))?'diesel':'petrol';
function csLoop(o,vol,t){
  if(!o.src){const s=AC.createBufferSource(),g=AC.createGain(),p=AC.createStereoPanner();s.buffer=o.b;s.loop=true;s.loopStart=o.ls;s.loopEnd=o.le;g.gain.value=0;
    s.connect(g);g.connect(p);p.connect(snd.master);s.start(t,o.ls);o.src=s;o.g=g;o.p=p;}
  o.g.gain.setTargetAtTime(vol,t,vol>o.g.gain.value?.01:.04);}
function csShot(name,out,vol,rate=1,delay=0){
  const b=CS.buf[name];if(!b||!out||!snd||muted)return 0;
  const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;s.playbackRate.value=rate;g.gain.value=vol;s.connect(g);g.connect(out);s.start(AC.currentTime+delay);
  return b.duration/rate;}
// the synthesised engine, horn, siren and squeal leave the bus while the recordings play, and come back if they stop
function csSynth(on){
  if(CS.synthOff===!on)return;CS.synthOff=!on;
  for(const n of['eng','eo','horn','siren','sq'])if(snd[n]){const g=snd[n].g;g.disconnect();if(on)g.connect(snd.master);}}
function csPan(p,x,z){const dx=x-camera.position.x,dz=z-camera.position.z,d=Math.hypot(dx,dz)||1;camera.getWorldDirection(_vf);const fl=Math.hypot(_vf.x,_vf.z)||1;
  p.pan.value=clamp((dx*-_vf.z/fl+dz*_vf.x/fl)/d,-1,1)*.8;return d;}
// traffic near the camera: the nearest few moving vehicles share CS.N voices; a voice keeps its car while it stays among them
function csTraffic(t,dt){
  const cam=camera.position,list=[];
  for(const c of world.cars){if(c===player.car||c.dead||!(c.ai||c.cop))continue;const d=Math.hypot(c.x-cam.x,c.z-cam.z);if(d<CS.R)list.push([d,c]);}
  if(typeof bus!=='undefined'&&bus&&bus.mesh){const d=Math.hypot(bus.x-cam.x,bus.z-cam.z);if(d<CS.R*1.3){CS.busC=CS.busC||{bus:true};Object.assign(CS.busC,{x:bus.x,z:bus.z,h:bus.h,speed:bus.v});list.push([d*.8,CS.busC]);}}
  list.sort((a,b)=>a[0]-b[0]);const want=list.slice(0,CS.N).map(e=>e[1]);
  while(CS.tv.length<CS.N){const v=csVoice(AC,null);v.p=AC.createStereoPanner();v.out.connect(v.p);v.p.connect(snd.master);v.car=null;v.fade=0;CS.tv.push(v);}
  for(const v of CS.tv)if(v.car&&!want.includes(v.car))v.car=null;
  for(const c of want)if(!CS.tv.some(v=>v.car===c)){const v=CS.tv.find(v=>!v.car&&v.vol<.003)||CS.tv.find(v=>!v.car);if(v){v.car=c;v.g=0;v.r=null;v.sp=undefined;}}
  const pv=player.mode==='car'?player.car:null,pvx=pv?Math.sin(pv.h)*pv.speed:0,pvz=pv?Math.cos(pv.h)*pv.speed:0;
  for(const v of CS.tv){
    const c=v.car;if(!c){if(v.E)csDrive(v,v.rpm,v.load,0,t);continue;}
    const kind=csKind(c);csSetEngine(v,CS.eng[kind],t);
    const s=Math.abs(c.speed||0),acc=(s-(v.sp??s))/Math.max(dt,1e-3);v.sp=s;
    v.g=csGear(v.g||0,s);const w0=csWant(s,v.g,acc>.4);v.r=v.r==null?w0:v.r+(w0-v.r)*Math.min(1,dt*6);
    const ld=s<1?0:clamp(.3+acc*.4,0,1),rpm=kind==='diesel'?csDieselRpm(v.r):v.r;
    const d=csPan(v.p,c.x,c.z),vx=Math.sin(c.h)*(c.speed||0)-pvx,vz=Math.cos(c.h)*(c.speed||0)-pvz,vr=((c.x-camera.position.x)*vx+(c.z-camera.position.z)*vz)/Math.max(d,1);
    const dop=clamp(343/(343+vr),.9,1.1)*(c.bus?.8:1),R=c.bus?CS.R*1.3:CS.R;
    csDrive(v,rpm,ld,CS.TVOL*(c.bus?1.4:1)*csLoud(rpm,ld)/(1+d/8)*Math.max(0,1-d/R),t,dop,.05);}}
function csUpdate(playing,dt){
  csInit();if(!CS.ok){csSynth(true);return;}
  csSynth(false);
  const t=AC.currentTime,inCar=playing&&player.mode==='car',c=player.car,live=inCar&&!c.dead;
  if(!CS.player)CS.player=csVoice(AC,snd.master);
  // the player's engine: drive.js's gear (with its hysteresis and shift timer) through the game's rpm model
  const s=inCar?Math.abs(c.speed):0,th=inCar&&down('KeyW','ArrowUp'),g=(drv.gear||1)-1,P=CS.player;
  const want=csWant(s,g,th);P.r=(P.r||850)+(want-(P.r||850))*(1-Math.exp(-dt*60*(want>(P.r||850)?.08:.15)));
  const shift=drv.shiftT>0,cut=shift?.35+.65*(1-drv.shiftT/.26):1,kind=csKind(c);
  if(live)P.kind=kind;csSetEngine(P,CS.eng[P.kind||'petrol'],t);
  const rpm=P.kind==='diesel'?csDieselRpm(P.r):P.r,load=live&&th&&!shift?1:0;
  P.ld=(P.ld||0)+(load-(P.ld||0))*Math.min(1,dt*(load>(P.ld||0)?12:5));
  const on=live?clamp((t-CS.startT)/.4,0,1):0;
  csDrive(P,rpm,P.ld,on*CS.VOL*csLoud(rpm,P.ld)*cut,t);
  csTraffic(t,dt);
  // squeal: drive.js's sliding state, stronger and longer than its synth
  if(CS.sq){csLoop(CS.sq,Math.pow(clamp(drv.sq/.045,0,1),.7)*.45,t);CS.sq.src.playbackRate.setTargetAtTime(.9+clamp(s/40,0,.25)+clamp(Math.abs(c&&c.slip||0),0,.6)*.2,t,.05);}
  if(CS.horn)csLoop(CS.horn,playing&&down('KeyQ')?.32:0,t);
  if(CS.siren){let dc=Infinity,cc=null;for(const o of cops){const d=Math.hypot(o.x-player.x,o.z-player.z);if(d<dc){dc=d;cc=o;}}
    csLoop(CS.siren,playing&&cops.length?clamp(1-dc/320,.02,1)*.5:0,t);if(cc)csPan(CS.siren.p,cc.x,cc.z);}
  const hand=live&&down('Space');if(hand&&!CS.hand)csShot('handbrake',snd.master,.45);CS.hand=hand;}
{const f=updateAudio;let last=0;updateAudio=function(playing){f(playing);if(!snd)return;const n=performance.now(),dt=last?Math.min(.1,(n-last)/1000):1/60;last=n;csUpdate(playing,CS.dtFix||dt);};}
// getting in: door, then the starter; the engine voice comes in as the start clip catches. Getting out: switch-off, then the door.
{const f=enterExit;enterExit=function(){const was=player.mode;f.apply(this,arguments);
  if(!CS.ok||was===player.mode)return;
  if(player.mode==='car'){csShot('door_close',snd.master,.5,1,.15);const st=csShot(csKind(player.car)==='diesel'?'start_d':'start_p',snd.master,.55,1,.45);CS.startT=AC.currentTime+.45+st*.6;}
  else{csShot('stop_p',snd.master,.5);csShot('door_open',snd.master,.45,1,.35);csShot('door_close',snd.master,.5,1,.9);}};}
// crashes: metal (and the synth crunch hushed while the recording plays), glass when a lamp breaks
{const t0=tone,b0=burst;tone=function(){if(!CS.hush)return t0.apply(this,arguments);};burst=function(){if(!CS.hush)return b0.apply(this,arguments);};}
{const f=crashFX;crashFX=function(c,n,sp){if(!CS.ok)return f(c,n,sp);CS.hush=true;try{f(c,n,sp);}finally{CS.hush=false;}
  const v=Math.min(1,sp/25),out=soundAt(c.x,c.z,150,1);if(n.prop)csShot('crash_small',out,.4+.6*v,.9+Math.random()*.2);else{csShot('crash_big',out,.25+.75*v,.92+Math.random()*.16);if(sp>12)csShot('crash_small',out,.5*v,.8);}};}
{const f=carHitCar;carHitCar=function(c,o,nx,nz,sp){if(!CS.ok)return f(c,o,nx,nz,sp);const h0=o.hitT;CS.hush=true;try{f(c,o,nx,nz,sp);}finally{CS.hush=false;}
  if(o.hitT===h0)return;const out=soundAt(c.x,c.z,150,1),v=Math.min(1,sp/25);if(sp>9)csShot('crash_big',out,.25+.75*v,.95+Math.random()*.1);else csShot('crash_small',out,.3+.4*v,1.1);};}
{const f=breakLamps;breakLamps=function(c,wx,wz,sp){const ch=c&&c.g.userData.body.children,a=ch&&ch[2].visible,b=ch&&ch[3].visible;f(c,wx,wz,sp);
  if(CS.ok&&ch&&(a&&!ch[2].visible||b&&!ch[3].visible))csShot('glass',soundAt(c.x,c.z,120,1),.45,.9+Math.random()*.2);};}
// a bump in the road under the player's car, 0 (rolling over a kerb) to 1 (a speed bump at 80 km/h); for the bumps step
function carBumpSound(strength){
  const k=clamp(strength||0,0,1);if(!snd||muted||k<.02)return 0;
  if(CS.buf.bump)return csShot('bump',snd.master,.2+.7*k,.8+.35*k);
  tone(70,38,.3*k,.25);burst('lowpass',300,.8,.25*k,.2);return .25;}
window.carBumpSound=carBumpSound;
