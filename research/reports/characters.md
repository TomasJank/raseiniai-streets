# Characters: rigged GLB people behind the poseAt seam (2026-11-09)

Owner: chars agent (Opus). Status: steps `assets` and `chars` ready to integrate; all tests listed below pass on the scratch build.

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

RESULTS_PLACEHOLDER
