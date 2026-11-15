# camera records + boxes for the same-angle proof: python3 camviews.py out.json id id ...   (run from the scratch dir; uses crops.py)
import sys,json,math
sys.path.insert(0,'/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/pipeline/kit/sheets/vytauto-didziojo')
import crops as C
from PIL import Image,ImageStat
out=[]
CL=[C.xz(*q) for q in [(55.386112,23.125842),(55.385488,23.124022),(55.381139,23.115748),(55.380487,23.114719),(55.379927,23.113777)]]
def snap(r):
    # the stored positions are 10-30 m off sideways: put the car in its lane (2.2 m right of the centreline) when it travels along the street
    best=None
    for a,b in zip(CL,CL[1:]):
        dx,dz=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dz);ux,uz=dx/L,dz/L
        t=max(0,min(L,((r['x']-a[0])*ux+(r['z']-a[1])*uz)));px,pz=a[0]+ux*t,a[1]+uz*t
        d=math.hypot(r['x']-px,r['z']-pz)
        if best is None or d<best[0]: best=(d,px,pz,ux,uz)
    d,px,pz,ux,uz=best
    if r['head'] is None: return
    st=math.degrees(math.atan2(ux,-uz))%360
    dh=(r['head']-st+180)%360-180
    if abs(dh)<25 or abs(abs(dh)-180)<25:
        sgn=1 if abs(dh)<25 else -1
        # right of travel in game coords (x east, z south): (-uz*sgn... ) rotate travel vector by +90 degrees clockwise seen from above
        tx,tz=ux*sgn,uz*sgn;rx,rz=-tz,tx
        r['x'],r['z']=px+rx*2.2,pz+rz*2.2
import os
if os.environ.get('SNAP'):
    for r in C.d: snap(r)
for bid in sys.argv[2:]:
    cx,cz,rad,cs=C.cands(bid,dmin=12,dmax=45,amax=25)
    best=[]
    for dist,da,r in cs:
        p=C.S+'/th/%s.jpg'%r['id']
        try:
            C.crop(bid,r,dist,da,rad)
        except Exception as e: continue
        im=Image.open(p).convert('L')
        w,h=im.size
        br=ImageStat.Stat(im.crop((0,int(h*.2),w,int(h*.6)))).mean[0]
        if br<95: continue
        best.append((dist+abs(da)*.6,dist,da,r,br))
    best.sort(key=lambda t:t[0])
    seen=set();k=0
    for sc,dist,da,r,br in best:
        if r['sequence'] in seen: continue
        seen.add(r['sequence'])
        im=Image.open(C.S+'/th/%s.jpg'%r['id']);w,h=im.size;f=0.75*w
        cxp=w/2+f*math.tan(math.radians(da));cyp=h/2-f*(2.5-1.4)/dist;half=(rad+3)*f/dist
        out.append(dict(bid=bid,frame=r['id'],x=r['x'],z=r['z'],head=r['head'],w=w,h=h,f=f,photo=C.S+'/th/%s.jpg'%r['id'],box=[cxp-half*1.1,cyp-half*0.85,cxp+half*1.1,cyp+half*0.85],dist=round(dist),da=round(da)))
        k+=1
        if k==2: break
json.dump(out,open(sys.argv[1],'w'))
print(len(out),[ (o['bid'],o['frame'][-5:],o['dist'],o['da']) for o in out])
