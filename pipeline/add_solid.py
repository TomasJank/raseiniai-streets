"""Knockable poles, signals, bus-stop signs, park lamps and bins (they fall like the small trees), and world.solids:
props and wall segments built before buildExtra() resets the grids (Maxima, the square, Gvidas, Aivaras, Norfa XL).

usage: add_solid.py page.html   (edits in place)
"""
import sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


# world.solids: {x,z,r} props or [x0,z0,x1,z1] wall segments, registered on every buildExtra()
rep("roadKm:0,lamps:[]};", "roadKm:0,lamps:[],solids:[]};")
rep("props=new Map();walls=new Map();", "props=new Map();walls=new Map();for(const s of world.solids)Array.isArray(s)?addWall(...s):addProp(s);")

# street poles: remember their instances and lamp index so they can fall; the world.poles entry is the prop, so q.down says it fell
rep("pv.set(q.x,q.y+4.3,q.z);m4.compose(pv,qt,sv);P1.setMatrixAt(i,m4);",
    "q.parts=[[P1,i],[P2,i]];pv.set(q.x,q.y+4.3,q.z);m4.compose(pv,qt,sv);P1.setMatrixAt(i,m4);")
rep("if(q.lamp){pv.set(q.x+q.ax*.85", "if(q.lamp){q.parts.push([L1,li],[L2,li]);q.li=W.lamps.length;pv.set(q.x+q.ax*.85")
rep("for(const q of world.poles||[])addProp({x:q.x,z:q.z,r:.16});",
    "for(const q of world.poles||[])addProp(Object.assign(q,{r:.16,snap:true,minSp:7,h:8.6}));")

# Maxima: canopy pillars, lot lights, the P sign pole and the low wall along the lot
rep("const LOT=arr(),MX=arr();LOT.drape=true;", "const LOT=arr(),MX=arr();LOT.drape=true;const SO=W.solids;")
rep("])box(u-.1,u+.1,v-.1,v+.1,yb,y0+3.4,DARK);", "]){const o=F(u,v);SO.push({x:o[0],z:o[1],r:.18});box(u-.1,u+.1,v-.1,v+.1,yb,y0+3.4,DARK);}")
rep("for(const [u,v] of [[-22,-14],[-18,13],[17,-5],[42,-5]]){const b=GY(...F(u,v));",
    "for(const [u,v] of [[-22,-14],[-18,13],[17,-5],[42,-5]]){const b=GY(...F(u,v));SO.push({x:F(u,v)[0],z:F(u,v)[1],r:.16});")
rep("box(-14.05,-13.95,-33.05,-32.95,", "SO.push({x:F(-14,-33)[0],z:F(-14,-33)[1],r:.1});box(-14.05,-13.95,-33.05,-32.95,")
rep("box(-6,28,-32.9,-32.5,gc-.8,gc+1,[.62,.6,.56]);", "SO.push([...F(-6,-32.7),...F(28,-32.7)]);box(-6,28,-32.9,-32.5,gc-.8,gc+1,[.62,.6,.56]);")

# the square across Vilniaus g.: every pole, bench, planter, railing and the ring sculpture
rep("const pole=(p,q,h,w,c)=>blk(p-w,p+w,q-w,q+w,.1,h,c);",
    "const seg=(a,b)=>SO.push([...D(a[0],a[1]),...D(b[0],b[1])]),box4=(p0,p1,q0,q1)=>{seg([p0,q0],[p1,q0]);seg([p1,q0],[p1,q1]);seg([p1,q1],[p0,q1]);seg([p0,q1],[p0,q0]);};\n"
    "      const pole=(p,q,h,w,c)=>{const o=D(p,q);SO.push({x:o[0],z:o[1],r:w+.06});blk(p-w,p+w,q-w,q+w,.1,h,c);};")
rep("const bench=(p,q0,q1,y)=>{blk(", "const bench=(p,q0,q1,y)=>{seg([p+.28,q0],[p+.28,q1]);blk(")
for a in ("20,27,-3.4,3.4", "35.5,36.8,7.6,17", "37,38,-14.5,-10.3"):
    rep(f"blk({a},.16,.62,CONC);", f"box4({a});blk({a},.16,.62,CONC);")
rep("if(i<l.length-1){rail(l[i],l[i+1],1.17,.05,STEEL);", "if(i<l.length-1){seg(l[i],l[i+1]);rail(l[i],l[i+1],1.17,.05,STEEL);")
rep("pole(22.4,-11.9-1.2,.3,.05,STEEL);", "seg([22.4,-14.25],[22.4,-9.6]);pole(22.4,-11.9-1.2,.3,.05,STEEL);")

# Gvidas's porch and hedge, Aivaras's fence and thujas, the Norfa XL entrance block (built from buildStory, before buildExtra)
rep("function buildGvidas(){",
    "function solidRect(f,s0,s1,o0,o1){const P=(s,o)=>[f.mx+f.ux*s+f.nx*o,f.mz+f.uz*s+f.nz*o],c=[P(s0,o0),P(s1,o0),P(s1,o1),P(s0,o1)];\n"
    "  for(let i=0;i<4;i++)world.solids.push([...c[i],...c[(i+1)%4]]);}\n"
    "function buildGvidas(){")
rep("const pa=-f.L*.27;box(3.8,3,2.6,pa,1.3,1.5,0xd8d0ba);", "const pa=-f.L*.27;solidRect(f,pa-1.9,pa+1.9,0,2.6);box(3.8,3,2.6,pa,1.3,1.5,0xd8d0ba);")
rep("if(out>5)box(f.L+6,1.8,1.1,0,out,.9,0x3e5a2c);", "if(out>5){solidRect(f,-f.L/2-3,f.L/2+3,out-.55,out+.55);box(f.L+6,1.8,1.1,0,out,.9,0x3e5a2c);}")
rep("m.scale.set(1,h,1);put(m,s,.7,h/2);}", "m.scale.set(1,h,1);const t=put(m,s,.7,h/2).position;world.solids.push({x:t.x,z:t.z,r:.35});}")
rep("put(new THREE.Mesh(new THREE.BoxGeometry(L,1.5,.03),mesh),L/2,0,.8).rotation.y=Math.atan2(nx,nz);",
    "put(new THREE.Mesh(new THREE.BoxGeometry(L,1.5,.03),mesh),L/2,0,.8).rotation.y=Math.atan2(nx,nz);world.solids.push([ax,az,bx,bz]);")
rep("blk.rotation.y=Math.atan2(fn.nx,fn.nz);blk.castShadow=true;worldGroup.add(blk);",
    "blk.rotation.y=Math.atan2(fn.nx,fn.nz);blk.castShadow=true;worldGroup.add(blk);solidRect(fn,al-bw/2,al+bw/2,0,1.4);")

# signals and bus-stop signs are groups pivoting at their base
rep("addProp({x:px,z:pz,r:.12});", "addProp({x:px,z:pz,r:.12,snap:true,minSp:7,h:4,parts:[{obj:g}]});")
rep("addProp({x,z,r:.1});", "addProp({x,z,r:.1,snap:true,minSp:5,h:2.6,parts:[{obj:g}]});")

# park lamps, bins and the mapped bus-stop signs: put() returns the instance count, so length-1 is the index
rep("{const L={},put=(k,x,z,y,hd,sx,sy,sz)=>", "{const L={},M={},kn=[],put=(k,x,z,y,hd,sx,sy,sz)=>")
rep("if(j%3===0){put('lamp',bx,bz,2.25,0,.13,4.5,.13);put('lampH',bx,bz,4.55,0,.42,.18,.42);addWall(bx-.1,bz,bx+.1,bz);}",
    "if(j%3===0)kn.push({x:bx,z:bz,r:.12,snap:true,minSp:7,h:4.6,parts:[['lamp',put('lamp',bx,bz,2.25,0,.13,4.5,.13)-1],['lampH',put('lampH',bx,bz,4.55,0,.42,.18,.42)-1]]});")
rep("if(j%2)put('bin',bx+ux*1.4,bz+uz*1.4,.35,0,.4,.7,.4);",
    "if(j%2){const x=bx+ux*1.4,z=bz+uz*1.4;kn.push({x,z,r:.3,snap:true,minSp:5,h:.7,parts:[['bin',put('bin',x,z,.35,0,.4,.7,.4)-1]]});}")
rep("const [sx,sz]=at(-2.6,-.6);put('lamp',sx,sz,1.3,hd,.07,2.6,.07);put('sign',...at(-2.6,-.62),2.4,hd,.5,.5,.03);addWall(sx-.1,sz,sx+.1,sz);",
    "const [sx,sz]=at(-2.6,-.6);kn.push({x:sx,z:sz,r:.1,snap:true,minSp:5,h:2.6,parts:[['lamp',put('lamp',sx,sz,1.3,hd,.07,2.6,.07)-1],['sign',put('sign',...at(-2.6,-.62),2.4,hd,.5,.5,.03)-1]]});")
rep("m.material.depthWrite=false;m.castShadow=false;}}",
    "m.material.depthWrite=false;m.castShadow=false;}M[k]=m;}\n    for(const p of kn){p.parts=p.parts.map(([k,i])=>[M[k],i]);addProp(p);}")

# the push-apart and pedAvoid move people after pedPush, which left them inside walls and props
rep("a.x-=dx*k;a.z-=dz*k;b.x+=dx*k;b.z+=dz*k;}}", "a.x-=dx*k;a.z-=dz*k;b.x+=dx*k;b.z+=dz*k;}}\n  for(const p of peds)if(p.mode!=='hide')pedPush(p);")

rep("// trunks and poles in an 8 m grid; trees under 14 m snap, poles and old trees stop the car",
    "// trunks, poles and street furniture in an 8 m grid; anything with snap (trees under 14 m, poles, signs, bins) falls over above minSp\n"
    "// ponytail: picket/mesh/hedge fences are one merged geometry per style, so their wall segments stay solid and never break; per-panel instances to knock them down")
# snapping generalised: per-prop speed, instanced parts or base-pivoted groups, a thud and no leaves for non-trees
rep("if(p.snap&&c&&Math.abs(c.speed)>4)", "if(p.snap&&c&&Math.abs(c.speed)>(p.minSp||4))")
rep("const parts=[p.tree.tk,p.tree.cr].filter(Boolean).map(([mesh,i])=>{const m0=new THREE.Matrix4();mesh.getMatrixAt(i,m0);return{mesh,i,m0};});",
    "const parts=(p.parts||[p.tree.tk,p.tree.cr]).filter(Boolean).map(q=>{if(q.obj)return{obj:q.obj,q0:q.obj.quaternion.clone()};const [mesh,i]=q,m0=new THREE.Matrix4();mesh.getMatrixAt(i,m0);return{mesh,i,m0};});")
rep("h:p.tree[2],parts,landed:false});", "h:p.h||p.tree[2],parts,landed:false});")
rep("sCrack(nearPlayer(p.x,p.z));puff(p.x,GY(p.x,p.z)+1.5,p.z,0x6f7a52,1.2);",
    "if(p.tree){sCrack(nearPlayer(p.x,p.z));puff(p.x,GY(p.x,p.z)+1.5,p.z,0x6f7a52,1.2);}else sThud(nearPlayer(p.x,p.z));\n"
    "  if(p.li!=null&&lampPools){lampPools.setMatrixAt(p.li,_m.makeScale(0,0,0));lampPools.instanceMatrix.needsUpdate=true;const a=lampHalos.geometry.attributes.position;a.setY(p.li,-1e4);a.needsUpdate=true;}")
rep("f.p.z+f.ax*f.h*.6,0x5d6b3c,2.2);", "f.p.z+f.ax*f.h*.6,f.p.tree?0x5d6b3c:0x8a857a,2.2);")
rep("for(const q of f.parts){_m.makeTranslation",
    "for(const q of f.parts){if(q.obj){q.obj.quaternion.setFromAxisAngle(_ax,f.th).multiply(q.q0);continue;}_m.makeTranslation")

open(path, 'w', encoding='utf-8').write(h)
print('solid ok')
