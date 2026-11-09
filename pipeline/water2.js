// ---------- water2: flat ponds and lakes become planar Water.js surfaces (planar reflection; the fallback with planes:false is the existing ripple/Fresnel waterMat) ----------
const WATER2={planes:!PHONE,size:512,lite:true,every:2,minArea:8000,maxSpread:1.8,...(window.__WATER2||{})};
let water2N=0,water2Next=0,water2Heavy=[],Water2=null,water2Job=null,water2Mesh=null;const water2List=[];
// the addon loads while the world is still building; if the world wins the race the job runs on arrival and the merged water mesh is rebuilt
if(WATER2.planes)import('three/addons/objects/Water.js').then(m=>{Water2=m.Water;if(water2Job){const j=water2Job;water2Job=null;water2Install(...j);
  if(water2Mesh){water2Mesh.geometry.dispose();water2Mesh.geometry=mkGeo(j[0].pos,j[0].col,j[0].nor);}}}).catch(()=>{});
// the draped sheet is replaced only where the terrain under the outline is nearly flat (p10..p90 within maxSpread); rivers on a slope keep waterMat
function water2Install(WA,polys,wg,GY){
  if(!WATER2.planes)return;if(!Water2){water2Job=[WA,polys,wg,GY];return;}
  let nmap=null;
  for(const p of polys){
    let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const q of p){x0=Math.min(x0,q[0]);z0=Math.min(z0,q[1]);x1=Math.max(x1,q[0]);z1=Math.max(z1,q[1]);}
    const st=Math.max(2,Math.sqrt((x1-x0)*(z1-z0)/400)),ys=[];
    for(let x=x0;x<x1;x+=st)for(let z=z0;z<z1;z+=st)if(pip(x,z,p))ys.push(GY(x,z));
    if(ys.length*st*st<WATER2.minArea)continue;
    ys.sort((a,b)=>a-b);const lo=ys[ys.length*.1|0],hi=ys[ys.length*.9|0];if(hi-lo>WATER2.maxSpread)continue;
    for(let i=0;i<WA.pos.length;i+=9){
      if(!pip((WA.pos[i]+WA.pos[i+3]+WA.pos[i+6])/3,(WA.pos[i+2]+WA.pos[i+5]+WA.pos[i+8])/3,p))continue;
      WA.pos.splice(i,9);WA.col.splice(i,9);WA.nor.splice(i,9);i-=9;
    }
    if(!nmap){const N=128,d=new Uint8Array(N*N*4),h=(x,y)=>Math.sin(x*6.2832*3)+Math.sin(y*6.2832*4+1)+.6*Math.sin((x+y)*6.2832*7)+.4*Math.sin((x-2*y)*6.2832*11);
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){const e=1/N,gx=(h(x/N+e,y/N)-h(x/N-e,y/N))*.02,gy=(h(x/N,y/N+e)-h(x/N,y/N-e))*.02,l=Math.hypot(gx,gy,1),o=(y*N+x)*4;
        d[o]=(-gx/l*.5+.5)*255;d[o+1]=(-gy/l*.5+.5)*255;d[o+2]=(1/l*.5+.5)*255;d[o+3]=255;}
      nmap=new THREE.DataTexture(d,N,N);nmap.wrapS=nmap.wrapT=THREE.RepeatWrapping;nmap.minFilter=THREE.LinearMipmapLinearFilter;nmap.generateMipmaps=true;nmap.needsUpdate=true;}
    const geo=new THREE.ShapeGeometry(new THREE.Shape(p.map(q=>new THREE.Vector2(q[0],-q[1]))));
    const w=new Water2(geo,{textureWidth:WATER2.size,textureHeight:WATER2.size,waterNormals:nmap,sunDirection:new THREE.Vector3(.6,.7,.4).normalize(),sunColor:0xfff1dc,waterColor:0x1d4a4f,distortionScale:2.2,fog:true});
    w.rotation.x=-Math.PI/2;w.position.y=hi+.06;w.material.uniforms.size.value=.35;w.userData.keep=true;
    const u=w.material.uniforms,render0=w.onBeforeRender;
    w.onBeforeRender=function(r,s,c,...a){
      u.time.value=ENV.t.value*.5;u.sunDirection.value.copy(sun.position).sub(sun.target.position).normalize();u.sunColor.value.copy(sun.color).multiplyScalar(.9);
      // the reflection refreshes every WATER2.every-th frame and skips what a ripple hides anyway: grass blades, instanced props and people, cars
      if(water2N++%WATER2.every)return;
      if(!WATER2.lite)return render0.call(this,r,s,c,...a);
      if(water2N>water2Next){water2Next=water2N+240;water2Heavy=[];const tr=new Set();for(const t of TREES)tr.add(t.L).add(t.C).add(t.Tk);s.traverse(o=>{if(o.isInstancedMesh&&!tr.has(o))water2Heavy.push(o);});if(world)for(const k of world.cars)water2Heavy.push(k.g);if(grass)water2Heavy.push(grass.mesh);}
      const was=water2Heavy.map(o=>o.visible);for(const o of water2Heavy)o.visible=false;
      render0.call(this,r,s,c,...a);water2Heavy.forEach((o,i)=>o.visible=was[i]);
    };
    wg.add(w);water2List.push(w);
  }
}
