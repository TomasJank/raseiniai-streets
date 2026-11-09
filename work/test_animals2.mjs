// GLB animal checks (needs the animals2 step), exits 1 on any failure: node test_animals2.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/research/prototypes/animals/shots']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get tod(){return tod},set tod(v){tod=v},get cash(){return cash},set cash(v){cash=v},get heat(){return heat},set heat(v){heat=v},get GY(){return GY},
SPECIES,ANIMALS,ANIMAL_N,AG,animSpawn,animSound,updateAnimals,resetToRoad,renderer,scene,camera,THREE,
live(){return Object.values(ANIMALS).flat().filter(a=>a.mode!=='hide')},
steps(n,dt=.033){for(let i=0;i<n;i++)updateAnimals(dt);},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_animals2.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:900,height:600}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_animals2.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const fails=[];
const ev=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={fail:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(r&&r.fail)fails.push(name+': '+r.fail);return r;};
const save=async(name,fn,arg)=>{const s=await p.evaluate(fn,arg);if(s)fs.writeFileSync(`${out}/${name}.png`,Buffer.from(s.split(',')[1],'base64'));else console.log('no shot',name);};

await ev('assetsDecode',async()=>{const T=__t,t0=performance.now();T.steps(2);
  while(Object.keys(T.AG.src).length<5&&performance.now()-t0<60000)await new Promise(r=>setTimeout(r,100));
  const r={models:Object.fromEntries(Object.entries(T.AG.src).map(([k,s])=>[k,{h:+s.h.toFixed(2),clips:Object.keys(s.clips).join('/')}])),ms:Math.round(performance.now()-t0)};
  if(Object.keys(T.AG.src).length<5)r.fail='models missing';return r;});

// stub species that stand where the test puts them, one per model, so clip checks do not depend on behaviour or luck
await ev('setup',()=>{const T=__t,P=T.player;T.tod=13;
  for(const [k,m,h] of[['zz_deer','deer',1],['zz_fox','fox',.5],['zz_shiba','shiba',.6],['zz_husky','husky',.8],['zz_cat','cat',.3]]){
    T.AG.MAP[k]={m,h};T.SPECIES[k]={rig:'quad',scale:.8,where:'pavement',tod:[0,24],n:0,speed:5,sound:{kind:k==='zz_shiba'||k==='zz_husky'||k==='zz_fox'?'bark':'x',every:[1e9,1e9]},behave(){}};}
  return{at:[Math.round(P.x),Math.round(P.z)]};});
const mk=(name)=>p.evaluate((name)=>{const T=__t,P=T.player;T.steps(1);let a=null;
  for(let k=0;k<40&&!a;k++){T.animSpawn(T.ANIMALS.quad,name,T.SPECIES[name]);a=T.live().find(q=>q.name===name);}
  if(!a)return null;const f=P.mode==='car'?P.car:P,h=P.mode==='car'?P.car.h:P.h;
  a.x=P.x+Math.sin(P.h)*0+4;a.z=P.z+4;a.leave=false;window['__'+name]=a;return a.i;},name);

for(const m of['deer','fox','shiba','husky','cat']){
  await mk('zz_'+m);
  await ev('clips_'+m,()=>{const T=__t,a=window['__zz_'+m];if(!a)return{fail:'no spawn'};const seq=[],P=T.player;
    const near=()=>{a.x=P.x+3;a.z=P.z+3;a.leave=false;a.d=Math.hypot(a.x-P.x,a.z-P.z);};
    const at=(mode,sp,n=30)=>{a.mode=mode;a.sp=sp;a.y=0;for(let i=0;i<n;i++){near();a.sp=sp;T.steps(1);}const r=a.glb;return r&&r.cur;};
    const skinned=a.glb?(()=>{let s=0;a.glb.holder.traverse(o=>{if(o.isSkinnedMesh&&o.visible)s++;});return s;})():0;
    near();T.steps(1);
    const vis=a.glb&&a.glb.holder.visible,inst=T.AG.rigs.length;
    seq.push(at('sit',0),at('walk',1),at('run',7),at('walk',0,5));
    const has=T.AG.src[m].clips,r={skinned,vis,seq,glb:!!a.glb};
    const dom=()=>Object.entries(a.glb.w).sort((x,y)=>y[1]-x[1])[0];
    // death
    a.mode='down';a.timer=10;for(let i=0;i<60;i++){near();T.steps(1);a.mode='down';a.timer=10;}r.down=dom();
    const want=['idle','walk','run',has.eat&&a.glb?'eat':'idle','death'];
    const got=[seq[0],seq[1],seq[2],seq[3],dom()[0]];
    if(!skinned||!vis)r.fail='not a visible SkinnedMesh';
    else if(seq[0]!=='idle'||seq[1]!=='walk'||seq[2]!==(has.run?'run':'walk')||seq[3]!==(has.eat?'eat':'idle'))r.fail='wrong clip '+seq;
    else if(has.death&&dom()[0]!=='death')r.fail='no death clip on down';
    else if(!has.death&&m==='cat'){}
    return r;});
}

await ev('barkAndFlee',()=>{const T=__t,a=window.__zz_shiba,P=T.player;if(!a||!a.glb)return{fail:'no rig'};a.mode='sit';a.sp=0;a.timer=0;T.steps(10);
  a.x=P.x+3;a.z=P.z+3;T.animSound(a);T.steps(2);const cur=a.glb.cur,w=a.glb.w.bark;T.steps(60);return{cur,after:a.glb.cur,fail:cur!=='bark'?'no bark clip':undefined};});

// real species through their own behaviour: day dogs and cats, night fox and deer; those inside 60 m are skinned
await ev('realDay',()=>{const T=__t;for(const k of Object.keys(T.SPECIES))if(k.startsWith('zz_'))delete T.SPECIES[k];for(const a of T.live())a.mode='hide';
  T.tod=13;const P=T.player,have=new Set();
  for(let i=0;i<40;i++){for(const n of['dog_lead','dog_yard','dog_lead_small','dog_lead_big','cat'])T.animSpawn(T.ANIMALS.quad,n,T.SPECIES[n]);T.steps(5);}
  const L=T.live().filter(a=>a.rig==='quad'),near=L.filter(a=>a.d<60),bad=near.filter(a=>T.AG.MAP[a.name]&&!a.glb),far=L.filter(a=>a.d>=68&&a.glb);
  const names=[...new Set(L.map(a=>a.name))];
  const sk=near.filter(a=>a.glb&&a.glb.holder.visible).length;
  const r={species:names,near:near.length,skinnedNear:sk,badNear:bad.map(a=>a.name),farWithGlb:far.length};
  if(!names.some(n=>n.startsWith('dog')))r.fail='no dog spawned';else if(bad.length||far.length)r.fail='LOD wrong';return r;});
await ev('realNight',()=>{const T=__t;for(const a of T.live())a.mode='hide';T.tod=23;
  for(let i=0;i<40;i++){for(const n of['fox','deer','hare','hedgehog'])T.animSpawn(T.ANIMALS.quad,n,T.SPECIES[n]);T.steps(5);}
  const L=T.live().filter(a=>a.rig==='quad'),near=L.filter(a=>a.d<60),names=[...new Set(L.map(a=>a.name))];
  const bad=near.filter(a=>T.AG.MAP[a.name]&&!a.glb),keepRig=L.filter(a=>!T.AG.MAP[a.name]&&a.glb);
  const r={species:names,near:near.length,skinnedNear:near.filter(a=>a.glb).length,badNear:bad.map(a=>a.name),rigOnly:L.filter(a=>!T.AG.MAP[a.name]).map(a=>a.name)};
  if(!names.includes('fox')&&!names.includes('deer'))r.fail='no fox or deer';else if(bad.length||keepRig.length)r.fail='LOD or mapping wrong';return r;});

// LOD: the same animal beyond 68 m goes back to the instanced rig (matrices non-zero again), within 60 m the instanced parts are zero
await ev('lod',()=>{const T=__t,P=T.player;T.SPECIES.zz_l={rig:'quad',scale:.8,where:'pavement',tod:[0,24],n:0,speed:5,behave(){}};T.AG.MAP.zz_l={m:'fox',h:.5};
  for(const a of T.live())a.mode='hide';T.tod=13;let a=null;for(let k=0;k<40&&!a;k++){T.animSpawn(T.ANIMALS.quad,'zz_l',T.SPECIES.zz_l);a=T.live().find(q=>q.name==='zz_l');}
  if(!a)return{fail:'no spawn'};const q=T.scene.children.find(o=>o.isInstancedMesh&&o.count===T.ANIMAL_N),mat=new T.THREE.Matrix4(),el=()=>{q.getMatrixAt(a.i,mat);return mat.elements[0]};
  a.x=P.x+3;a.z=P.z+3;T.steps(2);const near=!!a.glb,nearInst=el();a.x=P.x+65;a.z=P.z+3;T.steps(2);const mid=!!a.glb;a.x=P.x+80;a.z=P.z;T.steps(2);const far=!!a.glb,farInst=el();
  a.mode='hide';const r={near,nearInst,mid,far,farInst};if(!near||nearInst!==0||far||farInst===0)r.fail='LOD';return r;});

await ev('hitConsequences',()=>{const T=__t,P=T.player,c=P.car;T.SPECIES.zz_h=Object.assign({},T.SPECIES.zz_l,{hit:{cash:40,heat:1,dent:0},msg:'x'});T.AG.MAP.zz_h={m:'shiba',h:.6};
  for(const a of T.live())a.mode='hide';let a=null;for(let k=0;k<40&&!a;k++){T.animSpawn(T.ANIMALS.quad,'zz_h',T.SPECIES.zz_h);a=T.live().find(q=>q.name==='zz_h');}
  if(!a)return{fail:'no spawn'};T.cash=500;T.heat=0;P.mode='car';
  c.h=0;c.x=P.x;c.z=P.z;a.x=c.x+Math.sin(c.h)*5;a.z=c.z+Math.cos(c.h)*5;a.leave=false;T.steps(2);let ups=0,downs=0,h0=T.heat,m0=T.cash;
  for(let i=0;i<60;i++){c.speed=10;c.x+=Math.sin(c.h)*10*.033;c.z+=Math.cos(c.h)*10*.033;P.x=c.x;P.z=c.z;T.steps(1);if(T.heat>h0)ups++;if(T.cash<m0)downs++;h0=T.heat;m0=T.cash;}
  const r={mode:a.mode,heat:T.heat,cash:T.cash,ups,downs,clip:a.glb&&a.glb.cur};c.speed=0;T.heat=0;
  if(ups!==1||downs!==1||T.cash!==460||a.mode!=='down'||r.clip!=='death')r.fail='hit changed';return r;});

await ev('noNaN',()=>{const T=__t;let bad=0,n=0;for(const r of T.AG.rigs){r.holder.traverse(o=>{if(o.isSkinnedMesh){n++;for(const b of o.skeleton.bones){const e=b.matrixWorld.elements;for(const v of e)if(!Number.isFinite(v))bad++;}}});}
  return{rigs:n,bad,fail:bad?'NaN bones':undefined};});

// cost: 24 GLB animals pinned near the player
await ev('cost',()=>{const T=__t,P=T.player;T.SPECIES.zz_c={rig:'quad',scale:.8,where:'pavement',tod:[0,24],n:99,speed:5,behave(a,dt){a.sp=1.2;a.mode='walk';}};T.AG.MAP.zz_c={m:'deer',h:1};
  for(const a of T.live())a.mode='hide';T.tod=13;for(let k=0;k<200;k++)T.animSpawn(T.ANIMALS.quad,'zz_c',T.SPECIES.zz_c);
  const L=T.live().filter(a=>a.name==='zz_c');let i=0;for(const a of L){a.x=P.x+3+(i%6)*2;a.z=P.z+3+Math.floor(i/6)*2;i++;}
  const s=a=>{for(const a of L){}};let tot=0,worst=0;for(let k=0;k<100;k++){for(const a of L){a.x=P.x+3+(a.i%6)*2;a.z=P.z+3+Math.floor(a.i/6)*2;a.leave=false;}const t0=performance.now();T.updateAnimals(.033);const t=performance.now()-t0;tot+=t;worst=Math.max(worst,t);}
  T.renderer.info.reset();T.renderer.render(T.scene,T.camera);const calls=T.renderer.info.render.calls;
  const glb=T.AG.rigs.filter(r=>r.a).length;for(const a of L)a.mode='hide';T.steps(1);
  T.renderer.info.reset();T.renderer.render(T.scene,T.camera);const base=T.renderer.info.render.calls;
  const r={glb,avgMs:+(tot/100).toFixed(3),worstMs:+worst.toFixed(2),calls,callsWithout:base};if(glb>T.ANIMAL_N)r.fail='cap';return r;});

// close-ups, one per model, a stub of each placed in front of the camera
for(const [m,d] of[['shiba',2.6],['husky',3],['fox',2.2],['deer',4],['cat',1.6]]){
  for(const st of['idle','walk','run']){
    await save(`${m}_${st}`,([m,d,st])=>{const T=__t,P=T.player;for(const a of T.live())a.mode='hide';T.tod=13;const k='zz_s_'+m;T.AG.MAP[k]={m,h:{shiba:.6,husky:.8,fox:.5,deer:1,cat:.3}[m]};
      T.SPECIES[k]=T.SPECIES[k]||{rig:'quad',scale:.8,where:'pavement',tod:[0,24],n:0,speed:5,behave(){}};let a=null;for(let i=0;i<40&&!a;i++){T.animSpawn(T.ANIMALS.quad,k,T.SPECIES[k]);a=T.live().find(q=>q.name===k);}
      if(!a)return null;const x=P.x+3,z=P.z+3;a.h=.9;a.leave=false;const sp=st==='idle'?0:st==='walk'?1.2:7;
      for(let i=0;i<45;i++){a.x=x;a.z=z;a.sp=sp;a.mode=st==='run'?'run':'walk';if(st==='idle')a.mode='sit';a.leave=false;a.d=4;T.steps(1);}
      const y=T.GY(x,z)+(m==='deer'?.55:.25),cx=x+Math.sin(.9+1.57)*d,cz=z+Math.cos(.9+1.57)*d;
      const r=T.shot([cx,T.GY(cx,cz)+1.1,cz],[x,y,z]);a.mode='hide';return r;},[m,d,st]);
  }
}
console.log('errors',JSON.stringify(errs.slice(0,6)));
if(errs.length)fails.push('page errors');
await b.close();
if(fails.length){console.log('FAIL',JSON.stringify(fails));process.exit(1);}
console.log('PASS');
