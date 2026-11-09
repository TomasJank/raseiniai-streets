// street data checks: node test_streets.mjs page.html [streetsDir] [shotsDir]
// page.html must be built with add_streets.py from the same streetsDir; exits 1 on any failed check
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,sdir='/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/pipeline/streets',out='shots_streets']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
const streets=fs.readdirSync(sdir).filter(f=>f.endsWith('.json')&&!f.startsWith('_')).sort().map(f=>JSON.parse(fs.readFileSync(sdir+'/'+f,'utf8')));
if(!streets.length)throw new Error('no street files in '+sdir);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get tod(){return tod},set tod(v){tod=v},get GY(){return GY},
get LL(){return LL},get LOOK(){return LOOK},get STY(){return STY},get TALKS(){return TALKS},pickTalk,shortName,pedPush,updatePeople,updateTraffic,resetToRoad,scene,
view(from,to){tod=13;weather.kind='clear';weather.amt=weather.want=0;for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
  const gp=GY(to[0],to[2]);sun.position.set(to[0]+105,gp+85,to[2]+65);sun.target.position.set(to[0],gp,to[2]);sun.target.updateMatrixWorld();
  for(let i=0;i<40;i++)updateEnv(.05);camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();
  if(typeof perfTick==="function"){perfT=0;perfTick(.016);}renderer.render(scene,camera);for(const m of pedMesh)m.visible=true;return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_streets.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_streets.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const fails=[];const ok=(c,msg)=>{if(!c)fails.push(msg);};
const r=await p.evaluate(S=>{const T=__t,W=T.world,out={};
  out.looks=[];for(const s of S)for(const [id,L] of Object.entries(s.looks||{})){const g=T.LOOK[id];
    out.looks.push([id,!!g&&Object.entries(L).every(([k,v])=>k==='sty'?g.sty===(v==='none'?-1:T.STY[v]):JSON.stringify(g[k])===JSON.stringify(v))]);}
  out.kinds={};T.scene.traverse(m=>{if(m.isInstancedMesh&&m.userData.street)out.kinds[m.userData.street]=(out.kinds[m.userData.street]||0)+m.count;});
  out.stats={props:W.streets.props,hook:W.streets.hook,signs:W.streets.signs,solids:W.streets.solids.length,segs:W.streets.segs.length};
  out.places=S.flatMap(s=>(s.places||[]).filter(q=>!W.labels.some(L=>L.text===q.name||T.shortName(L.text)===T.shortName(q.name))).map(q=>q.name));
  out.talks=S.map(s=>T.TALKS.filter(t=>t[0]==='street:'+s.slug).length);
  out.street=S.map(s=>s.views.map(v=>{const [x,z]=T.LL(...v.ll);return W.street(x,z);}));
  out.picked=S.map(s=>{const [x,z]=T.LL(...s.views[0].ll),first=new Set((s.flavour||[]).map(d=>d[0]));let n=0;for(let i=0;i<60;i++)if(first.has(T.pickTalk([{},{}],x,z)[0][1]))n++;return n;});
  return out;},streets);
console.log('built',JSON.stringify(r));
const want={};for(const s of streets)for(const q of s.props||[])want[q.k]=(want[q.k]||0)+1;
const got=r.kinds,totalGot=Object.values(got).reduce((a,c)=>a+c,0),totalWant=Object.values(want).reduce((a,c)=>a+c,0);
for(const [id,good] of r.looks)ok(good,`LOOK.${id} missing or not as in the json`);
ok(totalGot===totalWant+r.stats.hook,`instanced props ${totalGot}, json ${totalWant} + hooks ${r.stats.hook}`);
if(!r.stats.hook)for(const k in want)ok(got[k]===want[k],`kind ${k}: ${got[k]} instances, json ${want[k]}`);
ok(!r.places.length,`places missing from world.labels: ${r.places}`);
ok(r.stats.signs>=streets.reduce((a,s)=>a+(s.signs||[]).length,0),'signs missing');
streets.forEach((s,i)=>{ok(r.talks[i]===(s.flavour||[]).length,`${s.slug}: ${r.talks[i]} talks, json ${(s.flavour||[]).length}`);
  ok(r.street[i].includes(s.street),`${s.slug}: world.street at the views is ${r.street[i]}, want ${s.street}`);
  if((s.flavour||[]).length)ok(r.picked[i]>0,`${s.slug}: pickTalk never chose a street talk at its view point`);});

// every street solid pushes a ped out, then 600 frames of crowd near each street with no ped inside one
const solid=await p.evaluate(()=>{const T=__t,W=T.world,S=W.streets,bad=[];
  const inside=(x,z)=>{for(const q of S.solids)if(!q.down&&Math.hypot(x-q.x,z-q.z)<q.r-.05)return'prop';
    for(const s of S.segs){const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<.25)return'wall';}return null;};
  for(const q of S.solids){const d={mode:'walk',x:q.x+.05,z:q.z+.03};for(let i=0;i<4;i++)T.pedPush(d);if(Math.hypot(d.x-q.x,d.z-q.z)<q.r+.3)bad.push(['prop',+q.x.toFixed(1),+q.z.toFixed(1)]);}
  for(const s of S.segs){const mx=(s[0]+s[2])/2,mz=(s[1]+s[3])/2,d={mode:'walk',x:mx+.02,z:mz+.02};for(let i=0;i<4;i++)T.pedPush(d);if(inside(d.x,d.z)==='wall')bad.push(['wall',+mx.toFixed(1),+mz.toFixed(1)]);}
  return{pushed:S.solids.length+S.segs.length,bad};});
console.log('pushOut',JSON.stringify(solid));
ok(!solid.bad.length,`${solid.bad.length} street solids do not push a ped out`);
for(const s of streets){
  const res=await p.evaluate(S=>{const T=__t,W=T.world,St=W.streets,[x,z]=T.LL(...S.views[0].ll),c=T.player.car;c.x=x;c.z=z;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;
    const near=St.solids.filter(q=>Math.hypot(q.x-x,q.z-z)<200),segs=St.segs.filter(s=>Math.hypot(s[0]-x,s[1]-z)<200);let samples=0,worst=null;
    for(let f=0;f<600;f++){T.updateTraffic(.033);T.updatePeople(.033);
      for(const q of T.peds){if(['hide','down','stop','sit'].includes(q.mode))continue;
        for(const o of near)if(!o.down){const d=Math.hypot(q.x-o.x,q.z-o.z);samples++;if(d<o.r-.05&&(!worst||d-o.r<worst.gap))worst={gap:+(d-o.r).toFixed(2),mode:q.mode,at:[+o.x.toFixed(1),+o.z.toFixed(1)]};}
        for(const s of segs){const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((q.x-s[0])*dx+(q.z-s[1])*dz)/(dx*dx+dz*dz||1))),d=Math.hypot(q.x-s[0]-dx*t,q.z-s[1]-dz*t);
          if(d<.25&&(!worst||d-.32<worst.gap))worst={gap:+(d-.32).toFixed(2),mode:q.mode,wall:s.map(v=>+v.toFixed(1))};}}}
    return{peds:T.peds.filter(q=>q.mode!=='hide').length,solidsNear:near.length,wallsNear:segs.length,samples,worst};},s);
  console.log('crowd',s.slug,JSON.stringify(res));
  ok(!res.worst,`${s.slug}: a ped got inside a street solid ${JSON.stringify(res.worst)}`);
  const shots=await p.evaluate(S=>S.views.map(v=>{const T=__t,[x,z]=T.LL(...v.ll),h=Math.PI-v.hd*Math.PI/180,tx=x+Math.sin(h)*30,tz=z+Math.cos(h)*30;
    return T.view([x,T.GY(x,z)+2.2,z],[tx,T.GY(tx,tz)+1.5,tz]);}),s);
  shots.forEach((u,i)=>{const f=`${dir}${out}/${s.slug}_${i+1}.png`,buf=Buffer.from(u.split(',')[1],'base64');fs.writeFileSync(f,buf);ok(buf.length>20000,`${f} looks blank (${buf.length} bytes)`);});
}
console.log('errors',JSON.stringify(errs.slice(0,6)));
ok(!errs.length,'console errors');
await b.close();
if(fails.length){console.log('FAIL\n- '+fails.join('\n- '));process.exit(1);}
console.log('PASS',streets.map(s=>s.slug).join(' '));
