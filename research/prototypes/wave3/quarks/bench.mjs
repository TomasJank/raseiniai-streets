import {createRequire} from 'module';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const dir=new URL('.',import.meta.url).pathname;
for(const f of process.argv.slice(2).length?process.argv.slice(2):['legacy','index']){
  const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>m.type()==='error'&&console.log('CONSOLE',m.text()));
  await p.goto('file://'+dir+f+'.html');await p.waitForFunction(()=>window.__stats,null,{timeout:60000});await p.waitForTimeout(500);
  const s=await p.evaluate(()=>window.__stats);await p.screenshot({path:dir+'shots/'+f+'.png'});console.log(f,JSON.stringify(s));await b.close();}
