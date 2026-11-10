// comparison sheet: node compare.mjs page.html out.png   (page = build.sh + add_cars2.py)
// Each fleet model next to the procedural car it replaces, then the rejected candidates, all with playtest.mjs's car
// close-up camera, same paint, real-world scale (rejected ones scaled to a typical length for their class).
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,outPng]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,R='/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/research/assets/vehicles/rejected/';
const PAIRS=[['estate','passat_b5Geo'],['estate80','a6_c5_avantGeo'],['sedan','a4_b6Geo'],['saloon90','carGeo'],['hatch','golf4Geo'],['liftback','avensisGeo'],['suv','rav4Geo'],['van','zafira_aGeo'],['truck','mpvGeo'],['pickup','suvGeo'],['police','skodaGeo']];
const REJ=[['Stationwagon_vTTTjDoxhV','KayKit stationwagon: toy proportions',4.4],['PoliceCar_BwwnUrWGmV','Quaternius police: US livery',4.7],['Taxi_x43lOScTpN','Quaternius taxi: sedan + TAXI sign',4.6],
  ['Van_akcsFuPMt3b','Poly van: chunky, 5.6k tris',4.9],['Van_9hUUD2DWk1v','jeremy minibus: open interior',5.2],['Bus_bsvS0E1eo4R','jeremy coach: 12 m, car physics',12],['Bus_4CPpvEmrMoF','Poly coach: 12 m, car physics',12]]
  .map(([f,why,len])=>({f,why,len,b:fs.readFileSync(R+f+'.glb').toString('base64')}));
const o='function drawMini(){';const h=fs.readFileSync(file,'utf8');
const api=`window.__c={set paused(v){mapOpen=v},get world(){return world},get player(){return player},get CARS2(){return CARS2},makeCarMesh,makeCarMesh0,policeExtras,resetToRoad,syncCar,worldGroup,renderer,scene,camera,get GY(){return GY},
geo:n=>eval(n)};`;
fs.writeFileSync(dir+'_compare.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:720,height:448}});const errs=[];p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' ')));
await p.goto('file://'+dir+'_compare.html');await p.waitForFunction(()=>window.__c&&__c.player&&__c.player.car,null,{timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(()=>{__c.paused=true;});
const png=await p.evaluate(async({PAIRS,REJ})=>{
  const T=__c,W=360,H=224,cols=4,rows=Math.ceil(PAIRS.length/2)+Math.ceil(REJ.length/4);
  const cv=document.createElement('canvas');cv.width=W*cols;cv.height=H*rows+28;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);
  x.font='bold 15px sans-serif';x.fillStyle='#222';x.fillText('left of each pair: current procedural car (pipeline/cars)   right: GLB fleet (cars2)   last rows: rejected candidates',8,19);
  T.resetToRoad();const c=T.player.car;c.speed=0;c.ride=null;T.syncCar(c);c.g.visible=false;const fog=T.scene.fog;
  const s=Math.sin(c.h),k=Math.cos(c.h),rx=k,rz=-s,y=T.GY(c.x,c.z),P=(a,b,u)=>[c.x+s*a+rx*b,y+u,c.z+k*a+rz*b];
  const snap=(g,i,label)=>{g.position.copy(c.g.position);g.rotation.copy(c.g.rotation);T.worldGroup.add(g);T.camera.position.set(...P(4.3,3.6,.95));T.camera.lookAt(...P(.1,0,.62));T.camera.updateMatrixWorld();
    T.scene.fog=null;T.renderer.render(T.scene,T.camera);T.scene.fog=fog;const cx=(i%cols)*W,cy=28+Math.floor(i/cols)*H;x.drawImage(T.renderer.domElement,cx,cy,W,H);
    x.fillStyle='rgba(0,0,0,.55)';x.fillRect(cx,cy,W,20);x.fillStyle='#fff';x.font='13px sans-serif';x.fillText(label,cx+5,cy+15);T.worldGroup.remove(g);};
  let i=0;const col=0x24406e;
  for(const[key,old]of PAIRS){const G=T.geo(old),F=key==='police'?T.CARS2.police:T.CARS2.models[key];
    snap(T.makeCarMesh0(col,G),i++,'procedural '+old.replace('Geo',''));snap(T.makeCarMesh(col,key==='police'?G:F),i++,'GLB '+key+(key==='police'?'':' ('+F.dims.join(' x ')+' m)'));}
  i=Math.ceil(i/cols)*cols;
  const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js'),L=new GLTFLoader();
  for(const r of REJ){const bin=Uint8Array.from(atob(r.b),q=>q.charCodeAt(0));const gl=await L.parseAsync(bin.buffer,''),g=gl.scene;
    g.updateMatrixWorld(true);
    let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];g.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();const q=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
      for(let d=0;d<3;d++){lo[d]=Math.min(lo[d],q.min.getComponent(d));hi[d]=Math.max(hi[d],q.max.getComponent(d));}});
    const len=Math.max(hi[0]-lo[0],hi[2]-lo[2]),sc=r.len/len,w=new g.constructor();g.position.set(-(lo[0]+hi[0])/2*sc,-lo[1]*sc,-(lo[2]+hi[2])/2*sc);g.scale.setScalar(sc);
    if(hi[0]-lo[0]>hi[2]-lo[2]){g.position.set(-(lo[2]+hi[2])/2*sc,-lo[1]*sc,(lo[0]+hi[0])/2*sc);g.rotation.y=Math.PI/2;}
    w.add(g);snap(w,i++,'rejected: '+r.why);}
  c.g.visible=true;return cv.toDataURL('image/png');},{PAIRS,REJ:REJ.map(({f,why,len,b})=>({f,why,len,b}))});
fs.writeFileSync(outPng,Buffer.from(png.split(',')[1],'base64'));console.log('wrote',outPng,'errors',JSON.stringify(errs.slice(0,4)));await b.close();
