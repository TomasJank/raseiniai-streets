// GLB characters behind the poseAt seam, with assertions: node test_chars.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_chars']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get fight(){return fight},get CHAR(){return CHAR},
set tod(v){tod=v},get GY(){return GY},press,enterExit,updatePeople,resetToRoad,pedRejoin,renderer,scene,camera,pedMesh,PED_N,PLAYER_I,
steps(n,dt=.033,each){for(let i=0;i<n;i++){updatePeople(dt);if(each)each(i);}},
hideAll(keep){for(const q of peds)if(!keep.includes(q)){q.mode='hide';q.lead=null;}},
put(q,d,side=0){Object.assign(q,{mode:'idle',timer:999,lead:null,pair:null,grp:null,seat:null,react:0,nerv:0,hp:null,ko:0,fall:0,hop:0,gait:0,dest:null,seen:1e9,pr:.9});
  const f=player.h,rx=Math.cos(f),rz=-Math.sin(f);q.x=player.x+Math.sin(f)*d+rx*side;q.z=player.z+Math.cos(f)*d+rz*side;q.h=f+Math.PI;return q;},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_chars.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if((m.type()==='error'||m.type()==='warning'&&/characters/.test(m.text()))&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_chars.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};

await check('setup',()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;
  T.enterExit();return{ok:T.player.mode==='foot'};});
const t0=Date.now();
await p.waitForFunction(()=>__t.CHAR.ready,null,{timeout:60000}).catch(()=>{});
await check('assetsDecode',t=>({ok:__t.CHAR.ready,afterMs:t}),Date.now()-t0);
await p.waitForTimeout(500);
await check('skinnedVisible',()=>{__t.steps(3);let n=0;__t.scene.traverse(o=>{if(o.isSkinnedMesh&&o.visible&&o.parent.visible)n++;});return{ok:n>=1,visible:n,player:!!(__t.CHAR.list[__t.PLAYER_I]&&__t.CHAR.list[__t.PLAYER_I].o.visible)};});
await check('nearUseGlbFarDoNot',()=>{const T=__t,P=T.peds,near=P.slice(0,10),far=P.slice(10,14);T.hideAll([...near,...far]);
  near.forEach((q,k)=>T.put(q,3+k*1.5,(k%3-1)*2));far.forEach((q,k)=>T.put(q,0,120+k*5));
  // the camera trails the player; measure from it the way the renderer does
  T.camera.position.set(T.player.x,T.GY(T.player.x,T.player.z)+3,T.player.z);T.steps(3);
  const d=q=>+Math.hypot(q.x-T.camera.position.x,q.z-T.camera.position.z).toFixed(1),g=q=>!!T.CHAR.use[P.indexOf(q)]&&T.CHAR.list[P.indexOf(q)].o.visible;
  return{ok:near.every(g)&&far.every(q=>!g(q))&&far.every(q=>d(q)>80),near:near.map(g),far:far.map(g),farDist:far.map(d)};});
await check('clipSwitches',()=>{const T=__t,q=T.put(T.peds[0],2.5,1.5),i=0;T.hideAll([q]);T.player.hp=99;
  const seq=[],rec=()=>{const c=T.CHAR.list[i]&&T.CHAR.list[i].clip;if(c&&seq[seq.length-1]!==c)seq.push(c);};
  T.steps(10,.033,rec);T.pedRejoin(q);T.steps(40,.033,()=>{rec();});
  T.put(q,.9);q.hp=1;T.steps(1);T.press('KeyX');T.steps(60,.033,rec);const downMode=q.mode;q.timer=.1;
  T.steps(200,.033,rec);T.player.hp=5;
  const at=n=>seq.indexOf(n),walked=s=>s==='walk'||s==='jog';
  const iw=seq.findIndex(walked),id=at('death'),ig=at('getup'),iw2=seq.findIndex((s,k)=>k>ig&&walked(s));
  return{ok:at('idle')===0&&iw>0&&id>iw&&downMode==='down'&&ig>id&&iw2>ig,seq,downMode,final:q.mode};});
await check('playerPunchClip',()=>{const T=__t;T.hideAll([]);T.steps(30);const st=T.CHAR.list[T.PLAYER_I];const before=st&&st.clip;
  T.fight.cd=-9;T.press('KeyX');T.steps(2);return{ok:!!st&&(st.clip==='jab'||st.clip==='cross'),before,after:st&&st.clip};});
await check('frameTime',()=>{const T=__t,P=T.peds;P.slice(0,24).forEach((q,k)=>{T.put(q,3+k*.8,(k%5-2)*1.5);});T.steps(5);
  let s=performance.now();T.steps(30);const all=(performance.now()-s)/30;let c=0;for(let k=0;k<30;k++){T.updatePeople(.033);c+=T.CHAR.ms;}
  return{ok:all<25,updatePeopleMs:+all.toFixed(2),charsMs:+(c/30).toFixed(2),glb:T.CHAR.n};});
await check('noNaN',()=>{const T=__t;let bad=0,n=0;for(const st of T.CHAR.list){if(!st||!st.o.visible)continue;n++;st.o.traverse(o=>{if(o.isBone&&o.matrixWorld.elements.some(v=>!isFinite(v)))bad++;});}
  const e=new Float32Array(16);for(const m of T.pedMesh)for(let i=0;i<m.count;i++){m.getMatrixAt(i,{fromArray(a){e.set(a.slice(0,16));}});}
  let ib=0;for(const m of T.pedMesh)if(m.instanceMatrix.array.some(v=>!isFinite(v)))ib++;
  return{ok:bad===0&&ib===0&&n>0,chars:n,badBones:bad,badInstanced:ib};});
await check('drawCalls',()=>{const T=__t;T.renderer.info.autoReset=true;T.renderer.render(T.scene,T.camera);return{ok:true,calls:T.renderer.info.render.calls,glb:T.CHAR.n};});
const sh=await p.evaluate(()=>{const T=__t,P=T.player,y=T.GY(P.x,P.z),f=P.h;T.steps(3);return T.shot([P.x-Math.sin(f)*2+Math.cos(f)*5,y+2.2,P.z-Math.cos(f)*2-Math.sin(f)*5],[P.x+Math.sin(f)*8,y+1,P.z+Math.cos(f)*8]);});
fs.writeFileSync(`${dir}${out}/chars.png`,Buffer.from(sh.split(',')[1],'base64'));
console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('consoleErrors');
console.log(fails.length?'FAIL '+fails.join(' '):'PASS');await b.close();
