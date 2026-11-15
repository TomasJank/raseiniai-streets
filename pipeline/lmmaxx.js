// ---------- lmmaxx: Maxima X (building c3293) as a Blender model (add_lmmaxx.py; model: research/assets/houses/maximax/) ----------
// Frame: x along the front (the NW face, on the main road) from the north corner to the west corner, glTF -z back into the store,
// y up from spec.y0. The code-built box and its annex strip are not drawn; the footprint keeps the collision walls, inBuilding and
// the minimap; the name label stays. The entrance doors are on the front near the west corner (x 17.8..19.4).
// solid in the frame: the annex part beyond the footprint's step at the south corner, its fence, the parcel lockers, the bollards
const LMX={id:'c3293',at:[417.5,-989.06],door:[18.6,0],walls:[],
  solid:[[[14.9,16.9],[21.21,16.9]],[[21.21,16.9],[21.21,16]],[[15.3,16.95],[20.8,16.95]],
    [[9.2,-.7],[11.8,-.7]],[[9.2,-.7],[9.2,0]],[[11.8,-.7],[14,-.7]],[[14,-.7],[14,0]],[[9.6,18.15],[9.8,18.15]],[[11.1,18.15],[11.3,18.15]]]};
const lmxHere=p=>!!p&&p.length===6&&Math.hypot(p[5][0]-LMX.at[0],p[5][1]-LMX.at[1])<1;
// both specs (main rectangle, SE strip) carry the north or the east corner; the tall "wing" an earlier step drew along the SW
// side (from the west corner A to the south corner B) is drawn without an id
{const ab=addBuilding,E=[430.34,-977.12],A=[402.96,-973.58],S=[414.66,-962.64],nr=(q,c)=>Math.hypot(q[0]-c[0],q[1]-c[1])<1;
  addBuilding=function(B,p,s){if(s&&ASSETS.has('lmmaxx')&&(s.rid===LMX.id&&p.some(q=>nr(q,LMX.at)||nr(q,E))||!s.rid&&p.length===4&&nr(p[0],A)&&nr(p[1],S)))
  return(s.y0||0)+8.2;return ab(B,p,s);};}
function lmxFrame(){
  const r=FX.recs.find(q=>q.id===LMX.id);if(!r||!lmxHere(r.pts)||!ASSETS.has('lmmaxx'))return null;
  const p=r.pts,o=p[5],l=Math.hypot(p[0][0]-o[0],p[0][1]-o[1]),R=[(p[0][0]-o[0])/l,(p[0][1]-o[1])/l],N=[R[1],-R[0]],y0=r.specs[0][1].y0;
  return{o,R,N,y0,at:(x,y)=>[o[0]+R[0]*x+N[0]*y,o[1]+R[1]*x+N[1]*y]};
}
function lmxBuild(){
  LMX.walls=[];const F=LMX.F=lmxFrame();if(!F)return;const{o,R,N,y0,at}=F;
  for(const[a,b]of LMX.solid){const A=at(...a),B=at(...b);addWall(A[0],A[1],B[0],B[1]);LMX.walls.push([A[0],A[1],B[0],B[1]]);}
  const G=new THREE.Group();G.name='lmmaxx';G.matrixAutoUpdate=false;G.matrix.set(R[0],0,-N[0],o[0],0,1,0,y0,R[1],0,-N[1],o[1],0,0,0,1);
  G.matrixWorldNeedsUpdate=true;worldGroup.add(G);LMX.group=G;
  ASSETS.load('lmmaxx').then(g=>{if(LMX.group!==G)return;const mats={};
    const mk=s=>{const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
      // night: shop windows a warm light, the band and the name their own colour
      const e=s.name==='atlas_glow'?'vec3(1.,.82,.55)*.75':s.name==='atlas_sign'?'diffuseColor.rgb*.9':null;
      if(e)m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
        .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+='+e+'*uNight;');};
      return m;};
    const b=g.scene.getObjectByName('building');b.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=mk(q.material));
      q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;});
    G.add(b);if(grass)grass.world=null;LMX.loaded=true;});
}
// paving as the photos show it: the pavement along the front out to the main road, round the west corner along the side street,
// and the service yard south-east of the store. A flat skin 7 cm over the ground, no walls (walkable and drivable); being a
// non-grass mesh over the ground it keeps the grass map from growing tufts there. Off the roads, off every building outline.
// Rectangles in the frame [x0,x1,y0,y1]; the NE car park is the game's own lot and is left alone.
LMX.pave=[[0,29,-14,0],[21.23,29,0,26],[-3,21.23,16,26]];
const lmxPaving=()=>{const t=canvasTex(256,256,x=>{x.fillStyle='rgb(112,112,110)';x.fillRect(0,0,256,256);
  for(let r=0;r<20;r++)for(let c=-1;c<10;c++){const o=r&1?12.8:0,k=-8+hash(r*17.3+c*5.1)*16|0;
    x.fillStyle=`rgb(${150+k},${149+k},${145+k})`;x.fillRect(c*25.6+o+1,r*12.8+1,23.6,10.8);}});t.colorSpace=THREE.NoColorSpace;t.anisotropy=8;return t;};
function lmxPave(F){
  const W=world,{at}=F,st=.5,pos=[],uv=[],nor=[],cells=[];
  const road=(x,z)=>W.roadSegs(x,z).some(s=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<s[4].w/2+.4;});
  const inc=(u,v)=>{if(!LMX.pave.some(([a,b,c,d])=>u>a&&u<b&&v>c&&v<d))return false;const[x,z]=at(u,v);return!W.inBuilding(x,z)&&!road(x,z);};
  const q=(u,v)=>{const[x,z]=at(u,v);pos.push(x,GY(x,z)+.07,z);uv.push(u/2,v/2);nor.push(0,1,0);};
  for(let v=-14;v<26;v+=st)for(let u=-3;u<29;u+=st)if(inc(u+st/2,v+st/2)){cells.push(at(u+st/2,v+st/2));q(u,v);q(u+st,v);q(u+st,v+st);q(u,v);q(u+st,v+st);q(u,v+st);}
  if(!pos.length)return;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  const m=new THREE.MeshLambertMaterial({map:lmxPaving(),polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:THREE.DoubleSide});// double-sided: the frame's handedness flips the cells' winding
  const me=new THREE.Mesh(g,m);me.name='lmx_pave';me.receiveShadow=true;worldGroup.add(me);LMX.paveMesh=me;LMX.cells=cells;if(grass)grass.world=null;
}
{const be=buildExtra;buildExtra=function(){be();lmxBuild();if(LMX.F)lmxPave(LMX.F);};}
