// roads2: node test_roads2.mjs page.html   (exits 1 on a failed assertion; writes _roads2.html beside itself)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get player(){return player},SURF,KEY,driveCar,resetToRoad};`;
fs.writeFileSync(dir+'_roads2.html',h.replace(o,api+o));
const res=JSON.parse(fs.readFileSync(dir+'../pipeline/geo/roads2_surface.json','utf8'));
const a=h.indexOf('id="rasData">')+13,d=JSON.parse(h.slice(a,h.indexOf('</script>',a)));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:900,height:600}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+dir+'_roads2.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1500);
let fails=0;
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(r&&r.ok?'PASS':'FAIL',name,JSON.stringify(r));if(!r||!r.ok)fails++;return r;};

const want={...res.set,...res.overrides},bad=[],count={};
for(const [i,[surf,,,hw]] of Object.entries(want)){const w=d.w[i],t=w&&d.t[w[0]];if(!t||t.highway!==hw||t.surface!==surf)bad.push(i);count[surf]=(count[surf]||0)+1;}
console.log(bad.length?'FAIL':'PASS','every touched way exists, is a road and carries its surface',JSON.stringify({ways:Object.keys(want).length,bad:bad.slice(0,5),count}));if(bad.length)fails++;
const untouched=d.w.filter((w,i)=>!want[i]&&d.t[w[0]].highway&&!d.t[w[0]].surface&&d.t[w[0]].area!=='yes').length;
console.log(untouched>200?'PASS':'FAIL','ways left without a surface tag',untouched);if(untouched<=200)fails++;

// a point on Stadiono g. (gravel in the photo) and on Vilniaus g. (primary road, asphalt by OSM)
const spots={gravel:{x:775.7,z:-514.6,name:'Stadiono g.'},asphalt:{x:128.5,z:129.9,name:'Vilniaus g.'}};
const info=await check('the game reads each street surface through its own lookup',([sp])=>{
  const T=__t,W=T.world,out={};
  for(const [k,s] of Object.entries(sp)){const seg=W.roadSegs(s.x,s.z).map(q=>({q,d:Math.hypot(s.x-q[0]-(q[2]-q[0])*Math.max(0,Math.min(1,((s.x-q[0])*(q[2]-q[0])+(s.z-q[1])*(q[3]-q[1]))/((q[2]-q[0])**2+(q[3]-q[1])**2||1))),s.z-q[1]-(q[3]-q[1])*Math.max(0,Math.min(1,((s.x-q[0])*(q[2]-q[0])+(s.z-q[1])*(q[3]-q[1]))/((q[2]-q[0])**2+(q[3]-q[1])**2||1))))})).sort((a,b)=>a.d-b.d)[0];
    const r=seg.q[4],L=Math.hypot(seg.q[2]-seg.q[0],seg.q[3]-seg.q[1]);
    out[k]={name:r.t.name,surface:r.t.surface,unpaved:r.unpaved,ground:W.ground(s.x,s.z),dist:+seg.d.toFixed(2),dx:(seg.q[2]-seg.q[0])/L,dz:(seg.q[3]-seg.q[1])/L};}
  const g=out.gravel,a=out.asphalt;
  return{ok:g.name===sp.gravel.name&&g.surface==='gravel'&&g.unpaved&&g.ground===1&&a.name===sp.asphalt.name&&a.surface==='asphalt'&&!a.unpaved&&a.ground===2&&g.dist<1&&a.dist<1&&T.SURF[1].grip<T.SURF[2].grip&&T.SURF[1].acc<T.SURF[2].acc,out,grip:[T.SURF[1].grip,T.SURF[2].grip]};},[spots]);
if(info&&info.out){
  const run=await p.evaluate(([o,sp])=>{const T=__t,res={};
    for(const k of ['gravel','asphalt']){T.resetToRoad();const c=T.player.car,s=sp[k];c.x=s.x;c.z=s.z;c.h=Math.atan2(o[k].dx,o[k].dz);c.speed=0;c.vx=c.vz=0;c.hp=1;for(const q in T.KEY)T.KEY[q]=false;T.KEY.KeyW=true;let g=-1;
      for(let i=0;i<45;i++){T.driveCar(c,.033);g=c.gnd;}T.KEY.KeyW=false;res[k]={speed:+c.speed.toFixed(2),gnd:g};}
    return res;},[info.out,spots]);
  const ok=run.gravel.gnd===1&&run.asphalt.gnd===2&&run.gravel.speed<run.asphalt.speed;
  console.log(ok?'PASS':'FAIL','driving: the same throttle for 1.5 s gives less speed on the gravel street',JSON.stringify(run));if(!ok)fails++;}
if(errs.length){console.log('FAIL console errors',errs.slice(0,4));fails++;}else console.log('PASS no console errors');
await b.close();fs.unlinkSync(dir+'_roads2.html');console.log(fails?'FAILED '+fails:'PASS');process.exit(fails?1:0);
