// day species checks (leashed dogs, yard dogs, storks, pigeons and jackdaws), exits 1 on any failure: node test_animals_day.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_animals_day']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
// with add_voice the game's own sfxAnimal is in scope and shadows a page-level stub, so swap it in place
const hook=h.includes('function sfxAnimal(')?'hookSfx(f){sfxAnimal=f},':'hookSfx(f){window.sfxAnimal=f},';
// with the fight step its own fight object is in scope, so victims go there
const vic=h.includes('const fight=')?'victims(l){for(const o of l)o.hitT=pedClock;fight.victims=l},':'victims(l){window.fight={victims:l}},';
const api=`window.__t={${hook}${vic}get world(){return world},get player(){return player},get tod(){return tod},set tod(v){tod=v},get CENTRE(){return CENTRE},get GY(){return GY},pip,peds,SPECIES,ANIMALS,updateAnimals,updatePeople,resetToRoad,renderer,scene,camera,
live(){return Object.values(ANIMALS).flat().filter(a=>a.mode!=='hide')},
steps(n,dt=.033,ppl){for(let i=0;i<n;i++){if(ppl)updatePeople(dt);updateAnimals(dt);}},
goto(x,z){player.x=x;player.z=z;resetToRoad();player.car.speed=0;},
inB(){return this.live().filter(a=>a.rig!=='bat'&&a.y<1&&world.inBuilding(a.x,a.z)).map(a=>a.name)},
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_animals_day.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_animals_day.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const fails=[];
const ev=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={fail:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(r&&r.fail)fails.push(name+': '+r.fail);return r;};
const save=async(name,fn,arg)=>{const s=await p.evaluate(fn,arg);if(s)fs.writeFileSync(`${dir}${out}/${name}.png`,Buffer.from(s.split(',')[1],'base64'));else console.log('no shot',name);};
// camera d m from the animal, eye at 1.7 m, looking at the animal
const view=(name,d)=>save(name,([name,d])=>{const T=__t,a=T.live().find(q=>q.name===name);if(!a)return null;const g=T.GY(a.x,a.z),y=g+a.y+.3;
  for(const k of[0,1,2,3,4,5,6,7]){const t=a.h+1.2+k*.8,x=a.x+Math.sin(t)*d,z=a.z+Math.cos(t)*d;let clear=true;for(let s=.1;s<1;s+=.1)if(T.world.inBuilding(a.x+(x-a.x)*s,a.z+(z-a.z)*s))clear=false;
    if(clear)return T.shot([x,T.GY(x,z)+1.7,z],[a.x,y,a.z]);}return null;},[name,d]);

await ev('setup',()=>{window.__snd=[];window.__sndAt=[];__t.hookSfx((k,x,z)=>{__snd.push(k);__sndAt.push([k,x,z]);});__t.tod=13;Date.prototype.__gm=Date.prototype.getMonth;return{species:Object.keys(__t.SPECIES)};});

// yard dogs: the densest patch of garden fences
await ev('yardDog',()=>{const T=__t,S=T.world.hedgeSegs,P=T.player;let best=null,bn=0;
  for(let i=0;i<S.length;i+=7){const s=S[i];let n=0;for(const q of S)if(Math.abs(q[0]-s[0])<150&&Math.abs(q[1]-s[1])<150)n++;if(n>bn){bn=n;best=s;}}
  T.goto(best[0]+50,best[1]);T.steps(400);const dogs=T.live().filter(a=>a.name==='dog_yard');if(!dogs.length)return{fail:'no yard dog'};
  const a=dogs[0],y=a.dog_yard_y,car=P.car,keep=[P.x,P.z,P.h],n0=__snd.length;let out=0,track=0,inB=0;P.mode='foot';
  // walk past outside the fence, 2.5 m from it
  for(let i=0;i<=400;i++){const u=-8+(y.L+16)*i/400;P.x=y.ax+y.ux*u-y.nx*2.5;P.z=y.az+y.uz*u-y.nz*2.5;P.h=Math.atan2(y.ux,y.uz);T.steps(1);
    if(!T.pip(a.x,a.z,y.pts))out++;if(T.world.inBuilding(a.x,a.z))inB++;if(u>2&&u<y.L-2&&Math.abs(a.dog_yard_u-u)<1.2)track++;}
  P.mode='car';P.car=car;[P.x,P.z,P.h]=keep;const barks=__snd.slice(n0).filter(k=>k==='bark').length;
  const r={dogs:dogs.length,len:+y.L.toFixed(1),depth:+y.D.toFixed(1),outside:out,inB,trackingFrames:track,barks};
  const f=[];if(out)f.push('left its yard');if(inB)f.push('inside a building');if(track<50)f.push('did not run along the fence');if(barks<3)f.push('no barking');if(f.length)r.fail=f.join(', ');window.__yard=a;return r;});
await save('dog_yard',()=>{const T=__t,a=window.__yard;if(!a||a.mode==='hide')return null;const y=a.dog_yard_y,g=T.GY(a.x,a.z);
  return T.shot([a.x-y.nx*8+y.ux*4,g+2.6,a.z-y.nz*8+y.uz*4],[a.x,g+.4,a.z]);});

// leashed dogs: near the centre, people moving with them
await ev('leash',()=>{const T=__t,C=T.CENTRE;T.goto(C[0]+60,C[1]+20);
  for(let i=0;i<40&&T.live().filter(a=>a.dog_lead_owner).length<3;i++)T.steps(30,.033,true);
  const dogs=T.live().filter(a=>a.dog_lead_owner);if(!dogs.length)return{fail:'no leashed dog'};
  let worst=0,lost=0,frames=0,inB=0;const modes={};
  for(let i=0;i<300;i++){T.steps(1,.033,true);for(const a of dogs){if(a.mode==='hide'){continue;}const o=a.dog_lead_owner;frames++;
    worst=Math.max(worst,Math.hypot(a.x-o.x,a.z-o.z));modes[o.mode+'>'+a.mode]=(modes[o.mode+'>'+a.mode]||0)+1;if(T.world.inBuilding(a.x,a.z))inB++;}}
  lost=dogs.filter(a=>a.mode==='hide').length;
  const r={dogs:dogs.map(a=>a.name),worst:+worst.toFixed(2),dogFrames:frames,hiddenWithOwner:lost,inB,modes};
  const f=[];if(worst>2.5)f.push('dog more than 2.5 m from its owner');if(frames<300)f.push('no dog followed for 300 frames');if(inB)f.push('inside a building');if(f.length)r.fail=f.join(', ');return r;});
for(const n of['dog_lead_small','dog_lead','dog_lead_big'])await view(n,15);
await save('dog_lead_close',()=>{const T=__t,a=T.live().find(q=>q.dog_lead_owner&&q.mode!=='hide');if(!a)return null;const o=a.dog_lead_owner,g=T.GY(a.x,a.z),t=a.h+1.6;
  return T.shot([a.x+Math.sin(t)*5,g+1.6,a.z+Math.cos(t)*5],[(a.x+o.x)/2,g+.6,(a.z+o.z)/2]);});

await ev('ownerHit',()=>{const T=__t,P=T.player,a=T.live().find(q=>q.dog_lead_owner&&q.mode!=='hide');if(!a)return{fail:'no leashed dog'};
  const o=a.dog_lead_owner,car=P.car,keep=[P.x,P.z,P.h],n0=__snd.length;P.mode='foot';P.x=o.x+4;P.z=o.z;P.h=-Math.PI/2;
  T.victims([o]);let near=99;for(let i=0;i<90;i++){T.steps(1);near=Math.min(near,Math.hypot(a.x-P.x,a.z-P.z));}const end=Math.hypot(a.x-P.x,a.z-P.z);
  T.victims([]);T.steps(90);const back=Math.hypot(a.x-o.x,a.z-o.z);P.mode='car';P.car=car;[P.x,P.z,P.h]=keep;
  const barks=__snd.slice(n0).filter(k=>k==='bark').length,r={closest:+near.toFixed(2),end:+end.toFixed(2),barks,backToOwner:+back.toFixed(2)};
  if(near<1.3||end>2||barks<2||back>2.5)r.fail='no lunge to 1.5 m with barking, or did not return';return r;});

await ev('ownerStops',()=>{const T=__t,a=T.live().find(q=>q.dog_lead_owner&&q.mode!=='hide');if(!a)return{fail:'no leashed dog'};const o=a.dog_lead_owner,m=o.mode,r={};
  for(const k of['sit','stop'])
  {o.mode=k;T.steps(45);r[k]={dog:a.mode,sp:+a.sp.toFixed(2),d:+Math.hypot(a.x-o.x,a.z-o.z).toFixed(2)};}o.mode=m;
  if(r.sit.dog!=='sit'||r.stop.sp>0||r.stop.d>2.5)r.fail='dog did not sit or stop with its owner';return r;});

// storks: only April to August, on the pole top
await ev('storkWinter',()=>{const T=__t;Date.prototype.getMonth=()=>10;T.steps(400);const n=T.live().filter(a=>a.name==='stork').length;return n?{n,fail:'stork in November'}:{n};});
await ev('storkSummer',()=>{const T=__t;Date.prototype.getMonth=()=>5;T.steps(400);const L=T.live().filter(a=>a.name==='stork');if(!L.length)return{fail:'no stork in June'};
  const a=L[0],poles=L.map(q=>q.pole),r={n:L.length,y:L.map(q=>q.y),onPole:L.filter(q=>Math.hypot(q.x-q.pole.x,q.z-q.pole.z)<.01).length,shared:poles.length-new Set(poles).size};
  // walk under it and wait for the clatter
  const P=T.player,car=P.car,keep=[P.x,P.z,P.h],n0=__snd.length;P.mode='foot';P.x=a.x+10;P.z=a.z;a.st=.05;let flapped=false;for(let i=0;i<20;i++){T.steps(1);flapped=flapped||a.mode==='fly';}
  P.mode='car';P.car=car;[P.x,P.z,P.h]=keep;r.sounds=__sndAt.slice(n0).filter(s=>Math.hypot(s[1]-a.x,s[2]-a.z)<.5).map(s=>s[0]);r.flapped=flapped;window.__stork=a;
  const f=[];if(L.some(q=>Math.abs(q.y-8.75)>.01))f.push('not at pole-top height');if(r.onPole!==L.length)f.push('off its pole');if(r.shared)f.push('two on one pole');
  if(!r.sounds.includes('flap')||r.sounds.some(k=>k!=='flap'))f.push('wrong stork sound');if(!flapped)f.push('no wing beat with the clatter');if(f.length)r.fail=f.join(', ');return r;});
await view('stork',15);
await save('stork_close',()=>{const T=__t,a=window.__stork;if(!a)return null;const g=T.GY(a.x,a.z);return T.shot([a.x+4,g+9.6,a.z+3],[a.x,g+9,a.z]);});
await ev('storkPoleDown',()=>{const T=__t,a=window.__stork;if(!a||a.mode==='hide')return{fail:'stork gone'};const q=a.pole,y0=a.y,g=T.GY(a.x,a.z),P=T.player,keep=[P.x,P.z];P.x=a.x+15;P.z=a.z;T.camera.position.set(a.x+20,g+2,a.z+20);T.camera.lookAt(a.x,g+8,a.z);T.camera.updateMatrixWorld();q.down=true;T.steps(30);const r={mode:a.mode,climb:+(a.y-y0).toFixed(2),moved:+Math.hypot(a.x-q.x,a.z-q.z).toFixed(2),leave:a.leave};q.down=false;[P.x,P.z]=keep;
  Date.prototype.getMonth=Date.prototype.__gm;if(r.mode!=='fly'||r.climb<.5||r.moved<3||!r.leave)r.fail='stayed on the fallen pole';return r;});

// pigeons and jackdaws: flocks in the centre, scatter from the player and land 10-20 m on
await ev('flock',()=>{const T=__t,C=T.CENTRE,P=T.player;T.goto(C[0]+70,C[1]+30);P.h=Math.atan2(70,30);
  for(let i=0;i<40;i++){T.steps(30);if(T.live().filter(a=>a.name==='pigeon').length>=4)break;}
  const L=T.live().filter(a=>a.pigeon_f),flocks=[...new Set(L.map(a=>a.pigeon_f))];
  const r={wants:flocks.map(f=>f.want),pigeons:L.filter(a=>a.name==='pigeon').length,jackdaws:L.filter(a=>a.name==='jackdaw').length,flocks:flocks.map(f=>f.m.filter(a=>a.mode!=='hide').length),
    fromCentre:flocks.map(f=>Math.round(Math.hypot(f.x-C[0],f.z-C[1]))),birds:L.length};
  const f=[];if(!r.pigeons)f.push('no pigeons');if(flocks.some(f=>f.want<4||f.want>8||f.m.length>f.want))f.push('flock size');if(r.fromCentre.some(d=>d>360))f.push('flock outside the centre');if(T.live().filter(a=>a.rig==='bird').length>16)f.push('bird pool');
  if(f.length)r.fail=f.join(', ');window.__flock=flocks.find(f=>f.S.n===6)||flocks[0];return r;});
await save('pigeons',()=>{const T=__t,f=window.__flock;if(!f)return null;const g=T.GY(f.x,f.z);return T.shot([f.x+5,g+1.7,f.z+3],[f.x,g+.1,f.z]);});
await ev('scatter',()=>{const T=__t,P=T.player,f=window.__flock;if(!f)return{fail:'no flock'};const M=f.m.filter(a=>a.mode!=='hide'),x0=f.x,z0=f.z,car=P.car,keep=[P.x,P.z,P.h],n0=__snd.length;
  P.mode='foot';P.x=x0+.5;P.z=z0;T.steps(2);const flying=M.filter(a=>a.mode==='fly').length;let top=0,inB=0;
  for(let i=0;i<150;i++){T.steps(1);for(const a of M){top=Math.max(top,a.y);if(a.y<1&&T.world.inBuilding(a.x,a.z))inB++;}}
  const land=M.map(a=>Math.hypot(a.x-x0,a.z-z0)),r={birds:M.length,flying,top:+top.toFixed(1),landed:M.filter(a=>a.mode==='peck'&&a.y<.05).length,
    dist:[+Math.min(...land).toFixed(1),+Math.max(...land).toFixed(1)],inB,sounds:[...new Set(__snd.slice(n0))]};
  P.mode='car';P.car=car;[P.x,P.z,P.h]=keep;
  const kind=f.S.sound.kind,f2=[];if(flying!==M.length)f2.push('flock did not lift off together');if(r.landed!==M.length)f2.push('did not land again');if(r.dist[0]<7||r.dist[1]>23)f2.push('landed outside 10-20 m');
  if(inB)f2.push('inside a building');if(!r.sounds.includes(kind))f2.push('no '+kind);if(f2.length)r.fail=f2.join(', ');return r;});
await ev('carScatter',()=>{const T=__t,f=window.__flock,c=T.world.cars.find(c=>c!==T.player.car);if(!f||!c)return{fail:'no flock or car'};const M=f.m.filter(a=>a.mode!=='hide'),keep=[c.x,c.z,c.speed];
  c.x=f.x+2.5;c.z=f.z;c.speed=8;T.steps(15);[c.x,c.z,c.speed]=keep;const r={flying:M.filter(a=>a.mode==='fly').length,birds:M.length};if(!r.flying)r.fail='a car at 2.5 m did not scatter the flock';return r;});
await ev('jackdawSound',()=>{const T=__t,j=T.live().find(a=>a.name==='jackdaw');if(!j)return{skipped:'no jackdaw flock nearby'};const P=T.player,keep=[P.x,P.z],n0=__snd.length;P.x=j.x+20;P.z=j.z;j.st=.01;T.steps(1);[P.x,P.z]=keep;
  const s=__snd.slice(n0);return s.includes('caw')?{sounds:s}:{sounds:s,fail:'jackdaw is not cawing'};});

await ev('allDay',()=>{const T=__t,L=T.live(),n=s=>L.filter(a=>a.name===s).length,r={inB:T.inB(),dogs:n('dog_lead')+n('dog_lead_small')+n('dog_lead_big'),yard:n('dog_yard'),pigeon:n('pigeon'),jackdaw:n('jackdaw')};
  T.tod=23;T.steps(800);const D=T.live().filter(a=>/^(dog_|pigeon|jackdaw|stork)/.test(a.name));r.at23=D.map(a=>a.name);T.tod=13;
  const f=[];if(r.inB.length)f.push('inside a building');if(r.at23.length)f.push('day species at 23:00');if(f.length)r.fail=f.join(', ');return r;});

await ev('budget',()=>{const T=__t,C=T.CENTRE;T.goto(C[0]+60,C[1]+20);T.steps(200,.033,true);let tot=0,worst=0;
  for(let i=0;i<300;i++){T.updatePeople(.033);const t0=performance.now();T.updateAnimals(.033);const t=performance.now()-t0;tot+=t;worst=Math.max(worst,t);}
  const L=T.live(),r={quads:L.filter(a=>a.rig==='quad').length,birds:L.filter(a=>a.rig==='bird').length,avgMs:+(tot/300).toFixed(4),worstMs:+worst.toFixed(3)};if(r.avgMs>=.3)r.fail='over 0.3 ms';return r;});

console.log('errors',JSON.stringify(errs.slice(0,6)));
if(errs.length)fails.push('page errors');
await b.close();
if(fails.length){console.log('FAIL',JSON.stringify(fails));process.exit(1);}
console.log('PASS');
