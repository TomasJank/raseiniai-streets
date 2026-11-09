// BMW 3 Series E46 saloon, 4.47 x 1.74 x 1.42 m, 2.725 m wheelbase; short overhangs, cab set back, short deck.
CAR_MODELS.e46={name:'BMW 3 E46',dims:[4.47,1.74,1.42],axles:[1.47,-1.255],arch:.39,
  lower:[[2.2,.72,.32,.67,.7],[2.15,.8,.27,.7,.73],[2.06,.845,.23,.735,.765],[1.86,.865,.22,.76,.79],[1.47,.87,.22,.81,.845],[1.08,.87,.22,.85,.885],[.7,.87,.22,.885,.92],[0,.87,.22,.915,.955],[-.6,.87,.22,.94,.98],[-.865,.87,.22,.95,.99],[-1.255,.87,.22,.965,1.005],[-1.5,.87,.22,.975,1.015],[-1.645,.87,.22,.98,1.02],[-1.9,.86,.22,.985,1.025],[-2.1,.835,.26,.975,1.015],[-2.19,.76,.3,.93,.98]],
  upper:[[.9,0],[.75,1],[.58,1.11],[.4,1.22],[.22,1.315],[.08,1.375],[-.04,1.405],[-.13,1.415],[-.22,1.418],[-.7,1.418],[-.86,1.405],[-1.02,1.375],[-1.05,1.368],[-1.18,1.33],[-1.32,1.27],[-1.46,1.19],[-1.6,1.1],[-1.7,1.04],[-1.78,0]],
  side:[.66,-1.47],pillars:[[-.13,-.22],[-1.02,-1.05]],glass:[.08,-.95],strips:[],rings:false,
  mirror:null,plate:[[.3,2.243],[.615,-2.196]],grime:.3,
  // twin kidneys in the bonnet line between twin round lamps with the white halo rings
  front({quad,box,tri,trim,head,CHROME,BLACK,AMBER}){
    const z=2.2,N=[0,0,1];
    const oct=(l,x0,x1,y0,y1,k,o,col)=>{quad(l,[x0+k,y0,z+o],[x1-k,y0,z+o],[x1-k,y1,z+o],[x0+k,y1,z+o],N,col);quad(l,[x0,y0+k,z+o],[x1,y0+k,z+o],[x1,y1-k,z+o],[x0,y1-k,z+o],N,col);};
    oct(trim,.02,.19,.5,.665,.035,.006,CHROME);oct(trim,.035,.175,.515,.65,.03,.008,BLACK);
    for(let i=1;i<5;i++){const x=.035+i*.028;quad(trim,[x-.004,.52,z+.01],[x+.004,.52,z+.01],[x+.004,.645,z+.01],[x-.004,.645,z+.01],N,[.55,.56,.58]);}
    const disc=(cx,cy,r,o,col,l)=>{for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU;tri(l,[cx,cy,z+o],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z+o],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z+o],N,N,N,col);tri(l,[-cx,cy,z+o],[-cx-Math.cos(a)*r,cy+Math.sin(a)*r,z+o],[-cx-Math.cos(b)*r,cy+Math.sin(b)*r,z+o],N,N,N,col);}};
    const halo=(cx,cy,r)=>{for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU,n=r*.8;quad(head,[cx+Math.cos(a)*n,cy+Math.sin(a)*n,z+.012],[cx+Math.cos(b)*n,cy+Math.sin(b)*n,z+.012],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z+.012],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z+.012],N,[1,1,1]);}};
    quad(trim,[.2,.535,z+.006],[.72,.55,z+.006],[.7,.655,z+.006],[.215,.66,z+.006],N,[.3,.32,.35]);
    for(const x of[.295,.485]){disc(x,.597,.05,.009,[.88,.9,.92],head);halo(x,.597,.064);}
    quad(trim,[.565,.565,z+.009],[.71,.57,z+.009],[.7,.63,z+.009],[.565,.63,z+.009],N,[.62,.64,.66]);
    quad(head,[.72,.555,z+.004],[.8,.555,2.152],[.8,.64,2.152],[.705,.65,z+.004],[.65,0,.76],AMBER);
  },
  // L-shaped lamps: tall outer piece on the wing, a lower-set strip on the boot lid; plate in the lid between them
  rear({quad,tri,trim,tail,CHROME,RED,AMBER,CLEAR}){
    const z=-2.196,N=[0,0,-1];
    quad(tail,[.47,.72,z],[.76,.72,z],[.76,.9,z],[.47,.93,z],N,RED);
    quad(tail,[.76,.72,z],[.84,.72,-2.1],[.84,.94,-2.1],[.76,.9,z],[.77,0,-.64],RED);
    quad(tail,[.2,.83,z],[.47,.83,z],[.47,.93,z],[.2,.93,z],N,RED);
    quad(tail,[.52,.76,z-.004],[.7,.76,z-.004],[.7,.81,z-.004],[.52,.81,z-.004],N,AMBER);
    quad(tail,[.26,.85,z-.004],[.44,.85,z-.004],[.44,.88,z-.004],[.26,.88,z-.004],N,CLEAR);
    quad(trim,[-.2,.755,z-.004],[.2,.755,z-.004],[.2,.77,z-.004],[-.2,.77,z-.004],N,CHROME,false);
    for(let i=0;i<12;i++){const a=i/12*TAU,b=(i+1)/12*TAU,r=.032,c=(q,s)=>[Math.cos(q)*s,.89+Math.sin(q)*s,z-.006];
      tri(trim,c(0,0),c(a,r),c(b,r),N,N,N,[.9,.9,.92]);tri(trim,c(0,0),c(a,r*.7),c(b,r*.7),N,N,N,(i%6<3)===(i<6)?[.1,.35,.75]:[.95,.95,.95]);}
  },
  // body-colour bumpers with a black rub strip; intake and fog lamps low in the front one
  bumpers({quad,bumper,trim,PAINT,BLACK,PLASTIC}){
    const FR=[[0,2.235],[.7,2.225],[.8,2.18],[.855,2.1],[.872,1.95],[.872,1.86]],RR=[[0,-2.235],[.7,-2.225],[.79,-2.18],[.84,-2.1],[.872,-1.64]];
    bumper(FR,.21,.52,PAINT);bumper(RR,.3,.6,PAINT);
    const o=(P,k)=>P.map(([x,z])=>[x*1.003,z+.003*Math.sign(z)]);
    bumper(o(FR),.43,.47,PLASTIC);bumper(o(RR),.47,.51,PLASTIC);
    quad(trim,[-.4,.22,2.239],[.4,.22,2.239],[.38,.29,2.239],[-.38,.29,2.239],[0,0,1],BLACK,false);
    quad(trim,[.55,.25,2.232],[.68,.25,2.228],[.68,.33,2.228],[.55,.33,2.232],[0,0,1],BLACK);
    quad(trim,[.57,.265,2.236],[.66,.265,2.232],[.66,.315,2.232],[.57,.315,2.236],[0,0,1],[.8,.8,.76]);
  },
  // shut lines, low rub strip, body-colour handles and mirrors, and the Hofmeister kink painted over the quarter glass
  doors({M,quad,tri,box,paint,trim,side,belt,PAINT,BLACK,PLASTIC}){
    for(const[z,y0]of[[1.02,.33],[-.17,.33],[-1.1,.66]]){
      if(y0<.6)quad(trim,[.862,y0,z],[.862,y0,z+.012],[.874,.6,z+.012],[.874,.6,z],side,BLACK);
      quad(trim,[.874,Math.max(y0,.6),z],[.874,Math.max(y0,.6),z+.012],[.86,.92,z+.012],[.86,.92,z],side,BLACK);
    }
    quad(trim,[.874,.44,1.0],[.874,.44,-.83],[.874,.47,-.83],[.874,.47,1.0],side,PLASTIC);
    for(const z of[-.08,-1.0])quad(paint,[.874,.82,z],[.874,.82,z+.12],[.871,.85,z+.12],[.871,.85,z],side);
    box(paint,.8,.91,.9,1.0,.58,.71,PAINT);box(trim,.76,.8,.87,.97,.6,.7,BLACK);
    // Hofmeister kink: paint over the rear corner of the quarter glass, the edge slants back then turns forward at the belt
    const up=M.upper,top=z=>{for(let i=0;i<up.length-1;i++){const[a,ha]=up[i],[b,hb]=up[i+1];if(z<=a&&z>=b)return ha+(hb-ha)*(a-z)/(a-b)-.072;}};
    const g=(z,y)=>{const b=belt(z)-.01;return[.776-.17*(y-b)/.44,y,z];},n=[.93,.36,0],m=q=>[-q[0],q[1],q[2]],mn=[-.93,.36,0];
    const A=g(-1.48,belt(-1.48)),B=g(-1.35,belt(-1.35)),C=g(-1.44,belt(-1.44)+.08),D=g(-1.33,top(-1.33)+.016),E=g(-1.48,top(-1.48)+.016);
    for(const[p,q,r]of[[A,B,C],[A,C,E],[C,D,E]]){tri(paint,p,q,r,n,n,n,PAINT);tri(paint,m(p),m(q),m(r),mn,mn,mn,PAINT);}
  }};
