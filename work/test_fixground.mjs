// ground layering. Flicker = the same still view re-rendered with 10 different near planes: that only changes depth quantisation, so any pixel that changes colour is a coplanar depth fight node test_fixground.mjs page.html [shotdir]   (real GPU via ANGLE/Metal; exits 1 on a failed assertion)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,shotDir]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__g={get world(){return world},get renderer(){return renderer},get camera(){return camera},get scene(){return scene},get wg(){return worldGroup},get GY(){return GY},get S(){return gfxState},ENV,LL,STAD,THREE,
setup(){tod=13;weather.kind='clear';weather.amt=weather.want=0;for(let i=0;i<40;i++)updateEnv(.05);for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;},
put(from,to){const gp=GY(to[0],to[2]);sun.position.set(to[0]+105,gp+85,to[2]+65);sun.target.position.set(to[0],gp,to[2]);sun.target.updateMatrixWorld();camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();player.x=to[0];player.z=to[2];perfT=0;perfTick(.016);updateGrass(.016);},
draw(){updateGrass(.016);gfxRender();},
plain(){const b=scene.background;scene.background=new THREE.Color(1,0,1);renderer.render(scene,camera);scene.background=b;},
hm(cx,cz){if(!grass)buildGrass();grassMap(cx,cz);return grass;}};`;
const tmp=dir+'_fixground.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+tmp);
await p.waitForFunction(()=>window.__g&&__g.world&&__g.world.cars.length,null,{timeout:120000});
await p.waitForFunction(()=>__g.S.comp,null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(1500);
const r=await p.evaluate(({shots})=>{
  const G=__g,W=G.world,gl=G.renderer.getContext(),Wd=gl.drawingBufferWidth,Hd=gl.drawingBufferHeight,gy=(x,z)=>G.GY(x,z),T=G.THREE;
  G.setup();
  const read=()=>{const a=new Uint8Array(Wd*Hd*4);gl.readPixels(0,0,Wd,Hd,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
  const isG=(a,i)=>a[i+1]-a[i]>=12&&a[i+1]-a[i+2]>=25;
  const SL=G.LL(G.STAD.lat,G.STAD.lon),spots=[{name:'stadium',type:'stad',x:SL[0],z:SL[1]}];
  const all=new Map();
  for(const L of W.labels)for(const sg of W.roadSegs(L.x,L.z)){const l=Math.hypot(sg[2]-sg[0],sg[3]-sg[1]);if(sg[4].cls<=2&&!sg[4].unpaved&&l>=28&&sg[4].w>=5)all.set(sg,l);}
  const used=[];
  for(const [s,l] of [...all.entries()].sort((a,b)=>a[0][4].cls-b[0][4].cls||b[1]-a[1])){const x=(s[0]+s[2])/2,z=(s[1]+s[3])/2;if(used.some(u=>Math.hypot(u[0]-x,u[1]-z)<260))continue;used.push([x,z]);
    spots.push({name:'road'+used.length,type:'road',x:s[0],z:s[1],L:l,dx:(s[2]-s[0])/l,dz:(s[3]-s[1])/l});if(used.length>=6)break;}
  // places where the old build drew green sheet above the road surface
  const bleed=[[451,644.8],[994,-195.3],[994.6,-162.4],[-722.2,-777.7]].map(([x,z],i)=>{const sg=W.roadSegs(x,z).filter(s=>s[4].cls<=4).sort((a,c)=>{const d=s=>{const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t);};return d(a)-d(c);})[0],l=Math.hypot(sg[2]-sg[0],sg[3]-sg[1]);const dx=(sg[2]-sg[0])/l,dz=(sg[3]-sg[1])/l,t=Math.max(0,Math.min(l,(x-sg[0])*dx+(z-sg[1])*dz));return{name:'sheet'+(i+1),x:sg[0]+dx*t,z:sg[1]+dz*t,dx,dz,hw:sg[4].w/2,t0:-t,t1:l-t};});
  const out={flick:[],bleed:[],gap:[]};const imgs={};
  const view=(s,hh)=>{
    if(s.type==='stad'){const k=hh<2?60:hh<10?45:70;return[[s.x+k*.8,gy(s.x,s.z)+hh+(hh<2?1.7:0),s.z+k*.6],[s.x,gy(s.x,s.z)+(hh>10?0:1),s.z]];}
    const back=hh<2?10:hh*1.2+8,fx=s.x-s.dx*back,fz=s.z-s.dz*back,f=Math.min(s.L||99,hh<2?25:hh*.5),tx=s.x+s.dx*f,tz=s.z+s.dz*f;
    return[[fx,gy(fx,fz)+hh,fz],[tx,gy(tx,tz)+(hh<2?1:0),tz]];};
  for(const s of spots)for(const [hn,hh] of [['driver',1.3],['5m',5],['40m',40]]){
    const [from,to]=view(s,hh);G.put(from,to);for(let i=0;i<4;i++)G.draw();
    const fr=[],near=G.camera.near;for(const k of [1,1.07,1.15,1.25,1.4,1.6,1.9,2.2,2.6,3]){G.camera.near=near*k;G.camera.updateProjectionMatrix();G.plain();fr.push(read());}G.camera.near=near;G.camera.updateProjectionMatrix();
    let fl=0;const tot=Wd*Hd;
    for(let i=0;i<tot;i++){const q=i*4;for(let k=1;k<fr.length;k++)if(Math.abs(fr[k][q]-fr[0][q])+Math.abs(fr[k][q+1]-fr[0][q+1])+Math.abs(fr[k][q+2]-fr[0][q+2])>30){fl++;break;}}
    if(shots&&fl/tot>=.0005){const mk=new Uint8ClampedArray(tot*4);for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++){const q=(y*Wd+x)*4,o2=((Hd-1-y)*Wd+x)*4;let c=false;for(let k=1;k<fr.length;k++)if(Math.abs(fr[k][q]-fr[0][q])+Math.abs(fr[k][q+1]-fr[0][q+1])+Math.abs(fr[k][q+2]-fr[0][q+2])>30){c=true;break;}
      mk[o2]=c?255:fr[0][q]>>1;mk[o2+1]=c?0:fr[0][q+1]>>1;mk[o2+2]=c?0:fr[0][q+2]>>1;mk[o2+3]=255;}
      const cv=document.createElement('canvas');cv.width=Wd;cv.height=Hd;cv.getContext('2d').putImageData(new ImageData(mk,Wd,Hd),0,0);imgs['FL_'+s.name+'_'+hn]=cv.toDataURL('image/png');}
    G.plain();const pl=read();let gap=0;for(let y=0;y<Math.floor(Hd*.45);y++)for(let x=0;x<Wd;x++){const q=(y*Wd+x)*4;if(pl[q]>240&&pl[q+1]<16&&pl[q+2]>240)gap++;}
    out.flick.push({spot:s.name,h:hn,pct:+(fl/tot*100).toFixed(4)});out.gap.push({spot:s.name,h:hn,px:gap});
    if(shots)imgs[s.name+'_'+hn]=(G.draw(),G.renderer.domElement.toDataURL('image/png'));
  }
  // green pixels on the road surface at driver height, around the old problem spots (and an unfogged window of the road centre)
  const v=new T.Vector3();
  for(const s of bleed){const back=7,fx=s.x-s.dx*back,fz=s.z-s.dz*back;G.put([fx,gy(fx,fz)+1.3,fz],[s.x,gy(s.x,s.z),s.z]);for(let i=0;i<4;i++)G.draw();const a=read();let n=0,g=0;
    for(let d=Math.max(-4,s.t0);d<=Math.min(4,s.t1);d+=.25)for(const k of[-.6,-.3,0,.3,.6]){const l=k*s.hw,px=s.x+s.dx*d-s.dz*l,pz=s.z+s.dz*d+s.dx*l;v.set(px,gy(px,pz)+.07,pz).project(G.camera);if(v.z>1||Math.abs(v.x)>.98||Math.abs(v.y)>.98)continue;
      const q=(Math.floor((v.y+1)/2*Hd)*Wd+Math.floor((v.x+1)/2*Wd))*4;n++;if(isG(a,q))g++;}
    out.bleed.push({spot:s.name,pts:n,green:g});if(shots)imgs[s.name]=G.renderer.domElement.toDataURL('image/png');}
  // blade map: texels the grass shader would grow on, over road footprints near 40 random road points and over the stadium oval
  const buf=new Uint16Array(448*448*4),segs=new Set();for(const L of W.labels)for(const s of W.roadSegs(L.x,L.z))if(s[4].cls<=4)segs.add(s);
  const sl=[...segs];let a0=12345;const rnd=()=>(a0=(a0*1664525+1013904223)>>>0)/4294967296;
  const cs=[{x:SL[0],z:SL[1],st:1},...bleed];while(cs.length<41){const s=sl[Math.floor(rnd()*sl.length)];cs.push({x:s[0],z:s[1]});}
  let rn=0,rg=0,fn=0,fg=0;
  for(const c of cs){const g=G.hm(c.x,c.z);G.renderer.readRenderTargetPixels(g.rt,0,0,448,448,buf);
    const at=(x,z)=>{const u=(x-c.x)/140+.5,w=(c.z-z)/140+.5;if(u<0||u>=1||w<0||w>=1)return null;return T.DataUtils.fromHalfFloat(buf[(Math.floor(w*448)*448+Math.floor(u*448))*4+1]);};
    for(const s of W.roadSegs(c.x,c.z)){const r=s[4];if(r.cls>4||r.unpaved)continue;const l=Math.hypot(s[2]-s[0],s[3]-s[1]);if(l<.5)continue;const dx=(s[2]-s[0])/l,dz=(s[3]-s[1])/l;
      for(let d=0;d<=l;d+=.7)for(const k of[-.7,-.35,0,.35,.7]){const q=at(s[0]+dx*d-dz*k*r.w/2,s[1]+dz*d+dx*k*r.w/2);if(q==null)continue;rn++;if(q>=.5)rg++;}}
    if(c.st){const br=G.STAD.brg*Math.PI/180,ux=Math.sin(br),uz=-Math.cos(br),vx=-Math.cos(br),vz=-Math.sin(br);
      for(let u=-40;u<=40;u++)for(let w=-25;w<=25;w++){const q=at(SL[0]+u*ux+w*vx,SL[1]+u*uz+w*vz);if(q==null)continue;fn++;if(q>=.5)fg++;}}}
  out.blade={roadTexels:rn,roadGrass:rg,roadPct:+(rg/rn*100).toFixed(4),fieldTexels:fn,fieldGrass:fg};
  // geometry: every up-facing triangle of a non-green layer (centroid) against the green sheet and the ground mesh beneath it
  {const tris=o=>{const g=o.geometry,P=g.attributes.position,I=g.index,n=(I?I.count:P.count)/3,a=new Float32Array(n*9);for(let t=0;t<n;t++)for(let q=0;q<3;q++){const i=I?I.getX(t*3+q):t*3+q;a[t*9+q*3]=P.getX(i);a[t*9+q*3+1]=P.getY(i);a[t*9+q*3+2]=P.getZ(i);}return a;};
   const GRm=[],oth=[];let gm=null;G.wg.children.forEach(o=>{const g=o.geometry;if(!o.isMesh||o.isInstancedMesh||!g||!g.attributes.position||g.attributes.sty)return;if(o.userData.grass)g.parameters?gm=o:GRm.push(o);else oth.push(o);});
   const gr=GRm.map(tris),C=24,key=(i,j)=>i*100000+j,grid=new Map();
   gr.forEach((a,ai)=>{for(let t=0;t<a.length/9;t++){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(let q=0;q<3;q++){x0=Math.min(x0,a[t*9+q*3]);x1=Math.max(x1,a[t*9+q*3]);z0=Math.min(z0,a[t*9+q*3+2]);z1=Math.max(z1,a[t*9+q*3+2]);}
     for(let i=Math.floor(x0/C);i<=Math.floor(x1/C);i++)for(let j=Math.floor(z0/C);j<=Math.floor(z1/C);j++){const k=key(i,j);(grid.get(k)||grid.set(k,[]).get(k)).push([ai,t]);}}});
   const grH=(x,z)=>{let best=-1e9;for(const [ai,t] of grid.get(key(Math.floor(x/C),Math.floor(z/C)))||[]){const a=gr[ai],b=t*9,d=(a[b+5]-a[b+8])*(a[b]-a[b+6])+(a[b+6]-a[b+3])*(a[b+2]-a[b+8]);if(Math.abs(d)<1e-9)continue;
     const l0=((a[b+5]-a[b+8])*(x-a[b+6])+(a[b+6]-a[b+3])*(z-a[b+8]))/d,l1=((a[b+8]-a[b+2])*(x-a[b+6])+(a[b]-a[b+6])*(z-a[b+8]))/d,l2=1-l0-l1;if(l0>=0&&l1>=0&&l2>=0)best=Math.max(best,l0*a[b+1]+l1*a[b+4]+l2*a[b+7]);}return best>-1e8?best:null;};
   const gg=gm.geometry,gp=gg.attributes.position,nx=gg.parameters.widthSegments,nz=gg.parameters.heightSegments,gw=gg.parameters.width,gd=gg.parameters.height,sx=gw/nx,sz=gd/nz,row=nx+1;
   const gh=(x,z)=>{const fx=(x+gw/2)/sx,fz=(z+gd/2)/sz,ix=Math.floor(fx),iz=Math.floor(fz);if(ix<0||iz<0||ix>=nx||iz>=nz)return null;const u=fx-ix,v=fz-iz,a=iz*row+ix,b=a+row,d=a+1,c=b+1,lo=u+v<=1,e=lo?a:c,ha=gp.getZ(e),hb=gp.getZ(b),hd=gp.getZ(d);return lo?ha+(hd-ha)*u+(hb-ha)*v:ha+(hb-ha)*(1-u)+(hd-ha)*(1-v);};
   let n=0,gOver=0,worst=0,field=0,fieldOver=0;
   for(const o of oth){const a=tris(o),isF=!!(o.material.polygonOffsetUnits===-4&&o.material.map);
     for(let t=0;t<a.length;t+=9){if((a[t+5]-a[t+2])*(a[t+6]-a[t])-(a[t+3]-a[t])*(a[t+8]-a[t+2])<=0)continue;
       const cx=(a[t]+a[t+3]+a[t+6])/3,cz=(a[t+2]+a[t+5]+a[t+8])/3,cy=(a[t+1]+a[t+4]+a[t+7])/3,g=grH(cx,cz);if(g!=null){n++;if(g>cy-.004){gOver++;worst=Math.max(worst,g-cy);}}
       if(isF){const q=gh(cx,cz);if(q!=null){field++;if(q>cy-.004)fieldOver++;}}}}
   let gnd=0,gndOver=0;for(const a of gr)for(let t=0;t<a.length;t+=9){const cx=(a[t]+a[t+3]+a[t+6])/3,cz=(a[t+2]+a[t+5]+a[t+8])/3,q=gh(cx,cz);if(q!=null){gnd++;if(q>(a[t+1]+a[t+4]+a[t+7])/3-.004)gndOver++;}}
   out.geo={layerTris:n,greenAboveLayer:gOver,worstCm:+(worst*100).toFixed(1),fieldTris:field,groundAboveField:fieldOver,greenTris:gnd,groundAboveGreen:gndOver};}
  out.imgs=imgs;return out;
},{shots:!!shotDir});
const imgs=r.imgs;delete r.imgs;
if(shotDir){fs.mkdirSync(shotDir,{recursive:true});for(const [n,u] of Object.entries(imgs))fs.writeFileSync(`${shotDir}/${n}.png`,Buffer.from(u.split(',')[1],'base64'));}
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};
const fl=r.flick.filter(x=>x.pct>=.05);check('flicker < 0.05% of pixels over 10 near-plane renders (stadium + 6 roads x 3 heights)',!fl.length,{worst:Math.max(...r.flick.map(x=>x.pct)),over:fl});
check('no green on road surface at the old problem spots (driver height)',r.bleed.every(x=>x.green===0),r.bleed);
check('blade map: no grass texels on the stadium oval',r.blade.fieldGrass===0,{fieldGrass:r.blade.fieldGrass,of:r.blade.fieldTexels});
check('blade map: < 0.001% of road texels grass',r.blade.roadPct<.001,{roadGrass:r.blade.roadGrass,of:r.blade.roadTexels});
check('green sheet never at or above a road, water or field surface',r.geo.greenAboveLayer===0,r.geo);
check('ground mesh never at or above the green sheet or the stadium field',r.geo.groundAboveGreen===0&&r.geo.groundAboveField===0,r.geo);
const gp=r.gap.filter(x=>x.px>0);check('no sky or underground showing in the ground half of the frame',!gp.length,{gaps:gp});
check('no page errors',!errs.length,errs.slice(0,3));
console.log(fails?'FAILED '+fails:'PASS');
await b.close();process.exit(fails?1:0);
