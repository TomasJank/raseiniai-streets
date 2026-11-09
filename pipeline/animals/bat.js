// pipistrelles hunting moths in loops round the nearest street lamps after dark; they scatter when the lamp goes down or day comes
SPECIES.bat={rig:'bat',scale:.1,n:12,tod:[21,5],sound:{kind:'squeak',every:[5,14]},place:bat_place,behave:bat_behave};
function bat_place(a){
  const mates=ANIMALS.bat.filter(q=>q.name==='bat'&&q.mode==='fly'&&!q.leave&&q.lamp);
  if(mates.length&&Math.random()<.7){const m=pick(mates);if(mates.filter(q=>q.lamp===m.lamp).length<5){a.lamp=m.lamp;a.pole=m.pole;}}
  if(!a.lamp){
    const l=nearOf(world.lamps||[],lampAt,player.x,player.z).filter(q=>animFar(q[0],q[2])).sort((p,q)=>Math.hypot(p[0]-player.x,p[2]-player.z)-Math.hypot(q[0]-player.x,q[2]-player.z));
    if(!l.length)return false;a.lamp=l[Math.floor(Math.random()*Math.min(3,l.length))];const li=world.lamps.indexOf(a.lamp);a.pole=(world.poles||[]).find(o=>o.li===li)||null;
  }
  if(a.pole&&a.pole.down)return false;
  a.bat_r=1.5+Math.random()*2.5;a.bat_y=4+Math.random()*3;a.bat_w=(2+Math.random()*2)*(Math.random()<.5?1:-1);a.bat_t=Math.random()*TAU;a.mode='fly';bat_at(a);return true;
}
function bat_at(a){const t=a.bat_t,r=a.bat_r+Math.sin(t*2.3)*.8;a.x=a.lamp[0]+Math.cos(t)*r;a.z=a.lamp[2]+Math.sin(t)*r;a.y=a.bat_y+Math.sin(t*3.1)*.6;}
function bat_behave(a,dt){
  if(a.leave||a.pole&&a.pole.down){
    if(a.mode!=='away'){a.mode='away';const h=Math.atan2(a.x-a.lamp[0],a.z-a.lamp[2]);a.vx=Math.sin(h)*9;a.vz=Math.cos(h)*9;}
    a.x+=a.vx*dt;a.z+=a.vz*dt;a.y+=dt*2;return;
  }
  a.bat_t+=a.bat_w*dt;bat_at(a);
}
