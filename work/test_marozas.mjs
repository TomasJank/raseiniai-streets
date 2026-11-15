// the player's tracksuit: node test_marozas.mjs page.html [base.html]   (base = the build without add_marozas.py, for the draw-call comparison)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,base]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname,o='function drawMini(){';
const API=`window.__t={THREE,get world(){return world},get player(){return player},get peds(){return peds},get CHAR(){return CHAR},get CL(){return CL},PLAYER_I,PLAYER_LOOK,renderer,camera,
get GY(){return GY},set tod(v){tod=v},enterExit,resetToRoad,hidePed,charPose:(...a)=>charPose(...a),charMake:b=>charMake(b),charTick:()=>charTick(),charAnim0:(s,d)=>charAnim0(s,d),
get FG(){return typeof FG==='undefined'?null:FG},get MZ(){return typeof MZ==='undefined'?null:MZ},freeze(){updatePeople=function(){};}};`;
async function open(f,name){
  const h=fs.readFileSync(f,'utf8');if(h.split(o).length!==2)throw new Error('hook');
  fs.writeFileSync(dir+name,h.replace(o,API+o));
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:600,height:600}});const errs=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
  await p.goto('file://'+dir+name);
  await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:240000});
  await p.evaluate(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;T.enterExit();});
  await p.waitForFunction(()=>__t.CHAR.ready&&__t.CL.ready&&__t.FG&&__t.FG.ready&&__t.CHAR.clips.kick,null,{timeout:240000});await p.waitForTimeout(500);
  await p.evaluate(()=>{const T=__t,V=T.THREE.Vector3;T.freeze();T.peds.forEach((q,i)=>{q.mode='hide';T.hidePed(i);});
    // the player alone, lit, on black: white pixels are stripes, zip, shoes and eye whites
    const S=new T.THREE.Scene();S.add(new T.THREE.AmbientLight(0xffffff,.6));const sun=new T.THREE.DirectionalLight(0xffffff,1.6);sun.position.set(2,4,3);S.add(sun);const sun2=sun.clone();sun2.position.set(-2,4,3);S.add(sun2);S.background=new T.THREE.Color(0);window.S=S;
    window.person=(i,look,clo)=>{const P=T.player;T.CHAR.use[i]=1;if(clo)T.CL.want=clo;T.charPose(i,look,P.x,P.z,0,0,0,0,0,false,0,null);const st=T.CHAR.list[i];S.add(st.o);st.o.position.set(0,0,0);st.o.visible=true;return st;};
    window.pose=(st,mode,g,ph,one,f)=>{Object.assign(st,{mode,gait:g,ph,t:1,snap:true,prev:mode,one:null});if(one){st.one=one;st.oneT=T.CHAR.clips[one].duration*f;}st.o.updateMatrixWorld(true);T.charAnim0(st,0);T.charTick();st.o.updateMatrixWorld(true);};
    const R=T.renderer,cam=new T.THREE.PerspectiveCamera(35,1,.1,50),gl=R.getContext(),W=R.domElement.width,H=R.domElement.height,px=new Uint8Array(W*H*4);
    // white pixels within 5 px of the projected bone segment a-b, from camera position c
    window.limbWhite=(st,c,segs)=>{cam.position.copy(c);cam.lookAt(0,.9,0);cam.updateMatrixWorld();R.setRenderTarget(null);R.render(S,cam);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);
      const sc=v=>{const q=v.clone().project(cam);return[(q.x+1)/2*W,(q.y+1)/2*H];};
      return segs.map(([a,b])=>{const A=sc(st.bone[a].getWorldPosition(new V())),B=sc(st.bone[b].getWorldPosition(new V()));let n=0;
        const dx=B[0]-A[0],dy=B[1]-A[1],L2=dx*dx+dy*dy||1;
        for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=Math.max(.1,Math.min(.8,((x-A[0])*dx+(y-A[1])*dy)/L2)),ex=A[0]+dx*t-x,ey=A[1]+dy*t-y;if(ex*ex+ey*ey>25*4)continue;
          const k=(y*W+x)*4,r=px[k],g=px[k+1],bb=px[k+2];if(Math.min(r,g,bb)>90&&Math.max(r,g,bb)-Math.min(r,g,bb)<30)n++;}
        return n;});};});
  return {b,p,errs};
}
const {b,p,errs}=await open(file,'_marozas.html');
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};

await check('playerOutfit',()=>{const T=__t,st=person(T.PLAYER_I,T.PLAYER_LOOK),M=T.MZ;if(!M)return{ok:false,err:'no MZ'};
  const want=[M.col.skin,M.col.shirt,M.col.fore,M.col.legs,M.col.shin,M.col.shoe,M.col.hair],got=want.map((_,j)=>st.rc[j].getHex());
  return{ok:st.ok==='casual'&&st.b==='m'&&!!st.mz&&st.mz.mzBuzz.value===1&&T.PLAYER_LOOK.clo==='casual'&&got.every((h,j)=>h===want[j])&&!T.PLAYER_LOOK.hat&&!T.PLAYER_LOOK.cap,
    outfit:st.ok,body:st.b,colours:got.map(h=>h.toString(16)),buzz:st.mz&&st.mz.mzBuzz.value};});

// three stripes down both sleeves and both legs, seen from the left and from the right, in every on-foot pose
await check('stripesEveryPose',()=>{const T=__t,V=T.THREE.Vector3,st=T.CHAR.list[T.PLAYER_I],bad=[],res={};
  const poses=[['idle','idle',0,0],['walk','walk',.45,1.2],['run','walk',.95,1.2],['jab','fight',0,0,'jab',.45],['cross','fight',0,0,'cross',.45],['kick','fight',0,0,'kick',.4],
    ['guard','fight',0,0],['down','down',0,0],['getup','walk',0,0,'getup',.5]];
  const L=[['upperarm_l','hand_l'],['thigh_l','foot_l']],R=[['upperarm_r','hand_r'],['thigh_r','foot_r']];
  for(const [n,mode,g,ph,one,f] of poses){pose(st,mode,g,ph,one,f);
    // each side seen square-on and from 45 degrees ahead and behind: a limb swung toward the camera hides its own stripes from one angle
    // and from above that side: an arm punching straight out turns its outer side (and stripes) up, as a real sleeve does
    const view=(segs,s)=>[[0,1.1],[1,1.1],[-1,1.1],[0,3.4]].map(([a,y])=>limbWhite(st,new V(s*3.2*Math.cos(a*.785),y,3.2*Math.sin(a*.785)),segs)).reduce((m,c)=>m.map((x,j)=>Math.max(x,c[j])));
    const left=view(L,1),right=view(R,-1);res[n]=[...left,...right];
    [...left,...right].forEach((c,j)=>{if(c<12)bad.push(n+':'+['armL','legL','armR','legR'][j]+':'+c);});}
  return{ok:!bad.length,bad,res};});

// a pedestrian in the same outfit body gets none of it
await check('pedestriansPlain',()=>{const T=__t,V=T.THREE.Vector3,st=person(0,{age:'adult',male:true,s:1,clo:'casual'},'casual');
  st.rc.forEach((c,j)=>{if(j!==0&&j!==7)c.setHex(0x16171b);});pose(st,'idle',0,0);
  const prog=st.mesh.material.customProgramCacheKey(),w=limbWhite(st,new V(3.2,1.1,0),[['upperarm_l','hand_l'],['thigh_l','foot_l']]);st.o.visible=false;
  return{ok:!st.mz&&prog!=='clothes_mz'&&w.every(c=>c<12),program:prog,white:w};});

if(base){const bo=await open(base,'_marozas_base.html');
  const meas=pg=>pg.evaluate(()=>{const T=__t,R=T.renderer;const st=person(T.PLAYER_I,T.PLAYER_LOOK);R.info.autoReset=true;
    const cam=new T.THREE.PerspectiveCamera(35,1,.1,50);cam.position.set(0,1,3);cam.lookAt(0,1,0);R.render(S,cam);return R.info.render.calls;});
  const a=await meas(p),c=await meas(bo.p);await bo.b.close();
  console.log('drawCalls',JSON.stringify({page:a,base:c}));if(a>c)fails.push('drawCalls');}
console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('consoleErrors');
console.log(fails.length?'FAIL '+fails.join(' '):'PASS');await b.close();process.exit(fails.length?1:0);
