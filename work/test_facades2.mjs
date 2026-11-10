// facades2 checks + shots: node test_facades2.mjs [shotsDir]   (builds its own page from work/facades2_test, needs network for three.js)
import {createRequire} from 'module';import fs from 'fs';import {execFileSync} from 'child_process';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const dir=new URL('.',import.meta.url).pathname,out=process.argv[2]||dir+'../research/prototypes/buildings/v2';
fs.mkdirSync(out,{recursive:true});
const built=dir+'_facades2_built.html',page=dir+'_facades2.html';
execFileSync('sh',[dir+'build_facades2_test.sh',built],{stdio:'inherit'});
let h=fs.readFileSync(built,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__f={get world(){return world},get GY(){return GY},get STY(){return STY},get LOOK(){return LOOK},get FX(){return FX},get tex(){return facadeTex},get scene(){return scene},get camera(){return camera},get pitchOrder(){return pitchOrder},get polyArea(){return polyArea},get shader(){return facadeShader},renderer,
setup(){for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;},
view(from,to,tod=13){
  window.tod=tod;tod=13;this.setup();
  const gx=to[0],gz=to[2],gp=GY(gx,gz);sun.position.set(gx+105,gp+85,gz+65);sun.target.position.set(gx,gp,gz);sun.target.updateMatrixWorld();
  for(let i=0;i<40;i++)updateEnv(.05);
  camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();if(typeof perfTick==="function"){perfT=0;perfTick(.016);}renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');},
// colour under world points, read in the same task as the render
probe(pts){const c=camera,W=renderer.domElement.width,H=renderer.domElement.height,t=document.createElement('canvas');t.width=W;t.height=H;const g=t.getContext('2d');g.drawImage(renderer.domElement,0,0);
  return pts.map(([x,y,z])=>{const v=new c.position.constructor(x,y,z).project(c),px=Math.round((v.x+1)/2*W),py=Math.round((1-v.y)/2*H);return Array.from(g.getImageData(px,py,1,1).data.slice(0,3));});}};`;
fs.writeFileSync(page,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+page);
await p.waitForFunction(()=>window.__f&&__f.world&&__f.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};
console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('errors');
// helpers shared by the checks: building record, vertices of the merged wall mesh inside its footprint, fx instances near it
await p.evaluate(()=>{
  const F=window.__f;
  F.rec=id=>F.FX.recs.find(r=>r.id===id);
  F.box=id=>{const q=F.rec(id);let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const p of q.pts){a=Math.min(a,p[0]);b=Math.max(b,p[0]);c=Math.min(c,p[1]);d=Math.max(d,p[1]);}return[a,b,c,d];};
  F.bld=()=>{let m=null;F.scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.geometry.attributes.tone)m=o;});return m;};
  F.verts=(id,pad=.3)=>{const g=F.bld().geometry,P=g.attributes.position.array,[a,b,c,d]=F.box(id),o=[];for(let i=0;i<P.length/3;i++)if(P[i*3]>=a-pad&&P[i*3]<=b+pad&&P[i*3+2]>=c-pad&&P[i*3+2]<=d+pad)o.push(i);return o;};
  F.inst=(name,id)=>{const [a,b,c,d]=F.box(id);let n=0;F.scene.traverse(m=>{if(m.name===name){const E=m.instanceMatrix.array;for(let i=0;i<m.count;i++){const x=E[i*16+12],z=E[i*16+14];if(x>a-3&&x<b+3&&z>c-3&&z<d+3)n++;}}});return n;};
});
await check('twoTone',()=>{const F=__f,g=F.bld().geometry,T=g.attributes.tone.array,id='c3823',sp=F.rec(id).specs[0][1],v=F.verts(id).filter(i=>T[i*4+3]<-100);
  const w2=sp.wall2,rgb=v.length?[T[v[0]*4],T[v[0]*4+1],T[v[0]*4+2]]:null,band=v.length?-T[v[0]*4+3]-500:null;
  const src=F.shader.toString();
  return{ok:v.length>=12&&rgb&&rgb.every((c,i)=>Math.abs(c-w2[i])<1e-5)&&Math.abs(band-(sp.yb+.3+3.5))<.01&&src.includes('vTone')&&src.includes('tone'),verts:v.length,rgb,band,expect:sp.yb+.3+3.5};});
await check('twoToneNeutral',()=>{const F=__f,T=F.bld().geometry.attributes.tone.array,v=F.verts('c3733');return{ok:v.length>0&&v.every(i=>T[i*4+3]===1&&T[i*4]===0),verts:v.length};});
// render the two-tone house and compare wall pixels below and above the band
const tt=await p.evaluate(()=>{const F=__f,id='c3823',q=F.rec(id),[a,b,c,d]=F.box(id),sp=q.specs[0][1];
  let best=null;for(let i=0;i<q.pts.length;i++){const p0=q.pts[i],p1=q.pts[(i+1)%q.pts.length],L=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]);if(!best||L>best.L)best={p0,p1,L};}
  const {p0,p1,L}=best,ux=(p1[0]-p0[0])/L,uz=(p1[1]-p0[1])/L,sg=F.pointOut?1:1,cx=(a+b)/2,cz=(c+d)/2;let nx=-uz,nz=ux;if(((p0[0]+p1[0])/2-cx)*nx+((p0[1]+p1[1])/2-cz)*nz<0){nx=-nx;nz=-nz;}
  const mx=(p0[0]+p1[0])/2,mz=(p0[1]+p1[1])/2,gy=F.GY(mx,mz),D=Math.max(26,L*.8);
  const url=F.view([mx+nx*D,gy+4,mz+nz*D],[mx,gy+sp.h*.5,mz]);
  const pts=lv=>[-.45,-.35,-.25,-.15,-.05,.05,.15,.25,.35,.45].map(k=>[mx+ux*L*k,gy+lv,mz+uz*L*k]);
  return{url,lo:F.probe(pts(1.5)),hi:F.probe(pts(9))};});
fs.writeFileSync(out+'/twotone.png',Buffer.from(tt.url.split(',')[1],'base64'));
// trees stand in front, so judge by the most red sample: wall2 is red-brown (r-g > 20), wall is cream (r-g about 0)
const red=A=>Math.max(...A.map(c=>c[0]-c[1]));
console.log('twoToneRender',JSON.stringify({loRed:red(tt.lo),hiRed:red(tt.hi)}));
if(!(red(tt.hi)>20&&red(tt.lo)<12))fails.push('twoToneRender');
await check('maskedFace',()=>{const F=__f,g=F.bld().geometry,S=g.attributes.sty.array,r={};
  for(const id of['c4185','c4161','c3823']){const v=F.verts(id);r[id]=v.filter(i=>S[i]>=16).length/3;}
  // atlas: the plaster tile without its window has no glass/frame texel, the normal one has
  const t=F.tex.image,W=t.width,H=t.height,d=t.data,T=128;
  const tile=(row)=>{let n=0;for(let y=row*T;y<(row+1)*T;y++)for(let x=0;x<T;x++)if(d[(y*W+x)*4+3]>127)n++;return n;};
  const win=tile(3),blank=tile(1);
  // the masked wall of c4185 is edge 1, which `edge_ids.py c4185` says faces NE
  const N=g.attributes.normal.array,m=F.verts('c4185').filter(i=>S[i]>=16),bear=Math.round((Math.atan2(N[m[0]*3],-N[m[0]*3+2])*180/Math.PI+360)%360);
  return{ok:r.c4185===2&&r.c4161===4&&r.c3823===0&&win>1500&&blank===0&&H===T*4&&Math.round(bear/45)%8===1,maskedTris:r,maskedFaces:bear,glassTexels:{upper:win,upperBlank:blank},atlas:[W,H]};});
await check('balconyOverride',()=>{const F=__f,r={c3823:F.inst('fx_balc','c3823'),c3828:F.inst('fx_balc','c3828'),c3718:F.inst('fx_balc','c3718')};
  let all=0;F.scene.traverse(m=>{if(m.name==='fx_balc')all=m.count;});
  return{ok:r.c3823===0&&r.c3828===0&&r.c3718>0&&all>50,counts:r,autoTotal:all};});
await check('chimneyDormerOverride',()=>{const F=__f,r={dormerTrue:F.inst('fx_dormB','c3685'),chimTrue:F.inst('fx_chim','c3685'),dormerFalse:F.inst('fx_dormB','c4185'),chimFalse:F.inst('fx_chim','c4171')};
  return{ok:r.dormerTrue>0&&r.chimTrue>0&&r.dormerFalse===0&&r.chimFalse===0,counts:r};});
await check('roofFlattened',()=>{const F=__f,id='c3799',sp=F.rec(id).specs[0][1],P=F.bld().geometry.attributes.position.array,v=F.verts(id);
  let top=-1e9;for(const i of v)top=Math.max(top,P[i*3+1]);
  return{ok:!sp.skel&&sp.pitched===false&&top<=sp.y0+sp.h+.01,pitched:sp.pitched,skel:!!sp.skel,top:+top.toFixed(2),eave:+(sp.y0+sp.h).toFixed(2)};});
await check('ridgeAcross',()=>{const F=__f,id='c4251',q=F.rec(id),sp=q.specs[0][1],p=F.polyArea(q.pts)>0?q.pts.slice().reverse():q.pts,[a,b,c]=F.pitchOrder(p,sp),r=sp.rdir,
  f=(u,v)=>Math.abs((v[0]-u[0])*r[0]+(v[1]-u[1])*r[1])/Math.hypot(v[0]-u[0],v[1]-u[1]);
  return{ok:!!r&&f(a,b)>f(b,c)&&sp.roofSty==='tiles',alongRidge:+f(a,b).toFixed(2),alongEave:+f(b,c).toFixed(2),rdir:r};});
await check('brickTint',()=>{const F=__f,g=F.bld().geometry,C=g.attributes.color.array,S=g.attributes.sty.array,v=F.verts('c3733').filter(i=>S[i]===F.STY.brick),
  t=F.tex.image,W=t.width,d=t.data,T=128,x0=F.STY.brick*T;let tint=0,n=0,neutral=true;
  for(let y=T;y<2*T;y++)for(let x=x0;x<x0+T;x++){const i=(y*W+x)*4;if(d[i+3]<128){n++;const r=d[i],gg=d[i+1],b=d[i+2];if(Math.abs(r-gg)>6||Math.abs(gg-b)>6)neutral=false;}}
  return{ok:v.length>0&&Math.abs(C[v[0]*3]-.86)<1e-5&&Math.abs(C[v[0]*3+2]-.4)<1e-5&&neutral&&n>5000,wall:v.length?[C[v[0]*3],C[v[0]*3+1],C[v[0]*3+2]]:null,neutralAtlas:neutral};});
await check('fences',()=>{const F=__f,r={};F.scene.traverse(m=>{if(m.isInstancedMesh&&m.material.color&&m.userData&&m.count&&m.parent){r[m.material.color.getHexString()]=(r[m.material.color.getHexString()]||0)+m.count;}});
  const want=['c9a26b','2f5226','8a3030','3a2d24'],has=want.map(k=>!!r[k]);return{ok:has.every(Boolean),has,colours:want.map((k,i)=>[k,r[k]||0])};});
await check('dormerFaces',()=>{const F=__f;let g=null;F.scene.traverse(m=>{if(m.name==='fx_dormR')g=m.geometry;});
  const P=g.attributes.position.array,tris=[];for(let i=0;i<P.length;i+=9)tris.push([[P[i],P[i+1],P[i+2]],[P[i+3],P[i+4],P[i+5]],[P[i+6],P[i+7],P[i+8]]]);
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dt=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  // an edge of A pierces the interior of B
  const pierce=(A,B)=>{const n=cr(sub(B[1],B[0]),sub(B[2],B[0])),nl=Math.hypot(...n);if(nl<1e-9)return false;
    for(let k=0;k<3;k++){const p=A[k],q=A[(k+1)%3],dp=dt(n,sub(p,B[0]))/nl,dq=dt(n,sub(q,B[0]))/nl;if(dp*dq>=0||Math.abs(dp)<1e-4||Math.abs(dq)<1e-4)continue;
      const t=dp/(dp-dq),x=[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t];let inside=true;
      for(let e=0;e<3;e++){const a=B[e],b=B[(e+1)%3];if(dt(n,cr(sub(b,a),sub(x,a)))<=1e-6*nl)inside=false;}if(inside)return true;}return false;};
  let cross=0;for(let i=0;i<tris.length;i++)for(let j=0;j<tris.length;j++)if(i!==j&&pierce(tris[i],tris[j]))cross++;
  return{ok:tris.length>0&&cross===0,tris:tris.length,crossings:cross};});
// X artefact: crossing wing roofs used to overhang each other; every part of a multi-wing pitched house is flush with its footprint now
await check('wingEaves',()=>{const F=__f,P=F.bld().geometry.attributes.position.array,C=F.bld().geometry.attributes.color.array,E=[.30,.27,.25];let n=0,over=0,bad=[];
  for(const r of F.FX.recs){if(r.specs.length<2||!r.specs.every(q=>q[1].pitched))continue;n++;const [a,b,c,d]=F.box(r.id),v=F.verts(r.id,0);
    for(const i of v)if(Math.abs(C[i*3]-E[0])<1e-4&&Math.abs(C[i*3+1]-E[1])<1e-4&&(P[i*3]<a-.05||P[i*3]>b+.05||P[i*3+2]<c-.05||P[i*3+2]>d+.05)){over++;bad.push(r.id);break;}
    if(!r.specs.every(q=>q[1].noEave))over++;}
  return{ok:n>0&&over===0,multiWingHouses:n,overhanging:over,bad:bad.slice(0,5)};});
await check('drawCalls',()=>{const names=[];__f.scene.traverse(o=>{if(o.name&&o.name.startsWith('fx_'))names.push(o.name);});return{ok:names.length>0&&names.length<=12,names:names.length};});
// shots
const shots=await p.evaluate(()=>{
  const F=__f,G=F.GY,out={};
  const road=(x,z)=>{let b=null;for(const s of F.world.roadSegs(x,z)){if(s[4].cls>3)continue;const dx=s[2]-s[0],dz=s[3]-s[1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/l2)),px=s[0]+dx*t,pz=s[1]+dz*t,d=Math.hypot(x-px,z-pz);if(!b||d<b[0])b=[d,px,pz];}
    return b?[(b[1]-x)/(b[0]||1),(b[2]-z)/(b[0]||1)]:[0,1];};
  // orbit camera: azimuth in degrees from the direction of the nearest road, radius from the footprint
  const of=(id,key,az,up=1,k=.8)=>{const [a,b,c,d]=F.box(id),x=(a+b)/2,z=(c+d)/2,[dx,dz]=road(x,z),ang=Math.atan2(dz,dx)+az*Math.PI/180,sp=F.rec(id).specs[0][1],R=Math.max(b-a,d-c)*k+9,cx=x+Math.cos(ang)*R,cz=z+Math.sin(ang)*R;
    out[key]=F.view([cx,G(cx,cz)+sp.h*up+(sp.rh||0)*.5+2.5,cz],[x,G(x,z)+sp.h*.6,z]);};
  of('c3828','balcony_off',0);of('c3718','balcony_on',0);of('c3718','balcony_on2',70);
  of('c3799','roof_flat',20,1,.6);of('c3733','brick_tint',20);
  for(const az of[40,130,220,310]){of('c4185','face_mask_'+az,az);of('c4161','blank_gable_'+az,az);}
  for(const az of[0,180])of('c3685','dormer_chimney_'+az,az);
  of('c4251','ridge_across',0);of('c4251','ridge_across2',90);of('c4185','dormer_off',180);of('c4171','chimney_off',90);
  return out;});
// fences: one look at each of the four test fences, camera 5 m back from the middle
const fs2=await p.evaluate(()=>{const F=__f,G=F.GY,out={},fe=[];
  F.scene.traverse(m=>{if(m.isInstancedMesh&&m.material.color&&['c9a26b','2f5226','8a3030','3a2d24'].includes(m.material.color.getHexString())){const E=m.instanceMatrix.array;let x=0,z=0;for(let i=0;i<m.count;i++){x+=E[i*16+12];z+=E[i*16+14];}fe.push([m.material.color.getHexString(),x/m.count,z/m.count]);}});
  for(const [k,x,z] of fe)out['fence_'+k]=F.view([x+0,G(x,z)+2.2,z+7],[x,G(x,z)+.8,z]);
  return out;});
Object.assign(shots,fs2);
for(const [n,u] of Object.entries(shots))fs.writeFileSync(`${out}/${n}.png`,Buffer.from(u.split(',')[1],'base64'));
console.log('shots',Object.keys(shots).join(' ')+' twotone');
console.log(fails.length?'FAIL '+fails.join(','):'PASS');
await b.close();process.exit(fails.length?1:0);
