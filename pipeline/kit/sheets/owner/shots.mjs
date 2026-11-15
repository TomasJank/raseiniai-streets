// camshots.mjs with a camera height (lift, m above ground) and a look-at height ty at distance dist: node shots.mjs page.html views.json outdir
// Run it on the page before your change and on the page after, then camsheet.py.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,list,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const h=fs.readFileSync(file,'utf8'),o='function drawMini(){';
const api=`window.__GFX={auto:false};window.__ks={get world(){return world},shot(v){tod=13;weather.kind='clear';weather.amt=weather.want=0;
  for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
  const x=v.x,z=v.z,a=v.head*Math.PI/180,g=GY(x,z),asp=v.w/v.h;
  sun.position.set(x+105,g+85,z+65);sun.target.position.set(x,g,z);sun.target.updateMatrixWorld();for(let i=0;i<40;i++)updateEnv(.05);
  camera.fov=2*Math.atan(v.h/2/v.f)*180/Math.PI;camera.aspect=asp;renderer.setPixelRatio(1);renderer.setSize(v.w,v.h,false);camera.updateProjectionMatrix();
  const ly=v.lift??1.4,ty=v.ty??ly;camera.position.set(x,g+ly,z);camera.lookAt(x+Math.sin(a)*10,g+ly+(ty-ly)*10/(v.dist||10),z-Math.cos(a)*10);camera.updateMatrixWorld();
  if(typeof perfTick==='function'){perfT=0;perfTick(.016);for(const c of world.cars)c.g.visible=false;}
  renderer.render(scene,camera);return renderer.domElement.toDataURL('image/jpeg',.92);}};`;
const tmp=out+'/_cam.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:800}});
await p.goto('file://'+fs.realpathSync(tmp),{timeout:300000});
await p.waitForFunction(()=>window.__ks&&__ks.world&&__ks.world.cars.length,null,{timeout:300000});await p.waitForTimeout(6000);
for(const v of JSON.parse(fs.readFileSync(list,'utf8'))){const u=await p.evaluate(v=>__ks.shot(v),v);fs.writeFileSync(`${out}/${v.bid}_${v.frame}.jpg`,Buffer.from(u.split(',')[1],'base64'));}
await b.close();fs.unlinkSync(tmp);console.log('done',out);
