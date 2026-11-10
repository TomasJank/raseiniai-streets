import re,json,sys
h=open('work/build/v37.html',encoding='utf8').read()
m=re.search(r'<script type="application/json" id="rasData">(.*?)</script>',h,re.S)
d=json.loads(m.group(1));n=d['n']
out=[]
for i,w in enumerate(d['w']):
    t=d['t'][w[0]]
    if not t.get('building') or t['building']=='no':continue
    refs=w[1:]
    if len(refs)<4 or refs[0]!=refs[-1]:continue
    pts=[[d['lat0']+n[2*k]/1e6,d['lon0']+n[2*k+1]/1e6] for k in refs[:-1]]
    out.append({'id':'c%d'%i,'tags':t,'pts':pts})
json.dump(out,open('research/geodata/footprints.json','w'))
lats=[p[0] for o in out for p in o['pts']];lons=[p[1] for o in out for p in o['pts']]
print(len(out),min(lats),max(lats),min(lons),max(lons))
