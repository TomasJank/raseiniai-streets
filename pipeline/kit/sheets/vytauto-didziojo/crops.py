S='/private/tmp/claude-501/-Users-tomasjankauskas-Desktop-Projects-career-ops/c0ac80b2-dcbf-40b0-aaed-cf3327c7950c/scratchpad/ras/agents/kit-vytauto'
import json,math,collections,os,sys,urllib.request,time
from PIL import Image,ImageDraw
lat0,lon0=55.377566,23.120015
kx=111320*math.cos(math.radians(55.38)); ky=110574
def xz(la,lo): return ((lo-lon0)*kx-0.6, -(la-lat0)*ky-18.2)
fp={o['id']:o for o in json.load(open('/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/research/geodata/footprints.json'))}
d=json.load(open(os.path.join(S,'cand.json')))
seqs=collections.defaultdict(list)
for r in d:
    g=(r.get('computed_geometry') or r['geometry'])['coordinates']
    r['x'],r['z']=xz(g[1],g[0])
    seqs[r['sequence']].append(r)
for l in seqs.values():
    l.sort(key=lambda r:r['captured_at'])
    for i,r in enumerate(l):
        j=i+1 if i+1<len(l) else i-1
        r['head']=None
        if j<0 or j==i: continue
        n=l[j]
        if abs(n['captured_at']-r['captured_at'])>4000: continue
        dx=n['x']-r['x'];dz=n['z']-r['z']
        if math.hypot(dx,dz)<2: continue
        if j<i: dx,dz=-dx,-dz
        r['head']=math.degrees(math.atan2(dx,-dz))%360
def cands(bid,dmin=7,dmax=48,amax=30):
    pts=[xz(*p) for p in fp[bid]['pts']]
    cx=sum(p[0] for p in pts)/len(pts);cz=sum(p[1] for p in pts)/len(pts)
    rad=max(math.hypot(p[0]-cx,p[1]-cz) for p in pts)
    out=[]
    for r in d:
        if r['head'] is None or not r.get('thumb_1024_url'): continue
        dx=cx-r['x'];dz=cz-r['z'];dist=math.hypot(dx,dz)
        if not(dmin<dist<dmax): continue
        br=math.degrees(math.atan2(dx,-dz))%360
        da=(br-r['head']+180)%360-180
        if abs(da)>amax: continue
        out.append((dist,da,r))
    return cx,cz,rad,out
def crop(bid,r,dist,da,rad,W=560):
    ph=Image.open(S+'/th/%s.jpg'%r['id']) if os.path.exists(S+'/th/%s.jpg'%r['id']) else None
    if ph is None:
        open(S+'/th/%s.jpg'%r['id'],'wb').write(urllib.request.urlopen(r['thumb_1024_url'],timeout=60).read());ph=Image.open(S+'/th/%s.jpg'%r['id'])
    w,h=ph.size;f=0.75*w
    cxp=w/2+f*math.tan(math.radians(da)); cyp=h/2-f*(2.5-1.4)/dist
    half=(rad+3)*f/dist
    box=(cxp-half*1.1,cyp-half*0.85,cxp+half*1.1,cyp+half*0.85)
    c=ph.crop(tuple(int(v) for v in box)).resize((W,int(W*(box[3]-box[1])/(box[2]-box[0]))))
    return c
if __name__=='__main__':
    ids=sys.argv[1:]
    for bid in ids:
        cx,cz,rad,cs=cands(bid)
        cs.sort(key=lambda t:t[0]+abs(t[1])*0.6)
        seen=set();pick=[]
        for dist,da,r in cs:
            if r['sequence'] in seen: continue
            seen.add(r['sequence']);pick.append((dist,da,r))
            if len(pick)==5:break
        if not pick: print(bid,'none');continue
        tiles=[]
        for dist,da,r in pick:
            c=crop(bid,r,dist,da,rad);dr=ImageDraw.Draw(c);dr.text((3,2),'%s d%d a%d %s'%(r['id'][-6:],dist,da,time.strftime('%y-%m',time.gmtime(r['captured_at']/1000))),fill=(255,255,0),stroke_width=2,stroke_fill=0);tiles.append(c)
        H=max(t.height for t in tiles);im=Image.new('RGB',(sum(t.width for t in tiles[:3]),H*((len(tiles)+2)//3)))
        for i,t in enumerate(tiles): im.paste(t,((i%3)*560,(i//3)*H))
        im.save(S+'/hc_%s.jpg'%bid,quality=85);print(bid,len(cs),len(pick))
