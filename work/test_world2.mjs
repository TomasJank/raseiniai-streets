// weather rules and grass blades: node test_world2.mjs page.html [shotsDir]
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,out='shots_world2']=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+out,{recursive:true});
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},get weather(){return weather},get tod(){return tod},set tod(v){tod=v},get grass(){return grass},set grassOn(v){grassOn=v},
KEY,wxRules,nextWeather,updateEnv,updateGrass,driveCar,resetToRoad,syncCar,collideCar,renderer,scene,camera,get GY(){return GY},sun,
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();for(const c of world.cars)c.g.visible=c===player.car;for(const m of pedMesh)m.visible=false;
  const gp=GY(to[0],to[2]);sun.position.set(to[0]+105,gp+85,to[2]+65);sun.target.position.set(to[0],gp,to[2]);sun.target.updateMatrixWorld();
  updateGrass(.016);renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(dir+'_world2.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,400))});
await p.goto('file://'+dir+'_world2.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const ev=async(name,fn)=>{try{const r=await p.evaluate(fn);console.log(name,JSON.stringify(r));return r;}catch(e){console.log(name,'FAILED',e.message.split('\n')[0]);return null;}};
const save=(n,u)=>{if(u)fs.writeFileSync(`${dir}${out}/${n}.png`,Buffer.from(u.split(',')[1],'base64'));};
await ev('weather',()=>{const T=__t,W=T.weather,s={samples:0,rain:0,snow:0,rainBad:0,snowBad:0,minT:99,maxT:-99};W.force=0;
  for(let i=0;i<24000;i++){T.tod=(i*.002)%24;T.updateEnv(.5);s.samples++;s.minT=Math.min(s.minT,W.temp);s.maxT=Math.max(s.maxT,W.temp);
    if(W.kind==='rain'&&W.amt>.3){s.rain++;if(W.hum<.6||W.temp<0)s.rainBad++;}if(W.kind==='snow'&&W.amt>.3){s.snow++;if(W.temp>1.5)s.snowBad++;}}
  s.minT=+s.minT.toFixed(1);s.maxT=+s.maxT.toFixed(1);
  const k0=W.kind;T.nextWeather(true);const forced=W.kind;for(let i=0;i<100;i++)T.updateEnv(.5);s.forced=[k0,forced,W.kind];return s;});
await ev('weatherReset',()=>{const T=__t,W=T.weather;W.kind='clear';W.amt=W.want=0;W.force=0;T.tod=13;T.updateEnv(0);return W.kind;});
// a lawn next to a road: stand at a road node and look across the verge
const r=await ev('grass',()=>{const T=__t,W=T.world,G=W.graph;T.grassOn=true;let best=null;
  for(const n of G.values()){if(n.cls!==1)continue;const x=n.x+6,z=n.z+6;if(W.ground(x,z)===0&&!W.inBuilding(x,z)&&Math.hypot(n.x-T.player.x,n.z-T.player.z)<2500){best=n;break;}}
  if(!best)return'no verge';const c=T.player.car;c.x=best.x;c.z=best.z;c.speed=0;T.syncCar(c);T.player.x=c.x;T.player.z=c.z;window.__spot=[best.x,best.z];
  T.camera.position.set(best.x,T.GY(best.x,best.z)+2,best.z);T.updateGrass(.016);const g=T.grass;
  return{built:!!g,blades:g.mesh.geometry.attributes.position.count/3,mapCentre:[Math.round(g.cx),Math.round(g.cz)]};});
await ev('heightMap',()=>{const T=__t,g=T.grass,R=T.renderer,px=448,buf=new Uint16Array(px*px*4);R.readRenderTargetPixels(g.rt,0,0,px,px,buf);
  const f=v=>{const s=(v&0x8000)?-1:1,e=(v>>10)&31,m=v&1023;return e===0?s*m*Math.pow(2,-24):e===31?NaN:s*(1+m/1024)*Math.pow(2,e-15);};
  // compare stored heights with the ground at matching points; v=0 is the bottom row of the target, which is +z here
  let grassPx=0,errs=[],n=0;for(let j=0;j<px;j+=16)for(let i=0;i<px;i+=16){const k=(j*px+i)*4,y=f(buf[k]),gm=f(buf[k+1]);if(gm>.5){grassPx++;const x=g.cx+(i+.5)/px*140-70,z=g.cz+70-(j+.5)/px*140;errs.push(Math.abs(y-T.GY(x,z)));}n++;}
  errs.sort((a,b)=>a-b);return{sampled:n,grassShare:+(grassPx/n).toFixed(2),medianHeightErrM:+(errs[errs.length>>1]||0).toFixed(2),p90:+(errs[Math.floor(errs.length*.9)]||0).toFixed(2)};});
const shots=await p.evaluate(()=>{const T=__t,[x,z]=window.__spot,y=T.GY(x,z),out={};
  out.verge=T.shot([x-3,y+1.6,z-3],[x+8,y+.3,z+8]);out.vergeHigh=T.shot([x-10,y+9,z-10],[x+6,y,z+6]);
  T.grassOn=false;out.vergeOff=T.shot([x-3,y+1.6,z-3],[x+8,y+.3,z+8]);T.grassOn=true;return out;});
for(const [n,u] of Object.entries(shots))save(n,u);
await ev('tracks',()=>{const T=__t,W=T.world,c=T.player.car;let s=null;
  for(let k=0;k<15000&&!s;k++){const B=W.box,x=B.minX+Math.random()*(B.maxX-B.minX),z=B.minZ+Math.random()*(B.maxZ-B.minZ),a=Math.random()*6.28;let ok=true;
    for(let t=0;t<=30&&ok;t+=2){const px=x+Math.sin(a)*t,pz=z+Math.cos(a)*t;if(W.ground(px,pz)!==0||W.inBuilding(px,pz)||T.collideCar(px,pz,1.6,null).hit)ok=false;}if(ok)s=[x,z,a];}
  if(!s)return'no lawn';c.x=s[0];c.z=s[1];c.h=c.trav=s[2];c.speed=0;c.hp=1;c.dead=false;T.syncCar(c);T.KEY.KeyW=true;
  for(let i=0;i<60;i++){T.driveCar(c,.033);T.camera.position.set(c.x,T.GY(c.x,c.z)+3,c.z);T.updateGrass(.033);}T.KEY.KeyW=false;
  const live=T.grass.U.uTrail.value.filter(v=>v.z>0).length;window.__trk=s;return{trailPoints:live,droveM:+Math.hypot(c.x-s[0],c.z-s[1]).toFixed(1)};});
save('tracks',await p.evaluate(()=>{const T=__t,s=window.__trk;if(!s)return null;const c=T.player.car,y=T.GY(c.x,c.z);return T.shot([c.x-Math.sin(c.h)*14+3,y+4,c.z-Math.cos(c.h)*14+3],[c.x-Math.sin(c.h)*5,y,c.z-Math.cos(c.h)*5]);}));
console.log('errors',JSON.stringify(errs.slice(0,6)));
await b.close();
