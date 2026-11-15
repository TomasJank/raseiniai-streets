// top-down views of the game: node topdown.mjs page.html outdir name:x:z[:height] ...
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out,...pts]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const h=fs.readFileSync(file,'utf8'),o='function drawMini(){';
const api=`window.__GFX={auto:false};window.__ks={get world(){return world},shot(v){tod=13;weather.kind='clear';weather.amt=weather.want=0;
  for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
  const x=v.x,z=v.z,g=GY(x,z);sun.position.set(x+105,g+85,z+65);sun.target.position.set(x,g,z);sun.target.updateMatrixWorld();for(let i=0;i<40;i++)updateEnv(.05);
  camera.fov=45;camera.aspect=1;renderer.setPixelRatio(1);renderer.setSize(900,900,false);camera.updateProjectionMatrix();
  camera.position.set(x,g+v.hh,z+.001);camera.up.set(0,0,-1);camera.lookAt(x,g,z);camera.updateMatrixWorld();
  if(typeof perfTick==='function'){perfT=0;perfTick(.016);for(const c of world.cars)c.g.visible=false;}
  renderer.render(scene,camera);return renderer.domElement.toDataURL('image/jpeg',.9);}};`;
const tmp=out+'/_td.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:800}});
await p.goto('file://'+fs.realpathSync(tmp),{timeout:300000});
await p.waitForFunction(()=>window.__ks&&__ks.world&&__ks.world.cars.length,null,{timeout:300000});await p.waitForTimeout(6000);
for(const a of pts){const [n,x,z,hh]=a.split(':');const u=await p.evaluate(v=>__ks.shot(v),{x:+x,z:+z,hh:+(hh||45)});fs.writeFileSync(`${out}/${n}.jpg`,Buffer.from(u.split(',')[1],'base64'));}
await b.close();fs.unlinkSync(tmp);console.log('done');
