// ---------- drive feel: sprung body, brake lights, headlight cones, damage sag, engine/tyre/road sound ----------
// the game's chassis model (ride/poseCar) stays as it is; this adds a second, per-model sprung layer on the body group only
const drv={t:0,gear:1,shiftT:0,impT:0,wT:0,sq:0,wet:0,eo:0,brake:false,cur:null,last:null};
const DPIV=.35,_dv=new THREE.Vector3(),_de=new THREE.Euler();
function susOf(c){
  if(c.sus)return c.sus;
  const m=c.g.userData.body.children[0],g=m.userData.base||m.geometry;if(!g.boundingBox)g.computeBoundingBox();
  const bb=g.boundingBox,soft=clamp((bb.max.y-1.35)/.35,0,1);
  return c.sus={bp:0,bv:0,br:0,rv:0,by:0,yv:0,ax:0,lat:0,h:c.h,sp:c.speed,vy:0,sagP:0,sagR:0,sagY:0,
    w:2*Math.PI*(2.5-.9*soft),z:.36-.07*soft,gp:.002*(1+.9*soft),gr:.0025*(1+1.1*soft),hw:bb.max.x,zf:bb.max.z,zb:bb.min.z,H:bb.max.y};
}
function susStep(c,dt,ax,lat,az){
  const s=susOf(c),n=Math.max(1,Math.ceil(dt/.016)),h=dt/n,w2=s.w*s.w,cd=2*s.z*s.w,
    tp=clamp(-ax*s.gp,-.04,.04)+s.sagP,tr=clamp(lat*s.gr,-.04,.04)+s.sagR,ty=s.sagY;
  for(let i=0;i<n;i++){
    s.bv+=(w2*(tp-s.bp)-cd*s.bv)*h;s.bp+=s.bv*h;
    s.rv+=(w2*(tr-s.br)-cd*s.rv)*h;s.br+=s.rv*h;
    s.yv+=(w2*(ty-s.by)-cd*s.yv-az*.5)*h;s.by=clamp(s.by+s.yv*h,-.09,.09);
  }
  const b=c.g.userData.body;b.rotation.set(s.bp,0,s.br);_dv.set(0,DPIV,0).applyEuler(b.rotation);b.position.set(-_dv.x,DPIV-_dv.y+s.by,-_dv.z);
}
function carLamps(c){
  if(c.lamps)return c.lamps;
  const b=c.g.userData.body,s=susOf(c),tm=tailM.clone();tm.userData.keep=true;b.children[3].material=tm;
  const spr=[-1,1].map(k=>{const p=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff2a1a,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
    p.scale.setScalar(.75);p.position.set(k*s.hw*.74,s.H*.62,s.zb-.05);b.add(p);return p;});
  const sl=[-1,1].map(k=>{const L=new THREE.SpotLight(0xfff0d2,0,70,.46,.8,1.5);L.position.set(k*s.hw*.62,.72,s.zf-.1);
    L.target.position.set(k*s.hw*.5,-.3,s.zf+32);b.add(L,L.target);return L;});
  return c.lamps={tm,spr,sl};
}
function lampsSet(c,lit,brake){
  const L=carLamps(c),on=c.lampsOut||c.dead||ENV.night.value<.2?0:lit;
  for(const l of L.sl)l.intensity=on*620;
  L.tm.color.setScalar(brake?1.8:.55+.25*lit);
  for(const p of L.spr)p.material.opacity=brake?.9:lit*.25;
}
function carImpact(c,n,closing){
  if(closing<2.5||drv.t<drv.impT)return;drv.impT=drv.t+.3;
  const s=susOf(c),v=clamp(closing/25,0,1),fx=Math.sin(c.h),fz=Math.cos(c.h),sd=n?n.nx*Math.cos(c.h)-n.nz*Math.sin(c.h):0;
  tone(100-45*v,32,.2+.4*v,.3+.35*v);if(closing>7)burst('lowpass',420,.8,.28*v,.32);
  s.bv+=v*1.7;s.rv+=sd*v*1.4;s.yv+=v*.7;
}
function collideCar(x,z,r,c){
  const o=collideCar0(x,z,r,c);
  if(o.hit&&c&&c===player.car&&o.hit.nx!=null)carImpact(c,o.hit,Math.max(0,-(Math.sin(c.h)*Math.sign(c.speed||1)*o.hit.nx+Math.cos(c.h)*Math.sign(c.speed||1)*o.hit.nz))*Math.abs(c.speed));
  return o;
}
function driveCar(c,dt){
  const sp0=c.speed;driveCar0(c,dt);
  if(c!==player.car||!(dt>0))return;
  if(drv.cur!==c){if(drv.cur&&drv.cur.lamps)lampsSet(drv.cur,0,false);drv.cur=c;}
  drv.last=c;drv.t+=dt;
  const s=susOf(c),k=1-Math.exp(-dt*12),up=!c.dead&&down('KeyW','ArrowUp'),dn=down('KeyS','ArrowDown'),hand=down('Space');
  s.ax+=((c.speed-s.sp)/dt-s.ax)*k;s.sp=c.speed;
  s.lat+=(clamp(c.speed*wrapA(c.h-s.h)/dt,-9,9)-s.lat)*k;s.h=c.h;
  const vy=c.ride?c.ride.vy:0,az=clamp((vy-s.vy)/dt,-35,35);s.vy=vy;
  if(sp0>6&&sp0-c.speed>4)carImpact(c,null,sp0-c.speed);
  const hp=c.hp??1,dmg=clamp((.75-hp)/.75,0,1);
  if(dmg>0&&!c.sagSide)c.sagSide=Math.random()<.5?-1:1;
  s.sagR=(c.sagSide||0)*dmg*.07;s.sagP=dmg*.035;s.sagY=-dmg*.05;
  susStep(c,dt,s.ax,s.lat,az);
  drv.brake=(dn&&c.speed>.5)||(hand&&Math.abs(c.speed)>.5);
  lampsSet(c,smooth(.35,.75,ENV.night.value),drv.brake);
  if(hp>=.55&&hp<.8&&!REDUCED&&(drv.wT-=dt)<=0){drv.wT=.5+Math.random()*.4;puff(c.x+Math.sin(c.h)*1.7,GY(c.x,c.z)+1,c.z+Math.cos(c.h)*1.7,0xc8c8c4,.45);}
}
function walk(dt){
  walk0(dt);const c=drv.last;
  if(c&&c.sus){susStep(c,dt,0,0,0);if(c.lamps)lampsSet(c,0,false);}
}
function drvAudio(){
  if(snd.eo)return;
  const mk=(type,f,filt,fq,q)=>{const o=AC.createOscillator(),b=AC.createBiquadFilter(),g=AC.createGain();o.type=type;o.frequency.value=f;b.type=filt;b.frequency.value=fq;b.Q.value=q;g.gain.value=0;o.connect(b);b.connect(g);g.connect(snd.master);o.start();return{o,f:b,g};};
  snd.eo=mk('sawtooth',30,'lowpass',380,.7);snd.sq=mk('sawtooth',900,'bandpass',1500,7);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=snd.buf;s.loop=true;s.playbackRate.value=1.3;f.type='highpass';f.frequency.value=3000;g.gain.value=0;
  s.connect(f);f.connect(g);g.connect(snd.master);s.start();snd.wet={g};
}
function updateAudio(playing){
  updateAudio0(playing);
  if(!snd)return;drvAudio();
  const inCar=playing&&player.mode==='car',c=player.car,s=inCar?Math.abs(c.speed):0,t=AC.currentTime,th=inCar&&down('KeyW','ArrowUp'),live=inCar&&!c.dead;
  const B=[0,8,15,22,29,37,99];let g=0;while(s>=B[g+1])g++;
  const cg=drv.gear-1;if(g>cg&&s<B[cg+1]+.5||g<cg&&s>B[cg]-.8)g=cg;
  if(g!==cg){if(live&&g>drv.gear-1){drv.shiftT=.26;if(th){tone(130,80,.05,.08);burst('bandpass',1300,1.2,.05,.12);}}else if(live)drv.shiftT=.16;drv.gear=g+1;}
  drv.shiftT=Math.max(0,drv.shiftT-.016);
  const cut=drv.shiftT>0?.3+.7*(1-drv.shiftT/.26):1;
  setG(snd.eng,live?(th?.2:.11)*(.75+snd.rpm/12000)*cut:0);
  drv.eo=clamp(snd.rpm/30,28,190);
  snd.eo.o.frequency.setTargetAtTime(drv.eo,t,.03);snd.eo.f.frequency.setTargetAtTime(220+snd.rpm*.1+(th?300:0),t,.06);
  setG(snd.eo,live?(th?.06:.03)*cut:0);
  const slip=inCar?Math.abs(c.slip||0):0;
  drv.sq=inCar&&s>4&&c.sliding?clamp(.3+slip*.9,0,1)*.045*(c.gnd<2?.3:1):0;
  snd.sq.o.frequency.setTargetAtTime(780+s*7+slip*500,t,.05);setG(snd.sq,drv.sq);
  drv.wet=inCar&&c.gnd===2?ENV.wet.value*clamp(s/22,0,1)*.1:0;setG(snd.wet,drv.wet);
  if(inCar&&c.gnd<2&&s>3&&Math.random()<clamp(s/30,0,1)*.5)burst('bandpass',2200+Math.random()*2500,3,.03+.04*Math.random(),.025);
}
