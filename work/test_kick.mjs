// kick clip checks: node test_kick.mjs page.html [shotsDir]   (page = build.sh + add_kick.py)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_kick']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get fight(){return fight},get cmb(){return cmb},get CHAR(){return CHAR},get clock(){return pedClock},
get tod(){return tod},set tod(v){tod=v},get heat(){return heat},get GY(){return GY},get MOVES(){return MOVES},get PLAYER_I(){return PLAYER_I},get PMOVES(){return PMOVES},get aiInit(){return aiInit},press,enterExit,updatePeople,resetToRoad,renderer,scene,camera,startMove,startDodge,hurtPlayer,fightEvent,
steps(n,dt=.033,each){for(let i=0;i<n;i++){updatePeople(dt);if(each)each(i);}},
hideAll(keep){for(const q of peds)if(!keep.includes(q)){q.mode='hide';q.lead=null;}},
put(q,d,look,side=0){Object.assign(q.look,look);Object.assign(q,{mode:'idle',timer:999,lead:null,pair:null,grp:null,seat:null,react:0,nerv:0,hp:null,ko:0,fall:0,hop:0,dest:null,seen:1e9,mv:null,ai:null,kb:null,kd:null,blk:0,back:0});
  const f=player.h,rx=Math.cos(f),rz=-Math.sin(f);q.x=player.x+Math.sin(f)*d+rx*side;q.z=player.z+Math.cos(f)*d+rz*side;q.h=f+Math.PI;return q;},
key(type,code){dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));},
reset(){cmb.mv=cmb.dodge=cmb.lunge=cmb.pk=cmb.tok=null;cmb.stam=100;cmb.hs=0;cmb.stage=-1;cmb.chain=0;cmb.endT=-9;cmb.rand=Math.random;player.hp=5;fight.pDown=0;fight.pStag=0;},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_kick.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_kick.html');
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

const ADULT_={age:'adult',male:false};
await check('clipOnEveryMannequin',()=>{const T=__t,C=T.CHAR,k=C.clips&&C.clips.kick;T.steps(3);
  const sts=C.list.filter(s=>s&&s.o.visible);
  return{ok:!!k&&k.name==='kick'&&k.tracks.length===12&&k.userData.contact>0.3&&sts.length>1&&sts.every(s=>!!s.act.kick),tracks:k&&k.tracks.length,dur:k&&+k.duration.toFixed(3),contact:k&&k.userData.contact,mannequins:sts.length,withClip:sts.filter(s=>!!s.act.kick).length,
    armTracks:k&&k.tracks.filter(t=>/upperarm|lowerarm|hand|Head|clavicle/.test(t.name)).length};});
await check('charOneKickPlays',()=>{const T=__t,st=T.CHAR.list.find(s=>s&&s.o.visible&&s!==T.CHAR.list[T.PLAYER_I]);const c=T.CHAR;
  st.one='kick';st.oneT=0;T.steps(4,.033);const used=st.clip==='kick'&&st.act.kick.isRunning()&&st.act.kick.getEffectiveWeight()>.1;
  st.one=null;T.steps(30,.033);return{ok:used,clip:st.clip};});
await check('playerKickPlaysClipAndContactInWindow',A=>{const T=__t,P=T.player,M=T.MOVES.kick;T.reset();const q=T.put(T.peds[1],.95,A);T.hideAll([q]);T.steps(20);T.put(q,.95,A);q.hp=9;
  const st=T.CHAR.list[T.PLAYER_I],fwdX=Math.sin(P.h),fwdZ=Math.cos(P.h),foot=st.bone.foot_r,v=st.o.position.clone();
  T.key('keydown','KeyZ');T.key('keyup','KeyZ');const m=T.cmb.mv;const log=[];let hitT=-1,named=true,played=0,maxW=0;
  for(let i=0;i<70;i++){T.steps(1,.016);if(!T.cmb.mv&&!m)break;named=named&&(m.n==='kick');
    st.o.updateMatrixWorld(true);foot.getWorldPosition(v);log.push([+m.t.toFixed(3),(v.x-P.x)*fwdX+(v.z-P.z)*fwdZ,+st.act.kick.time.toFixed(3)]);
    if(hitT<0&&q.hp<9)hitT=m.t;if(st.act.kick.time>0&&m.t<M.su+M.ac+M.rc)played++;}
  const moving=log.filter(e=>e[0]<M.su+M.ac+M.rc);let pk=moving[0];for(const e of moving)if(e[1]>pk[1])pk=e;
  const lo=M.su,hi=M.su+M.ac,t0=moving[0][1];
  return{ok:named&&played>20&&pk[0]>=lo-.02&&pk[0]<=hi+.02&&pk[1]-t0>.5&&hitT>=lo-.001&&hitT<=hi+.02,moveNameKeptKick:named,framesWithClipTime:played,contactAtMoveT:pk[0],window:[lo,hi],footForwardPeak:+pk[1].toFixed(2),footForwardStart:+t0.toFixed(2),hitAtMoveT:+hitT.toFixed(3),clipTimeAtContact:pk[2],clipContact:T.CHAR.clips.kick.userData.contact};},ADULT_);
await check('proceduralFallbackWithoutClip',A=>{const T=__t,P=T.player,C=T.CHAR,k=C.clips.kick;T.reset();T.hideAll([]);T.steps(30);
  const st=C.list[T.PLAYER_I];C.clips.kick=undefined;const had=st.act.kick;delete st.act.kick;
  T.key('keydown','KeyZ');T.key('keyup','KeyZ');let tx=0;const q0=st.bone.thigh_r.quaternion.clone();
  for(let i=0;i<30;i++){T.steps(1,.016);if(T.cmb.mv&&T.cmb.mv.n!=='kick')return{ok:false,renamed:T.cmb.mv.n};tx=Math.max(tx,2*Math.acos(Math.min(1,Math.abs(st.bone.thigh_r.quaternion.dot(q0)))));}
  C.clips.kick=k;st.act.kick=had;T.steps(60,.016);T.reset();
  return{ok:tx>.5,maxThighRotRad:+tx.toFixed(2)};});
await shotTo('kick0',`const T=__t;T.reset();const q=T.put(T.peds[7],1.0,{age:'adult',male:true,young:true});q.hp=99;T.hideAll([q]);T.steps(2);T.put(q,1.0,{age:'adult',male:true,young:true});q.hp=99;T.startMove('kick');T.steps(8,.016);${side}`);
await p.evaluate(()=>{__t.steps(60);__t.reset();});
await shotTo('kick1',`const T=__t;T.reset();const q=T.put(T.peds[7],1.0,{age:'adult',male:true,young:true});q.hp=99;T.hideAll([q]);T.steps(2);T.put(q,1.0,{age:'adult',male:true,young:true});q.hp=99;T.startMove('kick');T.steps(17,.016);${side}`);
await p.evaluate(()=>{__t.steps(60);__t.reset();});
await shotTo('kick2',`const T=__t;T.reset();const q=T.put(T.peds[7],1.0,{age:'adult',male:true,young:true});q.hp=99;T.hideAll([q]);T.steps(2);T.put(q,1.0,{age:'adult',male:true,young:true});q.hp=99;T.startMove('kick');T.steps(36,.016);${side}`);
await p.evaluate(()=>{__t.steps(60);__t.reset();});
console.log('errors',JSON.stringify(errs.slice(0,6)));
await b.close();
if(errs.length)fails.push('errors');
if(fails.length){console.log('FAIL',fails.join(' '));process.exit(1);}
console.log('PASS');
