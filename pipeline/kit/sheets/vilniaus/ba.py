import os,sys
from PIL import Image,ImageDraw
def row(bid,sq,W):
    ts=[]
    for nm in('front','left','right','back'):
        p='%s/%s_%s.jpg'%(sq,bid,nm)
        if os.path.exists(p):
            t=Image.open(p).convert('RGB');t=t.resize((W,int(t.height*W/t.width)));ImageDraw.Draw(t).text((3,2),nm,fill=(255,255,0),stroke_width=2,stroke_fill=0);ts.append(t)
    H=max(t.height for t in ts);r=Image.new('RGB',(W*4,H))
    for i,t in enumerate(ts): r.paste(t,(i*W,0))
    return r
def sheet(bid,b='sq0',a='sq1',out=None):
    W=400
    rb=row(bid,b,W);ra=row(bid,a,W)
    parts=[]
    hc='hc_%s.jpg'%bid
    if os.path.exists(hc):
        h=Image.open(hc).convert('RGB');parts.append(h.resize((W*4,int(h.height*W*4/h.width))))
    ImageDraw.Draw(rb).text((W*4-60,2),'before',fill=(255,255,0),stroke_width=2,stroke_fill=0);ImageDraw.Draw(ra).text((W*4-60,2),'after',fill=(0,255,255),stroke_width=2,stroke_fill=0)
    parts+=[rb,ra]
    im=Image.new('RGB',(W*4,sum(p.height for p in parts)));y=0
    for p in parts: im.paste(p,(0,y));y+=p.height
    im.save(out or 'ba_%s.jpg'%bid,quality=85)
for b in sys.argv[1:]: sheet(b)
