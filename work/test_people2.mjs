// people look checks (ages, weather clothes, extra parts): node test_people2.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_people']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get tod(){return tod},set tod(v){tod=v},get GY(){return GY},
weather,MONTH_T,PARTS,pedMesh,randomLook,set pedCold(v){pedCold=v},updatePeople,updateTraffic,resetToRoad,renderer,scene,camera,
steps(n,dt=.033,traffic=true){for(let i=0;i<n;i++){if(traffic)updateTraffic(dt);updatePeople(dt);}},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_people2.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_people2.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const fails=[];
const check=(name,ok,info)=>{console.log(ok?'ok  ':'FAIL',name,JSON.stringify(info));if(!ok)fails.push(name);};
const ev=(fn,arg)=>p.evaluate(fn,arg);

await ev(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;});
check('ped meshes <= 27',await ev(()=>__t.pedMesh.length)<=27,{meshes:await ev(()=>__t.pedMesh.length)});

// 2400 steps at midday, everyone sent away every 300 so the street refills with fresh looks;
// a kid placed this frame may already be running from a car with its guard, so only a walking newcomer must hold the lead
const r=await ev(()=>{const T=__t,P=T.peds,bad=[],kids=new Set(),old=new Set(),was=P.map(q=>q.mode);let frames=0;T.tod=13;T.weather.kind='clear';
  const zero=a=>Math.abs(a[0])+Math.abs(a[1])+Math.abs(a[2])+Math.abs(a[4])+Math.abs(a[5])+Math.abs(a[6])+Math.abs(a[8])+Math.abs(a[9])+Math.abs(a[10])<1e-6;
  for(let s=0;s<2400;s++){
    if(s%300===0)for(const q of P){q.mode='hide';q.lead=null;}
    T.steps(1);
    P.forEach((q,i)=>{const on=q.mode!=='hide',L=q.look;
      if(on&&L.age==='kid'){kids.add(q);const g=q.guard;
        if(!g||g.mode==='hide'||g.look.age==='kid'||Math.hypot(g.x-q.x,g.z-q.z)>40)bad.push(['kid without guard',s,i,q.mode]);
        if(was[i]==='hide'&&q.lead!==g&&q.mode==='walk')bad.push(['kid spawned without lead',s,i,q.mode,g&&g.mode]);}
      if(on&&L.age==='old'){old.add(q);if(!(q.sp<1))bad.push(['old too fast',s,i,q.sp]);}
      if(on&&!['kid','adult','old'].includes(L.age)||on&&typeof L.male!=='boolean')bad.push(['look fields',s,i]);
      was[i]=q.mode;});
    if(s%50===49){frames++;P.forEach((q,i)=>{if(q.mode==='hide')return;T.PARTS.forEach((pt,k)=>{const a=T.pedMesh[k].instanceMatrix.array.subarray(i*16,i*16+16);
      if(a.some(v=>v!==v))bad.push(['NaN matrix',s,i,k]);else if((!pt.opt||q.look[pt.opt])&&zero(a))bad.push(['part not drawn',s,i,k,q.mode]);});});}
  }
  return{kids:kids.size,old:old.size,frames,bad:bad.slice(0,8),nBad:bad.length};});
check('every active ped renders, no NaN',!r.bad.some(x=>/NaN|drawn/.test(x[0])),r);
check('kids never without a lead, never alone',r.kids>0&&!r.bad.some(x=>/kid/.test(x[0])),{kids:r.kids});
check('elderly speed < 1.0',r.old>0&&!r.bad.some(x=>/old/.test(x[0])),{old:r.old});
check('age and male on every look',!r.bad.some(x=>/look/.test(x[0])),{});

const share=async(kind,temp)=>ev(([kind,temp])=>{const T=__t,P=T.peds;T.tod=13;T.weather.kind=kind;T.weather.temp=temp??T.MONTH_T[6]+4*Math.sin(4/24*Math.PI*2);let n=0,w=0;
  for(let round=0;round<3;round++){for(const q of P){q.mode='hide';q.lead=null;}T.steps(250);for(const q of P)if(q.mode!=='hide'){n++;if(q.look.coat||q.look.hat)w++;}}
  T.weather.kind='clear';return{n,coatOrHat:+(w/n).toFixed(2)};},[kind,temp]);
const snow=await share('snow',-3),july=await share('clear',null);
check('snow at 13:00: >= 60% coat or hat',snow.n>20&&snow.coatOrHat>=.6,snow);
check('July: <= 20% coat or hat',july.n>20&&july.coatOrHat<=.2,july);

// lineup: kid, adult man, adult woman, old with a stick, winter, summer; close and from 30 m
const shots=await ev(()=>{const T=__t,P=T.peds;T.tod=13;T.steps(200,.033,false);
  const host=P.find(q=>q.mode==='walk'&&q.e&&!q.lead);if(!host)return null;const G=T.world.graph,A=G.get(host.e.a),B=G.get(host.e.b);
  const L=Math.hypot(B.x-A.x,B.z-A.z),ux=(B.x-A.x)/L,uz=(B.z-A.z)/L,t=((host.x-A.x)*ux+(host.z-A.z)*uz),rx=A.x+ux*t,rz=A.z+uz*t;
  let nx=rx-host.x,nz=rz-host.z;const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;const cx=host.x,cz=host.z;
  const roll=(i,cold,age,ok)=>{T.pedCold=cold;for(let k=0;k<400;k++){const l=T.randomLook(i,age);if(ok(l))return l;}return T.randomLook(i,age);};
  const want=[[.3,'kid',l=>!l.hat],[.3,'adult',l=>l.male&&!l.coat&&!l.hat],[.3,'adult',l=>!l.male&&!l.coat&&!l.hat&&l.bag],[.4,'old',l=>l.stick&&!l.hat],[1,'adult',l=>l.coat&&l.hat&&l.scarf],[0,'adult',l=>!l.hat&&!l.bag]];
  for(const q of P){q.mode='hide';q.lead=null;}
  const row=want.map((w,j)=>{const i=j,q=P[i];q.look=roll(i,...w);q.mode='stop';q.stop=null;q.lead=null;q.pr=.9;q.react=0;q.nerv=0;q.seen=1e9;q.yaw=0;
    return q;});
  row[0].guard=row[1];
  const place=()=>row.forEach((q,j)=>{const o=(j-2.5)*1.25;q.x=cx+ux*o;q.z=cz+uz*o;q.h=Math.atan2(nx,nz);q.yaw=0;});
  place();T.steps(1,.033,false);place();T.updatePeople(.001);
  const y=T.GY(cx,cz);const out={};
  out.close=T.shot([cx+nx*6.5,y+1.6,cz+nz*6.5],[cx,y+.85,cz]);out.far=T.shot([cx+nx*30,y+2.5,cz+nz*30],[cx,y+.9,cz]);
  out.looks=row.map(q=>({age:q.look.age,male:q.look.male,coat:q.look.coat,hat:q.look.hat,stick:q.look.stick,mode:q.mode}));return out;});
check('lineup rendered',!!shots&&shots.looks.every(l=>l.mode==='stop'),shots&&shots.looks);
if(shots){fs.writeFileSync(`${dir}${out}/lineup.png`,Buffer.from(shots.close.split(',')[1],'base64'));fs.writeFileSync(`${dir}${out}/lineup_30m.png`,Buffer.from(shots.far.split(',')[1],'base64'));}
check('no page errors',!errs.length,errs.slice(0,6));
console.log('errors',JSON.stringify(errs.slice(0,6)));
await b.close();
if(fails.length){console.log('FAILED',fails.join(', '));process.exit(1);}
console.log('all passed');
