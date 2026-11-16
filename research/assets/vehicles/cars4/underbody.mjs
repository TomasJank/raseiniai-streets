// Underside review shots: node underbody.mjs page.html outdir
// Every cars4 model with wheels (traffic, police, route bus), lying on its roof seen from behind and from the side (close-up
// version, and the distant one through a long lens from 60 m), and right way up from the low chase camera, the chase camera
// with the car pitched nose up on a crest, and the on-foot camera beside it. Writes outdir/{key}_{view}.jpg.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const [file,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const o='function drawMini(){';let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__s={get world(){return world},get player(){return player},get CARS4(){return CARS4},set paused(v){mapOpen=v},makeCarMesh:(...a)=>makeCarMesh(...a),busMesh:()=>busMesh(),syncCar,resetToRoad,worldGroup,renderer,scene,camera,get GY(){return GY}};`;
const tmp=out+'/_page.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:640,height:400}});p.on('pageerror',e=>console.log('page error',e.message));
await p.goto('file://'+tmp,{timeout:240000});
await p.waitForFunction(()=>window.__s&&__s.world&&__s.world.cars.length&&__s.CARS4.hi,null,{timeout:240000});await p.waitForTimeout(2000);
const keys=await p.evaluate(()=>{const T=__s,c=T.player.car;T.paused=true;T.resetToRoad();c.speed=0;T.syncCar(c);c.g.scale.setScalar(1e-4);
  return[...Object.keys(T.CARS4.models),...(T.CARS4.police?[T.CARS4.police.key]:[]),...(T.CARS4.bus?['bus']:[])];});
for(const key of keys){
  const shots=await p.evaluate(key=>{const T=__s,c=T.player.car,C=T.CARS4,bus=key==='bus',F=bus?C.bus:C.police&&C.police.key===key?C.police:C.models[key];
    const g=bus?T.busMesh():T.makeCarMesh(0x8a9099,F);T.worldGroup.add(g);
    if(!bus){const q={g,x:c.x,z:c.z,h:c.h,speed:0,steer:0,wx:c.x,wz:c.z,spin:0};T.syncCar(q);}
    const y=T.GY(c.x,c.z),s=Math.sin(c.h),k=Math.cos(c.h),L=F.len/4.5,P=(a,b,u)=>[c.x+s*a+k*b,y+u,c.z+k*a-s*b],cam=T.camera,fov=cam.fov,res={};
    g.rotation.order='YXZ';
    const pose=(roll,pitch,lift)=>{g.position.set(c.x,y+lift,c.z);g.rotation.set(pitch,c.h,roll);g.updateMatrixWorld(true);};
    const shot=(name,from,to,far)=>{const hid=far?T.worldGroup.children.filter(o=>o!==g&&o.visible):[];for(const o of hid)o.visible=false;
      cam.fov=far?36*5.5/60:36;cam.updateProjectionMatrix();cam.position.set(...from);cam.lookAt(...to);cam.updateMatrixWorld();
      const f=T.scene.fog;T.scene.fog=null;T.renderer.render(T.scene,cam);T.renderer.render(T.scene,cam);T.scene.fog=f;res[name]=T.renderer.domElement.toDataURL('image/jpeg',.88);
      for(const o of hid)o.visible=true;};
    const H=F.M.dims[2];pose(Math.PI,0,H);
    const R=[-4.6*L,1.7*L,2.2*L+.4];shot('flipRear',P(...R),P(-.4*L,0,.6));shot('flipSide',P(-.4*L,5.6*L,1.6*L),P(0,0,.6));
    const k60=60/Math.hypot(R[0],R[1],R[2]-.6);shot('flipRearFar',P(R[0]*k60,R[1]*k60,.6+(R[2]-.6)*k60),P(-.4*L,0,.6),true);
    pose(0,0,0);shot('chaseLow',P(-5.5*L,0,.75),P(2,0,.55));shot('foot',P(.3*L,3.2*L,1.65),P(0,0,.4));
    pose(0,-.16,0);shot('crest',P(-5.5*L,.4,.6),P(2,0,.7));
    cam.fov=fov;cam.updateProjectionMatrix();T.worldGroup.remove(g);return res;},key);
  for(const v in shots)fs.writeFileSync(out+'/'+key+'_'+v+'.jpg',Buffer.from(shots[v].split(',')[1],'base64'));console.log(key);}
fs.unlinkSync(tmp);await b.close();
