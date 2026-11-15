// landmarks2: church rebuilt, monastery off sheet metal, GRPK towers placed and solid. node test_landmarks2.mjs page.html   (exits 1 on a failed assertion)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get wg(){return worldGroup},get FX(){return FX},get STY(){return STY},get LM2_TOWERS(){return LM2_TOWERS},get GY(){return GY},get collideCar(){return collideCar}};`;
fs.writeFileSync(dir+'_x.html',h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1000,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_x.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:180000});await p.waitForTimeout(1000);
let fails=0;const check=(name,ok,info)=>{console.log(JSON.stringify({check:name,ok,info}));if(!ok)fails++;};
const r=await p.evaluate(()=>{const T=__t,W=T.world,L=W.lm2,names=[];T.wg.traverse(o=>{if(o.name)names.push(o.name);});
  const cr=T.FX.recs.find(q=>q.id==='c92'),c=L&&L.church,y0=cr.specs[0][1].y0;
  const chTris=c?c.mesh.geometry.attributes.position.count/3:0;
  const towerCentres=c?c.towers:[],cen=cr.pts.reduce((a,q)=>[a[0]+q[0]/cr.pts.length,a[1]+q[1]/cr.pts.length],[0,0]);
  const ms=T.FX.recs.find(q=>q.id==='c2475').specs[0][1];
  const tw=(L?L.towers:[]).map((t,i)=>{const d=T.LM2_TOWERS[i],inB=!!W.inBuilding(t.x,t.z),rr=d[2]==='lat'?d[4]/2+.3:d[4]/2+.1;
    let solid=null;if(!inB){const q=T.collideCar(t.x+rr+.2,t.z,.42,null);solid=q.hit&&Math.hypot(q.x-t.x,q.z-t.z)>=rr+.4;}
    return{k:t.k,at:[Math.round(t.x),Math.round(t.z)],dPos:Math.hypot(t.x-d[0],t.z-d[1]),hAbove:+(t.top-T.GY(t.x,t.z)).toFixed(1),want:d[3],inB,solid};});
  return{names:{church:names.includes('lm2_church'),old:names.includes('fx_church'),towers:names.includes('lm2_towers')},
    church:c&&{towerTop:+(c.towerTop-y0).toFixed(1),top:+(c.top-y0).toFixed(1),ridge:+(c.ridge-y0).toFixed(1),eave:+(c.eave-y0).toFixed(1),tris:chTris,
      towersFromCentre:towerCentres.map(t=>[+(t[0]-cen[0]).toFixed(1),+(t[1]-cen[1]).toFixed(1)]),bodyH:cr.specs[0][1].h,inside:towerCentres.every(t=>W.inBuilding(t[0],t[1]))},
    norfa:(()=>{const n=T.FX.recs.find(q=>q.id==='c2135'),s=n.specs[0][1],lum=c=>(c[0]+c[1]+c[2])/3,P=n.pts;
      const dSeg=(x,z)=>Math.min(...P.map((a,i)=>{const b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}));
      const signs=[];T.wg.traverse(o=>{if(o.isMesh&&o.material&&o.material.map&&o.material.map.isCanvasTexture&&dSeg(o.position.x,o.position.z)<2.5)signs.push(o.geometry.parameters&&+o.geometry.parameters.width.toFixed(1));});
      return{roof:+lum(s.roof).toFixed(2),wall:+lum(s.wall).toFixed(2),roofSty:s.roofSty,signs};})(),
    mon:{sty:ms.sty,corrugated:T.STY.corrugated,industrial:T.STY.industrial,roofSty:ms.roofSty,skel:!!ms.skelV,balcony:ms.balcony},tw};});
check('no page errors',errs.length===0,errs.slice(0,4));
check('meshes',r.names.church&&r.names.towers&&!r.names.old,r.names);
const C=r.church;
check('church heights',C&&C.towerTop>=21&&C.towerTop<=25&&C.top>=22&&C.top<=26&&C.ridge>=16&&C.ridge<=19&&C.eave>=10.5&&C.eave<=12.5&&C.bodyH===6.5,C);
// both towers on the north front, ~13 m either side of the axis, inside the footprint (so the building outline is their collision)
check('church towers north, twin',C&&C.towersFromCentre.length===2&&C.towersFromCentre.every(t=>t[1]< -14&&t[1]> -26)&&Math.abs(C.towersFromCentre[0][0]-C.towersFromCentre[1][0])>15&&C.inside,C&&C.towersFromCentre);
check('church budget',C&&C.tris>300&&C.tris<5000,C&&C.tris);
check('monastery not sheet metal',r.mon.sty!==r.mon.corrugated&&r.mon.sty!==r.mon.industrial&&r.mon.roofSty==='tiles'&&r.mon.skel&&r.mon.balcony===false,r.mon);
check('norfa light roof, not near-black, signed',r.norfa.roof>.7&&r.norfa.wall>.25&&r.norfa.roofSty==='flat'&&r.norfa.signs.length>=1,r.norfa);
check('towers placed',r.tw.length===16&&r.tw.every(t=>t.dPos<.01&&t.hAbove>=t.want-.6&&t.hAbove<=t.want+.6),r.tw.filter(t=>!(t.dPos<.01&&t.hAbove>=t.want-.6&&t.hAbove<=t.want+.6)));
check('towers solid',r.tw.filter(t=>!t.inB).length>=14&&r.tw.every(t=>t.inB||t.solid),r.tw.filter(t=>!t.inB&&!t.solid));
await b.close();
console.log(fails?`FAIL ${fails}`:'PASS');process.exit(fails?1:0);
