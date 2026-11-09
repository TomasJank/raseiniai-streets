// yard cats loafing on fence tops and garden walls; hop down on the far side and trot off when someone comes close
SPECIES.cat={rig:'quad',scale:.46,legs:.42,ears:1,tail:1.2,speed:3.4,n:3,tod:[0,24],where:'fence',
  colours:[[0x1d1b1a,0x1d1b1a],[0xc7742f,0xe9dcc4],[0x8b8882,0xe4e0d8],[0x6e5c47,0x2e2620],[0xebe7de,0xebe7de],[0x3a3634,0xf0ece4]],
  hit:{cash:20,heat:1,dent:0},msg:'Partrenkei katę',behave:cat_behave,sound:{kind:'meow',every:[10,30]}};
function cat_hop(a){
  const s=a.seg,dx=s[2]-s[0],dz=s[3]-s[1],L=Math.hypot(dx,dz)||1,nx=-dz/L,nz=dx/L,side=(a.x-player.x)*nx+(a.z-player.z)*nz>0?1:-1;
  a.cat_from=[a.x,a.z,a.y];a.cat_to=[a.x+nx*side*.75,a.z+nz*side*.75];a.mode='hop';a.timer=.4;a.h=Math.atan2(nx*side,nz*side);
}
function cat_behave(a,dt){
  if(a.mode==='sit'){if(a.d<4)cat_hop(a);return;}
  if(a.mode==='hop'){
    const k=1-Math.max(0,a.timer-=dt)/.4,[x0,z0,y0]=a.cat_from;a.x=x0+(a.cat_to[0]-x0)*k;a.z=z0+(a.cat_to[1]-z0)*k;a.y=y0*(1-k)+Math.sin(k*Math.PI)*.3;a.sp=2;
    if(a.timer<=0){a.y=0;fleeFrom(a,player.x,player.z,a.S.speed,3+Math.random()*2);}
    return;
  }
  if(a.mode==='run'){animGo(a,dt);if((a.timer-=dt)<=0){a.mode='walk';a.timer=0;}return;}
  const car=player.mode==='car'&&Math.abs(player.car.speed)>3&&a.d<10;
  if(a.d<4||car||inLights(a))fleeFrom(a,player.x,player.z);else animWander(a,dt,.55);
}
