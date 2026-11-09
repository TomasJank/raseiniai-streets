// night wildlife checks (hedgehog, fox, hare, bat, owl, deer), exits 1 on any failure: node test_animals_night.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_night']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get tod(){return tod},set tod(v){tod=v},get heat(){return heat},set heat(v){heat=v},
get cash(){return cash},set cash(v){cash=v},get GY(){return GY},ENV,SPECIES,ANIMALS,ANIMAL_N,updateAnimals,updateEnv,resetToRoad,syncCar,renderer,scene,camera,
NIGHT:['hedgehog','fox','hare','bat','owl','deer'],
live(){return Object.values(ANIMALS).flat().filter(a=>a.mode!=='hide')},
mine(){return this.live().filter(a=>this.NIGHT.includes(a.name))},
steps(n,dt=.033){for(let i=0;i<n;i++)updateAnimals(dt);},
go(x,z){const c=player.car;player.mode='car';c.x=x;c.z=z;c.speed=0;player.x=x;player.z=z;},
nearGreen(isF){const P=player;return world.green.filter(g=>g[1]===isF).map(g=>g[0]).sort((a,b)=>Math.hypot(a[0][0]-P.x,a[0][1]-P.z)-Math.hypot(b[0][0]-P.x,b[0][1]-P.z))[0];},
shot(from,to,fov){const f0=camera.fov;if(fov){camera.fov=fov;camera.updateProjectionMatrix();}camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);
  const u=renderer.domElement.toDataURL('image/png');camera.fov=f0;camera.updateProjectionMatrix();return u;}};`;
fs.writeFileSync(dir+'_night.html',h.replace(o,api+o));
const voice=h.includes('function sfxAnimal(');
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_night.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const fails=[];
const ev=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={fail:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(r&&r.fail)fails.push(name+': '+r.fail);return r;};
const save=(png,n)=>{if(png)fs.writeFileSync(`${dir}${out}/${n}.png`,Buffer.from(png.split(',')[1],'base64'));};

// the densest patch of garden fences (lamps and poles are along its streets)
await ev('day',()=>{const T=__t,S=T.world.hedgeSegs;let best=null,bn=0;
  for(let i=0;i<S.length;i+=7){const s=S[i];let n=0;for(const q of S)if(Math.abs(q[0]-s[0])<150&&Math.abs(q[1]-s[1])<150)n++;if(n>bn){bn=n;best=s;}}
  T.go(best[0]+50,best[1]);T.resetToRoad();T.player.car.speed=0;T.player.x=T.player.car.x;T.player.z=T.player.car.z;window.__home=[T.player.x,T.player.z];
  T.tod=13;T.steps(400);const m=T.mine().map(a=>a.name);return m.length?{fail:'night species by day: '+m}:{mine:0};});

await p.evaluate(()=>{__t.tod=23;__t.updateEnv(0);});
await ev('nightHome',()=>{const T=__t,W=T.world;T.tod=23;T.updateEnv(0);T.steps(900);window.__seen=new Set(T.mine().map(a=>a.name));
  const L=T.live(),c={};for(const a of T.mine())c[a.name]=(c[a.name]||0)+1;
  return{night:+T.ENV.night.value.toFixed(2),count:c,quads:L.filter(a=>a.rig==='quad').length,inB:L.filter(a=>a.rig!=='bat'&&W.inBuilding(a.x,a.z)).length};});

await ev('hedgehogCurls',()=>{const T=__t,P=T.player,a=T.live().find(q=>q.name==='hedgehog');if(!a)return{fail:'no hedgehog'};const car=P.car,keep=[P.x,P.z];
  a.mode='walk';a.timer=0;P.mode='foot';P.x=a.x+1.5;P.z=a.z;T.steps(3);const curled=a.mode,pos=[a.x,a.z];
  P.x=a.x+30;T.steps(60);const still=a.mode;T.steps(130);const after=a.mode;P.mode='car';P.car=car;[P.x,P.z]=keep;
  const r={curled,stillAt2s:still,after6s:after,moved:+Math.hypot(a.x-pos[0],a.z-pos[1]).toFixed(2)};
  if(curled!=='sit'||still!=='sit'||after==='sit')r.fail='hedgehog did not curl for 5 s';return r;});

await ev('bats',()=>{const T=__t,B=T.live().filter(a=>a.name==='bat');if(B.length<6)return{fail:'only '+B.length+' bats'};
  const d3=a=>Math.hypot(a.x-a.lamp[0],T.GY(a.x,a.z)+a.y-a.lamp[1],a.z-a.lamp[2]);let worst=0;for(let i=0;i<120;i++){T.steps(1);for(const a of B)if(a.mode==='fly')worst=Math.max(worst,d3(a));}
  const lamp=B[0].lamp,at=B.filter(a=>a.lamp===lamp);let q=at[0].pole;if(!q){q={down:false};for(const a of at)a.pole=q;}
  q.down=true;T.steps(1);const left=at.every(a=>a.mode==='away'||a.mode==='hide');T.steps(60);const away=Math.min(...at.map(a=>a.mode==='hide'?99:Math.hypot(a.x-lamp[0],a.z-lamp[2])));
  T.steps(700);const back=T.live().filter(a=>a.name==='bat'&&a.pole===q&&!a.leave).length;q.down=false;
  const r={bats:B.length,lamps:new Set(B.map(a=>a.lamp)).size,worstFromLamp:+worst.toFixed(2),onFallen:at.length,leftAtOnce:left,minAwayAfter2s:+away.toFixed(1),stillThere:back,realPole:!!at[0].pole.parts};
  if(worst>8)r.fail='bat beyond 8 m of its lamp';else if(!left||away<8||back)r.fail='bats stayed at a fallen lamp';return r;});

await ev('owl',(voice)=>{const T=__t,P=T.player,a=T.live().find(q=>q.name==='owl');if(!a)return{fail:'no owl'};const calls=[];if(!voice)window.sfxAnimal=k=>calls.push(k);
  const car=P.car,keep=[P.x,P.z],pole=a.pole;P.mode='foot';P.x=a.x+20;P.z=a.z;T.steps(1400);const hoots=calls.filter(k=>k==='hoot').length,faced=Math.abs(Math.sin(a.h-Math.atan2(P.x-a.x,P.z-a.z)));
  P.x=a.x+4;T.steps(3);const fled=a.mode;P.x=a.x+40;T.steps(400);const r={hoots,facing:+faced.toFixed(2),onApproach:fled,mode:a.mode,newPole:a.pole!==pole&&a.mode==='perch',y:+a.y.toFixed(2)};
  P.mode='car';P.car=car;[P.x,P.z]=keep;delete window.sfxAnimal;
  const f=[];if(!voice&&hoots<1)f.push('no hoot in 46 s');if(faced>.2)f.push('not facing the player');if(fled!=='fly')f.push('did not fly off at 4 m');if(f.length)r.fail=f.join(', ');return r;},voice);

await ev('fieldAndForest',()=>{const T=__t,W=T.world,r={};
  for(const isF of[false,true]){const F=T.nearGreen(isF);T.go(F[0][0]+60,F[0][1]);T.steps(500);for(const a of T.mine())window.__seen.add(a.name);r[isF?'forest':'field']=T.mine().map(a=>a.name).sort().join(' ');}
  const L=T.live();r.seen=[...window.__seen].sort();r.inB=L.filter(a=>a.rig!=='bat'&&W.inBuilding(a.x,a.z)).length;
  const miss=T.NIGHT.filter(n=>!window.__seen.has(n)),f=[];if(miss.length)f.push('never appeared: '+miss);if(r.inB)f.push('inside a building');if(f.length)r.fail=f.join(', ');return r;});

await ev('deerFreezeBolt',()=>{const T=__t,P=T.player,c=P.car,a=T.live().find(q=>q.name==='deer'&&q.mode!=='down');if(!a)return{fail:'no deer'};
  T.tod=23;T.updateEnv(0);a.mode='walk';a.timer=0;a.deer_c=99;c.h=Math.random()*6.28;c.x=a.x-Math.sin(c.h)*14;c.z=a.z-Math.cos(c.h)*14;c.speed=0;P.mode='car';P.x=c.x;P.z=c.z;P.h=c.h;
  T.steps(3);const m1=a.mode;let t=0;while(a.mode==='freeze'&&t<120){T.steps(1);t++;}const m2=a.mode,x0=a.x,z0=a.z,d0=Math.hypot(a.x-c.x,a.z-c.z);T.steps(15);
  const v=Math.hypot(a.x-x0,a.z-z0)/(15*.033),d1=Math.hypot(a.x-c.x,a.z-c.z),r={first:m1,frozeS:+(t*.033+.1).toFixed(2),then:m2,speed:+v.toFixed(1),gained:+(d1-d0).toFixed(1)};
  if(m1!=='freeze')r.fail='no freeze in headlights';else if(r.frozeS<.9||r.frozeS>2.2)r.fail='froze '+r.frozeS+' s';else if(v<=5||d1<=d0)r.fail='no bolt';return r;});

await ev('deerHit',()=>{const T=__t,P=T.player,c=P.car,a=T.live().find(q=>q.name==='deer'&&q.mode!=='down');if(!a)return{fail:'no deer'};
  a.mode='walk';a.timer=0;a.deer_c=99;T.cash=500;T.heat=0;c.hp=1;c.dead=false;let ups=0,downs=0,h0=0,m0=500;
  c.h=a.h+Math.PI/2;c.x=a.x-Math.sin(c.h)*6;c.z=a.z-Math.cos(c.h)*6;P.x=c.x;P.z=c.z;P.h=c.h;
  for(let i=0;i<60;i++){if(!c.dead)c.speed=12;c.x+=Math.sin(c.h)*12*.033;c.z+=Math.cos(c.h)*12*.033;P.x=c.x;P.z=c.z;T.steps(1);if(T.heat>h0)ups++;if(T.cash<m0)downs++;h0=T.heat;m0=T.cash;}
  const r={mode:T.live().some(q=>q.name==='deer'&&q.mode==='down')?'down':a.mode,heat:T.heat,cash:T.cash,heatRises:ups,cashDrops:downs,hp:+(c.hp??1).toFixed(2)};T.heat=0;c.hp=1;c.dead=false;c.speed=0;
  if(r.mode!=='down'||ups!==1||downs!==1||T.cash!==350||r.hp>=1)r.fail='deer hit not counted once with a dent';return r;});

await ev('frameCost',()=>{const T=__t,W=T.world,F=T.nearGreen(true);T.go(F[0][0]+60,F[0][1]);T.steps(400);let tot=0;
  for(let i=0;i<300;i++){const t0=performance.now();T.updateAnimals(.033);tot+=performance.now()-t0;}
  const L=T.live(),r={live:L.length,mine:T.mine().length,avgMs:+(tot/300).toFixed(4),inB:L.filter(a=>a.rig!=='bat'&&W.inBuilding(a.x,a.z)).length};
  if(r.avgMs>=.3)r.fail='over 0.3 ms';else if(r.inB)r.fail='inside a building';return r;});

// one picture per species at 15 m from the car with its headlights on (bats and the owl from below the lamp/pole)
for(const n of['deer','fox','hare','hedgehog','owl','bat']){
  const png=await p.evaluate(n=>{const T=__t,P=T.player,c=P.car;T.tod=23;T.updateEnv(0);let a=T.live().find(q=>q.name===n&&q.mode!=='down');
    if(!a){const H=window.__home;T.go(H[0],H[1]);if(n==='hare'){const F=T.nearGreen(false);T.go(F[0][0]+60,F[0][1]);}if(n==='deer'){const F=T.nearGreen(true);T.go(F[0][0]+60,F[0][1]);}
      for(let i=0;i<900&&!a;i++){T.steps(1);a=T.live().find(q=>q.name===n&&q.mode!=='down');}}
    if(!a)return null;const air=a.rig!=='quad',D=air?9:15;
    const W=T.world,R=D+5.5;c.h=0;for(let k=0;k<24;k++){const h=k*Math.PI/12;let ok=true;for(let s=0;s<=R;s+=1)if(W.inBuilding(a.x-Math.sin(h)*s,a.z-Math.cos(h)*s))ok=false;if(ok){c.h=h;break;}}c.x=a.x-Math.sin(c.h)*D;c.z=a.z-Math.cos(c.h)*D;c.speed=0;P.mode='car';P.x=c.x;P.z=c.z;P.h=c.h;T.syncCar(c);
    if(n!=='bat'){a.mode=n==='owl'?'perch':'walk';a.sp=n==='owl'?0:1;a.vx=a.vz=0;a.h=c.h+Math.PI*.6;}T.updateAnimals(.001);if(n!=='bat'&&n!=='owl'){a.mode='walk';a.sp=1;}
    const g=T.GY(c.x,c.z),y=T.GY(a.x,a.z)+(air?a.y:a.S.scale*a.S.legs);
    const from=air?[a.x-Math.sin(c.h)*9,T.GY(a.x,a.z)+1.7,a.z-Math.cos(c.h)*9]:[c.x-Math.sin(c.h)*5.5,g+2.4,c.z-Math.cos(c.h)*5.5];return[T.shot(from,[a.x,y,a.z]),T.shot(from,[a.x,y,a.z],12)];},n);
  if(!png)fails.push('no '+n+' for a picture');else{save(png[0],n);save(png[1],n+'_zoom');}
}

console.log('errors',JSON.stringify(errs.slice(0,6)));
if(errs.length)fails.push('page errors');
await b.close();
if(fails.length){console.log('FAIL',JSON.stringify(fails));process.exit(1);}
console.log('PASS');
