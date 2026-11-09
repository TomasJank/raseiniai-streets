import json,re,sys,math
from pyproj import Transformer
from shapely.geometry import LineString,Polygon
S=sys.argv[1]
def load(f):
    h=open(f,encoding='utf-8').read();return json.loads(re.search(r'id="rasData">(.*?)</script>',h,re.S).group(1))
o,p=load(f'{S}/game/index.html'),load(f'{S}/game/pilot.html')
tf=Transformer.from_crs(3346,4326,always_xy=True);ti=Transformer.from_crs(4326,3346,always_xy=True)
def xy(d,k):return ti.transform(d['lon0']+d['n'][2*k+1]/1e6,d['lat0']+d['n'][2*k]/1e6)
MAJOR={'motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','primary_link','secondary_link','tertiary_link'}
roads=[LineString([xy(o,k) for k in w[1:]]) for w in o['w'] if o['t'][w[0]].get('highway') in MAJOR and len(w)>2]
from shapely.strtree import STRtree
T=STRtree(roads)
def cross(d):
    b={}
    for i,w in enumerate(d['w']):
        if 'building' in d['t'][w[0]] and len(w)>4:
            pl=Polygon([xy(d,k) for k in w[1:]])
            if pl.is_valid and 444015<pl.centroid.x<444985 and 6138015<pl.centroid.y<6138985:
                b[i]=any(pl.intersects(roads[j]) for j in T.query(pl))
    return b
ob,pb=cross(o),cross(p)
print('buildings in tile old',len(ob),'crossing a road centreline',sum(ob.values()),'| new',len(pb),'crossing',sum(pb.values()),'of which newly crossing',sum(pb[i] and not ob.get(i,False) for i in pb))
c=(444433,6138368)
near=sorted(((math.dist(r.interpolate(r.project(__import__('shapely').Point(c))).coords[0],c),n) for n,r in enumerate(roads)))[:12]
views=[]
ll=lambda x,y:tf.transform(x,y)[::-1]
views.append(['aerial',ll(c[0],c[1]-95),ll(*c),85])
views.append(['top',ll(c[0],c[1]-1),ll(*c),210])
seen=0
for dist,n in near[:6]:
    r=roads[n]
    if r.length<60:continue
    a=r.interpolate(r.project(__import__('shapely').Point(c)));b=r.interpolate(min(r.length,r.project(a)+35))
    if a.distance(b)<10:b=r.interpolate(max(0,r.project(a)-35))
    views.append([f'street{seen}',ll(a.x,a.y),ll(b.x,b.y),2.0]);seen+=1
    if seen==3:break
json.dump(views,open(f'{S}/views.json','w'))
print(views)
