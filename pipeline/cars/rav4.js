// Toyota RAV4 XA50 (2019-), 4.60 x 1.855 x 1.685 m with rails, 2.69 m wheelbase: square arches in black cladding, high flat bonnet.
CAR_MODELS.rav4={name:'Toyota RAV4 XA50',dims:[4.6,1.855,1.685],axles:[1.37,-1.32],arch:.41,
  lower:[[2.27,.8,.36,.8,.84],[2.21,.88,.3,.86,.9],[2.1,.915,.28,.9,.94],[1.95,.925,.28,.92,.96],[1.78,.925,.28,.935,.975],[1.37,.925,.28,.95,.99],[.96,.925,.28,.965,1.005],[.5,.925,.28,.98,1.02],[0,.925,.28,.99,1.03],[-.5,.925,.28,1,1.04],[-.91,.925,.28,1.01,1.05],[-1.32,.925,.28,1.02,1.06],[-1.73,.925,.28,1.03,1.07],[-1.95,.915,.28,1.035,1.075],[-2.15,.88,.3,1.035,1.075],[-2.27,.8,.36,1,1.06]],
  upper:[[1.08,0],[.92,1.13],[.72,1.29],[.52,1.43],[.32,1.54],[.12,1.61],[-.1,1.635],[-.7,1.64],[-1.3,1.635],[-1.7,1.625],[-1.86,1.6],[-1.96,1.53],[-2.06,1.4],[-2.14,1.26],[-2.2,0]],
  side:[.76,-1.97],pillars:[[-.17,-.27],[-1.36,-1.44]],glass:[.33,-1.86],strips:[],rings:false,mirror:null,
  plate:[[.36,2.312],[.76,-2.274]],grime:.06,
  // angular lamps joined by a slim black bar, big trapezoid lower grille with black corner vents
  front({quad,trim,head,BLACK,CHROME,PLASTIC}){
    const z=2.272,N=[0,0,1];
    quad(trim,[-.4,.7,z],[.4,.7,z],[.4,.8,z],[-.4,.8,z],N,BLACK,false);
    quad(trim,[-.06,.715,z+.003],[.06,.715,z+.003],[.06,.785,z+.003],[-.06,.785,z+.003],N,CHROME,false);
    quad(trim,[.4,.66,z],[.8,.72,z],[.8,.83,z],[.4,.81,z],N,BLACK);
    quad(head,[.42,.69,z+.003],[.78,.735,z+.003],[.78,.815,z+.003],[.42,.79,z+.003],N,[.9,.93,.95]);
    quad(head,[.43,.672,z+.004],[.78,.722,z+.004],[.78,.734,z+.004],[.43,.686,z+.004],N,[1,1,1]);
    quad(trim,[.803,.7,z],[.884,.73,2.21],[.884,.85,2.21],[.803,.83,z],[.83,0,.55],BLACK);
    quad(head,[.806,.715,z+.002],[.887,.745,2.212],[.887,.83,2.212],[.806,.81,z+.002],[.83,0,.55],[.9,.93,.95]);
  },
  // slim lamps wrapping from the tailgate round the corner, black spoiler over the back light
  rear({quad,trim,tail,BLACK,RED}){
    const z=-2.274,N=[0,0,-1],cn=[.83,0,-.55];
    quad(tail,[.44,.95,z],[.802,.95,z],[.802,1.02,z],[.44,.99,z],N,RED);
    quad(tail,[.802,.95,z],[.884,.95,-2.152],[.884,1.035,-2.152],[.802,1.02,z],cn,RED);
    quad(tail,[.884,.95,-2.152],[.919,.96,-1.95],[.919,1.03,-1.95],[.884,1.035,-2.152],[1,0,-.15],RED);
    quad(tail,[.5,.965,z-.002],[.78,.965,z-.002],[.78,.975,z-.002],[.5,.965,z-.002],N,[1,.3,.3]);
    quad(trim,[-.44,.95,z],[.44,.95,z],[.44,.99,z],[-.44,.99,z],N,BLACK,false);
    quad(trim,[-.56,1.645,-1.84],[.56,1.645,-1.84],[.56,1.6,-1.97],[-.56,1.6,-1.97],[0,.95,-.3],BLACK,false);
    quad(trim,[-.56,1.6,-1.97],[.56,1.6,-1.97],[.56,1.55,-1.955],[-.56,1.55,-1.955],[0,-.3,-1],BLACK,false);
  },
  // body-colour bumpers on black lower halves, silver skid plates, the big lower grille
  bumpers({quad,bumper,trim,PAINT,PLASTIC,BLACK,M}){
    const L=M.lower,[af,ar]=M.axles,R=M.arch,edge=(rows,s)=>{const a=rows[0];return[[0,a[0]+.03*s],[a[1]*.85,a[0]+.028*s],[a[1]+.012,a[0]+.008*s],...rows.slice(1).map(r=>[r[1]+.01,r[0]])];};
    const FR=edge(L.filter(r=>r[0]>=af+R-1e-6),1),RR=edge(L.filter(r=>r[0]<=ar-R+1e-6).reverse(),-1);
    const out=(P,k)=>P.map(([x,z])=>[x*k,z+(k-1)*Math.sign(z)]);
    bumper(FR,.42,.66,PAINT);bumper(out(FR,1.004),.28,.42,PLASTIC);bumper(RR,.5,.72,PAINT);bumper(out(RR,1.004),.28,.5,PLASTIC);
    const G=[.06,.06,.065],z=2.305,N=[0,0,1];
    quad(trim,[-.5,.62,z],[.5,.62,z],[.62,.3,z],[-.62,.3,z],N,G,false);
    for(let i=1;i<5;i++){const y=.3+i*.064,x=.62-i*.024;quad(trim,[-x,y,z+.002],[x,y,z+.002],[x,y+.008,z+.002],[-x,y+.008,z+.002],N,[.2,.2,.21],false);}
    bumper(out(FR.slice(1,4),1.008),.3,.58,G);
    quad(trim,[-.4,.29,z+.008],[.4,.29,z+.008],[.4,.31,z+.008],[-.4,.31,z+.008],N,[.55,.56,.57],false);
    quad(trim,[-.45,.3,-2.308],[.45,.3,-2.308],[.45,.36,-2.308],[-.45,.36,-2.308],[0,0,-1],[.55,.56,.57],false);
  },
  // square arch flares and sill cladding, shut lines, handles, body-colour mirrors with black bases, roof rails
  doors({quad,box,tri,paint,trim,side,at,PAINT,BLACK,PLASTIC,M}){
    const R=M.arch,n=8,sq=(th,a,b)=>{const s=Math.sin(th),c=Math.cos(th),r=Math.pow(Math.pow(Math.abs(s)/a,4)+Math.pow(Math.abs(c)/b,4),-.25);return[s*r,c*r];};
    for(const az of M.axles)for(let i=0;i<n;i++){
      const t0=-Math.PI/2+i/n*Math.PI,t1=t0+Math.PI/n,x=at(az)[0]+.03;
      const I=t=>[x,.3+Math.cos(t)*R,az+Math.sin(t)*R],O=t=>{const[dz,dy]=sq(t,R+.1,R+.075);return[x,.3+dy,az+dz];};
      quad(trim,I(t0),I(t1),O(t1),O(t0),side,PLASTIC);
      const i0=I(t0),i1=I(t1),o0=O(t0),o1=O(t1);
      quad(trim,[x-.04,i0[1],i0[2]],[x-.04,i1[1],i1[2]],i1,i0,[0,-Math.cos((t0+t1)/2),-Math.sin((t0+t1)/2)],PLASTIC);
      quad(trim,[x-.04,o0[1],o0[2]],[x-.04,o1[1],o1[2]],o1,o0,[0,Math.cos((t0+t1)/2),Math.sin((t0+t1)/2)],PLASTIC);
    }
    const fa=M.axles[0]-R-.1,ra=M.axles[1]+R+.1;
    quad(trim,[.95,.28,fa],[.95,.28,ra],[.95,.44,ra],[.95,.44,fa],side,PLASTIC);
    quad(trim,[.95,.44,fa],[.95,.44,ra],[.925,.45,ra],[.925,.45,fa],[0,1,0],PLASTIC);
    for(const[z,y0]of[[.84,.45],[-.2,.45],[-1.33,.79]])quad(trim,[.928,y0,z],[.928,y0,z+.012],[.928,.98,z+.012],[.928,.98,z],side,BLACK);
    for(const s of[1,-1]){const zA=-1.44,zB=-1.97,y=M.lower[13][3]-.01,n=[.93*s,.36,0];
      tri(paint,[.774*s,y,zA],[.774*s,y,zB],[.737*s,y+.1,zB],n,n,n,PAINT);}
    for(const z of[-.05,-1.2])quad(trim,[.929,.88,z],[.929,.88,z+.14],[.929,.91,z+.14],[.929,.91,z],side,BLACK);
    box(paint,.81,.98,1.04,1.15,.6,.74,PAINT);box(trim,.8,.81,1.04,1.15,.6,.74,BLACK);box(trim,.77,.86,.99,1.04,.62,.74,BLACK);
    const rz=[.05,-.4,-1,-1.5,-1.82],ry=[1.665,1.685,1.685,1.675,1.655];
    for(let i=0;i<rz.length-1;i++){
      quad(trim,[.48,ry[i],rz[i]],[.48,ry[i+1],rz[i+1]],[.54,ry[i+1],rz[i+1]],[.54,ry[i],rz[i]],[0,1,0],[.08,.08,.085]);
      quad(trim,[.54,ry[i]-.03,rz[i]],[.54,ry[i+1]-.03,rz[i+1]],[.54,ry[i+1],rz[i+1]],[.54,ry[i],rz[i]],side,[.08,.08,.085]);
    }
  }};
