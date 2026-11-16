// renders the check audio from audition.html with OfflineAudioContext: node render.mjs OUT_DIR  (writes drive_*.wav, seam_*.wav, frames.json)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
const page=new URL('../audition.html',import.meta.url).pathname;
const b=await chromium.launch({args:['--use-angle=metal','--allow-file-access-from-files']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+page);
const r=await p.evaluate(()=>renderChecks());
for(const[k,v]of Object.entries(r))if(typeof v==='string')fs.writeFileSync(out+'/'+k+'.wav',Buffer.from(v,'base64'));
fs.writeFileSync(out+'/frames.json',JSON.stringify({frames:r.frames,lens:r.lens}));
console.log(Object.keys(r).length,'items',errs);await b.close();
