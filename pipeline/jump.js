// ---------- jump: Space on foot; a low obstacle stops blocking once his feet are above its top ----------
// y lifts the body, the tucked legs raise the feet .39 m more: feet clear 1.0 m running (air .47 s), .63 m from a standstill (.33 s).
// pre: crouch before take-off, land: dip after.
const JUMP={y:0,vy:0,feet:0,air:false,pre:0,land:0,sp:0,g:22,tab:null,w:null};
const jumpTuck=y=>Math.min(1,y/.35);
function jumpOk(){
  const st=CHAR.list[PLAYER_I];
  return!!world&&player.mode==='foot'&&!JUMP.air&&!JUMP.pre&&!(fight.pDown>0)&&!(fight.pStag>0)&&!cmb.mv&&!cmb.dodge&&!cmb.blk&&!w3Foot
    &&!inWater(player.x,player.z)&&!(st&&st.o.visible&&st.one==='getup');
}
function jumpStart(){if(!jumpOk())return false;JUMP.pre=.07;JUMP.land=0;return true;}
// tops (m above ground) of the obstacles that are low enough to matter, by position: street props and fences, park benches, knockables carry .h
function jumpTable(){
  const T=new Map(),add=(x,z,h)=>{const k=Math.floor(x)+','+Math.floor(z);(T.get(k)||T.set(k,[]).get(k)).push([x,z,h]);};
  for(const S of STREETS){
    for(const o of S.props||[])if(o.ll){const[x,z]=LL(...o.ll);add(x,z,(o.s||STREET_KINDS[o.k].s)[1]);}
    for(const f of S.fences||[]){const h=f.h||STREET_FENCE[f.style][0],P=f.ll.map(q=>LL(...q));for(let i=0;i<P.length-1;i++)add((P[i][0]+P[i+1][0])/2,(P[i][1]+P[i+1][1])/2,h);}}
  // a park bench's wall runs along the backrest, whose top is .96 m
  for(const[x,z,h]of world.benches||[])add(x-Math.sin(h)*.2,z-Math.cos(h)*.2,.96);
  JUMP.tab=T;JUMP.w=world;
}
function jumpTop(o){
  if(o.jt!==undefined)return o.jt;
  if(JUMP.w!==world)jumpTable();
  const a=Array.isArray(o),x=a?(o[0]+o[2])/2:o.x,z=a?(o[1]+o[3])/2:o.z;let t=!a&&!o.tree&&o.h>0?o.h:Infinity;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const q of JUMP.tab.get((Math.floor(x)+i)+','+(Math.floor(z)+j))||[])if(Math.abs(q[0]-x)<.15&&Math.abs(q[1]-z)<.15)t=t===Infinity?q[2]:Math.max(t,q[2]);
  return o.jt=t;
}
// collideCar0 for a person whose feet are y above the ground: anything with a lower top is passed over
function jumpCollide(x,z,r,y){
  const o=world.collide(x,z,r);x=o.x;z=o.z;
  const ci=Math.floor(x/8),cj=Math.floor(z/8);
  for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++){
    for(const p of props.get(i+','+j)||[]){if(p.down||jumpTop(p)<y)continue;const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),m=r+p.r;if(d<m&&d>1e-5){x=p.x+dx/d*m;z=p.z+dz/d*m;}}
    for(const s of walls.get(i+','+j)||[]){if(jumpTop(s)<y)continue;const dx=s[2]-s[0],dz=s[3]-s[1],t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1),0,1),ex=x-s[0]-dx*t,ez=z-s[1]-dz*t,d=Math.hypot(ex,ez);
      if(d<r&&d>1e-5){x+=ex/d*(r-d);z+=ez/d*(r-d);}}}
  return{x,z};
}
function jumpSnd(up){
  if(up){burst('bandpass',900,1.4,.05,.09);tone(180,260,.05,.08,'triangle');}
  else{burst('lowpass',380,.9,.14,.12);tone(90,55,.12,.1);}
}
{const w0=walk0_,pr0=press;
  press=function(code){if(code==='Space'&&jumpStart())return;pr0(code);};
  walk0_=function(dt){
    const J=JUMP;
    if(player.mode!=='foot'||fight.pDown>0||w3Foot){J.air=false;J.pre=J.land=J.y=J.vy=J.feet=0;return w0(dt);}
    if(J.pre>0&&(J.pre-=dt)<=0){J.pre=0;J.air=true;J.sp=player.speed;J.vy=Math.sqrt(2*J.g*(.3+.31*Math.min(1,Math.abs(J.sp)/7)));jumpSnd(1);}
    if(!J.air){J.land=Math.max(0,J.land-dt);return w0(dt);}
    waterTick(dt);
    const x=player.x,z=player.z,st=(down('KeyA','ArrowLeft')?1:0)-(down('KeyD','ArrowRight')?1:0);
    player.h+=st*.8*dt;
    J.y+=(J.vy-J.g*dt/2)*dt;J.vy-=J.g*dt;
    if(J.y<=0){J.y=J.vy=0;J.air=false;J.land=.16;jumpSnd(0);}
    J.feet=J.y+.39*jumpTuck(J.y);
    player.x+=Math.sin(player.h)*J.sp*dt;player.z+=Math.cos(player.h)*J.sp*dt;
    const r=jumpCollide(player.x,player.z,.42,J.feet);player.x=r.x;player.z=r.z;
    for(const o of[...world.cars,...parkedNear(player.x,player.z)]){const fx=Math.sin(o.h),fz=Math.cos(o.h),dx=player.x-o.x,dz=player.z-o.z,t=clamp(dx*fx+dz*fz,-1.35,1.35),qx=dx-fx*t,qz=dz-fz*t,d=Math.hypot(qx,qz);if(d<1.3&&d>.01){player.x+=qx/d*(1.3-d);player.z+=qz/d*(1.3-d);}}
    const B=world.box;player.x=clamp(player.x,B.minX,B.maxX);player.z=clamp(player.z,B.minZ,B.maxZ);
    if(dt>0){const v=Math.hypot(player.x-x,player.z-z)/dt;if(v<Math.abs(J.sp))J.sp=Math.sign(J.sp)*v;}
    player.speed=J.sp;
    personMesh.position.set(player.x,GY(player.x,player.z),player.z);personMesh.rotation.y=player.h;
  };
}
// 0..1 crouch (before take-off and on landing) and tuck (in the air)
function jumpPose(){
  const J=JUMP;if(!J.air&&!J.pre&&!J.land)return null;
  return{c:J.pre?1-J.pre/.07:J.land?J.land/.16:0,k:J.air?jumpTuck(J.y):0};
}
const JACT=new Array(19);
{const pa0=poseAt;
  poseAt=function(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act){
    const q=i===PLAYER_I&&jumpPose();
    if(!q)return pa0(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act);
    JACT.fill(NaN);if(act)for(let k=0;k<19;k++)JACT[k]=act[k];JACT.phone=act&&act.phone;
    const{c,k}=q;
    JACT[1]=.3*c+.15*k;JACT[12]=JACT[15]=-.55*c-1.25*k;JACT[13]=JACT[16]=1.1*c+1.9*k;
    if(!(act&&act[6]===act[6])){JACT[6]=JACT[9]=-.5*c-1.1*k;JACT[7]=JACT[10]=-.5;}
    const y=JUMP.y-.16*c;pa0(i,look,x,z,h,fall,lift+y,ph,gait,wave,yaw,JACT);
    // charPose lifts only peds: the player's mannequin is raised here
    const st=CHAR.list[i];if(CHAR.use[i]&&st&&st.o.visible){st.o.position.y+=y;st.o.updateMatrixWorld(true);}
  };
}
// the mannequin: the same crouch and tuck through its bones, after the clips have posed it; fixAnim restores them before the next mixer pass
{const an0=charAnim;
  charAnim=function(st,dt){
    an0(st,dt);
    const q=CHAR.list.indexOf(st)===PLAYER_I&&jumpPose();if(!q)return;
    const{c,k}=q,ry=st.o.rotation.y,ax=Math.cos(ry),az=-Math.sin(ry),B=st.bone;
    const tilt=(b,a)=>{if(!b||!a)return;(st.sv||(st.sv=[])).push([b,b.quaternion.clone()]);fixTilt(b,ax,0,az,a);};
    tilt(B.spine_01,.25*c+.15*k);
    for(const s of['l','r']){tilt(B['thigh_'+s],-.55*c-1.25*k);tilt(B['calf_'+s],1.1*c+1.9*k);tilt(B['foot_'+s],-.4*c);}
    st.o.updateMatrixWorld(true);
  };
}
