import {createRequire} from 'module';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const dir=new URL('.',import.meta.url).pathname;
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>m.type()==='error'&&console.log('CONSOLE',m.text()));
await p.goto('file://'+dir+'index.html');await p.waitForFunction(()=>window.__stats,null,{timeout:60000});await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(()=>window.__stats)));await p.screenshot({path:dir+'shots/kick.png'});await b.close();
