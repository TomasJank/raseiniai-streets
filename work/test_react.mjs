// people answer back (react step): node test_react.mjs page.html [shotsDir]   (page = build.sh + add_react.py)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_react']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`reactVoice=(f=>r=>{window.__rv.push([peds.indexOf(r.p),r.t]);return f(r);})(reactVoice);window.__rv=[];
window.__t={get world(){return world},get player(){return player},get peds(){return peds},get pedGroups(){return pedGroups},get clock(){return pedClock},get cmb(){return cmb},get fight(){return fight},
get GY(){return GY},set tod(v){tod=v},set camH(v){camH=v},get RX(){return RX},get REACT_LINES(){return REACT_LINES},reactSay,reactWho,voiceInfo,get voiceData(){return voiceData},press,enterExit,resetToRoad,renderer,scene,camera,snapCamera,startTalk,
steps(n,dt=.033,each){for(let i=0;i<n;i++){updatePeople(dt);if(each)each(i);}},
alone(q){const k=[q];if(q.guard){this.put(q.guard,1.5,3);k.push(q.guard);}this.hideAll(k);},
hideAll(keep){for(const q of peds)if(!keep.includes(q)){q.mode='hide';q.lead=null;q.grp=null;}},
put(q,d,side=0,away=false){Object.assign(q,{mode:'idle',timer:999,lead:null,pair:null,grp:null,seat:null,react:0,nerv:0,hp:null,ko:0,fall:0,hop:0,dest:null,seen:1e9,mv:null,ai:null,kb:null,kd:null,blk:0,back:0,rcIn:0,rcT:null,rcB:null,rcK:null,rcE:0});
  const f=player.h,rx=Math.cos(f),rz=-Math.sin(f);q.x=player.x+Math.sin(f)*d+rx*side;q.z=player.z+Math.cos(f)*d+rz*side;q.h=away?f:f+Math.PI;return q;},
of(who){const L={kid:{age:'kid'},man:{age:'adult',male:true},woman:{age:'adult',male:false},oldm:{age:'old',male:true},oldf:{age:'old',male:false}}[who];
  return peds.find(q=>reactWho(q)===who&&(who!=='kid'||q.guard))||Object.assign(peds[{kid:11,man:12,woman:13,oldm:14,oldf:15}[who]].look,L)&&peds[{kid:11,man:12,woman:13,oldm:14,oldf:15}[who]];},
walkInto(q,n=30){const P=player;P.speed=3;const l0=__rv.length;this.steps(n,.033,()=>{P.x+=Math.sin(P.h)*.1;P.z+=Math.cos(P.h)*.1;});P.speed=0;return __rv.slice(l0);},
back(m=2){player.x-=Math.sin(player.h)*m;player.z-=Math.cos(player.h)*m;this.steps(2);},
reset(){cmb.mv=cmb.dodge=cmb.lunge=cmb.pk=cmb.tok=null;cmb.stam=100;cmb.hs=0;cmb.stage=-1;cmb.chain=0;cmb.endT=-9;cmb.rand=()=>.99;player.hp=5;fight.pDown=0;fight.pStag=0;RX.last=-1e9;},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_react.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_react.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000,polling:500});await p.waitForTimeout(1500);
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};
const shotTo=async(name,fn)=>{const s=await p.evaluate(`(()=>{${fn}})()`);fs.writeFileSync(`${dir}${out}/${name}.png`,Buffer.from(s.split(',')[1],'base64'));};
const chase=`__t.camH=__t.player.h;__t.snapCamera();__t.renderer.render(__t.scene,__t.camera);return __t.renderer.domElement.toDataURL('image/png');`;

await check('setup',()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;
  T.enterExit();T.hideAll([]);T.steps(2);const who=['kid','man','woman','oldm','oldf'].map(w=>!!T.of(w));return{ok:T.player.mode==='foot'&&who.every(Boolean),who};});

await check('bumpOneBubbleOneVoiceFacing',()=>{const T=__t,R=T.RX;T.reset();const q=T.put(T.of('woman'),1.6,0,true);T.hideAll([q]);T.steps(2);
  const said=T.walkInto(q,18),i=T.peds.indexOf(q);T.steps(10);
  const want=Math.atan2(T.player.x-q.x,T.player.z-q.z),dh=Math.abs(Math.atan2(Math.sin(q.h-want),Math.cos(q.h-want)));
  const vis=R.spr.filter(s=>s.visible).length;
  return{ok:said.length===1&&said[0][0]===i&&T.REACT_LINES.bump.woman.includes(said[0][1])&&R.on.length===1&&vis===1&&dh<.3,said,bubbles:vis,facingErr:+dh.toFixed(2)};});
// the moment of contact as the chase camera sees it: he walks up to her from behind her shoulder, she has turned round
const stage=async(who,kind)=>{await p.evaluate(([w,k])=>{const T=__t,P=T.player;T.reset();const q=T.of(w);T.put(q,1.6);T.alone(q);T.steps(2);q.rcT=q.rcB=null;
  P.x=q.x-Math.sin(P.h)*.75;P.z=q.z-Math.cos(P.h)*.75;q.h=P.h+Math.PI;T.reactSay(q,k);T.steps(3);},[who,kind]);await p.waitForTimeout(700);};
await stage('woman','bump');await shotTo('bump',`__t.player.speed=0;${chase}`.replace('camH=__t.player.h','camH=__t.player.h+.5'));

await check('secondBumpWithinCooldownSilent',()=>{const T=__t,q=T.RX.on.length?T.RX.on[0].p:T.of('woman');T.RX.last=-1e9;T.back(2);const said=T.walkInto(q,22);return{ok:said.length===0,said,since:+(T.clock-q.rcT).toFixed(2)};});

await check('laterBumpEscalates',()=>{const T=__t,q=T.of('woman');T.steps(150);T.back(2);const said=T.walkInto(q,22);
  return{ok:said.length===1&&T.REACT_LINES.again.woman.includes(said[0][1]),said};});

await check('standingStillNoBump',()=>{const T=__t;T.reset();const q=T.put(T.of('man'),.3);T.hideAll([q]);const l=__rv.length;T.steps(10);return{ok:__rv.length===l};});

await check('punchLandsHitLine',()=>{const T=__t;T.steps(40);T.reset();const q=T.put(T.of('man'),.9);T.hideAll([q]);T.steps(2);T.put(q,.9);const l=__rv.length;
  T.press('KeyX');T.steps(20,.016);const said=__rv.slice(l);T.steps(60);
  return{ok:said.length===1&&T.REACT_LINES.hit.man.includes(said[0][1])&&q.hp<4,said,hp:q.hp,mode:q.mode};});
await check('kickLandsHitLine',()=>{const T=__t;T.reset();const q=T.put(T.of('oldf'),.9);T.hideAll([q]);T.steps(2);T.put(q,.9);const l=__rv.length;
  T.press('KeyZ');T.steps(30,.016);const said=__rv.slice(l);
  return{ok:said.length===1&&T.REACT_LINES.hit.oldf.includes(said[0][1])&&T.RX.on.some(r=>r.p===q),said,hp:q.hp,mode:q.mode};});
await p.evaluate(()=>{__t.steps(40);});await shotTo('hit',`const T=__t;T.reset();T.steps(200,.05);const q=T.put(T.of('man'),.9);T.alone(q);T.steps(2);T.put(q,.9);q.rcT=null;T.press('KeyX');T.steps(14,.016);${chase}`);

await check('poolsBySpeaker',()=>{const T=__t,res={};
  for(const w of['kid','man','woman','oldm','oldf']){T.reset();T.steps(200,.05);const q=T.put(T.of(w),1.6);T.alone(q);T.steps(2);const s=T.walkInto(q,18);
    res[w]=s.length===1&&T.REACT_LINES.bump[w].includes(s[0][1])?s[0][1]:false;}
  return{ok:Object.values(res).every(Boolean),res};});

await check('noLineDownOrFleeing',()=>{const T=__t,res={};
  for(const m of['down','flee','cower']){T.reset();T.steps(200,.05);const q=T.put(T.of('man'),1.6);T.hideAll([q]);T.steps(2);q.mode=m;q.timer=9;q.vx=q.vz=0;res[m]=T.walkInto(q,18).length;}
  // knocked out by the hit itself
  T.reset();T.steps(200,.05);const q=T.put(T.of('woman'),.9);T.hideAll([q]);T.steps(2);T.put(q,.9);q.hp=1;const l=__rv.length;T.press('KeyX');T.steps(20,.016);res.ko=__rv.length-l;res.koMode=q.mode;
  return{ok:res.down===0&&res.flee===0&&res.cower===0&&res.ko===0&&res.koMode==='down',res};});

await check('reactionCutsOwnTalkLine',()=>{const T=__t;T.reset();T.steps(200,.05);const a=T.put(T.of('man'),1.6),c=T.put(T.of('woman'),2.4,1.2);T.hideAll([a,c]);
  T.startTalk([a,c],(a.x+c.x)/2,(a.z+c.z)/2);const g=T.pedGroups[T.pedGroups.length-1];let n=0;while(!(g.say>0&&g.mem[g.spk]===a)&&n++<400)T.steps(1);
  const was=g.text;T.player.x=a.x-Math.sin(T.player.h)*1.2;T.player.z=a.z-Math.cos(T.player.h)*1.2;const s=T.walkInto(a,14);
  const r=T.RX.on.find(r=>r.p===a);const sayAfter=g.say;let resumed=false;T.steps(300,.033,()=>{if(g.say>0&&g.text!==was)resumed=true;});
  return{ok:s.length===1&&sayAfter<=0&&!!r&&resumed,talkLine:was,said:s,groupSayAfter:sayAfter,resumed};});

await check('noBackToBackRepeat',()=>{const T=__t,seq=[];
  for(let k=0;k<120;k++){const q=T.of(['man','woman','kid','oldm','oldf'][k%5]);T.reset();q.rcT=q.rcB=null;q.mode='idle';const r=T.reactSay(q,['bump','hit','again'][k%3]);if(r)seq.push(r.t);T.RX.on.forEach(x=>x.end=0);T.steps(1);}
  const rep=seq.filter((t,i)=>i&&seq[i-1]===t).length;return{ok:seq.length===120&&rep===0,lines:seq.length,repeats:rep};});

await check('globalOnePerSecond',()=>{const T=__t;T.reset();const a=T.of('man'),c=T.of('woman');for(const q of[a,c]){q.rcT=q.rcB=null;q.mode='idle';}
  const r1=T.reactSay(a,'bump'),r2=T.reactSay(c,'bump');T.steps(32);const r3=T.reactSay(c,'bump');return{ok:!!r1&&!r2&&!!r3};});

await check('everyLineHasClip',()=>{const T=__t;T.voiceInfo('');const D=T.voiceData,all=Object.values(T.REACT_LINES).flatMap(p=>Object.values(p).flat());
  const bad=all.filter(t=>{const v=D.lines[t];return!v||!D.clips[v[0]]||!D.clips[v[1]];});return{ok:all.length>=40&&bad.length===0,lines:all.length,bad};});

// sheet: a kid, a man, a woman and an old person, each with a line
for(const w of['kid','man','woman','oldf']){
  await shotTo('sheet_'+w,`const T=__t;T.reset();T.steps(200,.05);const q=T.put(T.of('${w}'),2.2);T.alone(q);T.steps(2);q.h=T.player.h;T.walkInto(q,18);T.back(1.2);T.steps(8);
    const y=T.GY(q.x,q.z),a=Math.atan2(T.player.x-q.x,T.player.z-q.z)+.9;return T.shot([q.x+Math.sin(a)*2.5,y+1.6,q.z+Math.cos(a)*2.5],[q.x,y+1.5,q.z]);`);
}
if(errs.length)fails.push('pageErrors');
console.log('pageErrors',JSON.stringify(errs.slice(0,5)));
console.log(fails.length?'FAIL '+fails.join(' '):'PASS');
await b.close();process.exit(fails.length?1:0);
