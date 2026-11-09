// roe deer grazing at the forest edge in twos and threes; they step over the edge roads, freeze in the headlights, then bolt back into the trees
SPECIES.deer={rig:'quad',scale:1.05,legs:.68,ears:1.5,tail:.2,speed:9,n:3,tod:[20,6],
  colours:[[0xa8703f,0x8a5d36],[0x9a6a42,0x7e583a],[0xb27a46,0x92633a]],
  hit:{cash:150,heat:1,dent:.45},msg:'Partrenkei stirną',sound:{kind:'snort',every:[30,90]},place:deer_place,behave:deer_behave};
function deer_place(a){
  const m=ANIMALS.quad.find(q=>q.name==='deer'&&q.mode!=='hide'&&q.mode!=='down'&&!q.leave&&q.green);
  if(m&&Math.random()<.8){const h=Math.random()*TAU,x=m.x+Math.sin(h)*(2+Math.random()*3),z=m.z+Math.cos(h)*(2+Math.random()*3);
    if(world.inBuilding(x,z))return false;Object.assign(a,{x,z,y:0,h:m.h+(Math.random()-.5),mode:'walk',green:m.green,deer_c:(m.deer_c||0)+Math.random()*2});return true;}
  if(!animPlace(a,'forest'))return false;
  const p=a.green;
  for(let k=0;k<6;k++){const v=pick(p),dx=a.x-v[0],dz=a.z-v[1],l=Math.hypot(dx,dz)||1,x=v[0]+dx/l*5,z=v[1]+dz/l*5;
    if(pip(x,z,p)&&animFar(x,z)&&!world.inBuilding(x,z)){a.x=x;a.z=z;a.h=Math.atan2(-dx,-dz);break;}}
  a.deer_c=30*Math.random();return true;
}
// over the nearest road within 25 m and 6 m past its far edge; a scan of edgesNear, on a timer
function deer_cross(a){
  const G=world.graph;let best=null,bd=25;
  for(const e of edgesNear(a.x,a.z)){const A=G.get(e.a),B=G.get(e.b);if(!A||!B)continue;const dx=B.x-A.x,dz=B.z-A.z,t=clamp(((a.x-A.x)*dx+(a.z-A.z)*dz)/(dx*dx+dz*dz||1),0,1),
    x=A.x+dx*t,z=A.z+dz*t,d=Math.hypot(x-a.x,z-a.z);if(d<bd&&d>.5){bd=d;best=[x,z,e.w/2+6];}}
  if(!best)return;const [x,z,o]=best,ux=(x-a.x)/bd,uz=(z-a.z)/bd;
  a.mode='cross';a.vx=ux*1.4;a.vz=uz*1.4;a.timer=(bd+o)/1.4;a.h=Math.atan2(ux,uz);
}
function deer_behave(a,dt){
  if(a.mode==='freeze'){a.sp=0;a.h=lerpAngle(a.h,Math.atan2(player.x-a.x,player.z-a.z),Math.min(1,dt*4));
    if((a.timer-=dt)<=0){fleeFrom(a,player.x,player.z,a.S.speed,4);const b=a.green&&a.green.bb;
      if(b){const fx=(b[0]+b[2])/2-a.x,fz=(b[1]+b[3])/2-a.z,l=Math.hypot(fx,fz)||1,vx=a.vx+fx/l*a.S.speed,vz=a.vz+fz/l*a.S.speed,k=a.S.speed/(Math.hypot(vx,vz)||1);a.vx=vx*k;a.vz=vz*k;}}
    return;}
  if(a.mode==='run'){animGo(a,dt);if((a.timer-=dt)<=0){a.mode='walk';a.timer=0;}return;}
  if(inLights(a)){a.mode='freeze';a.timer=1+Math.random();a.vx=a.vz=a.sp=0;return;}
  if(a.d<15&&player.mode==='foot'){fleeFrom(a,player.x,player.z,a.S.speed,4);return;}
  if(a.mode==='cross'){animGo(a,dt);if((a.timer-=dt)<=0){a.mode='walk';a.timer=0;a.deer_c=20+Math.random()*40;}return;}
  if((a.deer_c-=dt)<=0){a.deer_c=20+Math.random()*40;deer_cross(a);if(a.mode==='cross')return;}
  animWander(a,dt,.35);
}
