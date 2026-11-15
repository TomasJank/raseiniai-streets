// ---------- kit: doors, windows per wall, porches, extensions, plinth, chimneys, dormers, balconies (add_kit.py) ----------
// KIT[id] comes from pipeline/kit/looks/*.json with sides resolved to OSM edge indices `e`, `f` = the front edge.
// Large parts (extensions, closed porches, porch roofs, balconies, dormers) go into the merged building mesh and cast shadows;
// small ones (window and door panels, steps, plinth, chimneys) into one extra mesh without shadows.
// A window is a patch of the facade atlas: the wall it sits on loses its automatic windows (the facades2 face mask).
const KIT_S={pos:[],col:[],nor:[],uv:[],sty:[],tr:[],tx:[],cs:-1,tn:NOTONE},KIT_WARN=[],KIT_DONE=new Set();let kitWarned=false;
const KIT_DOOR={single:[.95,2.1,[.36,.23,.15]],double:[1.5,2.1,[.36,.23,.15]],glass:[1.0,2.15,[.26,.32,.38]],garage:[2.6,2.15,[.8,.8,.78]]};
const KIT_SHAPE={normal:1,wide:1.7,narrow:.7},KIT_EXT_STY=['plaster','brick','silicate','plank','panel','corrugated','sheet','none'];
function kitNorm(id,K,n){
  const w=k=>KIT_WARN.push(id+'.'+k),E=e=>Number.isInteger(e)&&e>=0&&e<n,num=(v,a,b)=>typeof v==='number'&&v>=a&&v<=b;
  const col=v=>Array.isArray(v)&&v.length===3&&v.every(x=>num(x,0,1)),fr=v=>Array.isArray(v)&&v.length>0&&v.every(x=>num(x,0,1));
  const O={f:E(K.f)?K.f:0};
  const one=(k,ok)=>{if(K[k]==null)return;if(ok(K[k]))O[k]=K[k];else w(k);};
  one('frame',col);one('gable',col);one('plinth',col);one('plinthH',v=>num(v,.1,1.5));
  one('winShape',v=>v in KIT_SHAPE);one('gableSty',v=>typeof TEXI!=='undefined'&&v in TEXI);
  one('chim',v=>Number.isInteger(v)&&v>=1&&v<=4||fr(v)&&v.length<=4);
  const row=r=>Number.isInteger(r)&&r>=0&&r<=12||fr(r)&&r.length<=12;
  if(K.win!=null)O.win=(Array.isArray(K.win)?K.win:[]).filter(q=>{const ok=Array.isArray(q)&&E(q[0])&&Array.isArray(q[1])&&q[1].every(row);if(!ok)w('win');return ok;});
  const list=(k,ok)=>{if(K[k]==null)return;O[k]=(Array.isArray(K[k])?K[k]:[K[k]]).filter(q=>{const g=q&&E(q.e)&&ok(q);if(!g)w(k);return g;});};
  const opt=(q,k,ok)=>q[k]==null||ok(q[k]);
  list('door',q=>(q.at==null||num(q.at,0,1)||fr(q.at))&&opt(q,'type',v=>v in KIT_DOOR)&&opt(q,'col',col)&&opt(q,'steps',v=>typeof v==='boolean')&&opt(q,'porch',v=>/^(none|canopy|closed)$/.test(v)));
  list('ext',q=>opt(q,'at',v=>num(v,0,1))&&opt(q,'w',v=>num(v,.1,1))&&opt(q,'d',v=>num(v,.8,12))&&opt(q,'h',v=>num(v,2,8))&&opt(q,'roof',v=>/^(flat|lean|gable)$/.test(v))&&opt(q,'wall',col)&&opt(q,'roofCol',col)&&opt(q,'glazed',v=>typeof v==='boolean')&&opt(q,'sty',v=>KIT_EXT_STY.includes(v)));
  list('balc',q=>opt(q,'at',v=>num(v,0,1))&&opt(q,'w',v=>num(v,.1,1))&&opt(q,'floor',v=>Number.isInteger(v)&&v>=1&&v<=20)&&opt(q,'col',col));
  list('dorm',q=>opt(q,'n',v=>Number.isInteger(v)&&v>=1&&v<=6)&&opt(q,'type',v=>/^(gable|shed)$/.test(v)));
  return O;
}
// triangle into A (KIT_S or the building accumulator) with its `tex` material (-1 = plain colour)
function kitTri(A,a,b,c,col,want,tx,uv){
  const v=A.pos.length/3;addTri(A,a,b,c,col,uv?uv[0]:UV0,uv?uv[1]:UV0,uv?uv[2]:UV0,want);
  if(A===KIT_S)A.tx.push(tx,tx,tx);else if(A.tx&&tx>=0)A.tx[v]=A.tx[v+1]=A.tx[v+2]=tx;
}
function kitQuad(A,p,col,want,tx,uv){kitTri(A,p[0],p[1],p[2],col,want,tx,uv&&[uv[0],uv[1],uv[2]]);kitTri(A,p[0],p[2],p[3],col,want,tx,uv&&[uv[0],uv[2],uv[3]]);}
// a wall's frame: s metres from its left end (seen from outside), o metres out from it, at height y
function kitFrame(a,b){const L=Math.hypot(b[0]-a[0],b[1]-a[1]),u=[(b[0]-a[0])/L,(b[1]-a[1])/L],n=[-u[1],u[0]];
  return{a,b,L,u,n,P:(s,o,y)=>[a[0]+u[0]*s+n[0]*o,y,a[1]+u[1]*s+n[1]*o],out:[n[0],0,n[1]],along:[u[0],0,u[1]]};}
// box in a wall frame; faces: front, left, right, top, bottom, back
function kitBox(A,F,s0,s1,o0,o1,y0,y1,col,tx,faces='flrt'){
  const P=F.P,q={f:[[P(s0,o1,y0),P(s1,o1,y0),P(s1,o1,y1),P(s0,o1,y1)],F.out],k:[[P(s1,o0,y0),P(s0,o0,y0),P(s0,o0,y1),P(s1,o0,y1)],F.out.map(v=>-v)],
    l:[[P(s0,o0,y0),P(s0,o1,y0),P(s0,o1,y1),P(s0,o0,y1)],F.along.map(v=>-v)],r:[[P(s1,o1,y0),P(s1,o0,y0),P(s1,o0,y1),P(s1,o1,y1)],F.along],
    t:[[P(s0,o1,y1),P(s1,o1,y1),P(s1,o0,y1),P(s0,o0,y1)],[0,1,0]],b:[[P(s0,o0,y0),P(s1,o0,y0),P(s1,o1,y0),P(s0,o1,y0)],[0,-1,0]]};
  for(const c of faces)kitQuad(A,q[c][0],col,q[c][1],tx);
}
// a window: the atlas tile of style sty, columns u0..u1 and rows v0..v1 of it, on a w x (y1-y0) panel centred s metres along the wall
function kitWin(F,s,w,y0,y1,u0,u1,v0,v1,sty,col,tx,j,o=.03){
  KIT_S.cs=sty;kitQuad(KIT_S,[F.P(s-w/2,o,y0),F.P(s+w/2,o,y0),F.P(s+w/2,o,y1),F.P(s-w/2,o,y1)],col,F.out,tx,[[j+u0,v0],[j+u1,v0],[j+u1,v1],[j+u0,v1]]);KIT_S.cs=-1;
}
function kitHouse(B,P,s,K,prev,rev,R){
  const n=P.length,W=e=>rev?(n-2-e+n)%n:e,yb=s.yb||0,y0=s.y0||0,h=y0+s.h,v1=Math.max(1,Math.round((h-yb)/3)),fh=(h-yb)/v1;
  const sty=s.sty>=0?s.sty:STY.plaster,wm=typeof texWall==='function'?texWall(s):-1,TI=typeof TEXI!=='undefined'?TEXI:{},concrete=TI.concrete??-1;
  const bandY=s.wall2?yb+.3+(s.band==null?3:s.band):1e9,wcol=y=>y>=bandY-.01?s.wall2:s.wall,gcol=s.gable||s.wall2||s.wall;
  const fw=i=>kitFrame(P[i],P[(i+1)%n]),scale=KIT_SHAPE[K.winShape||'normal'],rTx=typeof TEX_ROOF!=='undefined'?TEX_ROOF[roofSty(s)]??-1:-1;
  KIT_S.tn=K.frame?[...K.frame,2]:NOTONE;
  const doorAt={};
  for(const D of K.door||[]){const i=W(D.e),F=fw(i),[dw,dh,dc]=KIT_DOOR[D.type||'single'],gar=D.type==='garage';
    for(const t of D.at==null?[.5]:[].concat(D.at)){
      const sm=Math.min(Math.max(t*F.L,dw/2+.1),F.L-dw/2-.1),g=GY(...[0,2].map(k=>F.P(sm,0,0)[k])),steps=D.steps&&!gar,yd=Math.max(yb+.05,g+(steps?.45:.04));
      (doorAt[i]||(doorAt[i]=[])).push([sm,dw]);
      let Fd=F,od=0;
      if(D.porch==='closed'&&!gar){const pw=Math.max(2.2,dw+1.4),pd=1.8,ph=yd+2.5-y0;
        prev(B,[F.P(sm-pw/2,-.05,0),F.P(sm+pw/2,-.05,0),F.P(sm+pw/2,pd,0),F.P(sm-pw/2,pd,0)].map(q=>[q[0],q[2]]),
          {h:ph,y0,yb,wall:s.wall,roof:s.roof,roofSty:s.roofSty,sty:-1,pitched:true,rh:.9,rdir:F.n,kind:'house',rid:s.rid});od=pd;}
      if(!gar)kitBox(KIT_S,Fd,sm-dw/2-.08,sm+dw/2+.08,od,od+.03,yd,yd+dh+.08,K.frame||[.9,.9,.88],-1,'f');
      kitBox(KIT_S,Fd,sm-dw/2,sm+dw/2,od,od+.045,yd,yd+dh,D.col||dc,-1,'f');
      if(steps)kitBox(KIT_S,Fd,sm-dw/2-.3,sm+dw/2+.3,od,od+.9,g-.1,yd,[.6,.6,.58],concrete,'flrt');
      if(D.porch==='canopy')kitBox(B,Fd,sm-dw/2-.5,sm+dw/2+.5,od,od+1.1,yd+dh+.3,yd+dh+.42,s.roof,-1,'flrtb');
    }}
  for(const [e,rows] of K.win||[]){const i=W(e),F=fw(i),dr=doorAt[i]||[];
    rows.forEach((r,k)=>{const ts=typeof r==='number'?Array.from({length:r},(_,j)=>(j+.5)/r):r;
      if(k<v1){const ww=1.92*scale,ya=yb+k*fh;
        ts.forEach((t,j)=>{const sm=Math.min(Math.max(t*F.L,ww/2),F.L-ww/2);if(k===0&&dr.some(([x,w])=>Math.abs(x-sm)<w/2+.75))return;
          kitWin(F,sm,ww,ya,ya+fh,.2,.8,k,k+.999,sty,wcol(ya),wm,j);});}
      else if(k<=v1+1&&R&&R.gab.includes(i)){
        // gable rows: the attic storey from just above the eaves, then a small loft window above it
        const h0=Math.min(fh*.8,R.rh*(rows.length>v1+1?.42:.62)),hd=k===v1?h0:h0*.55,yg=k===v1?h+.12:h+.32+h0,wd=1.66*hd/(fh*.8)*scale;
        ts.forEach((t,j)=>{const off=Math.abs(t*F.L-F.L/2),room=(1-(yg+hd-h)/R.rh)*F.L/2-off,f=Math.min(1,room*2/wd);
          if(wd*f<.4){KIT_WARN.push(s.rid+'.win: gable window '+k+'/'+j+' does not fit under the roof');return;}
          kitWin(F,t*F.L,wd*f,yg,yg+hd*f,.24,.76,v1+.1,v1+.9,sty,gcol,wm,j);});}
      else KIT_WARN.push(s.rid+'.win: row '+k+' of edge '+e+' has no wall (house has '+v1+' storeys'+(R&&R.gab.includes(i)?'':', and this wall is no gable end')+')');});}
  if(K.plinth){const ph=K.plinthH||.5;for(let i=0;i<n;i++){const F=fw(i);if(F.L<.3)continue;const ga=GY(...F.a)+ph,gb=GY(...F.b)+ph;
    kitQuad(KIT_S,[F.P(0,.02,yb),F.P(F.L,.02,yb),F.P(F.L,.02,Math.max(gb,yb+.1)),F.P(0,.02,Math.max(ga,yb+.1))],K.plinth,F.out,concrete);}}
  for(const X of K.ext||[]){const F=fw(W(X.e)),ew=(X.w||.5)*F.L,sm=Math.min(Math.max((X.at??.5)*F.L,ew/2),F.L-ew/2),d=X.d||3,eh=X.h||2.6,roof=X.roof||'lean';
    const fp=[F.P(sm-ew/2,-.05,0),F.P(sm+ew/2,-.05,0),F.P(sm+ew/2,d,0),F.P(sm-ew/2,d,0)].map(q=>[q[0],q[2]]),lean=Math.min(1.2,d*.3);
    prev(B,fp,{h:eh,y0,yb,wall:X.wall||(X.glazed?[.86,.88,.88]:s.wall),roof:X.roofCol||s.roof,roofSty:s.roofSty,sty:X.glazed?STY.glass:X.sty?(X.sty==='none'?-1:STY[X.sty]):sty,kind:'house',rid:s.rid,
      pitched:roof==='gable',rh:roof==='gable'?Math.min(2.2,ew*.35):null,rdir:F.n,tops:roof==='lean'?[eh+lean,eh+lean,eh,eh]:null});}
  for(const Q of K.balc||[]){const i=W(Q.e),F=fw(i),bw=Math.max(1.5,(Q.w||.35)*F.L),sm=Math.min(Math.max((Q.at??.5)*F.L,bw/2),F.L-bw/2);
    const k=Math.min(Q.floor??(R&&R.gab.includes(i)?v1:1),v1),y=yb+k*fh,c=Q.col||[.9,.9,.88];
    kitBox(B,F,sm-bw/2,sm+bw/2,0,.9,y-.15,y,[.75,.75,.73],concrete,'flrtb');
    kitBox(B,F,sm-bw/2,sm+bw/2,.86,.9,y,y+1,c,-1,'fkt');kitBox(B,F,sm-bw/2,sm-bw/2+.04,0,.86,y,y+1,c,-1,'lr');kitBox(B,F,sm+bw/2-.04,sm+bw/2,0,.86,y,y+1,c,-1,'lr');}
  if(K.chim&&R){const {a,b,c,d,run,shortL}=R,ux=(b[0]-a[0])/run,uz=(b[1]-a[1])/run,k=s.hip?Math.min(shortL,run)/2:0;
    let A=[(d[0]+a[0])/2+ux*k,(d[1]+a[1])/2+uz*k],Z=[(b[0]+c[0])/2-ux*k,(b[1]+c[1])/2-uz*k];
    const fl=fw(W(K.f)).a;if(Math.hypot(Z[0]-fl[0],Z[1]-fl[1])<Math.hypot(A[0]-fl[0],A[1]-fl[1]))[A,Z]=[Z,A];
    const RF=kitFrame(A,Z),ry=h+R.rh;
    for(const t of typeof K.chim==='number'?Array.from({length:K.chim},(_,j)=>(j+.5)/K.chim):K.chim){const sm=Math.min(Math.max(t*RF.L,.4),RF.L-.4);
      kitBox(KIT_S,RF,sm-.26,sm+.26,-.26,.26,ry-.8,ry+.9,CHIMNEY,TI.brick??-1,'fklrt');}}
  for(const Q of K.dorm||[]){const i=W(Q.e);
    if(!R||!R.eave.includes(i)){KIT_WARN.push(s.rid+'.dorm: edge '+Q.e+' has no roof slope over it');continue;}
    const F=fw(i),hs=R.shortL/2,slope=x=>h+R.rh*Math.min(x,hs)/hs,X=y=>Math.min(hs,(y-h)/R.rh*hs),s0=.35,yt=h+Math.min(1.7,R.rh*.75),yf=slope(s0)-.05,dc=gcol;
    const shed=Q.type==='shed',cnt=Q.n||(shed?2:1),dw=shed?Math.min(F.L*.55,cnt*2.2):1.7,P2=(s,x,y)=>F.P(s,-x,y);
    const ctr=shed?[F.L/2]:Array.from({length:cnt},(_,j)=>(j+.5)/cnt*F.L);
    for(const c of ctr){const l=c-dw/2,r=c+dw/2,top=shed?yt+.05:yt,xb=X(top);
      kitQuad(B,[P2(l,s0,yf),P2(r,s0,yf),P2(r,s0,yt),P2(l,s0,yt)],dc,F.out,wm);
      for(const [sx,nv] of [[l,F.along.map(v=>-v)],[r,F.along]])kitTri(B,P2(sx,s0,yf),P2(sx,s0,top),P2(sx,xb,top),dc,nv,wm);
      if(shed){const yr=Math.min(yt+.35,h+R.rh),xr=X(yr);
        for(const [sx,nv] of [[l,F.along.map(v=>-v)],[r,F.along]])kitTri(B,P2(sx,s0,top),P2(sx,xr,yr),P2(sx,xb,top),dc,nv,wm);
        kitQuad(B,[P2(l-.1,s0-.15,top),P2(r+.1,s0-.15,top),P2(r+.1,xr,yr),P2(l-.1,xr,yr)],s.roof,[F.out[0],3,F.out[2]],rTx);}
      else{const yp=Math.min(yt+.55,h+R.rh),xr=X(yp),pk=P2(c,s0,yp);
        kitTri(B,P2(l,s0,yt),P2(r,s0,yt),pk,dc,F.out,wm);
        kitQuad(B,[P2(l-.1,s0-.15,yt-.05),P2(c,s0-.15,yp),P2(c,xr,yp),P2(l-.1,xb,yt-.05)],s.roof,[F.out[0]-F.u[0],2,F.out[2]-F.u[1]],rTx);
        kitQuad(B,[P2(c,s0-.15,yp),P2(r+.1,s0-.15,yt-.05),P2(r+.1,xb,yt-.05),P2(c,xr,yp)],s.roof,[F.out[0]+F.u[0],2,F.out[2]+F.u[1]],rTx);}
      const hd=(yt-yf)*.85,wd=1.66*hd/(fh*.8)*scale,wn=shed?cnt:1;
      for(let j=0;j<wn;j++)kitWin(F,l+(j+.5)*dw/wn,Math.min(wd,dw/wn-.2),yf+(yt-yf-hd)/2,yf+(yt-yf+hd)/2,.24,.76,v1+.1,v1+.9,sty,dc,wm,j,.03-s0);}}
  KIT_S.tn=NOTONE;
}
// walked outline edge i lies on the line of segment u-v (a part's wall): parallel and within 0.3 m
function kitOn(P,i,u,v){const a=P[i],b=P[(i+1)%P.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]),M=Math.hypot(v[0]-u[0],v[1]-u[1]);
  return Math.abs(((b[0]-a[0])*(v[1]-u[1])-(b[1]-a[1])*(v[0]-u[0]))/(L*M))<.1&&Math.abs(((u[0]-a[0])*(b[1]-a[1])-(u[1]-a[1])*(b[0]-a[0]))/L)<.3;}
// While a described house's walls are drawn: gable colour, no automatic chimney/dormers, and where its triangles start.
// Its parts are added once the whole building is drawn (facadeRec), on the OSM outline, so outlines split into rectangles work too.
const KIT_AT=new Map();let KIT_B=null;
{const prev=addBuilding;addBuilding=function(B,p,s){
  const K=s&&s.rid&&typeof KIT!=='undefined'&&KIT[s.rid];
  if(!K||KIT_DONE.has(s.rid)||!s.wall)return prev(B,p,s);
  if(!KIT_AT.has(s.rid))KIT_AT.set(s.rid,B.pos.length/3);KIT_B=B;
  if(K.chim)s.chimney=false;if(K.dorm)s.dormer=false;
  // chimneys measured from LiDAR (s.chim) give way to the described ones
  const g=K.gable,o={};if(Array.isArray(g)&&g.length===3&&g.every(x=>typeof x==='number'&&x>=0&&x<=1))o.gable=g;if(K.chim)o.chim=null;
  return prev(B,p,Object.keys(o).length?Object.assign({},s,o):s);};
  const fr=facadeRec;facadeRec=function(W,w,t,pts,specs,top){
    fr(W,w,t,pts,specs,top);const B=KIT_B;
    if(!KIT_AT.has(w.id)||KIT_DONE.has(w.id))return;KIT_DONE.add(w.id);
    const n=pts.length,K=kitNorm(w.id,KIT[w.id],n),rev=polyArea(pts)>0,P=rev?pts.slice().reverse():pts,Wk=e=>rev?(n-2-e+n)%n:e,v0=KIT_AT.get(w.id),v1=B.pos.length/3;
    // heights and roof from the largest part
    let [pp,sp]=specs[0];for(const q of specs)if(Math.abs(polyArea(q[0]))>Math.abs(polyArea(pp)))[pp,sp]=q;
    let R=null;
    if(sp.pitched&&pp.length===4){const wp=polyArea(pp)>0?pp.slice().reverse():pp,[a,b,c,d]=pitchOrder(wp,sp),shortL=Math.hypot(c[0]-b[0],c[1]-b[1]),run=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const on=(u,v)=>P.map((_,i)=>i).filter(i=>kitOn(P,i,u,v));
      R={a,b,c,d,shortL,run,rh:sp.rh!=null?Math.min(sp.rh,shortL*.7):Math.min(shortL*.42,4),gab:sp.hip?[]:[...on(b,c),...on(d,a)],eave:[...on(a,b),...on(c,d)]};}
    // walls with explicit windows lose the automatic ones: their styled wall triangles take the blank tiles (facades2 mask, sty+16)
    const masked=(K.win||[]).map(([e])=>Wk(e));
    for(let v=v0;v<v1;v+=3){const st=B.sty[v];if(!(st>=0&&st<16)||Math.abs(B.nor[v*3+1])>.05)continue;
      const cx=(B.pos[v*3]+B.pos[v*3+3]+B.pos[v*3+6])/3,cz=(B.pos[v*3+2]+B.pos[v*3+5]+B.pos[v*3+8])/3;
      for(const i of masked){const a=P[i],b=P[(i+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]),t=((cx-a[0])*(b[0]-a[0])+(cz-a[1])*(b[1]-a[1]))/L;
        if(t>-.05&&t<L+.05&&Math.abs(((cx-a[0])*(b[1]-a[1])-(cz-a[1])*(b[0]-a[0]))/L)<.05){B.sty[v]=B.sty[v+1]=B.sty[v+2]=st+16;break;}}}
    if(K.gableSty&&B.tx){const hh=sp.y0+sp.h+.01,gc=K.gable||sp.wall2||sp.wall;
      for(let v=v0;v<v1;v+=3)if(Math.abs(B.nor[v*3+1])<.05&&B.sty[v]<0&&B.col[v*3]===gc[0]&&B.col[v*3+1]===gc[1]&&Math.max(B.pos[v*3+1],B.pos[v*3+4],B.pos[v*3+7])>hh)B.tx[v]=B.tx[v+1]=B.tx[v+2]=TEXI[K.gableSty];}
    kitHouse(B,P,Object.assign({},sp,{gable:K.gable||sp.gable}),K,prev,rev,R);};}
{const bw=buildWorld;buildWorld=function(ways,meta){
  for(const k of ['pos','col','nor','uv','sty','tr','tx'])KIT_S[k]=[];KIT_DONE.clear();KIT_AT.clear();KIT_WARN.length=0;
  const W=bw(ways,meta);
  if(KIT_WARN.length&&!kitWarned){kitWarned=true;console.warn('kit: ignored '+KIT_WARN.join('; '));}
  const bm=(worldGroup.children.find(o=>o.geometry&&o.geometry.attributes.sty&&o.castShadow)||{}).material;
  if(KIT_S.pos.length&&bm){
    // the frame colour rides in its own attribute (not `tone`), so tests that look for the building mesh by `tone` still find only that one
    const g=mkGeo(KIT_S.pos,KIT_S.col,KIT_S.nor,KIT_S.uv,KIT_S.sty),F=new Float32Array(KIT_S.pos.length/3*4);for(let i=3;i<F.length;i+=4)F[i]=1;
    for(let k=0;k<KIT_S.tr.length;k+=5)for(let j=0;j<3;j++)F.set(KIT_S.tr.slice(k+1,k+5),(KIT_S.tr[k]+j)*4);
    g.setAttribute('kfr',new THREE.BufferAttribute(F,4));g.setAttribute('tex',new THREE.Float32BufferAttribute(KIT_S.tx,1));
    const m=bm.clone();m.onBeforeCompile=sh=>{bm.onBeforeCompile(sh);
      const a='vec4 tx=textureGrad(map,auv,dFdx(vMapUv)*sc,dFdy(vMapUv)*sc);';
      // window frames and sills (light, fixed atlas pixels) take the frame colour carried in kfr (w = 2)
      sh.vertexShader=sh.vertexShader.replace('attribute vec4 tone;','attribute vec4 tone;\nattribute vec4 kfr;').replace('vTone=tone;','vTone=kfr;');
      if(sh.fragmentShader.includes(a))sh.fragmentShader=sh.fragmentShader.replace(a,a+'if(vTone.w>1.5&&tx.a>.5&&tx.r>.6&&abs(tx.r-tx.b)<.1)tx.rgb*=vTone.rgb;');};
    m.customProgramCacheKey=()=>'kit';
    const mesh=new THREE.Mesh(g,m);mesh.name='kit';mesh.receiveShadow=true;mesh.castShadow=false;mesh.updateMatrix();mesh.matrixAutoUpdate=false;worldGroup.add(mesh);
  }
  return W;};}
