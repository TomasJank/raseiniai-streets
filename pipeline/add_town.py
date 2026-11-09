"""Soviet five-storey blocks, church windows and house yards, matched by eye to the Mapillary photos in refs/mapillary.
- blocks: rectangles (or rectangular parts of a LiDAR-split outline) of 3-6 storeys, 22 m+ long and 9-15 m deep, without a name, shop or amenity; light silicate brick
  (some grey panel), columns of loggias with concrete parapets on one long side, mostly glazed by the residents; on the side facing
  the road a stairwell window column, door, concrete canopy and step per 20 m section, benches; blank end walls; glass, plastic
  and paper bells at one end.
- Žemaitis monument rebuilt from Tomas's photo: white stone, stepped pedestal, figure with the arm held out, the bear.
- churches: arched windows, with a row of small ones below on tall walls.
- house yards: a driveway through the fence gap (a short path when the house stands right behind it), some cars parked in them,
  vegetable beds behind about half the houses.
usage: add_town.py page.html   (edits in place; run after add_views.py)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'town.js'), encoding='utf-8').read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)

rep("  return Object.assign({h,kind,wall,roof,pitched,rh,ridge,hip,chim,tops,skel,sty,windows:sty>=0},LOOK[w.id]);",
    """  let blk=false;
  if(pts.length===4&&!skel&&!tops&&h>=8&&h<=19&&!nm&&!t.shop&&!t.amenity&&kind!=='church'&&kind!=='civic'&&!LOOK[w.id]&&/^(yes|apartments)$/.test(t.building)){
    const ax=pts[1][0]-pts[0][0],az=pts[1][1]-pts[0][1],bx=pts[2][0]-pts[1][0],bz=pts[2][1]-pts[1][1],e0=Math.hypot(ax,az),e1=Math.hypot(bx,bz),lo=Math.max(e0,e1),sh=Math.min(e0,e1);
    blk=lo>=22&&sh>=9&&sh<=15&&Math.abs(ax*bx+az*bz)/(e0*e1)<.15;
    if(blk&&!F){const q=hash(w.id+'k');if(q<.75){sty=STY.brick;wall=[[.80,.77,.70],[.74,.73,.70],[.85,.83,.78]][Math.floor(q/.25)];}else{sty=STY.block;wall=[.70,.70,.68];}}}
  return Object.assign({h,kind,wall,roof,pitched,rh,ridge,hip,chim,tops,skel,sty,blk,windows:sty>=0},LOOK[w.id]);""")
rep("const bo={pts,mnx,mxx,mnz,mxz,top:top-glo,name:t.name||null,kind:s.kind};",
    "const bo={pts,mnx,mxx,mnz,mxz,top:top-glo,name:t.name||null,kind:s.kind,blks:specs.filter(q=>q[1].blk),sp:s.kind==='church'?s:null,look:!!LOOK[w.id]};")
rep("  const sinkGround=A=>{", "  const sinkGround=W.sinkGround=A=>{")
# where the fence along a frontage leaves its gap, for the driveway
rep("boundary(seg.slice(g+2),st,k);}}",
    "boundary(seg.slice(g+2),st,k);if(g<seg.length)(W.gaps||(W.gaps=[])).push([seg[g][0],seg[g][1],owner,r]);}}")
rep("  W.surf=(x,z)=>", "  W.roadSegs=(x,z)=>{const o=[],i0=Math.floor(x/NCELL),j0=Math.floor(z/NCELL);for(let i=i0-1;i<=i0+1;i++)for(let j=j0-1;j<=j0+1;j++){const l=surfGrid.get(gk(i,j));if(l)o.push(...l);}return o;};\n  W.surf=(x,z)=>")
rep("buildSignals();buildBus();buildStadium();", "buildSignals();buildBus();buildStadium();buildTown();")
rep("\nfunction buildExtra(){", "\n" + js + "\nfunction buildExtra(){")
# Žemaitis (V. Grybas, 1934), from Tomas's photo: all white stone, turned so the outstretched right arm points at Swedbank
# (c2940, Tomas's request); a wide low plinth, a stepped
# base with corner blocks, a pedestal with corner pilasters, a cornice and the inscription; the figure in a long coat with a cloak
# off the left shoulder, the right arm held out, the bear lying at his feet. Sizes scaled off a passer-by in the photo.
rep("LL(55.38119,23.11704),G=GY(X,Z),hd=.6,", "LL(55.38119,23.11704),G=GY(X,Z),hd=(([sx,sz])=>Math.atan2(sz-Z,X-sx))(LL(55.3808209,23.1160864)),")
a = h.index("b(0,.25,0,6,.5,6);"); b = h.index("b(.15,9.3,0,.18,1.1,.18,.7,fg);") + len("b(.15,9.3,0,.18,1.1,.18,.7,fg);")
h = h[:a] + """b(0,.45,0,7.5,.9,7.5);b(0,1.5,0,5,1.2,5);for(const u of[-1,1])for(const v of[-1,1]){b(u*1.95,2.55,v*1.95,1.1,.9,1.1);b(u*1.45,3.85,v*1.45,.7,3.5,.7);}
    b(0,3.85,0,3,3.5,3);b(0,5.8,0,3.9,.4,3.9);b(0,4.3,1.52,1.9,1.3,.06,0,fg);
    const f=(ox,y,oz,sx,sy,sz,t=0)=>b(ox*1.25,6+y*1.25,oz*1.25,sx*1.25,sy*1.25,sz*1.25,t);
    f(0,.3,0,2.3,.6,1.9);f(.55,.85,.45,1.5,.55,.75,.12);f(1.25,1.05,.5,.45,.45,.5);
    f(0,1.4,0,1.6,1.7,1);f(0,2.85,0,1.3,1.3,.8);f(0,3.8,0,1.25,.7,.65);f(.78,2.6,-.1,.42,2.5,.9,.12);
    f(0,4.35,0,.32,.3,.32);f(0,4.72,.02,.46,.55,.5);f(-1.2,4.0,.12,1.7,.32,.32);f(.68,3.25,.05,.28,1.15,.28);"""+ h[b:]
rep("instances(unit,0xb7b2a6,st);instances(unit,0x8f8b80,fg);", "instances(unit,0xe7e5de,st);instances(unit,0xc9c6bd,fg);")
rep("const C=[[-3,-3],[3,-3],[3,3],[-3,3]]", "const C=[[-3.75,-3.75],[3.75,-3.75],[3.75,3.75],[-3.75,3.75]]")
open(path, 'w', encoding='utf-8').write(h)
print('town ok')
