// hud2: node test_hud2.mjs page.html   (serves the page slowly over http and watches the loading screen; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';import http from 'http';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const buf=fs.readFileSync(process.argv[2]);let broken=false;
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html; charset=utf-8'});
  let b=broken?Buffer.from(buf.toString().replace('<script type="module">','<script type="module">const a=1,a=2;')):buf,i=0;
  const step=()=>{if(i>=b.length)return r.end();r.write(b.subarray(i,i+=b.length/40|0));setTimeout(step,broken?5:150);};step();}).listen(0);
const url='http://127.0.0.1:'+srv.address().port+'/';
const br=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist']});
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};
const p=await br.newPage({viewport:{width:1280,height:720}});
p.goto(url,{timeout:0}).catch(()=>{});
const seen=[];let gone=false;
for(let k=0;k<600&&!gone;k++){await new Promise(r=>setTimeout(r,200));
  const s=await p.evaluate(()=>{const b=document.getElementById('boot');return b?[b.querySelector('i').style.width,b.querySelector('p').textContent]:null;}).catch(()=>0);
  if(s===null)gone=seen.length>0;else if(s)seen.push(s);}
const pct=seen.map(s=>parseInt(s[0])||0),mid=new Set(pct.filter(v=>v>5&&v<95));
check('progress rises through the download',mid.size>=10&&pct.every((v,k)=>!k||v>=pct[k-1]),{distinctMid:mid.size,first:pct[0],last:pct[pct.length-1]});
check('says building once downloaded',seen.some(s=>/Building/.test(s[1])),seen[seen.length-1]);
check('screen goes when the game is ready',gone&&await p.evaluate(()=>!/Loading/.test(document.getElementById('placeSub').textContent)),{gone});
const h0=await p.evaluate(()=>document.getElementById('credit').offsetHeight);
await p.click('#credit');const h1=await p.evaluate(()=>document.getElementById('credit').offsetHeight);
check('credits are one line until clicked',h0<20&&h1>60,{h0,h1});
await p.screenshot({path:'hud2_game.png'});
broken=true;const q=await br.newPage();await q.goto(url,{timeout:0});await q.waitForTimeout(1500);
const m=await q.evaluate(()=>document.querySelector('#boot p')?.textContent);
check('a script error is shown on the screen',/could not start/.test(m||''),m);
await br.close();srv.close();process.exit(fails?1:0);
