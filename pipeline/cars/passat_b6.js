// VW Passat B6 Variant (2005-2010), 4.77 x 1.82 x 1.52 m with rails, 2.71 m wheelbase.
CAR_MODELS.passat_b6={name:'VW Passat B6 Variant',dims:[4.774,1.82,1.517],axles:[1.43,-1.28],arch:.39,
  // low nose, belt rising towards the tail
  lower:[[2.34,.74,.32,.66,.7],[2.31,.82,.28,.69,.73],[2.23,.88,.24,.72,.76],[2.08,.905,.22,.75,.79],[1.82,.91,.22,.79,.83],[1.43,.91,.22,.84,.88],[1.15,.91,.22,.88,.91],[1.04,.91,.22,.895,.925],[.6,.91,.22,.935,.965],[0,.91,.22,.965,.995],[-.6,.91,.22,.99,1.02],[-.89,.91,.22,1,1.03],[-1.28,.91,.22,1.01,1.04],[-1.67,.91,.22,1.02,1.05],[-1.95,.905,.22,1.025,1.055],[-2.15,.89,.23,1.025,1.055],[-2.27,.86,.27,1.015,1.045],[-2.34,.79,.31,.99,1.015]],
  upper:[[1.12,0],[.98,1],[.84,1.1],[.66,1.22],[.48,1.32],[.3,1.4],[.1,1.445],[-.2,1.465],[-.29,1.468],[-.8,1.465],[-1.25,1.45],[-1.33,1.445],[-1.75,1.42],[-1.98,1.39],[-2.06,1.34],[-2.15,1.24],[-2.23,1.12],[-2.28,0]],
  side:[.98,-1.98],pillars:[[.98,.84],[-.2,-.29],[-1.25,-1.33]],glass:[.3,-1.98],strips:[],rings:false,
  mirror:null,plate:[[.33,2.392],[.72,-2.344]],grime:.1,
  badge({tri,ring,trim,CHROME},cy,z,r){
    const d=Math.sign(z),n=[0,0,d],dark=[.06,.08,.14];
    for(let i=0;i<10;i++){const a=i/10*TAU,b=(i+1)/10*TAU;tri(trim,[0,cy,z],[Math.cos(a)*r,cy+Math.sin(a)*r,z],[Math.cos(b)*r,cy+Math.sin(b)*r,z],n,n,n,dark);}
    ring(0,cy,z+d*.001,r,CHROME);
    const st=(x0,y0,x1,y1)=>{const dx=x1-x0,dy=y1-y0,m=Math.hypot(dx,dy),w=.09*r,px=-dy/m*w,py=dx/m*w,q=(x,y)=>[x*r,cy+y*r,z+d*.002];
      const A=q(x0,y0),B=q(x1,y1);tri(trim,[A[0]-px,A[1]-py,A[2]],[B[0]-px,B[1]-py,B[2]],[B[0]+px,B[1]+py,B[2]],n,n,n,CHROME);tri(trim,[A[0]-px,A[1]-py,A[2]],[B[0]+px,B[1]+py,B[2]],[A[0]+px,A[1]+py,A[2]],n,n,n,CHROME);};
    st(-.42,.62,0,.02);st(.42,.62,0,.02);st(-.7,.3,-.36,-.62);st(-.36,-.62,0,-.1);st(0,-.1,.36,-.62);st(.36,-.62,.7,.3);
  },
  // the 2005 VW shield: one chrome-framed grille from the bonnet down through the bumper, plate on its lower half
  front(c){
    const{quad,tri,trim,head,BLACK,CHROME}=c,z=2.34,zb=2.387,F=[0,0,1];
    quad(trim,[-.355,.52,z+.003],[.355,.52,z+.003],[.375,.684,z+.003],[-.375,.684,z+.003],F,CHROME,false);
    quad(trim,[-.34,.528,z+.005],[.34,.528,z+.005],[.358,.672,z+.005],[-.358,.672,z+.005],F,BLACK,false);
    for(const y of[.565,.6,.635])quad(trim,[-.345,y,z+.007],[.345,y,z+.007],[.35,y+.01,z+.007],[-.35,y+.01,z+.007],F,CHROME,false);
    c.M.badge(c,.605,z+.012,.056);
    quad(trim,[-.29,.27,zb],[.29,.27,zb],[.355,.525,zb],[-.355,.525,zb],F,CHROME,false);
    quad(trim,[-.275,.282,zb+.002],[.275,.282,zb+.002],[.34,.518,zb+.002],[-.34,.518,zb+.002],F,[.07,.07,.08],false);
    quad(trim,[.385,.53,z+.003],[.722,.555,z+.003],[.716,.645,z+.003],[.385,.678,z+.003],F,BLACK);
    quad(head,[.392,.538,z+.006],[.716,.562,z+.006],[.71,.638,z+.006],[.392,.67,z+.006],F,[.72,.76,.8]);
    for(const[cx,r]of[[.47,.045],[.62,.038]])for(let i=0;i<8;i++){const a=i/8*TAU,b=(i+1)/8*TAU,cy=.6;
      tri(head,[cx,cy,z+.008],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],F,F,F,[.97,.97,.93]);
      tri(head,[-cx,cy,z+.008],[-cx-Math.cos(b)*r,cy+Math.sin(b)*r,z+.008],[-cx-Math.cos(a)*r,cy+Math.sin(a)*r,z+.008],F,F,F,[.97,.97,.93]);}
    quad(head,[.724,.562,z+.002],[.822,.575,2.312],[.818,.665,2.312],[.718,.638,z+.002],[.3,0,.95],[.75,.79,.82]);
    quad(head,[.824,.575,2.31],[.88,.59,2.232],[.874,.69,2.232],[.82,.665,2.31],[.8,0,.6],[.93,.8,.6]);
  },
  // wide lamps wrapping round the corners, tailgate with plate, chrome strip and badge; silver roof rails
  rear(c){
    const{quad,trim,tail,BLACK,CHROME,RED,WHITE}=c,z=-2.34,B=[0,0,-1];
    quad(tail,[.43,.79,z-.003],[.772,.78,z-.003],[.762,.97,z-.003],[.43,.975,z-.003],B,RED);
    quad(tail,[.45,.8,z-.005],[.56,.8,z-.005],[.56,.845,z-.005],[.45,.845,z-.005],B,WHITE);
    quad(tail,[.774,.78,z-.003],[.855,.785,-2.272],[.852,.955,-2.272],[.762,.97,z-.003],[.6,0,-.8],RED);
    quad(tail,[.858,.785,-2.27],[.89,.8,-2.12],[.89,.94,-2.12],[.855,.955,-2.27],[.97,0,-.25],RED);
    for(const x of[-.427,.42])quad(trim,[x,.57,z-.002],[x+.007,.57,z-.002],[x+.007,.99,z-.002],[x,.99,z-.002],B,BLACK,false);
    quad(trim,[-.3,.853,z-.004],[.3,.853,z-.004],[.3,.867,z-.004],[-.3,.867,z-.004],B,CHROME,false);
    c.M.badge(c,.925,z-.008,.052);
    quad(trim,[-.02,1.04,-2.22],[.02,1.04,-2.22],[-.3,1.26,-2.145],[-.33,1.25,-2.145],[0,.5,-.86],BLACK,false);
    const U=c.M.upper,roof=q=>{for(let i=0;i<U.length-1;i++)if(q<=U[i][0]&&q>=U[i+1][0])return U[i][1]+(U[i+1][1]-U[i][1])*(U[i][0]-q)/(U[i][0]-U[i+1][0]);return 0;};
    const zs=[.2,-.2,-.8,-1.3,-1.75,-1.95],G=[.62,.63,.64];
    for(let i=0;i<zs.length-1;i++){const a=zs[i],b=zs[i+1],ya=roof(a)-.012,yb=roof(b)-.012,h=.045;
      quad(trim,[.58,ya,a],[.58,yb,b],[.58,yb+h,b],[.58,ya+h,a],[1,0,0],G);
      quad(trim,[.53,ya+h,a],[.58,ya+h,a],[.58,yb+h,b],[.53,yb+h,b],[0,1,0],G);
      quad(trim,[.53,ya,a],[.53,yb,b],[.53,yb+h,b],[.53,ya+h,a],[-1,0,0],G);}
    for(const q of[.2,-1.95]){const y=roof(q)-.012,s=Math.sign(q);quad(trim,[.53,y,q],[.58,y,q],[.58,y+.045,q],[.53,y+.045,q],[0,0,s],G);}
  },
  // body-colour bumpers split by the shield, side intakes with round fog lamps
  bumpers({quad,tri,bumper,trim,PAINT,PLASTIC,BLACK}){
    const FR=[[0,2.385],[.62,2.38],[.78,2.35],[.86,2.29],[.9,2.18],[.915,2],[.915,1.82]],RR=[[0,-2.385],[.62,-2.38],[.78,-2.35],[.86,-2.29],[.9,-2.18],[.915,-2],[.915,-1.67]];
    const out=(P,k)=>P.map(([x,z])=>[x*1.003,z+k*.003]);
    bumper(FR,.21,.52,PAINT);bumper(RR,.27,.57,PAINT);
    bumper(out(FR,1),.21,.25,PLASTIC);bumper(out(RR,-1),.27,.32,PLASTIC);
    quad(trim,[.5,.25,2.388],[.76,.25,2.36],[.75,.35,2.36],[.47,.35,2.388],[0,0,1],BLACK);
    const n=[0,0,1];for(let i=0;i<8;i++){const a=i/8*TAU,b=(i+1)/8*TAU,cx=.66,cy=.3,r=.035,zz=2.38;
      tri(trim,[cx,cy,zz],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,zz],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,zz],n,n,n,[.8,.8,.76]);
      tri(trim,[-cx,cy,zz],[-cx-Math.cos(b)*r,cy+Math.sin(b)*r,zz],[-cx-Math.cos(a)*r,cy+Math.sin(a)*r,zz],n,n,n,[.8,.8,.76]);}
  },
  doors(c){
    const{quad,box,trim,paint,side,BLACK,PAINT,CHROME,at}=c;
    for(const[z,y0]of[[1.03,.33],[-.25,.33],[-1.27,.7]]){const[w,s]=at(z),m=.22+(s-.22)*.55;
      if(y0<m)quad(trim,[w+.003,y0,z],[w+.003,y0,z+.01],[w+.003,m,z+.01],[w+.003,m,z],side,BLACK);
      quad(trim,[w+.003,Math.max(y0,m),z],[w+.003,Math.max(y0,m),z+.01],[w*.995+.003,s-.03,z+.01],[w*.995+.003,s-.03,z],side,BLACK);}
    for(const z of[-.2,-1.2])quad(trim,[.912,.86,z],[.912,.86,z+.13],[.911,.89,z+.13],[.911,.89,z],side,CHROME);
    box(trim,.77,.82,.93,1,.84,.94,BLACK);box(paint,.82,.95,.94,1.05,.82,.95,PAINT);
  }};
