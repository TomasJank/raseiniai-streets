// BMW 5 Series E39 saloon, 4.775 x 1.80 x 1.435 m, 2.83 m wheelbase; long bonnet, quad round lamps, wide wrap-round tail lamps.
CAR_MODELS.e39={name:'BMW 5 E39',dims:[4.775,1.8,1.435],axles:[1.578,-1.252],arch:.39,
  lower:[[2.35,.76,.32,.68,.71],[2.3,.83,.27,.71,.74],[2.2,.875,.23,.74,.77],[1.968,.9,.22,.765,.795],[1.578,.9,.22,.81,.845],[1.188,.9,.22,.85,.885],[.8,.9,.22,.88,.915],[0,.9,.22,.905,.945],[-.6,.9,.22,.925,.965],[-.862,.9,.22,.93,.97],[-1.252,.9,.22,.94,.98],[-1.642,.9,.22,.95,.99],[-1.9,.895,.22,.955,.995],[-2.15,.88,.24,.955,.995],[-2.28,.85,.27,.945,.985],[-2.35,.78,.31,.905,.955]],
  upper:[[.85,0],[.7,1],[.52,1.12],[.34,1.23],[.16,1.33],[.02,1.39],[-.1,1.418],[-.19,1.427],[-.28,1.427],[-.85,1.427],[-1,1.415],[-1.12,1.392],[-1.15,1.386],[-1.3,1.34],[-1.45,1.27],[-1.6,1.185],[-1.74,1.1],[-1.85,1.035],[-1.93,0]],
  side:[.66,-1.6],pillars:[[-.19,-.28],[-1.12,-1.15]],glass:[.02,-1],strips:[],rings:false,
  mirror:null,plate:[[.3,2.393],[.6,-2.356]],grime:.35,
  // tall kidneys set into the bonnet, two round lamps a side under one glass with the halo rings, clear corner indicators
  front({quad,tri,trim,head,CHROME,BLACK}){
    const z=2.35,N=[0,0,1];
    const oct=(l,x0,x1,y0,y1,k,o,col)=>{quad(l,[x0+k,y0,z+o],[x1-k,y0,z+o],[x1-k,y1,z+o],[x0+k,y1,z+o],N,col);quad(l,[x0,y0+k,z+o],[x1,y0+k,z+o],[x1,y1-k,z+o],[x0,y1-k,z+o],N,col);};
    oct(trim,.025,.2,.49,.685,.04,.006,CHROME);oct(trim,.04,.185,.505,.67,.034,.008,BLACK);
    for(let i=1;i<6;i++){const x=.04+i*.024;quad(trim,[x-.004,.51,z+.01],[x+.004,.51,z+.01],[x+.004,.665,z+.01],[x-.004,.665,z+.01],N,[.55,.56,.58]);}
    const disc=(cx,cy,r,o,col)=>{for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU;for(const s of[1,-1])tri(head,[s*cx,cy,z+o],[s*(cx+Math.cos(a)*r),cy+Math.sin(a)*r,z+o],[s*(cx+Math.cos(b)*r),cy+Math.sin(b)*r,z+o],N,N,N,col);}};
    const halo=(cx,cy,r)=>{for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU,n=r*.8;quad(head,[cx+Math.cos(a)*n,cy+Math.sin(a)*n,z+.012],[cx+Math.cos(b)*n,cy+Math.sin(b)*n,z+.012],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z+.012],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z+.012],N,[1,1,1]);}};
    quad(trim,[.215,.52,z+.004],[.76,.525,z+.004],[.76,.66,z+.004],[.215,.67,z+.004],N,CHROME);
    quad(trim,[.225,.53,z+.006],[.62,.535,z+.006],[.62,.655,z+.006],[.225,.66,z+.006],N,[.2,.22,.25]);
    for(const x of[.318,.522]){disc(x,.595,.052,.009,[.88,.9,.92]);halo(x,.595,.066);}
    quad(trim,[.63,.54,z+.007],[.76,.535,z+.007],[.76,.65,z+.007],[.63,.655,z+.007],N,[.8,.82,.84]);
    quad(trim,[.76,.53,z+.004],[.834,.53,2.302],[.834,.65,2.302],[.76,.65,z+.004],[.56,0,.83],[.8,.82,.84]);
  },
  // wedge lamps from the wing corners across the boot lid, plate in the lid under a chrome strip, roundel above
  rear({quad,tri,trim,tail,CHROME,RED,CLEAR}){
    const z=-2.356,N=[0,0,-1],DR=[.45,.04,.06];
    quad(tail,[.3,.8,z],[.78,.73,z],[.78,.9,z],[.3,.935,z],N,RED);
    quad(tail,[.78,.73,z],[.856,.73,-2.276],[.856,.915,-2.276],[.78,.9,z],[.7,0,-.7],RED);
    quad(tail,[.32,.86,z-.003],[.73,.84,z-.003],[.73,.87,z-.003],[.32,.885,z-.003],N,DR);
    quad(tail,[.36,.815,z-.003],[.48,.805,z-.003],[.48,.84,z-.003],[.36,.85,z-.003],N,CLEAR);
    quad(trim,[-.3,.735,z-.004],[.3,.735,z-.004],[.3,.75,z-.004],[-.3,.75,z-.004],N,CHROME,false);
    for(let i=0;i<12;i++){const a=i/12*TAU,b=(i+1)/12*TAU,r=.034,c=(q,s)=>[Math.cos(q)*s,.9+Math.sin(q)*s,z-.006];
      tri(trim,c(0,0),c(a,r),c(b,r),N,N,N,[.9,.9,.92]);tri(trim,c(0,0),c(a,r*.7),c(b,r*.7),N,N,N,(i%6<3)===(i<6)?[.1,.35,.75]:[.95,.95,.95]);}
  },
  // body-colour bumpers with a broad black rub strip; intake and round fog lamps low in the front
  bumpers({quad,bumper,trim,PAINT,BLACK,PLASTIC}){
    const FR=[[0,2.388],[.72,2.378],[.83,2.33],[.885,2.25],[.902,2.1],[.902,1.968]],RR=[[0,-2.388],[.72,-2.378],[.82,-2.33],[.87,-2.25],[.902,-1.642]];
    bumper(FR,.21,.52,PAINT);bumper(RR,.31,.6,PAINT);
    const o=P=>P.map(([x,z])=>[x*1.003,z+.003*Math.sign(z)]);
    bumper(o(FR),.42,.48,PLASTIC);bumper(o(RR),.45,.51,PLASTIC);
    quad(trim,[-.45,.22,2.392],[.45,.22,2.392],[.42,.29,2.392],[-.42,.29,2.392],[0,0,1],BLACK,false);
    for(let i=0;i<10;i++){const a=i/10*TAU,b=(i+1)/10*TAU,c=(q,r)=>[.64+Math.cos(q)*r,.31+Math.sin(q)*r,2.386];
      quad(trim,c(a,0),c(a,.045),c(b,.045),c(b,0),[0,0,1],[.8,.8,.76]);}
  },
  // shut lines, body-side moulding, chrome-look handles, body-colour mirrors, and the Hofmeister kink over the quarter glass
  doors({M,quad,tri,box,paint,trim,side,belt,PAINT,BLACK,PLASTIC,CHROME}){
    for(const[z,y0]of[[1.1,.33],[-.24,.33],[-1.17,.67]]){
      if(y0<.6)quad(trim,[.892,y0,z],[.892,y0,z+.012],[.904,.6,z+.012],[.904,.6,z],side,BLACK);
      quad(trim,[.904,Math.max(y0,.6),z],[.904,Math.max(y0,.6),z+.012],[.89,.92,z+.012],[.89,.92,z],side,BLACK);
    }
    quad(trim,[.904,.45,1.1],[.904,.45,-.86],[.904,.5,-.86],[.904,.5,1.1],side,PLASTIC);
    for(const z of[-.14,-1.08])quad(trim,[.904,.81,z],[.904,.81,z+.13],[.901,.84,z+.13],[.901,.84,z],side,CHROME);
    box(paint,.8,.91,.9,1.0,.56,.69,PAINT);box(trim,.76,.8,.87,.97,.58,.68,BLACK);
    const up=M.upper,top=z=>{for(let i=0;i<up.length-1;i++){const[a,ha]=up[i],[b,hb]=up[i+1];if(z<=a&&z>=b)return ha+(hb-ha)*(a-z)/(a-b)-.072;}};
    const g=(z,y)=>{const b=belt(z)-.01;return[.776-.17*(y-b)/.44,y,z];},n=[.93,.36,0],m=q=>[-q[0],q[1],q[2]],mn=[-.93,.36,0];
    const A=g(-1.61,belt(-1.61)),B=g(-1.48,belt(-1.48)),C=g(-1.56,belt(-1.56)+.08),D=g(-1.44,top(-1.44)+.016),E=g(-1.61,top(-1.61)+.016);
    for(const[p,q,r]of[[A,B,C],[A,C,E],[C,D,E]]){tri(paint,p,q,r,n,n,n,PAINT);tri(paint,m(p),m(q),m(r),mn,mn,mn,PAINT);}
  }};
