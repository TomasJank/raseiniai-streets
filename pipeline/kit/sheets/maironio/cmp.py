import json,sys,os
from PIL import Image,ImageDraw
V=json.load(open(sys.argv[1])); dirs=sys.argv[2].split(','); out=sys.argv[3]; ids=sys.argv[4:]
os.makedirs(out,exist_ok=True)
W=int(os.environ.get('W','520'))
for bid in ids:
    rows=[]
    for v in [v for v in V if v['bid']==bid]:
        ph=Image.open(v['photo']).convert('RGB');b=[int(max(0,t)) for t in v['box']]
        ims=[ph]+[Image.open('%s/%s_%s.jpg'%(d,bid,v['frame'])).convert('RGB') for d in dirs]
        cs=[im.crop((b[0],b[1],min(b[2],im.width),min(b[3],im.height))) for im in ims]
        h=int(W*cs[0].height/cs[0].width)
        r=Image.new('RGB',(W*len(cs),h))
        for k,c in enumerate(cs): r.paste(c.resize((W,h)),(k*W,0))
        ImageDraw.Draw(r).text((4,4),'%s d%d a%d'%(v['frame'][-6:],v['dist'],v['da']),fill=(255,255,0),stroke_width=2,stroke_fill=0)
        rows.append(r)
    if not rows: continue
    m=Image.new('RGB',(rows[0].width,sum(r.height for r in rows)))
    y=0
    for r in rows: m.paste(r,(0,y));y+=r.height
    m.save('%s/%s.jpg'%(out,bid),quality=82)
