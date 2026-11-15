// ---------- tex: real wall and roof textures on the merged building mesh (add_tex.py) ----------
// TEXL (from pipeline/tex/layers.json): one 512 px tile per layer of the embedded strip, {n name, src Poly Haven id, m metres across}.
// A tile holds colour / tile mean * 128, so the shader multiplies the building's own colour by it and the mean stays what it was.
// TEXM: the materials a triangle can carry in its `tex` vertex attribute: [layer, turned 90 degrees]. On a flat roof the fraction of
// `tex` is the direction of the building's longest side (0..0.98 for 0..180 degrees), so the roofing rolls run along the building.
const TEXM=[['brick'],['silicate'],['plaster'],['roughcast'],['planks'],['planks',1],['concrete'],['corrugated'],['asbestos'],['tiles'],['profile'],['bitumen']];
const TEXI={brick:0,silicate:1,plaster:2,roughcast:3,planks:4,boards:5,concrete:6,corrugated:7,asbestos:8,tiles:9,profile:10,bitumen:11};
const TEX={u:{value:null},paint:{value:new Float32Array(16)},used:new Array(TEXM.length).fill(0),B:null,loaded:false,mesh:null};
const TEX_ROOF={[STY.tiles]:TEXI.tiles,[STY.sheet]:TEXI.profile,[STY.flat]:TEXI.bitumen,[STY.corrugated]:TEXI.corrugated,[STY.asbestos]:TEXI.asbestos};
// wall material of a building, from its facade style, kind and wall colour
function texWall(s){
  const st=s.sty,w=s.wall,I=TEXI;
  if(!(st>=0))return s.kind==='shed'?(w[0]>w[2]+.08?I.boards:I.roughcast):I.plaster; // unstyled sheds: brown ones are board, grey ones roughcast; churches smooth
  if(st===STY.glass)return -1;
  if(st===STY.brick)return w[0]>w[2]+.2&&w[0]>w[1]+.1?I.brick:I.silicate;
  if(st===STY.silicate)return I.silicate;
  if(st===STY.wood||st===STY.plank)return s.kind==='shed'?I.boards:I.planks;
  if(st===STY.block||st===STY.panel)return I.concrete;
  if(st===STY.industrial||st===STY.corrugated)return I.corrugated;
  if(st===STY.asbestos)return I.asbestos;
  return st===STY.old||hash((s.rid||'')+'tx')<.5?I.plaster:I.roughcast;
}
// tags the triangles one addBuilding call pushed: styled walls and roofs by their atlas style, plain gables and chimneys by colour
function texMark(B,n0,p,s){
  const tx=B.tx||(B.tx=[]),n1=B.pos.length/3,wm=texWall(s),seen=new Set();TEX.B=B;
  let ang=0,bl=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>bl){bl=l;ang=Math.atan2(b[1]-a[1],b[0]-a[0]);}}
  const turn=((ang%Math.PI)+Math.PI)%Math.PI/Math.PI*.98;
  for(let v=n0;v<n1;v+=3){
    const st=B.sty[v],ny=B.nor[v*3+1],is=c=>c&&B.col[v*3]===c[0]&&B.col[v*3+1]===c[1]&&B.col[v*3+2]===c[2];
    let m=-1;
    if(Math.abs(ny)<.05)m=st>=0||is(s.wall)||is(s.gable)?wm:is(CHIMNEY)?TEXI.brick:-1;
    else if(s.sty===STY.glass);
    else if(st>=0)m=TEX_ROOF[st]??-1;
    else if(ny>.5&&is(s.roof))m=TEXI.bitumen;
    if(m>=0)seen.add(m);if(ny>.99)m+=turn;
    tx[v]=tx[v+1]=tx[v+2]=m;
  }
  for(const m of seen)TEX.used[m]++;
}
function texShader(sh){
  sh.uniforms.uTexA=TEX.u;sh.uniforms.uTexP=TEX.paint;
  const rep=(k,a,b)=>{if(!sh[k].includes(a))throw new Error('tex: shader anchor missing: '+a);sh[k]=sh[k].replace(a,b);};
  rep('vertexShader','#include <common>','#include <common>\nattribute float tex;\nvarying float vTx;');
  rep('vertexShader','vSty=sty;','vSty=sty;vTx=tex;');
  const L=n=>TEXL.findIndex(l=>l.n===n);
  // texture coordinates in metres from the world position: along the wall and up, or along the eaves and up the slope
  rep('fragmentShader','float gM=0.;',`float gM=0.;
uniform mediump sampler2DArray uTexA;uniform float uTexP[16];varying float vTx;
const vec3 TXM[${TEXM.length}]=vec3[${TEXM.length}](${TEXM.map(([n,r])=>`vec3(${L(n)}.,${(1/TEXL[L(n)].m).toFixed(5)},${r?1:0}.)`).join(',')});
vec3 texM(){
  float tv=max(vTx,0.)+.001,ta=fract(tv)*3.2057;vec3 t=TXM[int(tv)],n=normalize(vWN);float hl=length(n.xz);vec2 hn=n.xz/max(hl,1e-4);
  float u=dot(vWP.xz,vec2(hn.y,-hn.x));
  vec2 q=abs(n.y)<.2?vec2(u,vWP.y):hl<.02?vec2(vWP.x*cos(ta)+vWP.z*sin(ta),vWP.z*cos(ta)-vWP.x*sin(ta)):vec2(u,vWP.y*hl-dot(vWP.xz,hn)*n.y);
  q*=t.y;if(t.z>.5)q=q.yx;
  return texture(uTexA,vec3(q.x,-q.y,t.x)).rgb*1.9922;
}`);
  rep('fragmentShader','if(vSty>-.5){','vec3 tM=texM();float tOn=step(-.5,vTx);if(vSty<-.5)diffuseColor.rgb*=mix(vec3(1.),tM,tOn);\n    if(vSty>-.5){');
  // styles whose atlas tile paints the material itself (brick courses, boards, ribs, roof tiles) give that paint up for the texture; plaster, block and panel tiles keep theirs
  // (a windowless board wall also drops the window casing its blank atlas tile still carries; the plinth stays)
  rep('fragmentShader','diffuseColor.rgb=mix(diffuseColor.rgb*tx.rgb,tx.rgb,tx.a)','tx.a*=1.-bl*step(.1,f.y)*float(abs(ws-5.)<.5||abs(ws-13.)<.5);diffuseColor.rgb=mix(diffuseColor.rgb*mix(tx.rgb,(ws>3.5&&abs(ws-7.)>.5&&abs(ws-12.)>.5?vec3(uTexP[int(ws+.5)]):tx.rgb)*tM,tOn),tx.rgb,tx.a)');
}
function texArray(data,w,d){
  const t=new THREE.DataArrayTexture(data,w,w,d);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;return t;
}
// until the strip is decoded every tile is its own mean, which draws the buildings exactly as before this step
TEX.u.value=texArray(new Uint8Array(TEXL.length*4).fill(128),1,TEXL.length);
{const im=new Image();im.src='data:image/webp;base64,'+document.getElementById('tex_atlas').textContent;
  im.decode().then(()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
    const old=TEX.u.value;TEX.u.value=texArray(new Uint8Array(g.getImageData(0,0,c.width,c.height).data.buffer),c.width,c.height/c.width);old.dispose();c.width=0;TEX.loaded=true;});}
{const ab=addBuilding;addBuilding=function(B,p,s){const n0=B.pos.length/3,r=ab(B,p,s);texMark(B,n0,p,s);return r;};
  const mg=mkGeo;mkGeo=function(pos,col,nor,uv,sty,tr){const g=mg(pos,col,nor,uv,sty,tr);
    if(TEX.B&&pos===TEX.B.pos){const n=pos.length/3,T=new Float32Array(n).fill(-1),tx=TEX.B.tx;for(let i=0;i<tx.length;i++)if(tx[i]!=null)T[i]=tx[i];g.setAttribute('tex',new THREE.BufferAttribute(T,1));}
    return g;};
  const bw=buildWorld;buildWorld=function(ways,meta){
    TEX.used.fill(0);const W=bw(ways,meta),m=TEX.mesh=worldGroup.children.find(o=>o.geometry&&o.geometry.attributes.tex);
    if(m){
      // mean brightness of the paint (alpha 0) pixels of each atlas style: what a tile that gives its paint up is replaced by
      const d=facadeTex.image.data,w=facadeTex.image.width,T=w/16,sum=new Float64Array(16),cnt=new Float64Array(16);
      for(let i=0;i<d.length;i+=4)if(d[i+3]<128){const s=(i/4%w)/T|0;sum[s]+=d[i];cnt[s]++;}
      for(let s=0;s<16;s++)TEX.paint.value[s]=cnt[s]?sum[s]/cnt[s]/255:1;
      const old=m.material.onBeforeCompile;m.material.onBeforeCompile=sh=>{old(sh);texShader(sh);};
    }
    return W;};}
