// VW Golf V 5-door (2003-2008), 4.20 x 1.76 x 1.48 m, 2.58 m wheelbase.
CAR_MODELS.golf5={name:'VW Golf V',dims:[4.204,1.759,1.479],axles:[1.23,-1.35],arch:.38,
  // lower nose than the Golf IV, belt rising to the tail
  lower:[[2.06,.7,.32,.67,.71],[2.03,.78,.28,.695,.735],[1.96,.84,.24,.73,.77],[1.82,.87,.22,.75,.79],[1.61,.88,.22,.79,.83],[1.23,.88,.22,.85,.885],[.95,.88,.22,.89,.92],[.85,.88,.22,.9,.93],[.4,.88,.22,.935,.965],[0,.88,.22,.955,.985],[-.5,.88,.22,.975,1.005],[-.97,.88,.22,.99,1.02],[-1.35,.88,.22,1,1.03],[-1.73,.875,.22,1.005,1.035],[-1.9,.865,.225,1.005,1.035],[-2,.84,.25,1,1.03],[-2.06,.77,.3,.98,1.01]],
  upper:[[.93,0],[.8,1],[.66,1.1],[.48,1.23],[.28,1.35],[.06,1.43],[-.18,1.462],[-.27,1.468],[-.6,1.468],[-1,1.445],[-1.08,1.438],[-1.35,1.405],[-1.56,1.36],[-1.68,1.3],[-1.8,1.21],[-1.92,1.1],[-2,0]],
  side:[.8,-1.08],pillars:[[.8,.66],[-.18,-.27]],glass:[.28,-1.5],strips:[],rings:false,
  mirror:null,plate:[[.37,2.104],[.66,-2.063]],grime:.1,
  badge({tri,ring,trim,CHROME},cy,z,r){
    const d=Math.sign(z),n=[0,0,d],dark=[.06,.08,.14];
    for(let i=0;i<10;i++){const a=i/10*TAU,b=(i+1)/10*TAU;tri(trim,[0,cy,z],[Math.cos(a)*r,cy+Math.sin(a)*r,z],[Math.cos(b)*r,cy+Math.sin(b)*r,z],n,n,n,dark);}
    ring(0,cy,z+d*.001,r,CHROME);
    const st=(x0,y0,x1,y1)=>{const dx=x1-x0,dy=y1-y0,m=Math.hypot(dx,dy),w=.09*r,px=-dy/m*w,py=dx/m*w,q=(x,y)=>[x*r,cy+y*r,z+d*.002];
      const A=q(x0,y0),B=q(x1,y1);tri(trim,[A[0]-px,A[1]-py,A[2]],[B[0]-px,B[1]-py,B[2]],[B[0]+px,B[1]+py,B[2]],n,n,n,CHROME);tri(trim,[A[0]-px,A[1]-py,A[2]],[B[0]+px,B[1]+py,B[2]],[A[0]+px,A[1]+py,A[2]],n,n,n,CHROME);};
    st(-.42,.62,0,.02);st(.42,.62,0,.02);st(-.7,.3,-.36,-.62);st(-.36,-.62,0,-.1);st(0,-.1,.36,-.62);st(.36,-.62,.7,.3);
  },
  // slim grille with a chrome bar, big lamps swept up onto the wings
  front(c){
    const{quad,tri,trim,head,BLACK,CHROME}=c,z=2.06,F=[0,0,1];
    quad(trim,[-.31,.56,z+.004],[.31,.56,z+.004],[.335,.665,z+.004],[-.335,.665,z+.004],F,BLACK,false);
    quad(trim,[-.33,.61,z+.006],[.33,.61,z+.006],[.33,.622,z+.006],[-.33,.622,z+.006],F,CHROME,false);
    c.M.badge(c,.613,z+.01,.048);
    quad(trim,[.315,.538,z+.003],[.698,.546,z+.003],[.694,.662,z+.003],[.34,.672,z+.003],F,BLACK);
    quad(head,[.325,.546,z+.006],[.692,.554,z+.006],[.688,.654,z+.006],[.345,.664,z+.006],F,[.72,.76,.8]);
    for(const[cx,r]of[[.43,.045],[.585,.042]])for(let i=0;i<8;i++){const a=i/8*TAU,b=(i+1)/8*TAU,cy=.603;
      tri(head,[cx,cy,z+.008],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],F,F,F,[.97,.97,.93]);
      tri(head,[-cx,cy,z+.008],[-cx-Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],[-cx-Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],F,F,F,[.97,.97,.93]);}
    quad(head,[.7,.554,z+.002],[.785,.565,2.032],[.781,.68,2.032],[.696,.654,z+.002],[.35,0,.94],[.75,.79,.82]);
    quad(head,[.787,.565,2.03],[.843,.585,1.958],[.838,.715,1.958],[.783,.68,2.03],[.78,0,.62],[.93,.8,.6]);
  },
  // wide lamps reaching round the corners, plate under the big badge, roof spoiler
  rear(c){
    const{quad,box,trim,paint,tail,BLACK,RED,WHITE,PAINT}=c,z=-2.06,B=[0,0,-1];
    quad(tail,[.44,.78,z-.003],[.755,.77,z-.003],[.745,.955,z-.003],[.47,.96,z-.003],B,RED);
    quad(tail,[.52,.835,z-.005],[.7,.83,z-.005],[.7,.9,z-.005],[.52,.905,z-.005],B,[.95,.42,.4]);
    quad(tail,[.757,.77,z-.003],[.842,.78,-1.998],[.838,.94,-1.998],[.745,.955,z-.003],[.6,0,-.8],RED);
    quad(tail,[.844,.78,-1.996],[.872,.8,-1.84],[.87,.93,-1.84],[.84,.94,-1.996],[.97,0,-.25],RED);
    for(const x of[-.437,.43])quad(trim,[x,.57,z-.002],[x+.007,.57,z-.002],[x+.007,.97,z-.002],[x,.97,z-.002],B,BLACK,false);
    c.M.badge(c,.865,z-.006,.062);
    quad(trim,[-.02,1.03,-1.975],[.02,1.03,-1.975],[-.28,1.16,-1.86],[-.31,1.15,-1.86],[0,.6,-.8],BLACK,false);
    box(paint,-.55,.55,1.335,1.375,-1.64,-1.52,PAINT);
  },
  // body-colour bumpers, plate over a trapezoid intake with round fog lamps
  bumpers({quad,tri,bumper,trim,PAINT,PLASTIC,BLACK}){
    const FR=[[0,2.105],[.56,2.1],[.72,2.07],[.81,2.01],[.86,1.92],[.885,1.78],[.885,1.61]],RR=[[0,-2.105],[.56,-2.1],[.72,-2.07],[.81,-2.01],[.86,-1.92],[.885,-1.78],[.885,-1.73]];
    const out=(P,k)=>P.map(([x,z])=>[x*1.003,z+k*.003]);
    bumper(FR,.21,.545,PAINT);bumper(RR,.27,.57,PAINT);
    bumper(out(FR,1),.21,.25,PLASTIC);bumper(out(RR,-1),.27,.33,PLASTIC);
    quad(trim,[-.5,.235,2.108],[.5,.235,2.108],[.4,.355,2.108],[-.4,.355,2.108],[0,0,1],BLACK,false);
    quad(trim,[.56,.25,2.106],[.7,.25,2.086],[.7,.33,2.086],[.53,.33,2.106],[0,0,1],BLACK);
    const n=[0,0,1];for(let i=0;i<8;i++){const a=i/8*TAU,b=(i+1)/8*TAU,cx=.63,cy=.29,r=.03,zz=2.104;
      tri(trim,[cx,cy,zz],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,zz],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,zz],n,n,n,[.8,.8,.76]);
      tri(trim,[-cx,cy,zz],[-cx-Math.cos(b)*r,cy+Math.sin(b)*r,zz],[-cx-Math.cos(a)*r,cy+Math.sin(a)*r,zz],n,n,n,[.8,.8,.76]);}
  },
  doors(c){
    const{quad,box,trim,paint,side,BLACK,PAINT,PLASTIC,at}=c;
    for(const[z,y0]of[[.86,.33],[-.22,.33],[-1.07,.66]]){const[w,s]=at(z),m=.22+(s-.22)*.55;
      if(y0<m)quad(trim,[w+.003,y0,z],[w+.003,y0,z+.01],[w+.003,m,z+.01],[w+.003,m,z],side,BLACK);
      quad(trim,[w+.003,Math.max(y0,m),z],[w+.003,Math.max(y0,m),z+.01],[w*.995+.003,s-.03,z+.01],[w*.995+.003,s-.03,z],side,BLACK);}
    for(const z of[-.17,-1.02])quad(trim,[.882,.85,z],[.882,.85,z+.12],[.881,.88,z+.12],[.881,.88,z],side,BLACK);
    quad(trim,[.883,.36,.84],[.883,.36,-1.0],[.88,.4,-1.0],[.88,.4,.84],side,PLASTIC);
    box(trim,.77,.81,.92,.99,.66,.76,BLACK);box(paint,.81,.93,.93,1.04,.64,.77,PAINT);
  }};
