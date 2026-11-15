// ---------- kit: doors, windows per wall, porches, extensions, plinth, chimneys, dormers, balconies, cross gables, wings (add_kit.py) ----------
// KIT[id] comes from pipeline/kit/looks/*.json with sides resolved to OSM edge indices `e`, `f` = the front edge.
// Large parts (extensions, closed porches, porch roofs, balconies, dormers, cross gables) go into the merged building mesh and cast
// shadows; small ones (window and door panels, steps, plinth, chimneys, shutters) into one extra mesh without shadows.
// A window is a patch of the facade atlas: the wall it sits on loses its automatic windows (the facades2 face mask).
const KIT_S={pos:[],col:[],nor:[],uv:[],sty:[],tr:[],tx:[],cs:-1,tn:NOTONE},KIT_WARN=[],KIT_DONE=new Set(),KIT_PI=new Map();let kitWarned=false,KIT_TREES=0;
const KIT_DOOR={single:[.95,2.1,[.36,.23,.15]],double:[1.5,2.1,[.36,.23,.15]],glass:[1.0,2.15,[.26,.32,.38]],garage:[2.6,2.15,[.8,.8,.78]]};
const KIT_SHAPE={normal:1,wide:1.7,narrow:.7},KIT_EXT_STY=['plaster','brick','silicate','plank','panel','corrugated','sheet','none'];
const kitN=(v,a,b)=>typeof v==='number'&&v>=a&&v<=b,kitC=v=>Array.isArray(v)&&v.length===3&&v.every(x=>kitN(x,0,1));
const kitRowOk=r=>Number.isInteger(r)&&r>=0&&r<=12||Array.isArray(r)&&r.length>0&&r.length<=12&&r.every(x=>kitN(x,0,1));
// checks that need no outline (the addBuilding wrapper reads these keys before the outline is known)
const kitXgOk=q=>!!q&&Number.isInteger(q.e)&&q.e>=0&&(q.at==null||kitN(q.at,0,1))&&(q.w==null||kitN(q.w,1,16))&&(q.d==null||kitN(q.d,0,12))&&(q.rise==null||kitN(q.rise,.3,1))&&
  (q.wall==null||kitC(q.wall))&&(q.gable==null||kitC(q.gable))&&(q.roofCol==null||kitC(q.roofCol))&&(q.win==null||Array.isArray(q.win)&&q.win.length<=6&&q.win.every(kitRowOk));
const kitWingOk=q=>!!q&&typeof q==='object'&&(q.rdir==null||Array.isArray(q.rdir)&&q.rdir.length===2&&q.rdir.every(x=>kitN(x,-1,1))&&Math.hypot(...q.rdir)>.5)&&
  (q.rh==null||kitN(q.rh,.5,8))&&(q.h==null||kitN(q.h,2.2,30))&&(q.roof==null||/^(gable|hip|flat)$/.test(q.roof));
const kitNtOk=v=>!!v&&(kitN(v.d,.5,60)||kitN(v.r,.5,30));
// what a `wings` entry changes on part k of the game's split outline
function kitWingOv(W,k){const q=Array.isArray(W)?W[k]:null;if(!kitWingOk(q))return{};const o={};
  if(q.rdir){o.rdir=q.rdir;o.ridge=null;}if(q.rh!=null)o.rh=q.rh;if(q.h!=null)o.h=q.h;
  if(q.roof){o.pitched=q.roof!=='flat';o.hip=q.roof==='hip';o.skel=null;o.tops=null;o.chim=null;}return o;}
function kitNorm(id,K,n){
  const w=k=>KIT_WARN.push(id+'.'+k),E=e=>Number.isInteger(e)&&e>=0&&e<n,num=kitN;
  const col=kitC,fr=v=>Array.isArray(v)&&v.length>0&&v.every(x=>num(x,0,1));
  const O={f:E(K.f)?K.f:0};
  const one=(k,ok)=>{if(K[k]==null)return;if(ok(K[k]))O[k]=K[k];else w(k);};
  one('frame',col);one('gable',col);one('plinth',col);one('plinthH',v=>num(v,.1,1.5));
  one('winShape',v=>typeof v==='string'&&v in KIT_SHAPE||Array.isArray(v)&&v.every(q=>Array.isArray(q)&&E(q[0])&&q[1] in KIT_SHAPE));
  one('gableSty',v=>typeof TEXI!=='undefined'&&v in TEXI);
  one('chim',v=>Number.isInteger(v)&&v>=1&&v<=4||fr(v)&&v.length<=4);
  one('shut',col);one('nt',kitNtOk);one('nf',v=>!!v&&kitN(v.d,.5,60));
  const row=kitRowOk;
  if(K.win!=null)O.win=(Array.isArray(K.win)?K.win:[]).filter(q=>{const ok=Array.isArray(q)&&E(q[0])&&Array.isArray(q[1])&&q[1].every(row);if(!ok)w('win');return ok;});
  if(K.walls!=null)O.walls=(Array.isArray(K.walls)?K.walls:[]).filter(q=>{const ok=Array.isArray(q)&&E(q[0])&&q[1]&&(q[1].col==null||col(q[1].col))&&(q[1].sty==null||typeof TEXI!=='undefined'&&q[1].sty in TEXI)&&(q[1].col||q[1].sty);if(!ok)w('walls');return ok;});
  if(K.wings!=null){O.wings=Array.isArray(K.wings)?K.wings.map(q=>{if(q==null)return null;if(kitWingOk(q))return q;w('wings');return null;}):(w('wings'),null);}
  const list=(k,ok)=>{if(K[k]==null)return;O[k]=(Array.isArray(K[k])?K[k]:[K[k]]).filter(q=>{const g=q&&E(q.e)&&ok(q);if(!g)w(k);return g;});};
  const opt=(q,k,ok)=>q[k]==null||ok(q[k]);
  list('door',q=>(q.at==null||num(q.at,0,1)||fr(q.at))&&opt(q,'type',v=>v in KIT_DOOR)&&opt(q,'col',col)&&opt(q,'steps',v=>typeof v==='boolean')&&opt(q,'porch',v=>/^(none|canopy|closed)$/.test(v)));
  list('ext',q=>opt(q,'at',v=>num(v,0,1))&&opt(q,'w',v=>num(v,.1,1))&&opt(q,'d',v=>num(v,.8,12))&&opt(q,'h',v=>num(v,2,8))&&opt(q,'roof',v=>/^(flat|lean|gable)$/.test(v))&&opt(q,'wall',col)&&opt(q,'roofCol',col)&&opt(q,'glazed',v=>typeof v==='boolean')&&opt(q,'sty',v=>KIT_EXT_STY.includes(v)));
  list('balc',q=>opt(q,'at',v=>num(v,0,1))&&opt(q,'w',v=>num(v,.1,1))&&opt(q,'floor',v=>Number.isInteger(v)&&v>=1&&v<=20)&&opt(q,'col',col));
  list('dorm',q=>opt(q,'n',v=>Number.isInteger(v)&&v>=1&&v<=6)&&opt(q,'type',v=>/^(gable|shed)$/.test(v)));
  list('xg',kitXgOk);
  if(K.roof2!=null){O.roof2=(Array.isArray(K.roof2)?K.roof2:[K.roof2]).filter(q=>{const ok=q&&Array.isArray(q.at)&&q.at.length===2&&num(q.at[0],0,1)&&num(q.at[1],0,1)&&q.at[0]<q.at[1]&&
    opt(q,'side',v=>/^(front|back|both)$/.test(v))&&opt(q,'col',col)&&opt(q,'sty',v=>/^(tiles|sheet|flat|corrugated|asbestos)$/.test(v))&&(q.col||q.sty);if(!ok)w('roof2');return ok;});}
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
// styled wall triangles of B[v0,v1) lying on segment a-b get the blank atlas tiles (facades2 mask, sty+16)
// overlap: (outlines split into rectangles) a rectangle's wall runs past the short OSM edge it stands on, so a triangle counts when
// it overlaps the edge by 0.3 m or more, not only when its centre lies on it
function kitMask(B,v0,v1,segs,overlap){
  for(let v=v0;v<v1;v+=3){const st=B.sty[v];if(!(st>=0&&st<16)||Math.abs(B.nor[v*3+1])>.05)continue;
    const cx=(B.pos[v*3]+B.pos[v*3+3]+B.pos[v*3+6])/3,cz=(B.pos[v*3+2]+B.pos[v*3+5]+B.pos[v*3+8])/3;
    for(const [a,b] of segs){const L=Math.hypot(b[0]-a[0],b[1]-a[1]),t=((cx-a[0])*(b[0]-a[0])+(cz-a[1])*(b[1]-a[1]))/L;
      let on=t>-.05&&t<L+.05;
      if(overlap&&!on){const ts=[0,1,2].map(k=>((B.pos[(v+k)*3]-a[0])*(b[0]-a[0])+(B.pos[(v+k)*3+2]-a[1])*(b[1]-a[1]))/L);on=Math.min(L,Math.max(...ts))-Math.max(0,Math.min(...ts))>=.3;}
      if(on&&Math.abs(((cx-a[0])*(b[1]-a[1])-(cz-a[1])*(b[0]-a[0]))/L)<.05){B.sty[v]=B.sty[v+1]=B.sty[v+2]=st+16;break;}}}
}
// EG(i): the drawn wall of walked edge i ([a, b]); RE(i): the pitched roof part that wall belongs to (its gable or eaves)
function kitHouse(B,P,s,K,prev,rev,R,EG,RE,OF,XE){
  const n=P.length,W=e=>rev?(n-2-e+n)%n:e,yb=s.yb||0,y0=s.y0||0,h=y0+s.h,v1=Math.max(1,Math.round((h-yb)/3)),fh=(h-yb)/v1;
  EG=EG||(i=>[P[i],P[(i+1)%n]]);RE=RE||(()=>R);
  const sty=s.sty>=0?s.sty:STY.plaster,wm=typeof texWall==='function'?texWall(s):-1,TI=typeof TEXI!=='undefined'?TEXI:{},concrete=TI.concrete??-1;
  const bandY=s.wall2?yb+.3+(s.band==null?3:s.band):1e9,wcol=y=>y>=bandY-.01?s.wall2:s.wall,gcol=s.gable||s.wall2||s.wall;
  const fw=i=>{const F=kitFrame(...EG(i)),o=OF&&OF(i);if(o)F.off=o;return F;},scale=KIT_SHAPE[typeof K.winShape==='string'?K.winShape:'normal'],rTx=typeof TEX_ROOF!=='undefined'?TEX_ROOF[roofSty(s)]??-1:-1;
  const scaleOf=i=>{const q=Array.isArray(K.winShape)&&K.winShape.find(q=>W(q[0])===i);return q?KIT_SHAPE[q[1]]:scale;};
  const topOf=Ri=>Ri&&Ri.top!=null?Ri.top:h;
  KIT_S.tn=K.frame?[...K.frame,2]:NOTONE;
  // window rows on wall frame F whose eaves are at hE; gRh = roof rise over it when it is a gable end, else null
  const rowsOn=(F,rows,dr,hE,gRh,sc,lab)=>{const v1=Math.max(1,Math.round((hE-yb)/3)),fh=(hE-yb)/v1,h=hE;
    rows.forEach((r,k)=>{const ts=typeof r==='number'?Array.from({length:r},(_,j)=>(j+.5)/r):r;
      if(k<v1){const ww=1.92*sc,ya=yb+k*fh;
        ts.forEach((t,j)=>{const sm=Math.min(Math.max(t*F.L,ww/2),F.L-ww/2);if(k===0&&dr.some(([x,w])=>Math.abs(x-sm)<w/2+.75))return;
          const oo=F.off?F.off(sm):0;kitWin(F,sm,ww,ya,ya+fh,.2,.8,k,k+.999,sty,wcol(ya),wm,j,F.off?.03+oo:undefined);
          if(K.shut)for(const g of [-1,1])kitBox(KIT_S,F,sm+g*ww*.29-(g<0?ww*.17:0),sm+g*ww*.29+(g>0?ww*.17:0),.03+oo,.05+oo,ya+fh*.2,ya+fh*.8,K.shut,-1,'f');});}
      else if(k<=v1+1&&gRh!=null){
        // gable rows: the attic storey from just above the eaves, then a small loft window above it
        const h0=Math.min(fh*.8,gRh*(rows.length>v1+1?.42:.62)),hd=k===v1?h0:h0*.55,yg=k===v1?h+.12:h+.32+h0,wd=1.66*hd/(fh*.8)*sc;
        ts.forEach((t,j)=>{const off=Math.abs(t*F.L-F.L/2),room=(1-(yg+hd-h)/gRh)*F.L/2-off,f=Math.min(1,room*2/wd);
          if(wd*f<.4){KIT_WARN.push(s.rid+'.'+lab+': gable window '+k+'/'+j+' does not fit under the roof');return;}
          kitWin(F,t*F.L,wd*f,yg,yg+hd*f,.24,.76,v1+.1,v1+.9,sty,gcol,wm,j,F.off?.03+F.off(t*F.L):undefined);});}
      else KIT_WARN.push(s.rid+'.'+lab+': row '+k+' has no wall (house has '+v1+' storeys'+(gRh!=null?'':', and this wall is no gable end')+')');});};
  const doorAt={};
  for(const D of K.door||[]){const i=W(D.e),F=fw(i),[dw,dh,dc]=KIT_DOOR[D.type||'single'],gar=D.type==='garage';
    for(const t of D.at==null?[.5]:[].concat(D.at)){
      const sm=Math.min(Math.max(t*F.L,dw/2+.1),F.L-dw/2-.1),g=GY(...[0,2].map(k=>F.P(sm,0,0)[k])),steps=D.steps&&!gar,yd=Math.max(yb+.05,g+(steps?.45:.04));
      (doorAt[i]||(doorAt[i]=[])).push([sm,dw]);
      let Fd=F,od=F.off?F.off(sm):0;
      if(D.porch==='closed'&&!gar){const pw=Math.max(2.2,dw+1.4),pd=1.8,ph=yd+2.5-y0;
        prev(B,[F.P(sm-pw/2,-.05,0),F.P(sm+pw/2,-.05,0),F.P(sm+pw/2,pd,0),F.P(sm-pw/2,pd,0)].map(q=>[q[0],q[2]]),
          {h:ph,y0,yb,wall:s.wall,roof:s.roof,roofSty:s.roofSty,sty:-1,pitched:true,rh:.9,rdir:F.n,kind:'house',rid:s.rid});od=pd;}
      if(!gar)kitBox(KIT_S,Fd,sm-dw/2-.08,sm+dw/2+.08,od,od+.03,yd,yd+dh+.08,K.frame||[.9,.9,.88],-1,'f');
      kitBox(KIT_S,Fd,sm-dw/2,sm+dw/2,od,od+.045,yd,yd+dh,D.col||dc,-1,'f');
      if(steps)kitBox(KIT_S,Fd,sm-dw/2-.3,sm+dw/2+.3,od,od+.9,g-.1,yd,[.6,.6,.58],concrete,'flrt');
      if(D.porch==='canopy')kitBox(B,Fd,sm-dw/2-.5,sm+dw/2+.5,od,od+1.1,yd+dh+.3,yd+dh+.42,s.roof,-1,'flrtb');
    }}
  for(const [e,rows] of K.win||[]){const i=W(e),Ri=RE(i);rowsOn(fw(i),rows,doorAt[i]||[],topOf(Ri),Ri&&Ri.gab.includes(i)?Ri.rh:null,scaleOf(i),'win: edge '+e);}
  // the plinth follows the OSM outline (not the game's rectangles), as it always has
  if(K.plinth){const ph=K.plinthH||.5;for(let i=0;i<n;i++){const F=kitFrame(P[i],P[(i+1)%n]);if(F.L<.3)continue;const ga=GY(...F.a)+ph,gb=GY(...F.b)+ph;
    kitQuad(KIT_S,[F.P(0,.02,yb),F.P(F.L,.02,yb),F.P(F.L,.02,Math.max(gb,yb+.1)),F.P(0,.02,Math.max(ga,yb+.1))],K.plinth,F.out,concrete);}}
  for(const X of K.ext||[]){const F=fw(W(X.e)),ew=(X.w||.5)*F.L,sm=Math.min(Math.max((X.at??.5)*F.L,ew/2),F.L-ew/2),d=X.d||3,eh=X.h||2.6,roof=X.roof||'lean';
    const fp=[F.P(sm-ew/2,-.05,0),F.P(sm+ew/2,-.05,0),F.P(sm+ew/2,d,0),F.P(sm-ew/2,d,0)].map(q=>[q[0],q[2]]),lean=Math.min(1.2,d*.3);
    prev(B,fp,{h:eh,y0,yb,wall:X.wall||(X.glazed?[.86,.88,.88]:s.wall),roof:X.roofCol||s.roof,roofSty:s.roofSty,sty:X.glazed?STY.glass:X.sty?(X.sty==='none'?-1:STY[X.sty]):sty,kind:'house',rid:s.rid,
      pitched:roof==='gable',rh:roof==='gable'?Math.min(2.2,ew*.35):null,rdir:F.n,tops:roof==='lean'?[eh+lean,eh+lean,eh,eh]:null});}
  for(const Q of K.balc||[]){const i=W(Q.e),F=fw(i),bw=Math.max(1.5,(Q.w||.35)*F.L),sm=Math.min(Math.max((Q.at??.5)*F.L,bw/2),F.L-bw/2);
    const k=Math.min(Q.floor??(R&&R.gab.includes(i)?v1:1),v1),y=yb+k*fh,c=Q.col||[.9,.9,.88];
    kitBox(B,F,sm-bw/2,sm+bw/2,0,.9,y-.15,y,[.75,.75,.73],concrete,'flrtb');
    kitBox(B,F,sm-bw/2,sm+bw/2,.86,.9,y,y+1,c,-1,'fkt');kitBox(B,F,sm-bw/2,sm-bw/2+.04,0,.86,y,y+1,c,-1,'lr');kitBox(B,F,sm+bw/2-.04,sm+bw/2,0,.86,y,y+1,c,-1,'lr');}
  // ridge line of the main roof, from the end nearest the front wall's left corner (chim, roof2 positions)
  const ridge=()=>{const {a,b,c,d,run,shortL}=R,ux=(b[0]-a[0])/run,uz=(b[1]-a[1])/run,k=s.hip?Math.min(shortL,run)/2:0;
    let A=[(d[0]+a[0])/2+ux*k,(d[1]+a[1])/2+uz*k],Z=[(b[0]+c[0])/2-ux*k,(b[1]+c[1])/2-uz*k];
    const fl=fw(W(K.f)).a;if(Math.hypot(Z[0]-fl[0],Z[1]-fl[1])<Math.hypot(A[0]-fl[0],A[1]-fl[1]))[A,Z]=[Z,A];return[A,Z];};
  if(K.chim&&R){const RF=kitFrame(...ridge()),ry=h+R.rh;
    for(const t of typeof K.chim==='number'?Array.from({length:K.chim},(_,j)=>(j+.5)/K.chim):K.chim){const sm=Math.min(Math.max(t*RF.L,.4),RF.L-.4);
      kitBox(KIT_S,RF,sm-.26,sm+.26,-.26,.26,ry-.8,ry+.9,CHIMNEY,TI.brick??-1,'fklrt');}}
  for(const Q of K.dorm||[]){const i=W(Q.e),R=RE(i);
    if(!R||!R.eave.includes(i)){KIT_WARN.push(s.rid+'.dorm: edge '+Q.e+' has no roof slope over it');continue;}
    const h=topOf(R),scale=scaleOf(i),F=fw(i),hs=R.shortL/2,slope=x=>h+R.rh*Math.min(x,hs)/hs,X=y=>Math.min(hs,(y-h)/R.rh*hs),s0=.35,yt=h+Math.min(1.7,R.rh*.75),yf=slope(s0)-.05,dc=gcol;
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
  // cross gables: a gabled box whose ridge runs out of the main roof at right angles, buried in the main roof where its ridge meets
  // the slope; its walls stand d metres proud of the wall (at least 0.12 m, so the two never share a plane)
  // a cross gable sits on an eaves wall of whichever rectangle has one there (on any outline the game splits)
  for(const X of K.xg||[]){const i=W(X.e),Ri=XE&&XE(i)||RE(i);
    if(!Ri||!Ri.eave.includes(i)){KIT_WARN.push(s.rid+'.xg: edge '+X.e+(Ri&&Ri.gab.includes(i)?' is a gable end; a cross gable needs an eaves wall (one the roof slopes down to)':' has no roof slope over it'));continue;}
    const F=fw(i),top=topOf(Ri),hs=Ri.shortL/2,cw=Math.min(X.w||Math.min(4,F.L*.4),F.L),sm=Math.min(Math.max((X.at??.5)*F.L,cw/2),F.L-cw/2);
    const rise=X.rise||1,xin=Math.min(hs,rise*hs+.05),dd=Math.max(X.d||0,.12),rx=Math.min(rise*Ri.rh,cw*.7),gc=X.gable||K.gable,n0=B.pos.length/3;
    const fp=[F.P(sm-cw/2,-xin,0),F.P(sm+cw/2,-xin,0),F.P(sm+cw/2,dd,0),F.P(sm-cw/2,dd,0)].map(q=>[q[0],q[2]]);
    const o={h:top-y0,y0,yb,wall:X.wall||s.wall,roof:X.roofCol||s.roof,roofSty:s.roofSty,sty,pitched:true,rh:rx,rdir:F.n,kind:'house',rid:s.rid,noEave:true};
    if(!X.wall&&s.wall2){o.wall2=s.wall2;o.band=s.band;}if(gc)o.gable=gc;
    prev(B,fp,o);const n1=B.pos.length/3;
    if(K.gableSty&&B.tx)for(let v=n0;v<n1;v+=3)if(Math.abs(B.nor[v*3+1])<.05&&B.sty[v]<0&&Math.max(B.pos[v*3+1],B.pos[v*3+4],B.pos[v*3+7])>top+.01)B.tx[v]=B.tx[v+1]=B.tx[v+2]=TEXI[K.gableSty];
    if(X.win){const a=F.P(sm-cw/2,dd,0),b=F.P(sm+cw/2,dd,0),seg=[[a[0],a[2]],[b[0],b[2]]];kitMask(B,n0,n1,[seg]);
      rowsOn(kitFrame(...seg),X.win,[],top,rx,scaleOf(i),'xg: edge '+X.e);}}
  // a stretch of the main roof in another material or colour: a panel 4 cm above the slope
  for(const Q of K.roof2||[]){
    if(!R||s.hip){KIT_WARN.push(s.rid+'.roof2: needs a gable roof on a four-corner outline');continue;}
    const {a,b,c,d,run,shortL}=R,e=s.noEave||(K.xg||[]).length?0:s.kind==='shed'?.25:.5,ux=(b[0]-a[0])/run,uz=(b[1]-a[1])/run,[RA,RZ]=ridge(),fwd=(RZ[0]-RA[0])*ux+(RZ[1]-RA[1])*uz>0;
    const ff=fw(W(K.f)),fm=[(ff.a[0]+ff.b[0])/2,(ff.a[1]+ff.b[1])/2],md=(p,q)=>Math.hypot((p[0]+q[0])/2-fm[0],(p[1]+q[1])/2-fm[1]);
    const near=md(a,b)<md(c,d)?0:1,cx=(a[0]+b[0]+c[0]+d[0])/4,cz=(a[1]+b[1]+c[1]+d[1])/4,ye=h-e*R.rh/(shortL/2),kq=Math.sqrt(1+(shortL/2/Math.max(R.rh,.1))**2)/3;
    const st=Q.sty?STY[Q.sty]:roofSty(s),tx=typeof TEX_ROOF!=='undefined'?TEX_ROOF[st]??-1:-1;
    const M0=[(d[0]+a[0])/2,(d[1]+a[1])/2];
    for(const [k,p,q] of [[0,a,b],[1,d,c]]){if(Q.side!=='both'&&(Q.side==='back'?1-near:near)!==k)continue;
      const ox=(p[0]+q[0])/2-cx,oz=(p[1]+q[1])/2-cz,ol=Math.hypot(ox,oz),nx=ox/ol,nz=oz/ol;
      // s metres along the ridge from the a/d end: eaves point (overhang e out) and ridge point
      const at=t=>{const sl=(fwd?t:1-t)*(run+2*e)-e;return[p[0]+ux*sl+nx*e,p[1]+uz*sl+nz*e,M0[0]+ux*sl,M0[1]+uz*sl];};
      const A=at(Q.at[0]),Z=at(Q.at[1]);
      const V=[[A[0],ye,A[1]],[Z[0],ye,Z[1]],[Z[2],h+R.rh,Z[3]],[A[2],h+R.rh,A[3]]].map(v=>[v[0]+nx*.04,v[1]+.04,v[2]+nz*.04]);
      const uv=v=>[(v[0]*ux+v[2]*uz)/3.2,(v[1]-ye)*kq];B.cs=st;kitQuad(B,V,Q.col||s.roof,[nx,2,nz],tx,V.map(uv));B.cs=-1;}}
  KIT_S.tn=NOTONE;
}
// walked outline edge i lies on the line of segment u-v (a part's wall): parallel and within 0.3 m
function kitOn2(a,b,u,v){const L=Math.hypot(b[0]-a[0],b[1]-a[1]),M=Math.hypot(v[0]-u[0],v[1]-u[1]);
  return Math.abs(((b[0]-a[0])*(v[1]-u[1])-(b[1]-a[1])*(v[0]-u[0]))/(L*M))<.1&&Math.abs(((u[0]-a[0])*(b[1]-a[1])-(u[1]-a[1])*(b[0]-a[0]))/L)<.3;}
function kitOn(P,i,u,v){return kitOn2(P[i],P[(i+1)%P.length],u,v);}
// pitched roof of one 4-corner part: corners [a,b,c,d] (ridge a->b), its gable-end and eaves edges among the walked edges `on` finds
function kitRoof(pp,sp,on){const wp=polyArea(pp)>0?pp.slice().reverse():pp,[a,b,c,d]=pitchOrder(wp,sp),shortL=Math.hypot(c[0]-b[0],c[1]-b[1]),run=Math.hypot(b[0]-a[0],b[1]-a[1]);
  return{a,b,c,d,shortL,run,rh:sp.rh!=null?Math.min(sp.rh,shortL*.7):Math.min(shortL*.42,4),gab:sp.hip?[]:[...on(b,c),...on(d,a)],eave:[...on(a,b),...on(c,d)],top:(sp.y0||0)+sp.h};}
// While a described house's walls are drawn: gable colour, no automatic chimney/dormers, wing roofs, and where its triangles start.
// Its parts are added once the whole building is drawn (facadeRec), on the OSM outline, so outlines split into rectangles work too.
const KIT_AT=new Map();let KIT_B=null;
{const prev=addBuilding;addBuilding=function(B,p,s){
  const K=s&&s.rid&&typeof KIT!=='undefined'&&KIT[s.rid];
  if(!K||KIT_DONE.has(s.rid)||!s.wall)return prev(B,p,s);
  if(!KIT_AT.has(s.rid)){KIT_AT.set(s.rid,B.pos.length/3);KIT_PI.set(s.rid,0);}KIT_B=B;
  const k=KIT_PI.get(s.rid);KIT_PI.set(s.rid,k+1);
  if(K.chim)s.chimney=false;if(K.dorm)s.dormer=false;
  // chimneys measured from LiDAR (s.chim) give way to the described ones
  const g=K.gable,o={};if(Array.isArray(g)&&g.length===3&&g.every(x=>typeof x==='number'&&x>=0&&x<=1))o.gable=g;if(K.chim)o.chim=null;
  // a cross gable sits flush on the roof: the main eaves overhang would cut through its gable, so it goes (as facades2 does for wings)
  if(Array.isArray(K.xg)&&K.xg.some(kitXgOk))o.noEave=true;
  Object.assign(o,kitWingOv(K.wings,k));
  return prev(B,p,Object.keys(o).length?Object.assign({},s,o):s);};
  const fr=facadeRec;facadeRec=function(W,w,t,pts,specs,top){
    fr(W,w,t,pts,specs,top);const B=KIT_B;
    if(!KIT_AT.has(w.id)||KIT_DONE.has(w.id))return;KIT_DONE.add(w.id);
    const n=pts.length,K=kitNorm(w.id,KIT[w.id],n),rev=polyArea(pts)>0,P=rev?pts.slice().reverse():pts,Wk=e=>rev?(n-2-e+n)%n:e,v0=KIT_AT.get(w.id),v1=B.pos.length/3;
    const SP=specs.map(([pp,sp],k)=>[pp,Object.assign({},sp,kitWingOv(K.wings,k))]);
    if(K.wings&&K.wings.length>specs.length)KIT_WARN.push(w.id+'.wings: the game splits this outline into '+specs.length+' part(s)');
    // heights and roof from the largest part
    let [pp,sp]=SP[0];for(const q of SP)if(Math.abs(polyArea(q[0]))>Math.abs(polyArea(pp)))[pp,sp]=q;
    // outlines of 8+ corners that the game draws as several rectangles: a wall's parts go on the rectangle wall drawn over it
    // (up to 0.6 m off the OSM line), and gable rows, dormers and cross gables use the roof of the rectangle the wall belongs to
    const big=n>=8&&specs.length>1;
    const OFa=[],SGa=[],EGa=P.map((a,i)=>{const b=P[(i+1)%n];if(!big)return[a,b];const L=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L;let best=null;const all=[];
      for(const [q] of specs)for(let j=0;j<q.length;j++){const u=q[j],v=q[(j+1)%q.length],M=Math.hypot(v[0]-u[0],v[1]-u[1]);
        if(Math.abs(((b[0]-a[0])*(v[1]-u[1])-(b[1]-a[1])*(v[0]-u[0]))/(L*M))>.1)continue;
        // offset of that wall's line out of the house, at both ends of the OSM edge
        const off=x=>((x[0]-u[0])*(v[1]-u[1])-(x[1]-u[1])*(v[0]-u[0]))/M,g=(nx*(v[1]-u[1])-nz*(v[0]-u[0]))/M,oa=-off(a)/g,ob=-off(b)/g;
        const t0=((u[0]-a[0])*(b[0]-a[0])+(u[1]-a[1])*(b[1]-a[1]))/L,t1=((v[0]-a[0])*(b[0]-a[0])+(v[1]-a[1])*(b[1]-a[1]))/L;
        if(Math.min(t0,t1)>L-.3||Math.max(t0,t1)<.3||Math.max(Math.abs(oa),Math.abs(ob))>.6)continue;
        all.push([oa,ob,Math.min(t0,t1),Math.max(t0,t1)]);
        if(!best||Math.abs(oa)+Math.abs(ob)<Math.abs(best[0])+Math.abs(best[1]))best=[oa,ob];}
      // several rectangles can stand on one OSM edge, each a little in or out: OF[i](s) is the wall's offset from the frame line at s
      const g=best&&Math.max(Math.abs(best[0]),Math.abs(best[1]))>.03?best:[0,0],ln=(q,s)=>q[0]+(q[1]-q[0])*s/L;
      OFa[i]=all.length>1?(s=>{const q=all.find(q=>s>=q[2]-.05&&s<=q[3]+.05)||best;return ln(q,s)-ln(g,s);}):null;
      SGa[i]=all.map(q=>[[a[0]+nx*q[0],a[1]+nz*q[0]],[b[0]+nx*q[1],b[1]+nz*q[1]]]);
      return g===best?[[a[0]+nx*best[0],a[1]+nz*best[0]],[b[0]+nx*best[1],b[1]+nz*best[1]]]:[a,b];});
    const EG=i=>EGa[i],on=(u,v)=>P.map((_,i)=>i).filter(i=>kitOn2(...EG(i),u,v));
    let R=null;
    if(sp.pitched&&pp.length===4)R=kitRoof(pp,sp,on);
    const RS=big?SP.filter(([q,s])=>s.pitched&&q.length===4).sort((x,y)=>Math.abs(polyArea(y[0]))-Math.abs(polyArea(x[0]))).map(([q,s])=>q===pp?R:kitRoof(q,s,on)):[];
    const RE=big?(i=>RS.find(r=>r.gab.includes(i)||r.eave.includes(i))||R):null;
    const RX=K.xg&&specs.length>1?(big?RS:SP.filter(([q,s])=>s.pitched&&q.length===4).map(([q,s])=>q===pp?R:kitRoof(q,s,on))):null,XE=RX&&(i=>RX.find(r=>r.eave.includes(i)));
    // walls with explicit windows lose the automatic ones: their styled wall triangles take the blank tiles (facades2 mask, sty+16)
    kitMask(B,v0,v1,(K.win||[]).flatMap(([e])=>big&&SGa[Wk(e)].length?SGa[Wk(e)]:[EG(Wk(e))]),big);
    if(K.gableSty&&B.tx){const hh=sp.y0+sp.h+.01,gc=K.gable||sp.wall2||sp.wall;
      for(let v=v0;v<v1;v+=3)if(Math.abs(B.nor[v*3+1])<.05&&B.sty[v]<0&&B.col[v*3]===gc[0]&&B.col[v*3+1]===gc[1]&&Math.max(B.pos[v*3+1],B.pos[v*3+4],B.pos[v*3+7])>hh)B.tx[v]=B.tx[v+1]=B.tx[v+2]=TEXI[K.gableSty];}
    // another wall material or colour on one wall (and the gable triangle over it)
    for(const [e,Q] of K.walls||[]){const [a,b]=EG(Wk(e)),L=Math.hypot(b[0]-a[0],b[1]-a[1]);
      for(let v=v0;v<v1;v+=3){if(Math.abs(B.nor[v*3+1])>.05)continue;const cx=(B.pos[v*3]+B.pos[v*3+3]+B.pos[v*3+6])/3,cz=(B.pos[v*3+2]+B.pos[v*3+5]+B.pos[v*3+8])/3,tt=((cx-a[0])*(b[0]-a[0])+(cz-a[1])*(b[1]-a[1]))/L;
        if(tt<-.05||tt>L+.05||Math.abs(((cx-a[0])*(b[1]-a[1])-(cz-a[1])*(b[0]-a[0]))/L)>.05)continue;
        for(let j=v;j<v+3;j++){if(Q.col)B.col.splice(j*3,3,...Q.col);if(Q.sty&&B.tx)B.tx[j]=TEXI[Q.sty];}}}
    kitHouse(B,P,Object.assign({},sp,{gable:K.gable||sp.gable}),K,prev,rev,R,big?EG:null,RE,big?(i=>OFa[i]):null,XE);};}
{const bw=buildWorld;buildWorld=function(ways,meta){
  for(const k of ['pos','col','nor','uv','sty','tr','tx'])KIT_S[k]=[];KIT_DONE.clear();KIT_AT.clear();KIT_PI.clear();KIT_WARN.length=0;KIT_TREES=0;
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
// the plot in front of wall e of a recorded building: the wall 1 m longer at each end, d metres out (to the road's centre line)
function kitPlot(r,F){const p=r.pts,n=p.length,f=Number.isInteger(F.e)&&F.e>=0&&F.e<n?F.e:0,a=p[f],b=p[(f+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]),u=[(b[0]-a[0])/L,(b[1]-a[1])/L];
  const cx=p.reduce((s,q)=>s+q[0],0)/n,cz=p.reduce((s,q)=>s+q[1],0)/n;let nn=[-u[1],u[0]];if(((a[0]+b[0])/2-cx)*nn[0]+((a[1]+b[1])/2-cz)*nn[1]<0)nn=[-nn[0],-nn[1]];
  const d=F.d,q=[[a[0]-u[0],a[1]-u[1]],[b[0]+u[0],b[1]+u[1]],[b[0]+u[0]+nn[0]*d,b[1]+u[1]+nn[1]*d],[a[0]-u[0]+nn[0]*d,a[1]-u[1]+nn[1]*d]];
  return(x,z)=>pip(x,z,q);}
// `nt` (noTree): the generated trees (LiDAR list and trees2) in a house's plot front, or within r metres of it, are not planted,
// so neither their crowns nor their trunks' collision exist
{const t2=trees2Build;trees2Build=function(trees,W,...a){
  const Z=[];
  for(const r of FX.W===W?FX.recs:[]){const K=typeof KIT!=='undefined'&&KIT[r.id];if(!K||!kitNtOk(K.nt))continue;const p=r.pts,n=p.length;
    if(K.nt.d)Z.push(kitPlot(r,{e:K.nt.e??K.f,d:K.nt.d}));
    else{const rr=K.nt.r,ds=(x,z)=>{let m=1e9;for(let i=0;i<n;i++){const s=p[i],e=p[(i+1)%n],dx=e[0]-s[0],dz=e[1]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));m=Math.min(m,Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t));}return m;};
      Z.push((x,z)=>pip(x,z,p)||ds(x,z)<rr);}}
  if(!Z.length)return t2(trees,W,...a);
  const inZ=(x,z)=>Z.some(f=>f(x,z));
  for(let i=trees.length;i--;)if(inZ(trees[i][0],trees[i][1])){trees.splice(i,1);KIT_TREES++;}
  // trees2 adds its own trees after this; it skips spots inside buildings, so the zones count as one while it runs
  const ib=W.inBuilding;W.inBuilding=(x,z)=>ib(x,z)||(inZ(x,z)?true:null);
  try{return t2(trees,W,...a);}finally{W.inBuilding=ib;}};}
// Generated garden boundaries (the town's picket, mesh and hedge along residential plots) give way where a street file describes a
// fence on the same line (within 1.5 m, running the same way) and in front of a house with `nf` (noFence): out of the collision
// list (hedgeSegs, 5-value entries are the garden ones), out of props2's hedge rows (P2.yh) and out of the merged fence meshes.
const KIT_FENCE={cut:[],kept:0,tris:0};
function kitFences(W){
  if(W.kitFenced)return;W.kitFenced=true;KIT_FENCE.cut=[];KIT_FENCE.tris=0;const segs=(W.hedgeSegs||[]).filter(q=>q.length===5);if(!segs.length)return;
  const P=q=>[(q[1]-W.lon0)*W.kx,-(q[0]-W.lat0)*W.kz],D=[];
  for(const S of typeof STREETS!=='undefined'?STREETS:[])for(const f of S.fences||[]){const p=f.ll.map(P);for(let i=0;i<p.length-1;i++)D.push([p[i],p[i+1]]);}
  const Z=[];for(const r of FX.W===W?FX.recs:[]){const K=typeof KIT!=='undefined'&&KIT[r.id];if(K&&K.nf&&kitN(K.nf.d,.5,60))Z.push(kitPlot(r,{e:K.nf.e??K.f,d:K.nf.d}));}
  const near=(x,z,[a,b])=>{const dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1,t=((x-a[0])*dx+(z-a[1])*dz)/l2,l=Math.sqrt(l2);
    return t>-.5/l&&t<1+.5/l&&Math.abs((x-a[0])*dz-(z-a[1])*dx)/l<1.5;};
  const hit=q=>{const a=[q[0],q[1]],b=[q[2],q[3]],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
    if(Z.some(z=>z((a[0]+b[0])/2,(a[1]+b[1])/2)))return true;
    return D.some(d=>{const l=Math.hypot(d[1][0]-d[0][0],d[1][1]-d[0][1])||1;
      return Math.abs(((b[0]-a[0])*(d[1][0]-d[0][0])+(b[1]-a[1])*(d[1][1]-d[0][1]))/(L*l))>.9&&near(a[0],a[1],d)&&near(b[0],b[1],d);});};
  const cut=segs.filter(hit);if(!cut.length)return;const C=new Set(cut);KIT_FENCE.cut=cut;
  W.hedgeSegs=W.hedgeSegs.filter(q=>!C.has(q));KIT_FENCE.kept=W.hedgeSegs.filter(q=>q.length===5).length;
  const same=(a,b,q)=>Math.hypot(a[0]-q[0],a[1]-q[1])<1e-6&&Math.hypot(b[0]-q[2],b[1]-q[3])<1e-6;
  if(typeof P2!=='undefined'&&P2.yh)P2.yh=P2.yh.filter(([a,b])=>!cut.some(q=>same(a,b,q)));
  // drawn parts: vertical triangles (and hedge tops) lying on a cut segment, in the double-sided vertex-colour meshes the town code merges
  const G=new Map(),key=(i,j)=>i+','+j;for(const q of cut)for(const [x,z] of [[q[0],q[1]],[q[2],q[3]],[(q[0]+q[2])/2,(q[1]+q[3])/2]]){const k=key(Math.floor(x/4),Math.floor(z/4));G.has(k)?G.get(k).add(q):G.set(k,new Set([q]));}
  const on=(x,y,z)=>{const s=G.get(key(Math.floor(x/4),Math.floor(z/4)));if(!s)return false;
    for(const q of s){const dx=q[2]-q[0],dz=q[3]-q[1],L=Math.hypot(dx,dz)||1,t=((x-q[0])*dx+(z-q[1])*dz)/L;
      if(t>-.05&&t<L+.05&&Math.abs((x-q[0])*dz-(z-q[1])*dx)/L<.45){const g=y-GY(x,z);if(g>-.4&&g<q[4]+.3)return true;}}return false;};
  for(const m of worldGroup.children){if(!m.isMesh||m.isInstancedMesh||m.name==='kit'||!m.material||m.material.side!==THREE.DoubleSide||!m.material.vertexColors)continue;
    const A=m.geometry.attributes;if(m.geometry.index||!A.position||!A.normal)continue;const p=A.position.array,nr=A.normal.array,keep=[];let drop=0;
    for(let v=0;v<A.position.count;v+=3){const ny=Math.abs(nr[v*3+1]),cx=(p[v*3]+p[v*3+3]+p[v*3+6])/3,cy=(p[v*3+1]+p[v*3+4]+p[v*3+7])/3,cz=(p[v*3+2]+p[v*3+5]+p[v*3+8])/3;
      if((ny<.3||cy-GY(cx,cz)>.5)&&on(p[v*3],p[v*3+1],p[v*3+2])&&on(p[v*3+3],p[v*3+4],p[v*3+5])&&on(p[v*3+6],p[v*3+7],p[v*3+8]))drop++;else keep.push(v);}
    if(!drop)continue;KIT_FENCE.tris+=drop;
    for(const k of Object.keys(A)){const a=A[k],s=a.itemSize,o=new a.array.constructor(keep.length*3*s);keep.forEach((v,i)=>o.set(a.array.subarray(v*s,(v+3)*s),i*3*s));m.geometry.setAttribute(k,new THREE.BufferAttribute(o,s,a.normalized));}
    m.geometry.computeBoundingSphere();}
}
// buildExtra (run inside buildWorld once `world` is set) turns hedgeSegs into walls and P2.yh into hedge pieces: the cut goes first.
// A street file's hedge `col` tints props2's hedge models (they are bright green by themselves)
{const be=buildExtra;buildExtra=function(){if(world)kitFences(world);const r=be.apply(this,arguments);
  if(typeof P2==='undefined'||typeof STREETS==='undefined'||!world)return r;
  const want=new Map(),P=q=>[(q[1]-world.lon0)*world.kx,-(q[0]-world.lat0)*world.kz];
  for(const S of STREETS)for(const f of S.fences||[]){if(f.style!=='hedge'||!f.col)continue;const c=[1,3,5].map(i=>parseInt(f.col.slice(i,i+2),16)/255),p=f.ll.map(P);
    for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<=l;t+=.5)want.set(Math.round(a[0]+(b[0]-a[0])*t/l)+','+Math.round(a[1]+(b[1]-a[1])*t/l),c);}}
  if(!want.size)return r;const M=new THREE.Matrix4(),C=new THREE.Color();
  worldGroup.traverse(m=>{if(!m.isInstancedMesh||!m.instanceColor||!/^plant_/.test(m.userData.props2||''))return;
    const cl=m.geometry.attributes.color;let g=[0,0,0];if(cl){for(let i=0;i<cl.count;i++)for(let j=0;j<3;j++)g[j]+=cl.array[i*3+j]/cl.count;}else g=[1,1,1];
    for(let i=0;i<m.count;i++){m.getMatrixAt(i,M);const e=M.elements,c=want.get(Math.round(e[12])+','+Math.round(e[14]));if(!c)continue;
      m.setColorAt(i,C.setRGB(...c.map((v,j)=>Math.min(2,v/Math.max(.05,g[j])))));m.instanceColor.needsUpdate=true;}});
  return r;};}
