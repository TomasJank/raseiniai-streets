// white storks on electricity poles, one per pole, April to August: stand, now and then clatter with a few wing beats; fly off when the pole falls
const stork_season=()=>{const m=new Date().getMonth();return m>=3&&m<=7;};
SPECIES.stork={rig:'bird',scale:1,speed:6,n:2,tod:[6,21],where:'pole',colours:[[0xf3f1eb,0x18181a]],flap:6,
  hit:{cash:30,heat:1,dent:0},msg:'Partrenkei gandrą',place:stork_place,behave:stork_behave,sound:{kind:'flap',every:[12,35]}};
function stork_place(a){
  if(!stork_season()||!animPlace(a,'pole'))return false;
  return !Object.values(ANIMALS).some(l=>l.some(o=>o.mode!=='hide'&&o.pole===a.pole));
}
function stork_behave(a,dt){
  if(a.stork_off){a.x+=a.vx*dt;a.z+=a.vz*dt;a.y+=dt*1.4;return;}
  if(a.pole&&a.pole.down||!stork_season()){
    const h=Math.random()*TAU;a.stork_off=true;a.leave=true;a.mode='fly';a.h=h;a.vx=Math.sin(h)*a.S.speed;a.vz=Math.cos(h)*a.S.speed;animSound(a);return;}
  // the core just played the clatter: beat the wings with it
  if(a.stork_st!==undefined&&a.st>a.stork_st){a.mode='fly';a.timer=1.3;}
  a.stork_st=a.st;
  if(a.mode==='fly'&&(a.timer-=dt)<=0)a.mode='perch';
}
