// ---------- lmchurch: the Ėmimo į Dangų church (c92) and the Trejybės cerkvė (c219) as Blender models (add_lmchurch.py; models: research/assets/houses/church/) ----------
// Model frame: X across the building, glTF -z = Y along it, y up from spec.y0. Church: Y north along the nave (footprint edge p0->p1),
// X = v - 150, Y = u - 145. Cerkvė: Y toward the bell tower (edge p7->p6), X = v - 456, Y = u - 475 (u, v: footprint coordinates
// projected on those axes). The code-built bodies (addBuilding), landmarks2's lm2_church and the facades step's fx_cerkve are not drawn;
// the footprints keep the collision walls, inBuilding and the minimap.
const LMC={
  ch:{id:'c92',ij:[0,1],o:[150,145],at:[162.99,-132.7],asset:'lmchurch_church',top:24,
    // tower centres in the model frame, heights above y0 (for world.lm2.church, which test_landmarks2 reads)
    towers:[[-8.98,18.65],[10.37,18.65]],heights:{eave:11.5,ridge:17.5,towerTop:23.4,top:24.0}},
  ce:{id:'c219',ij:[7,6],o:[456,475],at:[-12.65,-655.89],asset:'lmchurch_cerkve',top:21.2,
    // the tower portal stands 0.7 m out of the footprint: its surround is solid
    solid:[[[-1.75,15.3],[-1.75,16.0]],[[-1.75,16.0],[1.75,16.0]],[[1.75,16.0],[1.75,15.3]]]},
  walls:[]};
const lmcRec=k=>{const L=LMC[k],r=FX.recs.find(q=>q.id===L.id);return r&&Math.hypot(r.pts[0][0]-L.at[0],r.pts[0][1]-L.at[1])<1?r:null;};
{const ab=addBuilding;addBuilding=function(B,p,s){
  if(s)for(const k of['ch','ce']){const L=LMC[k];if(s.rid===L.id&&Math.hypot(p[0][0]-L.at[0],p[0][1]-L.at[1])<1&&ASSETS.has(L.asset))return(s.y0||0)+L.top;}
  return ab(B,p,s);};}
function lmcFrame(k){
  const L=LMC[k],r=lmcRec(k);if(!r||!ASSETS.has(L.asset))return null;
  const P=r.pts,[i,j]=L.ij,dx=P[j][0]-P[i][0],dz=P[j][1]-P[i][1],l=Math.hypot(dx,dz),U=[dx/l,dz/l],V=[-U[1],U[0]],y0=r.specs[0][1].y0;
  const at=(X,Y)=>[V[0]*(X+L.o[0])+U[0]*(Y+L.o[1]),V[1]*(X+L.o[0])+U[1]*(Y+L.o[1])],o=at(0,0);
  return{U,V,y0,o,at};
}
// town.js puts instanced dark arched windows (chWin, chArch) on every church outline: drop the ones on these two footprints
function lmcHideTownWindows(recs){
  const near=(x,z)=>recs.some(P=>pip(x,z,P)||P.some((a,i)=>{const b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<1.2;}));
  const M=new THREE.Matrix4(),v=new THREE.Vector3(),Z=new THREE.Matrix4().makeScale(0,0,0);let n=0;
  scene.traverse(m=>{if(!m.isInstancedMesh||!m.material.color||m.material.color.getHex()!==0x2f3a44)return;let hit=false;
    for(let i=0;i<m.count;i++){m.getMatrixAt(i,M);v.setFromMatrixPosition(M).applyMatrix4(m.matrixWorld);if(near(v.x,v.z)){m.setMatrixAt(i,Z);hit=true;n++;}}
    if(hit)m.instanceMatrix.needsUpdate=true;});
  return n;
}
function lmcBuild(){
  const W=world;LMC.walls=[];
  // what this step replaces: landmarks2's church mesh and the facades step's cerkvė dome
  const drop=m=>{if(m){worldGroup.remove(m);m.geometry.dispose();}};
  for(const k of['ch','ce']){
    const L=LMC[k],F=L.F=lmcFrame(k);if(!F)continue;
    if(k==='ch'){if(W.lm2&&W.lm2.church){drop(W.lm2.church.mesh);W.lm2.church=null;}if(W.landmarks)W.landmarks.church=null;}
    else if(W.landmarks){drop(W.landmarks.cerkve);W.landmarks.cerkve=null;}
    for(const[a,b]of L.solid||[]){const A=F.at(...a),B=F.at(...b);addWall(A[0],A[1],B[0],B[1]);LMC.walls.push([A[0],A[1],B[0],B[1]]);}
    const G=new THREE.Group();G.name='lmchurch_'+k;G.matrixAutoUpdate=false;
    G.matrix.set(F.V[0],0,-F.U[0],F.o[0],0,1,0,F.y0,F.V[1],0,-F.U[1],F.o[1],0,0,0,1);G.matrixWorldNeedsUpdate=true;worldGroup.add(G);L.group=G;
    ASSETS.load(L.asset).then(g=>{if(L.group!==G)return;const mats={};
      const mk=s=>{const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
        // night: the windows a dim warm light
        if(s.name==='atlas_glow')m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
          .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.8,.52)*.45*uNight;');};
        return m;};
      const b=g.scene.getObjectByName('building');b.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=mk(q.material));
        q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;if(q.material===mats.atlas&&W.landmarks)W.landmarks[k==='ch'?'church':'cerkve']=q;});
      G.add(b);
      if(k==='ch'&&W.lm2){const H=L.heights,y0=F.y0;
        W.lm2.church={mesh:W.landmarks.church,eave:y0+H.eave,ridge:y0+H.ridge,towerTop:y0+H.towerTop,top:y0+H.top,y0,towers:L.towers.map(t=>F.at(...t))};}
      if(grass)grass.world=null;L.loaded=true;});
  }
  LMC.hidden=lmcHideTownWindows(['ch','ce'].filter(k=>LMC[k].F).map(k=>lmcRec(k).pts));
}
{const be=buildExtra;buildExtra=function(){be();lmcBuild();};}
