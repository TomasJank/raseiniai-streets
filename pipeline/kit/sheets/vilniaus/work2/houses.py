import json,math
lat0,lon0=55.377566,23.120015
kx=111320*math.cos(math.radians(55.38)); ky=110574
def xz(la,lo): return ((lo-lon0)*kx-0.6, -(la-lat0)*ky-18.2)
def ll(x,z): return (-(z+18.2)/ky+lat0, (x+0.6)/kx+lon0)
fp={o['id']:o for o in json.load(open('/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/research/geodata/footprints.json'))}
st=json.load(open('/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/pipeline/streets/vilniaus.json'))
def cen(i):
    p=[xz(*q) for q in fp[i]['pts']];return sum(a for a,b in p)/len(p),sum(b for a,b in p)/len(p)
if __name__=='__main__':
    D=json.load(open('dump.json'))
    for i in st['looks']:
        c=cen(i)
        near=[s for s in D['segs'] if min(math.hypot(s[0]-c[0],s[1]-c[1]),math.hypot(s[2]-c[0],s[3]-c[1]))<22]
        print(i,[round(v) for v in c],len(near),[(round(s[0]),round(s[1]),round(s[2]),round(s[3]),s[4] if len(s)>4 else '') for s in near[:6]])
