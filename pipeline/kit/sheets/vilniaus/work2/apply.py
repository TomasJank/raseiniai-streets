import json,math,os,sys,shutil
from houses import *
R='/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/'
FR={'c2462':0,'c2463':1,'c2465':1,'c2514':0,'c2515':1,'c2026':3,'c2019':3,'c2910':2,'c2914':1,'c2915':3,'c2911':4,'c2913':6}
def line(i,d,t0,t1):
    e=FR[i];P=[xz(*q) for q in fp[i]['pts']];a=P[e];b=P[(e+1)%len(P)];L=math.hypot(b[0]-a[0],b[1]-a[1])
    ux=(b[0]-a[0])/L;uz=(b[1]-a[1])/L;c=cen(i);nx,nz=uz,-ux
    if (a[0]-c[0])*nx+(a[1]-c[1])*nz<0:nx,nz=-nx,-nz
    t0=max(t0,-2);t1=min(t1,L+2)
    pt=lambda t:[round(v,7) for v in ll(a[0]+ux*t+nx*d,a[1]+uz*t+nz*d)]
    return [pt(t0),pt(t1)]
# id: (style,h,col,dense,d,t0,t1)
FENCES={
 'c2514':('hedge',1.7,'#1c2e1c',True,1.8,0,13.3),
 'c2462':('mesh',1.1,'#2e4a3a',False,5.4,0,12.6),
 'c2463':('mesh',1.05,'#2f4a38',False,1.4,0,10.2),
 'c2465':('picket',1.1,'#25262a',False,1.7,3,9.8),
 'c2515':('hedge',1.25,'#46562f',False,1.5,4,10.3),
 'c2026':('hedge',2.2,'#233f26',True,6.3,0,11.3),
 'c2910':('picket',1.2,'#25262a',False,1.8,0,11.3),
 'c2911':('hedge',1.6,'#2f4a2c',True,5.3,0,9.7),
 'c2914':('hedge',1.6,'#2a3f33',True,5.5,0,9.4),
 'c2915':('panel',1.5,'#2f6a5a',False,4.9,-1,6),
 'c2019':('hedge',1.1,'#3d5a2b',False,4.4,0,10.3),
}
def atomic(path,obj):
    tmp=path+'.tmp';json.dump(obj,open(tmp,'w'),indent=1,ensure_ascii=False);json.load(open(tmp));os.replace(tmp,path)
if __name__=='__main__':
    sp=R+'pipeline/streets/vilniaus.json';S=json.load(open(sp))
    mods=json.load(open('mods.json'))
    for i,m in mods.get('looks',{}).items():
        S['looks'][i].update(m)
    S['fences']=[]
    for i,(sty,h,col,dense,d,t0,t1) in FENCES.items():
        f={'style':sty,'ll':line(i,d,t0,t1),'h':h,'col':col}
        if dense:f['dense']=True
        S['fences'].append(f)
    atomic(sp,S)
    kp=R+'pipeline/kit/looks/vilniaus.json';K=json.load(open(kp))   # re-read: kit2 may have added keys
    for i,m in mods.get('kit',{}).items():
        K.setdefault(i,{}).update(m)
    atomic(kp,K)
    print('written',len(S['fences']),'fences',len(K),'kit houses')
