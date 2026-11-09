// Audi A4 B6 saloon (2000-2004), 4.55 x 1.77 x 1.43 m, 2.65 m wheelbase. The rings are drawn here (rings:false) because
// the builder's fixed ring places do not sit on this nose and boot.
CAR_MODELS.a4_b6={name:'Audi A4 B6',dims:[4.547,1.766,1.428],axles:[1.355,-1.295],arch:.385,
  // long bonnet, high belt, short boot deck
  lower:[[2.23,.72,.31,.66,.7],[2.2,.8,.27,.69,.73],[2.12,.85,.235,.72,.76],[1.98,.875,.22,.75,.79],[1.74,.883,.22,.785,.825],[1.355,.883,.22,.83,.865],[1.1,.883,.22,.86,.89],[.97,.883,.22,.875,.905],[.5,.883,.22,.915,.945],[0,.883,.22,.945,.975],[-.5,.883,.22,.97,1],[-.91,.883,.22,.985,1.015],[-1.295,.883,.22,.995,1.025],[-1.68,.88,.22,1,1.03],[-1.95,.87,.225,1,1.03],[-2.12,.85,.25,.995,1.025],[-2.2,.81,.28,.98,1],[-2.23,.76,.31,.95,.97]],
  // arched roof, back light falling onto a short deck
  upper:[[1.05,0],[.92,.99],[.78,1.09],[.6,1.2],[.42,1.29],[.24,1.36],[.05,1.4],[-.22,1.418],[-.3,1.42],[-.7,1.413],[-.95,1.39],[-1.03,1.375],[-1.2,1.32],[-1.38,1.22],[-1.52,1.12],[-1.63,0]],
  side:[.92,-1.2],pillars:[[.92,.78],[-.22,-.3],[-.95,-1.03]],glass:[.24,-1.03],strips:[],rings:false,
  mirror:null,plate:[[.36,2.276],[.6,-2.234]],grime:.3,
  // low chrome-framed grille between the lamps, rings on it; swept lamps with twin projectors
  front(c){
    const{quad,tri,ring,trim,head,BLACK,CHROME}=c,z=2.23,F=[0,0,1];
    quad(trim,[-.3,.53,z+.003],[.3,.53,z+.003],[.345,.665,z+.003],[-.345,.665,z+.003],F,CHROME,false);
    quad(trim,[-.287,.54,z+.005],[.287,.54,z+.005],[.33,.655,z+.005],[-.33,.655,z+.005],F,BLACK,false);
    for(let i=0;i<4;i++){const y=.56+i*.026;quad(trim,[-.3-i*.008,y,z+.007],[.3+i*.008,y,z+.007],[.3+i*.008,y+.006,z+.007],[-.3-i*.008,y+.006,z+.007],F,[.22,.22,.23],false);}
    for(let i=-1.5;i<2;i++)ring(i*.068,.6,z+.01,.044,CHROME);
    quad(trim,[.35,.54,z+.003],[.712,.575,z+.003],[.705,.655,z+.003],[.355,.668,z+.003],F,BLACK);
    quad(head,[.358,.548,z+.006],[.705,.582,z+.006],[.698,.648,z+.006],[.362,.66,z+.006],F,[.72,.76,.8]);
    for(const[cx,cy,r]of[[.44,.6,.042],[.58,.61,.035]])for(let i=0;i<8;i++){const a=i/8*TAU,b=(i+1)/8*TAU;
      tri(head,[cx,cy,z+.008],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],F,F,F,[.97,.97,.93]);
      tri(head,[-cx,cy,z+.008],[-cx-Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],[-cx-Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],F,F,F,[.97,.97,.93]);}
    quad(head,[.714,.582,z+.002],[.8,.592,2.202],[.796,.672,2.202],[.707,.648,z+.002],[.3,0,.95],[.75,.79,.82]);
    quad(head,[.802,.592,2.2],[.85,.612,2.122],[.845,.7,2.122],[.798,.672,2.2],[.8,0,.6],[.93,.8,.6]);
  },
  // split lamps across body and boot lid, plate and chrome strip on the lid, rings above
  rear(c){
    const{quad,ring,trim,tail,BLACK,CHROME,RED,WHITE}=c,z=-2.23,B=[0,0,-1];
    quad(tail,[.4,.765,z-.003],[.746,.755,z-.003],[.735,.94,z-.003],[.42,.94,z-.003],B,RED);
    quad(tail,[.42,.775,z-.005],[.52,.775,z-.005],[.52,.83,z-.005],[.42,.83,z-.005],B,WHITE);
    quad(tail,[.748,.755,z-.003],[.81,.76,-2.202],[.806,.93,-2.202],[.735,.94,z-.003],[.5,0,-.86],RED);
    quad(tail,[.812,.76,-2.2],[.852,.775,-2.11],[.85,.915,-2.11],[.808,.93,-2.2],[.9,0,-.4],RED);
    for(const x of[-.537,.53])quad(trim,[x,.565,z-.002],[x+.007,.565,z-.002],[x+.007,.945,z-.002],[x,.945,z-.002],B,BLACK,false);
    quad(trim,[-.3,.74,z-.004],[.3,.74,z-.004],[.3,.752,z-.004],[-.3,.752,z-.004],B,CHROME,false);
    for(let i=-1.5;i<2;i++)ring(i*.068,.865,z-.006,.042,CHROME);
  },
  // body-colour bumpers, wide lower intake, fog lamps in the corners
  bumpers({quad,tri,bumper,trim,PAINT,PLASTIC,BLACK}){
    const FR=[[0,2.273],[.6,2.268],[.75,2.24],[.83,2.18],[.875,2.08],[.89,1.92],[.89,1.74]],RR=[[0,-2.273],[.6,-2.268],[.75,-2.24],[.83,-2.18],[.875,-2.08],[.89,-1.92],[.89,-1.68]];
    const out=(P,k)=>P.map(([x,z])=>[x*1.003,z+k*.003]);
    bumper(FR,.21,.53,PAINT);bumper(RR,.27,.565,PAINT);
    bumper(out(FR,1),.21,.25,PLASTIC);bumper(out(RR,-1),.27,.33,PLASTIC);
    quad(trim,[-.46,.24,2.276],[.46,.24,2.276],[.42,.34,2.276],[-.42,.34,2.276],[0,0,1],BLACK,false);
    quad(trim,[.54,.25,2.274],[.73,.25,2.246],[.72,.34,2.246],[.52,.34,2.274],[0,0,1],BLACK);
    const n=[0,0,1];for(let i=0;i<8;i++){const a=i/8*TAU,b=(i+1)/8*TAU,cx=.63,cy=.295,r=.032,zz=2.272;
      tri(trim,[cx,cy,zz],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,zz],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,zz],n,n,n,[.8,.8,.76]);
      tri(trim,[-cx,cy,zz],[-cx-Math.cos(b)*r,cy+Math.sin(b)*r,zz],[-cx-Math.cos(a)*r,cy+Math.sin(a)*r,zz],n,n,n,[.8,.8,.76]);}
  },
  doors(c){
    const{quad,box,trim,paint,side,BLACK,PAINT,CHROME,at}=c;
    for(const[z,y0]of[[.98,.33],[-.26,.33],[-1.02,.69]]){const[w,s]=at(z),m=.22+(s-.22)*.55;
      if(y0<m)quad(trim,[w+.003,y0,z],[w+.003,y0,z+.01],[w+.003,m,z+.01],[w+.003,m,z],side,BLACK);
      quad(trim,[w+.003,Math.max(y0,m),z],[w+.003,Math.max(y0,m),z+.01],[w*.995+.003,s-.03,z+.01],[w*.995+.003,s-.03,z],side,BLACK);}
    for(const z of[-.2,-.97])quad(trim,[.885,.855,z],[.885,.855,z+.12],[.884,.88,z+.12],[.884,.88,z],side,CHROME);
    box(trim,.77,.81,.93,1,.76,.86,BLACK);box(paint,.81,.93,.94,1.04,.74,.87,PAINT);
  }};
