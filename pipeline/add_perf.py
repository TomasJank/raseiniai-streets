"""Frame cost for phones: tree crowns drop to 80 then 20 triangles with distance, only trees within 130 m cast shadows,
far trunks and cars are hidden, the far plane follows the fog, and touch devices get no MSAA, a 1024 shadow map,
fewer grass blades and a pixel ratio that adapts to the frame rate.
usage: add_perf.py page.html   (edits in place; run last, after add_world2.py)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'perf.js'), encoding='utf-8').read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)

rep("const renderer=new THREE.WebGLRenderer({antialias:true,",
    "const PHONE=matchMedia('(pointer:coarse)').matches,TREES=[];\nconst renderer=new THREE.WebGLRenderer({antialias:!PHONE,")
rep("renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));", "renderer.setPixelRatio(Math.min(devicePixelRatio||1,PHONE?1.5:2));")
rep("sun.shadow.mapSize.set(2048,2048);", "sun.shadow.mapSize.set(PHONE?1024:2048,PHONE?1024:2048);")
# the crown shape as a function of detail, so far trees get the same lumps with fewer triangles
rep("leafG=(()=>{const g=new THREE.IcosahedronGeometry(1,3),", "leafMk=det=>{const g=new THREE.IcosahedronGeometry(1,det),")
rep("p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;})()",
    "p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;},leafG=leafMk(3),leafLo=[leafMk(1),leafMk(0)]")
rep("const L=broad.length?mk(leafG,leafM,broad.length):null,C=con.length?mk(coneG,coneM,con.length):null,Tk=mk(trunkG,trunkM,list.length);",
    "const L=broad.length?mk(leafG,leafM,broad.length):null,C=con.length?mk(coneG,coneM,con.length):null,Tk=mk(trunkG,trunkM,list.length);\n"
    "      if(L){const lo=leafLo.map(g=>{const gg=g.clone();gg.boundingSphere=sphere;return gg;});TREES.push({L,C,Tk,s:sphere,hi:L.geometry,lo1:lo[0],lo0:lo[1]});}else TREES.push({L,C,Tk,s:sphere});")
rep("const GR_R=44,GR_N=60000,", "const GR_R=PHONE?30:44,GR_N=PHONE?28000:60000,")
rep("function updateEnv(dt){", js + "function updateEnv(dt){")
rep("  renderer.render(scene,camera);\n}", "  perfTick(dt);\n  renderer.render(scene,camera);\n}")
open(path, 'w', encoding='utf-8').write(h)
print('perf ok')
