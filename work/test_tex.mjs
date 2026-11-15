// wall and roof textures: node test_tex.mjs page.html base.html   (page = full chain + add_tex.py, base = the same chain without it)
import {createRequire} from 'module';import fs from 'fs';import cp from 'child_process';import crypto from 'crypto';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,baseFile]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,root='/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/';
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};

// build: add_tex.py twice on the base gives the same bytes, and those are the page under test
const built=tag=>{const t=dir+'_tex_'+tag+'.html';fs.copyFileSync(baseFile,t);cp.execFileSync('python3',[root+'pipeline/add_tex.py',t]);const b=fs.readFileSync(t);fs.unlinkSync(t);return crypto.createHash('sha1').update(b).digest('hex');};
const h1=built('a'),h2=built('b'),hp=crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
check('two builds are byte-identical and match the page',h1===h2&&h1===hp,{a:h1.slice(0,10),b:h2.slice(0,10),page:hp.slice(0,10)});
const grow=fs.statSync(file).size-fs.statSync(baseFile).size;
check('page growth at most 1.5 MB',grow>0&&grow<=1.5e6,{KB:Math.round(grow/1024)});

const o='function drawMini(){';
const api=`window.__t={get world(){return world},get TEX(){return typeof TEX==='undefined'?null:TEX},get TEXM(){return TEXM},get TEXL(){return TEXL},
// fixed camera, people and traffic hidden; returns every 4th pixel of the frame as RGB
view(from,to,t=13){
  tod=t;weather.kind='clear';weather.amt=weather.want=0;
  for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
  const G=(x,z)=>GY(x,z),f=[from[0],G(from[0],from[2])+from[1],from[2]],o=[to[0],G(to[0],to[2])+to[1],to[2]];
  sun.position.set(o[0]+105,o[1]+85,o[2]+65);sun.target.position.set(...o);sun.target.updateMatrixWorld();
  for(let i=0;i<40;i++)updateEnv(.05);
  camera.position.set(...f);camera.lookAt(...o);camera.updateMatrixWorld();if(typeof perfTick==="function"){perfT=0;perfTick(.016);}renderer.render(scene,camera);
  const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,px=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
  const out=[];for(let y=0;y<h;y+=4)for(let x=0;x<w;x+=4){const i=(y*w+x)*4;out.push(px[i],px[i+1],px[i+2]);}return out;}};`;
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
const errs=[];
async function load(f,name){
  const h=fs.readFileSync(f,'utf8');if(h.split(o).length!==2)throw new Error('hook');
  const tmp=dir+'_tex_'+name+'.html';fs.writeFileSync(tmp,h.replace(o,api+o));
  const p=await b.newPage({viewport:{width:900,height:600},deviceScaleFactor:1});
  p.on('pageerror',e=>errs.push(name+': '+(e.stack||e.message).slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(name+': '+m.text().slice(0,300))});
  await p.goto('file://'+tmp);await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length&&(!__t.TEX||__t.TEX.loaded),null,{timeout:180000});await p.waitForTimeout(1500);
  return p;
}
const pa=await load(baseFile,'base'),pb=await load(file,'new');

const r=await pb.evaluate(()=>{
  const T=__t.TEX,im=T.u.value.image,d=im.data,n=im.width*im.height,means=[];
  for(let l=0;l<im.depth;l++){let s=0;for(let i=0;i<n;i++){const k=(l*n+i)*4;s+=d[k]+d[k+1]+d[k+2];}means.push(+(s/n/3).toFixed(1));}
  const g=T.mesh&&T.mesh.geometry,a=g&&g.attributes.tex,pos=g&&g.attributes.position;let bad=0,on=0;const tri=new Array(__t.TEXM.length).fill(0);
  if(a)for(let i=0;i<a.count;i+=3){const v=a.array[i];if(v!==a.array[i+1]||v!==a.array[i+2]||v<-1||v>=tri.length)bad++;else if(v>=0){on++;tri[Math.floor(v)]++;}}
  return{loaded:T.loaded,size:[im.width,im.height,im.depth],layers:__t.TEXL.map(l=>l.n),means,used:T.used,mats:__t.TEXM.map(m=>m[0]+(m[1]?'*':'')),
    verts:a&&a.count,pverts:pos&&pos.count,bad,share:a?+(on/(a.count/3)).toFixed(3):0,tri,paint:[...T.paint.value].map(v=>+v.toFixed(2))};});
check('texture strip decoded into the array texture',r.loaded&&r.size[0]===512&&r.size[1]===512&&r.size[2]===r.layers.length,{size:r.size,layers:r.layers});
check('every layer averages 128 (a far tile is the colour the wall had)',r.means.every(m=>Math.abs(m-128)<=3),{means:r.means});
check('every material is used by at least one building',r.used.every(n=>n>0),Object.fromEntries(r.mats.map((m,i)=>[m,r.used[i]])));
check('every layer is used',r.layers.every(l=>r.mats.some((m,i)=>m.replace('*','')===l&&r.used[i]>0)),{});
check('tex attribute covers the building mesh, one material per triangle',r.verts>0&&r.verts===r.pverts&&r.bad===0,{verts:r.verts,bad:r.bad});
check('most building triangles are textured',r.share>.7,{share:r.share,trianglesPerMaterial:r.tri});

// same cameras on both pages
const V={aerial:[[20,120,25],[-120,0,-87]],brick:[[531.8,1.6,465.3],[530,1.6,467.7]],plank:[[740.8,1.6,556.6],[738.2,1.6,558.4]],night:[[-435,1.7,-370],[-454.8,7,-387.1],23]};
const shot=async(p,k)=>p.evaluate(a=>__t.view(...a),V[k]);
const mean=a=>{const s=[0,0,0];for(let i=0;i<a.length;i++)s[i%3]+=a[i];return s.map(v=>v/(a.length/3));};
const diff=(a,c)=>{let s=0;for(let i=0;i<a.length;i++)s+=Math.abs(a[i]-c[i]);return s/a.length;};
// local contrast: mean absolute difference between horizontal neighbours (sampled pixels)
const rough=a=>{let s=0,n=0;for(let i=3;i<a.length;i+=3){s+=Math.abs(a[i+1]-a[i-2]);n++;}return s/n;};
{const A=await shot(pa,'aerial'),B=await shot(pb,'aerial'),ma=mean(A),mb=mean(B),dm=Math.max(...ma.map((v,i)=>Math.abs(v-mb[i])));
  check('from the air the town keeps its colours',dm<1.5&&diff(A,B)<4,{meanBase:ma.map(v=>+v.toFixed(1)),meanNew:mb.map(v=>+v.toFixed(1)),pixelDiff:+diff(A,B).toFixed(2)});}
for(const k of['brick','plank']){const A=await shot(pa,k),B=await shot(pb,k),ma=mean(A),mb=mean(B);
  check(k+' wall from 3 m: texture is drawn (pixels differ) and the mean colour holds',diff(A,B)>2.5&&Math.max(...ma.map((v,i)=>Math.abs(v-mb[i])))<8,{pixelDiff:+diff(A,B).toFixed(2),meanBase:ma.map(v=>+v.toFixed(1)),meanNew:mb.map(v=>+v.toFixed(1)),contrast:[+rough(A).toFixed(2),+rough(B).toFixed(2)]});}
{const lit=a=>{let n=0;for(let i=0;i<a.length;i+=3)if(a[i]>170&&a[i+1]>110&&a[i]>a[i+2]+40)n++;return n;},A=lit(await shot(pa,'night')),B=lit(await shot(pb,'night'));
  check('night windows still glow',A>30&&Math.abs(A-B)<=Math.max(8,A*.1),{litBase:A,litNew:B});}
// the people step throws from mhPose now and then on the page without tex as well; listed, not counted
const foreign=errs.filter(e=>/mhPose/.test(e)),mine=errs.filter(e=>!/mhPose/.test(e));
check('no console errors',mine.length===0,{errors:mine.slice(0,5),notFromTex:[...new Set(foreign.map(e=>e.slice(0,90)))]});
await b.close();
for(const n of['base','new'])fs.unlinkSync(dir+'_tex_'+n+'.html');
console.log(fails?'FAIL '+fails:'PASS');process.exit(fails?1:0);
