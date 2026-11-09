// dogs on a lead: trot just ahead of an adult walker on the garden side, stop and sit with them, sniff poles, bark at the player when the owner gets hit
SPECIES.dog_lead={rig:'quad',scale:.78,legs:.55,ears:.85,tail:.9,speed:5,n:1,tod:[6,21],colours:[[0x7a5230,0x5c3d24]],
  hit:{cash:40,heat:1,dent:0},msg:'Partrenkei šunį',place:dog_lead_place,behave:dog_lead_behave,sound:{kind:'bark',every:[8,25]}};
SPECIES.dog_lead_small=Object.assign({},SPECIES.dog_lead,{scale:.46,legs:.42,ears:.9,colours:[[0xeeeae1,0xdcd6ca]]});
SPECIES.dog_lead_big=Object.assign({},SPECIES.dog_lead,{scale:1.02,legs:.62,ears:.75,colours:[[0x1f1d1c,0x2b2826]],hit:{cash:60,heat:1,dent:.02}});
function dog_lead_place(a){
  const owned=new Set(ANIMALS.quad.filter(q=>q.mode!=='hide'&&q.dog_lead_owner).map(q=>q.dog_lead_owner)),led=new Set(peds.map(q=>q.lead));
  const l=peds.filter(p=>p.mode==='walk'&&p.e&&!p.lead&&!led.has(p)&&!owned.has(p)&&p.look.age!=='kid'&&animFar(p.x,p.z));
  if(!l.length)return false;
  const p=pick(l);a.dog_lead_owner=p;a.dog_lead_ox=p.x;a.dog_lead_oz=p.z;a.dog_lead_sn=1+Math.random()*2;a.dog_lead_bk=0;
  const [x,z]=dog_lead_spot(a,p);Object.assign(a,{x,z,y:0,h:p.h,mode:'walk'});return true;
}
// level with the owner, a step ahead, on the side of the pavement away from the road
function dog_lead_spot(a,p){
  const fx=Math.sin(p.h),fz=Math.cos(p.h),e=p.e,G=world.graph,A=e&&G.get(e.a),B=e&&G.get(e.b);let ox=0,oz=0;
  if(A&&B){const dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz)||1,s=(p.x-A.x)*dz-(p.z-A.z)*dx>0?1:-1;ox=dz/L*s*.85;oz=-dx/L*s*.85;}
  const x=p.x+fx*.7+ox,z=p.z+fz*.7+oz;return world.inBuilding(x,z)?[p.x+fx*.9,p.z+fz*.9]:[x,z];
}
function dog_lead_move(a,tx,tz,vmax,dt){
  const dx=tx-a.x,dz=tz-a.z,d=Math.hypot(dx,dz),st=Math.min(d,Math.min(vmax,d*4)*dt);
  if(d>1e-4){a.x+=dx/d*st;a.z+=dz/d*st;}// ponytail: the shared quad gait splays a dog's legs at walking pace, so it gets 70% of the real speed (feet slide a little)
  a.sp=.7*st/Math.max(dt,1e-4);if(a.sp>.15)a.h=lerpAngle(a.h,Math.atan2(dx,dz),Math.min(1,dt*8));
}
function dog_lead_behave(a,dt){
  const p=a.dog_lead_owner,ov=Math.hypot(p.x-a.dog_lead_ox,p.z-a.dog_lead_oz)/Math.max(dt,1e-4);
  // the ped object was recycled into someone else
  if(p.mode==='hide'||ov*dt>5){a.mode='hide';return;}
  a.dog_lead_ox=p.x;a.dog_lead_oz=p.z;a.dog_lead_bk-=dt;
  if(typeof fight!=='undefined'&&fight.victims.includes(p)){
    const dx=player.x-a.x,dz=player.z-a.z,d=Math.hypot(dx,dz)||1;a.mode='run';
    dog_lead_move(a,player.x-dx/d*1.5,player.z-dz/d*1.5,6.5,dt);a.h=Math.atan2(dx,dz);
    if(a.dog_lead_bk<=0){a.dog_lead_bk=.7+Math.random()*.6;animSound(a);}return;
  }
  if(player.mode==='foot'&&player.gait>.8&&a.d<6&&a.dog_lead_bk<=0){a.dog_lead_bk=3+Math.random()*3;animSound(a);}
  if(p.mode==='talk'||p.mode==='sit'){const [x,z]=dog_lead_spot(a,p);dog_lead_move(a,x,z,3,dt);if(a.sp<.2){a.mode='sit';a.sp=0;}return;}
  a.mode='walk';
  if(ov<.3){a.dog_lead_pole=null;const [x,z]=dog_lead_spot(a,p);dog_lead_move(a,x,z,3,dt);if(a.sp<.3)a.sp=0;return;}
  if((a.dog_lead_sn-=dt)<=0){a.dog_lead_sn=1.5;if(!a.dog_lead_pole&&Math.random()<.5)
    for(const q of nearOf(world.poles||[],poleAt,a.x,a.z))if(!q.down&&Math.abs(q.x-a.x)<3&&Math.abs(q.z-a.z)<3){a.dog_lead_pole=q;a.dog_lead_pt=2+Math.random()*1.5;break;}}
  const q=a.dog_lead_pole;
  if(q&&(a.dog_lead_pt-=dt)>0&&Math.hypot(q.x-p.x,q.z-p.z)<2.1){const dx=a.x-q.x,dz=a.z-q.z,l=Math.hypot(dx,dz)||1;dog_lead_move(a,q.x+dx/l*.35,q.z+dz/l*.35,4,dt);if(a.sp<.3){a.sp=0;a.h=Math.atan2(-dx,-dz);}return;}
  a.dog_lead_pole=null;const [x,z]=dog_lead_spot(a,p);dog_lead_move(a,x,z,Math.max(3,ov*2),dt);
}
