// Ground colours from pipeline/geo/ground_map.py: ORT10LT (c) Nacionalinė žemės tarnyba, 2024 and GRPK (c) Lietuvos Respublikos aplinkos ministerija, CC BY 4.0.
// groundIn covers the orthophoto square, groundOut the whole ground plane; pixel (0,0) is world (-E,-E).
const GMAP={U:{uGI:{value:null},uGO:{value:null},uGOn:{value:0},uGN:{value:4096}},left:2};
GMAP.U.uGI.value=gmapTex('groundIn',PHONE?2048:4096);GMAP.U.uGO.value=gmapTex('groundOut',1024);
function gmapTex(id,max){
  const t=new THREE.Texture(),im=new Image(),el=document.getElementById(id);
  t.flipY=false;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  if(!el)return t;
  im.onload=()=>{max=Math.min(max,renderer.capabilities.maxTextureSize);let s=im;
    // nearest, not smoothed: averaging would turn two class codes in alpha into a third
    if(im.width>max){s=document.createElement('canvas');s.width=s.height=max;const g=s.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,0,0,max,max);}
    t.image=s;t.needsUpdate=true;if(id==='groundIn')GMAP.U.uGN.value=s.width;if(!--GMAP.left){GMAP.U.uGOn.value=1;if(grass)grass.cx=1e9;}};
  im.src='data:image/webp;base64,'+el.textContent;return t;
}
// Up close the 1.25 m map would blur every class edge over metres. In town the alpha channel holds the surface class (255-16k), so the shader
// takes the class of the nearest texel, its grid wobbled by noise so edges are neither staircase nor blur, and paints the palette colour,
// keeping only the map's +-10% light and dark. Elsewhere, where neighbouring texels differ a lot, the nearest texel's colour is used.
const GMAP_GLSL=`uniform sampler2D uGI,uGO;uniform float uGOn,uGN;
const vec3 GT[5]=vec3[](${GMAP_TOWN});
float gmh(vec2 p){p=mod(p,512.);return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float gmn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gmh(i),gmh(i+vec2(1,0)),f.x),mix(gmh(i+vec2(0,1)),gmh(i+vec2(1,1)),f.x),f.y);}
vec3 gmap(vec2 p){vec2 ui=(p+${GMAP_IN_E}.)/${2*GMAP_IN_E}.,e=min(ui,1.-ui),dx=dFdx(ui),dy=dFdy(ui);
  vec2 j=vec2(gmn(p*.6),gmn(p*.6+17.))-.5+.45*(vec2(gmn(p*2.1+3.),gmn(p*2.1+41.))-.5);
  vec3 cl=texture2D(uGI,ui).rgb;vec4 cn=textureGrad(uGI,(floor(ui*uGN+j*1.3)+.5)/uGN,dx,dy);
  float k=floor((1.-cn.a)*16.+.5);vec3 c;
  if(k>.5&&k<5.5){vec3 P=GT[int(k)-1];c=P*clamp(dot(cl,vec3(.3,.59,.11))/dot(P,vec3(.3,.59,.11)),.9,1.1);}
  else c=mix(cl,cn.rgb,smoothstep(.02,.05,distance(cl,cn.rgb)));
  c=mix(cl,c,1.-smoothstep(.4,1.2,max(length(dx),length(dy))*uGN));
  return mix(texture2D(uGO,(p+${GMAP_OUT_E}.)/${2*GMAP_OUT_E}.).rgb,c,smoothstep(0.,.008,min(e.x,e.y)));}
float gmapGrass(vec3 c){return step(max(c.r,c.b)+.012,c.g);}`;
// the ground, and the OSM green sheets over it, take their colour from the map; the sheets keep their geometry so the layering fix still holds
function groundInstall(){
  const ground=worldGroup.children.find(o=>o.isMesh&&o.userData.grass&&o.geometry.parameters);if(!ground)return;
  const m=ground.material,o=m.onBeforeCompile;
  m.color.set(0xffffff);
  m.onBeforeCompile=sh=>{o(sh);Object.assign(sh.uniforms,GMAP.U);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+GMAP_GLSL)
      .replace('diffuseColor.rgb*=.86+','diffuseColor.rgb=mix(diffuseColor.rgb,gmap(vWXZ)*(.94+.12*gn(vWXZ*.9)),uGOn);diffuseColor.rgb*=.86+');};
  m.needsUpdate=true;
  for(const s of worldGroup.children)if(s!==ground&&s.isMesh&&s.userData.grass)s.material=m;
}
{const b=buildGrass;buildGrass=function(){b();
  // blades only where the map is grass: not on soil, gravel, paving or field earth
  grass.hm=new THREE.ShaderMaterial({uniforms:Object.assign({uG:{value:1}},GMAP.U),side:THREE.DoubleSide,
    vertexShader:'varying float vY;varying vec2 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vY=w.y;vP=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:GMAP_GLSL+'\nuniform float uG;varying float vY;varying vec2 vP;void main(){gl_FragColor=vec4(vY,uG*mix(1.,gmapGrass(gmap(vP)),uGOn),0.,1.);}'});};}
