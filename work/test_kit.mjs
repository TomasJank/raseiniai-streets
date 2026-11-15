// kit checks: node test_kit.mjs kit.html base.html [kit2.html|-] [fixOld.html fixNew.html]
// kit.html = build.sh (with kit), base.html = the same chain without the kit step, kit2.html = a second kit build (byte-identical check),
// fixOld/fixNew = base.html with the 25 descriptions frozen when kit 2 started, drawn by the kit before kit 2 and by the live kit
// (pipeline/kit/sheets/kit2/old/fixture.sh base.html fixOld.html fixNew.html): every house must get the same triangles in both.
// Into a copy of kit.html the test adds one house with only invalid values, copies of a full description onto 28 more houses
// (40 in all), one house with every kit-2 key, and wings, windows, a door, plinth and chimney on c2466 (8 corners, 3 rectangles).
// Pages are opened one at a time (Metal); auto quality is off.
import {createRequire} from 'module';import fs from 'fs';import path from 'path';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [kitF,baseF,kit2F,oldF,fixF]=process.argv.slice(2);
const fails=[],ok=(name,c,info)=>{console.log((c?'PASS ':'FAIL ')+name+(info?' '+JSON.stringify(info):''));if(!c)fails.push(name);};
if(kit2F&&kit2F!=='-')ok('twoBuildsIdentical',fs.readFileSync(kitF).equals(fs.readFileSync(kit2F)));
const ST='/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/pipeline/streets';
const BAD='c2337',BADK={f:0,win:[[99,[2]]],door:[{e:0,type:'tank'}],frame:[2,0,0],chim:'many',ext:[{e:0,d:50}],plinthH:9,winShape:'round',dorm:[{e:1,n:0}],
  xg:[{e:0,d:50}],wings:[{rh:99}],roof2:[{at:[.6,.2]}],walls:[[0,{col:[3,0,0]}]],shut:'green',nt:{r:999},nf:{d:-1},winSize:'huge',halfHip:9};
const FULL={f:0,win:[[0,[2,1]],[1,[3]]],frame:[.4,.28,.2],door:[{e:1,at:.3,steps:true,porch:'canopy'}],gable:[.6,.6,.6],gableSty:'boards',plinth:[.35,.35,.34],
  ext:[{e:2,w:.5,d:3}],chim:[.3,.7],dorm:[{e:1,type:'gable',n:2}],balc:[{e:0,w:.4}]};
// kit 2 on a four-corner pitched house: a cross gable tried on two neighbouring walls (one is an eaves wall, the other a gable end
// and must be refused), another material on wall 2, a stretch of other roof, shutters and wide windows on wall 3, no trees within 6 m
const SHUT=[.21,.43,.22],WCOL=[.1,.2,.3],RCOL=[.1,.1,.6];
const K2={f:0,xg:[{e:0,at:.5,w:3,d:1,rise:.8,win:[1,1]},{e:1,at:.5,w:3,d:1,rise:.8,win:[1,1]}],walls:[[2,{col:WCOL,sty:'boards'}]],
  roof2:[{at:[.2,.6],side:'both',col:RCOL}],shut:SHUT,win:[[3,[2]]],winShape:[[3,'wide']],nt:{r:6},nf:{d:12,e:0}};
const MULTI='c2466',MK={f:0,wings:[{rdir:[1,0],rh:2},null,{roof:'flat'}],win:[[0,[3]]],door:[{e:7,at:.5}],plinth:[.3,.3,.29],gable:[.7,.6,.5],frame:[.3,.2,.1],chim:[.5]};
// kit 3 on four-corner pitched houses: half hip, window size, a stretch of wall in another colour, an extension with windows and a
// door (K3a); a wall dormer tried on two neighbouring walls (one is refused) and a recessed doorway (K3b)
const SCOL=[.15,.55,.2],K3a={f:0,halfHip:.35,winSize:[[0,1.0],[1,'small']],win:[[0,[2]]],walls:[[2,{col:SCOL,at:[.2,.6]}]],ext:[{e:3,w:.6,d:2,win:2,door:.5}]};
const K3b={f:0,xg:[{e:0,at:.5,w:3,up:1.2,rise:1.1,win:[[.3,.7]]},{e:1,at:.5,w:3,up:1.2,rise:1.1,win:[[.3,.7]]}],door:[{e:2,porch:'recess'}]};
const NEW=['xg','wings','roof2','walls','shut','nt','nf'],isNew=K=>NEW.some(k=>K[k]!=null)||Array.isArray(K.winShape);
// rid -> [[v0,v1) of the building mesh, [k0,k1) of the kit mesh] per addBuilding call and for what facadeRec adds once the building
// is whole (the kit parts), recorded outside every step's wrapper; addWall calls are recorded for the collision check.
const REC=`window.__GFX={auto:false};window.__k={ev(s){return eval(s)}};{const ab=addBuilding,fr=facadeRec,aw=addWall,kn=()=>typeof KIT_S!=='undefined'?KIT_S.pos.length/3:0;let LB=null;window.__rec={};window.__walls=[];
  addBuilding=function(B,p,s){LB=B;const v0=B.pos.length/3,k0=kn(),r=ab(B,p,s);if(s&&s.rid)(__rec[s.rid]||(__rec[s.rid]=[])).push([v0,B.pos.length/3,k0,kn()]);return r;};
  facadeRec=function(W,w,...a){const v0=LB?LB.pos.length/3:0,k0=kn(),r=fr.call(this,W,w,...a);if(LB&&__rec[w.id]&&(LB.pos.length/3>v0||kn()>k0))__rec[w.id].push([v0,LB.pos.length/3,k0,kn()]);return r;};
  addWall=function(...a){__walls.push(a);return aw.apply(this,a);};
  if(typeof p2Build==='function'){const pb=p2Build;window.__yh=[];p2Build=function(){__yh.push(...P2.yh.map(q=>[q[0][0],q[0][1],q[1][0],q[1][1]]));return pb.apply(this,arguments);};}}\n`;
const prep=(f,extra)=>{let h=fs.readFileSync(f,'utf8');const b='// ---------- boot ----------';if(h.split(b).length!==2)throw new Error('boot anchor');
  h=h.replace(b,REC+b);if(extra)h=extra(h);const o=path.join(path.dirname(path.resolve(f)),'_kt_'+path.basename(f));fs.writeFileSync(o,h);return o;};
let fillIds=[],K2ID=null,K3A=null,K3B=null;
const kitPage=prep(kitF,h=>{const m=h.match(/const KIT=(\{.*?\});\n/);const K=JSON.parse(m[1]);
  const looks=['stonu','jurbarko','dubysos','gintaro'].flatMap(s=>Object.entries(JSON.parse(fs.readFileSync(`${ST}/${s}.json`,'utf8')).looks||{}));
  fillIds=looks.filter(([id,L])=>L.pitched&&!K[id]&&id!==BAD).map(([id])=>id).slice(0,Math.max(4,41-Object.keys(K).length));
  K2ID='c2463';fillIds=fillIds.filter(id=>id!==K2ID);[K3A,K3B]=fillIds.splice(0,2);for(const id of fillIds)K[id]=FULL;K[K2ID]=K2;K[K3A]=K3a;K[K3B]=K3b;K[BAD]=BADK;K[MULTI]=MK;return h.replace(m[0],'const KIT='+JSON.stringify(K)+';\n');});
const br=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
async function open(f){
  const p=await br.newPage({viewport:{width:1024,height:640}}),errs=[],warns=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,200));if(m.type()==='warning'&&m.text().startsWith('kit'))warns.push(m.text());});
  await p.goto('file://'+f,{timeout:600000});await p.waitForFunction(()=>window.__k&&__k.ev("typeof world!=='undefined'&&world&&world.cars.length"),null,{timeout:600000});await p.waitForTimeout(1500);
  return {p,errs,warns};}
// run fn inside the page's module scope (its top-level names are not on window)
const run=(P,fn,arg)=>P.p.evaluate(([src,a])=>__k.ev('('+src+')')(a),[fn.toString(),arg]);
// per house: the building and kit triangles it got, hashed
const hashes=P=>run(P,()=>{const ids=Object.keys(__rec).sort(),o={},bld=worldGroup.children.find(q=>q.geometry&&q.geometry.attributes.sty&&q.castShadow).geometry.attributes,km=worldGroup.children.find(q=>q.name==='kit');
  for(const id of ids){let s=0;const add=(A,ks,a0,a1)=>{for(const k of ks){if(!A[k])continue;const a=A[k].array,n=A[k].itemSize;for(let i=a0*n;i<a1*n;i++)s=(s*31+Math.round(a[i]*1e4))|0;}};
    for(const [v0,v1,k0,k1] of __rec[id]){add(bld,['position','color','normal','uv','sty','tex'],v0,v1);if(km)add(km.geometry.attributes,['position','color','normal','uv','sty','kfr','tex'],k0,k1);}o[id]=s;}return o;},null);
const kitKeys=P=>run(P,()=>typeof KIT==='undefined'?{}:KIT,null);
const cost=P=>run(P,()=>{const km=worldGroup.children.find(o=>o.name==='kit'),bld=worldGroup.children.find(o=>o.geometry&&o.geometry.attributes.sty&&o.castShadow);
  return{meshes:worldGroup.children.length,bld:bld.geometry.attributes.position.count/3,kit:km?km.geometry.attributes.position.count/3:0,kitShadow:km?km.castShadow:null,kitStatic:km?!km.matrixAutoUpdate:null,houses:typeof KIT==='undefined'?0:Object.keys(KIT).length,
    segs:(world.hedgeSegs||[]).filter(q=>q.length===5).map(q=>q.slice(0,4))};},null);
// base first, then the kit page; each closed before the next opens
const base=await open(prep(baseF));const hb=await hashes(base),cb=await cost(base);await base.p.close();
const kit=await open(kitPage);
ok('noErrors',!base.errs.length&&!kit.errs.length,{base:base.errs.slice(0,3),kit:kit.errs.slice(0,3)});
const hk=await hashes(kit),KK=await kitKeys(kit);
const diff=Object.keys(hb).filter(id=>!KK[id]&&hb[id]!==hk[id]);
ok('housesWithoutKeysUnchanged',diff.length===0&&Object.keys(hb).length>6000,{compared:Object.keys(hb).length-Object.keys(KK).length,changed:diff.slice(0,5)});
const W=kit.warns.join('\n');
ok('invalidIgnored',hb[BAD]===hk[BAD]&&kit.warns.length===1&&['win','door','frame','chim','ext','plinthH','winShape','dorm','xg','wings','roof2','walls','shut','nt','nf','winSize','halfHip'].every(k=>W.includes(BAD+'.'+k)),
  {sameAsBase:hb[BAD]===hk[BAD],warns:kit.warns.length,first:W.slice(0,200)});
// each key on the right wall, from the geometry
const real=Object.keys(KK).filter(id=>!fillIds.includes(id)&&id!==BAD);
const geo=await run(kit,({ids,K2ID,SHUT,WCOL,RCOL})=>{
  const bld=worldGroup.children.find(o=>o.geometry&&o.geometry.attributes.sty&&o.castShadow).geometry.attributes,km=worldGroup.children.find(o=>o.name==='kit');
  const ka=km.geometry.attributes,res={},same=(a,b)=>a.every((c,j)=>Math.abs(c-b[j])<1e-3);
  const tris=(A,r0,r1)=>{const o=[];for(let v=r0;v<r1;v+=3){const P=A.position.array,c=[0,1,2].map(j=>(P[v*3+j]+P[v*3+3+j]+P[v*3+6+j])/3);
    o.push({v,c,p:[0,1,2].map(k=>[P[(v+k)*3],P[(v+k)*3+1],P[(v+k)*3+2]]),n:[A.normal.array[v*3],A.normal.array[v*3+1],A.normal.array[v*3+2]],col:[0,1,2].map(j=>A.color.array[v*3+j]),sty:A.sty?A.sty.array[v]:-1});}return o;};
  for(const id of ids){
    const rec=FX.recs.find(r=>r.id===id);if(!rec||!__rec[id]){res[id]={};continue;}const pts=rec.pts,n=pts.length,sp=rec.specs.reduce((a,q)=>Math.abs(polyArea(q[0]))>Math.abs(polyArea(a[0]))?q:a)[1],K=KIT[id],R=__rec[id],cx=pts.reduce((a,q)=>a+q[0],0)/n,cz=pts.reduce((a,q)=>a+q[1],0)/n;
    const B=R.flatMap(([v0,v1])=>tris(bld,v0,v1)),S=R.flatMap(([,,k0,k1])=>tris(ka,k0,k1)),multi=rec.specs.length>1&&n>=8;
    // a part on OSM edge e is measured against the wall triangle actually drawn behind it (on outlines the game splits into
    // rectangles that wall stands up to 0.6 m in or out of the OSM line): t sits `off` in front of a wall facing the same way
    const E=e=>{const a=pts[e],b=pts[(e+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]),u=[(b[0]-a[0])/L,(b[1]-a[1])/L];let nr=[-u[1],u[0]];
      if(((a[0]+b[0])/2-cx)*nr[0]+((a[1]+b[1])/2-cz)*nr[1]<0)nr=[-nr[0],-nr[1]];
      const left=(nr[0]*-u[1]+nr[1]*u[0])>0?a:b,lu=left===a?u:[-u[0],-u[1]],out=c=>(c[0]-a[0])*nr[0]+(c[2]-a[1])*nr[1],at=c=>((c[0]-left[0])*lu[0]+(c[2]-left[1])*lu[1])/L;
      const mine=t=>t.n[0]*nr[0]+t.n[2]*nr[1]>.95&&Math.abs(out(t.c))<.75&&at(t.c)>-.02&&at(t.c)<1.02;
      const walls=B.filter(t=>Math.abs(t.n[1])<.05&&mine(t));
      const behind=(t,off)=>walls.find(w=>{const d=(t.c[0]-w.c[0])*w.n[0]+(t.c[2]-w.c[2])*w.n[2];if(Math.abs(d-off)>.02)return false;
        const s=q=>q[0]*-w.n[2]+q[2]*w.n[0],xs=w.p.map(s),ys=w.p.map(q=>q[1]);
        return s(t.c)>Math.min(...xs)-.05&&s(t.c)<Math.max(...xs)+.05&&t.c[1]>Math.min(...ys)-.05&&t.c[1]<Math.max(...ys)+.05;});
      // the styled walls standing on this edge (within the kit's 0.6 m, overlapping it by 0.3 m or more): all must be masked
      const ov=t=>{const ts=t.p.map(q=>at([q[0],0,q[2]])*L);return Math.min(L,Math.max(...ts))-Math.max(0,Math.min(...ts));};
      const onEdge=B.filter(t=>t.sty>=0&&Math.abs(t.n[1])<.05&&t.n[0]*nr[0]+t.n[2]*nr[1]>.95&&Math.abs(out(t.c))<.62&&ov(t)>=.3);
      return{L,out,at,nr,mine,walls,behind,onEdge};};
    const yb=sp.yb,h=sp.y0+sp.h,v1=Math.max(1,Math.round((h-yb)/3)),fh=(h-yb)/v1,o={};
    // storey windows sit on styled (atlas) wall triangles, attic and loft windows on the plain gable triangle
    if(K.win){o.win=K.win.map(([e,rows])=>{const W=E(e),dec=S.filter(t=>t.sty>=0&&t.sty<16&&W.mine(t)),wb=dec.map(t=>W.behind(t,.03));
      const styled=W.onEdge,got=wb.filter(w=>w&&w.sty>=0).length/2,gab=wb.filter(w=>w&&w.sty<0).length/2,floating=wb.filter(w=>!w).length/2;
      const want=rows.slice(0,v1).reduce((a,r)=>a+(typeof r==='number'?r:r.length),0),extra=(multi?rows.slice(v1).reduce((a,r)=>a+(typeof r==='number'?r:r.length),0):0)+(K.xg||[]).filter(x=>x.e===e&&x.win&&x.win.length).reduce((a,x)=>a+(typeof x.win[0]==='number'?x.win[0]:x.win[0].length),0);
      const doors=(K.door||[]).filter(d=>d.e===e).length;
      return{e,want,got,gable:gab,floating,masked:styled.length>0&&styled.every(t=>t.sty>=16),ok:floating===0&&styled.length>0&&styled.every(t=>t.sty>=16)&&(got>=want&&got<=want+extra||doors&&got<want&&got>=want-doors*2)};});}
    if(K.door)o.door=K.door.filter(d=>d.porch!=='recess').map(d=>{const W=E(d.e),dc=d.col||{single:[.36,.23,.15],double:[.36,.23,.15],glass:[.26,.32,.38],garage:[.8,.8,.78]}[d.type||'single'];
      const leaf=S.filter(t=>same(t.col,dc)&&t.n[1]===0&&t.n[0]*W.nr[0]+t.n[2]*W.nr[1]>.95&&Math.abs(W.out(t.c))<2.5&&W.at(t.c)>-.02&&W.at(t.c)<1.02);
      const on=leaf.filter(t=>W.behind(t,.045)||d.porch==='closed'&&Math.abs(W.out(t.c)-1.845)<.65),ats=[].concat(d.at??.5);
      return{e:d.e,ok:on.length>=2*ats.length&&ats.every(a=>on.some(t=>Math.abs(W.at(t.c)-a)<.2)),n:on.length/2};});
    if(K.ext)o.ext=K.ext.map(x=>{const W=E(x.e),d=x.d||3,out=B.filter(t=>W.out(t.c)>.1&&W.out(t.c)<d+.6&&W.at(t.c)>-.02&&W.at(t.c)<1.02);return{e:x.e,ok:out.length>=8,n:out.length};});
    if(K.balc)o.balc=K.balc.map(q=>{const W=E(q.e),out=B.filter(t=>W.out(t.c)>.05&&W.out(t.c)<1&&t.c[1]>yb+fh*.8);return{e:q.e,ok:out.length>=20,n:out.length};});
    // the plinth follows the OSM outline: one quad per edge of 0.3 m or more
    if(K.plinth)o.plinth={ok:S.filter(t=>same(t.col,K.plinth)).length===2*pts.filter((q,i)=>Math.hypot(pts[(i+1)%n][0]-q[0],pts[(i+1)%n][1]-q[1])>=.3).length};
    if(K.gable&&sp.pitched&&!sp.hip){const g=B.filter(t=>Math.abs(t.n[1])<.05&&t.c[1]>h&&same(t.col,K.gable));
      const tx=bld.tex?g.every(t=>!K.gableSty||bld.tex.array[t.v]===TEXI[K.gableSty]):true;o.gable={ok:g.length>=2&&tx,n:g.length,tex:tx};}
    if(K.chim&&sp.pitched){const c=S.filter(t=>t.c[1]>h+1&&same(t.col,CHIMNEY));o.chim={ok:c.length===10*(typeof K.chim==='number'?K.chim:K.chim.length),n:c.length/10};}
    if(K.dorm&&sp.pitched&&n===4)o.dorm=K.dorm.map(q=>{const W=E(q.e),fr=B.filter(t=>t.c[1]>h+.1&&Math.abs(t.n[1])<.05&&t.n[0]*W.nr[0]+t.n[2]*W.nr[1]>.9&&W.out(t.c)<0);return{e:q.e,ok:fr.length>=2,n:fr.length};});
    if(K.frame){const f=S.filter(t=>t.sty>=0).map(t=>ka.kfr.array.slice(t.v*4,t.v*4+4));o.frame={ok:f.length>0&&f.every(q=>q[3]===2&&Math.abs(q[0]-K.frame[0])<1e-3)};}
    // cross gable: on its eaves wall a gable triangle facing out, d metres proud, above the eaves, centred at `at`, and its own windows
    // 3 cm in front of it; on the gable-end wall nothing (and a warning)
    if(K.xg)o.xg=K.xg.map(x=>{const W=E(x.e),dd=Math.max(x.d||0,.12),face=B.filter(t=>Math.abs(t.n[1])<.05&&t.n[0]*W.nr[0]+t.n[2]*W.nr[1]>.9&&Math.abs(W.out(t.c)-dd)<.65);
      const gab=face.filter(t=>t.c[1]>h+.05),wn=S.filter(t=>t.sty>=0&&t.n[0]*W.nr[0]+t.n[2]*W.nr[1]>.95&&Math.abs(W.out(t.c)-dd-.03)<.65&&W.out(t.c)>dd-.3&&Math.abs(W.at(t.c)-(x.at??.5))*W.L<(x.w||Math.min(4,W.L*.4))/2+.1);
      // a cross gable the kit refused is reported (kit: ignored ...); one it did not refuse must be drawn where asked, with its windows
      const warned=KIT_WARN.some(w=>w.startsWith(id+'.xg: edge '+x.e+' ')),g=gab.reduce((m,t)=>!m||Math.abs(W.at(t.c)-(x.at??.5))<Math.abs(W.at(m.c)-(x.at??.5))?t:m,null);
      return{e:x.e,warned,drawn:!warned&&!!g,at:g?+W.at(g.c).toFixed(2):null,wins:wn.length/2,ok:warned||!!g&&Math.abs(W.at(g.c)-(x.at??.5))<.1&&wn.length/2===(x.win||[]).reduce((a,r)=>a+(typeof r==='number'?r:r.length),0)};});
    if(K.walls&&K.walls.some(([,q])=>!q.at))o.walls=K.walls.filter(([,q])=>!q.at).map(([e,q])=>{const W=E(e),w=W.walls.filter(t=>W.at(t.c)>0&&W.at(t.c)<1);
      return{e,ok:w.length>0&&w.every(t=>same(t.col,q.col)&&(!bld.tex||bld.tex.array[t.v]===TEXI[q.sty])),n:w.length};});
    if(K.roof2)o.roof2=[].concat(K.roof2).map(q=>{const c=q.col||sp.roof,m=B.filter(t=>same(t.col,c)&&t.c[1]>h&&t.n[1]>.2&&bld.sty.array[t.v]>=0).length;return{ok:m>=(q.side==='both'?4:2),n:m};});
    if(K.shut){const s=S.filter(t=>same(t.col,SHUT)),wn=(K.win||[]).reduce((a,[e,rows])=>a+rows.slice(0,v1).reduce((b,r)=>b+(typeof r==='number'?r:r.length),0),0);o.shut={ok:s.length>=4*wn&&s.length%4===0,n:s.length/4,wn};}
    if(Array.isArray(K.winShape))o.winShape=K.winShape.map(([e,sh])=>{const W=E(e),dec=S.filter(t=>t.sty>=0&&W.mine(t)&&t.c[1]<h);
      const w=Math.max(0,...dec.map(t=>{const xs=t.p.map(q=>W.at([q[0],0,q[2]])*W.L);return Math.max(...xs)-Math.min(...xs);}));return{e,ok:!dec.length||Math.abs(w-1.92*KIT_SHAPE[sh])<.05,w:+w.toFixed(2)};});
    // kit 3
    if(Array.isArray(K.winSize))o.winSize=K.winSize.map(([e,v])=>{const W=E(e),dec=S.filter(t=>t.sty>=0&&W.mine(t)&&t.c[1]<h);
      const w=Math.max(0,...dec.map(t=>{const xs=t.p.map(q=>W.at([q[0],0,q[2]])*W.L);return Math.max(...xs)-Math.min(...xs);})),want=1.92*kitZ(v,sp.sty);return{e,ok:Math.abs(w-want)<.05,w:+w.toFixed(2),want:+want.toFixed(2)};});
    if(K.halfHip){const ys=B.flatMap(t=>t.p.map(q=>q[1])),top=Math.max(...ys),vt=Math.max(...B.filter(t=>Math.abs(t.n[1])<.05).flatMap(t=>t.p.map(q=>q[1])));
      const f=K.halfHip===true?.35:K.halfHip;o.halfHip={ok:vt<=h+(top-h)*(1-f)+.02&&vt>h,vt:+vt.toFixed(2),top:+top.toFixed(2)};}
    if(K.walls&&K.walls.some(([,q])=>q.at))o.span=K.walls.filter(([,q])=>q.at).map(([e,q])=>{const W=E(e),p=S.filter(t=>same(t.col,q.col)&&W.mine(t)&&t.sty>=16);
      const xs=p.flatMap(t=>t.p.map(v=>W.at([v[0],0,v[2]])));return{e,ok:p.length>=2&&Math.abs(Math.min(...xs)-q.at[0])<.02&&Math.abs(Math.max(...xs)-q.at[1])<.02,n:p.length};});
    if(K.ext&&K.ext.some(x=>x.win||x.door!=null))o.extParts=K.ext.filter(x=>x.win||x.door!=null).map(x=>{const W=E(x.e),d=x.d||3,f=S.filter(t=>t.n[0]*W.nr[0]+t.n[2]*W.nr[1]>.95&&Math.abs(W.out(t.c)-d)<.12);
      const wn=f.filter(t=>t.sty>=0).length/2,dr=f.filter(t=>same(t.col,x.doorCol||[.36,.23,.15])).length/2,want=x.win==null?0:typeof x.win==='number'?x.win:x.win.length;return{e:x.e,ok:wn===want&&(x.door==null||dr>=1),wn,dr};});
    if(K.door&&K.door.some(d=>d.porch==='recess'))o.recess=K.door.filter(d=>d.porch==='recess').map(d=>{const W=E(d.e),dk=S.filter(t=>same(t.col,d.col||[.09,.08,.07])&&W.mine(t)),pier=S.filter(t=>same(t.col,[.52,.3,.24])&&W.out(t.c)>.05&&W.out(t.c)<.5);return{e:d.e,ok:dk.length>=2&&pier.length>=8,n:dk.length,pier:pier.length};});
    if(K.nt&&K.nt.r){const ds=(x,z)=>{let m=1e9;for(let i=0;i<n;i++){const s=pts[i],e=pts[(i+1)%n],dx=e[0]-s[0],dz=e[1]-s[1],t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz||1)));m=Math.min(m,Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t));}return m;};
      const left=world.treeData.filter(t=>pip(t[0],t[1],pts)||ds(t[0],t[1])<K.nt.r);o.nt={ok:left.length===0,left:left.length};}
    if(K.nf){const Z=kitPlot(rec,{e:K.nf.e??K.f,d:K.nf.d}),left=(world.hedgeSegs||[]).filter(q=>q.length===5&&Z((q[0]+q[2])/2,(q[1]+q[3])/2));o.nf={ok:left.length===0,left:left.length};}
    if(K.wings){const W=K.wings,parts=R.slice(0,rec.specs.length);
      o.wings=W.map((q,k)=>{if(!q)return{k,ok:true};const T=tris(bld,parts[k][0],parts[k][1]),s=rec.specs[k][1],top=s.y0+(q.h??s.h),ys=T.flatMap(t=>t.p.map(p=>p[1])),my=Math.max(...ys);
        if(q.roof==='flat')return{k,ok:my<top+.05,rise:+(my-top).toFixed(2)};
        // the ridge (highest points) runs along the rectangle side nearest the asked direction
        const hi=T.flatMap(t=>t.p).filter(p=>p[1]>my-1e-3),a=hi[0],b=hi.reduce((m,p)=>Math.hypot(p[0]-a[0],p[2]-a[2])>Math.hypot(m[0]-a[0],m[2]-a[2])?p:m,a);
        // the game caps a rise at 0.7 x the span across the ridge (addBuilding), so the asked rise is an upper bound on narrow wings
        const pq=rec.specs[k][0],sl=[0,1].map(j=>Math.hypot(pq[j+1][0]-pq[j][0],pq[j+1][1]-pq[j][1])),riseOk=r=>q.rh==null||r<=q.rh+.05&&r>=Math.min(q.rh,.7*Math.min(...sl))-.05;
        if(!q.rdir)return{k,ok:riseOk(my-top),rise:+(my-top).toFixed(2)};
        const pp=rec.specs[k][0],sides=[0,1].map(j=>{const u=[pp[j+1][0]-pp[j][0],pp[j+1][1]-pp[j][1]],l=Math.hypot(...u);return[u[0]/l,u[1]/l];}),sd=sides.reduce((m,u)=>Math.abs(u[0]*q.rdir[0]+u[1]*q.rdir[1])>Math.abs(m[0]*q.rdir[0]+m[1]*q.rdir[1])?u:m);
        const v=[b[0]-a[0],b[2]-a[2]],lv=Math.hypot(...v)||1,cr=Math.abs(v[0]*sd[1]-v[1]*sd[0])/lv;
        return{k,ok:riseOk(my-top)&&lv>.5&&cr<.05,rise:+(my-top).toFixed(2),ridge:+lv.toFixed(2),cross:+cr.toFixed(3)};});}
    res[id]=o;}
  return res;},{ids:[...real,K2ID,K3A,K3B],K2ID,SHUT,WCOL,RCOL});
let partsOk=true;const used=new Set();
for(const [id,o] of Object.entries(geo))for(const [k,v] of Object.entries(o)){used.add(k);for(const q of [].concat(v))if(!q.ok){partsOk=false;console.log('  part',id,k,JSON.stringify(q));}}
ok('partsOnTheRightWall',partsOk,{houses:Object.keys(geo).length,keys:[...used].sort()});
const xg=geo[K2ID].xg||[];
ok('crossGable',xg.filter(q=>q.drawn).length===1&&xg.filter(q=>q.warned).length===1,xg);
const x3=geo[K3B]&&geo[K3B].xg||[];
ok('wallDormer',x3.filter(q=>q.drawn).length===1&&x3.filter(q=>q.warned).length===1,x3);
ok('kit3Keys',geo[K3A]&&['winSize','halfHip','span','extParts'].every(k=>geo[K3A][k])&&geo[K3B]&&geo[K3B].recess,{a:Object.keys(geo[K3A]||{}),b:Object.keys(geo[K3B]||{})});
ok('allKeysExercised',['win','door','ext','balc','plinth','gable','chim','dorm','frame','xg','walls','roof2','shut','winShape','nt','nf','wings'].every(k=>used.has(k)),[...used]);
ok('multiPart',geo[MULTI]&&['win','door','plinth','chim','gable','frame','wings'].every(k=>geo[MULTI][k]),Object.keys(geo[MULTI]||{}));
// fences: a described street fence leaves no garden boundary within 1.5 m on its stretch; others stay; collision follows the list
const fen=await run(kit,({base})=>{const P=q=>[(q[1]-world.lon0)*world.kx,-(q[0]-world.lat0)*world.kz],D=[];
  for(const S of STREETS)for(const f of S.fences||[]){const p=f.ll.map(P);for(let i=0;i<p.length-1;i++)D.push([p[i],p[i+1]]);}
  const segs=world.hedgeSegs.filter(q=>q.length===5),onD=q=>D.some(([a,b])=>{const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1,L2=Math.hypot(q[2]-q[0],q[3]-q[1])||1;
    if(Math.abs(((q[2]-q[0])*dx+(q[3]-q[1])*dz)/(L*L2))<.9)return false;
    return [[q[0],q[1]],[q[2],q[3]]].every(([x,z])=>{const t=((x-a[0])*dx+(z-a[1])*dz)/(L*L);return t>-.5/L&&t<1+.5/L&&Math.abs((x-a[0])*dz-(z-a[1])*dx)/L<1.5;});});
  const k=q=>q.slice(0,4).map(v=>v.toFixed(3)).join(','),now=new Set(segs.map(k)),cut=new Set(KIT_FENCE.cut.map(q=>k(q.slice(0,4))));
  const miss=base.filter(q=>!cut.has(k(q))&&!now.has(k(q))),keptOk=!miss.length,walls=new Set(__walls.map(a=>a.slice(0,4).map(v=>v.toFixed(3)).join(',')));
  // nothing drawn on a cut segment: none of props2's garden hedge rows, no double-sided fence triangle on one
  const pieces=(window.__yh||[]).filter(q=>cut.has(k(q))).length;
  // a described fence drawn on exactly the generated line has its own wall there: those do not count
  const dk=new Set(D.flatMap(([a,b])=>[k([a[0],a[1],b[0],b[1]]),k([b[0],b[1],a[0],a[1]])]));
  let tris=0;for(const m of worldGroup.children){if(!m.isMesh||m.isInstancedMesh||m.name==='kit'||!m.material||m.material.side!==THREE.DoubleSide||!m.material.vertexColors)continue;
    const p=m.geometry.attributes.position.array;for(let v=0;v<p.length;v+=9){const c=[(p[v]+p[v+3]+p[v+6])/3,(p[v+1]+p[v+4]+p[v+7])/3,(p[v+2]+p[v+5]+p[v+8])/3];
      if(c[1]-GY(c[0],c[2])>.2&&KIT_FENCE.cut.some(q=>{const dx=q[2]-q[0],dz=q[3]-q[1],L=Math.hypot(dx,dz)||1,t=((c[0]-q[0])*dx+(c[2]-q[1])*dz)/(L*L);return t>.05&&t<.95&&Math.abs((c[0]-q[0])*dz-(c[2]-q[1])*dx)/L<.42;}))tris++;}}
  const bk=new Set(base.map(k));return{dropped:KIT_FENCE.tris,extra:segs.filter(q=>!bk.has(k(q.slice(0,4)))).slice(0,3),yh:(window.__yh||[]).length,miss:miss.slice(0,3),described:D.length,tris,stillOn:segs.filter(onD).length,cut:KIT_FENCE.cut.length,keptOk,before:base.length,after:segs.length,
    cutWalls:KIT_FENCE.cut.filter(q=>!dk.has(k(q))&&walls.has(q.slice(0,4).map(v=>v.toFixed(3)).join(','))).length,keptWalls:segs.slice(0,200).every(q=>walls.has(q.slice(0,4).map(v=>v.toFixed(3)).join(','))),pieces};},{base:cb.segs});
ok('fences',fen.described>0&&fen.stillOn===0&&fen.cut>0&&fen.keptOk&&fen.after===fen.before-fen.cut&&fen.cutWalls===0&&fen.keptWalls&&fen.pieces===0&&fen.tris===0&&fen.dropped>0,fen);
// a described hedge's colour reaches its props2 pieces
const hc=await run(kit,()=>{const P=q=>[(q[1]-world.lon0)*world.kx,-(q[0]-world.lat0)*world.kz],f=STREETS.flatMap(S=>S.fences||[]).find(f=>f.style==='hedge'&&f.col);if(!f)return{none:true};
  const c=[1,3,5].map(i=>parseInt(f.col.slice(i,i+2),16)/255),a=P(f.ll[0]),b=P(f.ll[1]);let got=null;const M=new THREE.Matrix4(),C=new THREE.Color();
  worldGroup.traverse(m=>{if(got||!m.isInstancedMesh||!/^plant_/.test(m.userData.props2||''))return;const cl=m.geometry.attributes.color;let g=[1,1,1];if(cl){g=[0,0,0];for(let i=0;i<cl.count;i++)for(let j=0;j<3;j++)g[j]+=cl.array[i*3+j]/cl.count;}
    for(let i=0;i<m.count;i++){m.getMatrixAt(i,M);const e=M.elements,dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),t=((e[12]-a[0])*dx+(e[14]-a[1])*dz)/(L*L);
      if(t>.1&&t<.9&&Math.abs((e[12]-a[0])*dz-(e[14]-a[1])*dx)/L<.3){m.getColorAt(i,C);got=[C.r*g[0],C.g*g[1],C.b*g[2]];break;}}});
  return{want:c,got};},null);
ok('hedgeColour',hc.none||hc.got&&hc.got.every((v,j)=>Math.abs(v-hc.want[j])<.03),hc);
// cost: what kit adds to the scene (meshes, triangles), not a draw-call count of one render, which varies with traffic and culling
const ck=await cost(kit);await kit.p.close();
const added=(ck.bld-cb.bld)+ck.kit,per=added/(ck.houses-1);
ok('cost',ck.meshes-cb.meshes===1&&per<150&&ck.kitShadow===false&&ck.kitStatic,{meshesAdded:ck.meshes-cb.meshes,addedTris:added,perHouse:+per.toFixed(1),kitMeshTris:ck.kit,houses:ck.houses-1});
// every description that was valid for the kit before kit 2 draws the same triangles with the live kit (frozen fixture)
if(oldF&&fixF){const nw=await open(prep(fixF)),hn=await hashes(nw),KN=await kitKeys(nw);await nw.p.close();
  const od=await open(prep(oldF)),ho=await hashes(od),KO=await kitKeys(od);await od.p.close();
  const ids=Object.keys(KO),ch=ids.filter(id=>ho[id]!==hn[id]),all=Object.keys(ho).filter(id=>ho[id]!==hn[id]);
  ok('oldDescriptionsUnchanged',ids.length>0&&Object.keys(KN).length===ids.length&&ch.length===0&&all.length===0,{described:ids.length,changed:ch,otherChanged:all.slice(0,5)});}
await br.close();for(const f of fs.readdirSync(path.dirname(path.resolve(kitF))).filter(f=>f.startsWith('_kt_')))fs.unlinkSync(path.join(path.dirname(path.resolve(kitF)),f));
console.log(fails.length?'FAIL '+fails.join(' '):'PASS kit');process.exit(fails.length?1:0);
