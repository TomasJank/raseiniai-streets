//#atlas
// facade atlas v2: 16 styles x (upper floor, ground floor), one 3.2 m bay x 3 m floor per 128 px tile, painted at load.
// 0-10 are the original styles (kept, repainted); 11 silicate brick, 12 prefab panel, 13 plank, 14 corrugated steel, 15 asbestos sheet.
// RGB is multiplied by the wall colour where alpha is 0; alpha 1 keeps glass, frames and plinths their own colour.
const facadeTex=(()=>{
  const T=128,c=document.createElement('canvas');c.width=T*16;c.height=T*2;const g=c.getContext('2d');
  const m=document.createElement('canvas');m.width=c.width;m.height=c.height;const k=m.getContext('2d');
  let ox=0,oy=0,sd=7;
  const rnd=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};
  const ri=n=>rnd()*n|0;
  const R=(x,y,w,h,col,fixed)=>{g.fillStyle=col;g.fillRect(ox+x,oy+y,w,h);k.fillStyle=fixed?'#fff':'#000';k.fillRect(ox+x,oy+y,w,h);};
  const grey=v=>{v=Math.max(0,Math.min(255,v|0));return'rgb('+v+','+v+','+v+')';};
  const win=(x,y,w,h,glass,frame='#f4f4f2')=>{R(x-5,y-5,w+10,h+10,frame,1);R(x-3,y-3,w+6,3,'#cfcdc6',1);R(x,y,w,h,glass,1);R(x,y,w,Math.round(h*.22),'#8796a3',1);R(x+w/2-1.5,y,3,h,frame,1);R(x,y+Math.round(h*.35),w,3,frame,1);R(x-8,y+h+5,w+16,4,'#d9d7d0',1);R(x-6,y+h+9,w+12,2,'#a9a69e',1);};
  const G='#3d4954';
  const stains=(n,col)=>{for(let i=0;i<n;i++)R(ri(T),ri(T-20),1+ri(2),8+ri(30),col);};
  for(let s=0;s<16;s++)for(let r=0;r<2;r++){
    ox=s*T;oy=r*T;const ground=r===1;sd=s*977+r*131+7;
    R(0,0,T,T,'#f6f6f6');
    if(s===STY.plaster){win(38,32,52,56,G);R(33,22,62,4,'#e6e6e6');stains(6,'#ececec');if(ground)R(0,T-16,T,16,'#77736b',1);}
    else if(s===STY.old){R(0,0,T,7,'#dedede');R(34,12,60,5,'#e2e2e2');win(40,24,48,70,G);R(30,16,68,3,'#d4d4d4');stains(5,'#eaeaea');if(ground)R(0,T-22,T,22,'#7a4c3c',1);}
    else if(s===STY.shop){if(ground){R(0,10,T,16,'#2f3a40',1);win(10,34,108,84,'#41505b','#d8dadb');R(0,T-6,T,6,'#55524c',1);}else{R(0,0,T,7,'#dedede');win(40,24,48,70,G);}}
    else if(s===STY.block){R(0,0,T,2,'#cacaca');R(0,64,T,2,'#d2d2d2');win(26,34,76,54,G);if(ground)R(0,T-12,T,12,'#7a7872',1);}
    else if(s===STY.brick){ // red clinker: stretcher bond, every brick its own tone, light mortar
      R(0,0,T,T,'#fbfbfb');
      for(let y=0;y<T;y+=6)for(let x=-(y/6%2)*8;x<T;x+=16){const v=196+ri(48);R(x+1,y+1,15,5,grey(v));if(rnd()<.08)R(x+1,y+1,15,5,grey(170));}
      R(33,22,62,5,'#e8e8e8');win(38,32,52,56,G);if(ground)R(0,T-14,T,14,'#6f6c66',1);}
    else if(s===STY.wood){for(let y=0;y<T;y+=7){R(0,y,T,1,'#bdbdbd');R(0,y+1,T,1,'#fbfbfb');}R(34,22,58,6,'#f4f4f2',1);win(40,30,46,58,G);if(ground)R(0,T-10,T,10,'#78756d',1);}
    else if(s===STY.industrial){for(let x=0;x<T;x+=8)R(x,0,1,T,'#d6d6d6');if(!ground){R(0,44,T,26,'#56636c',1);for(let x=0;x<T;x+=32)R(x,44,3,26,'#c8cacb',1);}else R(0,T-10,T,10,'#6e6d68',1);stains(8,'#e2e2e2');}
    else if(s===STY.glass){R(0,0,T,T,'#a9b6bd');R(0,0,T,10,'#e8e8e8');for(let x=0;x<T;x+=32)R(x,0,4,T,'#59636a',1);R(0,T/2,T,3,'#59636a',1);}
    else if(s===STY.tiles){ // clay pantile: staggered rows, lit top edge, shadowed lap
      for(let y=0;y<T;y+=8)for(let x=-(y/8%2)*8;x<T;x+=16){const v=216+ri(36);R(x+1,y,14,8,grey(v));R(x+1,y,14,2,'#ffffff');R(x+1,y+6,14,2,'#bfbfbf');R(x,y,1,8,'#a0a0a0');R(x+8,y+1,1,5,'#d2d2d2');}}
    else if(s===STY.sheet){ // standing-seam steel: seams every 0.4 m, faint panel-to-panel tone
      for(let x=0;x<T;x+=16){R(x,0,16,T,grey(232+ri(18)));R(x,0,2,T,'#ffffff');R(x+2,0,1,T,'#9c9c9c');R(x+14,0,2,T,'#d2d2d2');}for(let y=0;y<T;y+=64)R(0,y,T,1,'#bcbcbc');}
    else if(s===STY.flat){ // bitumen roll roofing: seams every metre, gravel speckle
      R(0,0,T,T,'#e8e8e8');for(let x=0;x<T;x+=32){R(x,0,2,T,'#c2c2c2');R(x+2,0,1,T,'#f4f4f4');}for(let i=0;i<500;i++)R(ri(T),ri(T),1,1,rnd()<.5?'#c6c6c6':'#fafafa');}
    else if(s===STY.silicate){ // white/yellow silicate brick: large flat units, grey mortar, lighter than clinker
      R(0,0,T,T,'#cdcdcd');
      for(let y=0;y<T;y+=7)for(let x=-(y/7%2)*9;x<T;x+=18){const v=236+ri(20);R(x+1,y+1,17,6,grey(v));}
      R(30,19,68,5,'#f2f2f2');win(38,32,52,56,G);R(32,26,64,4,'#e0e0e0');stains(5,'#d9d9d9');
      if(ground)R(0,T-14,T,14,'#8a8780',1);}
    else if(s===STY.panel){ // Soviet large-panel block: grey seams at the floor line and at the bay edge, recessed sill band, rust under the sill
      R(0,0,T,T,'#f2f2f2');for(let i=0;i<260;i++)R(ri(T),ri(T),2,2,grey(224+ri(20)));
      R(0,0,3,T,'#b4b4b4');R(3,0,1,T,'#fafafa');R(0,0,T,3,'#b9b9b9');R(0,3,T,1,'#fafafa');R(0,T/2-1,T,1,'#e0e0e0');
      R(22,86,84,22,'#e2e2e2');win(34,30,60,56,G);R(48,12,32,12,'#e6e6e6');R(60,82,3,18,'#d9d2c6');R(98,86,2,22,'#d9d2c6');
      stains(7,'#e4e1da');if(ground)R(0,T-18,T,18,'#8d8a84',1);}
    else if(s===STY.plank){ // painted horizontal boards, wide window casings with a drip cap, as on the old wooden houses
      for(let y=0;y<T;y+=9){R(0,y,T,9,grey(240+ri(14)));R(0,y,T,1,'#b2b2b2');R(0,y+1,T,1,'#ffffff');for(let q=0;q<3;q++)R(ri(T-30),y+2+ri(5),14+ri(24),1,'#dadada');}
      R(0,0,4,T,'#e6e6e6');R(T-4,0,4,T,'#e6e6e6');
      R(26,16,76,5,'#f4f1e8',1);R(30,21,68,3,'#d6d2c6',1);R(30,24,7,66,'#f4f1e8',1);R(91,24,7,66,'#f4f1e8',1);win(40,30,46,58,G,'#f4f1e8');if(ground)R(0,T-10,T,10,'#6c6a64',1);}
    else if(s===STY.corrugated){ // trapezoid steel profile: ribs every 8 px, rust runs
      for(let x=0;x<T;x++){const v=.5+.5*Math.cos(x/8*Math.PI*2);R(x,0,1,T,grey(176+v*70));}
      for(let i=0;i<10;i++)R(ri(T),ri(T-30),1+ri(2),14+ri(40),'#d0c8be');for(let y=0;y<T;y+=64)R(0,y,T,1,'#a8a8a8');if(ground)R(0,T-10,T,10,'#6e6d68',1);}
    else{ // asbestos-cement sheet: wide wave, lap lines, lichen blotches
      for(let x=0;x<T;x++){const v=.5+.5*Math.cos(x/16*Math.PI*2);R(x,0,1,T,grey(196+v*50));}
      for(let y=0;y<T;y+=64){R(0,y,T,2,'#9a9a9a');R(0,y+2,T,2,'#f2f2f2');}
      for(let i=0;i<46;i++){const w=3+ri(8);R(ri(T),ri(T),w,w*.7,grey(176+ri(30)));}for(let x=0;x<T;x+=16)R(x+7,0,1,T,'#b8b8b8');}
  }
  const W=c.width,H=c.height,a=g.getImageData(0,0,W,H).data,b=k.getImageData(0,0,W,H).data,out=new Uint8Array(W*H*4);
  // tileable low-frequency tone plus per-pixel grain, so a wall is not one flat multiply
  const lat=new Float32Array(16*8*8);for(let i=0;i<lat.length;i++)lat[i]=rnd();
  const vn=(s,x,y)=>{const fx=x/16,fy=y/16,i=fx|0,j=fy|0,u=fx-i,v=fy-j,at=(p,q)=>lat[(s*8+(q&7))*8+(p&7)];
    return(at(i,j)*(1-u)+at(i+1,j)*u)*(1-v)+(at(i,j+1)*(1-u)+at(i+1,j+1)*u)*v;};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,o=((H-1-y)*W+x)*4,fixed=b[i]>127,s=(x/T)|0,
    f=fixed?1+(((x*7+y*13)%11)/11-.5)*.04:1+(vn(s,x%T,y%T)-.5)*.1+(((x*7+y*13+s*5)%17)/17-.5)*.05;
    out[o]=Math.min(255,a[i]*f);out[o+1]=Math.min(255,a[i+1]*f);out[o+2]=Math.min(255,a[i+2]*f);out[o+3]=b[i];}
  const t=new THREE.DataTexture(out,W,H,THREE.RGBAFormat);
  t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;return t;
})();
//#core
// ---------- facades: style upgrades, instanced details, landmarks (add_facades.py) ----------
const FX={recs:[],W:null,over:{c92:{noTower:true},c219:{noTower:true}}};
const PASTEL=[[.93,.86,.62],[.80,.88,.78],[.78,.86,.92],[.93,.78,.70],[.90,.82,.86],[.95,.92,.80],[.74,.82,.66],[.96,.90,.72]];
const isWallSty=s=>s<7.5||(s>10.5&&s<13.5);
// hand-set looks (LOOK with its own sty) keep their style; everything else is upgraded to the finer tiles
function facadeRefine(sp,w){
  sp.rid=w.id;Object.assign(sp,FX.over[w.id]);
  const own=LOOK[w.id];if(own&&own.sty!=null)return sp;
  const t=w.tags;
  if(sp.sty===STY.brick&&sp.wall[1]>.5)sp.sty=STY.silicate;
  else if(sp.sty===STY.block)sp.sty=STY.panel;
  else if(sp.sty===STY.wood)sp.sty=STY.plank;
  else if((sp.sty===STY.plaster||sp.sty===STY.old)&&!t.facade&&!own&&(sp.kind==='house'||sp.kind==='commercial')&&hash(w.id+'p')<.7)sp.wall=PASTEL[Math.floor(hash(w.id+'q')*PASTEL.length)];
  else if(sp.sty===STY.industrial&&sp.kind==='industrial'&&hash(w.id+'c')<.5)sp.sty=STY.corrugated;
  sp.windows=sp.sty>=0;
  return sp;
}
function roofSty(s){
  const r=s.roof;if(r[0]>r[2]+.12)return STY.tiles;
  const u=hash((s.rid||'')+'rf'),k=s.kind;
  if(k==='industrial'||(k==='commercial'&&u<.6)||(k==='shed'&&u<.5))return STY.corrugated;
  return u<.55?STY.asbestos:STY.sheet;
}
function facadeRec(W,w,t,pts,specs,top){
  if(FX.W!==W){FX.W=W;FX.recs=[];}
  FX.recs.push({id:w.id,t,pts,specs,top});
}

// ----- instanced details -----
const FD_MAX={balc:2600,chim:900,dorm:260,shop:120};
function fdMesh(geo,list,mat){
  if(!list.length)return null;
  const m=new THREE.InstancedMesh(geo,mat,list.length),M=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color();
  list.forEach((o,i)=>{e.set(0,o.yaw,0);q.setFromEuler(e);M.compose(new THREE.Vector3(o.x,o.y,o.z),q,new THREE.Vector3(o.sx||1,o.sy||1,o.sz||1));m.setMatrixAt(i,M);if(o.col){c.setRGB(...o.col);m.setColorAt(i,c);}});
  m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
  m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;worldGroup.add(m);return m;
}
function fdBox(B,x0,x1,y0,y1,z0,z1,col){
  const P=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
  for(const [a,b,c,d,n] of[[0,3,2,1,[0,0,-1]],[4,5,6,7,[0,0,1]],[0,4,7,3,[-1,0,0]],[1,2,6,5,[1,0,0]],[3,7,6,2,[0,1,0]],[0,1,5,4,[0,-1,0]]])
    for(const i of[a,b,c,a,c,d]){B.pos.push(...P[i]);B.col.push(...col);B.nor.push(...n);}
}
function fdGeo(B){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(B.pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(B.col,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(B.nor,3));return g;}
const fdB=()=>({pos:[],col:[],nor:[]});
function fdMat(glow){
  const m=new THREE.MeshLambertMaterial({vertexColors:true});
  if(glow)m.onBeforeCompile=sh=>{sh.uniforms.uNight=ENV.night;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.78,.5)*uNight*.5*step(.15,vColor.b-vColor.r);');};
  return m;
}
const SHOP_AMENITY=/^(cafe|restaurant|fast_food|pharmacy|bank|bar|pub|post_office|marketplace|dentist|clinic|doctors)$/;
const BALC_COL=[[.86,.86,.84],[.62,.74,.82],[.64,.78,.64],[.84,.56,.46],[.94,.94,.92],[.7,.66,.6]];
const FASCIA=[[.75,.12,.12],[.12,.28,.6],[.14,.45,.25],[.88,.7,.1],[.22,.23,.25],[.9,.9,.88]];
function buildFacadeDetails(W){
  const balc=[],chim=[],dormB=[],dormR=[],shop=[],fasc=[];
  const nearRoad=(x,z)=>{let d=1e9;for(const s of W.roadSegs(x,z)){if(s[4].cls>3)continue;const dx=s[2]-s[0],dz=s[3]-s[1],l2=dx*dx+dz*dz||1,t=clamp(((x-s[0])*dx+(z-s[1])*dz)/l2,0,1);d=Math.min(d,Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)-s[4].w/2);}return d;};
  const LMK=/^(c92|c219|c171|c2134)$/;
  for(const r of FX.recs){
    if(LMK.test(r.id))continue;
    const sp=r.specs[0][1],t=r.t,p0=r.pts;if(!sp||sp.roofOnly||sp.skel||sp.tops)continue;
    const p=polyArea(p0)>0?p0.slice().reverse():p0,n=p.length,yb=sp.yb,eave=sp.y0+sp.h;
    const v1=Math.max(1,Math.round((eave-yb)/3)),fh=(eave-yb)/v1,single=r.specs.length===1;
    const edges=[];for(let i=0;i<n;i++){const a=p[i],b=p[(i+1)%n],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L>.5)edges.push({a,L,ux:dx/L,uz:dz/L,nx:-dz/L,nz:dx/L});}
    const at=(e,s,o)=>[e.a[0]+e.ux*s+e.nx*o,e.a[1]+e.uz*s+e.nz*o];
    // balconies: 4+ floors, no town.js loggia block, on the long walls, every other bay, floors 2 up
    if(single&&v1>=4&&!sp.blk&&sp.windows&&sp.kind!=='church'&&(sp.kind==='apartments'||/^(apartments|dormitory|yes)$/.test(t.building))&&balc.length<FD_MAX.balc){
      const long=edges.filter(e=>e.L>=12).sort((a,b)=>b.L-a.L).slice(0,2);
      long.forEach((e,ei)=>{if(ei&&hash(r.id+'bb')<.5)return;
        const u1=Math.max(1,Math.round(e.L/3.2)),bw=e.L/u1,off=hash(r.id+ei)<.5?0:1;
        for(let j=1;j<u1-1;j++){if((j+off)%2||W.inBuilding(...at(e,(j+.5)*bw,1.6)))continue;
          const [x,z]=at(e,(j+.5)*bw,0),col=BALC_COL[Math.floor(hash(r.id+'c'+j%3)*BALC_COL.length)];
          for(let k=1;k<v1;k++)if(balc.length<FD_MAX.balc)balc.push({x,y:yb+k*fh+.85,z,yaw:Math.atan2(e.nx,e.nz),sx:bw*.8,col});}});
    }
    // chimneys, dormers: single gable/hip roofs of low houses, where the LiDAR fit gave no chimney
    if(single&&sp.pitched&&n===4&&sp.kind==='house'&&!sp.front&&sp.h<=6.5){
      let [a,b,c,d]=p;
      if(sp.ridge===1)[a,b,c,d]=[b,c,d,a];else if(sp.ridge==null&&Math.hypot(b[0]-a[0],b[1]-a[1])<Math.hypot(c[0]-b[0],c[1]-b[1]))[a,b,c,d]=[b,c,d,a];
      const run=Math.hypot(b[0]-a[0],b[1]-a[1]),shortL=Math.hypot(c[0]-b[0],c[1]-b[1]),rh=sp.rh!=null?Math.min(sp.rh,shortL*.7):Math.min(shortL*.42,4);
      const ux=(b[0]-a[0])/run,uz=(b[1]-a[1])/run,cx=(a[0]+b[0]+c[0]+d[0])/4,cz=(a[1]+b[1]+c[1]+d[1])/4,ridgeHalf=sp.hip?Math.max(0,run/2-Math.min(shortL,run)/2):run/2;
      const ry=eave+rh,sg=hash(r.id+'sg')<.5?-1:1;
      if(!sp.chim&&hash(r.id+'ch')<.75&&ridgeHalf>1.2&&run>=6&&chim.length<FD_MAX.chim){
        const d0=Math.min(run*.22,ridgeHalf-.5)*sg;chim.push({x:cx+ux*d0,y:ry,z:cz+uz*d0,yaw:Math.atan2(ux,uz),col:[[.62,.4,.33],[.88,.86,.82],[.46,.43,.42]][Math.floor(hash(r.id+'cc')*3)]});}
      if(rh>=1.8&&shortL>=7&&run>=8&&hash(r.id+'dm')<.35&&dormB.length<FD_MAX.dorm-1){
        for(const side of hash(r.id+'d2')<.35?[-1,1]:[sg]){const dv=shortL/2*.5*side,d0=-sg*run*.2,[x,z]=[cx+ux*d0-uz*dv,cz+uz*d0+ux*dv];
          const y=ry-rh*(Math.abs(dv)/(shortL/2))-.15,nx=-uz*side,nz=ux*side,yaw=Math.atan2(nx,nz);
          if(W.inBuilding(x+nx*3,z+nz*3))continue;
          dormB.push({x,y,z,yaw,col:[.95,.94,.9]});dormR.push({x,y,z,yaw,col:sp.roof});}}
    }
    // shop glazing: ground-floor band and a fascia on the wall that faces the road
    if(single&&shop.length<FD_MAX.shop&&(t.shop||SHOP_AMENITY.test(t.amenity||'')||/^(retail|commercial|supermarket|kiosk)$/.test(t.building))&&sp.kind!=='church'){
      const cand=edges.filter(e=>e.L>=6.5).map(e=>{const [mx,mz]=at(e,e.L/2,2.5);return{e,open:!W.inBuilding(mx,mz),road:nearRoad(mx,mz)};}).filter(q=>q.open);
      cand.sort((a,b)=>(a.road<30?a.road:30)-(b.road<30?b.road:30)||b.e.L-a.e.L);
      const q=cand[0];
      if(q){const e=q.e,len=Math.min(e.L-1.6,26),s0=(e.L-len)/2,[x,z]=at(e,s0+len/2,0),g=GY(x,z),yaw=Math.atan2(e.nx,e.nz);
        shop.push({x,y:Math.max(g,yb+.3)+.3,z,yaw,sx:len});fasc.push({x,y:Math.max(g,yb+.3)+2.65,z,yaw,sx:len+.4,col:FASCIA[Math.floor(hash(r.id+'f')*FASCIA.length)]});}
    }
  }
  const st=(arr,name,geo,mat)=>{const m=fdMesh(geo,arr,mat);if(m)m.name=name;return m;};
  // balcony: slab, solid parapet, two side walls; origin at the wall face, +z outward, slab top at y 0
  let B=fdB();fdBox(B,-.5,.5,-.15,0,0,1.2,[.74,.74,.72]);fdBox(B,-.5,.5,0,1.0,1.12,1.2,[.95,.95,.95]);fdBox(B,-.5,-.46,0,1.0,0,1.12,[.92,.92,.9]);fdBox(B,.46,.5,0,1.0,0,1.12,[.92,.92,.9]);
  st(balc,'fx_balc',fdGeo(B),fdMat());
  // chimney: origin on the ridge, stack runs .8 m below and 1 m above, with a darker cap
  B=fdB();fdBox(B,-.28,.28,-.8,.9,-.28,.28,[.96,.96,.96]);fdBox(B,-.36,.36,.9,1.05,-.36,.36,[.34,.34,.35]);
  st(chim,'fx_chim',fdGeo(B),fdMat());
  // dormer: walls with a dark window, +z outward, back buried in the slope; the roof is a second mesh coloured like the house roof
  B=fdB();fdBox(B,-.78,.78,0,1.25,-1.1,.12,[1,1,1]);fdBox(B,-.45,.45,.3,1.0,.115,.14,[.2,.25,.3]);fdBox(B,-.52,.52,.22,.3,.115,.17,[.92,.92,.9]);
  st(dormB,'fx_dormB',fdGeo(B),fdMat());
  B=fdB();{const R=[.96,.96,.96],p=(x,y,z)=>[x,y,z];
    const tri=(a,b,c,n)=>{for(const v of[a,b,c]){B.pos.push(...v);B.col.push(...R);B.nor.push(...n);}};
    const y0=1.25,y1=1.95,z0=-1.2,z1=.3,x=.95,nl=[-.7,.7,0],nr=[.7,.7,0];
    tri(p(-x,y0,z1),p(0,y1,z1),p(0,y1,z0),nl);tri(p(-x,y0,z1),p(0,y1,z0),p(-x,y0,z0),nl);
    tri(p(0,y1,z1),p(x,y0,z1),p(x,y0,z0),nr);tri(p(0,y1,z1),p(x,y0,z0),p(0,y1,z0),nr);
    tri(p(-x,y0,z1),p(x,y0,z1),p(0,y1,z1),[0,0,1]);tri(p(-.78,1.25,.12),p(.78,1.25,.12),p(0,1.9,.12),[0,0,1]);}
  st(dormR,'fx_dormR',fdGeo(B),fdMat());
  B=fdB();fdBox(B,-.5,.5,0,.5,0,.1,[.32,.33,.34]);fdBox(B,-.5,.5,.5,2.1,0,.08,[.3,.42,.5]);fdBox(B,-.5,.5,2.1,2.2,0,.12,[.85,.86,.86]);
  st(shop,'fx_shop',fdGeo(B),fdMat(true));
  B=fdB();fdBox(B,-.5,.5,0,.75,0,.32,[1,1,1]);
  st(fasc,'fx_fascia',fdGeo(B),fdMat());
  W.fxCounts={balc:balc.length,chim:chim.length,dormer:dormB.length,shop:shop.length};W.fxSample={balc:balc[balc.length>>1],chim:chim[0],dormer:dormB[0],shop:shop[0]};
}

// ----- landmarks -----
// one merged mesh per landmark; flat-shaded, vertex colours, normals oriented away from a reference point inside the solid
function lmBuilder(){
  const B=fdB(),sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const tri=(a,b,c,col,ref)=>{
    let u=sub(b,a),v=sub(c,a),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const mid=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3],o=sub(mid,ref);
    if(n[0]*o[0]+n[1]*o[1]+n[2]*o[2]<0){[b,c]=[c,b];n=[-n[0],-n[1],-n[2]];}
    const l=Math.hypot(...n)||1;for(const q of[a,b,c]){B.pos.push(...q);B.col.push(...col);B.nor.push(n[0]/l,n[1]/l,n[2]/l);}
  };
  const L={B,tri,
    // frame: local x along u, z along n (outward)
    frame:(cx,cz,ux,uz,nx,nz)=>{const f={cx,cz,ux,uz,nx,nz};f.P=(x,y,z)=>[cx+ux*x+nx*z,y,cz+uz*x+nz*z];f.D=(x,y,z)=>[ux*x+nx*z,y,uz*x+nz*z];return f;},
    ring(P,col,ref){tri(P[0],P[1],P[2],col,ref);tri(P[0],P[2],P[3],col,ref);},
    box(f,x0,x1,y0,y1,z0,z1,col){
      const P=(x,y,z)=>f.P(x,y,z),c=P((x0+x1)/2,(y0+y1)/2,(z0+z1)/2),q=[P(x0,y0,z0),P(x1,y0,z0),P(x1,y1,z0),P(x0,y1,z0),P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)];
      for(const [a,b,d,e] of[[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]])L.ring([q[a],q[b],q[d],q[e]],col,c);
    },
    // flat polygon (convex or fan from first point) facing dir
    flat(pts,col,dir){const m=pts[0],ref=[m[0]-dir[0],m[1]-dir[1],m[2]-dir[2]];for(let i=1;i<pts.length-1;i++)tri(pts[0],pts[i],pts[i+1],col,ref);},
    // 4-sided frustum from half-width h0 at y0 to h1 at y1 (h1=0 is a pyramid)
    frust(f,lx,lz,h0,h1,y0,y1,col){
      const c=f.P(lx,(y0+y1)/2,lz),a=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>f.P(lx+i*h0,y0,lz+j*h0)),b=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>f.P(lx+i*h1,y1,lz+j*h1));
      for(let i=0;i<4;i++){const j=(i+1)%4;tri(a[i],a[j],b[j],col,c);if(h1>0)tri(a[i],b[j],b[i],col,c);}
    },
    lathe(cx,cz,prof,seg,col,phase=0){
      for(let j=0;j<prof.length-1;j++){const [r0,y0]=prof[j],[r1,y1]=prof[j+1],ref=[cx,(y0+y1)/2,cz];
        for(let i=0;i<seg;i++){const a0=phase+i/seg*Math.PI*2,a1=phase+(i+1)/seg*Math.PI*2,
          p=(r,y,a)=>[cx+Math.cos(a)*r,y,cz+Math.sin(a)*r];
          tri(p(r0,y0,a0),p(r0,y0,a1),p(r1,y1,a1),col,ref);if(r1>0)tri(p(r0,y0,a0),p(r1,y1,a1),p(r1,y1,a0),col,ref);}}
    },
    // arched opening on a face: rectangle then a semicircle, lifted off the wall by o
    arch(f,lx,lz,w,y0,hr,col,o=.03){
      const N=7,pts=[f.P(lx-w/2,y0,lz+o),f.P(lx+w/2,y0,lz+o)];
      for(let i=0;i<=N;i++){const a=i/N*Math.PI;pts.push(f.P(lx+Math.cos(a)*w/2,y0+hr+Math.sin(a)*w/2,lz+o));}
      const c=[f.P(lx,y0+hr*.5,lz+o)],d=f.D(0,0,1);
      for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];tri(c[0],a,b,col,[c[0][0]-d[0],c[0][1]-d[1],c[0][2]-d[2]]);}
    },
    mesh(){const g=fdGeo(B),m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));m.castShadow=m.receiveShadow=true;m.frustumCulled=false;return m;}
  };
  return L;
}
// smallest-area rectangle round an outline: u along the longer side
function lmObb(p){
  let best=null;
  for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],ang=Math.atan2(b[1]-a[1],b[0]-a[0]),c=Math.cos(ang),s=Math.sin(ang);
    let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;for(const q of p){const u=q[0]*c+q[1]*s,v=-q[0]*s+q[1]*c;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v);}
    const A=(u1-u0)*(v1-v0);if(!best||A<best.A)best={A,c,s,u0,u1,v0,v1};}
  let {c,s,u0,u1,v0,v1}=best;let L=u1-u0,Wd=v1-v0,ux=c,uz=s;
  if(Wd>L){[L,Wd]=[Wd,L];ux=-s;uz=c;}
  const mu=(u0+u1)/2,mv=(v0+v1)/2,cx=mu*c-mv*s,cz=mu*s+mv*c;
  return{cx,cz,ux,uz,L,W:Wd};
}
function buildLandmarks(){
  const W=world;buildFacadeDetails(W);
  const gmin=p=>Math.min(...p.map(q=>GY(q[0],q[1]))),gmax=p=>Math.max(...p.map(q=>GY(q[0],q[1])));
  const find=re=>W.buildings.find(b=>b.name&&re.test(b.name));
  const cen=p=>[p.reduce((a,q)=>a+q[0],0)/p.length,p.reduce((a,q)=>a+q[1],0)/p.length];
  const nearRoad=(x,z)=>{let d=1e9;for(const s of W.roadSegs(x,z)){if(s[4].cls>3)continue;const dx=s[2]-s[0],dz=s[3]-s[1],l2=dx*dx+dz*dz||1,t=clamp(((x-s[0])*dx+(z-s[1])*dz)/l2,0,1);d=Math.min(d,Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)-s[4].w/2);}return d;};
  const edgesOf=(pts)=>{const sg=polyArea(pts)>0?-1:1,o=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<.5)continue;
    const ux=dx/L,uz=dz/L,e={a,b,L,ux,uz,nx:sg*-uz,nz:sg*ux};e.at=(s,off)=>[a[0]+ux*s+e.nx*off,a[1]+uz*s+e.nz*off];o.push(e);}return o;};
  const eFrame=(B,e,s)=>{const [x,z]=e.at(s,0);return B.frame(x,z,e.ux,e.uz,e.nx,e.nz);};
  const add=(B,name)=>{const m=B.mesh();m.name=name;worldGroup.add(m);return m;};
  const WHITE=[.95,.95,.93],STONE=[.58,.56,.52],DARK=[.14,.16,.19],GOLD=[.8,.64,.2];
  W.landmarks={};

  // ---- Catholic church: belfry tower at the front corner with arched openings, cornices, red pyramid spire, arched portal with steps ----
  const ch=find(/Ėmimo į Dangų/);
  if(ch&&ch.sp&&ch.sp.towerAt){
    const s=ch.sp,B=lmBuilder(),T=LL(...s.towerAt),o=lmObb(ch.pts),C=cen(ch.pts),tw=s.towerW||8;
    const sgn=((T[0]-C[0])*o.ux+(T[1]-C[1])*o.uz)>=0?1:-1,nx=sgn*o.ux,nz=sgn*o.uz,f=B.frame(T[0],T[1],-nz,nx,nx,nz);
    const gy=Math.min(gmin(ch.pts),GY(T[0],T[1]))-.4,th=s.y0+s.h+s.towerH*.65,h=tw/2,wall=s.wall,rc=s.towerRoof||[.56,.26,.18];
    B.box(f,-h,h,gy,th,-h,h,wall);
    B.box(f,-h-.15,h+.15,gy,gy+1.1,-h-.15,h+.15,STONE);
    for(const y of[gy+(th-gy)*.5,th-4.8]){B.box(f,-h-.12,h+.12,y,y+.35,-h-.12,h+.12,[.86,.85,.82]);}
    for(const [i,j] of[[-1,-1],[1,-1],[1,1],[-1,1]])B.box(f,i*h-.3,i*h+.3,gy+1.1,th,j*h-.3,j*h+.3,[.9,.89,.86]);
    B.box(f,-h-.35,h+.35,th,th+.5,-h-.35,h+.35,[.88,.87,.84]);
    // belfry openings and a small round window on each face
    for(let q=0;q<4;q++){const a=q*Math.PI/2,ux=Math.cos(a),uz=Math.sin(a),fx=B.frame(T[0],T[1],f.ux*ux+f.nx*uz,f.uz*ux+f.nz*uz,f.nx*ux-f.ux*uz,f.nz*ux-f.uz*uz);
      B.arch(fx,0,h+.12,2.2,th-4.4,2.4,[.9,.89,.86],.02);B.arch(fx,0,h+.12,1.6,th-4.3,2.3,DARK,.05);
      B.arch(fx,0,h+.12,1.0,th-11.5>gy+4?th-11.5:gy+(th-gy)*.62,1.0,DARK,.04);}
    // spire: flared skirt, steep pyramid, ball and cross
    const hs=tw*(s.spire||.9)*1.15;
    B.frust(f,0,0,h+.45,h-.35,th+.5,th+1.5,rc);B.frust(f,0,0,h-.35,0,th+1.5,th+1.5+hs,rc);
    B.lathe(T[0],T[1],[[.0,th+1.5+hs-.1],[.35,th+1.5+hs+.15],[.0,th+1.5+hs+.6]],8,GOLD);
    B.box(f,-.07,.07,th+1.5+hs+.4,th+1.5+hs+2.6,-.07,.07,GOLD);B.box(f,-.5,.5,th+1.5+hs+1.8,th+1.5+hs+1.95,-.07,.07,GOLD);
    // portal: white surround, arched dark door, two niche windows, three steps
    const pp=f.P(0,0,h+1.6),fy=Math.max(GY(pp[0],pp[2]),gy+.6);
    B.arch(f,0,h,3.4,fy-.1,2.2,[.93,.92,.88],.04);B.arch(f,0,h,2.6,fy-.1,2.0,[.32,.21,.14],.07);B.box(f,-.05,.05,fy-.1,fy+3.9,h+.06,h+.1,[.2,.14,.1]);
    B.box(f,-2.1,2.1,fy+4.7,fy+5.0,h-.05,h+.45,[.88,.87,.84]);
    for(let i=0;i<3;i++)B.box(f,-2.2-i*.2,2.2+i*.2,gy,fy-.1-.2*(2-i),h,h+.35*(3-i),[.62,.6,.57]);
    for(const lx of[-2.2,2.2])B.arch(f,lx,h,1.0,gy+(th-gy)*.28,1.4,DARK,.04);
    // stone plinth round the whole footprint
    const sg=polyArea(ch.pts)>0?-1:1;
    for(let i=0;i<ch.pts.length;i++){const a=ch.pts[i],b=ch.pts[(i+1)%ch.pts.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1)continue;const n=[sg*-dz/L,0,sg*dx/L],p=(q,y)=>[q[0]+n[0]*.1,y,q[1]+n[2]*.1];
      B.flat([p(a,GY(a[0],a[1])-.2),p(b,GY(b[0],b[1])-.2),p(b,GY(b[0],b[1])+.8),p(a,GY(a[0],a[1])+.8)],STONE,n);}
    W.landmarks.church=add(B,'fx_church');
  }

  // ---- Orthodox church: octagonal drum with arched windows, cornice and a green onion dome with an eight-point cross; a smaller lantern on the entrance gable ----
  const ce=find(/Trejybės cerkvė/);
  if(ce){
    const B=lmBuilder(),o=lmObb(ce.pts),C=cen(ce.pts),glo=gmin(ce.pts),ytop=glo+ce.top;
    const dome=(cx,cz,r,y0,hd,col)=>{
      const seg=8,ph=Math.PI/seg;
      B.lathe(cx,cz,[[r,y0],[r,y0+hd]],seg,WHITE,ph);
      B.lathe(cx,cz,[[r+.35,y0+hd],[r+.35,y0+hd+.3],[r,y0+hd+.3]],seg,[.88,.87,.84],ph);
      for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,nx=Math.cos(a),nz=Math.sin(a),ap=r*Math.cos(Math.PI/seg),f=B.frame(cx,cz,-nz,nx,nx,nz);
        B.arch(f,0,ap,r*.52,y0+hd*.3,hd*.3,DARK,.04);}
      const y=y0+hd+.3;
      B.lathe(cx,cz,[[r+.1,y],[r*1.22,y+r*.28],[r*1.32,y+r*.62],[r*1.12,y+r*1.05],[r*.7,y+r*1.5],[r*.32,y+r*1.9],[.0,y+r*2.15]],14,col);
      const ty=y+r*2.15,f=B.frame(cx,cz,o.uz,-o.ux,o.ux,o.uz);
      B.lathe(cx,cz,[[.0,ty-.1],[.3,ty+.1],[.0,ty+.5]],8,GOLD);
      B.box(f,-.06,.06,ty+.4,ty+r*1.1+.4,-.06,.06,GOLD);B.box(f,-.28,.28,ty+r*.95,ty+r*.95+.1,-.06,.06,GOLD);B.box(f,-.45,.45,ty+r*.65,ty+r*.65+.1,-.06,.06,GOLD);
    };
    dome(C[0],C[1],2.7,ytop-1.5,4.0,[.3,.43,.38]);
    const ex=C[0]+o.ux*o.L*.36,ez=C[1]+o.uz*o.L*.36;if(pip(ex,ez,ce.pts))dome(ex,ez,1.3,ytop-2.2,2.0,[.3,.43,.38]);
    // plinth
    const sg=polyArea(ce.pts)>0?-1:1;
    for(let i=0;i<ce.pts.length;i++){const a=ce.pts[i],b=ce.pts[(i+1)%ce.pts.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1)continue;const n=[sg*-dz/L,0,sg*dx/L],p=(q,y)=>[q[0]+n[0]*.1,y,q[1]+n[2]*.1];
      B.flat([p(a,GY(a[0],a[1])-.2),p(b,GY(b[0],b[1])-.2),p(b,GY(b[0],b[1])+.7),p(a,GY(a[0],a[1])+.7)],[.6,.58,.54],n);}
    W.landmarks.cerkve=add(B,'fx_cerkve');
  }

  // ---- culture centre: two rows of tall windows on every open wall, roof parapet, canopied entrance on the road side, plant on the roof ----
  const cu=find(/kultūros centras/);
  if(cu){
    const B=lmBuilder(),glo=gmin(cu.pts),ghi=gmax(cu.pts),yr=(glo+ghi)/2+((LOOK.c171&&LOOK.c171.h)||10),E=edgesOf(cu.pts);
    let front=null,fd=1e9;
    for(const e of E){if(e.L<6)continue;const [mx,mz]=e.at(e.L/2,2),op=!W.inBuilding(mx,mz);if(!op)continue;const d=nearRoad(mx,mz)-e.L*.02;if(d<fd){fd=d;front=e;}}
    for(const e of E){
      const [mx,mz]=e.at(e.L/2,1.2);if(e.L<4||W.inBuilding(mx,mz))continue;
      const f=eFrame(B,e,0);
      for(let s=1.6;s<e.L-1.2;s+=2.4){const [wx,wz]=e.at(s,.5);if(W.inBuilding(wx,wz))continue;
        const g=GY(...e.at(s,0));
        for(const yy of[1.3,5.3]){const y=g+yy;B.box(f,s-.62,s+.62,y-.1,y+1.65,-.02,.1,[.9,.9,.88]);B.box(f,s-.5,s+.5,y,y+1.5,.04,.12,[.2,.27,.33]);}}
      B.box(f,0,e.L,yr,yr+.55,-.12,.3,[.84,.84,.82]);
    }
    if(front){const f=eFrame(B,front,0),s=front.L*.4,g=GY(...front.at(s,0)),w=9;
      B.box(f,s-w/2,s+w/2,g+3.7,g+4.05,-.05,4.2,[.9,.9,.88]);B.box(f,s-w/2,s+w/2,g+4.05,g+4.7,3.6,4.2,[.18,.36,.55]);
      for(const lx of[-w/2+.2,w/2-.2])B.box(f,s+lx-.15,s+lx+.15,g,g+3.7,3.8,4.1,[.7,.7,.68]);
      B.box(f,s-3,s+3,g,g+3.4,-.02,.14,[.2,.27,.33]);B.box(f,s-.04,s+.04,g,g+3.4,.1,.18,[.8,.8,.78]);
      B.box(f,s-w/2-.4,s+w/2+.4,g-.0,g+.2,0,4.2,[.72,.72,.7]);}
    const [rx,rz]=cen(cu.pts);
    for(const [dx,dz,a,b,h] of[[-8,-6,3,2,1.6],[7,5,2.6,2.4,1.3],[-3,8,4,1.6,1.1]]){const f=B.frame(rx+dx,rz+dz,1,0,0,1);B.box(f,-a/2,a/2,yr,yr+h,-b/2,b/2,[.72,.74,.75]);}
    W.landmarks.culture=add(B,'fx_culture');
  }

  // ---- Maxima XX: glazed shopfront with mullions, canopied glass vestibule, blue fascia band, roof plant ----
  const mx=find(/^Maxima XX/);
  if(mx){
    const B=lmBuilder(),glo=gmin(mx.pts),ghi=gmax(mx.pts),yr=(glo+ghi)/2+((LOOK.c2134&&LOOK.c2134.h)||10.85),E=edgesOf(mx.pts);
    let front=null,fd=1e9;
    for(const e of E){if(e.L<15)continue;const [px,pz]=e.at(e.L/2,3),d=nearRoad(px,pz)-e.L*.3;if(d<fd&&!W.inBuilding(px,pz)){fd=d;front=e;}}
    if(front){
      const f=eFrame(B,front,0),L=front.L,g=GY(...front.at(L/2,0)),a0=3.5,a1=L-3.5,vx=L*.28;
      B.box(f,a0,a1,g+.3,g+.85,-.02,.12,[.4,.41,.42]);B.box(f,a0,a1,g+.85,g+3.2,-.02,.1,[.27,.38,.47]);B.box(f,a0,a1,g+3.2,g+3.4,-.02,.16,[.88,.88,.86]);
      for(let s=a0;s<=a1+.01;s+=3.2)B.box(f,s-.07,s+.07,g+.3,g+3.4,-.02,.16,[.86,.86,.84]);
      B.box(f,0,L,yr-1.7,yr-.6,-.02,.22,[.1,.26,.6]);B.box(f,0,L,yr-.6,yr-.4,-.02,.22,[.82,.16,.14]);
      // vestibule
      B.box(f,vx-3.4,vx+3.4,g,g+3.3,.1,3.4,[.28,.4,.5]);B.box(f,vx-3.7,vx+3.7,g+3.3,g+3.65,-.05,3.9,[.9,.9,.88]);B.box(f,vx-3.7,vx+3.7,g+3.65,g+4.3,3.3,3.9,[.1,.26,.6]);
      for(const s of[-3.4,-1.1,1.1,3.4])B.box(f,vx+s-.08,vx+s+.08,g,g+3.3,3.3,3.5,[.85,.85,.83]);
      B.box(f,vx-1.3,vx+1.3,g,g+2.4,3.38,3.46,[.12,.15,.2]);
    }
    const [rx,rz]=cen(mx.pts),o=lmObb(mx.pts);
    for(const [du,dv,a,b,h] of[[-.25,-.2,3.2,2.4,1.5],[.05,.2,4,2.6,1.2],[.3,-.15,2.4,2.4,1.8],[-.05,0,2,2,1.1]]){const f=B.frame(o.cx+o.ux*du*o.L-o.uz*dv*o.W,o.cz+o.uz*du*o.L+o.ux*dv*o.W,o.ux,o.uz,-o.uz,o.ux);B.box(f,-a/2,a/2,yr,yr+h,-b/2,b/2,[.74,.75,.76]);}
    W.landmarks.maxima=add(B,'fx_maxima');
  }
}
