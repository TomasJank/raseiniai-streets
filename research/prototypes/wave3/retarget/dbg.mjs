import {createRequire} from 'module';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const dir=new URL('.',import.meta.url).pathname;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const p=await b.newPage();
await p.goto('file://'+dir+'index.html');await p.waitForFunction(()=>window.__dbg,null,{timeout:60000});
console.log(JSON.stringify(await p.evaluate(()=>window.__dbg)));await b.close();
