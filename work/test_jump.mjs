// jump checks: node test_jump.mjs page.html [shotsDir]   (page = build.sh + add_jump.py)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_jump']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get fight(){return fight},get cmb(){return cmb},get CHAR(){return CHAR},get JUMP(){return JUMP},get drv(){return drv},
get tod(){return tod},set tod(v){tod=v},get GY(){return GY},get PLAYER_I(){return PLAYER_I},press,enterExit,updatePeople,resetToRoad,renderer,scene,camera,startMove,startDodge,jumpTop,jumpCollide,desiredCam,walk,driveCar,
get props(){return props},get walls(){return walls},
steps(n,dt=.016,each){for(let i=0;i<n;i++){if(player.mode==='car')driveCar(player.car,dt);else walk(dt);updatePeople(dt);if(each)each(i);}},
hideAll(){for(const q of peds){q.mode='hide';q.lead=null;}},
key(type,code){dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));},
keys(on,...c){for(const k of c)this.key(on?'keydown':'keyup',k);},
reset(){cmb.mv=cmb.dodge=cmb.lunge=cmb.pk=cmb.tok=null;cmb.stam=100;cmb.hs=0;cmb.blk=0;player.hp=5;fight.pDown=0;fight.pStag=0;Object.assign(JUMP,{air:false,pre:0,land:0,y:0,vy:0});for(const k of['KeyW','ShiftLeft','Space','KeyA','KeyD','KeyB'])this.key('keyup',k);},
// the whole jump from a press: apex, air time, ground covered, every position finite
jump(){const P=player,J=JUMP,x0=P.x,z0=P.z;this.key('keydown','Space');this.key('keyup','Space');let top=0,air=0,n=0,ok=true,launched=false;
  for(;n<120;n++){this.steps(1);ok=ok&&isFinite(P.x)&&isFinite(P.z)&&isFinite(J.y);top=Math.max(top,J.feet);if(J.air){air+=.016;launched=true;}else if(launched)break;}
  return{top:+top.toFixed(3),air:+air.toFixed(3),dist:+Math.hypot(P.x-x0,P.z-z0).toFixed(2),landed:!J.air&&J.y===0,finite:ok};},
side(){const P=player,y=GY(P.x,P.z),f=P.h,rx=Math.cos(f),rz=-Math.sin(f);return[[P.x+rx*5.5+Math.sin(f)*1.2,y+1.1,P.z+rz*5.5+Math.cos(f)*1.2],[P.x+Math.sin(f)*1.2,y+.8,P.z+Math.cos(f)*1.2]];},
chase(){const v=new camera.position.constructor();desiredCam(v);return[[v.x,v.y,v.z],[player.x,GY(player.x,player.z)+1.3,player.z]];},
shot([from,to]){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/jpeg',.85);}};`;
fs.writeFileSync(dir+'_jump.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_jump.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length&&__t.CHAR.ready,null,{timeout:180000,polling:500});await p.waitForTimeout(1500);
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};
const shot=async(name,fn)=>{const s=await p.evaluate(fn);fs.writeFileSync(`${dir}${out}/${name}.jpg`,Buffer.from(s.split(',')[1],'base64'));};

// the low obstacle: the planter nearest the start (Vilniaus g.); the approach line is the first heading where walking in stops at it and the far side is open
await check('setup',()=>{const T=__t,W=T.world;T.tod=13;T.reset();
  let pl=null,bd=1e9;for(const l of T.props.values())for(const q of l){const t=T.jumpTop(q),d=Math.hypot(q.x-W.start[0],q.z-W.start[1]);if(t<.6&&q.r>=.5&&d<bd){bd=d;pl=q;}}
  if(!pl)return{ok:false,why:'no planter'};
  let H=null;for(let k=0;k<16&&H==null;k++){const a=k*Math.PI/8,fx=Math.sin(a),fz=Math.cos(a);let ok=true;
    for(let s=-4;s<=3.5&&ok;s+=.25){if(Math.abs(s)<pl.r+.45)continue;const x=pl.x+fx*s,z=pl.z+fz*s,r=T.jumpCollide(x,z,.42,0);ok=Math.hypot(r.x-x,r.z-z)<1e-6&&!W.inBuilding(x,z);}
    if(ok)H=a;}
  if(H==null)return{ok:false,why:'no clear line'};
  window.PL={x:pl.x,z:pl.z,r:pl.r,top:T.jumpTop(pl),h:H,street:W.street(pl.x,pl.z)};
  if(T.player.mode==='car'){const c=T.player.car;window.MYCAR=c;c.speed=0;T.enterExit();}
  T.hideAll();T.steps(2);return{ok:T.player.mode==='foot',planter:window.PL,distFromStart:+bd.toFixed(1)};});

const place=`const T=__t,P=T.player,L=window.PL;const at=(s,h=L.h)=>{T.reset();P.x=L.x-Math.sin(h)*s;P.z=L.z-Math.cos(h)*s;P.h=h;T.steps(1);};`;
await check('standingArc',new Function(place+`at(6,L.h+Math.PI);T.steps(20);const r=T.jump();return{ok:r.landed&&r.finite&&r.top>.58&&r.top<.68&&r.air>.28&&r.air<.4&&r.dist<.05,...r};`));
await check('runningArc',new Function(place+`at(6,L.h+Math.PI);P.h+=Math.PI;T.keys(1,'ShiftLeft','KeyW');T.steps(1);const r=T.jump();T.keys(0,'ShiftLeft','KeyW');
  at(6,L.h+Math.PI);P.h+=Math.PI;T.keys(1,'KeyW');T.steps(1);const w=T.jump();T.keys(0,'KeyW');
  return{ok:r.landed&&r.finite&&r.top>=.9&&r.top<=1.0&&r.air>.42&&r.air<.5&&r.dist>2.8&&w.dist>1&&w.dist<r.dist&&w.top<r.top,run:r,walk:w};`));
await check('noDoubleJump',new Function(place+`at(6,L.h+Math.PI);T.key('keydown','Space');T.key('keyup','Space');let ups=0,was=false,second=null;
  for(let i=0;i<60;i++){T.steps(1);if(T.JUMP.air&&!was)ups++;was=T.JUMP.air;if(i===12){T.key('keydown','Space');T.key('keyup','Space');second=T.JUMP.pre;}}
  return{ok:ups===1&&second===0,takeOffs:ups,preAfterSecondPress:second};`));
await check('blockedStates',new Function(place+`const res={};const tryJ=(n,set)=>{at(6,L.h+Math.PI);set();T.key('keydown','Space');T.key('keyup','Space');T.steps(8);res[n]=T.JUMP.air||T.JUMP.pre>0||T.JUMP.y>0;T.reset();T.steps(40);};
  tryJ('down',()=>{T.fight.pDown=2;});tryJ('stagger',()=>{T.fight.pStag=.5;});tryJ('attack',()=>{T.startMove('jab');});tryJ('kick',()=>{T.startMove('kick');});
  tryJ('block',()=>{T.cmb.blk=1;});tryJ('dodge',()=>{T.startDodge(1);});
  tryJ('getup',()=>{const st=T.CHAR.list[T.PLAYER_I];st.one='getup';st.oneT=0;});
  return{ok:Object.values(res).every(v=>!v),jumped:res};`));
await check('carNoJumpHandbrake',()=>{const T=__t,P=T.player;T.reset();const c=window.MYCAR;P.x=c.x+Math.cos(c.h)*2.2;P.z=c.z-Math.sin(c.h)*2.2;T.enterExit();T.steps(2);
  if(P.mode!=='car')return{ok:false,why:'no car',mode:P.mode};const car=P.car;car.speed=12;T.key('keydown','Space');T.steps(10);const brake=T.drv.brake,v=car.speed,air=T.JUMP.air||T.JUMP.pre>0;
  T.key('keyup','Space');car.speed=0;T.steps(2);T.enterExit();T.steps(2);
  return{ok:!air&&brake&&v<12,jumpInCar:air,brakeLamp:brake,speedAfter:+v.toFixed(2),backOnFoot:P.mode==='foot'};});
await check('lowObstacleWalkBlocks',new Function(place+`at(3.2);T.keys(1,'ShiftLeft','KeyW');let minD=1e9;T.steps(90,.016,()=>{minD=Math.min(minD,Math.hypot(P.x-L.x,P.z-L.z));});T.keys(0,'ShiftLeft','KeyW');
  const along=(P.x-L.x)*Math.sin(L.h)+(P.z-L.z)*Math.cos(L.h);
  return{ok:minD>=L.r+.42-.02&&along<0,closest:+minD.toFixed(3),needed:L.r+.42,along:+along.toFixed(2),planter:L};`));
await check('lowObstacleJumpClears',new Function(place+`at(2.6);T.keys(1,'ShiftLeft','KeyW');T.steps(1);const r=T.jump();T.keys(0,'ShiftLeft','KeyW');T.steps(10);
  const along=(P.x-L.x)*Math.sin(L.h)+(P.z-L.z)*Math.cos(L.h),d=Math.hypot(P.x-L.x,P.z-L.z);
  return{ok:along>L.r&&d>=L.r+.42-.02&&r.finite,...r,landedPastCentre:+along.toFixed(2),distFromCentre:+d.toFixed(2)};`));
// real walls: the nearest building edge and the nearest fence over 1.4 m, each run at square on and jumped at the apex
await check('buildingAndTallFenceBlockMidJump',()=>{const T=__t,P=T.player,W=T.world,L=window.PL,res={};
  const run=(cx,cz,nx,nz,name,inside)=>{T.reset();P.x=cx+nx*2.6;P.z=cz+nz*2.6;P.h=Math.atan2(-nx,-nz);T.steps(1);T.keys(1,'ShiftLeft','KeyW');T.steps(1);let bad=false,top=0;
    T.key('keydown','Space');T.key('keyup','Space');T.steps(70,.016,()=>{top=Math.max(top,T.JUMP.feet);if(inside())bad=true;});T.keys(0,'ShiftLeft','KeyW');res[name]={crossed:bad,apex:+top.toFixed(2),pos:[+(P.x-cx).toFixed(2),+(P.z-cz).toFixed(2)]};};
  let fence=null,fd=1e9;for(const l of T.walls.values())for(const s of l){const t=T.jumpTop(s);if(t>=1.4&&t<3&&Math.hypot(s[2]-s[0],s[3]-s[1])>2){const d=Math.hypot((s[0]+s[2])/2-L.x,(s[1]+s[3])/2-L.z);if(d<fd){fd=d;fence=s;}}}
  if(!fence)return{ok:false,why:'no fence'};
  {const s=fence,mx=(s[0]+s[2])/2,mz=(s[1]+s[3])/2,l=Math.hypot(s[2]-s[0],s[3]-s[1]);let nx=-(s[3]-s[1])/l,nz=(s[2]-s[0])/l;
    if(W.inBuilding(mx+nx*2.6,mz+nz*2.6)){nx=-nx;nz=-nz;}
    run(mx,mz,nx,nz,'fence',()=>(P.x-mx)*nx+(P.z-mz)*nz<0);res.fence.top=T.jumpTop(fence);res.fence.street=W.street(mx,mz);}
  let bx=null;for(let r=3;r<200&&!bx;r+=1)for(let a=0;a<32&&!bx;a++){const x=L.x+Math.sin(a*.196)*r,z=L.z+Math.cos(a*.196)*r;if(W.inBuilding(x,z)){
    const dx=Math.sin(a*.196),dz=Math.cos(a*.196);let s=r;while(W.inBuilding(L.x+dx*s,L.z+dz*s))s-=.05;bx=[L.x+dx*s,L.z+dz*s,-dx,-dz];}}
  run(bx[0],bx[1],bx[2],bx[3],'building',()=>!!W.inBuilding(P.x,P.z));
  return{ok:!res.fence.crossed&&!res.building.crossed&&res.fence.apex>.85&&res.building.apex>.85,...res};});
await check('landInsideWidePushedOut',new Function(place+`const out=[];for(const off of[.15,-.2,.45]){at(-off);Object.assign(T.JUMP,{air:true,y:.15,vy:-2,sp:0});T.steps(30);
  const d=Math.hypot(P.x-L.x,P.z-L.z),along=(P.x-L.x)*Math.sin(L.h)+(P.z-L.z)*Math.cos(L.h);out.push({off,d:+d.toFixed(3),sameSide:Math.sign(along)===Math.sign(off),finite:isFinite(P.x)&&isFinite(P.z)});}
  return{ok:out.every(o=>o.d>=L.r+.42-.02&&o.sameSide&&o.finite)&&!T.JUMP.air,out};`));
await check('cameraIgnoresHop',new Function(place+`at(6,L.h+Math.PI);T.steps(5);const a=T.chase()[0];T.key('keydown','Space');T.key('keyup','Space');T.steps(15);const b=T.chase()[0];
  return{ok:T.JUMP.air&&Math.abs(a[1]-b[1])<1e-6,midAir:T.JUMP.y.toFixed(2),camY:[a[1],b[1]]};`));
await check('mannequinTucks',new Function(place+`at(6,L.h+Math.PI);T.steps(10);const st=T.CHAR.list[T.PLAYER_I],th=st.bone.thigh_r,v=st.o.position.clone(),f=new v.constructor(),hip=new v.constructor();
  st.o.updateMatrixWorld(true);st.bone.foot_r.getWorldPosition(f);st.bone.pelvis.getWorldPosition(hip);const leg0=hip.y-f.y,y0=st.o.position.y;
  T.key('keydown','Space');T.key('keyup','Space');T.steps(14);st.bone.foot_r.getWorldPosition(f);st.bone.pelvis.getWorldPosition(hip);const leg1=hip.y-f.y,lift=st.o.position.y-y0;T.steps(40);
  return{ok:st.o.visible&&leg1<leg0-.25&&lift>.2,legStanding:+leg0.toFixed(2),legTucked:+leg1.toFixed(2),lift:+lift.toFixed(2)};`));

// pictures: side view and chase view at take-off, apex and landing of a running jump; the planter cleared
const phase=(s,n,view)=>`(()=>{${place}at(9,L.h+Math.PI);P.h+=Math.PI;T.keys(1,'ShiftLeft','KeyW');T.steps(10);T.key('keydown','Space');T.key('keyup','Space');T.steps(${n});T.keys(0,'ShiftLeft','KeyW');const v=T.${view}();return T.shot(v);})()`;
for(const [n,k] of [['takeoff',4],['apex',19],['landing',35]]){await shot('side_'+n,phase(0,k,'side'));await shot('chase_'+n,phase(0,k,'chase'));}
await shot('planter_clear',`(()=>{${place}at(2.6);T.keys(1,'ShiftLeft','KeyW');T.steps(1);T.key('keydown','Space');T.key('keyup','Space');T.steps(24);T.keys(0,'ShiftLeft','KeyW');
  const h=L.h,rx=Math.cos(h),rz=-Math.sin(h),y=T.GY(L.x,L.z);return T.shot([[L.x+rx*5,y+1.5,L.z+rz*5],[L.x,y+.8,L.z]]);})()`);
await p.evaluate(()=>__t.reset());
console.log('errors',JSON.stringify(errs.slice(0,6)));
await b.close();
if(errs.length)fails.push('errors');
if(fails.length){console.log('FAIL',fails.join(' '));process.exit(1);}
console.log('PASS');
