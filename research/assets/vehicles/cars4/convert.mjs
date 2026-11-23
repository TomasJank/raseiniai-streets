// GLB -> game frame for cars4: node convert.mjs key [key ...]   (no key = every model in models.json not marked dropped)
// Reads the Sketchfab download {i}.glb (src/ here, else research/assets/sketchfab/glb/), parses it with three's GLTFLoader
// in headless Chrome (parse only, nothing in the file is executed) and writes into pipeline/cars4/:
//   {key}.bin       body + one wheel (for a detailed model: the distant version)
//   {key}_hi.bin    detailed models only: the close-up body + wheel, deflated
//   {key}.jpg       one 512 px texture atlas        {key}_mask.png  256 px paint mask
//   fleet.json      the model's entry
// Scale from the real length, tyres on y=0, centred, nose to +z.
// models.json, per model: i (download number), key, name, L (real length, m), WB (wheelbase, m; only used when the wheels
// are cut out of the body), author/credit (for the credit line), and where needed:
//   flip 1        the nose points backwards in the file            yaw deg      the body is turned in the file
//   node "name"   use only this node's subtree (a file with several cars)   box [x0,x1,z0,z1]  or only meshes centred in this box
//   crop [x0,x1,z0,z1]  or only the triangles centred in this box (several cars sharing meshes); with it, noShadow y drops large flat triangles below y (a shadow card)
//   drop / keep   regex on "mesh-name material-name": leave these out / use only these
//   glass regex   these become dark opaque glass (see-through untextured glass does anyway)
//   paintMat regex  the body paint materials: flat ones are stored grey and coloured in the game, so every colour is clean
//   own "#hex"   flat paint only: the colour the car shows as its own, in place of the file's (a garish file colour)
//   lampFaces [[d,x0,y0,x1,y1,kind]]  lamp faces over a lamp that is only a dark patch in the texture (d 1 front, -1 back; outer side, mirrored)
//   tone dark|light  texture paint that only repaints cleanly in dark (or light) colours: the others show the model's own
//   noPaint 1     never recolour (liveried bus)                    tex0 1       the file's texture is not wired to its material
//   split regex   meshes holding several wheels: split into connected pieces first
//   hub 1         parts reaching into a wheel (hub, brake) are split at the tyre: the inside turns with the wheel
//   cut 1         wheels are fused into the body: cut them out     wheelMax m   tallest tyre accepted as a wheel (default .9)
//   fixed 1       leave the wheels in the body (a vehicle that only stands)
//   DEBUG=1 (env) prints every part and every lamp candidate
//   lod 1 | [close, far]  detailed model: drop what cannot be seen from outside, then reduce to two triangle budgets
//   police 1      the police car: never in the traffic mix, liveried in the game (cars4.js)
//   wheelFrom key, wheelR m, wheel2side 1, lift [...], legacy 1 (the 2026-11-11 layout, kept so the Audi 80 and Primera stay as checked)
import {createRequire} from 'module';import fs from 'fs';import zlib from 'zlib';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const here=new URL('.',import.meta.url).pathname,out0=here+'../../../../pipeline/cars4/',out=process.env.OUT||out0;
const cfg=JSON.parse(fs.readFileSync(here+'models.json','utf8')),only=process.argv.slice(2);
const html=`<html><body><script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/"}}</script>
<script type="module">import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {MeshoptSimplifier} from 'https://cdn.jsdelivr.net/npm/meshoptimizer@1.3.0/meshopt_simplifier.js';
await MeshoptSimplifier.ready;window.THREE=THREE;window.GLTFLoader=GLTFLoader;window.Simp=MeshoptSimplifier;window.ready=1;</script></body></html>`;
fs.writeFileSync(here+'_convert.html',html);
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='log')console.log('  '+m.text());});
await p.goto('file://'+here+'_convert.html');await p.waitForFunction(()=>window.ready);
const fleet=fs.existsSync(out+'fleet.json')?JSON.parse(fs.readFileSync(out+'fleet.json','utf8')):{};

async function page([glb,m]){
  const T=THREE,bin=Uint8Array.from(atob(glb),c=>c.charCodeAt(0)).buffer;
  const g=await new GLTFLoader().parseAsync(bin,'');g.scene.updateMatrixWorld(true);
  const root=m.node?g.scene.getObjectByName(m.node):g.scene;if(!root)throw new Error('no node '+m.node);
  const rx=s=>s?new RegExp(s,'i'):null,dropR=rx(m.drop),keepR=rx(m.keep),glassR=rx(m.glass),paintR=rx(m.paintMat);
  const tex0=m.tex0?await g.parser.getDependency('texture',0):null;
  // three no longer reads KHR_materials_pbrSpecularGlossiness: take its diffuse texture and colour as the base colour
  const sg=new Map();for(const[mt,a]of g.parser.associations){const e=a&&a.materials!=null&&mt.isMaterial&&((g.parser.json.materials[a.materials].extensions||{}).KHR_materials_pbrSpecularGlossiness);
    if(!e||mt.map)continue;const c=mt.clone();if(e.diffuseTexture)c.map=await g.parser.getDependency('texture',e.diffuseTexture.index);if(e.diffuseFactor)c.color.setRGB(...e.diffuseFactor.slice(0,3));sg.set(mt,c);}
  let parts=[];
  root.traverse(o=>{if(!o.isMesh||!o.visible)return;let mat=Array.isArray(o.material)?o.material[0]:o.material;const tag=o.name+' '+mat.name;
    if((dropR&&dropR.test(tag))||(keepR&&!keepR.test(tag)))return;
    let geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!geo.attributes.normal)geo.computeVertexNormals();
    // a mirrored node (negative scale) turns its triangles inside out once the transform is baked in
    if(!m.legacy&&o.matrixWorld.determinant()<0){geo=geo.toNonIndexed();for(const A of Object.values(geo.attributes)){const it=A.itemSize;for(let t=0;t<A.count;t+=3)for(let c=0;c<it;c++){const x=A.array[(t+1)*it+c];A.array[(t+1)*it+c]=A.array[(t+2)*it+c];A.array[(t+2)*it+c]=x;}}}
    if(!m.legacy&&geo.index)geo=geo.toNonIndexed();
    if(m.box){geo.computeBoundingBox();const c=geo.boundingBox.getCenter(new T.Vector3()),[x0,x1,z0,z1]=m.box;if(c.x<x0||c.x>x1||c.z<z0||c.z>z1)return;}
    // hand-painted unlit models keep their colours in the emissive slot
    if(!mat.map&&mat.emissiveMap){mat=mat.clone();mat.map=mat.emissiveMap;mat.color.setRGB(1,1,1);}
    if(sg.has(mat))mat=sg.get(mat);
    if(!mat.map&&tex0){mat=mat.clone();mat.map=tex0;}
    // a file with several cars: keep the triangles centred in the crop box [x0,x1,z0,z1] (file units)
    if(m.crop){const a=geo.attributes.position,[x0,x1,z0,z1]=m.crop,keep=[];for(let t=0;t<a.count;t+=3){const x=(a.getX(t)+a.getX(t+1)+a.getX(t+2))/3,z=(a.getZ(t)+a.getZ(t+1)+a.getZ(t+2))/3;
        // a baked shadow card under the car: a large triangle lying at the very bottom
        const flat=m.noShadow&&Math.max(a.getY(t),a.getY(t+1),a.getY(t+2))<m.noShadow&&Math.abs((a.getX(t+1)-a.getX(t))*(a.getZ(t+2)-a.getZ(t))-(a.getX(t+2)-a.getX(t))*(a.getZ(t+1)-a.getZ(t)))>.04;
        if(x>=x0&&x<=x1&&z>=z0&&z<=z1&&!flat)keep.push(t);}
      const o=new T.BufferGeometry();for(const[k,A]of Object.entries(geo.attributes)){const it=A.itemSize,arr=new Float32Array(keep.length*3*it);keep.forEach((t,j)=>{for(let v=0;v<3*it;v++)arr[j*3*it+v]=A.array[t*it+v];});o.setAttribute(k,new T.BufferAttribute(arr,it));}
      geo=o;if(!keep.length)return;}
    parts.push({geo,mat,name:o.name,tag,paint:!!(paintR&&paintR.test(mat.name))});});
  if(!parts.length)throw new Error('no meshes');
  // see-through glass (untextured, or a textured window mesh) is drawn opaque here, so it becomes dark tinted glass
  const GLASS=new T.Color().setRGB(.12,.15,.18,T.SRGBColorSpace);
  for(const q of parts)if(!q.paint&&((q.mat.transparent&&(!q.mat.map||/window|glass/i.test(m.legacy?q.name:q.tag)))||(glassR&&glassR.test(q.tag)))){q.c0=q.mat.color.clone();q.mat=q.mat.clone();q.mat.map=null;q.mat.color.copy(GLASS);q.glass=true;}
  // nose to +z: the configured yaw, the long axis on z, then the configured half turn
  const box=new T.Box3(),fit=()=>{box.makeEmpty();for(const q of parts){q.geo.computeBoundingBox();box.union(q.geo.boundingBox);}};
  if(m.yaw){const Y=new T.Matrix4().makeRotationY(m.yaw*Math.PI/180);for(const q of parts)q.geo.applyMatrix4(Y);}
  fit();const sz=box.getSize(new T.Vector3()),R=new T.Matrix4();if(sz.x>sz.z)R.makeRotationY(Math.PI/2);if(m.flip)R.premultiply(new T.Matrix4().makeRotationY(Math.PI));
  for(const q of parts)q.geo.applyMatrix4(R);
  fit();const s=m.L/(box.max.z-box.min.z),c=box.getCenter(new T.Vector3()),M=new T.Matrix4().makeScale(s,s,s).multiply(new T.Matrix4().makeTranslation(-c.x,-box.min.y,-c.z));
  for(const q of parts)q.geo.applyMatrix4(M);fit();
  if(m.debug)for(const q of parts){const b=q.geo.boundingBox||(q.geo.computeBoundingBox(),q.geo.boundingBox);console.log(['part',q.tag,q.mat.transparent?'T'+(+q.mat.opacity).toFixed(2):'-',q.mat.map?'map':'-','#'+q.mat.color.getHexString(),q.glass?'GLASS':'',q.paint?'PAINT':'',
    'x',b.min.x.toFixed(2),b.max.x.toFixed(2),'y',b.min.y.toFixed(2),b.max.y.toFixed(2),'z',b.min.z.toFixed(2),b.max.z.toFixed(2),'n',q.geo.attributes.position.count/3].join(' '));}

  // ---- wheels ----
  // connected pieces of a mesh (triangles joined by shared corners), as lists of first-vertex offsets in the non-indexed copy
  const pieces=geo=>{const g=geo.index?geo.toNonIndexed():geo,a=g.attributes.position,nt=a.count/3,up=Array.from({length:nt},(_,i)=>i),key=new Map();
    const rt=i=>{while(up[i]!==i)i=up[i]=up[up[i]];return i;};
    for(let t=0;t<nt;t++)for(let k=0;k<3;k++){const id=[a.getX(t*3+k),a.getY(t*3+k),a.getZ(t*3+k)].map(v=>Math.round(v*1000)).join(),o=key.get(id);if(o===undefined)key.set(id,t);else up[rt(t)]=rt(o);}
    const comp=new Map();for(let t=0;t<nt;t++){const r0=rt(t);if(!comp.has(r0))comp.set(r0,[]);comp.get(r0).push(t*3);}return{g,list:[...comp.values()]};};
  const sub=(g,L)=>{const o=new T.BufferGeometry();for(const k of['position','normal','uv']){const src=g.attributes[k];if(!src)continue;const it=src.itemSize,arr=new Float32Array(L.length*3*it);
    L.forEach((t,j)=>{for(let v=0;v<3;v++)for(let c=0;c<it;c++)arr[(j*3+v)*it+c]=src.array[(t+v)*it+c];});o.setAttribute(k,new T.BufferAttribute(arr,it));}return o;};
  // a mesh holding all four tyres (or rims) is split into its connected pieces first, so each tyre can be found on its own
  if(m.split){const R0=new RegExp(m.split,'i');parts=parts.flatMap(q=>{if(!R0.test(q.tag))return[q];const{g:ng,list}=pieces(q.geo);
    return list.map(L=>{const o=sub(ng,L);o.computeBoundingBox();return{...q,geo:o};});});}
  // low parts round in side view and thin across, grouped by centre; four groups or none
  const wmax=m.wheelMax||.9,shape=q=>{const b=q.geo.boundingBox,dy=b.max.y-b.min.y,dz=b.max.z-b.min.z,dx=b.max.x-b.min.x;return dy>.4&&dy<wmax&&dz/dy>.75&&dz/dy<1.33&&dx<.7*dy;};
  // the ground is where the tyres stand: some downloads carry something lower (a liner, a shadow card)
  const low=m.legacy?0:Math.min(1e9,...parts.filter(shape).map(q=>q.geo.boundingBox.min.y));
  const cand=m.fixed?[]:parts.filter(q=>shape(q)&&q.geo.boundingBox.min.y<(low>1?0:low)+.06);
  const grp=[];for(const q of cand){const ce=q.geo.boundingBox.getCenter(new T.Vector3());let G=grp.find(G=>G.c.distanceTo(ce)<.15);if(!G)grp.push(G={c:ce,p:[]});G.p.push(q);}
  let wheel=null,axles=[0,0],track=0,r=0,cutInfo=null;
  if(m.fixed){}
  else if(grp.length===4&&!m.cut){
    if(!m.legacy){
      for(const G of grp){G.b=new T.Box3();for(const q of G.p)G.b.union(q.geo.boundingBox);G.c=G.b.getCenter(new T.Vector3());G.r=(G.b.max.y-G.b.min.y)/2;}
      // whatever else sits wholly inside a tyre's cylinder (rim, hub cap, brake disc) is part of that wheel and turns with it
      const inCyl=(G,x,y,z)=>x>G.b.min.x-.1&&x<G.b.max.x+.1&&Math.hypot(y-G.c.y,z-G.c.z)<G.r*1.04;
      const near=(G,bb)=>bb.max.x>G.b.min.x-.1&&bb.min.x<G.b.max.x+.1&&bb.max.y>G.c.y-G.r&&bb.min.y<G.c.y+G.r&&bb.max.z>G.c.z-G.r&&bb.min.z<G.c.z+G.r;
      const extra=[];
      for(const q of parts){if(cand.includes(q)||!grp.some(G=>near(G,q.geo.boundingBox)))continue;
        const{g:ng,list}=pieces(q.geo),a=ng.attributes.position,stay=[],per=grp.map(()=>[]);
        // hub 1: a hub or brake joined to the suspension goes with the wheel triangle by triangle (it sits inside the turning wheel)
        for(const L of m.hub?list.flat().map(t=>[t]):list){const k=grp.findIndex(G=>L.every(t=>[0,1,2].every(v=>inCyl(G,a.getX(t+v),a.getY(t+v),a.getZ(t+v)))));if(k<0)stay.push(...L);else per[k].push(...L);}
        if(!per.some(l=>l.length))continue;
        q.gone=true;if(stay.length)extra.push({...q,geo:sub(ng,stay),gone:false});
        per.forEach((l,k)=>{if(l.length){const w={...q,geo:sub(ng,l),gone:false};w.geo.computeBoundingBox();grp[k].p.push(w);extra.push(w);}});}
      parts=parts.filter(q=>!q.gone).concat(extra);for(const q of parts)if(!q.geo.boundingBox)q.geo.computeBoundingBox();
      const dy=Math.min(...grp.map(G=>G.b.min.y));if(Math.abs(dy)>1e-4){for(const q of parts){q.geo.translate(0,-dy,0);q.geo.computeBoundingBox();}for(const G of grp){G.c.y-=dy;G.b.translate(new T.Vector3(0,-dy,0));}}
      fit();}
    let fr=grp.reduce((a,G)=>G.c.x>0&&(!a||G.c.z>a.c.z)?G:a,null);
    // a download posed with its front wheels steered: that wheel, drawn at all four corners, sat turned on every one (Accord 15, Punto 25 degrees);
    // the rear right wheel is straight
    const rr=grp.reduce((a,G)=>G.c.x>0&&(!a||G.c.z<a.c.z)?G:a,null),wx=G=>G.b?G.b.max.x-G.b.min.x:0;
    if(rr&&wx(fr)>wx(rr)+.03){console.log('  front wheel steered ('+wx(fr).toFixed(3)+' m across, rear '+wx(rr).toFixed(3)+'): the rear right wheel is the wheel');fr=rr;}
    for(const G of grp)for(const q of G.p)q.wheel=true;
    const wb=new T.Box3();for(const q of fr.p)wb.union(q.geo.boundingBox);const wc=m.legacy?wb.getCenter(new T.Vector3()):fr.c;
    for(const q of fr.p){q.fr=true;q.geo=q.geo.clone().translate(-wc.x,-wc.y,-wc.z);}
    wheel=fr.p;r=m.legacy?(wb.max.y-wb.min.y)/2:fr.r;
    const zs=grp.map(G=>G.c.z).sort((a,b)=>b-a);axles=[(zs[0]+zs[1])/2,(zs[2]+zs[3])/2];track=grp.reduce((a,G)=>a+Math.abs(G.c.x),0)/4;}
  else{
    // wheels fused into the body: fit each axle's tyre as the circle that touches the ground and passes through the most
    // vertices out at the sides, cut every piece lying inside that cylinder, and keep the front-right cut as the wheel
    const hw=(box.max.x-box.min.x)/2,V=[];for(const q of parts){const a=q.geo.attributes.position;for(let i=0;i<a.count;i++)if(Math.abs(a.getX(i))>.45*hw)V.push([a.getX(i),a.getY(i),a.getZ(i)]);}
    const fitC=z0=>{let best=[0,0,0];for(let rr=.24;rr<=.4;rr+=.0025)for(let zc=z0-.2;zc<=z0+.2;zc+=.005){let n=0;for(const v of V)if(Math.abs(Math.hypot(v[1]-rr,v[2]-zc)-rr)<.008)n++;if(n>best[0])best=[n,rr,zc];}return best;};
    const z0=[box.max.z-m.L*.205,box.max.z-m.L*.205-m.WB],F=z0.map(fitC);r=(F[0][1]+F[1][1])/2;axles=F.map(f=>f[2]);
    const ring=V.filter(v=>v[0]>0&&F.some(f=>Math.abs(Math.hypot(v[1]-f[1],v[2]-f[2])-f[1])<.008)),xin=Math.min(...ring.map(v=>v[0])),xout=Math.max(...ring.map(v=>v[0]));
    track=(xin+xout)/2;
    const inside=(x,y,z,f)=>Math.abs(x)>.3*hw&&Math.hypot(y-f[1],z-f[2])<f[1]+.03;
    const next=[];wheel=[];
    for(const q of parts){const{g:ng,list}=pieces(q.geo),a=ng.attributes.position,K=[],C=[];
      for(const L of list){const f=F.find(f=>L.every(t=>[0,1,2].every(k=>inside(a.getX(t+k),a.getY(t+k),a.getZ(t+k),f))));
        if(!f)K.push(...L);else if(f===F[0]&&a.getX(L[0])>0)C.push(...L);}
      next.push({...q,geo:sub(ng,K)});if(C.length)wheel.push({...q,geo:sub(ng,C).translate(-track,-r,-axles[0]),wheel:true,fr:true});}
    parts=next.concat(wheel);for(const q of parts)q.geo.computeBoundingBox();
    cutInfo={fit:F.map(f=>[f[0],+f[1].toFixed(3),+f[2].toFixed(3)]),xin:+xin.toFixed(3),xout:+xout.toFixed(3),wheelTris:wheel.reduce((a,q)=>a+q.geo.attributes.position.count/3,0)};
    if(!wheel.length)wheel=null;}
  let body=parts.filter(q=>!q.wheel&&q.geo.attributes.position.count);wheel=wheel&&wheel.filter(q=>q.geo.attributes.position.count);

  // ---- lamps: a lamp lens is not a window ----
  // Untextured pieces (connected parts of a mesh) at the nose or tail, at lamp height and off the centre line are lamps:
  // a clear see-through lens over something light (a reflector, a lamp texture) goes, so that shows; over something dark
  // or nothing it is drawn as the lamp; a red or amber lens (by colour, or by name where its colour says nothing) is that lamp;
  // a lens with nothing behind it, and every flat white, red or amber lamp piece, is drawn with a lamp pattern (a bright
  // reflector at the front, a ribbed red or amber lens) projected across the piece. Windows stay dark glass.
  const lampsAt={1:[],[-1]:[]};let lampPat=false;
  if(!m.legacy){
    const H0=box.max.y,zF=box.max.z,zB=box.min.z,hsl={},solid=[];
    // what lies behind a lens, as the lightness it shows (the texel under each vertex for a textured part)
    const pix=new Map(),texel=(t,u,v)=>{let e=pix.get(t.image);if(!e){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.drawImage(t.image,0,0,128,128);pix.set(t.image,e=x.getImageData(0,0,128,128).data);}
      u=u*t.repeat.x+t.offset.x;v=v*t.repeat.y+t.offset.y;u-=Math.floor(u);v-=Math.floor(v);const o=(Math.min(127,v*128|0)*128+Math.min(127,u*128|0))*4;return(.3*e[o]+.59*e[o+1]+.11*e[o+2])/255;};
    for(const q of body)if(!q.glass){const a=q.geo.attributes.position,uv=q.geo.attributes.uv,t=q.mat.map&&q.mat.map.image?q.mat.map:null;q.mat.color.getHSL(hsl,T.SRGBColorSpace);const L0=hsl.l;
      for(let i=0;i<a.count;i+=3)solid.push(a.getX(i),a.getY(i),a.getZ(i),t&&uv?texel(t,uv.getX(i),uv.getY(i)):L0);}
    const behind=(b,d)=>{let n=0,l=0;for(let i=0;i<solid.length;i+=4){const x=solid[i],y=solid[i+1],z=solid[i+2];
      if(x>b.min.x+.01&&x<b.max.x-.01&&y>b.min.y+.01&&y<b.max.y-.01&&(d>0?z<b.max.z+.005&&z>b.min.z-.3:z>b.min.z-.005&&z<b.max.z+.3)){n++;l+=solid[i+3];}}return n?l/n:-1;};
    const kind=(c,d)=>{c.getHSL(hsl,T.SRGBColorSpace);const h=hsl.h*360;if(hsl.s>.45&&hsl.l>.15&&hsl.l<.8)return h<18||h>335?'tail':h<55?'amber':null;return hsl.l>.6&&hsl.s<.3?(d>0?'head':'reverse'):null;};
    // a lens whose own colour does not say (black or white base colour) is named for it: red glass only counts at the tail
    const RED=/vermelh|\bred|_red|red_|rouge|\brot|tail|brake|stop/i,AMBER=/laranja|orange|amber|blink|indicat|turn|signal/i;
    const next=[];
    for(const q of body){if(q.mat.map||q.paint){next.push(q);continue;}
      const{g:ng,list}=pieces(q.geo),stay=[];
      for(const L of list){const pb=new T.Box3();const a=ng.attributes.position;for(const t of L)for(let v=0;v<3;v++)pb.expandByPoint(new T.Vector3(a.getX(t+v),a.getY(t+v),a.getZ(t+v)));
        const d=pb.min.z>zF-.7?1:pb.max.z<zB+.7?-1:0,cxp=(pb.min.x+pb.max.x)/2;
        const ok=d&&pb.max.z-pb.min.z<.6&&pb.max.x-pb.min.x<.8&&Math.max(pb.max.x-pb.min.x,pb.max.y-pb.min.y)>.05&&Math.abs(cxp)>.22&&pb.max.y<.78*H0&&pb.min.y>.12;
        let k=null;if(ok){const tint=q.glass&&(q.c0&&kind(q.c0,d)||(d<0&&RED.test(q.tag)?'tail':AMBER.test(q.tag)?'amber':null));
          // a red or amber lens is the lamp's colour; a clear one goes when something lies behind it
          k=q.glass?(tint==='tail'||tint==='amber'?tint:behind(pb,d)>.3?'drop':d>0?'head':'tail'):kind(q.mat.color,d);}
        if(m.debug&&d)console.log('cand',d,q.tag,q.glass?'G':'-','#'+(q.c0||q.mat.color).getHexString(),k,'x',pb.min.x.toFixed(2),pb.max.x.toFixed(2),'y',pb.min.y.toFixed(2),pb.max.y.toFixed(2),'z',pb.min.z.toFixed(2),pb.max.z.toFixed(2),'H',H0.toFixed(2));
        if(!k){stay.push(...L);continue;}if(k==='drop'){lampsAt[d].push({lamp:d>0?'head':'tail',lb:pb});continue;}
        const w={...q,geo:sub(ng,L),glass:false,lamp:k,lb:pb};w.geo.computeBoundingBox();next.push(w);lampsAt[d].push(w);lampPat=true;}
      if(stay.length===list.reduce((n,L)=>n+L.length,0))next.push(q);else if(stay.length){const r2={...q,geo:sub(ng,stay)};r2.geo.computeBoundingBox();next.push(r2);}}
    // lampFaces [[d, x0, y0, x1, y1, kind], ...]: where the file's lamp is only a dark patch in its texture, a lamp face is laid
    // over it (both sides, mirrored), each grid point dropped onto the body along the car's axis so the face follows the shape
    if(m.lampFaces){const ms=body.map(q=>new T.Mesh(q.geo,new T.MeshBasicMaterial({side:T.DoubleSide}))),rc=new T.Raycaster(),nx=8,ny=4;
      for(const[d,x0,y0,x1,y1,k]of m.lampFaces)for(const sx of[1,-1]){const P=[],I=[];
        for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const x=sx*(x0+(x1-x0)*i/nx),y=y0+(y1-y0)*j/ny;rc.set(new T.Vector3(x,y,d*10),new T.Vector3(0,0,-d));const h=rc.intersectObjects(ms)[0];P.push(x,y,h?h.point.z+d*.004:d*(d>0?zF:-zB));}
        for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,e=c+1;if((d>0)===(sx>0))I.push(a,b,e,a,e,c);else I.push(a,e,b,a,c,e);}
        let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setIndex(I);g=g.toNonIndexed();g.computeVertexNormals();
        // faces must look outward along the car's axis
        const nz=g.attributes.normal.array;let sz=0;for(let i=2;i<nz.length;i+=3)sz+=nz[i];if(sz*d<0){const A=g.attributes.position.array;for(let t=0;t<A.length;t+=9)for(let c=0;c<3;c++){const v=A[t+3+c];A[t+3+c]=A[t+6+c];A[t+6+c]=v;}g.computeVertexNormals();}
        g.computeBoundingBox();const w={geo:g,mat:new T.MeshBasicMaterial(),name:'lampface',tag:'lampface',lamp:k,lb:g.boundingBox.clone()};body.push(w);lampsAt[d].push(w);lampPat=true;}}
    body=next.concat(body.filter(q=>q.name==='lampface'));parts=parts.filter(q=>q.wheel).concat(body);
    if(m.debug)for(const d of[1,-1])for(const w of lampsAt[d])console.log('lamp',d,w.lamp,w.tag,w.lb.min.x.toFixed(2),w.lb.max.x.toFixed(2),w.lb.min.y.toFixed(2),w.lb.max.y.toFixed(2));}


  // ---- what can be seen from outside (detailed models): drop the rest, turn inside-out triangles round ----
  const rnd=new T.WebGLRenderer({antialias:false});
  const seen=(list,views,half,centre)=>{
    const W=2304,H=1536,rt=new T.WebGLRenderTarget(W,H),n=list.reduce((a,q)=>a+(q.geo.index?q.geo.index.count:q.geo.attributes.position.count)/3,0),P=new Float32Array(n*9),I=new Float32Array(n*9);let o=0;
    for(const q of list){const g=q.geo.index?(q.geo=q.geo.toNonIndexed()):q.geo;P.set(g.attributes.position.array,o*9);o+=g.attributes.position.count/3;}
    for(let t=0;t<n;t++)for(let v=0;v<3;v++){I[(t*3+v)*3]=((t+1)&255)/255;I[(t*3+v)*3+1]=(((t+1)>>8)&255)/255;I[(t*3+v)*3+2]=(((t+1)>>16)&255)/255;}
    const G=new T.BufferGeometry();G.setAttribute('position',new T.BufferAttribute(P,3));G.setAttribute('tid',new T.BufferAttribute(I,3));
    const mat=new T.ShaderMaterial({side:T.DoubleSide,blending:T.NoBlending,vertexShader:'attribute vec3 tid;varying vec3 v;void main(){v=tid;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec3 v;void main(){gl_FragColor=vec4(v,gl_FrontFacing?1.:.5);}'});
    const sc=new T.Scene();sc.add(new T.Mesh(G,mat));const cam=new T.OrthographicCamera(-half*1.5,half*1.5,half,-half,.01,half*40),px=new Uint8Array(W*H*4),F=new Uint32Array(n),Bk=new Uint32Array(n);
    rnd.setRenderTarget(rt);rnd.setClearColor(0,0);
    for(const[az,el]of views){const a=az*Math.PI/180,e=el*Math.PI/180;cam.position.set(centre.x+Math.sin(a)*Math.cos(e)*half*8,centre.y+Math.sin(e)*half*8,centre.z+Math.cos(a)*Math.cos(e)*half*8);cam.up.set(0,1,0);cam.lookAt(centre);
      rnd.clear();rnd.render(sc,cam);rnd.readRenderTargetPixels(rt,0,0,W,H,px);
      for(let i=0;i<px.length;i+=4){const id=px[i]|px[i+1]<<8|px[i+2]<<16;if(id)(px[i+3]>200?F:Bk)[id-1]++;}}
    rnd.setRenderTarget(null);rt.dispose();G.dispose();
    // per part: keep what was hit; a triangle seen mostly from behind is reversed, one seen from both sides gets a reversed twin
    let t=0,kept=0;for(const q of list){const g=q.geo,nt=g.attributes.position.count/3,keep=[],flip=[];
      for(let k=0;k<nt;k++,t++){const f=F[t],bk=Bk[t];if(f+bk<1)continue;if(q.glass||f>=bk*3)keep.push(k*3);else if(bk>=f*3)flip.push(k*3);else{keep.push(k*3);flip.push(k*3);}}
      const a=sub(g,keep),bq=sub(g,flip);for(const A of Object.values(bq.attributes)){const it=A.itemSize;for(let i=0;i<A.count;i+=3)for(let c=0;c<it;c++){const x=A.array[(i+1)*it+c];A.array[(i+1)*it+c]=A.array[(i+2)*it+c];A.array[(i+2)*it+c]=x;}}
      const N=bq.attributes.normal.array;for(let i=0;i<N.length;i++)N[i]=-N[i];
      const out=new T.BufferGeometry();for(const k of['position','normal','uv']){if(!g.attributes[k])continue;const x=new Float32Array(a.attributes[k].array.length+bq.attributes[k].array.length);x.set(a.attributes[k].array);x.set(bq.attributes[k].array,a.attributes[k].array.length);out.setAttribute(k,new T.BufferAttribute(x,g.attributes[k].itemSize));}
      q.geo=out;q.geo.computeBoundingBox();kept+=out.attributes.position.count/3;}
    return[n,kept];};
  let cullInfo=null;
  if(m.lod||m.cull){
    const views=[];for(let az=0;az<360;az+=15)for(const el of[3,12,25,45,70])views.push([az,el]);views.push([90,89]);
    const bc=box.getCenter(new T.Vector3()),half=Math.hypot(box.max.z-box.min.z,box.max.x-box.min.x,box.max.y)*.36;
    const bi=seen(body,views,half,bc);body=body.filter(q=>q.geo.attributes.position.count);
    let wi=null;if(wheel){const wv=[];for(let az=-20;az<=200;az+=20)for(const el of[-35,-10,15,45,75])wv.push([az,el]);wi=seen(wheel,wv,r*1.2,new T.Vector3());wheel=wheel.filter(q=>q.geo.attributes.position.count);}
    cullInfo={body:bi,wheel:wi};console.log('seen from outside: body '+bi.join(' -> ')+(wi?', wheel '+wi.join(' -> '):''));}

  // ---- atlas: every image and a swatch per untextured colour into one square ----
  const all=parts.filter(q=>(!q.wheel||q.fr)&&(m.legacy||q.geo.attributes.position.count)),area=q=>{const a=q.geo.attributes.position,ix=q.geo.index;let s=0;const A=new T.Vector3(),B=new T.Vector3(),C=new T.Vector3();const nt=(ix?ix.count:a.count)/3;
    for(let t=0;t<nt;t++){const i=ix?ix.getX(t*3):t*3,j=ix?ix.getX(t*3+1):t*3+1,k=ix?ix.getX(t*3+2):t*3+2;A.fromBufferAttribute(a,i);B.fromBufferAttribute(a,j);C.fromBufferAttribute(a,k);s+=B.sub(A).cross(C.sub(A)).length()/2;}return s;};
  const A=1024,cv=document.createElement('canvas');cv.width=cv.height=A;const cx=cv.getContext('2d');if(!m.legacy)cx.imageSmoothingQuality='high';
  const hex=q=>'#'+q.mat.color.getHexString(),imgs=[],swatch=[];let flat=null;
  for(const q of all){const t=q.mat.map;if(t&&t.image){let e=imgs.find(e=>e.im===t.image);if(!e)imgs.push(e={im:t.image,a:0});e.a+=area(q);}
    else if(q.lamp){}else if(q.paint){if(!flat)flat={hex:hex(q),a:0};flat.a+=area(q);}else{const c=hex(q);if(!swatch.includes(c))swatch.push(c);}}
  let cell,swAt;
  if(m.legacy){const cells=imgs.length+(swatch.length?1:0),n=Math.ceil(Math.sqrt(cells)),cw=A/n;cell=k=>[(k%n)*cw,Math.floor(k/n)*cw,cw];swAt=imgs.length;}
  else{
    // the paint first, then the images by the surface they cover, then the swatches; each next slot is a quarter of the last one left
    imgs.sort((a,b)=>b.a-a.a);const need=(flat?1:0)+imgs.length+(swatch.length?1:0)+(lampPat?1:0),slots=[[0,0,A]];
    while(slots.length<need){const[x,y,w]=slots.pop(),h=w/2;slots.push([x,y,h],[x+h,y,h],[x,y+h,h],[x+h,y+h,h]);}
    const off=flat?1:0;cell=k=>slots[k+off];swAt=imgs.length;
    cx.fillStyle='#'+GLASS.getHexString();cx.fillRect(0,0,A,A);
    // flat paint is stored as a neutral grey and coloured in the game; its own colour goes into the fleet entry
    if(flat){const[x,y,w]=slots[0];cx.fillStyle='#808080';cx.fillRect(x,y,w,w);}}
  imgs.forEach((e,k)=>{const[x,y,w]=cell(k);cx.drawImage(e.im,x,y,w,w);});
  const sn=Math.ceil(Math.sqrt(swatch.length||1));
  if(swatch.length){const[x,y,w]=cell(swAt),sw=w/sn;swatch.forEach((c,k)=>{cx.fillStyle=c;cx.fillRect(x+(k%sn)*sw,y+Math.floor(k/sn)*sw,sw,sw);});}
  // lamp patterns, one quarter each: head (reflector), tail (red), amber, reverse (white)
  const LP={head:0,tail:1,amber:2,reverse:3},lpAt=(k,u,v)=>{const[x,y,w]=cell(swAt+(swatch.length?1:0)),h=w/2,q=LP[k];return[(x+(q%2)*h+h*(.08+.84*u))/A,(y+(q>>1)*h+h*(.08+.84*v))/A];};
  if(lampPat){const[x,y,w]=cell(swAt+(swatch.length?1:0)),h=w/2;
    for(const[q,c0,c1,rib]of[[0,'#f4f7fa','#68717b','rgba(40,46,54,.45)'],[1,'#ff4a3a','#6a0806','rgba(50,0,0,.5)'],[2,'#ffbb40','#9a5006','rgba(80,35,0,.45)'],[3,'#eef0f2','#9da3a9','rgba(60,66,72,.35)']]){
      const X=x+(q%2)*h,Y=y+(q>>1)*h,g=cx.createRadialGradient(X+h*.5,Y+h*.45,h*.04,X+h*.5,Y+h*.5,h*.6);g.addColorStop(0,c0);g.addColorStop(1,c1);cx.fillStyle=g;cx.fillRect(X,Y,h,h);
      cx.fillStyle=rib;for(let i=1;i<8;i++)cx.fillRect(X,Y+h*i/8,h,Math.max(1,h/64));
      if(q===0){cx.strokeStyle='rgba(255,255,255,.7)';cx.lineWidth=h/40;cx.beginPath();cx.arc(X+h*.5,Y+h*.5,h*.22,0,6.283);cx.stroke();}}}
  // per-model texture lift [x0,y0,x1,y1,gain] in atlas fractions: brightens a too-dark painted part (the Audi 80's wheels)
  if(m.lift){const[x0,y0,x1,y1,k]=m.lift,X=Math.round(x0*A),Y=Math.round(y0*A),w=Math.round((x1-x0)*A),h=Math.round((y1-y0)*A),d=cx.getImageData(X,Y,w,h);
    for(let i=0;i<d.data.length;i+=4)for(let c=0;c<3;c++)d.data[i+c]=Math.min(255,d.data[i+c]*k);cx.putImageData(d,X,Y);}
  let uvOut=0;const tinted=new Set();
  for(const q of all){const t=q.mat.map,uv=q.geo.attributes.uv,N=q.geo.attributes.position.count,o=new Float32Array(N*2);
    if(t&&t.image&&uv){const k=imgs.findIndex(e=>e.im===t.image),[x,y,cw]=cell(k),rep=t.repeat,off=t.offset;
      // a colour factor on a textured material tints the whole cell (multiply), as the renderer would
      if(q.mat.color.getHex()!==0xffffff&&!tinted.has(k)){cx.globalCompositeOperation='multiply';cx.fillStyle=hex(q);cx.fillRect(x,y,cw,cw);cx.globalCompositeOperation='source-over';tinted.add(k);}
      // a tiled triangle is moved back into the image as a whole; what still falls outside is clamped
      const ix=q.geo.index,su=new Float32Array(N),sv=new Float32Array(N);
      if(!m.legacy&&!ix)for(let i=0;i<N;i+=3){const fu=Math.floor(Math.min(uv.getX(i),uv.getX(i+1),uv.getX(i+2))*rep.x+off.x+1e-4),fv=Math.floor(Math.min(uv.getY(i),uv.getY(i+1),uv.getY(i+2))*rep.y+off.y+1e-4);for(let v=0;v<3;v++){su[i+v]=fu;sv[i+v]=fv;}}
      for(let i=0;i<N;i++){let u=uv.getX(i)*rep.x+off.x-su[i],v=uv.getY(i)*rep.y+off.y-sv[i];if(u<-.01||u>1.01||v<-.01||v>1.01)uvOut++;u=Math.min(1,Math.max(0,u));v=Math.min(1,Math.max(0,v));
        if(!m.legacy){u=.004+u*.992;v=.004+v*.992;}o[i*2]=(x+u*cw)/A;o[i*2+1]=(y+v*cw)/A;}}
    else if(q.lamp){const b=q.lb,P=q.geo.attributes.position;for(let i=0;i<N;i++){const[u,v]=lpAt(q.lamp,(P.getX(i)-b.min.x)/Math.max(b.max.x-b.min.x,1e-3),(P.getY(i)-b.min.y)/Math.max(b.max.y-b.min.y,1e-3));o[i*2]=u;o[i*2+1]=v;}}
    else if(q.paint&&flat){const[x,y,w]=cell(-1);for(let i=0;i<N;i++){o[i*2]=(x+w/2)/A;o[i*2+1]=(y+w/2)/A;}}
    else{const k=swatch.indexOf(hex(q)),[x,y,w]=cell(swAt),sw=w/sn;for(let i=0;i<N;i++){o[i*2]=(x+(k%sn+.5)*sw)/A;o[i*2+1]=(y+(Math.floor(k/sn)+.5)*sw)/A;}}
    q.geo.setAttribute('uv',new T.BufferAttribute(o,2));}

  // a double-sided wheel (its caps face inward) gets a reversed copy, the game draws one side only
  let wgeo=wheel&&wheel.map(q=>q.geo);
  if(wgeo&&m.wheel2side)wgeo=wgeo.flatMap(g=>{g=g.index?g.toNonIndexed():g;const r2=g.clone(),P=r2.attributes.position,N=r2.attributes.normal,U=r2.attributes.uv;
    for(let t=0;t<P.count;t+=3)for(const A of[P,N,U]){const it=A.itemSize;for(let c=0;c<it;c++){const x=A.array[(t+1)*it+c];A.array[(t+1)*it+c]=A.array[(t+2)*it+c];A.array[(t+2)*it+c]=x;}}
    for(let i=0;i<N.array.length;i++)N.array[i]=-N.array[i];return[g,r2];});
  const bgeo=body.map(q=>q.geo);
  const pack=list=>{let n=0;const P=[],Nn=[],U=[],I=[];for(const g of list){const pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;
      for(let i=0;i<pa.count;i++){P.push(Math.round(pa.getX(i)*1000),Math.round(pa.getY(i)*1000),Math.round(pa.getZ(i)*1000));const v=new T.Vector3(na.getX(i),na.getY(i),na.getZ(i)).normalize();Nn.push(Math.round(v.x*127),Math.round(v.y*127),Math.round(v.z*127));U.push(Math.round(ua.getX(i)*65535),Math.round(ua.getY(i)*65535));}
      if(g.index)for(const k of g.index.array)I.push(k+n);else for(let i=0;i<pa.count;i++)I.push(i+n);n+=pa.count;}
    if(m.legacy)return{P,N:Nn,U,I,n};
    // corners that came out the same share one vertex
    const key=new Map(),o={P:[],N:[],U:[],I:[],n:0};for(const i of I){const id=P[i*3]+','+P[i*3+1]+','+P[i*3+2]+','+Nn[i*3]+','+Nn[i*3+1]+','+Nn[i*3+2]+','+U[i*2]+','+U[i*2+1];let k=key.get(id);
      if(k===undefined){k=o.n++;key.set(id,k);o.P.push(P[i*3],P[i*3+1],P[i*3+2]);o.N.push(Nn[i*3],Nn[i*3+1],Nn[i*3+2]);o.U.push(U[i*2],U[i*2+1]);}o.I.push(k);}
    return o;};
  // ---- reduction (detailed models): weld, then meshoptimizer down to a triangle budget, keeping normals and texture seams ----
  const reduce=(list,target)=>{
    const key=new Map(),P=[],At=[],I=[];
    for(const g of list){const pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv,ix=g.index;const nv=ix?ix.count:pa.count;
      for(let j=0;j<nv;j++){const i=ix?ix.getX(j):j,v=[pa.getX(i),pa.getY(i),pa.getZ(i),na.getX(i),na.getY(i),na.getZ(i),ua.getX(i),ua.getY(i)];
        const id=Math.round(v[0]*2000)+','+Math.round(v[1]*2000)+','+Math.round(v[2]*2000)+','+Math.round(v[3]*8)+','+Math.round(v[4]*8)+','+Math.round(v[5]*8)+','+Math.round(v[6]*2048)+','+Math.round(v[7]*2048);
        let k=key.get(id);if(k===undefined){k=P.length/3;key.set(id,k);P.push(v[0],v[1],v[2]);At.push(v[3],v[4],v[5],v[6],v[7]);}I.push(k);}}
    let idx=new Uint32Array(I);const pos=new Float32Array(P),att=new Float32Array(At),w=[.4,.4,.4,1.5,1.5];
    // degenerate triangles (welded corners) go first
    idx=idx.filter((_,i)=>{const t=i-i%3;return idx[t]!==idx[t+1]&&idx[t+1]!==idx[t+2]&&idx[t]!==idx[t+2];});
    const before=idx.length/3;let err=0,how='as is';
    if(idx.length/3>target){
      const tries=[[.01,[]],[.02,['Prune']],[.04,['Prune','Permissive']],[.1,['Prune','Permissive']],[.3,['Prune','Permissive']]];
      for(const[e,fl]of tries){const[ni,er]=Simp.simplifyWithAttributes(idx,pos,3,att,5,w,null,target*3,e,fl);if(ni.length<idx.length){idx=ni;err=er;how='e'+e+(fl.length?' '+fl.join('+'):'');}if(idx.length/3<=target*1.03)break;}
      if(idx.length/3>target*1.03){const[ni,er]=Simp.simplifySloppy(idx,pos,3,null,target*3,.3);idx=ni;err=er;how='sloppy';}}
    const map=new Map(),o={P:[],N:[],U:[],I:[]};for(const i of idx){let k=map.get(i);if(k===undefined){k=map.size;map.set(i,k);o.P.push(pos[i*3],pos[i*3+1],pos[i*3+2]);o.N.push(att[i*5],att[i*5+1],att[i*5+2]);o.U.push(att[i*5+3],att[i*5+4]);}o.I.push(k);}
    const G=new T.BufferGeometry();G.setAttribute('position',new T.Float32BufferAttribute(o.P,3));G.setAttribute('normal',new T.Float32BufferAttribute(o.N,3));G.setAttribute('uv',new T.Float32BufferAttribute(o.U,2));G.setIndex(o.I);
    console.log('reduce '+before+' -> '+idx.length/3+' ('+how+', error '+(+err).toFixed(4)+')');return G;};
  let B,W,Bhi=null,Whi=null,lampGeo=bgeo;
  if(m.lod){const[h0,h1]=m.lod===1?[11000,2100]:m.lod,hw=m.wheelHi||900,lw=m.wheelLo||100;
    // a reduced tyre shrinks a little at its rim: scale it back across (y, z) so it still stands on the ground
    const round=g=>{g.computeBoundingBox();const k=r/Math.max(-g.boundingBox.min.y,1e-3);if(Math.abs(k-1)>.002){const a=g.attributes.position;for(let i=0;i<a.count;i++){a.setY(i,a.getY(i)*k);a.setZ(i,a.getZ(i)*k);}}return g;};
    const bh=reduce(bgeo,h0),wh=wgeo&&round(reduce(wgeo,hw));Bhi=pack([bh]);Whi=wh?pack([wh]):{P:[],N:[],U:[],I:[],n:0};
    B=pack([reduce([bh],h1)]);W=wh?pack([round(reduce([wh],lw))]):Whi;lampGeo=[bh];}
  else{B=pack(bgeo);W=wgeo?pack(wgeo):{P:[],N:[],U:[],I:[],n:0};}

  // lamp glow quads, laid on the nose and tail where a ray from outside first meets the body
  const meshes=lampGeo.map(g=>new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide}))),rc=new T.Raycaster(),H=box.max.y,hw=(box.max.x-box.min.x)/2,lamps=[];
  const hit=(x,y,d)=>{rc.set(new T.Vector3(x,y,d*10),new T.Vector3(0,0,-d));const h=rc.intersectObjects(meshes)[0];return h?h.point.z+d*.012:d*m.L/2;};
  const[lf,lr]=m.lampY||[.45,.58];
  // on the lamps found above (headlamps at the front, tail lamps at the back), else where a ray first meets the body
  for(const[d,y,hh,w]of[[1,lf*H,.1,.2],[-1,lr*H,.12,.18]])for(const sx of[-1,1]){
    const L=lampsAt[d].filter(q=>q.lamp===(d>0?'head':'tail')&&(q.lb.min.x+q.lb.max.x)*sx>0);
    if(L.length){const ar=q=>(q.lb.max.x-q.lb.min.x)*(q.lb.max.y-q.lb.min.y),b0=L.reduce((a,q)=>ar(q)>ar(a)?q:a).lb,b=b0.clone();
      // the main lamp: the biggest piece and what sits at its height (not a fog lamp lower down)
      for(const q of L)if(q.lb.min.y<b0.max.y&&q.lb.max.y>b0.min.y)b.union(q.lb);const c=b.getCenter(new T.Vector3()),gw=Math.min(.6*(b.max.x-b.min.x),.24)/2,gh=Math.min(.6*(b.max.y-b.min.y),.12)/2;lamps.push([c.x-gw,c.y-gh,c.x+gw,c.y+gh,d>0?b.max.z+.012:b.min.z-.012,d]);continue;}
    const x=sx*.66*hw;lamps.push([x-w/2,y-hh/2,x+w/2,y+hh/2,hit(x,y,d),d]);}
  // dominant paint: texels under side-facing door panels, area weighted
  const px=cx.getImageData(0,0,A,A).data;let cr=0,cg=0,cb=0,wsum=0;for(const g of bgeo){const pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv,idx=g.index?g.index.array:null,F=idx?idx.length/3:pa.count/3;
    for(let f=0;f<F;f++){const k=idx?idx[f*3]:f*3;if(Math.abs(na.getX(k))<.8||pa.getY(k)<.35||pa.getY(k)>.85)continue;const tx=Math.min(A-1,Math.floor(ua.getX(k)*A)),ty=Math.min(A-1,Math.floor(ua.getY(k)*A)),o=(ty*A+tx)*4;cr+=px[o];cg+=px[o+1];cb+=px[o+2];wsum++;}}
  // paint mask: the texels the game may recolour; glass, lamps, trim, tyres and plates stay as textured
  let mask=null,paintBase=null,own=null;
  const cov=document.createElement('canvas');cov.width=cov.height=A;const kx=cov.getContext('2d');
  const small=()=>{const mc=document.createElement('canvas');mc.width=mc.height=256;mc.getContext('2d').drawImage(cov,0,0,256,256);return mc.toDataURL('image/png');};
  if(flat){
    // flat paint: exactly the paint slot; base is the stored grey (as the texel reads in the game), so the game's colour comes out as given
    const[x,y,w]=cell(-1);kx.fillStyle='#000';kx.fillRect(0,0,A,A);kx.fillStyle='#fff';kx.fillRect(x,y,w,w);mask=small();paintBase=[.502,.502,.502];own=m.own||flat.hex;}
  else if(!m.noPaint&&wsum){const P0=[cr/wsum/255,cg/wsum/255,cb/wsum/255],lum=c=>.3*c[0]+.59*c[1]+.11*c[2],rg=c=>{const t=c[0]+c[1]+c[2]+.03;return[c[0]/t,c[1]/t];},q0=rg(P0);
    kx.fillStyle='#fff';
    // the door panels (side-facing, between sill and window) are drawn red as well: the paint colour is read there.
    // With paintMat only the named materials' triangles count as body at all.
    for(const q of body){if((paintR&&!q.paint)||q.lamp)continue;const g=q.geo,ua=g.attributes.uv,pa=g.attributes.position,na=g.attributes.normal,idx=g.index?g.index.array:null,F=idx?idx.length/3:ua.count/3;
      for(let f=0;f<F;f++){const k0=idx?idx[f*3]:f*3,door=Math.abs(na.getX(k0))>.75&&pa.getY(k0)>.35&&pa.getY(k0)<.85;kx.fillStyle=door?'#f00':'#fff';
        kx.beginPath();for(let v=0;v<3;v++){const k=idx?idx[f*3+v]:f*3+v;kx[v?'lineTo':'moveTo'](ua.getX(k)*A,ua.getY(k)*A);}kx.closePath();kx.fill();}}
    const cd=kx.getImageData(0,0,A,A),md=kx.createImageData(A,A),[lo,hi]=m.paintRange||[.25,4];
    // the paint is the commonest colour (chromaticity bin) on the door panels; its lightness is that bin's median
    const Hm=new Map();for(let i=0;i<px.length;i+=8){if(cd.data[i]<128||cd.data[i+1]>127)continue;const c=[px[i]/255,px[i+1]/255,px[i+2]/255],q=rg(c),bn=Math.round(q[0]*50)*100+Math.round(q[1]*50);if(!Hm.has(bn))Hm.set(bn,[]);Hm.get(bn).push(lum(c));}
    let bb=null;for(const[bn,L]of Hm)if(!bb||L.length>bb[1].length)bb=[bn,L];
    if(bb){
    q0[0]=Math.floor(bb[0]/100)/50;q0[1]=(bb[0]%100)/50;bb[1].sort((x,y)=>x-y);const l1=bb[1][bb[1].length>>1];paintBase=[q0[0],q0[1],l1];
    // same hue (within 22 degrees) and a comparable saturation; an unsaturated paint (silver, white, black) takes greys only
    const hs=c=>{const mx=Math.max(...c),mn=Math.min(...c),d=mx-mn,s=mx>0?d/mx:0;let h=0;if(d>1e-6)h=mx===c[0]?((c[1]-c[2])/d+6)%6:mx===c[1]?(c[2]-c[0])/d+2:(c[0]-c[1])/d+4;return[h*60,s];};
    const b0=[q0[0],q0[1],1-q0[0]-q0[1]],[h0,s0]=hs(b0);
    for(let i=0;i<px.length;i+=4){const c=[px[i]/255,px[i+1]/255,px[i+2]/255],l=lum(c),[h,sa]=hs(c),dh=Math.min(Math.abs(h-h0),360-Math.abs(h-h0)),
      ok=cd.data[i]>127&&l>lo*l1&&l<hi*l1&&(s0<.15?sa<.18:dh<22&&sa>s0*.3&&sa<Math.min(1,s0*2+.15));
      md.data[i]=md.data[i+1]=md.data[i+2]=ok?255:0;md.data[i+3]=255;}
    // close small holes (reflections, panel-line shading) inside the body's own texels
    kx.putImageData(md,0,0);const bl=document.createElement('canvas');bl.width=bl.height=A;const bx=bl.getContext('2d');bx.filter='blur(3px)';bx.drawImage(cov,0,0);
    const bd=bx.getImageData(0,0,A,A).data;for(let i=0;i<md.data.length;i+=4)md.data[i]=md.data[i+1]=md.data[i+2]=cd.data[i]>127&&bd[i]>90?255:0;
    kx.putImageData(md,0,0);mask=small();
    const[r0,g0,l]=paintBase,b1=1-r0-g0,k=l/(.3*r0+.59*g0+.11*b1);paintBase=[r0*k,g0*k,b1*k];}}
  const outc=document.createElement('canvas');outc.width=outc.height=512;outc.getContext('2d').drawImage(cv,0,0,512,512);
  const paint=own?[1,3,5].map(i=>parseInt(own.slice(i,i+2),16)/255):wsum?[cr/wsum/255,cg/wsum/255,cb/wsum/255]:[.5,.5,.5];
  rnd.dispose();
  return{B,W,Bhi,Whi,meta:{key:m.key,name:m.name,src:m.i,dims:[+(box.max.z-box.min.z).toFixed(3),+(box.max.x-box.min.x).toFixed(3),+box.max.y.toFixed(3)],
    axles:axles.map(v=>+v.toFixed(3)),track:+track.toFixed(3),r:+r.toFixed(3),wheels:!!wheel,lamps:lamps.map(a=>a.map(v=>+v.toFixed(3))),
    paint:paint.map(v=>+v.toFixed(3)),tris:B.I.length/3,wheelTris:W.I.length/3,uvOut,base:paintBase&&paintBase.map(v=>+v.toFixed(3)),own:own?parseInt(own.slice(1),16):undefined,
    lod:m.lod?{tris:Bhi.I.length/3,wheelTris:Whi.I.length/3}:undefined,seen:cullInfo||undefined,images:imgs.length,swatches:swatch.length,parts:parts.length,cut:cutInfo},
    jpg:outc.toDataURL('image/jpeg',.82),mask};
}

for(const m of cfg){if(only.length?!only.includes(m.key):m.dropped)continue;
  const src=[here+'src/',here+'../../sketchfab/glb/'].map(d=>d+m.i+'.glb').find(f=>fs.existsSync(f));if(!src){console.log(m.key+': no download '+m.i+'.glb yet');continue;}
  console.log(m.key+' <- '+src.split('/').slice(-2).join('/'));
  const glb=fs.readFileSync(src).toString('base64');
  if(process.env.DEBUG)m.debug=1;let r;try{r=await p.evaluate(page,[glb,m]);}catch(e){console.log(m.key+' FAILED: '+e.message.split('\n')[0]);continue;}
  // bin: per part u32 vertex count, u32 index count, i16 xyz mm, i8 normal xyz, u16 uv, u16 index
  // borrowed wheel: another converted model's wheel, scaled to this car's tyre radius; its texture goes under this car's
  // atlas (512x1024), so the body's v is halved and the wheel's v moved into the lower half
  const wf=process.env.WHEEL||m.wheelFrom;
  if(wf){const d=fs.readFileSync(out0+wf+'.bin'),R=JSON.parse(fs.readFileSync(out0+'fleet.json','utf8'))[wf];let o=0;
    const read=()=>{const n=d.readUInt32LE(o),k=d.readUInt32LE(o+4);o+=8;const q={n,P:[],N:[],U:[],I:[]};for(let i=0;i<n*3;i++,o+=2)q.P.push(d.readInt16LE(o));for(let i=0;i<n*3;i++,o++)q.N.push(d.readInt8(o));
      for(let i=0;i<n*2;i++,o+=2)q.U.push(d.readUInt16LE(o));for(let i=0;i<k;i++,o+=2)q.I.push(d.readUInt16LE(o));return q;};
    read();const w=read(),rr=m.wheelR||r.meta.r,k=rr/R.r;
    r.W={...w,P:w.P.map(v=>Math.round(v*k)),U:w.U.map((v,i)=>i%2?32768+(v>>1):v)};r.B.U=r.B.U.map((v,i)=>i%2?v>>1:v);
    r.jpg=await p.evaluate(async([a,b])=>{const ld=s=>new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.src=s;}),A=await ld(a),B=await ld(b),c=document.createElement('canvas');
      c.width=512;c.height=1024;const x=c.getContext('2d');x.drawImage(A,0,0,512,512);x.drawImage(B,0,512,512,512);return c.toDataURL('image/jpeg',.82);},
      [r.jpg,'data:image/jpeg;base64,'+fs.readFileSync(out0+wf+'.jpg').toString('base64')]);
    if(r.mask)r.mask=await p.evaluate(async a=>{const im=await new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.src=a;}),c=document.createElement('canvas');c.width=256;c.height=512;
      const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,256,512);x.drawImage(im,0,0,256,256);return c.toDataURL('image/png');},r.mask);
    Object.assign(r.meta,{r:+rr.toFixed(3),wheels:true,wheelTris:w.I.length/3,wheelFrom:wf});}
  const part=q=>{if(q.n>65535)throw new Error(m.key+' too many vertices');const buf=Buffer.alloc(8+q.n*6+q.n*3+q.n*4+q.I.length*2);let o=0;buf.writeUInt32LE(q.n,o);o+=4;buf.writeUInt32LE(q.I.length,o);o+=4;
    for(const v of q.P){buf.writeInt16LE(Math.max(-32768,Math.min(32767,v)),o);o+=2;}for(const v of q.N){buf.writeInt8(v,o);o++;}for(const v of q.U){buf.writeUInt16LE(v,o);o+=2;}for(const v of q.I){buf.writeUInt16LE(v,o);o+=2;}return buf;};
  const key=process.env.AS||m.key;r.meta.key=key;
  fs.writeFileSync(out+key+'.bin',Buffer.concat([part(r.B),part(r.W)]));fs.writeFileSync(out+key+'.jpg',Buffer.from(r.jpg.split(',')[1],'base64'));
  if(r.Bhi)fs.writeFileSync(out+key+'_hi.bin',zlib.deflateSync(Buffer.concat([part(r.Bhi),part(r.Whi)]),{level:9}));else if(fs.existsSync(out+key+'_hi.bin'))fs.unlinkSync(out+key+'_hi.bin');
  r.meta.mask=!!r.mask;if(r.mask)fs.writeFileSync(out+key+'_mask.png',Buffer.from(r.mask.split(',')[1],'base64'));else if(fs.existsSync(out+key+'_mask.png'))fs.unlinkSync(out+key+'_mask.png');
  for(const k of['author','credit','page','tone','police'])if(m[k])r.meta[k]=m[k];
  const kb=f=>fs.existsSync(out+key+f)?Math.ceil(fs.statSync(out+key+f).size/3)*4:0;r.meta.pageBytes=kb('.bin')+kb('.jpg')+kb('_mask.png')+kb('_hi.bin');
  fleet[key]=r.meta;console.log(JSON.stringify({...r.meta,lamps:undefined}));}
// the credit fields follow models.json for every converted model, also those not converted in this run
for(const m of cfg)if(fleet[m.key])for(const k of['author','credit','tone','police'])if(m[k])fleet[m.key][k]=m[k];
fs.writeFileSync(out+'fleet.json',JSON.stringify(Object.fromEntries(Object.keys(fleet).sort().map(k=>[k,fleet[k]])),null,1)+'\n');
if(errs.length)console.log('errors',errs);await b.close();
