# jump: Space on foot (2026-11-11)

Owner's request: "zmogeliukas turetu tureti opcija pasokti i ora ir persokti mazus objektus, su space sokam". Step `jump`, appended after `fixmoney`.

Files: `pipeline/jump.js`, `pipeline/add_jump.py`, `work/test_jump.mjs`, pictures in `research/prototypes/characters/jump/`.

## What it does
- On foot, Space (or the new touch button JUMP) gives a crouch of 0.07 s, then a take-off with gravity, a tucked flight and a landing dip of 0.16 s. In a car, Space does nothing new: `press('Space')` falls through to the old path and the handbrake still reads `KEY.Space`.
- The forward speed at take-off carries through the air. Steering in the air runs at 0.8 rad/s, against 2.8 on the ground. W/S input is ignored until he lands. If something stops him mid-air, the carried speed drops to what he actually moved, so he does not keep pushing into the obstacle.
- He can't jump in a car, while knocked down (`fight.pDown`), staggered, mid-attack or in its recovery (`cmb.mv`), blocking, dodging, during the mannequin's `getup` clip, in any water (`inWater`), or while drowning. There is no double jump. The key-repeat guard is the game's own.
- Water: water3's outer `walk` wrapper still runs every frame, so if he comes down over deep water the same drowning sequence starts. A jump that is already in progress is cancelled once `fight.pDown`/`w3Foot` is set.
- The camera follows `player.x/z` and the ground height, as before. The hop never reaches it (the test checks that the chase camera's Y is unchanged mid-air).
- Sound: a short bandpass noise and a rising triangle on take-off, a lowpass thud and a falling sine on landing. Both use `burst`/`tone`.
- Controls list: a new line, "Space: On foot: jump, clears low things like benches, bins and bollards". The touch JUMP button sits left of HIT (`right +192px, bottom 98px`) and uses the HIT button's pattern (`data-press`).

## Numbers
Clearance means the height of his feet, not his hips: the body lift `y` plus 0.39 m from the tucked legs (`feet = y + .39*min(1, y/.35)`). The 0.39 m is the hip-to-foot shortening I measured on the mannequin at full tuck. Gravity is 22 m/s².

| | feet at apex | body lift at apex | air time | ground covered (from the press, including the crouch) |
|---|---|---|---|---|
| running (Shift, 7 m/s) | 1.00 m | 0.61 m | 0.47 s (0.464 s counted in 16 ms frames) | 3.8 m |
| walking (3.3 m/s) | 0.84 m | 0.45 m | 0.40 s | 1.6 m |
| standing | 0.63 m | 0.30 m | 0.33 s | 0 m |

## Collision
On-foot movement today is `walk0_`: `collideCar(x,z,.42,null)`, which runs `world.collide` (building polygons), then the 8 m `props` grid (circles), then the `walls` segment grid, followed by a capsule push from cars and parked cars. People and animals do not block the player at all, and that is unchanged.

In the air, `jumpCollide` is a copy of `collideCar0` that skips any prop or wall whose top is below his feet at that moment. Buildings and cars stay solid. Coming down onto or into a low obstacle needs no special code: the frame where his feet drop below its top pushes him out the way the walking collision already does. For a circle that is radially, to the nearer side. For a wall segment it is to the side his centre is on, so he lands on the far side if he got past its line.

Heights are found once per world and cached on each obstacle (`o.jt`). A prop's own `.h` is used when it has one (knockables). Otherwise the height comes from a position lookup (within 0.15 m) built from the street data and the park benches. Anything not found counts as infinitely tall, so the unknowns stay solid.

| kind | source of the height | top | jumpable (feet ≤ 1.0 m) |
|---|---|---|---|
| street planter | `STREET_KINDS.planter` / prop `s[1]` | 0.5-0.55 m | yes, easily (6 in town) |
| park bin (along park paths) | knockable `.h` | 0.7 m | yes (39) |
| street bin | knockable `.h` / `s[1]` | 0.8 m (some 1.0) | 0.8 yes (35), 1.0 no |
| bollard | knockable `.h` | 0.9 m | yes, with timing (22) |
| low bush (street prop) | `s[1]` | 0.9 m | yes, with timing (7) |
| street hedge with h 0.8 | `STREETS[].fences[].h` | 0.8 m | yes (2 segments) |
| street bench | `s[1]` | 0.9 / 0.96 m | 0.9 with timing (9); 0.96 only at the very apex |
| park bench (`world.benches`) | backrest: seat 0.45, back to 0.96 | 0.96 m | only at the very apex (106) |
| low post | `s[1]` / `.h` | 1.0 m | no |
| picket fences | street fence `h` | 1.0-1.2 m | no |
| Vilniaus g. railing | not stored: rails at 0.55 and 0.98 m over a 0.14 m kerb | unknown, so solid (≈1.15 m) | no |
| OSM fences and hedges (`hedgeSegs`) | 1.2-1.8 m, all over 1 m | solid | no |
| mesh/panel/wall fences, stadium fence | 1.4-1.9 m | solid | no |
| buildings, trees, poles, lamps, signs, posts over 1 m | `world.collide`, tree, `.h` | solid | no |
| cars, parked cars, lot cars, bus | capsule / rectangles | solid | no |
| town benches in `buildTown` (the second `bench` helper), bells, bus shelters, goals, masts | not stored | solid | no |

## Animation
There is no jump clip. The clips are idle, walk, jog, sprint, talk, phone, fold, yes, no, sit_in, sit, sit_talk, sit_out, guard, jab, cross, hook, hit_chest, hit_head, knockback, death, getup, crouch, crouch_walk and kick. The pose is therefore made by hand on both rigs:
- Instanced rig: a `poseAt` wrapper for `PLAYER_I` overrides hips, knees, torso lean and (unless a fist pose holds them) the arms, through the existing `act` array, and adds the lift.
- Mannequin: a `charAnim` wrapper tilts `spine_01`, `thigh_*`, `calf_*` and `foot_*` with `fixTilt` after the clips. The bones are saved in `st.sv`, which the fix step's wrapper restores before the next mixer pass. `charPose` only lifts peds (`p&&...?lift:0`), so the `poseAt` wrapper raises the player's mannequin object itself.
- No outfit, material or mesh is touched.

## Anchors and edits
- `// ---------- boot ----------`: jump.js inserted before it.
- `<kbd>Space</kbd><span>Handbrake: hold while steering to drift</span>\n`: one help line added after it.
- `  <button class="tb" id="tCam"`: the JUMP button inserted before it.
- Wrapped from my block: `press`, `walk0_`, `poseAt`, `charAnim`. **No existing function body is edited.**

## Results
- Page bytes: +6,384 (13,241,123 → 13,247,507). Two builds are byte-identical.
- `work/test_jump.mjs`: PASS. It covers the standing, walking and running arcs, no double jump, the blocked states, no jump in a car with the handbrake still working, the Vilniaus g. planter 88 m from the start (walking blocks, a running jump clears it), the nearest building and the nearest 1.4 m fence on Dominikonų g. both blocking at a 1.0 m apex, landing inside the planter pushing him out to the nearer side, the camera ignoring the hop, the mannequin tucking, finite positions and no page errors.
- Regressions on the jump build: `test_fight2` PASS, `test_kick` PASS, `test_fixpeople` PASS, `test_drive` PASS, `test_water3` PASS.
- `test_solid` passed 4 of 6 runs on the jump build. Both failures were "peds clear of solids": a walking pedestrian inside a building at about (-138.6, -188.7). Over the same period the base build (v52) passed 4 of 4. Jump code does not move pedestrians; the only pedestrian-related code wraps `poseAt` and `charAnim` and returns early for anyone but `PLAYER_I`. I still count it as open rather than proven a flake.
- `node work/fps.mjs`: 60.3 fps on Metal (M5 Pro), load 2.3 s.

## Pictures
- `research/prototypes/characters/jump/jump_side_strip.jpg`: take-off, apex, landing from the side.
- `research/prototypes/characters/jump/jump_chase_strip.jpg`: the same jump from the chase camera.
- `research/prototypes/characters/jump/jump_planter_vilniaus.jpg`: clearing the planter on Vilniaus g.

## What is left
- Park benches (backrest 0.96 m) are next to the 1.0 m apex, so they can only be cleared with near-perfect timing. Raising the apex would break the 0.9-1.0 m brief; treating a bench by its seat height would break "top below his feet". It's the owner's call.
- The Vilniaus g. railing and the `buildTown` benches have no stored height, so they stay solid. Fixing that would mean a one-line edit in each builder.
- Attacks are still allowed mid-air and show the punch or kick over the tuck. Nothing checks this, and it looks odd rather than broken.
- The take-off pose is short (0.07 s crouch). At 60 fps it reads as a brief dip, not a wind-up.
- Mid-air over deep water starts the drowning sequence before he touches the water, the same as walking in.
