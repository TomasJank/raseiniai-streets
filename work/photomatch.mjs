// render the game from where each Mapillary photo was taken: node photomatch.mjs page.html views.json outdir
// views.json comes from refs/mapillary (lat, lon, compass angle, focal as a fraction of the long side)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,list,out]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
fs.mkdirSync(out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__pm={get world(){return world},ev(s){return eval(s)},
shot(v){tod=13;weather.kind='clear';weather.amt=weather.want=0;
  for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
  let [x,z]=LL(v.lat,v.lon);const a=v.ang*Math.PI/180;
  // photo GPS is often 5-15 m off the road: snap to the nearest road within 20 m, in the right-hand lane
  {let best=400,bx=x,bz=z;for(const e of world.edges){const A=world.graph.get(e.a),B=world.graph.get(e.b),dx=B.x-A.x,dz=B.z-A.z,t=Math.max(0,Math.min(1,((x-A.x)*dx+(z-A.z)*dz)/(dx*dx+dz*dz||1))),px=A.x+dx*t,pz=A.z+dz*t,d=(px-x)**2+(pz-z)**2;
    if(d<best){best=d;bx=px+Math.cos(a)*e.w/4;bz=pz+Math.sin(a)*e.w/4;}}x=bx;z=bz;}
  const g=GY(x,z);
  sun.position.set(x+105,g+85,z+65);sun.target.position.set(x,g,z);sun.target.updateMatrixWorld();
  for(let i=0;i<40;i++)updateEnv(.05);
  const asp=v.w/v.h;camera.fov=2*Math.atan(.5/asp/v.cam[0])*180/Math.PI;camera.aspect=asp;
  renderer.setPixelRatio(1);renderer.setSize(1024,Math.round(1024/asp),false);camera.updateProjectionMatrix();
  camera.position.set(x,g+1.35,z);camera.lookAt(x+Math.sin(a)*10,g+1.25,z-Math.cos(a)*10);camera.updateMatrixWorld();
  if(typeof perfTick==='function'){perfT=0;perfTick(.016);for(const c of world.cars)c.g.visible=false;}
  renderer.render(scene,camera);return renderer.domElement.toDataURL('image/jpeg',.9);}};`;
fs.writeFileSync(dir+'_pm.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'_pm.html');
await p.waitForFunction(()=>window.__pm&&__pm.world&&__pm.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
for(const v of JSON.parse(fs.readFileSync(list,'utf8'))){
  const u=await p.evaluate(v=>__pm.shot(v),v);
  fs.writeFileSync(`${out}/${v.file.replace('/','_')}`,Buffer.from(u.split(',')[1],'base64'));
}
console.log('photomatch done',errs.slice(0,4));await b.close();
