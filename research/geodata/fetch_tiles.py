import json,os,sys,urllib.request,concurrent.futures as cf
from pyproj import Transformer
L=11;RES=0.26458386250105836;S=256*RES
B='https://www.geoportal.lt/arcgis/rest/services/NZT/ORT10LT_2024_2026/MapServer/tile/%d/%d/%d'
fp=json.load(open('footprints.json'))
t=Transformer.from_crs(4326,3346,always_xy=True)
xs=[];ys=[]
for o in fp:
    for la,lo in o['pts']:
        x,y=t.transform(lo,la);xs.append(x);ys.append(y)
m=60
c0=int((min(xs)-m+5122000)/S);c1=int((max(xs)+m+5122000)/S)
r0=int((10000100-max(ys)-m)/S);r1=int((10000100-min(ys)+m)/S)
print(r0,r1,c0,c1,(r1-r0+1)*(c1-c0+1),'tiles')
os.makedirs('ortho/tiles',exist_ok=True)
def get(rc):
    r,c=rc;p='ortho/tiles/%d_%d.jpg'%(r,c)
    if os.path.exists(p):return 0
    for _ in range(3):
        try:
            d=urllib.request.urlopen(urllib.request.Request(B%(L,r,c),headers={'User-Agent':'raseiniai-streets-research/1.0'}),timeout=30).read();open(p,'wb').write(d);return len(d)
        except Exception as e:err=e
    print('fail',r,c,err);return 0
with cf.ThreadPoolExecutor(4) as ex:
    tot=sum(ex.map(get,[(r,c) for r in range(r0,r1+1) for c in range(c0,c1+1)]))
json.dump({'L':L,'r0':r0,'r1':r1,'c0':c0,'c1':c1,'res':RES},open('ortho/meta.json','w'))
print(tot/1e6,'MB')
