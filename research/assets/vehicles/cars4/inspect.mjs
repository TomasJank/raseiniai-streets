// What is in a download: node inspect.mjs path.glb   (one line per mesh: triangles, box in the file's own units, material)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');const {chromium}=require('playwright');
const here=new URL('.',import.meta.url).pathname;
const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+here+'_convert.html');await p.waitForFunction(()=>window.ready);
for(const f of process.argv.slice(2)){
  const r=await p.evaluate(async glb=>{const T=THREE,g=await new GLTFLoader().parseAsync(Uint8Array.from(atob(glb),c=>c.charCodeAt(0)).buffer,'');g.scene.updateMatrixWorld(true);
    const out=[],all=new T.Box3();g.scene.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.computeBoundingBox();all.union(geo.boundingBox);
      const m=Array.isArray(o.material)?o.material[0]:o.material,bb=geo.boundingBox,f=v=>v.toArray().map(x=>+x.toFixed(2)).join(' ');
      out.push([(geo.index?geo.index.count:geo.attributes.position.count)/3,'['+f(bb.min)+'] ['+f(bb.max)+']',o.name,m.name,'#'+m.color.getHexString(),m.map?'map'+m.map.image.width:'',m.emissiveMap?'emis':'',m.transparent?'transparent '+m.opacity:'',m.side===2?'2side':'',o.visible?'':'hidden'].join('  '));});
    return{out,box:all.min.toArray().concat(all.max.toArray()).map(x=>+x.toFixed(2)),anim:g.animations.length};},fs.readFileSync(f).toString('base64'));
  console.log(f,'box',r.box.join(' '),'animations',r.anim);for(const l of r.out)console.log(' ',l);}
await b.close();
