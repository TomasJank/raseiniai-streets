// ---------- perf2: frame cost on slower PCs ----------
// Most of the world never moves, yet three.js recomposed every object's matrix and world matrix on each of the two scene
// renders a frame (beauty, AO normals). Skip that unless position, rotation, scale or parent changed since the last compose.
{const P=THREE.Object3D.prototype,um=P.updateMatrix;
  P.updateMatrix=function(){const p=this.position,q=this.quaternion,s=this.scale;let k=this._pk;
    if(k&&this.pivot===null&&k[0]===p.x&&k[1]===p.y&&k[2]===p.z&&k[3]===q._x&&k[4]===q._y&&k[5]===q._z&&k[6]===q._w&&k[7]===s.x&&k[8]===s.y&&k[9]===s.z&&k[10]===this.parent)return;
    if(!k)k=this._pk=[];k[0]=p.x;k[1]=p.y;k[2]=p.z;k[3]=q._x;k[4]=q._y;k[5]=q._z;k[6]=q._w;k[7]=s.x;k[8]=s.y;k[9]=s.z;k[10]=this.parent;um.call(this);};}
// Quality levels, cheapest look first. Auto on every device: two slow 2 s windows step down, a run of fast ones steps back up,
// slower to retry a level that was slow before. window.__GFX.level forces one, __GFX.auto=false keeps level 0.
//  1 pixel ratio 1 · 2 no ambient occlusion (and with it no MSAA target) · 3 shadow map 1024, tree shadows to 70 m, small things
//  cast within 35 m · 4 small-thing cull at 8 px, full tree crowns to 90 m, trunks to 200 m · 5 no sun shadows, pixel ratio .75
const PERF={level:0,px:4,tree:130,hi:150,trunk:350,smallSh:1e9,ao:150,cull:null,hidden:0,
  base:{pr:renderer.getPixelRatio(),ao:GFX.ao,sh:GFX.shadowSize},t0:performance.now(),last:performance.now(),f:[],slow:0,fast:0,wait:3,bad:[],up:0,hold:0,chk:null};
const perfOpts=L=>{const B=PERF.base;return{pr:L>=5?Math.min(B.pr,.75):L>=1?Math.min(B.pr,1):B.pr,ao:B.ao&&L<2,sh:L>=3?Math.min(B.sh,1024):B.sh,cast:L<5,
  px:L>=4?8:4,tree:L>=3?70:130,hi:L>=4?90:150,trunk:L>=4?200:350,smallSh:L>=3?35:1e9};};
function perfLevel(L){
  L=Math.max(0,Math.min(5,L));const o=perfOpts(L);PERF.level=L;
  for(const k of ['px','tree','hi','trunk','smallSh'])PERF[k]=o[k];
  if(renderer.getPixelRatio()!==o.pr){renderer.setPixelRatio(o.pr);renderer.setSize(innerWidth,innerHeight,false);}
  GFX.ao=o.ao;
  if(sun.shadow.mapSize.x!==o.sh){sun.shadow.mapSize.set(o.sh,o.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
  sun.castShadow=o.cast;perfT=0;}
// Static world meshes too small to cover PERF.px pixels at their distance leave layer 0, so the beauty, AO and shadow passes
// all skip them (visible stays free for the steps that own it). Size is one instance's, so a cell of benches goes at bench size.
function perfCull(){
  if(!PERF.cull){if(!world)return;const tr=new Set();for(const t of TREES)tr.add(t.L).add(t.C).add(t.Tk);PERF.cull=[];
    worldGroup.traverse(o=>{if(o.isMesh&&o.frustumCulled&&!tr.has(o))PERF.cull.push({o,g:null,r:0,cs:o.castShadow,d:0});});}
  const cp=camera.position,f=renderer.domElement.height/Math.tan(camera.fov*Math.PI/360)/PERF.px,sp=perfCull.s||(perfCull.s=new THREE.Sphere()),m=new THREE.Matrix4();let n=0;
  for(const e of PERF.cull){const o=e.o,g=o.geometry;
    if(e.g!==g){e.g=g;if(!g.boundingSphere)g.computeBoundingSphere();let s=1;
      if(o.isInstancedMesh){s=0;for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);s=Math.max(s,m.getMaxScaleOnAxis());}o.boundingSphere=null;}
      e.r=g.boundingSphere?g.boundingSphere.radius*s:0;}
    const b=o.isInstancedMesh?(o.boundingSphere||o.computeBoundingSphere()||o.boundingSphere):g.boundingSphere;if(!b)continue;
    sp.copy(b).applyMatrix4(o.matrixWorld);const r=e.r*o.matrixWorld.getMaxScaleOnAxis();e.d=sp.center.distanceTo(cp)-sp.radius;
    if(e.d<r*f)o.layers.enable(0);else{o.layers.disable(0);n++;}
    if(e.cs)o.castShadow=r>=2||e.d<PERF.smallSh;}
  PERF.hidden=n;
}
// GTAO's normal pass re-rendered the sun's shadow map it never reads (the beauty pass just made it): shadows are left alone
// for that pass. One walk also hides sprites and see-through no-depth meshes (fix_gfx), and the static meshes past PERF.ao
// metres, whose occlusion is a pixel or two under the fog
function perfAOVis(){const c=this._visibilityCache;renderer.shadowMap.autoUpdate=false;
  const v=o=>{if(!o.visible)return;let h=o.isPoints||o.isLine||o.isSprite;if(!h&&o.isMesh){const m=o.material;h=Array.isArray(m)?m.some(x=>x.transparent&&!x.depthWrite):m.transparent&&!m.depthWrite;}
    if(h){o.visible=false;c.push(o);return;}for(const ch of o.children)v(ch);};
  v(scene);if(PERF.cull)for(const e of PERF.cull)if(e.d>PERF.ao&&e.o.visible){e.o.visible=false;c.push(e.o);}}
const _gfxFix=gfxFix;
gfxFix=function(S){_gfxFix(S);const g=S.gtao;if(g&&g._overrideVisibility!==perfAOVis){g._overrideVisibility=perfAOVis;const r=g._restoreVisibility;g._restoreVisibility=function(){r.call(this);renderer.shadowMap.autoUpdate=true;};}};
// real time, since the game dt is clamped. The median frame of a 2 s window, so a shader-compile hitch is not slowness;
// a window over 5 s is a hidden or stalled tab, not a slow machine; the first 6 s after the loader are not judged
function perfAuto(){
  const now=performance.now(),F=PERF.f;F.push(now-PERF.last);PERF.last=now;if(now-PERF.t0<2000)return;
  const el=now-PERF.t0,med=F.sort((a,b)=>a-b)[F.length>>1];PERF.t0=now;F.length=0;
  if(!$('#loader').hidden)PERF.wait=3;
  if(el>5000||document.hidden||PERF.wait>0){PERF.wait--;PERF.slow=PERF.fast=0;return;}
  // a step down that did not make frames at least 10% shorter (a browser capped at 30 Hz, a stall elsewhere) is undone
  // and the level held for a minute
  const c=PERF.chk;PERF.chk=null;if(c&&med>c.med*.9){perfLevel(c.L);PERF.hold=now+60000;PERF.slow=PERF.fast=0;PERF.wait=1;return;}
  PERF.slow=med>25?PERF.slow+1:0;PERF.fast=med<17.9?PERF.fast+1:0;
  // a level that changes nothing on this device (pixel ratio already 1, no AO on a phone) is stepped over
  const same=(a,b)=>JSON.stringify(perfOpts(a))===JSON.stringify(perfOpts(b));let L=PERF.level;
  if(PERF.slow>=2&&L<5&&now>PERF.hold){PERF.chk={L,med};if(now-PERF.up<12000)PERF.bad[L]=Math.min(30,(PERF.bad[L]||3)*2);do L++;while(L<5&&same(L,L-1));}
  else if(L>0){do L--;while(L>0&&same(L,L-1));if(PERF.fast<(PERF.bad[L]||3))return;PERF.up=now;}
  else return;
  perfLevel(L);PERF.slow=PERF.fast=0;PERF.wait=1;
}
{const G=window.__GFX||{};if(G.level!=null)perfLevel(+G.level);}
// one world-matrix walk a frame instead of one per scene render (beauty, AO normals)
const _gfxRender=gfxRender;
gfxRender=function(){scene.updateMatrixWorld();scene.matrixWorldAutoUpdate=false;_gfxRender();scene.matrixWorldAutoUpdate=true;};
const _perfTick=perfTick;
perfTick=function(dt){_perfTick(dt);if(perfT===.25)perfCull();const G=window.__GFX||{};if(G.level==null&&G.auto!==false)perfAuto();};
