// car builder checks: node test_cars.mjs page.html [key ...]   (BASE=other.html to compare against something other than v37)
// The twelve v37 geometries must stay byte-identical; every other model must fit the tri cap and its dims.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,...only]=process.argv.slice(2);
const base=process.env.BASE||'/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/work/build/v37.html';
const dir=new URL('.',import.meta.url).pathname,out=dir+'shots_cars/';fs.mkdirSync(out,{recursive:true});
const LEGACY=['carGeo','skodaGeo','saloonGeo','saloonLotGeo','estateGeo','estateLotGeo','mpvGeo','mpvLotGeo','hatchGeo','hatchLotGeo','suvGeo','suvLotGeo'];
const OLD_KEYS={audi80:'carGeo',octavia:'skodaGeo',saloon:'saloonGeo',estate:'estateGeo',mpv:'mpvGeo',hatch:'hatchGeo',suv:'suvGeo'};
const o='function drawMini(){';
const api=`window.__t={geos(){return{${LEGACY.join(',')}}},get models(){return typeof CAR_MODELS==='undefined'?null:CAR_MODELS},
build:typeof buildCar==='function'?buildCar:null,get parked(){return PARKED.meshes.length},get lots(){return LOT_GEOS.length},
get player(){return player},makeCarMesh,worldGroup,resetToRoad,get GY(){return GY},renderer,scene,camera,
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
// per list: tris, weighted float sums of position/normal/colour, an FNV hash of the raw Float32 bytes; bbox over the body lists
const STATS=`G=>{const s={tris:0,lists:{}},lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9],plo=[1e9,1e9,1e9],phi=[-1e9,-1e9,-1e9];
  for(const k of['paint','trim','head','tail','wheel']){const g=G[k],L={};s.tris+=g.attributes.position.count/3;
    for(const a of['position','normal','color']){const v=g.attributes[a].array;let sum=0,h=2166136261;for(let i=0;i<v.length;i++)sum+=v[i]*(1+i%7);
      const b=new Uint8Array(v.buffer,v.byteOffset,v.byteLength);for(let i=0;i<b.length;i++)h=Math.imul(h^b[i],16777619);L[a]=[sum,h>>>0];}
    s.lists[k]=L;if(k==='wheel')continue;const p=g.attributes.position.array;
    for(let i=0;i<p.length;i+=3)for(let d=0;d<3;d++){lo[d]=Math.min(lo[d],p[i+d]);hi[d]=Math.max(hi[d],p[i+d]);if(k==='paint'){plo[d]=Math.min(plo[d],p[i+d]);phi[d]=Math.max(phi[d],p[i+d]);}}}
  s.bbox=[lo,hi].map(q=>q.map(x=>+x.toFixed(3)));s.size={length:+(hi[2]-lo[2]).toFixed(3),width:+(phi[0]-plo[0]).toFixed(3),height:+hi[1].toFixed(3)};return s;}`;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const load=async(src,name)=>{const h=fs.readFileSync(src,'utf8');if(h.split(o).length!==2)throw new Error('hook');fs.writeFileSync(dir+name,h.replace(o,api+o));
  const p=await b.newPage({viewport:{width:900,height:560}}),errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
  await p.goto('file://'+dir+name);await p.waitForFunction(()=>window.__t&&__t.player&&__t.player.car,null,{timeout:120000});await p.waitForTimeout(1500);return{p,errs};};
const fail=[];const check=(ok,msg)=>{if(!ok)fail.push(msg);};

const A=await load(base,'_cars_base.html');
const old=await A.p.evaluate(S=>{const st=eval(S),G=__t.geos(),r={};for(const k in G)r[k]=st(G[k]);return r;},STATS);await A.p.close();
const B=await load(file,'_cars.html');
const now=await B.p.evaluate(S=>{const st=eval(S),G=__t.geos(),r={};for(const k in G)r[k]=st(G[k]);return r;},STATS);
for(const k of LEGACY){const a=old[k],n=now[k];let same=a.tris===n.tris;
  for(const l in a.lists)for(const at in a.lists[l]){const[x,hx]=a.lists[l][at],[y,hy]=n.lists[l][at];if(Math.abs(x-y)>1e-6||hx!==hy)same=false;}
  console.log(k.padEnd(13),'tris',n.tris,'pos',Object.values(n.lists).map(L=>L.position[0].toFixed(4)).join('/'),'bbox',JSON.stringify(n.bbox),same?'== v37':'CHANGED');
  check(same,k+' differs from v37');}

const info=await B.p.evaluate(({S,only,OLD})=>{const st=eval(S),M=__t.models,cap=__t.geos().carGeo.paint.attributes.position.count;
  if(!M)return{err:'no CAR_MODELS'};const G0=__t.geos(),audi=st(G0.carGeo).tris,r={};
  for(const k of Object.keys(M).sort()){if(only.length&&!only.includes(k))continue;
    try{const G=OLD[k]?G0[OLD[k]]:__t.build(M[k]),lot=OLD[k]?null:st(__t.build(M[k],true));r[k]={...st(G),lotTris:lot&&lot.tris,dims:M[k].dims,name:M[k].name,old:!!OLD[k],cap:Math.floor(audi*1.3)};}
    catch(e){r[k]={err:e.message};}}
  return{r,parked:__t.parked,lots:__t.lots};},{S:STATS,only,OLD:OLD_KEYS});
check(!info.err,info.err);
for(const[k,s]of Object.entries(info.r||{})){if(s.err){check(false,k+': '+s.err);continue;}
  const d=s.dims||[],off=['length','width','height'].map((q,i)=>d[i]?s.size[q]/d[i]-1:0);
  console.log(k.padEnd(13),s.name.padEnd(22),'tris',s.tris,'lot',s.lotTris??'-','size',JSON.stringify(s.size),'dims',JSON.stringify(d),'off%',off.map(x=>(x*100).toFixed(1)).join('/'));
  if(s.old)continue;
  check(s.tris<=s.cap,`${k}: ${s.tris} tris > cap ${s.cap} (1.3 x Audi)`);
  check(d.length===3&&off.every(x=>Math.abs(x)<=.08),`${k}: size ${JSON.stringify(s.size)} not within 8% of dims ${JSON.stringify(d)}`);}
console.log('parked meshes',info.parked,'lot geos',info.lots);
check(info.parked<=3*info.lots+1,`PARKED.meshes ${info.parked} > ${3*info.lots+1}`);

const shots=await B.p.evaluate(({only,OLD})=>{const T=__t,M=T.models,G0=T.geos(),r={};T.resetToRoad();const c=T.player.car;c.speed=0;c.g.visible=false;
  const s=Math.sin(c.h),k=Math.cos(c.h),rx=k,rz=-s,y=T.GY(c.x,c.z),P=(a,b,u)=>[c.x+s*a+rx*b,y+u,c.z+k*a+rz*b];
  for(const key of Object.keys(M).sort()){if(only.length&&!only.includes(key))continue;let g;
    try{g=T.makeCarMesh(0x24406e,OLD[key]?G0[OLD[key]]:T.build(M[key]));}catch(e){continue;}
    g.position.copy(c.g.position);g.rotation.copy(c.g.rotation);T.worldGroup.add(g);
    r[key]=T.shot(P(4.3,3.6,.95),P(.1,0,.62));r[key+'_rear']=T.shot(P(-4.6,3,1.2),P(-.4,0,.7));T.worldGroup.remove(g);}
  c.g.visible=true;return r;},{only,OLD:OLD_KEYS});
for(const k in shots)fs.writeFileSync(out+k+'.png',Buffer.from(shots[k].split(',')[1],'base64'));
console.log('shots',Object.keys(shots).length,'in',out);
const errs=[...A.errs,...B.errs];console.log('errors',JSON.stringify(errs.slice(0,6)));check(!errs.length,'page errors');
await b.close();
if(fail.length){console.log('FAIL\n  '+fail.join('\n  '));process.exit(1);}
console.log('PASS');
