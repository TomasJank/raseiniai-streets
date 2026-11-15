// water3: node test_water3.mjs page.html   (exits 1 on a failed assertion; writes _water3.html beside itself)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get fight(){return fight},get cops(){return cops},get GY(){return GY},get scene(){return scene},
get w3Foot(){return w3Foot},get TREES(){return TREES},get PARKED(){return PARKED},get WATER2(){return WATER2},get water2List(){return water2List},get waterMat(){return waterMat},
inWater,water3Depth,walk,updateTraffic,newCar,removeCop,pedTarget,KEY,pip};`;
fs.writeFileSync(dir+'_water3.html',h.replace(o,api+o));
const g=JSON.parse(fs.readFileSync('/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/pipeline/geo/grpk.json','utf8'));
const box={x:2806,z:2784};
const pip=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const edge=(x,z,rs)=>{let d=1e9;for(const r of rs)for(let i=0;i<r.length;i++){const a=r[i],c=r[(i+1)%r.length],dx=c[0]-a[0],dz=c[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));d=Math.min(d,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return d;};
const split=w=>{const parts=[];for(const r of w.rings){const host=parts.find(p=>pip(r[0][0],r[0][1],p.o));if(host)host.h.push(r);else parts.push({o:r,h:[]});}return parts;};
const pole=({o,h})=>{let b=null,bd=-1;const xs=o.map(q=>q[0]),zs=o.map(q=>q[1]);
  for(let x=Math.min(...xs);x<Math.max(...xs);x+=2)for(let z=Math.min(...zs);z<Math.max(...zs);z+=2)if(pip(x,z,o)&&!h.some(r=>pip(x,z,r))){const d=edge(x,z,[o,...h]);if(d>bd){bd=d;b=[x,z];}}return{p:b,d:bd};};
const inBox=w=>w.rings[0].some(q=>Math.abs(q[0])<box.x&&Math.abs(q[1])<box.z);
const named=g.water.filter(w=>w.VARDAS&&inBox(w)).map(w=>({name:w.VARDAS,...pole(split(w)[0])}));
const cen=r=>[r.reduce((s,q)=>s+q[0],0)/r.length,r.reduce((s,q)=>s+q[1],0)/r.length];
const islands=g.water.filter(w=>w.SHAPE_Area>=300&&inBox(w)).flatMap(w=>split(w).flatMap(p=>p.h.map(cen).filter(c=>p.h.some(r=>pip(c[0],c[1],r)))));
const centre=g.water.find(w=>w.VARDAS==='Raseinių II tvenkinys');const II=split(centre)[0];
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:900,height:600}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_water3.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(()=>{document.getElementById('loader').hidden=false;});
let fails=0;
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(r&&r.ok?'PASS':'FAIL',name,JSON.stringify(r));if(!r||!r.ok)fails++;return r;};

await check('named ponds are water at their middle',([pts])=>{const bad=pts.filter(q=>!__t.inWater(q.p[0],q.p[1]));return{ok:pts.length>=6&&!bad.length,n:pts.length,bad:bad.map(q=>q.name)};},[named]);
await check('second centre pond: middle is water, its island is not',([m,ic])=>{const isl=__t.inWater(ic[0],ic[1]);return{ok:__t.inWater(m[0],m[1])&&!isl,middleWater:__t.inWater(m[0],m[1]),island:isl};},[pole(II).p,cen(II.h[0])]);
await check('every island of every pond over 300 m2 is dry land',([c])=>{const bad=c.filter(q=>__t.inWater(q[0],q[1]));return{ok:c.length>=2&&!bad.length,islands:c.length,wet:bad.length};},[islands]);
await check('pond count',()=>{const W=__t.world;return{ok:W.w3.length>=250&&W.water.length===W.ponds.length,bodies:W.w3.length,water:W.water.length,ponds:W.ponds.length,streams:W.waterLines.length};});
await check('no tree, parked car or other car stands in water',()=>{const W=__t.world,iw=__t.inWater;let trees=0,inst=0;
  for(const t of W.treeData)if(iw(t[0],t[1]))trees++;
  for(const t of __t.TREES){const m=t.Tk,a=m.instanceMatrix.array;for(let i=0;i<m.count;i++)if(iw(a[i*16+12],a[i*16+14]))inst++;}
  const parked=__t.PARKED.cars.filter(c=>iw(c.x,c.z)).length,cars=W.cars.filter(c=>iw(c.x,c.z)).length;
  return{ok:W.treeData.length>1000&&!trees&&!inst&&!parked&&!cars,trees,inst,parked,cars,treeCount:W.treeData.length};});
await check('no pavement walking target lies in water',()=>{const W=__t.world;let n=0,bad=0;
  for(const e of W.edges){if(e.cls>2)continue;for(const side of[-1,1])for(const t of[0,.25,.5,.75,1]){n++;const q=__t.pedTarget({e,t,side,lane:0,avo:0});if(__t.inWater(q[0],q[1]))bad++;}}
  return{ok:n>1000&&!bad,checked:n,bad};});
await check('one matte material, no mirror plane',()=>{const S=__t.scene;let water=0,other=0,mirror=0;
  S.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(m&&m.uniforms&&(m.uniforms.mirrorSampler||m.uniforms.reflectionSampler))mirror++;if(m===__t.waterMat)water++;});
  return{ok:water>=1&&!mirror&&!__t.WATER2.planes&&!__t.water2List.length,waterMeshes:water,mirror,planes:__t.WATER2.planes,water2:__t.water2List.length};});
await check('on foot: a wade stays dry in the shallow band, deeper water drowns and respawns on land close by',([from,to])=>{
  const T=__t,P=T.player;T.fight.pDown=0;P.mode='foot';P.car=null;P.x=from[0];P.z=from[1];P.h=Math.atan2(to[0]-from[0],to[1]-from[1]);T.KEY.KeyW=true;
  let trig=null,max=0;for(let i=0;i<160&&!trig;i++){T.walk(.05);if(T.w3Foot)trig={depth:+T.water3Depth(P.x,P.z).toFixed(2),at:[P.x,P.z]};else max=Math.max(max,T.water3Depth(P.x,P.z));}
  T.KEY.KeyW=false;if(!trig)return{ok:false,why:'never drowned',maxDepth:max};
  let t=0;while(T.w3Foot&&t<400){T.walk(.05);t++;}
  const home=[P.x,P.z],d=Math.hypot(home[0]-trig.at[0],home[1]-trig.at[1]);
  return{ok:trig.depth>1.1&&trig.depth<2.1&&max<=1.25&&!T.w3Foot&&!T.inWater(home[0],home[1])&&d<20&&T.fight.pDown===0,trig,wadeMax:+max.toFixed(2),respawnDist:+d.toFixed(1)};},
  (()=>{const o=split(g.water.find(w=>w.VARDAS==='Raseinių III tvenkinys'))[0],q=pole(split(g.water.find(w=>w.VARDAS==='Raseinių III tvenkinys'))[0]).p;
    let v=o.o[0],bd=1e9;for(const r of o.o){const d=Math.hypot(r[0]-q[0],r[1]-q[1]);if(d<bd){bd=d;v=r;}}
    const u=[(q[0]-v[0])/bd,(q[1]-v[1])/bd];return[[v[0]-u[0]*4,v[1]-u[1]*4],q];})());
await check('on foot: placed in deep water drowns, then wakes on dry land nearby',([m])=>{
  const T=__t,P=T.player;T.fight.pDown=0;P.mode='foot';P.car=null;P.x=m[0];P.z=m[1];let seen=false,t=0;
  for(;t<300;t++){T.walk(.05);if(T.w3Foot)seen=true;if(seen&&!T.w3Foot)break;}
  const d=Math.hypot(P.x-m[0],P.z-m[1]);
  return{ok:seen&&!T.inWater(P.x,P.z)&&d<80&&t<300,seen,secs:+(t*.05).toFixed(2),dist:+d.toFixed(1)};},[named.find(q=>/Raseinių I /.test(q.name)).p]);
await check('a traffic car placed in water sinks, then is respawned on a street',([m])=>{
  const T=__t,W=T.world,c=W.cars.find(q=>q.ai&&q!==T.player.car),n=W.cars.length;c.x=m[0];c.z=m[1];c.speed=9;let sunk=false,low=0;
  for(let i=0;i<120;i++){T.updateTraffic(.05);if(c.sunk){sunk=true;low=Math.max(low,c.sunk.y-c.g.position.y);}if(sunk&&!c.sunk)break;}
  const away=Math.hypot(c.x-m[0],c.z-m[1]);
  return{ok:sunk&&low>1.5&&!c.sunk&&!!c.ai&&!T.inWater(c.x,c.z)&&away>100&&W.cars.length===n,sunk,drop:+low.toFixed(2),away:Math.round(away),cars:[n,W.cars.length]};},[named.find(q=>/Raseinių I /.test(q.name)).p]);
await check('a police car placed in water sinks and leaves the chase',([m])=>{
  const T=__t,W=T.world,c=T.newCar(m[0],m[1],0,0xcfd2d3);c.cop=true;T.cops.push(c);const n=W.cars.length;let sunk=false;
  for(let i=0;i<120&&W.cars.includes(c);i++){T.updateTraffic(.05);if(c.sunk)sunk=true;}
  return{ok:sunk&&!W.cars.includes(c)&&!T.cops.includes(c)&&W.cars.length===n-1,sunk,cars:[n,W.cars.length]};},[named.find(q=>/Raseinių I /.test(q.name)).p]);
await check('a car left in water by the player goes under and is removed',([m])=>{
  const T=__t,W=T.world,c=T.newCar(m[0],m[1],0,0x24406e),n=W.cars.length;let sunk=false;
  for(let i=0;i<120&&W.cars.includes(c);i++){T.updateTraffic(.05);if(c.sunk)sunk=true;}
  return{ok:sunk&&!W.cars.includes(c)&&W.cars.length===n-1,sunk};},[named.find(q=>/Raseinių I /.test(q.name)).p]);
await check('no console errors',()=>({ok:true}));
if(errs.length){console.log('FAIL console errors',errs.slice(0,4));fails++;}
await b.close();fs.unlinkSync(dir+'_water3.html');console.log(fails?'FAILED '+fails:'PASS');process.exit(fails?1:0);
