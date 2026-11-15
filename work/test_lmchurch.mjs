// lmchurch: the Ėmimo į Dangų church (c92) and the Trejybės cerkvė (c219) drawn from the Blender models; landmarks2's church mesh,
// the facades cerkvė dome, the code-built bodies and town.js's dark church windows gone from both; both solid; landmarks kept.
// node test_lmchurch.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get scene(){return scene},get FX(){return FX},get LMC(){return typeof LMC==='undefined'?null:LMC},get GY(){return GY},get collideCar(){return collideCar},get pip(){return pip},THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});
await p.waitForFunction(()=>__t.LMC&&__t.LMC.ch.loaded&&__t.LMC.ce.loaded,null,{timeout:60000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,H=T.LMC;if(!H||!H.ch.loaded||!H.ce.loaded)return{noModel:true,step:!!H};
  const out={names:[]};T.scene.traverse(q=>{if(/^(lm2_church|fx_cerkve|fx_church)$/.test(q.name))out.names.push(q.name);});
  const tri=m=>m?m.geometry.attributes.position.count/3:0,inG=(m,G)=>{let q=m;while(q&&q!==G)q=q.parent;return q===G;};
  for(const k of['ch','ce']){const L=H[k],F=L.F,G=L.group,rec=T.FX.recs.find(q=>q.id===L.id),P=rec.pts,lm=W.landmarks[k==='ch'?'church':'cerkve'];
    let meshes=0,lambert=true,glow=0;G.traverse(q=>{if(q.isMesh){meshes++;lambert=lambert&&q.material.type==='MeshLambertMaterial';if(q.material.onBeforeCompile&&String(q.material.onBeforeCompile).includes('uNight'))glow++;}});
    const loc=(x,z)=>[x*F.V[0]+z*F.V[1]-L.o[0],x*F.U[0]+z*F.U[1]-L.o[1]];
    const dSeg=(x,z)=>Math.min(...P.map((a,i)=>{const b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}));
    // anything else drawn inside the footprint or within 1 m of its walls, 0.8 to 30 m above the ground; props2's garden plants and the
    // LiDAR trees (white instanced trunks and crowns: one crown beside the cerkvė's refectory touches its roof, as the real tree does) are left out
    const tree=m=>m.isInstancedMesh&&m.material.color&&m.material.color.getHex()===0xffffff&&/^(Icosahedron|Cylinder)Geometry$/.test(m.geometry.type);
    const v=new T.THREE.Vector3(),M=new T.THREE.Matrix4(),c=F.at(0,0),who=new Set();let n=0;
    T.scene.traverse(m=>{if(!m.isMesh||inG(m,G)||m.userData.props2||tree(m)||!m.geometry.attributes.position)return;const pa=m.geometry.attributes.position,cnt=m.isInstancedMesh?m.count:1;
      if(!m.isInstancedMesh){const g=m.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(m.matrixWorld);if(Math.hypot(s.center.x-c[0],s.center.z-c[1])>s.radius+45)return;}
      for(let j=0;j<cnt;j++){if(m.isInstancedMesh){m.getMatrixAt(j,M);M.premultiply(m.matrixWorld);}else M.copy(m.matrixWorld);
        for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(M);if(Math.hypot(v.x-c[0],v.z-c[1])>40)continue;
          if(!(T.pip(v.x,v.z,P)||dSeg(v.x,v.z)<1))continue;const gy=T.GY(v.x,v.z);if(v.y>gy+.8&&v.y<gy+30){n++;who.add((m.name||m.material.type)+(m.isInstancedMesh?'#inst':''));}}}});
    const walk=(a,bq)=>{let[x,z]=F.at(...a);const[tx,tz]=F.at(...bq);for(let i=0;i<3000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
        const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return{at:loc(x,z).map(k=>+k.toFixed(2)),inside:!!W.inBuilding(x,z)};};
    out[k]={meshes,tris:(()=>{let t=0;G.traverse(q=>{if(q.isMesh)t+=q.geometry.index.count/3;});return t;})(),lambert,glow,lmIn:!!lm&&inG(lm,G),lmTris:tri(lm),other:n,who:[...who],
      walks:k==='ch'?{north:walk([1,30],[1,0]),south:walk([0,-30],[0,0]),east:walk([24,-5],[0,-5]),west:walk([-22,-5],[0,-5]),door:walk([0.54,30],[0.54,23])}
        :{front:walk([0,35],[0,0]),apse:walk([0,-35],[0,0]),ne:walk([30,-5],[0,-5]),sw:walk([-30,-5],[0,-5]),portal:walk([1.2,30],[1.2,14])}};}
  const C=W.lm2&&W.lm2.church;out.lm2=C&&{mesh:C.mesh===W.landmarks.church,eave:+(C.eave-C.y0).toFixed(1),ridge:+(C.ridge-C.y0).toFixed(1),towerTop:+(C.towerTop-C.y0).toFixed(1),top:+(C.top-C.y0).toFixed(1),
    towers:C.towers.map(t=>W.inBuilding(t[0],t[1])?1:0)};
  out.landmarks=['church','cerkve','culture','maxima'].map(k=>[k,tri(W.landmarks[k])]);
  return out;});
if(r.noModel){check('step present and models loaded',false,r);}else{
for(const k of['ch','ce'])check(k+': model loaded, Lambert, night windows',r[k].meshes>=1&&r[k].tris>1000&&r[k].lambert&&r[k].glow>=1,{meshes:r[k].meshes,tris:r[k].tris,lambert:r[k].lambert,glow:r[k].glow});
check('lm2_church and fx_cerkve gone, landmarks are the models (50..5000 tris as test_facades counts)',!r.names.length&&r.ch.lmIn&&r.ce.lmIn&&r.ch.lmTris>50&&r.ch.lmTris<5000&&r.ce.lmTris>50&&r.ce.lmTris<5000,{names:r.names,landmarks:r.landmarks});
for(const k of['ch','ce'])check(k+': nothing else drawn on the footprint (code-built body, old meshes, town.js windows)',r[k].other===0,{verts:r[k].other,who:r[k].who});
const out=(w)=>!w.inside;
// each walk starts inside the churchyard and must stop within 0.6 m of the outline (the churchyard wall must not be what stops it)
const near=(v,a,b)=>v>=a&&v<=b;
check('church solid from all four sides',out(r.ch.walks.north)&&near(r.ch.walks.north.at[1],24,24.6)&&out(r.ch.walks.south)&&near(r.ch.walks.south.at[1],-23.8,-23.14)&&out(r.ch.walks.east)&&near(r.ch.walks.east.at[0],16.75,17.35)&&out(r.ch.walks.west)&&near(r.ch.walks.west.at[0],-15.1,-14.54),r.ch.walks);
check('church: walk up to the main door is not blocked before the front wall',Math.abs(r.ch.walks.door.at[1]-24.35)<.2,r.ch.walks.door);
check('cerkve solid from all four sides',out(r.ce.walks.front)&&near(r.ce.walks.front.at[1],16,16.6)&&out(r.ce.walks.apse)&&near(r.ce.walks.apse.at[1],-15.7,-15.1)&&out(r.ce.walks.ne)&&near(r.ce.walks.ne.at[0],8.1,8.7)&&out(r.ce.walks.sw)&&near(r.ce.walks.sw.at[0],-8.3,-7.7),r.ce.walks);
check('cerkve: the tower portal (outside the footprint) is solid',r.ce.walks.portal.at[1]>16.2,r.ce.walks.portal);
check('world.lm2.church describes the model (twin towers inside the outline, heights)',!!r.lm2&&r.lm2.mesh&&r.lm2.towers.every(Boolean)&&r.lm2.eave===11.5&&r.lm2.ridge===17.5&&r.lm2.towerTop>=21&&r.lm2.top>=22,r.lm2);}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
