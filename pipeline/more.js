// ---------- saved progress ----------
// a sandboxed page may refuse storage; the game then simply forgets on reload
const SAVE_KEY='raseiniai-streets-save';
const save={cash:0,best:0,found:[],races:{}};
try{Object.assign(save,JSON.parse(localStorage.getItem(SAVE_KEY))||{});}catch(e){}
let saveT=0;
function store(){save.cash=cash;save.best=Math.max(save.best,streak);try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}}
addEventListener('pagehide',store);document.addEventListener('visibilitychange',()=>{if(document.hidden)store();});
cash=save.cash;
function money(){$('#cash').textContent='€'+cash.toLocaleString('en');}
money();

// ---------- time of day and weather ----------
const ENV={night:{value:0},wet:{value:0},snow:{value:0},t:{value:0},sky:{value:new THREE.Color(0xbcd2e3)}};
let tod=15,skyT=0;
const weather={kind:'clear',amt:0,want:0,next:180+Math.random()*120};
const hemi=scene.children.find(o=>o.isHemisphereLight);
const C=h=>new THREE.Color(h);
const SKIES={day:[C(0x7fa7cf),C(0xbcd2e3),C(0xdfe7ec)],dusk:[C(0x3c4f78),C(0xd98c5f),C(0xf2c08a)],night:[C(0x060a14),C(0x0f1626),C(0x18202e)],grey:[C(0x7d858c),C(0x9da3a8),C(0xb7bbbe)]};
const _sk=[new THREE.Color(),new THREE.Color(),new THREE.Color()],_c1=new THREE.Color();
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const beamTex=(()=>{const W=64,H=128,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),d=g.createImageData(W,H);
  for(let y=0;y<H;y++){const v=y/H,half=.18+.32*v;for(let x=0;x<W;x++){const u=Math.abs(x/W-.5),a=Math.max(0,1-u/half)*Math.pow(1-v,1.4)*Math.min(1,v*8);const i=(y*W+x)*4;d.data[i]=d.data[i+1]=d.data[i+2]=255;d.data[i+3]=a*255;}}
  g.putImageData(d,0,0);return new THREE.CanvasTexture(c);})();
const beamM=new THREE.MeshBasicMaterial({map:beamTex,color:0xfff0c8,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});beamM.userData.keep=true;
const beamGeoCar=new THREE.PlaneGeometry(5.5,17).rotateX(-Math.PI/2).translate(0,.16,10.6);beamGeoCar.userData.keep=true;
const poolM=new THREE.MeshBasicMaterial({map:glowTex,color:0xffc878,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2});poolM.userData.keep=true;
const haloM=new THREE.PointsMaterial({map:glowTex,color:0xffd79a,size:3.2,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});haloM.userData.keep=true;
let lampPools=null,lampHalos=null;
function lightLamps(){
  const L=world.lamps||[];lampPools=lampHalos=null;if(!L.length)return;
  lampPools=new THREE.InstancedMesh(new THREE.CircleGeometry(7,20).rotateX(-Math.PI/2),poolM,L.length);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),n=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),one=new THREE.Vector3(1,1,1),p=new THREE.Vector3();
  L.forEach((l,i)=>{const x=l[0],z=l[2];n.set(GY(x-2,z)-GY(x+2,z),4,GY(x,z-2)-GY(x,z+2)).normalize();q.setFromUnitVectors(up,n);p.set(x,GY(x,z)+.2,z);m.compose(p,q,one);lampPools.setMatrixAt(i,m);});
  lampPools.visible=false;worldGroup.add(lampPools);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(L.flat(),3));
  lampHalos=new THREE.Points(g,haloM);lampHalos.visible=false;worldGroup.add(lampHalos);
}
function carBeam(c){if(!c.g.userData.beam){const b=new THREE.Mesh(beamGeoCar,beamM);b.visible=false;c.g.add(b);c.g.userData.beam=b;}return c.g.userData.beam;}

const RAIN=2600,rainPos=new Float32Array(RAIN*6),rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xc9d3dc,transparent:true,opacity:0,depthWrite:false}));
const SNOW=2600,snowPos=new Float32Array(SNOW*3),snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowPos,3));
const snow=new THREE.Points(snowGeo,new THREE.PointsMaterial({map:glowTex,color:0xffffff,size:.22,transparent:true,opacity:0,depthWrite:false}));
for(const o of[rain,snow]){o.frustumCulled=false;o.visible=false;scene.add(o);}
for(let i=0;i<RAIN;i++){rainPos[i*6]=Math.random()*70-35;rainPos[i*6+1]=Math.random()*40-15;rainPos[i*6+2]=Math.random()*70-35;}
for(let i=0;i<SNOW;i++){snowPos[i*3]=Math.random()*70-35;snowPos[i*3+1]=Math.random()*40-15;snowPos[i*3+2]=Math.random()*70-35;}
const wrap=(v,c)=>c+((v-c+35)%70+70)%70-35;
function fall(dt){
  const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;
  if(rain.visible){for(let i=0;i<RAIN;i++){const o=i*6;let y=rainPos[o+1]-24*dt;if(y<cy-15)y+=40;const x=wrap(rainPos[o],cx),z=wrap(rainPos[o+2],cz);
    rainPos[o]=x;rainPos[o+1]=y;rainPos[o+2]=z;rainPos[o+3]=x+.05;rainPos[o+4]=y+.75;rainPos[o+5]=z+.03;}rainGeo.attributes.position.needsUpdate=true;}
  if(snow.visible){const t=ENV.t.value;for(let i=0;i<SNOW;i++){const o=i*3;let y=snowPos[o+1]-1.3*dt;if(y<cy-15)y+=40;snowPos[o]=wrap(snowPos[o]+Math.sin(t*.7+i)*dt*.5,cx);snowPos[o+1]=y;snowPos[o+2]=wrap(snowPos[o+2]+Math.cos(t*.6+i*1.3)*dt*.4,cz);}snowGeo.attributes.position.needsUpdate=true;}
}
function nextWeather(force){
  if(force){weather.kind={clear:'rain',rain:'snow',snow:'clear'}[weather.kind];weather.amt=weather.want=weather.kind==='clear'?0:1;}
  else if(weather.kind==='clear'){weather.kind=Math.random()<.65?'rain':'snow';weather.want=1;}
  else weather.want=0;
  weather.next=150+Math.random()*150;
  if(force)toast({clear:'Clear skies',rain:'Rain',snow:'Snow'}[weather.kind]);
}
function skipTime(){tod=(tod+3)%24;toast(clockText());}
const clockText=()=>{const m=Math.floor(tod*60)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
function paintSky(cols){const cv=scene.background.image,g=cv.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#'+cols[0].getHexString());gr.addColorStop(.55,'#'+cols[1].getHexString());gr.addColorStop(1,'#'+cols[2].getHexString());g.fillStyle=gr;g.fillRect(0,0,2,256);scene.background.needsUpdate=true;}
function updateEnv(dt){
  tod=(tod+dt/40)%24;ENV.t.value+=dt;
  if((weather.next-=dt)<=0)nextWeather();
  weather.amt=clamp(weather.amt+Math.sign(weather.want-weather.amt)*dt/20,0,1);
  if(weather.want===0&&weather.amt===0)weather.kind='clear';
  const w=weather.kind==='clear'?0:weather.amt,day=smooth(5,7.5,tod)*(1-smooth(18.5,21,tod)),dusk=1-Math.abs(2*day-1),night=1-day;
  ENV.night.value=night;ENV.wet.value=weather.kind==='rain'?w:0;ENV.snow.value=weather.kind==='snow'?w:0;
  for(let i=0;i<3;i++){_sk[i].copy(day>=.5?SKIES.day[i]:SKIES.night[i]).lerp(SKIES.dusk[i],day>=.5?2*(1-day):2*day);_c1.copy(SKIES.grey[i]).multiplyScalar(.15+.85*day);_sk[i].lerp(_c1,w*.8);}
  if((skyT-=dt)<=0||dt===0){skyT=.25;paintSky(_sk);}
  ENV.sky.value.copy(_sk[1]);scene.fog.color.copy(_sk[2]);scene.fog.far=1300-w*800-night*300;scene.fog.near=Math.min(260,scene.fog.far*.2);
  hemi.intensity=(.46+.36*day)*(1-.2*w);hemi.color.setHex(0xdde8f2).lerp(_c1.setHex(0x4a5a7e),night);hemi.groundColor.setHex(0x6d6a52).lerp(_c1.setHex(0x16150f),night);
  sun.intensity=Math.max(.22,.92*day*(1-.6*w));sun.color.setHex(0xfff1dc).lerp(_c1.setHex(0xffa366),dusk*.8).lerp(_c1.setHex(0x8fa8d8),night*night);
  const lit=smooth(.35,.75,night);
  beamM.opacity=lit*.5;poolM.opacity=lit*.42;haloM.opacity=lit;if(world&&world.lampMat)world.lampMat.emissive.setRGB(1,.85,.55).multiplyScalar(lit);
  if(lampPools){lampPools.visible=lampHalos.visible=lit>0;}
  if(world)for(const c of world.cars){const on=lit>0&&(c.ai||c.cop||c===player.car);if(on||c.g.userData.beam)carBeam(c).visible=on;}
  rain.visible=weather.kind==='rain'&&w>.01;snow.visible=weather.kind==='snow'&&w>.01;rain.material.opacity=w*.42;snow.material.opacity=w*.9;
  fall(dt);
  if(snd){if(!snd.rain){const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=1200;const g=AC.createGain();g.gain.value=0;const s=AC.createBufferSource();s.buffer=snd.buf;s.loop=true;s.connect(f);f.connect(g);g.connect(snd.master);s.start();snd.rain={f,g};}
    setG(snd.rain,(weather.kind==='rain'?w:0)*.09);}
  $('#clock').textContent=clockText()+(w>.3?' · '+(weather.kind==='rain'?'Rain':'Snow'):'');
}
// rivers and ponds: rippled normals catch the sun, and the sky shows at grazing angles
const waterMat=new THREE.MeshPhongMaterial({vertexColors:true,specular:0x8f9ba3,shininess:110});waterMat.userData.keep=true;
waterMat.onBeforeCompile=sh=>{
  sh.uniforms.uT=ENV.t;sh.uniforms.uSky=ENV.sky;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vW;').replace('#include <project_vertex>','#include <project_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uT;uniform vec3 uSky;varying vec2 vW;')
    .replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
    vec2 q=vW*1.1;
    float a=sin(q.x*1.7+uT*1.1)+sin(q.y*2.3-uT*.9)+.6*sin((q.x+q.y)*4.1+uT*2.)+.35*sin(q.x*9.3-q.y*7.1+uT*3.1);
    float b=cos(q.x*2.1-uT*1.3)+cos(q.y*1.6+uT*.7)+.6*cos((q.x-q.y)*3.7-uT*1.7)+.35*cos(q.y*8.7+q.x*6.3-uT*2.7);
    normal=normalize(normal+(viewMatrix*vec4(a*.035,0.,b*.035,0.)).xyz);`)
    .replace('#include <envmap_fragment>',`float fr=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),3.);
    outgoingLight=mix(outgoingLight,uSky*.9,.12+.62*fr);
    #include <envmap_fragment>`);
};

// ---------- car damage ----------
function hurtCar(c,v){
  if(c.dead)return;c.hp=Math.max(0,(c.hp??1)-v);
  if(c.hp<=0&&c===player.car){c.dead=true;c.speed*=.3;toast('Engine dead','Get out (E) and take another car.');notes([[220,.2],[165,.4]],'sawtooth',.12);}
}
let fumeT=0;
function fumes(dt){
  const c=player.mode==='car'&&player.car,hp=c?c.hp??1:1;
  $('#hpWrap').hidden=!c;if(c){$('#hp').style.width=(hp*100)+'%';$('#hp').style.background=hp>.55?'#5fbf7a':hp>.25?'#f2b705':'#ff3b30';}
  if(!c||hp>.55||REDUCED||(fumeT-=dt)>0)return;
  fumeT=hp>.25?.16:.06;const s=smoke[smokeI=(smokeI+1)%smoke.length],fx=Math.sin(c.h),fz=Math.cos(c.h);
  s.position.set(c.x+fx*1.7,GY(c.x,c.z)+1,c.z+fz*1.7);s.scale.setScalar(.7);s.material.color.setHex(hp>.25?0xb8b8b4:0x2a2a2a);s.material.opacity=.6;s.userData.life=1.1;s.visible=true;
}

// ---------- places: garages, landmarks, races ----------
const MARK_COL={garage:'#3b9cff',race:'#e040fb'};
LABEL_COL.garage=MARK_COL.garage;LABEL_COL.race=MARK_COL.race;
let garages=[],landmarks=[],races=[],race=null,saved=null,garageAway=true;
const ringOf=(col,r)=>{const m=new THREE.Mesh(new THREE.RingGeometry(r-.9,r,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.75,depthWrite:false}));return m;};
const tokenGeo=new THREE.OctahedronGeometry(.55);tokenGeo.userData.keep=true;
const tokenM=new THREE.MeshLambertMaterial({color:0xf2b705,emissive:0x5a4200});tokenM.userData.keep=true;
const cpRing=ringOf(0xe040fb,7),cpBeam=new THREE.Mesh(new THREE.CylinderGeometry(2,2,50,16,1,true),new THREE.MeshBasicMaterial({color:0xe040fb,transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide}));
scene.add(cpRing,cpBeam);cpRing.visible=cpBeam.visible=false;
function sign(text,kind,x,z,y){const sp=makeLabel(text,kind);sp.position.set(x,GY(x,z)+y,z);worldGroup.add(sp);return sp;}
function onRoad(x,z,maxCls,within){const n=nearestNode(x,z,maxCls);return n&&Math.hypot(n.x-x,n.z-z)<within?n:null;}
function buildMore(){
  race=null;saved=null;fare=null;cpRing.visible=cpBeam.visible=false;lightLamps();
  const L=world.labels||[];
  garages=[];
  for(const l of L.filter(l=>l.fuel)){const n=onRoad(l.x,l.z,2,90);if(!n||garages.some(g=>Math.hypot(g.x-n.x,g.z-n.z)<60))continue;
    const r=ringOf(0x3b9cff,6);r.position.set(n.x,GY(n.x,n.z)+.3,n.z);worldGroup.add(r);garages.push({x:n.x,z:n.z,name:shortName(l.text),ring:r,sp:sign('Garage','garage',n.x,n.z,5)});}
  // landmarks spread over the town, in a fixed order so saved finds still match after a reload
  landmarks=[];
  const RANK={church:0,civic:1,park:2};
  for(const l of L.filter(l=>!l.fuel).sort((a,b)=>(RANK[a.kind]??3)-(RANK[b.kind]??3)||(a.text<b.text?-1:1))){
    if(landmarks.length>=20)break;
    const n=onRoad(l.x,l.z,5,70);if(!n||landmarks.some(m=>Math.hypot(m.x-n.x,m.z-n.z)<150)||garages.some(g=>Math.hypot(g.x-n.x,g.z-n.z)<40))continue;
    const t=new THREE.Mesh(tokenGeo,tokenM);t.castShadow=true;t.position.set(n.x,GY(n.x,n.z)+1.4,n.z);worldGroup.add(t);
    landmarks.push({x:n.x,z:n.z,name:shortName(l.text),mesh:t,found:save.found.includes(l.text),key:l.text});
  }
  for(const m of landmarks)m.mesh.visible=!m.found;
  races=[];
  const G=world.graph,rnd=mulberry(7),starts=[...roadAdj.keys()].filter(k=>{const n=G.get(k);return n.cls<=1&&CENTRE&&Math.hypot(n.x-CENTRE[0],n.z-CENTRE[1])<1400;}).sort();
  for(let tries=0;tries<60&&races.length<3&&starts.length;tries++){
    const k=starts[Math.floor(rnd()*starts.length)],s=G.get(k);
    if(races.some(r=>Math.hypot(r.x-s.x,r.z-s.z)<400))continue;
    const cps=raceRoute(k,rnd);if(cps.length<6)continue;
    const name=(world.street(s.x,s.z)||'Town')+' sprint';
    if(races.some(r=>r.name===name))continue;
    const r=ringOf(0xe040fb,7);r.position.set(s.x,GY(s.x,s.z)+.3,s.z);worldGroup.add(r);
    races.push({x:s.x,z:s.z,name,cps,ring:r,sp:sign('Race · '+name,'race',s.x,s.z,5)});
  }
}
function raceRoute(start,rnd){
  const G=world.graph,seen=new Set([start]),cps=[];let k=start,prev=null,run=0;
  for(let i=0;i<400&&cps.length<8;i++){
    const opts=(roadAdj.get(k)||[]).filter(o=>G.get(o).cls<=1&&!seen.has(o));if(!opts.length)break;
    // prefer going straight on, so the route reads as a course rather than a maze
    const a=G.get(k),h0=prev?Math.atan2(a.x-G.get(prev).x,a.z-G.get(prev).z):null;
    opts.sort((p,q)=>h0==null?0:Math.abs(wrapA(Math.atan2(G.get(p).x-a.x,G.get(p).z-a.z)-h0))-Math.abs(wrapA(Math.atan2(G.get(q).x-a.x,G.get(q).z-a.z)-h0)));
    const o=rnd()<.7?opts[0]:opts[Math.floor(rnd()*opts.length)],b=G.get(o);
    run+=Math.hypot(b.x-a.x,b.z-a.z);seen.add(o);prev=k;k=o;
    if(run>=190){cps.push({x:b.x,z:b.z});run=0;}
  }
  return cps;
}
function showCp(){const p=race.cps[race.i];cpRing.position.set(p.x,GY(p.x,p.z)+.3,p.z);cpBeam.position.set(p.x,GY(p.x,p.z)+25,p.z);cpRing.visible=cpBeam.visible=true;}
function startRace(r){
  saved={mission,beam:beam.visible};mission=null;beam.visible=ring.visible=false;
  race={r,i:0,t:0,count:3.2,cps:r.cps};showCp();
  $('#mLbl').textContent='Race · get ready';$('#mTarget').textContent=r.name;
  toast('3','Race through '+r.cps.length+' checkpoints.');notes([[440,.15]],'square',.1);
}
function endRace(done){
  const r=race.r,t=race.t;race=null;cpRing.visible=cpBeam.visible=false;
  if(done){const best=save.races[r.name],first=best==null,rec=first||t<best;
    if(rec){save.races[r.name]=t;const pay=first?250:150;cash+=pay;money();store();}
    toast(rec?(first?'Finished ':'New record ')+t.toFixed(1)+' s':'Finished '+t.toFixed(1)+' s',rec?'+€'+(first?250:150):'Best '+best.toFixed(1)+' s');
    notes([[523,.1],[659,.1],[784,.1],[1047,.3]],'triangle',.14);
  }else toast('Race cancelled');
  mission=saved&&saved.mission;if(mission){beam.visible=ring.visible=saved.beam;$('#mLbl').textContent=mission.kind==='taxi'?(mission.stage==='pickup'?'Pick up a passenger':'Drive passenger to'):'Delivery to';$('#mTarget').textContent=mission.name;}else missionCool=1;
  saved=null;
}
function updateRace(dt,c){
  if(race.count>0){
    const before=Math.ceil(race.count);race.count-=dt;if(c)c.speed=0;
    if(race.count<=0){toast('Go!');notes([[880,.3]],'square',.12);$('#mLbl').textContent='Race · checkpoint 1/'+race.cps.length;}
    else if(Math.ceil(race.count)!==before){toast(String(Math.ceil(race.count)));notes([[440,.15]],'square',.1);}
    return;
  }
  race.t+=dt;const p=race.cps[race.i],d=Math.hypot(p.x-player.x,p.z-player.z);
  $('#mDist').textContent=Math.round(d)+' m';$('#mTime').textContent=race.t.toFixed(1)+' s';$('#mTime').classList.remove('low');
  if(d<11){race.i++;notes([[784,.08]],'triangle',.12);
    if(race.i>=race.cps.length)endRace(true);else{showCp();$('#mLbl').textContent='Race · checkpoint '+(race.i+1)+'/'+race.cps.length;}}
}

// ---------- taxi fares ----------
function startTaxi(){
  const G=world.graph,E=world.edges.filter(e=>e.cls<=1);
  for(let i=0;i<60;i++){
    const e=E[Math.floor(Math.random()*E.length)],A=G.get(e.a),B=G.get(e.b);if(!A||!B)continue;
    const mx=(A.x+B.x)/2,mz=(A.z+B.z)/2,d=Math.hypot(mx-player.x,mz-player.z);if(d<150||d>650)continue;
    const dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz);if(L<12)continue;
    const side=Math.random()<.5?1:-1,off=e.w/2+1.6,x=mx-dz/L*off*side,z=mz+dx/L*off*side;if(world.inBuilding(x,z))continue;
    fare={x,z,h:Math.atan2(-(x-mx),-(z-mz)),ph:0,look:randomLook(FARE_I)};
    mission={kind:'taxi',stage:'pickup',x,z,name:world.street(x,z)||'Pick-up',time:Math.round(d/8.5+30)};
    $('#mLbl').textContent='Pick up a passenger';$('#mTarget').textContent=mission.name;
    const gy=GY(x,z);beam.visible=ring.visible=true;beam.position.set(x,gy+23,z);ring.position.set(x,gy+.15,z);showBonus();
    return true;
  }
  return false;
}
function updatePickup(dt){
  mission.time-=dt;const d=Math.hypot(mission.x-player.x,mission.z-player.z);
  $('#mDist').textContent=Math.round(d)+' m';const mt=$('#mTime');mt.textContent=fmtTime(mission.time);mt.classList.toggle('low',mission.time<10);
  beam.material.opacity=.22+.12*Math.sin(performance.now()/300);
  if(d<8&&player.mode==='car'&&Math.abs(player.car.speed)<2.5){
    fare=null;newDelivery();if(!mission)return;mission.kind='taxi';mission.time+=8;cargo=1;showBonus();
    $('#mLbl').textContent='Drive passenger to';toast('Passenger in','“'+mission.name+', please.”');notes([[587,.08],[784,.12]],'triangle',.12);
  }else if(d<8&&player.mode==='foot'&&!mission.told){mission.told=true;toast('You need a car','Pull up next to the passenger.');}
  else if(mission.time<=0){toast('The passenger gave up',streak?'Streak lost.':'');streak=0;cargo=1;fare=null;mission=null;beam.visible=ring.visible=false;missionCool=2.5;showBonus();}
}
function newMission(){
  if(race)return;
  $('#mLbl').textContent='Delivery to';
  if(world&&Math.random()<.4&&startTaxi())return;
  fare=null;newDelivery();showBonus();
}

function updateMore(dt){
  const c=player.mode==='car'?player.car:null,slow=c&&Math.abs(c.speed)<3;
  fumes(dt);
  if(race)updateRace(dt,c);
  else for(const r of races)if(c&&slow&&Math.hypot(r.x-player.x,r.z-player.z)<7){startRace(r);break;}
  for(const r of races){r.ring.visible=r.sp.visible=!race&&Math.hypot(r.x-player.x,r.z-player.z)<500;}
  let near=null;for(const g of garages){const d=Math.hypot(g.x-player.x,g.z-player.z);g.sp.visible=g.ring.visible=d<500;if(d<7)near=g;}
  if(!near)garageAway=true;
  else if(c&&slow&&garageAway){garageAway=false;
    const cop=cops.reduce((m,o)=>Math.min(m,Math.hypot(o.x-player.x,o.z-player.z)),Infinity),hp=c.hp??1,cost=Math.round((1-hp)*180)+stars()*120;
    if(cop<70)toast('Too hot','Lose the police nearby first.');
    else if(!cost)toast(near.name+' garage','Nothing to fix.');
    else if(cash<cost)toast(near.name+' garage','Repair and respray cost €'+cost+'.');
    else{cash-=cost;money();c.hp=1;c.dead=false;heat=0;showWanted();while(cops.length)removeCop(cops[0]);
      const col=pick(CAR_COLORS);let m=carMats[col];if(!m){m=carMats[col]=new THREE.MeshPhongMaterial({color:col,specular:0x383838,shininess:60});m.userData.keep=true;}
      c.g.userData.body.children[0].material=m;store();toast('Repaired and resprayed','−€'+cost+(stars()?'':' · the police lost you'));notes([[392,.1],[523,.1],[659,.2]],'triangle',.13);}
  }
  for(const m of landmarks){if(m.found)continue;const d=Math.hypot(m.x-player.x,m.z-player.z);m.mesh.visible=d<180;if(!m.mesh.visible)continue;
    m.mesh.rotation.y+=dt*1.8;m.mesh.position.y=GY(m.x,m.z)+1.4+Math.sin(ENV.t.value*2)*.15;
    if(d<3.2){m.found=true;m.mesh.visible=false;save.found.push(m.key);const n=landmarks.filter(q=>q.found).length,all=n===landmarks.length;
      cash+=all?1000:75;money();store();toast(all?'Every landmark found':'Landmark '+n+' of '+landmarks.length,m.name+(all?' · +€1,000':' · +€75'));notes([[659,.08],[880,.08],[1319,.2]],'sine',.15);}}
  if(streak>save.best)store();
  if((saveT+=dt)>5){saveT=0;store();}
}
const MARKS=()=>[...garages.map(g=>[g.x,g.z,MARK_COL.garage]),...races.map(r=>[r.x,r.z,MARK_COL.race])];
