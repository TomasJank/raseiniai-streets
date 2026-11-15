// lmcivic: the municipality (c2159) and the culture centre (c171) drawn from Blender models; the code-built boxes, the views
// step's wing/gables/canopy and the facades step's culture front gone; both solid; the entrance walkable; steps, ramp, stairs
// and flagpoles solid and off the roads.
// node test_lmcivic.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get LMV(){return typeof LMV==='undefined'?null:LMV},get GY(){return GY},get collideCar(){return collideCar},pip,THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html',{timeout:0});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});
await p.waitForFunction(()=>__t.LMV&&__t.LMV.every(b=>b.loaded),null,{timeout:120000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,W=T.world,V=new T.THREE.Vector3(),M=new T.THREE.Matrix4(),out={};if(!T.LMV)return{noStep:true};
  for(const B of T.LMV){const F=B.F;if(!F||!B.loaded){out[B.id]={noFrame:true};continue;}
    const loc=(x,z)=>{const dx=x-F.o[0],dz=z-F.o[1];return[dx*F.R[0]+dz*F.R[1],dx*F.N[0]+dz*F.N[1]];};
    let tris=0,lambert=true,glow=0;B.group.traverse(q=>{if(q.isMesh){tris+=(q.geometry.index?q.geometry.index.count:q.geometry.attributes.position.count)/3;
      lambert=lambert&&q.material.type==='MeshLambertMaterial';if(q.material.onBeforeCompile&&String(q.material.onBeforeCompile).includes('uNight'))glow++;}});
    // anything else drawn inside the outline, 2.2 m above the ground up to 6 m above the roof (meshes vertex by vertex, instanced meshes by instance)
    const inside=(x,z)=>T.pip(x,z,B.poly),who=new Set();let n=0;
    const hit=(x,y,z,name)=>{const g=T.GY(x,z);if(inside(x,z)&&y>g+2.2&&y<F.y0+B.h+6){n++;if(who.size<12)who.add(name+'@'+loc(x,z).map(v=>v.toFixed(0))+','+(y-g).toFixed(0));}};
    T.wg.traverse(q=>{if(!q.isMesh)return;let a=q.parent;while(a&&a!==B.group)a=a.parent;if(a===B.group)return;
      const g=q.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const s=g.boundingSphere.clone().applyMatrix4(q.matrixWorld),c=B.poly[0];
      if(Math.hypot(s.center.x-c[0],s.center.z-c[1])>s.radius+90)return;
      if(q.isInstancedMesh){for(let i=0;i<q.count;i++){q.getMatrixAt(i,M);V.setFromMatrixPosition(M).applyMatrix4(q.matrixWorld);hit(V.x,V.y,V.z,(q.name||'inst'));}return;}
      const pa=g.attributes.position;for(let i=0;i<pa.count;i++){V.fromBufferAttribute(pa,i).applyMatrix4(q.matrixWorld);hit(V.x,V.y,V.z,q.name||q.material.type);}});
    const walk=(a,c)=>{let[x,z]=F.at(...a);const[tx,tz]=F.at(...c);for(let i=0;i<3000;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
      const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(k=>+k.toFixed(2));};
    // a round post is passed round, not through: the closest the walker gets to its centre
    const near=(a,c,q)=>{let[x,z]=F.at(...a);const[tx,tz]=F.at(...c),[px,pz]=F.at(...q);let m=1e9;for(let i=0;i<400;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
      const r=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=r.x;z=r.z;m=Math.min(m,Math.hypot(x-px,z-pz));}return+m.toFixed(2);};
    // nothing of the step's own solids on a road surface
    const onRoad=(x,z)=>{for(const s of W.roadSegs(x,z)){const dx=s[2]-s[0],dz=s[3]-s[1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/l2));
      if(Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<s[4].w/2)return true;}return false;};
    const pts=[...B.walls.flatMap(w=>[[w[0],w[1]],[w[2],w[3]]]),...B.round.map(([x,y])=>F.at(x,y))],road=pts.filter(q=>onRoad(...q)).map(q=>loc(...q).map(v=>v.toFixed(1)));
    const res={tris,lambert,glow,other:n,who:[...who],road,walls:B.walls.length};
    if(B.id==='c2159')Object.assign(res,{front:walk([20,-6],[20,3]),back:walk([20,40],[20,20]),doors:walk([44,-9],[44,3.9]),ramp:walk([57,-0.9],[47,-0.9]),
      pole:near([33.4,-7],[33.4,0],[33.4,-3.4]),se:walk([60,8],[44,8])});
    else Object.assign(res,{sw:walk([15,-8],[15,5]),se:walk([45,10],[30,10]),stairs:walk([39,16.7],[32,16.7]),porch:walk([-26,21],[-14,21]),ne:walk([0,50],[0,30])});
    out[B.id]=res;}
  let fx=false;T.wg.traverse(q=>{if(q.name==='fx_culture')fx=true;});
  const lm=W.landmarks.culture,K=T.LMV[1];let lmIn=false;for(let q=lm;q;q=q.parent)if(q===K.group)lmIn=true;
  out.culture={fx,lmIn,lmTris:lm&&lm.geometry?lm.geometry.attributes.position.count/3:0,skipped:T.LMV.skipped};
  return out;});
if(r.noStep){check('step present',false,r);}else{
  const S=r.c2159,K=r.c171;
  for(const[id,q]of[['c2159',S],['c171',K]]){
    if(q.noFrame){check(id+' model placed and loaded',false,q);continue;}
    check(id+' model loaded, Lambert, lit windows',q.tris>1000&&q.lambert&&q.glow>=1,{tris:q.tris,lambert:q.lambert,glow:q.glow});
    check(id+' nothing else drawn inside the outline',q.other===0,{verts:q.other,who:q.who});
    check(id+' step solids clear of roads',q.road.length===0&&q.walls>0,{onRoad:q.road,walls:q.walls});}
  if(!S.noFrame){
    check('c2159 blocked from the square and the car park',S.front[1]<-.2&&S.back[1]>12.8,{front:S.front,back:S.back});
    check('c2159 up the steps and under the canopy to the doors',Math.abs(S.doors[0]-44)<.3&&S.doors[1]>3.5,S.doors);
    check('c2159 ramp, flagpole and south-east end solid',S.ramp[0]>52.9&&S.pole>.5&&S.se[0]>48.7,{ramp:S.ramp,pole:S.pole,se:S.se});}
  if(!K.noFrame){
    check('c171 blocked on the car park, street and park sides',K.sw[1]<-.2&&K.se[0]>32.8&&K.ne[1]>38.5,{sw:K.sw,se:K.se,ne:K.ne});
    check('c171 outside stairs solid, porch reachable from the plaza',K.stairs[0]>34&&K.porch[0]<-17.6&&K.porch[0]>-18.8,{stairs:K.stairs,porch:K.porch});}
  check('facades culture front gone, culture landmark is the model',!r.culture.fx&&r.culture.lmIn&&r.culture.lmTris>50&&r.culture.lmTris<5000,r.culture);}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
