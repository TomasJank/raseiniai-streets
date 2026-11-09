// facade/landmark checks + close-up shots: node test_facades.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__f={get world(){return world},get player(){return player},get GY(){return GY},get STY(){return STY},get LOOK(){return LOOK},get FX(){return FX},get tex(){return facadeTex},get scene(){return scene},polyArea,get peds(){return pedMesh},resetToRoad,renderer,
view(from,to,tod=13){
  window.tod=tod;try{this.setTod(tod);}catch(e){}
  for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
  const gx=to[0],gz=to[2],gp=GY(gx,gz);sun.position.set(gx+105,gp+85,gz+65);sun.target.position.set(gx,gp,gz);sun.target.updateMatrixWorld();
  for(let i=0;i<40;i++)updateEnv(.05);
  camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();if(typeof perfTick==="function"){perfT=0;perfTick(.016);}renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');},
setTod(v){tod=v;}};`;
fs.writeFileSync(dir+'_facades.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_facades.html');
await p.waitForFunction(()=>window.__f&&__f.world&&__f.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};
await check('noConsoleErrors',()=>({ok:true}));
console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('errors');
await check('styKeys',()=>{const S=__f.STY,need={silicate:11,panel:12,plank:13,corrugated:14,asbestos:15},bad=Object.entries(need).filter(([k,v])=>S[k]!==v);
  const lk=Object.entries(__f.LOOK).filter(([,v])=>v.sty!=null&&v.sty>=0&&!Object.values(S).includes(v.sty)).map(([k])=>k);
  const t=__f.tex.image;return{ok:!bad.length&&!lk.length&&t.width<=2048&&t.height<=2048,bad,unresolvedLook:lk.length,lookCount:Object.keys(__f.LOOK).length,atlas:[t.width,t.height]};});
await check('detailCounts',()=>{const c=__f.world.fxCounts,B={balc:2600,chim:900,dormer:260,shop:120};
  return{ok:Object.keys(B).every(k=>c[k]>0&&c[k]<=B[k]),counts:c};});
await check('drawCallsAndTris',()=>{const names=[];let n=0,t=0;
  __f.scene.traverse(o=>{if(o.name&&o.name.startsWith('fx_')){n++;const g=o.geometry,cnt=(g.index?g.index.count:g.attributes.position.count)/3;t+=cnt*(o.isInstancedMesh?o.count:1);names.push(o.name+':'+(o.isInstancedMesh?o.count:1));}});
  return{ok:n>0&&n<=12&&t<=300000,drawCalls:n,extraTris:t,names};});
await check('landmarks',()=>{const L=__f.world.landmarks||{},r={};let ok=true;for(const k of['church','cerkve','culture','maxima']){const m=L[k];const t=m?m.geometry.attributes.position.count/3:0;r[k]=t;if(!m||t<50||t>5000)ok=false;}return{ok,tris:r};});
const names=['church','cerkve','culture','maxima'];
const shots=await p.evaluate(()=>{
  const F=__f,W=F.world,G=F.GY,out={};
  const roadDir=(x,z)=>{let b=null;for(const s of W.roadSegs(x,z)){if(s[4].cls>3)continue;const dx=s[2]-s[0],dz=s[3]-s[1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/l2)),px=s[0]+dx*t,pz=s[1]+dz*t,d=Math.hypot(x-px,z-pz);if(!b||d<b[0])b=[d,px,pz];}
    return b?[(b[1]-x)/(b[0]||1),(b[2]-z)/(b[0]||1)]:[0,1];};
  const lm=(re,dist,up,lookUp,key,side=0)=>{const b=W.buildings.find(q=>q.name&&re.test(q.name));if(!b)return;
    const x=(b.mnx+b.mxx)/2,z=(b.mnz+b.mxz)/2,[dx,dz]=roadDir(x,z),a=Math.atan2(dz,dx)+side,cx=x+Math.cos(a)*dist,cz=z+Math.sin(a)*dist;
    out[key]=F.view([cx,G(cx,cz)+up,cz],[x,G(x,z)+lookUp,z]);};
  lm(/Ėmimo į Dangų/,48,7,10,'church');lm(/Ėmimo į Dangų/,34,3,9,'church2',.9);
  lm(/Trejybės cerkvė/,34,5,9,'cerkve');lm(/Trejybės cerkvė/,60,12,8,'cerkve_far',.8);
  lm(/kultūros centras/,52,6,6,'culture');lm(/^Maxima XX/,55,5,4,'maxima');
  // facade close-ups: first building of each style, camera 9 m out from its longest wall
  const want={panel:F.STY.panel,plank:F.STY.plank,silicate:F.STY.silicate,redbrick:F.STY.brick};
  for(const [name,sty] of Object.entries(want)){
    const r=F.FX.recs.find(q=>{const s=q.specs[0][1];return s.sty===sty&&q.pts.length>=4&&q.specs.length===1&&Math.hypot(q.pts[0][0]-W.box.minX,0)>0&&s.h>(sty===F.STY.panel?9:3);});if(!r)continue;
    const p=r.pts,sg=F.polyArea(p)>0?-1:1;let best=null;
    for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!best||L>best.L)best={a,b,L};}
    const {a,b,L}=best,ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L,nx=sg*-uz,nz=sg*ux,mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,s=r.specs[0][1],d=sty===F.STY.panel?Math.max(10,L*.3):Math.max(7,L*.55);
    out['facade_'+name]=F.view([mx+nx*d,G(mx,mz)+2.4,mz+nz*d],[mx,G(mx,mz)+Math.min(s.h*.5,4),mz]);
  }
  for(const k of['balc','shop','dormer','chim']){const q=W.fxSample&&W.fxSample[k];if(!q)continue;const nx=Math.sin(q.yaw),nz=Math.cos(q.yaw),d=k==='balc'?16:k==='shop'?11:k==='chim'?14:12;
    out['detail_'+k]=F.view([q.x+nx*d,G(q.x,q.z)+(k==='balc'?3:2.4),q.z+nz*d],[q.x,q.y+(k==='chim'?-1:0),q.z]);}
  return out;});
for(const [n,u] of Object.entries(shots))fs.writeFileSync(`${out}/${n}.png`,Buffer.from(u.split(',')[1],'base64'));
const have=Object.keys(shots);
if(names.some(n=>!have.includes(n))||['panel','plank','silicate'].some(n=>!have.includes('facade_'+n)))fails.push('shots');
console.log('shots',have.join(' '));
console.log(fails.length?'FAIL '+fails.join(','):'PASS');
await b.close();process.exit(fails.length?1:0);
