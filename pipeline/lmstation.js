// ---------- lmstation: the bus station (c5290) and its platform canopy (c7167) as a Blender model (add_lmstation.py; model: research/assets/houses/stotis/) ----------
// Frame: origin the south corner of c5290, x along the south-east (bus) face towards the street, y in towards the north-west; glTF -z = y.
// Not drawn any more: the code-built box, the canopy's fuel-station slab and pillars, the generated yard fence round the plot (it ran
// across the bays) and props2's hay bale against the canopy. The canopy's asphalt apron stays. c5290's footprint keeps its walls.
// The static minibus (cars4 ps1_bus) stood on the bus loop road where the moving bus turns; it now stands in the arrivals area on the
// south-east side. Departures (bays 1..6) face the north-west loop road, where the moving bus stops.
const LMT={o:[-294.23203470499124,-87.05025000014075],U:[0.6211250425988191,-0.7837114784514868],N:[-0.7837114784514868,-0.6211250425988191],
  // c7167 in game coordinates (the canopy)
  canopy:[[-294.232,-87.050],[-313.080,-63.174],[-322.125,-69.695],[-305.870,-95.341]],
  // frame: posts (round), struts and barrier housings (round), benches and planters (walls)
  posts:[[-28.18,9.16],[-27.89,2.2],[-23.15,9.69],[-22.82,2.2],[-18.12,10.22],[-17.74,2.2],[-13.08,10.75],[-12.68,2.2],[-8.05,11.28],[-7.61,2.2],[-3.02,11.82],[-2.54,2.2]],
  round:[[23.6,-5.7,.3],[23.6,-10.3,.3],[1.2,-.95,.12]],
  solid:[[[-24.64,8.33],[-26.43,8.14]],[[-14.58,9.39],[-16.37,9.2]],[[-4.51,10.45],[-6.3,10.26]]],
  // people waiting for the bus at "Raseiniai AS" stand on the departures platform at bay 2 (they stood on the loop road's edge)
  wait:[-23,5.9],
  bus:[55.3780653,23.1152575,-38.4],walls:[],props:[]};
const lmtOn=()=>ASSETS.has('lmstation');
const lmtAt=(x,y)=>[LMT.o[0]+LMT.U[0]*x+LMT.N[0]*y,LMT.o[1]+LMT.U[1]*x+LMT.N[1]*y];
const lmtLoc=(x,z)=>{const dx=x-LMT.o[0],dz=z-LMT.o[1];return[dx*LMT.U[0]+dz*LMT.U[1],dx*LMT.N[0]+dz*LMT.N[1]];};
function lmtInPoly(x,z,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
// the station's ground: box, canopy and the bays out to 5.5 m from the bus face (the north-west road and its stop sign stay outside)
function lmtIn(x,z){const[u,v]=lmtLoc(x,z);if(u<-31.5||u>21.5||v<-5.5)return false;return v<(u<0?14.27+(u+.73)*3.19/30.2:14.27+(u+.73)*2.22/20.52);}
// the box is c5290 (corner-checked); everything the canopy drew stands inside c7167 (its slab .75 m, its four pillars 4.6 m), the apron is lower
{const ab=addBuilding;addBuilding=function(B,p,s){if(lmtOn()&&s){
    if(s.rid==='c5290'&&p.length===4&&Math.hypot(p[3][0]-LMT.o[0],p[3][1]-LMT.o[1])<1)return(s.y0||0)+5.6;
    if(!s.rid&&s.h>.5&&p.length){let x=0,z=0;for(const q of p){x+=q[0]/p.length;z+=q[1]/p.length;}if(lmtInPoly(x,z,LMT.canopy))return(s.y0||0)+s.h;}}
  return ab(B,p,s);};}
// the generated yard (fence, gate gap) skips both buildings of the station: asked by the yard walk (splice in add_lmstation.py)
function lmtPlot(b){if(!lmtOn())return false;if(LMT.recs!==FX.recs){LMT.recs=FX.recs;LMT.set=new Set();
    for(const r of FX.recs)if((r.id==='c5290'||r.id==='c7167')&&lmtIn(...r.pts[0]))LMT.set.add(r.pts);}
  return LMT.set.has(b.pts);}
// props2 places nothing on the station's ground but its stop signs (the hay bale it put against the "shed" canopy goes)
if(typeof P2_SITES!=='undefined')for(const k in P2_SITES){const f=P2_SITES[k];P2_SITES[k]=function(){f();if(lmtOn())P2.sites=P2.sites.filter(q=>q.r.kind==='stopsign'||!lmtIn(q.x,q.z));};}
// the static minibus stands in the arrivals area instead of on the loop road; the stop's waiting spot moves onto the platform
{const bb=buildBus;buildBus=function(){const on=lmtOn();if(on&&typeof CARS4_STATIC!=='undefined'&&CARS4_STATIC.ps1_bus)CARS4_STATIC.ps1_bus=[LMT.bus];bb();
  const a=on&&bus&&bus.at.find(q=>q.name==='Raseiniai AS'&&q.st&&q.st.x!=null&&lmtLoc(q.st.x,q.st.z)[0]>-45&&lmtLoc(q.st.x,q.st.z)[0]<0);if(a)[a.st.x,a.st.z]=lmtAt(...LMT.wait);};}
function lmtBuild(){
  LMT.walls=[];LMT.props=[];if(!lmtOn()||!FX.recs.some(r=>r.id==='c5290'&&Math.hypot(r.pts[3][0]-LMT.o[0],r.pts[3][1]-LMT.o[1])<1))return;
  const W=world,y0=GY(...LMT.o),{U,N,o}=LMT;
  for(const[a,b]of LMT.solid){const A=lmtAt(...a),B=lmtAt(...b);addWall(A[0],A[1],B[0],B[1]);LMT.walls.push([A[0],A[1],B[0],B[1]]);}
  const prop=(u,v,r,h)=>{const[x,z]=lmtAt(u,v),q={x,z,r,h};addProp(q);W.solids.push(q);LMT.props.push(q);};
  for(const[u,v]of LMT.posts)prop(u,v,.3,4.5);
  for(const[u,v,r]of LMT.round)prop(u,v,r,r<.2?2.2:1.2);
  const G=new THREE.Group();G.name='lmstation';G.matrixAutoUpdate=false;G.matrix.set(U[0],0,-N[0],o[0],0,1,0,y0,U[1],0,-N[1],o[1],0,0,0,1);
  G.matrixWorldNeedsUpdate=true;worldGroup.add(G);LMT.group=G;LMT.y0=y0;
  ASSETS.load('lmstation').then(g=>{if(LMT.group!==G)return;const mats={};
    const mk=s=>{const t=s.map;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;const m=new THREE.MeshLambertMaterial({map:t});
      // night: the hall glass and office windows a warm light, the departure displays their own amber
      if(s.name==='atlas_glow')m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;')
        .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=mix(vec3(1.,.82,.55)*.7,diffuseColor.rgb*1.2,step(.5,diffuseColor.r-diffuseColor.b))*uNight;');};
      return m;};
    const b=g.scene.getObjectByName('building');b.traverse(q=>{if(!q.isMesh)return;q.material=mats[q.material.name]||(mats[q.material.name]=mk(q.material));
      q.castShadow=q.receiveShadow=true;q.geometry.userData.keep=true;if(q.material===mats.atlas)W.landmarks.station=q;});
    G.add(b);if(grass)grass.world=null;LMT.loaded=true;});
}
{const be=buildExtra;buildExtra=function(){be();lmtBuild();};}
