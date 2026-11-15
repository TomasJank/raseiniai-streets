// Look at a download as it is: node view.mjs path.glb out.jpg   (top, side, front and a 3/4 view on one sheet)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const here=new URL('.',import.meta.url).pathname,[file,out]=process.argv.slice(2);
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:1600,height:1000}});
await p.goto('file://'+here+'_convert.html');await p.waitForFunction(()=>window.ready);
const url=await p.evaluate(async glb=>{const T=THREE,g=await new GLTFLoader().parseAsync(Uint8Array.from(atob(glb),c=>c.charCodeAt(0)).buffer,'');
  const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(1600,1000);const s=new T.Scene();s.background=new T.Color(0x9aa4ad);s.add(g.scene,new T.HemisphereLight(0xffffff,0x555555,2.2));
  const d=new T.DirectionalLight(0xffffff,1.5);d.position.set(3,6,4);s.add(d);const box=new T.Box3().setFromObject(g.scene),c=box.getCenter(new T.Vector3()),z=box.getSize(new T.Vector3()),R=Math.max(z.x,z.y,z.z)*.62;
  const cam=new T.OrthographicCamera(-R*1.6,R*1.6,R,-R,.01,R*20);r.autoClear=false;r.clear();r.setScissorTest(true);
  [[0,1,0,0,0],[1,0,0,800,0],[0,0,1,0,500],[.7,.45,.7,800,500]].forEach(([x,y,zz,vx,vy])=>{cam.position.set(c.x+x*R*5,c.y+y*R*5,c.z+zz*R*5);cam.up.set(0,y===1?0:1,y===1?-1:0);cam.lookAt(c);r.setViewport(vx,vy,800,500);r.setScissor(vx,vy,800,500);r.render(s,cam);});
  return r.domElement.toDataURL('image/jpeg',.9);},fs.readFileSync(file).toString('base64'));
fs.writeFileSync(out,Buffer.from(url.split(',')[1],'base64'));await b.close();
