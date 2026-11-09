// ---------- graphics: AO, soft shadows, sky, colour (all flags; override for tests with window.__GFX) ----------
const GFX=Object.assign({softShadows:!PHONE,shadowSize:PHONE?1024:2048,ao:!PHONE,aoRadius:3,aoStrength:2.2,sky:!PHONE,skyExposure:.7,exposure:1,sunPath:true,tone:false},window.__GFX||{});
if(GFX.tone){renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=GFX.tone==='agx'?THREE.AgXToneMapping:THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=GFX.exposure;}
if(GFX.softShadows)renderer.shadowMap.type=THREE.PCFSoftShadowMap;
//@@late
const gfxState={};
if(GFX.shadowSize!==sun.shadow.mapSize.x)sun.shadow.mapSize.set(GFX.shadowSize,GFX.shadowSize);
if(GFX.ao||GFX.tone||GFX.sky)(async()=>{
  const A='three/addons/',I=p=>import(A+p);
  const [{EffectComposer},{RenderPass},{OutputPass},ga,sk]=await Promise.all([I('postprocessing/EffectComposer.js'),I('postprocessing/RenderPass.js'),I('postprocessing/OutputPass.js'),
    GFX.ao?I('postprocessing/GTAOPass.js'):0,GFX.sky?I('objects/Sky.js'):0]);
  const sz=renderer.getSize(new THREE.Vector2()),pr=renderer.getPixelRatio();
  if(GFX.ao||GFX.tone){
    const rt=new THREE.WebGLRenderTarget(sz.x*pr,sz.y*pr,{type:THREE.HalfFloatType,samples:PHONE?0:4});
    const c=new EffectComposer(renderer,rt);c.setPixelRatio(pr);c.setSize(sz.x,sz.y);
    c.addPass(new RenderPass(scene,camera));
    if(ga){const g=new ga.GTAOPass(scene,camera,sz.x*pr,sz.y*pr);g.output=ga.GTAOPass.OUTPUT.Default;
      g.updateGtaoMaterial({radius:GFX.aoRadius,distanceExponent:1,thickness:2,scale:GFX.aoStrength,samples:12,distanceFallOff:1,screenSpaceRadius:false});
      g.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12});c.addPass(g);gfxState.gtao=g;}
    c.addPass(new OutputPass());gfxState.comp=c;
  }
  if(sk){
    const s=new sk.Sky(),G=[0,1,2].map(()=>new THREE.Color()),mix={value:0};s.scale.setScalar(5000);
    // Sky.js is a tone-mapped HDR day sky: it replaces the game gradient only in full daylight and clear weather, the tuned dusk/night/grey gradient (same three colours) carries the rest
    s.material.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{uG0:{value:G[0]},uG1:{value:G[1]},uG2:{value:G[2]},uMix:mix});
      sh.fragmentShader=sh.fragmentShader.replace('varying vec3 vWorldPosition;','varying vec3 vWorldPosition;uniform vec3 uG0,uG1,uG2;uniform float uMix;').replace('#include <tonemapping_fragment>',
      'vec3 sk=pow(vec3(1.)-exp(-gl_FragColor.rgb*'+GFX.skyExposure.toFixed(2)+'),vec3(.5));float t=.6*(1.-clamp(normalize(vWorldPosition-cameraPosition).y/.45,0.,1.));vec3 gr=t<.55?mix(uG0,uG1,t/.55):mix(uG1,uG2,(t-.55)/.45);gl_FragColor.rgb=mix(gr,sk,uMix);');};
    const u=s.material.uniforms;u.cloudCoverage.value=.25;u.cloudDensity.value=.25;u.turbidity.value=3;u.rayleigh.value=1.4;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.8;
    const ss=new THREE.Scene();ss.add(s);const rt=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType}),cc=new THREE.CubeCamera(1,10000,rt);
    gfxState.sky={s,ss,cc,rt,t:-9,w:-1,G,mix};
  }
})();
const gfxSunEl=()=>70*Math.sin(Math.PI*(tod-6)/13.5);
function gfxRender(){
  const S=gfxState,el=gfxSunEl();
  if(GFX.sunPath){const e=Math.max(el,12)*Math.PI/180,az=Math.atan2(105,65),t=sun.target.position;
    sun.position.set(t.x+Math.sin(az)*Math.cos(e)*130,t.y+Math.sin(e)*130,t.z+Math.cos(az)*Math.cos(e)*130);}
  const K=S.sky;let bg=null;
  if(K){const w=weather.kind==='clear'?0:weather.amt,day=smooth(5,7.5,tod)*(1-smooth(18.5,21,tod));
    if(Math.abs(tod-K.t)>.04||Math.abs(w-K.w)>.03){K.t=tod;K.w=w;const e=el*Math.PI/180,az=Math.atan2(105,65);
      for(let i=0;i<3;i++)K.G[i].copy(_sk[i]);K.mix.value=smooth(.75,1,day)*(1-smooth(.1,.5,w));
      K.s.material.uniforms.sunPosition.value.set(Math.sin(az)*Math.cos(e),Math.sin(e),Math.cos(az)*Math.cos(e));K.cc.update(renderer,K.ss);}
    bg=scene.background;scene.background=K.rt.texture;}
  const c=S.comp;
  if(c&&(GFX.ao||GFX.tone)){
    const sz=renderer.getSize(new THREE.Vector2()),pr=renderer.getPixelRatio();
    if(c._width!==sz.x||c._height!==sz.y||c._pixelRatio!==pr){c.setPixelRatio(pr);c.setSize(sz.x,sz.y);}
    if(S.gtao)S.gtao.enabled=GFX.ao;
    c.render();
  }else renderer.render(scene,camera);
  if(bg)scene.background=bg;
}
