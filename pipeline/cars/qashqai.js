// Nissan Qashqai J11 (2014-2021), 4.38 x 1.81 x 1.59 m with rails, 2.646 m wheelbase: V-motion chrome grille, boomerang lamps, rising belt.
CAR_MODELS.qashqai={name:'Nissan Qashqai J11',dims:[4.38,1.81,1.59],axles:[1.265,-1.381],arch:.39,
  lower:[[2.19,.76,.4,.74,.78],[2.12,.84,.33,.8,.84],[2.05,.885,.29,.85,.89],[1.88,.905,.26,.885,.925],[1.655,.905,.26,.9,.94],[1.265,.905,.26,.93,.97],[.875,.905,.26,.95,.99],[.4,.905,.26,.975,1.015],[0,.905,.26,.995,1.035],[-.5,.905,.26,1.02,1.06],[-.991,.905,.26,1.04,1.08],[-1.381,.905,.26,1.055,1.095],[-1.771,.9,.26,1.065,1.105],[-1.95,.88,.28,1.065,1.1],[-2.12,.82,.34,1.04,1.08],[-2.19,.76,.38,1,1.04]],
  upper:[[1.08,0],[.9,1.08],[.7,1.23],[.5,1.36],[.3,1.45],[.1,1.51],[-.2,1.545],[-.7,1.55],[-1.2,1.535],[-1.55,1.51],[-1.75,1.48],[-1.88,1.42],[-1.98,1.32],[-2.06,1.2],[-2.1,0]],
  side:[.76,-1.82],pillars:[[-.2,-.28],[-1.33,-1.37]],glass:[.32,-1.74],strips:[],rings:false,mirror:null,
  plate:[[.36,2.228],[.7,-2.193]],grime:.06,
  // chrome V framing the grille between boomerang lamps, on the raked nose
  front({quad,trim,head,BLACK,CHROME}){
    const zf=y=>y<.64?2.226:y<=.78?2.19:2.19-(y-.78),F=(x,y,o=.006)=>[x,y,zf(y)+o],N=[0,.71,.71];
    quad(trim,F(-.44,.78),F(.44,.78),F(.2,.68),F(-.2,.68),N,BLACK,false);
    for(let i=1;i<4;i++){const y=.68+i*.025,x=.2+.24*i*.025/.1;quad(trim,F(-x,y,.008),F(x,y,.008),F(x,y+.006,.008),F(-x,y+.006,.008),N,[.25,.25,.26],false);}
    quad(trim,F(.2,.662,.009),F(.45,.768,.009),F(.45,.78,.009),F(.17,.68,.009),N,CHROME);
    quad(trim,F(0,.62,.01),F(.2,.662,.01),F(.17,.68,.01),F(0,.64,.01),N,CHROME);
    for(let i=0;i<12;i++){const a=i/12*TAU,b=(i+1)/12*TAU;quad(trim,F(0,.74,.011),F(0,.74,.011),F(Math.cos(b)*.05,.74+Math.sin(b)*.035,.011),F(Math.cos(a)*.05,.74+Math.sin(a)*.035,.011),N,CHROME,false);}
    quad(trim,F(.43,.78),F(.8,.81),F(.8,.89),F(.45,.845),N,BLACK);
    quad(head,F(.47,.79,.009),F(.78,.818,.009),F(.78,.88,.009),F(.47,.84,.009),N,[.86,.9,.94]);
    quad(head,F(.46,.782,.011),F(.79,.81,.011),F(.79,.822,.011),F(.47,.794,.011),N,[1,1,1]);
    quad(head,[.84,.83,2.12],[.888,.87,2.03],[.886,.9,2.03],[.836,.88,2.12],[.85,.35,.4],[.86,.9,.94]);
  },
  // boomerang lamps from the quarter into the tailgate, chrome bar over the plate
  rear({quad,trim,tail,CHROME,RED}){
    const z=-2.193,N=[0,0,-1];
    quad(trim,[-.4,.84,z],[.4,.84,z],[.4,.852,z],[-.4,.852,z],N,CHROME,false);
    quad(tail,[.48,.86,z],[.76,.85,z],[.76,.96,z],[.48,.92,z],N,RED);
    quad(tail,[.76,.85,z],[.822,.85,-2.122],[.822,1.0,-2.122],[.76,.96,z],[.75,0,-.65],RED);
    quad(tail,[.822,.85,-2.122],[.882,.9,-1.95],[.882,1.04,-1.95],[.822,1.0,-2.122],[.95,0,-.3],RED);
    quad(tail,[.52,.88,z-.002],[.74,.875,z-.002],[.74,.89,z-.002],[.52,.895,z-.002],N,[1,.3,.3]);
  },
  // body-colour bumpers with black lower halves, silver skid plates, lower intake with fogs
  bumpers({quad,bumper,trim,PAINT,PLASTIC,BLACK,M}){
    const L=M.lower,[af,ar]=M.axles,R=M.arch,edge=(rows,s)=>{const a=rows[0];return[[0,a[0]+.03*s],[a[1]*.85,a[0]+.028*s],[a[1]+.012,a[0]+.008*s],...rows.slice(1).map(r=>[r[1]+.01,r[0]])];};
    const FR=edge(L.filter(r=>r[0]>=af+R-1e-6),1),RR=edge(L.filter(r=>r[0]<=ar-R+1e-6).reverse(),-1);
    const out=(P,k)=>P.map(([x,z])=>[x*k,z+(k-1)*Math.sign(z)]);
    bumper(FR,.4,.64,PAINT);bumper(out(FR,1.004),.26,.4,PLASTIC);bumper(RR,.48,.66,PAINT);bumper(out(RR,1.004),.28,.48,PLASTIC);
    const z=2.225,N=[0,0,1],G=[.05,.05,.055];
    quad(trim,[-.48,.54,z],[.48,.54,z],[.42,.34,z],[-.42,.34,z],N,G,false);
    bumper(out(FR.slice(1,4),1.008),.36,.56,G);
    quad(trim,[.66,.42,2.206],[.76,.42,2.18],[.76,.48,2.18],[.66,.48,2.206],[.25,0,1],[.85,.85,.8]);
    quad(trim,[-.4,.27,z+.004],[.4,.27,z+.008],[.4,.31,z+.008],[-.4,.31,z+.008],N,[.6,.61,.62],false);
    quad(trim,[-.4,.3,-2.228],[.4,.3,-2.228],[.4,.35,-2.228],[-.4,.35,-2.228],[0,0,-1],[.6,.61,.62],false);
  },
  // arch cladding and sills, shut lines, chrome window line sweeping up at the back, mirrors, rails
  doors({quad,box,paint,trim,side,at,belt,PAINT,BLACK,CHROME,PLASTIC,M}){
    const R=M.arch,n=8;
    for(const az of M.axles)for(let i=0;i<n;i++){
      const t0=-Math.PI/2+i/n*Math.PI,t1=t0+Math.PI/n,x=at(az)[0]+.02,P=(t,r)=>[x,.3+Math.cos(t)*r,az+Math.sin(t)*r];
      quad(trim,P(t0,R),P(t1,R),P(t1,R+.06),P(t0,R+.06),side,PLASTIC);
      const a=P(t0,R),b=P(t1,R);quad(trim,[x-.03,a[1],a[2]],[x-.03,b[1],b[2]],b,a,[0,-Math.cos((t0+t1)/2),-Math.sin((t0+t1)/2)],PLASTIC);
    }
    const fa=M.axles[0]-R-.06,ra=M.axles[1]+R+.06;
    quad(trim,[.925,.26,fa],[.925,.26,ra],[.925,.38,ra],[.925,.38,fa],side,PLASTIC);
    for(const[z,y0]of[[.82,.38],[-.24,.38],[-1.34,.76]])quad(trim,[.907,y0,z],[.907,y0,z+.012],[.907,1,z+.012],[.907,1,z],side,BLACK);
    for(const z of[-.12,-1.24])quad(trim,[.908,.92,z],[.908,.92,z+.13],[.908,.95,z+.13],[.908,.95,z],side,CHROME);
    const B=z=>belt(z)-.006;
    const zs=[.7,0,-.8,-1.4,-1.8];for(let i=0;i<zs.length-1;i++)quad(trim,[.78,B(zs[i]),zs[i]],[.78,B(zs[i+1]),zs[i+1]],[.775,B(zs[i+1])+.018,zs[i+1]],[.775,B(zs[i])+.018,zs[i]],[.93,.36,0],CHROME);
    quad(trim,[.78,B(-1.8),-1.8],[.65,1.43,-1.86],[.646,1.445,-1.845],[.775,B(-1.8)+.018,-1.8],[.93,.36,0],CHROME);
    box(paint,.8,.95,1.0,1.1,.6,.72,PAINT);box(trim,.79,.8,1.0,1.1,.6,.72,BLACK);
    const rz=[.0,-.5,-1.1,-1.6,-1.78],ry=[1.575,1.59,1.585,1.555,1.53];
    for(let i=0;i<rz.length-1;i++){
      quad(trim,[.47,ry[i],rz[i]],[.47,ry[i+1],rz[i+1]],[.52,ry[i+1],rz[i+1]],[.52,ry[i],rz[i]],[0,1,0],[.6,.62,.64]);
      quad(trim,[.52,ry[i]-.03,rz[i]],[.52,ry[i+1]-.03,rz[i+1]],[.52,ry[i+1],rz[i+1]],[.52,ry[i],rz[i]],side,[.6,.62,.64]);
    }
  }};
