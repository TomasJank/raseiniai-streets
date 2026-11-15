import json,math,urllib.request,sys,os
T=open(os.path.expanduser('~/.mapillary_token')).read().strip()
F='id,geometry,computed_geometry,compass_angle,computed_compass_angle,captured_at,thumb_1024_url,camera_type,sequence'
a=(55.3862,23.1260);b=(55.3797,23.1136)
out={}
n=14
for i in range(n+1):
    t=i/n;la=a[0]+(b[0]-a[0])*t;lo=a[1]+(b[1]-a[1])*t
    dla=65/110574;dlo=65/63243
    url='https://graph.mapillary.com/images?access_token=%s&fields=%s&bbox=%f,%f,%f,%f&limit=2000'%(T,F,lo-dlo,la-dla,lo+dlo,la+dla)
    d=json.load(urllib.request.urlopen(url,timeout=120))['data']
    print(i,len(d),file=sys.stderr)
    for r in d: out[r['id']]=r
json.dump(list(out.values()),open('cand.json','w'))
print(len(out))
