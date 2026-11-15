import json,math,sys
from houses import *
D=json.load(open('dump.json'))
FR={'c2462':0,'c2463':1,'c2465':1,'c2514':0,'c2515':1,'c2022':3,'c2026':3,'c2019':3,'c2910':2,'c2914':1,'c2908':1,'c1417':1,'c7170':1,'c2466':0,'c2464':7,'c2027':2,'c2186':0,'c2915':3,'c2911':4,'c2913':6,'c2941':3,'c1418':1,'c1419':1,'c2916':None}
def style(h):
    return {1.25:'picket',1.45:'mesh',1.8:'wall'}.get(round(h,2),'hedge')
def chain(i):
    e=FR.get(i)
    P=[xz(*q) for q in fp[i]['pts']]
    a=P[e];b=P[(e+1)%len(P)];L=math.hypot(b[0]-a[0],b[1]-a[1]);ux=(b[0]-a[0])/L;uz=(b[1]-a[1])/L
    # outward normal = toward road: pick sign by centroid
    c=cen(i);nx,nz=uz,-ux
    if (a[0]-c[0])*nx+(a[1]-c[1])*nz<0:nx,nz=-nx,-nz
    out=[]
    for s in D['segs']:
        mx=(s[0]+s[2])/2;mz=(s[1]+s[3])/2
        t=(mx-a[0])*ux+(mz-a[1])*uz;d=(mx-a[0])*nx+(mz-a[1])*nz
        if -2<t<L+2 and 1.5<d<12: out.append((round(t,1),round(d,1),s[:4],style(s[4]) if len(s)>4 else '?',s[4] if len(s)>4 else 0))
    return L,(a,b),(nx,nz),sorted(out)
if __name__=='__main__':
    for i in sys.argv[1:]:
        L,ab,n,o=chain(i);print(i,'frontlen',round(L,1),'n',len(o))
        sty={};
        for t,d,s,st,h in o: sty.setdefault((st,round(h,2)),[]).append((t,d))
        for k,v in sty.items(): print('  ',k,'t',v[0][0],'..',v[-1][0],'d',v[0][1],v[-1][1],len(v))
