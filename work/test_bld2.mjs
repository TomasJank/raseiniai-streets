// cadastre buildings: node test_bld2.mjs page.html base.html   (page = full chain + bld2, base = chain without it)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,baseFile]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
const o='function drawMini(){';
const api=`window.__t={get world(){return world},get FX(){return FX},get LOOK(){return LOOK},get ROOFS(){return ROOFS},get BLD2(){return typeof BLD2==='undefined'?null:BLD2},STY,water3At,
snap(){return FX.recs.map(r=>{const s=r.specs[0][1];return{id:r.id,pts:r.pts.map(q=>[+q[0].toFixed(3),+q[1].toFixed(3)]),kind:s.kind,sty:s.sty,h:+s.h.toFixed(2),roof:s.roof&&s.roof.map(v=>+v.toFixed(3)),pitched:!!s.pitched,wall:s.wall&&s.wall.map(v=>+v.toFixed(3)),noWin:!!(s.faces&&s.faces.windows&&s.faces.windows.every(v=>v===0)),look:!!LOOK[r.id],roofs:ROOFS.has(r.id)};});}};`;
const rd=f=>{const h=fs.readFileSync(f,'utf8');const a='<script type="application/json" id="rasData">',i=h.indexOf(a)+a.length;return JSON.parse(h.slice(i,h.indexOf('</script>',i)));};
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
const errs=[];
async function load(f,name){
  const h=fs.readFileSync(f,'utf8');if(h.split(o).length!==2)throw new Error('hook');
  const tmp=dir+'_bld2_'+name+'.html';fs.writeFileSync(tmp,h.replace(o,api+o));
  const p=await b.newPage({viewport:{width:900,height:600}});
  p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(name+': '+m.text().slice(0,300))});
  await p.goto('file://'+tmp);await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});await p.waitForTimeout(1500);
  return p;
}
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};
const A=rd(baseFile),B=rd(file);
const same=(x,y,n)=>{for(let i=0;i<n;i++)if(JSON.stringify(x[i])!==JSON.stringify(y[i]))return i;return -1;};
check('rasData prefix: ways, tags, nodes untouched',same(A.w,B.w,A.w.length)<0&&same(A.t,B.t,A.t.length)<0&&A.n.every((v,i)=>B.n[i]===v)&&B.w.length>A.w.length,{ways:[A.w.length,B.w.length],tags:[A.t.length,B.t.length],nodes:[A.n.length/2,B.n.length/2]});
check('rasData tables untouched',['gh','lh','lr','lp','fc','sk'].every(k=>JSON.stringify(A[k])===JSON.stringify(B[k])),{});
const pa=await load(baseFile,'base'),base=await pa.evaluate(()=>__t.snap());
const pb=await load(file,'new');
const now=await pb.evaluate(()=>__t.snap());
const byId=new Map(now.map(r=>[r.id,r]));
let moved=0,miss=0;for(const r of base){const q=byId.get(r.id);if(!q){miss++;continue;}if(JSON.stringify(q.pts)!==JSON.stringify(r.pts))moved++;}
{const st=async q=>q.evaluate(()=>__t.world.start.slice(0,2).map(Math.round)),a=await st(pa),b=await st(pb);check('the start point has not moved',a[0]===b[0]&&a[1]===b[1],{base:a,now:b});}
check('every pre-existing building keeps id and position',miss===0&&moved===0,{base:base.length,missing:miss,moved});
const pc=await load(file,'new2'),again=await pc.evaluate(()=>__t.snap());
let wdiff=0;now.forEach((q,i)=>{const r=again[i];if(!r||r.id!==q.id||JSON.stringify([q.wall,q.roof,q.sty,q.h])!==JSON.stringify([r.wall,r.roof,r.sty,r.h]))wdiff++;});
check('two loads of the page give identical wall and roof colours, styles and heights',wdiff===0,{buildings:now.length,differ:wdiff});
const added=now.filter(r=>!base.some&&false||parseInt(r.id.slice(1))>=A.w.length);
check('added buildings drawn',added.length>1500&&added.length<=B.w.length-A.w.length,{added:added.length,expected:B.w.length-A.w.length});
const r=await pb.evaluate(({ids,garage,green})=>{
  const T=__t,W=T.world,out={solid:0,sample:0,bad:[]},rec=new Map(T.FX.recs.map(x=>[x.id,x]));
  const cen=p=>[p.reduce((a,q)=>a+q[0],0)/p.length,p.reduce((a,q)=>a+q[1],0)/p.length];
  const pip=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const[xi,zi]=p[i],[xj,zj]=p[j];if((zi>z)!=(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;}return c;};
  const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const sx=(a,b,c,d)=>cr(a,b,c)*cr(a,b,d)<0&&cr(c,d,a)*cr(c,d,b)<0;
  const ov=(p,q)=>{for(let i=0;i<p.length;i++)for(let j=0;j<q.length;j++)if(sx(p[i],p[(i+1)%p.length],q[j],q[(j+1)%q.length]))return true;return pip(p[0][0],p[0][1],q)||pip(q[0][0],q[0][1],p);};
  const bb=p=>{let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const q of p){a=Math.min(a,q[0]);b=Math.max(b,q[0]);c=Math.min(c,q[1]);d=Math.max(d,q[1]);}return[a,b,c,d];};
  const all=T.FX.recs.map(x=>({id:x.id,p:x.pts,b:bb(x.pts),n:parseInt(x.id.slice(1))}));
  const oldB=all.filter(x=>x.n<ids.first),newB=all.filter(x=>x.n>=ids.first);
  let ovOld=0,ovNew=0,road=0,water=0,notIn=0,notSolid=0;const ex=[],sol=[];
  for(const x of newB){
    let [cx,cz]=cen(x.p);
    if(!pip(cx,cz,x.p)){const[a,b2,c0,d0]=x.b;let f=false;for(let u=.5;u<20&&!f;u++)for(let xx=a+u*.2;xx<b2&&!f;xx+=.4)for(let zz=c0+.2;zz<d0;zz+=.4)if(pip(xx,zz,x.p)){cx=xx;cz=zz;f=true;break;}}
    if(!W.inBuilding(cx,cz))notIn++;
    {let k=0,bl=0;x.p.forEach((q,i)=>{const l=Math.hypot(x.p[(i+1)%x.p.length][0]-q[0],x.p[(i+1)%x.p.length][1]-q[1]);if(l>bl){bl=l;k=i;}});const a0=x.p[k],a1=x.p[(k+1)%x.p.length],dx=a1[0]-a0[0],dz=a1[1]-a0[1],L=Math.hypot(dx,dz)||1;let nx=-dz/L,nz=dx/L;const mx=(a0[0]+a1[0])/2,mz=(a0[1]+a1[1])/2;
      if(pip(mx+nx*.1,mz+nz*.1,x.p)){nx=-nx;nz=-nz;}
      const c=W.collide(mx+nx*.15,mz+nz*.15,.5);if(!(Math.hypot(c.x-mx,c.z-mz)>=.45)){notSolid++;sol.push([x.id,+bl.toFixed(2),+Math.hypot(c.x-mx,c.z-mz).toFixed(2)]);}}
    for(const y of oldB)if(!(y.b[1]<x.b[0]||y.b[0]>x.b[1]||y.b[3]<x.b[2]||y.b[2]>x.b[3])&&ov(x.p,y.p)){ovOld++;if(ex.length<5)ex.push([x.id,y.id]);break;}
    for(const y of newB)if(y!==x&&y.n>x.n&&!(y.b[1]<x.b[0]||y.b[0]>x.b[1]||y.b[3]<x.b[2]||y.b[2]>x.b[3])&&ov(x.p,y.p)){ovNew++;break;}
    const pts=[[cx,cz],...x.p];let rd=false,wt=false;
    for(const q of pts){for(const s of W.roadSegs(q[0],q[1])){const dx=s[2]-s[0],dz=s[3]-s[1],t=Math.max(0,Math.min(1,((q[0]-s[0])*dx+(q[1]-s[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(q[0]-s[0]-dx*t,q[1]-s[1]-dz*t)<s[4].w/2-.2)rd=true;}
      if(T.water3At(q[0],q[1]))wt=true;}
    if(rd)road++;if(wt){water++;ex.push(['water',x.id]);}
  }
  const spec=id=>{const r=rec.get(id);return r&&r.specs[0][1];};
  const g=garage.map(id=>{const s=spec(id);return s&&{id,kind:s.kind,sty:s.sty,pitched:s.pitched,h:+s.h.toFixed(2),noWin:!!(s.faces&&s.faces.windows)};});
  const h=green.map(id=>{const s=spec(id);return s&&{id,kind:s.kind,sty:s.sty,h:+s.h.toFixed(2)};});
  return{sol:sol.slice(0,8),n:newB.length,notIn,notSolid,ovOld,ovNew,road,water,ex,g,h,glass:T.STY.glass,garSty:[T.STY.corrugated,T.STY.panel,T.STY.brick]};
},{ids:{first:A.w.length},garage:[3265,3267,3268,3269,3270,3273,3275,3276,3277,3278,3279,3280,3313].map(i=>'c'+i),green:[3588,4987,5531,5532,5533,7424,7700].map(i=>'c'+i)});
check('every added building is a building to inBuilding',r.notIn===0,{n:r.n,notIn:r.notIn});
check('every added building is solid (collide pushes out)',r.notSolid===0,{notSolid:r.notSolid,examples:r.sol});
check('added buildings overlap no pre-existing building',r.ovOld===0,{overlap:r.ovOld,examples:r.ex});
check('added buildings overlap no other added building',r.ovNew===0,{overlap:r.ovNew});
check('added buildings on no road',r.road===0,{road:r.road});
check('added buildings in no water',r.water===0,{water:r.water,ex:r.ex});
check('garage row drawn as garages (shed, flat, windowless, wall style)',r.g.every(s=>s&&s.kind==='shed'&&!s.pitched&&s.noWin&&r.garSty.includes(s.sty)&&s.h<=3.6),{garages:r.g.length,sample:r.g.slice(0,3)});
check('greenhouses drawn in the glass style',r.h.every(s=>s&&s.kind==='shed'&&s.sty===r.glass),{h:r.h});
const nowById=byId;let changedLook=0,changedRoof=0,restyled=0;
for(const q of base){const n=nowById.get(q.id);if(q.look&&JSON.stringify([q.kind,q.sty,q.h,q.roof,q.wall])!==JSON.stringify([n.kind,n.sty,n.h,n.roof,n.wall]))changedLook++;if(q.roofs&&JSON.stringify(q.roof)!==JSON.stringify(n.roof))changedRoof++;if(q.kind!==n.kind||q.sty!==n.sty)restyled++;}
check('buildings with a street/hand look unchanged',changedLook===0,{changedLook});
check('photo roof colours unchanged',changedRoof===0,{changedRoof});
check('some existing buildings restyled',restyled>300,{restyled});
check('no console errors',errs.length===0,errs.slice(0,5));
await b.close();
console.log(fails?'FAIL '+fails:'PASS');process.exit(fails?1:0);
