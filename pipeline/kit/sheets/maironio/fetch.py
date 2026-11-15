import json,math,urllib.request,sys,os
T=open(os.path.expanduser('~/.mapillary_token')).read().strip()
F='id,geometry,computed_geometry,compass_angle,computed_compass_angle,captured_at,thumb_1024_url,camera_type,sequence,creator'
pts=[(55.379412,23.115047),(55.379978,23.115808),(55.382931,23.121312),(55.384012,23.123443),(55.385302,23.124794),(55.386112,23.125842),(55.390649,23.130486),(55.392681,23.136452)]
kx=111320*math.cos(math.radians(55.38)); ky=110574
tiles=[]
for a,b in zip(pts,pts[1:]):
    L=math.hypot((b[0]-a[0])*ky,(b[1]-a[1])*kx); n=max(1,int(L/60))
    for i in range(n+1): tiles.append((a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n))
out={}
for i,(la,lo) in enumerate(tiles):
    dla=55/ky;dlo=55/kx
    url='https://graph.mapillary.com/images?access_token=%s&fields=%s&bbox=%f,%f,%f,%f&limit=2000'%(T,F,lo-dlo,la-dla,lo+dlo,la+dla)
    d=json.load(urllib.request.urlopen(url,timeout=120))['data']
    print(i,len(d),file=sys.stderr)
    for r in d: out[r['id']]=r
json.dump(list(out.values()),open('cand.json','w'))
print(len(out))
