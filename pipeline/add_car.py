"""Rework the Audi 80 B3 model. usage: add_car.py page.html  (edits in place)"""
import sys
p = sys.argv[1]
h = open(p, encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("const[l,col]=pick(i,j),A=st[i][j]", "const pk=pick(i,j);if(!pk)continue;const[l,col]=pk,A=st[i][j]")
rep("const LOWER=[[2.2,.72,.3,.66,.72],[2.14,.8,.24,.69,.75],[1.9,.84,.21,.74,.8],[1.33,.85,.2,.83,.89],[1.02,.85,.2,.87,.93],[.6,.85,.2,.9,.96],[0,.85,.2,.93,.98],[-.6,.85,.2,.95,1],[-1.22,.85,.2,.97,1.02],[-1.45,.85,.2,.975,1.03],[-1.9,.84,.22,.985,1.04],[-2.1,.82,.26,.985,1.04],[-2.2,.74,.3,.93,1]];",
    "const LOWER=[[2.2,.76,.3,.68,.72],[2.14,.82,.25,.7,.74],[1.9,.85,.22,.74,.78],[1.715,.85,.22,.765,.805],[1.33,.85,.22,.81,.85],[.945,.85,.22,.855,.895],[.6,.85,.22,.89,.93],[0,.85,.22,.92,.96],[-.6,.85,.22,.94,.98],[-.835,.85,.22,.945,.985],[-1.22,.85,.22,.96,1],[-1.45,.85,.22,.965,1.005],[-1.605,.85,.22,.968,1.008],[-1.9,.84,.22,.975,1.015],[-2.1,.82,.26,.975,1.015],[-2.2,.74,.3,.93,.99]];\n  const ARCH=.385;")
rep("const sect=([z,w,b,s,t])=>[[0,b,z],[w*.86,b,z],[w*.98,b+.12,z],[w,b+(s-b)*.55,z],[w*.97,s-.04,z],[w*.84,s+(t-s)*.6,z],[w*.42,t-.005,z],[0,t,z]];",
    "const sect=([z,w,b,s,t])=>[[0,b,z],[w*.86,b,z],[w*.98,b+.1,z],[w,b+(s-b)*.55,z],[w*.995,s-.03,z],[w*.96,s,z],[w*.86,t-.008,z],[w*.45,t-.001,z],[0,t,z]];")
rep("loft(lowerSt,(i,j)=>j<2?[trim,PLASTIC]:[paint,PAINT]);",
    "loft(lowerSt,(i,j)=>{const z=(lowerSt[i][0][2]+lowerSt[i+1][0][2])/2;if(j>=1&&j<=3&&AXLES.some(a=>Math.abs(z-a)<ARCH))return null;return j<2?[trim,PLASTIC]:[paint,PAINT];});")
rep("""  quad(trim,[-.335,.55,2.206],[.335,.55,2.206],[.335,.685,2.206],[-.335,.685,2.206],[0,0,1],BLACK,false);""",
    """  quad(trim,[-.335,.555,2.206],[.335,.555,2.206],[.335,.69,2.206],[-.335,.69,2.206],[0,0,1],BLACK,false);""")
rep("""  quad(head,[.34,.555,2.212],[.725,.555,2.212],[.725,.63,2.212],[.34,.68,2.212],[0,0,1],LAMP);
  quad(head,[.725,.555,2.212],[.812,.555,2.142],[.812,.615,2.142],[.725,.63,2.212],[.55,0,.83],AMBER);""",
    """  quad(trim,[.34,.55,2.208],[.735,.55,2.208],[.735,.695,2.208],[.34,.695,2.208],[0,0,1],BLACK);
  quad(head,[.35,.562,2.212],[.585,.562,2.212],[.585,.683,2.212],[.35,.683,2.212],[0,0,1],[.95,.96,.9]);
  quad(head,[.595,.562,2.212],[.725,.562,2.212],[.725,.683,2.212],[.595,.683,2.212],[0,0,1],[.8,.85,.85]);
  quad(head,[.735,.562,2.21],[.805,.562,2.15],[.805,.67,2.15],[.735,.683,2.21],[.65,0,.76],[.93,.6,.28]);""")
rep("const FR=[[0,2.25],[.7,2.24],[.79,2.19],[.83,2.1],[.858,1.71]],", "const FR=[[0,2.25],[.72,2.24],[.81,2.19],[.858,2.1],[.868,1.9],[.868,1.715]],")
rep("quad(trim,[.858,.46,1.03],[.858,.46,-.92],[.858,.56,-.92],[.858,.56,1.03],side,PLASTIC);",
    "quad(trim,[.858,.46,.94],[.858,.46,-.83],[.858,.56,-.83],[.858,.56,.94],side,PLASTIC);")
rep("[[.72,.33],[-.17,.33],[-1.1,.655]]", "[[.72,.33],[-.17,.33],[-1.1,.68]]")
rep("""  // arches are painted on, the panels aren't cut
  for(const z of AXLES)for(let i=0;i<16;i++){const a=i/16*TAU,b=(i+1)/16*TAU,r=.36,cl=y=>Math.max(y,.2);
    quad(trim,[.853,cl(.3),z],[.853,cl(.3+Math.cos(a)*r),z+Math.sin(a)*r],[.853,cl(.3+Math.cos(b)*r),z+Math.sin(b)*r],[.853,cl(.3),z],side,BLACK);}
""", """  // arches are cut through the side panel; the dark well behind hides the hollow body
  const at=z=>{for(let i=0;i<LOWER.length-1;i++){const a=LOWER[i],b=LOWER[i+1];if(z<=a[0]&&z>=b[0]){const t=(a[0]-z)/(a[0]-b[0]);return[a[1]+(b[1]-a[1])*t,a[3]+(b[3]-a[3])*t];}}return[LOWER[0][1],LOWER[0][3]];};
  for(const az of AXLES){
    const n=20,col=i=>{const th=-Math.PI/2+i/n*Math.PI;return[az+Math.sin(th)*ARCH,WHEEL_R+Math.cos(th)*ARCH,Math.sin(th),Math.cos(th)];};
    for(let i=0;i<n;i++){
      const[z0,y0,s0,c0]=col(i),[z1,y1,s1,c1]=col(i+1),[w0,t0]=at(z0),[w1,t1]=at(z1);
      quad(paint,[w0,y0,z0],[w1,y1,z1],[w1*.995,t1-.03,z1],[w0*.995,t0-.03,z0],side);
      quad(trim,[.6,y0,z0],[.6,y1,z1],[w1,y1,z1],[w0,y0,z0],[0,-(c0+c1)/2,-(s0+s1)/2],BLACK);
      quad(trim,[.6,y0,z0],[.6,y1,z1],[.6,WHEEL_R,z1],[.6,WHEEL_R,z0],side,BLACK);
    }
    for(const k of[1,-1])quad(trim,[.6,.22,az+k*ARCH],[.85,.22,az+k*ARCH],[.85,WHEEL_R,az+k*ARCH],[.6,WHEEL_R,az+k*ARCH],[0,0,-k],BLACK);
    quad(trim,[.6,.22,az-ARCH],[.6,.22,az+ARCH],[.6,WHEEL_R,az+ARCH],[.6,WHEEL_R,az-ARCH],side,BLACK);
  }
""")
rep("""  const N=20,R=WHEEL_R;""", """  const N=32,R=WHEEL_R;""")
rep("""    ann(.1,R,.195,[.05,.05,.055]);""", """    ann(.1,R,.215,[.045,.045,.05]);""")
rep("""    ann(.102,.195,.15,i%2?[.82,.82,.8]:[.4,.4,.41]);
    ann(.103,.15,.001,[.88,.88,.85]);
    if(i%5===0)ann(.105,.125,.07,[.28,.28,.3]);
    ann(.106,.035,.001,[.6,.61,.62]);""", """    ann(.102,.215,.2,[.52,.53,.54]);
    ann(.104,.2,.17,[.8,.8,.77]);
    ann(.106,.17,.04,i%8===0?[.62,.62,.6]:[.9,.9,.87]);
    ann(.108,.04,.001,[.6,.61,.62]);""")
rep("""  for(const[k,l]of Object.entries({paint,trim,head,tail,wheel})){
    const g=new THREE.BufferGeometry();""", """  // glass darkens towards the door and picks up the sky higher up
  for(let i=0;i<trim.c.length;i+=3)if(trim.c[i]===GLASS[0]&&trim.c[i+1]===GLASS[1]&&trim.c[i+2]===GLASS[2]){
    const k=clamp((trim.p[i+1]-.95)/.45,0,1);trim.c[i]=.09+k*.33;trim.c[i+1]=.12+k*.38;trim.c[i+2]=.15+k*.41;}
  for(const[k,l]of Object.entries({paint,trim,head,tail,wheel})){
    const g=new THREE.BufferGeometry();""")
rep("m=carMats[color]=new THREE.MeshLambertMaterial({color});", "m=carMats[color]=new THREE.MeshPhongMaterial({color,specular:0x383838,shininess:60});")
rep("for(const x of[-.78,.78]){const w=new THREE.Mesh(carGeo.wheel,trimM);", "for(const x of[-.74,.74]){const w=new THREE.Mesh(carGeo.wheel,trimM);")
rep("const mine=newCar(sx,sz,sh,0xf2b705);", "const mine=newCar(sx,sz,sh,0x74767a);")
open(p, 'w', encoding='utf-8').write(h)
print('car ok')
