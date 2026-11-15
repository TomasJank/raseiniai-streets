// lmvil2: Vilniaus g. blocks c2909 and c2904 drawn from Blender models, code-built boxes and facade dressing gone, solid.
// node test_lmvil2.mjs page.html [page2.html]   (a second build of the same chain: the two must be byte-identical; exits 1 on a failed check)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,file2]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
if(file2)check('two builds byte-identical',fs.readFileSync(file).equals(fs.readFileSync(file2)),[fs.statSync(file).size,fs.statSync(file2).size]);
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get FX(){return FX},get LV2(){return typeof LV2==='undefined'?null:LV2},get GY(){return GY},get collideCar(){return collideCar},THREE};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html',{timeout:300000});
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:300000});
await p.waitForFunction(()=>__t.LV2&&__t.LV2.every(L=>L.loaded),null,{timeout:120000}).catch(()=>{});
const r=await p.evaluate(()=>{const T=__t,out={};if(!T.LV2)return{noStep:true};
  for(const L of T.LV2){const F=L.F;if(!F||!L.loaded){out[L.id]={noFrame:true};continue;}
    const rec=T.FX.recs.find(q=>q.id===L.id),P=rec.pts,{p1,R,N}=F;
    const inside=(x,z)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,zi]=P[i],[xj,zj]=P[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;}return c;};
    const loc=(x,z)=>{const dx=x-p1[0],dz=z-p1[1];return[dx*R[0]+dz*R[1],dx*N[0]+dz*N[1]];};
    let tris=0,meshes=0,lambert=true,glow=0;L.group.traverse(o=>{if(o.isMesh){meshes++;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;
      lambert=lambert&&o.material.type==='MeshLambertMaterial';if(o.material.onBeforeCompile&&String(o.material.onBeforeCompile).includes('uNight'))glow++;}});
    // anything else drawn inside the footprint more than 1.5 m above ground: plain meshes by vertex, instanced meshes (facade dressing) by instance
    const v=new T.THREE.Vector3(),M=new T.THREE.Matrix4(),who={};
    T.wg.traverse(o=>{if(!o.isMesh)return;let q=o.parent;while(q&&q!==L.group)q=q.parent;if(q===L.group)return;
      if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,M);v.setFromMatrixPosition(M);if(inside(v.x,v.z)&&o.name!=='')who[o.name]=(who[o.name]||0)+1;}return;}
      const pa=o.geometry.attributes.position;for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);if(inside(v.x,v.z)&&v.y>T.GY(v.x,v.z)+1.5){const k=o.name||o.material.type;who[k]=(who[k]||0)+1;}}});
    const walk=(a,bq)=>{let[x,z]=F.at(...a);const[tx,tz]=F.at(...bq);for(let i=0;i<1500;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.05)break;
        const q=T.collideCar(x+dx/d*.05,z+dz/d*.05,.35,null);x=q.x;z=q.z;}return loc(x,z).map(k=>+k.toFixed(2));};
    out[L.id]={tris,meshes,lambert,glow,who,walls:T.world.walls?T.world.walls.length:null,
      into:L.id==='c2909'?walk([-6,7],[4,7]):walk([8,-5],[8,4]),
      lean:L.id==='c2909'?walk([3.2,-1.2],[7,-1.2]):null};}
  return out;});
if(r.noStep)check('step present',false,r);else for(const id of['c2909','c2904']){const q=r[id];
  if(!q||q.noFrame){check(id+' model loaded',false,q);continue;}
  check(id+' model loaded, Lambert, sane triangle count',q.meshes>0&&q.tris>300&&q.tris<9000&&q.lambert,{meshes:q.meshes,tris:q.tris,lambert:q.lambert});
  check(id+' lit windows at night',q.glow>=1,q.glow);
  check(id+' code-built box and facade dressing not drawn',Object.keys(q.who).length===0,q.who);
  check(id+' walking into the building is blocked',id==='c2909'?q.into[0]<-.2:q.into[1]<-.2,q.into);
  if(q.lean)check(id+' glazed lean-to is solid',q.lean[0]<4.2,q.lean);}
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
