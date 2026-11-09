// fixed reference views for before/after comparisons: node views.mjs page.html outdir
// traffic and people are hidden so two builds render the same scene
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
fs.mkdirSync(out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__v={get world(){return world},get player(){return player},get GY(){return GY},resetToRoad,
view(name,from,to,opt={}){
  tod=opt.tod??13;weather.kind=opt.rain?'rain':'clear';weather.amt=weather.want=opt.rain?1:0;
  for(const c of world.cars)c.g.visible=c===player.car&&!!opt.car;for(const m of pedMesh)m.visible=false;
  const gx=to[0],gz=to[2],gp=GY(gx,gz);sun.position.set(gx+105,gp+85,gz+65);sun.target.position.set(gx,gp,gz);sun.target.updateMatrixWorld();
  for(let i=0;i<40;i++)updateEnv(.05);
  camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();if(typeof perfTick==="function"){perfT=0;perfTick(.016);}renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_views.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+dir+'_views.html');
await p.waitForFunction(()=>window.__v&&__v.world&&__v.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const shots=await p.evaluate(()=>{
  const V=__v,W=V.world,L=t=>W.labels.find(q=>t.test(q.text)),G=(x,z)=>V.GY(x,z),out={};
  const at=(q,dx,dz,up,lift=0)=>[[q.x+dx,G(q.x+dx,q.z+dz)+up,q.z+dz],[q.x,G(q.x,q.z)+lift,q.z]];
  const mx=L(/maxima/i),ch=L(/bažnyčia/i);
  if(mx){const [f,t]=at(mx,70,55,3,6);out.maxima=V.view('maxima',f,t);out.night=V.view('night',f,t,{tod:23});out.dusk=V.view('dusk',f,t,{tod:19.6});out.rain=V.view('rain',f,t,{rain:1});}
  if(ch){const [f,t]=at(ch,140,110,120);out.aerial=V.view('aerial',f,t);const [f2,t2]=at(ch,-35,30,3,8);out.church=V.view('church',f2,t2);}
  V.resetToRoad();const c=V.player.car,s=Math.sin(c.h),k=Math.cos(c.h),y=G(c.x,c.z);
  out.car=V.view('car',[c.x+s*4.3+k*3.6,y+.95,c.z+k*4.3-s*3.6],[c.x+s*.1,y+.62,c.z+k*.1],{car:1});
  return out;});
for(const [n,u] of Object.entries(shots))fs.writeFileSync(`${out}/${n}.png`,Buffer.from(u.split(',')[1],'base64'));
console.log('views',Object.keys(shots).join(' '),'errors',JSON.stringify(errs.slice(0,6)));
await b.close();
