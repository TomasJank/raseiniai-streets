// spoken dialogue and animal sounds: node test_voice.mjs page.html   (exit 1 on a failed assertion)
// headless chromium has no audio output, so this checks the graph: clips, decoded buffers, live sources, nodes
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get pedGroups(){return pedGroups},set tod(v){tod=v},
get snd(){return snd},get AC(){return AC},get muted(){return muted},get voiceLast(){return voiceLast},voiceLive,voiceInfo,get voiceData(){return voiceData},
TALKS,TALK_BYE,TALK_HM,camera,resetToRoad,resetPed,startTalk,initAudio,press,sfxAnimal,
steps(n,dt=.033){for(let i=0;i<n;i++){updateTraffic(dt);updatePeople(dt);}}};`;
fs.writeFileSync(dir+'_voice.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:900,height:560}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_voice.html',{timeout:120000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1000);
let fails=0;
const check=(name,ok,info)=>{console.log(ok?'ok  ':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};
const wait=ms=>p.waitForTimeout(ms);

const block=await p.evaluate(()=>{const T=__t,el=document.getElementById('rasVoice');if(!el)return{block:false};T.voiceInfo('');const D=T.voiceData;
  const all=[...new Set([...T.TALKS.flatMap(t=>t[1]),...T.TALK_BYE.flat(),...T.TALK_HM])];
  const bad=all.filter(s=>{const v=D.lines[s];return!v||!D.clips[v[0]]||!D.clips[v[1]];});
  return{block:true,lines:all.length,clips:Object.keys(D.clips).length,kb:Math.round(el.textContent.length/1024),bad:bad.slice(0,8),nBad:bad.length};});
check('rasVoice block has a male and a female clip for every dialogue line',block.block&&block.nBad===0&&block.lines>100,block);

await p.evaluate(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;
  T.tod=13;T.steps(200);T.initAudio();
  // a man and a woman about 8 m from the player, side by side, talking
  T.talkAt=()=>{const P=T.player,cx=P.x+6,cz=P.z+5.3,mem=T.peds.filter(q=>q.mode!=='talk'&&!q.grp&&q.mode!=='hide').slice(0,2);
    mem.forEach((q,i)=>{T.resetPed(q);Object.assign(q,{mode:'walk',x:cx+i*1.1,z:cz,sp:1.3,e:T.world.edges[0],t:.5,dir:1,side:1});});
    mem[0].look.male=true;mem[1].look.male=false;T.startTalk(mem,cx+.55,cz);return T.pedGroups[T.pedGroups.length-1];};
  T.live=g=>[...T.voiceLive].filter(s=>s.grp===g).length;});
await p.waitForFunction(()=>__t.snd&&__t.AC,null,{timeout:5000});

// first line: the clip is decoded on first use and started from the speaker
// a passing car can break a fresh talk up before its first line; try again from a new pair
const first=await p.evaluate(()=>{const T=__t;let g;for(let n=0;n<4&&!(g&&g.i>=0);n++){g=T.talkAt();for(let k=0;k<600&&g.i<0&&T.pedGroups.includes(g);k++)T.steps(1);}
  T.g=g;if(g.i<0)return{i:-1,live:T.pedGroups.includes(g)};
  const [w,t]=g.script[g.i],spk=g.mem[w%g.mem.length],v=T.voiceInfo(t),male=!!spk.look.male,len=T.voiceData.clips[v[male?1:0]][1]/((male?v[2]:1)*1.061);
  return{i:g.i,text:t,male,say:+g.say.toFixed(2),minLen:+len.toFixed(2),distToPlayer:+Math.hypot(spk.x-T.player.x,spk.z-T.player.z).toFixed(1),state:T.AC.state};});
check('subtitle lasts at least as long as the clip',first.i>=0&&first.say>=first.minLen-.04,first);
await wait(600);
const played=await p.evaluate(()=>{const T=__t,g=T.g,L=T.voiceLast;if(!L)return{played:false};
  const j=g.script.findIndex(s=>s[1]===L.text),spk=j>=0?g.mem[g.script[j][0]%g.mem.length]:null;
  return{played:true,...L,len:+(L.len||0).toFixed(2),inScript:j>=0,want:spk?(spk.look.male?'m':'f'):null,live:T.live(g),
    clipLen:j>=0?T.voiceData.clips[T.voiceInfo(L.text)[L.voice==='m'?1:0]][1]:0};});
check('talk 8 m away plays a clip in the speaker\'s voice',played.played&&played.inScript&&played.voice===played.want&&played.len>.3&&Math.abs(played.len-played.clipLen)<.15,played);
check('male voice is the female clip slowed (say backend) or its own clip, rate within the speaker spread',
  played.played&&(played.voice==='m'?played.rate>.7&&played.rate<1.07:played.rate>.93&&played.rate<1.07),played);

// whole talk: never two live clips in the group, several lines spoken in both voices
const run=await (async()=>{let maxLive=0,starts=0,last=null,voices=new Set(),rates=new Set();
  for(let k=0;k<400;k++){const r=await p.evaluate(()=>{const T=__t,g=T.g;T.steps(8);return{live:T.live(g),done:!T.pedGroups.includes(g),L:T.voiceLast};});
    maxLive=Math.max(maxLive,r.live);if(r.L&&JSON.stringify(r.L)!==last){last=JSON.stringify(r.L);starts++;voices.add(r.L.voice);rates.add(r.L.rate.toFixed(3));}
    if(r.done)break;await wait(25);}
  return{maxLive,starts,voices:[...voices],rates:[...rates]};})();
check('a group never has two clips playing at once',run.maxLive<=1&&run.starts>=3,run);
check('both voices heard, two speakers at different rates',run.voices.length===2&&run.rates.length>=2,run);

// V mutes the master and stops new clips
const mute=await p.evaluate(async()=>{const T=__t;T.press('KeyV');const g=T.talkAt(),before=T.voiceLast;for(let k=0;k<600&&g.i<1;k++)T.steps(1);
  await new Promise(r=>setTimeout(r,500));const r={muted:T.muted,gain:T.snd.master.gain.value,newClip:T.voiceLast!==before,live:T.live(g),
    animal:T.sfxAnimal('bark',T.camera.position.x+3,T.camera.position.z)};T.press('KeyV');r.unmutedGain=T.snd.master.gain.value;return r;});
check('V silences the voices',mute.muted&&mute.gain===0&&!mute.newClip&&mute.live===0&&mute.animal===0&&mute.unmutedGain>0,mute);

// animals: nodes are created near the camera, nothing beyond 60 m
const animal=await p.evaluate(()=>{const T=__t,A=T.AC,n={};for(const f of['createOscillator','createBufferSource','createBiquadFilter','createGain','createStereoPanner']){const o=A[f];A[f]=function(){n[f]=(n[f]||0)+1;return o.apply(this,arguments);};}
  const c=T.camera.position,res={};for(const k of['bark','meow','caw','coo','hoot','snort','snuffle','squeak','flap'])res[k]=+T.sfxAnimal(k,c.x+5,c.z+2).toFixed(2);
  const near={...n};for(const k in n)n[k]=0;res.far=T.sfxAnimal('bark',c.x+70,c.z);res.unknown=T.sfxAnimal('moo',c.x,c.z);
  return{res,near,farNodes:Object.values(n).reduce((a,b)=>a+b,0)};});
check('sfxAnimal makes nodes and returns a duration for every kind',Object.entries(animal.res).every(([k,v])=>k==='far'||k==='unknown'?v===0:v>.2)&&animal.near.createStereoPanner===9&&animal.near.createOscillator>9&&animal.near.createBufferSource>9&&animal.farNodes===0,animal);

check('no page errors',errs.length===0,errs.slice(0,4));
await b.close();
if(fails){console.log(fails,'failed');process.exit(1);}
console.log('all passed');
