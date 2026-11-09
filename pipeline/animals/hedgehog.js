// hedgehogs shuffling along garden hedges and over quiet streets at night; they roll up when someone comes close or the lights hit them
SPECIES.hedgehog={rig:'quad',scale:.26,legs:.16,ears:.4,tail:0,speed:.5,n:4,tod:[21,5],
  colours:[[0x6a5743,0x2e241c],[0x584838,0x2a211a],[0x7a6650,0x3a2e24]],
  hit:{cash:10,heat:0,dent:0},msg:'Partrenkei ežį',sound:{kind:'snuffle',every:[6,15]},place:hedgehog_place,behave:hedgehog_behave};
function hedgehog_place(a){
  if(!animPlace(a,Math.random()<.7?'fence':'pavement'))return false;
  if(a.seg){const s=a.seg,dx=s[2]-s[0],dz=s[3]-s[1],L=Math.hypot(dx,dz)||1,o=Math.random()<.5?.4:-.4;a.x-=dz/L*o;a.z+=dx/L*o;a.y=0;a.mode='walk';}
  return !world.inBuilding(a.x,a.z);
}
function hedgehog_behave(a,dt){
  const threat=a.d<2||inLights(a);
  if(a.mode==='sit'){a.sp=0;if(threat)a.timer=5;else if((a.timer-=dt)<=0){a.mode='walk';a.timer=0;}return;}
  if(threat){a.mode='sit';a.timer=5;a.vx=a.vz=a.sp=0;return;}
  if((a.timer-=dt)<=0){
    const go=Math.random()<.65,turn=Math.random()<.2?(Math.random()<.5?1:-1)*Math.PI/2:(Math.random()-.5)*.6;
    a.timer=go?3+Math.random()*6:1.5+Math.random()*3;if(go)a.h+=turn;const v=go?.3:0;a.vx=Math.sin(a.h)*v;a.vz=Math.cos(a.h)*v;
  }
  if(a.vx||a.vz)animGo(a,dt);else a.sp=0;
}
