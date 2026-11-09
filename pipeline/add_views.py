"""Views matched to Mapillary photos (CC BY-SA 4.0, 2025-26; list and credits in refs/mapillary/CREDITS.tsv).
Eye reference only, no pixels used:
- Vilniaus g.: red-brown paver pavements and a galvanised railing just behind the kerb on both sides, open at crossings
  and lights; replaces the red kerb band and the stadium-only brick and railing.
- front gardens along Vilniaus g. (mostly hedges), darker weathered railing.
- broadleaf crowns taller, narrower and lighter, as in the summer photos.
- town-wide (41 survey photos): lighter asphalt, fuller low tree crowns, plaster walls and grey roofs over brick and red
  tile, no pavement on main roads past 1 km from the centre.
- main buildings: Ėmimo į Dangų church (red roofs, north tower), Orthodox church (bell tower, dark spire), culture centre
  (flat white blocks), town hall (light grey, three flags), Žemaitis monument on the central square.
- town hall lowered to three storeys with five gables on the south front and a four-storey block at the south-east end; Raseinių parkas wooded,
  with benches, lamps and bins on its paths; courts, hoops, nets and goals on OSM pitches; floodlights and stands at the
  stadium; OSM parking lots with bays and parked cars; church yard wall white with red brick pillars; town hall
  single-storey entrance block under a wider flat canopy; glass shelters and signs at the OSM bus stops.
- Maxima XX: muted brown cladding, light grey panels round the entrance and a ribbed grey corner above the canopy,
  a grey canopy instead of dark green, tenant signs laid out as in the photos.
- people: talking groups with speech bubbles, sitting on benches, phones, early sidestepping; the player's car hits
  anyone inside its outline; cars collide as five circles along their length, parked cars included.
usage: add_views.py page.html   (edits in place; run after add_world2.py, before or after add_perf.py)
"""
import sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)

# Vilniaus g. pavements: pavers, and the kerb line every 3 m becomes a railing segment 35 cm in from the kerb
rep("const PAVE=[.52,.52,.5],KERB=[.62,.62,.6];", "const PAVE=[.52,.52,.5],KERB=[.62,.62,.6],VPAVE=[.48,.4,.37];")
rep("strip(PV,run,rw,.14,PAVE);if(r.t.name==='Vilniaus g.')strip(PV,inner.map(p=>[p[0]+p[2]*.2,p[1]+p[3]*.2]),.32,.15,[.5,.25,.19]);",
    "const vil=r.t.name==='Vilniaus g.';strip(PV,run,rw,.14,vil?VPAVE:PAVE);"
    "if(vil)for(let i=0;i<inner.length-1;i++){const a=inner[i],b=inner[i+1];(W.vrails||(W.vrails=[])).push([a[0]+a[2]*.35,a[1]+a[3]*.35,b[0]+b[2]*.35,b[1]+b[3]*.35,a[2],a[3]]);}")
a = h.index("  // Vilniaus g. on the stadium side: red brick pavement behind a steel railing at the kerb\n")
b = h.index("instances(unit,0x3a3e40,rp);instances(unit,0x3a3e40,rr);}\n", a) + len("instances(unit,0x3a3e40,rp);instances(unit,0x3a3e40,rr);}\n")
h = h[:a] + """  // Vilniaus g.: galvanised railing just behind the kerb on both sides, open at crossings and signals
  // along the stadium only the stadium side has one; the houses opposite open straight onto the pavement
  {const cr=CROSSINGS.map(([la,lo])=>LL(la,lo)),rp=[],rr=[],[sx,sz]=LL(STAD.lat,STAD.lon);for(const s of signals)cr.push([s.n.x,s.n.z]);
    for(const [x0,z0,x1,z1,nx,nz] of world.vrails||[]){const mx=(x0+x1)/2,mz=(z0+z1)/2;
      if(cr.some(c=>(c[0]-mx)**2+(c[1]-mz)**2<25))continue;
      if(Math.hypot(sx-mx,sz-mz)<170&&(sx-mx)*nx+(sz-mz)*nz<0)continue;
      const h=Math.atan2(x1-x0,z1-z0),L=Math.hypot(x1-x0,z1-z0),g0=GY(x0,z0)+.14,g1=GY(x1,z1)+.14;
      rp.push([x0,g0+.5,z0,h,.05,1,.05]);
      for(const y of[.55,.98])rr.push([mx,(g0+g1)/2+y,mz,h,.045,.045,L]);
      addWall(x0,z0,x1,z1);}
    if(rp.length){instances(unit,0x9aa0a3,rp);instances(unit,0x9aa0a3,rr);}}
""" + h[b:]

# Maxima XX
rep("const k=hash(i*7+j*31+y)*22|0;fr(`rgb(${146+k},${108+k},${70+k})`", "const k=hash(i*7+j*31+y)*14|0;fr(`rgb(${124+k},${98+k},${78+k})`")
rep("[['#5f9a3c',8,968,232,116],['#6d4a2f',244,968,232,116],['#2c2b2a',480,968,232,116],['#7da63f',716,968,236,116],['#fff',8,1092,232,116],['#fff',244,1092,232,116],['#fff',480,1092,472,116]].forEach(([c,x,y,w,h])=>fr(c,x,y,w,h));",
    "fr('#a3a7aa',0,960,960,256);"
    "[['#fff',8,968,232,110],['#fff',244,968,232,110],['#1d1c1b',480,968,232,110],['#fff',716,968,236,110],['#fff',244,1094,232,110],['#1d1c1b',480,1094,232,110],['#fff',716,1094,236,110]].forEach(([c,x,y,w,h])=>fr(c,x,y,w,h));"
    "fr('#3f9a3a',20,980,86,86);txt('b',63,1024,70,'#fff','center');txt('EURO',360,1004,40,'#1f7a74','center');txt('VAISTINĖ',360,1046,34,'#1f7a74','center');"
    "fr('#e7c23a',500,1010,192,26);txt('Vizija',834,1024,52,'#3f9a3a','center');")
rep("txt('Telia',124,1150,64,'#6b2c91','center');fr('#d3212c',600,1092,352,116);txt('ERGO',776,1150,76,'#fff','center');",
    "txt('Telia',360,1150,60,'#6b2c91','center');txt('ROYAL',596,1128,34,'#fff','center');txt('SMOKE',596,1170,34,'#fff','center');"
    "g.strokeStyle='#d3212c';g.lineWidth=8;g.strokeRect(724,1102,220,94);txt('ERGO',834,1150,64,'#d3212c','center');"
    # light grey horizontal cladding and a ribbed grey panel for the entrance block
    "fr('#a3a7aa',300,1600,1000,300);for(let y=1600;y<1900;y+=30)fr('#8f9497',300,y,1000,3);"
    "fr('#9da2a5',1350,1600,300,300);for(let x=1350;x<1650;x+=20)fr('#878c8f',x,1600,6,300);")
rep("box(-3.5,21,-3.5,0,y0+3.4,y0+5.2,DARK);box(-3.5,0,0,12,y0+3.4,y0+5.2,DARK);",
    "box(-3.5,21,-3.5,0,y0+3.4,y0+5.2,[.36,.38,.4]);box(-3.5,0,0,12,y0+3.4,y0+5.2,[.36,.38,.4]);"
    "wq(F(16,-.03),F(0,-.03),y0+5.2,top,toSE,[300,1600,1000,300]);wq(F(-.03,0),F(-.03,8),y0+5.2,top+.8,toNE,[1350,1600,300,300]);")

# Vilniaus g. front gardens: mostly clipped thuja hedges behind a grass strip, some mesh and picket fences
rep("if(r.cls!==1&&r.cls!==2)continue;", "const vil=r.t.name==='Vilniaus g.';if(r.cls!==1&&r.cls!==2&&!vil)continue;")
rep("const off=r.w/2+(r.pave?2.3:1.6);", "const off=r.w/2+(vil?3.9:r.pave?2.3:1.6);")
rep("st=s<.34?'picket':s<.56?'mesh':s<.8?'hedge':null;", "st=vil?(s<.7?'hedge':s<.85?'mesh':'picket'):s<.34?'picket':s<.56?'mesh':s<.8?'hedge':null;")
rep("instances(unit,0x9aa0a3,rp);instances(unit,0x9aa0a3,rr);", "instances(unit,0x7f8588,rp);instances(unit,0x7f8588,rr);")
# street trees: the photos show taller, narrower, lighter crowns than the old wide dark domes
rep("r=Math.min(t[3],h*.38+.5),crown=h*.62,hs=hash(t[0]*1.7+t[1]);", "r=Math.min(t[3]*.85,h*.3+.5),crown=h*.74,hs=hash(t[0]*1.7+t[1]);")
rep("const cv=Math.max(crown/2,r*.85);", "const cv=Math.max(crown/2,r*1.05);")
rep("col.setHSL(.22+hs*.08,.42,.24+hs*.1);", "col.setHSL(.24+hs*.07,.36,.28+hs*.09);")
# one continuous hedge per frontage instead of a stub per house, a driveway gap only in longer runs
rep("if(b!==owner){flush();owner=b;}", "if(b!==owner&&!(vil&&owner)){flush();owner=b;}")
rep("if(st){const g=Math.floor(seg.length*(.25+hash(k+2)*.5));", "if(st){const g=vil&&seg.length<14?seg.length+1:Math.floor(seg.length*(.25+hash(k+2)*.5));")
# town-wide survey photos: houses are mostly plastered or boarded in cream, yellow and white under grey roofs;
# red brick walls and red tile roofs are the exception
rep("const ROOF_PITCH=[[.55,.22,.16],[.36,.34,.34],[.47,.29,.19],[.30,.36,.38]];",
    "const ROOF_PITCH=[[.55,.22,.16],[.36,.34,.34],[.47,.29,.19],[.30,.36,.38],[.29,.30,.31],[.40,.40,.39],[.24,.25,.26]];")
rep("const BRICK=[[.89,.88,.84],[.84,.74,.48],[.65,.36,.25],[.80,.79,.75]];", "const BRICK=[[.89,.88,.84],[.84,.74,.48],[.65,.36,.25],[.80,.79,.75],[.90,.89,.85],[.86,.80,.62]];")
rep("r<.3&&h<4.5?STY.wood:r<.62?STY.plaster:STY.brick;", "r<.3&&h<4.5?STY.wood:r<.8?STY.plaster:STY.brick;")
# asphalt in the survey photos is a light weathered grey, not near-black
rep("const ROADCOL=[[.23,.24,.25],[.27,.28,.29],[.31,.32,.33],", "const ROADCOL=[[.36,.36,.36],[.40,.40,.40],[.44,.44,.43],")
# survey photos past ~1 km from the centre show main roads with grass or gravel verges, no pavement
rep("(r.cls===0&&!r.unpaved&&cd(mid[0],mid[1])<1600)", "(r.cls===0&&!r.unpaved&&cd(mid[0],mid[1])<1000)")
# houses on Vilniaus g. stand further back than on side streets
rep("for(const k of [4,8,13,19]){b=W.inBuilding(px+nx*k,pz+nz*k);if(b)break;}", "for(const k of vil?[4,8,13,19,25,31]:[4,8,13,19]){b=W.inBuilding(px+nx*k,pz+nz*k);if(b)break;}")

# main buildings, matched to Mapillary photos in refs/mapillary/landmarks
rep("c2220:{wall:[.86,.87,.85],sty:-1,windows:false}}",
    "c2220:{wall:[.86,.87,.85],sty:-1,windows:false},"
    # Ėmimo į Dangų church: white, red tiled roofs, square tower at the north end under a red pyramid
    "c92:{roof:[.55,.27,.2],towerRoof:[.56,.26,.18],towerAt:[55.37866,23.12278],towerW:8,towerH:9,spire:.9},"
    # Orthodox church: white, tall bell tower under a dark cupola and spire
    "c219:{wall:[.95,.95,.93],roof:[.33,.38,.37],towerRoof:[.2,.22,.24],towerW:5,towerH:14,spire:2.4},"
    # culture centre: flat-roofed white blocks, the stage tower stands above the rest
    "c171:{wall:[.93,.93,.91],roof:[.5,.5,.49],pitched:false,hip:false,skel:null,tops:null,sty:STY.plaster,h:10,towerW:18,towerH:7,spire:.02,towerRoof:[.6,.6,.59]},"
    # town hall: light grey, plain windows
    "c2159:{wall:[.66,.66,.65],roof:[.40,.40,.40],sty:STY.plaster}}")
rep("const tw=Math.min(7,Math.sqrt(area)*.28),th=s.y0+s.h+12+Math.min(10,area/120);",
    "const tw=s.towerW||Math.min(7,Math.sqrt(area)*.28),th=s.y0+s.h+(s.towerH||12+Math.min(10,area/120));if(s.towerAt){const q=P(s.towerAt);cx0=q[0];cz0=q[1];}")
rep("const ap=[cx0,th+tw*1.6,cz0],rc=[.25,.42,.36];", "const ap=[cx0,th+tw*(s.spire||1.6),cz0],rc=s.towerRoof||[.25,.42,.36];")
rep("top=th+tw*1.6;", "top=th+tw*(s.spire||1.6);")
rep("if(s.kind==='church'&&area>150){", "if((s.kind==='church'||s.towerH)&&area>150){")
# Žemaitis (V. Grybas, 1934) on the central square: stepped base, tall pedestal, a Samogitian pressing down a bear;
# three flags in front of the town hall
rep("instances(unit,0x7f8588,rp);instances(unit,0x7f8588,rr);}}\n", """instances(unit,0x7f8588,rp);instances(unit,0x7f8588,rr);}}
  {const [X,Z]=LL(55.38119,23.11704),G=GY(X,Z),hd=.6,c=Math.cos(hd),s=Math.sin(hd),st=[],fg=[];
    const b=(ox,y,oz,sx,sy,sz,tilt=0,L=st)=>L.push([X+ox*c+oz*s,G+y,Z-ox*s+oz*c,hd,sx,sy,sz,tilt]);
    b(0,.25,0,6,.5,6);b(0,.75,0,4.6,.5,4.6);b(0,3.5,0,2.6,5,2.6);b(0,6.2,0,3,.4,3);b(0,6.7,0,2.2,.6,2.2);
    b(-.1,7.4,0,1.9,.8,.9,0,fg);b(.95,7.55,0,.5,.5,.55,0,fg);b(-.35,8.5,0,.5,1.4,.35,0,fg);b(-.35,9.75,0,.7,1.1,.42,0,fg);b(-.35,10.55,0,.32,.4,.32,0,fg);b(.15,9.3,0,.18,1.1,.18,.7,fg);
    instances(unit,0xb7b2a6,st);instances(unit,0x8f8b80,fg);
    const C=[[-3,-3],[3,-3],[3,3],[-3,3]].map(([u,v])=>[X+u*c+v*s,Z-u*s+v*c]);for(let i=0;i<4;i++)addWall(...C[i],...C[(i+1)%4]);}
  {const poles=[],cloth=[],cols=[[0xfdb913,0x006a44,0xc1272d],[0xb0262d,0xb0262d,0xb0262d],[0xf2c230,0xf2c230,0xf2c230]];
    [[55.3813843,23.1174641],[55.3813717,23.1174048],[55.3813592,23.1173455]].forEach(([la,lo],i)=>{const [x,z]=LL(la,lo),g=GY(x,z);
      poles.push([x,g+5,z,0,.08,10,.08]);cols[i].forEach((col,k)=>cloth.push([col,[x+.85,g+9.55-k*.36,z,0,1.6,.36,.03]]));addWall(x-.1,z,x+.1,z);});
    instances(unit,0xd4d6d6,poles);for(const [col,box] of cloth)instances(unit,col,[box]);}
""")

# parks, pitches and parking from OSM (work/facilities.json; the park has two courts side by side beside Vytauto Didžiojo g.,
# running across the road, as the user described them): park trees, benches, lamps and bins along park paths,
# court surfaces with lines, hoops, nets and goals, floodlight masts and stands at the stadium, parking bays with cars
import json, os
FAC = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'work', 'facilities.json')).read()
rep("function addWall(x0,z0,x1,z1){", "const FAC=" + FAC + """;
function facRect(p){let c0=0,c1=0;for(const q of p){c0+=q[0]/p.length;c1+=q[1]/p.length;}
  let bi=0,bl=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length],l=Math.hypot(q[0]-p[i][0],q[1]-p[i][1]);if(l>bl){bl=l;bi=i;}}
  const a=p[bi],b=p[(bi+1)%p.length],ux=(b[0]-a[0])/bl,uz=(b[1]-a[1])/bl,vx=-uz,vz=ux;let L0=1e9,L1=-1e9,W0=1e9,W1=-1e9;
  for(const q of p){const s=(q[0]-c0)*ux+(q[1]-c1)*uz,t=(q[0]-c0)*vx+(q[1]-c1)*vz;L0=Math.min(L0,s);L1=Math.max(L1,s);W0=Math.min(W0,t);W1=Math.max(W1,t);}
  const cx=c0+ux*(L0+L1)/2+vx*(W0+W1)/2,cz=c1+uz*(L0+L1)/2+vz*(W0+W1)/2;
  return{cx,cz,ux,uz,vx,vz,L:L1-L0,W:W1-W0,at:(s,t)=>[cx+ux*s+vx*t,cz+uz*s+vz*t]};}
function addWall(x0,z0,x1,z1){""")
rep("W.nb=W.buildings.length;", """{const PS={basketball:[.47,.33,.29],multi:[.47,.33,.29],volleyball:[.6,.47,.36],tennis:[.3,.46,.42],roller_skating:[.5,.5,.49]},LN=[.9,.9,.88];
    W.lots=[];W.facR=[];W.paths=roadsAll.filter(r=>r.cls===4&&r.w<=3).map(r=>({pts:r.pts,w:r.w}));
    for(const f of FAC.lots){const p=f.map(q=>P(q));if(!inBox(p[0][0],p[0][1],0)||Math.abs(polyArea(p))<40)continue;flatPoly(RD,p,.045,ROADCOL[1]);
      const R=facRect(p);if(p.length>6||R.L<9||R.W<4.8)continue;const rows=R.W>=11?[-1,1]:[-1];R.rows=rows;W.lots.push(R);
      for(const e of rows)for(let s=-R.L/2+.6;s<=R.L/2-.5;s+=2.5)ribbon(MK,[R.at(s,e*R.W/2),R.at(s,e*(R.W/2-4.8))],.1,.07,LN);}
    for(const [sp,hoops,surf,g] of FAC.pitches){const p=g.map(q=>P(q));if(!inBox(p[0][0],p[0][1],0))continue;
      const col=surf==='asphalt'?ROADCOL[1]:/grass|turf/.test(surf)?null:PS[sp];if(col)flatPoly(RD,p,.05,col);
      if(p.length>5)continue;const R=facRect(p),hl=R.L/2-.6,hw=R.W/2-.6;if(hl<3||hw<2)continue;W.facR.push({sp,hoops,R});
      const c=[R.at(-hl,-hw),R.at(hl,-hw),R.at(hl,hw),R.at(-hl,hw)];ribbon(MK,[...c,c[0]],.08,.075,LN);ribbon(MK,[R.at(0,-hw),R.at(0,hw)],.08,.075,LN);}}
  W.nb=W.buildings.length;""")
rep("  if(trees.length){", """  // Raseinių parkas is wooded throughout (survey photos 2015-26); fill between the paths where the LiDAR tree list is thin
  for(const [name,g] of FAC.parks){if(name!=='Raseinių parkas')continue;const p=g.map(q=>P(q)),pit=FAC.pitches.map(f=>f[3].map(q=>P(q)));
    let mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9;for(const q of p){mnx=Math.min(mnx,q[0]);mxx=Math.max(mxx,q[0]);mnz=Math.min(mnz,q[1]);mxz=Math.max(mxz,q[1]);}
    const near=trees.filter(t=>t[0]>mnx-10&&t[0]<mxx+10&&t[1]>mnz-10&&t[1]<mxz+10),paths=[];
    for(const r of roadsAll)for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1];if(Math.max(a[0],b[0])>mnx-10&&Math.min(a[0],b[0])<mxx+10&&Math.max(a[1],b[1])>mnz-10&&Math.min(a[1],b[1])<mxz+10)paths.push([a,b,r.w/2+2.5]);}
    const ds=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);};
    for(let i=0;i<3000;i++){const x=mnx+hash(i*3.1+.7)*(mxx-mnx),z=mnz+hash(i*7.3+.2)*(mxz-mnz);
      if(!pip(x,z,p)||W.inBuilding(x,z)||pit.some(q=>pip(x,z,q))||paths.some(s=>ds(x,z,s[0],s[1])<s[2])||near.some(t=>Math.hypot(t[0]-x,t[1]-z)<9.5))continue;
      const s=.85+hash(i*1.9+.3)*.55,t=[x,z,13*s,3.4*s,hash(i*5.7+.1)<.2];trees.push(t);near.push(t);}}
  if(trees.length){""")
rep("for(const [col,box] of cloth)instances(unit,col,[box]);}\n", """for(const [col,box] of cloth)instances(unit,col,[box]);}
  {const L={},put=(k,x,z,y,hd,sx,sy,sz)=>(L[k]||(L[k]=[])).push([x,GY(x,z)+y,z,hd,sx,sy,sz]),hdOf=(x,z)=>Math.atan2(-z,x);
    const bench=(x,z,fx,fz)=>{const hd=hdOf(-fz,fx);put('seat',x,z,.45,hd,1.7,.07,.42);put('seat',x-fx*.22,z-fz*.22,.78,hd,1.7,.36,.06);
      for(const k of[-.7,.7])put('iron',x-fz*k,z+fx*k,.22,hd,.08,.45,.45);addWall(x-fx*.2+fz*.85,z-fz*.2-fx*.85,x-fx*.2-fz*.85,z-fz*.2+fx*.85);};
    const parks=FAC.parks.map(f=>f[1].map(q=>LL(...q)));
    for(const r of world.paths){let d0=0,next=7,j=0;const Q=r.pts;
      for(let i=0;i<Q.length-1;i++){const a=Q[i],b=Q[i+1],Ln=Math.hypot(b[0]-a[0],b[1]-a[1]);if(Ln<.1)continue;const ux=(b[0]-a[0])/Ln,uz=(b[1]-a[1])/Ln;
        for(;next<=d0+Ln;next+=13){j++;const t=next-d0,x=a[0]+ux*t,z=a[1]+uz*t,sd=j&1?1:-1,nx=-uz*sd,nz=ux*sd,o=r.w/2+.9,bx=x+nx*o,bz=z+nz*o;
          if(!parks.some(p=>pip(bx,bz,p))||world.inBuilding(bx,bz))continue;
          if(j%3===0){put('lamp',bx,bz,2.25,0,.13,4.5,.13);put('lampH',bx,bz,4.55,0,.42,.18,.42);addWall(bx-.1,bz,bx+.1,bz);}
          else if(j%3===1){bench(bx,bz,-nx,-nz);if(j%2)put('bin',bx+ux*1.4,bz+uz*1.4,.35,0,.4,.7,.4);}}
        d0+=Ln;}}
    for(const [la,lo] of FAC.benches){const [x,z]=LL(la,lo);bench(x,z,0,1);}
    for(const {sp,hoops,R} of world.facR){const hd=hdOf(R.vx,R.vz);
      if(sp==='basketball'||sp==='multi'){const per=hoops>=4?2:1;
        for(const e of[-1,1])for(let k=0;k<per;k++){const t=per===1?0:(k?.25:-.25)*R.W,b=R.L/2-.3,[px,pz]=R.at(e*b,t),[ax,az]=R.at(e*(b-.55),t),[qx,qz]=R.at(e*(b-1.1),t),[rx,rz]=R.at(e*(b-1.5),t);
          put('steel',px,pz,1.9,hd,.13,3.8,.13);put('steel',ax,az,3.5,hd,.08,.08,1.1);put('board',qx,qz,3.45,hd,1.8,1.05,.05);put('rim',rx,rz,3.05,hd,.45,.03,.45);addWall(px-.1,pz,px+.1,pz);}}
      else if(sp==='volleyball'||sp==='tennis'){const ten=sp==='tennis',w=R.W/2-(ten?.4:.2);
        for(const e of[-1,1]){const [x,z]=R.at(0,e*w);put('steel',x,z,ten?.55:1.3,hd,.09,ten?1.1:2.6,.09);addWall(x-.1,z,x+.1,z);}
        const [x,z]=R.at(0,0);put('net',x,z,ten?.55:2.05,hd,2*w,ten?.9:.9,.03);
        if(ten)for(const [u0,v0,u1,v1] of[[-1,-1,1,-1],[1,-1,1,1],[1,1,-1,1],[-1,1,-1,-1]]){const a=R.at(u0*R.L/2,v0*R.W/2),b=R.at(u1*R.L/2,v1*R.W/2),n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/3.5));
          for(let i=0;i<n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;put('fence',x,z,1.6,0,.07,3.2,.07);}
          const m=[(a[0]+b[0])/2,(a[1]+b[1])/2];put('fence',m[0],m[1],3.2,hdOf(b[0]-a[0],b[1]-a[1]),Math.hypot(b[0]-a[0],b[1]-a[1]),.05,.05);addWall(a[0],a[1],b[0],b[1]);}}
      else if(sp==='soccer'&&R.L<70){const gw=Math.min(5,R.W*.2);for(const e of[-1,1]){for(const s of[-1,1]){const [x,z]=R.at(e*(R.L/2-.7),s*gw/2);put('goal',x,z,1,hd,.1,2,.1);addWall(x-.1,z,x+.1,z);}
        const [x,z]=R.at(e*(R.L/2-.7),0);put('goal',x,z,2,hd,gw,.1,.1);}}}
    let mc=[0,0];const ms=FAC.masts.map(q=>LL(...q));for(const q of ms){mc[0]+=q[0]/ms.length;mc[1]+=q[1]/ms.length;}
    for(const [x,z] of ms){const hd=Math.atan2(mc[0]-x,mc[1]-z);put('mast',x,z,13,hd,.45,26,.45);put('mast',x,z,26.4,hd,3.2,1.8,.35);addWall(x-.3,z,x+.3,z);}
    for(const g of FAC.bleachers){const R=facRect(g.map(q=>LL(...q))),f=Math.sign((mc[0]-R.cx)*R.vx+(mc[1]-R.cz)*R.vz)||1,hd=hdOf(R.ux,R.uz);
      for(let k=0;k<4;k++){const [x,z]=R.at(0,f*(R.W/2-(k+.5)*R.W/4)),y=.45*(k+1);put('stand',x,z,y/2,hd,R.L,y,R.W/4);}
      const c=[R.at(-R.L/2,-R.W/2),R.at(R.L/2,-R.W/2),R.at(R.L/2,R.W/2),R.at(-R.L/2,R.W/2)];for(let i=0;i<4;i++)addWall(...c[i],...c[(i+1)%4]);}
    const lotCars=[];let n=0;
    for(const R of world.lots){for(const e of R.rows)for(let s=-R.L/2+1.85;s<=R.L/2-1.2;s+=2.5){
      const hs=hash(R.cx*.13+s*1.7+e*5.1);if(hs>.32)continue;const [x,z]=R.at(s,e*(R.W/2-2.5)),fl=hs<.16?1:-1,k=Math.floor(hash(n*3.3+.9)*LOT_GEOS.length);
      lotCars.push([x,GY(x,z),z,Math.atan2(R.vx*fl*e,R.vz*fl*e),CAR_COLORS[Math.floor(hash(n*7.7+.5)*CAR_COLORS.length)],k]);n++;
      const q=[[-2.2,-.9],[2.2,-.9],[2.2,.9],[-2.2,.9]].map(([a,b])=>[x+R.vx*a+R.ux*b,z+R.vz*a+R.uz*b]);for(let i=0;i<4;i++)addWall(...q[i],...q[(i+1)%4]);}}
    addParkedCars(lotCars);
    const C={seat:0x7a5a3c,iron:0x2f3236,bin:0x2e4636,lamp:0x3a3f42,lampH:0x2a2d30,steel:0x8a8f93,board:0xe9ebea,rim:0xd2551e,net:0x2c2f31,fence:0x3d5a48,goal:0xf2f2f0,mast:0xb8bcbf,stand:0xa7a7a2};
    for(const k in L)instances(unit,C[k],L[k]);
   }
""")
# town hall: three storeys with a row of front gables, the four-storey stair block to the west, as in the photos
rep("c2159:{wall:[.66,.66,.65],roof:[.40,.40,.40],sty:STY.plaster}}", "c2159:{wall:[.66,.66,.65],roof:[.40,.40,.40],sty:STY.plaster,h:11,wing:[4,5,6,7,[3,4,.42]],wingH:15,gables:[7,8,5],gableRoof:[.42,.27,.21]}}")
rep("cx0/=pts.length;cz0/=pts.length;\n", """cx0/=pts.length;cz0/=pts.length;
      if(s.wing){addBuilding(BLD,s.wing.map(i=>i.length?[pts[i[0]][0]+(pts[i[1]][0]-pts[i[0]][0])*i[2],pts[i[0]][1]+(pts[i[1]][1]-pts[i[0]][1])*i[2]]:pts[i]),{h:s.wingH,y0:s.y0,yb:s.yb,wall:s.wall,roof:s.roof,pitched:false,sty:s.sty});top=Math.max(top,s.y0+s.wingH);}
      if(s.gables){const [i0,i1,n]=s.gables,a=pts[i0],b=pts[i1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L,w=L/n;
        let nx=-uz,nz=ux;if((a[0]-cx0)*nx+(a[1]-cz0)*nz<0){nx=-nx;nz=-nz;}const y=s.y0+s.h;
        for(let k=0;k<n;k++){const m=(k+.5)*w,f0=[a[0]+ux*(m-w*.38),a[1]+uz*(m-w*.38)],f1=[a[0]+ux*(m+w*.38),a[1]+uz*(m+w*.38)];
          addBuilding(BLD,[f0,f1,[f1[0]-nx*6.5,f1[1]-nz*6.5],[f0[0]-nx*6.5,f0[1]-nz*6.5]],{h:.02,y0:y,yb:y-.02,wall:s.wall,roof:s.gableRoof||s.roof,pitched:true,rh:2.8});}
        top=Math.max(top,y+2.8);}
""")

# the church yard wall (OSM 188076529, 1435091257): low white plaster between red brick pillars, as in the photos
rep("for(const bz of barriers)boundary(bz.pts,", """const chc=P([55.3786,23.1228]);W.pillars=[];
    for(const bz of barriers){if(bz.type==='wall'&&Math.hypot(bz.pts[0][0]-chc[0],bz.pts[0][1]-chc[1])<120){
      for(let i=0;i<bz.pts.length-1;i++){const a=bz.pts[i],b=bz.pts[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<.01)continue;hedge(WL,a,b,1.25,[.88,.87,.83]);
        const n=Math.max(1,Math.round(L/5));for(let k=0;k<=n;k++)W.pillars.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}continue;}
      boundary(bz.pts,""")
rep("bz.pts[0][0]+bz.pts[0][1]);\n    const tex=", "bz.pts[0][0]+bz.pts[0][1]);}\n    const tex=")
rep("    for(const k in L)instances(unit,C[k],L[k]);\n", "    for(const [x,z] of world.pillars||[]){put('brick',x,z,.95,0,.62,1.9,.62);put('cap',x,z,1.95,0,.72,.12,.72);}\n    for(const k in L)instances(unit,C[k],L[k]);\n")
rep("mast:0xb8bcbf,stand:0xa7a7a2};", "mast:0xb8bcbf,stand:0xa7a7a2,carL:0x1d1f21,brick:0x8a3e2e,cap:0xd9d7d0};")
# town hall: flat entrance canopy in the corner between the gabled front and the south-east block
rep("gables:[7,8,5],", "gables:[7,8,5],canopy:[5,6,0,1,4.5],")
rep("        top=Math.max(top,y+2.8);}\n", """        top=Math.max(top,y+2.8);}
      if(s.canopy){const [i0,i1,t0,t1,d]=s.canopy,a=pts[i0],b=pts[i1],q=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],L=Math.hypot(b[0]-a[0],b[1]-a[1]);
        let nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L;if((a[0]-cx0)*nx+(a[1]-cz0)*nz<0){nx=-nx;nz=-nz;}const p0=q(t0),p1=q(t1),y=s.y0+3.3;
        const f0=[p0[0]+nx*d,p0[1]+nz*d],f1=[p1[0]+nx*d,p1[1]+nz*d];addBuilding(BLD,[p0,p1,f1,f0],{h:.5,y0:y,yb:y,wall:[.62,.63,.63],roof:[.55,.55,.55],pitched:false});
        const e=d-1.2;addBuilding(BLD,[p0,p1,[p1[0]+nx*e,p1[1]+nz*e],[p0[0]+nx*e,p0[1]+nz*e]],{h:3.3,y0:s.y0,yb:s.yb,wall:[.6,.61,.61],roof:[.55,.55,.55],pitched:false,sty:s.sty});}
""")

# bus stops from OSM: glass shelter (unless shelter=no or at the bus station) and the blue stop sign, beside the nearest road
rep("    for(const k in L)instances(unit,C[k],L[k]);\n", """    for(const [la,lo,sh,name] of FAC.stops){const [x,z]=LL(la,lo);let best=625,hit=null;
      for(const e of world.edges){const A=world.graph.get(e.a),B=world.graph.get(e.b);if(!A||!B)continue;const dx=B.x-A.x,dz=B.z-A.z,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-A.x)*dx+(z-A.z)*dz)/l2)),px=A.x+dx*t,pz=A.z+dz*t,d=(px-x)**2+(pz-z)**2;
        if(d<best){best=d;const l=Math.sqrt(l2);hit={px,pz,ux:dx/l,uz:dz/l,w:e.w||7};}}
      if(!hit)continue;let nx=-hit.uz,nz=hit.ux;if((x-hit.px)*nx+(z-hit.pz)*nz<0){nx=-nx;nz=-nz;}
      const o=hit.w/2+2.9,cx=hit.px+nx*o,cz=hit.pz+nz*o,hd=hdOf(hit.ux,hit.uz),at=(a,b)=>[cx+hit.ux*a+nx*b,cz+hit.uz*a+nz*b];
      if(world.inBuilding(cx,cz))continue;
      const [sx,sz]=at(-2.6,-.6);put('lamp',sx,sz,1.3,hd,.07,2.6,.07);put('sign',...at(-2.6,-.62),2.4,hd,.5,.5,.03);addWall(sx-.1,sz,sx+.1,sz);
      if(sh===0||/stotis|AS$/.test(name))continue;
      put('roofS',cx,cz,2.45,hd,3.7,.09,1.7);put('glass',...at(0,.72),1.3,hd,3.5,2.1,.04);for(const a of[-1.75,1.75]){put('glass',...at(a,.1),1.3,hd,.04,2.1,1.2);put('frame',...at(a,.75),1.2,hd,.07,2.4,.07);put('frame',...at(a,-.7),1.2,hd,.07,2.4,.07);}
      put('frame',...at(0,.45),.45,hd,1.8,.06,.38);
      const k=[at(-1.75,-.5),at(-1.75,.75),at(1.75,.75),at(1.75,-.5)];for(let i=0;i<3;i++)addWall(...k[i],...k[i+1]);}
    for(const k in L){const m=instances(unit,C[k],L[k]);if(k==='glass'){m.material.transparent=true;m.material.opacity=.35;m.material.depthWrite=false;m.castShadow=false;}}
""")
rep("brick:0x8a3e2e,cap:0xd9d7d0};", "brick:0x8a3e2e,cap:0xd9d7d0,sign:0x1f5fae,roofS:0x4a4f53,glass:0x9db4bb,frame:0x5d6266};")

# traffic and parked cars: saloon and estate (Passat-like), compact MPV (Zafira-like), hatchback (Golf-like) and a
# crossover, all lofted by the same builder as the player's car but with their own roof lines and no badge;
# the player's car keeps carGeo
import re
a = h.index('const carGeo=(()=>{'); b = h.index('})();\n', a) + 6
base = h[a:b]
def variant(name, upper, side, glass, lift=0):
    g = base.replace('const carGeo=', 'const %s=' % name, 1)
    g, n = re.subn(r"const UPPER=\[.*?\];", "const UPPER=%s;" % upper, g, count=1); assert n == 1
    for old, new in [("side=z<.65&&z>-1.3,pillar=(z<-.12&&z>-.2)||(z<-.95&&z>-1.02);", side),
                     ("return z>.38||z<-.72?[trim,GLASS]:[paint,PAINT];", glass),
                     ("for(let i=-1.5;i<2;i++){ring(i*.068,.617,2.214,.046,CHROME);ring(i*.068,.942,-2.208,.044,CHROME);}", "")]:
        assert g.count(old) == 1, old; g = g.replace(old, new)
    if lift:
        m = re.search(r"const LOWER=(\[.*?\]);", g)
        L = [[r[0], r[1], r[2], round(r[3] + lift, 3), round(r[4] + lift, 3)] for r in eval(m.group(1))]
        g = g.replace(m.group(0), "const LOWER=%s;" % L, 1)
    return g + g.replace('const %s=' % name, 'const %s=' % name.replace('Geo', 'LotGeo'), 1).replace('const n=20,col=i=>', 'const n=6,col=i=>', 1)
V = [variant('saloonGeo', "[[1.06,0],[.88,1.03],[.68,1.18],[.5,1.3],[.3,1.39],[.1,1.44],[-.25,1.46],[-.6,1.45],[-.82,1.41],[-1.0,1.34],[-1.18,1.25],[-1.36,1.15],[-1.5,1.08],[-1.62,0]]",
             "side=z<.66&&z>-1.08,pillar=(z<-.14&&z>-.22);", "return z>.36||z<-.86?[trim,GLASS]:[paint,PAINT];"),
     variant('estateGeo', "[[1.06,0],[.88,1.03],[.68,1.18],[.5,1.3],[.3,1.39],[.1,1.44],[-.3,1.46],[-.9,1.455],[-1.4,1.44],[-1.7,1.42],[-1.88,1.39],[-1.98,1.32],[-2.04,1.2],[-2.08,0]]",
             "side=z<.66&&z>-1.9,pillar=(z<-.14&&z>-.22)||(z<-1.12&&z>-1.2);", "return z>.36||z<-1.95?[trim,GLASS]:[paint,PAINT];"),
     variant('mpvGeo', "[[1.38,0],[1.22,1.02],[1.0,1.22],[.78,1.4],[.55,1.53],[.3,1.6],[0,1.63],[-.6,1.63],[-1.2,1.62],[-1.65,1.6],[-1.9,1.56],[-2.02,1.45],[-2.08,1.25],[-2.1,0]]",
             "side=z<1.0&&z>-1.95,pillar=(z<-.05&&z>-.13)||(z<-1.0&&z>-1.08);", "return z>.5||z<-1.95?[trim,GLASS]:[paint,PAINT];"),
     variant('hatchGeo', "[[1.0,0],[.85,1.03],[.66,1.18],[.46,1.32],[.26,1.42],[.02,1.47],[-.5,1.48],[-1.0,1.46],[-1.35,1.42],[-1.6,1.33],[-1.78,1.18],[-1.88,1.05],[-1.93,0]]",
             "side=z<.62&&z>-1.3,pillar=(z<-.12&&z>-.2);", "return z>.32||z<-1.6?[trim,GLASS]:[paint,PAINT];"),
     variant('suvGeo', "[[1.1,0],[.92,1.17],[.72,1.32],[.52,1.45],[.3,1.54],[.08,1.59],[-.3,1.61],[-.9,1.6],[-1.4,1.59],[-1.7,1.56],[-1.88,1.52],[-1.98,1.44],[-2.04,1.32],[-2.08,0]]",
             "side=z<.7&&z>-1.88,pillar=(z<-.14&&z>-.22)||(z<-1.12&&z>-1.2);", "return z>.4||z<-1.94?[trim,GLASS]:[paint,PAINT];", lift=.14)]
rep("function makeCarMesh(color,G=carGeo){", "".join(V) + "const TRAFFIC_GEOS=[saloonGeo,estateGeo,estateGeo,mpvGeo,hatchGeo,hatchGeo,suvGeo],LOT_GEOS=[saloonLotGeo,estateLotGeo,estateLotGeo,mpvLotGeo,hatchLotGeo,hatchLotGeo,suvLotGeo];\nfunction makeCarMesh(color,G=carGeo){")
rep("const c=newCar(A.x,A.z,0,CAR_COLORS[Math.floor(rnd()*CAR_COLORS.length)]);", "const c=newCar(A.x,A.z,0,CAR_COLORS[Math.floor(rnd()*CAR_COLORS.length)],TRAFFIC_GEOS[Math.floor(rnd()*TRAFFIC_GEOS.length)]);")
rep("newCar(x,z,Math.atan2(dx,dz)+(side<0?Math.PI:0),CAR_COLORS[Math.floor(rnd()*CAR_COLORS.length)]);made++;", "newCar(x,z,Math.atan2(dx,dz)+(side<0?Math.PI:0),CAR_COLORS[Math.floor(rnd()*CAR_COLORS.length)],TRAFFIC_GEOS[Math.floor(rnd()*TRAFFIC_GEOS.length)]);made++;")
rep("newCar(c[0],c[1],c[2],CAR_COLORS[c[3]]);", "newCar(c[0],c[1],c[2],CAR_COLORS[c[3]],TRAFFIC_GEOS[c[3]%TRAFFIC_GEOS.length]);")

# Maxima X (photos 2025-26): sand-lime brick store behind a taller light grey corrugated block along the street side,
# a low white sheet annex in front; the brick building to the east is flat-roofed sand-lime brick
rep("c2159:{", "c3293:{wall:[.7,.66,.58],roof:[.42,.42,.42],sty:-1,windows:false,pitched:false,hip:false,skel:null,tops:null,h:7.2,wing:[0,1,2,[5,0,.6]],wingH:9,wingWall:[.78,.8,.81],wingSty:STY.sheet},"
    "c3246:{wall:[.88,.89,.88],roof:[.6,.6,.6],sty:STY.sheet,windows:false,pitched:false,hip:false,skel:null,tops:null,h:3.6},"
    "c3235:{wall:[.72,.67,.57],sty:STY.brick,pitched:false,hip:false,skel:null,tops:null},c2159:{")
rep("{h:s.wingH,y0:s.y0,yb:s.yb,wall:s.wall,roof:s.roof,pitched:false,sty:s.sty}", "{h:s.wingH,y0:s.y0,yb:s.yb,wall:s.wingWall||s.wall,roof:s.roof,pitched:false,sty:s.wingSty!=null?s.wingSty:s.sty}")

# Žemaičio aikštė is a paved square: concrete pavers with four lawns cut back round the monument and the cross paths;
# Raseinių I-III and the other ponds are OSM multipolygons the base loader skips, so they were grass
rep("function addWall(x0,z0,x1,z1){", """function sqLayout(P){const f=FAC.parks.find(q=>q[0]==='Žemaičio aikštė');if(!f)return null;const p=f[1].map(q=>P(q)),R=facRect(p),m=P([55.38119,23.11704]),
    mu=(m[0]-R.cx)*R.ux+(m[1]-R.cz)*R.uz,mv=(m[0]-R.cx)*R.vx+(m[1]-R.cz)*R.vz,lawns=[];
  for(const su of[-1,1])for(const sv of[-1,1])for(let k=1;k>.4;k-=.1){const u0=mu+su*3.5,u1=u0+(su*R.L/2-u0-su*4)*k,v0=mv+sv*3.5,v1=v0+(sv*R.W/2-v0-sv*4)*k;
    if((u1-u0)*su<6||(v1-v0)*sv<6)break;const poly=[[u0+su*8,v0],[u1,v0],[u1,v1],[u0,v1],[u0,v0+sv*8]].map(([u,v])=>R.at(u,v));
    if(poly.every(q=>pip(q[0],q[1],p))){lawns.push(poly);break;}}
  return{p,lawns};}
function addWall(x0,z0,x1,z1){""")
rep("    W.lots=[];W.facR=[];", """    {const S=sqLayout(P);if(S){flatPoly(RD,S.p,.052,[.6,.56,.53]);for(const l of S.lawns)flatPoly(RD,l,.056,[.38,.52,.3]);}}
    W.ponds=[];for(const [o,hs] of FAC.water){const p=o.map(q=>P(q));if(!p.some(q=>inBox(q[0],q[1],0)))continue;const H=hs.map(r=>r.map(q=>P(q))),all=[...p,...H.flat()];
      try{for(const t of THREE.ShapeUtils.triangulateShape(p.map(q=>new THREE.Vector2(q[0],q[1])),H.map(r=>r.map(q=>new THREE.Vector2(q[0],q[1])))))dTri(WA,all[t[0]],all[t[1]],all[t[2]],.035,[.09,.16,.17],0);}catch(e){}
      ribbon(GR,[...p,p[0]],3.5,.026,[.27,.30,.19]);mm.water.push(p);W.ponds.push({p,H});}
    W.lots=[];W.facR=[];""")
rep("  if(trees.length){\n    // chunked", """  {const pb=FAC.pitches.map(f=>{const q=f[3].map(v=>P(v));return[q,Math.min(...q.map(v=>v[0]))-6,Math.max(...q.map(v=>v[0]))+6,Math.min(...q.map(v=>v[1]))-6,Math.max(...q.map(v=>v[1]))+6];});
    for(let i=trees.length;i--;){const t=trees[i];if(pb.some(([q,a,b,c,d])=>t[0]>a&&t[0]<b&&t[1]>c&&t[1]<d&&(pip(t[0],t[1],q)||q.some((v,k)=>{const w=q[(k+1)%q.length],dx=w[0]-v[0],dz=w[1]-v[1],u=Math.max(0,Math.min(1,((t[0]-v[0])*dx+(t[1]-v[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(t[0]-v[0]-dx*u,t[1]-v[1]-dz*u)<t[3]+1;}))))trees.splice(i,1);}}
  {const S=sqLayout(P),inPond=(x,z)=>W.ponds.some(o=>pip(x,z,o.p)&&!o.H.some(r=>pip(x,z,r)));
    for(let i=trees.length;i--;){const [x,z]=trees[i];if(inPond(x,z)||(S&&pip(x,z,S.p)&&!S.lawns.some(l=>pip(x,z,l))))trees.splice(i,1);}}
  if(trees.length){
    // chunked""")

# people walked through hedges, fences and street furniture: they now keep to a line just off the road edge, and hedges,
# fences and yard walls are solid (for cars too); walls, posts and trunks push people out
rep("        if(style==='picket')quad(FP,a,b,0,1.25,c,nx,nz,u,u+L);", "        (W.hedgeSegs||(W.hedgeSegs=[])).push([a[0],a[1],b[0],b[1]]);\n        if(style==='picket')quad(FP,a,b,0,1.25,c,nx,nz,u,u+L);")
rep("hedge(WL,a,b,1.25,[.88,.87,.83]);", "hedge(WL,a,b,1.25,[.88,.87,.83]);(W.hedgeSegs||(W.hedgeSegs=[])).push([a[0],a[1],b[0],b[1]]);")
rep("    for(const [x,z] of world.pillars||[]){", "    for(const q of world.hedgeSegs||[])addWall(...q);\n    for(const [x,z] of world.pillars||[]){")
rep("let off=p.e.w/2+1.5+(p.lane||0),", "let off=p.e.w/2+.9+(p.lane||0)*.4,")
rep("  if(p.mode==='hide')return;\n  dodge(p,M);", "  if(p.mode==='hide')return;\n  pedPush(p);\n  dodge(p,M);")
rep("function stepPed(p,dt,M){", """function pedPush(p){if(p.mode==='down'||p.mode==='stop')return;let x=p.x,z=p.z;const r=.32,ci=Math.floor(x/8),cj=Math.floor(z/8);
  for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++){const l=walls.get(i+','+j);
    if(l)for(const s of l){const dx=s[2]-s[0],dz=s[3]-s[1],t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1),0,1),ex=x-s[0]-dx*t,ez=z-s[1]-dz*t,d=Math.hypot(ex,ez);if(d<r&&d>1e-5){x+=ex/d*(r-d);z+=ez/d*(r-d);}}
    const q=props.get(i+','+j);if(q)for(const o of q){if(o.down)continue;const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz),m=r+(o.r||.2);if(d<m&&d>1e-5){x=o.x+dx/d*m;z=o.z+dz/d*m;}}}
  p.x=x;p.z=z;}
function stepPed(p,dt,M){""")

# fuel stations (photos 2026): Žerminalis is now a Naftrus: navy canopy with a yellow top line on white pillars, dark grey
# shop and car wash; Baltic Petroleum across the road: white canopy with a blue fascia, white shop, white car-wash box and
# dark grey sheds. OSM maps the canopies as building=roof, so they were solid blocks; now a slab on pillars over pumps,
# open for cars. The bus station's platform roof is drawn the same way, over a paved apron.
rep("c3293:{", "c5689:{roofOnly:1,wall:[.12,.17,.36],roof:[.86,.86,.86],stripe:[.95,.78,.12]},c5255:{wall:[.27,.29,.32],roof:[.4,.4,.4],sty:STY.sheet,windows:false,pitched:false,hip:false,skel:null,tops:null,h:4.8},"
    "c5688:{roofOnly:1,wall:[.1,.3,.64],roof:[.92,.92,.92],stripe:[.95,.95,.95]},c251:{wall:[.92,.93,.93],roof:[.6,.6,.6],sty:-1,windows:false,pitched:false,hip:false,skel:null,tops:null,h:4.2},"
    "c250:{wall:[.93,.94,.94],roof:[.6,.6,.6],sty:STY.sheet,windows:false,pitched:false,hip:false,skel:null,tops:null,h:5.5},c7969:{wall:[.24,.27,.31],roof:[.3,.3,.3],sty:STY.sheet,windows:false,pitched:false,hip:false,skel:null,tops:null},"
    "c7167:{roofOnly:1,pumps:0,wall:[.55,.57,.58],roof:[.6,.6,.6]},c3293:{")
rep("        top=Math.max(top,addBuilding(BLD,pp,sp));", """        if(sp.roofOnly){const y=sp.y0+4.6,C=pp.reduce((a,q)=>[a[0]+q[0]/pp.length,a[1]+q[1]/pp.length],[0,0]),sq=(c,r,h,y0,col)=>addBuilding(BLD,[[c[0]-r,c[1]-r],[c[0]+r,c[1]-r],[c[0]+r,c[1]+r],[c[0]-r,c[1]+r]],{h,y0,yb:y0,wall:col,roof:col,pitched:false});
          addBuilding(BLD,pp,{h:.75,y0:y,yb:y,wall:sp.wall,roof:sp.roof,pitched:false});if(sp.pumps!==0)flatPoly(RD,pp.map(q=>{const dx=q[0]-C[0],dz=q[1]-C[1],l=Math.hypot(dx,dz)||1;return[q[0]+dx/l*12,q[1]+dz/l*12];}),.045,ROADCOL[1]);if(sp.stripe)addBuilding(BLD,pp,{h:.1,y0:y+.75,yb:y+.75,wall:sp.stripe,roof:sp.roof,pitched:false});
          for(const q of pp){const c=[C[0]+(q[0]-C[0])*.55,C[1]+(q[1]-C[1])*.55];sq(c,.28,4.6,sp.y0,[.93,.93,.92]);if(sp.pumps!==0){const d=[c[0]+(C[0]-c[0])*.25,c[1]+(C[1]-c[1])*.25];sq(d,.4,1.7,sp.y0,[.82,.84,.86]);}}
          top=Math.max(top,y+.85);}
        else top=Math.max(top,addBuilding(BLD,pp,sp));""")
rep("        addTo(segGrid,CELL,Math.min(p[0],q[0])-2,Math.min(p[1],q[1])-2,Math.max(p[0],q[0])+2,Math.max(p[1],q[1])+2,[p[0],p[1],q[0],q[1]]);",
    "        if(!s.roofOnly)addTo(segGrid,CELL,Math.min(p[0],q[0])-2,Math.min(p[1],q[1])-2,Math.max(p[0],q[0])+2,Math.max(p[1],q[1])+2,[p[0],p[1],q[0],q[1]]);")

# Raseinių kapinės and Tarybinių karių kapinės: rows of graves (granite stones, concrete kerbs, some crosses) between paths,
# trees through the whole ground, and a black metal fence between white pillars along the edge (photos 2026),
# open where roads and paths come in. The gimnazija stadium: a red track round a lined grass pitch with goals.
rep("    W.lots=[];W.facR=[];", """    W.cem=FAC.cem.map(g=>g.map(q=>P(q)));for(const p of W.cem)flatPoly(GR,p,.024,[.33,.42,.28]);
    for(const g of FAC.aprons){const p=g.map(q=>P(q));flatPoly(RD,p,.044,ROADCOL[1]);}
    W.stadia=[];for(const g of FAC.stadia){const p=g.map(q=>P(q)),R=facRect(p);
      const hl=R.L/2-15,hw=R.W/2-7.5,c=[R.at(-hl,-hw),R.at(hl,-hw),R.at(hl,hw),R.at(-hl,hw)],all=[...p,...c];flatPoly(RD,c,.06,[.36,.53,.3]);
      try{for(const t of THREE.ShapeUtils.triangulateShape(p.map(q=>new THREE.Vector2(q[0],q[1])),[c.map(q=>new THREE.Vector2(q[0],q[1]))]))dTri(RD,all[t[0]],all[t[1]],all[t[2]],.06,[.55,.3,.25],0);}catch(e){}
      ribbon(MK,[...c,c[0]],.1,.085,[.9,.9,.88]);ribbon(MK,[R.at(0,-hw),R.at(0,hw)],.1,.085,[.9,.9,.88]);
      for(let i=1;i<6;i++){const o=hw+.3+i*1.2;ribbon(MK,[R.at(-hl,-o),R.at(hl,-o)],.06,.06,[.9,.88,.85]);ribbon(MK,[R.at(-hl,o),R.at(hl,o)],.06,.06,[.9,.88,.85]);}
      W.stadia.push({R,hl});}
    W.lots=[];W.facR=[];""")
rep("  {const S=sqLayout(P),inPond=", """  for(const p of W.cem){let mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9;for(const q of p){mnx=Math.min(mnx,q[0]);mxx=Math.max(mxx,q[0]);mnz=Math.min(mnz,q[1]);mxz=Math.max(mxz,q[1]);}
    const near=trees.filter(t=>t[0]>mnx-10&&t[0]<mxx+10&&t[1]>mnz-10&&t[1]<mxz+10);
    for(let i=0;i<4000;i++){const x=mnx+hash(i*2.3+.17)*(mxx-mnx),z=mnz+hash(i*5.9+.41)*(mxz-mnz);
      if(!pip(x,z,p)||W.inBuilding(x,z)||near.some(t=>Math.hypot(t[0]-x,t[1]-z)<13))continue;const s=.9+hash(i*3.7)*.6,t=[x,z,14*s,3.6*s,hash(i*1.3+.5)<.3];trees.push(t);near.push(t);}}
  {const S=sqLayout(P),inPond=""")
rep("    const tex=(draw)=>{", """    W.cemPillars=[];for(const p of W.cem)for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<.5)continue;const n=Math.max(1,Math.round(L/3.5)),nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L;
      for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n,c=[a[0]+(b[0]-a[0])*(t0+t1)/2,a[1]+(b[1]-a[1])*(t0+t1)/2];
        if(roadsAll.some(r=>{for(let j=0;j<r.pts.length-1;j++){const u=r.pts[j],v=r.pts[j+1],dx=v[0]-u[0],dz=v[1]-u[1],t=Math.max(0,Math.min(1,((c[0]-u[0])*dx+(c[1]-u[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(c[0]-u[0]-dx*t,c[1]-u[1]-dz*t)<r.w/2+1.2)return true;}return false;}))continue;
        const q0=[a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0],q1=[a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1];
        quad(FP,q0,q1,.15,1.5,[.13,.13,.14],nx,nz,0,L/n);W.cemPillars.push(q0,q1);(W.hedgeSegs||(W.hedgeSegs=[])).push([q0[0],q0[1],q1[0],q1[1]]);}}
    const tex=(draw)=>{""")
rep("    for(const [x,z] of world.pillars||[]){", """    for(const [x,z] of world.cemPillars||[])put('cemP',x,z,.85,0,.42,1.7,.42);
    for(const p of world.cem||[]){const R=facRect(p),hd=hdOf(R.ux,R.uz),cols=['granB','granG','granR'];let n=0;
      for(let s=-R.L/2+3;s<R.L/2-3;s+=2.4){if(Math.abs(((s+R.L/2)%30))<3.2)continue;
        for(let t=-R.W/2+3,row=0;t<R.W/2-3;t+=3.4,row++){if(row%7===6)continue;const [x,z]=R.at(s,t);
          if(!pip(x,z,p)||world.inBuilding(x,z)||hash(x*.37+z*.71)<.12)continue;const h=hash(x*1.1+z*2.3),[bx,bz]=R.at(s,t-.7);
          put(cols[Math.floor(h*3)],x,z,.45,hd,.75,.9,.14);put('kerb',bx,bz,.08,hd,1.1,.16,1.8);
          if(h>.8){put('cross',bx,bz,.75,hd,.07,1.5,.07);put('cross',bx,bz,1.15,hd,.6,.07,.07);}n++;}}}
    for(const {R,hl} of world.stadia||[]){const hd=hdOf(R.vx,R.vz);for(const e of[-1,1]){for(const s of[-1,1]){const [x,z]=R.at(e*(hl+.3),s*3.66);put('goal',x,z,1.22,hd,.12,2.44,.12);addWall(x-.1,z,x+.1,z);}
      const [x,z]=R.at(e*(hl+.3),0);put('goal',x,z,2.44,hd,7.44,.12,.12);}}
    for(const [x,z] of world.pillars||[]){""")
rep("brick:0x8a3e2e,cap:0xd9d7d0,", "brick:0x8a3e2e,cap:0xd9d7d0,cemP:0xe6e3dc,granB:0x2a2b2e,granG:0x7a7b7d,granR:0x6b4b42,kerb:0xb7b4ac,cross:0x2b2d30,")
rep("function makeCarMesh(color,G=carGeo){", "// parked cars that never move: [x,groundY,z,heading,color,type?]. Heading as for moving cars (nose along sin h, cos h).\n// Within 120 m of the camera they get the full body (coarse arches, 8-sided wheels); further out a ~100-triangle\n// silhouette. The split is redone a few times a second; one registry, so later calls just add cars.\nconst PARKED={cars:[],meshes:[],t:null};\nconst parkedFar=(()=>{const parts=[],ext=(pts,w,col)=>{const g=new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([z,y])=>new THREE.Vector2(z,y))),{depth:w,bevelEnabled:false}).toNonIndexed();\n    g.rotateY(-Math.PI/2);g.translate(w/2,0,0);g.setAttribute('color',new THREE.Float32BufferAttribute(Array.from({length:g.attributes.position.count*3},(_,k)=>col[k%3]),3));parts.push(g);};\n  ext([[-2.2,.3],[2.22,.3],[2.25,.6],[2.12,.82],[.95,.92],[-1.95,1.0],[-2.2,.9]],1.74,[1,1,1]);\n  ext([[.95,.9],[.35,1.38],[-1.55,1.42],[-1.98,.98]],1.48,[.16,.18,.2]);\n  ext([[.4,1.38],[-1.5,1.42],[-1.5,1.47],[.35,1.43]],1.4,[1,1,1]);\n  for(const az of AXLES)for(const ax of[-.78,.78]){const w=new THREE.CylinderGeometry(WHEEL_R,WHEEL_R,.22,6).rotateZ(Math.PI/2).translate(ax,WHEEL_R,az).toNonIndexed();\n    w.setAttribute('color',new THREE.Float32BufferAttribute(new Array(w.attributes.position.count*3).fill(.06),3));parts.push(w);}\n  const pos=[],nor=[],col=[];for(const g of parts){pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);col.push(...g.attributes.color.array);}\n  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.userData.keep=true;return g;})();\nfunction addParkedCars(list){\n  if(PARKED.meshes.length&&!PARKED.meshes[0].parent){PARKED.cars=[];PARKED.meshes=[];}\n  for(const c of list)PARKED.cars.push({x:c[0],y:c[1],z:c[2],h:c[3],c:c[4],k:c[5]!=null?c[5]%LOT_GEOS.length:Math.floor(hash(c[0]*.71+c[2]*1.37)*LOT_GEOS.length)});\n  for(const m of PARKED.meshes){worldGroup.remove(m);if(!m.geometry.userData.keep)m.geometry.dispose();m.material.dispose();}PARKED.meshes=[];\n  const N=PARKED.cars.length;if(!N)return;\n  const wheel=new THREE.CylinderGeometry(WHEEL_R,WHEEL_R,.2,8).rotateZ(Math.PI/2);wheel.setAttribute('color',new THREE.Float32BufferAttribute(new Array(wheel.attributes.position.count*3).fill(.05),3));\n  const per=LOT_GEOS.map((G,k)=>{const n=PARKED.cars.filter(c=>c.k===k).length;if(!n)return null;\n    const pm=new THREE.InstancedMesh(G.paint,new THREE.MeshPhongMaterial({color:0xffffff,specular:0x383838,shininess:60}),n),tm=new THREE.InstancedMesh(G.trim,trimM.clone(),n),wm=new THREE.InstancedMesh(wheel,trimM.clone(),n*4);\n    pm.castShadow=!PHONE;for(const m of[pm,tm,wm]){m.count=0;m.frustumCulled=false;worldGroup.add(m);PARKED.meshes.push(m);}return{pm,tm,wm};});\n  const far=new THREE.InstancedMesh(parkedFar,new THREE.MeshLambertMaterial({vertexColors:true}),N);far.castShadow=!PHONE;far.frustumCulled=false;worldGroup.add(far);PARKED.meshes.push(far);\n  const M=new THREE.Matrix4(),Mw=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S1=new THREE.Vector3(1,1,1),col=new THREE.Color();\n  const split=()=>{const cx=camera.position.x,cz=camera.position.z;for(const p of per)if(p)p.pm.count=p.tm.count=p.wm.count=0;far.count=0;\n    for(const c of PARKED.cars){Q.setFromAxisAngle(Y_AXIS,c.h);M.compose(V.set(c.x,c.y,c.z),Q,S1);col.setHex(c.c);\n      const p=per[c.k];if(p&&(c.x-cx)**2+(c.z-cz)**2<14400){const i=p.pm.count++;p.tm.count++;p.pm.setMatrixAt(i,M);p.tm.setMatrixAt(i,M);p.pm.setColorAt(i,col);\n        let j=0;for(const az of AXLES)for(const ax of[-.74,.74]){Mw.makeRotationY(ax<0?Math.PI:0);Mw.setPosition(ax,WHEEL_R,az);p.wm.setMatrixAt(i*4+j++,M.clone().multiply(Mw));}p.wm.count=p.pm.count*4;}\n      else{const i=far.count++;far.setMatrixAt(i,M);far.setColorAt(i,col);}}\n    for(const m of PARKED.meshes){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}};\n  split();clearInterval(PARKED.t);PARKED.t=setInterval(()=>{if(PARKED.meshes.length&&PARKED.meshes[0].parent)split();},400);}\n" + "function makeCarMesh(color,G=carGeo){")

# people talk in small groups (speaker gestures and gets a speech bubble, listeners face them and nod), sit on benches,
# look at phones, and step aside a few metres before they meet. The player's car hits anyone inside its outline, and
# cars collide as five circles along their length (parked ones too) instead of one 2.7 m circle round the centre.
rep("const bench=(x,z,fx,fz)=>{const hd=hdOf(-fz,fx);", "const bench=(x,z,fx,fz)=>{(world.benches||(world.benches=[])).push([x,z,Math.atan2(fx,fz)]);const hd=hdOf(-fz,fx);")
rep("const CALM={walk:1,idle:1,wait:1,stop:1,cross:1,goto:1};", "const CALM={walk:1,idle:1,wait:1,stop:1,cross:1,goto:1,talk:1,sit:1};")
rep("stop:null,then:null});}", "stop:null,then:null,grp:null,pair:null,seat:null,avo:0,avoT:0,dly:null,chatT:5+Math.random()*30,pr:Math.random()});}")
rep("let off=p.e.w/2+.9+(p.lane||0)*.4,", "let off=p.e.w/2+.9+(p.lane||0)*.4+(p.avo||0),")
rep("if(p.mode==='down'||p.mode==='stop')return;let x=p.x", "if(p.mode==='down'||p.mode==='stop'||p.mode==='sit')return;let x=p.x")
rep("  resetPed(p);\n  if(bus&&Math.random()<.15){", "  resetPed(p);\n  if(Math.random()<.16&&placeSit(p,far))return true;\n  if(bus&&Math.random()<.15){")
rep("if(Math.random()<.25)addFollower(p);", "{const r=Math.random();if(r<.1)spawnTalk(p);else if(r<.35)addFollower(p);}")
rep("else if((p.idleT-=dt)<=0){p.mode='idle';p.timer=3+Math.random()*6;}", "else if((p.idleT-=dt)<=0)pedIdle(p);")
rep("}else if(p.mode==='goto'){", "}else if(p.mode==='goto'){\n    if(p.then==='sit'&&(p.timer-=dt)<=0){if(p.seat)p.seat.who=null;p.seat=null;pedRejoin(p);return;}")
rep("else if(p.then==='hide'){p.mode='hide';return;}else pedRejoin(p);}", "else if(p.then==='hide'){p.mode='hide';return;}else if(p.then==='sit'&&p.seat){p.mode='sit';p.timer=20+Math.random()*50;}else pedRejoin(p);}")
rep("}else if(p.mode==='stop'){", """}else if(p.mode==='talk'){
    const g=p.grp;if(!g)pedRejoin(p);else{const d=gotoStep(p,dt);if(d>.12){rate=5.4*p.sp;gait=.5;}else p.h=lerpAngle(p.h,Math.atan2(g.x-p.x,g.z-p.z),Math.min(1,dt*4));}
  }else if(p.mode==='sit'){
    const s=p.seat;if(!s)pedRejoin(p);else{p.x=s.x;p.z=s.z;p.h=s.h;if((p.timer-=dt)<=0){s.who=null;p.seat=null;p.x+=Math.sin(s.h)*.5;p.z+=Math.cos(s.h)*.5;pedRejoin(p);}}
  }else if(p.mode==='stop'){""")
rep("let ty=p.mode==='idle'||p.mode==='stop'?Math.sin(pedClock*.7+p.phase)*.8:0;", """let ty=p.mode==='idle'||p.mode==='stop'||p.mode==='sit'?Math.sin(pedClock*.7+p.phase)*.8:0;
  if(p.mode==='talk'&&p.grp){const m=p.grp.mem,s=m[p.grp.spk],L=s===p?m[(m.indexOf(p)+1)%m.length]:s;if(L&&L!==p)ty=clamp(wrapA(Math.atan2(L.x-p.x,L.z-p.z)-p.h),-1.1,1.1);}""")
# the player's car: hesitation before jumping aside, some freeze; the knock-down itself is runOver
rep("""    if(m.me&&Math.hypot(dx,dz)<2&&av>5){const c=m.me;
      p.mode='down';p.lead=null;p.timer=3.2;p.vx=Math.sin(c.h)*c.speed*.55;p.vz=Math.cos(c.h)*c.speed*.55;c.speed*=.82;
      shake=Math.max(shake,.35);hit(.3);addHeat(1);hurtCargo(.15);pedEvent(p.x,p.z,25,8);return;}
""", """    if(m.me&&Math.abs(al)<2.45&&Math.abs(lt)<1.2&&av>2.5){runOver(p);return;}
""")
rep("    if(al>-1-m.len&&al<7+av*.45+m.len&&Math.abs(lt)<m.w){\n", """    if(al>-1-m.len&&al<7+av*.45+m.len&&Math.abs(lt)<m.w){
      if(m.me){if(p.dly==null)p.dly=(p.nerv>0?.12:.3)+Math.random()*.45;if((p.dly-=pedDt)>0)return;p.dly=null;
        if(al<6&&Math.random()<.35){p.mode='cower';p.timer=1.4;p.lead=null;p.nerv=Math.max(p.nerv,8);return;}}
""")
rep("      p.nerv=Math.max(p.nerv,8);return;}\n  }\n}", "      p.nerv=Math.max(p.nerv,8);return;}\n  }\n  p.dly=null;\n}")
rep("pedClock+=dt;", "pedClock+=dt;pedDt=dt;")
rep("    if(p.mode!=='hide')stepPed(p,dt,M);", "    if(p.mode!=='hide'){stepPed(p,dt,M);if(p.mode!=='hide')runOver(p);}")
rep("  // nobody walks through anybody", "  tickGroups(dt);pedAvoid(dt);\n  // nobody walks through anybody")
rep("if(!CALM[b.mode]||a.lead===b||b.lead===a)continue;", "if(!CALM[b.mode]||a.lead===b||b.lead===a||a.mode==='sit'||b.mode==='sit')continue;")
rep("  peds.forEach((p,i)=>{if(p.mode==='hide')hidePed(i);else poseAt(i,p.look,p.x,p.z,p.h,p.fall,p.hop,p.phase,p.gait,p.mode==='cower',p.yaw);});",
    "  peds.forEach((p,i)=>{if(p.mode==='hide'){hidePed(i);pedPhone.setMatrixAt(i,ZERO_M);return;}const A=pedAct(p);\n    poseAt(i,p.look,p.x,p.z,p.h,p.fall,p.mode==='sit'?.5-.92*p.look.s:p.hop,p.phase,p.gait,p.mode==='cower',p.yaw,A);pedPhone.setMatrixAt(i,A&&A.phone?PM[8]:ZERO_M);});\n  pedPhone.instanceMatrix.needsUpdate=true;pedBubbles();")
rep("function poseAt(i,look,x,z,h,fall,lift,ph,gait,wave,yaw=0){", "function poseAt(i,look,x,z,h,fall,lift,ph,gait,wave,yaw=0,act=null){")
rep("  if(wave){ang[9]=-2.3;ang[10]=-.55-.4*Math.sin(ph*1.6);}", "  if(wave){ang[9]=-2.3;ang[10]=-.55-.4*Math.sin(ph*1.6);}\n  if(act)for(let k=0;k<19;k++)if(act[k]===act[k])ang[k]=act[k];")
rep("const pick=a=>a[Math.floor(Math.random()*a.length)];", "const pedPhone=new THREE.InstancedMesh(new THREE.BoxGeometry(.07,.14,.014).translate(0,-.07,.03),new THREE.MeshLambertMaterial({color:0x17191c}),PED_ALL);\npedPhone.frustumCulled=false;pedPhone.count=PED_N;for(let i=0;i<PED_ALL;i++)pedPhone.setMatrixAt(i,ZERO_M);scene.add(pedPhone);\nconst pick=a=>a[Math.floor(Math.random()*a.length)];")
rep("for(const o of world.cars){const dx=player.x-o.x,dz=player.z-o.z,d=Math.hypot(dx,dz);if(d<1.9&&d>.01){player.x=o.x+dx/d*1.9;player.z=o.z+dz/d*1.9;}}",
    "for(const o of[...world.cars,...parkedNear(player.x,player.z)]){const fx=Math.sin(o.h),fz=Math.cos(o.h),dx=player.x-o.x,dz=player.z-o.z,t=clamp(dx*fx+dz*fz,-1.35,1.35),qx=dx-fx*t,qz=dz-fz*t,d=Math.hypot(qx,qz);if(d<1.3&&d>.01){player.x+=qx/d*(1.3-d);player.z+=qz/d*(1.3-d);}}")
rep("if(o===c)continue;const dx=c.x-o.x,dz=c.z-o.z,d=Math.hypot(dx,dz);\n    if(d<2.7&&d>.01){const ov=2.7-d,nx=dx/d,nz=dz/d;",
    "if(o===c||(c.x-o.x)**2+(c.z-o.z)**2>49)continue;const K=carOverlap(c,o,1.8);\n    if(K){const ov=K.ov,nx=K.nx,nz=K.nz;")
rep("  const B=world.box;c.x=clamp(c.x,B.minX,B.maxX);c.z=clamp(c.z,B.minZ,B.maxZ);\n  syncCar(c);\n  tyreFX(c,dt);",
    """  for(const o of parkedNear(c.x,c.z)){const K=carOverlap(c,o,1.8);if(!K)continue;c.x+=K.nx*K.ov;c.z+=K.nz*K.ov;const sp=Math.abs(c.speed);
    if(sp>6){shake=Math.min(1,sp/30);hit(Math.min(.8,sp/34));hurtCargo(.06);hurtCar(c,.03+sp*.0025);crashFX(c,{nx:K.nx,nz:K.nz},sp);}c.speed*=sp>2?.55:.9;}
  const B=world.box;c.x=clamp(c.x,B.minX,B.maxX);c.z=clamp(c.z,B.minZ,B.maxZ);
  syncCar(c);
  tyreFX(c,dt);""")
rep("function updatePeople(dt){", r"""// a car is five circles along its length, so bumpers and corners touch rather than centres
const CAR_O=[-1.35,-.68,0,.68,1.35];
function carOverlap(a,b,R){let best=null;const fa=Math.sin(a.h),ga=Math.cos(a.h),fb=Math.sin(b.h),gb=Math.cos(b.h);
  for(const i of CAR_O)for(const j of CAR_O){const dx=a.x+fa*i-b.x-fb*j,dz=a.z+ga*i-b.z-gb*j,d2=dx*dx+dz*dz;if(d2>=R*R||d2<1e-6)continue;const d=Math.sqrt(d2);if(!best||R-d>best.ov)best={ov:R-d,nx:dx/d,nz:dz/d};}
  return best;}
function parkedNear(x,z){const P=PARKED;
  if(P.ga!==P.cars||P.gn!==P.cars.length){P.ga=P.cars;P.gn=P.cars.length;P.g=new Map();for(const o of P.cars){const k=Math.floor(o.x/16)+','+Math.floor(o.z/16);let l=P.g.get(k);if(!l)P.g.set(k,l=[]);l.push(o);}}
  const out=[],ci=Math.floor(x/16),cj=Math.floor(z/16);for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++){const l=P.g.get(i+','+j);if(l)out.push(...l);}return out;}
let pedDt=.016,pedGroups=[],SEATS=[],seatsOf=null;
// the player's car knocks down whoever is inside its outline, whatever they were doing
function runOver(p){if(player.mode!=='car'||p.mode==='down')return;const c=player.car,sp=Math.abs(c.speed);if(sp<2.5)return;
  const fx=Math.sin(c.h),fz=Math.cos(c.h),dx=p.x-c.x,dz=p.z-c.z,al=dx*fx+dz*fz,lt=dx*fz-dz*fx;if(Math.abs(al)>2.45||Math.abs(lt)>1.2)return;
  const sd=Math.sign(lt)||1;p.mode='down';p.lead=null;p.timer=3.2;p.vx=fx*c.speed*.55+fz*sd*sp*.15;p.vz=fz*c.speed*.55-fx*sd*sp*.15;c.speed*=.82;
  shake=Math.max(shake,.35);hit(.3);addHeat(1);hurtCargo(.15);pedEvent(p.x,p.z,25,8);}
// benches: two seats each, from world.benches [x,z,heading the sitter faces]
function pedSeats(){const B=world.benches||[];if(seatsOf!==B||SEATS.n!==B.length){seatsOf=B;SEATS=[];SEATS.n=B.length;
    for(const [x,z,h] of B)for(const k of[-.42,.42])SEATS.push({x:x+Math.cos(h)*k+Math.sin(h)*.06,z:z-Math.sin(h)*k+Math.cos(h)*.06,h,who:null});}return SEATS;}
const seatFree=s=>!s.who||s.who.seat!==s||(s.who.mode!=='sit'&&!(s.who.mode==='goto'&&s.who.then==='sit'));
function placeSit(p,far){const l=pedSeats().filter(s=>seatFree(s)&&far(s.x,s.z));if(!l.length)return false;const s=pick(l);
  p.seat=s;s.who=p;p.mode='sit';p.x=s.x;p.z=s.z;p.h=s.h;p.timer=25+Math.random()*60;return true;}
function pedIdle(p){const F=peds.filter(q=>q.lead===p&&q.mode==='walk');
  if(F.length&&Math.random()<.6){startTalk([p,...F],(p.x+F[0].x)/2,(p.z+F[0].z)/2);return;}
  if(!F.length&&Math.random()<.5){let s=null,bd=400;for(const q of pedSeats()){const d=(q.x-p.x)**2+(q.z-p.z)**2;if(d<bd&&seatFree(q)){bd=d;s=q;}}
    if(s){p.mode='goto';p.seat=s;s.who=p;p.tx=s.x+Math.sin(s.h)*.45;p.tz=s.z+Math.cos(s.h)*.45;p.then='sit';p.timer=14;return;}}
  p.mode='idle';p.timer=3+Math.random()*6;}
function startTalk(mem,cx,cz){const n=mem.length,r=[0,0,.55,.7,.8][n]||.85,a0=Math.random()*TAU,g={x:cx,z:cz,mem,spk:0,sw:.8+Math.random(),say:0,text:'',i:-1,end:120,script:pickTalk(mem,cx,cz)};
  mem.forEach((p,i)=>{const a=a0+i*TAU/n;let tx=cx+Math.cos(a)*r,tz=cz+Math.sin(a)*r;if(world.inBuilding(tx,tz)){tx=p.x;tz=p.z;}
    p.pair=p.lead;p.lead=null;p.mode='talk';p.grp=g;p.tx=tx;p.tz=tz;p.dest=null;p.chatT=60;});
  pedGroups.push(g);}
function spawnTalk(p){const mem=[p],n=Math.random()<.35?3:2;
  for(const q of peds){if(mem.length>=n)break;if(q.mode!=='hide'||q===p)continue;resetPed(q);Object.assign(q,{mode:'walk',e:p.e,t:p.t,dir:-p.dir,side:p.side,x:p.x,z:p.z});mem.push(q);}
  if(mem.length<2)return;startTalk(mem,p.x,p.z);for(const q of mem){q.x=q.tx;q.z=q.tz;q.h=Math.atan2(p.x-q.x,p.z-q.z);}}
function tickGroups(dt){
  for(let i=pedGroups.length;i--;){const g=pedGroups[i];g.mem=g.mem.filter(p=>p.mode==='talk'&&p.grp===g);g.end-=dt;g.say-=dt;
    if(g.mem.length<2||g.end<=0||g.i>=g.script.length){for(const p of g.mem){p.grp=null;pedRejoin(p);p.idleT=25+Math.random()*40;}
      for(const p of g.mem){if(p.pair&&p.pair.mode==='walk'&&p.mode==='walk')p.lead=p.pair;p.pair=null;}pedGroups.splice(i,1);continue;}
    if(g.spk>=g.mem.length)g.spk=0;
    if((g.sw-=dt)<=0&&++g.i<g.script.length){const [w,t]=g.script[g.i];g.spk=w%g.mem.length;g.text=t;g.say=1.2+t.length*.07;g.sw=g.say+.3+Math.random()*.5;}}}
// walkers predict who they will pass within 0.9 m in the next 3.5 s and drift to the free side of the pavement;
// two strangers walking towards each other sometimes stop to chat
function pedAvoid(dt){
  const dk=Math.exp(-dt*.8),ek=Math.min(1,dt*2.5);
  for(const p of peds){if(p.mode==='hide')continue;p.avoT=(p.avoT||0)*dk;p.avo=(p.avo||0)+(p.avoT-p.avo)*ek;p.chatT=(p.chatT||0)-dt;
    const mv=(p.mode==='walk'||p.mode==='goto'||p.mode==='cross')&&p.gait>0;p.wx=mv?Math.sin(p.h)*p.sp:0;p.wz=mv?Math.cos(p.h)*p.sp:0;}
  for(let i=0;i<PED_N;i++){const a=peds[i];if(a.mode==='hide'||!CALM[a.mode])continue;
    for(let j=i+1;j<PED_N;j++){const b=peds[j];if(b.mode==='hide'||!CALM[b.mode]||a.lead===b||b.lead===a)continue;
      const rx=b.x-a.x,rz=b.z-a.z,d2=rx*rx+rz*rz;if(d2>64)continue;
      if(d2<9&&a.mode==='walk'&&b.mode==='walk'&&!a.lead&&!b.lead&&a.chatT<=0&&b.chatT<=0&&Math.cos(a.h-b.h)<-.3){a.chatT=b.chatT=30;
        if(Math.random()<.4){startTalk([a,b,...peds.filter(q=>(q.lead===a||q.lead===b)&&q.mode==='walk')],(a.x+b.x)/2,(a.z+b.z)/2);continue;}}
      const vx=b.wx-a.wx,vz=b.wz-a.wz,v2=vx*vx+vz*vz;if(v2<.04)continue;
      const t=-(rx*vx+rz*vz)/v2;if(t<=0||t>3.5)continue;
      const mx=rx+vx*t,mz=rz+vz*t;if(mx*mx+mz*mz>.81)continue;
      sideStep(a,mx,mz);sideStep(b,-mx,-mz);}}}
function sideStep(p,mx,mz){if(p.mode!=='walk'||p.lead||!p.e)return;const G=world.graph,A=G.get(p.e.a),B=G.get(p.e.b);if(!A||!B)return;
  const L=Math.hypot(B.x-A.x,B.z-A.z)||1,nx=-(B.z-A.z)/L*p.side,nz=(B.x-A.x)/L*p.side,o=mx*nx+mz*nz;
  const s=Math.abs(o)>.08?-Math.sign(o):(Math.sign(-Math.cos(p.h)*nx+Math.sin(p.h)*nz)||1);
  p.avoT=clamp(s*.75,-.45-(p.lane||0)*.4,.9);}
// joint angles that replace the walk cycle: sitting, talking, phone. NaN keeps the walk cycle's angle.
const ACT=new Array(19);
function pedAct(p){
  const m=p.mode,t=pedClock+p.phase;let any=false;ACT.fill(NaN);ACT.phone=false;const set=(k,v)=>{ACT[k]=v;any=true;};
  if(m==='sit'){set(12,-1.5);set(15,-1.5);set(13,1.45);set(16,1.45);set(14,.05);set(17,.05);set(1,-.06);set(18,-1.35);set(6,-.3);set(7,-.9);set(9,-.3);set(10,-.9);}
  if(m==='talk'&&p.gait<.1&&p.grp){
    if(p.grp.mem[p.grp.spk]===p&&p.grp.say>0){set(9,-.35-.45*(.5+.5*Math.sin(t*2.3)));set(10,-1.1-.6*Math.sin(t*3.1+1));set(1,.05*Math.sin(t*1.3));
      if(Math.sin(t*.9)>.2){set(6,-.3-.35*(.5+.5*Math.sin(t*2.9+2)));set(7,-1-.55*Math.sin(t*3.7));}}
    else{const nod=Math.sin(t*.37)>.3?Math.max(0,Math.sin(t*2.2))*.16:0;set(3,nod);set(4,nod);set(5,nod);if(p.pr<.3){set(6,-.35);set(7,-1.35);set(9,-.35);set(10,-1.35);}}}
  if(!p.lead&&(m==='walk'&&p.pr<.14||(m==='stop'||m==='idle'||m==='wait'||m==='sit')&&p.pr<.45)){set(6,-.45);set(7,-1.5);set(8,.2);set(3,.4);set(4,.4);set(5,.4);ACT.phone=true;}
  return any?ACT:null;}
// short dialogues, speakers alternating A, B; the topic fits the place, time and what just happened
const TALKS=[
['',['Labas! Seniai matytas!','Labas! Kaip gyveni?','Po truputį. O tu?','Visai gerai, dirbu.']],
['shop',['Buvai Maximoj?','Buvau. Viskas pabrango.','Ir sviestas?','Ir sviestas, ir kava.','Nu ką padarysi...']],
['shop',['Ką pirkai?','Duonos ir pieno.','Aš tik kavos užbėgau.','Ten dabar akcija.']],
['stop',['Kada autobusas į Kauną?','Rodos, po dvidešimt minučių.','Dar spėsiu kavos išgert.']],
['stop',['Vėl vėluoja autobusas.','Kaip visada.','Pėsčiom būčiau greičiau.','Tai eik, aš palauksiu.']],
['',['Šalta šiandien.','Lapkritis, ką tu nori.','Kad bent sniego būtų.','Dar pasnigs, pamatysi.']],
['cops',['Matei tą durnių su mašina?','Mačiau! Vos manęs nepartrenkė.','Policija jau ieško.','Tegu greičiau pagauna.']],
['cops',['Kas čia per sirenos?','Kažką gaudo.','Ramus miestas buvo...','Buvo, buvo.']],
['day',['Kaip vaikams mokykloj?','Gerai, tik namų darbų daug.','Mūsų irgi. Ta matematika...','Pati nebesuprantu.']],
['',['Važiuosi prie Dubysos?','Jei oras leis, su meškere.','Pasiimk ir mane.','Gerai, šeštadienį ryte.']],
['',['Turguj buvai šeštadienį?','Buvau, bulvių nusipirkau.','Pigiai?','Normaliai. Ir kiaušinių.']],
['',['Žiūrėjai vakar Žalgirį?','Žiūrėjau. Vos laimėjo.','Paskutinį kėlinį vos atsilaikė.','Svarbu, kad laimėjo.']],
['',['Kaip mama?','Geriau, jau išleido iš ligoninės.','Tai gerai. Perduok linkėjimų.','Būtinai perduosiu.']],
['',['Girdėjau, naują darbą radai?','Taip, Kaune. Kasdien važinėju.','Toli gi.','Bet moka geriau.']],
['',['Degalai vėl pabrango.','Dviračiu važinėsiu.','Lapkritį? Drąsus.','Arba pėsčiom.']],
['day',['Eisi sekmadienį į bažnyčią?','Eisiu, į dešimtą.','Tai ten ir susitiksim.']],
['',['Gražiai aikštę sutvarkė.','Gražiai. Ypač vakare su šviesom.','Ir Žemaitis kaip naujas.']],
['',['Anūkai atvažiuos per šventes?','Žadėjo. Pyragą kepsiu.','Kokį?','Obuolių, aišku.']],
['',['Ką ta tavo mašina?','Vėl servise. Pasatas sensta.','Tai gal Zafirą pirk.','Juokauji? Dar blogiau.']],
['night',['Einam į L klubą?','Šiandien? Rytoj į darbą.','Tik vienas kokteilis.','Nu gerai, vienas.']],
['night',['Vėlu jau.','Nu, laikas namo.','Palydėt?','Nereikia, čia netoli.']],
['',['Girdėjai apie Petrą?','Ne, o kas?','Vedė! Rugsėjį.','Tai sveikinimai jam.']],
['',['Kur skubi?','Pas gydytoją.','Kas atsitiko?','Nieko, tik patikrinimas.']],
['day',['Gimnazijoj penktadienį koncertas.','Kada?','Šeštą vakaro.','Ateisim su vaikais.']],
['',['Per Vėlines kapinėse buvai?','Buvau. Tiek žvakių, gražu.','Ir žmonių pilna.','Visi savus aplankė.']],
['',['Turistai vėl klausė apie tankų mūšį.','Apie keturiasdešimt pirmus?','Tą patį, prie Dubysos.','Istorija, ką padarysi.']],
['',['Rugsėjį į Šilines važiavai?','Važiavau, kaip kasmet.','Šiluvoj tiek žmonių buvo.','Visa Lietuva suvažiuoja.']],
['',['Einam prie tvenkinio pasivaikščiot?','Prie Prūdo gatvės?','Taip, ten ramu.','Einam, tik apsirenk šilčiau.']],
['',['Vilniaus gatvėj vėl kamštis.','Raseiniuose kamštis? Juokauji.','Trys mašinos prie šviesoforo.','Nu tai jau kamštis.']],
['',['Žemaitis vėl su balandžiais.','Kiekvieną dieną jie ten.','Kas nors kepurę jam uždėtų.','Šalta gi žmogui.']],
['day',['Kalno mokykloj dar mokaisi?','Ne, jau gimnazijoj.','Žemaičio?','Taip, dvyliktoj klasėj.']],
['shop',['Į Maximą prie parko ar į Norfą?','Maxima arčiau.','Norfoj pigiau.','Tai einam į Norfą.']],
['stop',['Iš stoties į Vilnių kada?','Rodos, aštuntą.','Ilgai važiuot.','Trys valandos, ne mažiau.']],
['day',['Parke krepšinį žaisim?','Vakare, prie Vytauto Didžiojo.','Pasiimk kamuolį.','Mano nuleistas.']],
['',['Važiuoji į Kauną magistrale?','Taip, valanda kelio.','Ten vėl remontai.','Tai anksčiau išvažiuosiu.']],
['',['Gal pisam alaus?','Dabar? Dar tik pietūs.','Tai ir ką?','Nu... vieną.']],
['',['Gal į klubą šiandien?','Ką tu, velnias, rytoj darbas.','Vieną kartą gyvenam.','Gerai, bet tik iki dvylikos.','Tu kiekvieną kartą taip sakai.']],
['night',['Gal kašiuką palošiam pas Aivarą?','Vėl? Praeitą kartą viską pralošiau.','Šįkart atsilošim.','Nu jo, žinom tuos atsilošimus.']],
['',['Ką tu, velnias, čia veiki?','Nu stoviu.','Matau, kad stovi.','Tai ko klausi?']],
['',['Matei, kaip tas su Pasatu parkavosi?','Per dvi vietas?','Per tris!','Nu, Pasatas.']],
['',['Paskolink dešimt eurų.','Tu man dar penkis skolingas.','Tai bus penkiolika.','Ką tu, velnias...']],
['night',['Vėl iš klubo?','Ne, iš bibliotekos.','Trečią nakties?','Daug skaityt reikėjo.']],
['',['Ko toks linksmas?','Algą gavau.','Tai statai alų!','Nu jau ne, ji jau baigėsi.']],
['',['Girdėjai, dar vieną šviesoforą pastatė?','Antrą jau?','Trečią!','Nu, didmiestis.']],
['',['Kur tavo mašina?','Žmona paėmė.','Tai kaip dabar?','Pėsčiom, kaip senais laikais.']],
['cops',['Vėl kažkas policiją erzina.','Ir vėl ta pati mašina.','Turbūt koks kaunietis.','Aišku, ne raseiniškis.']]],
TALK_BYE=[['Na, bėgu.','Iki!'],['Gerai, susimatysim.','Iki, iki!'],['Nu, laikykis.','Tu irgi!'],['Einu, manęs laukia.','Sėkmės!']],
TALK_HM=['Aha.','Tikrai?','Nu jo.','Taip, taip.'];
let talkRecent=[];
function pickTalk(mem,cx,cz){
  const tag={'':1,day:tod>=6&&tod<20,night:tod>=20||tod<5,cops:stars()>0||heat>.3,
    stop:mem.some(p=>p.stop)||!!(bus&&bus.at.some(a=>a.st&&a.st.x!=null&&Math.hypot(a.st.x-cx,a.st.z-cz)<25)),
    shop:world.labels.some(L=>/maxima|norfa|iki|lidl|rimi/i.test(L.text||'')&&Math.hypot(L.x-cx,L.z-cz)<80)};
  const pool=[];TALKS.forEach((t,k)=>{if(tag[t[0]]&&!talkRecent.includes(k))for(let w=t[0]?4:1;w--;)pool.push(k);});
  const k=pool.length?pick(pool):Math.floor(Math.random()*TALKS.length);talkRecent=[k,...talkRecent].slice(0,8);
  const out=[];TALKS[k][1].forEach((l,i)=>{out.push([i&1,l]);if(mem.length>2&&i&1&&Math.random()<.35)out.push([2+Math.floor(Math.random()*(mem.length-2)),pick(TALK_HM)]);});
  const bye=pick(TALK_BYE);out.push([0,bye[0]],[1,bye[1]]);return out;}
let talkTex=null;const talkSpr=[];
function talkBubble(s){let T=talkTex.get(s);if(T)return T;const cv=document.createElement('canvas'),x=cv.getContext('2d'),f='600 30px system-ui,sans-serif';x.font=f;const w=Math.ceil(x.measureText(s).width)+36;cv.width=w;cv.height=78;
  x.font=f;x.fillStyle='rgba(255,255,255,.92)';x.beginPath();x.roundRect(2,2,w-4,54,16);x.moveTo(w*.3,54);x.lineTo(w*.3+6,76);x.lineTo(w*.3+20,54);x.fill();
  x.fillStyle='#1d1f22';x.textBaseline='middle';x.fillText(s,18,30);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;T={t,w};talkTex.set(s,T);return T;}
function pedBubbles(){
  if(!talkTex){talkTex=new Map();
    for(let i=0;i<3;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,fog:false}));s.visible=false;s.renderOrder=5;scene.add(s);talkSpr.push(s);}}
  const cx=camera.position.x,cz=camera.position.z,on=[];
  for(const g of pedGroups){if(g.say<=0)continue;const p=g.mem[g.spk];if(!p||p.mode!=='talk'||p.gait>.1)continue;const d=(p.x-cx)**2+(p.z-cz)**2;if(d<900)on.push([d,p,g]);}
  on.sort((a,b)=>a[0]-b[0]);
  talkSpr.forEach((s,i)=>{const o=on[i];s.visible=!!o;if(!o)return;const p=o[1],T=talkBubble(o[2].text);if(s.material.map!==T.t){s.material.map=T.t;s.material.needsUpdate=true;}
    s.scale.set(T.w/78*.36,.36,1);s.position.set(p.x,GY(p.x,p.z)+world.surf(p.x,p.z)+2.1*p.look.s,p.z);});}
function updatePeople(dt){""")
open(path, 'w', encoding='utf-8').write(h)
print('views ok')
