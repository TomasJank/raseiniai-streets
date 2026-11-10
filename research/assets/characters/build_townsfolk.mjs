// Builds clothes_body_m.glb / clothes_body_f.glb: Quaternius Ultimate Modular Men / Women outfits re-rigged onto the UAL (UE-named) skeleton, so the game's 24 clips and the kick play on them unchanged.
// All modular characters of one gender share one T-pose skeleton, the same T-pose as the UAL mannequin, so the re-rig is: map bones by name (fingers fold into the hand), keep the UAL rest
// rotations, take joint positions from the character, scale so the hip joint sits where the UAL's does. Normals are rebuilt smooth (crease 55 deg), every vertex gets a colour region + shade
// (skin, shirt, legs, shoe, hair, fixed; region/8 in TEXCOORD_0.x) so the game recolours outfits from `look`.
// usage: node build_townsfolk.mjs <node_modules> <dir with the Quaternius .glb files> <body_m.glb (UAL mannequin, skeleton source)> <out dir>
import {createRequire} from 'module';
import {readFileSync, readdirSync} from 'fs';
import {pathToFileURL} from 'url';
const [nm, dir, ueFile, out] = process.argv.slice(2);
const req = createRequire(nm + '/');
const THREE = await import(pathToFileURL(nm + '/three/build/three.module.js').href);
const {GLTFLoader} = await import(pathToFileURL(nm + '/three/examples/jsm/loaders/GLTFLoader.js').href);
const {MeshoptDecoder: MD} = await import(pathToFileURL(nm + '/three/examples/jsm/libs/meshopt_decoder.module.js').href);
const {NodeIO} = req('@gltf-transform/core');
const {ALL_EXTENSIONS} = req('@gltf-transform/extensions');
const {meshopt, prune, quantize} = req('@gltf-transform/functions');
const {MeshoptEncoder, MeshoptDecoder} = req('meshoptimizer');
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MD.ready;
const L = new GLTFLoader().setMeshoptDecoder(MD);
const parse = f => { const b = readFileSync(f); return new Promise((r, j) => L.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length), '', r, j)); };

// outfit file prefix -> short name; chosen for plain, everyday looks (no armour, sci-fi, fantasy)
const OUTFITS = {
  m: {Men_Casual: 'casual', Men_Hoodie: 'hoodie', Men_Businessman: 'suit', Men_Farmer: 'farmer', Men_Beach: 'beach', Men_Worker: 'worker'},
  f: {Women_Animated_Woman_nIItLV9nxS: 'dress', Women_Animated_Woman_qJ2gsTUBHL: 'tee', Women_Suit: 'suit', Women_Worker: 'worker', Women_Adventurer: 'trek'},
};
const UE_KEEP = /^(root|pelvis|spine_0[123]|neck_01|Head|clavicle_[lr]|upperarm_[lr]|lowerarm_[lr]|hand_[lr]|thigh_[lr]|calf_[lr]|foot_[lr]|ball_[lr])$/;
const SIDE = {L: 'l', R: 'r'};
const mapBone = n => {
  const base = {Hips: 'pelvis', Body: 'pelvis', Root: 'pelvis', Abdomen: 'spine_01', Torso: 'spine_02', Chest: 'spine_03', Neck: 'neck_01', Head: 'Head'}[n];
  if (base) return base;
  let m;
  if ((m = n.match(/^(Shoulder|UpperArm|LowerArm|Wrist|UpperLeg|LowerLeg|Foot)([LR])$/))) return {Shoulder: 'clavicle', UpperArm: 'upperarm', LowerArm: 'lowerarm', Wrist: 'hand', UpperLeg: 'thigh', LowerLeg: 'calf', Foot: 'foot'}[m[1]] + '_' + SIDE[m[2]];
  if ((m = n.match(/^(Index|Middle|Ring|Pinky|Thumb)\d([LR])$/))) return 'hand_' + SIDE[m[2]];
  return null;
};
const cls = b => /^spine|^neck|^clav|^upperarm|^lowerarm/.test(b) ? 'up' : /^pelvis|^thigh|^calf/.test(b) ? 'lo' : /^foot|^ball/.test(b) ? 'foot' : /^hand/.test(b) ? 'hand' : 'head';
const lum = c => .2126 * c.r + .7152 * c.g + .0722 * c.b;
const CREASE = Math.cos(55 * Math.PI / 180);

const files = readdirSync(dir).filter(f => f.endsWith('.glb')).sort();
const ue = await parse(ueFile);
ue.scene.updateMatrixWorld(true);
const ueBones = {}; ue.scene.traverse(o => { if (o.isBone) ueBones[o.name] = o; });
const UE_THIGH_Y = new THREE.Vector3().setFromMatrixPosition(ueBones.thigh_l.matrixWorld).y;
const UE_PELVIS_Y = new THREE.Vector3().setFromMatrixPosition(ueBones.pelvis.matrixWorld).y;

async function build(g) {
  const pick = files.filter(f => Object.keys(OUTFITS[g]).some(p => f.startsWith(p)));
  const loaded = [];
  for (const f of pick) {
    const key = Object.keys(OUTFITS[g]).find(p => f.startsWith(p));
    const c = await parse(dir + '/' + f); const sks = [];
    c.scene.traverse(o => { if (o.isSkinnedMesh) sks.push(o); });
    sks[0].skeleton.pose(); c.scene.updateMatrixWorld(true);
    loaded.push({name: OUTFITS[g][key], c, sks});
  }
  // joint positions from the first character (identical across the gender: checked in SOURCE.md)
  const first = loaded[0], cb = {}; first.sks[0].skeleton.bones.forEach(b => cb[b.name] = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld));
  const s = UE_THIGH_Y / cb.UpperLegL.y;
  // ankle: where the shin ends; toe: furthest point of the foot
  let ankleY = 1e9, toeZ = -1e9; const v = new THREE.Vector3();
  for (const o of loaded) for (const m of o.sks) {
    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, bn = m.skeleton.bones;
    for (let i = 0; i < si.count; i++) { let b = 0, w = -1; for (let j = 0; j < 4; j++) if (sw.getComponent(i, j) > w) { w = sw.getComponent(i, j); b = si.getComponent(i, j); }
      const u = mapBone(bn[b].name); if (!u) continue; m.getVertexPosition(i, v).applyMatrix4(m.matrixWorld);
      if (u === 'calf_l' && v.x > 0) ankleY = Math.min(ankleY, v.y);
      if (u === 'foot_l' && v.x > 0) toeZ = Math.max(toeZ, v.z); }
  }
  ankleY = new THREE.Vector3().setFromMatrixPosition(ueBones.foot_l.matrixWorld).y / s;
  const J = {root: new THREE.Vector3(0, 0, 0), pelvis: new THREE.Vector3(0, cb.UpperLegL.y - (UE_THIGH_Y - UE_PELVIS_Y) / s, cb.Hips.z),
    spine_01: cb.Abdomen, spine_02: cb.Torso, spine_03: cb.Chest, neck_01: cb.Neck, Head: cb.Head};
  for (const [S, k] of [['L', 'l'], ['R', 'r']]) {
    const ux = cb['UpperLeg' + S].x, lz = cb['LowerLeg' + S].z, az = lz;
    Object.assign(J, {['clavicle_' + k]: cb['Shoulder' + S], ['upperarm_' + k]: cb['UpperArm' + S], ['lowerarm_' + k]: cb['LowerArm' + S], ['hand_' + k]: cb['Wrist' + S],
      ['thigh_' + k]: cb['UpperLeg' + S], ['calf_' + k]: cb['LowerLeg' + S],
      ['foot_' + k]: new THREE.Vector3(ux, ankleY, az), ['ball_' + k]: new THREE.Vector3(ux, .02 / s, az + .6 * (toeZ - az))});
  }
  for (const k in J) J[k] = J[k].clone().multiplyScalar(s);

  // skeleton: UAL rest rotations, character joint positions
  const bones = Object.keys(ueBones).filter(n => UE_KEEP.test(n));
  const bone = {}; const clone = ue.scene.clone(true); clone.traverse(o => { if (o.isBone) bone[o.name] = o; });
  clone.updateMatrixWorld(true);
  const world = new Map();
  (function place(b) {
    if (!UE_KEEP.test(b.name)) return;
    const p = b.parent; b.parent.updateMatrixWorld(true);
    const pw = p.isBone ? J[p.name] : new THREE.Vector3(), inv = new THREE.Matrix4().copy(p.matrixWorld).invert();
    b.position.copy(J[b.name].clone().applyMatrix4(inv)); b.updateMatrixWorld(true);
    b.children.forEach(place);
  })(bone.root);
  const joints = bones.map(n => bone[n]);
  const ibm = joints.map(b => new THREE.Matrix4().copy(b.matrixWorld).invert());
  const idx = Object.fromEntries(bones.map((n, i) => [n, i]));

  // meshes
  const meshes = [];
  for (const o of loaded) {
    const P = [], N = [], JI = [], W = [], C = [], R = [], tris = [];
    const info = []; // per source vertex: material, region class
    const mats = [];
    for (const m of o.sks) {
      const gm = m.geometry, base = P.length / 3, si = gm.attributes.skinIndex, sw = gm.attributes.skinWeight, bn = m.skeleton.bones, mat = m.material, name = mat.name;
      for (let i = 0; i < gm.attributes.position.count; i++) {
        m.getVertexPosition(i, v).applyMatrix4(m.matrixWorld); P.push(v.x * s, v.y * s, v.z * s);
        const acc = {}; let top = null, tw = -1;
        for (let j = 0; j < 4; j++) { const w = sw.getComponent(i, j); if (w <= 0) continue; const u = mapBone(bn[si.getComponent(i, j)].name); if (!u) continue; acc[u] = (acc[u] || 0) + w; if (acc[u] > tw) { tw = acc[u]; top = u; } }
        let ent = Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 4); const sum = ent.reduce((a, e) => a + e[1], 0) || 1; if (!ent.length) ent = [['pelvis', 1]];
        for (let j = 0; j < 4; j++) { JI.push(ent[j] ? idx[ent[j][0]] : 0); W.push(ent[j] ? ent[j][1] / sum : 0); }
        info.push({name, col: mat.color, cls: cls(top || 'pelvis')});
      }
      const ix = gm.index; if (!ix) throw new Error('unindexed ' + m.name);
      for (let i = 0; i < ix.count; i++) tris.push(ix.getX(i) + base);
      mats.push(name);
    }
    // regions: 0 skin 1 shirt 3 legs 5 shoe 6 hair 7 fixed colour
    const reg = info.map(q => {
      if (/^Skin/.test(q.name)) return 0; if (/^Eyebrow|^Hair|^Beard|^Moustache|^Mustache/.test(q.name)) return 6; if (/^Eye/.test(q.name)) return 7;
      return {up: 1, lo: 3, foot: 5, hand: 7, head: 7}[q.cls];
    });
    // reference colour per region: the most common material colour; a material far from it keeps its own colour (white shirt under a dark jacket, a belt)
    const ref = {};
    for (const r of [0, 1, 3, 5, 6]) { const cnt = new Map(); info.forEach((q, i) => { if (reg[i] === r) cnt.set(q.name, (cnt.get(q.name) || 0) + 1); });
      const best = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0]; if (best) ref[r] = lum(info.find(q => q.name === best[0]).col); }
    info.forEach((q, i) => {
      const r = reg[i]; let f = 0;
      if (r !== 7 && ref[r]) { const k = lum(q.col) / ref[r]; if (r === 0 || r === 6 || (k > .45 && k < 2.2)) f = Math.min(1.6, Math.max(.3, k)); else reg[i] = 7; }
      if (reg[i] === 7) C.push(q.col.r, q.col.g, q.col.b); else C.push(f || 1, f || 1, f || 1);
      R.push(reg[i]);
    });
    // smooth normals with a crease angle; corners are welded by (position, normal, skin)
    const nT = tris.length / 3, fn = [], A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3();
    const key = i => P[i * 3].toFixed(4) + ',' + P[i * 3 + 1].toFixed(4) + ',' + P[i * 3 + 2].toFixed(4);
    const at = new Map();
    for (let t = 0; t < nT; t++) {
      const a = tris[t * 3], b = tris[t * 3 + 1], c = tris[t * 3 + 2];
      A.set(P[a * 3], P[a * 3 + 1], P[a * 3 + 2]); B.set(P[b * 3], P[b * 3 + 1], P[b * 3 + 2]); Cc.set(P[c * 3], P[c * 3 + 1], P[c * 3 + 2]);
      const n = B.clone().sub(A).cross(Cc.clone().sub(A)); fn.push(n);
      for (const q of [a, b, c]) { const k = key(q); (at.get(k) || at.set(k, []).get(k)).push(t); }
    }
    const outP = [], outN = [], outJ = [], outW = [], outC = [], outR = [], outI = [], dedupe = new Map();
    let degenerate = 0;
    for (let t = 0; t < nT; t++) {
      if (fn[t].lengthSq() < 1e-14) { degenerate++; continue; }
      const nt = fn[t].clone().normalize();
      for (let k = 0; k < 3; k++) {
        const q = tris[t * 3 + k], sum = new THREE.Vector3();
        for (const u of at.get(key(q))) { if (fn[u].lengthSq() < 1e-14) continue; const nu = fn[u].clone().normalize(); if (nu.dot(nt) > CREASE) sum.add(fn[u]); }
        sum.normalize();
        const dk = key(q) + '|' + sum.x.toFixed(2) + ',' + sum.y.toFixed(2) + ',' + sum.z.toFixed(2) + '|' + JI.slice(q * 4, q * 4 + 4) + '|' + W.slice(q * 4, q * 4 + 4).map(x => x.toFixed(3)) + '|' + C.slice(q * 3, q * 3 + 3).map(x => x.toFixed(3)) + '|' + R[q];
        let id = dedupe.get(dk);
        if (id === undefined) { id = outP.length / 3; dedupe.set(dk, id); outP.push(P[q * 3], P[q * 3 + 1], P[q * 3 + 2]); outN.push(sum.x, sum.y, sum.z);
          outJ.push(...JI.slice(q * 4, q * 4 + 4)); outW.push(...W.slice(q * 4, q * 4 + 4)); outC.push(...C.slice(q * 3, q * 3 + 3)); outR.push(R[q]); }
        outI.push(id);
      }
    }
    meshes.push({name: o.name, P: outP, N: outN, J: outJ, W: outW, C: outC, R: outR, I: outI, tris: outI.length / 3, degenerate});
  }

  // write: the UAL skeleton nodes with new translations, no meshes of its own
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});
  const doc = await io.read(ueFile), root = doc.getRoot(), buf = root.listBuffers()[0];
  for (const m of root.listMeshes()) m.dispose();
  for (const sk of root.listSkins()) sk.dispose();
  for (const m of root.listMaterials()) m.dispose();
  const byName = new Map(root.listNodes().map(n => [n.getName(), n]));
  for (const n of root.listNodes()) if (n.getName() in ueBones && !UE_KEEP.test(n.getName())) n.dispose();
  for (const n of bones) byName.get(n).setTranslation(bone[n].position.toArray());
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  const skin = doc.createSkin('skin').setInverseBindMatrices(acc('MAT4', new Float32Array(ibm.flatMap(m => m.toArray()))));
  for (const n of bones) skin.addJoint(byName.get(n));
  const mat = doc.createMaterial('clothes').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(1).setMetallicFactor(0);
  const scene = root.getDefaultScene() || root.listScenes()[0];
  const arm = root.listNodes().find(n => n.getName() === 'Armature');
  for (const m of meshes) {
    const p = doc.createPrimitive().setMaterial(mat)
      .setAttribute('POSITION', acc('VEC3', new Float32Array(m.P))).setAttribute('NORMAL', acc('VEC3', new Float32Array(m.N)))
      .setAttribute('COLOR_0', acc('VEC3', new Float32Array(m.C))).setAttribute('TEXCOORD_0', acc('VEC2', new Float32Array(m.R.flatMap(r => [r / 8, 0]))))
      .setAttribute('JOINTS_0', acc('VEC4', new Uint8Array(m.J))).setAttribute('WEIGHTS_0', acc('VEC4', new Float32Array(m.W)))
      .setIndices(acc('SCALAR', new Uint32Array(m.I)));
    const node = doc.createNode('o_' + m.name).setMesh(doc.createMesh('o_' + m.name).addPrimitive(p)).setSkin(skin);
    scene.addChild(node);
  }
  await doc.transform(prune({keepAttributes: true}), quantize({quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12, quantizeColor: 8, quantizeWeight: 8}), meshopt({encoder: MeshoptEncoder, level: 'high'}));
  await io.write(`${out}/clothes_body_${g}.glb`, doc);
  console.log(g, JSON.stringify({s: +s.toFixed(4), ankleY: +(ankleY * s).toFixed(3), toeZ: +(toeZ * s).toFixed(3), outfits: meshes.map(m => [m.name, m.tris, m.P.length / 3, m.degenerate])}));
}
await build('m'); await build('f');
