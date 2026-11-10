// Parked cars via InstancedMesh2: node test_parked2.mjs new.html [baseline.html]
// count unchanged, cars within 60 m of the camera all drawn, none past 400 m, aerial triangles <= 40% of the baseline's.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,base]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
const o='function drawMini(){';
const api=`window.__t={get PARKED(){return PARKED},get world(){return world},set paused(v){mapOpen=v},camera,renderer,scene,worldGroup,THREE,get GY(){return GY}};`;
const run=async(f,tag)=>{
  const h=fs.readFileSync(f,'utf8');if(h.split(o).length!==2)throw new Error('hook');
  const tmp=dir+'_parked2_'+tag+'.html';fs.writeFileSync(tmp,h.replace(o,api+o));
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:1280,height:720}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
  await p.goto('file://'+tmp,{timeout:180000});
  await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length&&__t.PARKED.cars.length,null,{timeout:120000});await p.waitForTimeout(3000);
  await p.evaluate(()=>{__t.paused=true;});
  const r=await p.evaluate(async()=>{
    const T=__t,{THREE,camera,renderer,scene}=T,P=T.PARKED,cs=P.cars,out={parked:cs.length,meshes:P.meshes.length};
    // street view: camera 45 m back from the parked car with the most neighbours within 60 m; aerial: 350 m above the centroid of those
    let best=cs[0],bn=-1;for(const c of cs.filter((_,i)=>i%7===0)){const n=cs.reduce((s,d)=>s+((d.x-c.x)**2+(d.z-c.z)**2<3600),0);if(n>bn){bn=n;best=c;}}
    const cx=cs.reduce((s,c)=>s+c.x,0)/cs.length,cz=cs.reduce((s,c)=>s+c.z,0)/cs.length;
    const fr=new THREE.Frustum(),M=new THREE.Matrix4(),S=new THREE.Sphere();
    const views={street:[[best.x-35,T.GY(best.x,best.z)+2.5,best.z-35],[best.x,T.GY(best.x,best.z)+1,best.z]],aerial:[[cx,350,cz+1],[cx,0,cz]]};
    const set=v=>{camera.position.set(...v[0]);camera.up.set(0,1,0);camera.lookAt(...v[1]);camera.updateMatrixWorld();};
    const info=()=>{const i=renderer.info.render;return{calls:i.calls,tris:i.triangles};};
    for(const [name,v] of Object.entries(views)){
      set(v);await new Promise(r=>setTimeout(r,900));set(v);renderer.render(scene,camera);const all=info();
      set(v);renderer.render(scene,camera);
      const parkedTris=P.meshes.reduce((s,m)=>s+(m.visible?m.count*(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3:0),0),parkedCalls=P.meshes.filter(m=>m.visible&&m.count>0).length;
      const res={calls:all.calls,tris:all.tris,parkedCalls,parkedTris};
      // which cars were drawn (new build only: InstancedMesh2 exposes the culled count)
      if(P.meshes[0].instancesCount!==undefined){
        const key=(x,z)=>Math.round(x*10)+','+Math.round(z*10),drawn=new Set();let far=0,maxD=0;const pos=new THREE.Vector3();
        for(const m of P.meshes){if(m.geometry.attributes.color&&m.geometry.attributes.color.count===cs.length*0)continue;
          const isFar=m===P.meshes[P.meshes.length-1];
          for(let j=0;j<m.count;j++){const id=m.instanceIndex.array[j];m.getPositionAt(id,pos);maxD=Math.max(maxD,Math.hypot(pos.x-camera.position.x,pos.z-camera.position.z));drawn.add(key(pos.x,pos.z));if(isFar)far++;}}
        fr.setFromProjectionMatrix(M.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
        const need=cs.filter(c=>Math.hypot(c.x-camera.position.x,c.z-camera.position.z)<60&&fr.intersectsSphere(S.set(new THREE.Vector3(c.x,c.y+.8,c.z),2.5)));
        res.within60InFrustum=need.length;res.within60Missing=need.filter(c=>!drawn.has(key(c.x,c.z))).length;res.drawnCars=drawn.size;res.farDrawn=far;res.maxDrawnDist=+maxD.toFixed(1);
        res.farCapacity=P.meshes[P.meshes.length-1].instancesCount;
      }
      const gl=renderer.getContext();let t=performance.now();for(let i=0;i<3;i++){set(v);renderer.render(scene,camera);gl.finish();}res.msPerFrame=Math.round((performance.now()-t)/3);
      out[name]=res;
    }
    return out;});
  await b.close();return{r,errs};};
const fails=[];const chk=(n,ok,d)=>{console.log(ok?'PASS':'FAIL',n,d===undefined?'':JSON.stringify(d));if(!ok)fails.push(n);};
const N=await run(file,'new');console.log(JSON.stringify(N.r,null,1));
let B=null;if(base){B=await run(base,'base');console.log('baseline',JSON.stringify(B.r,null,1));}
const r=N.r;
chk('parkedCount',r.parked===(B?B.r.parked:1097),{new:r.parked,base:B&&B.r.parked});
for(const v of['street','aerial']){chk(v+'/within60Drawn',r[v].within60InFrustum>0&&r[v].within60Missing===0,[r[v].within60InFrustum,r[v].within60Missing]);
  chk(v+'/none>400m',r[v].maxDrawnDist<400.5,r[v].maxDrawnDist);}
if(B){console.log('whole-scene aerial tris ratio (buildings dominate, informational)',JSON.stringify({new:r.aerial.tris,base:B.r.aerial.tris,ratio:+(r.aerial.tris/B.r.aerial.tris).toFixed(3)}));
  chk('aerialParkedTris<=40%',r.aerial.parkedTris<=.4*B.r.aerial.parkedTris,{new:r.aerial.parkedTris,base:B.r.aerial.parkedTris,ratio:+(r.aerial.parkedTris/B.r.aerial.parkedTris).toFixed(3)});}
chk('noConsoleErrors',N.errs.length===0,N.errs);
console.log(fails.length?'FAILED: '+fails.join(', '):'ALL PASS');process.exit(fails.length?1:0);
