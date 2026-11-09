// Skoda Octavia Mk3 liftback in Lithuanian police livery (the paint is policeM); by eye from Tomas's reference photos.
CAR_MODELS.octavia={name:'Skoda Octavia Mk3',dims:[4.66,1.81,1.46],
  // liftback: lower hood, higher belt, tall roof falling into a short tail
  lower:[[2.24,.74,.32,.56,.6],[2.2,.8,.27,.617,.657],[2.12,.85,.23,.73,.77],[1.95,.865,.22,.77,.81],[1.715,.87,.22,.81,.85],[1.33,.87,.22,.88,.92],[.945,.87,.22,.92,.96],[.6,.87,.22,.94,.98],[0,.87,.22,.96,1],[-.6,.87,.22,.975,1.01],[-.835,.87,.22,.98,1.015],[-1.22,.87,.22,.99,1.025],[-1.45,.87,.22,.995,1.03],[-1.605,.87,.22,1,1.035],[-1.9,.86,.22,1.005,1.04],[-2.1,.84,.27,1,1.035],[-2.2,.76,.32,.95,1]],
  upper:[[1.02,0],[.86,1.03],[.66,1.17],[.46,1.3],[.28,1.39],[.08,1.445],[-.08,1.46],[-.16,1.46],[-.6,1.455],[-.9,1.435],[-1.08,1.4],[-1.14,1.39],[-1.3,1.33],[-1.5,1.24],[-1.7,1.15],[-1.9,1.07],[-2.02,0]],
  side:[.66,-1.6],pillars:[[-.08,-.16],[-1.08,-1.14]],glass:[.28,-1],strips:[],rings:false,mirror:null,
  // the fascia leans back from the bumper; grille, lamps and badge sit on that slope
  front({quad,trim,head,CHROME,BLACK}){
    const zf=y=>y<=.6?2.24:2.24-(y-.6)*.706,F=(x,y,o=.007)=>[x,y,zf(y)+o],FN=[0,.577,.817];
    // tall grille: chrome frame, black field, vertical slats, narrower at the bottom
    quad(trim,F(-.41,.75,.005),F(.41,.75,.005),F(.33,.585,.005),F(-.33,.585,.005),FN,CHROME,false);
    quad(trim,F(-.385,.738),F(.385,.738),F(.315,.598),F(-.315,.598),FN,BLACK,false);
    for(let i=-6;i<=6;i++){const t=i*.055,u=i*.045;quad(trim,F(t-.008,.734,.009),F(t+.008,.734,.009),F(u+.008,.602,.009),F(u-.008,.602,.009),FN,[.3,.31,.32],false);}
    // badge on the bonnet lip
    const disc=(cy,r,o,col)=>{for(let i=0;i<16;i++){const a=i/16*TAU,b=(i+1)/16*TAU;quad(trim,F(0,cy,o),F(0,cy,o),F(Math.cos(b)*r,cy+Math.sin(b)*r,o),F(Math.cos(a)*r,cy+Math.sin(a)*r,o),FN,col,false);}};
    disc(.785,.036,.012,CHROME);disc(.785,.026,.014,[.04,.22,.12]);
    // big swept lamps from the grille corner round onto the wing
    quad(trim,F(.405,.59,.006),F(.8,.62,.006),F(.8,.775,.006),F(.405,.752,.006),FN,BLACK);
    quad(head,F(.43,.605,.009),F(.6,.618,.009),F(.6,.745,.009),F(.43,.738,.009),FN,[.95,.96,.9]);
    quad(head,F(.61,.62,.009),F(.79,.632,.009),F(.79,.764,.009),F(.61,.748,.009),FN,[.8,.85,.88]);
    quad(head,[.836,.635,2.16],[.866,.665,1.96],[.866,.77,1.96],[.836,.77,2.16],[.95,0,.3],[.8,.85,.88]);
    // lower intake and fog lamps
    quad(trim,F(-.53,.25,.018),F(.53,.25,.018),F(.45,.4,.018),F(-.45,.4,.018),[0,0,1],BLACK,false);
    for(let i=0;i<4;i++)quad(trim,F(-.5+i*.03,.27+i*.032,.02),F(.5-i*.03,.27+i*.032,.02),F(.5-i*.03,.278+i*.032,.02),F(-.5+i*.03,.278+i*.032,.02),[0,0,1],[.16,.16,.17],false);
    quad(trim,[.6,.28,2.258],[.74,.28,2.238],[.73,.38,2.239],[.6,.38,2.258],[0,0,1],BLACK);
    quad(trim,[.63,.3,2.262],[.71,.3,2.247],[.705,.36,2.248],[.63,.36,2.262],[0,0,1],[.8,.8,.76]);
  },
  // plate on the tailgate between big C-shaped lamps that wrap round the corners
  rear({quad,plate,trim,tail,CHROME,RED}){
    plate(.74,-2.21,-1);plate(.42,2.256,1);
    quad(trim,[-.33,.885,-2.209],[.33,.885,-2.209],[.33,.893,-2.209],[-.33,.893,-2.209],[0,0,-1],CHROME,false);
    quad(tail,[.4,.81,-2.206],[.755,.79,-2.206],[.755,.94,-2.206],[.4,.93,-2.206],[0,0,-1],RED);
    quad(tail,[.49,.84,-2.209],[.7,.83,-2.209],[.7,.905,-2.209],[.49,.9,-2.209],[0,0,-1],[.42,.05,.07]);
    quad(tail,[.755,.79,-2.206],[.846,.79,-2.1],[.846,.94,-2.1],[.755,.94,-2.206],[.7,0,-.7],RED);
    quad(tail,[.848,.8,-2.1],[.864,.83,-1.9],[.864,.95,-1.9],[.848,.94,-2.1],[1,0,-.1],RED);
    quad(tail,[.68,.45,-2.247],[.76,.45,-2.232],[.76,.48,-2.232],[.68,.48,-2.247],[0,0,-1],[.6,.05,.07]);
  },
  // body-colour bumpers with a black lip
  bumpers({bumper,PAINT,BLACK}){
    const FR=[[0,2.25],[.72,2.24],[.81,2.19],[.858,2.1],[.868,1.9],[.868,1.715]],RR=[[0,-2.25],[.7,-2.24],[.79,-2.19],[.83,-2.1],[.858,-1.6]];
    bumper(FR,.21,.6,PAINT);bumper(RR,.3,.62,PAINT);bumper(FR.map(([x,z])=>[x*1.002,z+.003]),.21,.27,BLACK);bumper(RR.map(([x,z])=>[x*1.002,z-.003]),.3,.37,BLACK);
  },
  // shut lines, handles in the Octavia's places, body-colour mirrors
  doors({quad,box,paint,trim,side,PAINT,BLACK}){
    for(const[z,y0]of[[.74,.33],[-.12,.33],[-1.12,.69]]){
      if(y0<.6)quad(trim,[.86,y0,z],[.86,y0,z+.012],[.875,.6,z+.012],[.875,.6,z],side,BLACK);
      quad(trim,[.875,Math.max(y0,.6),z],[.875,Math.max(y0,.6),z+.012],[.86,.93,z+.012],[.86,.93,z],side,BLACK);
    }
    for(const z of[-.06,-1.04])quad(paint,[.874,.83,z],[.874,.83,z+.13],[.872,.86,z+.13],[.872,.86,z],side);
    box(paint,.8,.97,.99,1.09,.66,.78,PAINT);box(trim,.79,.8,.99,1.09,.66,.78,BLACK);
  }};
