// purple-reflection regression + water look: node test_fixwater.mjs page.html [shotdir]   (exits 1 on a failed assertion)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,shots]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__g={get world(){return world},get renderer(){return renderer},get water(){return water2List},get camera(){return camera},get scene(){return scene},get GY(){return GY},get TREES(){return TREES},
view(t,from,to){tod=t;weather.kind='clear';weather.amt=weather.want=0;for(let i=0;i<40;i++)updateEnv(.05);camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();},draw:gfxRender,
mask(w){const gl=renderer.getContext(),W=gl.drawingBufferWidth,H=gl.drawingBufferHeight,a=new Uint8Array(W*H*4),m=w.material;w.material=new THREE.MeshBasicMaterial({color:0x0000ff,fog:false});renderer.render(scene,camera);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,a);w.material=m;
const out=[];for(let y=0;y<H;y+=6)for(let x=0;x<W;x+=6){const i=(y*W+x)*4;if(a[i+2]>200&&a[i]<20&&a[i+1]<20)out.push([x,y]);}return out;},
hits(w,n,m){const R=new THREE.Raycaster(),out=[];w.updateMatrixWorld();for(let i=0;i<n;i++)for(let j=0;j<m;j++){R.setFromCamera(new THREE.Vector2((i+.5)/n*2-1,(j+.5)/m*2-1),camera);if(R.intersectObject(w).length)out.push([Math.round((i+.5)/n*gl_w()),Math.round((j+.5)/m*gl_h())]);}return out;}};
const gl_w=()=>renderer.getContext().drawingBufferWidth,gl_h=()=>renderer.getContext().drawingBufferHeight;`;
const tmp=dir+'_fw.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('console',m=>{if(/^mask/.test(m.text()))console.log(m.text())});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.goto('file://'+tmp);
await p.waitForFunction(()=>window.__g&&__g.world&&__g.world.cars.length,null,{timeout:120000});
await p.waitForFunction(()=>__g.water.length,null,{timeout:30000});await p.waitForTimeout(2000);
const r=await p.evaluate(()=>{
  const G=__g,gl=G.renderer.getContext(),W=gl.drawingBufferWidth,H=gl.drawingBufferHeight,px=new Uint8Array(W*H*4);
  let best=null,ba=0;for(const w of G.water){w.geometry.computeBoundingBox();const bb=w.geometry.boundingBox,a=(bb.max.x-bb.min.x)*(bb.max.y-bb.min.y);if(a>ba){ba=a;best=w;}}
  const bb=best.geometry.boundingBox,cx=(bb.min.x+bb.max.x)/2,cz=-(bb.min.y+bb.max.y)/2,wy=best.position.y,rx=(bb.max.x-bb.min.x)/2,rz=(bb.max.y-bb.min.y)/2;
  const tr=G.TREES.map(t=>(t.Tk.parent&&t.Tk.position)||null);
  const out={pond:[cx,cz,rx,rz],views:[]};
  const sat=(i)=>{const r=px[i]/255,g=px[i+1]/255,b=px[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b);return [mx?(mx-mn)/mx:0,mx];};
  const vp=best.geometry.attributes.position,N=vp.count;
  for(let k=0;k<12;k++){const i=Math.floor(k*N/12),vx=vp.getX(i),vz=-vp.getY(i),dx=cx-vx,dz=cz-vz,d=Math.hypot(dx,dz),ux=dx/d,uz=dz/d;
    const from=[vx-ux*3,G.GY(vx-ux*3,vz-uz*3)+1.7,vz-uz*3];
    G.view(13,from,[vx+ux*40,wy,vz+uz*40]);
    G.draw();const pts=G.mask(best);let worst=0,mean=0;
    for(let f=0;f<60;f++){G.draw();gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);let bad=0;
      for(const [x,y] of pts){const i=(y*W+x)*4,[s,v]=sat(i);if(s>.5&&v>.3)bad++;}
      worst=Math.max(worst,bad/Math.max(1,pts.length));mean+=bad/Math.max(1,pts.length)/60;}
    out.views.push({n:pts.length,worst:+worst.toFixed(4),mean:+mean.toFixed(4)});
  }
  return out;});
let fails=0;const check=(n,ok,i)=>{console.log(ok?'PASS':'FAIL',n,JSON.stringify(i));if(!ok)fails++;};
console.log(JSON.stringify(r));
const seen=r.views.filter(v=>v.n>200);
check('pond visible in views',seen.length>=3,{seen:seen.length});
check('no saturated (override-colour) pond pixels in any of 60 frames',seen.every(v=>v.worst<.03),seen.map(v=>v.worst));
check('no console errors',errs.length===0,errs.slice(0,4));
await b.close();fs.unlinkSync(tmp);console.log(fails?'FAILED '+fails:'PASS');process.exit(fails?1:0);
