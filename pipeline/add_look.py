"""Cheap realism: firmer sun and haze, varied grass, lumpy tree crowns, glass that mirrors the sky, wall grime.

All shader edits chain after the page's own onBeforeCompile hooks. Lighting is set in updateEnv, which resets it every frame.
usage: add_look.py page.html   (edits in place; run after add_more.py)
"""
import sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()


def rep(old, new, n=1):
    global h
    c = h.count(old)
    if c != n:
        raise SystemExit(f'expected {n} of {old[:70]!r}, found {c}')
    h = h.replace(old, new)

NOISE = "float fh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float fn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(fh(i),fh(i+vec2(1,0)),f.x),mix(fh(i+vec2(0,1)),fh(i+vec2(1,1)),f.x),f.y);}"

# light lives in updateEnv, which resets it every frame
rep("hemi.intensity=(.46+.36*day)", "hemi.intensity=(.46+.18*day)")
rep("sun.intensity=Math.max(.22,.92*day*(1-.6*w))", "sun.intensity=Math.max(.22,1.18*day*(1-.6*w))")
rep("scene.fog.far=1300-w*800-night*300;scene.fog.near=Math.min(260,scene.fog.far*.2);",
    "scene.fog.far=950-w*500-night*200;scene.fog.near=Math.min(70,scene.fog.far*.1);")
rep("sun.position.set(player.x+70,gp+130,player.z+45)", "sun.position.set(player.x+105,gp+85,player.z+65)")

# olive grass with big dry and lush patches
rep("const gMat=new THREE.MeshLambertMaterial({color:0x6d8150});gMat.onBeforeCompile=grainShader;",
    "const gMat=new THREE.MeshLambertMaterial({color:0x5f7246});gMat.onBeforeCompile=sh=>{grainShader(sh);"
    "sh.fragmentShader=sh.fragmentShader.replace('diffuseColor.rgb*=.86','float m1=gn(vWXZ*.013),m2=gn(vWXZ*.045+7.),m3=gn(vWXZ*.31);"
    "diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.50,.50,.32),smoothstep(.5,.8,m1)*.55);"
    "diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.30,.38,.20),smoothstep(.45,.75,m2)*.5);"
    "diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.38,.28),smoothstep(.78,.95,m3)*.6);diffuseColor.rgb*=.86');};")

# glass mirrors a sky gradient by fresnel; plaster gets faint vertical grime and a slow per-wall tone drift
rep("bMat.onBeforeCompile=facadeShader;",
    "bMat.onBeforeCompile=sh=>{facadeShader(sh);"
    "sh.vertexShader=sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\\nvWP=(modelMatrix*vec4(position,1.)).xyz;vWN=normalize(mat3(modelMatrix)*normal);').replace('#include <common>','#include <common>\\nvarying vec3 vWP,vWN;');"
    "sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\\nvarying vec3 vWP,vWN;float gM=0.;" + NOISE + "')"
    ".replace('diffuseColor.rgb=mix(diffuseColor.rgb*tx.rgb','gM=tx.a*step(tx.r+.04,tx.b)*step(max(tx.r,max(tx.g,tx.b)),.45);"
    "float sx=dot(vWP.xz,vec2(vWN.z,-vWN.x)),gr=fn(vec2(sx*2.3,vWP.y*.12))*fn(vec2(sx*.4,vWP.y*.5));"
    "diffuseColor.rgb*=(1.-.25*gr)*(.9+.2*fn(vWP.xz*.05));diffuseColor.rgb=mix(diffuseColor.rgb*tx.rgb')"
    ".replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );','vec3 vd=normalize(vWP-cameraPosition),nn=normalize(vWN),rd=reflect(vd,nn);"
    "float fr=.06+.6*pow(1.-max(0.,dot(-vd,nn)),4.);"
    "vec3 sk=.8*mix(vec3(.30,.33,.32),mix(vec3(.62,.70,.77),vec3(.36,.50,.68),clamp(rd.y*2.,0.,1.)),smoothstep(-.05,.12,rd.y));"
    "outgoingLight=mix(outgoingLight,sk,gM*fr);gl_FragColor = vec4( outgoingLight, diffuseColor.a );');};")

# lumpy crowns: 7 lobes pushed out of a sphere, darker underneath and inside, faceted leaf-clump noise
rep("leafG=new THREE.IcosahedronGeometry(1,1)",
    "leafG=(()=>{const g=new THREE.IcosahedronGeometry(1,3),p=g.attributes.position,v=new THREE.Vector3(),L=[];"
    "for(let i=0;i<7;i++){const a=i*2.4,y=i/6*1.4-.5,r=Math.sqrt(1-y*y*.6);L.push(new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r).normalize());}"
    "for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).normalize();let s=.72;for(const l of L)s+=.42*Math.pow(Math.max(0,v.dot(l)),6);s+=.06*Math.sin(v.x*17+v.y*11)*Math.sin(v.z*13);v.multiplyScalar(s);p.setXYZ(i,v.x,v.y,v.z);}"
    "g.computeVertexNormals();return g;})()")
rep("const leafM=new THREE.MeshLambertMaterial(),",
    "const leafM=new THREE.MeshLambertMaterial();{const prev=leafM.onBeforeCompile;leafM.onBeforeCompile=sh=>{prev.call(leafM,sh);"
    "sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\\nvarying vec3 vLp;').replace('#include <begin_vertex>','#include <begin_vertex>\\nvLp=position;');"
    "sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\\nvarying vec3 vLp;float lh(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7)))*43758.5);}')"
    ".replace('#include <color_fragment>','#include <color_fragment>\\ndiffuseColor.rgb*=(.55+.45*smoothstep(-1.,.9,vLp.y))*(.8+.35*lh(floor(vLp*9.)));');};}const ")

open(path, 'w', encoding='utf-8').write(h)
print('look ok')
