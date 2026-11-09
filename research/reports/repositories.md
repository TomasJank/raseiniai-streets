# Repository survey: reusable code for Raseiniai Streets

Date: 2026-11-09. Game baseline: `work/build/v38.html`, three.js 0.187.0 via importmap, WebGLRenderer, `onBeforeCompile` facades, `poseAt/hidePed/dress` as the pedestrian renderer seam (see `research/reports/01-architecture.md`).

Method: shallow clones under `research/repositories/<area>/<name>/`, read source files (not READMEs). Where a repo is over 200 MB, only source paths were kept (sparse checkout, then trimmed to source). `.git` was removed from two trimmed clones (`combat/combat-game-threejs`, `graphics/realism-effects`) after the commit was recorded. Single files that were not cloned (Needle CarPhysics.ts, Rapier vehicle controller, three.js addons, beautiful-water) were fetched raw or via the GitHub API. No repo code was executed and no install scripts were run.

Limits of this pass:
- The GitHub API rate limit (5,000/hr) was hit during discovery. Discovery used `gh search` and REST search, with the search results cut short. Five candidates were read.
- The Rapier `testbed3d` vehicle demo does not exist at HEAD. The tree has only `src.ts/control/ray_cast_vehicle_controller.ts` and the Rust `src/control/ray_cast_vehicle_controller.rs`. There is no vehicle demo in `testbed3d/src/demos`.
- `combat/threejs-combat` vendors three.js under `./three/`. That directory was excluded from the sparse checkout, so the bundled three.js version was not verified.
- Needle's `CarPhysics.ts` has no LICENSE file at the root or under `package/` of `needle-engine-samples@dev` (404 for `LICENSE`, `LICENSE.md`, `LICENSE.txt`).

---

## Summary table

| repo | area | licence | three version | classification | top file to copy |
|---|---|---|---|---|---|
| liyupi/niulai-game | combat (discovery) | MIT | ^0.170.0 | Reusable with minor modifications | `src/moves.js` (frame-data table) + `src/combat.js` (`World.tryHit`) |
| aditano/Pittsburgh-3D-Recreation | city facades (discovery) | GPL-3.0 | ^0.170.0 | Useful only as inspiration | `src/architecture.js` `massingProfile` (line 953), not copyable |
| FelisPimeja/osm-simple3d-editor | city geometry (discovery) | ISC | 0.186.1 | Reusable with significant modifications | `src/render/building-geometry.ts` `buildTriangles` (line 34) |
| Yiping0122/urbangraph-bristol | city (discovery) | MIT | 0.160.0 (unpkg) | Useful only as inspiration | `extended/index.html` `build()` (line 154) |
| ipenywis/threejs-monster-animation | animation FSM (discovery) | none | 0.129.0 (React CRA) | Useful only as inspiration | `src/components/finiteStateMachine/index.js` `SetState` (line 24) |
| hmthanh/3d-human-model | characters | none (no LICENSE file; package.json says MIT) | ^0.133.1 (Parcel) | Not worth using | `src/viewer.js` mixer setup (line 323) |
| Ar9av/human-fight-rl | combat | none (README badge says MIT, no LICENSE file) | 0.162.0 (importmap) | Useful only as inspiration | `js/combat.js` `checkAttackHit` (line 31) |
| ZakirG/combat-game-threejs | combat | MIT | ^0.175.0 (R3F, React 19) | Reusable with significant modifications | `client/src/utils/bloodEffect.ts` (line 89), `client/src/characterConfigs.ts` (line 89) |
| Science001/threejs-combat | combat | none | vendored, not verified | Not worth using | `app.js` `monsterPunch` (line 80) |
| local three-js-fighter-game | combat (own code) | own code, no LICENSE | ^0.163.0 | Reusable with minor modifications | `src/effects/AttackEffects.ts` `createHitEffect` (line 96) |
| aaronbernath143/3D-car-model | vehicles | MIT (code); Lamborghini model has no licence | r91 (vendored) | Not worth using | `js/Configurator.js` (showroom only) |
| needle-tools CarPhysics.ts | vehicles | none found | n/a (Needle engine) | Useful only as inspiration | `CarPhysics.ts` `applyPhysics` (line 389), `CarWheel.applyPhysics` (line 166) |
| dimforge/rapier.js (vehicle controller) | vehicles/physics | Apache-2.0 | n/a | Useful only as inspiration | `src.ts/control/ray_cast_vehicle_controller.ts` (line 16) |
| pmndrs/cannon-es (RaycastVehicle) | vehicles/physics | MIT | n/a | Reusable with significant modifications | `src/objects/RaycastVehicle.ts` `castRay` (line 249) and `updateFriction` (line 381) |
| jeantimex/threejs-water | water | MIT | ^0.184.0 | Useful only as inspiration | `src/shaders/WaveSimulation.frag` (line 69), `WaterRipple.frag` (line 58) |
| baditaflorin/threejs-water-free | water | MIT | >=0.181.0 (WebGPU/TSL) | Not worth using | `src/` FFT/JONSWAP pipeline (WebGPU only) |
| VictorZakharov/beautiful-water | water | MIT | 0.185.1 | Useful only as inspiration | `src/scene/waves.js` `sampleOceanSurface` (line 151) |
| three r187 `examples/jsm/objects/Water.js` | water | MIT | 0.187.0 | Reusable with minor modifications | `Water.js` class (line 32) |
| three r187 `examples/jsm/objects/Water2.js` | water | MIT | 0.187.0 | Reusable with minor modifications | `Water2.js` class (line 33), flow map (line 124) |
| 0beqz/realism-effects | graphics | MIT | peer ^0.151.3 | Not worth using | `src/ssgi`, `src/gtao` (postprocessing-based) |
| N8python/n8ao | graphics | CC0-1.0 | peer >=0.137 | Reusable with minor modifications | `src/N8AOPass.js` (class at line 38) |
| three r187 `GTAOPass.js` | graphics | MIT | 0.187.0 | Reusable with minor modifications | `GTAOPass.js` constructor (line 56) |
| three r187 `CSM.js` | graphics | MIT | 0.187.0 | Reusable with minor modifications | `CSM.js` class (line 32), constructor (line 39) |
| three r187 `Sky.js` | graphics | MIT | 0.187.0 | Useful only as inspiration | `Sky.js` shader uniforms (line 79) |

---

## 1. hmthanh/3d-human-model (characters)

- URL: https://github.com/hmthanh/3d-human-model. Commit `ed0306f`.
- Licence: no LICENSE file. `package.json` says `"license": "MIT"`, and the GitHub licence API returned null. Treat as not reusable until the author confirms.
- Three.js: `^0.133.1` (`package.json`). Parcel 1 bundler. Plain JS, no TypeScript.
- Size: 168 MB working tree, including GLB assets (`TranThiNgocTham.glb`, `Thanh.glb`, `docs/` build output).
- Architecture: a fork of the three.js sample GLTF viewer (`src/viewer.js`, 772 lines) with dat.gui, KTX2/Draco/Meshopt loaders, and a SkeletonHelper. It is a model inspector, not a game.
- Most reusable files (none copyable under the licence status):
  1. `src/viewer.js` line 323: `new AnimationMixer(this.content)` and clip playback. Generic.
  2. `src/viewer.js` lines 630-680: enumerating SkinnedMesh morph targets into dat.gui sliders. Dev tooling only.
  3. `src/app.js` (102 lines): the entry point, WebGL capability check and query-string config. Trivial.
- Classification: **Not worth using**. The viewer logic is generic three.js sample code, the repo has no LICENSE file, and the bundled assets are named after a real person (`TranThiNgocTham.glb`), which is a reason to avoid them in any case. The generic mixer setup at `viewer.js:323` is standard three.js and needs no copy.

---

## 2. Ar9av/human-fight-rl (combat)

- URL: https://github.com/Ar9av/human-fight-rl. Commit `974921f`.
- Licence: none. The README has an MIT badge linking to `LICENSE`, but the repo has no LICENSE file. Not reusable as code.
- Three.js: `0.162.0` via importmap in `index.html:168`.
- Size: 23 MB (includes `assets/character.glb`, `arena.glb`, `trained_brain_p2.json`, and a paper PDF).
- Architecture: vanilla ES modules, no bundler. `js/` has 12 modules: `ai.js`, `brain.js` (tabular Q-learning), `combat.js`, `classes.js`, `player.js`, `scene.js`, `ui.js`, `headless.js`.
- Most reusable files (ideas only, since code cannot be copied):
  1. `js/combat.js` line 15: `ATTACKS` table. Each entry has `damage`, `range`, `hitTime` (seconds into the animation before the hit lands) and `reaction` clip name. Depends only on clip names.
  2. `js/combat.js` line 31: `checkAttackHit(attacker, victim)`. Resolves one hit per attack using game-time (`attackElapsed >= hitTime`), range, block reduction (melee 0.8, ranged 0.6), and a moving-target dodge chance.
  3. `js/player.js` line 75: `play(name, fadeDuration)`. Mixamo-style clips (`Punch_Jab`, `Hit_Chest`, `Death01`) with `LoopOnce` one-shots, and a `finished` listener to return to `Idle_Loop`.
  4. `js/player.js` line 162: `takeDamage`. Stun via `activeDifficulty.stunDuration`, blocking holds the block pose, and death is delayed by `deathDelay`.
  5. `js/classes.js` line 3: `CLASS_DEFS` table with per-class move sets and keybindings.
- Caveat in `player.js` line 94: a new `finished` listener is added for every one-shot without removing the previous one when a one-shot is interrupted, so listeners can stack.
- Classification: **Useful only as inspiration**. The file has no licence, so the code can only inform design; the `ATTACKS` table and the `checkAttackHit` ordering (hit time gates, one hit per attack, then block and dodge) are the design worth copying by rewrite. The `finished`-listener stacking at `player.js:94` should not be copied as is.

---

## 3. ZakirG/combat-game-threejs (combat)

- URL: https://github.com/ZakirG/combat-game-threejs. Commit `407e122`. Sparse clone: `client/src`, `server`, licence, README. The `.git` directory was removed after recording the commit.
- Licence: MIT (`LICENSE`).
- Three.js: `^0.175.0` (`client/package.json`), with `@react-three/fiber ^9.1.2`, `@react-three/drei`, `@react-three/postprocessing`, React 19, Vite 6.
- Size: about 624 KB of source after trimming (the full repo was 1.2 GB of FBX/GLB assets, not kept).
- Architecture: TypeScript + React + R3F. Multiplayer server in Rust (`server/src/lib.rs`, `player_logic.rs`). `Player.tsx` is 3,345 lines and `ZombieManager.tsx` 1,175 lines, which makes the monolith the main obstacle.
- Most reusable files:
  1. `client/src/utils/bloodEffect.ts` line 89: `createBloodSpurt(position, config)`. Three `THREE.Points` systems (bright red, dark red, brown) with per-particle velocities and gravity, CPU-integrated in the update loop (around line 170-200), disposed when finished. Depends only on three.js.
  2. `client/src/characterConfigs.ts` line 28 (`CharacterAnimationTable`) and line 89 (`CHARACTER_CONFIGS`). A pure data table mapping logical states (`idle`, `walk-forward`, `attack1`..`attack6`, `damage`, `death`, `falling`) to clip names, with separate preview and gameplay settings. A good model for the game's animation keys.
  3. `client/src/utils/screenshake.ts` line 67: `updateScreenshake`. Decaying random offset. Bug: it stores the camera position once at trigger time (`originalCameraPosition`) and writes `copy(originalCameraPosition)` every frame, so it snaps back to a stale position if the camera follows the player. Fix before reuse.
  4. `client/src/components/Player.tsx` line 1251: `playAnimation(name, crossfadeDuration)`. Crossfade with `fadeOut`/`crossFadeTo`. Uses Mixamo bone names (`mixamorig:righthand`, around line 2564) for weapon attachment.
  5. `client/src/components/ZombieBrain.tsx` (230 lines): mode machine `idle | wandering | pursuing | attacking` (`ZombieState`, line 43) with timed decisions.
- Classification: **Reusable with significant modifications**. The blood Points system and the animation-table pattern are self-contained, but the code is TypeScript, React-bound, and tied to R3F state, so each piece needs a rewrite into the game's plain JS module style. The screenshake logic at `screenshake.ts:67` needs a fix before use.

---

## 4. Science001/threejs-combat (combat)

- URL: https://github.com/Science001/threejs-combat. Commit `bc6a851`. Sparse clone: `app.js`, `helper.js`, `main.html`, `style.css`, `3D/` excluded.
- Licence: none (no LICENSE file; the GitHub licence API returned null).
- Three.js: vendored under `./three/build/three.module.js` (imported at `app.js:1`). The vendored version was not verified because the directory was excluded from the sparse checkout.
- Size: about 820 KB after trimming. Full repo about 704 MB (vendored three.js examples and GLTF models).
- Architecture: vanilla JS, PHP wrapper (`index.php`), no bundler. Two characters (hero and monster) in `3D/*.gltf`.
- Most reusable files:
  1. `app.js` line 80: `monsterPunch()`. Attack sequence: `crossFadeTo` into the punch clip, then a chain of `setTimeout` calls. Hard-coded timings.
  2. `app.js` line 318: `monsterMixer.update(deltaTime)` in the render loop.
  3. `helper.js` line 43: `loadModel(url)`. Promise-wrapped GLTF load with a loading overlay.
- Classification: **Not worth using**. No licence, the hit and reaction timing is hard-coded with `setTimeout` chains (`app.js:80`), and the vendored three.js cannot be matched to the game's 0.187 build. Nothing here is better than the local fighter code or the niulai frame-data design.

---

## 5. Local three-js-fighter-game (combat, own code)

- Path: `/Users/tomasjankauskas/Desktop/Projects/three-js-fighter-game`, commit `283f33d`. The user's own code, so licence does not apply (no LICENSE file present).
- Three.js: `^0.163.0` (`package.json`), TypeScript, Vite 5, Playwright tests.
- Size: 4,345 lines of TS across `src/` and `tests/`.
- Architecture: `Game.ts` runs a `requestAnimationFrame` loop with `THREE.Clock` `deltaTime`. Fighters are `Fighter.ts` (state flags, not a state machine), with `FatKidCharacter.ts` (cartoon) and `RealisticCharacter.ts` (procedural `THREE.Skeleton` built at `RealisticCharacter.ts:550`).
- Most reusable files:
  1. `src/effects/AttackEffects.ts` line 96: `createHitEffect(position, blocked)`. Flash sprite and block effect, with `update(deltaTime)` at line 169 fading opacity and scaling each child, and disposing geometry and materials on expiry.
  2. `src/effects/ParticleEffects.ts` line 23: `initializeParticlePool()`, plus `createImpactStars` (line 115) and `createDustCloud` (line 38). A pooled particle system that works without a dependency.
  3. `src/game/Game.ts` lines 83-134: hit resolution. Each side's `attackHitbox.intersectsBox(hitbox)` is gated by `hasHitThisAttack`, which prevents multi-hits per swing. Calls `createHitEffect`, camera shake and impact stars.
  4. `src/fighters/Fighter.ts` line 285: `takeDamage(damage)`. Blocking costs stamina; guard break sets `blockStun`; unblocked hits add knockback velocity.
  5. `tests/blocking.spec.ts` and `tests/game.spec.ts`: 14 Playwright tests (`test(` count), the pattern the CLAUDE.md of that project requires.
- Issues to avoid copying: movement is per frame, not per second. `Fighter.ts:138` sets `velocity.x = -MOVE_SPEED` (0.15 per frame) and `GRAVITY = -0.02` (line 33) are per-frame constants, so physics is frame-rate dependent even though `Game.ts:63-65` already receives `deltaTime` and passes it to `Fighter.update`. The game's own design doc (`claude.md`) describes `CombatSystem.ts`, `HitboxManager.ts` and `ComboSystem.ts`, which do not exist in `src/`.
- Classification: **Reusable with minor modifications**. The effect and pool code is standalone three.js and drops into `pipeline/fight.js` with small changes, and the hit-gating pattern at `Game.ts:83-84` is the one the game needs. The per-frame movement and knockback should be rewritten as per-second values before use.

---

## 6. aaronbernath143/3D-car-model (vehicles)

- URL: https://github.com/aaronbernath143/3D-car-model. Commit `eff3b2e`.
- Licence: MIT for the code (`LICENSE`, "Copyright (c) 2021 Santosh Arron"). The model `data/aventador/aventador.gltf` is a Lamborghini Aventador with no asset licence in the repo. A trademarked model is not reusable in a commercial game.
- Three.js: vendored `js/three.min.js`, REVISION `91dev`, which is r91 (2017 era). Also vendored: GLTFLoader, OrbitControls, tween.min.js.
- Size: 84 MB (mostly the Aventador GLTF/BIN and textures, PSD and Blender source).
- Architecture: jQuery-style script includes, no build step. `js/Configurator.js` (883 lines) handles a showroom: colour picker from `data/aventador/meta.json`, a camera cinematic via tween, and an intro skip.
- Most reusable files: none for driving. `js/Configurator.js` line 246 `LoadAventador(config)` shows a GLTF load with a progress callback, and line 413 `AddCinemeticSequence` is a camera-path tween. Both are showroom code.
- Classification: **Not worth using**. The three.js build is r91 and cannot be matched to 0.187, the code has no physics or driving model, and the car asset is a trademarked, unlicensed model. The game's procedural car bodies (`buildCar`, 23 model tables) are already a better fit.

---

## 7. Needle CarPhysics.ts (vehicles)

- URL: https://github.com/needle-tools/needle-engine-samples (file `package/Runtime/CarPhysics/Scripts/Needle.Samples.CarPhysics~/CarPhysics.ts`, branch `dev`, commit `e57cdd9`). Fetched raw, 421 lines. Repo not cloned.
- Licence: none found. Root and `package/` LICENSE files returned 404 at the `dev` branch. Treat as unlicensed.
- Three.js: not pinned. It imports `three` and `@needle-tools/engine` (Needle's own engine) plus `@dimforge/rapier3d-compat`.
- Architecture: TypeScript with Needle decorators (`@serializable`), `Behaviour` components, coroutines (`startCoroutine(physicsLoop(), FrameEvent.PostPhysicsStep)`, line 294).
- Most reusable pieces (design only):
  1. `CarWheel` defaults (lines 28-64): suspension compression 0.5, relax 2.5, rest length 0.25, stiffness 45, max force 6000, travel 0.1, side friction 0.5, friction slip `(2, 50)`.
  2. `CarWheel.applyPhysics` line 166: friction slip lerps between a low and a high value by grip, where grip is `velocity.dot(forward)` clamped to [0, 1] (line 175), and goes to 1 below 1 m/s (line 178).
  3. `CarPhysics.applyPhysics` line 389: acceleration force is `accelerationForce / deltaTime * currAcc` (line 406), which is an impulse-style scaling. Steering is smoothed with `Mathf.lerp` on `deltaTime / steerSmoothingFactor` (line 342).
  4. `CarPhysics.topSpeed` gate (line 404): no acceleration above top speed, braking only when moving forward.
- Classification: **Useful only as inspiration**. The file is written against Needle's engine and an unlicensed repo, so nothing can be copied directly. The suspension numbers and the grip-driven friction lerp (`CarWheel.applyPhysics` line 192) are the useful part, and they map onto the game's own `driveCar` surface table `SURF` as tuning ideas.

---

## 8. dimforge/rapier.js vehicle controller (vehicles/physics)

- URL: https://github.com/dimforge/rapier.js. Commit `9f638c5`. Read via raw file, not cloned. Files read: `src.ts/control/ray_cast_vehicle_controller.ts` (518 lines), `src/control/ray_cast_vehicle_controller.rs` (path only).
- Licence: Apache-2.0 (verified via GitHub repo licence and the Apache text in the raw LICENSE).
- Three.js: not applicable. Rapier is physics only and ships as WASM (`rapier3d-compat`).
- Architecture: TypeScript wrapper (`DynamicRayCastVehicleController`, line 16) over a Rust/WASM raw controller. `updateVehicle(dt, ...)` at line 58 calls `this.raw.update_vehicle(dt, broadPhase, narrowPhase, bodies, colliders, ...)`.
- Most reusable: the controller API surface (`addWheel`, `setWheelSteering`, `setWheelEngineForce`, `setWheelBrake`, `wheelContactPoint`, `wheelIsInContact`) as a reference for the wheel model. The actual raycast-suspension logic is in Rust and not visible in this file.
- Note: the `testbed3d` vehicle demo requested in the brief does not exist at HEAD. `testbed3d/src/demos` contains no vehicle or raycast file.
- Classification: **Useful only as inspiration**. Using it means adding Rapier's WASM world and rebuilding the scene's collision on it, while the game uses its own grid collision (`props`, `walls`, building polygons). The API shape is a useful checklist, not a dependency.

---

## 9. pmndrs/cannon-es RaycastVehicle (vehicles/physics)

- URL: https://github.com/pmndrs/cannon-es. Commit `dd971c4`. Cloned (8.1 MB). Files: `src/objects/RaycastVehicle.ts` (673 lines), `src/objects/WheelInfo.ts`, `examples/raycast_vehicle.html` (229 lines).
- Licence: MIT (`LICENSE`).
- Three.js: none (physics only). The example imports `../dist/cannon-es.js` and `./js/Demo.js`, which uses three for rendering.
- Architecture: TypeScript class `RaycastVehicle` (line 16), a port of Bullet's raycast vehicle. It depends on `Body`, `World`, `Ray` and `WheelInfo` from the cannon-es core.
- Methods worth reading: `addWheel` (line 64), `applyEngineForce` (83), `setBrake` (90), `updateVehicle` (115, which runs suspension at line 138 and friction at line 155), `updateSuspension` (200), `castRay` (249), `updateFriction` (381).
- Only `castRay` (line 249) touches the physics world. `updateSuspension` and `updateFriction` are pure math on wheel and chassis state.
- Classification: **Reusable with significant modifications**. Replacing `castRay` with a sampler against the game's ground height and grid colliders would give a working suspension model with no physics engine. `updateFriction` (line 381) is reusable as-is once the body dependency is wrapped in a plain object, and the example in `examples/raycast_vehicle.html` shows the chassis and wheel setup values.

---

## 10. jeantimex/threejs-water (water)

- URL: https://github.com/jeantimex/threejs-water. Commit `f35a700`. Cloned (1.5 MB).
- Licence: MIT (`LICENSE`, "Original work Copyright (c) 2011 Evan Wallace", a port of his WebGL water demo).
- Three.js: `^0.184.0` (`package.json`), plus `three-mesh-bvh ^0.9.14` and `lil-gui`. TypeScript, Vite.
- Size: 1.5 MB. About 11,000 lines including GLSL. The `src/shaders/` directory is about 2,600 lines of GLSL.
- Architecture: GPU ping-pong pool simulation. Render targets hold height and velocity; passes for wave simulation, ripple drops, caustics, object textures, and a surface pass (`src/rendering/WaterSurfacePass.ts`).
- Most reusable files (shaders, ported to plain GLSL):
  1. `src/shaders/WaveSimulation.frag` line 69: 4-neighbour Laplacian over a height/velocity texture, with the stencil scaled by pool dimensions. Standard 2D wave equation step.
  2. `src/shaders/WaterRipple.frag` line 58: `drop = max(0, 1 - length(physicalDiff) / physRadius)`, a cosine-like drop profile applied to the height texture on click or raindrop.
  3. `src/shaders/WaterNormal.frag` (90 lines): normal from height gradient.
- Classification: **Useful only as inspiration**. The pool renderer (`PoolPass`, `CausticsPass`, `ObjectTexturePass`) totals about 1,000 lines of pass code and depends on three 0.184 and `three-mesh-bvh`. The wave-equation and drop shaders are the part worth porting, for rain puddles or a splash on the river, but only as a standalone render-target pass.

---

## 11. baditaflorin/threejs-water-free (water)

- URL: https://github.com/baditaflorin/threejs-water-free. Commit `4a2dd82`. Cloned (436 KB).
- Licence: MIT (`LICENSE`, copyright 2026 Florin Badita).
- Three.js: `>=0.181.0` (`package.json` peerDependencies). Targets WebGPU with TSL and falls back to WebGL2 through the WebGPU renderer (`README.md` line 24).
- Architecture: JavaScript ES modules, ocean simulation with FFT (`docs/lib/core/fft.js`), JONSWAP spectrum (`docs/lib/presets.js`), Gerstner swells, cascades. Demo at `docs/demo/main.js`.
- Most reusable: the JONSWAP and FFT ocean modules (`docs/lib/core/`), which are self-contained math.
- Classification: **Not worth using**. It needs the WebGPU renderer, which means replacing the game's `WebGLRenderer` and every `onBeforeCompile` patch the facade and night-window shaders rely on. It also models open ocean, and the game's water is canals, lakes and a river.

---

## 12. VictorZakharov/beautiful-water (water)

- URL: https://victorzakharov.github.io/beautiful-water/ (source repo: https://github.com/VictorZakharov/beautiful-water). Commit `830c7f3` (HEAD at survey time). Read via GitHub API, not cloned, because the API was near its limit. Files read: `src/scene/waves.js`, `src/scene/ocean.js`, `package.json`, `LICENSE`.
- Licence: MIT (`LICENSE`, verified via raw fetch).
- Three.js: `0.185.1` (`package.json`), Vite 8.2.0, WebGPU plus WebGL fallback.
- Architecture: `src/scene/ocean.js` (203 lines) builds a `Reflector` and `Refractor` over a capture geometry (`ocean.js:58`, around line 40 for the refractor) with a custom water shader (`src/shaders/water.js`). `src/scene/waves.js` (about 200 lines) is a CPU-side Gerstner-style sum with domain warp (`sampleOceanSurface`, line 151).
- Most reusable: `src/scene/waves.js` line 151 `sampleOceanSurface(x, z, time)`, which returns height and gradient. CPU-side, no GPU requirement, usable for boat or buoy heights.
- Classification: **Useful only as inspiration**. The rendering path is WebGPU-first with a `Reflector` and `Refractor` (two extra scene renders), which is too heavy for the 60 fps budget on a city of 6,675 buildings. The wave sum in `waves.js:151` is a small, portable function if the game ever needs a height query on water.

---

## 13. three r187 `examples/jsm/objects/Water.js` (water)

- Source: `https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/objects/Water.js` (12,894 bytes, saved to the scratchpad, not in the repo). Commit tag `r187` (`456a78fd`).
- Licence: MIT (three.js).
- Three.js: 0.187.0.
- Architecture: `class Water extends Mesh` (line 32). Flat-mirror reflection: a `WebGLRenderTarget` with `HalfFloatType` (line 88), a mirror camera and a mirror plane built from the mesh's world position (lines 72-86). Constructor options: `textureWidth`/`textureHeight` default 512 (line 55), `clipBias`, `alpha`, `time`, `waterNormals`, `sunDirection`, `sunColor`, `waterColor`, `distortionScale`, `fog`.
- Needs: a normal map (`waterNormals`, e.g. `examples/textures/waternormals.jpg` from three's examples), which is not part of the module. One extra scene render per frame at the reflection texture resolution.
- Classification: **Reusable with minor modifications**. It is the version-matched drop-in for flat water planes (lakes, canal surfaces), and the only change is hosting the normal map and choosing a lower `textureWidth` for performance. It does not work for non-planar water surfaces, and the reflection pass re-renders the whole scene, so it should be limited to a few planes.

---

## 14. three r187 `examples/jsm/objects/Water2.js` (water)

- Source: `https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/objects/Water2.js` (10,459 bytes, scratchpad only). Commit tag `r187`.
- Licence: MIT.
- Three.js: 0.187.0.
- Architecture: `class Water extends Mesh` (line 33), built on `Reflector` and `Refractor` (`import` lines 14-15; `new Reflector` at line 95). Flow map support via `options.flowMap` (line 70, uniform setup at 124-134). Default normal map `textures/water/Water_1_M_Normal.jpg` (line 71), which is not in the module.
- Needs: two normal maps and a flow map if used; two extra scene renders (reflection and refraction).
- Classification: **Reusable with minor modifications**. The flow map is what a river needs (flowing water in one direction), so it is the better of the two three.js water options for the river; the cost is the second extra render pass, so it should cover only the river, not every water surface. Hosting the normal maps is the only mandatory change.

---

## 15. 0beqz/realism-effects (graphics)

- URL: https://github.com/0beqz/realism-effects. Commit `061daea`. Sparse clone (`src`, `package.json`, licence, readme, rollup config); `.git` removed after recording.
- Licence: MIT (`LICENSE.md`).
- Three.js: peer `^0.151.3` and `postprocessing ^6.34.1` (`package.json` peerDependencies). Not compatible with the game's 0.187 without a patch.
- Passes (`src/`): `ssgi` (SSGI, SSR), `ao` (AOPass), `hbao` (HBAOPass), `gtao` (GTAOPass), `taa` and `traa` (temporal AA), `motion-blur`, `temporal-reproject`, `denoise`, `gbuffer`, `lens-distortion`, `sharpness`, `sparkle`, `gradual-background`.
- Cost: the README has no numeric benchmark. It says the SSGI branch `poisson-recursive` gives "far better performance, quality and memory usage" (readme.md lines 90-91) and that the main-branch SSGI is being reworked. Cost is not quantified in the repo.
- Architecture: every effect is an `Effect` subclass from `postprocessing`, so the game would need an `EffectComposer`. That is a bigger change than the 0.187 WebGLRenderer path can absorb without losing its MSAA (`antialias: !PHONE`).
- Classification: **Not worth using**. It is pinned to three r151 and to the `postprocessing` library, which the game does not use, and the repo itself describes its SSGI as a work in progress with no published cost figures. The `gtao` and `hbao` passes are worth reading if the n8ao and three GTAO options fall short, but they carry the same composer cost.

---

## 16. N8python/n8ao (graphics)

- URL: https://github.com/N8python/n8ao. Commit `0fc1555`. Cloned (26 MB, includes example media).
- Licence: CC0-1.0 per the GitHub detection. The LICENSE file is the Creative Commons legal code, which is the CC0 text. Public domain dedication, no attribution needed.
- Three.js: peer `>=0.137`, `postprocessing >=6.30.0` (peer, used only by `N8AOPostPass`). Version 2.0.1 (`package.json`).
- Architecture: two pass variants. `src/N8AOPass.js` (879 lines, class at line 38) extends three's own `Pass` (`import` from `three/examples/jsm/postprocessing/Pass.js`). `src/N8AOPostPass.js` extends `postprocessing`'s Pass. The denoiser is Poisson-based (`PoissionBlur.js`) with an optional neural denoiser (`NeuralDenoise.js` plus a 7.7 KB `NeuralDenoiseModel.json`).
- Configuration (`N8AOPass.js` lines 82-98): `aoRadius` 5.0, `denoiseSamples` 8, `gammaCorrection` true, `halfRes` false. The README's Performance section (lines 172-179) describes `halfRes` as the way to cut cost, with AO computed at half resolution and upscaled.
- Most reusable files:
  1. `src/N8AOPass.js` line 38: the pass class. Drop-in on an `EffectComposer`, using only three.js.
  2. `src/PoissionBlur.js`: the Poisson denoiser that the pass uses.
  3. `src/compat.js`: `WebGLMultipleRenderTargetsCompat`, a replacement for the MRT class removed in r172 (`compat.js:5`), which matters on 0.187.
- Classification: **Reusable with minor modifications**. It is the only AO option here that depends on three.js alone (its `postprocessing` import is confined to `N8AOPostPass.js`), so the game can use `N8AOPass` directly. The changes are routing the scene through an `EffectComposer` (the game has none) and turning on `halfRes` if the frame budget is tight.

---

## 17. three r187 `examples/jsm/postprocessing/GTAOPass.js` (graphics)

- Source: `https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/postprocessing/GTAOPass.js` (20,157 bytes, scratchpad only). Also needs `Pass.js`, `shaders/GTAOShader.js`, `shaders/PoissonDenoiseShader.js`, `shaders/CopyShader.js`, `math/SimplexNoise.js` from the same tree (imports at lines 23-27).
- Licence: MIT.
- Three.js: 0.187.0 (exact match).
- Architecture: `class GTAOPass extends Pass` (line 43), constructor `(scene, camera, width, height, parameters, aoParameters, pdParameters)` (line 56). Computes its own normal pass (`MeshNormalMaterial` at line 161) unless a G-buffer is supplied (`setGBuffer`, line 307). Output modes via `GTAOPass.OUTPUT`. `blendIntensity` default 1 (line 114).
- Cost: a normal render pass, the GTAO pass, and a Poisson denoise pass. No numbers in the file.
- Classification: **Reusable with minor modifications**. It is exact-version and needs no third-party code, so it is the lowest-risk AO option with respect to three.js. The integration cost is an `EffectComposer`, and the composer's render targets lose the canvas MSAA the game currently uses, so either accept the aliasing or add multisampling to the composer target.

---

## 18. three r187 `examples/jsm/csm/CSM.js` (graphics)

- Source: `https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/csm/CSM.js` (13,863 bytes, scratchpad only). Also needs `csm/CSMFrustum.js` and `csm/CSMShader.js` (imports at lines 10-11). Those two files were not fetched in this pass.
- Licence: MIT.
- Three.js: 0.187.0.
- Architecture: `export class CSM` (line 32), constructor `CSM(data)` (line 39) with `cascades` (default 3), `mode` (`uniform`, `logarithmic`, `practical`, `custom`; default `practical`, line 77), `shadowMapSize` (default 2048, line 85), `lightMargin` (default 200, line 132), `fade` (line 147). Creates one `DirectionalLight` per cascade (line 200-205). `update()` at line 364 recomputes the cascade frustums.
- Cost: one shadow map and one shadow render pass per cascade. The game currently has one `DirectionalLight` with `PCFShadowMap`, so three cascades means three extra depth passes per frame across a 6,675-building scene.
- Classification: **Reusable with minor modifications**. It fits a large scene, where a single shadow map over the whole town blurs near shadows, and it is version-matched. Two sibling files are required, and the facade `onBeforeCompile` shader needs a check to confirm CSM's shadow chunks are injected into the same material.

---

## 19. three r187 `examples/jsm/objects/Sky.js` (graphics)

- Source: `https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/objects/Sky.js` (11,526 bytes, scratchpad only). Commit tag `r187`.
- Licence: MIT.
- Three.js: 0.187.0.
- Architecture: `class Sky extends Mesh` (line 42), a `BoxGeometry` with a `ShaderMaterial`. Uniforms (line 79): `turbidity` 2, `rayleigh` 1, `mieCoefficient` 0.005, `sunPosition`, `up`, `showSunDisc`. This is the Preetham atmospheric scattering model.
- Classification: **Useful only as inspiration**. The game's sky is a stylised flat-colour gradient tied to its `updateEnv` day-night cycle, and the Preetham scattering model would give a realistic gradient that does not match the palette in `research/reports/01-architecture.md`. The `sunPosition` uniform is the useful piece if the day-night cycle is later driven from a sun vector.

---

## 20. liyupi/niulai-game (discovery: melee hit-reaction)

- URL: https://github.com/liyupi/niulai-game. Commit `0a71c5a`. Cloned (1.9 MB).
- Licence: MIT (`LICENSE`, "Copyright (c) 2026 niulai-game contributors").
- Three.js: `^0.170.0` (`package.json`), plain ES modules, `ws` for LAN multiplayer (`server.js`). No bundler.
- Size: 1.9 MB. About 3,900 lines in `src/`.
- Architecture: procedural fighters (no GLB, no Mixamo). `src/model.js` builds animal fighters from primitives and joint keyframes; `src/fighter.js` (573 lines) is a string-state FSM (`idle`, `walk`, `attack`, `special`, `block`, `blockstun`, `hit`, `launch`, `knockdown`, `getup`, `dodge`, `ko`, `win`).
- Most reusable files:
  1. `src/moves.js` line 12: `MOVES` table, frame data (`startup`, `active`, `recovery`), `damage`, `hitstun`, `blockstun`, `knockback`, `launch`, `range`, `hitH`, `hitR`, `canCancel`, and two joint poses (`poseWindup`, `poseStrike`). Comments explain the design (light jab recovers faster than its hitstun, so jabs chain).
  2. `src/combat.js` line 28: `World.tryHit(atk, move, {tick, suck})`. Hurt-capsule overlap (`hurtCapsule`), one hit per attack (`hasHit`), combo counter with `GAME.comboScaling` (`config.js:19`: `[1.0, 0.8, 0.65, 0.52, 0.42, 0.35]`), and hitstop (`combat.js:93`: 0.085 s normal, 0.13 s heavy, 0.045 s for multi-hit ticks, from `config.js:16-17`).
  3. `src/model.js` line 66: `sampleClipInto(clip, time, out)`. Keyframe joint interpolation with `EASE`, cached joint list. Returns a joint-name to `[x,y,z]` map.
  4. `src/model.js` line 103: `buildAttackClip(move)` generates a windup, strike, hold and recovery clip directly from move frame data.
  5. `src/fighter.js` line 365: `case 'hit'` state and its hitstun timer, with `launch`/`knockdown`/`getup` states after it, which is the reaction chain the game's `pipeline/fight.js` lacks (it only has stagger and down).
- Classification: **Reusable with minor modifications**. It is plain three.js, MIT, and the frame-data table plus `tryHit` maps directly onto `pipeline/fight.js` (60 degree arc, 1.1 m reach, 0.45 s cooldown) by replacing the arc test with the capsule test. Joint names differ from the game's `poseAt` parameters, so `sampleClipInto` needs a thin adapter to the game's pose function.

---

## 21. ipenywis/threejs-monster-animation (discovery: Mixamo state machine)

- URL: https://github.com/ipenywis/threejs-monster-animation. Commit `17eb532`. Cloned, then `public/assets/` (226 MB of FBX, GLB, textures) and `.git` removed to meet the 200 MB limit. The code is kept.
- Licence: none (no LICENSE file).
- Three.js: `^0.129.0` (`package.json`), React 17, `react-scripts 4.0.3`, `@react-three/fiber ^7`, `@react-three/drei ^7`.
- Architecture: the classic "Simon Dev" third-person controller pattern. `src/components/finiteStateMachine/index.js` (61 lines) is a name-to-class FSM with `SetState` (line 24), and `src/components/animationStates/index.js` (244 lines) has one class per state (`IdleState`, `WalkState` line 115, `RunState`, `DanceState`, `ButterflyDanceState`). `src/components/basicCharacterController/index.js` (174 lines) loads FBX clips into an `AnimationMixer` (line 50).
- Clips: `public/assets/models/monster/{idle,walk,run,dance,hiphop,butterfly-dance,mutant}.fbx` and the same set for the zombie. Mixamo-style exports.
- Most reusable (idea and pattern, since no licence):
  1. `finiteStateMachine/index.js` line 24: `SetState(name)`, which calls `prevState.Exit()` then `new State(this).Enter(prevState)`, and skips when the name is unchanged.
  2. `animationStates/index.js` `WalkState` (line 115): `curAction.crossFadeFrom(prevAction, 0.5, true)` from the previous state's action.
  3. `basicCharacterController/index.js` line 50: mixer creation and clip-to-action map by name.
- Classification: **Useful only as inspiration**. The repo has no licence, so the pattern is not copyable, but it confirms the approach the game would need for any Mixamo clips. The game has no skeleton today, so the FSM is a design reference for a future upgrade path, not a near-term item.

---

## 22. FelisPimeja/osm-simple3d-editor (discovery: OSM facades)

- URL: https://github.com/FelisPimeja/osm-simple3d-editor. Commit `6acc837`. Cloned (33 MB).
- Licence: ISC (`LICENSE`).
- Three.js: `^0.186.1` (`package.json`). TypeScript, Vite, MapLibre.
- Size: 33 MB. Editor of OSM "Simple 3D Buildings", with an editing session, split and shape tools, validation (`src/edit/validate.ts`, 991 lines), and a JOSM plugin folder.
- Architecture: TypeScript. `src/render/building-geometry.ts` (918 lines) turns footprints and OSM tags into triangles. `src/render/buildings-layer.ts` (8,043 lines) is the MapLibre-integrated layer.
- Most reusable files:
  1. `src/render/building-geometry.ts` line 34: `buildTriangles(polygons, h, tags)`. Walls and roof triangles from polygons with holes, height and roof shape. Quad-roof path for simple footprints (`SUPPORTED_QUAD`).
  2. `src/render/building-geometry.ts` line 850: `shapeOf(ring)`, a roof-shape classifier on the footprint, returning a centroid and label.
  3. `src/render/building-geometry.ts` line 895: `roofShell(roof, thickness)`.
- Dependencies that block a clean copy: `../osm/heights` (`looseLength`, `Heights`), `./skeleton` (roof skeleton), `../i18n`, `./roof-gables`. Four internal modules must come with it.
- Classification: **Reusable with significant modifications**. The triangulation and roof shells are the useful geometry, and the ISC licence allows copying, but the module pulls in the editor's height and skeleton code and TypeScript types, so porting is a real job. The game's existing `buildWorld` extrusion already covers flat-roof buildings; the gain is roof shapes.

---

## 23. Yiping0122/urbangraph-bristol (discovery: OSM city)

- URL: https://github.com/Yiping0122/urbangraph-bristol. Commit `f526955`. Cloned (18 MB, includes `overpass_cache.json` and `osm_map.osm`).
- Licence: MIT (`LICENSE`).
- Three.js: `0.160.0` via unpkg importmap (`extended/index.html:79`). Single HTML page per variant (`original/`, `extended/`), no bundler.
- Architecture: one-file viewer. Building meshes from `THREE.ExtrudeGeometry` with a `shape` built from footprints (`extended/index.html:162`), one mesh per building for picking, height source classes (measured, estimated, synthetic fallback) and a selection panel.
- Most reusable: `extended/index.html` line 154: `build(data)` and its height-source classing. The `building:levels * 3.2 m` estimate and the explicit tag of synthetic-fallback heights are a useful data-honesty pattern for the game's OSM heights.
- Classification: **Useful only as inspiration**. There are no facade details, roof shapes, or per-street styling, so it adds nothing over the game's `buildWorld` beyond the height-source labelling idea.

---

## 24. aditano/Pittsburgh-3D-Recreation (discovery: OSM facade detailing)

- URL: https://github.com/aditano/Pittsburgh-3D-Recreation. Commit `dbe826b`. Cloned (100 MB including 21 MB `public/data`).
- Licence: GPL-3.0 (`LICENSE`, "GNU GENERAL PUBLIC LICENSE, version 3"). Copyleft: copying code into a distributed game makes that game GPL-3.0.
- Three.js: `^0.170.0` (`package.json`), Vite.
- Architecture: procedural city maquette from OSM. `src/architecture.js` (3,002 lines) has the strongest facade detailing among the candidates: `detailTier(footprint, height)` (line 830), `massingProfile(footprint, height, seed)` (line 953, setbacks and massing), `buildArticulatedBuilding` (line 2575), `buildRoofscape` (line 2809), and `createRoofscapeMaterial` (line 2983). `src/textures.js` (1,729 lines) has `createCityMaterials` (line 851) with procedural window and facade canvas textures, and `applyFacadeUVs` (line 1689).
- Classification: **Useful only as inspiration**. The massing and detail-tier logic (`architecture.js:830` and `:953`) is the best facade-detail design found in this pass, but the GPL-3.0 licence means copying code would bind the whole game to GPL. Rewriting the idea (detail tiers chosen by footprint area and height, setback massing) from scratch is clean-room safe.

---

## Final summary table

| repo | area | licence | three version | classification | top file to copy |
|---|---|---|---|---|---|
| liyupi/niulai-game | combat | MIT | ^0.170.0 | Reusable with minor modifications | `src/moves.js` + `src/combat.js` `World.tryHit` (line 28) |
| ZakirG/combat-game-threejs | combat | MIT | ^0.175.0 | Reusable with significant modifications | `client/src/utils/bloodEffect.ts` (line 89) |
| local three-js-fighter-game | combat | own code | ^0.163.0 | Reusable with minor modifications | `src/effects/AttackEffects.ts` (line 96) |
| hmthanh/3d-human-model | characters | none | ^0.133.1 | Not worth using | none |
| Ar9av/human-fight-rl | combat | none | 0.162.0 | Useful only as inspiration | `js/combat.js` `checkAttackHit` (line 31) |
| Science001/threejs-combat | combat | none | vendored, unverified | Not worth using | none |
| aaronbernath143/3D-car-model | vehicles | MIT (code); asset unlicensed | r91 | Not worth using | none |
| needle CarPhysics.ts | vehicles | none found | n/a | Useful only as inspiration | `CarPhysics.ts` `CarWheel.applyPhysics` (line 166) |
| rapier.js vehicle controller | vehicles/physics | Apache-2.0 | n/a | Useful only as inspiration | `ray_cast_vehicle_controller.ts` (line 16) |
| pmndrs/cannon-es RaycastVehicle | vehicles/physics | MIT | n/a | Reusable with significant modifications | `src/objects/RaycastVehicle.ts` `updateFriction` (line 381) |
| jeantimex/threejs-water | water | MIT | ^0.184.0 | Useful only as inspiration | `src/shaders/WaveSimulation.frag` (line 69) |
| baditaflorin/threejs-water-free | water | MIT | >=0.181 (WebGPU) | Not worth using | none |
| VictorZakharov/beautiful-water | water | MIT | 0.185.1 | Useful only as inspiration | `src/scene/waves.js` `sampleOceanSurface` (line 151) |
| three r187 Water.js | water | MIT | 0.187.0 | Reusable with minor modifications | `examples/jsm/objects/Water.js` (line 32) |
| three r187 Water2.js | water | MIT | 0.187.0 | Reusable with minor modifications | `examples/jsm/objects/Water2.js` (line 33) |
| 0beqz/realism-effects | graphics | MIT | peer ^0.151.3 | Not worth using | none |
| N8python/n8ao | graphics | CC0-1.0 | peer >=0.137 | Reusable with minor modifications | `src/N8AOPass.js` (line 38) |
| three r187 GTAOPass.js | graphics | MIT | 0.187.0 | Reusable with minor modifications | `examples/jsm/postprocessing/GTAOPass.js` (line 56) |
| three r187 CSM.js | graphics | MIT | 0.187.0 | Reusable with minor modifications | `examples/jsm/csm/CSM.js` (line 39) |
| three r187 Sky.js | graphics | MIT | 0.187.0 | Useful only as inspiration | `examples/jsm/objects/Sky.js` (line 79) |
| FelisPimeja/osm-simple3d-editor | city geometry | ISC | 0.186.1 | Reusable with significant modifications | `src/render/building-geometry.ts` `buildTriangles` (line 34) |
| Yiping0122/urbangraph-bristol | city | MIT | 0.160.0 | Useful only as inspiration | `extended/index.html` `build()` (line 154) |
| aditano/Pittsburgh-3D-Recreation | city facades | GPL-3.0 | ^0.170.0 | Useful only as inspiration | `src/architecture.js` `detailTier` (line 830), `massingProfile` (line 953) |
| ipenywis/threejs-monster-animation | animation | none | ^0.129.0 | Useful only as inspiration | `src/components/finiteStateMachine/index.js` `SetState` (line 24) |

---

## The 5 most valuable concrete files

1. `research/repositories/discovery/niulai-game/src/moves.js` and `src/combat.js` (`World.tryHit`, line 28). Frame-data move table plus hurt-capsule hit resolution, combo scaling and hitstop. Maps directly onto `pipeline/fight.js`. MIT, plain three.js.
2. Three r187 `examples/jsm/csm/CSM.js` with `CSMFrustum.js` and `CSMShader.js`. Cascaded shadows for the 6,675-building town. Version-matched, MIT. Needs the two sibling files, which were not fetched.
3. `research/repositories/graphics/n8ao/src/N8AOPass.js` (line 38), with `src/compat.js` and `src/PoissionBlur.js`. Screen-space AO that depends only on three.js (CC0-1.0), with a half-resolution mode for the frame budget.
4. `research/repositories/water/` three r187 `Water2.js` (line 33, flow map at line 124). The river-capable option from the official addons, MIT. Costs two extra scene renders, so it should cover only the river.
5. `research/repositories/physics/cannon-es/src/objects/RaycastVehicle.ts`, `updateFriction` (line 381) and `updateSuspension` (line 200). Pure-math suspension and friction for the car model, MIT. Replace `castRay` (line 249) with a sampler against the game's ground and collider grids.

Ideas to keep out of the build: the Pittsburgh facade logic (GPL-3.0), the unlicensed human-fight-rl and monster-animation code, the realism-effects postprocessing stack (three r151 pin), and the Lamborghini asset from the car repo.
