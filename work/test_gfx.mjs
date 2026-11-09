// graphics build: node test_gfx.mjs page.html   (real GPU via ANGLE/Metal; exits 1 on a failed assertion)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__g={get world(){return world},get renderer(){return renderer},get GFX(){return GFX},get S(){return gfxState},get water(){return water2List},get WATER2(){return WATER2},
set tod(v){tod=v},get camera(){return camera},get GY(){return GY},
view(t,from,to){tod=t;weather.kind='clear';weather.amt=weather.want=0;for(let i=0;i<40;i++)updateEnv(.05);camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();},draw:gfxRender};`;
const tmp=dir+'_gfx.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+tmp);
await p.waitForFunction(()=>window.__g&&__g.world&&__g.world.cars.length,null,{timeout:120000});
await p.waitForFunction(()=>__g.S.comp&&(!__g.GFX.sky||__g.S.sky),null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(1500);
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};
const r=await p.evaluate(()=>{
  const G=__g,gl=G.renderer.getContext(),W=G.world,L=W.labels.find(q=>/maxima/i.test(q.text)),y=(x,z)=>G.GY(x,z),out={};
  const px=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
  const shot=t=>{G.view(t,[L.x+70,y(L.x+70,L.z+55)+3,L.z+55],[L.x,y(L.x,L.z)+6,L.z]);G.draw();gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,px);
    let s=0,n=0;for(let i=0;i<px.length;i+=4*97){s+=px[i]+px[i+1]+px[i+2];n++;}return +(s/n/3).toFixed(1);};
  out.mean13=shot(13);out.mean23=shot(23);
  G.view(13,[L.x+70,y(L.x+70,L.z+55)+3,L.z+55],[L.x,y(L.x,L.z)+6,L.z]);
  const ts=[],a=new Uint8Array(4);for(let i=0;i<20;i++)G.draw();
  for(let i=0;i<100;i++){const t0=performance.now();G.draw();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,a);ts.push(performance.now()-t0);}
  ts.sort((p,q)=>p-q);out.ms={med:+ts[50].toFixed(2),p90:+ts[90].toFixed(2)};
  out.flags=G.GFX;out.comp=!!G.S.comp;out.gtao=!!G.S.gtao;out.sky=!!G.S.sky;out.planes=G.water.length;out.waterOn=G.WATER2.planes;
  return out;});
check('no console errors',errs.length===0,errs.slice(0,4));
check('composer exists when ao on',!r.flags.ao||(r.comp&&r.gtao),{comp:r.comp,gtao:r.gtao});
check('sky exists when on',!r.flags.sky||r.sky,{sky:r.sky});
check('water planes exist when on',!r.waterOn||r.planes>0,{planes:r.planes});
check('non-black frame at tod 13',r.mean13>20,{mean:r.mean13});
check('non-black frame at tod 23',r.mean23>2,{mean:r.mean23});
console.log('render ms over 100 frames (1280x720, readPixels-synced)',JSON.stringify(r.ms));
await b.close();fs.unlinkSync(tmp);console.log(fails?'FAILED '+fails:'PASS');process.exit(fails?1:0);
