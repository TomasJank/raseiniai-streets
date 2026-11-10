// roofs checks: node test_roofs.mjs after.html base.html [out.json]   (base = same build without add_roofs.py)
import {createRequire} from 'module';import fs from 'fs';import cp from 'child_process';import crypto from 'crypto';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [after,base,outJson]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,root=dir+'../';
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const dump=async(file,tag)=>{
  let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
  if(h.split(o).length!==2)throw new Error('hook');
  const tmp=dir+`_roofs_${tag}.html`;
  fs.writeFileSync(tmp,h.replace(o,`window.__r={get world(){return world},get LOOK(){return LOOK},get FX(){return FX}};`+o));
  const p=await b.newPage({viewport:{width:900,height:500}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
  await p.goto('file://'+tmp);
  await p.waitForFunction(()=>window.__r&&__r.world&&__r.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1000);
  const d=await p.evaluate(()=>{const roof={},look={},face={};
    for(const r of __r.FX.recs){for(const [,s] of r.specs){(roof[r.id]??=[]).push([...s.roof].map(v=>+v.toFixed(4)));}
      if(r.t.facade&&r.t.facade[1])face[r.id]=1;}
    for(const [k,v] of Object.entries(__r.LOOK))if(v.roof)look[k]=v.roof;
    return {roof,look,face,credit:document.getElementById('credit').textContent};});
  fs.unlinkSync(tmp);await p.close();return {...d,errs};
};
const A=await dump(after,'a'),B=await dump(base,'b');
const fails=[],say=(n,ok,x)=>{console.log(n,ok?'PASS':'FAIL',JSON.stringify(x));if(!ok)fails.push(n);};
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
const changed=Object.keys(A.roof).filter(k=>!same(A.roof[k],B.roof[k]));
say('received>=4000',changed.length>=4000,{changed:changed.length});
const streetLooks=new Set();
for(const f of fs.readdirSync(root+'pipeline/streets').filter(f=>f.endsWith('.json')&&!f.startsWith('_')))
  for(const [k,v] of Object.entries(JSON.parse(fs.readFileSync(root+'pipeline/streets/'+f,'utf8')).looks||{}))if(v.roof)streetLooks.add(k);
const bad=[...streetLooks].filter(k=>!same(A.roof[k],B.roof[k]));
say('streetLooksKept',!bad.length&&streetLooks.size>0,{streetRoofLooks:streetLooks.size,overridden:bad});
const lk=Object.keys(A.look),badL=lk.filter(k=>!same(A.roof[k],B.roof[k]));
say('allLookRoofsKept',!badL.length,{lookRoofs:lk.length,overridden:badL});
const badF=Object.keys(A.face).filter(k=>!same(A.roof[k],B.roof[k]));
say('videoFacadeRoofsKept',!badF.length,{n:Object.keys(A.face).length,overridden:badF});
say('landmarks',['c92','c219','c2661','c2134'].every(k=>same(A.roof[k],B.roof[k])),{});
say('credit',A.credit.includes('ORT10LT orthophoto, National Land Service (NŽT), geoportal.lt'),{});
say('noConsoleErrors',!A.errs.length&&!B.errs.length,{after:A.errs.slice(0,3),base:B.errs.slice(0,3)});
const sha=f=>{const t=f+'.det.html';fs.copyFileSync(base,t);cp.execFileSync('python3',[root+'pipeline/add_roofs.py',t]);const r=crypto.createHash('sha1').update(fs.readFileSync(t)).digest('hex');fs.unlinkSync(t);return r;};
say('deterministic',sha(after)===sha(after),{});
say('afterMatchesFreshBuild',(()=>{const t=after+'.chk.html';fs.copyFileSync(base,t);cp.execFileSync('python3',[root+'pipeline/add_roofs.py',t]);const r=fs.readFileSync(t,'utf8')===fs.readFileSync(after,'utf8');fs.unlinkSync(t);return r;})(),{});
const lum=c=>.2126*c[0]+.7152*c[1]+.0722*c[2],med=a=>{a=[...a].sort((x,y)=>x-y);return a[a.length>>1];};
const lb=Object.values(B.roof).map(v=>lum(v[0])),la=Object.values(A.roof).map(v=>lum(v[0]));
console.log('medianRoofLuma before',med(lb).toFixed(3),'after',med(la).toFixed(3));
if(outJson)fs.writeFileSync(outJson,JSON.stringify({before:B.roof,after:A.roof}));
await b.close();console.log(fails.length?'FAIL '+fails.join(','):'ALL PASS');process.exit(fails.length?1:0);
