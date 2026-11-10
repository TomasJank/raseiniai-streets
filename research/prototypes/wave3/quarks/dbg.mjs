import {createRequire} from 'module';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const p=await b.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+new URL('index.html',import.meta.url).pathname);await p.waitForFunction(()=>window.__stats,null,{timeout:60000});
console.log(JSON.stringify(await p.evaluate(()=>{const r=window.__rainPS;const q=[];for(let i=0;i<5;i++){const x=r.particles[i];q.push(x&&{p:x.position.toArray().map(v=>+v.toFixed(1)),v:x.velocity.toArray().map(v=>+v.toFixed(1)),life:x.life,age:x.age,size:x.size.toArray()});}return {n:r.particleNum,q,em:r.emitter.position.toArray(),ws:r.worldSpace};})));
await b.close();
