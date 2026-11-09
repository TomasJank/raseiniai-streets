# Characters: rigged GLB people behind the poseAt seam (2026-11-09)

Owner: chars agent (Opus). Status: steps `assets` and `chars` ready to integrate. test_chars, test_fight, test_people2, test_solid and test_animals pass; test_talk is flaky on base and on this build alike (see Test results).

## What was downloaded

| Pack | Author | Licence | Used for |
|---|---|---|---|
| Universal Animation Library (Standard), opengameart.org/content/universal-animation-library | Quaternius | zip says CC0 1.0; treated as **Quaternius Asset License v1.0** per orchestrator ruling | 18 clips |
| Universal Animation Library 2 (Standard) incl. Female Mannequin, opengameart.org/content/universal-animation-library-2 | Quaternius | same | male + female body, 6 clips |
| Ultimate Animated Character Pack (2019) | Quaternius | same | not used: chibi heads, FBX only |

Details, hashes and modifications: `research/assets/characters/SOURCE.md`. QAL allows embedding in the shipped HTML; it forbids
redistributing the files as assets, so the GLBs stay out of git and `research/assets/characters/build.mjs` regenerates them.

Why these: one skeleton (UE-style, 65 joints) shared by a male and a female mannequin and ~90 clips, realistic proportions
(the old rig is 1.76 m with a 0.2 m head, so chibi packs pop at the LOD switch), and clips the game needs (talk, phone, sit,
get-up from lying, hits, punches, crouch) that no other free pack had together. The mannequins have no clothes, so clothes
come from the game: each vertex gets a region from its heaviest bone (skin, shirt, forearm, legs, shin, shoe, hair) and the
material colours regions from the person's existing `dress()` colours. Hats, caps, long hair, ponytails, backpacks, bags,
scarves, coats, skirts and sticks are the existing instanced gear parts, now carried by the mannequin's bones. So variety is
the same as before (every look the game rolls), on two bodies, scaled by `look.s` (kids 0.55-0.7).

## Budgets

| | Target | Actual |
|---|---|---|
| per character GLB | ≤ 150 KB | body_m 54 KB, body_f 54 KB (4.9k / 5.0k tris, from 13.7k / 14.6k) |
| shared clips | ≤ 400 KB | 224 KB (24 clips) |
| added to the HTML | ≤ 3 MB | 442 KB base64 + 9 KB JS |

## Seam design

- `pipeline/assets.js` (`add_assets.py`): `ASSETS.load(name)` → `Promise<gltf>` (GLTFLoader.parseAsync on the base64 block,
  meshopt decoder from `three/addons`, cached), `ASSETS.clone(obj)` (SkeletonUtils.clone), `ASSETS.has(name)`. Addons are
  imported dynamically, so nothing blocks the world or the loader screen. Manifest: `pipeline/assets/manifest.json`
  (`{name: path from repo root}`), embedded sorted by name; build is byte-identical twice.
- `pipeline/chars.js` (`add_chars.py`), five one-line hooks on anchors owned by this step:
  - `dress(i,cols)` → `charCols(i,cols)` records the colours per instance.
  - `hidePed(i)` → `charHide(i)` hides that person's mannequin.
  - top of `poseAt(...)` → `if(charPose(...))return;` for a person with a mannequin: place it (x, ground, z, yaw `h`,
    scale `look.s`), read mode/gait/phase/act, park the instanced body, skip the instanced pose.
  - before the `pedMesh` flush → `charTick()`: picks who gets a mannequin for the next frame (nearest within 60 m of the
    camera, kept until 70 m, at most 24 incl. the player), runs every mixer, poses the gear parts and phones from bones.
  - the JS block before `function buildExtra(){`.
- Behaviour, `peds[]`, fight.js, talk, people2: untouched. The fare (it waves to hail the taxi; no clip waves) and anyone
  beyond 60-70 m stay on the instanced rig (LOD). Assets decode after the world shows (first `updatePeople` with a world);
  until then everyone is instanced, then the near crowd pops to mannequins.
- Mannequins are children of `pedMesh[1]` (identity transform), so anything that hides the crowd (views.mjs) hides them.
- The instanced body of a mannequin person is parked 10 km below ground rather than scaled to zero. Hidden either way;
  this keeps `test_people2`'s "every active ped renders" per-part check meaningful without editing that test. If that test is
  ever revised to know about `CHAR.use`, the park can become `ZERO_M`.
- Clip time is driven, not free-running: walk and jog take their time from the game's own stride phase (`p.phase` /
  `player.walk`), so the step rhythm is the one behaviour already computes; one-shots and holds keep their own clocks.
  Weights cross-fade at 12/s and always sum to 1 (no bind-pose bleed); a mannequin that just appeared snaps to its pose.

## Clip map (names in `clips.glb`, stable for wave 2)

| Game clip | Source clip | Used when |
|---|---|---|
| `idle` | UAL1 Idle_Loop | gait < 0.1, nothing else applies |
| `walk` | UAL1 Walk_Loop | gait 0.1-0.6, time from stride phase |
| `jog` | UAL1 Jog_Fwd_Loop | gait 0.6-0.85+ (cross-faded with walk), flee, player run |
| `sprint` | UAL1 Sprint_Loop | shipped, unused |
| `talk` | UAL1 Idle_Talking_Loop | `talk` and this person is the group's speaker |
| `fold` | UAL2 Idle_FoldArms_Loop | listener with `pr < .3` (old rig crossed arms), `watch` without a phone |
| `phone` | UAL2 Idle_TalkingPhone_Loop | standing still with `act.phone` (idle/stop/wait), `watch` filming |
| `yes`, `no` | UAL2 Yes, Idle_No_Loop | shipped, unused (listener nods are a wave-2 nicety) |
| `sit_in` → `sit` / `sit_talk` | UAL1 Sitting_Enter, Sitting_Idle_Loop, Sitting_Talking_Loop | entering / in `sit` |
| `sit_out` | UAL1 Sitting_Exit | shipped, unused (people stand and walk off in one frame) |
| `guard` (held) | UAL1 Punch_Enter | `fight` standing; player for 4 s after any fight event |
| `jab` / `cross` (alternating) | UAL1 Punch_Jab / Punch_Cross | new `p.swing` (peds), new `fight.anim` (player punch) |
| `hook` | UAL2 Melee_Hook | **kick stand-in**: no kick exists in the free UAL packs |
| `hit_chest` | UAL1 Hit_Chest | ped enters `stagger` |
| `hit_head` | UAL1 Hit_Head | player `fight.pStag > 0` |
| `knockback` | UAL2 Hit_Knockback | shipped, unused (wave 2: knockback distance) |
| `death` (held on last frame) | UAL1 Death01 | `down` (ped), `fight.pDown > 0` (player) |
| `getup` | UAL2 LayToIdle (×1.4 speed) | leaving `down` |
| `crouch` | UAL1 Crouch_Idle_Loop | `cower` |
| `crouch_walk` | UAL1 Crouch_Fwd_Loop | shipped, unused |

Bones a gameplay system can rely on (per mannequin, `CHAR.list[i].bone`): `root pelvis spine_01 spine_02 spine_03 neck_01 Head
clavicle_l/r upperarm_l/r lowerarm_l/r hand_l/r thigh_l/r calf_l/r foot_l/r ball_l/r` (fingers exist but are not animated).
Each mannequin record also exposes `clip` (dominant clip name), `one` (running one-shot), `mx` (AnimationMixer), `act[name]`.
A wave-2 combat step can trigger a one-shot with `charOne(CHAR.list[i],'hook')`.

## Files added

- `pipeline/assets.js`, `pipeline/add_assets.py`, `pipeline/assets/manifest.json`
- `pipeline/chars.js`, `pipeline/add_chars.py`
- `work/test_chars.mjs`
- `research/assets/characters/{build.mjs,SOURCE.md}` (+ `body_m.glb body_f.glb clips.glb`, gitignored, rebuildable)
- `research/prototypes/characters/index.html`, `research/prototypes/characters/shots/*.png`
- this report

## Test results (scratch build = `build.sh` incl. facades + `add_assets.py` + `add_chars.py`; two builds byte-identical)

`node work/test_chars.mjs` (SwiftShader):
```
setup {"ok":true}
assetsDecode {"ok":true,"afterMs":9}
skinnedVisible {"ok":true,"visible":9,"player":true}
nearUseGlbFarDoNot {"ok":true,"near":[true,true,true,true,true,true,true,true,true,true],"far":[false,false,false,false],"farDist":[120,125,130,135]}
clipSwitches {"ok":true,"seq":["idle","walk","death","getup","jog","walk"],"downMode":"down","final":"walk"}
playerPunchClip {"ok":true,"before":"idle","after":"jab"}
frameTime {"ok":true,"updatePeopleMs":0.3,"charsMs":0.15,"glb":24}
noNaN {"ok":true,"chars":24,"badBones":0,"badInstanced":0}
drawCalls {"ok":true,"calls":1403,"glb":24}
errors []
PASS
```
`frameTime` is updatePeople including 24 mixers and gear posing (0.15 ms of it is `charTick`), on the SwiftShader page.

Existing tests on the same build: `test_fight` PASS · `test_people2` all passed · `test_solid` all passed · `test_animals` PASS ·
`test_talk` 1-4 failed per run. `test_talk` is flaky on the base build too (5 base runs: all passed / 1 / 1 / 1 / 1 failed;
the failures are "4 nearby groups all get a bubble" and "talk 95-130 m ... i:-1, mem:1", a group made by `talkAt` that loses
a member on its first step). Math.random is unseeded, and every `Object3D`/material the mannequins create draws a UUID from
it, so the random sequence differs between builds; chars.js does not touch any behaviour state. Worth seeding or hardening
`talkAt` (it can pick a kid without its guard, which people2 hides at once).

## Performance (Metal, M5 Pro, 1280×720)

| | base (build.sh) | + assets + chars |
|---|---|---|
| `work/fps.mjs` fps | 60.3 | 60.3 |
| `fps.mjs` load (warm, alternating runs) | 1106 / 1071 ms | 1050 / 1104 ms |
| JS heap | 272 MB | 289 MB (+17) |
| on foot, street (scratch `fps2.mjs`) | 60.3 fps, 753 calls | 60.3 fps, 759 calls, 12 mannequins |
| on foot, 40 people forced within 30 m | 60.3 fps, 754 calls, worst frame 18.5 ms | 60.3 fps, 784 calls, 24 mannequins, worst 18.7 ms |
| HTML size | 5,007,223 B | 5,471,985 B (+454 KB) |

Cold load is unchanged by construction: nothing awaits the assets; they decode after the first `updatePeople` with a world.
Prototype (`research/prototypes/characters/index.html`, 42 skinned mannequins, no LOD): 60.3 fps Metal, 85 draw calls, 417k tris.

`views.mjs` before/after: identical to the base-vs-base noise floor (people are hidden in those views, and the mannequins
are children of `pedMesh[1]`, so they hide with them). Shots: `research/prototypes/characters/shots/` (prototype clips,
`game_*` in-town close-ups, `views_before_*`/`views_after_*`).

## Limitations

- Two bodies (male, female mannequin), not 6-10 authored characters: variety comes from the game's own looks (colours by
  region, hair, all gear parts, `look.s`). Faces are blank, as before. Kids are the adult bodies scaled by `look.s`.
- No kick clip in the free UAL packs (UAL Pro has more, paid): `hook` (Melee_Hook) is the stand-in. No wave clip: the taxi
  fare stays on the instanced rig. No elderly stoop: old people use the same clips (their stick is carried by `hand_r`).
- Head yaw (`yaw`, people looking at things) and `fall` tilt are ignored on mannequins; clips carry lying down and staggering.
- Feet slide a little: stride timing follows the game's phase, stride length is the clip's.
- Getting up plays while behaviour already moves the person (flee starts the same frame `down` ends).
- The old rig's per-part instance matrices are parked 10 km down for mannequin people (see Seam design).
- Phone: shown in `hand_r` whenever `act.phone`; the `phone` clip holds it to the ear, the old rig held it in front.

## Integration notes

1. `build.sh` steps, after `voice`: `... voice assets chars ...` (`assets` must precede `chars`; `add_chars.py` asserts it).
   No anchor overlaps with `facades` (it inserts into `buildStadium();buildTown();`, chars into `function buildExtra(){`), so
   `voice assets chars facades` and `voice facades assets chars` both build; tested with facades in `build.sh`.
2. **Blocker for a clean clone:** `pipeline/assets/manifest.json` points at `research/assets/characters/*.glb`, which
   `.gitignore` excludes (`research/assets/**/*.glb`, the QAL ruling). A fresh checkout cannot build until the GLBs are
   regenerated with `research/assets/characters/build.mjs` (needs the two zips + npm packages, see SOURCE.md). Options:
   keep it that way and document it, or keep the three processed GLBs (331 KB) in a private, non-public location the build
   reads. The integrator's call; nothing in my files assumes either.
3. Add `work/test_chars.mjs` to the suite. It needs network for the three addon modules from jsdelivr, like three itself.
4. For wave 2 (combat): clip names above are stable; trigger a one-shot with `charOne(CHAR.list[i],'hook')`; each
   mannequin's bones are in `CHAR.list[i].bone`; `CHAR.use[i]` says whether person `i` is a mannequin this frame.
