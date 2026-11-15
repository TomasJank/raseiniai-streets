// lmpost: the post office building (c2683) drawn from a Blender model; the code-built block and its loggias, stairwell doors and
// playground gone; solid on every side; up the steps to the doors and up the ramp walkable; fieldstone wall and stair tower solid;
// step solids off the roads; names unique in the page.
// node test_lmpost.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const names=['const LPO=','const lpoOn=','const lpoNear=','function lpoEdge(','function lpoMine(','const lpoRec=','function lpoMat(','function lpoBuild('];
check('step names defined once in the page',names.every(n=>h.split(n).length===2),names.map(n=>h.split(n).length-1));
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get LPO(){return typeof LPO==='undefined'?null:LPO},get P2(){return typeof P2==='undefined'?null:P2},get GY(){return GY},get collideCar(){return collideCar},pip,lpoEdge,THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html',{timeout:0});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});
await p.waitForFunction(()=>__t.LPO&&__t.LPO.loaded,null,{timeout:120000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,B=T.LPO,V=new T.THREE.Vector3(),M=new T.THREE.Matrix4();if(!B)return{noStep:true};
  const F=B.F;if(!F||!B.loaded)return{noFrame:true};
  const loc=(x,z)=>{const dx=x-F.o[0],dz=z-F.o[1];return[dx*F.R[0]+dz*F.R[1],dx*F.N[0]+dz*F.N[1]];};
  let tris=0,lambert=true,glow=0;B.group.traverse(q=>{if(q.isMesh){tris+=(q.geometry.index?q.geometry.index.count:q.geometry.attributes.position.count)/3;
    lambert=lambert&&q.material.type==='MeshLambertMaterial';if(q.material.onBeforeCompile&&String(q.material.onBeforeCompile).includes('uNight'))glow++;}});
  // anything else drawn inside the outline or within 2.5 m of it, 2.2 m above the ground up to 6 m above the roof (the whole scene,
  // meshes vertex by vertex, instanced meshes by instance: the town step's loggias are instances outside worldGroup)
  let root=T.wg;while(root.parent)root=root.parent;const who=new Set();let n=0;
  const hit=(x,y,z,name)=>{const g=T.GY(x,z);if((T.pip(x,z,B.poly)||T.lpoEdge(x,z)<2.5)&&y>g+2.2&&y<F.y0+B.h+6){n++;if(who.size<12)who.add(name+'@'+loc(x,z).map(v=>v.toFixed(0))+','+(y-g).toFixed(0));}};
  root.traverse(q=>{if(!q.isMesh||!q.geometry||!q.geometry.attributes.position)return;let a=q.parent;while(a&&a!==B.group)a=a.parent;if(a===B.group)return;
    if(q.isInstancedMesh){for(let i=0;i<q.count;i++){q.getMatrixAt(i,M);V.setFromMatrixPosition(M).applyMatrix4(q.matrixWorld);hit(V.x,V.y,V.z,(q.name||'inst'));}return;}
    const g=q.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(q.matrixWorld);
    if(Math.hypot(s.center.x-B.at[0],s.center.z-B.at[1])>s.radius+80)return;
    const pa=g.attributes.position;for(let i=0;i<pa.count;i++){V.fromBufferAttribute(pa,i).applyMatrix4(q.matrixWorld);hit(V.x,V.y,V.z,q.name||q.material.type);}});
  // playground pieces from the block-of-flats yard mark
  const play=T.P2?T.P2.sites.filter(s=>T.P2.kinds.play&&T.P2.kinds.play.includes(s.r)&&T.lpoEdge(s.x,s.z)<25).length:-1;
  const walk=(a,c)=>{let[x,z]=F.at(...a);const[tx,tz]=F.at(...c);for(let i=0;i<3000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
    const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(k=>+k.toFixed(2));};
  const onRoad=(x,z)=>{for(const s of W.roadSegs(x,z)){const dx=s[2]-s[0],dz=s[3]-s[1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/l2));
    if(Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<s[4].w/2)return true;}return false;};
  const road=B.walls.flatMap(w=>[[w[0],w[1]],[w[2],w[3]]]).filter(q=>onRoad(...q)).map(q=>loc(...q).map(v=>v.toFixed(1)));
  const ramp1=walk([5,-6],[5,-1.3]),ramp2=walk(ramp1,[19.4,-1.3]);
  return{tris,lambert,glow,other:n,who:[...who],play,unblk:B.unblk,road,walls:B.walls.length,
    front:walk([35,-3],[35,3]),back:walk([25,22],[25,5]),ne:walk([-12,8],[3,8]),sw:walk([53,6],[45,6]),
    doors:walk([22.1,-8],[22.1,1]),ramp1,ramp2,wall:walk([12,-7],[12,-1]),tower:walk([-1.6,-6],[-1.6,3])};});
if(r.noStep)check('step present',false,r);else if(r.noFrame)check('model placed and loaded',false,r);else{
  check('model loaded, Lambert, lit windows',r.tris>3000&&r.lambert&&r.glow>=1,{tris:r.tris,lambert:r.lambert,glow:r.glow});
  check('nothing else drawn inside or beside the outline',r.other===0,{verts:r.other,who:r.who});
  check('block dressing and playground gone',r.unblk===1&&r.play===0,{unblk:r.unblk,play:r.play});
  check('step solids clear of roads',r.road.length===0&&r.walls>10,{onRoad:r.road,walls:r.walls});
  check('blocked from the front, back and both ends',r.front[1]<-.9&&r.back[1]>12.7&&r.ne[0]<-.3&&r.sw[0]>50.5&&r.sw[0]<50.7,{front:r.front,back:r.back,ne:r.ne,sw:r.sw});
  check('up the steps to the glass doors',Math.abs(r.doors[0]-22.1)<.3&&r.doors[1]>-1.05&&r.doors[1]<-.9,r.doors);
  check('through the wall gap and up the ramp to the landing',r.ramp1[1]>-1.4&&r.ramp2[0]>19,{ramp1:r.ramp1,ramp2:r.ramp2});
  check('fieldstone wall and stair tower solid',r.wall[1]<-3.6&&r.tower[1]<.7,{wall:r.wall,tower:r.tower});}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
