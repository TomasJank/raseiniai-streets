// melee checks with assertions: node test_fight.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_fight']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get fight(){return fight},get club(){return club},get ENV(){return ENV},
get tod(){return tod},set tod(v){tod=v},get heat(){return heat},set heat(v){heat=v},get cash(){return cash},set cash(v){cash=v},get GY(){return GY},press,enterExit,updatePeople,updateClub,resetToRoad,renderer,scene,camera,
steps(n,dt=.033,each){for(let i=0;i<n;i++){updatePeople(dt);if(each)each(i);}},
hideAll(keep){for(const q of peds)if(!keep.includes(q)){q.mode='hide';q.lead=null;}},
put(q,d,look,side=0){Object.assign(q.look,look);Object.assign(q,{mode:'idle',timer:999,lead:null,pair:null,grp:null,seat:null,react:0,nerv:0,hp:null,ko:0,fall:0,hop:0,dest:null,seen:1e9});
  const f=player.h,rx=Math.cos(f),rz=-Math.sin(f);q.x=player.x+Math.sin(f)*d+rx*side;q.z=player.z+Math.cos(f)*d+rz*side;q.h=f+Math.PI;return q;},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_fight.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_fight.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};
const ADULT={age:'adult',male:false},YOUNG={age:'adult',male:true,young:true};

await check('setup',()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;
  T.enterExit();return{ok:T.player.mode==='foot',mode:T.player.mode,hp:T.player.hp};});
await check('touchButton',()=>{const e=document.querySelector('#touch #tHit');return{ok:!!e&&e.dataset.press==='KeyX'&&e.textContent==='HIT'};});
await check('oneHitStagger',A=>{const T=__t,q=T.put(T.peds[0],.9,A);T.hideAll([q]);T.steps(1);T.put(q,.9,A);
  T.press('KeyX');T.steps(1);return{ok:q.hp===2&&q.mode==='stagger',hp:q.hp,mode:q.mode,victims:T.fight.victims.includes(q)};},ADULT);
await check('cooldown',A=>{const T=__t,q=T.put(T.peds[1],.9,A);T.hideAll([q]);T.steps(20);T.put(q,.9,A);
  T.press('KeyX');T.steps(3);T.put(q,.9,A);q.hp=2;T.press('KeyX');T.steps(1);const one=q.hp;
  T.steps(14);T.put(q,.9,A);q.hp=2;T.press('KeyX');T.steps(1);return{ok:one===2&&q.hp===1,after01s:one,after05s:q.hp};},ADULT);
await check('threeHitsDownThenWalk',A=>{const T=__t,q=T.put(T.peds[2],.9,A);T.hideAll([q]);T.steps(20);
  for(let k=0;k<3;k++){T.put(q,.9,A);q.hp=3-k;T.press('KeyX');T.steps(16);}
  const down=q.mode,timer=+q.timer.toFixed(1),seen=new Set();let t=0;
  for(;t<30&&q.mode!=='walk';t+=.033){T.steps(1);seen.add(q.mode);}
  const getup=+t.toFixed(1);let t2=0;for(;t2<15&&q.mode!=='walk'&&q.mode!=='hide';t2+=.033)T.steps(1);
  return{ok:down==='down'&&timer>=5.5&&timer<=12&&q.mode==='walk'&&seen.has('flee'),down,timer,modesAfter:[...seen],getupS:getup,final:q.mode,hp:q.hp};},ADULT);
await check('kidAndElderlyNeverFight',()=>{const T=__t,res={};
  // people2 hides a kid without its guard, so the kid walks with an adult who stands behind the player
  const g=T.put(T.peds[16],-1.5,{age:'adult',male:false});T.player.hp=99;
  for(const age of['kid','old']){const q=T.put(T.peds[3],.9,{age,male:true});T.hideAll([q,g]);T.steps(20);const modes=new Set();
    for(let k=0;k<2;k++){T.put(q,.9,{age,male:true});T.put(g,-1.5,{age:'adult',male:false});q.guard=g;q.lead=g;T.press('KeyX');T.steps(90,.033,()=>{modes.add(q.mode);T.player.hp=99;});}res[age]=[...modes];}
  res.guard=g.mode;g.mode='hide';T.player.hp=5;
  return{ok:!res.kid.includes('fight')&&!res.old.includes('fight')&&res.kid.includes('flee')&&res.old.includes('flee')&&res.guard==='fight',...res};});
await check('youngMaleFightsBack',A=>{const T=__t,q=T.put(T.peds[4],.9,A);T.hideAll([q]);T.player.hp=5;T.steps(20);T.put(q,.9,A);
  T.press('KeyX');T.steps(1);const hp1=q.hp;let fought=-1,hurt=-1;
  for(let i=0;i<152;i++){T.steps(1);if(fought<0&&q.mode==='fight')fought=i*.033;if(hurt<0&&T.player.hp<5)hurt=i*.033;}
  return{ok:hp1===3&&fought>=0&&hurt>=0&&hurt<=5,hpAfterHit:hp1,fightAtS:+fought.toFixed(2),playerHurtAtS:+hurt.toFixed(2),playerHp:T.player.hp,gap:+Math.hypot(q.x-T.player.x,q.z-T.player.z).toFixed(2)};},YOUNG);
const sh=await p.evaluate(()=>{const T=__t,P=T.player,y=T.GY(P.x,P.z),f=P.h;return T.shot([P.x-Math.sin(f)*3+Math.cos(f)*3,y+2.2,P.z-Math.cos(f)*3-Math.sin(f)*3],[P.x+Math.sin(f)*.5,y+1,P.z+Math.cos(f)*.5]);});
fs.writeFileSync(`${dir}${out}/fight.png`,Buffer.from(sh.split(',')[1],'base64'));
await check('heatWithWitness',A=>{const T=__t,q=T.put(T.peds[5],.9,A),w=T.put(T.peds[6],-12,{});T.hideAll([q,w]);T.steps(20);T.put(q,.9,A);T.put(w,-12,{});
  T.fight.last=T.fight.called=-1e9;T.heat=0;T.player.hp=99;let rises=0,last=0,watched=false;T.press('KeyX');T.steps(1);q.hp=99;if(T.heat>.5)rises++;last=T.heat,minD=99,maxD=0;
  T.steps(606,.033,i=>{T.player.hp=99;if(T.heat>last+.5)rises++;last=T.heat;if(w.mode==='watch'){watched=true;if(i>150){const d=Math.hypot(w.x-T.player.x,w.z-T.player.z);minD=Math.min(minD,d);maxD=Math.max(maxD,d);}}});
  const res={ok:rises===1&&watched&&minD>=5.9&&maxD<=10.1&&q.mode==='fight',rises,heat:T.heat,watched,watchDistM:[+minD.toFixed(1),+maxD.toFixed(1)],fighter:q.mode};
  q.mode='hide';w.mode='hide';T.player.hp=5;T.heat=0;return res;},YOUNG);
await check('noHeatWithoutWitness',A=>{const T=__t,q=T.put(T.peds[7],.9,A);T.hideAll([q]);T.steps(20);T.put(q,.9,A);T.fight.last=T.fight.called=-1e9;
  T.heat=0;T.player.hp=99;T.press('KeyX');T.steps(1);q.hp=99;let rises=0;
  T.steps(606,.033,()=>{T.player.hp=99;T.hideAll([q]);});rises=T.heat;const res={ok:rises===0&&q.mode==='fight',heat:T.heat,fighter:q.mode};
  q.mode='hide';T.player.hp=5;T.heat=0;return res;},YOUNG);
await check('bystandersWatch',A=>{const T=__t,q=T.put(T.peds[8],.9,A),near=[9,10,11].map((k,i)=>T.put(T.peds[k],0,{},[7,12,16][i])),far=T.put(T.peds[12],0,{},30);
  T.hideAll([q,...near,far]);T.steps(2);T.put(q,.9,A);near.forEach((w,i)=>T.put(w,0,{},[7,12,16][i]));T.put(far,0,{},30);T.press('KeyX');T.steps(1);
  const res={ok:near.every(w=>w.mode==='watch')&&far.mode!=='watch',near:near.map(w=>w.mode),far:far.mode};for(const z of[q,...near,far])z.mode='hide';return res;},ADULT);
await check('groupMateJoins',A=>{const T=__t,q=T.put(T.peds[13],.9,A),m=T.put(T.peds[14],1.6,A,.6);T.hideAll([q,m]);T.steps(20);T.put(q,.9,A);T.put(m,1.6,A,.6);m.lead=q;
  T.player.hp=99;T.press('KeyX');T.steps(30);const res={ok:q.mode==='fight'&&m.mode==='fight',victim:q.mode,mate:m.mode};q.mode=m.mode='hide';T.player.hp=5;return res;},ADULT);
await check('playerKnockedOut',A=>{const T=__t,q=T.put(T.peds[15],.9,A);T.hideAll([q]);T.steps(20);T.put(q,.9,A);T.player.hp=1;T.heat=0;T.cash=120;
  T.press('KeyX');let down=-1;for(let i=0;i<150&&down<0;i++){T.steps(1);if(T.fight.pDown>0)down=i;}const heat=T.heat;T.steps(130);
  const res={ok:down>=0&&heat>=1&&T.fight.pDown<=0&&T.player.hp===5&&T.cash===70&&q.mode!=='fight',downAtStep:down,heat,cash:T.cash,fighterAfter:q.mode};
  q.mode='hide';T.heat=0;return res;},YOUNG);
await check('bouncers',async()=>{const T=__t;T.tod=23;await new Promise(r=>setTimeout(r,1500));T.ENV.night.value=1;
  const B0=()=>T.club&&T.club.bouncers;T.hideAll([]);
  if(!T.club)return{ok:false,err:'no club'};T.player.x=T.club.x;T.player.z=T.club.z;T.updateClub(.033);T.steps(1);
  const bs=B0();if(!bs||bs.length!==2)return{ok:false,err:'no bouncers'};const b=bs[0];
  T.player.x=b.x+Math.sin(b.h)*.9;T.player.z=b.z+Math.cos(b.h)*.9;T.player.h=b.h+Math.PI;T.player.hp=5;T.updateClub(.033);T.press('KeyX');T.steps(1);
  const hp=b.hp,modes=bs.map(o=>o.mode);let hurt=false;for(let i=0;i<90&&!hurt;i++){T.steps(1);hurt=T.player.hp<5;}
  T.player.hp=99;T.player.x=b.hx+Math.sin(b.h0)*40;T.player.z=b.hz+Math.cos(b.h0)*40;let gave=false,maxOut=0;
  for(let i=0;i<400;i++){T.updateClub(.033);T.steps(1);T.player.hp=99;maxOut=Math.max(maxOut,Math.hypot(b.x-b.hx,b.z-b.hz));if(b.mode==='back')gave=true;}
  T.player.hp=5;return{ok:hp===5&&modes.every(m=>m==='fight')&&hurt&&gave&&maxOut<=25.5,hp,modes,playerHurt:hurt,gaveUp:gave,maxFromDoorM:+maxOut.toFixed(1),now:b.mode};});
console.log('errors',JSON.stringify(errs.slice(0,6)));
await b.close();
if(errs.length)fails.push('errors');
if(fails.length){console.log('FAIL',fails.join(' '));process.exit(1);}
console.log('PASS');
