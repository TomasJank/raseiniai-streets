// pictures for the fixwalk report: node shots_fixwalk.mjs page.html outPrefix
// feet: the player standing on the pavement, seen at foot height; car: a walker passing a car parked on the kerb, seen from above
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,pre]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,html=dir+'_fwshot_'+process.pid+'.html';
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
const api=`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get MH(){return MH},PLAYER_I,set tod(v){tod=v},GY:(x,z)=>GY(x,z),
enterExit:()=>enterExit(),updatePeople:d=>updatePeople(d),walk:d=>walk(d),renderer,scene,camera,
shot(from,to){camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}};`;
fs.writeFileSync(html,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:900,height:600}});
await p.goto('file://'+html,{timeout:240000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:240000,polling:500});
await p.evaluate(()=>{__t.tod=13;if(__t.player.mode==='car')__t.enterExit();});
await p.waitForFunction(()=>__t.MH.ready&&__t.MH.on[__t.PLAYER_I],null,{timeout:240000,polling:500});
const save=(n,s)=>fs.writeFileSync(`${pre}_${n}.png`,Buffer.from(s.split(',')[1],'base64'));
save('feet',await p.evaluate(()=>{const T=__t,P=T.player,W=T.world;for(const q of T.peds){q.mode='hide';q.lead=null;}
  // a pavement spot near the start
  let s=null;for(const e of W.edges){if(e.cls!==1)continue;const A=W.graph.get(e.a),B=W.graph.get(e.b),L=Math.hypot(B.x-A.x,B.z-A.z);if(Math.hypot(A.x-P.x,A.z-P.z)>300||L<20)continue;
    const x=(A.x+B.x)/2-(B.z-A.z)/L*(e.w/2+1.2),z=(A.z+B.z)/2+(B.x-A.x)/L*(e.w/2+1.2);if(W.surf(x,z)>.05&&!W.inBuilding(x,z)){s={x,z,h:Math.atan2(B.x-A.x,B.z-A.z)};break;}}
  P.x=s.x;P.z=s.z;P.h=s.h;for(let i=0;i<40;i++){T.walk(1/60);T.updatePeople(1/60);}
  const g=T.GY(P.x,P.z)+W.surf(P.x,P.z),rx=Math.cos(P.h),rz=-Math.sin(P.h);
  return T.shot([P.x+rx*1.6,g+.12,P.z+rz*1.6],[P.x,g+.15,P.z]);}));
save('car',await p.evaluate(()=>{const T=__t,W=T.world,P=T.player;
  // a car parked on the kerb by spawnCars (no ai, standing on a residential street's pavement line), nearest the player
  const G=W.graph;let best=null;
  for(const c of W.cars){if(c.ai||c===P.car)continue;for(const e of W.edges){if(e.cls!==1)continue;const A=G.get(e.a),B=G.get(e.b),dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz),t=((c.x-A.x)*dx+(c.z-A.z)*dz)/L/L;if(t<.2||t>.8)continue;
    const lt=((c.x-A.x)*-dz+(c.z-A.z)*dx)/L;if(Math.abs(Math.abs(lt)-(e.w/2+1.05))<.05){const d=Math.hypot(c.x-P.x,c.z-P.z);if(!best||d<best.d)best={c,e,t,side:Math.sign(lt),L,d};}}}
  const {c,e,t,side,L}=best;for(const q of T.peds){q.mode='hide';q.lead=null;q.grp=null;}
  const q=T.peds[0];Object.assign(q,{mode:'walk',e,t:t-6/L,dir:1,side,lane:0,avo:0,avoT:0,lead:null,grp:null,dest:null,idleT:999,chatT:999,nerv:0,react:0,seen:1e9,sp:1.3});
  const A=G.get(e.a);q.x=A.x+(G.get(e.b).x-A.x)*q.t;q.z=A.z+(G.get(e.b).z-A.z)*q.t;
  P.x=c.x+8;P.z=c.z+8;const g=T.GY(c.x,c.z);
  T.camera.position.set(c.x,g+9,c.z);for(let i=0;i<300;i++){T.updatePeople(1/60);if(Math.hypot(q.x-c.x,q.z-c.z)<.9)break;}
  return T.shot([c.x+Math.sin(c.h+1.57)*side*-2.5,g+7,c.z+Math.cos(c.h+1.57)*side*-2.5],[c.x,g,c.z]);}));
await b.close();fs.unlinkSync(html);
