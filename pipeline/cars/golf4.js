// VW Golf IV 5-door (1997-2004), 4.15 x 1.735 x 1.44 m, 2.51 m wheelbase.
CAR_MODELS.golf4={name:'VW Golf IV',dims:[4.15,1.735,1.444],axles:[1.235,-1.275],arch:.375,
  // short nose, high flat belt, near-vertical tail
  lower:[[2.03,.7,.31,.7,.74],[2,.78,.27,.72,.76],[1.93,.83,.235,.745,.785],[1.8,.86,.22,.77,.81],[1.61,.868,.22,.795,.835],[1.235,.868,.22,.845,.88],[.95,.868,.22,.875,.905],[.86,.868,.22,.885,.915],[.4,.868,.22,.915,.945],[0,.868,.22,.93,.96],[-.5,.868,.22,.945,.975],[-.9,.868,.22,.955,.985],[-1.275,.868,.22,.96,.99],[-1.65,.865,.22,.965,.995],[-1.85,.855,.225,.965,.995],[-1.96,.83,.25,.96,.99],[-2.03,.76,.3,.94,.97]],
  // round roof, hatch glass between thick C-pillars
  upper:[[.93,0],[.8,1],[.68,1.09],[.5,1.22],[.3,1.335],[.1,1.4],[-.16,1.43],[-.25,1.436],[-.6,1.43],[-1.02,1.4],[-1.3,1.365],[-1.5,1.32],[-1.64,1.26],[-1.76,1.17],[-1.87,1.06],[-1.95,0]],
  side:[.8,-1.02],pillars:[[.8,.68],[-.16,-.25]],glass:[.3,-1.55],strips:[],rings:false,
  mirror:null,plate:[[.36,2.078],[.4,-2.078]],grime:.35,
  badge({tri,ring,trim,CHROME},cy,z,r){
    const d=Math.sign(z),n=[0,0,d],dark=[.06,.08,.14];
    for(let i=0;i<10;i++){const a=i/10*TAU,b=(i+1)/10*TAU;tri(trim,[0,cy,z],[Math.cos(a)*r,cy+Math.sin(a)*r,z],[Math.cos(b)*r,cy+Math.sin(b)*r,z],n,n,n,dark);}
    ring(0,cy,z+d*.001,r,CHROME);
    const st=(x0,y0,x1,y1)=>{const dx=x1-x0,dy=y1-y0,m=Math.hypot(dx,dy),w=.09*r,px=-dy/m*w,py=dx/m*w,q=(x,y)=>[x*r,cy+y*r,z+d*.002];
      const A=q(x0,y0),B=q(x1,y1);tri(trim,[A[0]-px,A[1]-py,A[2]],[B[0]-px,B[1]-py,B[2]],[B[0]+px,B[1]+py,B[2]],n,n,n,CHROME);tri(trim,[A[0]-px,A[1]-py,A[2]],[B[0]+px,B[1]+py,B[2]],[A[0]+px,A[1]+py,A[2]],n,n,n,CHROME);};
    st(-.42,.62,0,.02);st(.42,.62,0,.02);st(-.7,.3,-.36,-.62);st(-.36,-.62,0,-.1);st(0,-.1,.36,-.62);st(.36,-.62,.7,.3);
  },
  // slim black grille round the badge, tall clear lamps with a big and a small round reflector
  front(c){
    const{quad,tri,trim,head,BLACK}=c,z=2.03,F=[0,0,1];
    quad(trim,[-.31,.595,z+.004],[.31,.595,z+.004],[.315,.705,z+.004],[-.315,.705,z+.004],F,BLACK,false);
    for(const y of[.625,.66])quad(trim,[-.3,y,z+.006],[.3,y,z+.006],[.3,y+.01,z+.006],[-.3,y+.01,z+.006],F,[.2,.2,.21],false);
    c.M.badge(c,.65,z+.01,.05);
    quad(trim,[.32,.575,z+.003],[.69,.575,z+.003],[.685,.695,z+.003],[.32,.712,z+.003],F,BLACK);
    quad(head,[.328,.583,z+.006],[.684,.583,z+.006],[.68,.687,z+.006],[.328,.703,z+.006],F,[.7,.74,.77]);
    for(const[cx,r]of[[.42,.052],[.58,.04]])for(let i=0;i<8;i++){const a=i/8*TAU,b=(i+1)/8*TAU,cy=.642;
      tri(head,[cx,cy,z+.008],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],F,F,F,[.97,.97,.93]);
      tri(head,[-cx,cy,z+.008],[-cx-Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],[-cx-Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],F,F,F,[.97,.97,.93]);}
    quad(head,[.692,.583,z+.002],[.772,.583,2.002],[.77,.675,2.002],[.686,.687,z+.002],[.35,0,.94],[.93,.8,.6]);
  },
  // corner lamps beside the tailgate, badge over the bumper
  rear(c){
    const{quad,trim,tail,BLACK,RED,WHITE,AMBER}=c,z=-2.03,B=[0,0,-1];
    quad(tail,[.5,.75,z-.003],[.752,.75,z-.003],[.745,.9,z-.003],[.47,.9,z-.003],B,RED);
    quad(tail,[.5,.69,z-.003],[.62,.69,z-.003],[.62,.75,z-.003],[.5,.75,z-.003],B,AMBER);
    quad(tail,[.62,.69,z-.003],[.754,.69,z-.003],[.752,.75,z-.003],[.62,.75,z-.003],B,WHITE);
    quad(tail,[.754,.69,z-.003],[.83,.69,-1.962],[.828,.885,-1.962],[.745,.9,z-.003],[.6,0,-.8],RED);
    quad(tail,[.832,.7,-1.958],[.856,.71,-1.86],[.856,.87,-1.86],[.83,.885,-1.96],[.97,0,-.25],RED);
    for(const x of[-.47,.463])quad(trim,[x,.57,z-.002],[x+.007,.57,z-.002],[x+.007,.95,z-.002],[x,.95,z-.002],B,BLACK,false);
    quad(trim,[-.47,.57,z-.002],[.47,.57,z-.002],[.47,.577,z-.002],[-.47,.577,z-.002],B,BLACK,false);
    c.M.badge(c,.8,z-.006,.055);
    quad(trim,[-.02,1.0,-1.93],[.02,1.0,-1.93],[-.28,1.14,-1.84],[-.31,1.13,-1.84],[0,.6,-.8],BLACK,false);
  },
  // body-colour bumpers, black rub strip in line with the door strips, plate recess at the back
  bumpers({quad,bumper,trim,PAINT,BLACK,PLASTIC}){
    const FR=[[0,2.075],[.56,2.07],[.72,2.04],[.8,1.99],[.85,1.9],[.875,1.75],[.875,1.61]],RR=[[0,-2.075],[.56,-2.07],[.72,-2.04],[.8,-1.99],[.85,-1.9],[.875,-1.75],[.875,-1.65]];
    const out=(P,k)=>P.map(([x,z])=>[x*1.003,z+k*.003]);
    bumper(FR,.21,.56,PAINT);bumper(RR,.27,.57,PAINT);
    bumper(out(FR,1),.21,.27,PLASTIC);bumper(out(RR,-1),.27,.32,PLASTIC);
    bumper(out(FR,1),.47,.505,BLACK);bumper(out(RR,-1),.47,.505,BLACK);
    quad(trim,[-.48,.245,2.08],[.48,.245,2.08],[.44,.34,2.08],[-.44,.34,2.08],[0,0,1],BLACK,false);
    quad(trim,[-.3,.385,-2.077],[.3,.385,-2.077],[.3,.535,-2.077],[-.3,.535,-2.077],[0,0,-1],[.1,.1,.11],false);
  },
  doors(c){
    const{quad,box,trim,paint,side,BLACK,PAINT,at}=c;
    quad(trim,[.872,.47,.85],[.872,.47,-1.0],[.872,.505,-1.0],[.872,.505,.85],side,BLACK);
    for(const[z,y0]of[[.86,.33],[-.2,.33],[-1.0,.66]]){const[w,s]=at(z),m=.22+(s-.22)*.55;
      if(y0<m)quad(trim,[w+.003,y0,z],[w+.003,y0,z+.01],[w+.003,m,z+.01],[w+.003,m,z],side,BLACK);
      quad(trim,[w+.003,Math.max(y0,m),z],[w+.003,Math.max(y0,m),z+.01],[w*.995+.003,s-.03,z+.01],[w*.995+.003,s-.03,z],side,BLACK);}
    for(const z of[-.15,-.95])quad(trim,[.871,.83,z],[.871,.83,z+.12],[.87,.86,z+.12],[.87,.86,z],side,BLACK);
    box(trim,.77,.81,.9,.97,.66,.76,BLACK);box(paint,.81,.92,.91,1.01,.64,.76,PAINT);
  }};
