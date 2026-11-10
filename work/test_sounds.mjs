// recorded animal calls: node test_sounds.mjs page.html  (exit 1 on a failed assertion)
// headless chromium has no audio output, so this checks the graph: clips, decoded buffers, node types, fallback
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get player(){return player},get world(){return world},get snd(){return snd},get AC(){return AC},SND_ANIM,SND_KIND,sfxAnimal,animSound,initAudio,resetToRoad};`;
fs.writeFileSync(dir+'_sounds.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:900,height:560}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_sounds.html',{timeout:120000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1000);
let fails=0;
const check=(name,ok,info)=>{console.log(ok?'ok  ':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};

const blk=await p.evaluate(()=>{const el=document.getElementById('rasAnim');if(!el)return{block:false};const D=JSON.parse(el.textContent);return{block:true,clips:Object.keys(D).sort(),kb:Math.round(el.textContent.length/1024)};});
check('rasAnim block: 11 clips, at most 150 KB',blk.block&&blk.clips.length===11&&blk.kb<=150,blk);

// a spy over every node the game's AudioContext makes; calls go through to the real context
await p.evaluate(async()=>{const T=__t;T.resetToRoad();T.initAudio();const AC=T.AC;
  const L=window.__log={osc:0,pan:0,gain:0,src:[],links:[]};
  for(const [m,k] of [['createOscillator','osc'],['createStereoPanner','pan'],['createGain','gain']]){const f=AC[m].bind(AC);AC[m]=()=>{L[k]++;return f();};}
  const fs_=AC.createBufferSource.bind(AC);AC.createBufferSource=()=>{const s=fs_(),c=s.connect.bind(s);s.connect=n=>{L.links.push(n.constructor.name);return c(n);};L.src.push(s);return s;};
  window.__reset=()=>{L.osc=L.pan=L.gain=0;L.src.length=0;L.links.length=0;};
  window.__at=()=>({x:T.player.x+6,z:T.player.z});
  T.sfxAnimal('bark',T.player.x+6,T.player.z);await T.SND_ANIM.ready;});
const dec=await p.evaluate(()=>{const T=__t,B=T.SND_ANIM.buf;return{names:Object.keys(B).sort(),dur:Object.fromEntries(Object.entries(B).map(([k,b])=>[k,+b.duration.toFixed(2)])),rate:T.AC.sampleRate};});
check('every clip decodes to an AudioBuffer with duration > 0',dec.names.length===11&&Object.values(dec.dur).every(d=>d>0),dec);

const kinds=['bark','meow','caw','coo','hoot','snort','snuffle','squeak','flap'];
const per=await p.evaluate(kinds=>{const T=__t,r={};for(const k of kinds){__reset();const {x,z}=__at(),d=T.sfxAnimal(k,x,z),L=__log;
  r[k]={d:+d.toFixed(2),osc:L.osc,src:L.src.length,sample:L.src.every(s=>Object.values(T.SND_ANIM.buf).includes(s.buffer)),pan:L.pan,gain:L.gain,links:[...new Set(L.links)].join()};}return r;},kinds);
check('each kind plays recorded BufferSources, no oscillators, one panner and gain, length 0.1 to 3 s',
  kinds.every(k=>{const q=per[k];return q.osc===0&&q.src>=1&&q.sample&&q.pan===1&&q.gain===1&&q.links==='GainNode'&&q.d>.1&&q.d<3;}),per);
const chain=await p.evaluate(()=>{const T=__t;let to=null;const f=T.AC.createStereoPanner.bind(T.AC);T.AC.createStereoPanner=()=>{const n=f(),c=n.connect.bind(n);n.connect=t=>{to=t===T.snd.master;return c(t);};return n;};
  const {x,z}=__at();T.sfxAnimal('meow',x,z);T.AC.createStereoPanner=f;return{panToMaster:to};});
check('panner feeds the master bus',chain.panToMaster===true,chain);

const dogs=await p.evaluate(()=>{const T=__t,B=T.SND_ANIM.buf,name=b=>Object.keys(B).find(k=>B[k]===b),r={};
  for(const sp of['dog_lead','dog_lead_small','dog_lead_big','dog_yard','fox','deer']){const bursts=new Set(),clips=new Set();
    for(let i=0;i<40;i++){__reset();const {x,z}=__at();T.sfxAnimal('bark',x,z,{sp});bursts.add(__log.src.length);__log.src.forEach(s=>clips.add(name(s.buffer)));}
    r[sp]={clips:[...clips].join(),bursts:[...bursts].sort().join()};}return r;});
check('dog variant by species (shiba/fox small, husky big, yard medium)',dogs.dog_lead.clips==='bark_small'&&dogs.dog_lead_small.clips==='bark_small'&&dogs.fox.clips==='bark_small'&&dogs.dog_lead_big.clips==='bark_big'&&dogs.dog_yard.clips==='bark_med',dogs);
check('yard dogs bark in 2 to 4 bursts, others 1 or 2',dogs.dog_yard.bursts==='2,3,4'&&dogs.dog_lead.bursts==='1,2',{yard:dogs.dog_yard.bursts,lead:dogs.dog_lead.bursts});

const rates=await p.evaluate(()=>{const T=__t,v=[];for(let i=0;i<60;i++){__reset();const {x,z}=__at();T.sfxAnimal('meow',x,z);v.push(__log.src[0].playbackRate.value);}return{min:Math.min(...v),max:Math.max(...v)};});
check('playback rate varies within +-15%',rates.min>=.85&&rates.max<=1.15&&rates.max-rates.min>.1,rates);

const far=await p.evaluate(()=>{const T=__t;__reset();return{ret:T.sfxAnimal('bark',T.player.x+200,T.player.z),src:__log.src.length};});
check('silent beyond 60 m',far.ret===0&&far.src===0,far);

const ent=await p.evaluate(()=>{const T=__t;__reset();const {x,z}=__at();T.animSound({S:{sound:{kind:'bark'}},name:'dog_yard',d:10,x,z,mode:'walk',sp:0});return{src:__log.src.length,osc:__log.osc};});
check('animSound routes through the samples with the species',ent.src>=2&&ent.osc===0,ent);

const fb=await p.evaluate(()=>{const T=__t,B=T.SND_ANIM.buf,saved=B.meow;delete B.meow;__reset();const {x,z}=__at();const d=T.sfxAnimal('meow',x,z);const r={d:+d.toFixed(2),osc:__log.osc};B.meow=saved;
  const all=T.SND_ANIM.buf;T.SND_ANIM.buf={};__reset();const d2=T.sfxAnimal('bark',x,z);const r2={d:+d2.toFixed(2),osc:__log.osc};T.SND_ANIM.buf=all;return{meow:r,bark:r2};});
check('missing buffer falls back to the synth (oscillators, duration kept)',fb.meow.osc>0&&fb.meow.d>0&&fb.bark.d>0,fb);

check('no console errors',errs.length===0,errs.slice(0,3));
await b.close();process.exit(fails?1:0);
