// One lofted car builder for every model in CAR_MODELS (pipeline/cars/*.js). M inherits whatever it leaves out from
// the Audi 80 B3; lot=true gives the parked-car twin with coarse arches.
function buildCar(M,lot){
  M={...CAR_MODELS.audi80,...M};
  const PAINT=[1,1,1],GLASS=[.13,.17,.2],BLACK=[.035,.035,.04],PLASTIC=[.14,.14,.15],CHROME=[.78,.8,.82],WHITE=[.93,.93,.9],LENS=[.2,.2,.21],AMBER=[.86,.36,.07],CLEAR=[.92,.92,.88],RED=[.77,.125,.165],LAMP=[1,.95,.77];
  const L=()=>({p:[],n:[],c:[]});
  const paint=L(),trim=L(),head=L(),tail=L(),wheel=L();
  const tri=(l,a,b,c,na,nb,nc,col)=>{
    const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const f=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const flip=f[0]*(na[0]+nb[0]+nc[0])+f[1]*(na[1]+nb[1]+nc[1])+f[2]*(na[2]+nb[2]+nc[2])<0;
    for(const[q,w]of flip?[[a,na],[c,nc],[b,nb]]:[[a,na],[b,nb],[c,nc]]){l.p.push(...q);l.n.push(...w);l.c.push(...col);}
  };
  const mir=q=>[-q[0],q[1],q[2]];
  // flat panel, mirrored unless it sits on the centre line
  const quad=(l,A,B,C,D,want,col=PAINT,both=true)=>{
    tri(l,A,B,C,want,want,want,col);tri(l,A,C,D,want,want,want,col);
    if(both){const w=mir(want);tri(l,mir(A),mir(B),mir(C),w,w,w,col);tri(l,mir(A),mir(C),mir(D),w,w,w,col);}
  };
  const box=(l,x0,x1,y0,y1,z0,z1,col)=>{
    quad(l,[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],[1,0,0],col);quad(l,[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1],[-1,0,0],col);
    quad(l,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[0,1,0],col);quad(l,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],col);quad(l,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1],col);
  };
  // smooth skin over stations of right-half sections; pick(i,j) says which list and colour a panel gets
  const loft=(st,pick)=>{
    const nor=(i,j)=>{
      const a=st[Math.min(i+1,st.length-1)][j],b=st[Math.max(i-1,0)][j],c=st[i][Math.min(j+1,st[i].length-1)],d=st[i][Math.max(j-1,0)];
      const u=[a[0]-b[0],a[1]-b[1],a[2]-b[2]],v=[c[0]-d[0],c[1]-d[1],c[2]-d[2]];
      const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const q=st[i][j],s=(n[0]*q[0]+n[1]*(q[1]-.75)+n[2]*q[2])<0?-1:1,m=Math.hypot(...n)||1;
      return[n[0]*s/m,n[1]*s/m,n[2]*s/m];
    };
    for(let i=0;i<st.length-1;i++)for(let j=0;j<st[i].length-1;j++){
      const pk=pick(i,j);if(!pk)continue;const[l,col]=pk,A=st[i][j],B=st[i+1][j],C=st[i+1][j+1],D=st[i][j+1],na=nor(i,j),nb=nor(i+1,j),nc=nor(i+1,j+1),nd=nor(i,j+1);
      tri(l,A,B,C,na,nb,nc,col);tri(l,A,C,D,na,nc,nd,col);
      tri(l,mir(A),mir(B),mir(C),mir(na),mir(nb),mir(nc),col);tri(l,mir(A),mir(C),mir(D),mir(na),mir(nc),mir(nd),col);
    }
  };

  // the lift is rounded to mm so the shifted table holds the same doubles as a hand-written one
  const LOWER=M.lift?M.lower.map(([z,w,b,s,t])=>[z,w,b,Math.round((s+M.lift)*1e3)/1e3,Math.round((t+M.lift)*1e3)/1e3]):M.lower;
  const AXLES=M.axles,ARCH=M.arch;
  const sect=([z,w,b,s,t])=>[[0,b,z],[w*.86,b,z],[w*.98,b+.1,z],[w,b+(s-b)*.55,z],[w*.995,s-.03,z],[w*.96,s,z],[w*.86,t-.008,z],[w*.45,t-.001,z],[0,t,z]];
  const lowerSt=LOWER.map(sect);
  lowerSt.unshift(lowerSt[0].map(q=>[0,q[1],q[2]]));lowerSt.push(lowerSt[lowerSt.length-1].map(q=>[0,q[1],q[2]]));
  loft(lowerSt,(i,j)=>{const z=(lowerSt[i][0][2]+lowerSt[i+1][0][2])/2;if(j>=1&&j<=3&&AXLES.some(a=>Math.abs(z-a)<ARCH))return null;return j<2?[trim,PLASTIC]:[paint,PAINT];});

  const belt=z=>{for(let i=0;i<LOWER.length-1;i++){const a=LOWER[i],b=LOWER[i+1];if(z<=a[0]&&z>=b[0])return a[3]+(b[3]-a[3])*(a[0]-z)/(a[0]-b[0]);}return LOWER[0][3];};
  const UPPER=M.upper;
  const upSt=UPPER.map(([z,t])=>{
    const y=belt(z)-.01,h=t||y+.012,xAt=q=>.77-.17*(q-y)/.44,top=Math.max(y+.001,h-.07),frame=top+Math.min(.015,(h-top)/3);
    return[[.77,y,z],[xAt(top),top,z],[xAt(frame),frame,z],[xAt(h),h-.008,z],[xAt(h)*.55,h,z],[0,h+.008,z]];
  });
  loft(upSt,(i,j)=>{
    const z=(UPPER[i][0]+UPPER[i+1][0])/2,side=z<M.side[0]&&z>M.side[1],pillar=M.pillars.some(([a,b])=>z<Math.max(a,b)&&z>Math.min(a,b));
    if(j===0)return side?[trim,pillar?BLACK:GLASS]:[paint,PAINT];
    if(j===1)return side?[trim,BLACK]:[paint,PAINT];
    if(j===2)return[paint,PAINT];
    return z>M.glass[0]||z<M.glass[1]?[trim,GLASS]:[paint,PAINT];
  });
  for(const[a,b]of M.strips){
    const t=[0,.7,.7];quad(trim,a,b,[b[0],b[1],b[2]+.016],[a[0],a[1],a[2]+.016],t,BLACK,false);}

  const ring=(cx,cy,z,r,col)=>{const w=[0,0,Math.sign(z)];for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU,n=r*.76;
    quad(trim,[cx+Math.cos(a)*n,cy+Math.sin(a)*n,z],[cx+Math.cos(b)*n,cy+Math.sin(b)*n,z],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z],w,col,false);}};
  // bumper strip along a plan-view outline [[x,z],…]; PAINT pieces go to the paint list so they take the body colour
  const bumper=(pts,y0,y1,col)=>{for(let i=0;i<pts.length-1;i++){const[a,z0]=pts[i],[b,z1]=pts[i+1],nx=z0-z1,nz=b-a,m=Math.hypot(nx,nz),s=z0>0?1:-1,w=[nx/m*s,0,nz/m*s];
    quad(col===PAINT?paint:trim,[a,y0,z0],[b,y0,z1],[b,y1,z1],[a,y1,z0],w,col);quad(col===PAINT?paint:trim,[a,y1,z0],[b,y1,z1],[b-.06,y1,z1-.06*s],[a,y1,z0-.06*s],[0,1,0],col);}};
  // Lithuanian plate: dark frame, blue EU band, three letters and three digits; d=1 faces forward, -1 back
  const plate=(y,z,d)=>{const q=(x0,x1,y0,y1,o,col)=>quad(trim,[x0,y0,z+d*o],[x1,y0,z+d*o],[x1,y1,z+d*o],[x0,y1,z+d*o],[0,0,d],col,false);
    q(-.268,.268,y-.004,y+.114,0,BLACK);q(-.26,.26,y,y+.11,.002,WHITE);q(-.26,-.22,y,y+.11,.004,[.1,.2,.6]);
    for(let i=0;i<7;i++)if(i!==3)q(-.2+i*.064,-.155+i*.064,y+.02,y+.09,.004,[.08,.08,.09]);};
  const at=z=>{for(let i=0;i<LOWER.length-1;i++){const a=LOWER[i],b=LOWER[i+1];if(z<=a[0]&&z>=b[0]){const t=(a[0]-z)/(a[0]-b[0]);return[a[1]+(b[1]-a[1])*t,a[3]+(b[3]-a[3])*t];}}return[LOWER[0][1],LOWER[0][3]];};
  const side=[1,0,0];
  const c={M,quad,box,tri,ring,bumper,plate,belt,at,paint,trim,head,tail,side,PAINT,GLASS,BLACK,PLASTIC,CHROME,WHITE,LENS,AMBER,CLEAR,RED,LAMP};

  M.front(c);
  if(M.rings)for(let i=-1.5;i<2;i++){ring(i*.068,.617,2.214,.046,CHROME);ring(i*.068,.942,-2.208,.044,CHROME);}
  M.rear(c);
  M.bumpers(c);
  M.doors(c);
  if(M.mirror){const[z,y]=M.mirror;box(trim,.77,.92,y,y+.09,z,z+.11,BLACK);}
  if(M.plate){plate(...M.plate[0],1);plate(...M.plate[1],-1);}

  // arches are cut through the side panel; the dark well behind hides the hollow body
  for(const az of AXLES){
    const n=lot?6:20,col=i=>{const th=-Math.PI/2+i/n*Math.PI;return[az+Math.sin(th)*ARCH,WHEEL_R+Math.cos(th)*ARCH,Math.sin(th),Math.cos(th)];};
    for(let i=0;i<n;i++){
      const[z0,y0,s0,c0]=col(i),[z1,y1,s1,c1]=col(i+1),[w0,t0]=at(z0),[w1,t1]=at(z1);
      quad(paint,[w0,y0,z0],[w1,y1,z1],[w1*.995,t1-.03,z1],[w0*.995,t0-.03,z0],side);
      quad(trim,[.6,y0,z0],[.6,y1,z1],[w1,y1,z1],[w0,y0,z0],[0,-(c0+c1)/2,-(s0+s1)/2],BLACK);
      quad(trim,[.6,y0,z0],[.6,y1,z1],[.6,WHEEL_R,z1],[.6,WHEEL_R,z0],side,BLACK);
    }
    for(const k of[1,-1])quad(trim,[.6,.22,az+k*ARCH],[.85,.22,az+k*ARCH],[.85,WHEEL_R,az+k*ARCH],[.6,WHEEL_R,az+k*ARCH],[0,0,-k],BLACK);
    quad(trim,[.6,.22,az-ARCH],[.6,.22,az+ARCH],[.6,WHEEL_R,az+ARCH],[.6,WHEEL_R,az-ARCH],side,BLACK);
  }

  // one wheel centred on its hub, outer face at +x; ribs and slots make the spin visible
  const N=32,R=WHEEL_R;
  for(let i=0;i<N;i++){
    const a=i/N*TAU,b=(i+1)/N*TAU,s=[Math.cos(a),Math.sin(a)],e=[Math.cos(b),Math.sin(b)],P=(x,r,q)=>[x,q[0]*r,q[1]*r];
    const ann=(x,r0,r1,col)=>quad(wheel,P(x,r0,s),P(x,r0,e),P(x,r1,e),P(x,r1,s),side,col,false);
    quad(wheel,P(-.1,R,s),P(-.1,R,e),P(.1,R,e),P(.1,R,s),[0,s[0],s[1]],i%2?[.06,.06,.065]:[.035,.035,.04],false);
    ann(.1,R,.215,[.045,.045,.05]);
    quad(wheel,P(-.1,R,s),P(-.1,R,e),P(-.1,.001,e),P(-.1,.001,s),[-1,0,0],BLACK,false);
    ann(.102,.215,.2,[.52,.53,.54]);
    ann(.104,.2,.17,[.8,.8,.77]);
    ann(.106,.17,.04,i%8===0?[.62,.62,.6]:[.9,.9,.87]);
    ann(.108,.04,.001,[.6,.61,.62]);
  }

  const out={axles:AXLES};
  // glass darkens towards the door and picks up the sky higher up
  for(let i=0;i<trim.c.length;i+=3)if(trim.c[i]===GLASS[0]&&trim.c[i+1]===GLASS[1]&&trim.c[i+2]===GLASS[2]){
    const k=clamp((trim.p[i+1]-.95)/.45,0,1);trim.c[i]=.09+k*.33;trim.c[i+1]=.12+k*.38;trim.c[i+2]=.15+k*.41;}
  // road dirt fades up the lower body
  if(M.grime)for(const l of[paint,trim])for(let i=0;i<l.c.length;i+=3){const k=1-M.grime*clamp((.55-l.p[i+1])/.35,0,1)*.45;l.c[i]*=k;l.c[i+1]*=k;l.c[i+2]*=k;}
  // ponytail: lampW scales lamp x about the centre line; fine for small tweaks, wrap-round corner pieces drift off the body past ±5 %
  if(M.lampW!==1)for(const l of[head,tail])for(let i=0;i<l.p.length;i+=3)l.p[i]*=M.lampW;
  for(const[k,l]of Object.entries({paint,trim,head,tail,wheel})){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(l.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(l.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(l.c,3));
    g.userData.keep=true;out[k]=g;
  }
  return out;
}
