// ---------- recorded animal calls; add_sounds.py renames voice.js's synthesised sfxAnimal to sfxAnimal_0, which stays the fallback ----------
// clips come from add_sounds.py as {name:base64 opus}; decoded once through AC on the first call, until then (or when a clip fails) the synth plays
const SND_ANIM={clips:null,buf:{},ready:null};
// kind -> clip, gain, playback rate, hits and gap between them
const SND_KIND={meow:['meow',.6],caw:['caw',.6],coo:['coo',.5],hoot:['hoot',.6],snort:['snort',.7],snuffle:['snuffle',.3],squeak:['squeak',.2],flap:['flap',.4,1.3,3,.15]};
function sndAnimInit(){
  if(SND_ANIM.ready||!AC)return;
  const el=document.getElementById('rasAnim');if(!el)return;
  SND_ANIM.clips=JSON.parse(el.textContent);
  SND_ANIM.ready=Promise.all(Object.entries(SND_ANIM.clips).map(([k,v])=>{
    const s=atob(v),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);
    return AC.decodeAudioData(a.buffer).then(b=>{SND_ANIM.buf[k]=b;},()=>{});}));}
// dogs by species: shiba and the fox small, husky big, yard dogs medium; yard dogs bark in longer bursts
function sndBark(sp,o){
  const small=/small|^dog_lead$|^fox$/.test(sp||''),big=/big/.test(sp||''),yard=sp==='dog_yard';
  return[small?'bark_small':big?'bark_big':'bark_med',small?.7:big?1:.8,sp==='fox'?1.2:1,o.n||(yard?2+Math.floor(Math.random()*3):1+Math.floor(Math.random()*2)),.12+Math.random()*.1];}
function sfxAnimal(kind,x,z,o={}){
  sndAnimInit();
  const K=kind==='bark'?sndBark(o.sp,o):SND_KIND[kind],B=K&&SND_ANIM.buf[K[0]];
  if(!B)return sfxAnimal_0(kind,x,z,o);
  const out=soundAt(x,z,60,K[1]*(o.vol||1));if(!out)return 0;
  const rate=(K[2]||1)*(1+(Math.random()-.5)*.3),n=K[3]||1,step=B.duration/rate+(K[4]||0),t=AC.currentTime;
  for(let i=0;i<n;i++){const s=AC.createBufferSource();s.buffer=B;s.playbackRate.value=rate*(1+(Math.random()-.5)*.1*(i>0));s.connect(out);s.start(t+i*step);}
  return n*step-(K[4]||0);}
