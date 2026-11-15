// Every model in every palette colour, as the game draws it: node sheet.mjs page.html outdir [key ...]
// One sheet per model (colours_{key}.jpg): front 3/4 and rear 3/4 in each of the palette colours, the last pair in its own colour.
// A detailed model is shown close up (the 40 m version) unless FAR=1 is set, which shows the distant one.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const [file,out,...only]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const o='function drawMini(){';let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__s={get world(){return world},get player(){return player},get CARS4(){return CARS4},get CARS4_PALETTE(){return CARS4_PALETTE},set paused(v){mapOpen=v},get makeCarMesh(){return makeCarMesh},syncCar,resetToRoad,worldGroup,renderer,scene,camera,get GY(){return GY}};`;
const tmp=out+'/_sheet.html';fs.writeFileSync(tmp,h.replace(o,api+o));
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
    const cv=document.createElement('canvas'),cols=car?6:2,rows=car?4:1,w=640,hh=400;cv.width=cols*w;cv.height=rows*hh;const cx=cv.getContext('2d');cx.font='22px sans-serif';
    const shot=async(from,to)=>{T.camera.position.set(...from);T.camera.lookAt(...to);T.camera.updateMatrixWorld();const f=T.scene.fog;T.scene.fog=null;T.renderer.render(T.scene,T.camera);T.scene.fog=f;
      const im=new Image();im.src=T.renderer.domElement.toDataURL('image/jpeg',.92);await im.decode();return im;};
    const pal=car?T.CARS4_PALETTE.map(e=>e[0]):[0xffffff],Mat=body.material.constructor;let n=0;
    for(const col of pal){if(car)body.material=new Mat({color:col});
      for(const v of[[P(4.3*L,3.4*L,1.25*L),P(.1,0,.6*L)],[P(-4.3*L,3.4*L,1.25*L),P(-.1,0,.6*L)]]){const im=await shot(...v),X=(n%cols)*w,Y=Math.floor(n/cols)*hh;cx.drawImage(im,X,Y,w,hh);
        cx.fillStyle='#000';cx.fillRect(X,Y,150,30);cx.fillStyle='#fff';cx.fillText(col===0xffffff?'own':'#'+col.toString(16).padStart(6,'0'),X+8,Y+22);n++;}}
    T.worldGroup.remove(g);c.g.scale.setScalar(1);return cv.toDataURL('image/jpeg',.85);},[key,far]);
  fs.writeFileSync(out+'/colours_'+key+(far?'_far':'')+'.jpg',Buffer.from(url.split(',')[1],'base64'));console.log(key);}
fs.unlinkSync(tmp);await b.close();
