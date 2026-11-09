// ---------- spoken dialogue and animal sounds ----------
// clips come from add_voice.py as {clips:{id:[base64,seconds]},lines:{text:[femaleId,maleId,maleRate]}}; the bubble stays as a subtitle
let voiceData=null,voiceLast=null;const voiceBuf=new Map(),voiceLive=new Set(),_vf=new THREE.Vector3();
function voiceInfo(text){
  if(!voiceData){const el=document.getElementById('rasVoice');voiceData=el?JSON.parse(el.textContent):{clips:{},lines:{}};}
  return voiceData.lines[text];}
// a gain node panned towards (x,z) from the camera, like the bells; null when silent, muted or beyond range
function soundAt(x,z,range,vol){
  if(!snd||muted)return null;const dx=x-camera.position.x,dz=z-camera.position.z,d=Math.hypot(dx,dz);if(d>range)return null;
  camera.getWorldDirection(_vf);const fl=Math.hypot(_vf.x,_vf.z)||1,pan=AC.createStereoPanner(),g=AC.createGain();
  pan.pan.value=clamp((dx*-_vf.z/fl+dz*_vf.x/fl)/(d||1),-1,1)*.8;g.gain.value=vol/(1+d/8)*(1-d/range);g.connect(pan);pan.connect(snd.master);return g;}
function voiceBuffer(id){
  let b=voiceBuf.get(id);
  if(!b){const s=atob(voiceData.clips[id][0]),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);
    b=AC.decodeAudioData(a.buffer).catch(()=>null);voiceBuf.set(id,b);}
  return b;}
function voiceStop(g){if(!g.vsrc)return;try{g.vsrc.stop();}catch(e){}voiceLive.delete(g.vsrc);g.vsrc=null;}
// called when tickGroups shows a new line; returns the clip length in seconds so the subtitle lasts as long as the speech
function talkVoice(g){
  const v=voiceInfo(g.text),p=g.mem[g.spk];if(!v||!p)return 0;
  const k=peds.indexOf(p),male=p.look&&p.look.male!=null?!!p.look.male:hash(k+':v')<.5,id=v[male?1:0],
    rate=(male?v[2]:1)*(1+(hash(k+':r')-.5)*.12),i=g.i,text=g.text;
  voiceStop(g);
  if(snd&&!muted&&Math.hypot(p.x-camera.position.x,p.z-camera.position.z)<40)
    voiceBuffer(id).then(b=>{if(!b||g.i!==i||g.say<=0||!pedGroups.includes(g)||g.mem[g.spk]!==p)return;
      const out=soundAt(p.x,p.z,40,1.6);if(!out)return;const s=AC.createBufferSource();s.buffer=b;s.playbackRate.value=rate;s.connect(out);
      voiceStop(g);g.vsrc=s;s.grp=g;voiceLive.add(s);s.onended=()=>{voiceLive.delete(s);if(g.vsrc===s)g.vsrc=null;};s.start();
      voiceLast={text,voice:male?'m':'f',rate,len:b.duration};});
  return voiceData.clips[id][1]/rate;}

function sfxNote(f0,f1,vol,t0,dur,out,type='sine',vib=0){
  const t=AC.currentTime+t0,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+dur);
  if(vib){const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=5.5;lg.gain.value=vib;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur+.05);}
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.06,dur/4));g.gain.setValueAtTime(vol,t+dur*.6);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);return o;}
const SFX_ANIMAL={
  bark:[1,(out,o)=>{const n=o.n||1+Math.floor(Math.random()*3);for(let i=0;i<n;i++){const d=i*(.26+Math.random()*.08);
    burst('bandpass',650+Math.random()*250,1.6,.5,.13,d,out);tone(470+Math.random()*60,230,.22,.15,'sawtooth',d,out);}return n*.3;}],
  meow:[.7,out=>{const t=AC.currentTime,f=AC.createBiquadFilter();f.type='bandpass';f.Q.value=3;f.frequency.setValueAtTime(700,t);
    f.frequency.linearRampToValueAtTime(1900,t+.3);f.frequency.linearRampToValueAtTime(800,t+.8);f.connect(out);
    sfxNote(420,380,.6,0,.85,f,'sawtooth').frequency.linearRampToValueAtTime(600,t+.3);return .85;}],
  caw:[.8,out=>{for(let i=0;i<2;i++){tone(780,540,.18,.2,'sawtooth',i*.28,out);burst('bandpass',1300,3,.25,.2,i*.28,out);}return .5;}],
  coo:[.7,out=>{sfxNote(330,300,.3,0,.32,out);sfxNote(390,310,.25,.38,.55,out);return .95;}],
  hoot:[.8,out=>{sfxNote(420,410,.3,0,.4,out,'sine',6);sfxNote(400,385,.3,.75,.9,out,'sine',8);return 1.65;}],
  snort:[.9,out=>{burst('bandpass',450,.8,.6,.3,0,out);burst('lowpass',250,.7,.4,.25,.05,out);return .35;}],
  snuffle:[.25,out=>{for(let i=0;i<6;i++)burst('bandpass',1800+Math.random()*800,2,.25,.05,i*.08+Math.random()*.03,out);return .55;}],
  squeak:[.3,out=>{for(let i=0;i<3;i++)tone(9000,7200,.15,.03,'sine',i*.08,out);return .25;}],
  flap:[.6,out=>{for(let i=0;i<5;i++)burst('lowpass',700,.8,.35,.07,i*.1,out);return .5;}]};
// procedural animal calls, positional, silent beyond 60 m; returns the sound's length in seconds (0 when nothing played)
function sfxAnimal(kind,x,z,o={}){const S=SFX_ANIMAL[kind];if(!S)return 0;const out=soundAt(x,z,60,S[0]*(o.vol||1));return out?S[1](out,o):0;}
