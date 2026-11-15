// game renders for checking kit keys: node shots.mjs page.html views.json outdir
// a view is a photo record from pipeline/kit/views/*.json ({file, lat, lon, ang, cam, w, h}; optional dx, dz, dy, dang, snap to correct it),
// or {name, bid, edge, dist} = looking at building `bid` square-on to OSM edge `edge` from `dist` m out.
// Unlike work/photomatch.mjs the camera is not snapped to a road (Mapillary's computed positions are good to a few metres).
import {createRequire} from 'module';import fs from 'fs';import path from 'path';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,list,out]=process.argv.slice(2);
fs.mkdirSync(out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__ks={get world(){return world},
shot(v){tod=13;weather.kind='clear';weather.amt=weather.want=0;
  for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
  let x,z,a,fov=60,asp=4/3,lift=1.5;
  if(v.bid){const r=FX.recs.find(q=>q.id===v.bid);let p=r.pts;const n=p.length,A=p[v.edge],B=p[(v.edge+1)%n],cx=p.reduce((s,q)=>s+q[0],0)/n,cz=p.reduce((s,q)=>s+q[1],0)/n;
    const mx=(A[0]+B[0])/2,mz=(A[1]+B[1])/2,L=Math.hypot(B[0]-A[0],B[1]-A[1]);let nx=-(B[1]-A[1])/L,nz=(B[0]-A[0])/L;if((mx-cx)*nx+(mz-cz)*nz<0){nx=-nx;nz=-nz;}
    x=mx+nx*v.dist;z=mz+nz*v.dist;a=Math.atan2(-nx,nz);a=Math.atan2(mx-x,-(mz-z));lift=v.dy??1.6;}
  else{[x,z]=LL(v.lat,v.lon);a=(v.ang+(v.dang||0))*Math.PI/180;x+=v.dx||0;z+=v.dz||0;asp=v.w/v.h;fov=2*Math.atan(.5/asp/v.cam[0])*180/Math.PI;lift=v.dy??1.4;
    // snap: true moves the camera onto the nearest road within 20 m, in the right-hand lane (as photomatch.mjs does)
    if(v.snap){let best=400,bx=x,bz=z;for(const e of world.edges){const A=world.graph.get(e.a),B=world.graph.get(e.b),dx=B.x-A.x,dz=B.z-A.z,t=Math.max(0,Math.min(1,((x-A.x)*dx+(z-A.z)*dz)/(dx*dx+dz*dz||1))),px=A.x+dx*t,pz=A.z+dz*t,d=(px-x)**2+(pz-z)**2;
      if(d<best){best=d;bx=px+Math.cos(a)*e.w/4;bz=pz+Math.sin(a)*e.w/4;}}x=bx;z=bz;}}
  const g=GY(x,z);
  sun.position.set(x+105,g+85,z+65);sun.target.position.set(x,g,z);sun.target.updateMatrixWorld();
  for(let i=0;i<40;i++)updateEnv(.05);
  camera.fov=fov;camera.aspect=asp;
  renderer.setPixelRatio(1);renderer.setSize(1024,Math.round(1024/asp),false);camera.updateProjectionMatrix();
  camera.position.set(x,g+lift,z);camera.lookAt(x+Math.sin(a)*10,g+lift+(v.bid?1.2:-.1),z-Math.cos(a)*10);camera.updateMatrixWorld();
  if(typeof perfTick==='function'){perfT=0;perfTick(.016);for(const c of world.cars)c.g.visible=false;}
  renderer.render(scene,camera);return renderer.domElement.toDataURL('image/jpeg',.9);}};`;
const tmp=path.join(path.dirname(path.resolve(file)),'_ks_'+path.basename(file));
fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('kit'))console.log(m.text());});
await p.goto('file://'+tmp,{timeout:300000});
await p.waitForFunction(()=>window.__ks&&__ks.world&&__ks.world.cars.length,null,{timeout:300000});await p.waitForTimeout(1500);
for(const v of JSON.parse(fs.readFileSync(list,'utf8'))){
  const u=await p.evaluate(v=>__ks.shot(v),v);
  fs.writeFileSync(`${out}/${v.name||v.file.replace('/','_')}`,Buffer.from(u.split(',')[1],'base64'));
}
console.log('shots done',errs.slice(0,4));await b.close();fs.unlinkSync(tmp);
