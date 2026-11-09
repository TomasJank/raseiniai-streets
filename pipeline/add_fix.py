"""People no longer slide or flash across the street, and no tree trunk stands on a road.
- walkers chased their target point on the pavement at a third of the gap per frame; after fleeing, a shop visit or a turn at a
  junction that point can be 10-45 m away, so they slid at up to 20 m/s with the walk cycle playing. They now close the gap at
  no more than 1.6x their walking speed (followers 1.8x their pair's).
- lakes and ponds showed grass blotches: the 24 m terrain grid bulges above a water surface draped on the DEM, and only
  roads and pavements pushed it down; water now does too.
- the car starts on the same spot on Vilniaus g., turned round to face the other way (Tomas's choice).
- LiDAR trunks sit under the crown centre, which can hang over a street, and the forest fill ignores roads; any trunk on a
  carriageway, track or path is dropped.
usage: add_fix.py page.html   (edits in place; run after add_views.py)
"""
import sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)

rep("const q=pedTarget(p),k=Math.min(1,dt*3);p.x+=(q[0]-p.x)*k;p.z+=(q[1]-p.z)*k;",
    "const q=pedTarget(p),k=Math.min(1,dt*3),ex=(q[0]-p.x)*k,ez=(q[1]-p.z)*k,el=Math.hypot(ex,ez),cap=p.sp*fast*1.6*dt,f=el>cap?cap/el:1;p.x+=ex*f;p.z+=ez*f;")
rep("p.x+=(L.x+Math.cos(L.h)*.65-p.x)*k;p.z+=(L.z-Math.sin(L.h)*.65-p.z)*k;",
    "{const ex=(L.x+Math.cos(L.h)*.65-p.x)*k,ez=(L.z-Math.sin(L.h)*.65-p.z)*k,el=Math.hypot(ex,ez),cap=Math.max(p.sp,L.sp)*1.8*dt,f=el>cap?cap/el:1;p.x+=ex*f;p.z+=ez*f;}")
rep("if(best){sx=best.x;sz=best.z;const nx=G.get(best.out[0]);if(nx)sh=Math.atan2(nx.x-best.x,nx.z-best.z);}",
    "if(best){sx=best.x;sz=best.z;const nx=G.get(best.out[0]);if(nx)sh=Math.atan2(nx.x-best.x,nx.z-best.z)+Math.PI;}")
rep("  sinkGround(RD);\n", "  sinkGround(RD);sinkGround(WA);\n")
rep("  if(trees.length){\n    // chunked", """  W.treesOnRoad=0;for(let i=trees.length;i--;){const [x,z]=trees[i];
    if(W.roadSegs(x,z).some(s=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<s[4].w/2+.4;})){trees.splice(i,1);W.treesOnRoad++;}}
  if(trees.length){
    // chunked""")
open(path, 'w', encoding='utf-8').write(h)
print('fix ok')
