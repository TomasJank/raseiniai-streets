// Review shots in the real game on the GPU: node shots.mjs page.html outdir script.js
// script.js is the body of an async function run in the page with T (game internals) and shot(name, from[3], to[3]);
// each shot is saved as outdir/name.jpg.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const [file,out,script]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const o='function drawMini(){';let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__s={get world(){return world},get player(){return player},get CARS4(){return CARS4},get CARS2(){return CARS2},get PARKED(){return PARKED},get PARKED2(){return PARKED2},get bus(){return bus},get LL(){return LL},get ENV(){return ENV},
set paused(v){mapOpen=v},set tod(v){tod=v},lampsSet,get makeCarMesh(){return makeCarMesh},syncCar,resetToRoad,worldGroup,renderer,scene,camera,get GY(){return GY}};`;
const tmp=out+'/_shots.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>console.log('page error',e.message,(e.stack||'').split('\n').slice(1,3).join(' | ').slice(0,300)));p.on('console',m=>{if(m.type()==='log')console.log(m.text());});
await p.goto('file://'+tmp,{timeout:180000});await p.waitForFunction(()=>window.__s&&__s.world&&__s.world.cars.length,null,{timeout:180000});await p.waitForTimeout(4000);
const body=fs.readFileSync(script,'utf8');
const shots=await p.evaluate(async body=>{const T=__s,r={};
  const shot=(name,from,to)=>{T.camera.position.set(...from);T.camera.lookAt(...to);T.camera.updateMatrixWorld();T.renderer.render(T.scene,T.camera);r[name]=T.renderer.domElement.toDataURL('image/jpeg',.9);};
  await new (Object.getPrototypeOf(async function(){}).constructor)('T','shot',body)(T,shot);return r;},body);
for(const k in shots)fs.writeFileSync(out+'/'+k+'.jpg',Buffer.from(shots[k].split(',')[1],'base64'));
console.log(Object.keys(shots).join(' '));fs.unlinkSync(tmp);await b.close();
