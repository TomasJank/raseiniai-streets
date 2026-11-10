# Kick animation (wave 3, item 1)

A real kick on the mannequins: the CC0 KayKit `Melee_Unarmed_Attack_Kick` clip, retargeted offline onto `body_m.glb`'s skeleton, replaces fight2's procedural leg lift. Anything that is not a mannequin (or a build without the clip) keeps the procedural kick.

## Source

`research/assets/characters/kaykit/SOURCE.md`. Fetched from the author's itch.io page (kaylousberg.itch.io/kaykit-character-animations, free 1.1 pack, CC0 in the zip's `License.txt` and on the page). Zip sha256 `65882f31...be20f`; `Rig_Medium_CombatMelee.glb` sha256 `c55e6ec1...231459`, byte-identical to the GitHub mirror the prototype used, so the prototype result carries over. Raw GLBs and the zip are gitignored.

## Bake (`research/assets/characters/build_kick.mjs`, output `clips_kick.glb`, 9.9 KB, one clip `kick`)

1. `SkeletonUtils.retargetClip` with the prototype's bone map, `hip:'hips'`, hip-height scale 2.26, 20 fps, run headless in node (three 0.187 `GLTFLoader.parse` plus meshopt decoder; no browser needed).
2. Kept tracks: pelvis (rotation + position), spine_01, spine_03, thighs, calves, feet, balls (12 tracks after resample). Dropped: arms, hands, head (T-pose vs A-pose; the game's guard pose keeps them).
3. Two fixes the prototype did not need because it only looked at poses:
   - the retargeted hip track sits at the chibi source's height (pelvis 1.6 m against a 0.92 m rest) and bounces 2.26x. The build keeps the horizontal motion, rebases it on the rest pose and sets the height per frame so the planted left foot stays at its rest height (no float, no sinking).
   - the contact frame (right foot's furthest forward reach, 0.467 s of 0.933 s) is measured on the result and stored in the animation's `extras`, which GLTFLoader exposes as `clip.userData.contact`.
4. `resample`, `prune`, meshopt.

## Game wiring (new files only)

- `pipeline/kick.js`, `pipeline/add_kick.py`: step `kick`, appended after `fixtalk` (the call is `sh pipeline/build.sh x.html && python3 pipeline/add_kick.py x.html`; see below for the build.sh line the integrator adds).
- The GLB is embedded deflated as `<script id="agz_kick_clips">` (same technique as `add_animals2.py`), inflated at runtime into an `asset_kick_clips` block and read through `ASSETS.load`.
- `charInit` is wrapped: loads the clip alongside the original init and sets `CHAR.clips.kick`. If the load fails, a warning is logged and the procedural kick stays.
- `charAnim` is wrapped (outermost, over fixpeople and fight2): each mannequin lazily gets `st.act.kick` in its own mixer, so `charOne(CHAR.list[i],'kick')` works as a normal one-shot. During a fight2 kick move the wrapper hides the move name from fight2 for one call (so its procedural lift does not run), lets the normal pose logic run, then re-evaluates the mixer with the kick action at weight w/(1-w). The mixer normalises per property, so legs, hips and spine follow the clip while the arms (no kick tracks) keep the guard pose. w ramps in over 50 ms and out over the last 100 ms.
- Timing: clip time is a two-segment warp of move time. The clip's contact frame lands at the middle of fight2's active window (`su + ac/2` = 0.28 s) and the rest of the clip is stretched over wind-up and recovery (0.8 s total). Hitstop freezes `mv.t`, so it freezes the clip too.

## Evidence (`work/test_kick.mjs`)

See the results block at the end of this file.

## Integrator notes

- Add to `pipeline/build.sh` loop: `... fixtalk kick`. The step needs `research/assets/characters/clips_kick.glb` (rebuild with `build_kick.mjs`, command in `kaykit/SOURCE.md`).
- `pipeline/extract_assets.py` matches `agz_(\w+)`; the new block is named `agz_kick_clips`, so extend the extractor's output mapping if it special-cases names (it was not edited).
- Licence: KayKit is CC0, no credit required; credit "Kay Lousberg, www.kaylousberg.com" is optional. `clips_kick.glb` is derived from `body_m.glb`'s skeleton (QAL v1.0 handling as in `SOURCE.md`): it holds no mesh, only bone names and rest nodes, but keep it out of git like the other GLBs.
- The hit still registers at the start of the active window (0.22 s, fight2's rule); the foot's furthest reach is at 0.28 s. Moving the hit later would be an edit to fight2.

## Results

Build: `sh pipeline/build.sh $S/y.html && python3 pipeline/add_kick.py $S/y.html` (embed 4.6 KB deflated base64).

| check | result |
|---|---|
| `work/test_kick.mjs` | PASS: clip on every mannequin (12 tracks, 0.933 s, contact 0.467 s, zero arm/head tracks); `charOne(st,'kick')` plays it; player KeyZ keeps `mv.n==='kick'`, clip time advances, foot forward reach 0.86 m peaking at move time 0.272 s inside the active window [0.22, 0.34]; clip time at that frame 0.454 (contact 0.467); fallback without the clip rotates the thigh procedurally (1.55 rad); no console errors |
| `work/test_fight2.mjs` | PASS (all checks, errors []) |
| `work/test_fight.mjs` | PASS on rerun. The first run failed `heatWithWitness` (random witness distance 10.0 m at the threshold, machine load average about 180); the same check passes on the base build and on rerun, and the check does not touch the kick |
| `node work/fps.mjs` | Metal 60.3 fps, load 2.1 s, 272 MB heap (SwiftShader leg timed out under the machine load) |

Screenshots: `work/shots_kick/kick{0,1,2}.png` (wind-up, contact, recovery). The guard arms stay up through the kick; the first build scaled the guard weights down and lost the arms, fixed by weighting the kick action instead.

The two test_fight scripts have a 30 s navigation timeout that the loaded machine exceeded; the runs above used throwaway copies with the timeout raised (deleted).
