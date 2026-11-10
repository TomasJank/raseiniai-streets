// Builds clips_kick.glb: KayKit Melee_Unarmed_Attack_Kick retargeted onto body_m.glb's skeleton with SkeletonUtils.retargetClip.
// usage: node build_kick.mjs <node_modules dir with three, @gltf-transform/*, meshoptimizer> <Rig_Medium_CombatMelee.glb> <body_m.glb> <out dir>
import {createRequire} from 'module';
import {readFileSync} from 'fs';
import {pathToFileURL} from 'url';
const [nm, kkFile, bodyFile, out] = process.argv.slice(2);
const req = createRequire(nm + '/');
const THREE = await import(pathToFileURL(nm + '/three/build/three.module.js').href);
const {GLTFLoader} = await import(pathToFileURL(nm + '/three/examples/jsm/loaders/GLTFLoader.js').href);
const SU = await import(pathToFileURL(nm + '/three/examples/jsm/utils/SkeletonUtils.js').href);
const {MeshoptDecoder: MD} = await import(pathToFileURL(nm + '/three/examples/jsm/libs/meshopt_decoder.module.js').href);
const {NodeIO} = req('@gltf-transform/core');
const {ALL_EXTENSIONS} = req('@gltf-transform/extensions');
const {resample, prune, meshopt} = req('@gltf-transform/functions');
const {MeshoptEncoder, MeshoptDecoder} = req('meshoptimizer');
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MD.ready;

const L = new GLTFLoader().setMeshoptDecoder(MD);
const parse = f => { const b = readFileSync(f); return new Promise((r, j) => L.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length), '', r, j)); };
const [body, kk] = await Promise.all([parse(bodyFile), parse(kkFile)]);
const clip = kk.animations.find(a => a.name === 'Melee_Unarmed_Attack_Kick');
const skin = s => { let m; s.traverse(o => { if (o.isSkinnedMesh && !m) m = o; }); return m; };
const tgt = skin(body.scene), src = skin(kk.scene);

// UE-style names on the game's mannequin -> KayKit Rig_Medium (glTF-sanitised, dots stripped)
const names = {pelvis: 'hips', spine_01: 'spine', spine_03: 'chest', Head: 'head', upperarm_l: 'upperarml', lowerarm_l: 'lowerarml', hand_l: 'handl',
  upperarm_r: 'upperarmr', lowerarm_r: 'lowerarmr', hand_r: 'handr', thigh_l: 'upperlegl', calf_l: 'lowerlegl', foot_l: 'footl', ball_l: 'toesl',
  thigh_r: 'upperlegr', calf_r: 'lowerlegr', foot_r: 'footr', ball_r: 'toesr'};
body.scene.updateMatrixWorld(true); kk.scene.updateMatrixWorld(true);
const hipY = (s, n) => new THREE.Vector3().setFromMatrixPosition(s.skeleton.bones.find(b => b.name === n).matrixWorld).y;
const scale = hipY(tgt, 'pelvis') / hipY(src, 'hips');
const helper = new THREE.SkeletonHelper(kk.scene); helper.skeleton = src.skeleton;
const rest = tgt.skeleton.bones.find(b => b.name === 'pelvis').position.clone();
const footBone = tgt.skeleton.bones.find(b => b.name === 'foot_l'), restFootY = new THREE.Vector3().setFromMatrixPosition(footBone.matrixWorld).y;
const FPS = 20;
const res = SU.retargetClip(tgt, helper, clip, {names, hip: 'hips', scale, fps: FPS});

// T-pose source vs A-pose target: arms, hands and head are dropped, the game's guard pose keeps them
const KEEP = /^(pelvis|spine_0[13]|thigh_[lr]|calf_[lr]|foot_[lr]|ball_[lr])\.(quaternion|position)$/;
const tracks = res.tracks.map(t => ({n: t.name.replace(/^\.bones\[(.+)\]\./, '$1.'), t})).filter(e => KEEP.test(e.n));

// retargetClip's hip track keeps the chibi source's height and 2.26x its bounce. Keep the horizontal motion, rebase onto the rest pose, then
// set the height per frame so the planted left foot stays on its rest height (pelvis local z is up)
const hp = tracks.find(e => e.n === 'pelvis.position').t, v0 = hp.values.slice(0, 3);
for (let i = 0; i < hp.values.length; i++) hp.values[i] = rest.getComponent(i % 3) + hp.values[i] - v0[i % 3];
for (let i = 2; i < hp.values.length; i += 3) hp.values[i] = rest.z;
// retargetClip leaves the first scene posed: measure on a fresh copy
const fresh = await parse(bodyFile), footF = (() => { let f; fresh.scene.traverse(o => { if (o.name === 'foot_l') f = o; }); return f; })();
const mx = new THREE.AnimationMixer(fresh.scene);
mx.clipAction(new THREE.AnimationClip('k', -1, tracks.map(e => e.t.clone()).map((t, i) => (t.name = tracks[i].n, t)))).play();
for (let k = 0; k < hp.times.length; k++) {
  mx.setTime(hp.times[k]); fresh.scene.updateMatrixWorld(true);
  hp.values[k * 3 + 2] = rest.z - (new THREE.Vector3().setFromMatrixPosition(footF.matrixWorld).y - restFootY);
}

// contact frame: the right foot's furthest reach forward; the game reads it from the clip's extras to line it up with the move's active window
const footR = (() => { let f; fresh.scene.traverse(o => { if (o.name === 'foot_r') f = o; }); return f; })();
let contact = 0, reach = -1e9;
for (let t = 0; t <= res.duration; t += 1 / 120) {
  mx.setTime(t); fresh.scene.updateMatrixWorld(true);
  const z = new THREE.Vector3().setFromMatrixPosition(footR.matrixWorld).z;
  if (z > reach) { reach = z; contact = t; }
}
contact = +contact.toFixed(3);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});
const doc = await io.read(bodyFile), root = doc.getRoot();
for (const m of root.listMeshes()) m.dispose();
for (const s of root.listSkins()) s.dispose();
for (const m of root.listMaterials()) m.dispose();
const byName = new Map(root.listNodes().map(n => [n.getName(), n])), buf = root.listBuffers()[0];
const A = doc.createAnimation('kick').setExtras({contact});
for (const {n, t} of tracks) {
  const [bone, path] = n.split('.');
  const mk = (arr, ty) => doc.createAccessor().setType(ty).setArray(arr).setBuffer(buf);
  const S = doc.createAnimationSampler().setInput(mk(t.times, 'SCALAR')).setOutput(mk(t.values, path === 'position' ? 'VEC3' : 'VEC4')).setInterpolation('LINEAR');
  A.addSampler(S).addChannel(doc.createAnimationChannel().setTargetNode(byName.get(bone)).setTargetPath(path === 'position' ? 'translation' : 'rotation').setSampler(S));
}
const KEEPN = /^(root|pelvis|spine_0[123]|neck_01|Head|clavicle_[lr]|upperarm_[lr]|lowerarm_[lr]|hand_[lr]|thigh_[lr]|calf_[lr]|foot_[lr]|ball_[lr])$/;
for (const n of root.listNodes()) if (!KEEPN.test(n.getName()) && n.listChildren().length === 0 && n.getName() !== 'Armature') n.dispose();
await doc.transform(resample({tolerance: 1e-3}), prune({keepLeaves: true}), meshopt({encoder: MeshoptEncoder, level: 'high'}));
await io.write(`${out}/clips_kick.glb`, doc);
console.log(JSON.stringify({srcDur: clip.duration, srcTracks: clip.tracks.length, kept: tracks.length, scale: +scale.toFixed(3), fps: FPS, contact, reach: +reach.toFixed(2)}));
