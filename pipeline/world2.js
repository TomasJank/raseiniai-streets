// ---------- weather by rules: humidity and cloud drift slowly, rain needs both, below freezing it snows ----------
// mean monthly temperature for Raseiniai, °C; the day swings 4° either side, warmest at 15:00
const MONTH_T=[-4,-4,0,7,13,16,18,17,12,7,2,-2];
let wxT=Math.random()*5000;
const wn=x=>Math.sin(x)*Math.sin(x*1.678)*Math.sin(x*2.345);
function wxRules(dt){
  wxT+=dt;
  weather.hum=clamp(.55+.5*wn(wxT/260+1.3),0,1);weather.cl=clamp(.5+.6*wn(wxT/190+4.1),0,1);
  weather.temp=MONTH_T[new Date().getMonth()]+4*Math.sin((tod-9)/24*TAU)+3*wn(wxT/400+7);
  if((weather.force=(weather.force||0)-dt)>0)return;
  const p=smooth(.62,.82,weather.hum)*smooth(.3,.6,weather.cl),kind=weather.temp<.5?'snow':'rain';
  if(p<.12){weather.want=0;return;}
  if(weather.kind!=='clear'&&weather.kind!==kind){weather.want=0;return;}
  weather.kind=kind;weather.want=clamp(p*1.3,.25,1);
}

// ---------- grass blades around the camera ----------
// one mesh of blades that wraps around the camera in the vertex shader; a top-down render of the ground nearby
// tells each blade how high the ground is and whether it is grass; tyres flatten it for a while
const GR_R=44,GR_N=60000,GR_S=140,GR_PX=448,GR_TR=48;
let grass=null,grassOn=true,trailLast=[null,null],trailI=0;
function buildGrass(){
  const pos=new Float32Array(GR_N*9),bs=new Float32Array(GR_N*3),br=new Float32Array(GR_N*3);
  for(let i=0;i<GR_N;i++){const x=(Math.random()*2-1)*GR_R,z=(Math.random()*2-1)*GR_R,r=Math.random();
    for(let k=0;k<3;k++){pos[i*9+k*3]=x;pos[i*9+k*3+2]=z;bs[i*3+k]=k-1;br[i*3+k]=r;}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('bs',new THREE.BufferAttribute(bs,1));g.setAttribute('br',new THREE.BufferAttribute(br,1));
  const rt=new THREE.WebGLRenderTarget(GR_PX,GR_PX,{type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
  const U={uHM:{value:rt.texture},uC:{value:new THREE.Vector2(1e6,1e6)},uCam:{value:new THREE.Vector2()},uT:ENV.t,uSnow:ENV.snow,uWind:{value:.4},
    uTrail:{value:Array.from({length:GR_TR},()=>new THREE.Vector3())}};
  const R=GR_R.toFixed(1),R2=(GR_R*2).toFixed(1),RF=(GR_R*.55).toFixed(1),S=GR_S.toFixed(1);
  const m=new THREE.MeshLambertMaterial({color:0x6b7f4e,side:THREE.DoubleSide});m.userData.keep=true;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>',`#include <common>
attribute float bs;attribute float br;uniform sampler2D uHM;uniform vec2 uC,uCam;uniform float uT,uSnow,uWind;uniform vec3 uTrail[${GR_TR}];varying float vTip;`)
    .replace('#include <beginnormal_vertex>','vec3 objectNormal=vec3(0.,1.,0.);')
    .replace('#include <begin_vertex>',`vec2 rel=mod(position.xz-uCam+${R},${R2})-${R};vec2 wp=uCam+rel;
vec2 hu=vec2(wp.x-uC.x,uC.y-wp.y)/${S}+.5;vec4 hm=texture2D(uHM,hu);
float h=(.15+.25*br)*step(.5,hm.g)*step(0.,hu.x)*step(hu.x,1.)*step(0.,hu.y)*step(hu.y,1.)*(1.-smoothstep(${RF},${R},length(rel)))*(1.-.8*uSnow);
for(int i=0;i<${GR_TR};i++){vec3 t=uTrail[i];h*=1.-.8*t.z*(1.-smoothstep(.35,.8,distance(wp,t.xy)));}
float tp=bs==0.?1.:0.;vTip=tp;
vec2 sd=normalize(vec2(rel.y,-rel.x)+.001)*.028*(1.+br);
vec2 wd=vec2(sin(uT*1.7+wp.x*.35+br*6.),cos(uT*1.3+wp.y*.3))*uWind*.35*h;
vec3 transformed=vec3(wp.x+sd.x*bs+wd.x*tp,hm.r+h*tp,wp.y+sd.y*bs+wd.y*tp);
if(h<.02)transformed.y-=60.;`);
    // both faces of a blade are lit as if facing up; the stock double-sided flip turned the far side dark
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vTip;').replace('#include <normal_fragment_begin>','float faceDirection=1.;vec3 normal=normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz);vec3 nonPerturbedNormal=normal;')
      .replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(.8,1.03,vTip);');
  };
  const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.receiveShadow=true;scene.add(mesh);
  const hm=new THREE.ShaderMaterial({uniforms:{uG:{value:1}},side:THREE.DoubleSide,
    vertexShader:'varying float vY;void main(){vec4 w=modelMatrix*vec4(position,1.);vY=w.y;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform float uG;varying float vY;void main(){gl_FragColor=vec4(vY,uG,0.,1.);}'});
  const block=hm.clone();block.uniforms.uG.value=0;
  const cam=new THREE.OrthographicCamera(-GR_S/2,GR_S/2,GR_S/2,-GR_S/2,1,3000);cam.up.set(0,0,-1);
  grass={mesh,U,rt,hm,block,cam,cx:1e9,cz:1e9,world:null};
}
// ground meshes write their height and 1, everything else that covers the ground (roads, pavements, buildings, water) writes 0
function grassMap(cx,cz){
  const G=grass,saved=[],cc=new THREE.Color(),ca=renderer.getClearAlpha();renderer.getClearColor(cc);
  worldGroup.traverse(o=>{if(!o.isMesh&&!o.isPoints&&!o.isLine&&!o.isSprite)return;saved.push([o,o.material,o.visible]);
    if(o.isInstancedMesh||!o.isMesh||!o.visible)o.visible=false;else o.material=o.userData.grass?G.hm:G.block;});
  G.cam.position.set(cx,1500,cz);G.cam.lookAt(cx,0,cz);G.cam.updateMatrixWorld();
  const was=renderer.getRenderTarget();renderer.setRenderTarget(G.rt);renderer.setClearColor(0x000000,0);renderer.clear();
  renderer.render(worldGroup,G.cam);renderer.setRenderTarget(was);renderer.setClearColor(cc,ca);
  for(const [o,m,v] of saved){o.material=m;o.visible=v;}
  G.cx=cx;G.cz=cz;G.U.uC.value.set(cx,cz);G.world=world;
}
function updateGrass(dt){
  if(!world)return;if(!grass)buildGrass();
  const G=grass;G.mesh.visible=grassOn&&camMode!==1;if(!G.mesh.visible)return;
  G.U.uCam.value.set(camera.position.x,camera.position.z);
  if(G.world!==world||Math.hypot(player.x-G.cx,player.z-G.cz)>30)grassMap(player.x,player.z);
  const c=player.mode==='car'?player.car:null;
  if(c&&c.gnd===0&&Math.abs(c.speed)>1.5){const fx=Math.sin(c.h),fz=Math.cos(c.h);
    [-.75,.75].forEach((o,i)=>{const x=c.x-fx*1.25+fz*o,z=c.z-fz*1.25-fx*o,l=trailLast[i];
      if(!l||Math.hypot(x-l[0],z-l[1])>.6){trailLast[i]=[x,z];G.U.uTrail.value[trailI=(trailI+1)%GR_TR].set(x,z,1);}});}
  for(const v of G.U.uTrail.value)v.z=Math.max(0,v.z-dt/40);
  G.U.uWind.value=.4+.6*(weather.kind==='clear'?0:weather.amt);
}
