// ---------- lmvil2: two blocks on Vilniaus g. (c2909, c2904) as Blender models (add_lmvil2.py; models: research/assets/houses/vil2/) ----------
// Frame of each model: x along the street face from its left corner (seen from Vilniaus g.), glTF -z back into the plot, y up from spec.y0.
// The code-built boxes are not drawn (addBuilding skips them); the footprints keep the collision walls, inBuilding and the minimap.
// solid: segments in the model frame (the glazed lean-to out from the street face; the footprints already block the buildings)
const LV2=[{id:'c2909',a:1,b:2,top:10,solid:[[[4.1,-1.6],[9.9,-1.6]],[[4.1,0],[4.1,-1.6]],[[9.9,0],[9.9,-1.6]]]},{id:'c2904',a:3,b:2,top:10.2,solid:[]}];
const lv2Rec=L=>{const r=FX.recs.find(q=>q.id===L.id);return r&&r.pts.length>L.b?r:null;};
// only on the Raseiniai map: the street-face corner must be where the model was made for
const lv2At={c2909:[-494.48,-346.93],c2904:[-422.25,-320.62]};
const lv2Here=(L,p)=>!!p&&p.length>L.a&&Math.hypot(p[L.a][0]-lv2At[L.id][0],p[L.a][1]-lv2At[L.id][1])<1;
{const ab=addBuilding;addBuilding=function(B,p,s){const L=s&&LV2.find(q=>q.id===s.rid);
  if(L&&lv2Here(L,p)&&ASSETS.has('lmvil2_'+L.id))return(s.y0||0)+L.top;return ab(B,p,s);};}
// the facades step's balconies, chimneys, dormers and shop glazing are made per record: leave these two out
{const bf=buildFacadeDetails;buildFacadeDetails=function(W){const all=FX.recs;FX.recs=all.filter(r=>{const L=LV2.find(q=>q.id===r.id);return!(L&&lv2Here(L,r.pts)&&ASSETS.has('lmvil2_'+L.id));});
  try{return bf(W);}finally{FX.recs=all;}};}
function lv2Build(){
  for(const L of LV2){
    L.group=null;const r=lv2Rec(L);if(!r||!lv2Here(L,r.pts)||!ASSETS.has('lmvil2_'+L.id))continue;
    const p=r.pts,p1=p[L.a],p2=p[L.b],l=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),R=[(p2[0]-p1[0])/l,(p2[1]-p1[1])/l],N=[R[1],-R[0]],y0=r.specs[0][1].y0;
    const at=(x,y)=>[p1[0]+R[0]*x+N[0]*y,p1[1]+R[1]*x+N[1]*y],G=new THREE.Group();G.name='lmvil2_'+L.id;G.matrixAutoUpdate=false;G.matrix.set(R[0],0,-N[0],p1[0],0,1,0,y0,R[1],0,-N[1],p1[1],0,0,0,1);
    for(const[a,b]of L.solid){const A=at(...a),B=at(...b);addWall(A[0],A[1],B[0],B[1]);}
    G.matrixWorldNeedsUpdate=true;worldGroup.add(G);L.group=G;L.F={p1,R,N,y0,at:(x,y)=>[p1[0]+R[0]*x+N[0]*y,p1[1]+R[1]*x+N[1]*y]};
    ASSETS.load('lmvil2_'+L.id).then(g=>{if(L.group!==G)return;const mats={};
      const mk=s=>{const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
        if(s.name==='atlas_glow')m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
          .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.78,.5)*uNight*.8;');};
        return m;};
      const b=g.scene.getObjectByName('building');b.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=mk(q.material));
        q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;});
      G.add(b);if(grass)grass.world=null;L.loaded=true;});
  }
}
{const be=buildExtra;buildExtra=function(){be();lv2Build();};}
