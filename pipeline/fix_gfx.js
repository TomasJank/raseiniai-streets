// GTAOPass renders its normal/depth pass with an override material and hides only Points and Lines, so sprites and depthWrite-off transparent meshes (smoke, fume puffs, rings, beams) were drawn as opaque quads and occluded the AO behind them: black squares
const GFX_SUN_MAX=44;
function gfxFix(S){
  const g=S.gtao;if(!g||g._fixed)return;g._fixed=true;const f=g._overrideVisibility.bind(g);
  g._overrideVisibility=()=>{f();scene.traverse(o=>{if(!o.visible)return;
    if(o.isSprite||(o.isMesh&&[].concat(o.material).some(m=>m.transparent&&!m.depthWrite))){o.visible=false;g._visibilityCache.push(o);}});};
}
