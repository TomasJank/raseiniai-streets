// node probe.mjs page.html script.js : loads the page headless (Metal), runs script.js's body inside the page's module scope, prints its JSON
import {createRequire} from 'module';import fs from 'fs';import path from 'path';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const [f,js]=process.argv.slice(2),b='// ---------- boot ----------';
const h=fs.readFileSync(f,'utf8').replace(b,'window.__GFX={auto:false};window.__k={ev(s){return eval(s)}};\n'+b),o=path.join(path.dirname(path.resolve(f)),'_pr_'+path.basename(f));fs.writeFileSync(o,h);
const br=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await br.newPage({viewport:{width:800,height:500}}),log=[];
p.on('pageerror',e=>log.push('ERR '+e.message));p.on('console',m=>{if(/error|warning/.test(m.type())&&!/fonts|ERR_/.test(m.text()))log.push(m.type()+' '+m.text().slice(0,400));});
await p.goto('file://'+o,{timeout:600000});await p.waitForFunction(()=>window.__k&&__k.ev("typeof world!=='undefined'&&world&&world.cars.length"),null,{timeout:600000});
const r=await p.evaluate(s=>__k.ev('(()=>{'+s+'})()'),fs.readFileSync(js,'utf8'));
console.log(JSON.stringify(r,null,1));console.log(log.join('\n'));await br.close();fs.unlinkSync(o);
