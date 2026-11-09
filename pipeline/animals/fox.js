// red foxes trotting along road edges and garden fences at night; caught in the headlights they stop and stare, then slip away
SPECIES.fox={rig:'quad',scale:.68,legs:.42,ears:1.35,tail:1.3,speed:7,n:2,tod:[21,5],
  colours:[[0xb4561f,0x221a15],[0xa04a1c,0x2a1f18],[0xc06a2e,0x2e231b]],
  hit:{cash:40,heat:1,dent:0},msg:'Partrenkei lapę',sound:{kind:'bark',every:[60,180]},place:fox_place,behave:fox_behave};
// ponytail: no bin raids, park bins are only in buildExtra's local knock-over list; expose world.bins to add them
function fox_place(a){
  if(!animPlace(a,Math.random()<.5?'fence':'pavement'))return false;
  if(a.seg){const s=a.seg,dx=s[2]-s[0],dz=s[3]-s[1],L=Math.hypot(dx,dz)||1,o=Math.random()<.5?.7:-.7;a.x-=dz/L*o;a.z+=dx/L*o;a.y=0;a.mode='walk';}
  return !world.inBuilding(a.x,a.z);
}
function fox_run(a,t){const dx=a.x-player.x,dz=a.z-player.z,l=Math.hypot(dx,dz)||1,s=Math.random()<.5?.5:-.5,h=Math.atan2(dx/l,dz/l)+s;
  a.vx=Math.sin(h)*a.S.speed;a.vz=Math.cos(h)*a.S.speed;a.mode='run';a.timer=t;}
function fox_behave(a,dt){
  if(a.mode==='stare'){a.sp=0;a.h=lerpAngle(a.h,Math.atan2(player.x-a.x,player.z-a.z),Math.min(1,dt*6));if((a.timer-=dt)<=0)fox_run(a,3+Math.random()*2);return;}
  if(a.mode==='run'){animGo(a,dt);if((a.timer-=dt)<=0){a.mode='walk';a.timer=0;}return;}
  if(inLights(a)){a.mode='stare';a.timer=1.2+Math.random()*1.3;a.vx=a.vz=a.sp=0;return;}
  if(a.d<6&&player.mode==='foot'||player.mode==='car'&&Math.abs(player.car.speed)>3&&a.d<12){fox_run(a,3);return;}
  if((a.timer-=dt)<=0){const go=Math.random()<.8;a.timer=go?3+Math.random()*7:1+Math.random()*2;if(go)a.h+=(Math.random()-.5)*(Math.random()<.15?Math.PI:.7);
    const v=go?1.5:0;a.vx=Math.sin(a.h)*v;a.vz=Math.cos(a.h)*v;}
  if(a.vx||a.vz)animGo(a,dt);else a.sp=0;
}
