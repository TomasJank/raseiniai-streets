"""Buildings round: finer facade atlas (16 styles), roof patterns, instanced balconies/chimneys/dormers/shop glazing, four landmark meshes (facades.js).

usage: add_facades.py page.html   (edits in place; run after add_streets.py and add_voice.py)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'facades.js'), encoding='utf-8').read()
sec = {k.split('\n', 1)[0].strip(): k.split('\n', 1)[1] for k in src.split('//#')[1:]}


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("sheet:9,flat:10};", "sheet:9,flat:10,silicate:11,panel:12,plank:13,corrugated:14,asbestos:15};")
a = h.index("const facadeTex=(()=>{")
e = "t.needsUpdate=true;return t;\n})();"
b = h.index(e, a) + len(e)
assert h.count("const facadeTex=(()=>{") == 1
h = h[:a] + sec['atlas'].rstrip('\n') + h[b:]

# wall styles (original 0-6, plus 11-13) get the floor shading and the night windows; roof and glass tiles do not
rep("*(vSty<7.5?mix(.72,1.,smoothstep(0.,.6,vMapUv.y)):1.);", "*((vSty<7.5||(vSty>10.5&&vSty<13.5))?mix(.72,1.,smoothstep(0.,.6,vMapUv.y)):1.);")
rep("if(vSty<7.5&&tx.a>.5&&tx.b>tx.r+.04", "if((vSty<7.5||(vSty>10.5&&vSty<13.5))&&tx.a>.5&&tx.b>tx.r+.04")

rep("function buildingSpec(w,pts,area){", sec['core'].rstrip('\n') + "\n\nfunction buildingSpec(w,pts,area){")
rep("return Object.assign({h,kind,wall,roof,pitched,rh,ridge,hip,chim,tops,skel,sty,blk,windows:sty>=0},LOOK[w.id]);",
    "return facadeRefine(Object.assign({h,kind,wall,roof,pitched,rh,ridge,hip,chim,tops,skel,sty,blk,windows:sty>=0},LOOK[w.id]),w);")
rep("const rs=s.roof[0]>s.roof[2]+.12?STY.tiles:STY.sheet,kq=", "const rs=roofSty(s),kq=")
rep("rs=s.roof[0]>s.roof[2]+.12?STY.tiles:STY.sheet,uv=q=>", "rs=roofSty(s),uv=q=>")
rep("if((s.kind==='church'||s.towerH)&&area>150){", "if((s.kind==='church'||s.towerH)&&area>150&&!s.noTower){")
rep("      W.buildings.push(bo);addTo(bGrid,BCELL,mnx,mnz,mxx,mxz,bo);", "      facadeRec(W,w,t,pts,specs,top);W.buildings.push(bo);addTo(bGrid,BCELL,mnx,mnz,mxx,mxz,bo);")
rep("buildStadium();buildTown();", "buildStadium();buildTown();buildLandmarks();")
open(path, 'w', encoding='utf-8').write(h)
print('facades ok')
