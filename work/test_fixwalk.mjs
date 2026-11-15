// pedestrians clear of buildings, cars and solids, and feet on the ground: node test_fixwalk.mjs page.html [secondsPerPlace=40]
// Positions are the ones drawn (poseAt's x,z), not p.x after the frame. Exits 1 on a failed check.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,secs='40']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,html=dir+'_fixwalk_'+process.pid+'.html';
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`{const pa=poseAt;window.__D=[];poseAt=function(i,look,x,z,...r){__D[i]=[x,z];return pa(i,look,x,z,...r);};}
window.__t={get world(){return world},get player(){return player},get peds(){return peds},get props(){return props},get walls(){return walls},get bus(){return bus},
get MH(){return MH},get KEY(){return KEY},THREE,PLAYER_I,PED_N,set tod(v){tod=v},GY:(x,z)=>GY(x,z),enterExit:()=>enterExit(),resetToRoad:()=>resetToRoad(),
parkedNear:(x,z)=>parkedNear(x,z),updateTraffic:d=>updateTraffic(d),updatePeople:d=>updatePeople(d),updateExtra:d=>updateExtra(d),walk:d=>walk(d),press:c=>press(c)};`;
fs.writeFileSync(html,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:800,height:500}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+html,{timeout:240000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:240000,polling:500});await p.waitForTimeout(1500);
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};

// walkers: five busy places, calm and then stirred up (every 1.5 s someone near the player flees or is knocked down)
const walk=await p.evaluate(secs=>{const T=__t,W=T.world,P=T.player;T.tod=13;{let s=12345;Math.random=()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;}
  const places=[['start',W.start[0],W.start[1]]];
  for(const re of[/maxima/i,/norfa/i,/autobus|stotis/i,/aikšt/i]){const L=W.labels.find(q=>re.test(q.text||''));if(L)places.push([L.text,L.x,L.z]);}
  if(P.mode==='car')T.enterExit();
  const R=.22,seg=(x,z,s)=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t);};
  const inBox=(q,o,hl,hw)=>{const fx=Math.sin(o.h),fz=Math.cos(o.h),dx=q.x-o.x,dz=q.z-o.z;return Math.abs(dx*fx+dz*fz)<hl&&Math.abs(dx*fz-dz*fx)<hw;};
  // capitals: the centre is inside (through it); lower case: the 0.22 m body overlaps it
  const what=q=>{
    if(W.inBuilding(q.x,q.z))return'BUILDING';if([[R,0],[-R,0],[0,R],[0,-R]].some(([u,v])=>W.inBuilding(q.x+u,q.z+v)))return'building';
    for(const c of W.cars)if(inBox(q,c,2.25+R,.9+R))return(inBox(q,c,2.1,.8)?'IN-':'')+(c===P.car?'playerCar':Math.abs(c.speed)>.5?'trafficMoving':'carStopped');
    for(const c of T.parkedNear(q.x,q.z))if(inBox(q,c,2.25+R,.9+R))return inBox(q,c,2.1,.8)?'IN-parked':'parked';
    if(T.bus&&inBox(q,T.bus,5.9+R,1.25+R))return'bus';
    const ci=Math.floor(q.x/8),cj=Math.floor(q.z/8);
    for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++){const k=i+','+j;
      for(const s of T.walls.get(k)||[]){const d=seg(q.x,q.z,s);if(d<R-.02)return d<.1?'WALL':'wall';}
      for(const o of T.props.get(k)||[])if(!o.down){const d=Math.hypot(q.x-o.x,q.z-o.z);if(d<(o.r||.2)+R-.02)return(d<(o.r||.2)?'IN-':'')+(o.tree?'tree':'prop');}}
    return null;};
  const modeOf=q=>q.mode+(q.lead?'+follow':'')+(q.mode==='goto'?':'+q.then:'');
  const out={};
  for(const stress of[0,1]){const tab={},ev={};let samples=0;const last=new Map();
    for(const [name,x,z] of places){P.x=x;P.z=z;T.resetToRoad();for(const q of T.peds){q.mode='hide';q.lead=null;q.grp=null;}
      for(let f=0,N=Math.round(secs*30);f<N;f++){
        if(stress&&f%45===0){const L=T.peds.filter(q=>q.mode!=='hide'&&Math.hypot(q.x-P.x,q.z-P.z)<60),q=L[Math.floor(Math.random()*L.length)];
          if(q){const a=Math.random()*6.283;q.lead=null;if(Math.random()<.5){q.mode='flee';q.timer=1+Math.random()*2;q.vx=Math.sin(a)*6;q.vz=Math.cos(a)*6;}
            else{q.mode='down';q.timer=3.2;const v=3+Math.random()*6;q.vx=Math.sin(a)*v;q.vz=Math.cos(a)*v;}}}
        T.updateTraffic(1/30);T.updatePeople(1/30);T.updateExtra(1/30);
        T.peds.forEach((q,i)=>{if(q.mode==='hide'||q.mode==='sit'||q.mode==='goto'&&q.then==='hide'){last.delete(q);return;}samples++;
          const w=what({x:__D[i][0],z:__D[i][1]});if(!w){last.delete(q);return;}
          const k=w+' | '+modeOf(q);tab[k]=(tab[k]||0)+1;if(last.get(q)!==w){last.set(q,w);ev[k]=(ev[k]||0)+1;}});}}
    const through=Object.entries(tab).filter(([k])=>/^(BUILDING|IN-|WALL)/.test(k)).reduce((s,[,v])=>s+v,0),touch=Object.values(tab).reduce((s,v)=>s+v,0)-through;
    out[stress?'stirred':'calm']={places:places.map(q=>q[0]),samples,through,touch,frames:tab,events:ev};}
  return out;},+secs);
for(const k in walk){const r=walk[k];check(`walkers ${k}: nobody drawn through a building, car or solid`,r.through===0,{samples:r.samples,through:r.through,frames:r.frames,events:r.events});
  check(`walkers ${k}: bodies touching under 0.05% of samples`,r.touch<=r.samples*5e-4,{touch:r.touch,samples:r.samples});}

// feet: lowest drawn vertex of the MakeHuman body against the ground at the person's own spot (body offset) and under that vertex
await p.waitForFunction(()=>__t.MH.ready&&__t.MH.on[__t.PLAYER_I],null,{timeout:240000,polling:500});
const feet=await p.evaluate(()=>{const T=__t,W=T.world,P=T.player,V=new T.THREE.Vector3(),G=(x,z)=>T.GY(x,z)+W.surf(x,z);
  const low=(e,x,z)=>{let y=1e9,d=1e9;e.o.updateMatrixWorld(true);e.o.traverse(m=>{if(!m.isSkinnedMesh||!m.visible)return;const n=m.geometry.attributes.position.count;
      for(let i=0;i<n;i+=2){m.getVertexPosition(i,V).applyMatrix4(m.matrixWorld);y=Math.min(y,V.y);d=Math.min(d,V.y-G(V.x,V.z));}});return{body:y-G(x,z),under:d};};
  const step=(n,keys={})=>{for(const k of['KeyW','ShiftLeft','Space'])T.KEY[k]=!!keys[k];for(let i=0;i<n;i++){T.walk(1/60);T.updatePeople(1/60);}};
  const st=[P.x,P.z,P.h];let slope=null,kerb=null;
  for(const e of W.edges){if(e.cls>1)continue;const A=W.graph.get(e.a),B=W.graph.get(e.b);if(!A||!B||Math.hypot(A.x-st[0],A.z-st[1])>400)continue;
    const L=Math.hypot(B.x-A.x,B.z-A.z),h=Math.atan2(B.x-A.x,B.z-A.z);
    for(let t=.2;t<.9;t+=.2){const x=A.x+(B.x-A.x)*t,z=A.z+(B.z-A.z)*t,g=Math.hypot(T.GY(x+1,z)-T.GY(x-1,z),T.GY(x,z+1)-T.GY(x,z-1))/2;if(!slope||g>slope.g)slope={x,z,g,h};
      const px=x-(B.z-A.z)/L*(e.w/2+1),pz=z+(B.x-A.x)/L*(e.w/2+1);if(!kerb&&W.surf(px,pz)>.05&&!W.inBuilding(px,pz))kerb={x:px,z:pz,h};}}
  const r=(a,k)=>+Math.min(...a.map(q=>q[k])).toFixed(3),R=(a,k)=>+Math.max(...a.map(q=>q[k])).toFixed(3),out={};
  for(const [k,q] of Object.entries({flat:{x:st[0],z:st[1],h:st[2]},slope,kerb}))for(const [state,keys] of[['stand',{}],['walk',{KeyW:1}],['run',{KeyW:1,ShiftLeft:1}]]){
    P.x=q.x;P.z=q.z;P.h=q.h;step(30);const a=[];for(let f=0;f<40;f++){step(1,keys);if(state!=='stand'){P.x=q.x;P.z=q.z;}a.push(low(T.MH.on[T.PLAYER_I],P.x,P.z));}
    out[`player ${k} ${state}`]={body:[r(a,'body'),R(a,'body')],under:r(a,'under'),grade:q.g&&+q.g.toFixed(3)};}
  P.x=st[0];P.z=st[1];step(30);T.press('Space');const a=[];for(let f=0;f<50;f++){step(1);a.push(low(T.MH.on[T.PLAYER_I],P.x,P.z));}
  out['player flat jump']={body:[r(a,'body'),R(a,'body')],under:r(a,'under'),landed:+a[a.length-1].body.toFixed(3)};
  const pd={};for(let f=0;f<600;f++){step(1);if(f%10)continue;
    T.MH.on.forEach((e,i)=>{if(!e||i>=T.PED_N)return;const q=T.peds[i];if(q.mode==='hide'||q.mode==='sit'||q.mode==='down')return;(pd[q.mode]||(pd[q.mode]=[])).push(low(e,q.x,q.z));});}
  for(const k in pd){const a=pd[k].map(q=>q.body).sort((x,y)=>x-y);out['townsfolk '+k]={n:a.length,body:[+a[0].toFixed(3),+a[a.length-1].toFixed(3)],median:+a[a.length>>1].toFixed(3),under:r(pd[k],'under')};}
  return out;});
// body: lowest vertex minus the ground at the person's spot (the sole should stand on it, |body min| <= 3 cm when a foot is down);
// under: lowest vertex minus the ground right under it (also counts the terrain's own slope across a stance)
for(const [k,v] of Object.entries(feet)){const lo=v.body[0];check('feet '+k,lo>=-.03&&lo<=.03,v);}
check('no page errors',errs.length===0,errs.slice(0,5));
await b.close();fs.unlinkSync(html);
if(fails){console.log(fails+' failed');process.exit(1);}
console.log('all passed');
