// hats, caps, packs, bags, scarves and sticks on the outfit bodies: node test_fixgear.mjs page.html [base.html]
// base = the build without add_fixgear.py, for the draw-call comparison. Run on the base page itself, the checks below fail (they were written against its defects).
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium}=require('playwright');
const [file,base]=process.argv.slice(2);
const dir=new URL('.',import.meta.url).pathname;
const o='function drawMini(){';
// freeze(): the crowd stops moving and posing, so the people placed here are animated only through charTick
const API=`window.__t={THREE,get world(){return world},get player(){return player},get peds(){return peds},get CHAR(){return CHAR},get CL(){return CL},PARTS,pedMesh,PED_N,PED_ALL,renderer,scene,camera,
get GY(){return GY},get HATS(){return HATS},set tod(v){tod=v},enterExit,resetToRoad,dress,hidePed,charMake:b=>charMake(b),charTick:()=>charTick(),clOutfit:(l,i)=>clOutfit(l,i),
get FG(){return typeof FG==='undefined'?null:FG},freeze(){updatePeople=function(){};}};`;
async function open(f,name){
  const h=fs.readFileSync(f,'utf8');if(h.split(o).length!==2)throw new Error('hook');
  fs.writeFileSync(dir+name,h.replace(o,API+o));
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:800,height:500}});const errs=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text().slice(0,300))});
  await p.goto('file://'+dir+name);
  await p.waitForFunction(()=>window.__t&&__t.world&&__t.world.cars.length,null,{timeout:240000});
  await p.evaluate(()=>{const T=__t,L=T.world.labels.find(q=>/maxima/i.test(q.text)),c=T.player.car;c.x=L.x+40;c.z=L.z+40;c.speed=0;T.resetToRoad();T.player.car.speed=0;T.tod=13;T.enterExit();});
  await p.waitForFunction(()=>__t.CHAR.ready&&__t.CL.ready&&(!__t.FG||__t.FG.ready),null,{timeout:240000});await p.waitForTimeout(300);
  await p.evaluate(()=>{const T=__t,V=T.THREE.Vector3;T.freeze();
    T.peds.forEach((q,i)=>{q.mode='hide';T.hidePed(i);});T.CHAR.list.forEach(s=>{if(s)s.o.visible=false;});
    const X=T.player.x,Z=T.player.z,Y=T.GY(X,Z)+60;window.Y=Y;
    // person i, high above the town (clear background), facing +z
    window.mk=(i,b,clo,look,mode,ph=1.2,t=1)=>{const old=T.CHAR.list[i];if(old)old.o.removeFromParent();
      T.CL.want=clo;const st=T.charMake(b);T.CHAR.list[i]=st;st.o.visible=true;
      look=Object.assign({age:'adult',male:b==='m',clo},look);look.s=look.s||(look.age==='kid'?.62:1);st.look=look;
      const c={skin:0xe2b493,shirt:0x3d5f8a,legs:0x34302b,shoe:0x1d1c1b,hair:0x10e010,hat:0xff00ff,pack:0x7a2f2f,bag:0x8a5a3a,scarf:0xb22d2d,stick:0x4a3524};T.dress(i,c);
      [c.skin,c.shirt,c.shirt,c.legs,c.legs,c.shoe,c.hair].forEach((v,j)=>st.rc[j].setHex(v));
      st.o.position.set(X+i*1.5,Y,Z);st.o.rotation.set(0,0,0);st.o.scale.setScalar(look.s*T.CHAR.body[b].k);
      Object.assign(st,{mode,gait:mode==='walk'?.45:0,ph,t,snap:true,prev:mode,talk:mode==='talk',pr:.5,one:null});return st;};
    window.clear=()=>{T.CHAR.list.forEach((s,i)=>{if(s){s.o.removeFromParent();T.CHAR.list[i]=null;}if(i<T.PED_ALL)T.hidePed(i);});};
    window.tick=()=>{T.charTick();T.pedMesh.forEach(m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;});};
    window.inst=(k,i)=>{const m=new T.THREE.Matrix4();T.pedMesh[k].getMatrixAt(i,m);return m;};
    window.K=o=>T.PARTS.findIndex(p=>p.opt===o);
    // skinned outfit vertices in world space; under a hat the vertex shader's tuck is applied first, as the GPU does
    window.skinned=(st,filter)=>{const m=st.mesh,g=m.geometry,P=g.attributes.position,out=[],v=new V(),q=new V(),U=st.hatU;
      const on=U&&U.on.value>.5,Pn=T.FG?T.FG.P:2;
      for(let i=0;i<P.count;i++){if(filter&&!filter(i))continue;v.fromBufferAttribute(P,i);
        if(on){q.copy(v).applyMatrix4(U.M.value);const a=[Math.abs(q.x),Math.abs(q.y),Math.abs(q.z)],l=(a[0]**Pn+a[1]**Pn+a[2]**Pn)**(1/Pn);
          if(l>.95&&l<1.7&&q.y>(U.B.value.x-.05)*l+U.B.value.y*q.z)v.copy(q.multiplyScalar(.95/l).applyMatrix4(U.Mi.value));}
        m.applyBoneTransform(i,v);out.push(v.clone().applyMatrix4(m.matrixWorld));}
      return out;};
    window.armIdx=st=>{const g=st.mesh.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,B=st.mesh.skeleton.bones,ids=new Set();
      for(let i=0;i<si.count;i++){let bi=0,w=-1;for(let j=0;j<4;j++)if(sw.getComponent(i,j)>w){w=sw.getComponent(i,j);bi=si.getComponent(i,j);}if(/arm|hand|thumb|index|middle|ring|pinky/.test(B[bi].name))ids.add(i);}return ids;};
    window.headIdx=st=>{const g=st.mesh.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,B=st.mesh.skeleton.bones,ids=new Set();
      for(let i=0;i<si.count;i++){let bi=0,w=-1;for(let j=0;j<4;j++)if(sw.getComponent(i,j)>w){w=sw.getComponent(i,j);bi=si.getComponent(i,j);}if(B[bi].name==='Head')ids.add(i);}return ids;};
    // distance from each gear vertex to the nearest body vertex (5 cm grid)
    window.gaps=(st,k,i)=>{const body=skinned(st),G=new Map(),key=(x,y,z)=>x+','+y+','+z,c=.05;
      for(const b of body){const kk=key(Math.floor(b.x/c),Math.floor(b.y/c),Math.floor(b.z/c));(G.get(kk)||G.set(kk,[]).get(kk)).push(b);}
      const M=inst(k,i),P=T.pedMesh[k].geometry.attributes.position,v=new V(),d=[];
      for(let j=0;j<P.count;j++){v.fromBufferAttribute(P,j).applyMatrix4(M);let best=.3;const gx=Math.floor(v.x/c),gy=Math.floor(v.y/c),gz=Math.floor(v.z/c);
        for(let a=-2;a<=2;a++)for(let e=-2;e<=2;e++)for(let f=-2;f<=2;f++){const L=G.get(key(gx+a,gy+e,gz+f));if(L)for(const b of L)best=Math.min(best,b.distanceTo(v));}d.push(best);}
      d.sort((a,b)=>a-b);return d;};});
  return {b,p,errs};
}
const {b,p,errs}=await open(file,'_fixgear.html');
const fails=[];
const check=async(name,fn,arg)=>{let r;try{r=await p.evaluate(fn,arg);}catch(e){r={ok:false,err:e.message.split('\n')[0]};}console.log(name,JSON.stringify(r));if(!r||!r.ok)fails.push(name);return r;};
const PEOPLE=[['m','suit',{}],['f','tee',{}],['m','hoodie',{age:'kid'}],['f','dress',{age:'old',skirt:true}],['m','casual',{age:'old'}],['f','tee',{age:'kid'}]];

// the hat (or cap) is a shell round the crown: from the head's centre, no hair or skin vertex above the hat's lower edge lies beyond it
// (hair hanging out below the edge, a ponytail or a bob, is fine)
await check('hairUnderHat',PEOPLE=>{const T=__t,V=T.THREE.Vector3,res=[];let worst=0;
  for(const opt of['hat','cap'])for(const mode of['walk','sit']){clear();
    const S=PEOPLE.map(([b,clo,l],i)=>mk(i,b,clo,{...l,[opt]:true},mode));tick();
    const k=K(opt),g=T.pedMesh[k].geometry;g.computeBoundingBox();const gc=g.boundingBox.getCenter(new V()),P=g.attributes.position,lo=new Float32Array(24).fill(9),w=new V();
    const bin=v=>((Math.round(Math.atan2(v.x-gc.x,v.z-gc.z)/Math.PI*12)%24)+24)%24;
    for(let j=0;j<P.count;j++){w.fromBufferAttribute(P,j);const n=bin(w);lo[n]=Math.min(lo[n],w.y);}
    S.forEach((st,i)=>{const ids=headIdx(st),H=skinned(st,j=>ids.has(j)),M=inst(k,i),Mi=M.clone().invert(),mesh=new T.THREE.Mesh(g,new T.THREE.MeshBasicMaterial({side:T.THREE.DoubleSide}));
      mesh.matrixAutoUpdate=false;mesh.matrix.copy(M);mesh.matrixWorld.copy(M);
      const c=new V();for(const v of H)c.add(v);c.divideScalar(H.length);c.y+=.03*st.look.s;
      const rc=new T.THREE.Raycaster(),dir=new V();let out=0,cov=0,dmax=0;
      for(const v of H){w.copy(v).applyMatrix4(Mi);if(w.y<lo[bin(w)]+.01)continue;
        dir.subVectors(v,c);const L=dir.length();dir.normalize();rc.set(c,dir);rc.far=.5;const hit=rc.intersectObject(mesh,false)[0];
        if(!hit)continue;cov++;const d=L-hit.distance;if(d>.003){out++;dmax=Math.max(dmax,d);}}
      const f=out/Math.max(1,cov);worst=Math.max(worst,f);res.push(opt+':'+mode+':'+st.b+st.ok+(st.look.age==='adult'?'':'/'+st.look.age)+':'+(f*100).toFixed(1)+'%/'+(dmax*100).toFixed(1)+'cm');});}
  return{ok:worst<.01,worstFraction:+worst.toFixed(4),res:res.filter(r=>!/:0\.0%/.test(r))};},PEOPLE);

// from behind and the side, the top of the head (above the hat's middle) shows hat colour, not hair colour
await check('hatSeenFromBehind',PEOPLE=>{const T=__t,V=T.THREE.Vector3,R=T.renderer,cam=T.camera,res=[];let worst=1;
  clear();const S=PEOPLE.map(([b,clo,l],i)=>mk(i,b,clo,{...l,hat:true},'walk'));tick();
  const W=R.domElement.width,H=R.domElement.height,gl=R.getContext(),px=new Uint8Array(W*H*4),g=T.pedMesh[K('hat')].geometry;g.computeBoundingBox();
  // the people stand in a row along x: turn the person, not the camera, so nobody else is in the shot
  S.forEach((st,i)=>{for(const [view,ry] of [['back',0],['side',-Math.PI/2]]){st.o.rotation.y=ry;tick();
      const hp=st.bone.Head.getWorldPosition(new V()),mid=g.boundingBox.getCenter(new V()).applyMatrix4(inst(K('hat'),i));
      cam.position.set(hp.x,hp.y+.12,hp.z-1.1);cam.lookAt(hp.x,hp.y+.08,hp.z);cam.updateMatrixWorld();
      // readPixels rows run bottom-up
      const row=Math.round((mid.clone().project(cam).y+1)/2*H);
      R.render(T.scene,cam);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);let mag=0,grn=0;
      for(let y=row;y<H;y++)for(let x=0;x<W;x++){const q=(y*W+x)*4,r=px[q],gg=px[q+1],b=px[q+2];if(r>gg*1.6&&b>gg*1.6&&r>60)mag++;else if(gg>r*1.6&&gg>b*1.6&&gg>60)grn++;}
      const f=mag/Math.max(1,mag+grn);worst=Math.min(worst,f);res.push(view+':'+st.b+st.ok+':'+(f*100|0)+'%');}});
  return{ok:worst>.95,worstHatShare:+worst.toFixed(3),res};},PEOPLE);

// bag, pack and scarf touch the body over a patch (10% of the shape within 3.5 cm, its closest point within 2 cm; distances are to body vertices, which on this low-poly mesh sit up to ~1.5 cm from the nearest surface point) and are not buried in it
// (at most 10% of sampled vertices inside the skinned body: the hip sways under a bag hung from the chest), through a walk cycle, idle and sitting
await check('gearOnBody',()=>{const T=__t,V=T.THREE.Vector3,res={};let bad=[];
  const who={bag:[['f','tee',{}],['f','dress',{skirt:true}],['m','casual',{}],['f','suit',{age:'old'}]],pack:[['m','casual',{young:true}],['m','hoodie',{age:'kid'}],['f','dress',{skirt:true,young:true}]],
    scarf:[['m','suit',{}],['f','tee',{}],['m','hoodie',{age:'kid'}],['m','casual',{age:'old'}]]};
  const poses=[...Array.from({length:4},(_,n)=>['walk',n/4*Math.PI*2]),['idle',0],['sit',0]],rc=new T.THREE.Raycaster(),dir=new V();
  for(const opt in who){let p10=0,near=0,inside=0;
    for(const [mode,ph] of poses){clear();const S=who[opt].map(([b,clo,l],i)=>mk(i,b,clo,{...l,[opt]:true},mode,ph,1.5));tick();
      S.forEach((st,i)=>{const d=gaps(st,K(opt),i),s=st.look.s,a=d[d.length/10|0]/s,c=d[0]/s;p10=Math.max(p10,a);near=Math.max(near,c);
        const body=skinned(st),bg=new T.THREE.BufferGeometry().setFromPoints(body),arm=armIdx(st),ix=st.mesh.geometry.index.array,keep=[];
        // arms are left out: an arm hanging beside the bag is not the bag inside the body, and open sleeves break the crossing count
        for(let j=0;j<ix.length;j+=3)if(!arm.has(ix[j])&&!arm.has(ix[j+1])&&!arm.has(ix[j+2]))keep.push(ix[j],ix[j+1],ix[j+2]);bg.setIndex(keep);
        const bm=new T.THREE.Mesh(bg,new T.THREE.MeshBasicMaterial({side:T.THREE.DoubleSide})),M=inst(K(opt),i),P=T.pedMesh[K(opt)].geometry.attributes.position,v=new V();let n=0,in_=0;
        // inside test: count body crossings on a level ray pointing away from the spine (the layered outfit meshes make any other direction unreliable)
        const sp=st.bone.spine_03.getWorldPosition(new V());
        for(let j=0;j<P.count;j+=7){v.fromBufferAttribute(P,j).applyMatrix4(M);dir.set(v.x-sp.x,0,v.z-sp.z).normalize();rc.set(v,dir);n++;if(rc.intersectObject(bm,false).length%2)in_++;}
        const f=in_/n;inside=Math.max(inside,f);
        if(a>.035||c>.02||f>.1)bad.push(opt+':'+mode+(mode==='walk'?(ph*57|0):'')+':'+st.b+st.ok+':'+a.toFixed(3)+'/'+c.toFixed(3)+'/in'+(f*100|0)+'%');});}
    res[opt]={worstP10:+p10.toFixed(3),worstClosest:+near.toFixed(3),worstInside:+inside.toFixed(3)};}
  return{ok:!bad.length,...res,bad:bad.slice(0,12)};});

// nobody carries what the outfit already has: the trek outfit's own pack, the farmer's and worker's own hats
await check('noDoubleGear',()=>{const T=__t,bad=[];clear();
  const cases=[['f','trek','pack',{age:'kid'}],['f','trek','pack',{}],['m','farmer','hat',{}],['m','worker','cap',{}],['f','worker','hat',{}],['m','farmer','cap',{age:'old'}]];
  cases.forEach(([b,clo,opt,l],i)=>mk(i,b,clo,{...l,[opt]:true},'walk'));tick();
  cases.forEach(([b,clo,opt],i)=>{const e=inst(K(opt),i).elements;if(Math.abs(e[0])+Math.abs(e[5])+Math.abs(e[10])>1e-3)bad.push(b+clo+':'+opt);});
  // and the looks that get those outfits: kids and pensioners never get the work outfit, girls only kids' clothes
  const outs={};for(let n=0;n<400;n++){const age=['kid','old'][n%2],f=n%4<2,l={age,male:!f,pack:n%7===0,skirt:n%5===0,coat:n%9===0};const c=T.clOutfit(l,0);outs[age+(f?'F':'M')+':'+c]=1;
    if(c==='worker'||age==='kid'&&f&&!['tee','dress','trek'].includes(c))bad.push(age+(f?'F':'M')+':'+c);}
  return{ok:!bad.length,bad:[...new Set(bad)],outfits:Object.keys(outs).sort()};});

// a cane stands on the ground and upright, in every pose
await check('stickOnGround',()=>{const T=__t,V=T.THREE.Vector3,bad=[],r=[];
  for(const mode of['walk','idle','sit','talk']){clear();const S=[['m','casual'],['f','dress'],['m','suit']].map(([b,clo],i)=>mk(i,b,clo,{age:'old',stick:true},mode));tick();
    S.forEach((st,i)=>{const M=inst(K('stick'),i),g=T.pedMesh[K('stick')].geometry;g.computeBoundingBox();
      const lo=new V(0,g.boundingBox.min.y,0).applyMatrix4(M),hi=new V(0,g.boundingBox.max.y,0).applyMatrix4(M),tilt=Math.acos(Math.min(1,hi.clone().sub(lo).normalize().y))*57.3,dy=lo.y-st.o.position.y;
      r.push(mode+':'+dy.toFixed(3)+'/'+tilt.toFixed(0));if(Math.abs(dy)>.03||tilt>10)bad.push(mode+':'+st.b+st.ok);});}
  return{ok:!bad.length,bad,r};});

await check('hatColours',()=>{const T=__t;return{ok:!T.HATS.includes(0xb03a6a),hats:T.HATS.map(h=>h.toString(16))};});

if(base){const bo=await open(base,'_fixgear_base.html');
  const meas=pg=>pg.evaluate(()=>{const T=__t,R=T.renderer;R.info.autoReset=true;clear();
    ['hat','cap','pack','bag','scarf','stick'].forEach((o,i)=>mk(i,i%2?'f':'m',i%2?'tee':'casual',{age:o==='stick'?'old':'adult',[o]:true},'walk'));tick();
    T.camera.position.set(T.player.x+4,Y+1.5,T.player.z+6);T.camera.lookAt(T.player.x+4,Y+1,T.player.z);T.camera.updateMatrixWorld();
    R.render(T.scene,T.camera);const withP=R.info.render.calls;clear();tick();R.render(T.scene,T.camera);return{withP,without:R.info.render.calls};});
  const a=await meas(p),c=await meas(bo.p);await bo.b.close();
  console.log('drawCalls',JSON.stringify({page:a,base:c}));
  if(a.withP-a.without>c.withP-c.without)fails.push('drawCalls');}
console.log('errors',JSON.stringify(errs.slice(0,6)));if(errs.length)fails.push('consoleErrors');
console.log(fails.length?'FAIL '+fails.join(' '):'PASS');await b.close();process.exit(fails.length?1:0);
