// smoke squares + dark walls: node test_fixgfx.mjs page.html [v38.html]   (real GPU via ANGLE/Metal; exits 1 on a failed assertion)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,ref]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
const o='function drawMini(){';
const api=`window.__x={get world(){return world},get player(){return player},get GY(){return GY},get camera(){return camera},get smoke(){return smoke},syncCar,fumes,updateSmoke,get S(){return gfxState},
view(from,to,t=13){tod=t;weather.kind='clear';weather.amt=weather.want=0;for(const c of world.cars)c.g.visible=false;for(const m of pedMesh)m.visible=false;
 const gp=GY(to[0],to[2]);sun.position.set(to[0]+105,gp+85,to[2]+65);sun.target.position.set(to[0],gp,to[2]);sun.target.updateMatrixWorld();for(let i=0;i<40;i++)updateEnv(.05);
 camera.position.set(...from);camera.lookAt(...to);camera.updateMatrixWorld();if(typeof perfTick==="function"){perfT=0;perfTick(.016);}if(typeof gfxRender==='function')gfxRender();else renderer.render(scene,camera);},resetToRoad};`;
const launch=()=>chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const open=async(b,f,name)=>{const p=await b.newPage({viewport:{width:640,height:400}});let h=fs.readFileSync(f,'utf8');if(h.split(o).length!==2)throw new Error('hook');
  fs.writeFileSync(dir+name,h.replace(o,api+o));await p.goto('file://'+dir+name);
  await p.waitForFunction(()=>window.__x&&__x.world&&__x.world.cars.length,null,{timeout:120000});await p.waitForFunction(()=>__x.S.comp&&(!__x.S.gtao||1),null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(3000);return p;};
const survey=()=>{const X=__x,W=X.world,bs=W.buildings.filter(q=>q.mxx-q.mnx>8&&q.mxz-q.mnz>8&&q.mxx-q.mnx<60),n=40,st=Math.floor(bs.length/n),gl=X.camera&&document.querySelector('canvas').getContext('webgl2'),r=[];
  const px=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4),Wd=gl.drawingBufferWidth,Hd=gl.drawingBufferHeight;
  for(let i=0;i<n;i++){const b=bs[i*st],x=(b.mnx+b.mxx)/2,z=(b.mnz+b.mxz)/2,d=Math.max(b.mxx-b.mnx,b.mxz-b.mnz)/2+16;
    X.view([x+d*.6,X.GY(x+d*.6,z+d*.8)+4,z+d*.8],[x,X.GY(x,z)+4,z]);gl.readPixels(0,0,Wd,Hd,gl.RGBA,gl.UNSIGNED_BYTE,px);
    let s=0,c=0;for(let y=Math.floor(Hd*.3);y<Hd*.7;y++)for(let xx=Math.floor(Wd*.35);xx<Wd*.65;xx++){const k=(y*Wd+xx)*4;s+=.2126*px[k]+.7152*px[k+1]+.0722*px[k+2];c++;}r.push(s/c);}
  return r;};
let fails=0;const check=(name,ok,info)=>{console.log(ok?'PASS':'FAIL',name,JSON.stringify(info));if(!ok)fails++;};
const b=await launch();
const p=await open(b,file,'_fixgfx.html');
const sm=await p.evaluate(()=>{
  const X=__x,gl=document.querySelector('canvas').getContext('webgl2'),W=gl.drawingBufferWidth,H=gl.drawingBufferHeight,px=new Uint8Array(W*H*4);
  X.resetToRoad();const c=X.player.car;c.hp=.2;for(const w of X.world.cars)w.g.visible=w===c;
  // a dying car drives off; the chase camera ends up inside its own fume trail and looks down it
  const s=Math.sin(c.h),k=Math.cos(c.h);for(let i=0;i<70;i++){c.x+=s*.4;c.z+=k*.4;X.syncCar(c);X.fumes(.033);X.updateSmoke(.033);}
  const y=X.GY(c.x,c.z);X.view([c.x-s*6,X.GY(c.x-s*6,c.z-k*6)+2.8,c.z-k*6],[c.x-s*8,y+1.2,c.z-k*8]);
  gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);
  let black=0,sum=0;for(let i=0;i<px.length;i+=4){const l=.2126*px[i]+.7152*px[i+1]+.0722*px[i+2];if(l<8)black++;sum+=l;}
  return{blackPct:+(100*black/(W*H)).toFixed(2),meanLum:+(sum/(W*H)).toFixed(1),puffs:X.smoke.filter(q=>q.visible).length};});
check('smokeNoBlackQuads',sm.blackPct<.5&&sm.puffs>5,sm);
const lum=await p.evaluate(survey);
if(ref){const p2=await open(b,ref,'_fixgfx_ref.html');const L0=await p2.evaluate(survey);
  const ratio=lum.map((v,i)=>v/Math.max(L0[i],1)).sort((a,c)=>a-c),med=ratio[20],p10=ratio[4];
  check('wallLuminanceVsRef',p10>=.85&&med>=.9&&med<=1.15,{worst:+ratio[0].toFixed(2),p10:+p10.toFixed(2),median:+med.toFixed(2)});}
console.log('flags',JSON.stringify(await p.evaluate(()=>({gtao:!!__x.S.gtao,fixed:!!(__x.S.gtao&&__x.S.gtao._fixed)}))));
await b.close();process.exit(fails?1:0);
