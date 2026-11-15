// ---------- lmsport: the sports centre (Raseinių kūno kultūros ir sporto centras, c19) as a Blender model (add_lmsport.py; model: research/assets/houses/sportas/) ----------
// Model frame: u along the north-east face from footprint corner 0 (north corner) to corner 1, v into the building, y up from spec.y0;
// the glTF carries (u, z, v). The code-built block and its facade details are not drawn; the footprint keeps the collision walls,
// inBuilding, the minimap and the name label. The story stop "Sporto centras" moves to the entrance porch at the north corner.
const LSP={id:'c19',asset:'sportas',io:0,it:1,at:[490.18,535.73],h:10.4,door:[-.8,1.4],stop:[-7,1.4],
  poly:[[490.18,535.73],[502.13,545.35],[498.4,549.88],[508.2,557.84],[504.72,562.04],[503.08,560.71],[481.57,587.02],[484.61,589.45],
    [468.04,609.68],[461.33,604.38],[462.54,602.94],[446.79,590.23],[450.14,586.03],[452.61,588.02],[460.64,578.18],[464.81,573.09],[461.71,570.55]],
  // model-frame wall segments: the fins standing 0.4 m out of the south-east face
  solid:[[[25.8,11.4],[26.2,11.4]],[[26.2,11.4],[26.2,45.6]],[[26.2,45.6],[25.8,45.6]]]};
const lspOn=()=>ASSETS.has(LSP.asset);
const lspNear=(p,q)=>!!p&&Math.hypot(p[0]-q[0],p[1]-q[1])<1;
function lspEdge(x,z){const P=LSP.poly;let d=1e9;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
  d=Math.min(d,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return d;}
// anything the base page builds for the outline has its middle inside it or within 2 m (Kalno school, c44, shares a wall but its middle is 60 m away)
function lspMine(p){if(!p||!p.length||!lspOn())return false;let x=0,z=0;for(const q of p){x+=q[0];z+=q[1];}x/=p.length;z/=p.length;
  return Math.abs(x-LSP.at[0])<80&&Math.abs(z-LSP.at[1])<80&&(pip(x,z,LSP.poly)||lspEdge(x,z)<2);}
{const ab=addBuilding;addBuilding=function(B,p,s){if(lspMine(p)){LSP.skipped=(LSP.skipped||0)+1;return((s&&s.y0)||0)+LSP.h;}return ab(B,p,s);};}
const lspRec=r=>r.id===LSP.id&&lspOn()&&lspNear(r.pts[LSP.io],LSP.at);
{const bf=buildFacadeDetails;buildFacadeDetails=function(W){const all=FX.recs;FX.recs=all.filter(r=>!lspRec(r));const v=bf(W);FX.recs=all;return v;};}
function lspFrame(){const r=FX.recs.find(q=>q.id===LSP.id);if(!r||!lspNear(r.pts[LSP.io],LSP.at)||!lspOn())return null;
  const p=r.pts,o=p[LSP.io],t=p[LSP.it],l=Math.hypot(t[0]-o[0],t[1]-o[1]),R=[(t[0]-o[0])/l,(t[1]-o[1])/l],V=[-R[1],R[0]];
  return{o,R,V,y0:r.specs[0][1].y0,at:(u,v)=>[o[0]+R[0]*u+V[0]*v,o[1]+R[1]*u+V[1]*v]};}
function lspMat(s){const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
  // night: the doors and some windows a warm light, the same uniform the town's windows use
  if(s.name==='atlas_glow')m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.8,.52)*.7*uNight;');};
  return m;}
function lspBuild(){
  const b=LSP;b.walls=[];const F=b.F=lspFrame();if(!F)return;const{o,R,V,y0,at}=F;
  for(const[a,c]of b.solid){const A=at(...a),C=at(...c);addWall(A[0],A[1],C[0],C[1]);b.walls.push([A[0],A[1],C[0],C[1]]);}
  const G=new THREE.Group();G.name=b.asset;G.matrixAutoUpdate=false;G.matrix.set(R[0],0,V[0],o[0],0,1,0,y0,R[1],0,V[1],o[1],0,0,0,1);
  G.matrixWorldNeedsUpdate=true;worldGroup.add(G);b.group=G;
  ASSETS.load(b.asset).then(g=>{if(b.group!==G)return;const mats={};
    const m=g.scene.getObjectByName('building');m.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=lspMat(q.material));
      q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;});
    G.add(m);if(grass)grass.world=null;b.loaded=true;});
}
{const be=buildExtra;buildExtra=function(){be();lspBuild();};}
// the story stop "sale" (three missions drop at or pick up from the sports hall) was on the stadium road 11 m off the hall's blind
// south-east side; it now sits on the paved path 7 m out from the entrance porch, the person who waits at the door
{const bs=buildStory;buildStory=function(){bs();const F=lspFrame(),q=F&&storyPts.sale;if(!q)return;
  const[x,z]=F.at(...LSP.stop),[px,pz]=F.at(...LSP.door);Object.assign(q,{x,z,px,pz});placeStoryMarks();};}
