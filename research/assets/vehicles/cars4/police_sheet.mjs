// The police car on one sheet: node police_sheet.mjs page.html out.jpg
// Reference photos, eight angles close up (the 40 m version) and from 60 m through a long lens (the distant version, by the
// game's own switch), and four angles by night with the bar in each of its two flash phases.
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const here=new URL('.',import.meta.url).pathname,[file,out0]=process.argv.slice(2),out=require('path').resolve(out0);
const o='function drawMini(){';let h=fs.readFileSync(file,'utf8');if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__s={get world(){return world},get player(){return player},get CARS4(){return CARS4},set paused(v){mapOpen=v},set tod(v){tod=v},makeCop,syncCar,resetToRoad,worldGroup,renderer,scene,camera,copRed,copBlue,copOff,lampsSet,get GY(){return GY}};`;
const tmp=out.replace(/\.jpg$/,'')+'_page.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:800,height:500}});p.on('pageerror',e=>console.log('page error',e.message));
await p.goto('file://'+tmp,{timeout:180000});await p.waitForFunction(()=>window.__s&&__s.world&&__s.world.cars.length&&__s.CARS4.police&&__s.CARS4.police.hi,null,{timeout:180000});await p.waitForTimeout(2000);
const refs=['jonava_2011.jpg','jetta_vilnius_2011.jpg'].map(f=>'data:image/jpeg;base64,'+fs.readFileSync(here+'review/police/ref/'+f).toString('base64'));
const place=()=>p.evaluate(()=>{const T=__s,c=T.player.car;T.paused=true;T.resetToRoad();c.speed=0;T.syncCar(c);c.g.scale.setScalar(1e-4);
  if(!window.__cop){window.__cop=T.makeCop(c.x,c.z,c.h);}const q=__cop;q.x=c.x;q.z=c.z;q.h=c.h;q.speed=0;q.steer=.5;T.syncCar(q);return q.g.userData.car2.key;});
console.log('model',await place());
const shots=(mode,phase)=>p.evaluate(([mode,phase])=>{const T=__s,q=__cop,F=q.g.userData.car2,y=T.GY(q.x,q.z),s=Math.sin(q.h),k=Math.cos(q.h);
  const P=(a,b,u)=>[q.x+s*a+k*b,y+u,q.z+k*a-s*b],cam=T.camera,fov=cam.fov,res=[];
  if(mode==='night'){T.lampsSet(q,1,false);q.bar[0].material=phase?T.copRed:T.copOff;q.bar[1].material=phase?T.copOff:T.copBlue;}
  const far=mode==='far',n=mode==='night'?4:8;
  // the distant version is shown alone (houses would stand between a 60 m camera and the car)
  const hid=far?T.worldGroup.children.filter(o=>o!==q.g&&o.visible):[];for(const o of hid)o.visible=false;
  for(let i=0;i<n;i++){const a=(mode==='night'?i*2+phase:i)*Math.PI/4,d=far?60:5.2,el=i%2?1.1:2.0;
    cam.fov=far?36*5.2/60:36;cam.updateProjectionMatrix();cam.position.set(...P(Math.cos(a)*d,Math.sin(a)*d,far?el*60/6.2:el));cam.lookAt(...P(0,0,.7));cam.updateMatrixWorld();
    const f=T.scene.fog;T.scene.fog=null;T.renderer.render(T.scene,cam);T.scene.fog=f;res.push(T.renderer.domElement.toDataURL('image/jpeg',.9));}
  for(const o of hid)o.visible=true;cam.fov=fov;cam.updateProjectionMatrix();return res;},[mode,phase]);
const near=await shots('near'),far=await shots('far');
// night: let the game's clock and lights move to 23:00, then pause again
await p.evaluate(()=>{__s.tod=23;__s.paused=false;});await p.waitForTimeout(2500);await place();
const night=[...await shots('night',0),...await shots('night',1)];
const sheet=await p.evaluate(async([refs,rows])=>{const ld=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=s;}),W=400,H=250,c=document.createElement('canvas');
  c.width=W*4;c.height=H*(1+rows.length/4)+20;const x=c.getContext('2d');x.fillStyle='#222';x.fillRect(0,0,c.width,c.height);
  const R=await Promise.all(refs.map(ld));let X=0;for(const im of R){const w=H*im.width/im.height;x.drawImage(im,X,0,w,H);X+=w+8;}
  x.fillStyle='#fff';x.font='16px sans-serif';x.fillText('references: Wikimedia Commons "Police car in Jonava" (Bearas, CC BY-SA 3.0), "Volkswagen Jetta police (Lithuania)" (David Holt, CC BY-SA 2.0)',8,H+15);
  const I=await Promise.all(rows.map(ld));I.forEach((im,i)=>x.drawImage(im,(i%4)*W,H+20+Math.floor(i/4)*H,W,H));
  return c.toDataURL('image/jpeg',.88);},[refs,[...near,...far,...night]]);
fs.writeFileSync(out,Buffer.from(sheet.split(',')[1],'base64'));fs.unlinkSync(tmp);await b.close();console.log('rows: close-up x2, distant x2, night x2 (bar phase A, B)');
