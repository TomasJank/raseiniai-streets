// ---------- maxima: Maxima XX, Vilniaus g. 93 (building c2134) as a Blender model (add_maxima.py; model: research/assets/houses/maxima/) ----------
// Frame: x along the car-park front from its left corner (seen from the car park), glTF -z back into the store, y up from spec.y0.
// The code-built box (addBuilding), the hand-made front dressing of the base page (store walls, canopy and its posts) and the facades
// step's shopfront (fx_maxima) are not drawn; the lot, its cars, lamps and the neighbour's end wall stay. The footprint keeps the
// collision walls and inBuilding; the canopy has no posts, so the walk under it to the doors is open.
// the entrance is the east corner (x 66.58, y 0): doors on its north-east side (x = 66.58 face, y 1..4)
const MXR={id:'c2134',at:[-415.23,-144.09],walls:[],door:[67,2.5],
  // in the frame: retaining wall, the low box by the left wall, the two brown walls standing 0.3 m out, trolley shelter sides, kiosk
  solid:[[[19.2,-.65],[19.2,-9]],[[13.8,-.7],[18.8,-.7]],[[11,-.3],[57,-.3]],[[57,-.3],[57,0]],[[66.58,9.6],[66.88,9.6]],[[66.88,9.6],[66.88,45.14]],
    [[19.8,-14.5],[19.8,-10.5]],[[22.2,-14.5],[22.2,-10.5]],
    [[77.58,0],[81.58,0]],[[81.58,0],[81.58,4]],[[81.58,4],[77.58,4]],[[77.58,4],[77.58,0]]]};
const mxrHere=p=>!!p&&Math.hypot(p[2][0]-MXR.at[0],p[2][1]-MXR.at[1])<1;
// the base page's Maxima block asks this before it dresses the store walls
const mxrOn=()=>ASSETS.has('maxima');
{const ab=addBuilding;addBuilding=function(B,p,s){if(s&&s.rid===MXR.id&&p.length===4&&mxrHere(p)&&mxrOn())return(s.y0||0)+8.6;return ab(B,p,s);};}
function mxrFrame(){
  const r=FX.recs.find(q=>q.id===MXR.id);if(!r||!mxrHere(r.pts)||!mxrOn())return null;
  const p=r.pts,o=p[2],l=Math.hypot(p[3][0]-o[0],p[3][1]-o[1]),R=[(p[3][0]-o[0])/l,(p[3][1]-o[1])/l],N=[R[1],-R[0]],y0=r.specs[0][1].y0;
  return{o,R,N,y0,at:(x,y)=>[o[0]+R[0]*x+N[0]*y,o[1]+R[1]*x+N[1]*y]};
}
function mxrBuild(){
  MXR.walls=[];const F=MXR.F=mxrFrame();if(!F)return;const{o,R,N,y0,at}=F;
  const W=world,old=W.landmarks&&W.landmarks.maxima;if(old){worldGroup.remove(old);old.geometry.dispose();W.landmarks.maxima=null;}
  for(const[a,b]of MXR.solid){const A=at(...a),B=at(...b);addWall(A[0],A[1],B[0],B[1]);MXR.walls.push([A[0],A[1],B[0],B[1]]);}
  const G=new THREE.Group();G.name='maxima';G.matrixAutoUpdate=false;G.matrix.set(R[0],0,-N[0],o[0],0,1,0,y0,R[1],0,-N[1],o[1],0,0,0,1);
  G.matrixWorldNeedsUpdate=true;worldGroup.add(G);MXR.group=G;
  ASSETS.load('maxima').then(g=>{if(MXR.group!==G)return;const mats={};
    const mk=s=>{const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
      // night: shop windows a warm light, signs their own colour
      const e=s.name==='atlas_glow'?'vec3(1.,.82,.55)*.75':s.name==='atlas_sign'?'diffuseColor.rgb*.9':null;
      if(e)m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
        .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+='+e+'*uNight;');};
      return m;};
    const b=g.scene.getObjectByName('building');b.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=mk(q.material));
      q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;if(q.material===mats.atlas)W.landmarks.maxima=q;});
    G.add(b);if(grass)grass.world=null;MXR.loaded=true;});
}
{const be=buildExtra;buildExtra=function(){be();mxrBuild();};}
// the story mission's Maxima stop: its ring was put on the road nearest the building's label; move it out from the corner
// doors on the north-east side (clear of the kiosk), the person who waits standing at the doors under the canopy
{const bs=buildStory;buildStory=function(){bs();const F=mxrFrame(),q=F&&storyPts['Maxima XX'];if(!q)return;
  const[x,z]=F.at(MXR.door[0]+6,MXR.door[1]+4.5),[px,pz]=F.at(MXR.door[0]+.6,MXR.door[1]);Object.assign(q,{x,z,px,pz});placeStoryMarks();};}
