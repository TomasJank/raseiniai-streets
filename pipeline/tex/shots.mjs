// before/after views for the tex step: node shots.mjs page.html outdir [prefix] [name filter regex]
// fixed cameras (world metres), people and traffic hidden, so two builds render the same scene. Writes <page>_shots.html beside the page.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out,prefix='',only='']=process.argv.slice(2);
fs.mkdirSync(out,{recursive:true});
// [name, wall midpoint x z, outward normal x z, distance, sideways, eye height, look height] or [name, from x z up, to x z up, hour]
const WALLS=[
  ['flats',-454.8,-387.1,.898,.44,24,8,1.7,7],
  ['flats_brick',-75.7,-392.2,.566,-.824,20,6,1.7,5],
  ['garages',-746.4,85.7,.447,-.895,9,10,1.7,1.4],
  ['hall',675.5,870,-.619,.785,22,10,1.7,4],
  ['wooden',738.2,558.4,.615,-.788,9,3,1.7,2],
  ['close_brick',530,467.7,.591,-.806,3,0,1.6,1.6],
  ['close_plank',738.2,558.4,.615,-.788,3,1,1.6,1.6],
  ['close_silicate',-75.7,-392.2,.566,-.824,3,2,1.6,1.6],
  ['close_corrugated',-746.4,85.7,.447,-.895,3,3,1.6,1.4],
  ['close_panel',-454.8,-387.1,.898,.44,3,2,1.6,1.8],
  ['shed_boards',886.5,596.5,-.732,-.682,8,2,1.7,2],
  ['house_plaster',345.5,32.6,.39,.921,9,2,1.7,2.2],
  ['close_plaster',345.5,32.6,.39,.921,3,1,1.6,1.6],
  ['close_plaster2',328.5,-25.7,.929,-.37,3,1,1.6,1.6],
];
const FREE=[
  ['vilniaus',-116,-83.3,1.5,-90,-65,2.6],
  ['vilniaus2',70,68,1.5,100,98,3],
  ['maironio',-243.1,-314.3,1.5,-219,-344.1,2.6],
  ['maironio2',-60,-497,1.5,-30,-527,3],
  ['roofs',-80,-50,22,-150,-120,3],
  ['roofs2',700,560,16,660,610,2],
  ['roof_tiles',336,-11,8,322.5,-23.4,5],
  ['roof_asbestos',581,57,9,568.5,45.8,6.5],
  ['roof_bitumen',-733,68,9,-748,88,3],
  ['night',-435,-370,1.7,-454.8,-387.1,7,23],
  ['aerial',20,25,120,-120,-87,0],
  ['aerial_high',300,300,420,-100,-100,0],
];
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__v={get world(){return world},get GY(){return GY},ready:()=>typeof TEX==='undefined'||TEX.loaded,
view(from,to,t=13){
  tod=t;weather.kind='clear';weather.amt=weather.want=0;
  for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
  const gx=to[0],gz=to[2],gp=GY(gx,gz);sun.position.set(gx+105,gp+85,gz+65);sun.target.position.set(gx,gp,gz);sun.target.updateMatrixWorld();
  for(let i=0;i<40;i++)updateEnv(.05);
  camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();if(typeof perfTick==="function"){perfT=0;perfTick(.016);}renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');}};`;
const tmp=file.replace(/\.html$/,'')+'_shots.html';
fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push((e.stack||e.message).slice(0,400)));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+tmp);
await p.waitForFunction(()=>window.__v&&__v.world&&__v.world.cars.length&&__v.ready(),null,{timeout:120000});await p.waitForTimeout(1500);
const cams=[...WALLS.map(([n,mx,mz,nx,nz,d,s,e,l])=>[n,mx+nx*d-nz*s,mz+nz*d+nx*s,e,mx,mz,l]),...FREE].filter(c=>new RegExp(only).test(c[0]));
for(const [n,fx,fz,fu,tx,tz,tu,tod=13] of cams){
  const u=await p.evaluate(([fx,fz,fu,tx,tz,tu,tod])=>{const G=__v.GY;return __v.view([fx,G(fx,fz)+fu,fz],[tx,G(tx,tz)+tu,tz],tod);},[fx,fz,fu,tx,tz,tu,tod]);
  fs.writeFileSync(`${out}/${prefix}${n}.png`,Buffer.from(u.split(',')[1],'base64'));
}
console.log('shots',cams.length,'errors',JSON.stringify([...new Set(errs)].slice(0,4)));
await b.close();
