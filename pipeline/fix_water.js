// Water.js renders its mirror inside onBeforeRender, which also fires in GTAOPass's normal pass (scene.overrideMaterial set): the reflection was drawn in normal-map colours, and with every=2 and two renders per frame the beauty pass always sampled exactly that texture
// the other water bodies (waterMat) get Water.js's Fresnel and animated normal-map look with the sky as the reflection, so a river meeting a pond keeps one material
const waterFx={frame:0,t:{value:0},sun:{value:new THREE.Vector3()},col:{value:new THREE.Color()},wc:{value:new THREE.Color(0x1d4a4f)},nm:{value:null},done:false};
function fixWater(){
  if(!water2List.length)return;const u=water2List[0].material.uniforms;
  if(!waterFx.done){waterFx.done=true;waterFx.nm.value=u.normalSampler.value;
    // the shared call counter made each body refresh on a fixed parity of however many water meshes and passes a frame has (a pond could never refresh): skipping is per body and per frame, and a body always renders its first mirror
    const every=WATER2.every;WATER2.every=1;
    water2List.forEach((w,i)=>{const f=w.onBeforeRender;w.onBeforeRender=function(r,s,...a){
      if(s.overrideMaterial||(w.userData.mirrored&&(waterFx.frame+i)%every))return;w.userData.mirrored=true;return f.call(this,r,s,...a);};});
    const o=waterMat.onBeforeCompile;
    waterMat.onBeforeCompile=sh=>{o(sh);Object.assign(sh.uniforms,{uWT:waterFx.t,uWSun:waterFx.sun,uWSC:waterFx.col,uWC:waterFx.wc,uWN:waterFx.nm});
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
      uniform float uWT;uniform vec3 uWSun,uWSC,uWC;uniform sampler2D uWN;
      vec3 wNoise(vec2 p){vec2 a=p/103.+vec2(uWT/17.,uWT/29.),b=p/107.+vec2(uWT/19.,-uWT/31.),c=p/vec2(8907.,9803.)+vec2(uWT/101.,uWT/97.),d=p/vec2(1091.,1027.)+vec2(-uWT/109.,uWT/113.);
        return (texture2D(uWN,a)+texture2D(uWN,b)+texture2D(uWN,c)+texture2D(uWN,d)).rgb*.5-1.;}`)
        .replace('#include <opaque_fragment>',`{
      vec3 sn=normalize((viewMatrix*vec4(normalize(wNoise(vW*.35).xzy*vec3(1.5,1.,1.5)),0.)).xyz),ev=normalize(vViewPosition),sl=normalize((viewMatrix*vec4(uWSun,0.)).xyz);
      float rf=.02+.98*pow(1.-max(dot(ev,sn),0.),5.);
      vec3 sp=pow(max(0.,dot(ev,normalize(reflect(-sl,sn)))),100.)*uWSC*2.;
      vec3 df=max(dot(sl,sn),0.)*uWSC*.5;
      outgoingLight=mix(uWSC*df*.3+max(0.,dot(sn,ev))*uWC,uSky+sp,rf);}
      #include <opaque_fragment>`);};
    waterMat.needsUpdate=true;}
  waterFx.frame++;waterFx.t.value=ENV.t.value*.5;waterFx.sun.value.copy(sun.position).sub(sun.target.position).normalize();waterFx.col.value.copy(sun.color).multiplyScalar(.9);
  for(const w of water2List){const q=w.material.uniforms;q.time.value=waterFx.t.value;q.sunDirection.value.copy(waterFx.sun.value);q.sunColor.value.copy(waterFx.col.value);}
}
