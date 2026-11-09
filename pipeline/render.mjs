import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [S,name,file]=process.argv.slice(2);
const views=JSON.parse(fs.readFileSync(S+'/views.json','utf8'));
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
fs.writeFileSync(S+'/game/_r_'+name+'.html',h.replace(o,"window.__g=()=>({renderer,scene,camera,world,GY});"+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1100,height:640}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+S+'/game/_r_'+name+'.html');await p.waitForTimeout(30000);
console.log(name,'buildings',await p.evaluate(()=>window.__g().world.buildings.length));
for(const [nm,from,to,up] of views){
  const d=await p.evaluate(([from,to,up])=>{const g=window.__g(),w=g.world,P=q=>[(q[1]-w.lon0)*w.kx,-(q[0]-w.lat0)*w.kz];
    const a=P(from),c=P(to);g.camera.position.set(a[0],g.GY(a[0],a[1])+up,a[1]);g.camera.lookAt(c[0],g.GY(c[0],c[1])+(up>10?0:2),c[1]);g.camera.updateMatrixWorld();
    const f=g.scene.fog;if(f)g.scene.fog=null;g.renderer.render(g.scene,g.camera);const u=g.renderer.domElement.toDataURL('image/png');if(f)g.scene.fog=f;return u;},[from,to,up]);
  fs.writeFileSync(`${S}/shots/${name}_${nm}.png`,Buffer.from(d.split(',')[1],'base64'));
}
console.log('errors',errs.slice(0,5));await b.close();
