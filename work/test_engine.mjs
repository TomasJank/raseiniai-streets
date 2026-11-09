// does every shader patch still land? node test_engine.mjs page.html
// replays each material's onBeforeCompile on the stock template and records string anchors that matched nothing
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__e={THREE,scene,renderer,get world(){return world}};`;
fs.writeFileSync(dir+'_engine.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[],warns=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{const t=m.text();if(/fonts|ERR_/.test(t))return;if(m.type()==='error')errs.push(t.slice(0,2500));else if(m.type()==='warning')warns.push(t.slice(0,160));});
await p.goto('file://'+dir+'_engine.html');
await p.waitForFunction(()=>window.__e&&__e.world&&__e.world.cars.length,null,{timeout:120000});await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{
  const {THREE,scene,renderer}=__e,mats=new Set();
  scene.traverse(o=>{for(const m of [].concat(o.material||[]))if(m.onBeforeCompile&&m.onBeforeCompile.toString()!==THREE.Material.prototype.onBeforeCompile.toString())mats.add(m);});
  const lib={MeshLambertMaterial:'lambert',MeshPhongMaterial:'phong',MeshBasicMaterial:'basic',MeshStandardMaterial:'standard'};
  const orig=String.prototype.replace,miss=new Set();let calls=0;
  String.prototype.replace=function(a,b){if(typeof a==='string'&&this.length>400){calls++;if(!this.includes(a))miss.add(a.slice(0,70));}return orig.call(this,a,b);};
  for(const m of mats){const L=THREE.ShaderLib[lib[m.type]];if(!L)continue;const sh={vertexShader:L.vertexShader,fragmentShader:L.fragmentShader,uniforms:{...L.uniforms},defines:{}};try{m.onBeforeCompile(sh,renderer);}catch(e){miss.add('THREW '+e.message);}}
  String.prototype.replace=orig;
  return{revision:THREE.REVISION,materials:mats.size,replaceCalls:calls,missed:[...miss],programs:renderer.info.programs.length};
});
console.log('engine',JSON.stringify(r));
console.log('errors',JSON.stringify(errs.slice(0,8)));
console.log('warnings',JSON.stringify([...new Set(warns)].slice(0,8)));
await b.close();
