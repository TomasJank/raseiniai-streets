// ---------- lmcivic: the municipality (c2159) and the culture centre (c171) as Blender models (add_lmcivic.py; models: research/assets/houses/savivaldybe/, kultura/) ----------
// Each model frame: x along a footprint edge from corner io to corner it, glTF -z into the building (N), y up from spec.y0.
// The code-built boxes (with the views step's wing, gables and canopy on c2159) and the facades step's culture front (fx_culture)
// are not drawn and facade details skip both; the footprints keep the collision walls, inBuilding and the minimap.
// solid: extra wall segments in the model frame (steps, ramps, outside stairs); round: [x, y, r] posts (flagpoles).
const LMV=[
  {id:'c2159',asset:'savivaldybe',io:8,it:7,at:[-184.69,-474.94],h:14.2,
    poly:[[-152.43,-488.09],[-144.33,-481.13],[-154.52,-469.63],[-156.6,-467.2],[-139.84,-452.61],[-145.35,-446.31],[-151.86,-452.05],[-154.71,-448.85],[-184.69,-474.94],[-175.58,-485.22],[-171.97,-482.01],[-172.67,-481.24],[-164.7,-474.27]],
    // landing's south-east side and the ramp's outer wall (the steps stay open toward the square), sign board
    solid:[[[48.47,-0.2],[48.47,0]],[[46.95,-1.6],[52.67,-1.6]],[[52.67,-1.6],[52.67,-0.2]],[[52.67,-0.2],[48.47,-0.2]],[[25.6,-2.4],[27.4,-2.4]]],
    round:[[31,-3.4,.2],[33.4,-3.4,.2],[35.8,-3.4,.2]]},
  {id:'c171',asset:'kultura',io:12,it:11,at:[-66.03,-549],h:19.4,
    poly:[[-50.66,-586.8],[-47.88,-587.02],[-42.12,-581.39],[-42.12,-579.17],[-29.85,-568.78],[-29.6,-565.8],[-21.57,-558.17],[-20.24,-559.06],[-13.66,-551.65],[-23.72,-542.36],[-25.17,-543.58],[-42.82,-526.78],[-66.03,-549],[-72.17,-548.67],[-75.01,-551.54],[-74.89,-560.94],[-64.96,-570.33],[-65.9,-575.42],[-62.55,-577.63],[-58.82,-577.07]],
    // the two outside steel stairs on the south-east face
    solid:[[[33.03,19.35],[34.23,19.29]],[[34.23,19.29],[33.99,14.1]],[[33.99,14.1],[32.79,14.15]],
      [[35.63,32.14],[36.83,32.07]],[[36.83,32.07],[36.5,26.88]],[[36.5,26.88],[35.3,26.95]]],round:[]}];
const lmvNear=(p,q)=>!!p&&Math.hypot(p[0]-q[0],p[1]-q[1])<1;
const lmvOn=b=>ASSETS.has(b.asset);
function lmvEdge(x,z,P){let d=1e9;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
  d=Math.min(d,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return d;}
// anything the base page builds for these two outlines (parts, wing, gables, canopy, tower) has its middle inside or within 5 m
function lmvOwner(p){if(!p||!p.length)return null;let x=0,z=0;for(const q of p){x+=q[0];z+=q[1];}x/=p.length;z/=p.length;
  for(const b of LMV)if(lmvOn(b)&&Math.abs(x-b.at[0])<90&&Math.abs(z-b.at[1])<90&&(pip(x,z,b.poly)||lmvEdge(x,z,b.poly)<5))return b;return null;}
{const ab=addBuilding;addBuilding=function(B,p,s){const b=lmvOwner(p);if(b){LMV.skipped=(LMV.skipped||0)+1;return((s&&s.y0)||0)+b.h;}return ab(B,p,s);};}
// the base page's tower spire on c171 is four loose triangles: skip triangles whose middle is inside an outline
{const at=addTri;addTri=function(B,a,b,c,...r){const x=(a[0]+b[0]+c[0])/3,z=(a[2]+b[2]+c[2])/3;
  for(const k of LMV)if(Math.abs(x-k.at[0])<90&&Math.abs(z-k.at[1])<90&&lmvOn(k)&&pip(x,z,k.poly))return;return at(B,a,b,c,...r);};}
const lmvRec=r=>LMV.find(b=>b.id===r.id&&lmvOn(b)&&lmvNear(r.pts[b.io],b.at));
{const bf=buildFacadeDetails;buildFacadeDetails=function(W){const all=FX.recs;FX.recs=all.filter(r=>!lmvRec(r));const v=bf(W);FX.recs=all;return v;};}
function lmvFrame(b){
  const r=FX.recs.find(q=>q.id===b.id);if(!r||!lmvNear(r.pts[b.io],b.at)||!lmvOn(b))return null;
  const p=r.pts,o=p[b.io],t=p[b.it],l=Math.hypot(t[0]-o[0],t[1]-o[1]),R=[(t[0]-o[0])/l,(t[1]-o[1])/l],N=[R[1],-R[0]],y0=r.specs[0][1].y0;
  return{o,R,N,y0,at:(x,y)=>[o[0]+R[0]*x+N[0]*y,o[1]+R[1]*x+N[1]*y]};
}
function lmvMat(s){const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
  // night: lit windows and doors a warm light, the same uniform the town's windows use
  if(s.name==='atlas_glow')m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.8,.52)*.7*uNight;');};
  return m;}
function lmvBuild(){
  const W=world;
  for(const b of LMV){
    b.walls=[];const F=b.F=lmvFrame(b);if(!F)continue;const{o,R,N,y0,at}=F;
    for(const[a,c]of b.solid){const A=at(...a),C=at(...c);addWall(A[0],A[1],C[0],C[1]);b.walls.push([A[0],A[1],C[0],C[1]]);}
    for(const[x,y,r]of b.round){const[px,pz]=at(x,y),q={x:px,z:pz,r};addProp(q);W.solids.push(q);}
    const G=new THREE.Group();G.name=b.asset;G.matrixAutoUpdate=false;G.matrix.set(R[0],0,-N[0],o[0],0,1,0,y0,R[1],0,-N[1],o[1],0,0,0,1);
    G.matrixWorldNeedsUpdate=true;worldGroup.add(G);b.group=G;
    ASSETS.load(b.asset).then(g=>{if(b.group!==G)return;const mats={};
      const m=g.scene.getObjectByName('building');m.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=lmvMat(q.material));
        q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;});
      // the facades step's culture front goes when the model is in; the model's main mesh becomes the landmark
      if(b.id==='c171'){const old=W.landmarks&&W.landmarks.culture;if(old&&old.name==='fx_culture'){worldGroup.remove(old);old.geometry.dispose();}
        m.traverse(q=>{if(q.isMesh&&q.material===mats.atlas)W.landmarks.culture=q;});}
      G.add(m);if(grass)grass.world=null;b.loaded=true;});
  }
}
{const be=buildExtra;buildExtra=function(){be();lmvBuild();};}
