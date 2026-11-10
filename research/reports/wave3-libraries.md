# Wave 3: library review (2026-11-09, against v41)

Method: shallow clones in `research/repositories/wave3/<name>/` (gitignored, nothing installed or executed), source read, bundle sizes measured by `curl | gzip -9` from jsdelivr, then four standalone prototypes in `research/prototypes/wave3/` (three@0.187.0 from jsdelivr + importmap, measured with `node work/fps.mjs`, plus a per-prototype `bench.mjs`). Game numbers come from `work/build/v41.html`: 4,499 road nodes / 4,741 edges, 26 AI cars (`nT=min(26,..)`, v41:2863), 1,097 parked cars (`PARKED.cars`), 300 tree chunks, 42 peds.

Caveat on fps: on this Mac (M5 Pro, Metal) every prototype is vsync-capped at 60.3 fps, so Metal cannot rank anything. SwiftShader (software GPU, the same fallback `fps.mjs` uses) is the weak-device proxy; draw calls, triangles and per-frame JS ms are the portable numbers. No phone was tested.

## Per-repo record

| repo | commit | last commit | licence | three peer | ESM from CDN, no bundler? | gz size we would load |
|---|---|---|---|---|---|---|
| Mugen87/yuka 0.7.8 | 1059130 | 2023-01-16 | MIT | none (does not import three) | yes: `build/yuka.module.js` (443 KB raw, unminified, 84 KB gz); `build/yuka.min.js` is UMD only | 32.8 KB (min UMD, inlined as a classic script giving `window.YUKA`) |
| donmccurdy/three-pathfinding 1.3.0 | b55cd7e | 2026-10-05 | MIT | `three 0.x.x` | yes: `dist/three-pathfinding.module.js`, bare `three` import resolves via our importmap | 3.8 KB |
| agargaro/instanced-mesh 0.3.16 | 56786de | 2026-10-06 | MIT | `three >=0.186.0` | yes: `build/index.js`; needs two extra importmap entries: `bvh.js` (build/index.js, 5.5 KB gz) and `three/addons/utils/SortUtils.js` (already covered by our `three/addons/` map, 1.2 KB). Proved loading in the prototype | 18.8 + 5.5 + 1.2 = 25.5 KB |
| Alchemist0823/three.quarks 0.17.1 (+ quarks.core) | de7c207 | 2026-05-20 | MIT | `three >=0.182.0` | yes. Two forms: `dist/three.quarks.esm.js` + `quarks.core` (two importmap entries, 20.5 + 30.5 = 51 KB gz, used in the prototype) or `dist/three.quarks.esm.min.js` with core bundled (43.1 KB gz, imports only `three`). Do NOT use jsdelivr's `/+esm` redirect: it rewrites `three` to its own copy and loads three twice | 43.1 KB |
| three r187 `examples/jsm/utils/SkeletonUtils.js` | n/a (three@0.187.0) | n/a | MIT | is three | yes, already mapped by `three/addons/` | 3.2 KB (+ `meshopt_decoder.module.js` 7.7 KB if the clips stay meshopt-compressed; the game already embeds assets, check whether it already ships a decoder) |
| goldfire/howler.js 2.2.4 | 1d30535 | 2025-11-23 | MIT | none | no ESM: `package.json` has `main` only. Classic `<script>` UMD, `dist/howler.min.js` | 9.7 KB |
| protectwise/troika `troika-three-text` 0.53.1 | 9c89d51 | 2026-11-02 | MIT | `three >=0.125.0` | partly: `dist/troika-three-text.esm.min.js` (97.6 KB raw) has four bare imports (`bidi-js`, `webgl-sdf-generator`, `troika-worker-utils`, `troika-three-utils`), each needs an importmap entry; they all ship ESM (`module` field). Not run in a prototype | 32.9 KB for the file, about 59 KB with deps resolved per the unminified build, plus a font file |
| gkjohnson/three-mesh-bvh 0.9.18 | aef5a71 (clone clock shows 2026-11-10) | 2026-11-09/10 | MIT | `three >=0.159.0` | source ESM only: `exports` maps to `./src/index.js` (49 modules, bare `three` imports). The only prebuilt file is `build/index.umd.cjs`. Without a bundler that is 49 jsdelivr requests at runtime; embedding needs a rollup/esbuild step we do not have | about 62 KB if bundled |
| swift502/Sketchbook 0.4.0 | 62f4b79 | 2024-10-10 | MIT | webpack app, not a library | n/a (reference only) | n/a |

Files that matter (file:line, from the clones):

- **yuka**: `src/steering/Vehicle.js:66` `update` (force, velocity, orientation); `src/steering/behaviors/FollowPathBehavior.js:52` `calculate` (seek until last waypoint, then arrive; advances when within `nextWaypointDistance`); `src/steering/behaviors/ObstacleAvoidanceBehavior.js:63`; `src/core/EntityManager.js:123` `update`; `src/graph/search/AStar.js:9` and `src/navigation/navmesh/NavMesh.js:305` `findPath`.
- **three-pathfinding**: `src/Pathfinding.js:26` `createZone` (builds from a navmesh BufferGeometry), `:78` `getClosestNode`, `:106` `findPath`; `src/AStar.js:38`.
- **instanced-mesh**: `src/core/InstancedMesh2.ts:260` constructor, `:300` `onBeforeRender` (runs culling, lazily), `:455` `_onBeforeCompile` (chains the material's existing `onBeforeCompile`, which matters because the game's materials use `onBeforeCompile`); `src/core/feature/FrustumCulling.ts:58` `performFrustumCulling`, `:101` `frustumCulling`; `src/core/feature/LOD.ts:183` `addLOD`; `src/core/feature/Instances.ts:125` `addInstances`.
- **three.quarks**: `packages/three.quarks/src/ParticleSystem.ts:969` `update` (the simulation loop is JavaScript on the CPU; only rendering is GPU-instanced, so "GPU particles" is a misnomer); `:734-740` stretched-billboard settings (`lengthFactor` defaults to 0 when you pass `speedFactor` as a plain parameter, so rain stays dots; pass `rendererEmitterSettings`); `BatchedRenderer.ts:211` `update`; `packages/quarks.core/src/shape/RectangleEmitter.ts:60` and `ConeEmitter.ts:63` (the Rectangle emitter emits radially in its own plane, not along its normal).
- **SkeletonUtils r187** (`src/SkeletonUtils.r187.js` in the retarget prototype): `:39` `retarget`, `:226` `retargetClip(target, source, clip, options)`, `:290` the `options.hip === name` check compares against the SOURCE bone name, `:452` `getHelperFromSkeleton`.
- **howler**: `src/howler.core.js:22` `HowlerGlobal`, `:556` `Howl`; `src/plugins/howler.spatial.js:149` `_pannerAttr`.
- **troika-three-text**: `src/Text.js:91` `class Text extends Mesh`; `src/FontResolver.js:2,309` unicode-font-resolver client and worker module; `src/TextBuilder.js:32` `unicodeFontsURL`.
- **three-mesh-bvh**: `src/core/MeshBVH.js:94` class, `:532` `raycast`, `:558` `raycastFirst`, `:625` `shapecast`, `:874` `closestPointToPoint`; `src/utils/ExtensionUtilities.js:37` `acceleratedRaycast`, `:176` `computeBoundsTree`.
- **Sketchbook**: `src/ts/vehicles/Car.ts:63` steering `SpringSimulator(60, 10, 0.6)`, `:180-250` `physicsPreStep` (speed-scaled steering with drift correction, `:241-248`), `:39-45` raycast wheel setup (suspensionStiffness 20, frictionSlip 0.8); `src/ts/core/CameraOperator.ts:88-117` orbit camera only.

## Verdicts

**1. SkeletonUtils.retargetClip: Integrate now (offline bake).** This closes the known "no kick" gap (`03-integration-roadmap.md`, backlog item 3). The prototype retargets the CC0 KayKit `Melee_Unarmed_Attack_Kick` (Rig_Medium, 0.93 s) onto `body_m.glb` (the same UAL2 skeleton as `CHAR.list[i].bone`, which `chars.js` already drives): 69 source tracks to 20 target tracks in 5 ms, and the screenshot shows the right leg lifting and snapping through at the same timing as the source. Because the call needs the 1 MB source GLB loaded and the pose caveat below, bake the result into `clips.glb` via `research/assets/characters/build.mjs` instead of retargeting at runtime.

**2. InstancedMesh2: Integrate now.** `addParkedCars` (v41:2808-2824) draws all 1,097 parked cars with `frustumCulled=false`, re-splits near/far every 400 ms in JS, and allocates `M.clone()` per wheel. InstancedMesh2 culls per instance (BVH over instances) and has native LOD (`addLOD`), so the whole `split()` plus `setInterval` goes away. In the 3,000-car prototype it cut triangles 5x versus the game's own scheme and tripled SwiftShader fps. The same trick does not pay on peds (42, `pedMesh` v41:3403) or trees (already 300 chunks with 3 LODs in `perfTick`, v41:3956).

**3. Yuka: Integrate later (narrow use only).** Its one real win on this graph is corner smoothing: the game's `aiPlace` (v41:2889) eases heading at 12% per frame and snaps onto the lane, so cars pivot at junctions (p99 turn rate 9.0 rad/s, max 22.6), while Yuka's `FollowPathBehavior` gives p99 2.2 and max 5.7 rad/s. But it costs 33 KB gz, it knows nothing about `redAhead` / `blockedAhead` / signals (v41:2922), its obstacle avoidance is O(n^2) (0.66 ms per step at 300 cars; the game runs 26, where it is 0.010 ms), and it rides about 0.8 m further off the lane on average (2.54 m vs 1.73 m mean distance to the nearest road segment, though both include a pruned-edge artifact in max). The same smoothing can be had without the library by pure-pursuit on the existing `ai.from/to/t` edges. Its `StateMachine` would be a rewrite of the ped `mode` strings in `updatePeople` (v41:3766) with no gain; its `Graph`/`AStar` duplicates the hand Dijkstra at v41:4860.

**4. three.quarks: Integrate later, only if effects multiply.** The exhaust trails look better (world-space, size and alpha over life) and draw calls fell from 36 to 11, but it is CPU-simulated, the rain port is worse than what exists, and SwiftShader dropped from 60 to 28.5 fps (alpha-blended billboards). The game's `updateSmoke` (v41:3225, 26 pooled sprites) and rain (v41:3845-3856, 2,600 CPU-updated line segments) cost 0.04 ms per frame; quarks cost 0.10 ms with 8 exhausts plus rain. Revisit if tyre smoke, sparks, explosions and crowds of exhaust are added so that sprite draw calls become the bottleneck.

**5. three-pathfinding: Not useful.** It requires a navmesh polygon geometry (`Pathfinding.js:26`); the game's world is a road graph (`world.graph`, nodes with `out` edges) and walking happens on edges (`pedPlace` v41:3471). Pathfinding across open polygon space has no consumer here (no interiors, no plazas), and the game already has Dijkstra (v41:4860) and a flow field (v41:3248).

**6. howler.js: Not useful.** The game already owns an `AudioContext` (v41:3152), a synth (`burst` v41:4583, engine, tyre, wind, gravel) and a `StereoPanner` for voices (v41:4946-4959); Howler cannot synthesize, is a classic UMD script, and its value (sprites, pooling, `howler.spatial.js:149`) is for file-based audio. The 378 voice clips are base64 `rasVoice` JSON decoded by the existing code.

**7. troika-three-text: Reference only.** SDF text would stay sharp at any distance, versus the canvas sprites from `makeLabel` (v41:1027) and `canvasTex` (v41:5009). But it costs about 59 KB gz plus a font file with Lithuanian glyphs (otherwise `FontResolver.js` fetches fonts from a CDN at runtime), a Blob worker and four importmap deps; place names and signs are a handful of static labels that a canvas handles. Revisit only for large-scale street-name overlays.

**8. three-mesh-bvh: Reference only.** Collision here is 2D: `W.collide` over a segment grid (v41:1238), `W.inBuilding` polygon tests, `props` and `walls` grids, height from the DEM `GY`. BVH accelerates 3D triangle raycast and shapecast (`MeshBVH.js:558`, `:625`), which nothing in the game needs yet, and the unbundled ESM is 49 files, so there is no clean single-file embed. Candidate later use: a chase-camera occlusion ray against building meshes.

**9. Sketchbook: Reference only.** The interesting parts already exist in v41: speed-scaled steering with an eased spring (`c.steer += ... dt*7` at v41:3042, yaw `/(1+|speed|/30)` at v41:3048) corresponds to `Car.ts:63,241-248`. The one idea not present is automatic counter-steer toward the velocity vector (`driftCorrection`, `Car.ts:236-248`), a candidate for the handbrake drift feel. Its camera (`CameraOperator.ts:88-117`) is a plain orbit; the game's `camFeel` is ahead. The cannon-es `RaycastVehicle` (`Car.ts:39-45`) is far heavier than the arcade model plus 4-point terrain sampling.

## Prototype results

All pages: `research/prototypes/wave3/<name>/index.html` (variants and `bench.mjs` beside it; screenshots in `shots/`). fps from `work/fps.mjs`: Metal / SwiftShader.

| prototype | variant | fps (Metal / SwiftShader) | draw calls | triangles | per-frame JS | size added (gz) |
|---|---|---|---|---|---|---|
| instanced-mesh, 3,000 parked cars, camera on a street | plain InstancedMesh, all detailed (`plain.html`) | 60.3 / 5 | 2 | 864,002 | submit 0.1 ms | 0 |
| | game's current scheme: near/far split every 400 ms, no culling (`split.html`) | 60.3 / 12 | 3 | 302,978 | submit 0.1 ms + split pass | 0 |
| | InstancedMesh2 with LOD at 120 m and BVH culling (`index.html`) | 60.3 / 37.5 | 3 | 56,258 | submit 0.14 ms | 25.5 KB |
| quarks, 8 cars exhaust + 2,600 rain | game's 26 sprites + 2,600 line segments (`legacy.html`) | 60.3 / 60.3 | 36 | 150 | update 0.04 ms | 0 |
| | three.quarks (`index.html`) | 60.3 / 28.5 | 11 | 5,496 | update 0.10 ms | 43-51 KB |
| yuka, cars on the real graph (474 nodes within 500 m, `graph.json`) | game model, 26 cars (`legacy.html`) | 60.3 / 60.3 | 2 | n/a | step 0.0016 ms | 0 |
| | Yuka FollowPath + avoidance, 26 cars (`index.html`) | 60.3 / 60.3 | 2 | n/a | step 0.010 ms | 32.8 KB |
| | game model, 300 cars | n/a | 2 | n/a | step 0.0088 ms | 0 |
| | Yuka, 300 cars, no avoidance | n/a | 2 | n/a | step 0.044 ms | 32.8 KB |
| | Yuka, 300 cars, avoidance | 60.3 / 60.3 | 2 | n/a | step 0.66 ms | 32.8 KB |
| retarget, kick onto `body_m.glb` | KayKit kick via `retargetClip` (`index.html`) | 60.3 / 30.5 (two skinned meshes, two rows of five poses) | n/a | n/a | retarget 5 ms once | 3.2 KB lib; baked clip about 9 KB raw |

Yuka cornering and spacing (30 simulated seconds at 60 Hz, deterministic seed): turn rate p99 / max in rad/s: game model 9.0 / 22.6 (26 cars) and 8.6 / 22.6 (300); Yuka 2.3 / 5.7 (26), 2.4 / 8.1 (300 with avoidance). Car pairs closer than 3 m per sample at 300 cars: game 14.4, Yuka without avoidance 17.0, with avoidance 7.1 (the game relies on `blockedAhead` for spacing, not modelled here). Mean distance to the nearest road segment: game 1.73 m, Yuka 2.54 m. `graph.json` is the 474-node subsample (19 KB, not ignored by `.gitignore`, safe to commit) of the 4,499-node graph extracted from v41 through an injected `window.__t` in a scratchpad copy; no pipeline or work file was edited.

Retarget details and caveats:

- Source clip: `Melee_Unarmed_Attack_Kick` from KayKit Character Animations 1.1, `Rig_Medium_CombatMelee.glb`, licence CC0 (text in `retarget/src/LICENSE.txt`: "The Complete KayKit Collection v6", Kay Lousberg, kaylousberg.com). I fetched it from a third-party GitHub mirror (GeorgeQLe/assets-kaykit-3d-characters); take the real file from the author's page before shipping. `body_m.glb` stays QAL v1.0 as in `SOURCE.md`, so the raw GLBs in `retarget/src/` are local test inputs only and must not be committed or redistributed.
- Bone mapping that worked (target UE-style to source, with glTF's sanitised names, i.e. dots stripped): `pelvis:hips, spine_01:spine, spine_03:chest, Head:head, upperarm_l:upperarml, ... thigh_l:upperlegl, calf_l:lowerlegl, foot_l:footl, ball_l:toesl` and the right side. Unmapped: `clavicle_*`, `neck_01`, `spine_02`, fingers (they stay in rest pose). Pass `hip: 'hips'` (the source name), `scale` = target hip height / source hip height (2.26 here, because the KayKit mannequin is chibi), and play the output clip on the target SkinnedMesh, not on the scene: its tracks are `.bones[name]` and need a node with a skeleton.
- Measured: peak foot height 0.53 m on the (smaller) source and 0.93 m on `body_m` (ratio 1.75 vs hip ratio 2.26, so the leg reach is proportionally a bit lower than the source).
- Caveat: KayKit's rest pose is a T-pose, UAL2's is an A-pose, and `retargetClip` assumes the same bind pose, so the arms spread wide in the screenshot. Drop the arm and hand tracks from the baked kick and keep the game's guard pose, or apply `localOffsets`. Legs, hips and spine read correctly. Only the Medium rig was tested.
- Other clips to bake the same way: the file also contains `Melee_Block`, `Melee_Block_Hit`, `Melee_Unarmed_Attack_Punch_A`, `Melee_Unarmed_Idle`.

## Do this next (ranked)

| # | what | seam | estimated step | evidence |
|---|---|---|---|---|
| 1 | Bake a retargeted kick (and optionally block/hit) into `clips.glb` | `research/assets/characters/build.mjs` (new clip entries), manifest append in the `animals2`/`chars` asset block; consumed through `CHAR.list[i].bone` mixers that `chars.js` already owns, wired by `fight2.js`'s kick action | about 60 lines in `build.mjs` plus a node script that runs `retargetClip` headless (needs the three.js `AnimationMixer`, so run it in the prototype page or via Playwright and export JSON); no runtime library | kick lands on `body_m`: 69 to 20 tracks, 5 ms, foot peak 0.93 m; CC0 source |
| 2 | Replace parked-car `split()` with InstancedMesh2 + LOD | wrap `addParkedCars` (v41:2808-2824): keep the `PARKED.cars` records, build one `InstancedMesh2` per `LOT_GEOS[k]` (paint, trim, wheels) with `addLOD(parkedFar-style geometry, mat, 120)`, drop `setInterval(split)` | new `pipeline/add_parked2.py` + `parked2.js`, about 50 lines; add `bvh.js` to the importmap in `add_importmap.py` and inline the 18.8 KB + 5.5 KB (or keep jsdelivr) | 864k / 303k / 56k triangles; SwiftShader 5 / 12 / 37.5 fps; needs a phone test first because Metal hides it |
| 3 | Pure-pursuit corner smoothing for traffic (not Yuka) | `aiPlace` (v41:2889): aim at a point `k` metres ahead along the node walk instead of easing 12% toward the current edge heading | about 15 lines in an `add_traffic2.py` wrap of `aiPlace`/`aiNext`, no library | Yuka shows the target is p99 2.2 rad/s vs the current 9.0; only worth doing if the junction pivot is visible in play |
| 4 | Counter-steer toward velocity on handbrake drift | `driveCar` yaw line (v41:3048) | 5-10 lines in a `drive.js` tweak, no library | `Sketchbook Car.ts:236-248` is the only vehicle idea not already in v41 |
| 5 | three.quarks for exhaust and tyre smoke, only if effects grow | replace `fumes`/`updateSmoke` (v41:3225, 4055) behind a flag | about 80 lines, +43 KB gz | draws 36 to 11 calls, but 3x CPU and half the SwiftShader fps; skip until sprite count rises |

Not recommended: three-pathfinding, howler.js, troika-three-text (unless large street-name overlays appear), three-mesh-bvh (until a 3D raycast need exists and a bundle step is available), Yuka as a dependency.
