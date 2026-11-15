import sys,json,math,os,urllib.request
sys.argv=[sys.argv[0]]+sys.argv[1:]
import crops as C
from PIL import Image
ids=sys.argv[1:]
N=int(os.environ.get('N','3'))
out=[]
for bid in ids:
    cx,cz,rad,cs=C.cands(bid,dmin=8,dmax=62,amax=38)
    cs.sort(key=lambda t:t[0]+abs(t[1])*0.6)
    seen=set();pick=[]
    for dist,da,r in cs:
        if r['sequence'] in seen: continue
        seen.add(r['sequence']);pick.append((dist,da,r))
        if len(pick)==N:break
    for dist,da,r in pick:
        p='th/%s.jpg'%r['id']
        if not os.path.exists(p): open(p,'wb').write(urllib.request.urlopen(r['thumb_1024_url'],timeout=60).read())
        w,h=Image.open(p).size;f=0.75*w
        cxp=w/2+f*math.tan(math.radians(da)); cyp=h/2-f*(2.5-1.4)/dist
        half=(rad+3)*f/dist
        box=[cxp-half*1.1,cyp-half*0.85,cxp+half*1.1,cyp+half*0.85]
        out.append(dict(bid=bid,frame=r['id'],x=r['x'],z=r['z'],head=r['head'],w=w,h=h,f=f,photo=os.path.abspath(p),box=box,dist=dist,da=da))
    print(bid,len(pick),file=sys.stderr)
json.dump(out,open(os.environ.get('OUT','views.json'),'w'))
