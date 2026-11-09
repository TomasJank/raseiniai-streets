# Fable strategic review of the improvement plan (2026-11-09)

Reviewer: this session (Claude Fable 5.1), after inspecting v38, the build pipeline, the tests, the previous round's plan, and baseline screenshots/fps. Candid by request.

## 1. Critique of the original plan

The brief assumes a conventional modular three.js project (npm, GLTF assets, a physics engine to bolt on) and a game that still needs OSM integration, combat, animals and props. The actual game is different on every one of those points, and several of its "investigate X" items are already done:

- **It is one 5 MB HTML file patched by Python scripts**, not a module tree. There is no npm, no bundler, no asset folder. Every "download a model and load it" plan needs an asset-embedding step that does not exist yet. That is the real prerequisite, and the brief does not mention it.
- **OSM + LiDAR is already the foundation**: 6,675 real footprints, real street names, 412 hand-tuned per-street looks. The buildings section of the brief ("investigate whether we can use OpenStreetMap footprints") is finished work. What remains is facade/roof/detail quality and a handful of landmark models.
- **Combat, animals, props, 15 locally typical cars and a talk/voice system shipped yesterday** (v38, 26 agent tasks, tests green). The brief's "Agent 2 Combat" and "Agent 7 Animals" are upgrades of working systems, not greenfield.
- **The style is stylised low-poly** and coherent. Photoreal Sketchfab humans, PBR car scans and `realism-effects` SSGI would clash and cost fps. The right asset tier is Kenney / Quaternius (CC0, low-poly, rigged, animated), which the brief lists only in passing.
- **The weakest visual element is the people** (box-and-cylinder, no hands, no faces). The brief ranks humans #1; that ranking is correct and the gap is larger than the brief suggests.
- **Physics engine**: the brief asks about Rapier/cannon-es for vehicles and ragdolls. The game has its own grid collision, knockable props, arcade drift and terrain-sampled suspension that all work and are tested. A Rapier world with 6,675 building colliders is a rewrite with no gameplay gain the player would notice. Ragdoll is a "fall" animation clip here.
- **Six agents with one each for Characters and Combat is the wrong split.** Combat improvements are animation clips (punch, kick, block, hit, fall) plus small logic on the existing `fight.js`; they cannot start until characters have skeletons. Running them in parallel produces a combat agent inventing a second animation system.
- **"Clone every repository"** is wasted usage for most of the listed repos (hmthanh/3d-human-model is a Python mesh repo; human-fight-rl is RL training; the two combat demos are small). A bounded Haiku survey with code-level classification is enough; the specialists pull the two or three files worth copying.
- **Worktrees/branches** were impossible: the project was not a git repository. Fixed today (`git init`, scratch ignored). Isolation in this project is per-file ownership + scratchpad builds + noclobber `vNN` copies, which merged 26 parallel tasks yesterday without conflicts. Branch-per-agent adds nothing when files are disjoint; the integrator commits reviewed files.
- **Model policy**: the orchestrator of this session is Fable itself. That is the most expensive possible orchestrator for routine coordination. This review is the Fable task; after this turn the coordination should continue on Opus or Sonnet (`/model opus`). Subagents are launched with explicit `model` so none inherits Fable.

## 2. Recommended changes, with reasons

Essential:
1. **Add an asset pipeline first** (`pipeline/add_assets.py` + `pipeline/assets.js`): embed Draco/meshopt-compressed GLBs as base64 blocks in the HTML, decode at load through `GLTFLoader` from `three/addons` (importmap added today). Budget ≤ 3 MB added for characters. Without this, no downloaded model can ship.
2. **Swap the character renderer behind the existing seam, keep every behaviour.** `pedMesh` is touched in 4 functions and `poseAt` has 4 call sites; `peds[]` state (mode/gait/phase/hp) stays. Near peds (< ~60 m) become SkinnedMesh + AnimationMixer with low-poly rigged CC0 characters that ship with idle/walk/run/punch/kick/hit/fall clips; far peds and the phone path keep the instanced rig as LOD. This is the single largest visual gain available and the only risky one, so it gets Opus.
3. **Merge Characters and Combat into one sequenced owner.** Combat upgrade (kick, block, dodge, knockback, hit reactions, better opponent AI) is wave 2 on the same files once clips exist. No separate combat agent in wave 1.
4. **Graphics and water are one agent.** Both touch the renderer, `ENV`, sky, fog and the water material. Scope: shadows (PCFSoft/CSM), ambient occlusion (`GTAOPass` or N8AO), `Sky`/env lighting, `three/addons/objects/Water.js` on lake and river, measured one at a time with `fps.mjs` (Metal). Colour management (`sRGB` output + tone mapping) is an experiment to report, not to ship blind: the whole palette was tuned under linear output.
5. **Buildings stay procedural.** No city asset packs (they cannot match real footprints). Upgrade the facade atlas with CC0 textures (silicate brick, plaster, Soviet panel, timber, corrugated roofs), add instanced balconies/chimneys/dormers, and give 3-5 landmarks (church, culture house, Maxima) real geometry.
6. **Vehicles: feel and sound, not a physics engine.** Procedural cars look right in this style and 15 were just authored. Add body suspension (accel/brake pitch, roll, curb bounce), engine/tyre/collision audio, headlight cones, damage visuals. A one-page Rapier prototype answers the brief's question with evidence instead of a rewrite.
7. **No Fable beyond this review.** Opus for the character seam and for one integration review; Sonnet for everything else; Haiku for the asset/licence catalogue and the repository survey.

Optional:
- Animals: swap to Quaternius animal GLBs through the same asset pipeline (wave 2, Sonnet).
- Sound pass (Kenney/freesound CC0) once the vehicle agent defines the audio hooks.
- Street props from Kenney city kit where the 455 procedural props look weak.

## 3. Revised agent structure and models

| Wave | Agent | Model | Owns (new files only) | Done when |
|---|---|---|---|---|
| 1 | chars: asset pipeline + character renderer | Opus | `pipeline/assets.js`, `add_assets.py`, `chars.js`, `add_chars.py`, `work/test_chars.mjs`, `research/{assets,prototypes}/characters/` | prototype measured; near peds + player are rigged GLB characters; all existing tests pass; ≥ 55 fps |
| 1 | gfx: graphics + water | Sonnet | `pipeline/gfx.js`, `add_gfx.py`, `water2.js`, `add_water2.py`, `work/test_gfx.mjs`, `research/prototypes/{graphics,water}/` | each effect measured; only ≥ 55 fps keepers shipped; views diff reviewed |
| 1 | bld: facades + landmarks | Sonnet | `pipeline/facades.js`, `add_facades.py`, `work/test_facades.mjs`, `research/assets/textures/`, `research/prototypes/buildings/` | atlas upgraded, details instanced, landmarks built, no LOOK id of a street file changed |
| 1 | drive: vehicle feel + audio | Sonnet | `pipeline/drive.js`, `add_drive.py`, `work/test_drive.mjs`, `research/prototypes/vehicles/` | suspension/audio/lights shipped; Rapier note written |
| 1 | catalog: assets + licences | Haiku | `research/assets/*` (except characters/textures), `research/reports/asset-catalog.md`, `license-report.md` | CC0 packs downloaded with SOURCE.md; licence table complete |
| 1 | survey: repositories | Haiku | `research/repositories/`, `research/reports/repositories.md` | every listed repo classified at code level with the files worth copying named |
| 2 | combat upgrade | Sonnet | `pipeline/fight2.js`, `add_fight2.py`, `work/test_fight2.mjs` | kick/block/dodge/knockback/AI on the new clips; test_fight still green |
| 2 | animals GLB swap | Sonnet | `pipeline/animals2.js`, `add_animals2.py` | species on GLB rigs, tests green |
| each batch | integration | Sonnet (Opus for the chars merge) | `build.sh` order, `work/build/vNN.html`, commits | build twice + cmp, full suite, fps, views diff, noclobber copy, peers messaged |

Wave 1 = 6 agents (1 Opus, 3 Sonnet, 2 Haiku). The orchestrator stays on this session for launch and acceptance; routine coordination should move to Opus/Sonnet.

## 4. Revised launch sequence and dependencies

1. (done) Inspect, baseline (60 fps / 4 s load / screenshots), `git init`, importmap step, research skeleton.
2. (now) Launch all six wave-1 agents. They are independent: disjoint files, disjoint anchors (chars: `function poseAt`/`hidePed`/`dress` + a new block before `function buildExtra(){`; gfx: renderer setup, `updateEnv`, `waterMat`; bld: `facadeShader`, atlas canvas, `STY`, a `buildLandmarks()` called from `buildExtra`; drive: `syncCar`, `driveCar` audio hooks). Each builds in the scratchpad and never edits v37/v38, `build.sh`, or another agent's files.
3. Integrate in `build.sh` order `importmap cars solid talk fight people2 animals streets voice assets chars facades gfx water2 drive` as each agent reports: build twice, cmp, full `test_*.mjs`, `fps.mjs`, `views.mjs` + `imgdiff.mjs`, then noclobber copy to the next `vNN`, commit, message peers.
4. Wave 2 (combat upgrade, animals GLB) starts only after `chars` is merged, because both consume `assets.js` and the clip names.

## 5. Essential vs optional

Essential: asset pipeline; character swap behind the seam; combat sequenced after characters; measured graphics; procedural buildings kept; no physics-engine rewrite; explicit subagent models; integration gate per batch.
Optional: animals GLB swap, sound pass, Kenney props, colour-management change (only if a palette retune is accepted), Rapier prototype beyond the one-page note.

## Rejected from the brief (with reason)
- Rapier/cannon-es for the world or vehicles: rewrite without visible gain; existing collision is tested and knockable.
- `0beqz/realism-effects` (SSGI/SSR/TRAA): heavy, style mismatch, N8AO/GTAO give the ambient-occlusion win at a fraction of the cost.
- Mixamo as the primary source: licence allows use in games but the FBX → GLB retarget pipeline needs Blender; Quaternius/Kenney ship GLB with clips already. Mixamo stays the fallback for a missing clip.
- Replacing procedural cars with GLB cars: the 15 just-authored models are in style and parametrised; GLB packs (Kenney car kit) are chunkier and would need re-rigging to the existing wheel/light/damage hooks.
- Sketchfab/BlenderKit downloads: licences vary per asset and most are photoreal; flagged, not used by default.
