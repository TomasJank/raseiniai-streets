// ---------- fists: on foot X, a click or HIT punches; people fight back, run, or stand round and watch; L klubas has bouncers ----------
const FIGHT_MODES={stagger:1,fight:1,watch:1},FACT=new Array(19);
const fight={victims:[],cd:-9,anim:-9,last:-1e9,start:0,called:-1e9,x:0,z:0,pDown:0,pStag:0,hurtT:-1e9};
player.hp=5;
const frail=p=>p.look.age==='kid'||p.look.age==='old';
// people2 adds look.age/male/young; without them a fixed third of the crowd counts as young men
const youngMale=p=>p.look.age!=null?p.look.age==='adult'&&!!p.look.male&&p.look.young!==false:hash(peds.indexOf(p)+':m')<.3;
function inArc(x,z,h,tx,tz){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);return d<=1.1&&d>1e-3&&dx*Math.sin(h)+dz*Math.cos(h)>=d*Math.cos(Math.PI/6);}
function punchSnd(v){
  hit(.12*v);if(!snd)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(48,t+.11);
  g.gain.setValueAtTime(.45*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(snd.master);o.start(t);o.stop(t+.14);
}
function fistPose(swing,guard){
  const t=pedClock-swing;if(!guard&&t>.3)return null;
  FACT.fill(NaN);FACT.phone=false;FACT[6]=FACT[9]=-.95;FACT[7]=FACT[10]=-1.75;
  if(t<.3){const u=Math.sin(Math.PI*t/.3);FACT[9]=-.95-.6*u;FACT[10]=-1.75*(1-u);FACT[1]=.06*u;}
  return FACT;
}
function fightAct(p){
  if(p.mode==='fight')return fistPose(p.swing??-9,true);
  if(p.mode==='watch'&&p.pr<.4){FACT.fill(NaN);FACT[6]=-1.25;FACT[7]=-.8;FACT[3]=FACT[4]=FACT[5]=.1;FACT.phone=true;return FACT;}
  return null;
}
function posePlayer(){
  const dn=fight.pDown>0;
  poseAt(PLAYER_I,PLAYER_LOOK,player.x,player.z,player.h,dn?-1.5:fight.pStag>0?-.25:0,dn?.15:0,player.walk,player.gait||0,false,0,dn?null:fistPose(fight.anim,pedClock-fight.last<4));
}
// everyone calm within 18 m stops to watch; the police get a call after 8 s of it
function fightEvent(x,z){
  pedEvent(x,z,18,6);
  if(pedClock-fight.last>3)fight.start=pedClock;
  fight.last=pedClock;fight.x=x;fight.z=z;
  for(const q of peds){if(q.lead||!(CALM[q.mode]||q.mode==='watch')||(q.x-x)**2+(q.z-z)**2>324)continue;
    if(q.seat){q.seat.who=null;q.seat=null;}q.mode='watch';q.grp=null;q.react=0;q.watchT=6+Math.random()*4;}
}
function chain(p){
  const s=new Set([p.lead,p.pair]);
  for(const q of peds)if(q.lead===p||q.pair===p||p.lead&&q.lead===p.lead||p.grp&&q.grp===p.grp&&q.mode==='talk')s.add(q);
  s.delete(p);return[...s].filter(q=>q&&q.mode!=='hide'&&q.mode!=='down');
}
function hitPed(V,fx,fz){
  if(V.hp==null)V.hp=youngMale(V)?4:3;
  V.hp--;V.hitT=pedClock;if(!fight.victims.includes(V))fight.victims.push(V);
  const was=V.mode,mates=chain(V);
  V.lead=V.pair=V.grp=null;V.react=0;V.vx=fx*1.4;V.vz=fz*1.4;if(V.seat){V.seat.who=null;V.seat=null;}
  if(V.hp<=0){V.mode='down';V.timer=6+Math.random()*6;V.ko=1;return;}
  V.mode='stagger';V.stag=.3;V.next=!frail(V)&&(was==='fight'||youngMale(V)||mates.length)?'fight':'flee';
  for(const q of mates)if(!frail(q)&&(!FIGHT_MODES[q.mode]||q.mode==='watch')){q.mode='fight';q.lead=q.grp=null;q.react=0;q.punchT=.6;}
}
function hurtPlayer(){
  fight.hurtT=pedClock;fight.pStag=.3;punchSnd(.8);shake=Math.max(shake,.25);
  if(--player.hp<=0){fight.pDown=4;cash=Math.max(0,cash-50);money();store();addHeat(1);toast('Tave partrenkė','−€50');}
}
function punch(){
  if(!world||player.mode!=='foot'||fight.pDown>0||pedClock-fight.cd<.45)return;
  fight.cd=fight.anim=pedClock;
  let best=null,bd=2;
  for(const q of[...peds,...(club&&club.grp.visible&&club.bouncers||[])]){
    if(q.mode==='hide'||q.mode==='down'||!inArc(player.x,player.z,player.h,q.x,q.z))continue;
    const d=Math.hypot(q.x-player.x,q.z-player.z);if(d<bd){bd=d;best=q;}}
  if(!best)return;
  punchSnd(1);shake=Math.max(shake,.12);
  if(best.bouncer)hitBouncer(best);else hitPed(best,(best.x-player.x)/bd,(best.z-player.z)/bd);
  fightEvent(player.x,player.z);
}
addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&e.target===renderer.domElement)punch();});
function fightStep(p,dt){
  if(p.mode==='stagger'){
    p.stag-=dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.fall=lerpAngle(p.fall,-.3,Math.min(1,dt*12));
    if(p.stag<=0){p.fall=0;if(p.next==='fight'){p.mode='fight';p.punchT=.5;}else{pedFlee(p,p.x-player.x,p.z-player.z,3+Math.random()*2,6);p.nerv=20;}}
    return[0,0];
  }
  if(p.mode==='watch'){
    if((p.watchT-=dt)<=0){pedRejoin(p);p.nerv=8;return[0,0];}
    const dx=p.x-fight.x,dz=p.z-fight.z,d=Math.hypot(dx,dz)||1,s=clamp(clamp(d,6,10)-d,-p.sp*dt,p.sp*dt);
    if(Math.abs(s)>1e-4){const nx=p.x+dx/d*s,nz=p.z+dz/d*s;if(!world.inBuilding(nx,nz)){p.x=nx;p.z=nz;}}
    p.h=lerpAngle(p.h,Math.atan2(-dx,-dz),Math.min(1,dt*5));
    return Math.abs(s)>1e-4?[5.4*p.sp,.5]:[0,0];
  }
  const dx=player.x-p.x,dz=player.z-p.z,d=Math.hypot(dx,dz);
  if(player.mode!=='foot'||fight.pDown>0||d>20){pedRejoin(p);p.nerv=10;return[0,0];}
  p.h=lerpAngle(p.h,Math.atan2(dx,dz),Math.min(1,dt*8));
  let mv=0;
  if(d>1){const s=Math.min(d-1,3.6*dt),nx=p.x+dx/d*s,nz=p.z+dz/d*s;if(!world.inBuilding(nx,nz)){p.x=nx;p.z=nz;mv=s;}}
  for(const q of peds)if(q!==p&&q.mode==='fight'){const ex=p.x-q.x,ez=p.z-q.z,e2=ex*ex+ez*ez;if(e2<.49&&e2>1e-6){const e=Math.sqrt(e2),k=(.7-e)/2/e;p.x+=ex*k;p.z+=ez*k;}}
  if((p.punchT-=dt)<=0&&d<=1.1){p.punchT=1.2;p.swing=pedClock;if(inArc(p.x,p.z,p.h,player.x,player.z))hurtPlayer();fightEvent(player.x,player.z);}
  return mv>1e-3?[11,.9]:[0,0];
}
function makeBouncers(){
  club.bouncers=[];const f=clubFacade(55.3797531,23.1172891);if(!f)return;
  const a=Math.min(f.L-2,30)*.22,h=Math.atan2(f.nx,f.nz);
  for(const s of[-1.1,1.1]){const m=clubPerson(0x141414),x=f.mx+f.ux*(a+s)+f.nx*1.3,z=f.mz+f.uz*(a+s)+f.nz*1.3;
    m.scale.setScalar(1.08);m.rotation.order='YXZ';club.grp.add(m);
    club.bouncers.push({bouncer:true,role:'bouncer',m,hx:x,hz:z,h0:h,x,z,h,hp:6,mode:'post',timer:0,punchT:0,swing:-9,fall:0});}
}
function hitBouncer(b){
  if(--b.hp<=0){b.mode='down';b.timer=6+Math.random()*6;return;}
  for(const o of club.bouncers)if(o.mode!=='down'){o.mode='fight';o.punchT=Math.min(o.punchT,.4);}
}
// they chase 25 m from the door, then walk back to it
function updateBouncers(dt){
  if(!club)return;if(!club.bouncers)makeBouncers();const on=club.grp.visible;
  for(const b of club.bouncers){
    if(!on){Object.assign(b,{x:b.hx,z:b.hz,h:b.h0,hp:6,mode:'post',fall:0});continue;}
    const dx=player.x-b.x,dz=player.z-b.z,d=Math.hypot(dx,dz),[aL,aR]=b.m.userData.arms;
    if(b.mode==='down'){b.fall=lerpAngle(b.fall,-1.5,Math.min(1,dt*7));if((b.timer-=dt)<=0){b.mode='back';b.hp=6;b.fall=0;}}
    else if(b.mode==='fight'){
      if(player.mode!=='foot'||fight.pDown>0||Math.hypot(b.x-b.hx,b.z-b.hz)>25)b.mode='back';
      else{b.h=Math.atan2(dx,dz);if(d>1){const s=Math.min(d-1,4.2*dt);b.x+=dx/d*s;b.z+=dz/d*s;}
        if((b.punchT-=dt)<=0&&d<=1.1){b.punchT=1.2;b.swing=pedClock;if(inArc(b.x,b.z,b.h,player.x,player.z))hurtPlayer();fightEvent(player.x,player.z);}}
    }else if(b.mode==='back'){const ex=b.hx-b.x,ez=b.hz-b.z,e=Math.hypot(ex,ez);
      if(e<.2){b.mode='post';b.h=b.h0;}else{const s=Math.min(e,1.6*dt);b.x+=ex/e*s;b.z+=ez/e*s;b.h=Math.atan2(ex,ez);}}
    b.m.position.set(b.x,GY(b.x,b.z),b.z);b.m.rotation.set(b.fall,b.h,0);
    const t=pedClock-b.swing,u=t<.3?Math.sin(Math.PI*t/.3):0;
    if(b.mode==='fight'){aL.rotation.x=-1.2;aR.rotation.x=-1.2-.45*u;}else aL.rotation.x=aR.rotation.x=b.mode==='post'?-.35:0;
  }
}
function updateFight(dt){
  fight.victims=fight.victims.filter(q=>pedClock-q.hitT<10&&q.mode!=='hide');
  if(fight.pStag>0)fight.pStag-=dt;
  if(fight.pDown>0){if((fight.pDown-=dt)<=0)player.hp=5;}
  else if(player.hp<5&&pedClock-fight.hurtT>10)player.hp=5;
  for(const p of peds){
    if(p.ko&&p.mode!=='down'){p.ko=0;p.hp=null;if(p.mode==='walk'){pedFlee(p,p.x-player.x,p.z-player.z,3+Math.random()*2,5.5);p.nerv=20;}}
    else if(p.hp!=null&&(p.mode==='hide'||!FIGHT_MODES[p.mode]&&p.mode!=='down'&&pedClock-p.hitT>20))p.hp=null;
  }
  if(pedClock-fight.last<3&&pedClock-fight.start>=8&&pedClock-fight.called>=60&&peds.some(q=>q.mode==='watch')){
    fight.called=pedClock;addHeat(1);toast('Kažkas skambina policijai','Muštynės gatvėje.');}
  updateBouncers(dt);
}
