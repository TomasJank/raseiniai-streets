// feral pigeons and jackdaws pecking in flocks on the square and the centre's pavements; the flock lifts off together from anyone within 3 m and lands 10-20 m on
SPECIES.pigeon={rig:'bird',scale:.33,speed:7,n:6,tod:[6,21],flap:24,colours:[[0x8d929b,0x6c7079],[0x9a9690,0x5f5c58],[0x6b6e76,0x4b4e55],[0xc9c4ba,0x9a8f80]],
  hit:{cash:0,heat:0,dent:0},msg:'Partrenkei balandį',place:a=>pigeon_place(a,4,6),behave:pigeon_behave,sound:{kind:'coo',every:[5,14]}};
SPECIES.jackdaw={rig:'bird',scale:.34,speed:7,n:4,tod:[6,21],flap:20,colours:[[0x2b2c30,0x1d1e21],[0x3a3b40,0x232428]],
  hit:{cash:0,heat:0,dent:0},msg:'Partrenkei kuosą',place:a=>pigeon_place(a,4,4),behave:pigeon_behave,sound:{kind:'caw',every:[6,18]}};
const pigeon_flocks=[];
function pigeon_free(x,z){return !world.inBuilding(x,z)&&animFar(x,z);}
function pigeon_place(a,lo,hi){
  for(let i=pigeon_flocks.length;i--;){const f=pigeon_flocks[i];f.m=f.m.filter(o=>o.mode!=='hide');if(Math.hypot(f.x-player.x,f.z-player.z)>150)f.full=true;if(!f.m.length&&f.full)pigeon_flocks.splice(i,1);}
  let f=pigeon_flocks.find(f=>f.S===a.S&&!f.full);
  if(!f){
    const room=a.S.n-ANIMALS.bird.filter(o=>o.S===a.S&&o.mode!=='hide').length,want=Math.min(room,lo+Math.floor(Math.random()*(hi-lo+1)));if(want<lo)return false;
    let x,z;
    if(CENTRE&&Math.random()<.5){const r=Math.random()*22,t=Math.random()*TAU;x=CENTRE[0]+Math.cos(t)*r;z=CENTRE[1]+Math.sin(t)*r;}
    else{if(!animPlace(a,'pavement')||CENTRE&&Math.hypot(a.x-CENTRE[0],a.z-CENTRE[1])>350)return false;x=a.x;z=a.z;}
    if(!pigeon_free(x,z))return false;
    pigeon_flocks.push(f={S:a.S,x,z,want,m:[],full:false,lead:null,t:0});
  }
  for(let k=0;k<6;k++){const r=Math.random()*2,t=Math.random()*TAU,x=f.x+Math.cos(t)*r,z=f.z+Math.sin(t)*r;if(!pigeon_free(x,z))continue;
    Object.assign(a,{x,z,y:0,h:Math.random()*TAU,mode:'peck',timer:Math.random(),pigeon_f:f,e:null});f.m.push(a);if(f.m.length>=f.want)f.full=true;return true;}
  return false;
}
function pigeon_scatter(f,fx,fz){
  let a0=Math.atan2(f.x-fx,f.z-fz),tx=f.x,tz=f.z;
  for(let k=0;k<8;k++){const h=a0+(Math.random()-.5)*(k<4?1.6:TAU),r=10+Math.random()*10,x=f.x+Math.sin(h)*r,z=f.z+Math.cos(h)*r;
    if(!world.inBuilding(x,z)&&!world.inBuilding((x+f.x)/2,(z+f.z)/2)){tx=x;tz=z;break;}}
  let first=null;
  for(const a of f.m){if(a.mode==='hide'||a.mode==='down')continue;first=first||a;const r=Math.random()*2,t=Math.random()*TAU,x=tx+Math.cos(t)*r,z=tz+Math.sin(t)*r,d=Math.hypot(x-a.x,z-a.z);
    a.pigeon_from=[a.x,a.z];a.pigeon_to=world.inBuilding(x,z)?[tx,tz]:[x,z];a.pigeon_T=a.timer=d/a.S.speed+.2+Math.random()*.4;a.pigeon_top=2+d*.15;a.mode='fly';a.h=Math.atan2(x-a.x,z-a.z);}
  f.x=tx;f.z=tz;if(first)animSound(first);
}
function pigeon_behave(a,dt){
  const f=a.pigeon_f;
  if(a.mode==='fly'){
    const k=1-Math.max(0,a.timer-=dt)/a.pigeon_T,[x0,z0]=a.pigeon_from,[x1,z1]=a.pigeon_to;
    a.x=x0+(x1-x0)*k;a.z=z0+(z1-z0)*k;a.y=Math.sin(k*Math.PI)*a.pigeon_top;a.sp=0;
    if(a.timer<=0){a.mode='peck';a.y=0;a.timer=.5+Math.random();}return;
  }
  if(!f.lead||f.lead.mode==='hide')f.lead=a;
  if(a.d<3){pigeon_scatter(f,player.x,player.z);return;}
  if(f.lead===a&&(f.t-=dt)<=0){f.t=.25;for(const c of world.cars)if(Math.abs(c.speed)>1&&Math.abs(c.x-f.x)<5&&Math.abs(c.z-f.z)<5){pigeon_scatter(f,c.x,c.z);return;}}
  // a few quick steps with a head bob, then a peck or two standing still
  if((a.timer-=dt)<=0){a.timer=.4+Math.random()*1.4;a.pigeon_w=Math.random()<.5;
    if(a.pigeon_w){const h=Math.atan2(f.x-a.x,f.z-a.z)+(Math.random()-.5)*(Math.hypot(f.x-a.x,f.z-a.z)>2?1:5);a.h=h;}}
  if(a.pigeon_w){const nx=a.x+Math.sin(a.h)*.35*dt,nz=a.z+Math.cos(a.h)*.35*dt;if(!world.inBuilding(nx,nz)){a.x=nx;a.z=nz;}a.y=.02*Math.abs(Math.sin(a.timer*14));}
  else a.y=a.timer%.5<.12?-.03:0;
}
