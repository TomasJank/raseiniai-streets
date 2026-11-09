# Raseiniai Streets: architecture overview (2026-11-09, v38)

## Shape
- One HTML file, `work/build/v38.html` (4.98 MB, 5,679 lines). Three blocks: `rasData` JSON (2.3 MB: OSM ways, LiDAR DEM), `rasVoice` JSON (2 MB: 378 TTS clips), one `<script type="module">` IIFE.
- three.js **0.187.0** as an ES module from jsdelivr. No bundler, no npm, no TypeScript. Addons were not used before this round; `pipeline/add_importmap.py` (new, first build step) maps `three` and `three/addons/` so `examples/jsm` modules can be imported.
- Not a git repo until today. `git init` done 2026-11-09 with v37/v38, pipeline, tests, research tracked; `work/*` scratch ignored.

## Build pipeline (the real source tree)
- `work/build/v37.html` is the frozen base. `sh pipeline/build.sh out.html` = v37 + `add_{importmap,cars,solid,talk,fight,people2,animals,streets,voice}.py`.
- Each `add_X.py` splices JS (usually a sibling `X.js` or `X/*.js`) into the HTML with `rep(old,new)` guarded by `assert h.count(old)==1`. Anchors are unique strings such as `function buildExtra(){`, `function drawMini(){`, `updateFalling(dt);updateDebris(dt);`.
- Build is deterministic (two builds byte-identical) and takes 1.6 s.

## World
- `buildWorld(ways,meta)`: equirectangular projection around the building bbox, LiDAR DEM draping (`GY`), 6,675 OSM building footprints extruded with per-building `LOOK` (wall/roof colour, style, floors), 8,289 ways → roads/paths/green/water merged into a few big BufferGeometries. Spatial grids (16 m segments, 32 m buildings, 30 m street names).
- Facades: `MeshLambertMaterial` + `onBeforeCompile` (`facadeShader`) sampling a 16-style × 2-row canvas atlas by a per-vertex `sty` attribute; night windows and snow via `ENV` uniforms. 412 per-street looks from `pipeline/streets/*.json`.
- Water: one `MeshPhongMaterial` (vertexColors, onBeforeCompile ripple) on the merged water geometry. No reflection/refraction.

## Rendering
- `WebGLRenderer({antialias:!PHONE})`, `outputColorSpace=LinearSRGBColorSpace` (no sRGB encode, no tone mapping; the palette was tuned this way), `PCFShadowMap`, one `DirectionalLight` sun + one `HemisphereLight`, `Fog`. Materials: 52 Lambert, 21 Basic, 5 Phong, 0 Standard/Physical. No post-processing, no env maps.
- Day/night: `tod` (1 game hour = 40 s), `updateEnv` drives sky, sun, lamps, window glow, weather (`rain`, `snow`, `wxRules`).
- Perf: `perfTick` does tree LOD (3 levels), hides cars > 400 m, adaptive pixel ratio on phones only. **Baseline on this Mac (M5 Pro, Metal ANGLE, 1280×720): 60 fps vsync-capped, 4.0 s cold load (1.0 s warm), 256 MB JS heap.** SwiftShader (the test harness): 1.3 fps, 12 s load.

## Characters
- 42 pedestrians + player + fare as **19-27 InstancedMesh parts** (`PARTS`, `pedMesh`), posed analytically by `poseAt(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act)` every frame. Colours per instance via `dress`. No skeletons, no AnimationMixer, no GLTF.
- `pedMesh` is touched in exactly four places: `dress`, `hidePed`, `poseAt`, and the `instanceMatrix.needsUpdate` flush. `poseAt` has 4 call sites (peds loop, fare, player). **This is the seam: the renderer can be swapped under `poseAt/hidePed/dress` without touching behaviour.**
- Behaviour lives on plain `peds[]` records (`mode`, `gait`, `phase`, `hp`, `grp`, `lead`, `age`...): walk/idle/sit/talk/flee/cower/watch/fight/stagger/down/hide. Dialogue (`TALKS`, `pickTalk`, bubbles, TTS clips), groups, kids with leads, elderly.

## Combat (v1, shipped in v38)
- `pipeline/fight.js` (131 lines): KeyX / mouse / touch HIT, 60° arc, 1.1 m reach, .45 s cooldown, per-ped `hp` 3-6, stagger → down → flee; young males and group mates fight back; witnesses `watch`, heat after 8 s with a witness; two bouncers at L klubas. `work/test_fight.mjs` (13 assertions) passes. No kick, block, dodge, knockback distance, ragdoll, or animation beyond arm-swing poses.

## Vehicles
- Procedural lofted bodies: `buildCar(M,lot)` with 23 model tables in `pipeline/cars/*.js`. Parked cars instanced, traffic cars are Groups of ~9 meshes.
- `driveCar`: arcade model with surface grip table `SURF`, handbrake drift, damage (`hp`) pulling steering, sinking in water. `syncCar` samples terrain at 4 points for pitch/roll, spins wheels by distance, steers front wheels. Collision: 8 m `props` grid + `walls` segment grid + building polygons; knockable poles/signals/signs fall (`add_solid.py`). Police chase, theft, missions, races exist.

## Animals (v1, shipped in v38)
- Shared instanced quadruped rig (8 parts × 24), bird rig, bat points; 11 species in `pipeline/animals/*.js` with day/night schedules and consequences.

## Audio
- Web Audio synth (`burst`, thuds, engine), 378 embedded TTS clips for dialogue (`voice.py`, optional edge-tts).

## Tests
- `work/test_*.mjs`: Playwright (resolved from career-ops' node_modules) + SwiftShader; each injects `window.__t` before `function drawMini(){`, writes `_x.html` next to itself, prints JSON per check, `PASS`/fails list. Copy them to the scratchpad before running. `views.mjs` renders 7 fixed reference views (peds/traffic hidden) for `imgdiff.mjs`. New this round: `work/fps.mjs` (Metal GPU fps + load time).

## Style direction (observed)
Stylised low-poly: flat-coloured facades, faceted trees, lofted cars, box-and-cylinder people. Coherent and readable. The weakest element by far is the people; the strongest is the real town layout and per-street detail. Any imported asset must sit in this style (Kenney / Quaternius tier), not photoreal Sketchfab scans.
