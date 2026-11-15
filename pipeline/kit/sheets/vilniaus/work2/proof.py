import json,math,sys
from PIL import Image
import crops,walls
# proof.py out.json bid[:k] ...
out=sys.argv[1];V=[]
for a in sys.argv[2:]:
    bid,_,k=a.partition(':');dist,da,r=walls.frames(bid,6)[int(k or 0)]
    rad=crops.cands(bid)[2]
    ph=Image.open('th/%s.jpg'%r['id']);w,h=ph.size;f=0.75*w
    cxp=w/2+f*math.tan(math.radians(da));cyp=h/2-f*(2.5-1.4)/dist;half=(rad+3)*f/dist
    box=[cxp-half*1.1,cyp-half*0.85,cxp+half*1.1,cyp+half*0.85]
    V.append(dict(bid=bid,frame=r['id'][-8:],x=r['x'],z=r['z'],head=r['head'],w=w,h=h,f=f,photo='th/%s.jpg'%r['id'],box=box))
json.dump(V,open(out,'w'));print(len(V))
