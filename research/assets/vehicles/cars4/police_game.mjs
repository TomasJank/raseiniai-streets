// The police car in play: node police_game.mjs page.html outdir
// chase.jpg: one star earned, the game's own top-down camera and HUD, a cop closing in behind the player's car.
// street.jpg: a cop car driving down a street, seen from the pavement (the game paused for the shot).
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const [file,out0]=process.argv.slice(2),out=require('path').resolve(out0);fs.mkdirSync(out,{recursive:true});
const o='function drawMini(){';let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__s={get world(){return world},get player(){return player},get cops(){return cops},addHeat,set paused(v){mapOpen=v},syncCar,resetToRoad,renderer,scene,camera,get GY(){return GY},get stars(){return stars()}};`;
const tmp=out+'/_game.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('page error',e.message));
await p.goto('file://'+tmp,{timeout:180000});await p.waitForFunction(()=>window.__s&&__s.world&&__s.world.cars.length,null,{timeout:180000});await p.waitForTimeout(3000);
await p.evaluate(()=>{const T=__s;T.resetToRoad();T.player.car.speed=0;T.addHeat(1.2);});
await p.waitForFunction(()=>__s.cops.length>0,null,{timeout:30000});
// put the first cop 14 m behind the player, facing the same way, and let the chase run a moment
await p.evaluate(()=>{const T=__s,c=T.player.car,q=T.cops[0];q.x=c.x-Math.sin(c.h)*16;q.z=c.z-Math.cos(c.h)*16;q.h=c.h;q.speed=4;T.syncCar(q);});
// the controls panel closed (H) and the top-down camera (C), so both cars are in the frame
await p.keyboard.press('KeyH');await p.keyboard.press('KeyC');await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const T=__s,c=T.player.car,q=T.cops[0];return{stars:T.stars,cops:T.cops.length,model:q.g.userData.car2.key,dist:+Math.hypot(q.x-c.x,q.z-c.z).toFixed(1)};});
console.log('chase',JSON.stringify(r));await p.screenshot({path:out+'/chase.jpg',quality:88});
const url=await p.evaluate(()=>{const T=__s,q=T.cops[0];T.paused=true;const s=Math.sin(q.h),k=Math.cos(q.h),y=T.GY(q.x,q.z);
  T.camera.position.set(q.x+s*9+k*4.5,y+1.6,q.z+k*9-s*4.5);T.camera.lookAt(q.x,y+.8,q.z);T.camera.updateMatrixWorld();T.renderer.render(T.scene,T.camera);return T.renderer.domElement.toDataURL('image/jpeg',.9);});
fs.writeFileSync(out+'/street.jpg',Buffer.from(url.split(',')[1],'base64'));fs.unlinkSync(tmp);await b.close();
