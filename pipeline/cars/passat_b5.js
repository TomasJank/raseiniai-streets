// VW Passat B5.5 Variant (2000-2005), 4.70 x 1.74 x 1.50 m with rails, 2.70 m wheelbase; the commonest car in rural Lithuania.
CAR_MODELS.passat_b5={name:'VW Passat B5 Variant',dims:[4.7,1.74,1.5],axles:[1.43,-1.27],arch:.385,
  // sloping bonnet, level belt, long rear overhang
  lower:[[2.31,.72,.31,.7,.74],[2.28,.79,.27,.72,.76],[2.2,.84,.235,.74,.78],[2.05,.865,.22,.76,.8],[1.815,.87,.22,.79,.83],[1.43,.87,.22,.83,.87],[1.15,.87,.22,.86,.9],[1.045,.87,.22,.87,.908],[.6,.87,.22,.91,.945],[0,.87,.22,.94,.975],[-.6,.87,.22,.96,.995],[-.885,.87,.22,.965,1],[-1.27,.87,.22,.975,1.01],[-1.655,.87,.22,.98,1.015],[-1.95,.865,.22,.985,1.02],[-2.15,.85,.23,.985,1.02],[-2.25,.82,.27,.975,1.005],[-2.31,.75,.31,.95,.975]],
  // arched roof peaking over the B-pillar, raked tailgate
  upper:[[1.12,0],[.98,1],[.84,1.1],[.66,1.22],[.48,1.32],[.3,1.39],[.1,1.43],[-.24,1.45],[-.32,1.45],[-.8,1.445],[-1.22,1.43],[-1.3,1.425],[-1.7,1.4],[-1.92,1.375],[-2,1.33],[-2.08,1.24],[-2.16,1.11],[-2.22,0]],
  side:[.98,-1.92],pillars:[[.98,.84],[-.24,-.32],[-1.22,-1.3]],glass:[.3,-1.92],strips:[],rings:false,
  mirror:null,plate:[[.37,2.358],[.74,-2.313]],grime:.32,
  // chrome VW disc: ring, dark field, V over W; d is +1 on the nose, -1 on the tail
  badge({tri,ring,trim,CHROME},cy,z,r){
    const d=Math.sign(z),n=[0,0,d],dark=[.06,.08,.14];
    for(let i=0;i<10;i++){const a=i/10*TAU,b=(i+1)/10*TAU;tri(trim,[0,cy,z],[Math.cos(a)*r,cy+Math.sin(a)*r,z],[Math.cos(b)*r,cy+Math.sin(b)*r,z],n,n,n,dark);}
    ring(0,cy,z+d*.001,r,CHROME);
    const st=(x0,y0,x1,y1)=>{const dx=x1-x0,dy=y1-y0,m=Math.hypot(dx,dy),w=.09*r,px=-dy/m*w,py=dx/m*w,q=(x,y)=>[x*r,cy+y*r,z+d*.002];
      const A=q(x0,y0),B=q(x1,y1);tri(trim,[A[0]-px,A[1]-py,A[2]],[B[0]-px,B[1]-py,B[2]],[B[0]+px,B[1]+py,B[2]],n,n,n,CHROME);tri(trim,[A[0]-px,A[1]-py,A[2]],[B[0]+px,B[1]+py,B[2]],[A[0]+px,A[1]+py,A[2]],n,n,n,CHROME);};
    st(-.42,.62,0,.02);st(.42,.62,0,.02);st(-.7,.3,-.36,-.62);st(-.36,-.62,0,-.1);st(0,-.1,.36,-.62);st(.36,-.62,.7,.3);
  },
  // chrome-framed grille with two bars, big lamps with twin round reflectors, indicators round the corner
  front(c){
    const{quad,trim,head,CHROME,BLACK}=c,z=2.31,F=[0,0,1];
    quad(trim,[-.34,.57,z+.003],[.34,.57,z+.003],[.345,.705,z+.003],[-.345,.705,z+.003],F,CHROME,false);
    quad(trim,[-.325,.583,z+.005],[.325,.583,z+.005],[.33,.692,z+.005],[-.33,.692,z+.005],F,BLACK,false);
    for(const y of[.61,.664])quad(trim,[-.325,y,z+.007],[.325,y,z+.007],[.325,y+.008,z+.007],[-.325,y+.008,z+.007],F,CHROME,false);
    c.M.badge(c,.638,z+.011,.05);
    quad(trim,[.352,.565,z+.003],[.712,.565,z+.003],[.705,.69,z+.003],[.352,.705,z+.003],F,BLACK);
    quad(head,[.36,.573,z+.006],[.704,.573,z+.006],[.698,.682,z+.006],[.36,.696,z+.006],F,[.72,.76,.78]);
    for(const cx of[.45,.6])for(let i=0;i<8;i++){const a=i/8*TAU,b=(i+1)/8*TAU,r=.05;
      c.tri(head,[cx,.634,z+.008],[cx+Math.cos(a)*r,.634+Math.sin(a)*r,z+.008],[cx+Math.cos(b)*r,.634+Math.sin(b)*r,z+.008],F,F,F,[.97,.97,.93]);
      c.tri(head,[-cx,.634,z+.008],[-cx-Math.cos(b)*r,.634+Math.sin(b)*r,z+.008],[-cx-Math.cos(a)*r,.634+Math.sin(a)*r,z+.008],F,F,F,[.97,.97,.93]);}
    quad(head,[.714,.573,z+.002],[.79,.573,2.282],[.786,.672,2.282],[.708,.682,z+.002],[.4,0,.92],[.93,.8,.6]);
  },
  // corner lamps on the body, tailgate with the plate, chrome strip and badge, rear wiper, roof rails
  rear(c){
    const{quad,trim,tail,BLACK,CHROME,RED,WHITE,AMBER}=c,z=-2.31,B=[0,0,-1];
    quad(tail,[.47,.8,z-.003],[.742,.8,z-.003],[.735,.93,z-.003],[.47,.93,z-.003],B,RED);
    quad(tail,[.47,.735,z-.003],[.6,.735,z-.003],[.6,.8,z-.003],[.47,.8,z-.003],B,AMBER);
    quad(tail,[.6,.735,z-.003],[.744,.735,z-.003],[.742,.8,z-.003],[.6,.8,z-.003],B,WHITE);
    quad(tail,[.744,.735,z-.003],[.82,.735,-2.252],[.818,.915,-2.252],[.735,.93,z-.003],[.6,0,-.8],RED);
    quad(tail,[.822,.745,-2.25],[.852,.755,-2.14],[.852,.9,-2.14],[.82,.915,-2.25],[.97,0,-.25],RED);
    for(const x of[-.462,.455])quad(trim,[x,.56,z-.002],[x+.007,.56,z-.002],[x+.007,.95,z-.002],[x,.95,z-.002],B,BLACK,false);
    quad(trim,[-.3,.872,z-.004],[.3,.872,z-.004],[.3,.886,z-.004],[-.3,.886,z-.004],B,CHROME,false);
    c.M.badge(c,.918,z-.008,.042);
    quad(trim,[-.02,1.02,-2.19],[.02,1.02,-2.19],[-.3,1.2,-2.115],[-.33,1.19,-2.115],[0,.5,-.86],BLACK,false);
    const U=c.M.upper,roof=q=>{for(let i=0;i<U.length-1;i++)if(q<=U[i][0]&&q>=U[i+1][0])return U[i][1]+(U[i+1][1]-U[i][1])*(U[i][0]-q)/(U[i][0]-U[i+1][0]);return 0;};
    const zs=[.2,-.24,-.8,-1.3,-1.7,-1.9],G=[.12,.12,.13];
    for(let i=0;i<zs.length-1;i++){const a=zs[i],b=zs[i+1],ya=roof(a)-.012,yb=roof(b)-.012,h=.045;
      quad(trim,[.56,ya,a],[.56,yb,b],[.56,yb+h,b],[.56,ya+h,a],[1,0,0],G);
      quad(trim,[.5,ya+h,a],[.56,ya+h,a],[.56,yb+h,b],[.5,yb+h,b],[0,1,0],G);
      quad(trim,[.5,ya,a],[.5,yb,b],[.5,yb+h,b],[.5,ya+h,a],[-1,0,0],G);}
    for(const q of[.2,-1.9]){const y=roof(q)-.012,s=Math.sign(q);quad(trim,[.5,y,q],[.56,y,q],[.56,y+.045,q],[.5,y+.045,q],[0,0,s],G);}
  },
  // body-colour bumpers with a black rub strip and lip, intake under the plate
  bumpers({quad,bumper,trim,PAINT,BLACK,PLASTIC}){
    const FR=[[0,2.355],[.6,2.35],[.74,2.32],[.82,2.26],[.865,2.15],[.875,2],[.875,1.815]],RR=[[0,-2.355],[.6,-2.35],[.74,-2.32],[.82,-2.26],[.86,-2.15],[.875,-2],[.875,-1.655]];
    const out=(P,k)=>P.map(([x,z])=>[x*1.003,z+k*.003]);
    bumper(FR,.21,.55,PAINT);bumper(RR,.26,.56,PAINT);
    bumper(out(FR,1),.21,.27,PLASTIC);bumper(out(RR,-1),.26,.31,PLASTIC);
    bumper(out(FR,1),.465,.5,BLACK);bumper(out(RR,-1),.465,.5,BLACK);
    quad(trim,[-.5,.255,2.36],[.5,.255,2.36],[.47,.345,2.36],[-.47,.345,2.36],[0,0,1],BLACK,false);
    quad(trim,[.56,.28,2.356],[.7,.28,2.336],[.7,.34,2.336],[.56,.34,2.356],[0,0,1],[.62,.63,.6]);
  },
  // door rub strips, shut lines, handles, body-colour mirrors on black bases
  doors(c){
    const{quad,box,trim,paint,side,BLACK,PAINT,at}=c;
    quad(trim,[.874,.465,1.03],[.874,.465,-1.25],[.874,.505,-1.25],[.874,.505,1.03],side,BLACK);
    for(const[z,y0]of[[1.04,.33],[-.27,.33],[-1.25,.69]]){const[w,s]=at(z),m=.22+(s-.22)*.55;
      if(y0<m)quad(trim,[w+.003,y0,z],[w+.003,y0,z+.01],[w+.003,m,z+.01],[w+.003,m,z],side,BLACK);
      quad(trim,[w+.003,Math.max(y0,m),z],[w+.003,Math.max(y0,m),z+.01],[w*.995+.003,s-.03,z+.01],[w*.995+.003,s-.03,z],side,BLACK);}
    for(const z of[-.2,-1.18])quad(trim,[.872,.845,z],[.872,.845,z+.12],[.871,.872,z+.12],[.871,.872,z],side,BLACK);
    box(trim,.77,.81,.92,.99,.82,.92,BLACK);box(paint,.81,.92,.93,1.035,.8,.92,PAINT);
  }};
