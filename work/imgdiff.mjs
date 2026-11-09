// mean per-pixel difference between two folders of same-named PNGs: node imgdiff.mjs dirA dirB
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [A,B]=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage();
for(const n of fs.readdirSync(A).filter(f=>f.endsWith('.png')&&fs.existsSync(B+'/'+f))){
  const u=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
  const r=await p.evaluate(async([a,c])=>{const ld=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=s;});const [x,y]=await Promise.all([ld(a),ld(c)]);
    const g=i=>{const cv=new OffscreenCanvas(i.width,i.height),k=cv.getContext('2d');k.drawImage(i,0,0);return k.getImageData(0,0,i.width,i.height).data;};
    const d1=g(x),d2=g(y);let s=0,big=0,l1=0,l2=0;for(let i=0;i<d1.length;i+=4){const e=(Math.abs(d1[i]-d2[i])+Math.abs(d1[i+1]-d2[i+1])+Math.abs(d1[i+2]-d2[i+2]))/3;s+=e;if(e>24)big++;l1+=d1[i]+d1[i+1]+d1[i+2];l2+=d2[i]+d2[i+1]+d2[i+2];}
    const n=d1.length/4;return{mean:+(s/n).toFixed(2),changedPct:+(big/n*100).toFixed(2),bright:[+(l1/n/3).toFixed(1),+(l2/n/3).toFixed(1)]};},[u(A+'/'+n),u(B+'/'+n)]);
  console.log(n.padEnd(12),JSON.stringify(r));}
await b.close();
