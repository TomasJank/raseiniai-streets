// ---------- L klubas (Dominikonų g. 6), AUTODALYS next door and Norfa XL, by eye from street photos; no pixels used ----------
let club=null;
function clubFacade(lat,lon){
  const [x,z]=LL(lat,lon),bo=world.buildings.find(b=>x>=b.mnx&&x<=b.mxx&&z>=b.mnz&&z<=b.mxz&&pip(x,z,b.pts));if(!bo)return null;
  let cx=0,cz=0;for(const p of bo.pts){cx+=p[0]/bo.pts.length;cz+=p[1]/bo.pts.length;}
  // the sign goes on the longest wall that faces a road
  let best=null;
  for(let i=0;i<bo.pts.length;i++){const a=bo.pts[i],b=bo.pts[(i+1)%bo.pts.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<8)continue;
    const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;let nx=uz,nz=-ux;if((mx-cx)*nx+(mz-cz)*nz<0){nx=-nx;nz=-nz;}
    const n=nearestNode(mx+nx*6,mz+nz*6,5),d=(n?Math.hypot(n.x-mx,n.z-mz):1e9)-L*.3;
    if(!best||d<best.d)best={mx,mz,nx,nz,ux,uz,L,d};}
  if(best){best.y=GY(best.mx,best.mz);best.top=bo.top;}
  return best;
}
function clubSign(f,w,h,along,y,draw,lit){
  const c=document.createElement('canvas');c.height=256;c.width=Math.min(4096,Math.round(256*w/h));const g=c.getContext('2d');draw(g,c.width,c.height);
  const tex=new THREE.CanvasTexture(c);tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),lit?new THREE.MeshBasicMaterial({map:tex,transparent:true}):new THREE.MeshLambertMaterial({map:tex,transparent:true}));
  m.position.set(f.mx+f.nx*.14+f.ux*along,f.y+y,f.mz+f.nz*.14+f.uz*along);m.rotation.y=Math.atan2(f.nx,f.nz);worldGroup.add(m);return m;
}
const signText=(g,s,x,y,px,col,al,font)=>{g.font=(font||'900 ')+px+'px "Arial Black",Arial,sans-serif';g.textAlign=al||'center';g.textBaseline='middle';g.fillStyle=col;g.fillText(s,x,y);};
function clubPerson(shirt){
  const M=c=>new THREE.MeshLambertMaterial({color:c}),g=new THREE.Group(),sk=M(0xe2b493),pants=M(0x22252b),top=M(shirt);
  const part=(geo,mat,x,y,z,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(par||g).add(m);return m;};
  for(const s of[-1,1])part(new THREE.BoxGeometry(.17,.86,.2),pants,s*.11,.43,0);
  part(new THREE.BoxGeometry(.46,.66,.26),top,0,1.19,0);part(new THREE.SphereGeometry(.17,10,8),sk,0,1.7,0);
  g.userData.arms=[-1,1].map(s=>{const a=new THREE.Group();a.position.set(s*.3,1.48,0);g.add(a);part(new THREE.BoxGeometry(.12,.6,.13),top,0,-.28,0,a);part(new THREE.SphereGeometry(.075,8,6),sk,0,-.62,0,a);return a;});
  return g;
}
function buildGvidas(){
  // Žvyryno g. 2: single-storey brick porch on the street front, tall hedge along the pavement
  const f=clubFacade(55.3726278,23.1208895);if(!f)return;
  const box=(w,h,d,along,out,y,col)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col}));
    m.position.set(f.mx+f.ux*along+f.nx*out,f.y+y,f.mz+f.uz*along+f.nz*out);m.rotation.y=Math.atan2(f.nx,f.nz);m.castShadow=m.receiveShadow=true;worldGroup.add(m);};
  const pa=-f.L*.27;box(3.8,3,2.6,pa,1.3,1.5,0xd8d0ba);box(4.3,.22,3.1,pa,1.45,3.1,0x7d807f);box(3.9,.5,2.7,pa,1.3,.25,0x8a7f72);
  const n=nearestNode(f.mx+f.nx*8,f.mz+f.nz*8,2);if(!n)return;
  const out=(n.x-f.mx)*f.nx+(n.z-f.mz)*f.nz-5.3;
  if(out>5)box(f.L+6,1.8,1.1,0,out,.9,0x3e5a2c);
}
function buildAivaras(){
  // Gintaro g. 18: a row of thujas behind a dark mesh fence on brown posts, along the street 5 m off its centreline
  const [ax,az]=LL(55.3724752,23.1399376),[bx,bz]=LL(55.3722469,23.1401895),[hx,hz]=LL(55.3724073,23.1402232),L=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/L,uz=(bz-az)/L;
  let nx=-uz,nz=ux;if((hx-ax)*nx+(hz-az)*nz<0){nx=-nx;nz=-nz;}
  const thuja=new THREE.ConeGeometry(.5,1,8),green=new THREE.MeshLambertMaterial({color:0x2f4f24}),post=new THREE.MeshLambertMaterial({color:0x5a3a24}),mesh=new THREE.MeshLambertMaterial({color:0x2a2a2a,transparent:true,opacity:.55});
  const put=(m,s,o,y)=>{const x=ax+ux*s+nx*o,z=az+uz*s+nz*o;m.position.set(x,GY(x,z)+y,z);m.castShadow=true;worldGroup.add(m);return m;};
  for(let s=0,i=0;s<=L;s+=.95,i++){const h=3.2+hash(i*3.3+.4)*.9,m=new THREE.Mesh(thuja,green);m.scale.set(1,h,1);put(m,s,.7,h/2);}
  for(let s=0;s<=L+.01;s+=2.5)put(new THREE.Mesh(new THREE.BoxGeometry(.1,1.6,.1),post),s,0,.8);
  put(new THREE.Mesh(new THREE.BoxGeometry(L,1.5,.03),mesh),L/2,0,.8).rotation.y=Math.atan2(nx,nz);
}
function buildClub(){
  club=null;buildGvidas();buildAivaras();
  const f=clubFacade(55.3797531,23.1172891);if(!f)return;
  const top=f.top,band=Math.min(f.L-2,30);
  clubSign(f,band,1.7,0,top-1.1,(g,w,h)=>{g.fillStyle='#1d4c9e';g.fillRect(0,0,w,h);g.fillStyle='#f1c21b';g.fillRect(0,h-26,w,26);signText(g,'BALDŲ CENTRAS',w*.2,h*.45,120,'#fff');signText(g,'PRINTEMA · PREKYVIETĖ',w*.68,h*.45,96,'#fff');});
  clubSign(f,6,2.2,-band*.18,3.3,(g,w,h)=>{g.fillStyle='#2b56b0';g.fillRect(0,0,w,h);signText(g,'REDOS',w/2,h*.42,150,'#fff');signText(g,'IDĖJOS NAMAMS',w/2,h*.82,48,'#dfe7f5','center','700 ');});
  const neon=clubSign(f,7,2.1,band*.22,top+1.3,(g,w,h)=>{g.fillStyle='#120d1a';g.fillRect(0,0,w,h);g.shadowColor='#ff3fa4';g.shadowBlur=40;signText(g,'L KLUBAS',w/2,h*.42,150,'#ff5cb5');g.shadowBlur=20;signText(g,'PICERIJA',w/2,h*.84,52,'#ffd2ea','center','700 ');},true);
  const f8=clubFacade(55.3798855,23.1179713);
  if(f8)clubSign(f8,Math.min(f8.L*.8,22),1.3,0,f8.top-1.7,(g,w,h)=>{g.fillStyle='#d9dcdd';g.fillRect(0,0,w,h);g.fillStyle='#1f8a5b';g.fillRect(0,34,w,h-68);signText(g,'AUTODALYS',w*.62,h/2,130,'#fff');});
  const fn=clubFacade(55.3791313,23.1185534);
  if(fn){
    clubSign(fn,9,2.2,-fn.L*.12,fn.top-2.2,(g,w,h)=>{g.fillStyle='#34373b';g.fillRect(0,0,w,h);signText(g,'NORFA',w*.42,h/2,170,'#43b02a');g.fillStyle='#e30613';g.beginPath();g.arc(w*.8,h/2,95,0,TAU);g.fill();signText(g,'XL',w*.8,h/2,110,'#fff');});
    // the copper entrance block with the pharmacy over the doors
    const bw=Math.min(14,fn.L*.35),al=fn.L*.25,blk=new THREE.Mesh(new THREE.BoxGeometry(bw,5.6,1.4),new THREE.MeshLambertMaterial({color:0xa4643c}));
    blk.position.set(fn.mx+fn.nx*.7+fn.ux*al,fn.y+2.8,fn.mz+fn.nz*.7+fn.uz*al);blk.rotation.y=Math.atan2(fn.nx,fn.nz);blk.castShadow=true;worldGroup.add(blk);
    const fb={...fn,mx:fn.mx+fn.nx*1.4,mz:fn.mz+fn.nz*1.4};
    clubSign(fb,5.5,1.1,al,4.4,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);signText(g,'VAISTINĖ',w/2,h/2,150,'#2d9a3c');});
    clubSign(fb,bw-1,2.4,al,1.3,(g,w,h)=>{g.fillStyle='#26343b';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=w/6){g.fillStyle='#3f5560';g.fillRect(x+10,12,w/6-20,h-12);}});
  }
  // a crowd in the club's car park after dark: two fights and people standing round them
  const cx=f.mx+f.nx*10,cz=f.mz+f.nz*10,people=[],SH=[0x1b1b1f,0x8a1c1c,0xd8d8d8,0x2a3a6a,0x3f4a3a,0x6a4b8c,0x111111,0xb0b4b8];
  const grp=new THREE.Group();worldGroup.add(grp);grp.visible=false;
  const add=(x,z,h,role,ph,i)=>{const m=clubPerson(SH[i%SH.length]);grp.add(m);people.push({m,x,z,h,role,ph,ox:0,oz:0,run:0});};
  const side=[f.ux,f.uz];
  [[-1.6,0],[1.8,1]].forEach(([s,k])=>{const x=cx+side[0]*s,z=cz+side[1]*s,h=Math.atan2(f.nx,f.nz);
    add(x-f.nx*.55,z-f.nz*.55,h,'fight',k*1.7,k*2);add(x+f.nx*.55,z+f.nz*.55,h+Math.PI,'fight',k*1.7+1.3,k*2+1);});
  for(let i=0;i<6;i++){const a=i/6*TAU+.4,x=cx+Math.cos(a)*4.2,z=cz+Math.sin(a)*3.4;add(x,z,Math.atan2(cx-x,cz-z),'watch',i*.9,i+4);}
  club={x:cx,z:cz,grp,people,neon,told:false};
}
function updateClub(dt){
  if(!club)return;
  const night=ENV.night.value,d=Math.hypot(club.x-player.x,club.z-player.z),on=night>.55&&d<320;
  club.neon.material.color.setScalar(.45+.55*night);
  club.grp.visible=on;if(!on){if(night<.3)club.told=false;return;}
  if(!club.told&&d<45){club.told=true;toast('Muštynės prie L klubo','Geriau nesikišk.');}
  const t=ENV.t.value,car=player.mode==='car'?player.car:null;
  for(const p of club.people){
    const x=p.x+p.ox,z=p.z+p.oz,dp=Math.hypot(x-player.x,z-player.z);
    // a car coming at them scatters everyone; they drift back once it has gone
    if(car&&Math.abs(car.speed)>3&&dp<9){const k=1/(dp||1);p.vx=(x-player.x)*k;p.vz=(z-player.z)*k;p.run=2.2;}
    if(p.run>0){p.run-=dt;p.ox+=p.vx*5.5*dt;p.oz+=p.vz*5.5*dt;}else{p.ox*=1-Math.min(1,dt*.5);p.oz*=1-Math.min(1,dt*.5);}
    const X=p.x+p.ox,Z=p.z+p.oz,m=p.m,[aL,aR]=m.userData.arms;
    m.position.set(X,GY(X,Z),Z);
    if(p.run>0){m.rotation.y=Math.atan2(p.vx,p.vz);const s=Math.sin(t*12);aL.rotation.x=s;aR.rotation.x=-s;continue;}
    m.rotation.y=p.h;
    if(p.role==='fight'){const a=Math.max(0,Math.sin(t*5.5+p.ph)),b=Math.max(0,Math.sin(t*5.5+p.ph+Math.PI));
      aL.rotation.x=-.6-1.0*a;aR.rotation.x=-.6-1.0*b;m.position.x+=Math.sin(p.h)*.12*(a+b);m.position.z+=Math.cos(p.h)*.12*(a+b);m.rotation.z=.08*Math.sin(t*3+p.ph);}
    else{m.position.y+=.05*Math.abs(Math.sin(t*5+p.ph));aL.rotation.x=0;aR.rotation.x=Math.sin(t*2+p.ph)>.3?-2.7:-.2;}
  }
}
