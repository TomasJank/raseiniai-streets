// brown hares sitting out in the meadows at night; short hop bursts, a zig-zag sprint when a car or a person comes
SPECIES.hare={rig:'quad',scale:.55,legs:.36,ears:2.3,tail:.3,speed:10,n:4,tod:[21,5],where:'field',
  colours:[[0x97795a,0x7e6448],[0x8a6e50,0x735c44],[0xa0835f,0x86694c]],
  hit:{cash:20,heat:0,dent:0},msg:'Partrenkei kiškį',behave:hare_behave};
function hare_behave(a,dt){
  if(a.mode==='run'){
    if((a.hare_z-=dt)<=0){a.hare_z=.3+Math.random()*.25;a.hare_s=-(a.hare_s||1);const h=a.hare_h+a.hare_s*.6;a.vx=Math.sin(h)*a.S.speed;a.vz=Math.cos(h)*a.S.speed;}
    animGo(a,dt);if((a.timer-=dt)<=0){a.mode='sit';a.timer=2+Math.random()*4;}return;
  }
  const c=player.mode==='car'&&player.car;
  if(a.d<12&&!c||c&&Math.abs(c.speed)>2&&a.d<25||inLights(a)){a.hare_h=Math.atan2(a.x-player.x,a.z-player.z);a.hare_z=0;a.mode='run';a.timer=3+Math.random();return;}
  if((a.timer-=dt)>0){if(a.mode==='hop')animGo(a,dt);else a.sp=0;return;}
  if(a.mode==='hop'){a.mode='sit';a.timer=2+Math.random()*5;a.sp=0;return;}
  let h=a.h+(Math.random()-.5)*1.5;const p=a.green;
  if(p&&!pip(a.x+Math.sin(h)*2,a.z+Math.cos(h)*2,p))h=Math.atan2((p.bb[0]+p.bb[2])/2-a.x,(p.bb[1]+p.bb[3])/2-a.z);
  a.mode='hop';a.timer=.4+Math.random()*.6;a.vx=Math.sin(h)*2.8;a.vz=Math.cos(h)*2.8;
}
