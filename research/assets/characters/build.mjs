// Builds body_m.glb, body_f.glb and clips.glb from the Quaternius Universal Animation Library zips (see SOURCE.md).
// usage: node build.mjs <node_modules dir with @gltf-transform/* + meshoptimizer> <ual1 godot glb> <ual2 glb> <female glb> <out dir>
import {createRequire} from 'module';
const [nm, ual1, ual2, fem, out] = process.argv.slice(2);
const req = createRequire(nm + '/');
const {NodeIO} = req('@gltf-transform/core');
const {ALL_EXTENSIONS, EXTMeshoptCompression} = req('@gltf-transform/extensions');
const {prune, dedup, weld, simplify, quantize, resample, meshopt} = req('@gltf-transform/functions');
const {MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder} = req('meshoptimizer');
await MeshoptSimplifier.ready; await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});

// clip name in the game -> [source, clip]; UAL1 (Godot export) uses Rigify DEF- bone names with the same rest pose as UAL2
const CLIPS = {
  idle: [1, 'Idle_Loop'], walk: [1, 'Walk_Loop'], jog: [1, 'Jog_Fwd_Loop'], sprint: [1, 'Sprint_Loop'],
  talk: [1, 'Idle_Talking_Loop'], phone: [2, 'Idle_TalkingPhone_Loop'], fold: [2, 'Idle_FoldArms_Loop'], yes: [2, 'Yes'], no: [2, 'Idle_No_Loop'],
  sit_in: [1, 'Sitting_Enter'], sit: [1, 'Sitting_Idle_Loop'], sit_talk: [1, 'Sitting_Talking_Loop'], sit_out: [1, 'Sitting_Exit'],
  guard: [1, 'Punch_Enter'], jab: [1, 'Punch_Jab'], cross: [1, 'Punch_Cross'], hook: [2, 'Melee_Hook'],
  hit_chest: [1, 'Hit_Chest'], hit_head: [1, 'Hit_Head'], knockback: [2, 'Hit_Knockback'],
  death: [1, 'Death01'], getup: [2, 'LayToIdle'], crouch: [1, 'Crouch_Idle_Loop'], crouch_walk: [1, 'Crouch_Fwd_Loop'],
};
const KEEP = /^(root|pelvis|spine_0[123]|neck_01|Head|clavicle_[lr]|upperarm_[lr]|lowerarm_[lr]|hand_[lr]|thigh_[lr]|calf_[lr]|foot_[lr]|ball_[lr])$/;
const DEF = {'DEF-hips': 'pelvis', 'DEF-spine.001': 'spine_01', 'DEF-spine.002': 'spine_02', 'DEF-spine.003': 'spine_03', 'DEF-neck': 'neck_01', 'DEF-head': 'Head'};
const mapName = n => DEF[n] || n.replace(/^DEF-(shoulder|upper_arm|forearm|hand|thigh|shin|foot|toe)\.([LR])$/, (_, b, s) =>
  ({shoulder: 'clavicle', upper_arm: 'upperarm', forearm: 'lowerarm', hand: 'hand', thigh: 'thigh', shin: 'calf', foot: 'foot', toe: 'ball'}[b] + '_' + s.toLowerCase())) ;

// disposing an animation leaves its samplers, and so its accessors, behind
const dropAnim = a => { for (const s of a.listSamplers()) { s.getInput()?.dispose(); s.getOutput()?.dispose(); s.dispose(); } a.dispose(); };
async function body(file, name) {
  const doc = await io.read(file), root = doc.getRoot();
  for (const a of root.listAnimations()) dropAnim(a);
  // one material for both primitives (body + joint bands), then one draw call; colours come from the bones at runtime
  const mat = root.listMaterials()[0];
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { p.setMaterial(mat); for (const s of p.listSemantics()) if (/TEXCOORD/.test(s)) p.setAttribute(s, null); }
  await doc.transform(weld(), simplify({simplifier: MeshoptSimplifier, ratio: .3, error: .002}), prune(), dedup(),
    quantize({quantizeNormal: 8}), meshopt({encoder: MeshoptEncoder, level: 'high'}));
  await io.write(`${out}/${name}.glb`, doc);
}
await body(ual2, 'body_m'); await body(fem, 'body_f');

// clips: the UAL2 skeleton with no mesh, the chosen clips renamed, finger and scale tracks dropped, rotations only except the pelvis
const doc = await io.read(ual2), root = doc.getRoot(), src1 = await io.read(ual1);
for (const m of root.listMeshes()) m.dispose();
for (const s of root.listSkins()) s.dispose();
for (const m of root.listMaterials()) m.dispose();
const byName = new Map(root.listNodes().map(n => [n.getName(), n]));
const own = new Map(root.listAnimations().map(a => [a.getName(), a]));
const buf = root.listBuffers()[0];
for (const [game, [s, name]] of Object.entries(CLIPS)) {
  const A = s === 2 ? own.get(name) : src1.getRoot().listAnimations().find(a => a.getName() === name);
  if (!A) throw new Error('missing clip ' + name);
  const N = doc.createAnimation(game);
  for (const ch of A.listChannels()) {
    const nn = s === 2 ? ch.getTargetNode().getName() : mapName(ch.getTargetNode().getName()), path = ch.getTargetPath();
    if (!KEEP.test(nn) || path === 'scale' || path === 'weights' || path === 'translation' && nn !== 'pelvis') continue;
    const sm = ch.getSampler(), copy = acc => doc.createAccessor().setType(acc.getType()).setArray(acc.getArray().slice()).setBuffer(buf);
    const S = doc.createAnimationSampler().setInput(copy(sm.getInput())).setOutput(copy(sm.getOutput())).setInterpolation(sm.getInterpolation());
    N.addSampler(S).addChannel(doc.createAnimationChannel().setTargetNode(byName.get(nn)).setTargetPath(path).setSampler(S));
  }
}
for (const a of [...own.values()]) dropAnim(a);
for (const n of root.listNodes()) if (!KEEP.test(n.getName()) && n.listChildren().length === 0 && n.getName() !== 'Armature') n.dispose();
await doc.transform(resample({tolerance: 1e-3}), prune({keepLeaves: true}), dedup(), meshopt({encoder: MeshoptEncoder, level: 'high'}));
await io.write(`${out}/clips.glb`, doc);
