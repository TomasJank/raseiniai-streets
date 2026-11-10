# fix-people: faces, clothing fit and the car-hit tumble on the mannequins (2026-11-09)

Step `fixpeople`: `pipeline/fix_people.js` + `pipeline/add_fixpeople.py`, appended last in `build.sh`, after `cars2` and `fixgfx`
(`build.sh` in the tree stops at `fight2`; the step only needs `chars` to be present and asserts it). No existing pipeline file is edited:
`charInit`, `charMake`, `charPose` and `charAnim` are wrapped (names `fx*0`; `charAnim0` already exists in v41, so mine are `fxAnim0` etc.).
The only anchor is `// ---------- boot ----------` (count 1 in v41). No GLB change, no new asset. Test build: `work/build/v41.html` + the patcher.

## Defects, with evidence (before = v41, `research/prototypes/characters/fix/defects_a.png`, `defects_b.png`, `std_before.png`)

1. **No faces.** Head is a blank egg, both bodies.
2. **Hat, cap, scarf, pack, hair carried by the wrong amount.** Offsets were measured against the old 1.76 m rig's head and torso, but the
   mannequin head is taller and deeper (Head-local bbox m: x ±0.087, y -0.014..0.259, z -0.123..0.110; f: z -0.095..0.121):
   - `long` hair is a flat brown plank standing above the crown (`std_before` long_back), the ponytail floats on top of the head.
   - Backpack is a square slab detached from the back, parked mid-air (before_pack_back.png).
   - Hat/cap sit too high or too low depending on the part (hat towers ~0.1 m over the skull, cap brim at brow level).
3. **Coat and skirt are old-rig cylinders** (r 0.19-0.25, 0.42 long): short, narrow at the hip, so the thighs poke through the back and
   sides every stride (coat_back before: dark leg patch through the hem).
4. **Sleeves.** The whole upper arm is shirt colour down to the elbow with a hard seam, so every warm-weather T-shirt is a 3/4 sleeve.
5. **Kids** are adult bodies scaled by 0.55-0.7: adult head-to-body ratio, the "small adult" look.
6. **Elderly** use the adult clips upright; the old rig's stoop was dropped.
7. **Car hit** (below): upright body, lifted 0.15 m, wrong facing, then a snap into `death`.

Checked and fine (no change): region to colour mapping (hands, fingers, neck, head skin; spine, clavicle, upper arm shirt; thigh and pelvis
trousers; calf shin; foot, ball shoe), shoe colour, neck/head skin match. `test_fixpeople.regionColours` asserts every vertex of both
bodies by dominant bone (100%). The mannequin's heavy deltoids and chest are the mesh itself; not changed.

## Fixes

| # | Fix | Where |
|---|---|---|
| 1 | Face decal: one ellipsoid patch per body (dims measured from the head vertices), +4 mm outside the skull, child of the `Head` bone, so it survives clip changes. Features (eyes with white and highlight, brows, mouth, nose shade; lashes + red lip for `f`; large low eyes for kids; grey brows and lines for the old) drawn in head-local metres onto a 256 px canvas through the inverse sphere mapping, so they are not distorted. 6 shared materials (kind x body, `alphaTest`). Skin tone comes from the head vertex colour (`look`), so it matches the neck; hair region untouched. | `fxMake`, `faceTex` |
| 2 | Gear refit: a per-option `[sx,sy,sz,dx,dy,dz]` applied once to `CHAR.off[body][k]` after `charInit` (zero per-frame cost). hat/cap lowered and slimmed, long hair re-placed against the skull, ponytail lengthened, pack moved onto the back, scarf scaled, coat to the knee and 1.5x wider, skirt wider. | `FIX.fit`, `charFit` |
| 3 | Short sleeves: upper-arm vertices past 55% of the way to the elbow move to the forearm region (shirt colour when long sleeved/coat, skin when `fore` is skin). | `charInit` wrapper |
| 4 | Kid head x1.32 (Head bone scale; hats follow). | `charAnim` wrapper |
| 5 | Elderly stoop: `spine_01` +0.10 rad, `spine_02` +0.12 rad about the body's lateral axis (not while down/sitting/cowering). | `charAnim` wrapper |
| 6 | Car-hit tumble (see below). | `charPose`, `charAnim` wrappers |

Gotcha found on the way: the three.js mixer writes a bone only when its animated value changed, so a bone tilted after the mixer is never
reset (first stoop attempt accumulated to ~50 degrees). The wrapper restores tilted bones to their pre-tilt quaternion before the next mixer update.

## Car hit: "they fall weird"

Probe: the `dodge+hit` pattern from `work/playtest.mjs`, walker 1.2 m ahead of the car at 14 m/s, 16 frames at 33 ms, camera from the side
(`hit_before.png`, `hit_after.png`).

Before (frame: mode / clip / pelvis pitch from vertical / root above ground+surface): the body stays upright (6-17 degrees) the whole slide,
lifted 0.15 m by `p.hop` (root 0.27 m up, 0.12 of it is kerb surface), faces the way it was walking, then the held `death` clip is just there.
`knockback` is unused. After `runOver` the game slides the ped at 55% of car speed with exponential drag for 3.2 s.

After: on a hit (`p.mode==='down'`, knock speed above 2.5 m/s) the yaw is latched to face the car (so `death`'s fall-backwards runs along the
knock velocity), the hop lift is dropped (root stays on `GY + surf`), and the pelvis bone is pitched back about the body's lateral axis:
0 to 1.65 rad in 0.28 s (smoothstep), held to 0.55 s, eased out by 1.25 s while `death` brings the body to the ground. Pelvis pitch per frame
(33 ms): 6, 45, 77, 81, 83, 86, 90, 90, 87, 85, 86, 96, 100, 90, 81, 79 degrees; pelvis height 0.96 m falling to 0.17 m. `getup` and the walk-off
are unchanged (clips `death`, `getup`, `walk`; modes `down`, `walk`). The player's own `pDown` and ped-fight KOs (no knock velocity) are untouched.
Not done: `knockback` clip (the procedural flip replaces it), and the body still slides through the car's volume for a few frames because the game
moves the ped at about half the car's speed; that is `runOver`'s physics, not the mannequin.

## Before / after

`research/prototypes/characters/fix/`: `std_before.png` vs `std_after.png` (22 matched close-ups: adult m/f front/side/back, kid, old with stick,
hat, cap, coat, skirt, long hair, ponytail, pack, bag, scarf, talking), `faces_after.png`, `gear_fit_after.png`, `hit_before.png` vs `hit_after.png`,
`defects_a/b.png`. The seated case: the harness could not seat a person without a bench in view (`sit` tile shows people walking); the
seated pose is the unchanged clip and gear follow `spine_03`/`pelvis` as in the others, not separately verified visually.
Limitations: faces are decals on an ellipsoid (flat-shaded features, no expression change), kid limb proportions are adult, the mannequin's
muscular torso reads as a bodysuit under thin shirts.

## Tests (SwiftShader unless noted; build = v41 + `add_fixpeople.py`)

`node work/test_fixpeople.mjs page.html`
```
faceOnEveryMannequin {"ok":true,"mannequins":12,"bad":[]}          face is a child of Head, dot(face forward, body forward) >= 0.85
regionColours        {"ok":true, ... every hand/finger/neck vertex region 0, spine 1, thigh 3, calf 4, foot 5 on both bodies; rc skin/shirt/legs/shoe == dress() colours}
gearNearItsBone      {"ok":true,"maxDist":{"long":0.126,"skirt":0.121,"hat":0.244,"pack":0.03,"bag":0.187,"coat":0.197,"scarf":0.143,"tail":0.169,"stick":0.031}}
carHitTumble         {"ok":true,"pitchWithin04s":85,"maxPitch":100,"rootDyFromGround":0,"clips":["death","getup","walk"],"modes":["down","walk"]}
drawCalls            {"ok":true,"calls":691,"glb":11}
errors [] / PASS
```
Gear distance is bbox centre to carrying bone, per bone world scale; the stick is measured at its grip end (a 0.88 m pole hung from the hand
has its centre 0.44 m away by construction).
Other suites on the same build: `test_chars` PASS (one earlier run failed `nearUseGlbFarDoNot` with a far ped that had wandered to 46 m;
the test places it at 120 m and the game moves it; the rerun passed), `test_people2` all passed, `test_fight` PASS.

## Performance

| | v41 | v41 + fixpeople |
|---|---|---|
| `work/fps.mjs` Metal | 60.3 fps, 496 MB heap | 60.3 fps, 289 MB heap (heap figures are noisy run to run) |
| draw calls, test_chars scene, 24 mannequins | 683 | 710 (+1 face mesh per mannequin, +3 noise) |
| `charsMs` (test_chars frameTime) | 0.13 | 0.17 |
| HTML | 5,911,209 B | + ~9 KB |

## Integration

Add `fixpeople` last: `... fight2 cars2 fixgfx fixpeople` (`python3 add_fixpeople.py "$out"`). Needs `chars`. Add `work/test_fixpeople.mjs` to the suite.
