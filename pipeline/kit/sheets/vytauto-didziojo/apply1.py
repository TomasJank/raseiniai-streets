# first pass of descriptions: rewrites looks and fences of pipeline/streets/vytauto-didziojo.json and the kit file (idempotent)
import json,math,os
R='/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/'
fp={o['id']:o for o in json.load(open(R+'research/geodata/footprints.json'))}
def edge(b,i):
    p=fp[b]['pts']
    if p[0]==p[-1]: p=p[:-1]
    return p[i],p[(i+1)%len(p)]
def offset_line(b,i,d,ext):
    a,c=edge(b,i)
    kx=63243;ky=110574
    dx=(c[1]-a[1])*kx;dz=(c[0]-a[0])*ky;L=math.hypot(dx,dz);ux,uz=dx/L,dz/L
    # outward normal: right-hand side of the walk direction for a clockwise outline, checked by the caller via sign
    nx,nz=uz,-ux
    return a,c,(ux,uz),(nx,nz),L
def line(b,i,d,ext,sign=1):
    a,c,(ux,uz),(nx,nz),L=offset_line(b,i,d,ext)
    nx,nz=nx*sign,nz*sign
    kx=63243;ky=110574
    def pt(p,t):
        return [round(p[0]+(uz*t+nz*d)/ky,7),round(p[1]+(ux*t+nx*d)/kx,7)]
    return [pt(a,-ext),pt(c,ext)]

def out_line(b,i,d,ext):
    p=fp[b]['pts']
    if p[0]==p[-1]: p=p[:-1]
    cy=sum(q[0] for q in p)/len(p);cx=sum(q[1] for q in p)/len(p)
    best=None
    for s in (1,-1):
        l=line(b,i,d,ext,s)
        m=((l[0][0]+l[1][0])/2-cy)**2*110574**2+((l[0][1]+l[1][1])/2-cx)**2*63243**2
        if best is None or m>best[0]: best=(m,l)
    return best[1]
def join(*ls):
    out=[]
    for l in ls:
        for q in l:
            if not out or q!=out[-1]: out.append(q)
    return out

S=R+'pipeline/streets/vytauto-didziojo.json'
K=R+'pipeline/kit/looks/vytauto-didziojo.json'
def save(path,obj):
    tmp=path+'.tmp';json.dump(obj,open(tmp,'w'),ensure_ascii=False,indent=1);json.load(open(tmp));os.replace(tmp,path)

L={
 'c3512':{"wall":[0.62,0.34,0.27],"wall2":[0.7,0.69,0.67],"band":3.3,"roof":[0.4,0.4,0.4],"sty":"plaster","windows":True,"pitched":False,"h":12.8,"balcony":True},
 'c3709':{"wall":[0.84,0.85,0.84],"roof":[0.5,0.28,0.22],"sty":"plaster","windows":True,"pitched":True,"hip":True,"h":10.5,"rh":1.8},
 'c3453':{"wall":[0.86,0.82,0.75],"roof":[0.38,0.39,0.4],"sty":"plaster","windows":True,"pitched":False,"h":15},
 'c3454':{"wall":[0.86,0.82,0.75],"roof":[0.38,0.39,0.4],"sty":"plaster","windows":True,"pitched":False,"h":15},
 'c3710':{"wall":[0.84,0.88,0.82],"roof":[0.62,0.3,0.2],"sty":"plaster","pitched":True,"hip":True,"h":7.6,"rh":2.6},
 'c3714':{"wall":[0.78,0.72,0.7],"roof":[0.55,0.28,0.2],"sty":"plaster","pitched":True,"hip":True,"h":7.2,"rh":2.4},
 'c3716':{"wall":[0.46,0.45,0.44],"roof":[0.6,0.28,0.18],"sty":"plaster","windows":True,"pitched":True,"hip":True,"h":10,"rh":3.6},
 'c3723':{"wall":[0.85,0.77,0.7],"roof":[0.55,0.26,0.2],"sty":"plaster","windows":True,"pitched":True,"hip":False,"h":8,"rh":3,"ridge":"across"},
 'c3451':{"wall":[0.88,0.87,0.83],"roof":[0.28,0.29,0.3],"sty":"wood","windows":True,"pitched":True,"hip":False,"h":3.4,"rh":3,"ridge":"across"},
 'c3519':{"wall":[0.56,0.42,0.26],"roof":[0.28,0.28,0.3],"sty":"wood","windows":True,"pitched":True,"hip":False,"h":6,"rh":3.2,"ridge":"across"},
 'c3446':{"wall":[0.42,0.38,0.33],"roof":[0.3,0.3,0.31],"sty":"wood","windows":True,"pitched":True,"hip":False,"h":5.8,"rh":3,"ridge":"across"},
 'c3475':{"wall":[0.86,0.86,0.84],"roof":[0.28,0.29,0.3],"sty":"wood","windows":True,"pitched":True,"hip":False,"h":3.2,"rh":3.2,"ridge":"across"},
 'c2923':{"wall":[0.9,0.88,0.82],"roof":[0.55,0.25,0.17],"sty":"plaster","windows":True,"pitched":True,"hip":True,"h":8,"rh":2.6},
 'c2919':{"wall":[0.84,0.74,0.52],"roof":[0.3,0.3,0.32],"sty":"plaster","windows":True,"pitched":True,"hip":True,"h":8,"rh":2.6},
}
if __name__=='__main__':
    s=json.load(open(R+'research/../pipeline/streets/vytauto-didziojo.json')) if False else json.load(open(os.environ['ORIG']))
    for k,v in L.items(): s['looks'][k]=v
    s['fences']=s['fences']+[
      {"style":"hedge","ll":out_line('c3451',2,5,3),"h":1.4,"dense":True,"col":"#3d5a2a"},
      {"style":"mesh","ll":join(out_line('c3716',3,1.6,0),out_line('c3716',0,1.6,0)),"h":1.5,"col":"#5d6064"},
    ]
    s['fences'][0].update({"h":1.4,"dense":True,"col":"#3d5a2a"})
    save(S,s)
    kit={"c3451":{"chim":[0.8]},"c3475":{"win":{"front":[2,1]}},"c3714":{"win":{"front":[5,5]}}}
    save(K,kit)
