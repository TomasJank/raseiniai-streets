// ---------- landmarks2: Ėmimo į Dangų church, Dominican monastery, GRPK tower structures (add_landmarks2.py) ----------
// Runs before buildWorld, so these looks win over the street files and the facades defaults.
// Monastery (c2475): two-storey plastered masonry, weathered off-white, red clay tile hip roofs (Mapillary 950279124727962, orthophoto).
// pitched:null keeps the LiDAR hip skeleton (facade2 drops it for a look whose pitched is false)
LOOK.c2475=Object.assign(LOOK.c2475||{},{kind:'civic',pitched:null,balcony:false,sty:STY.old,wall:[.80,.78,.71],roof:[.52,.25,.18],roofSty:'tiles',windows:true});
// Church body: the footprint becomes the low side chapels; the nave, towers and gables are drawn by landmarks2Church.
LOOK.c92=Object.assign(LOOK.c92||{},{h:6.5,pitched:false,wall:[.95,.95,.93],roof:[.62,.24,.17]});

// Norfa XL (c2135): flat roof measured on the 2024 orthophoto (light membrane, the roofs step's own value). Walls keep the dark
// cladding of club.js's look (owner's photos), lifted from near-black to anthracite; no street photo of the walls was found.
LOOK.c2135=Object.assign(LOOK.c2135||{},{roof:[.83,.85,.81],roofSty:'flat',wall:[.3,.31,.33]});

// GRPK pa6 points read off the 2024 orthophoto: [x, z, type, height m, diameter m, colour]; heights from shadow length (sun ~46 deg, +-20%)
const LM2_TOWERS=[
  [-1830.2,-629.7,'cyl',28,2.6,[.82,.8,.76]],
  [-2249.8,-1258.9,'roz',13,4.2,[.5,.32,.24]],
  [-2298.6,-1169.8,'cyl',10,3.4,[.9,.9,.88]],
  [-448.9,-816.5,'sq',20,3,[.86,.8,.62]],
  [-726,1929.9,'cyl',26,3.5,[.74,.46,.34]],
  [-805.3,1884.1,'cyl',11,3,[.78,.76,.72]],
  [1088.6,1260,'lat',70,5,null],
  [1106.8,-1060.3,'cyl',8.5,3,[.6,.6,.58]],
  [15.8,-1170,'chim',35,2.2,[.32,.32,.33]],
  [156.1,2432.2,'cyl',34,3,[.86,.84,.8]],
  [190.2,2390,'roz',14,4,[.5,.32,.24]],
  [37.8,-1172.7,'chim',35,2.2,[.32,.32,.33]],
  [676.4,-1132.1,'lat',60,4.5,null],
  [730,895.2,'chim',38,2.6,[.72,.7,.66]],
  [956.3,-975.3,'chim',25,2,[.76,.75,.72]],
  [999.2,-951.9,'chim',16,1.4,[.5,.49,.48]],
];

function landmarks2Towers(){
  const W=world,B=lmBuilder(),RED=[.78,.16,.12],WHT=[.92,.92,.9],STEEL=[.55,.56,.57],out=[];
  for(const [x,z,k,h,d,col] of LM2_TOWERS){
    const g=GY(x,z)-.4,r=d/2,f=B.frame(x,z,1,0,0,1);
    if(k==='cyl'){B.lathe(x,z,[[r,g],[r,g+h-1],[r+.25,g+h-1],[r+.25,g+h-.6],[r*.9,g+h-.6],[0,g+h]],12,col);}
    else if(k==='roz'){
      // steel stem with a wider tank and a low cone cap, the Rožnovsky farm water tower the bulb-ended shadows show
      B.lathe(x,z,[[.9,g],[.75,g+h-4.2],[r,g+h-3.6],[r,g+h-.9],[r*.55,g+h-.2],[0,g+h]],12,col);}
    else if(k==='sq'){const a=d/2;B.box(f,-a,a,g,g+h,-a,a,col);B.box(f,-a-.2,a+.2,g+h,g+h+.4,-a-.2,a+.2,[.62,.6,.56]);}
    else if(k==='chim'){B.lathe(x,z,[[r*1.35,g],[r,g+h-1.2],[r*1.06,g+h-1.2],[r*1.06,g+h],[r*.8,g+h],[r*.8,g+h-.5]],12,col);
      B.lathe(x,z,[[r*1.07,g+h-.9],[r*1.07,g+h-.1]],12,[.2,.2,.21]);}
    else if(k==='lat'){
      // square lattice mast in red and white bands: four legs, a horizontal and a diagonal brace every bay, two platforms
      const bays=Math.round(h/4),hw=y=>r+(.6-r)*(y-g)/h,leg=[[-1,-1],[1,-1],[1,1],[-1,1]];
      for(let i=0;i<bays;i++){const y0=g+i*h/bays,y1=g+(i+1)*h/bays,c=Math.floor(i*7/bays)%2?WHT:RED,a0=hw(y0),a1=hw(y1);
        for(let q=0;q<4;q++){const [sx,sz]=leg[q],[tx,tz]=leg[(q+1)%4];
          strut(B,[x+sx*a0,y0,z+sz*a0],[x+sx*a1,y1,z+sz*a1],.14,c);
          strut(B,[x+sx*a1,y1,z+sz*a1],[x+tx*a1,y1,z+tz*a1],.08,c);
          strut(B,[x+sx*a0,y0,z+sz*a0],[x+tx*a1,y1,z+tz*a1],.06,c);}}
      for(const y of[g+h*.62,g+h*.9]){const a=hw(y)+.5;B.box(f,-a,a,y,y+.2,-a,a,STEEL);}
      B.box(f,-.08,.08,g+h,g+h+4,-.08,.08,STEEL);}
    if(!W.inBuilding(x,z)){const p={x,z,r:k==='lat'?r+.3:r+.1};addProp(p);W.solids.push(p);}
    out.push({x,z,k,h,top:g+h});
  }
  const m=B.mesh();m.name='lm2_towers';worldGroup.add(m);
  W.lm2={towers:out,towerMesh:m};
}
// thin square beam between two points
function strut(B,a,b,t,col){
  const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],L=Math.hypot(dx,dy,dz),u=[dx/L,dy/L,dz/L];
  const s=Math.abs(u[1])<.9?[0,1,0]:[1,0,0],p=[u[1]*s[2]-u[2]*s[1],u[2]*s[0]-u[0]*s[2],u[0]*s[1]-u[1]*s[0]],pl=Math.hypot(...p);p[0]/=pl;p[1]/=pl;p[2]/=pl;
  const q=[u[1]*p[2]-u[2]*p[1],u[2]*p[0]-u[0]*p[2],u[0]*p[1]-u[1]*p[0]],c=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
  const C=(o,i,j)=>[o[0]+(p[0]*i+q[0]*j)*t,o[1]+(p[1]*i+q[1]*j)*t,o[2]+(p[2]*i+q[2]*j)*t],sq=[[-1,-1],[1,-1],[1,1],[-1,1]];
  for(let k=0;k<4;k++){const [i0,j0]=sq[k],[i1,j1]=sq[(k+1)%4];B.ring([C(a,i0,j0),C(a,i1,j1),C(b,i1,j1),C(b,i0,j0)],col,c);}
}

// Raseinių Švč. M. Marijos Ėmimo į Dangų church from the Mapillary and Commons photos: twin towers with red pyramid roofs on the north front,
// baroque gables over the north front and the south (chancel) end, steep red nave roof, lower side chapels.
// Local frame: u along the nave (north), v across it (east), both in metres projected from the OSM outline.
function landmarks2Church(){
  const W=world,rec=FX.recs.find(r=>r.id==='c92');if(!rec)return;
  const p=rec.pts,sp=rec.specs[0][1],dx=p[1][0]-p[0][0],dz=p[1][1]-p[0][1],l=Math.hypot(dx,dz),U=[dx/l,dz/l],V=[-U[1],U[0]];
  if(V[0]<0){V[0]=-V[0];V[1]=-V[1];}
  if(W.landmarks&&W.landmarks.church){worldGroup.remove(W.landmarks.church);W.landmarks.church.geometry.dispose();}
  const B=lmBuilder(),f=B.frame(0,0,V[0],V[1],U[0],U[1]),y0=sp.y0,yb=sp.yb-.3,Y=h=>y0+h;
  const WHT=[.95,.95,.93],CORN=[.86,.85,.82],ROOF=[.62,.24,.17],DARK=[.14,.16,.19],DOOR=[.3,.2,.13],GOLD=[.8,.64,.2];
  const gAt=(v,u)=>{const q=f.P(v,0,u);return GY(q[0],q[2]);},fr=(v,u,ax,az,nx,nz)=>{const q=f.P(v,0,u);return B.frame(q[0],q[2],ax,az,nx,nz);};
  // polygon (v,y) extruded along u from u0 to u1
  const slab=(poly,u0,u1,col)=>{const c=f.P(poly[0][0],poly[0][1],(u0+u1)/2),T=THREE.ShapeUtils.triangulateShape(poly.map(q=>new THREE.Vector2(q[0],q[1])),[]);
    for(const [i,j,k] of T)for(const u of[u0,u1])B.tri(f.P(...poly[i],u),f.P(...poly[j],u),f.P(...poly[k],u),col,f.P(poly[i][0],poly[i][1],u===u0?u0+1:u1-1));
    for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];B.ring([f.P(a[0],a[1],u0),f.P(b[0],b[1],u0),f.P(b[0],b[1],u1),f.P(a[0],a[1],u1)],col,c);}};
  const curve=(cx,cy,r,a0,a1,n=4)=>{const o=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return o;};
  const H=Math.PI/2;

  // nave: walls to the main cornice at 11.5 m, gable roof to 17.5 m
  const v0=143.5,v1=157.4,vm=(v0+v1)/2,uS=121.6,uN=159.4,eave=11.5,ridge=17.5;
  B.box(f,v0,v1,yb,Y(eave),uS,uN,WHT);
  B.box(f,v0-.25,v1+.25,Y(eave-.45),Y(eave),uS-.25,uN,CORN);
  for(const s of[-1,1]){const ve=s<0?v0-.45:v1+.45,ye=Y(eave)-(.45*(ridge-eave)/(vm-v0));
    B.ring([f.P(ve,ye,uS-.2),f.P(ve,ye,uN),f.P(vm,Y(ridge),uN),f.P(vm,Y(ridge),uS-.2)],ROOF,f.P(vm,Y(eave),(uS+uN)/2));}
  for(const u of[uS-.1,uN-.1])slab([[v0-.45,Y(eave)-.36],[vm,Y(ridge)],[v1+.45,Y(eave)-.36]],u,u+.1,WHT);
  // upper nave windows above the chapel roofs
  for(let u=127;u<157;u+=4.3)for(const s of[-1,1]){const w=fr(s<0?v0:v1,u,s*U[0],s*U[1],s*V[0],s*V[1]);
    B.arch(w,0,0,1.3,Y(8.3),1.5,DARK,.04);}

  // side chapels: lean-to roofs over the footprint strips, from the 6.5 m eave up to the nave wall
  const lean=(va,u0,u1)=>{const s=va<v0?-1:1,vw=s<0?v0:v1,ya=Y(6.6),yw=Y(8.6),vo=va+s*.35;
    B.ring([f.P(vo,ya-.2,u0-.3),f.P(vo,ya-.2,u1+.3),f.P(vw,yw,u1+.3),f.P(vw,yw,u0-.3)],ROOF,f.P(vw,ya-3,(u0+u1)/2));};
  lean(165.8,124.2,134.8);lean(167,134.8,145.2);lean(163.5,145.2,159.4);
  lean(137.3,124.3,133.8);lean(135.7,133.8,145.2);lean(138.7,145.2,159);

  // south (chancel) gable: full-width wall with a low pediment, concave volutes up to a narrower attic, triangular top and cross, pinnacles at the volute feet
  const conc=(cx,cy,r,a0,a1)=>curve(cx,cy,r,a0,a1,5),q=3.7;
  const gS=[[v0,eave],[v0+.9,eave],...conc(v0+.9,eave+2.8,2.8,-H,0).slice(1),[v0+q,17.2],[vm,19.4],[v1-q,17.2],...conc(v1-.9,eave+2.8,2.8,Math.PI,Math.PI+H).slice(0,-1),[v1-.9,eave],[v1,eave]].map(([a,b])=>[a,Y(b)]);
  slab(gS,uS-.3,uS+.5,WHT);
  slab([[v0+3.4,Y(eave)],[vm,Y(eave+1.3)],[v1-3.4,Y(eave)]],uS-.5,uS-.3,CORN);
  B.box(f,v0+q-.25,v1-q+.25,Y(17.0),Y(17.3),uS-.45,uS+.5,CORN);
  for(const vv of[v0+.9,v1-.9]){const [px,,pz]=f.P(vv,0,uS-.1);B.lathe(px,pz,[[.38,Y(eave)],[.34,Y(eave+.3)],[0,Y(eave+2)]],8,ROOF);}
  {const [px,,pz]=f.P(vm,0,uS);const cf=B.frame(px,pz,V[0],V[1],U[0],U[1]);B.box(cf,-.06,.06,Y(19.3),Y(21.1),-.06,.06,DARK);B.box(cf,-.45,.45,Y(20.3),Y(20.43),-.06,.06,DARK);}
  {const w=fr(vm,uS-.3,-V[0],-V[1],-U[0],-U[1]);B.box(w,-.5,.5,Y(14.6),Y(16.4),0,.05,DARK);
    for(const vv of[-5.6,-2.6,2.6,5.6])B.box(w,vv-.35,vv+.35,yb,Y(eave-.45),0,.14,[.9,.9,.88]);}

  // north front: central bay between the towers, pilasters, arched portal and windows, two-tier baroque gable with volutes and a cross
  const fv0=145.3,fv1=156.5,fu=168.7,fc=(fv0+fv1)/2;
  B.box(f,fv0,fv1,yb,Y(eave),uN-.2,fu,WHT);
  B.box(f,fv0-.2,fv1+.2,Y(eave-.45),Y(eave),uN,fu+.25,CORN);
  const gN=[[fv0,eave],[fv0,12.1],[146,12.4],...conc(146,14,1.6,-H,0).slice(1),[147.6,17.6],...conc(147.6,19,1.4,-H,0).slice(1),[149,20.6],[fc,22],[152.8,20.6],
    ...conc(154.2,19,1.4,Math.PI,Math.PI+H).slice(0,-1),[154.2,17.6],...conc(155.8,14,1.6,Math.PI,Math.PI+H).slice(0,-1),[155.8,12.4],[fv1,12.1],[fv1,eave]].map(([a,b])=>[a,Y(b)]);
  slab(gN,uN,fu,WHT);
  for(const [y,a,b] of[[12.35,145.6,156.2],[17.5,147.3,154.5],[20.5,148.7,153.1]])B.box(f,a,b,Y(y),Y(y+.3),fu-.4,fu+.2,CORN);
  {const w=fr(fc,fu,V[0],V[1],U[0],U[1]),G=gAt(fc,fu+1);
    for(const vv of[-5.3,-2.2,2.2,5.3])B.box(w,vv-.3,vv+.3,yb,Y(eave-.45),0,.16,[.9,.9,.88]);
    for(const vv of[-2.2,2.2])B.box(w,vv-.3,vv+.3,Y(12.7),Y(17.5),0,.12,[.9,.9,.88]);
    B.arch(w,0,0,2.2,Math.max(G,yb),2.4,DOOR,.06);B.arch(w,0,0,2.9,Math.max(G,yb)-.05,2.5,[.88,.87,.84],.03);
    for(const vv of[-3.75,3.75])B.arch(w,vv,0,1.1,Y(6.4),1.6,DARK,.04);
    B.arch(w,0,0,1.4,Y(7.6),1.7,DARK,.04);B.arch(w,0,0,.9,Y(14.4),1.2,DARK,.04);
    const tp=f.P(fc,0,fu-.3);const cf=B.frame(tp[0],tp[2],V[0],V[1],U[0],U[1]);B.box(cf,-.07,.07,Y(22),Y(24.2),-.07,.07,DARK);B.box(cf,-.55,.55,Y(23.3),Y(23.45),-.07,.07,DARK);}

  // twin towers: walls to 13.8 m (cornice at 11.5, low belfry storey), flared red pyramid to 21.6 m, ball and cross
  const TW=[[137.5,145.3,159.0,167.6],[156.4,165,159.4,167.7]];
  for(const [a,b,c,d] of TW){const tv=(a+b)/2,tu=(c+d)/2,h=(b-a)/2,hu=(d-c)/2,top=13.8,[tx,,tz]=f.P(tv,0,tu),tf=B.frame(tx,tz,V[0],V[1],U[0],U[1]);
    B.box(tf,-h,h,yb,Y(top),-hu,hu,WHT);
    B.box(tf,-h-.25,h+.25,Y(eave-.45),Y(eave),-hu-.25,hu+.25,CORN);B.box(tf,-h-.3,h+.3,Y(top-.35),Y(top),-hu-.3,hu+.3,CORN);
    for(let q=0;q<4;q++){const ang=q*H,cu=Math.cos(ang),su=Math.sin(ang),
      w=B.frame(tx,tz,V[0]*cu+U[0]*su,V[1]*cu+U[1]*su,U[0]*cu-V[0]*su,U[1]*cu-V[1]*su);
      B.arch(w,0,q%2?h:hu,.9,Y(12),.8,DARK,.04);}
    const ex=a<fc?-1:1;B.arch(B.frame(tx,tz,U[0],U[1],ex*V[0],ex*V[1]),0,h,1.1,Y(6.6),1.5,DARK,.04);
    B.arch(tf,0,hu,1.1,Y(6.6),1.5,DARK,.04);
    const R=Math.max(h,hu);B.frust(tf,0,0,R+.45,R-.25,Y(top),Y(top+.7),ROOF);B.frust(tf,0,0,R-.25,0,Y(top+.7),Y(21.6),ROOF);
    B.lathe(tx,tz,[[0,Y(21.5)],[.32,Y(21.75)],[0,Y(22.1)]],8,GOLD);B.box(tf,-.06,.06,Y(22),Y(23.6),-.06,.06,GOLD);B.box(tf,-.42,.42,Y(23),Y(23.12),-.06,.06,GOLD);}
  // door at the foot of the NE tower, east face (Mapillary 1227518735934009)
  {const [a,b,c,d]=TW[1];B.arch(fr((a+b)/2,(c+d)/2,-U[0],-U[1],V[0],V[1]),0,(b-a)/2,1.4,Math.max(yb,gAt(b+.5,(c+d)/2)),1.8,DOOR,.05);}

  const m=B.mesh();m.name='lm2_church';worldGroup.add(m);if(W.landmarks)W.landmarks.church=m;
  W.lm2.church={mesh:m,top:Y(24.2),towerTop:Y(23.6),ridge:Y(ridge),eave:Y(eave),y0,towers:TW.map(([a,b,c,d])=>{const q=f.P((a+b)/2,0,(c+d)/2);return[q[0],q[2]];})};
}
function landmarks2(){landmarks2Towers();landmarks2Church();}
