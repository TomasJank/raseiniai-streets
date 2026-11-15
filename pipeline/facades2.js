//#core
// ---------- facades2: per-building knobs read from street-file looks (add_facades2.py) ----------
// two-tone walls: the vertex attribute `tone` is (r,g,b,-(bandY+500)) on upper-wall triangles; (0,0,0,1) is the GL default and means "no band"
const NOTONE=[0,0,0,1];
// window size on one-storey houses and sheds: the atlas window is a fixed share of the storey, and a one-storey house's storey is its whole
// wall (median 3.6 m), so its frame came out 1.4-1.55 m wide and ~1.9 m tall. Per style: the window's box in tile pixels
// (x0, x1, top, bottom: frame, sill and lintel/casing), its frame width and height in pixels, and the frame size wanted in metres.
// Walls of such houses get u + WIN_U (fract unchanged); the shader shrinks the box to that size about its centre, sill kept.
const WIN_U=1024,WIN_FIX={0:[30,98,22,99,62,66,1.2,1.35],1:[30,98,12,105,58,80,1.2,1.4],4:[30,98,22,99,62,66,1.2,1.35],
  5:[32,94,22,99,56,68,1.15,1.35],11:[30,98,19,99,62,66,1.2,1.35],13:[26,102,16,99,56,68,1.15,1.35]};
const winFix=s=>(s.kind==='house'||s.kind==='shed')&&!!WIN_FIX[s.sty]&&!(typeof kitSized==='function'&&kitSized(s.rid));
// [kx, ky, box] shrink of the window on a bay bw x storey sh metres, or null when it is already small enough
function winK(sty,bw,sh){const q=WIN_FIX[sty];if(!q)return null;const kx=Math.max(1,q[4]/128*bw/q[6]),ky=Math.max(1,q[5]/128*sh/q[7]);return kx>1||ky>1?[kx,ky,q]:null;}
const WIN_GLSL=(()=>{const n=v=>v.toFixed(5);let s='';
  for(const k in WIN_FIX){const [x0,x1,yt,yb,fw,fh,W,H]=WIN_FIX[k];s+=`if(abs(ws-${k}.)<.5){wb=vec4(${n(x0/128)},${n(x1/128)},${n(1-yb/128)},${n(1-yt/128)});wf=vec4(${n(fw/128)},${n(fh/128)},${n(W)},${n(H)});}`;}
  // metres per tile along u and v from screen derivatives (the wall is a plane, so this is exact), then a piecewise-linear warp
  // per axis: box [a,b] shows on [a2,b2], the wall outside it is stretched to fill, gradients scaled with it
  return `if(vMapUv.x>=${WIN_U/2}.&&bl<.5){vec4 wb=vec4(0.),wf=vec4(0.);${s}
    vec3 px=dFdx(vViewPosition),py=dFdy(vViewPosition);vec2 qx=dFdx(vMapUv),qy=dFdy(vMapUv);float dt=qx.x*qy.y-qx.y*qy.x;
    if(wf.x>0.&&abs(dt)>1e-14){
      vec2 k=max(vec2(1.),wf.xy*vec2(length(px*qy.y-py*qx.y),length(py*qx.x-px*qy.x))/abs(dt)/wf.zw);
      float c=(wb.x+wb.y)*.5;vec2 a=wb.xz,b=wb.yw,a2=vec2(c-(c-a.x)/k.x,a.y),b2=vec2(c+(b.x-c)/k.x,a.y+(b.y-a.y)/k.y),i0=step(a2,f),i1=step(b2,f);
      vec2 g=mix(mix(f*a/a2,a+(f-a2)*(b-a)/(b2-a2),i0),b+(f-b2)*(1.-b)/(1.-b2),i1);
      auv=vec2((ws+g.x)*sc.x,((vMapUv.y<1.?2.:3.)+g.y)*sc.y);sc*=mix(mix(a/a2,(b-a)/(b2-a2),i0),(1.-b)/(1.-b2),i1);}}`;})();
function facade2(sp,w){
  // cross-gabled wings: the eaves overhang of one wing sticks through the other's roof as dark X-shaped lines, so wings sit flush
  if(w.tags.parts&&sp.pitched)sp.noEave=true;
  if(!LOOK[w.id])return sp;
  if(typeof sp.ridge==='string')sp.ridge=null;
  if(sp.pitched===false){sp.skel=null;sp.tops=null;sp.hip=false;sp.chim=null;sp.rh=null;}
  return sp;
}
// the corner order [a,b,c,d] a pitched roof is built on: ridge runs a->b
function pitchOrder(p,s){
  let [a,b,c,d]=p;
  if(s.front){let k=0,bd=Infinity;for(let i=0;i<4;i++){const q=p[(i+1)%4],e=Math.hypot((p[i][0]+q[0])/2-s.front[0],(p[i][1]+q[1])/2-s.front[1]);if(e<bd){bd=e;k=i;}}[a,b,c,d]=[p[(k+3)%4],p[k],p[(k+1)%4],p[(k+2)%4]];}
  else if(s.rdir){const f=(u,v)=>Math.abs((v[0]-u[0])*s.rdir[0]+(v[1]-u[1])*s.rdir[1])/Math.hypot(v[0]-u[0],v[1]-u[1]);if(f(a,b)<f(b,c))[a,b,c,d]=[b,c,d,a];}
  else if(s.ridge===1)[a,b,c,d]=[b,c,d,a];
  else if(s.ridge==null&&Math.hypot(b[0]-a[0],b[1]-a[1])<Math.hypot(c[0]-b[0],c[1]-b[1]))[a,b,c,d]=[b,c,d,a];
  return[a,b,c,d];
}
// edges (in the reversed outline the builder walks) whose walls are the gable ends
function gableIdx(p,s){const [,b,,d]=pitchOrder(p,s);return[p.indexOf(b),p.indexOf(d)];}
// i is an edge of the walked outline; faces.windows is indexed by the outline as listed in the OSM way
function faceOff(s,i,n,rev,gb){return!!((gb&&gb.includes(i))||(s.faces&&s.faces.windows&&s.faces.windows[rev?(n-2-i+n)%n:i]===0));}
// extra fence styles and hedge density; returns true when it drew the fence itself
function fence2(f,at,h,l,st){
  const s=f.style;
  if(s==='hedge'&&f.dense){at('hedge',l/2,h*.3,1.15,h*.6,l);at('hedge',l/2,h*.75,.8,h*.5,l);return true;}
  if(s==='panel'){at('panel',l/2,.35+(h-.35)/2,.1,h-.35,l);at('plinth',l/2,.17,.16,.35,l);for(let t=0;t<=l+.01;t+=2.5)at('plinth',Math.min(t,l),h/2,.2,h+.05,.2);return true;}
  if(s==='slat'){for(let y=.08;y<h-.05;y+=.17)at('slat',l/2,y,.05,.11,l);for(let t=0;t<=l+.01;t+=2.4)at('post',Math.min(t,l),h/2,.1,h+.05,.1);return true;}
  return false;
}
// one tile row of the facade atlas: wall grain on the painted pixels, fixed (glass, frames, plinths) pixels keep their own colour
function atlasBand(a,b,out,y0,T,W,H,VN){
  for(let y=y0;y<y0+T;y++)for(let x=0;x<W;x++){
    const i=((y-y0)*W+x)*4,o=((H-1-y)*W+x)*4,s=(x/T)|0;
    const f=b[i]>127?1+(((x*7+y*13)%11)/11-.5)*.04:1+(VN(s,x%T,y%T)-.5)*.1+(((x*7+y*13+s*5)%17)/17-.5)*.05;
    out[o]=Math.min(255,a[i]*f);out[o+1]=Math.min(255,a[i+1]*f);out[o+2]=Math.min(255,a[i+2]*f);out[o+3]=b[i];
  }
}
