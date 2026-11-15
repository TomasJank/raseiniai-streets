// ---------- lmpublic: the police station (c2158) as a Blender model (add_lmpublic.py; model: research/assets/houses/policija/) ----------
// The health centre (c170) is not modelled: the street photos do not show its front or entrance (research/reports/lmpublic.md).
// Frame: x along the south-east face (on Maironio g.) from footprint corner 4 (south) to corner 3 (east), glTF -z into the building,
// y up from spec.y0. The code-built box is not drawn and facade details skip it; the footprint keeps the collision walls,
// inBuilding, the minimap and the name label (the delivery target "Policijos komisariatas"). The doors are under the canopy at x 27.2.
// solid in the frame: the entrance ramp's handrail; round: [x, y, r] the three flagpoles
const LPU={id:'c2158',asset:'policija',io:4,it:3,at:[-110.24,-481.46],h:12.5,door:[27.2,0],walls:[],
  poly:[[-107.65,-527.55],[-90.07,-510.97],[-91.65,-509.31],[-87.41,-505.33],[-110.24,-481.46],[-120.11,-490.85],[-106.51,-505],[-118.46,-516.28]],
  solid:[[[33.08,-2.1],[33.08,-.4]]],round:[[33.8,-3,.2],[36,-5.5,.2],[38.2,-8,.2]]};
const lpuOn=()=>ASSETS.has(LPU.asset);
const lpuHere=p=>!!p&&p.length===8&&Math.hypot(p[4][0]-LPU.at[0],p[4][1]-LPU.at[1])<1;
// the model carries the station's own sign: the streets step's blue "POLICIJA" sign on the same wall goes
if(lpuOn())for(const S of STREETS)if(S.signs)S.signs=S.signs.filter(g=>!(g.text==='POLICIJA'&&g.ll&&Math.hypot(g.ll[0]-55.3818636,g.ll[1]-23.1184639)<2e-4));
// all three specs of c2158 carry its id; anything drawn without an id whose middle is inside the outline goes too
{const ab=addBuilding;addBuilding=function(B,p,s){
  if(s&&lpuOn()&&p&&p.length){let x=0,z=0;for(const q of p){x+=q[0];z+=q[1];}x/=p.length;z/=p.length;
    if(s.rid===LPU.id&&Math.hypot(x-LPU.at[0],z-LPU.at[1])<40||!s.rid&&Math.abs(x-LPU.at[0])<60&&Math.abs(z-LPU.at[1])<60&&pip(x,z,LPU.poly))return(s.y0||0)+LPU.h;}
  return ab(B,p,s);};}
{const bf=buildFacadeDetails;buildFacadeDetails=function(W){const all=FX.recs;FX.recs=all.filter(r=>!(r.id===LPU.id&&lpuOn()&&lpuHere(r.pts)));const v=bf(W);FX.recs=all;return v;};}
function lpuFrame(){
  const r=FX.recs.find(q=>q.id===LPU.id);if(!r||!lpuHere(r.pts)||!lpuOn())return null;
  const p=r.pts,o=p[LPU.io],t=p[LPU.it],l=Math.hypot(t[0]-o[0],t[1]-o[1]),R=[(t[0]-o[0])/l,(t[1]-o[1])/l],N=[R[1],-R[0]],y0=r.specs[0][1].y0;
  return{o,R,N,y0,at:(x,y)=>[o[0]+R[0]*x+N[0]*y,o[1]+R[1]*x+N[1]*y]};
}
function lpuBuild(){
  const W=world;LPU.walls=[];const F=LPU.F=lpuFrame();if(!F)return;const{o,R,N,y0,at}=F;
  for(const[a,c]of LPU.solid){const A=at(...a),C=at(...c);addWall(A[0],A[1],C[0],C[1]);LPU.walls.push([A[0],A[1],C[0],C[1]]);}
  for(const[x,y,r]of LPU.round){const[px,pz]=at(x,y),q={x:px,z:pz,r};addProp(q);W.solids.push(q);}
  const G=new THREE.Group();G.name='policija';G.matrixAutoUpdate=false;G.matrix.set(R[0],0,-N[0],o[0],0,1,0,y0,R[1],0,-N[1],o[1],0,0,0,1);
  G.matrixWorldNeedsUpdate=true;worldGroup.add(G);LPU.group=G;
  ASSETS.load(LPU.asset).then(g=>{if(LPU.group!==G)return;const mats={};
    const mk=s=>{const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
      // night: lit windows a warm light, the green sign and its letters their own colour (the town's ENV.night uniform)
      const e=s.name==='atlas_glow'?'vec3(1.,.8,.52)*.7':s.name==='atlas_sign'?'diffuseColor.rgb*.9':null;
      if(e)m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
        .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+='+e+'*uNight;');};
      return m;};
    const b=g.scene.getObjectByName('building');b.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=mk(q.material));
      q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;});
    G.add(b);if(grass)grass.world=null;LPU.loaded=true;});
}
{const be=buildExtra;buildExtra=function(){be();lpuBuild();};}
