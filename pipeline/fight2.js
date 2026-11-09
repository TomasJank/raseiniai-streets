// ---------- fight2: frame-data moves (jab, cross, kick), block, dodge, knockback, hitstop, combos, opponents that circle and wait for a window ----------
// wraps fight.js (punch, fightStep, hurtPlayer, updateFight) and chars.js (charAnim), whose originals keep the *0 names.
// X / click: jab > cross > kick if the next press lands in recovery. Z: kick. Hold B: block. J or double-tap A / D: dodge.
const MOVES={
  jab:{dmg:1,su:0,ac:.12,rc:.33,reach:1.2,kb:.45,stun:.35,hs:.06,rx:'hit_head'},
  cross:{dmg:1,su:.03,ac:.12,rc:.4,reach:1.3,kb:.8,stun:.45,hs:.075,rx:'hit_chest'},
  kick:{dmg:2,su:.22,ac:.12,rc:.46,reach:1.4,kb:1.2,stun:.6,hs:.09,rx:'knockback',down:1}};
// a person's punch is slower to start, so there is something to see and dodge
const PMOVES={jab:{...MOVES.jab,su:.25,rc:.3},cross:{...MOVES.cross,su:.32,rc:.4}};
const cmb={t:0,hs:0,hsA:null,hsB:null,mv:null,stage:-1,endT:-9,chain:0,stam:100,sT:-9,blk:0,dodge:null,dodged:0,lunge:null,pk:null,tok:null,tokUntil:0,hb:0,tap:{},rand:Math.random,hud:0};
const ORDER=['jab','cross','kick'];
const arc2=(x,z,h,tx,tz,r)=>{const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);return d<=r&&d>1e-3&&dx*Math.sin(h)+dz*Math.cos(h)>=d*.766;};
const foes=()=>[...peds,...(club&&club.grp.visible&&club.bouncers||[])];
const alive=q=>q.mode!=='hide'&&q.mode!=='down';
function nearestFoe(r){let best=null,bd=r+1;for(const q of foes()){if(!alive(q))continue;const d=Math.hypot(q.x-player.x,q.z-player.z);if(d<bd&&arc2(player.x,player.z,player.h,q.x,q.z,r)){bd=d;best=q;}}return best;}
function hitstop(s,a,b){cmb.hs=Math.max(cmb.hs,s);cmb.hsA=a;cmb.hsB=b;}
// slide a person or the player, never into a building
function slide(o,dx,dz){const nx=o.x+dx,nz=o.z+dz;if(world.inBuilding(nx,nz))return false;o.x=nx;o.z=nz;return true;}

function attack(key){
  if(!world||player.mode!=='foot'||fight.pDown>0||cmb.dodge)return;
  const m=cmb.mv;if(m&&m.t<m.d.su+m.d.ac)return;
  const chain=!!m||cmb.stage>=0&&cmb.t-cmb.endT<.15;
  if(m&&!m.hit)cmb.chain=0;
  if(!chain)cmb.chain=0;
  startMove(key==='z'?'kick':chain?ORDER[(cmb.stage+1)%3]:'jab');
}
function startMove(n){
  const d=MOVES[n],m=cmb.mv={n,d,t:0,hit:0};cmb.stage=ORDER.indexOf(n);cmb.blk=0;
  if(n!=='kick')fight.anim=pedClock;
  // step into range so a chain can follow a hit that knocked the target back
  const f=nearestFoe(d.reach+.7);if(f){const dist=Math.hypot(f.x-player.x,f.z-player.z);if(dist>1)cmb.lunge={dx:Math.sin(player.h),dz:Math.cos(player.h),left:Math.min(dist-.95,.5),t:.08};}
  playerMove(0);return m;
}
function playerMove(dt){
  const m=cmb.mv;if(!m)return;
  m.t+=dt;const d=m.d;
  if(!m.hit&&m.t>=d.su&&m.t<d.su+d.ac)landHit(m);
  if(m.t>=d.su+d.ac+d.rc){cmb.mv=null;cmb.endT=cmb.t;if(!m.hit)cmb.chain=0;}
}
function landHit(m){
  const d=m.d,F=nearestFoe(d.reach);if(!F)return;
  const dx=F.x-player.x,dz=F.z-player.z,dist=Math.hypot(dx,dz)||1,fx=dx/dist,fz=dz/dist;
  m.hit=1;
  const full=(F.hp??(F.bouncer?6:youngMale(F)?4:3))>=4;
  if(F.mode==='fight'&&full&&cmb.rand()<.3){
    F.blk=.4;punchSnd(.4);hitstop(.04,player,F);fightEvent(player.x,player.z);if(!F.bouncer)slide(F,fx*.2,fz*.2);return;
  }
  const stg=F.mode==='stagger'||cmb.chain>=1;
  cmb.chain++;
  if(F.bouncer){for(let k=0;k<d.dmg&&F.mode!=='down';k++)hitBouncer(F);}
  else dmgPed(F,d,fx,fz,stg);
  punchSnd(d.dmg>1?1.3:1);shake=Math.max(shake,d.dmg>1?.25:.12);hitstop(d.hs,player,F);fightEvent(player.x,player.z);
}
function dmgPed(V,d,fx,fz,stg){
  hitPed(V,fx,fz);V.vx=V.vz=0;
  if(d.dmg>1&&V.mode!=='down'){V.hp-=d.dmg-1;if(V.hp<=0){V.mode='down';V.timer=6+Math.random()*6;V.ko=1;}}
  if(V.mode==='stagger'){
    V.stag=d.stun;
    if(d.down&&stg&&V.hp>0){V.mode='down';V.timer=2.6;V.kd=V.next;V.fall=0;}
  }
  V.mv=null;V.kb={vx:fx*d.kb/.25,vz:fz*d.kb/.25,t:.25};V.rx=d.rx;V.rxN=(V.rxN|0)+1;
  const A=V.ai||(V.ai=aiInit());A.hits.push(pedClock);A.atk=Math.max(A.atk,d.stun+.4);
}

const frontOf=a=>{const dx=a.x-player.x,dz=a.z-player.z,d=Math.hypot(dx,dz)||1;return(dx*Math.sin(player.h)+dz*Math.cos(player.h))/d>=.5;};
function hurtPlayer(att,mv){
  if(att===undefined)att=club&&club.bouncers&&club.bouncers.find(b=>b.swing===pedClock&&b.mode==='fight')||null;
  const d=mv||MOVES.jab,D=cmb.dodge;
  if(D&&D.t<D.iv){cmb.dodged++;return;}
  if(cmb.blk&&cmb.stam>0&&(!att||frontOf(att))){
    cmb.stam=Math.max(0,cmb.stam-(d.dmg>1?25:14));cmb.sT=pedClock;
    punchSnd(.4);shake=Math.max(shake,.06);
    if(att)cmb.pk={vx:-Math.sin(player.h)*.9,vz:-Math.cos(player.h)*.9,t:.2};
    return;
  }
  hurtPlayer0();
  if(att){const dx=player.x-att.x,dz=player.z-att.z,l=Math.hypot(dx,dz)||1;cmb.pk={vx:dx/l*d.kb/.25,vz:dz/l*d.kb/.25,t:.25};}
  cmb.mv=null;cmb.lunge=null;
}
function startDodge(side){
  if(!world||player.mode!=='foot'||fight.pDown>0||cmb.dodge||cmb.stam<18)return;
  const m=cmb.mv;if(m&&m.t<m.d.su+m.d.ac)return;
  cmb.mv=null;cmb.stam-=18;cmb.sT=pedClock;
  cmb.dodge={t:0,dur:.3,iv:.25,dx:Math.cos(player.h)*side,dz:-Math.sin(player.h)*side,dist:1.2,done:0,side};
}
function press(code){
  if(code==='KeyZ')attack('z');
  else if(code==='KeyJ')startDodge(down('KeyD','ArrowRight')?-1:1);
  else press0(code);
}
addEventListener('keydown',e=>{
  if(e.repeat||(e.code!=='KeyA'&&e.code!=='KeyD'))return;
  const n=performance.now(),last=cmb.tap[e.code];cmb.tap[e.code]=n;
  if(last&&n-last<280){cmb.tap[e.code]=0;startDodge(e.code==='KeyA'?1:-1);}
});
// foot controls: slower while blocking or mid-attack
function walk0(dt){
  const x=player.x,z=player.z,f=cmb.blk?.35:cmb.mv?.6:1;
  walk0_(dt);
  if(f<1){player.x=x+(player.x-x)*f;player.z=z+(player.z-z)*f;personMesh.position.x=player.x;personMesh.position.z=player.z;}
}
function punch(){attack('x');}

// ---------- opponents ----------
const aiInit=()=>({atk:.6+Math.random()*.8,side:Math.random()<.5?1:-1,flip:1+Math.random()*1.5,hits:[]});
const tokFree=p=>!cmb.tok||cmb.tok===p||cmb.tok.mode!=='fight'||!cmb.tok.mv&&pedClock>=cmb.tokUntil;
function fightStep(p,dt){
  const frozen=cmb.hs>0;
  if(p.mode!=='fight')return fightStep0(p,p.mode==='stagger'&&frozen?0:dt);
  const dx=player.x-p.x,dz=player.z-p.z,d=Math.hypot(dx,dz)||1;
  if(player.mode!=='foot'||fight.pDown>0||d>20){pedRejoin(p);p.nerv=10;p.mv=null;return[0,0];}
  if(frozen)return[0,0];
  const A=p.ai||(p.ai=aiInit());
  p.h=lerpAngle(p.h,Math.atan2(dx,dz),Math.min(1,dt*8));
  if(p.blk>0)p.blk-=dt;
  if(p.hp!=null&&p.hp<=1&&player.hp>=5){pedFlee(p,-dx,-dz,3+Math.random()*2,6);p.nerv=20;p.mv=null;return[0,0];}
  let mv=0;
  const step=(ux,uz,s)=>{if(slide(p,ux*s*dt,uz*s*dt))mv+=s*dt;};
  const m=p.mv;
  if(m){
    m.t+=dt;const k=m.d;
    if(m.t<k.su+k.ac&&d>1.05)step(dx/d,dz/d,2.4);
    if(!m.hit&&m.t>=k.su&&m.t<k.su+k.ac&&arc2(p.x,p.z,p.h,player.x,player.z,k.reach+.1)){m.hit=1;hurtPlayer(p,k);fightEvent(player.x,player.z);}
    if(m.t>=k.su+k.ac+k.rc){p.mv=null;cmb.tokUntil=pedClock+.5;}
    return mv>1e-3?[11,.9]:[0,0];
  }
  if(cmb.tok===p&&pedClock>=cmb.tokUntil)cmb.tok=null;
  const recent=A.hits.filter(t=>pedClock-t<3);A.hits=recent;
  if(recent.length>=2){p.back=1.4;A.hits=[];}
  if(p.back>0){p.back-=dt;step(-dx/d,-dz/d,2.6);}
  else{
    if((A.flip-=dt)<=0){A.flip=1+Math.random()*1.5;A.side=-A.side;}
    if(d>1.8)step(dx/d,dz/d,3.6);
    else if(d<1.2)step(-dx/d,-dz/d,1.8);
    else step(dz/d*A.side,-dx/d*A.side,1.6);
    if((A.atk-=dt)<=0){
      if(!tokFree(p))A.atk=.25;
      else{
        cmb.tok=p;cmb.tokUntil=pedClock+2;
        if(d>1.25)step(dx/d,dz/d,4.5);
        else{const n=Math.random()<.6?'jab':'cross';p.mv={n,d:PMOVES[n],t:0,hit:0};p.swing=pedClock;A.atk=1+Math.random()*1.6;fightEvent(player.x,player.z);}
      }
    }
  }
  for(const q of peds)if(q!==p&&q.mode==='fight'){const ex=p.x-q.x,ez=p.z-q.z,e2=ex*ex+ez*ez;if(e2<.49&&e2>1e-6){const e=Math.sqrt(e2),k=(.7-e)/2/e;p.x+=ex*k;p.z+=ez*k;}}
  return mv>1e-3?[11,.9]:[0,0];
}

// ---------- per-frame: timers, knockback, dodge, stamina, HUD ----------
const cbar=document.createElement('div'),cst=document.createElement('style');
cbar.className='hud';cbar.id='cbar';cbar.hidden=true;cbar.innerHTML='<div><i></i></div><div><i></i></div>';
cst.textContent='#cbar{left:50%;bottom:calc(62px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(220px,50vw)}#cbar div{height:7px;margin-top:4px;background:rgba(0,0,0,.45);border-radius:4px;overflow:hidden}#cbar i{display:block;height:100%;background:#d94c3d}#cbar div+div i{background:#e8b84a}';
document.head.append(cst);document.body.append(cbar);
function updateFight(dt){
  const cdt=cmb.hs>0?0:dt;if(cmb.hs>0)cmb.hs=Math.max(0,cmb.hs-dt);
  cmb.t+=cdt;
  const foot=player.mode==='foot'&&fight.pDown<=0;
  if(!foot){cmb.mv=cmb.dodge=cmb.lunge=cmb.pk=null;cmb.blk=0;cmb.tok=null;}
  cmb.blk=foot&&!cmb.mv&&!cmb.dodge&&cmb.stam>0&&down('KeyB')?1:0;
  if(cmb.blk){cmb.stam=Math.max(0,cmb.stam-5*dt);cmb.sT=pedClock;}
  else if(pedClock-cmb.sT>.8)cmb.stam=Math.min(100,cmb.stam+22*dt);
  playerMove(cdt);
  const D=cmb.dodge;
  if(D){
    D.t+=dt;const u=Math.min(1,D.t/D.dur),e=u*u*(3-2*u),s=D.dist*(e-D.done);D.done=e;
    slide(player,D.dx*s,D.dz*s);
    if(u>=1)cmb.dodge=null;
  }
  const L=cmb.lunge;
  if(L&&cdt>0){const s=Math.min(L.left,L.left*cdt/L.t);L.left-=s;L.t-=cdt;slide(player,L.dx*s,L.dz*s);if(L.t<=0||L.left<=.01)cmb.lunge=null;}
  const K=cmb.pk;
  if(K&&cdt>0){slide(player,K.vx*cdt,K.vz*cdt);if((K.t-=cdt)<=0)cmb.pk=null;}
  for(const V of fight.victims){
    const k=V.kb;if(!k||cdt<=0)continue;
    if(!slide(V,k.vx*cdt,k.vz*cdt)||(k.t-=cdt)<=0)V.kb=null;
  }
  for(const V of peds)if(V.kd&&V.mode!=='down'&&V.mode!=='stagger'){
    const nx=V.kd;V.kd=null;
    if(V.mode!=='hide'){if(nx==='fight'&&V.hp>0){V.mode='fight';V.lead=V.grp=null;V.ai=aiInit();}else{pedFlee(V,V.x-player.x,V.z-player.z,3+Math.random()*2,6);V.nerv=20;}}
  }
  if(foot&&(cmb.hb-=dt)<=0){cmb.hb=1.5;if(peds.some(q=>q.mode==='fight'&&Math.hypot(q.x-player.x,q.z-player.z)<20))fightEvent(player.x,player.z);}
  if(cmb.tok&&cmb.tok.mode!=='fight')cmb.tok=null;
  updateFight0(dt);
  const show=foot&&(pedClock-fight.last<8||cmb.stam<100||player.hp<5);
  if(cbar.hidden===show)cbar.hidden=!show;
  if(show){const b=cbar.querySelectorAll('i'),h=Math.round(player.hp/5*100),s=Math.round(cmb.stam);
    if(cmb.hud!==h*1000+s){cmb.hud=h*1000+s;b[0].style.width=Math.max(0,h)+'%';b[1].style.width=s+'%';}}
}

// ---------- animation: reaction and attack clips, procedural kick, block and dodge ----------
const _q=new THREE.Quaternion(),_p=new THREE.Quaternion(),_v=new THREE.Vector3(),sm01=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
// rotate a bone about an axis given in the mannequin's own frame (x left, y up, z forward)
function rotB(st,name,x,y,z,a){
  const b=st.bone[name];if(!b||!a)return;
  _v.set(x,y,z).applyQuaternion(st.o.quaternion);_q.setFromAxisAngle(_v,a);
  b.parent.getWorldQuaternion(_p);b.quaternion.premultiply(_p).premultiply(_q).premultiply(_p.invert());b.updateMatrixWorld(true);
}
// no kick clip in the free packs: chamber, snap, recover on the right leg over the guard pose
function kickAmt(m){
  const d=m.d,t=m.t;
  if(t<d.su)return[sm01(t/d.su),0];
  if(t<d.su+d.ac)return[1,sm01((t-d.su)/d.ac)];
  return[1-sm01((t-d.su-d.ac)/d.rc),1-sm01((t-d.su-d.ac)/d.rc)];
}
function charAnim(st,dt){
  const i=CHAR.list.indexOf(st),pl=i===PLAYER_I,p=pl||i<0?null:peds[i],who=pl?player:p;
  const mv=pl?cmb.mv:p&&p.mv;
  if(pl&&(mv||cmb.blk||cmb.dodge)&&st.mode==='walk'&&st.gait<.1)st.mode='fight';
  const fr=cmb.hs>0&&who&&(cmb.hsA===who||cmb.hsB===who);
  charAnim0(st,fr?0:dt);
  if(mv&&mv!==st.mvSeen){st.mvSeen=mv;if(mv.n!=='kick')charOne(st,mv.n);}
  if(p&&p.rxN!==st.rxSeen){st.rxSeen=p.rxN;if(p.rx&&p.mode!=='down')charOne(st,p.rx);}
  const dd=fr?0:dt;
  // squeeze or stretch the punch clips into the move's length
  if(st.one==='jab'||st.one==='cross'){const k=CHAR.clips[st.one].duration/(mv?mv.d.su+mv.d.ac+mv.d.rc:.5);st.oneT+=dd*(k-1);}
  const dg=pl&&cmb.dodge,kk=mv&&mv.n==='kick';
  if(!kk&&!dg&&!(pl?cmb.blk:p&&p.blk>0))return;
  if(kk){const[a,b]=kickAmt(mv);
    rotB(st,'thigh_r',1,0,0,-(1.0*a+.55*b));rotB(st,'calf_r',1,0,0,1.7*a-1.55*b);rotB(st,'spine_02',1,0,0,-.3*a);}
  if(dg){const e=Math.sin(Math.PI*Math.min(1,cmb.dodge.t/cmb.dodge.dur));
    rotB(st,'spine_01',0,0,1,-.45*dg.side*e);rotB(st,'thigh_l',1,0,0,-.5*e);rotB(st,'thigh_r',1,0,0,-.5*e);rotB(st,'calf_l',1,0,0,.8*e);rotB(st,'calf_r',1,0,0,.8*e);}
  if(pl?cmb.blk:p&&p.blk>0){rotB(st,'spine_02',1,0,0,.22);rotB(st,'Head',1,0,0,.25);}
}
