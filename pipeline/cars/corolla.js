// Toyota Corolla E210 hatchback (2019-), 4.37 x 1.79 x 1.435 m, 2.64 m wheelbase: low sleek nose, steep hatch, short tail.
CAR_MODELS.corolla={name:'Toyota Corolla E210',dims:[4.37,1.79,1.435],axles:[1.255,-1.385],arch:.37,
  lower:[[2.16,.72,.32,.52,.56],[2.104,.79,.26,.58,.62],[2.03,.85,.22,.66,.7],[1.85,.885,.21,.73,.77],[1.625,.895,.21,.77,.81],[1.255,.895,.21,.82,.86],[.885,.895,.21,.86,.9],[.4,.895,.21,.89,.93],[0,.895,.21,.91,.95],[-.5,.895,.21,.93,.97],[-1.015,.895,.21,.95,.99],[-1.385,.895,.21,.96,1],[-1.755,.89,.21,.965,1.005],[-1.95,.86,.24,.96,1],[-2.1,.8,.3,.93,.97]],
  upper:[[1.02,0],[.85,.99],[.65,1.13],[.45,1.26],[.25,1.35],[.05,1.41],[-.2,1.435],[-.6,1.43],[-1,1.41],[-1.3,1.38],[-1.55,1.33],[-1.7,1.25],[-1.85,1.14],[-1.97,1.03],[-2.02,0]],
  side:[.66,-1.33],pillars:[[-.25,-.33]],glass:[.3,-1.55],strips:[],rings:false,mirror:null,
  plate:[[.32,2.205],[.64,-2.103]],grime:.04,
  // thin swept lamps over a slot grille on the raked nose
  front({quad,trim,head,BLACK,CHROME}){
    const zf=y=>y<=.56?2.16:2.16-(y-.56)*.93,F=(x,y,o=.006)=>[x,y,zf(y)+o],N=[0,.68,.73];
    quad(trim,F(-.34,.57),F(.34,.57),F(.34,.6),F(-.34,.6),N,BLACK,false);
    for(let i=0;i<12;i++){const a=i/12*TAU,b=(i+1)/12*TAU;quad(trim,F(0,.605,.009),F(0,.605,.009),F(Math.cos(b)*.05,.605+Math.sin(b)*.03,.009),F(Math.cos(a)*.05,.605+Math.sin(a)*.03,.009),N,CHROME,false);}
    quad(trim,F(.32,.565),F(.8,.62),F(.8,.67),F(.34,.6),N,BLACK);
    quad(head,F(.36,.572,.009),F(.78,.625,.009),F(.78,.663,.009),F(.37,.596,.009),N,[.86,.9,.94]);
    quad(head,F(.55,.6,.011),F(.78,.627,.011),F(.78,.637,.011),F(.55,.608,.011),N,[1,1,1]);
    quad(head,[.792,.625,2.06],[.86,.665,1.96],[.865,.705,1.96],[.792,.67,2.06],[.85,.35,.4],[.86,.9,.94]);
  },
  // slim lamps wrapping the corners under a black spoiler
  rear({quad,trim,tail,BLACK,RED}){
    const z=-2.103,N=[0,0,-1];
    quad(tail,[.42,.83,z],[.8,.85,z],[.8,.93,z],[.5,.9,z],N,RED);
    quad(tail,[.8,.85,z],[.862,.86,-1.95],[.862,.95,-1.95],[.8,.93,z],[.9,0,-.4],RED);
    quad(tail,[.5,.86,z-.002],[.78,.875,z-.002],[.78,.89,z-.002],[.55,.875,z-.002],N,[1,.3,.3]);
    quad(trim,[-.42,.83,z],[.42,.83,z],[.42,.86,z],[-.42,.86,z],N,BLACK,false);
    quad(trim,[-.55,1.345,-1.5],[.55,1.345,-1.5],[.55,1.33,-1.64],[-.55,1.33,-1.64],[0,.98,-.1],BLACK,false);
    quad(trim,[-.55,1.33,-1.64],[.55,1.33,-1.64],[.55,1.29,-1.62],[-.55,1.29,-1.62],[0,-.4,-1],BLACK,false);
  },
  // body-colour bumpers round a wide black lower grille; black diffuser at the back
  bumpers({quad,bumper,trim,PAINT,PLASTIC,BLACK,M}){
    const L=M.lower,[af,ar]=M.axles,R=M.arch,edge=(rows,s)=>{const a=rows[0];return[[0,a[0]+.03*s],[a[1]*.85,a[0]+.028*s],[a[1]+.012,a[0]+.008*s],...rows.slice(1).map(r=>[r[1]+.01,r[0]])];};
    const FR=edge(L.filter(r=>r[0]>=af+R-1e-6),1),RR=edge(L.filter(r=>r[0]<=ar-R+1e-6).reverse(),-1);
    bumper(FR,.2,.55,PAINT);bumper(RR,.26,.62,PAINT);bumper(RR.map(([x,z])=>[x*1.003,z-.003]),.26,.4,PLASTIC);
    const G=[.05,.05,.055];
    bumper(FR.slice(0,4).map(([x,z])=>[x*1.008,z+.008]),.22,.46,G);
    for(let i=1;i<4;i++)bumper(FR.slice(0,3).map(([x,z])=>[x*1.01,z+.011]),.22+i*.06,.226+i*.06,[.16,.16,.17]);
    quad(trim,[.7,.47,2.158],[.84,.47,2.085],[.86,.52,2.06],[.62,.52,2.176],[.3,0,1],G);
  },
  // shut lines, handles, body-colour mirrors, a kick in the rear window line
  doors({quad,box,tri,paint,trim,side,PAINT,BLACK}){
    for(const[z,y0]of[[.84,.3],[-.29,.3],[-1.33,.72]]){
      if(y0<.6)quad(trim,[.895,y0,z],[.895,y0,z+.012],[.895,.6,z+.012],[.895,.6,z],side,BLACK);
      quad(trim,[.895,Math.max(y0,.6),z],[.895,Math.max(y0,.6),z+.012],[.86,.93,z+.012],[.86,.93,z],side,BLACK);
    }
    for(const z of[-.16,-1.2])quad(trim,[.894,.82,z],[.894,.82,z+.12],[.892,.85,z+.12],[.892,.85,z],side,BLACK);
    for(const s of[1,-1]){const n=[.93*s,.36,0];tri(paint,[.774*s,.95,-.95],[.774*s,.955,-1.33],[.75*s,1.02,-1.33],n,n,n,PAINT);}
    box(paint,.79,.95,.93,1.02,.62,.74,PAINT);box(trim,.78,.79,.93,1.02,.62,.74,BLACK);
  }};
