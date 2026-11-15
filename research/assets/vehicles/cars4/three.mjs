// Three pictures per model (front 3/4, side, rear 3/4) for the owner's pick page: node three.mjs page.html outdir [key ...]
// One sheet per model (colours_{key}.jpg): front 3/4 and rear 3/4 in each of the palette colours, the last pair in its own colour.
// A detailed model is shown close up (the 40 m version) unless FAR=1 is set, which shows the distant one.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const [file,out,...only]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const o='function drawMini(){';let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__s={get world(){return world},get player(){return player},get CARS4(){return CARS4},get CARS4_PALETTE(){return CARS4_PALETTE},set paused(v){mapOpen=v},get makeCarMesh(){return makeCarMesh},syncCar,resetToRoad,worldGroup,renderer,scene,camera,get GY(){return GY}};`;
const tmp=out+'/_three.html';fs.writeFileSync(tmp,h.replace(o,api+o));
// the real GPU by default (a sheet is 24 frames of the whole town per model); SOFT=1 for the software renderer the tests use
const b=await chromium.launch({args:[...(process.env.SOFT?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:['--use-angle=metal','--enable-gpu']),'--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:640,height:400}});p.on('pageerror',e=>console.log('page error',e.message));
await p.goto('file://'+tmp,{timeout:180000});await p.waitForFunction(()=>window.__s&&__s.world&&__s.world.cars.length,null,{timeout:180000});await p.waitForTimeout(2500);
const far=!!process.env.FAR;
const keys=await p.evaluate(()=>{__s.paused=true;return Object.keys({...__s.CARS4.models,...__s.CARS4.extra});});
for(const key of keys){if(only.length&&!only.includes(key))continue;
  const url=await p.evaluate(async([key,far])=>{const T=__s,F=T.CARS4.models[key]||T.CARS4.extra[key],c=T.player.car;T.resetToRoad();c.speed=0;T.syncCar(c);c.g.scale.setScalar(1e-4);
    // a bus or a standing vehicle is not a car to the game: its parked mesh is shown once, in its own texture
    const car=!!T.CARS4.models[key],Mesh=c.g.userData.body.children[0].constructor,g=car?T.makeCarMesh(0x8a9099,F):new Mesh(F.lot.paint,F.mat),q={g,x:c.x,z:c.z,h:c.h,speed:0,steer:.6,wx:c.x,wz:c.z,spin:0};T.worldGroup.add(g);
    if(car)T.syncCar(q);else{g.position.set(c.x,T.GY(c.x,c.z),c.z);g.rotation.y=c.h;}
    const body=car?g.userData.body.children[0]:g;if(F.hi&&!far){body.geometry=F.hi.paint;body.userData.base=1;}
    const s=Math.sin(c.h),k=Math.cos(c.h),y=T.GY(c.x,c.z),L=F.len/4.5,P=(a,b2,u)=>[c.x+s*a+k*b2,y+u,c.z+k*a-s*b2];
    const shot=(from,to)=>{T.camera.position.set(...from);T.camera.lookAt(...to);T.camera.updateMatrixWorld();const f=T.scene.fog;T.scene.fog=null;T.renderer.render(T.scene,T.camera);T.scene.fog=f;return T.renderer.domElement.toDataURL('image/jpeg',.9);};
    const Mat=body.material.constructor,out=[];
    // front 3/4 in silver, side in dark blue, rear 3/4 in dark red: three angles and three of the town's common colours
    for(const [col,from,to] of [[0xb7bbbf,P(4.3*L,3.4*L,1.25*L),P(.1,0,.6*L)],[0x1e2d4f,P(.1,6.2*L,1.0*L),P(.1,0,.65*L)],[0x5a181c,P(-4.3*L,3.4*L,1.25*L),P(-.1,0,.6*L)]]){
      if(car)body.material=new Mat({color:col});out.push(shot(from,to));}
    T.worldGroup.remove(g);c.g.scale.setScalar(1);return out;},[key,far]);
  url.forEach((u,i)=>fs.writeFileSync(out+'/'+key+'_'+(i+1)+'.jpg',Buffer.from(u.split(',')[1],'base64')));console.log(key);}
fs.unlinkSync(tmp);await b.close();
