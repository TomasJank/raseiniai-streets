// dumps the generated yard-fence segments (world.hedgeSegs) near the street's houses: node segs.mjs page.html out.json
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/'.replace('career-ops/','career-ops/'));
const {chromium}=require('playwright');
const [file,out]=process.argv.slice(2);
const h=fs.readFileSync(file,'utf8'),o='function drawMini(){';
const api=`window.__ks={get world(){return world},get hs(){return world.hedgeSegs||[]},get gaps(){return (world.gaps||[]).map(g=>[g[0],g[1]])}};`;
const tmp=out+'.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:800,height:600}});
await p.goto('file://'+fs.realpathSync(tmp),{timeout:300000});
await p.waitForFunction(()=>window.__ks&&__ks.world&&__ks.world.cars.length,null,{timeout:300000});await p.waitForTimeout(4000);
const d=await p.evaluate(()=>({hs:__ks.hs.filter(s=>s[0]<500&&s[0]>-500&&s[1]<-200&&s[1]>-1050).map(s=>s.map(v=>Math.round(v*10)/10)),gaps:__ks.gaps.filter(s=>s[0]<500&&s[0]>-500&&s[1]<-200&&s[1]>-1050)}));
fs.writeFileSync(out,JSON.stringify(d));await b.close();fs.unlinkSync(tmp);console.log(d.hs.length,d.gaps.length);
