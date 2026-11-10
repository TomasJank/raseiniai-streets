// node shots.mjs page.html out.png  : pond edge where the nearest ripple-water body (river/stream) meets the pond
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
const api=`window.__g={get world(){return world},get water(){return water2List},get rm(){return water2Mesh},get GY(){return GY},get renderer(){return renderer},
view(t,from,to){tod=t;weather.kind='clear';weather.amt=weather.want=0;for(let i=0;i<40;i++)updateEnv(.05);camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();},draw:gfxRender};`;
const tmp=dir+'_s.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,200))});
await p.goto('file://'+tmp);
await p.waitForFunction(()=>window.__g&&__g.world&&__g.world.cars.length&&__g.water.length,null,{timeout:120000});await p.waitForTimeout(2500);
const url=await p.evaluate(()=>{
  const G=__g,pond=G.water.reduce((a,w)=>{w.geometry.computeBoundingBox();const bb=w.geometry.boundingBox,s=(bb.max.x-bb.min.x)*(bb.max.y-bb.min.y);return s>a.s?{w,s}:a;},{s:0}).w;
  const pv=pond.geometry.attributes.position,rp=G.rm.geometry.attributes.position;let best=1e9,bp=null;
  for(let i=0;i<pv.count;i+=2){const x=pv.getX(i),z=-pv.getY(i);for(let j=0;j<rp.count;j+=3){const d=Math.hypot(rp.getX(j)-x,rp.getZ(j)-z);if(d<best){best=d;bp=[x,z,rp.getX(j),rp.getZ(j)];}}}
  const [px,pz,rx,rz]=bp,jy=pond.position.y;
  let r2=null,bd=1e9;for(let j=0;j<rp.count;j+=3){const d=Math.abs(Math.hypot(rp.getX(j)-px,rp.getZ(j)-pz)-30);if(d<bd){bd=d;r2=[rp.getX(j),rp.getZ(j)];}}
  const dx=px-r2[0],dz=pz-r2[1],d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d,cx=r2[0]-ux*6,cz=r2[1]-uz*6;
  G.view(13,[cx,Math.max(G.GY(cx,cz),jy)+6,cz],[px+ux*10,jy,pz+uz*10]);
  for(let i=0;i<4;i++)G.draw();
  const gl=G.renderer.getContext(),a=new Uint8Array(4),ts=[];for(let i=0;i<120;i++){const t=performance.now();G.draw();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,a);ts.push(performance.now()-t);}ts.sort((x,y)=>x-y);
  return {ms:ts[60].toFixed(2),u:G.renderer.domElement.toDataURL('image/png'),best,bp};});
fs.writeFileSync(out,Buffer.from(url.u.split(',')[1],'base64'));console.log('ms',url.ms,'gap',url.best,'at',url.bp,'errors',errs);
await b.close();fs.unlinkSync(tmp);
