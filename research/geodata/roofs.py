import json,os,colorsys,random,math
import numpy as np
from PIL import Image,ImageDraw
from pyproj import Transformer
from shapely.geometry import Polygon
from shapely import affinity

M=json.load(open('ortho/meta.json'));RES=M['res'];S=256*RES
OX,OY=-5122000,10000100
fp=json.load(open('footprints.json'))
T=Transformer.from_crs(4326,3346,always_xy=True)
cache={}
def tile(r,c):
    k=(r,c)
    if k not in cache:
        p='ortho/tiles/%d_%d.jpg'%k
        cache[k]=np.asarray(Image.open(p).convert('RGB')) if os.path.exists(p) else None
        if len(cache)>400:cache.pop(next(iter(cache)))
    return cache[k]
def crop(x0,y0,x1,y1):
    """pixel window in global tile-grid pixels; x right, y down"""
    X0,X1=int(math.floor(x0)),int(math.ceil(x1));Y0,Y1=int(math.floor(y0)),int(math.ceil(y1))
    out=np.zeros((Y1-Y0,X1-X0,3),np.uint8);ok=np.ones((Y1-Y0,X1-X0),bool)
    for r in range(Y0//256,(Y1-1)//256+1):
        for c in range(X0//256,(X1-1)//256+1):
            t=tile(r,c);ya,xa=max(Y0,r*256),max(X0,c*256);yb,xb=min(Y1,r*256+256),min(X1,c*256+256)
            if t is None:ok[ya-Y0:yb-Y0,xa-X0:xb-X0]=False;continue
            out[ya-Y0:yb-Y0,xa-X0:xb-X0]=t[ya-r*256:yb-r*256,xa-c*256:xb-c*256]
    return out,ok,X0,Y0
def classify(rgb,spread):
    r,g,b=[v/255 for v in rgb];h,s,v=colorsys.rgb_to_hsv(r,g,b);h*=360
    lum=.299*rgb[0]+.587*rgb[1]+.114*rgb[2]
    if (h<40 or h>300) and s>.18 and v>.28:return 'clay tile',min(1,(s-.08)/.25)
    if 40<=h<75 and s>.3:return 'clay tile',.4          # ochre/brown, weathered tile or rust sheet
    if 75<=h<=270 and s>.25:return 'standing seam',min(1,(s-.1)/.3)*.8   # painted green/blue metal
    if lum<100:return 'bitumen',min(1,(115-lum)/30)
    if lum>150:return 'corrugated',min(1,(lum-135)/35)*(.3 if 25<h<75 and s>.1 else 1)   # warm light = bare ground / sand, not a roof
    return 'asbestos',min(1,.9-abs(lum-125)/50)
res={};recs=[];raw=[]
for o in fp:
    xy=np.array([T.transform(lo,la) for la,lo in o['pts']])
    px=np.c_[(xy[:,0]-OX)/RES,(OY-xy[:,1])/RES]
    poly=Polygon(px)
    if not poly.is_valid:poly=poly.buffer(0)
    if poly.is_empty or poly.area<1:continue
    er=poly.buffer(-1.0/RES)                       # 1 m erosion
    if er.is_empty or er.area<20:er=poly.buffer(-.4/RES)
    if er.is_empty:er=poly
    if er.geom_type!='Polygon':er=max(er.geoms,key=lambda g:g.area)
    x0,y0,x1,y1=er.bounds
    if x1-x0>1500 or y1-y0>1500:continue
    img,ok,X0,Y0=crop(x0-1,y0-1,x1+1,y1+1)
    m=Image.new('L',(img.shape[1],img.shape[0]),0)
    ImageDraw.Draw(m).polygon([(a-X0,b-Y0) for a,b in er.exterior.coords],fill=1)
    m=np.asarray(m,bool)&ok
    if m.sum()<4:continue
    px_=img[m].astype(float);lum=px_@[.299,.587,.114]
    mx=px_.max(1);mn=px_.min(1)
    green=(px_[:,1]>px_[:,0]+6)&(px_[:,1]>=px_[:,2]+6)&((mx-mn)/(mx+1)>.12)   # vegetation, not green roofs (those read blue-green)
    keep=(lum>55)&~green
    n0=len(px_)
    if keep.sum()<.3*n0 or keep.sum()<4:keep=lum>40
    k=px_[keep]
    if len(k)<4:continue
    kl=k@[.299,.587,.114];k=k[kl>=np.percentile(kl,40)]   # sunlit slope only: the shaded one is blue-shifted and dark
    med=np.median(k,0);spread=float(np.std(k@[.299,.587,.114]))
    raw.append((o['id'],px,er,med,spread,len(k),keep.sum()/n0))
# the orthophoto has a blue cast; neutralise with the town-wide median roof colour (gray-world)
allm=np.array([r[3] for r in raw]);gain=allm.mean()/np.median(allm,0);print('gain',gain.round(3))
for id_,px,er,med,spread,n,frac in raw:
    med=np.clip(med*gain,0,255)
    sty,margin=classify(med,spread)
    conf=min(1,n/120)*(1-min(spread/45,1)*.6)*(.5+.5*frac)*(.35+.65*margin)
    res[id_]={'rgb':[int(round(v)) for v in med],'sty':sty,'conf':round(float(conf),2)}
    recs.append((id_,px,er,conf,sty,med,n,None))
json.dump(res,open('roofs.json','w'))
print(len(fp),'footprints',len(res),'sampled')
import collections
print(collections.Counter(v['sty'] for v in res.values()))
for th in (.3,.5,.7):print('conf>=',th,sum(v['conf']>=th for v in res.values()))
areas={r[0]:r[2].area*RES*RES for r in recs}
print('conf>=.5 and eroded area>=12 m2:',sum(1 for r in recs if r[3]>=.5 and areas[r[0]]>=12))
# contact sheet: stratified 10 per style
random.seed(3);pick=[]
for s in ['clay tile','asbestos','bitumen','corrugated','standing seam']:
    c=[r for r in recs if r[4]==s and r[6]>150];random.shuffle(c);pick+=c[:10]
pick=pick[:50]
CS=128;sheet=Image.new('RGB',(10*CS,5*(CS+22)),(24,24,24));d=ImageDraw.Draw(sheet)
for i,(id_,px,er,conf,sty,med,n,_) in enumerate(pick):
    x0,y0,x1,y1=px[:,0].min(),px[:,1].min(),px[:,0].max(),px[:,1].max()
    cx,cy=(x0+x1)/2,(y0+y1)/2;half=max(x1-x0,y1-y0)/2+10
    img,ok,X0,Y0=crop(cx-half,cy-half,cx+half,cy+half)
    im=Image.fromarray(img).resize((CS,CS),Image.LANCZOS);sc=CS/img.shape[1];dd=ImageDraw.Draw(im)
    dd.polygon([((a-X0)*sc,(b-Y0)*sc) for a,b in px],outline=(255,255,0))
    gx,gy=(i%10)*CS,(i//10)*(CS+22);sheet.paste(im,(gx,gy))
    d.rectangle([gx,gy+CS,gx+40,gy+CS+21],fill=tuple(int(v) for v in med))
    d.text((gx+44,gy+CS+2),'%s'%sty[:9],fill=(230,230,230));d.text((gx+44,gy+CS+11),'%s c%.2f'%(id_,conf),fill=(150,150,150))
sheet.save('roofs_sheet.png');print('sheet',len(pick))
