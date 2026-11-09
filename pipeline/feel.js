// ---------- car feel: surfaces, damage that shows in the handling, unsticking, camera crash roll, tyre and gravel sound ----------
// ground: 0 grass, 1 gravel, 2 tarmac
const SURF=[{max:.6,acc:.65,grip:.5,drag:2.2},{max:.8,acc:.85,grip:.7,drag:.7},{max:1,acc:1,grip:1,drag:0}];
function stuckCheck(c,up,dn,dt){
  if((up||dn)&&Math.abs(c.speed)<1.2)c.stuckT=(c.stuckT||0)+dt;else{c.stuckT=0;c.stuckTold=false;}
  if(c.stuckT>3&&!c.stuckTold){c.stuckTold=true;toast('Stuck?','Press R to get back on the road.');}
  if(c.stuckT>8){c.stuckT=0;c.stuckTold=false;resetToRoad();toast('Back on the road','');}
}
// a crash kicks the camera into a damped roll; it widens with speed; no lean or look-ahead, steering swung the view and was dizzying
let camRoll=0,camRollV=0,shakeWas=0;
function camFeel(dt){
  const inCar=player.mode==='car',c=player.car,sp=inCar?Math.abs(c.speed):0,chase=inCar&&camMode!==1;
  if(shake>shakeWas+.04&&!REDUCED)camRollV+=(Math.random()<.5?-1:1)*shake*2.2;shakeWas=shake;
  camRollV+=-camRoll*90*dt;camRollV*=Math.exp(-7*dt);camRoll+=camRollV*dt;
  const rumble=chase&&!REDUCED?(c.gnd===1?.005:c.gnd===0?.01:0)*clamp(sp/20,0,1):0;
  camera.rotateZ(camRoll+(Math.random()-.5)*rumble);
  const fov=60+(chase?clamp((sp-12)*.35,0,9):0);
  if(Math.abs(fov-camera.fov)>.05){camera.fov+=(fov-camera.fov)*Math.min(1,dt*2);camera.updateProjectionMatrix();}
}
// sounds come in fast and fade slowly; tyres follow the slip angle, gravel and grass crunch with speed
const easeG=(v,x)=>v.g.gain.setTargetAtTime(x,AC.currentTime,x>v.g.gain.value?.03:.28);
function feelAudio(inCar,c,s){
  if(!snd.grav){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;f.Q.value=.8;const g=AC.createGain();g.gain.value=0;
    const src=AC.createBufferSource();src.buffer=snd.buf;src.loop=true;src.playbackRate.value=.6;src.connect(f);f.connect(g);g.connect(snd.master);src.start();snd.grav={f,g};}
  const slip=inCar?Math.abs(c.slip||0):0;
  easeG(snd.tyre,inCar&&s>4?clamp(slip*1.1+(c.sliding?.15:0),0,1)*.22:0);
  snd.tyre.f.frequency.setTargetAtTime(1100+slip*1600,AC.currentTime,.05);
  easeG(snd.wind,inCar?Math.min(.22,s*.007):0);
  easeG(snd.grav,inCar&&c.gnd<2?clamp(s/18,0,1)*(c.gnd===0?.16:.12)*(.85+.3*Math.random()):0);
}
