// outfits on the mannequins: node test_clothes.mjs page.html [base.html] [shotsDir]   (base = the build without add_clothes.py, for the draw-call comparison)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,base,out='shots_clothes']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
const API=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get CHAR(){return CHAR},get CL(){return CL},get PARTS(){return PARTS},THREE,randomLook,dress,
set tod(v){tod=v},get GY(){return GY},enterExit,updatePeople,resetToRoad,renderer,scene,camera,pedMesh,PED_N,
steps(n,dt=.033,each){for(let i=0;i<n;i++){updatePeople(dt);if(each)each(i);}},
hideAll(keep){for(const q of peds)if(!keep.includes(q)){q.mode='hide';q.lead=null;}},
put(q,d,side=0){Object.assign(q,{mode:'idle',timer:999,lead:null,pair:null,grp:null,seat:null,react:0,nerv:0,hp:null,ko:0,fall:0,hop:0,gait:0,dest:null,seen:1e9,pr:.9});
  const f=player.h,rx=Math.cos(f),rz=-Math.sin(f);q.x=player.x+Math.sin(f)*d+rx*side;q.z=player.z+Math.cos(f)*d+rz*side;q.h=f+Math.PI;return q;}};`;
const o='function drawMini(){';
async function open(file,name){
  const h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
  fs.writeFileSync(dir+name,h.replace(o,API+o));
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:800,height:500}});const errs=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
  await p.goto('file://'+dir+name);
  await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});
  await p.evaluate(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;T.enterExit();});
  await p.waitForFunction(()=>__t.CHAR.ready,null,{timeout:60000});await p.waitForTimeout(500);
  await p.evaluate(()=>{window.ALL={hat:1,pack:1,bag:1,scarf:1,coat:1,skirt:1,long:1,tail:1,stick:1};window.NONE={hat:0,cap:0,pack:0,bag:0,scarf:0,coat:0,skirt:0,long:0,tail:0,stick:0};
    window.sceneFor=(T,gear)=>{const P=T.peds,set=P.slice(0,12);T.hideAll(set);
      set.forEach((q,n)=>{const m=n%2===0,age=n%4===3?'old':n%5===4?'kid':'adult';q.look=Object.assign(T.randomLook(n,age==='adult'?undefined:age),{male:m,age,clo:undefined},gear?ALL:NONE);
        T.dress(n,{shirt:0x3366cc,skin:0xe2b493,hair:0x3a2c20,legs:0x445566,shoe:0x111111,fore:0xe2b493});T.put(q,3+n*1.2,(n%3-1)*2);if(age==='kid')q.guard=P[12];});
      T.put(P[12],-8,0);P[12].look=Object.assign(T.randomLook(99),{age:'adult'});
      T.camera.position.set(T.player.x,T.GY(T.player.x,T.player.z)+3,T.player.z);T.steps(6);return set;};});
  return {b,p,errs};
}
const {b,p,errs}=await open(file,'_clothes.html');
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};

await check('outfitOnEveryMannequin',()=>{const T=__t,set=sceneFor(T,false);let n=0;const bad=[],kinds={},cl=new Set(['casual','hoodie','suit','farmer','beach','worker','dress','tee','trek']);
  for(let i=0;i<set.length;i++){const st=T.CHAR.list[i];if(!st||!st.o.visible)continue;n++;
    const meshes=[];st.o.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
    if(meshes.length!==1||!cl.has(st.ok)||!meshes[0].geometry.attributes.normal||meshes[0].geometry.index.count<9000||!meshes[0].visible)bad.push(i+':'+st.ok+':'+meshes.length);
    kinds[st.ok]=(kinds[st.ok]||0)+1;}
  return{ok:n>=10&&!bad.length,mannequins:n,bad,kinds};});
await check('smoothShaded',()=>{const T=__t;sceneFor(T,false);const r={};
  for(const b of['m','f']){const st=T.CHAR.list.find(s=>s&&s.o.visible&&s.b===b);if(!st)return{ok:false,err:'no '+b};
    const g=st.mesh.geometry,P=g.attributes.position,N=g.attributes.normal,ix=g.index,V=T.THREE.Vector3,a=new V(),c=new V(),d=new V(),fn=new V(),vn=new V();let flat=0,tot=0;
    for(let t=0;t<ix.count;t+=3){const ids=[ix.getX(t),ix.getX(t+1),ix.getX(t+2)];a.fromBufferAttribute(P,ids[0]);c.fromBufferAttribute(P,ids[1]);d.fromBufferAttribute(P,ids[2]);
      fn.subVectors(c,a).cross(d.sub(a)).normalize();if(!(fn.lengthSq()>0))continue;tot++;
      let all=true;for(const i of ids){vn.fromBufferAttribute(N,i).normalize();if(vn.dot(fn)<.9995)all=false;}if(all)flat++;}
    r[b]={flatFrac:+(flat/tot).toFixed(3),tris:tot,verts:P.count};}
  return{ok:r.m.flatFrac<.3&&r.f.flatFrac<.3,...r};});
await check('followsSkeleton',()=>{const T=__t,set=sceneFor(T,false),res=[];
  for(const b of['m','f']){const st=T.CHAR.list.find(s=>s&&s.o.visible&&s.b===b);if(!st)return{ok:false,err:'no '+b};
    const m=st.mesh,g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bn=m.skeleton.bones,th=st.bone.thigh_l,calf=st.bone.calf_l;
    const ids=[];for(let i=0;i<si.count&&ids.length<40;i++)for(let j=0;j<4;j++)if(bn[si.getComponent(i,j)]===calf&&sw.getComponent(i,j)>.97){ids.push(i);break;}
    if(ids.length<5)return{ok:false,err:'no calf verts '+b};
    const V=T.THREE.Vector3,v=new V(),pose=t=>{st.act.idle.stop();st.act.walk.play().setEffectiveWeight(1);st.act.walk.time=t;st.mx.update(0);st.o.updateMatrixWorld(true);
      const bp=new V().setFromMatrixPosition(calf.matrixWorld),out=ids.map(i=>{m.getVertexPosition(i,v).applyMatrix4(m.matrixWorld);return[v.clone(),v.distanceTo(bp)];});return out;};
    const A=pose(0),B=pose(st.act.walk.getClip().duration*.25);
    let moved=0,drift=0;ids.forEach((_,k)=>{moved+=A[k][0].distanceTo(B[k][0]);drift=Math.max(drift,Math.abs(A[k][1]-B[k][1]));});
    res.push({b,movedMean:+(moved/ids.length).toFixed(3),maxDrift:+drift.toFixed(4)});}
  return{ok:res.every(r=>r.movedMean>.05&&r.maxDrift<.01),res};});
await check('noBoxGear',()=>{const T=__t,set=sceneFor(T,true);let n=0;const bad=[],e=new T.THREE.Matrix4();
  for(let i=0;i<set.length;i++){const st=T.CHAR.list[i];if(!st||!st.o.visible)continue;n++;
    for(const k of T.CL.hid){T.pedMesh[k].getMatrixAt(i,e);if(Math.abs(e.elements[0])>1e-3)bad.push(i+':'+T.PARTS[k].opt);}}
  const tri={};for(const p of T.PARTS)if(['hat','cap','pack','bag','scarf'].includes(p.opt))tri[p.opt]=p.g.attributes.position.count/3|0;
  return{ok:n>=10&&!bad.length&&Object.values(tri).every(v=>v>=150),mannequins:n,bad,tri,hidden:T.CL.hid.map(k=>T.PARTS[k].opt)};});
await check('gearSits',()=>{const T=__t,set=sceneFor(T,true),V=T.THREE.Vector3,v=new V(),m=new T.THREE.Matrix4(),worst=[];
  for(let i=0;i<set.length;i++){const st=T.CHAR.list[i];if(!st||!st.o.visible)continue;const hp=st.bone.Head.getWorldPosition(new V()),sc=st.bone.Head.getWorldScale(new V()).x;
    for(const k of T.CHAR.G){const opt=T.PARTS[k].opt;if(!['hat','cap'].includes(opt)||!st.look[opt])continue;const g=T.PARTS[k].g;g.computeBoundingBox();g.boundingBox.getCenter(v);T.pedMesh[k].getMatrixAt(i,m);v.applyMatrix4(m);
      const dy=(v.y-hp.y)/sc;if(dy<.05||dy>.2)worst.push(i+':'+opt+':'+dy.toFixed(3));}}
  return{ok:!worst.length,worst};});
const T1={};
if(base){const bo=await open(base,'_clothes_base.html');
  const meas=async pg=>pg.evaluate(()=>{const T=__t;const R=T.renderer;R.info.autoReset=true;
    const set=sceneFor(T,false);T.camera.lookAt(T.player.x+Math.sin(T.player.h)*5,T.GY(T.player.x,T.player.z)+1,T.player.z+Math.cos(T.player.h)*5);T.camera.updateMatrixWorld();
    R.render(T.scene,T.camera);const withP=R.info.render.calls,n=T.CHAR.n;T.hideAll([]);T.steps(3);R.render(T.scene,T.camera);return{withP,without:R.info.render.calls,n};});
  const a=await meas(p),c=await meas(bo.p);bo.b.close();
  const per=r=>(r.withP-r.without)/r.n,pa=per(a),pc=per(c);
  console.log('drawCallsPerPed',JSON.stringify({clothes:a,base:c,perPedClothes:+pa.toFixed(2),perPedBase:+pc.toFixed(2)}));
  if(pa>pc+2)fails.push('drawCallsPerPed');}
await check('shot',()=>{const T=__t;sceneFor(T,false);return{ok:true};});
await p.screenshot({path:dir+out+'/clothes.png'});
console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('consoleErrors');
console.log(fails.length?'FAIL '+fails.join(' '):'PASS');await b.close();process.exit(fails.length?1:0);
