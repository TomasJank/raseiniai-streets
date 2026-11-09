// Opel Astra G five-door hatchback, 4.11 x 1.709 x 1.425 m, 2.606 m wheelbase; rounded nose and roof, short tail.
CAR_MODELS.astra_g={name:'Opel Astra G',dims:[4.11,1.709,1.425],axles:[1.215,-1.391],
  lower:[[2.03,.66,.33,.66,.69],[1.98,.75,.27,.7,.73],[1.9,.805,.23,.74,.77],[1.6,.85,.22,.79,.82],[1.215,.855,.22,.83,.86],[.83,.855,.22,.86,.89],[.4,.855,.22,.875,.905],[0,.855,.22,.89,.92],[-.6,.855,.22,.91,.94],[-1.006,.855,.22,.925,.955],[-1.391,.855,.22,.94,.97],[-1.776,.85,.22,.95,.98],[-1.92,.83,.24,.95,.98],[-1.99,.79,.28,.94,.97],[-2.03,.72,.32,.92,.95]],
  upper:[[.98,0],[.85,.98],[.68,1.1],[.5,1.21],[.32,1.3],[.14,1.36],[0,1.395],[-.1,1.41],[-.19,1.415],[-.5,1.418],[-.9,1.412],[-1.2,1.398],[-1.42,1.37],[-1.58,1.32],[-1.7,1.24],[-1.8,1.16],[-1.89,1.07],[-1.96,0]],
  side:[.7,-1.42],pillars:[[-.1,-.19]],glass:[0,-1.45],strips:[],rings:false,
  mirror:null,plate:[[.3,2.083],[.6,-2.036]],grime:.3,
  // slim chrome bar across the nose with the badge in the middle, swept lamps wrapping round the corners
  front({quad,tri,trim,head,CHROME,BLACK}){
    const z=2.03,N=[0,0,1];
    quad(trim,[-.27,.545,z+.004],[.27,.545,z+.004],[.3,.65,z+.004],[-.3,.65,z+.004],N,BLACK,false);
    quad(trim,[-.28,.6,z+.008],[.28,.6,z+.008],[.29,.62,z+.008],[-.29,.62,z+.008],N,CHROME,false);
    const disc=(cy,r,o,col)=>{for(let i=0;i<16;i++){const a=i/16*TAU,b=(i+1)/16*TAU;tri(trim,[0,cy,z+o],[Math.cos(a)*r,cy+Math.sin(a)*r,z+o],[Math.cos(b)*r,cy+Math.sin(b)*r,z+o],N,N,N,col);}};
    disc(.61,.048,.01,CHROME);disc(.61,.038,.012,[.12,.12,.13]);
    quad(trim,[-.034,.6,z+.014],[.01,.615,z+.014],[.01,.623,z+.014],[-.034,.608,z+.014],N,[.85,.75,.2],false);
    quad(trim,[-.01,.597,z+.014],[.034,.612,z+.014],[.034,.62,z+.014],[-.01,.605,z+.014],N,[.85,.75,.2],false);
    const L=[[.31,z+.006,.53,.628],[.6,z+.006,.525,.628],[.664,z+.006,.53,.628],[.758,1.983,.55,.665],[.814,1.902,.59,.705],[.832,1.8,.63,.72]];
    for(let i=0;i<L.length-1;i++){const[a,za,y0,y1]=L[i],[b,zb,u0,u1]=L[i+1],nx=za-zb,nz=b-a,m=Math.hypot(nx,nz);
      quad(head,[a,y0,za],[b,u0,zb],[b,u1,zb],[a,y1,za],[nx/m,0,nz/m],i<1?[.92,.93,.95]:i<3?[.8,.84,.88]:[.93,.6,.28]);}
  },
  // tall lamps in the corners beside the tailgate, plate low on the tailgate, badge above it
  rear({quad,tri,trim,tail,CHROME,RED,AMBER,CLEAR}){
    const z=-2.036,N=[0,0,-1];
    quad(tail,[.52,.66,z],[.72,.66,z],[.72,.89,z],[.49,.94,z],N,RED);
    quad(tail,[.72,.66,z],[.795,.66,-1.994],[.795,.91,-1.994],[.72,.89,z],[.43,0,-.9],RED);
    quad(tail,[.53,.8,z-.003],[.68,.8,z-.003],[.68,.84,z-.003],[.545,.84,z-.003],N,AMBER);
    quad(tail,[.52,.73,z-.003],[.68,.73,z-.003],[.68,.77,z-.003],[.525,.77,z-.003],N,CLEAR);
    for(let i=0;i<16;i++){const a=i/16*TAU,b=(i+1)/16*TAU,c=(q,r)=>[Math.cos(q)*r,.83+Math.sin(q)*r,z-.004];
      tri(trim,c(0,0),c(a,.042),c(b,.042),N,N,N,CHROME);tri(trim,c(0,0),c(a,.032),c(b,.032),N,N,N,[.12,.12,.13]);}
    quad(trim,[-.03,.822,z-.006],[.01,.836,z-.006],[.01,.843,z-.006],[-.03,.829,z-.006],N,CHROME,false);
    quad(trim,[-.01,.817,z-.006],[.03,.831,z-.006],[.03,.838,z-.006],[-.01,.824,z-.006],N,CHROME,false);
  },
  // body-colour bumpers with a dark lower lip and a wide intake under the plate
  bumpers({quad,bumper,trim,PAINT,BLACK,PLASTIC}){
    const FR=[[0,2.078],[.62,2.068],[.74,2.02],[.82,1.94],[.855,1.8],[.855,1.6]],RR=[[0,-2.078],[.64,-2.068],[.76,-2.02],[.83,-1.94],[.855,-1.776]];
    bumper(FR,.21,.52,PAINT);bumper(RR,.31,.58,PAINT);
    const o=P=>P.map(([x,z])=>[x*1.003,z+.003*Math.sign(z)]);
    bumper(o(FR),.21,.25,PLASTIC);bumper(o(RR),.31,.36,PLASTIC);
    quad(trim,[-.5,.25,2.082],[.5,.25,2.082],[.46,.3,2.082],[-.46,.3,2.082],[0,0,1],BLACK,false);
  },
  // shut lines, thin rub strip, black handles and mirrors
  doors({M,quad,tri,box,paint,trim,side,belt,PAINT,BLACK,PLASTIC}){
    for(const[z,y0]of[[.85,.33],[-.15,.33],[-1.0,.68]]){
      if(y0<.6)quad(trim,[.847,y0,z],[.847,y0,z+.012],[.859,.6,z+.012],[.859,.6,z],side,BLACK);
      quad(trim,[.859,Math.max(y0,.6),z],[.859,Math.max(y0,.6),z+.012],[.845,.88,z+.012],[.845,.88,z],side,BLACK);
    }
    quad(trim,[.859,.5,.82],[.859,.5,-.62],[.859,.53,-.62],[.859,.53,.82],side,PLASTIC);
    for(const z of[-.06,-.92])quad(trim,[.859,.78,z],[.859,.78,z+.11],[.856,.81,z+.11],[.856,.81,z],side,BLACK);
    box(trim,.76,.92,.85,.97,.62,.74,BLACK);
    // the rear door glass ends on a slant: paint over the glass behind it
    const up=M.upper,top=z=>{for(let i=0;i<up.length-1;i++){const[a,ha]=up[i],[b,hb]=up[i+1];if(z<=a&&z>=b)return ha+(hb-ha)*(a-z)/(a-b)-.072;}};
    const g=(z,y)=>{const b=belt(z)-.01;return[.776-.17*(y-b)/.44,y,z];},n=[.93,.36,0],m=q=>[-q[0],q[1],q[2]],mn=[-.93,.36,0];
    const A=g(-1.43,belt(-1.43)),D=g(-1.2,top(-1.2)+.016),E=g(-1.43,top(-1.43)+.016);
    tri(paint,A,D,E,n,n,n,PAINT);tri(paint,m(A),m(D),m(E),mn,mn,mn,PAINT);
  }};
