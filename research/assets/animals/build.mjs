// Builds the game's animal GLBs (animal_*.glb) from the Quaternius Ultimate Animated Animals glTFs and the Animal Pack Vol.2 cat (see SOURCE.md).
// usage: node build.mjs <node_modules dir with @gltf-transform/* + meshoptimizer> <outdir> <name=src.gltf|glb=clip:Source,clip:Source...>...
import {createRequire} from 'module';
const [nm, out, ...jobs] = process.argv.slice(2);
const req = createRequire(nm + '/');
const {NodeIO} = req('@gltf-transform/core');
const {ALL_EXTENSIONS} = req('@gltf-transform/extensions');
const {prune, dedup, weld, quantize, resample, meshopt} = req('@gltf-transform/functions');
const {MeshoptEncoder, MeshoptDecoder} = req('meshoptimizer');
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});
const dropAnim = a => { for (const c of a.listChannels()) c.dispose(); for (const s of a.listSamplers()) s.dispose(); a.dispose(); };   // accessors may be shared with kept clips: prune removes the orphans

for (const job of jobs) {
  const [name, src, clips] = job.split('=');
  const keep = Object.fromEntries(clips.split(',').map(c => c.split(':')));   // game clip -> source clip
  const doc = await io.read(src), root = doc.getRoot();
  for (const a of root.listAnimations()) {
    const g = Object.keys(keep).find(k => keep[k] === a.getName() || a.getName().endsWith('|' + keep[k]));
    if (g) a.setName(g); else dropAnim(a);
  }
  // bone lengths and scales are fixed in these rigs: keep only rotations, plus the translation of the two top joints (hips bob)
  const skin = root.listSkins()[0], joints = new Set(skin.listJoints()), depth = n => { let d = 0; for (let p = n.getParentNode(); p && joints.has(p); p = p.getParentNode()) d++; return d; };
  for (const a of root.listAnimations()) for (const c of a.listChannels()) {
    const path = c.getTargetPath();
    if (path === 'scale' || path === 'translation' && depth(c.getTargetNode()) > 1) { const sm = c.getSampler(); c.dispose(); sm.dispose(); }
  }
  // one material, colour carried in COLOR_0: a single draw call per animal
  const mat = root.listMaterials()[0];
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
    const c = (p.getMaterial() || mat).getBaseColorFactor(), n = p.getAttribute('POSITION').getCount(), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
    p.setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(col).setBuffer(root.listBuffers()[0]));
    p.setMaterial(mat);
    for (const s of p.listSemantics()) if (/TEXCOORD/.test(s)) p.setAttribute(s, null);
  }
  // gltf-transform's join() leaves skinned primitives alone: concatenate them by hand into one
  for (const m of root.listMeshes()) {
    const ps = m.listPrimitives(), SEM = {POSITION: [3, Float32Array], NORMAL: [3, Float32Array], COLOR_0: [3, Float32Array], WEIGHTS_0: [4, Float32Array], JOINTS_0: [4, Uint16Array]};
    const n = ps.reduce((t, p) => t + p.getAttribute('POSITION').getCount(), 0), ni = ps.reduce((t, p) => t + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()), 0);
    const buf = root.listBuffers()[0], acc = {}, idx = new Uint32Array(ni), tmp = [0, 0, 0, 0];
    for (const k in SEM) acc[k] = new SEM[k][1](n * SEM[k][0]);
    let v0 = 0, i0 = 0;
    for (const p of ps) {
      const c = p.getAttribute('POSITION').getCount(), I = p.getIndices();
      for (const k in SEM) { const a = p.getAttribute(k), w = SEM[k][0]; for (let i = 0; i < c; i++) { a.getElement(i, tmp); for (let j = 0; j < w; j++) acc[k][(v0 + i) * w + j] = tmp[j]; } }
      const ic = I ? I.getCount() : c;
      for (let i = 0; i < ic; i++) idx[i0 + i] = v0 + (I ? I.getScalar(i) : i);
      v0 += c; i0 += ic;
    }
    const q = ps[0];
    for (const p of ps.slice(1)) p.dispose();
    for (const k in SEM) q.setAttribute(k, doc.createAccessor().setType(['SCALAR', 'VEC2', 'VEC3', 'VEC4'][SEM[k][0] - 1]).setArray(acc[k]).setBuffer(buf));
    q.setIndices(doc.createAccessor().setType('SCALAR').setArray(idx).setBuffer(buf));
  }
  mat.setBaseColorFactor([1, 1, 1, 1]).setMetallicFactor(0).setRoughnessFactor(1);
  await doc.transform(weld(), resample(), prune(), dedup(), quantize({quantizeNormal: 8}), meshopt({encoder: MeshoptEncoder, level: 'high'}));
  await io.write(`${out}/animal_${name}.glb`, doc);
  console.log(name, root.listAnimations().map(a => a.getName()).join(','));
}
