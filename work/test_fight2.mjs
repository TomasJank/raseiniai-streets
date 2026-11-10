// combat v2 checks: node test_fight2.mjs page.html [shotsDir]   (page = build.sh + add_fight2.py)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_fight2']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get fight(){return fight},get cmb(){return cmb},get CHAR(){return CHAR},get clock(){return pedClock},
get tod(){return tod},set tod(v){tod=v},get heat(){return heat},get GY(){return GY},get MOVES(){return MOVES},get PMOVES(){return PMOVES},get aiInit(){return aiInit},press,enterExit,updatePeople,resetToRoad,renderer,scene,camera,startMove,startDodge,hurtPlayer,fightEvent,
steps(n,dt=.033,each){for(let i=0;i<n;i++){updatePeople(dt);if(each)each(i);}},
hideAll(keep){for(const q of peds)if(!keep.includes(q)){q.mode='hide';q.lead=null;}},
put(q,d,look,side=0){Object.assign(q.look,look);Object.assign(q,{mode:'idle',timer:999,lead:null,pair:null,grp:null,seat:null,react:0,nerv:0,hp:null,ko:0,fall:0,hop:0,dest:null,seen:1e9,mv:null,ai:null,kb:null,kd:null,blk:0,back:0});
  const f=player.h,rx=Math.cos(f),rz=-Math.sin(f);q.x=player.x+Math.sin(f)*d+rx*side;q.z=player.z+Math.cos(f)*d+rz*side;q.h=f+Math.PI;return q;},
key(type,code){dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));},
reset(){cmb.mv=cmb.dodge=cmb.lunge=cmb.pk=cmb.tok=null;cmb.stam=100;cmb.hs=0;cmb.stage=-1;cmb.chain=0;cmb.endT=-9;cmb.rand=Math.random;player.hp=5;fight.pDown=0;fight.pStag=0;},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_fight2.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_fight2.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000,polling:500});await p.waitForTimeout(1500);
const fails=[];
const only=process.env.ONLY&&new RegExp(process.env.ONLY);
const check=async(name,fn,arg)=>{if(only&&name!=='setup'&&!only.test(name))return;let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};
const ADULT={age:'adult',male:false},YOUNG={age:'adult',male:true,young:true};
await p.evaluate(()=>{window.YOUNG={age:'adult',male:true,young:true};});
const shotTo=async(name,fn)=>{const s=await p.evaluate(`(()=>{${fn}})()`);fs.writeFileSync(`${dir}${out}/${name}.png`,Buffer.from(s.split(',')[1],'base64'));};
const side=`const P=__t.player,y=__t.GY(P.x,P.z),f=P.h;return __t.shot([P.x+Math.cos(f)*3.2+Math.sin(f)*.6,y+1.3,P.z-Math.sin(f)*3.2+Math.cos(f)*.6],[P.x+Math.sin(f)*.6,y+.9,P.z+Math.cos(f)*.6]);`;

await check('setup',()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;
  T.enterExit();T.hideAll([]);T.steps(2);return{ok:T.player.mode==='foot'&&T.CHAR.ready,ready:T.CHAR.ready};});
await check('touchAndHud',()=>{const g=i=>document.querySelector('#touch #'+i);return{ok:g('tKick').dataset.press==='KeyZ'&&g('tBlock').dataset.k==='KeyB'&&g('tDodge').dataset.press==='KeyJ'&&!!document.querySelector('#cbar')};});
await check('movesTable',()=>{const M=__t.MOVES;return{ok:M.kick.dmg===2&&M.kick.reach===1.4&&Math.abs(M.jab.su+M.jab.ac+M.jab.rc-.45)<1e-9&&M.kick.su+M.kick.ac+M.kick.rc>=.8-1e-9&&M.cross.kb>M.jab.kb&&M.kick.down===1,jab:M.jab,kick:M.kick};});

await check('kickTwoDamageKnocksDownStaggered',A=>{const T=__t;T.reset();const q=T.put(T.peds[0],.9,A);T.hideAll([q]);T.steps(20);
  T.put(q,.9,A);q.hp=3;q.mode='stagger';q.stag=.6;q.next='fight';T.press('KeyZ');
  let hitAt=-1;for(let i=0;i<30&&hitAt<0;i++){T.steps(1,.016);if(q.hp<3)hitAt=i*.016;}
  const stag={hp:q.hp,mode:q.mode};
  T.reset();T.put(q,.9,A);T.steps(2);q.hp=null;T.put(q,.9,A);T.press('KeyZ');T.steps(30,.016);
  return{ok:stag.hp===1&&stag.mode==='down'&&q.hp===1&&q.mode==='stagger',staggeredVictim:stag,hitAtS:+hitAt.toFixed(3),freshVictim:{hp:q.hp,mode:q.mode}};},ADULT);
await check('kickKeyAndOnlyInActiveWindow',A=>{const T=__t;T.reset();const q=T.put(T.peds[1],.9,A);T.hideAll([q]);T.steps(20);T.put(q,.9,A);q.hp=3;
  T.key('keydown','KeyZ');T.key('keyup','KeyZ');const m=T.cmb.mv;const seen=[];
  for(let i=0;i<40;i++){T.steps(1,.016);seen.push(+(m.t.toFixed(3)),q.hp);}
  const first=[];for(let k=0;k<seen.length;k+=2)if(seen[k+1]<3){first.push(seen[k]);break;}
  return{ok:!!m&&m.n==='kick'&&first[0]>=T.MOVES.kick.su-.001&&first[0]<=T.MOVES.kick.su+T.MOVES.kick.ac+.02,move:m.n,hpDropsAtMoveT:first[0]};},ADULT);

await check('blockFrontNotBehind',A=>{const T=__t;T.reset();const f=T.put(T.peds[2],.9,YOUNG),r=T.put(T.peds[3],-.9,YOUNG);T.hideAll([f,r]);T.steps(2);
  T.put(f,.9,YOUNG);T.put(r,-.9,YOUNG);T.key('keydown','KeyB');T.steps(2);const blk=T.cmb.blk,st0=T.cmb.stam;
  T.hurtPlayer(f,T.PMOVES.jab);const hpF=T.player.hp,st1=T.cmb.stam;
  T.hurtPlayer(r,T.PMOVES.jab);const hpB=T.player.hp;
  T.key('keyup','KeyB');T.steps(2);const blk2=T.cmb.blk;T.reset();T.hurtPlayer(f,T.PMOVES.jab);const hpNo=T.player.hp;
  T.reset();T.key('keydown','KeyB');T.steps(2);T.cmb.stam=0;T.steps(1);const blkEmpty=T.cmb.blk;T.hurtPlayer(f,T.PMOVES.jab);const hpEmpty=T.player.hp;T.key('keyup','KeyB');
  f.mode=r.mode='hide';T.reset();
  return{ok:blk===1&&hpF===5&&st1<st0&&hpB===4&&blk2===0&&hpNo===4&&blkEmpty===0&&hpEmpty===4,blocking:blk,hpFront:hpF,hpBehind:hpB,staminaDrain:st0-st1,afterRelease:blk2,hpNoBlock:hpNo,hpEmptyStamina:hpEmpty};},YOUNG);
await shotTo('block',`const T=__t;T.reset();const q=T.put(T.peds[2],1.1,{age:'adult',male:true,young:true});T.hideAll([q]);T.steps(2);T.put(q,1.1,{age:'adult',male:true,young:true});q.mode='fight';q.ai=T.aiInit();q.ai.atk=99;T.key('keydown','KeyB');T.steps(25);${side}`);
await p.evaluate(()=>{__t.key('keyup','KeyB');__t.reset();});

await check('dodgeIframesAvoidActiveWindow',A=>{const T=__t,res={};
  const run=(label,dodgeAt)=>{T.reset();const q=T.put(T.peds[4],.9,A);T.hideAll([q]);T.steps(2);T.put(q,.9,A);q.hp=99;q.mode='fight';q.ai=T.aiInit();q.ai.atk=999;
    const x0=T.player.x,z0=T.player.z;q.mv={n:'jab',d:T.PMOVES.jab,t:0,hit:0};q.swing=T.clock;let hit=-1;
    for(let i=0;i<60;i++){if(dodgeAt!=null&&Math.abs(i*.016-dodgeAt)<.008)T.startDodge(1);T.steps(1,.016);if(hit<0&&T.player.hp<5)hit=i*.016;}
    res[label]={hp:T.player.hp,moved:+Math.hypot(T.player.x-x0,T.player.z-z0).toFixed(2),dodged:T.cmb.dodged};q.mode='hide';};
  run('standing',null);run('dodgeAtTelegraph',.1);
  // i-frames alone: a hit that arrives while the dodge runs, then one after it ends
  T.reset();const q2=T.put(T.peds[4],.9,A);T.startDodge(-1);T.steps(6,.016);T.hurtPlayer(q2,T.PMOVES.jab);const during=T.player.hp;T.steps(30,.016);T.hurtPlayer(q2,T.PMOVES.jab);const after=T.player.hp;
  T.reset();
  return{ok:res.standing.hp===4&&res.dodgeAtTelegraph.hp===5&&res.dodgeAtTelegraph.moved>=.9&&during===5&&after===4,...res,iframeHp:during,afterHp:after};},ADULT);
await shotTo('dodge',`const T=__t;T.reset();T.hideAll([]);T.steps(2);T.startDodge(1);T.steps(9,.016);${side}`);
await p.evaluate(()=>{__t.steps(40);__t.reset();});
await check('doubleTapDodge',()=>{const T=__t;T.reset();T.key('keydown','KeyD');T.key('keyup','KeyD');T.key('keydown','KeyD');const d=T.cmb.dodge;T.key('keyup','KeyD');
  const ok=!!d&&d.side===-1&&Math.abs(d.dist-1.2)<1e-9&&Math.abs(d.dur-.3)<1e-9;T.steps(30,.016);T.reset();return{ok,dist:d&&d.dist,dur:d&&d.dur};});

await check('knockbackDisplacementAndBuildings',A=>{const T=__t,res={};
  for(const n of['jab','cross','kick']){T.reset();const q=T.put(T.peds[5],.9,A);T.hideAll([q]);T.steps(2);T.put(q,.9,A);q.hp=99;const x0=q.x,z0=q.z;
    T.startMove(n);T.steps(n==='kick'?44:20,.016);res[n]=+Math.hypot(q.x-x0,q.z-z0).toFixed(2);}
  // victim with a building right behind it
  const P=T.player,W=T.world,home=[P.x,P.z,P.h];let spot=null;
  for(let r=3;r<70&&!spot;r+=1.5)for(let a=0;a<6.28&&!spot;a+=.2){const x=P.x+Math.cos(a)*r,z=P.z+Math.sin(a)*r,dx=Math.cos(a+3.14159),dz=Math.sin(a+3.14159);
    for(let k=.3;k<.7;k+=.1){const bx=x+dx*k*-1,bz=z+dz*k*-1;if(W.inBuilding(bx,bz)&&!W.inBuilding(x,z)&&!W.inBuilding(x+dx*.9,z+dz*.9)){spot={x,z,dx:-dx,dz:-dz};break;}}}
  let wall={found:!!spot};
  if(spot){T.reset();const q=T.put(T.peds[5],.9,A);q.hp=99;P.x=spot.x-spot.dx*.9;P.z=spot.z-spot.dz*.9;P.h=Math.atan2(spot.dx,spot.dz);q.x=spot.x;q.z=spot.z;
    let inside=0;T.startMove('kick');T.steps(60,.016,()=>{if(W.inBuilding(q.x,q.z))inside++;});wall.insideFrames=inside;wall.moved=+Math.hypot(q.x-spot.x,q.z-spot.z).toFixed(2);}
  T.peds[5].mode='hide';[P.x,P.z,P.h]=home;T.reset();
  return{ok:res.jab>=.4&&res.cross>=.6&&res.kick>=1&&(!spot||wall.insideFrames===0),displacement:res,wall};},ADULT);

await check('hitstopFreezesClips',A=>{const T=__t;T.reset();const q=T.put(T.peds[6],.9,A);T.hideAll([q]);T.steps(20);T.put(q,.9,A);q.hp=99;T.steps(20);T.put(q,.9,A);
  const i=T.peds.indexOf(q),pl=T.CHAR.list[T.player.mode==='foot'?T.peds.length:0];
  T.startMove('cross');const log=[];let started=false;
  for(let k=0;k<30;k++){T.steps(1,.016);const st=T.CHAR.list[i];if(!st||!st.o.visible)return{ok:false,err:'victim has no mannequin',use:T.CHAR.use[i]};
    log.push([T.cmb.hs>0?1:0,+st.oneT.toFixed(4),st.one||'-']);}
  const frozen=log.filter((e,k)=>k>0&&log[k-1][0]&&e[0]&&e[2]!=='-');
  const same=frozen.length>=1&&frozen.every((e,k)=>e[1]===log[log.indexOf(e)-1][1]);
  const after=log.filter(e=>!e[0]&&e[2]!=='-');
  return{ok:same&&after.length>2&&after[after.length-1][1]>after[0][1],frozenFrames:frozen.length,hitstopS:T.MOVES.cross.hs,sample:log.slice(0,8)};},ADULT);

await check('comboJabCrossKick',A=>{const T=__t;T.reset();const q=T.put(T.peds[7],.9,A);T.hideAll([q]);T.steps(20);T.put(q,.9,A);q.hp=99;
  const adv=()=>{let g=0;while(T.cmb.mv&&T.cmb.mv.t<T.cmb.mv.d.su+T.cmb.mv.d.ac+.001&&g++<200)T.steps(1,.016);};
  const seq=[];T.press('KeyX');seq.push(T.cmb.mv.n);
  T.press('KeyX');const ignored=T.cmb.mv.n==='jab';
  adv();T.press('KeyX');seq.push(T.cmb.mv.n);adv();T.press('KeyX');seq.push(T.cmb.mv.n);adv();T.steps(40,.016);
  return{ok:seq.join()==='jab,cross,kick'&&ignored&&T.cmb.chain===3&&q.hp===95&&q.mode==='down',seq,earlyPressIgnored:ignored,chain:T.cmb.chain,hp:q.hp,mode:q.mode};},ADULT);
await shotTo('kick',`const T=__t;T.reset();const q=T.put(T.peds[7],1.0,{age:'adult',male:true,young:true});q.hp=99;q.mode='idle';T.hideAll([q]);T.steps(2);T.put(q,1.0,{age:'adult',male:true,young:true});q.hp=99;T.startMove('kick');T.steps(17,.016);${side}`);
await p.evaluate(()=>{__t.steps(60);__t.reset();});

await check('opponentBlocks30pct',A=>{const T=__t;T.reset();const q=T.put(T.peds[8],.9,YOUNG);T.hideAll([q]);T.steps(2);
  const trial=(hp,rand)=>{T.reset();T.put(q,.9,YOUNG);q.mode='fight';q.ai=T.aiInit();q.ai.atk=999;q.hp=hp;T.cmb.rand=()=>rand;T.startMove('jab');return{hp:q.hp,blk:q.blk};};
  const a=trial(5,.1),b=trial(5,.9),c=trial(3,.1);
  T.cmb.rand=Math.random;let n=0,N=400;for(let k=0;k<N;k++){T.reset();T.put(q,.9,YOUNG);q.mode='fight';q.ai=T.aiInit();q.ai.atk=999;q.hp=5;T.startMove('jab');if(q.hp===5)n++;}
  q.mode='hide';T.reset();
  return{ok:a.hp===5&&a.blk>0&&b.hp===4&&c.hp===2&&n/N>.2&&n/N<.4,blockedLowRoll:a,hitHighRoll:b,lowHpNeverBlocks:c,blockRate:n/N};},YOUNG);
await check('opponentBacksOffAfterTwoHits',A=>{const T=__t;T.reset();const q=T.put(T.peds[9],.9,YOUNG);T.hideAll([q]);T.steps(2);T.put(q,.9,YOUNG);q.mode='fight';q.ai=T.aiInit();q.hp=99;
  T.cmb.rand=()=>.9;T.startMove('jab');T.steps(4,.016);while(T.cmb.mv&&T.cmb.mv.t<.13)T.steps(1,.016);T.press('KeyX');T.steps(30,.016);
  const back=q.back>0,d0=Math.hypot(q.x-T.player.x,q.z-T.player.z);
  const atkBefore=q.mv;let maxD=d0,attacked=false;T.steps(60,.016,()=>{maxD=Math.max(maxD,Math.hypot(q.x-T.player.x,q.z-T.player.z));if(q.mv)attacked=true;});
  q.mode='hide';T.cmb.rand=Math.random;T.reset();
  return{ok:!attacked&&maxD>d0+.15,backedOff:back,attackedWhileBacking:attacked,dist0:+d0.toFixed(2),maxDist:+maxD.toFixed(2),dbg:[q.mode,q.hp,q.back,q.ai&&q.ai.hits.length,T.cmb.hs]};},YOUNG);
await check('opponentFleesAtHp1OnlyWhenPlayerUnhurt',A=>{const T=__t;T.reset();const q=T.put(T.peds[10],.9,YOUNG);T.hideAll([q]);T.steps(2);
  T.put(q,.9,YOUNG);q.mode='fight';q.ai=T.aiInit();q.hp=1;T.player.hp=3;T.fight.hurtT=T.clock;T.steps(3);const hurtMode=q.mode;
  T.player.hp=5;T.steps(2);const unhurtMode=q.mode;q.mode='hide';T.reset();return{ok:hurtMode==='fight'&&unhurtMode==='flee',hurtMode,unhurtMode};},YOUNG);
await check('attackWindowsVaryAndNeverOverlap',A=>{const T=__t,Y=YOUNG;T.reset();const a=T.put(T.peds[11],1.1,Y,-.6),b=T.put(T.peds[12],1.1,Y,.6);T.hideAll([a,b]);T.steps(2);
  T.put(a,1.1,Y,-.6);T.put(b,1.1,Y,.6);for(const q of[a,b]){q.mode='fight';q.ai=T.aiInit();q.hp=99;}
  T.player.hp=9999;T.cmb.stam=0;const starts={a:[],b:[]},hits=[];let prevA=null,prevB=null,both=0,hp=T.player.hp,dist=[];
  T.steps(1500,.033,()=>{if(a.mv&&a.mv!==prevA)starts.a.push(T.clock);if(b.mv&&b.mv!==prevB)starts.b.push(T.clock);prevA=a.mv;prevB=b.mv;
    if(a.mv&&b.mv)both++;if(T.player.hp<hp)hits.push(T.clock);hp=T.player.hp;dist.push(Math.hypot(a.x-T.player.x,a.z-T.player.z));T.fight.hurtT=T.clock;});
  const iv=[];for(const s of[starts.a,starts.b])for(let k=1;k<s.length;k++)iv.push(s[k]-s[k-1]);
  const mean=iv.reduce((x,y)=>x+y,0)/iv.length,sd=Math.sqrt(iv.reduce((x,y)=>x+(y-mean)**2,0)/iv.length);
  let close=0;for(let k=1;k<hits.length;k++)if(hits[k]-hits[k-1]<.1)close++;
  const inBand=dist.filter(d=>d>=1&&d<=1.9).length/dist.length;
  a.mode=b.mode='hide';T.reset();
  return{ok:iv.length>10&&sd>0&&both===0&&close===0&&hits.length>5&&starts.a.length>2&&starts.b.length>2&&inBand>.6,attacksA:starts.a.length,attacksB:starts.b.length,hits:hits.length,intervalMeanS:+mean.toFixed(2),intervalSdS:+sd.toFixed(2),minInterval:+Math.min(...iv).toFixed(2),maxInterval:+Math.max(...iv).toFixed(2),simultaneousStarts:both,dbg:[a.mode,b.mode,a.ai&&a.ai.atk,T.cmb.tok&&T.peds.indexOf(T.cmb.tok),T.cmb.hs],hitsWithin100ms:close,fractionInBand:+inBand.toFixed(2)};},YOUNG);
await check('hudShowsInFight',()=>{const T=__t;T.reset();T.fight.last=T.clock;T.steps(2);const el=document.querySelector('#cbar');const vis=!el.hidden;const w=[...el.querySelectorAll('i')].map(i=>i.style.width);
  T.cmb.stam=40;T.cmb.sT=T.clock;T.steps(1);const w2=document.querySelector('#cbar div+div i').style.width;T.reset();return{ok:vis&&w[0]==='100%'&&w2==='40%',visible:vis,bars:w,staminaBar:w2};});
console.log('errors',JSON.stringify(errs.slice(0,6)));
await b.close();
if(errs.length)fails.push('errors');
if(fails.length){console.log('FAIL',fails.join(' '));process.exit(1);}
console.log('PASS');
