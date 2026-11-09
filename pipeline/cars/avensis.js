// Toyota Avensis T27 Tourer, 2015 facelift: 4.82 x 1.81 x 1.48 m, 2.70 m wheelbase; long estate roof, slim lamps on a raked nose.
CAR_MODELS.avensis={name:'Toyota Avensis T27 Tourer',dims:[4.82,1.81,1.48],axles:[1.475,-1.225],arch:.38,
  lower:[[2.41,.74,.34,.56,.6],[2.356,.81,.28,.62,.66],[2.275,.87,.23,.71,.75],[2.1,.9,.22,.78,.82],[1.855,.905,.22,.825,.865],[1.475,.905,.22,.87,.91],[1.095,.905,.22,.9,.94],[.6,.905,.22,.925,.965],[0,.905,.22,.945,.985],[-.6,.905,.22,.96,1],[-.845,.905,.22,.965,1.005],[-1.225,.905,.22,.97,1.01],[-1.605,.905,.22,.975,1.015],[-1.95,.9,.22,.98,1.02],[-2.2,.88,.24,.975,1.015],[-2.35,.84,.28,.95,.99],[-2.41,.78,.32,.9,.95]],
  upper:[[1.18,0],[1,1],[.8,1.14],[.6,1.26],[.4,1.355],[.2,1.42],[0,1.45],[-.4,1.465],[-1,1.46],[-1.5,1.45],[-1.85,1.43],[-2.05,1.4],[-2.2,1.32],[-2.3,1.2],[-2.36,0]],
  side:[.78,-2.1],pillars:[[-.2,-.28],[-1.33,-1.41]],glass:[.4,-2.03],strips:[],rings:false,mirror:null,
  plate:[[.36,2.448],[.63,-2.413]],grime:.05,
  // the fascia leans back from the bumper: chrome bar between long slim lamps, badge in the middle
  front({quad,trim,head,BLACK,CHROME}){
    const zf=y=>y<=.6?2.41:2.41-(y-.6)*.9,F=(x,y,o=.006)=>[x,y,zf(y)+o],N=[0,.67,.74];
    quad(trim,F(-.36,.615),F(.36,.615),F(.36,.665),F(-.36,.665),N,BLACK,false);
    quad(trim,F(-.36,.645,.008),F(.36,.645,.008),F(.36,.66,.008),F(-.36,.66,.008),N,CHROME,false);
    for(let i=0;i<12;i++){const a=i/12*TAU,b=(i+1)/12*TAU;quad(trim,F(0,.652,.011),F(0,.652,.011),F(Math.cos(b)*.05,.652+Math.sin(b)*.032,.011),F(Math.cos(a)*.05,.652+Math.sin(a)*.032,.011),N,CHROME,false);}
    quad(trim,F(.35,.61),F(.79,.655),F(.79,.73),F(.35,.68),N,BLACK);
    quad(head,F(.38,.625,.009),F(.77,.665,.009),F(.77,.72,.009),F(.38,.675,.009),N,[.86,.9,.94]);
    quad(head,F(.37,.612,.01),F(.78,.656,.01),F(.78,.666,.01),F(.37,.622,.01),N,[1,1,1]);
    quad(head,[.793,.658,2.31],[.875,.69,2.2],[.88,.765,2.2],[.793,.73,2.31],[.85,.3,.43],[.86,.9,.94]);
  },
  // L-shaped lamps from the tailgate round onto the quarter, chrome bar over the plate
  rear({quad,trim,tail,CHROME,RED}){
    const z=-2.413,N=[0,0,-1];
    quad(trim,[-.4,.765,z],[.4,.765,z],[.4,.78,z],[-.4,.78,z],N,CHROME,false);
    quad(tail,[.52,.72,z],[.785,.72,z],[.785,.86,z],[.6,.86,z],N,RED);
    quad(tail,[.785,.72,z],[.845,.72,-2.352],[.845,.93,-2.352],[.785,.86,z],[.7,0,-.7],RED);
    quad(tail,[.845,.72,-2.352],[.884,.74,-2.2],[.884,.965,-2.2],[.845,.93,-2.352],[.97,0,-.25],RED);
    quad(tail,[.62,.79,z-.002],[.78,.79,z-.002],[.78,.83,z-.002],[.66,.83,z-.002],N,[.42,.05,.07]);
  },
  // body-colour bumpers: big trapezoid lower grille with a chrome top, fogs in black corners, black diffuser at the back
  bumpers({quad,bumper,trim,PAINT,PLASTIC,BLACK,CHROME,M}){
    const L=M.lower,[af,ar]=M.axles,R=M.arch,edge=(rows,s)=>{const a=rows[0];return[[0,a[0]+.03*s],[a[1]*.85,a[0]+.028*s],[a[1]+.012,a[0]+.008*s],...rows.slice(1).map(r=>[r[1]+.01,r[0]])];};
    const FR=edge(L.filter(r=>r[0]>=af+R-1e-6),1),RR=edge(L.filter(r=>r[0]<=ar-R+1e-6).reverse(),-1);
    bumper(FR,.22,.6,PAINT);bumper(RR,.3,.64,PAINT);bumper(RR.map(([x,z])=>[x*1.003,z-.003]),.3,.4,PLASTIC);
    const z=2.444,N=[0,0,1],G=[.05,.05,.055];
    quad(trim,[-.44,.53,z],[.44,.53,z],[.56,.26,z],[-.56,.26,z],N,G,false);
    for(let i=1;i<5;i++){const y=.26+i*.054,x=.56-i*.024;quad(trim,[-x,y,z+.002],[x,y,z+.002],[x,y+.007,z+.002],[-x,y+.007,z+.002],N,[.18,.18,.19],false);}
    quad(trim,[-.44,.53,z+.003],[.44,.53,z+.003],[.45,.55,z+.003],[-.45,.55,z+.003],N,CHROME,false);
    bumper(FR.slice(1,4).map(([x,z])=>[x*1.008,z+.008]),.28,.42,G);
    quad(trim,[.64,.31,2.43],[.74,.31,2.408],[.74,.37,2.408],[.64,.37,2.43],[.2,0,1],[.85,.85,.8]);
  },
  // shut lines, handles, body-colour mirrors, low roof rails
  doors({quad,box,paint,trim,side,PAINT,BLACK,CHROME}){
    for(const[z,y0]of[[.98,.3],[-.22,.3],[-1.37,.68]]){
      if(y0<.6)quad(trim,[.905,y0,z],[.905,y0,z+.012],[.905,.6,z+.012],[.905,.6,z],side,BLACK);
      quad(trim,[.905,Math.max(y0,.6),z],[.905,Math.max(y0,.6),z+.012],[.875,.95,z+.012],[.875,.95,z],side,BLACK);
    }
    for(const z of[-.1,-1.28])quad(trim,[.904,.85,z],[.904,.85,z+.13],[.902,.88,z+.13],[.902,.88,z],side,CHROME);
    box(paint,.8,.96,.95,1.05,.76,.88,PAINT);box(trim,.79,.8,.95,1.05,.76,.88,BLACK);
    const rz=[-.1,-.6,-1.2,-1.7,-2.0],ry=[1.47,1.477,1.475,1.462,1.442];
    for(let i=0;i<rz.length-1;i++){
      quad(trim,[.5,ry[i],rz[i]],[.5,ry[i+1],rz[i+1]],[.55,ry[i+1],rz[i+1]],[.55,ry[i],rz[i]],[0,1,0],[.12,.12,.13]);
      quad(trim,[.55,ry[i]-.02,rz[i]],[.55,ry[i+1]-.02,rz[i+1]],[.55,ry[i+1],rz[i+1]],[.55,ry[i],rz[i]],side,[.12,.12,.13]);
    }
  }};
