// ---------- drive3: every car drives like itself, and speed bumps (research/reports/drive3.md) ----------
// D3_SPEC (pipeline/drive3/perf.json) holds each model's real top speed, 0-100, kerb mass and gearbox. The arcade model keeps its
// shape (accel = A*(1-v/T)); the start car (Audi 80 2.0) keeps today's T 37 / A 9.5 and the others scale from it, compressed so
// the slowest is still drivable: T = 37*(top/177)^.8, A = 9.5*(13.6/t100)^.6. Brakes, wall bounce and shoves follow mass; strong
// rear-drive cars grip a little less. D3_BUMPS (bumps.json) are raised tables and humps: their height is added to world.surf, so the
// existing wheel springs, ride and pedestrians follow them; crossing one kicks the chassis by speed squared (D3.K).
const D3={K:1,ref:null,P:{},B:[],mesh:null,VB:{car:4,cop:9,bus:3}};
function d3Make(S){
  const R=D3_SPEC.audi80,T=37*(S.top/R.top)**.8,A=S.t100?9.5*(R.t100/S.t100)**.6:2,kw=S.hp*.7355/(S.kg/1000),n=S.ratios.length,
    shift=S.fuel==='d'?.95:.93,top=S.ratios[n-1];
  // gear bands (game m/s): upshift where the engine would reach its shift rpm in that gear, top gear runs to T
  const bands=[0,...S.ratios.slice(0,-1).map(r=>T*shift*top/r),99];
  return Object.assign({},S,{T,A,mass:S.kg,brake:clamp(20*(1250/S.kg)**.35,14,23),bounce:clamp(.22*(1250/S.kg)**.5,.06,.3),
    grip:S.drive==='R'?1-.15*clamp((kw-60)/50,0,1):1,bands,rpmTop:S.fuel==='d'?4000:5600,
    t100g:T>27.78?-(T/A)*Math.log(1-27.78/T):null});
}
for(const k in D3_SPEC)if(k!=='_')D3.P[k]=d3Make(D3_SPEC[k]);
D3.ref=D3.P.audi80;
// the model of a car: cars4 key; the police and the route bus by role; anything unknown drives like the start car
function d3P(c){
  if(!c)return D3.ref;if(c.d3p)return c.d3p;
  const F=c.g&&c.g.userData&&c.g.userData.car2,k=c.bus?'aero_bus':F&&F.key;
  const p=D3.P[k]||(c.cop?D3.P.octavia2_pol:null)||D3.ref;if(c.g)c.d3p=p;return p;
}
const d3Bands=c=>d3P(c).bands;
const d3MR=(c,o)=>{const a=d3P(c).mass,b=o.d3p||o.g?d3P(o).mass:1300;return a/(a+b);};
// engine sound: diesels by spec, and each car's own gears through carsound's rpm model (game rpm scale; diesel is mapped by csDieselRpm)
if(typeof CS!=='undefined'){CS.DIESEL.clear();for(const k in D3.P)if(D3.P[k].fuel==='d')CS.DIESEL.add(k);
  const g0=csGear,w0=csWant;
  csGear=function(g,s,c){if(!c)return g0(g,s);const B=d3Bands(c);let n=0;while(n<B.length-2&&s>=B[n+1])n++;if(n>g&&s<B[g+1]+.5||n<g&&s>B[g]-.8)n=g;return n;};
  csWant=function(s,g,th,c){if(!c)return w0(s,g,th);const P=d3P(c),R=P.ratios,gi=Math.min(g,R.length-1);
    if(s<1)return th?3500:850;
    if(c===player.car){if(drv.gear!==D3.gear){D3.gear=drv.gear;D3.shiftS=s;}if(drv.shiftT>0)s=Math.min(s,D3.shiftS);}
    let r=P.rpmTop*(s/P.T)*(R[gi]/R[R.length-1]);if(gi===0)r=Math.max(r,900+1400*Math.min(1,s/2));
    return P.fuel==='d'?850+(clamp(r,850,4500)-900)*2:clamp(r,850,6000);};}
// traffic: cruise and pull by the car's own limits, brake before a bump
function d3AI(c,target,dt){
  const P=d3P(c),v=c.speed;target=Math.min(target*Math.sqrt(P.T/37),d3Cap(c,D3.VB.car));
  return clamp(target-v,-Math.min(12,P.brake*.6)*dt,Math.max(.5,Math.min(4,P.A*(1-v/P.T)*.6))*dt);
}
// police: the Octavia's own curve; in a chase it eases off less for a bump
function d3Cop(c,target,dt){
  const P=d3P(c),v=c.speed;target=Math.min(target,P.T,d3Cap(c,D3.VB.cop));
  return clamp(target-v,-20*dt,Math.max(1,P.A*(1-v/P.T))*dt);
}
{const f=carHitCar;carHitCar=function(c,o,nx,nz,sp){const x=o.pvx||0,z=o.pvz||0;f(c,o,nx,nz,sp);const k=2*d3MR(c,o);o.pvx=x+(o.pvx-x)*k;o.pvz=z+(o.pvz-z)*k;};}

// ---- bumps ----
// a bump: centre (x,z), road direction (ux,uz), half width hw, length L, height H; table = ramps r at both ends
function d3Prof(B,u){const a=Math.abs(u),h=B.L/2;if(a>=h)return 0;
  return B.kind==='hump'?B.H*Math.cos(Math.PI*u/B.L)**2:a>h-B.r?B.H*(h-a)/B.r:B.H;}
function d3H(x,z){
  let y=0;for(const B of D3.B){const dx=x-B.x,dz=z-B.z;if(dx*dx+dz*dz>B.R2)continue;
    const u=dx*B.ux+dz*B.uz,w=dx*B.uz-dz*B.ux;if(Math.abs(w)<=B.hw)y=Math.max(y,d3Prof(B,u));}
  return y;
}
// highest speed now that still lets the car slow to vb at the bump ahead (3 m/s2)
function d3Cap(c,vb){
  let cap=99;const fx=Math.sin(c.h),fz=Math.cos(c.h);
  for(const B of D3.B){const dx=B.x-c.x,dz=B.z-c.z,al=dx*fx+dz*fz;if(al<-B.L/2-1||al>45)continue;
    if(Math.abs(dx*fz-dz*fx)>B.hw+2||Math.abs(fx*B.ux+fz*B.uz)<.5)continue;
    cap=Math.min(cap,Math.sqrt(vb*vb+6*Math.max(0,al-B.L/2-1.5)));}
  return cap;
}
function d3Build(W){
  D3.B=[];if(D3.mesh){worldGroup.remove(D3.mesh);D3.mesh.geometry.dispose();D3.mesh=null;}
  if(!W||!W.roadSegs||!W.lat0)return;
  const s0=W.surf0||(W.surf0=W.surf);W.surf=(x,z)=>s0(x,z)+d3H(x,z);
  for(const b of D3_BUMPS){const[x,z]=LL(b.lat,b.lon);if(x<W.box.minX||x>W.box.maxX||z<W.box.minZ||z>W.box.maxZ)continue;
    let best=null;for(const s of W.roadSegs(x,z)){if(s[4].cls>3)continue;const dx=s[2]-s[0],dz=s[3]-s[1],L2=dx*dx+dz*dz||1,t=clamp(((x-s[0])*dx+(z-s[1])*dz)/L2,0,1),
      px=s[0]+dx*t,pz=s[1]+dz*t,d=Math.hypot(x-px,z-pz);if(d<12&&(!best||d<best.d)){const l=Math.sqrt(L2);best={d,px,pz,ux:dx/l,uz:dz/l,w:s[4].w,cls:s[4].cls};}}
    if(!best)continue;
    const T=b.kind==='table',L=T?5:.9;
    D3.B.push({id:b.id,kind:b.kind,x:best.px,z:best.pz,ux:best.ux,uz:best.uz,hw:best.w/2+.15,L,r:T?1:0,H:T?.08:.07,zebra:b.zebra,teeth:b.teeth,cls:best.cls,R2:(L/2+best.w/2+1)**2});}
  if(!D3.B.length)return;
  // one merged mesh: deck (road colour), markings 6 mm above it, side faces down to the road
  const P=[],C=[],at=(B,u,w,e=0)=>{const x=B.x+B.ux*u+B.uz*w,z=B.z+B.uz*u-B.ux*w;return[x,GY(x,z)+s0(x,z)+d3Prof(B,u)+e,z];},
    quad=(a,b,c,d,col)=>{P.push(...a,...b,...c,...a,...c,...d);for(let i=0;i<6;i++)C.push(...col);};
  for(const B of D3.B){
    const rc=ROADCOL[B.cls]||ROADCOL[1],deck=rc.map(v=>v*.97),wht=[.9,.9,.87],us=[];
    for(let k=0;k<=(B.kind==='hump'?10:0);k++)us.push(-B.L/2+B.L*k/10);
    if(B.kind!=='hump')us.push(-B.L/2,-B.L/2+B.r,B.L/2-B.r,B.L/2);
    const ws=[];for(let w=-B.hw;w<B.hw-.01;w+=Math.min(1.2,B.hw))ws.push(w);ws.push(B.hw);
    for(let i=0;i<us.length-1;i++)for(let j=0;j<ws.length-1;j++)quad(at(B,us[i],ws[j],.004),at(B,us[i+1],ws[j],.004),at(B,us[i+1],ws[j+1],.004),at(B,us[i],ws[j+1],.004),deck);
    for(let i=0;i<us.length-1;i++)for(const w of[-B.hw,B.hw]){const a=at(B,us[i],w,.004),b=at(B,us[i+1],w,.004),a0=[a[0],a[1]-d3Prof(B,us[i])-.004,a[2]],b0=[b[0],b[1]-d3Prof(B,us[i+1])-.004,b[2]];
      w<0?quad(a0,b0,b,a,deck):quad(a,b,b0,a0,deck);}
    // the frames show asphalt decks, so the colour stays; the edges read through a dark joint at the foot and the top of each ramp
    if(B.r)for(const u of[-B.L/2,-B.L/2+B.r,B.L/2-B.r,B.L/2]){const e=Math.sign(u)*(Math.abs(u)>=B.L/2-1e-6?-.09:.09);
      quad(at(B,u,-B.hw,.008),at(B,u+e,-B.hw,.008),at(B,u+e,B.hw,.008),at(B,u,B.hw,.008),deck.map(v=>v*.55));}
    // zebra: 0.5 m stripes along the road over the deck; teeth: white triangles up each ramp
    if(B.zebra){const u0=B.kind==='hump'?-B.L/2:-B.L/2+B.r,u1=-u0,n=B.kind==='hump'?6:1;
      for(let w=-B.hw+.45;w+.5<=B.hw-.2;w+=1)for(let k=0;k<n;k++){const a=u0+(u1-u0)*k/n,b=u0+(u1-u0)*(k+1)/n;
        quad(at(B,a,w,.01),at(B,b,w,.01),at(B,b,w+.5,.01),at(B,a,w+.5,.01),wht);}}
    if(B.teeth&&B.r)for(const sg of[-1,1])for(let w=-B.hw+.5;w+.45<=B.hw-.2;w+=.9){const ub=sg*B.L/2,ut=sg*(B.L/2-B.r*.8),
      p=at(B,ub,w,.01),q=at(B,ub,w+.45,.01),t=at(B,ut,w+.225,.01);P.push(...p,...q,...t);for(let i=0;i<3;i++)C.push(...wht);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  g.computeVertexNormals();
  const m=D3.mesh=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  m.receiveShadow=true;m.name='bumps';worldGroup.add(m);
}
{const f=spawnCars;spawnCars=function(){d3Build(world);return f.apply(this,arguments);};}
// crossing a bump: each axle gets one kick on the way onto it, by speed squared; the springs, air time and landing thud are ride()'s
D3.log=[];
function d3Bump(c){
  if(!D3.B.length)return;const v=Math.abs(c.speed||0),fx=Math.sin(c.h),fz=Math.cos(c.h),k=c.d3k||(c.d3k=[0,0]);
  for(let i=0;i<2;i++){const o=(i?-1.25:1.3)*Math.sign(c.speed||1),h=d3H(c.x+fx*o,c.z+fz*o);
    if(h>0&&!k[i]){k[i]=1;const s=D3.K*Math.min(1.3,v/22)**2;if(s<.01)continue;
      const B=D3.B.find(q=>(c.x-q.x)**2+(c.z-q.z)**2<q.R2+9),f=B&&B.kind==='hump'?1.2:1;
      kick(c,1.5*s*f,(i?1:-1)*.8*s*f,(Math.random()-.5)*.25*s);
      if(c===player.car){shake=Math.max(shake,Math.min(1,.95*s*f));carBumpSound(Math.min(1,s*f*(i?.6:1)));}
      D3.log.push({t:ENV.t.value,car:c===player.car?'player':c.cop?'cop':'ai',axle:i,v,s});if(D3.log.length>50)D3.log.shift();}
    else if(!h)k[i]=0;}
}
{const f=ride;ride=function(c,dt){if(dt>0)d3Bump(c);return f(c,dt);};}
