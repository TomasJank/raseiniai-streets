// one tawny owl on a pole top, watching the player; hoots now and then and flits to another pole when someone walks up
SPECIES.owl={rig:'bird',scale:.4,speed:8,n:1,tod:[21,5],where:'pole',flap:7,
  colours:[[0x6e5236,0x8a6e4e],[0x5e4a36,0x7d6650]],
  hit:{cash:30,heat:0,dent:0},msg:'Partrenkei pelėdą',sound:{kind:'hoot',every:[15,40]},behave:owl_behave};
function owl_go(a){
  const l=nearOf(world.poles||[],poleAt,a.x,a.z).filter(q=>{const d=Math.hypot(q.x-a.x,q.z-a.z);return !q.down&&d>20&&d<90&&Math.hypot(q.x-player.x,q.z-player.z)>15;});
  a.owl_to=l.length?pick(l):null;a.owl_from=[a.x,a.z,a.y];a.mode='fly';a.timer=6;
  if(!a.owl_to){a.owl_h=Math.atan2(a.x-player.x,a.z-player.z);a.h=a.owl_h;}
  if(a.pole&&!a.owl_to)a.pole=null;
}
function owl_behave(a,dt){
  if(a.mode==='perch'){
    if(a.pole&&a.pole.down){a.pole=null;owl_go(a);return;}
    if(a.d<50)a.h=lerpAngle(a.h,Math.atan2(player.x-a.x,player.z-a.z),Math.min(1,dt*3));
    if(a.d<6)owl_go(a);return;
  }
  const q=a.owl_to;
  if(!q||q.down){a.x+=Math.sin(a.h)*8*dt;a.z+=Math.cos(a.h)*8*dt;a.y+=dt*1.5;if((a.timer-=dt)<=0)a.mode='hide';return;}
  const [x0,z0,y0]=a.owl_from,L=Math.hypot(q.x-x0,q.z-z0)||1,dx=q.x-a.x,dz=q.z-a.z,r=Math.hypot(dx,dz);
  if(r<.4){a.x=q.x;a.z=q.z;a.y=8.75;a.pole=q;a.owl_to=null;a.mode='perch';return;}
  const s=Math.min(r,8*dt);a.x+=dx/r*s;a.z+=dz/r*s;a.h=Math.atan2(dx,dz);const k=1-r/L;a.y=y0+(8.75-y0)*k+Math.sin(k*Math.PI)*2;
}
