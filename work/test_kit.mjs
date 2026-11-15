// kit checks: node test_kit.mjs kit.html base.html [kit2.html]
// kit.html = build.sh + add_kit.py, base.html = build.sh alone, kit2.html = a second kit build (byte-identical check).
// Into kit.html the test adds one house with only invalid values and copies of a full description onto 28 more houses (40 in all).
import {createRequire} from 'module';import fs from 'fs';import path from 'path';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [kitF,baseF,kit2F]=process.argv.slice(2);
const fails=[],ok=(name,c,info)=>{console.log((c?'PASS ':'FAIL ')+name+(info?' '+JSON.stringify(info):''));if(!c)fails.push(name);};
if(kit2F)ok('twoBuildsIdentical',fs.readFileSync(kitF).equals(fs.readFileSync(kit2F)));
const ST='/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/pipeline/streets';
const BAD='c2337',BADK={f:0,win:[[99,[2]]],door:[{e:0,type:'tank'}],frame:[2,0,0],chim:'many',ext:[{e:0,d:50}],plinthH:9,winShape:'round',dorm:[{e:1,n:0}]};
const FULL={f:0,win:[[0,[2,1]],[1,[3]]],frame:[.4,.28,.2],door:[{e:1,at:.3,steps:true,porch:'canopy'}],gable:[.6,.6,.6],gableSty:'boards',plinth:[.35,.35,.34],
  ext:[{e:2,w:.5,d:3}],chim:[.3,.7],dorm:[{e:1,type:'gable',n:2}],balc:[{e:0,w:.4}]};
// rid -> [[v0,v1) of the building mesh, [k0,k1) of the kit mesh] per addBuilding call, recorded outside every step's wrapper
const REC=`window.__k={ev(s){return eval(s)}};{const ab=addBuilding;window.__rec={};addBuilding=function(B,p,s){const v0=B.pos.length/3,k0=typeof KIT_S!=='undefined'?KIT_S.pos.length/3:0,r=ab(B,p,s);
  if(s&&s.rid)(__rec[s.rid]||(__rec[s.rid]=[])).push([v0,B.pos.length/3,k0,typeof KIT_S!=='undefined'?KIT_S.pos.length/3:0]);return r;};}\n`;
const prep=(f,extra)=>{let h=fs.readFileSync(f,'utf8');const b='// ---------- boot ----------';if(h.split(b).length!==2)throw new Error('boot anchor');
  h=h.replace(b,REC+b);if(extra)h=extra(h);const o=path.join(path.dirname(path.resolve(f)),'_kt_'+path.basename(f));fs.writeFileSync(o,h);return o;};
let fillIds=[];
const kitPage=prep(kitF,h=>{const m=h.match(/const KIT=(\{.*?\});\n/);const K=JSON.parse(m[1]);
  const looks=['stonu','jurbarko','dubysos','gintaro'].flatMap(s=>Object.entries(JSON.parse(fs.readFileSync(`${ST}/${s}.json`,'utf8')).looks||{}));
  fillIds=looks.filter(([id,L])=>L.pitched&&!K[id]&&id!==BAD).map(([id])=>id).slice(0,40-Object.keys(K).length);
  for(const id of fillIds)K[id]=FULL;K[BAD]=BADK;return h.replace(m[0],'const KIT='+JSON.stringify(K)+';\n');});
const basePage=prep(baseF);
const br=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
async function open(f){
  const p=await br.newPage({viewport:{width:1024,height:640}}),errs=[],warns=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,200));if(m.type()==='warning'&&m.text().startsWith('kit'))warns.push(m.text());});
  await p.goto('file://'+f,{timeout:600000});await p.waitForFunction(()=>window.__k&&__k.ev("typeof world!=='undefined'&&world&&world.cars.length"),null,{timeout:600000});await p.waitForTimeout(1500);
  return {p,errs,warns};}
// run fn inside the page's module scope (its top-level names are not on window)
const run=(P,fn,arg)=>P.p.evaluate(([src,a])=>__k.ev('('+src+')')(a),[fn.toString(),arg]);
const base=await open(basePage),kit=await open(kitPage);
ok('noErrors',!base.errs.length&&!kit.errs.length,{base:base.errs.slice(0,3),kit:kit.errs.slice(0,3)});
// houses without kit keys: their triangles are the same numbers in both pages
const hashes=async P=>run(P,()=>{const ids=Object.keys(__rec).sort(),o={};for(const id of ids){let s=0;const A=worldGroup.children.find(q=>q.geometry&&q.geometry.attributes.sty&&q.castShadow).geometry.attributes;
  for(const [v0,v1] of __rec[id])for(const k of ['position','color','normal','uv','sty']){const a=A[k].array,n=A[k].itemSize;for(let i=v0*n;i<v1*n;i++)s=(s*31+Math.round(a[i]*1e4))|0;}o[id]=s;}return o;},null);
const hb=await hashes(base),hk=await hashes(kit);
const kitIds=await run(kit,()=>Object.keys(KIT),null);
const diff=Object.keys(hb).filter(id=>!kitIds.includes(id)&&hb[id]!==hk[id]);
ok('housesWithoutKeysUnchanged',diff.length===0&&Object.keys(hb).length>6000,{compared:Object.keys(hb).length-kitIds.length,changed:diff.slice(0,5)});
ok('invalidIgnored',hb[BAD]===hk[BAD]&&kit.warns.length===1&&/c2337\.(win|door|frame|chim|ext|plinthH|winShape|dorm)/.test(kit.warns[0]),
  {sameAsBase:hb[BAD]===hk[BAD],warns:kit.warns.length,first:(kit.warns[0]||'').slice(0,160)});
// each key on the right wall, from the geometry
const real=await run(kit,()=>Object.keys(KIT),null).then(ids=>ids.filter(id=>!fillIds.includes(id)&&id!==BAD));
const geo=await run(kit,({ids})=>{
  const bld=worldGroup.children.find(o=>o.geometry&&o.geometry.attributes.sty&&o.castShadow).geometry.attributes,km=worldGroup.children.find(o=>o.name==='kit');
  const ka=km.geometry.attributes,res={};
  const tris=(A,r0,r1)=>{const o=[];for(let v=r0;v<r1;v+=3){const P=A.position.array,c=[0,1,2].map(j=>(P[v*3+j]+P[v*3+3+j]+P[v*3+6+j])/3);o.push({v,c,n:[A.normal.array[v*3],A.normal.array[v*3+1],A.normal.array[v*3+2]],col:[0,1,2].map(j=>A.color.array[v*3+j]),sty:A.sty?A.sty.array[v]:-1});}return o;};
  for(const id of ids){
    const rec=FX.recs.find(r=>r.id===id),pts=rec.pts,n=pts.length,sp=rec.specs[0][1],K=KIT[id],R=__rec[id],cx=pts.reduce((a,q)=>a+q[0],0)/n,cz=pts.reduce((a,q)=>a+q[1],0)/n;
    const B=R.flatMap(([v0,v1])=>tris(bld,v0,v1)),S=R.flatMap(([,,k0,k1])=>tris(ka,k0,k1));
    // signed distance out of OSM edge e and position along it from its left end (seen from outside)
    const E=e=>{const a=pts[e],b=pts[(e+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]);let u=[(b[0]-a[0])/L,(b[1]-a[1])/L],nr=[-u[1],u[0]];
      if(((a[0]+b[0])/2-cx)*nr[0]+((a[1]+b[1])/2-cz)*nr[1]<0)nr=[-nr[0],-nr[1]];const left=(nr[0]*-u[1]+nr[1]*u[0])>0?a:b,lu=left===a?u:[-u[0],-u[1]];
      return{L,out:c=>(c[0]-a[0])*nr[0]+(c[2]-a[1])*nr[1],at:c=>((c[0]-left[0])*lu[0]+(c[2]-left[1])*lu[1])/L,nr};};
    const yb=sp.yb,h=sp.y0+sp.h,v1=Math.max(1,Math.round((h-yb)/3)),fh=(h-yb)/v1,o={};
    if(K.win){o.win=K.win.map(([e,rows])=>{const W=E(e),dec=S.filter(t=>t.sty>=0&&Math.abs(W.out(t.c)-.03)<.02&&W.at(t.c)>-.02&&W.at(t.c)<1.02);
      const wall=B.filter(t=>t.sty>=0&&Math.abs(t.n[1])<.05&&Math.abs(W.out(t.c))<.02&&W.at(t.c)>0&&W.at(t.c)<1);
      const want=rows.slice(0,v1).reduce((a,r)=>a+(typeof r==='number'?r:r.length),0),got=dec.filter(t=>t.c[1]<h).length/2;
      const doors=(K.door||[]).filter(d=>d.e===e).length;
      return{e,want,got,gable:dec.filter(t=>t.c[1]>h).length/2,masked:wall.length>0&&wall.every(t=>t.sty>=16),ok:wall.every(t=>t.sty>=16)&&(got===want||doors&&got<want&&got>=want-doors*2)};});}
    if(K.door)o.door=K.door.map(d=>{const W=E(d.e),dc=d.col||{single:[.36,.23,.15],double:[.36,.23,.15],glass:[.26,.32,.38],garage:[.8,.8,.78]}[d.type||'single'];
      const leaf=S.filter(t=>t.col.every((c,j)=>Math.abs(c-dc[j])<1e-3)&&t.n[1]===0),off=d.porch==='closed'?1.845:.045;
      const on=leaf.filter(t=>Math.abs(W.out(t.c)-off)<.02),ats=[].concat(d.at??.5);
      return{e:d.e,ok:on.length>=2*ats.length&&ats.every(a=>on.some(t=>Math.abs(W.at(t.c)-a)<.2)),n:on.length/2};});
    if(K.ext)o.ext=K.ext.map(x=>{const W=E(x.e),d=x.d||3,out=B.filter(t=>W.out(t.c)>.1&&W.out(t.c)<d+.6&&W.at(t.c)>0&&W.at(t.c)<1);return{e:x.e,ok:out.length>=8,n:out.length};});
    if(K.balc)o.balc=K.balc.map(q=>{const W=E(q.e),out=B.filter(t=>W.out(t.c)>.05&&W.out(t.c)<1&&t.c[1]>yb+fh*.8);return{e:q.e,ok:out.length>=20,n:out.length};});
    if(K.plinth)o.plinth={ok:S.filter(t=>t.col.every((c,j)=>Math.abs(c-K.plinth[j])<1e-3)).length===2*pts.filter((q,i)=>Math.hypot(pts[(i+1)%n][0]-q[0],pts[(i+1)%n][1]-q[1])>=.3).length};
    if(K.gable&&sp.pitched&&!sp.hip&&n===4){const g=B.filter(t=>Math.abs(t.n[1])<.05&&t.c[1]>h&&t.col.every((c,j)=>Math.abs(c-K.gable[j])<1e-3));
      const tx=bld.tex?g.every(t=>!K.gableSty||bld.tex.array[t.v]===TEXI[K.gableSty]):true;o.gable={ok:g.length>=2&&tx,n:g.length,tex:tx};}
    if(K.chim&&sp.pitched&&n===4){const top=Math.max(...B.map(t=>t.c[1]).filter(y=>y<h+15)),c=S.filter(t=>t.c[1]>h+1&&t.col.every((v,j)=>Math.abs(v-CHIMNEY[j])<1e-3));
      o.chim={ok:c.length===10*[].concat(K.chim).length*(typeof K.chim==='number'?K.chim:1),n:c.length/10};}
    if(K.dorm&&sp.pitched&&n===4)o.dorm=K.dorm.map(q=>{const W=E(q.e),fr=B.filter(t=>t.c[1]>h+.1&&Math.abs(t.n[1])<.05&&t.n[0]*W.nr[0]+t.n[2]*W.nr[1]>.9&&W.out(t.c)<0);return{e:q.e,ok:fr.length>=2,n:fr.length};});
    if(K.frame){const f=S.filter(t=>t.sty>=0).map(t=>ka.kfr.array.slice(t.v*4,t.v*4+4));o.frame={ok:f.length>0&&f.every(q=>q[3]===2&&Math.abs(q[0]-K.frame[0])<1e-3)};}
    res[id]=o;}
  return res;},{ids:real});
let partsOk=true;const used=new Set();
for(const [id,o] of Object.entries(geo))for(const [k,v] of Object.entries(o)){used.add(k);for(const q of [].concat(v))if(!q.ok){partsOk=false;console.log('  part',id,k,JSON.stringify(q));}}
ok('partsOnTheRightWall',partsOk,{houses:Object.keys(geo).length,keys:[...used].sort()});
ok('allKeysExercised',['win','door','ext','balc','plinth','gable','chim','dorm','frame'].every(k=>used.has(k)),[...used]);
// cost: triangles and draw calls from the start view and over the town, 40 houses described
const cost=async P=>run(P,()=>{const km=worldGroup.children.find(o=>o.name==='kit'),bld=worldGroup.children.find(o=>o.geometry&&o.geometry.attributes.sty&&o.castShadow);
  const r=[];for(const [y,look] of [[null,null],[600,[0,0,1]]]){if(y){camera.position.set(0,y,0);camera.lookAt(0,0,-1);}camera.updateMatrixWorld();renderer.info.autoReset=false;renderer.info.reset();renderer.render(scene,camera);r.push([renderer.info.render.calls,renderer.info.render.triangles]);renderer.info.autoReset=true;}
  return{views:r,bld:bld.geometry.attributes.position.count/3,kit:km?km.geometry.attributes.position.count/3:0,kitShadow:km?km.castShadow:null,kitStatic:km?!km.matrixAutoUpdate:null,houses:typeof KIT==='undefined'?0:Object.keys(KIT).length};},null);
const cb=await cost(base),ck=await cost(kit);
const added=(ck.bld-cb.bld)+ck.kit,per=added/(ck.houses-1);
ok('cost',ck.views.every((v,i)=>v[0]-cb.views[i][0]<=1)&&per<150&&ck.kitShadow===false&&ck.kitStatic,{base:cb.views,kit:ck.views,addedTris:added,perHouse:+per.toFixed(1),kitMeshTris:ck.kit,houses:ck.houses-1});
await br.close();fs.unlinkSync(kitPage);fs.unlinkSync(basePage);
console.log(fails.length?'FAIL '+fails.join(' '):'PASS kit');process.exit(fails.length?1:0);
