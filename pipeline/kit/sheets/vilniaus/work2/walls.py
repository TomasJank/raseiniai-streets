import json,math,sys,collections
from houses import *
import crops
def frames(bid,n=5):
    cx,cz,rad,cs=crops.cands(bid);cs.sort(key=lambda t:t[0]+abs(t[1])*0.6)
    seen=set();pick=[]
    for dist,da,r in cs:
        if r['sequence'] in seen: continue
        seen.add(r['sequence']);pick.append((dist,da,r))
        if len(pick)==n:break
    return pick
def edges_vis(bid,r):
    P=[xz(*q) for q in fp[bid]['pts']];c=cen(bid);out=[]
    for e in range(len(P)):
        a=P[e];b=P[(e+1)%len(P)];L=math.hypot(b[0]-a[0],b[1]-a[1])
        if L<1.5: continue
        ux=(b[0]-a[0])/L;uz=(b[1]-a[1])/L
        nx,nz=uz,-ux
        if (a[0]-c[0])*nx+(a[1]-c[1])*nz<0:nx,nz=-nx,-nz
        mx=(a[0]+b[0])/2;mz=(a[1]+b[1])/2
        vx=r['x']-mx;vz=r['z']-mz;vl=math.hypot(vx,vz)
        cos=(vx*nx+vz*nz)/vl
        if cos<0.15: continue
        # screen x of midpoint
        br=math.degrees(math.atan2(mx-r['x'],-(mz-r['z'])))%360
        da=(br-r['head']+180)%360-180
        out.append((e,round(L,1),round(cos,2),round(da)))
    return out
if __name__=='__main__':
    for bid in sys.argv[1:]:
        print(bid)
        for dist,da,r in frames(bid):
            print('  ',r['id'][-6:],'d%d a%d'%(dist,da),edges_vis(bid,r))
