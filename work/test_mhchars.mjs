// MakeHuman townsfolk: one identity per pedestrian at every distance. node test_mhchars.mjs page.html [shotsDir] [first,last]
// (the optional range limits the switch pictures to some bodies while working on them; the full run takes about five minutes)
// The page's own loop is stopped once the models are in, so the test owns time and the camera. Each body is stood 62 m and
// then 58 m from the camera (the switch is at 60 m) and photographed through a 3.2 degree lens.
import {createRequire} from 'module';
import fs from 'fs';
const require = createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium} = require('playwright');
const [file, out = 'shots_mhchars', range] = process.argv.slice(2);
const dir = new URL('.', import.meta.url).pathname, shots = out.startsWith('/') ? out : dir + out;
fs.mkdirSync(shots, {recursive: true});
const h = fs.readFileSync(file, 'utf8'), o = 'function drawMini(){';
if (h.split(o).length !== 2) throw new Error('hook');
const api = `window.__t={get world(){return world},get player(){return player},get peds(){return peds},get CHAR(){return CHAR},get MH(){return typeof MH==='undefined'?null:MH},get phoneMesh(){return typeof MH_PHONE==='undefined'?null:MH_PHONE},get pedPhone(){return pedPhone},
set tod(v){tod=v},set cold(v){pedCold=v},set spawn(v){densT=v?0:1e9;if(!v)pedDens=0;},get GY(){return GY},press,enterExit,updatePeople,resetToRoad,renderer,scene,camera,pedMesh,PARTS,PED_N,PLAYER_I,FARE_I,PLAYER_LOOK,THREE,
look(i,age){return randomLook(i,age)},
steps(n,dt=.033){for(let i=0;i<n;i++)updatePeople(dt);},
hideAll(keep){for(const q of peds)if(!keep.includes(q)){q.mode='hide';q.lead=null;}},
// a child is hidden the moment it has no adult in charge: every subject gets one that goes where it goes
put(q,d,side=0){Object.assign(q,{mode:'idle',timer:999,lead:null,pair:null,grp:null,seat:null,react:0,nerv:0,hp:null,ko:0,fall:0,hop:0,gait:0,dest:null,seen:1e9,pr:.9,
  guard:{mode:'idle',look:{age:'adult'},get x(){return q.x},get z(){return q.z}}});
  const f=player.h,rx=Math.cos(f),rz=-Math.sin(f);q.x=player.x+Math.sin(f)*d+rx*side;q.z=player.z+Math.cos(f)*d+rz*side;q.h=f+Math.PI;return q;},
FOV:3.2,
// the camera d metres in front of q, level with its waist
see(q,d,fov=this.FOV,up=.95){const y=GY(q.x,q.z)+world.surf(q.x,q.z);camera.fov=fov;camera.updateProjectionMatrix();
  camera.position.set(q.x+Math.sin(q.h)*d,y+up,q.z+Math.cos(q.h)*d);camera.lookAt(q.x,y+up,q.z);camera.updateMatrixWorld();},
grab(){renderer.render(scene,camera);const c=document.createElement('canvas'),e=renderer.domElement;c.width=e.width;c.height=e.height;
  const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(e,0,0);return c;},
// q alone at d metres: its picture, which body and instanced gear it shows, and from the difference with the empty street its height and the mean colour of belly and thighs
snap(q,d){const T=this;T.hideAll([q]);T.see(q,d);T.steps(3);T.see(q,d);const A=T.grab(),i=peds.indexOf(q),e=T.MH&&T.MH.on[i],near=!!e,body=e?e.v.k:null,gear=[];let bad=0;
  PARTS.forEach((part,j)=>{if(part.opt&&T.scaleOf(j,i)>1e-6)gear.push(part.opt);});if(e)e.o.traverse(o=>{if(o.isBone&&o.matrixWorld.elements.some(v=>!isFinite(v)))bad++;});
  const x=q.x,z=q.z;q.x+=Math.cos(q.h)*80;q.z-=Math.sin(q.h)*80;T.steps(2);const B=T.grab();q.x=x;q.z=z;T.steps(1);
  const w=A.width,hh=A.height,a=A.getContext('2d').getImageData(0,0,w,hh).data,b=B.getContext('2d').getImageData(0,0,w,hh).data,M=new Uint8Array(w*hh);
  let y0=hh,y1=0,n=0;
  for(let p=0;p<w*hh;p++){const k=p*4;if(Math.abs(a[k]-b[k])+Math.abs(a[k+1]-b[k+1])+Math.abs(a[k+2]-b[k+2])>36){M[p]=1;n++;const y=p/w|0;if(y<y0)y0=y;if(y>y1)y1=y;}}
  const H=y1-y0,med=v=>{v.sort((p,q)=>p-q);return v[v.length>>1]||0;},avg=v=>Math.round(v.reduce((s,x)=>s+x,0)/(v.length||1));
  const band=(f0,f1,half)=>{const xs=[];for(let y=y0+f0*H|0;y<y0+f1*H;y++)for(let x=0;x<w;x++)if(M[y*w+x])xs.push(x);const cx=med(xs),R=[],G=[],Bl=[];
    for(let y=y0+f0*H|0;y<y0+f1*H;y++)for(let x=0;x<w;x++)if(M[y*w+x]&&Math.abs(x-cx)<=half*H){const k=(y*w+x)*4;R.push(a[k]);G.push(a[k+1]);Bl.push(a[k+2]);}
    return[avg(R),avg(G),avg(Bl)];};
  return{pic:A,near,body,gear,bad,n,h:+(H/(hh/(2*d*Math.tan(camera.fov*Math.PI/360)))).toFixed(3),top:band(.32,.44,.07),legs:band(.56,.68,1)};},
// give ped i the body k (as a respawn would, by rolling looks until the round robin deals it)
wear(i,k){const m=MH.meta[k];for(let n=0;n<400;n++){const l=randomLook(i,m.age==='kid'?'kid':undefined);if(l.mh===k){peds[i].look=l;return true;}}return false;},
// 0 when hidden: scaled to nothing, or parked 10 km under the street as chars.js does
scaleOf(k,i){const m=new THREE.Matrix4();pedMesh[k].getMatrixAt(i,m);return m.elements[13]<-1000?0:Math.hypot(m.elements[0],m.elements[1],m.elements[2]);}};`;
const page = dir + '_mhchars.html';
fs.writeFileSync(page, h.replace(o, api + o));
const b = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files']});
const p = await b.newPage({viewport: {width: 560, height: 800}});
const errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning' && /MakeHuman|characters/.test(m.text())) && !/fonts|ERR_/.test(m.text())) errs.push(m.text().slice(0, 300)); });
await p.goto('file://' + page);
await p.waitForFunction(() => window.__t && __t.world && __t.world.cars.length, null, {timeout: 180000});
const fails = [];
const check = async (name, fn, arg) => { let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = {ok: false, err: e.message.split('\n')[0]}; } console.log(name, JSON.stringify(r)); if (!r || !r.ok) fails.push(name); return r; };
const save = (name, url) => fs.writeFileSync(`${shots}/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));

await check('setup', () => { const T = __t, L = T.world.labels.find(q => /maxima/i.test(q.text)), c = T.player.car; c.x = L.x + 40; c.z = L.z + 40; c.speed = 0; T.resetToRoad(); T.player.car.speed = 0; T.tod = 13; T.enterExit(); return {ok: T.player.mode === 'foot'}; });
await p.waitForFunction(() => __t.CHAR.ready, null, {timeout: 90000}).catch(() => {});
await p.waitForFunction(() => { __t.steps(1); return __t.MH && __t.MH.ready; }, null, {timeout: 120000, polling: 500}).catch(() => {});
await p.evaluate(() => { window.requestAnimationFrame = () => 0; __t.spawn = false; for (const m of __t.pedMesh) m.castShadow = false; if (__t.MH) for (const v of __t.MH.vars) v.scene.traverse(o => { o.castShadow = false; }); });
await p.waitForTimeout(300);
const NEW = await p.evaluate(() => !!(__t.MH && __t.MH.all));   // false on a page from before this step: only the pictures are taken

// what the game measured on each body, and how far the JSON palette (when a model has one) is from it
await check('bodies', () => {
  const T = __t, hex = c => c ? c.map(x => Math.round(Math.min(1, x) * 255).toString(16).padStart(2, '0')).join('') : null, rows = [], bad = [];
  for (const k of T.MH.all) { const v = T.MH.vars[k], F = v.F, P = F && F.pal, pre = T.MH.pre[k].pal;
    if (!P || !F.hm) { bad.push(k); continue; }
    const tint = []; v.scene.traverse(o => { if (o.isMesh && o.userData.mhT) tint.push(o.userData.mhT + ':' + o.material.name); });
    const eyes = []; v.scene.traverse(o => { if (o.isMesh && !String(o.material.customProgramCacheKey()).startsWith('mh')) eyes.push(o.material.name); });
    // an empty tint list in the JSON means none of the clothes may change colour
    if (eyes.length !== 1 || !tint.some(t => t[0] !== 'h') && !(v.meta.tint && !v.meta.tint.length)) bad.push(k);
    rows.push(`${k} ${v.meta.desc}: h=${F.hm.toFixed(2)} skirt=${+F.skirt} long=${+F.long} hat=${+F.hat} top=${hex(P.top.c)} fore=${P.fore === P.skin ? 'skin' : hex(P.fore.c)} legs=${hex(P.thigh.c)} shin=${P.shin === P.skin ? 'skin' : hex(P.shin.c)} hair=${P.hair === P.skin ? 'none' : hex(P.hair.c)} tint=[${tint}] plain=[${eyes}]`
      + (pre ? ` jsonTopOff=${Math.round(255 * Math.hypot(...pre.top.c.map((x, j) => x - Math.min(1, P.top.c[j]))))} jsonLegsOff=${Math.round(255 * Math.hypot(...pre.hips.c.map((x, j) => x - Math.min(1, P.thigh.c[j]))))}` : '')); }
  return {ok: !bad.length && rows.length === T.MH.all.length, bad, rows};
}).then(r => r && r.rows && r.rows.forEach(l => console.log('  ' + l)));

// every body in turn: far, near, far again
const N = NEW ? await p.evaluate(() => __t.MH.all.length) : 12, res = [];
const [n0, n1] = range ? range.split(',').map(Number) : [0, N - 1];
for (let n = n0; n <= n1; n++) {
  const r = await p.evaluate(n => {
    const T = __t, k = T.MH.all ? T.MH.all[n] : -1, q = T.peds[n];
    if (k >= 0 && !T.wear(n, k)) return {err: 'body ' + k + ' never dealt'};
    T.hideAll([]); T.steps(2); T.put(q, 80);
    const look = q.look, far = T.snap(q, 62), near = T.snap(q, 58), back = T.snap(q, 76);
    const c = document.createElement('canvas'), W = 250, Hh = 560, x = c.getContext('2d'); c.width = W * 2 + 6; c.height = Hh; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, Hh);
    x.drawImage(far.pic, far.pic.width / 2 - W / 2, 140, W, Hh, 0, 0, W, Hh); x.drawImage(near.pic, near.pic.width / 2 - W / 2, 140, W, Hh, W + 6, 0, W, Hh);
    return {k, desc: k >= 0 ? T.MH.meta[k].desc : '', sameLook: q.look === look, mh: look.mh, farNear: [far.near, near.near, back.near], nearBody: near.body,
      top: [far.top, near.top], legs: [far.legs, near.legs], h: [far.h, near.h], s: look.s, gearFar: far.gear, gearNear: near.gear, badBones: near.bad,
      flags: T.MH.vars[k] && T.MH.vars[k].F ? {hat: T.MH.vars[k].F.hat, long: T.MH.vars[k].F.long, skirt: T.MH.vars[k].F.skirt} : null, url: c.toDataURL('image/png')};
  }, n);
  if (r.url) { save('switch_' + String(n).padStart(2, '0'), r.url); delete r.url; }
  res.push(r); console.log('  body', JSON.stringify(r));
}
// colours: per channel, 16 levels plus a fifth of the brighter value (the two bodies catch the sky differently); height: 6 %
const HTOL = .06, off = x => Math.max(...x[0].map((c, j) => Math.abs(c - x[1][j]) - .2 * Math.max(c, x[1][j])));
if (NEW) {
  await check('sameBodyAcrossSwitch', r => ({ok: r.every(x => !x.err && x.sameLook && x.farNear.join() === 'false,true,false' && x.nearBody === x.mh && x.mh === x.k), wrong: r.filter(x => x.err || x.nearBody !== x.mh || x.farNear.join() !== 'false,true,false').map(x => x.k)}), res);
  { const v = res.map(x => Math.round(off(x.top))), w = res.map(x => Math.round(off(x.legs)));
    await check('topColourMatches', v => ({ok: v.every(x => x <= 16), overAllowance: v}), v);
    await check('legColourMatches', v => ({ok: v.every(x => x <= 16), overAllowance: v}), w); }
  await check('heightMatches', ([r, T]) => { const v = r.map(x => +(x.h[1] / x.h[0] - 1).toFixed(3)); return {ok: v.every(x => Math.abs(x) <= T), tol: T, nearOverFar: v}; }, [res, HTOL]);
  await check('noStrayGear', r => { const bad = r.filter(x => x.gearNear.length || x.gearFar.some(g => !x.flags[g]) || Object.keys(x.flags).some(g => x.flags[g] && !x.gearFar.includes(g))); return {ok: !bad.length, bad: bad.map(x => [x.k, x.gearFar, x.gearNear]), farGear: r.map(x => x.gearFar.join('+') || '-')}; }, res);
  await check('noNaN', r => ({ok: r.every(x => x.badBones === 0)}), res);
  // a cold day used to hand out hats, coats, scarves, packs, bags and sticks; none may survive on a look, and every body gets dealt
  await check('respawns', () => { const T = __t, seen = {}, stray = {}, twin = []; T.cold = 1; T.hideAll([]);
    for (let n = 0; n < 400; n++) { const i = n % T.PED_N, l = T.peds[i].look = T.look(i, n % 6 === 5 ? 'kid' : undefined), m = T.MH.meta[l.mh];
      seen[l.mh] = (seen[l.mh] || 0) + 1; for (const g of ['cap', 'pack', 'bag', 'coat', 'scarf', 'tail', 'stick']) if (l[g]) stray[g] = 1;
      if (m.sex !== (l.male === false ? 'f' : 'm') || (m.age === 'kid') !== (l.age === 'kid') || (m.age === 'old') !== (l.age === 'old')) twin.push(l.mh); }
    T.cold = 0; const never = T.MH.all.filter(k => !seen[k]);
    return {ok: !never.length && !Object.keys(stray).length && !twin.length, never, stray: Object.keys(stray), wrongSexOrAge: twin.length, counts: seen}; });
  // two people in the same body are not the same colours
  await check('tintVaries', () => { const T = __t, k = T.MH.all[0], tops = new Set(), legs = new Set(), hairs = new Set(); let skin = new Set();
    for (let n = 0; n < 12; n++) { T.wear(0, k); const m = new T.THREE.Matrix4(), c = new T.THREE.Color(), g = j => { T.pedMesh[j].getColorAt(0, c); return c.getHexString(); };
      tops.add(g(1)); legs.add(g(0)); hairs.add(g(4)); skin.add(g(3)); }
    return {ok: tops.size > 6 && hairs.size > 6 && skin.size === 1, tops: tops.size, legs: legs.size, hairs: hairs.size, skins: skin.size}; });
  // a near person with a phone holds it in the drawn hand, at a phone's size, with the head bowed; the UAL rig's phone is gone.
  // A far one keeps the instanced phone at its own hand.
  await check('phoneInHand', () => { const T = __t, V = T.THREE.Vector3, M = new T.THREE.Matrix4(), rows = [], q = T.peds[0];
    for (const k of [4, 13, 23, 27, 35]) for (const walk of [false, true]) {
      T.wear(0, k); T.hideAll([]); T.steps(2); T.put(q, 6); q.pr = .1; T.hideAll([q]); T.steps(20);
      if (walk) for (let n = 0; n < 15; n++) { q.x += Math.sin(q.h) * .04; q.z += Math.cos(q.h) * .04; q.phase += .25; q.mode = 'walk'; q.gait = 1; T.steps(1); }
      const e = T.MH.on[0], B = e && e.bone; if (!B) { rows.push({k, walk, near: false}); continue; }
      T.phoneMesh.getMatrixAt(0, M); const at = new V().setFromMatrixPosition(M), size = [0, 1, 2].map(j => new V().setFromMatrixColumn(M, j).length());
      const P = n => new V().setFromMatrixPosition(B[n].matrixWorld), palm = P('hand_r').lerp(P('middle_01_r'), .6), g = T.phoneMesh.geometry.parameters || {};
      const nose = new V(0, 0, 1).applyQuaternion(B.head.getWorldQuaternion(new T.THREE.Quaternion())), rig = new T.THREE.Matrix4(); T.pedPhone.getMatrixAt(0, rig);
      rows.push({k, walk, near: true, cm: +(at.distanceTo(palm) * 100).toFixed(1), size: size.map(x => +x.toFixed(2)), geo: [g.width, g.height, g.depth],
        handBelowChin: +(P('neck_01').y - P('hand_r').y).toFixed(2), rigPhone: Math.abs(rig.elements[0]) + Math.abs(rig.elements[5]) > 1e-6 && rig.elements[13] > -1000}); }
    T.wear(0, 23); T.hideAll([]); T.steps(2); T.put(q, 75); q.pr = .1; T.hideAll([q]); T.steps(10); T.see(q, 72, 2, 1.2); T.steps(2);
    const fp = new T.THREE.Matrix4(), mp = new T.THREE.Matrix4(); T.pedPhone.getMatrixAt(0, fp); T.phoneMesh.getMatrixAt(0, mp);
    const far = {near: !!T.MH.on[0], instanced: Math.abs(fp.elements[0]) > 1e-6, mh: Math.abs(mp.elements[0]) > 1e-6};
    const ok = rows.every(r => r.near && r.cm < 6 && r.size.every(x => Math.abs(x - 1) < .01) && !r.rigPhone && r.handBelowChin > .1 && r.handBelowChin < .6) && !far.near && far.instanced && !far.mh;
    return {ok, rows, far}; });
  await check('playerUntouched', () => { const T = __t, P = T.player, q = {x: P.x, z: P.z, h: P.h}; T.hideAll([]); T.see(q, 6, 40, 1.4); T.steps(3);
    const e = T.MH.on[T.PLAYER_I], c = new T.THREE.Color(), want = new T.THREE.Color(0x16171b); T.pedMesh[1].getColorAt(T.PLAYER_I, c); let tinted = 0, stripes = 0;
    if (e) e.o.traverse(o => { if (o.isMesh) { if (o.userData.mhT || /mhtint/.test(String(o.material.customProgramCacheKey()))) tinted++; if (o.material.userData.stripes) stripes++; } });
    return {ok: !!e && e.v === T.MH.player && e.k === 1 && !e.mats.length && !tinted && stripes === 2 && T.PLAYER_LOOK.mh === undefined && T.PLAYER_LOOK.s === 1 && c.getHex() === 0x16171b,
      attached: !!e, scale: e && e.k, tinted, stripes, look: {mh: T.PLAYER_LOOK.mh, s: T.PLAYER_LOOK.s}, farColour: c.getHexString()}; });
  await check('fareUntouched', () => { const T = __t; T.cold = 1; let gear = 0; for (let n = 0; n < 40; n++) { const l = T.look(T.FARE_I); if (l.mh !== undefined) return {ok: false}; if (l.hat || l.coat || l.scarf || l.bag) gear++; } T.cold = 0;
    return {ok: gear > 0 && !T.MH.on[T.FARE_I], looksWithOldGear: gear}; });
}
// pictures: a face close up (eyes), and a crowd as the player meets it
const pic = async (name, fn) => save(name, await p.evaluate(fn));
await pic('face', () => { const T = __t, q = T.peds[3], up = 1.63 * q.look.s; T.hideAll([q]); T.put(q, 30); T.see(q, 1.1, 14, up); T.steps(3); T.see(q, 1.1, 14, up); return T.grab().toDataURL('image/png'); });
await pic('crowd', () => { const T = __t, P = T.peds.slice(0, 24); T.hideAll(P); P.forEach((q, k) => T.put(q, 6 + (k / 6 | 0) * 9, (k % 6 - 2.5) * 1.3)); const f = T.player.h, m = {x: T.player.x + Math.sin(f) * 10, z: T.player.z + Math.cos(f) * 10, h: f + Math.PI};
  T.see(m, 11.5, 50, 1.7); T.steps(3); T.see(m, 11.5, 50, 1.7); return T.grab().toDataURL('image/png'); });
// the street as the player sees it: people from 45 to 75 m, so some stand inside the 60 m switch and some beyond it
await pic('street', () => { const T = __t, P = T.peds.slice(0, 24); T.hideAll(P); P.forEach((q, k) => T.put(q, 45 + (k / 6 | 0) * 8 + (k % 2) * 2, (k % 6 - 2.5) * 2.2)); const f = T.player.h, m = {x: T.player.x - Math.sin(f) * 2, z: T.player.z - Math.cos(f) * 2, h: f + Math.PI};
  T.see(m, .01, 18, 2.6); T.camera.lookAt(T.player.x + Math.sin(f) * 60, T.camera.position.y - 1.6, T.player.z + Math.cos(f) * 60); T.steps(3); T.camera.lookAt(T.player.x + Math.sin(f) * 60, T.camera.position.y - 1.6, T.player.z + Math.cos(f) * 60);
  T.camera.updateMatrixWorld(); return T.grab().toDataURL('image/png'); });
await check('frameTime', () => { const T = __t; const s = performance.now(); T.steps(20); const all = (performance.now() - s) / 20; let m = 0; for (let k = 0; k < 20; k++) { T.updatePeople(.033); m += T.MH.ms; }
  return {ok: all < 25, updatePeopleMs: +all.toFixed(2), mhMs: +(m / 20).toFixed(2), mh: T.MH.n}; });
console.log('errors', JSON.stringify(errs.slice(0, 8))); if (errs.length) fails.push('consoleErrors');
console.log(fails.length ? 'FAIL ' + fails.join(' ') : 'PASS');
await b.close();
