// speech bubbles are never black (per pooled sprite, best sample over the run: mean>110 and >=25% light pixels; a sprite hidden behind a person is skipped by taking the best frame): node test_bubbles.mjs page.html  (6 groups in front of the camera, tod 13 and 22)
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
let h=fs.readFileSync(file,'utf8');const o='function drawMini(){';
fs.writeFileSync(dir+'_bub.html',h.replace(o,`window.__t={get world(){return world},get player(){return player},get peds(){return peds},get pedGroups(){return pedGroups},set tod(v){tod=v},get talkSpr(){return talkSpr},get camera(){return camera},resetToRoad:()=>resetToRoad(),resetPed:q=>resetPed(q),startTalk:(...a)=>startTalk(...a),THREE_V:()=>new THREE.Vector3()};`+o));
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:900,height:560}});
p.setDefaultTimeout(60000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'_bub.html');
await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:120000});await p.waitForTimeout(1000);
await p.evaluate(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;});
await p.waitForTimeout(1500);
let fails=0;
for(const tod of (process.argv[3]||'13,22').split(',').map(Number)){
  await p.evaluate(tod=>{const T=__t;T.tod=tod;const cam=T.camera,f=cam.getWorldDirection(T.THREE_V()),fx=f.x,fz=f.z,l=Math.hypot(fx,fz)||1,ux=fx/l,uz=fz/l,rx=-uz,rz=ux;
    const free=T.peds.filter(q=>q.mode!=='talk'&&!q.grp&&!q.lead);
    for(let g=0;g<6;g++){const mem=free.splice(0,2);const cx=cam.position.x+ux*(7+g%3*2.5)+rx*((g<3?-1:1)*(1.5+g%3)),cz=cam.position.z+uz*(7+g%3*2.5)+rz*((g<3?-1:1)*(1.5+g%3));
      mem.forEach((q,i)=>{T.resetPed(q);Object.assign(q,{mode:'walk',x:cx+i*1.1,z:cz,sp:1.3,e:T.world.edges[0],t:.5,dir:1,side:1});});T.startTalk(mem,cx+.55,cz);const gr=T.pedGroups[T.pedGroups.length-1];gr.sw=.1;gr.end=999;}
  },tod);
  await p.waitForFunction(()=>__t.talkSpr.filter(s=>s.visible).length>=4,null,{timeout:60000,polling:300}).catch(()=>{});
  const stats=[];
  for(let k=0;k<5;k++){await p.waitForTimeout(250);
    const rects=await p.evaluate(()=>{const T=__t,cam=T.camera,W=innerWidth,H=innerHeight,out=[];T.talkSpr.forEach((s,i)=>{if(!s.visible)return;const v=s.position.clone().project(cam);if(v.z>1)return;
      const hw=s.scale.x/2,hh=s.scale.y/2;const a=s.position.clone().add(new (s.position.constructor)(0,0,0));
      const pr=(dx,dy)=>{const q=s.position.clone();const r=new (s.position.constructor)().setFromMatrixColumn(cam.matrixWorld,0),u=new (s.position.constructor)().setFromMatrixColumn(cam.matrixWorld,1);q.addScaledVector(r,dx).addScaledVector(u,dy);q.project(cam);return[(q.x+1)/2*W,(1-q.y)/2*H];};
      const A=pr(-hw*.9,hh*.9),B=pr(hw*.9,-hh*.3);out.push({i,x0:Math.min(A[0],B[0]),y0:Math.min(A[1],B[1]),x1:Math.max(A[0],B[0]),y1:Math.max(A[1],B[1])});});return out;});
    if(!rects.length)continue;
    const t0=Date.now();const png=await p.screenshot();const b64=png.toString('base64');
    const res=await p.evaluate(async([b64,rects])=>{const im=await createImageBitmap(await (await fetch('data:image/png;base64,'+b64)).blob()),c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
      return rects.map(r=>{const w=Math.floor(r.x1-r.x0),h=Math.floor(r.y1-r.y0);if(w<40||h<14||r.x0<0||r.y0<0||r.x1>c.width||r.y1>c.height)return null;const d=x.getImageData(Math.floor(r.x0),Math.floor(r.y0),w,h).data;let s=0,dark=0,light=0,n=w*h;for(let i=0;i<d.length;i+=4){const l=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];s+=l;if(l<40)dark++;if(l>200)light++;}return{i:r.i,w,h,mean:+(s/n).toFixed(0),dark:+(dark/n).toFixed(3),light:+(light/n).toFixed(2)};}).filter(Boolean);},[b64,rects]);
    stats.push(...res);}
  const seenI=[...new Set(stats.map(s=>s.i))].sort(),best=seenI.map(i=>{const l=stats.filter(s=>s.i===i);return{i,mean:Math.max(...l.map(s=>s.mean)),light:Math.max(...l.map(s=>s.light)),n:l.length};}),bad=best.filter(s=>s.mean<=110||s.light<.25);
  const ok=seenI.length>=3&&bad.length===0;if(!ok)fails++;
  console.log(ok?'ok  ':'FAIL','bubbles tod',tod,JSON.stringify({samples:stats.length,pooledSeen:seenI,best,bad}));
}
if(errs.length){console.log('errors',errs.slice(0,3));fails++;}
await b.close();process.exit(fails?1:0);
