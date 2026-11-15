// ---------- cars3: European fleet rebuilt from side, front and rear references ----------
// buildCar3(M) lofts one model from its own side profile (pipeline/cars3/*.js, see the README there) into the cars2 fleet
// shape {paint, trim, lamps, wheel, axles, track, r, lot}, so cars2's makeCarMesh, wheel instancing, police and parked
// paths draw it unchanged. Car frame: +z nose, +x right, y up from the ground; u in the tables runs rearward from the front axle.
function buildCar3(M){
  const L=()=>({p:[],n:[],c:[]}),paint=L(),trim=L(),lamps=L(),wheel=L();
  const COL={P:[1,1,1],b:[.035,.035,.04],p:[.12,.12,.13],g:[.3,.31,.32],c:[.78,.8,.82],w:[.93,.93,.9],G:[.13,.17,.2],a:[.86,.36,.07],
    x:[.62,.63,.62],r:[.45,.04,.05],h:[.96,.95,.88],t:[.85,.07,.06],u:[.1,.2,.6],k:[.08,.08,.09],m:[.55,.56,.58]};
  const list=k=>k==='P'?paint:k==='h'||k==='t'?lamps:trim;
  const tri=(l,a,b,c,na,nb,nc,col)=>{
    const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],f=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    if(f[0]*f[0]+f[1]*f[1]+f[2]*f[2]<1e-12)return;
    const flip=f[0]*(na[0]+nb[0]+nc[0])+f[1]*(na[1]+nb[1]+nc[1])+f[2]*(na[2]+nb[2]+nc[2])<0;
    for(const[q,w]of flip?[[a,na],[c,nc],[b,nb]]:[[a,na],[b,nb],[c,nc]]){l.p.push(...q);l.n.push(...w);l.c.push(...col);}
  };
  const mir=q=>[-q[0],q[1],q[2]];
  const quad=(l,A,B,C,D,na,nb,nc,nd,col,both=true)=>{tri(l,A,B,C,na,nb,nc,col);tri(l,A,C,D,na,nc,nd,col);
    if(both){tri(l,mir(A),mir(B),mir(C),mir(na),mir(nb),mir(nc),col);tri(l,mir(A),mir(C),mir(D),mir(na),mir(nc),mir(nd),col);}};
  const lerp=(a,b,t)=>a+(b-a)*t,cl=(v,a,b)=>v<a?a:v>b?b:v;
  const at=(pl,u)=>{if(u<=pl[0][0])return pl[0][1];for(let i=1;i<pl.length;i++)if(u<=pl[i][0]){const[a,y0]=pl[i-1],[b,y1]=pl[i];return b>a?y0+(y1-y0)*(u-a)/(b-a):y1;}return pl[pl.length-1][1];};
  const WID=M.dims[1],LEN=M.top[M.top.length-1][0]+M.fo,u0=-M.fo,u1=LEN-M.fo,zA=LEN/2-M.fo,W2=WID/2,R=M.r,AX=[0,M.wb],AR=R+.055;
  const[df,wf,dr,wr]=M.plan;
  const hwAt=u=>{const a=u-u0,b=u1-u;let w=W2;if(a<df)w-=wf*(1-Math.sqrt(1-(1-a/df)**2));if(b<dr)w-=wr*(1-Math.sqrt(1-(1-b/dr)**2));return w;};
  // half section at u: p0 floor centre … p5 belt … p7 roof edge … p9 roof centre
  const sec=u=>{
    const hw=hwAt(u),yb=at(M.bot,u),yT=at(M.top,u),yB=Math.min(at(M.belt,u),yT),gh=yT-yB,k=cl(gh/.3,0,1),rx=hw*lerp(.93,M.tum,k),s=yB-yb;
    // p1-p3 become the wheel well (inner wall, roof) where an arch is cut
    const P=[[0,yb],[hw*.9,yb],[hw*.985,yb+Math.min(.08,s*.3)],[hw,yb+s*.45],[hw*.99,yB-Math.min(.05,s*.2)],[hw*.955,yB]];
    const E=[rx,yT-Math.min(.06,gh*.25)];
    P.push([lerp(P[5][0],E[0],.06),lerp(P[5][1],E[1],.06)],E,[rx*.55,yT-.004-.012*k],[0,yT]);
    for(const a of AX){const d=u-a;if(Math.abs(d)<=AR+1e-6){const ya=Math.abs(d)>=AR-1e-6?yb:R+Math.sqrt(AR*AR-d*d);if(ya>=yb){P[1]=[hw*.62,yb];P[2]=[hw*.62,ya];P[3]=[hw*.985,ya];P[4][1]=Math.max(P[4][1],ya+.02);}}}
    return P;};
  const secX=(u,y)=>{const P=sec(u);let x=-1;for(let j=1;j<P.length-1;j++){const[a,b]=[P[j],P[j+1]];if((y-a[1])*(y-b[1])<=0&&a[1]!==b[1])x=Math.max(x,a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]));}return x;};
  // stations: every table breakpoint, .15 m apart in between, .06 m over the arches, a flat well just inside each arch end
  const S=new Set([u0,u1]);for(const pl of[M.top,M.bot,M.belt])for(const[u]of pl)S.add(u);for(const v of[...M.ws,...M.rw])S.add(v);
  for(let u=u0;u<u1;u+=.15)S.add(+u.toFixed(3));
  for(const a of AX){for(let d=-AR;d<=AR+1e-6;d+=AR/6)S.add(+(a+d).toFixed(4));S.add(+(a-AR-.005).toFixed(4));S.add(+(a+AR+.005).toFixed(4));}
  const U=[...S].filter(u=>u>=u0&&u<=u1).sort((a,b)=>a-b).filter((u,i,A)=>!i||u-A[i-1]>.004);
  const st=U.map(u=>sec(u).map(([x,y])=>[x,y,zA-u]));
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const nor=(i,j)=>{
    const pick=(di,dj)=>{for(let s=1;s<4;s++){const a=st[cl(i+di*s,0,st.length-1)][cl(j+dj*s,0,9)],b=st[cl(i-di*s,0,st.length-1)][cl(j-dj*s,0,9)],d=sub(a,b);if(Math.hypot(...d)>1e-4)return d;}return di?[0,0,-1]:[0,1,0];};
    // stations run rearward and each section runs from the floor round to the roof, so this cross product points out
    const a=pick(1,0),b=pick(0,1),n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],m=Math.hypot(...n)||1;return[n[0]/m,n[1]/m,n[2]/m];};
  const inZ=(u,r)=>u>=r[0]&&u<=r[1];
  for(let i=0;i<st.length-1;i++){const um=(U[i]+U[i+1])/2,glass=inZ(um,M.ws)||inZ(um,M.rw);
    for(let j=0;j<9;j++){
      const well=st[i][1][0]<st[i][4][0]*.7||st[i+1][1][0]<st[i+1][4][0]*.7;let k=j===0||well&&j<3?'b':'P';
      if(j>=7&&glass)k='G';if(j===6&&M.pillar==='b'&&inZ(um,[M.ws[1],M.rw[0]]))k='b';
      // winding follows the quad's own outward face; a smoothed normal that disagrees with it (at the arch edges) is dropped
      const A=st[i][j],B=st[i+1][j],C=st[i+1][j+1],D=st[i][j+1],u=sub(C,A),v=sub(D,B),f=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const fit=n=>n[0]*f[0]+n[1]*f[1]+n[2]*f[2]<0?f:n;
      quad(list(k),A,B,C,D,fit(nor(i,j)),fit(nor(i+1,j)),fit(nor(i+1,j+1)),fit(nor(i,j+1)),COL[k],true);}}
  for(const[i,d]of[[0,1],[st.length-1,-1]]){const s=st[i],n=[0,0,d];for(let j=0;j<9;j++)quad(paint,s[j],s[j+1],mir(s[j+1]),mir(s[j]),n,n,n,n,COL.P,false);}
  // the outer skin at (u,y) and its outward normal, for overlays on the sides
  const side=(u,y,e=.008)=>{const c=(u0+u1)/2;for(let n=0;n<60&&secX(u,y)<0;n++)u+=(c-u)*.05;
    y=archY(u,y);const P=sec(u);if(y>P[5][1])y=Math.min(y,P[7][1]-.004);const x=secX(u,y),dx=secX(u,y+.02)-secX(u,y-.02),m=Math.hypot(.04,dx);return[[x+e*.04/m,y,zA-u],[.04/m,-dx/m,0]];};
  // a flat 2D polygon laid onto the skin: fan triangles split until no edge is over .3 m, each corner mapped by f(a,b)->[pos,normal]
  const drape=(pts,f,k,both)=>{const l=list(k),c=COL[k],go=(A,B,C)=>{const d=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]),m=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];
      if(Math.max(d(A,B),d(B,C),d(C,A))>.3){const a=m(A,B),b=m(B,C),e=m(C,A);go(A,a,e);go(a,B,b);go(e,b,C);go(a,b,e);return;}
      const[P,Q,R]=[A,B,C].map(q=>f(q[0],q[1]));quad(l,P[0],Q[0],R[0],R[0],P[1],Q[1],R[1],R[1],c,both);};
    for(let i=1;i<pts.length-1;i++)go(pts[0],pts[i],pts[i+1]);};
  // a side overlay reaching into a wheel arch is lifted out of it, and dropped if that turns it inside out
  const archY=(u,y)=>{for(const a of AX){const d=u-a;if(Math.abs(d)<AR)y=Math.max(y,R+Math.sqrt(AR*AR-d*d)+.03);}return y;};
  const sidePoly=(pts,k,e)=>{const q=pts.map(([u,y])=>[u,archY(u,y)]);let A=0;for(let i=0;i<q.length;i++){const[a,b]=q[i],[c,d]=q[(i+1)%q.length];A+=a*d-c*b;}
    let A0=0;for(let i=0;i<pts.length;i++){const[a,b]=pts[i],[c,d]=pts[(i+1)%pts.length];A0+=a*d-c*b;}
    if(A*A0>1e-8)drape(q,(u,y)=>side(u,y,e),k,true);};
  // the outer skin seen from the nose (d=1) or tail (d=-1) at (x,y)
  const endZ=(x,y,d)=>{const s=d>0?u0:u1,dir=d>0?1:-1;let u=s,xm=0;
    for(let n=0;n<80;n++){const v=s+dir*n*.01;if(y>=at(M.bot,v)&&y<=at(M.top,v))xm=Math.max(xm,secX(v,y));}
    x=Math.min(Math.abs(x),xm*.985);
    for(let n=0;n<400;n++,u+=dir*.01){if(y>=at(M.bot,u)-1e-3&&y<=at(M.top,u)+1e-3&&secX(u,y)>=Math.abs(x))break;}
    for(let n=0;n<6;n++){const v=u-dir*.01/(2<<n);if(y>=at(M.bot,v)&&y<=at(M.top,v)&&secX(v,y)>=Math.abs(x))u=v;}
    return[x,zA-u];};
  const circ=(x,y,r,n=12)=>Array.from({length:n},(_,i)=>[x+Math.cos(i/n*TAU)*r,y+Math.sin(i/n*TAU)*r]);
  // points past the body's edge at that height are pulled in onto it
  const endPoly=(pts,k,d,both,e=.008)=>drape(pts,(x,y)=>{const[w,z]=endZ(x,y,d);return[[Math.sign(x)*w,y,z+d*e],[0,0,d]];},k,both);
  const endItem=(it,d,lift=0)=>{
    const e=.008+lift*.004,both=it.m!==0;
    if(it.p)endPoly(it.p,it.c,d,both,e);
    if(it.o)endPoly(circ(...it.o),it.c,d,both,e);
    if(it.a){const[x,y,r,w]=it.a,n=12,o=circ(x,y,r,n),q=circ(x,y,r-w,n);for(let i=0;i<n;i++)endPoly([o[i],o[(i+1)%n],q[(i+1)%n],q[i]],it.c,d,both,e);}
    if(it.plate!=null){const y=it.plate,P=(x0,x1,y0,y1,k,l)=>endItem({p:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],c:k,m:0},d,l);
      P(-.268,.268,y-.004,y+.114,'b',1);P(-.26,.26,y,y+.11,'w',2);P(-.26,-.22,y,y+.11,'u',3);
      for(let i=0;i<7;i++)if(i!==3)P(-.2+i*.064,-.155+i*.064,y+.02,y+.09,'k',3);}
  };
  for(const it of M.face)endItem(it,1,it.l||0);
  for(const it of M.tail)endItem(it,-1,it.l||0);
  for(const w of M.wins)sidePoly(w,'G',.006);
  for(const b of M.bands||[])sidePoly(b.p,b.c,b.e||.01);
  // mirrors: [u, y, colour]
  if(M.mirror){const[u,y,k]=M.mirror,x0=secX(u,y)-.02,z=zA-u,l=list(k),c=COL[k];
    const bx=(a,b,y0,y1,z0,z1)=>{const P=(x,yy,zz)=>[x,yy,zz],sq=(A,B,C,D,n)=>quad(l,A,B,C,D,n,n,n,n,c,true);
      sq(P(b,y0,z0),P(b,y1,z0),P(b,y1,z1),P(b,y0,z1),[1,0,0]);sq(P(a,y1,z0),P(b,y1,z0),P(b,y1,z1),P(a,y1,z1),[0,1,0]);
      sq(P(a,y0,z1),P(b,y0,z1),P(b,y1,z1),P(a,y1,z1),[0,0,1]);sq(P(a,y0,z0),P(b,y0,z0),P(b,y1,z0),P(a,y1,z0),[0,0,-1]);sq(P(a,y0,z0),P(b,y0,z0),P(b,y0,z1),P(a,y0,z1),[0,-1,0]);};
    bx(x0,x0+.17,y,y+.1,z-.1,z+.02);}
  // roof rails [uFront, uRear, colour]
  if(M.rails){const[a,b,k]=M.rails;for(let u=a;u<b-1e-6;u+=(b-a)/4){const v=u+(b-a)/4,y0=at(M.top,u),y1=at(M.top,v),x0=sec(u)[7][0]*.88,x1=sec(v)[7][0]*.88,n=[0,1,0],s=[1,0,0];
    quad(trim,[x0-.02,y0+.04,zA-u],[x0+.02,y0+.04,zA-u],[x1+.02,y1+.04,zA-v],[x1-.02,y1+.04,zA-v],n,n,n,n,COL[k]);
    quad(trim,[x0+.02,y0+.015,zA-u],[x0+.02,y0+.04,zA-u],[x1+.02,y1+.04,zA-v],[x1+.02,y1+.015,zA-v],s,s,s,s,COL[k]);
    const w=[-1,0,0],dn=[0,-1,0];quad(trim,[x0-.02,y0+.015,zA-u],[x0-.02,y0+.04,zA-u],[x1-.02,y1+.04,zA-v],[x1-.02,y1+.015,zA-v],w,w,w,w,COL[k]);
    quad(trim,[x0-.02,y0+.015,zA-u],[x0+.02,y0+.015,zA-u],[x1+.02,y1+.015,zA-v],[x1-.02,y1+.015,zA-v],dn,dn,dn,dn,COL[k]);}
    for(const[uu,nz]of[[a,1],[b,-1]]){const n=[0,0,nz],z=zA-uu,yy=at(M.top,uu),xx=sec(uu)[7][0]*.88;
      quad(trim,[xx-.02,yy+.015,z],[xx+.02,yy+.015,z],[xx+.02,yy+.04,z],[xx-.02,yy+.04,z],n,n,n,n,COL[k]);}}
  // spare wheel on the tailgate [y, radius, depth]
  if(M.spare){const[y,r,dp]=M.spare,z0=zA-u1+.005,z1=z0-dp,n=14,b=[0,0,-1];
    for(let i=0;i<n;i++){const a=i/n*TAU,c=(i+1)/n*TAU,P=(rr,a,z)=>[Math.cos(a)*rr,y+Math.sin(a)*rr,z],s=[Math.cos(a),Math.sin(a),0],t=[Math.cos(c),Math.sin(c),0];
      quad(trim,P(r,a,z0),P(r,c,z0),P(r,c,z1),P(r,a,z1),s,t,t,s,COL.p,false);
      quad(trim,P(r,a,z1),P(r,c,z1),P(r*.72,c,z1),P(r*.72,a,z1),b,b,b,b,COL.p,false);
      quad(trim,P(r*.72,a,z1),P(r*.72,c,z1),[0,y,z1],[0,y,z1],b,b,b,b,COL.g,false);}}
  // glass darkens towards the belt and picks up the sky higher up (same ramp as the procedural cars)
  for(const l of[trim])for(let i=0;i<l.c.length;i+=3)if(l.c[i]===COL.G[0]&&l.c[i+1]===COL.G[1]&&l.c[i+2]===COL.G[2]){
    const k=cl((l.p[i+1]-.95)/.45,0,1);l.c[i]=.09+k*.33;l.c[i+1]=.12+k*.38;l.c[i+2]=.15+k*.41;}
  // wheel on its hub, outer face +x
  {const N=16,TW=M.tw||.2,h=TW/2,rim=M.rim==='steel'?[.32,.33,.34]:[.72,.73,.74],rr=R-.085;
    for(let i=0;i<N;i++){const a=i/N*TAU,b=(i+1)/N*TAU,s=[Math.cos(a),Math.sin(a)],e=[Math.cos(b),Math.sin(b)],P=(x,r,q)=>[x,q[0]*r,q[1]*r],sx=[1,0,0],bx=[-1,0,0];
      const ann=(x,r0,r1,col,n=sx)=>quad(wheel,P(x,r0,s),P(x,r0,e),P(x,r1,e),P(x,r1,s),n,n,n,n,col,false);
      quad(wheel,P(-h,R,s),P(-h,R,e),P(h,R,e),P(h,R,s),[0,s[0],s[1]],[0,e[0],e[1]],[0,e[0],e[1]],[0,s[0],s[1]],i%2?[.06,.06,.065]:[.04,.04,.045],false);
      ann(h,R,rr,[.05,.05,.055]);ann(h+.002,rr,rr-.03,[rim[0]*.7,rim[1]*.7,rim[2]*.7]);
      ann(h+.004,rr-.03,.05,M.rim==='steel'?(i%4===0?[.2,.2,.21]:rim):(i%4<2?rim:[.12,.12,.13]));ann(h+.006,.05,.001,[.55,.56,.57]);
      ann(-h,R,.001,COL.b,bx);}}
  const geo=l=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(l.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(l.n,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(l.c,3));g.setIndex(Array.from({length:l.p.length/3},(_,i)=>i));g.userData.keep=true;return g;};
  const F={paint:geo(paint),trim:geo(trim),lamps:geo(lamps),wheel:geo(wheel),axles:[zA,zA-M.wb],track:M.track,r:R,glb:true,name:M.name,dims:M.dims};
  // parked twin: the four wheels baked into the trim
  const lt=L();for(const k of['p','n','c'])lt[k].push(...trim[k]);
  for(const z of F.axles)for(const s of[-1,1]){const p=wheel.p,n=wheel.n;for(let i=0;i<p.length;i+=3){lt.p.push(s*p[i]+s*M.track,p[i+1]+R,s*p[i+2]+z);lt.n.push(s*n[i],n[i+1],s*n[i+2]);}lt.c.push(...wheel.c);}
  F.lot={paint:F.paint,trim:geo(lt),axles:F.axles,glb:true};
  return F;
}
// ---- seam ----
// The fleet goes in behind cars2's seam: its models, wheel instancing, swap map, police and parked-car pick are replaced
// in place, so makeCarMesh, the parked2 meshes, police and every other system read these cars. The player's starting
// Audi 80 (carGeo) stays hand-built, as before.
const CARS3=(()=>{
  const S={models:{}};
  // traffic share per model, roughly the town's mix: estates and saloons first, one MPV, one SUV, one van
  const MIX={passat_b5:4,golf4:3,a6_c5:3,e39:2,e46:2,avensis:2,octavia3:2,zafira:1,rav4:1,t5:1};
  for(const F of CARS2.inst)scene.remove(F.inst);
  for(const k in MIX){const F=S.models[k]=buildCar3(CARS3_MODELS[k]);F.key=k;
    F.inst=new THREE.InstancedMesh(F.wheel,trimM,4*96);F.inst.count=0;F.inst.frustumCulled=false;F.inst.userData.keep=true;scene.add(F.inst);}
  const topAt=(F,z)=>{const p=F.paint.attributes.position.array;let y=0;for(let i=0;i<p.length;i+=3)if(Math.abs(p[i+2]-z)<.12&&Math.abs(p[i])<.35)y=Math.max(y,p[i+1]);return y;};
  const P=S.models.octavia3,police={...P,police:true,hood:topAt(P,1.6),roof:topAt(P,-.12)};
  const keys=Object.keys(MIX),weighted=keys.flatMap(k=>Array(MIX[k]).fill(S.models[k]));
  for(const[G,F]of CARS2.swap)CARS2.swap.set(G,F.police?police:S.models.passat_b5);
  TRAFFIC_GEOS.forEach(G=>{if(!G.glb)CARS2.swap.set(G,S.models.passat_b5);});
  CARS2.swap.set(skodaGeo,police);
  TRAFFIC_GEOS.splice(0,TRAFFIC_GEOS.length,...weighted);
  LOT_GEOS.splice(0,LOT_GEOS.length,...keys.map(k=>S.models[k].lot));
  Object.assign(CARS2,{models:S.models,inst:keys.map(k=>S.models[k]),police,on:true,
    lotPick:c=>keys.indexOf(weighted[Math.floor(hash(c[0]*.71+c[2]*1.37)*weighted.length)].key)});
  S.police=police;return S;
})();
