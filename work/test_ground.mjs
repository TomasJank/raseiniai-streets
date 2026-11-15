// ground colour map: node test_ground.mjs page.html   (real GPU via ANGLE/Metal; exits 1 on a failed assertion)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
if(h.split(o).length!==2)throw new Error('hook');
const api=`window.__t={get world(){return world},get renderer(){return renderer},get camera(){return camera},get wg(){return worldGroup},GY,GMAP,E:GMAP_IN_E,ENV,THREE,get grass(){return grass},
setup(){tod=13;weather.kind='clear';weather.amt=weather.want=0;for(let i=0;i<40;i++)updateEnv(.05);for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;scene.traverse(o=>{if(o.isSprite)o.visible=false});},
top(x,z){const y=GY(x,z);sun.position.set(x+105,y+85,z+65);sun.target.position.set(x,y,z);sun.target.updateMatrixWorld();camera.position.set(x,y+60,z+.01);camera.up.set(0,0,-1);camera.lookAt(x,y,z);camera.updateMatrixWorld();perfT=0;perfTick(.016);renderer.render(scene,camera);camera.up.set(0,1,0);},
hm(x,z){if(!grass)buildGrass();grassMap(x,z);return grass;}};`;
const tmp=dir+'_ground.html';fs.writeFileSync(tmp,h.replace(o,api+o));
const b=await chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu-rasterization','--allow-file-access-from-files']});
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};

for(const phone of [false,true]){
  const ctx=await b.newContext({viewport:{width:1280,height:720},...(phone?{isMobile:true,hasTouch:true}:{})});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+tmp);
  await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length&&__t.GMAP.U.uGOn.value===1,null,{timeout:120000});await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{
    const T=__t,W=T.world,U=T.GMAP.U,gl=T.renderer.getContext(),out={};
    out.size=[U.uGI.value.image.width,U.uGO.value.image.width];
    const ground=T.wg.children.find(o=>o.isMesh&&o.userData.grass&&o.geometry.parameters);
    const sheets=T.wg.children.filter(o=>o.isMesh&&o.userData.grass&&o!==ground);
    out.sheets={n:sheets.length,shareMap:sheets.every(s=>s.material===ground.material)};
    // the map itself, read back: pick texels far from buildings and roads that are clearly soil or clearly grass
    const im=U.uGI.value.image,n=im.width,cv=document.createElement('canvas');cv.width=cv.height=n;const cx=cv.getContext('2d');cx.drawImage(im,0,0);const px=cx.getImageData(0,0,n,n).data;
    const E=T.E,at=(x,z)=>{const i=(Math.floor((z+E)/(2*E)*n)*n+Math.floor((x+E)/(2*E)*n))*4;return [px[i],px[i+1],px[i+2]];};
    const clear=(x,z)=>!W.inBuilding(x,z)&&!W.roadSegs(x,z).some(s=>{const dx=s[2]-s[0],dz=s[3]-s[1],l=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/l));return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<s[4].w/2+6;});
    out.classTexels=0;for(let i=3;i<px.length;i+=4*97)if(px[i]<250)out.classTexels++;
    const soil=[],green=[];
    for(let z=-1800;z<=1800;z+=90)for(let x=-1800;x<=1800;x+=90){
      const c=at(x,z),ok=[[-4,0],[4,0],[0,-4],[0,4]].every(([a,b])=>{const d=at(x+a,z+b);return Math.abs(d[0]-c[0])+Math.abs(d[1]-c[1])+Math.abs(d[2]-c[2])<18;});
      if(!ok||!clear(x,z))continue;
      if(c[0]-c[1]>12&&soil.length<4)soil.push([x,z,c]);else if(c[1]-c[0]>20&&c[1]-c[2]>20&&green.length<4)green.push([x,z,c]);}
    T.setup();
    const read=()=>{const w=gl.drawingBufferWidth,hh=gl.drawingBufferHeight,a=new Uint8Array(4*25);gl.readPixels((w>>1)-2,(hh>>1)-2,5,5,gl.RGBA,gl.UNSIGNED_BYTE,a);let r=0,g=0,b=0;for(let i=0;i<100;i+=4){r+=a[i];g+=a[i+1];b+=a[i+2];}return [r/25|0,g/25|0,b/25|0];};
    const shot=([x,z])=>{T.top(x,z);return read();};
    out.soil=soil.map(s=>({at:[s[0],s[1]],map:s[2],screen:shot(s)}));out.green=green.map(s=>({at:[s[0],s[1]],map:s[2],screen:shot(s)}));
    // blades: the blade map at those points
    const buf=new Uint16Array(448*448*4),blade=(x,z)=>{const g=T.hm(x,z);T.renderer.readRenderTargetPixels(g.rt,0,0,448,448,buf);return T.THREE.DataUtils.fromHalfFloat(buf[(224*448+224)*4+1]);};
    out.bladeSoil=soil.map(s=>blade(s[0],s[1]));out.bladeGreen=green.map(s=>blade(s[0],s[1]));
    // snow still covers the ground
    // every grass point; a game tree can stand on one, so the test asks for most of them
    if(green.length){T.ENV.snow.value=1;out.snow=green.map(shot);T.ENV.snow.value=0;}
    return out;});
  const tag=phone?'phone':'desktop';
  check(`${tag}: maps loaded (${phone?'2048':'4096'} inner, 1024 outer)`,r.size[0]===(phone?2048:4096)&&r.size[1]===1024,r.size);
  check(`${tag}: town surface classes present in the map's alpha`,r.classTexels>1000,r.classTexels);
  check(`${tag}: OSM green sheets drawn with the ground's map material`,r.sheets.n>0&&r.sheets.shareMap,r.sheets);
  check(`${tag}: found soil and grass sample points in the map`,r.soil.length>=2&&r.green.length>=2,{soil:r.soil.length,green:r.green.length});
  check(`${tag}: soil renders red over green, grass green over red`,r.soil.every(s=>s.screen[0]>s.screen[1])&&r.green.every(s=>s.screen[1]>s.screen[0]+8),{soil:r.soil,green:r.green});
  // one sample may sit in a tree's shadow
  check(`${tag}: rendered ground within 35% of the map colour (all but one sample)`,[...r.soil,...r.green].filter(s=>!s.screen.every((v,i)=>Math.abs(v-s.map[i])<=Math.max(12,.35*s.map[i]))).length<=1,[...r.soil,...r.green].map(s=>[s.map,s.screen]));
  check(`${tag}: no blades on soil, blades on grass`,r.bladeSoil.every(v=>v<.5)&&r.bladeGreen.every(v=>v>=.5),{soil:r.bladeSoil,green:r.bladeGreen});
  check(`${tag}: snow whitens the mapped ground (3 of 4 grass points)`,r.snow&&r.snow.filter(c=>Math.min(...c)>150).length>=Math.min(3,r.snow.length),r.snow);
  check(`${tag}: no page errors`,!errs.length,errs.slice(0,3));
  await ctx.close();
}
console.log(fails?'FAILED '+fails:'PASS');
await b.close();fs.unlinkSync(tmp);process.exit(fails?1:0);
