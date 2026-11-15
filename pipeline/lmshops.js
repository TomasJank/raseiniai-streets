// ---------- lmshops: the Lidl (c8100) and the IKI (c2181) on Vilniaus g. as Blender models (add_lmshops.py; models: research/assets/houses/lidl/, iki/) ----------
// Frames: origin each shop's east corner, x along its north-east (street / car park) face, y in (south-west); glTF -z = y.
// Not drawn any more: the code-built boxes and the facades step's details on them. The footprints keep their collision walls,
// inBuilding and the minimap. The IKI's south-west wing (c2222) and its neighbours are not touched.
const LSH={b:[
  {k:'lidl',id:'c8100',asset:'lshlidl',top:7.5,o:[-592.0059855629687,-352.23570999980154],U:[-0.907676497083466,-0.4196705572735462],N:[-0.4196705572735462,0.907676497083466],
    // frame: the entrance canopy's two posts (round)
    posts:[[45.2,-1],[45.2,14.2]],
    pts:[[-592.01,-352.24],[-613.83,-305.92],[-608.96,-303.71],[-614.40,-292.10],[-626.29,-297.63],[-623.38,-303.82],[-646.02,-314.32],[-639.76,-327.70],[-645.96,-330.57],[-627.87,-368.82]]},
  {k:'iki',id:'c2181',asset:'lshiki',top:9.1,o:[-463.23203400246604,-293.6495100000559],U:[-0.8870009419996235,-0.4617676135154788],N:[-0.4617676135154788,0.8870009419996235],posts:[],
    pts:[[-501.50,-278.51],[-488.47,-271.76],[-483.22,-281.71],[-472.47,-276.07],[-463.23,-293.65],[-487.01,-306.03]]}],
  props:[]};
const lshAt=(L,x,y)=>[L.o[0]+L.U[0]*x+L.N[0]*y,L.o[1]+L.U[1]*x+L.N[1]*y];
function lshInPoly(x,z,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
// the shop this part (or record) belongs to: right id and its centre inside the footprint (another map's c8100 is left alone)
function lshOf(id,p){if(!p||!p.length)return null;let x=0,z=0;for(const q of p){x+=q[0]/p.length;z+=q[1]/p.length;}
  for(const L of LSH.b)if(L.id===id&&ASSETS.has(L.asset)&&lshInPoly(x,z,L.pts))return L;return null;}
{const ab=addBuilding;addBuilding=function(B,p,s){if(s&&s.rid){const L=lshOf(s.rid,p);if(L)return(s.y0||0)+L.top;}return ab(B,p,s);};}
// the facades step's balconies, chimneys, dormers and shop glazing are made per record: leave the two shops out
{const bf=buildFacadeDetails;buildFacadeDetails=function(W){const all=FX.recs;FX.recs=all.filter(r=>!lshOf(r.id,r.pts));
  try{return bf(W);}finally{FX.recs=all;}};}
function lshBuild(){
  LSH.props=[];
  for(const L of LSH.b){if(!FX.recs.some(r=>lshOf(r.id,r.pts)===L))continue;
    const W=world,y0=GY(...L.o),{U,N,o}=L;
    for(const[u,v]of L.posts){const[x,z]=lshAt(L,u,v),q={x,z,r:.15,h:4.5};addProp(q);W.solids.push(q);LSH.props.push(q);}
    const G=new THREE.Group();G.name='lmshops_'+L.k;G.matrixAutoUpdate=false;G.matrix.set(U[0],0,-N[0],o[0],0,1,0,y0,U[1],0,-N[1],o[1],0,0,0,1);
    G.matrixWorldNeedsUpdate=true;worldGroup.add(G);L.group=G;L.y0=y0;
    ASSETS.load(L.asset).then(g=>{if(L.group!==G)return;const mats={};
      const mk=s=>{const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
        // night: the shop glass a warm light, the name boards their own colour
        if(s.name==='atlas_glow')m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
          .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=mix(vec3(1.,.84,.6)*.65,diffuseColor.rgb*1.3,step(.18,abs(diffuseColor.r-diffuseColor.b)))*uNight;');};
        return m;};
      const b=g.scene.getObjectByName('building');b.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=mk(q.material));
        q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;if(q.material===mats.atlas)W.landmarks[L.k]=q;});
      G.add(b);if(grass)grass.world=null;L.loaded=true;});}
}
{const be=buildExtra;buildExtra=function(){be();lshBuild();};}
