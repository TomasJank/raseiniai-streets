// Audi A6 C5 Avant (1998-2004), 4.80 x 1.81 x 1.50 m with rails, 2.76 m wheelbase. Rings drawn here (rings:false), as on the A4.
CAR_MODELS.a6_c5_avant={name:'Audi A6 C5 Avant',dims:[4.796,1.81,1.5],axles:[1.43,-1.33],arch:.39,
  lower:[[2.355,.74,.31,.66,.7],[2.325,.82,.27,.69,.73],[2.25,.87,.235,.72,.76],[2.1,.9,.22,.75,.79],[1.82,.905,.22,.79,.83],[1.43,.905,.22,.84,.875],[1.15,.905,.22,.875,.905],[1.04,.905,.22,.89,.92],[.6,.905,.22,.93,.96],[0,.905,.22,.96,.99],[-.6,.905,.22,.98,1.01],[-.94,.905,.22,.99,1.02],[-1.33,.905,.22,1,1.03],[-1.72,.905,.22,1.005,1.035],[-2,.9,.22,1.005,1.035],[-2.18,.885,.235,1,1.03],[-2.29,.85,.27,.99,1.02],[-2.355,.78,.31,.96,.99]],
  // the C5 arch: roof falling away at both ends into a long raked tailgate
  upper:[[1.13,0],[1,.99],[.85,1.1],[.67,1.22],[.48,1.32],[.3,1.39],[.1,1.44],[-.25,1.466],[-.34,1.468],[-.8,1.46],[-1.25,1.43],[-1.34,1.42],[-1.5,1.39],[-1.62,1.35],[-1.75,1.29],[-1.88,1.22],[-2,1.15],[-2.12,1.08],[-2.22,1.03],[-2.28,0]],
  side:[1,-1.62],pillars:[[1,.85],[-.25,-.34],[-1.25,-1.34]],glass:[.3,-1.62],strips:[],rings:false,
  mirror:null,plate:[[.36,2.401],[.7,-2.358]],grime:.3,
  front(c){
    const{quad,tri,ring,trim,head,BLACK,CHROME}=c,z=2.355,F=[0,0,1];
    quad(trim,[-.31,.525,z+.003],[.31,.525,z+.003],[.35,.67,z+.003],[-.35,.67,z+.003],F,CHROME,false);
    quad(trim,[-.297,.535,z+.005],[.297,.535,z+.005],[.335,.66,z+.005],[-.335,.66,z+.005],F,BLACK,false);
    for(let i=0;i<4;i++){const y=.556+i*.028;quad(trim,[-.3-i*.009,y,z+.007],[.3+i*.009,y,z+.007],[.3+i*.009,y+.007,z+.007],[-.3-i*.009,y+.007,z+.007],F,[.5,.5,.52],false);}
    for(let i=-1.5;i<2;i++)ring(i*.068,.6,z+.01,.045,CHROME);
    quad(trim,[.36,.53,z+.003],[.73,.555,z+.003],[.724,.655,z+.003],[.365,.675,z+.003],F,BLACK);
    quad(head,[.368,.538,z+.006],[.722,.562,z+.006],[.716,.648,z+.006],[.372,.667,z+.006],F,[.72,.76,.8]);
    for(const[cx,cy,r]of[[.46,.6,.045],[.62,.6,.04]])for(let i=0;i<8;i++){const a=i/8*TAU,b=(i+1)/8*TAU;
      tri(head,[cx,cy,z+.008],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],F,F,F,[.97,.97,.93]);
      tri(head,[-cx,cy,z+.008],[-cx-Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],[-cx-Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],F,F,F,[.97,.97,.93]);}
    quad(head,[.732,.562,z+.002],[.82,.572,2.327],[.816,.66,2.327],[.726,.648,z+.002],[.3,0,.95],[.75,.79,.82]);
    quad(head,[.822,.572,2.325],[.87,.59,2.252],[.866,.69,2.252],[.818,.66,2.325],[.8,0,.6],[.93,.8,.6]);
  },
  // body lamps either side of the tailgate, rings over the plate, silver rails
  rear(c){
    const{quad,ring,trim,tail,BLACK,CHROME,RED,WHITE,AMBER}=c,z=-2.355,B=[0,0,-1];
    quad(tail,[.5,.78,z-.003],[.764,.77,z-.003],[.752,.955,z-.003],[.5,.955,z-.003],B,RED);
    quad(tail,[.52,.81,z-.005],[.62,.81,z-.005],[.62,.86,z-.005],[.52,.86,z-.005],B,WHITE);
    quad(tail,[.63,.81,z-.005],[.73,.81,z-.005],[.73,.86,z-.005],[.63,.86,z-.005],B,AMBER);
    quad(tail,[.766,.77,z-.003],[.848,.775,-2.292],[.844,.94,-2.292],[.752,.955,z-.003],[.6,0,-.8],RED);
    quad(tail,[.85,.775,-2.29],[.883,.79,-2.17],[.882,.93,-2.17],[.846,.94,-2.29],[.97,0,-.25],RED);
    for(const x of[-.497,.49])quad(trim,[x,.57,z-.002],[x+.007,.57,z-.002],[x+.007,.97,z-.002],[x,.97,z-.002],B,BLACK,false);
    quad(trim,[-.3,.83,z-.004],[.3,.83,z-.004],[.3,.843,z-.004],[-.3,.843,z-.004],B,CHROME,false);
    for(let i=-1.5;i<2;i++)ring(i*.068,.9,z-.006,.04,CHROME);
    quad(trim,[-.02,1.05,-2.215],[.02,1.05,-2.215],[-.3,1.13,-2.07],[-.33,1.12,-2.07],[0,.8,-.6],BLACK,false);
    const U=c.M.upper,roof=q=>{for(let i=0;i<U.length-1;i++)if(q<=U[i][0]&&q>=U[i+1][0])return U[i][1]+(U[i+1][1]-U[i][1])*(U[i][0]-q)/(U[i][0]-U[i+1][0]);return 0;};
    const zs=[.15,-.25,-.8,-1.25,-1.4,-1.56],G=[.62,.63,.64];
    for(let i=0;i<zs.length-1;i++){const a=zs[i],b=zs[i+1],ya=roof(a)-.012,yb=roof(b)-.012,h=.04;
      quad(trim,[.58,ya,a],[.58,yb,b],[.58,yb+h,b],[.58,ya+h,a],[1,0,0],G);
      quad(trim,[.53,ya+h,a],[.58,ya+h,a],[.58,yb+h,b],[.53,yb+h,b],[0,1,0],G);
      quad(trim,[.53,ya,a],[.53,yb,b],[.53,yb+h,b],[.53,ya+h,a],[-1,0,0],G);}
    for(const q of[.15,-1.56]){const y=roof(q)-.012,s=Math.sign(q);quad(trim,[.53,y,q],[.58,y,q],[.58,y+.04,q],[.53,y+.04,q],[0,0,s],G);}
  },
  // body-colour bumpers carrying the door strip line, intake under the plate
  bumpers({quad,bumper,trim,PAINT,PLASTIC,BLACK,CHROME}){
    const FR=[[0,2.398],[.62,2.393],[.78,2.362],[.86,2.3],[.9,2.2],[.915,2.02],[.915,1.82]],RR=[[0,-2.398],[.62,-2.393],[.78,-2.362],[.86,-2.3],[.9,-2.2],[.915,-2.02],[.915,-1.72]];
    const out=(P,k,s=1.003)=>P.map(([x,z])=>[x*s,z+k*(s-1)]);
    bumper(FR,.21,.525,PAINT);bumper(RR,.27,.57,PAINT);
    bumper(out(FR,1),.21,.25,PLASTIC);bumper(out(RR,-1),.27,.32,PLASTIC);
    bumper(out(FR,1),.47,.51,BLACK);bumper(out(RR,-1),.47,.51,BLACK);
    bumper(out(FR,1,1.006),.486,.494,CHROME);bumper(out(RR,-1,1.006),.486,.494,CHROME);
    quad(trim,[-.48,.245,2.401],[.48,.245,2.401],[.44,.345,2.401],[-.44,.345,2.401],[0,0,1],BLACK,false);
  },
  doors(c){
    const{quad,box,trim,paint,side,BLACK,PAINT,CHROME,at}=c;
    quad(trim,[.912,.47,1.04],[.912,.47,-1.3],[.912,.51,-1.3],[.912,.51,1.04],side,BLACK);
    quad(trim,[.915,.486,1.04],[.915,.486,-1.3],[.915,.494,-1.3],[.915,.494,1.04],side,CHROME);
    for(const[z,y0]of[[1.05,.33],[-.3,.33],[-1.3,.71]]){const[w,s]=at(z),m=.22+(s-.22)*.55;
      if(y0<m)quad(trim,[w+.003,y0,z],[w+.003,y0,z+.01],[w+.003,m,z+.01],[w+.003,m,z],side,BLACK);
      quad(trim,[w+.003,Math.max(y0,m),z],[w+.003,Math.max(y0,m),z+.01],[w*.995+.003,s-.03,z+.01],[w*.995+.003,s-.03,z],side,BLACK);}
    for(const z of[-.24,-1.24])quad(trim,[.907,.86,z],[.907,.86,z+.13],[.906,.885,z+.13],[.906,.885,z],side,CHROME);
    box(trim,.77,.82,.93,1,.86,.96,BLACK);box(paint,.82,.95,.94,1.05,.84,.97,PAINT);
  }};
