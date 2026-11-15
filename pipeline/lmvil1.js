// ---------- lmvil1: two ordinary houses on Vilniaus g. (c2910, c2911) as Blender models (add_lmvil1.py; models: research/assets/houses/vil1/) ----------
// Frame of each model: x east along the street wall from its west corner (o -> r), glTF -z back from it, y up from spec.y0.
// The generated boxes are not drawn (addBuilding skips them); the footprints keep the collision walls, inBuilding and the minimap.
const LV1=[{id:'c2910',o:[-510.16,-352.79],r:[-499.98,-347.92],c:[-501.5,-358.5]},{id:'c2911',o:[-529.77,-366.5],r:[-521.04,-362.29],c:[-524,-368]}];
const lv1Rec=h=>{const r=FX.recs.find(q=>q.id===h.id);return r&&r.pts.some(p=>Math.hypot(p[0]-h.o[0],p[1]-h.o[1])<.1)&&r.pts.some(p=>Math.hypot(p[0]-h.r[0],p[1]-h.r[1])<.1)?r:null;};
{const ab=addBuilding;addBuilding=function(B,p,s){const h=s&&LV1.find(q=>q.id===s.rid);
  if(h&&Math.hypot(p[0][0]-h.c[0],p[0][1]-h.c[1])<20&&ASSETS.has('lmvil1_'+h.id))return(s.y0||0)+8.6;return ab(B,p,s);};}
const lv1Mat=src=>{const t=src.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
  if(src.name==='atlas_glow')m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.78,.5)*uNight*.8;');};
  return m;};
function lv1Build(){
  LV1.groups=[];
  for(const h of LV1){const r=lv1Rec(h);if(!r||!ASSETS.has('lmvil1_'+h.id))continue;
    const l=Math.hypot(h.r[0]-h.o[0],h.r[1]-h.o[1]),R=[(h.r[0]-h.o[0])/l,(h.r[1]-h.o[1])/l],N=[R[1],-R[0]],y0=r.specs[0][1].y0;
    const G=new THREE.Group();G.name='lmvil1_'+h.id;G.matrixAutoUpdate=false;G.matrix.set(R[0],0,-N[0],h.o[0],0,1,0,y0,R[1],0,-N[1],h.o[1],0,0,0,1);
    G.matrixWorldNeedsUpdate=true;worldGroup.add(G);G.userData.loaded=false;LV1.groups.push(G);
    ASSETS.load('lmvil1_'+h.id).then(g=>{if(G.parent!==worldGroup)return;const mats={};
      g.scene.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=lv1Mat(q.material));q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;});
      G.add(g.scene.getObjectByName('building'));G.userData.loaded=true;if(grass)grass.world=null;});}
}
{const be=buildExtra;buildExtra=function(){be();lv1Build();};}
