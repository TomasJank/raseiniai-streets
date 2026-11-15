// maxima: Maxima XX (c2134) drawn from the Blender model, the code-built box and the old front dressing gone, the store solid,
// the corner canopy and the corner doors walkable, retaining wall / trolley shelter / free-standing kiosk solid.
// node test_maxima.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get FX(){return FX},get MXR(){return typeof MXR==='undefined'?null:MXR},get story(){return typeof storyPts==='undefined'?null:storyPts},get GY(){return GY},get collideCar(){return collideCar},get ENV(){return ENV},THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});
await p.waitForFunction(()=>__t.MXR&&__t.MXR.loaded,null,{timeout:60000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,H=T.MXR,F=H&&H.F;if(!F||!H.loaded)return{noFrame:true,step:!!H};
  const at=F.at,loc=(x,z)=>{const dx=x-F.o[0],dz=z-F.o[1];return[dx*F.R[0]+dz*F.R[1],dx*F.N[0]+dz*F.N[1]];};
  let tris=0,meshes=0,lambert=true,glow=0;H.group.traverse(o=>{if(o.isMesh){meshes++;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;
    lambert=lambert&&o.material.type==='MeshLambertMaterial';if(o.material.onBeforeCompile&&String(o.material.onBeforeCompile).includes('uNight'))glow++;}});
  let fx=false;T.wg.traverse(o=>{if(o.name==='fx_maxima')fx=true;});
  const lm=W.landmarks.maxima,lmIn=!!lm&&(()=>{let q=lm;while(q&&q!==H.group)q=q.parent;return q===H.group;})(),lmTris=lm?(lm.geometry.index?lm.geometry.index.count:lm.geometry.attributes.position.count)/3:0;
  // anything else drawn inside the footprint, on the store front, under the L-shaped corner canopy or in the kiosk (old walls, signs,
  // canopy, posts), 2.2 to 9.6 m above the ground (the lot's lamp heads at 10 m reach over the strip and stay)
  const mine=(u,b)=>(u>1&&u<65.6&&b>-4.5&&b<44)||(u>=65.6&&u<71&&b>-4.5&&b<11)||(u>77.3&&u<81.9&&b>-.3&&b<4.3);
  const y0=F.y0,V3=T.THREE.Vector3,v=new V3(),c=at(33,10),cv=new V3(c[0],y0,c[1]),inside={},who=new Set();let n=0;
  T.wg.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;let q=o.parent;while(q&&q!==H.group)q=q.parent;if(q===H.group)return;
    const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(o.matrixWorld);if(s.center.distanceTo(cv)>s.radius+60)return;
    const pa=g.attributes.position;for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);const[u,b]=loc(v.x,v.z);
      if(mine(u,b)&&v.y>T.GY(v.x,v.z)+2.2&&v.y<T.GY(v.x,v.z)+9.6){n++;who.add((o.name||o.material.type)+'@'+u.toFixed(0)+','+b.toFixed(0)+','+(v.y-T.GY(v.x,v.z)).toFixed(0));}}});
  const walk=(a,bq)=>{let[x,z]=at(...a);const[tx,tz]=at(...bq);for(let i=0;i<2000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
      const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(k=>+k.toFixed(2));};
  return{tris,meshes,lambert,glow,fx,lmIn,lmTris,other:n,who:[...who],walls:H.walls.length,
    store:walk([50,-8],[50,6]),storeNE:walk([75,20],[60,20]),doors:walk([75,7.5],[66.6,2.5]),front:walk([44,-3.2],[58,-3.2]),frontNE:walk([69,12],[69,-3]),story:(()=>{return T.story&&T.story['Maxima XX']?loc(T.story['Maxima XX'].x,T.story['Maxima XX'].z).map(k=>+k.toFixed(1)):null;})(),wall:walk([16.5,-5],[22,-5]),
    shelter:walk([25,-12.5],[21,-12.5]),kiosk:walk([79.6,10],[79.6,2])};});
if(r.noFrame){check('step present and model loaded',false,r);}else{
check('model loaded, Lambert, lit windows and signs',r.meshes>0&&r.tris>1000&&r.lambert&&r.glow>=2,{meshes:r.meshes,tris:r.tris,lambert:r.lambert,glow:r.glow});
check('facades shopfront gone, landmark is the model',!r.fx&&r.lmIn&&r.lmTris>50&&r.lmTris<5000,{fx:r.fx,lmIn:r.lmIn,lmTris:r.lmTris});
check('code-built box and old front dressing not drawn',r.other===0,{verts:r.other,who:r.who});
check('walking into the store is blocked (both faces)',r.store[1]<-.2&&r.storeNE[0]>66.7,{se:r.store,ne:r.storeNE});
check('walking under the corner canopy up to the north-east doors is not blocked',r.doors[0]<67.1&&Math.abs(r.doors[1]-2.5)<.6,r.doors);
check('walking along both faces under the canopy is not blocked',r.front[0]>57.9&&r.frontNE[1]<-2.9,{se:r.front,ne:r.frontNE});
check('the story stop for Maxima is out from the corner doors',!!r.story&&r.story[0]>70&&r.story[0]<76&&r.story[1]>4&&r.story[1]<10,r.story);
check('retaining wall, trolley shelter and kiosk are solid',r.wall[0]<19&&r.shelter[0]>22.5&&r.kiosk[1]>4.2,{wall:r.wall,shelter:r.shelter,kiosk:r.kiosk});}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
