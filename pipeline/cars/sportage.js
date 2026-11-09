// Kia Sportage QL (2016-2021), 4.48 x 1.855 x 1.645 m with rails, 2.67 m wheelbase: tiger-nose grille, lamps set high on the wings.
CAR_MODELS.sportage={name:'Kia Sportage QL',dims:[4.48,1.855,1.645],axles:[1.34,-1.33],arch:.4,
  lower:[[2.21,.8,.38,.78,.82],[2.15,.875,.32,.84,.88],[2.05,.91,.29,.89,.93],[1.9,.925,.28,.92,.96],[1.74,.925,.28,.935,.975],[1.34,.925,.28,.96,1],[.94,.925,.28,.98,1.02],[.4,.925,.28,.995,1.035],[0,.925,.28,1.005,1.045],[-.5,.925,.28,1.02,1.06],[-.93,.925,.28,1.035,1.075],[-1.33,.925,.28,1.045,1.085],[-1.73,.925,.28,1.05,1.09],[-1.95,.91,.29,1.05,1.09],[-2.12,.86,.32,1.03,1.07],[-2.21,.79,.38,.98,1.03]],
  upper:[[1.1,0],[.92,1.12],[.72,1.27],[.52,1.39],[.32,1.48],[.12,1.55],[-.2,1.59],[-.8,1.6],[-1.2,1.59],[-1.45,1.56],[-1.65,1.47],[-1.82,1.36],[-1.96,1.24],[-2.06,1.13],[-2.1,0]],
  side:[.78,-1.62],pillars:[[-.18,-.26],[-1.28,-1.32]],glass:[.32,-1.45],strips:[],rings:false,mirror:null,
  plate:[[.34,2.262],[.64,-2.214]],grime:.06,
  // tiger-nose grille in the middle of the face, lamps up on the wings sweeping back along the bonnet line
  front({quad,trim,head,BLACK,CHROME}){
    const z=2.214,N=[0,0,1];
    quad(trim,[-.3,.56,z],[.3,.56,z],[.3,.76,z],[-.3,.76,z],N,BLACK,false);
    quad(trim,[.3,.56,z],[.36,.62,z],[.36,.72,z],[.3,.76,z],N,BLACK);
    quad(trim,[.3,.76,z+.002],[.36,.72,z+.002],[.375,.725,z+.002],[.31,.775,z+.002],N,CHROME);
    quad(trim,[.3,.545,z+.002],[.375,.615,z+.002],[.36,.62,z+.002],[.3,.56,z+.002],N,CHROME);
    quad(trim,[.36,.62,z+.002],[.375,.615,z+.002],[.375,.725,z+.002],[.36,.72,z+.002],N,CHROME);
    quad(trim,[-.3,.76,z+.002],[.3,.76,z+.002],[.31,.775,z+.002],[-.31,.775,z+.002],N,CHROME,false);
    quad(trim,[-.3,.545,z+.002],[.3,.545,z+.002],[.3,.56,z+.002],[-.3,.56,z+.002],N,CHROME,false);
    for(let i=1;i<5;i++)quad(trim,[-.34,.56+i*.04,z+.003],[.34,.56+i*.04,z+.003],[.34,.56+i*.04+.008,z+.003],[-.34,.56+i*.04+.008,z+.003],N,[.22,.22,.24],false);
    const L=[.86,.9,.94];
    quad(trim,[.4,.72,z],[.78,.735,z],[.77,.785,z],[.42,.8,z],N,BLACK);
    quad(head,[.44,.735,z+.003],[.775,.75,z+.003],[.765,.78,z+.003],[.46,.79,z+.003],N,L);
    quad(head,[.775,.75,z+.003],[.877,.79,2.153],[.849,.842,2.153],[.765,.78,z+.003],[.6,.3,.75],L);
    quad(head,[.877,.79,2.153],[.912,.83,2.05],[.892,.876,2.05],[.849,.842,2.153],[.9,.35,.25],L);
    quad(head,[.912,.83,2.05],[.927,.885,1.95],[.927,.885,1.95],[.892,.876,2.05],[.9,.35,.15],L);
  },
  // slim lamps up under the back light, joined by a reflector strip across the tailgate
  rear({quad,trim,tail,BLACK,RED,CHROME}){
    const z=-2.214,N=[0,0,-1];
    quad(tail,[.52,.9,z],[.79,.9,z],[.79,.97,z],[.52,.95,z],N,RED);
    quad(tail,[.79,.9,z],[.862,.91,-2.122],[.862,1.01,-2.122],[.79,.97,z],[.8,0,-.6],RED);
    quad(tail,[.862,.91,-2.122],[.91,.94,-1.95],[.91,1.03,-1.95],[.862,1.01,-2.122],[.97,0,-.25],RED);
    quad(tail,[-.52,.915,z],[.52,.915,z],[.52,.93,z],[-.52,.93,z],N,[.45,.04,.06],false);
    quad(trim,[-.52,.905,z+.002],[.52,.905,z+.002],[.52,.94,z+.002],[-.52,.94,z+.002],N,BLACK,false);
  },
  // body-colour bumpers, wide lower intake with four-dot fogs, black lower halves and silver skid plates
  bumpers({quad,bumper,trim,PAINT,PLASTIC,BLACK,M}){
    const L=M.lower,[af,ar]=M.axles,R=M.arch,edge=(rows,s)=>{const a=rows[0];return[[0,a[0]+.03*s],[a[1]*.85,a[0]+.028*s],[a[1]+.012,a[0]+.008*s],...rows.slice(1).map(r=>[r[1]+.01,r[0]])];};
    const FR=edge(L.filter(r=>r[0]>=af+R-1e-6),1),RR=edge(L.filter(r=>r[0]<=ar-R+1e-6).reverse(),-1);
    const out=(P,k)=>P.map(([x,z])=>[x*k,z+(k-1)*Math.sign(z)]);
    bumper(FR,.42,.55,PAINT);bumper(out(FR,1.004),.28,.42,PLASTIC);bumper(RR,.5,.6,PAINT);bumper(out(RR,1.004),.28,.5,PLASTIC);
    const z=2.246,N=[0,0,1],G=[.05,.05,.055];
    quad(trim,[-.56,.33,z],[.56,.33,z],[.52,.52,z],[-.52,.52,z],N,G,false);
    const V=out(FR.slice(1,4),1.008),zV=x=>{const[[a,p],[b,q]]=x<V[1][0]?V:V.slice(1);return p+(q-p)*(x-a)/(b-a)+.004;};
    bumper(V,.36,.54,G);
    for(const[x,y]of[[.7,.47],[.76,.47],[.7,.4],[.76,.4]])quad(trim,[x,y,zV(x)],[x+.045,y,zV(x+.045)],[x+.045,y+.045,zV(x+.045)],[x,y+.045,zV(x)],[.15,0,1],[.85,.86,.82]);
    quad(trim,[-.42,.29,z+.008],[.42,.29,z+.008],[.42,.32,z+.008],[-.42,.32,z+.008],N,[.6,.61,.62],false);
    quad(trim,[-.45,.3,-2.248],[.45,.3,-2.248],[.45,.35,-2.248],[-.45,.35,-2.248],[0,0,-1],[.6,.61,.62],false);
    for(const s of[1,-1])quad(trim,[.62*s,.56,-2.234],[.78*s,.56,-2.192],[.78*s,.585,-2.192],[.62*s,.585,-2.234],[0,0,-1],[.6,.03,.05],false);
  },
  // arch cladding and sills, shut lines, handles, mirrors, rails
  doors({quad,box,paint,trim,side,at,belt,PAINT,BLACK,CHROME,PLASTIC,M}){
    const R=M.arch,n=8;
    for(const az of M.axles)for(let i=0;i<n;i++){
      const t0=-Math.PI/2+i/n*Math.PI,t1=t0+Math.PI/n,x=at(az)[0]+.025,P=(t,r)=>[x,.3+Math.cos(t)*r,az+Math.sin(t)*r];
      quad(trim,P(t0,R),P(t1,R),P(t1,R+.075),P(t0,R+.075),side,PLASTIC);
      const a=P(t0,R),b=P(t1,R);quad(trim,[x-.035,a[1],a[2]],[x-.035,b[1],b[2]],b,a,[0,-Math.cos((t0+t1)/2),-Math.sin((t0+t1)/2)],PLASTIC);
    }
    const fa=M.axles[0]-R-.07,ra=M.axles[1]+R+.07;
    quad(trim,[.95,.28,fa],[.95,.28,ra],[.95,.42,ra],[.95,.42,fa],side,PLASTIC);
    quad(trim,[.95,.42,fa],[.95,.42,ra],[.925,.43,ra],[.925,.43,fa],[0,1,0],PLASTIC);
    for(const[z,y0]of[[.86,.43],[-.22,.43],[-1.33,.8]])quad(trim,[.928,y0,z],[.928,y0,z+.012],[.928,1.0,z+.012],[.928,1.0,z],side,BLACK);
    for(const z of[-.08,-1.22])quad(trim,[.929,.93,z],[.929,.93,z+.13],[.929,.96,z+.13],[.929,.96,z],side,CHROME);
    const B=z=>belt(z)-.006,zs=[.75,0,-.8,-1.3,-1.62];
    for(let i=0;i<zs.length-1;i++)quad(trim,[.78,B(zs[i]),zs[i]],[.78,B(zs[i+1]),zs[i+1]],[.775,B(zs[i+1])+.018,zs[i+1]],[.775,B(zs[i])+.018,zs[i]],[.93,.36,0],CHROME);
    box(paint,.8,.97,1.03,1.13,.62,.74,PAINT);box(trim,.79,.8,1.03,1.13,.62,.74,BLACK);
    const rz=[.0,-.5,-1.1,-1.5,-1.68],ry=[1.62,1.64,1.635,1.62,1.6];
    for(let i=0;i<rz.length-1;i++){
      quad(trim,[.47,ry[i],rz[i]],[.47,ry[i+1],rz[i+1]],[.52,ry[i+1],rz[i+1]],[.52,ry[i],rz[i]],[0,1,0],[.08,.08,.085]);
      quad(trim,[.52,ry[i]-.035,rz[i]],[.52,ry[i+1]-.035,rz[i+1]],[.52,ry[i+1],rz[i+1]],[.52,ry[i],rz[i]],side,[.08,.08,.085]);
    }
  }};
