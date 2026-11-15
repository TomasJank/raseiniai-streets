// ---------- lmpost: the post office building, Maironio g. 8 (c2683), as a Blender model (add_lmpost.py; model: research/assets/houses/pastas/) ----------
// Model frame: x along the front (north-west face) from footprint corner 1 (north-east end) to corner 0, glTF -z into the building,
// y up from spec.y0. The code-built block and its facade details are not drawn; the footprint keeps the collision walls,
// inBuilding and the minimap.
// Swedbank (c2940) is not built: no photo shows it (research/reports/lmpost.md).
const LPO={id:'c2683',asset:'pastas',io:1,it:0,at:[-148.44,-399.66],h:13.5,
  poly:[[-179.37,-360.08],[-148.44,-399.66],[-138.64,-392.03],[-169.57,-352.57]],
  // model-frame wall segments: glass front, landing and step cheeks, ramp rail, the fieldstone wall, stair tower and porch
  solid:[[[19.3,0],[19.3,-.6]],[[19.3,-.6],[50.2,-.6]],[[50.2,-.6],[50.2,0]],
    [[19.6,-2.2],[20.45,-2.2]],[[20.45,-2.2],[20.45,-4.9]],[[23.75,-4.9],[23.75,-2.2]],[[23.75,-2.2],[24.6,-2.2]],[[24.6,-2.2],[24.6,-.6]],
    [[6.5,-1.98],[19.6,-1.98]],
    [[-.3,-3.4],[3.5,-3.4]],[[6.5,-3.4],[20.3,-3.4]],[[23.9,-3.4],[50.5,-3.4]],
    [[0,1],[-3.2,1]],[[-3.2,1],[-3.2,.6]],[[-3.2,.6],[-6,.6]],[[-6,.6],[-6,4.8]],[[-6,4.8],[-3.2,4.8]],[[-3.2,4.8],[-3.2,4.4]],[[-3.2,4.4],[0,4.4]]]};
const lpoOn=()=>ASSETS.has(LPO.asset);
const lpoNear=(p,q)=>!!p&&Math.hypot(p[0]-q[0],p[1]-q[1])<1;
function lpoEdge(x,z){const P=LPO.poly;let d=1e9;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
  d=Math.min(d,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return d;}
// anything the base page builds for the outline has its middle inside it or within 2 m
function lpoMine(p){if(!p||!p.length||!lpoOn())return false;let x=0,z=0;for(const q of p){x+=q[0];z+=q[1];}x/=p.length;z/=p.length;
  return Math.abs(x-LPO.at[0])<60&&Math.abs(z-LPO.at[1])<60&&(pip(x,z,LPO.poly)||lpoEdge(x,z)<2);}
{const ab=addBuilding;addBuilding=function(B,p,s){if(lpoMine(p)){LPO.skipped=(LPO.skipped||0)+1;return((s&&s.y0)||0)+LPO.h;}return ab(B,p,s);};}
const lpoRec=r=>r.id===LPO.id&&lpoOn()&&lpoNear(r.pts[LPO.io],LPO.at);
{const bf=buildFacadeDetails;buildFacadeDetails=function(W){const all=FX.recs;FX.recs=all.filter(r=>!lpoRec(r));const v=bf(W);FX.recs=all;return v;};}
// the town step's five-storey block dressing (loggias, stairwell doors and canopies, the yard mark that brings a playground) skips it
{const bt=buildTown;buildTown=function(){const off=world.buildings.filter(b=>b.blks&&b.blks.length&&lpoMine(b.pts)),k=off.map(b=>b.blks);
  off.forEach(b=>b.blks=[]);LPO.unblk=off.length;try{return bt();}finally{off.forEach((b,i)=>b.blks=k[i]);}};}
function lpoMat(s){const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
  // night: shop glass, doors and some windows a warm light, the same uniform the town's windows use
  if(s.name==='atlas_glow')m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.8,.52)*.7*uNight;');};
  return m;}
function lpoBuild(){
  const W=world,b=LPO;b.walls=[];b.F=null;
  const r=FX.recs.find(q=>q.id===b.id);if(!r||!lpoNear(r.pts[b.io],b.at)||!lpoOn())return;
  const p=r.pts,o=p[b.io],t=p[b.it],l=Math.hypot(t[0]-o[0],t[1]-o[1]),R=[(t[0]-o[0])/l,(t[1]-o[1])/l],N=[R[1],-R[0]],y0=r.specs[0][1].y0;
  const at=(x,y)=>[o[0]+R[0]*x+N[0]*y,o[1]+R[1]*x+N[1]*y];b.F={o,R,N,y0,at};
  for(const[a,c]of b.solid){const A=at(...a),C=at(...c);addWall(A[0],A[1],C[0],C[1]);b.walls.push([A[0],A[1],C[0],C[1]]);}
  const G=new THREE.Group();G.name=b.asset;G.matrixAutoUpdate=false;G.matrix.set(R[0],0,-N[0],o[0],0,1,0,y0,R[1],0,-N[1],o[1],0,0,0,1);
  G.matrixWorldNeedsUpdate=true;worldGroup.add(G);b.group=G;
  ASSETS.load(b.asset).then(g=>{if(b.group!==G)return;const mats={};
    const m=g.scene.getObjectByName('building');m.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=lpoMat(q.material));
      q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;});
    G.add(m);if(grass)grass.world=null;b.loaded=true;});
}
{const be=buildExtra;buildExtra=function(){be();lpoBuild();};}
