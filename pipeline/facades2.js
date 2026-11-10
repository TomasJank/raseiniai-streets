//#core
// ---------- facades2: per-building knobs read from street-file looks (add_facades2.py) ----------
// two-tone walls: the vertex attribute `tone` is (r,g,b,-(bandY+500)) on upper-wall triangles; (0,0,0,1) is the GL default and means "no band"
const NOTONE=[0,0,0,1];
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
