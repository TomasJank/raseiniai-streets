// ---------- house5a: Vyšnių g. 5A (building c1583) as a Blender model (add_house5a.py; model: research/assets/houses/vysniu5a/) ----------
// The model's frame: x right along the street gable as seen from Vyšnių g., starting at the footprint's front-left corner, glTF -z back
// from the gable, y up from the building's mid-slope ground (spec.y0). The code-built house is not drawn (addBuilding skips it); its
// footprint keeps the collision walls, inBuilding and the minimap. The plot (house and garage c1594) gets no generated yard fence,
// gate gap or driveway: the model brings its own fence, gate, hedge and flagstone drive. Nodes: house; drive (draped onto the ground);
// f_post, f_bay, f_gate (repeated along the street); g_* (stood on the ground at their origin).
const H5A={id:'c1583',plot:['c1583','c1594'],at:[72.42,180.79],recs:null,set:null,walls:[],
  fence:{b:-2.7,from:-7.6,to:17.4,gate:[-5.45,-2.15]},hedge:[-2.22,.05,-2.48,-1.66],bay:[4.25,7.25,-1,0],bayL:2.2};
// the garage at the back of the drive: plain plaster, weathered red-grey asbestos sheet roof, no windows (also keeps the generic yard off it)
LOOK.c1594=Object.assign(LOOK.c1594||{},{sty:STY.plaster,faces:{windows:[0,0,0,0]},wall:[.86,.86,.84],roof:[.56,.52,.49],roofSty:'asbestos',windows:false});
const h5aHere=r=>!!r&&Math.hypot(r.pts[1][0]-H5A.at[0],r.pts[1][1]-H5A.at[1])<1;
// true for a building of the plot (only on the Raseiniai map); FX.recs is complete by the time the yard pass asks
function h5aPlot(b){
  if(H5A.recs!==FX.recs){H5A.recs=FX.recs;H5A.set=new Set();const own=FX.recs.find(r=>r.id===H5A.id);
    if(h5aHere(own))for(const r of FX.recs)if(H5A.plot.includes(r.id))H5A.set.add(r.pts);}
  return H5A.set.has(b.pts);
}
{const ab=addBuilding;addBuilding=function(B,p,s){if(s&&s.rid===H5A.id&&Math.hypot(p[1][0]-H5A.at[0],p[1][1]-H5A.at[1])<1)return(s.y0||0)+8.6;return ab(B,p,s);};}
function h5aFrame(){
  const r=FX.recs.find(q=>q.id===H5A.id);if(!h5aHere(r))return null;
  const p=r.pts,p1=p[1],l=Math.hypot(p[0][0]-p1[0],p[0][1]-p1[1]),R=[(p[0][0]-p1[0])/l,(p[0][1]-p1[1])/l],N=[R[1],-R[0]],y0=r.specs[0][1].y0;
  return{p1,R,N,y0,at:(x,y)=>[p1[0]+R[0]*x+N[0]*y,p1[1]+R[1]*x+N[1]*y]};
}
const h5aMat=(src,glow)=>{const t=src.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
  if(glow)m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.78,.5)*uNight*.8;');};
  return m;};
// a matrix for a part along direction (dx,dz) in the ground plane: local x scaled by s and rising dy per unit, local z to the street side
const h5aPut=(M,dx,dz,s,dy,x,y,z)=>M.set(dx*s,0,-dz,x,dy,1,0,y,dz*s,0,dx,z,0,0,0,1);
function h5aBuild(){
  const F=H5A.F=h5aFrame();H5A.walls=[];if(!F||!ASSETS.has('house5a'))return;
  const{at,R,N,y0}=F,fc=H5A.fence,G=new THREE.Group();G.name='house5a';G.matrixAutoUpdate=false;
  G.matrix.set(R[0],0,-N[0],F.p1[0],0,1,0,y0,R[1],0,-N[1],F.p1[1],0,0,0,1);G.matrixWorldNeedsUpdate=true;worldGroup.add(G);H5A.group=G;
  const wall=(a,b)=>{const A=at(...a),B=at(...b);addWall(A[0],A[1],B[0],B[1]);H5A.walls.push([A[0],A[1],B[0],B[1]]);};
  // fence posts: one bay left of the gate, the gate, then even bays to the right end
  const n=Math.round((fc.to-fc.gate[1])/2.5),posts=[fc.from,fc.gate[0],fc.gate[1]];for(let k=1;k<=n;k++)posts.push(fc.gate[1]+(fc.to-fc.gate[1])*k/n);
  for(const[a,b]of[[fc.from,fc.gate[0]+.15],[fc.gate[1]-.15,fc.to]])wall([a,fc.b],[b,fc.b]);
  const[h0,h1,h2,h3]=H5A.hedge;wall([h0,h2],[h1,h2]);wall([h1,h2],[h1,h3]);wall([h1,h3],[h0,h3]);wall([h0,h3],[h0,h2]);
  const[b0,b1,b2,b3]=H5A.bay;wall([b0,b3],[b0,b2]);wall([b0,b2],[b1,b2]);wall([b1,b2],[b1,b3]);
  ASSETS.load('house5a').then(g=>{if(H5A.group!==G)return;
    const mats={},mat=s=>mats[s.name]||(mats[s.name]=h5aMat(s,s.name==='atlas_glow')),parts={};
    g.scene.updateMatrixWorld(true);for(const o of[...g.scene.children])parts[o.name]=o;
    const meshes=o=>{const l=[];o.traverse(q=>{if(q.isMesh)l.push(q);});return l;};
    for(const o of Object.values(parts))for(const m of meshes(o)){m.material=mat(m.material);m.castShadow=m.receiveShadow=true;m.geometry.userData.keep=true;}
    G.add(parts.house);
    // grounded nodes: their origin on the game's ground
    const v=new THREE.Vector3();
    for(const k in parts)if(k.startsWith('g_')){const o=parts[k];v.copy(o.position).applyMatrix4(G.matrix);o.position.y=GY(v.x,v.z)-y0-.03;G.add(o);}
    // the drive, every vertex on the ground
    {const m=meshes(parts.drive)[0],geo=m.geometry.clone();geo.applyMatrix4(m.matrixWorld).applyMatrix4(G.matrix);const p=geo.attributes.position;
      for(let i=0;i<p.count;i++)p.setY(i,GY(p.getX(i),p.getZ(i))+.035);geo.computeVertexNormals();
      const dm=mat(m.material).clone();dm.polygonOffset=true;dm.polygonOffsetFactor=-2;dm.polygonOffsetUnits=-2;
      const d=new THREE.Mesh(geo,dm);d.name='house5a_drive';d.receiveShadow=true;worldGroup.add(d);H5A.drive=d;}
    // fence: posts, bays sheared to follow the ground, the two gate leaves standing open into the yard
    const M=new THREE.Matrix4(),inst=(k,cnt)=>{const m=meshes(parts[k])[0],im=new THREE.InstancedMesh(m.geometry,m.material,cnt);im.name='house5a_'+k;im.castShadow=im.receiveShadow=true;worldGroup.add(im);return im;};
    const P=inst('f_post',posts.length),B=inst('f_bay',posts.length-2),Gt=inst('f_gate',2),gy=(r)=>{const q=at(r,fc.b);return[q[0],GY(q[0],q[1]),q[1]];};
    posts.forEach((r,i)=>{const[x,y,z]=gy(r);h5aPut(M,R[0],R[1],1,0,x,y,z);P.setMatrixAt(i,M);});
    let bi=0;for(let i=0;i+1<posts.length;i++){if(i===1)continue;const a=posts[i]+.15,b=posts[i+1]-.15,A=gy(a),Bq=gy(b);
      h5aPut(M,R[0],R[1],(b-a)/H5A.bayL,(Bq[1]-A[1])/H5A.bayL,...A);B.setMatrixAt(bi++,M);}
    [[fc.gate[0]+.15,1],[fc.gate[1]-.15,-1]].forEach(([r,s],i)=>{const[x,y,z]=gy(r),c=Math.cos(.35),sn=Math.sin(.35)*s,dx=N[0]*c+R[0]*sn,dz=N[1]*c+R[1]*sn;
      h5aPut(M,dx,dz,1,0,x,y,z);Gt.setMatrixAt(i,M);});
    // the grass height map was drawn before the model arrived: redraw it so no blades grow inside the house
    if(grass)grass.world=null;
    H5A.loaded=true;});
}
{const be=buildExtra;buildExtra=function(){be();h5aBuild();};}
