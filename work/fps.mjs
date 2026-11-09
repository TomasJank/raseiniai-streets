// fps + load baseline: node fps.mjs page.html  (tries real GPU via ANGLE/Metal, falls back to swiftshader)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
for(const args of [['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files'],['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']]){
  const b=await chromium.launch({args});const p=await b.newPage({viewport:{width:1280,height:720}});
  const t0=Date.now();await p.goto('file://'+file);
  try{await p.waitForFunction(()=>document.getElementById('loader')&&document.getElementById('loader').hidden,null,{timeout:120000});}catch(e){console.log('loader never hid');}
  const load=Date.now()-t0;await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>new Promise(res=>{const gl=document.querySelector('canvas').getContext('webgl2')||document.querySelector('canvas').getContext('webgl');const dbg=gl&&gl.getExtension('WEBGL_debug_renderer_info');const ren=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'?';let n=0;const s=performance.now();const f=()=>{n++;if(performance.now()-s<4000)requestAnimationFrame(f);else res({fps:+(n/4).toFixed(1),renderer:ren,mem:performance.memory&&(performance.memory.usedJSHeapSize/1048576|0)});};requestAnimationFrame(f);}));
  console.log(JSON.stringify({args:args[0],loadMs:load,...r}));await b.close();
}
