// ---------- town: Soviet blocks, church windows, house yards ----------
function buildTown(){
  const W=world,unit=new THREE.BoxGeometry(1,1,1),cc=new THREE.Color(),L={},CB={};
  const put=(k,b)=>(L[k]||(L[k]=[])).push(b),putC=(k,col,b)=>(CB[k]||(CB[k]=[])).push([b,col]);
  const segDist=(x,z,s)=>{const dx=s[2]-s[0],dz=s[3]-s[1],l2=dx*dx+dz*dz||1,t=clamp(((x-s[0])*dx+(z-s[1])*dz)/l2,0,1),px=s[0]+dx*t,pz=s[1]+dz*t;return[Math.hypot(x-px,z-pz),px,pz,dx/Math.sqrt(l2),dz/Math.sqrt(l2)];};
  const nearSeg=(x,z,maxCls,only)=>{let best=null;for(const s of W.roadSegs(x,z)){if(s[4].cls>maxCls||(only&&s[4]!==only))continue;const d=segDist(x,z,s);if(!best||d[0]<best[0])best=[...d,s[4]];}return best;};
  const onRoad=(x,z,m)=>W.roadSegs(x,z).some(s=>segDist(x,z,s)[0]<s[4].w/2+m);
  const centre=p=>{let x=0,z=0;for(const q of p){x+=q[0]/p.length;z+=q[1]/p.length;}return[x,z];};
  // one wall of an outline: start, unit direction along it, outward normal, length, box heading (local x out, local z along)
  const side=(p,i,c)=>{const a=p[i%p.length],b=p[(i+1)%p.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/l,uz=(b[1]-a[1])/l;
    let nx=uz,nz=-ux;if(((a[0]+b[0])/2-c[0])*nx+((a[1]+b[1])/2-c[1])*nz<0){nx=-nx;nz=-nz;}
    return{a,ux,uz,nx,nz,l,hd:Math.atan2(ux,uz),at:(s,o)=>[a[0]+ux*s+nx*o,a[1]+uz*s+nz*o]};};

  // a bench facing out from wall w at distance t along it, o out from it
  const bench=(w,t,o)=>{const [bx,bz]=w.at(t,o),[kx,kz]=w.at(t,o-.2),g=GY(bx,bz);put('seat',[bx,g+.45,bz,w.hd,.42,.07,1.7]);put('seat',[kx,g+.7,kz,w.hd,.06,.4,1.7]);
    for(const q of[-.7,.7]){const [lx,lz]=w.at(t+q,o);put('iron',[lx,g+.22,lz,w.hd,.42,.45,.08]);}addWall(...w.at(t-.85,o-.2),...w.at(t+.85,o-.2));};

  // Žemaičio aikštė: benches on the paving round each lawn, the ones on the cut corners facing the monument
  const SQ=typeof sqLayout==='function'&&sqLayout(q=>LL(q[0],q[1]));
  if(SQ)for(const l of SQ.lawns){const c=centre(l);
    for(const i of[4,0,3]){const w=side(l,i,c);if(i===4){bench(w,w.l*.3,.8);bench(w,w.l*.7,.8);}else for(let t=3;t<=w.l-3;t+=9)bench(w,t,.8);}}

  // five-storey blocks: loggia columns on one long side, stairwells with doors on the side facing the road
  const CONC=[.72,.72,.69],PARA=[[.74,.74,.71],[.80,.79,.75],[.62,.58,.52],[.86,.86,.84]],GLASS=[.62,.69,.72],FRAME=[.93,.93,.91];
  // a wall of one part may face another part or a neighbour: features go only where the outside is open
  const open=(w,t,o)=>!W.inBuilding(...w.at(t,o));
  for(const b of W.buildings)for(const [p,s] of b.blks||[]){
    const c=centre(p),top=s.y0+s.h,v1=Math.max(1,Math.round((top-s.yb)/3)),fh=(top-s.yb)/v1,wc=s.wall.map(v=>v*.93);
    const S=[0,1,2,3].map(i=>side(p,i,c)),o=S[0].l>=S[1].l?0:1;
    const roadD=w=>{const [x,z]=w.at(w.l/2,0),n=nearSeg(x,z,2);return n?n[0]:1e9;};
    const F=roadD(S[o])<=roadD(S[o+2])?S[o]:S[o+2],B=F===S[o]?S[o+2]:S[o];
    // end walls of these blocks are blank brick
    for(const e of[S[o+1],S[(o+3)%4]]){if(!open(e,e.l/2,1.5))continue;const [x,z]=e.at(e.l/2,.04);putC('wall',wc,[x,s.yb+(top-s.yb)/2,z,e.hd,.08,top-s.yb-.05,e.l+.12]);}
    const u1=Math.max(1,Math.round(B.l/3.2)),bw=B.l/u1,seed=p[0][0]*.71+p[0][1]*.13;
    for(let j=0;j<u1;j++){if(j%3===1||hash(seed+j*1.7)>.85||!open(B,(j+.5)*bw,2))continue;
      for(let k=1;k<v1;k++){const y=s.yb+k*fh,d=1.15,[x,z]=B.at((j+.5)*bw,d/2),[xo,zo]=B.at((j+.5)*bw,d-.06),[xg,zg]=B.at((j+.5)*bw,d-.1);
        put('slab',[x,y+.07,z,B.hd,d,.14,bw*.94]);if(k===v1-1)put('slab',[x,y+fh-.07,z,B.hd,d,.14,bw*.94]);
        putC('para',PARA[Math.floor(hash(seed+j*3.1)*PARA.length)],[xo,y+.64,zo,B.hd,.1,1,bw*.92]);
        for(const sg of[-1,1]){const [fx,fz]=B.at((j+.5)*bw+sg*bw*.46,d/2);putC('wall',wc,[fx,y+fh/2,fz,B.hd,d,fh,.14]);}
        if(hash(seed+j*5.3+k*.71)<.7){const gh=fh-1.32;put('glass',[xg,y+1.14+gh/2,zg,B.hd,.05,gh,bw*.86]);
          for(const t of[-1/6,1/6]){const [mx,mz]=B.at((j+.5+t)*bw,d-.08);put('frame',[mx,y+1.14+gh/2,mz,B.hd,.07,gh,.07]);}}}}
    const ns=Math.max(1,Math.round(F.l/20)),uf=Math.max(1,Math.round(F.l/3.2)),fw=F.l/uf;
    for(let i=0;i<ns;i++){const t=(Math.floor((i+.5)*uf/ns)+.5)*fw,[x,z]=F.at(t,.05),g=GY(x,z);if(!open(F,t,2))continue;
      putC('wall',wc,[x,s.yb+(top-s.yb)/2,z,F.hd,.1,top-s.yb-.4,fw*.9]);
      for(let k=1;k<v1;k++){const [wx,wz]=F.at(t,.12);put('glass',[wx,s.yb+k*fh+.1,wz,F.hd,.05,1.05,.95]);}
      const [dx,dz]=F.at(t,.12);put(hash(seed+i)<.5?'door':'doorS',[dx,g+.35+1.08,dz,F.hd,.14,2.15,1.3]);
      const [cx,cz]=F.at(t,.8),[sx,sz]=F.at(t,.85);put('slab',[cx,g+.35+2.5,cz,F.hd,1.5,.14,2.4]);put('step',[sx,g+.02,sz,F.hd,1.6,.66,2.4]);
      if(hash(seed+i*2.3)<.6)bench(F,t+2.6,2);}
    // glass, plastic and paper bells by the end of the block on the road side
    const [rx,rz]=F.at(-4,6);if(!W.inBuilding(rx,rz)&&!onRoad(rx,rz,1)){const g=GY(rx,rz);
      ['bellG','bellY','bellB'].forEach((k,q)=>{const [x,z]=[rx+F.ux*q*1.9,rz+F.uz*q*1.9];put(k,[x,g+.75,z,0,1,1,1]);addWall(x-.8,z,x+.8,z);});}}

  // churches: arched windows above, small square ones below, as on the Ėmimo į Dangų church front
  for(const b of W.buildings){const s=b.sp;if(!s||Math.abs(polyArea(b.pts))<80)continue;
    const c=centre(b.pts),tall=s.h>=8;
    for(let i=0;i<b.pts.length;i++){const e=side(b.pts,i,c),n=Math.floor(e.l/4.2);if(n<1)continue;const gp=(e.l-n*4.2)/2+2.1;
      for(let k=0;k<n;k++){const [x,z]=e.at(gp+k*4.2,.06),y=s.y0+s.h*(tall?.6:.45);
        if(W.inBuilding(...e.at(gp+k*4.2,.6)))continue;
        put('chWin',[x,y,z,e.hd,.1,2.1,1.2]);put('chArch',[x,y+1.05,z,e.hd,.6,.1,.6,Math.PI/2]);
        if(tall)put('chWin',[x,s.y0+2.1,z,e.hd,.1,1.2,.9]);}}}

  // house yards: a driveway through the fence gap (a path when the house stands right behind it), cars, vegetable beds behind
  const YD=arr(),cars=[],beds=[],done=new Set();
  const quad=(a,b,w,y,col)=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<.2)return;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L,rx=-uz*w/2,rz=ux*w/2,n=Math.ceil(L/4);
    for(let i=0;i<n;i++){const p=[a[0]+ux*L*i/n,a[1]+uz*L*i/n],q=[a[0]+ux*L*(i+1)/n,a[1]+uz*L*(i+1)/n];
      flatTri(YD,p[0]-rx,p[1]-rz,p[0]+rx,p[1]+rz,q[0]+rx,q[1]+rz,y,col);flatTri(YD,p[0]-rx,p[1]-rz,q[0]+rx,q[1]+rz,q[0]-rx,q[1]-rz,y,col);}};
  const yard=(b,gx,gz,ns)=>{
    if(!ns||done.has(b)||b.look)return;done.add(b);const r=ns[5],ux=(gx-ns[1])/(ns[0]||1),uz=(gz-ns[2])/(ns[0]||1);
    const hs=hash(b.mnx*.37+b.mnz*1.3),start=[ns[1]+ux*(r.w/2-.3),ns[2]+uz*(r.w/2-.3)];
    let run=0;while(run<14&&!W.inBuilding(gx+ux*(run+1.2),gz+uz*(run+1.2)))run+=.5;
    if(run<1)return;
    const end=[gx+ux*run,gz+uz*run],path=run<4;
    for(let t=.2;t<.95;t+=.15)if(W.inBuilding(start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t))return;
    quad(start,end,path?1.3:2.8,.03,path?[.6,.58,.55]:hs<.5?[.58,.54,.46]:hs<.8?[.55,.53,.5]:[.42,.42,.41]);
    if(!path&&run>6&&hash(hs*9.1)<.4){const [x,z]=[gx+ux*3.4,gz+uz*3.4];
      cars.push([x,GY(x,z),z,Math.atan2(ux,uz),CAR_COLORS[Math.floor(hash(hs*5.3)*CAR_COLORS.length)]]);
      const k=[[-2.15,-.9],[2.15,-.9],[2.15,.9],[-2.15,.9]].map(([a,q])=>[x+ux*a-uz*q,z+uz*a+ux*q]);for(let i=0;i<4;i++)addWall(...k[i],...k[(i+1)%4]);}
    // the bed sits behind the house, away from the road, where nothing else stands
    if(hash(hs*3.7)>.5)return;
    let back=0;for(const q of b.pts)back=Math.max(back,(q[0]-gx)*ux+(q[1]-gz)*uz);
    const gl=6+hash(hs*2.1)*6,gw=4+hash(hs*4.3)*4,m=back+2.5+gl/2,cx=gx+ux*m,cz=gz+uz*m;
    const C=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,q])=>[cx+ux*a*gl/2-uz*q*gw/2,cz+uz*a*gl/2+ux*q*gw/2]);
    if([...C,[cx,cz]].some(q=>W.inBuilding(q[0],q[1])||onRoad(q[0],q[1],1.5))||beds.some(o=>Math.hypot(o[0]-cx,o[1]-cz)<o[2]+Math.max(gl,gw)/2+1))return;
    beds.push([cx,cz,Math.max(gl,gw)/2]);
    flatTri(YD,...C[0],...C[1],...C[2],.028,[.31,.24,.17]);flatTri(YD,...C[0],...C[2],...C[3],.028,[.31,.24,.17]);
    const green=hash(hs*6.6)<.55;
    for(let t=-gw/2+.5;t<=gw/2-.4;t+=.75){const a=[cx-ux*(gl/2-.4)-uz*t,cz-uz*(gl/2-.4)+ux*t],e=[cx+ux*(gl/2-.4)-uz*t,cz+uz*(gl/2-.4)+ux*t];
      quad(a,e,green?.34:.22,.033,green?[.27+hash(t*3+hs)*.06,.42,.2]:[.24,.18,.13]);}};
  for(const [gx,gz,b,r] of W.gaps||[])yard(b,gx,gz,nearSeg(gx,gz,2,r));
  for(const b of W.buildings){if(b.kind!=='house'||done.has(b))continue;const [x,z]=centre(b.pts),ns=nearSeg(x,z,2);if(!ns||ns[0]>28)continue;
    const ux=(x-ns[1])/ns[0],uz=(z-ns[2])/ns[0],o=ns[5].w/2+1.6;yard(b,ns[1]+ux*o,ns[2]+uz*o,[o,ns[1],ns[2],0,0,ns[5]]);}
  if(YD.pos.length){W.sinkGround(YD);const mat=new THREE.MeshLambertMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});mat.onBeforeCompile=grainShader;
    const m=new THREE.Mesh(mkGeo(YD.pos,YD.col,YD.nor),mat);m.receiveShadow=true;worldGroup.add(m);}
  if(cars.length)addParkedCars(cars); // real car bodies, from add_views (cv25+)

  const C={slab:0xb8b8b2,glass:0x9fb0b6,frame:0xecece8,door:0x5a3b2a,doorS:0x6d7275,step:0xa9a9a3,seat:0x7a5a3c,iron:0x2f3236,chWin:0x2f3a44,chArch:0x2f3a44};
  for(const k in L){if(k.startsWith('bell'))continue;const m=instances(k==='chArch'?new THREE.CylinderGeometry(1,1,1,14):unit,C[k],L[k]);if(k==='glass'||k==='chWin'||k==='chArch')m.castShadow=false;}
  const bell=new THREE.CylinderGeometry(.62,.8,1.5,12);
  for(const [k,col] of[['bellG',0x3f9a3a],['bellY',0xe2b500],['bellB',0x2f6db3]])if(L[k])instances(bell,col,L[k]);
  for(const k in CB){const m=instances(unit,0xffffff,CB[k].map(q=>q[0]));CB[k].forEach(([,c],i)=>m.setColorAt(i,cc.setRGB(c[0],c[1],c[2])));m.instanceColor.needsUpdate=true;}
}
