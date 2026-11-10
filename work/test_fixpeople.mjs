// faces, region colours, gear fit and the car-hit tumble on the mannequins: node test_fixpeople.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_fixpeople']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get CHAR(){return CHAR},get PARTS(){return PARTS},THREE,randomLook,dress,
set tod(v){tod=v},get GY(){return GY},enterExit,updatePeople,resetToRoad,renderer,scene,camera,pedMesh,PED_N,
steps(n,dt=.033,each){for(let i=0;i<n;i++){updatePeople(dt);if(each)each(i);}},
hideAll(keep){for(const q of peds)if(!keep.includes(q)){q.mode='hide';q.lead=null;}},
put(q,d,side=0){Object.assign(q,{mode:'idle',timer:999,lead:null,pair:null,grp:null,seat:null,react:0,nerv:0,hp:null,ko:0,fall:0,hop:0,gait:0,dest:null,seen:1e9,pr:.9});
  const f=player.h,rx=Math.cos(f),rz=-Math.sin(f);q.x=player.x+Math.sin(f)*d+rx*side;q.z=player.z+Math.cos(f)*d+rz*side;q.h=f+Math.PI;return q;}};`;
fs.writeFileSync(dir+'_fixpeople.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:800,height:500}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_fixpeople.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};

await check('setup',()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;window.__car=c;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;T.enterExit();return{ok:T.player.mode==='foot'};});
await p.waitForFunction(()=>__t.CHAR.ready,null,{timeout:60000});
await p.waitForTimeout(300);

await p.evaluate(()=>{window.COLS={shirt:0x3366cc,skin:0xe2b493,hair:0x3a2c20,legs:0x445566,shoe:0x111111};
window.ALL={hat:1,pack:1,bag:1,scarf:1,coat:1,skirt:1,long:1,tail:1,stick:1};
window.sceneFor=(T,k)=>{const P=T.peds,set=P.slice(0,12);T.hideAll(set);
  set.forEach((q,n)=>{const m=n%2===0;q.look=Object.assign(T.randomLook(n,n%4===3?'old':n%5===4?'kid':undefined),{male:m,age:n%4===3?'old':n%5===4?'kid':'adult'},k==='gear'?ALL:{hat:0,cap:0,pack:0,bag:0,scarf:0,coat:0,skirt:0,long:0,tail:0,stick:0});
    T.dress(n,COLS);T.put(q,3+n*1.2,(n%3-1)*2);if(q.look.age==='kid')q.guard=P[n+1];});
  T.camera.position.set(T.player.x,T.GY(T.player.x,T.player.z)+3,T.player.z);T.steps(4);return set;};

});
await check('faceOnEveryMannequin',()=>{const T=__t,set=sceneFor(T,'plain');let n=0,bad=[];
  for(let i=0;i<set.length;i++){const st=T.CHAR.list[i];if(!st||!st.o.visible)continue;n++;const f=st.face,H=st.bone.Head;
    if(!f||f.parent!==H||!f.visible){bad.push(i+':noface');continue;}
    st.o.updateMatrixWorld(true);const q=H.getWorldQuaternion(new T.THREE.Quaternion()),fd=new T.THREE.Vector3(0,0,1).applyQuaternion(q),ry=st.o.rotation.y,bf=new T.THREE.Vector3(Math.sin(ry),0,Math.cos(ry));
    const d=fd.dot(bf);if(d<.85)bad.push(i+':dir'+d.toFixed(2));}
  return{ok:n>=10&&!bad.length,mannequins:n,bad};});
await check('regionColours',()=>{const T=__t,r={};
  for(const k of['m','f']){let mesh;T.CHAR.body[k].scene.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});const g=mesh.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bn=mesh.skeleton.bones,rg=g.attributes.region;
    const by={};for(let i=0;i<si.count;i++){let b=0,w=-1;for(let j=0;j<4;j++)if(sw.getComponent(i,j)>w){w=sw.getComponent(i,j);b=si.getComponent(i,j);}
      const n=bn[b].name.replace(/_[lr]$/,'').replace(/_\d+/,'');(by[n]||(by[n]={}))[rg.getX(i)]=(by[n][rg.getX(i)]||0)+1;}
    const only=(pre,reg)=>{let tot=0,hit=0;for(const n in by)if(n.startsWith(pre))for(const q in by[n]){tot+=by[n][q];if(+q===reg)hit+=by[n][q];}return tot?hit/tot:0;};
    r[k]={hand:only('hand',0),finger:only('index',0),neck:only('neck',0),spine:only('spine',1),thigh:only('thigh',3),calf:only('calf',4),foot:only('foot',5),upperArmShirtOrSleeve:only('upperarm',1)+only('upperarm',2)};}
  const st=T.CHAR.list.find(s=>s&&s.o.visible),hex=c=>c.getHex();
  const rc=st?{skin:hex(st.rc[0]),shirt:hex(st.rc[1]),legs:hex(st.rc[3]),shoe:hex(st.rc[5])}:null;
  const ok=['m','f'].every(k=>r[k].hand===1&&r[k].finger===1&&r[k].neck===1&&r[k].spine===1&&r[k].thigh===1&&r[k].calf===1&&r[k].foot===1&&r[k].upperArmShirtOrSleeve===1)&&rc&&rc.skin===COLS.skin&&rc.shirt===COLS.shirt&&rc.legs===COLS.legs&&rc.shoe===COLS.shoe;
  return{ok,r,rc};},);
await check('gearNearItsBone',()=>{const T=__t,set=sceneFor(T,'gear'),worst=[],tot={};let n=0;
  const SRC=T.CHAR.SRC,v=new T.THREE.Vector3(),m=new T.THREE.Matrix4();
  for(let i=0;i<set.length;i++){const st=T.CHAR.list[i];if(!st||!st.o.visible)continue;n++;
    for(const k of T.CHAR.G){const opt=T.PARTS[k].opt,g=T.PARTS[k].g;if(!st.look[opt])continue;g.computeBoundingBox();g.boundingBox.getCenter(v);
      // a walking stick hangs from the hand: its grip end is what has to sit at the bone
      if(opt==='stick')v.y=g.boundingBox.max.y;
      pedMesh_get(T,k,i,m);v.applyMatrix4(m);const bp=st.bone[SRC[opt]].getWorldPosition(new T.THREE.Vector3()),d=v.distanceTo(bp);
      // the bone's own world scale (look.s, mannequin fit, kid head) is divided out
      const dm=d/st.bone[SRC[opt]].getWorldScale(new T.THREE.Vector3()).x;(tot[opt]=Math.max(tot[opt]||0,dm));if(dm>.25)worst.push(opt+':'+dm.toFixed(2));}}
  function pedMesh_get(T,k,i,m){T.pedMesh[k].getMatrixAt(i,m);}
  return{ok:n>=8&&!worst.length,mannequins:n,maxDist:Object.fromEntries(Object.entries(tot).map(([k,v])=>[k,+v.toFixed(3)])),worst};});
await check('carHitTumble',()=>{const T=__t,c=window.__car;T.hideAll([]);T.player.x=c.x+1.2;T.player.z=c.z+1.2;T.player.car=c;T.enterExit();
  if(T.player.mode!=='car')return{ok:false,mode:T.player.mode};
  const q=T.peds[1],i=1,fx=Math.sin(c.h),fz=Math.cos(c.h),e=T.world.edges.find(z=>z.cls<=1);q.look=T.randomLook(1);q.look.age='adult';T.hideAll([q]);
  // a walker can still dodge: retry until the car actually hits
  for(let a=0;a<8&&q.mode!=='down';a++){Object.assign(q,{mode:'walk',e,t:.5,side:1,dir:1,lead:null,timer:999,x:c.x+fx*1.2,z:c.z+fz*1.2,h:c.h+Math.PI,vx:0,vz:0,dnH:undefined});
    c.speed=14;T.camera.position.set(c.x,T.GY(c.x,c.z)+3,c.z);T.updatePeople(.033);}
  if(q.mode!=='down')return{ok:false,err:'never hit'};
  const st=()=>T.CHAR.list[i],seq=[],modes=[];let maxPitch=0,maxPitch04=0,worstDy=0;const up=new T.THREE.Vector3(),pq=new T.THREE.Quaternion();
  for(let f=0;f<260;f++){c.speed=0;T.updatePeople(.033);const s=st();if(s&&s.o.visible){
      up.set(0,1,0).applyQuaternion(s.bone.pelvis.getWorldQuaternion(pq));const pitch=Math.acos(Math.max(-1,Math.min(1,up.y)))*180/Math.PI;
      if(f*.033<=.4)maxPitch04=Math.max(maxPitch04,pitch);maxPitch=Math.max(maxPitch,pitch);
      if(q.mode==='down')worstDy=Math.max(worstDy,Math.abs(s.o.position.y-(T.GY(q.x,q.z)+T.world.surf(q.x,q.z))));
      if(seq[seq.length-1]!==s.clip)seq.push(s.clip);}
    if(modes[modes.length-1]!==q.mode)modes.push(q.mode);}
  const id=seq.indexOf('death'),ig=seq.indexOf('getup'),iw=seq.findIndex((s,k)=>k>ig&&(s==='walk'||s==='jog'));
  return{ok:maxPitch04>60&&worstDy<.1&&id>=0&&ig>id&&iw>ig&&modes[0]==='down'&&/walk|flee/.test(modes[modes.length-1]),pitchWithin04s:+maxPitch04.toFixed(0),maxPitch:+maxPitch.toFixed(0),rootDyFromGround:+worstDy.toFixed(3),clips:seq,modes};});
await check('drawCalls',()=>{const T=__t;T.renderer.info.autoReset=true;T.renderer.render(T.scene,T.camera);return{ok:true,calls:T.renderer.info.render.calls,glb:T.CHAR.n};});
console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('consoleErrors');
console.log(fails.length?'FAIL '+fails.join(' '):'PASS');await b.close();process.exit(fails.length?1:0);
