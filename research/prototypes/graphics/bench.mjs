// real-GPU render cost: node bench.mjs page.html [W H] [gfxJSON] [shotPrefix]
// times N renders with a 1px readPixels after each (forces GPU sync) at a fixed street view; optional screenshots at tod 13/19.6/23
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,W='1280',H='720',gfx='{}',shot='']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
const o='function drawMini(){';
let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__b={get world(){return world},get renderer(){return renderer},get scene(){return scene},get player(){return player},get GY(){return GY},set tod(v){tod=v},get camera(){return camera},
get comp(){return typeof gfxState!=='undefined'?gfxState:null},
draw(){typeof gfxRender==='function'?gfxRender():renderer.render(scene,camera)},
view(from,to,t,rain){tod=t;weather.kind=rain?'rain':'clear';weather.amt=weather.want=rain?1:0;for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
 const gx=to[0],gz=to[2],gp=GY(gx,gz);sun.position.set(gx+105,gp+85,gz+65);sun.target.position.set(gx,gp,gz);sun.target.updateMatrixWorld();
 for(let i=0;i<40;i++)updateEnv(.05);camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();if(typeof perfTick==='function'){perfT=0;perfTick(.016);}}};`;
const tmp=dir+'_bench_'+process.pid+'.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:+W,height:+H}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,200))});
await p.addInitScript(`window.__GFX=${gfx}`);
await p.goto('file://'+tmp);
await p.waitForFunction(()=>window.__b&&__b.world&&__b.world.cars.length,null,{timeout:120000});await p.waitForTimeout(4000);
const r=await p.evaluate(async([shot])=>{
  const B=__b,W=B.world,L=W.labels.find(q=>/maxima/i.test(q.text)),G=B.GY,gl=B.renderer.getContext(),px=new Uint8Array(4),out={shots:{},ms:{}};
  const f=[L.x+70,G(L.x+70,L.z+55)+3,L.z+55],t=[L.x,G(L.x,L.z)+6,L.z];
  const dbg=gl.getExtension('WEBGL_debug_renderer_info');out.gpu=dbg&&gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
  out.size=[B.renderer.domElement.width,B.renderer.domElement.height];
  out.comp=!!B.comp&&Object.keys(B.comp).join(',');
  for(const [name,tod,rain] of [['day',13,0],['dusk',19.6,0],['night',23,0],['rain',13,1]]){
    B.view(f,t,tod,rain);
    for(let i=0;i<20;i++){B.draw();}
    const ts=[];for(let i=0;i<200;i++){const a=performance.now();B.draw();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);ts.push(performance.now()-a);}
    ts.sort((a,b)=>a-b);out.ms[name]={med:+ts[100].toFixed(2),p90:+ts[180].toFixed(2)};
    if(shot){B.draw();out.shots[name]=B.renderer.domElement.toDataURL('image/png');}
    B.draw();gl.readPixels(gl.drawingBufferWidth>>1,gl.drawingBufferHeight>>1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);out.ms[name].px=[...px.slice(0,3)];
  }
  return out;},[shot]);
for(const [n,u] of Object.entries(r.shots))fs.writeFileSync(`${shot}_${n}.png`,Buffer.from(u.split(',')[1],'base64'));
delete r.shots;console.log(JSON.stringify({W,H,gfx,...r,errors:errs.slice(0,5)}));
await b.close();fs.unlinkSync(tmp);
