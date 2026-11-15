// ---------- lmvil3: two ordinary houses on Vilniaus g. (c2467, c1525) as Blender models (add_lmvil3.py; models: research/assets/houses/vil3/) ----------
// Frame of each model: x along the street face from its left corner (seen from the street), glTF -z back from that face, y up from spec.y0.
// The generated houses are not drawn (addBuilding skips them); their footprints keep the collision walls, inBuilding and the minimap.
// at: a corner's game position (only on the Raseiniai map the footprint is there), o: the corner index of FX.recs pts that is the frame's origin, e: the corner at the end of the street face (x axis), top: roof height above y0.
const VL3=[{id:'c2467',asset:'lmvil3a',at:[-72.8,-66.82],o:2,e:1,top:7.2},{id:'c1525',asset:'lmvil3b',at:[49.27,70.91],o:0,e:3,top:5.8}];
const vl3Rec=v=>{const r=FX.recs.find(q=>q.id===v.id);return r&&r.pts.length===4?r:null;};
{const ab=addBuilding;addBuilding=function(B,p,s){const v=s&&VL3.find(q=>q.id===s.rid);
  if(v&&ASSETS.has(v.asset)&&p.length===4&&p.some(a=>Math.hypot(a[0]-v.at[0],a[1]-v.at[1])<.5))return(s.y0||0)+v.top;
  return ab(B,p,s);};}
// the facades step's chimneys and dormers are made per record: leave these two out
{const bf=buildFacadeDetails;buildFacadeDetails=function(W){const all=FX.recs;FX.recs=all.filter(r=>!VL3.some(v=>v.id===r.id&&ASSETS.has(v.asset)&&r.pts.some(a=>Math.hypot(a[0]-v.at[0],a[1]-v.at[1])<.5)));
  try{return bf(W);}finally{FX.recs=all;}};}
function vl3Build(){
  for(const v of VL3){const r=vl3Rec(v);if(!r||!ASSETS.has(v.asset)||!r.pts.some(a=>Math.hypot(a[0]-v.at[0],a[1]-v.at[1])<.5))continue;
    const o=r.pts[v.o],e=r.pts[v.e],l=Math.hypot(e[0]-o[0],e[1]-o[1]),R=[(e[0]-o[0])/l,(e[1]-o[1])/l],y0=r.specs[0][1].y0;
    const G=new THREE.Group();G.name=v.asset;G.matrixAutoUpdate=false;G.matrix.set(R[0],0,-R[1],o[0],0,1,0,y0,R[1],0,R[0],o[1],0,0,0,1);
    G.matrixWorldNeedsUpdate=true;worldGroup.add(G);v.group=G;
    ASSETS.load(v.asset).then(g=>{if(v.group!==G)return;const mats={};
      const mk=s=>{const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
        if(s.name==='atlas_glow')m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
          .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.8,.52)*uNight*.8;');};
        return m;};
      const b=g.scene.getObjectByName('building');
      b.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=mk(q.material));q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;});
      G.add(b);if(grass)grass.world=null;v.loaded=true;});}
}
{const be=buildExtra;buildExtra=function(){be();vl3Build();};}
