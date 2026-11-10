"""Facade detail v2: two-tone walls, per-face windows, per-building balcony/chimney/dormer, roof material, flat/pitched and ridge fixes,
panel/slat fences, dense hedges (facades2.js). Keys come from street-file looks and fences (pipeline/streets/README.md).

usage: add_facades2.py page.html   (edits in place; run after add_drive2.py)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'facades2.js'), encoding='utf-8').read()
sec = {k.split('\n', 1)[0].strip(): k.split('\n', 1)[1] for k in src.split('//#')[1:]}


def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:90])
    h = h.replace(a, b)


rep("function buildingSpec(w,pts,area){", sec['core'].rstrip('\n') + "\n\nfunction buildingSpec(w,pts,area){")
rep("return facadeRefine(Object.assign({h,kind,wall,roof,pitched,rh,ridge,hip,chim,tops,skel,sty,blk,windows:sty>=0},LOOK[w.id]),w);",
    "return facade2(facadeRefine(Object.assign({h,kind,wall,roof,pitched,rh,ridge,hip,chim,tops,skel,sty,blk,windows:sty>=0},LOOK[w.id]),w),w);")

# atlas: rows 2-3 repeat rows 0-1 without windows (blank walls); rows painted in an order that leaves the noise seed where it was
rep("c.width=T*16;c.height=T*2;", "c.width=T*16;c.height=T*4;")
rep("let ox=0,oy=0,sd=7;", "let ox=0,oy=0,sd=7,NOWIN=false;")
rep("const win=(x,y,w,h,glass,frame='#f4f4f2')=>{R(", "const win=(x,y,w,h,glass,frame='#f4f4f2')=>{if(NOWIN)return;R(")
rep("for(let s=0;s<16;s++)for(let r=0;r<2;r++){\n    ox=s*T;oy=r*T;const ground=r===1;sd=s*977+r*131+7;",
    "for(let s=0;s<16;s++)for(const r of[2,3,0,1]){\n    ox=s*T;oy=r*T;const ground=(r&1)===1;NOWIN=r>1;sd=s*977+(r&1)*131+7;")
rep("vec2 f=fract(vMapUv),sc=vec2(.0625,.5),auv=vec2((vSty+f.x)*sc.x,((vMapUv.y<1.?0.:1.)+f.y)*sc.y);",
    "float bl=step(15.5,vSty),ws=vSty-16.*bl;vec2 f=fract(vMapUv),sc=vec2(.0625,.25),auv=vec2((ws+f.x)*sc.x,((vMapUv.y<1.?2.:3.)-2.*bl+f.y)*sc.y);")
rep("(vSty<7.5||(vSty>10.5&&vSty<13.5))", "(ws<7.5||(ws>10.5&&ws<13.5))", 2)

# atlas grain: the tall atlas ran vn (closure per call) over 1M pixels, 200 MB of garbage; the grain repeats per tile so it is cached
rep("  const vn=(s,x,y)=>{const fx=x/16,fy=y/16,i=fx|0,j=fy|0,u=fx-i,v=fy-j,at=(p,q)=>lat[(s*8+(q&7))*8+(p&7)];\n    return(at(i,j)*(1-u)+at(i+1,j)*u)*(1-v)+(at(i,j+1)*(1-u)+at(i+1,j+1)*u)*v;};",
    "  const at=(s,p,q)=>lat[(s*8+(q&7))*8+(p&7)];\n  const vn=(s,x,y)=>{const fx=x/16,fy=y/16,i=fx|0,j=fy|0,u=fx-i,v=fy-j;\n    return(at(s,i,j)*(1-u)+at(s,i+1,j)*u)*(1-v)+(at(s,i,j+1)*(1-u)+at(s,i+1,j+1)*u)*v;};\n  const NZ=new Float64Array(16*T*T).fill(-1),VN=(s,x,y)=>{const k=(s*T+y)*T+x;return NZ[k]<0?(NZ[k]=vn(s,x,y)):NZ[k];};")
rep("(vn(s,x%T,y%T)-.5)", "(VN(s,x%T,y%T)-.5)")

# the whole-canvas getImageData pair (2 x 4 MB of external memory) is read one tile row at a time
rep("const W=c.width,H=c.height,a=g.getImageData(0,0,W,H).data,b=k.getImageData(0,0,W,H).data,out=", "const W=c.width,H=c.height,out=")
rep("  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,", "  for(let y0=0;y0<H;y0+=T){const a=g.getImageData(0,y0,W,T).data,b=k.getImageData(0,y0,W,T).data;for(let y=y0;y<y0+T;y++)for(let x=0;x<W;x++){const i=((y-y0)*W+x)*4,")
rep("out[o+3]=b[i];}", "out[o+3]=b[i];}}")
# the per-pixel loop runs in a function of its own so it gets optimised (inline it left ~200 MB of boxed doubles behind)
i0 = h.index("for(let y=y0;y<y0+T;y++)for(let x=0;x<W;x++){const i=((y-y0)*W+x)*4,")
i1 = h.index("out[o+3]=b[i];}}", i0)
h = h[:i0] + "atlasBand(a,b,out,y0,T,W,H,VN);}" + h[i1 + len("out[o+3]=b[i];}}"):]

rep("  const t=new THREE.DataTexture(out,W,H,THREE.RGBAFormat);", "  c.width=m.width=0;\n  const t=new THREE.DataTexture(out,W,H,THREE.RGBAFormat);")

# two-tone shader: upper wall colour from the `tone` attribute
rep("attribute float sty;\\nvarying float vSty;", "attribute float sty;\\nattribute vec4 tone;\\nvarying vec4 vTone;\\nvarying float vY;\\nvarying float vSty;")
rep("#include <uv_vertex>\\nvSty=sty;", "#include <uv_vertex>\\nvSty=sty;vTone=tone;vY=position.y;")
rep("#include <common>\\nvarying float vSty;\\nvarying float vUp;\\nuniform float uNight,uSnow;", "#include <common>\\nvarying vec4 vTone;\\nvarying float vY;\\nvarying float vSty;\\nvarying float vUp;\\nuniform float uNight,uSnow;")
rep("    diffuseColor.rgb*=vColor.rgb;\n    if(vSty>-.5){", "    diffuseColor.rgb*=(vTone.w<-100.&&vY>-vTone.w-500.)?vTone.rgb:vColor.rgb;\n    if(vSty>-.5){")
rep("const arr=()=>({pos:[],col:[],nor:[],uv:[],sty:[],cs:-1});", "const arr=()=>({pos:[],col:[],nor:[],uv:[],sty:[],cs:-1,tr:[],tn:NOTONE});")
rep("  if(B.sty)B.sty.push(B.cs,B.cs,B.cs);", "  if(B.sty)B.sty.push(B.cs,B.cs,B.cs);\n  if(B.tn!==NOTONE)B.tr.push(B.pos.length/3-3,...B.tn);")
rep("function mkGeo(pos,col,nor,uv,sty){", "function mkGeo(pos,col,nor,uv,sty,tr){")
rep("  if(sty)g.setAttribute('sty',new THREE.Float32BufferAttribute(sty,1));", "  if(sty)g.setAttribute('sty',new THREE.Float32BufferAttribute(sty,1));\n  if(tr&&tr.length){const n=pos.length/3,T=new Float32Array(n*4);for(let i=0;i<n;i++)T[i*4+3]=1;for(let k=0;k<tr.length;k+=5)for(let j=0;j<3;j++)T.set(tr.slice(k+1,k+5),(tr[k]+j)*4);g.setAttribute('tone',new THREE.BufferAttribute(T,4));}")
rep("mkGeo(BLD.pos,BLD.col,BLD.nor,BLD.uv,BLD.sty)", "mkGeo(BLD.pos,BLD.col,BLD.nor,BLD.uv,BLD.sty,BLD.tr)")

# addBuilding: two-tone, per-face windows, ridge direction
rep("  let T=s.tops;\n  if(polyArea(p)>0){p=p.slice().reverse();if(T)T=T.slice().reverse();}",
    "  let T=s.tops;const rev=polyArea(p)>0;\n  if(rev){p=p.slice().reverse();if(T)T=T.slice().reverse();}")
rep("const fw=s.sty>=0;B.cs=fw?s.sty:-1;", "const fw=s.sty>=0;B.cs=fw?s.sty:-1;\n  const tn=s.wall2?[...s.wall2,-((s.yb||0)+.3+(s.band==null?3:s.band)+500)]:NOTONE,gb=s.blankGable&&s.pitched&&!s.hip&&n===4?gableIdx(p,s):null;B.tn=tn;")
rep("    const want=[-dz,0,dx];\n    const u1=fw?", "    const want=[-dz,0,dx];if(fw)B.cs=s.sty+(faceOff(s,i,n,rev,gb)?16:0);\n    const u1=fw?")
rep("  B.cs=-1;\n  if(s.pitched){\n    let [a,b,c,d]=p;", "  B.cs=-1;B.tn=NOTONE;\n  if(s.pitched){\n    let [a,b,c,d]=p;")
rep("    else if(s.ridge===1)[a,b,c,d]=[b,c,d,a];\n    else if(s.ridge==null&&Math.hypot(b[0]-a[0],b[1]-a[1])<Math.hypot(c[0]-b[0],c[1]-b[1]))[a,b,c,d]=[b,c,d,a];\n    const shortL",
    "    if(!s.front)[a,b,c,d]=pitchOrder(p,s);\n    const shortL")
rep("      const gA=[mA[0],h+rh,mA[1]],gB=[mB[0],h+rh,mB[1]];", "      const gA=[mA[0],h+rh,mA[1]],gB=[mB[0],h+rh,mB[1]];B.tn=s.gable?NOTONE:tn;")
rep("gA,s.gable||s.wall,UV0,UV0,UV0,[gA[0]-cx,0,gA[2]-cz]);", "gA,s.gable||s.wall,UV0,UV0,UV0,[gA[0]-cx,0,gA[2]-cz]);B.tn=NOTONE;")

# roof material
rep("const e=s.kind==='shed'?.25:.5,", "const e=s.noEave?0:s.kind==='shed'?.25:.5,")
rep("function roofSty(s){\n  const r=s.roof;", "function roofSty(s){\n  if(s.roofSty!=null)return typeof s.roofSty==='string'?STY[s.roofSty]:s.roofSty;\n  const r=s.roof;")
rep("B.cs=s.sty>=0?STY.flat:-1;const fu=", "B.cs=LOOK[s.rid]&&LOOK[s.rid].roofSty!=null?roofSty(s):s.sty>=0?STY.flat:-1;const fu=")

# details: per-building balcony / chimney / dormer, blank faces get no balconies, explicit street sty stops the automatic balcony rule
rep("if(L>.5)edges.push({a,L,", "if(L>.5)edges.push({i,a,L,")
rep("    if(single&&v1>=4&&!sp.blk&&sp.windows&&sp.kind!=='church'&&(sp.kind==='apartments'||/^(apartments|dormitory|yes)$/.test(t.building))&&balc.length<FD_MAX.balc){\n      const long=edges.filter(e=>e.L>=12).sort(",
    "    const bOwn=LOOK[r.id]&&LOOK[r.id].street&&LOOK[r.id].sty!=null;\n"
    "    if(single&&sp.balcony!==false&&balc.length<FD_MAX.balc&&(sp.balcony===true?v1>=2&&sp.windows:v1>=4&&!sp.blk&&sp.windows&&sp.kind!=='church'&&(sp.kind==='apartments'||/^(apartments|dormitory|yes)$/.test(t.building))&&!bOwn)){\n"
    "      const long=edges.filter(e=>e.L>=(sp.balcony===true?7:12)&&!faceOff(sp,e.i,n,polyArea(p0)>0,null)).sort(")
rep("if(single&&sp.pitched&&n===4&&sp.kind==='house'&&!sp.front&&sp.h<=6.5){\n      let [a,b,c,d]=p;\n      if(sp.ridge===1)[a,b,c,d]=[b,c,d,a];else if(sp.ridge==null&&Math.hypot(b[0]-a[0],b[1]-a[1])<Math.hypot(c[0]-b[0],c[1]-b[1]))[a,b,c,d]=[b,c,d,a];",
    "if(single&&sp.pitched&&n===4&&!sp.front&&((sp.kind==='house'&&sp.h<=6.5)||sp.chimney||sp.dormer)){\n      let [a,b,c,d]=pitchOrder(p,sp);")
rep("if(!sp.chim&&hash(r.id+'ch')<.75&&ridgeHalf>1.2&&run>=6&&chim.length<FD_MAX.chim){\n        const d0=Math.min(run*.22,ridgeHalf-.5)*sg;",
    "if(sp.chimney!==false&&(sp.chimney===true||(!sp.chim&&hash(r.id+'ch')<.75))&&ridgeHalf>(sp.chimney?.6:1.2)&&run>=(sp.chimney?4:6)&&chim.length<FD_MAX.chim){\n        const d0=Math.max(0,Math.min(run*.22,ridgeHalf-.5))*sg;")
rep("if(rh>=1.8&&shortL>=7&&run>=8&&hash(r.id+'dm')<.35&&dormB.length<FD_MAX.dorm-1){",
    "if(sp.dormer===true?rh>=1.2&&shortL>=5&&run>=6:sp.dormer!==false&&rh>=1.8&&shortL>=7&&run>=8&&hash(r.id+'dm')<.35&&dormB.length<FD_MAX.dorm-21){")

rep("if(W.inBuilding(x+nx*3,z+nz*3))continue;", "const oo=sp.dormer?shortL/2-Math.abs(dv)+2:3;if(W.inBuilding(x+nx*oo,z+nz*oo))continue;")

# fences: col per fence, panel / slat styles, dense hedge
rep("(L['fence:'+k]||(L['fence:'+k]=[]))", "(L['fence:'+k+(f.col&&k===f.style?'|'+f.col:'')]||(L['fence:'+k+(f.col&&k===f.style?'|'+f.col:'')]=[]))")
rep("else{at(f.style,l/2,h/2,st[1],h,l);", "else if(!fence2(f,at,h,l,st)){at(f.style,l/2,h/2,st[1],h,l);")
rep("const st=k.slice(6),m=instances(unit,st==='post'?'#4a524c':STREET_FENCE[st][2],L[k]);",
    "const [st,fc]=k.slice(6).split('|'),m=instances(unit,st==='post'?'#4a524c':st==='plinth'?'#8a8a86':fc||STREET_FENCE[st][2],L[k]);")
open(path, 'w', encoding='utf-8').write(h)
print('facades2 ok')
