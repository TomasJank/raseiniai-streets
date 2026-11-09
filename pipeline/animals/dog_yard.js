// loose yard dogs behind a garden fence: potter about the front yard, run along the inside of the fence level with a passer-by, barking
SPECIES.dog_yard={rig:'quad',scale:.88,legs:.56,ears:.95,tail:.9,speed:5,n:2,tod:[6,21],
  colours:[[0x3b2c20,0xa8794a],[0xb38b58,0x9c7547],[0x26231f,0xd8d0c2],[0x8a6a48,0x6e5236]],
  hit:{cash:40,heat:1,dent:0},msg:'Partrenkei šunį',place:dog_yard_place,behave:dog_yard_behave,sound:{kind:'bark',every:[15,40]}};
const dog_yard_ix=new Map();
// the yard in front of a house: the straight run of fence around seg s, up to 30 m, and the strip between it and the house
function dog_yard_yard(s){
  const S=world.hedgeSegs;if(!dog_yard_ix.has(s))S.forEach((q,i)=>dog_yard_ix.set(q,i));
  const i0=dog_yard_ix.get(s),dir=q=>{const l=Math.hypot(q[2]-q[0],q[3]-q[1])||1;return[(q[2]-q[0])/l,(q[3]-q[1])/l];},[ux,uz]=dir(s);
  const ok=(q,r)=>{const [x,z]=dir(r);return Math.abs(q[2]-r[0])+Math.abs(q[3]-r[1])<1e-3&&x*ux+z*uz>.995;};
  let a=i0,b=i0,len=Math.hypot(s[2]-s[0],s[3]-s[1]);
  while(len<30&&a>0&&ok(S[a-1],S[a])){a--;len+=Math.hypot(S[a][2]-S[a][0],S[a][3]-S[a][1]);}
  while(len<30&&b<S.length-1&&ok(S[b],S[b+1])){b++;len+=Math.hypot(S[b][2]-S[b][0],S[b][3]-S[b][1]);}
  const ax=S[a][0],az=S[a][1],dx=S[b][2]-ax,dz=S[b][3]-az,L=Math.hypot(dx,dz);if(L<7)return null;
  const Ux=dx/L,Uz=dz/L;
  for(const sd of[1,-1]){const nx=-Uz*sd,nz=Ux*sd;let D=20,house=false;
    for(const t of[.1,.3,.5,.7,.9])for(let v=.5;v<D+1.2;v+=.5){const b=world.inBuilding(ax+dx*t+nx*v,az+dz*t+nz*v);if(b){if(b.kind==='house'||b.kind==='shed')house=true;D=Math.min(D,v-1.2);break;}}
    if(house&&D>=2.5){D=Math.min(D,6);return{ax,az,ux:Ux,uz:Uz,nx,nz,L,D,pts:[[ax,az],[ax+dx,az+dz],[ax+dx+nx*D,az+dz+nz*D],[ax+nx*D,az+nz*D]]};}}
  return null;
}
function dog_yard_at(a,u,v){const y=a.dog_yard_y;a.dog_yard_u=u;a.dog_yard_v=v;a.x=y.ax+y.ux*u+y.nx*v;a.z=y.az+y.uz*u+y.nz*v;}
function dog_yard_place(a){
  const l=nearOf(world.hedgeSegs||[],segAt,player.x,player.z);if(!l.length)return false;
  for(let k=0;k<6;k++){const y=dog_yard_yard(pick(l));if(!y)continue;
    a.dog_yard_y=y;dog_yard_at(a,.5+Math.random()*(y.L-1),.8+Math.random()*(y.D-1.3));
    if(!animFar(a.x,a.z)||world.inBuilding(a.x,a.z)||ANIMALS.quad.some(q=>q.mode!=='hide'&&q.dog_yard_y&&Math.hypot(q.x-a.x,q.z-a.z)<40))continue;
    Object.assign(a,{y:0,h:Math.random()*TAU,mode:'sit',timer:2+Math.random()*4,dog_yard_bk:0});return true;}
  return false;
}
function dog_yard_behave(a,dt){
  const y=a.dog_yard_y,px=player.x-y.ax,pz=player.z-y.az,pu=px*y.ux+pz*y.uz;let tu,tv,vmax;
  if(a.d<12){tu=clamp(pu,.4,y.L-.4);tv=.8;vmax=5.5;a.mode='run';
    if((a.dog_yard_bk-=dt)<=0){a.dog_yard_bk=.9+Math.random()*1.3;animSound(a);}}
  else{if((a.timer-=dt)<=0){a.timer=3+Math.random()*5;a.mode=Math.random()<.4?'sit':'walk';a.dog_yard_t=[.4+Math.random()*(y.L-.8),.6+Math.random()*(y.D-1)];}
    if(a.mode==='sit'||!a.dog_yard_t){a.sp=0;return;}[tu,tv]=a.dog_yard_t;vmax=.9;}
  const du=tu-a.dog_yard_u,dv=tv-a.dog_yard_v,d=Math.hypot(du,dv),st=Math.min(d,vmax*dt),x0=a.x,z0=a.z;
  if(d>1e-4)dog_yard_at(a,a.dog_yard_u+du/d*st,a.dog_yard_v+dv/d*st);a.sp=st/Math.max(dt,1e-4);
  if(a.sp>.2)a.h=lerpAngle(a.h,Math.atan2(a.x-x0,a.z-z0),Math.min(1,dt*10));
  else{a.sp=0;if(a.d<12)a.h=lerpAngle(a.h,Math.atan2(player.x-a.x,player.z-a.z),Math.min(1,dt*6));}
}
