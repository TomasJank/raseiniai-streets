// ---------- water3: every pond and stream of the national cadastre (GRPK), flat at its own level, one matte surface ----------
// the cadastre outline replaces any hand-traced or OSM water it covers; islands are holes. WATER3 is injected by add_water3.py.
const WATER3=/*WATER3_DATA*/null,W3_COL=[.09,.16,.17];
const w3Fx={sun:{value:new THREE.Vector3()},col:{value:new THREE.Color()},wc:{value:new THREE.Color(0x1d4a4f)},nm:{value:null}};
let w3Bodies=[],w3Grid=new Map(),w3Foot=null,w3Dry=null;
// the matte look of the pond by the church: Fresnel over the sky, a scrolled normal map under the sun; no mirror render anywhere
{const N=128,d=new Uint8Array(N*N*4),h=(x,y)=>Math.sin(x*6.2832*3)+Math.sin(y*6.2832*4+1)+.6*Math.sin((x+y)*6.2832*7)+.4*Math.sin((x-2*y)*6.2832*11);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const e=1/N,gx=(h(x/N+e,y/N)-h(x/N-e,y/N))*.02,gy=(h(x/N,y/N+e)-h(x/N,y/N-e))*.02,l=Math.hypot(gx,gy,1),o=(y*N+x)*4;
    d[o]=(-gx/l*.5+.5)*255;d[o+1]=(-gy/l*.5+.5)*255;d[o+2]=(1/l*.5+.5)*255;d[o+3]=255;}
  const t=w3Fx.nm.value=new THREE.DataTexture(d,N,N);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
  const o=waterMat.onBeforeCompile;
  waterMat.onBeforeCompile=sh=>{o(sh);Object.assign(sh.uniforms,{uWSun:w3Fx.sun,uWSC:w3Fx.col,uWC:w3Fx.wc,uWN:w3Fx.nm});
    sh.fragmentShader=sh.fragmentShader.replace('varying vec2 vW;',`varying vec2 vW;
      uniform vec3 uWSun,uWSC,uWC;uniform sampler2D uWN;
      vec3 wNoise(vec2 p){float t=uT*.5;vec2 a=p/103.+vec2(t/17.,t/29.),b=p/107.+vec2(t/19.,-t/31.),c=p/vec2(8907.,9803.)+vec2(t/101.,t/97.),d=p/vec2(1091.,1027.)+vec2(-t/109.,t/113.);
        return (texture2D(uWN,a)+texture2D(uWN,b)+texture2D(uWN,c)+texture2D(uWN,d)).rgb*.5-1.;}`)
      .replace('#include <opaque_fragment>',`{
      vec3 sn=normalize((viewMatrix*vec4(normalize(wNoise(vW*.35).xzy*vec3(1.5,1.,1.5)),0.)).xyz),ev=normalize(vViewPosition),sl=normalize((viewMatrix*vec4(uWSun,0.)).xyz);
      float rf=.02+.98*pow(1.-max(dot(ev,sn),0.),5.);
      vec3 sp=pow(max(0.,dot(ev,normalize(reflect(-sl,sn)))),100.)*uWSC*2.;
      vec3 df=max(dot(sl,sn),0.)*uWSC*.5;
      outgoingLight=mix(uWSC*df*.3+max(0.,dot(sn,ev))*uWC,uSky+sp,rf);}
      #include <opaque_fragment>`);};
  waterMat.onBeforeRender=()=>{w3Fx.sun.value.copy(sun.position).sub(sun.target.position).normalize();w3Fx.col.value.copy(sun.color).multiplyScalar(.9);};
}
const w3Box=p=>{let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const q of p){x0=Math.min(x0,q[0]);z0=Math.min(z0,q[1]);x1=Math.max(x1,q[0]);z1=Math.max(z1,q[1]);}return[x0,z0,x1,z1];};
function w3In(b,x,z){
  if(!(x>b.bb[0]&&x<b.bb[2]&&z>b.bb[1]&&z<b.bb[3])||!pip(x,z,b.p))return false;
  for(let i=0;i<b.H.length;i++)if(pip(x,z,b.H[i]))return false;
  return true;
}
function w3Ring(a){const r=[];for(let i=0;i<a.length;i+=2)r.push([a[i],a[i+1]]);return r;}
// drops the triangles of a draped array whose centroid (or, with corners, any corner) satisfies hit(x,z)
function dropTris(A,hit,corners){
  const P=A.pos,C=A.col,N=A.nor;let w=0;
  for(let j=0;j<P.length;j+=9){
    if(hit((P[j]+P[j+3]+P[j+6])/3,(P[j+2]+P[j+5]+P[j+8])/3)||corners&&(hit(P[j],P[j+2])||hit(P[j+3],P[j+5])||hit(P[j+6],P[j+8])))continue;
    if(w!==j)for(let k=0;k<9;k++){P[w+k]=P[j+k];C[w+k]=C[j+k];N[w+k]=N[j+k];}
    w+=9;}
  P.length=C.length=N.length=w;
}
function water3Build(WA,GR,mm,W,GY){
  const nb=WATER3.b.map(rs=>({p:w3Ring(rs[0]),H:rs.slice(1).map(w3Ring)}));for(const b of nb)b.bb=w3Box(b.p);
  w3Index(nb);
  const covered=p=>{const[x0,z0,x1,z1]=w3Box(p),st=Math.max(2,Math.sqrt((x1-x0)*(z1-z0)/200));let n=0,k=0;
    for(let x=x0;x<x1;x+=st)for(let z=z0;z<z1;z+=st)if(pip(x,z,p)){n++;if(water3At(x,z))k++;}
    return n>0&&k>n/2;};
  const gone=mm.water.filter(covered);
  if(gone.length){dropTris(WA,(x,z)=>gone.some(p=>pip(x,z,p)));mm.water=mm.water.filter(p=>!gone.includes(p));W.ponds=W.ponds.filter(o=>!gone.includes(o.p));}
  for(const b of nb){
    const ys=[];for(const r of[b.p,...b.H])for(let i=0;i<r.length;i++){const a=r[i],c=r[(i+1)%r.length],n=Math.max(1,Math.ceil(Math.hypot(c[0]-a[0],c[1]-a[1])/6));for(let k=0;k<n;k++)ys.push(GY(a[0]+(c[0]-a[0])*k/n,a[1]+(c[1]-a[1])*k/n));}
    ys.sort((u,v)=>u-v);b.L=ys[ys.length*.25|0]+.04;
    const all=[...b.p,...b.H.flat()];let tris=[];
    try{tris=THREE.ShapeUtils.triangulateShape(b.p.map(q=>new THREE.Vector2(q[0],q[1])),b.H.map(r=>r.map(q=>new THREE.Vector2(q[0],q[1]))));}catch(e){}
    // split small enough that sinkGround samples every 24 m ground cell the sheet covers
    const put=(a,c,d)=>{const e=[Math.hypot(c[0]-a[0],c[1]-a[1]),Math.hypot(d[0]-c[0],d[1]-c[1]),Math.hypot(a[0]-d[0],a[1]-d[1])],m=Math.max(...e);
      if(m>12){const k=e.indexOf(m),[u,v,w]=[[a,c,d],[c,d,a],[d,a,c]][k],n=[(u[0]+v[0])/2,(u[1]+v[1])/2];put(u,n,w);put(n,v,w);return;}
      WA.pos.push(a[0],b.L,a[1],c[0],b.L,c[1],d[0],b.L,d[1]);for(let i=0;i<3;i++){WA.col.push(...W3_COL);WA.nor.push(0,1,0);}};
    for(const t of tris){let[a,c,d]=t.map(i=>all[i]);if((c[1]-a[1])*(d[0]-a[0])-(c[0]-a[0])*(d[1]-a[1])<0)[c,d]=[d,c];put(a,c,d);}
    mm.water.push(b.p);W.ponds.push({p:b.p,H:b.H});}
  // grass sheets follow the terrain and would cover a flat pond lying lower
  dropTris(GR,water3At,true);
  const old=mm.waterLines.map(l=>l.pts),nearOld=(x,z)=>old.some(l=>l.some((q,i)=>i&&Math.hypot(x-q[0],z-q[1])<7));
  // a stream drawn across a pond would show through it as a dark stripe: cut it where it enters
  const wet=(p,q)=>{const n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/6);for(let k=0;k<=n;k++)if(water3At(p[0]+(q[0]-p[0])*k/n,p[1]+(q[1]-p[1])*k/n))return true;return false;};
  for(const[w,a]of WATER3.s){const pts=w3Ring(a);if(pts.filter(q=>nearOld(q[0],q[1])).length>pts.length/2)continue;
    let run=[];const flush=()=>{if(run.length>1){ribbon(WA,run,w,.03,W3_COL);mm.waterLines.push({pts:run,w});}run=[];};
    for(let i=1;i<pts.length;i++){if(wet(pts[i-1],pts[i])){flush();continue;}if(!run.length)run.push(pts[i-1]);run.push(pts[i]);}flush();}
  // hand-traced outlines the cadastre does not cover stay as they were; every outline gets a flat level or keeps the draped sheet
  w3Index([...nb,...mm.water.filter(p=>!nb.some(b=>b.p===p)).map(p=>({p,H:(W.ponds.find(o=>o.p===p)||{H:[]}).H,bb:w3Box(p)}))]);
  W.w3=w3Bodies;
}
function w3Body(x,z){
  const l=w3Grid.get(Math.floor(x/64)*100000+Math.floor(z/64));
  if(l)for(let i=0;i<l.length;i++)if(w3In(w3Bodies[l[i]],x,z))return w3Bodies[l[i]];
  return null;
}
const water3At=(x,z)=>!!w3Body(x,z);
function w3Index(list){
  w3Bodies=list;w3Grid=new Map();
  list.forEach((b,i)=>{for(let x=Math.floor(b.bb[0]/64);x<=Math.floor(b.bb[2]/64);x++)for(let z=Math.floor(b.bb[1]/64);z<=Math.floor(b.bb[3]/64);z++){const k=x*100000+z;(w3Grid.get(k)||w3Grid.set(k,[]).get(k)).push(i);}});
}
// metres from (x,z) to the nearest bank; 0 on dry land. Streams under 8 m can be waded, as before.
function water3Depth(x,z){
  if(!inWater(x,z))return 0;
  let d=0;const b=w3Body(x,z);
  if(b){d=1e9;for(const r of[b.p,...b.H])for(let i=0;i<r.length;i++){const a=r[i],c=r[(i+1)%r.length],dx=c[0]-a[0],dz=c[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);d=Math.min(d,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}}
  for(const r of world.waterLines)if(r.w>=8)for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],c=r.pts[i+1],dx=c[0]-a[0],dz=c[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);d=Math.max(d,r.w/2-Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}
  return d;
}
const W3_BAND=1.2,W3_SINK=2.2;
function w3Splash(x,y,z){
  if(splash)return;
  const m=new THREE.Mesh(new THREE.RingGeometry(.8,1.3,24),new THREE.MeshBasicMaterial({color:0xe8f0f2,transparent:true,opacity:.7,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(x,y+.08,z);worldGroup.add(m);splash={m,t:0};
}
// on foot: past the shallow edge the player flails and goes under, the screen fades, and the next dry spot back along the way in is home
{const walk3=walk,pose3=posePlayer;
  walk=function(dt){
    walk3(dt);const d=w3Foot;
    if(d){d.t+=dt;if(d.t>1.5)fade(Math.min(1,(d.t-1.5)/.7));
      if(d.t>W3_SINK){w3Foot=null;fight.pDown=0;[player.x,player.z]=w3Home();heat=0;showWanted();while(cops.length)removeCop(cops[0]);snapCamera();fadeT=.8;toast('Drowned','You wake up on the bank.');}return;}
    if(player.mode!=='foot'||fight.pDown>0)return;
    if(!inWater(player.x,player.z)){w3Dry=[player.x,player.z,player.h];return;}
    if(water3Depth(player.x,player.z)<=W3_BAND)return;
    const b=w3Body(player.x,player.z);w3Foot={t:0,y:b&&b.L!=null?b.L:GY(player.x,player.z)};
    fight.pDown=W3_SINK+.5;player.speed=player.gait=0;
    w3Splash(player.x,w3Foot.y,player.z);
    hit(.6);shake=Math.max(shake,.3);notes([[330,.14],[262,.14],[196,.4]],'triangle',.1);};
  posePlayer=function(){
    if(!w3Foot)return pose3();
    const t=w3Foot.t,y=w3Foot.y-GY(player.x,player.z);
    poseAt(PLAYER_I,PLAYER_LOOK,player.x,player.z,player.h,-.35,y-.9-Math.min(1.5,t*1.1),player.walk+t*9,.5,true,0,null);
  };
}
// the dry spot the player last stood on (else the nearest land), moved out to where there is no water within 1.5 m and no wall
function w3Home(){
  const[x,z]=w3Dry&&Math.hypot(w3Dry[0]-player.x,w3Dry[1]-player.z)<30?w3Dry:[player.x,player.z];
  for(let r=0;r<300;r+=r<12?1.5:6)for(let a=0;a<(r?16:1);a++){const px=x+Math.sin(a*.3927)*r,pz=z+Math.cos(a*.3927)*r;
    if(!world.inBuilding(px,pz)&&![[0,0],[1.5,0],[-1.5,0],[0,1.5],[0,-1.5]].some(([u,v])=>inWater(px+u,pz+v)))return[px,pz];}
  return world.start;
}
// every car that ends up in water goes under, whoever drives it; the player's car keeps its own sequence (sinkStep)
{const traffic3=updateTraffic,cop3=driveCop,park3=addParkedCars,spawn3=spawnCars;
  // a sunk car is held by the stun branch of updateTraffic and placed here afterwards
  updateTraffic=function(dt){
    traffic3(dt);
    if(dt>0)for(const c of world.cars.slice()){
      if(!c.sunk){if(c===player.car&&player.mode==='car'||!inWater(c.x,c.z))continue;
        c.sunk={t:0,v:c.speed,y:c.g.position.y,rx:c.g.rotation.x};c.stun=1e3;c.speed=0;
        w3Splash(c.x,GY(c.x,c.z),c.z);}
      const s=c.sunk,t=s.t+=dt,v=s.v*Math.exp(-2.4*t);
      c.x+=Math.sin(c.h)*v*dt;c.z+=Math.cos(c.h)*v*dt;c.g.position.set(c.x,s.y-Math.min(3,.3*t+.5*t*t),c.z);c.g.rotation.x=s.rx+Math.min(.5,t*.22);
      if(t<3.2)continue;
      if(c.cop)removeCop(c);
      else if(c.ai&&w3Place(c)){c.sunk=null;c.hp=1;c.dead=false;c.stun=0;c.steer=0;fixCar(c);syncCar(c);}
      else{worldGroup.remove(c.g);world.cars.splice(world.cars.indexOf(c),1);}
    }
  };
  driveCop=function(c,dt){if(!c.sunk)cop3(c,dt);};
  addParkedCars=function(l){park3(l.filter(c=>!inWater(c[0],c[2])));};
  spawnCars=function(){spawn3();for(const c of world.cars.slice())if(c!==player.car&&inWater(c.x,c.z)){worldGroup.remove(c.g);world.cars.splice(world.cars.indexOf(c),1);}};
}
// a sunk traffic car comes back on a drivable street at least 150 m from the player
function w3Place(c){
  const G=world.graph,E=world.edges.filter(e=>e.cls<=1);
  for(let i=0;i<30&&E.length;i++){const e=E[Math.floor(Math.random()*E.length)];let from=e.a,to=e.b;if(!G.get(from).out.includes(to)){from=e.b;to=e.a;}
    const A=G.get(from),B=G.get(to);if(!A||!B||Math.hypot(A.x-player.x,A.z-player.z)<150)continue;
    c.ai={from,to,t:Math.random(),len:Math.max(.1,Math.hypot(B.x-A.x,B.z-A.z)),cruise:c.ai.cruise};aiPlace(c,true);c.g.rotation.x=0;return true;}
  return false;
}
// the pavement beside a pond can lie in it: take the other side of the street
{const pt3=pedTarget;pedTarget=p=>{const q=pt3(p);if(!water3At(q[0],q[1]))return q;const s=p.side;p.side=-s;const r=pt3(p);p.side=s;return water3At(r[0],r[1])?q:r;};}
