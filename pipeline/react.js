// ---------- react: on foot, walk into someone or hit them and they snap back with a line (bubble and voice) and turn to face him ----------
// REACT_LINES comes from add_react.py (pipeline/react/lines.json): {bump|again|hit:{kid|man|woman|oldm|oldf:[...]}}
const RX_R=.5;let rxAt=null;
const RX={last:-1e9,line:'',on:[],spr:[]},RX_STILL={walk:1,idle:1,wait:1,stop:1,cross:1,goto:1,talk:1};
// same male/female call as talkVoice, so the pool matches the clip's voice
function reactWho(p){
  const L=p.look,m=L.male!=null?!!L.male:hash(peds.indexOf(p)+':v')<.5;
  return L.age==='kid'?'kid':L.age==='old'?(m?'oldm':'oldf'):m?'man':'woman';
}
function reactEnd(r){voiceStop(r);r.p.rcE=0;RX.on.splice(RX.on.indexOf(r),1);}
// a bump within 6 s of his last line says nothing, a later one within 30 s escalates; a hit may follow a bump line after 1.5 s
function reactSay(p,kind){
  const m=p.mode;
  if(player.mode!=='foot'||m==='down'||m==='flee'||m==='cower'||m==='hide'||pedClock-RX.last<1)return;
  if(pedClock-(p.rcT??-1e9)<(kind==='hit'&&p.rcK!=='hit'?1.5:6))return;
  if(kind==='bump'){if(pedClock-(p.rcB??-1e9)<30)kind='again';p.rcB=pedClock;}
  const t=pick(REACT_LINES[kind][reactWho(p)].filter(l=>l!==RX.line));
  for(const o of RX.on)if(o.p===p){reactEnd(o);break;}
  RX.last=p.rcT=pedClock;p.rcK=kind;RX.line=t;
  const r={p,t,vsrc:null};RX.on.push(r);
  const dur=Math.max(1.2+t.length*.07,reactVoice(r));r.end=p.rcE=pedClock+dur;
  const g=p.grp;if(g&&g.mem.includes(p)){if(g.mem[g.spk]===p&&g.say>0){voiceStop(g);g.say=0;}g.sw=Math.max(g.sw,dur+.3);}
  return r;
}
function reactVoice(r){
  const p=r.p,v=voiceInfo(r.t);if(!v)return 0;
  const {id,male,rate}=voiceFor(p,v);
  if(snd&&!muted&&Math.hypot(p.x-camera.position.x,p.z-camera.position.z)<40)
    voiceBuffer(id).then(b=>{if(!b||!RX.on.includes(r))return;const out=soundAt(p.x,p.z,40,1.6);if(!out)return;
      const s=AC.createBufferSource();s.buffer=b;s.playbackRate.value=rate;s.connect(out);r.vsrc=s;s.onended=()=>{if(r.vsrc===s)r.vsrc=null;};s.start();
      voiceLast={text:r.t,voice:male?'m':'f',rate,len:b.duration};});
  return voiceData.clips[id][1]/rate;
}
// contact is .6 m between centres while he moves towards them; it re-arms once they are 1.2 m apart
{const up0=updatePeople,sp0=stepPed,pb0=pedBubbles,dm0=dmgPed;
  updatePeople=function(dt){
    up0(dt);if(!pedGrid||player.mode!=='foot'){rxAt=null;return;}
    // people are solid to a walking player: a step that ends inside RX_R of someone is moved back out to that distance, which
    // also lets him slide round them; a jump of more than a metre in one frame is a teleport (tests, respawns) and is left alone
    if(rxAt&&Math.hypot(player.x-rxAt[0],player.z-rxAt[1])<1)for(const p of peds){
      if(p.mode==='hide'||p.mode==='down')continue;const dx=player.x-p.x,dz=player.z-p.z,d=Math.hypot(dx,dz);if(d>=RX_R||d<1e-3)continue;
      const nx=p.x+dx/d*RX_R,nz=p.z+dz/d*RX_R;if(world.inBuilding(nx,nz)){player.x=rxAt[0];player.z=rxAt[1];}else{player.x=nx;player.z=nz;}}
    rxAt=[player.x,player.z];
    const fx=Math.sin(player.h)*Math.sign(player.speed),fz=Math.cos(player.h)*Math.sign(player.speed),mv=Math.abs(player.speed)>.5;
    for(const p of peds){
      if(p.mode==='hide')continue;const dx=p.x-player.x,dz=p.z-player.z,d2=dx*dx+dz*dz;
      if(d2>1.44){p.rcIn=0;continue;}if(p.rcIn||d2>.36)continue;
      p.rcIn=1;if(mv&&dx*fx+dz*fz>0)reactSay(p,'bump');
    }
  };
  stepPed=function(p,dt,M){
    if(!(pedClock<p.rcE)||!RX_STILL[p.mode])return sp0(p,dt,M);
    const x=p.x,z=p.z,t=p.t,e=p.e;sp0(p,dt,M);if(!RX_STILL[p.mode])return;
    if(p.mode!=='talk'){p.x=x;p.z=z;if(p.e===e)p.t=t;p.gait=0;}
    p.h=lerpAngle(p.h,Math.atan2(player.x-p.x,player.z-p.z),Math.min(1,dt*8));
  };
  dmgPed=function(V,...a){dm0(V,...a);reactSay(V,'hit');};
  pedBubbles=function(){
    pb0();
    if(!RX.spr.length)for(let i=0;i<3;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,fog:false}));s.visible=false;s.renderOrder=5;scene.add(s);RX.spr.push(s);}
    for(let i=RX.on.length;i--;){const r=RX.on[i];if(pedClock>=r.end||r.p.mode==='down'||r.p.mode==='hide')reactEnd(r);}
    const cx=camera.position.x,cz=camera.position.z,on=RX.on.filter(r=>(r.p.x-cx)**2+(r.p.z-cz)**2<900);
    RX.spr.forEach((s,i)=>{const r=on[on.length-1-i];s.visible=!!r;if(!r)return;const p=r.p,T=talkBubble(r.t);
      if(s.material.map!==T.t){s.material.map=T.t;s.material.needsUpdate=true;}
      s.scale.set(T.w/78*.36,.36,1);s.position.set(p.x,GY(p.x,p.z)+world.surf(p.x,p.z)+2.1*p.look.s,p.z);});
  };
}
