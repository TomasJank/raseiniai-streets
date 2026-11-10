# Animals: skinned GLB animals over the instanced rig (2026-11-09)

Owner: animals agent. Step `animals2`, appended last in `build.sh` (after `water2`, and after `fight2` if that lands first). Behaviour files (`pipeline/animals/*.js`) and `animals.js` are untouched.

## Species, models, licences

| Species (game name) | Model | Source | Licence | Tris | Clips used | Height (m, bbox) |
|---|---|---|---|---|---|---|
| dog_lead (brown), dog_lead_small | ShibaInu | Quaternius Ultimate Animated Animals | QAL v1.0 (pack page says CC0), no credit | 1,950 | idle walk run(Gallop) bark(Attack) death | .6 / .4 |
| dog_lead_big, dog_yard | Husky | same | same | 1,920 | idle walk run bark death | .8 / .7 |
| fox | Fox | same | same | 1,848 | idle walk run bark death | .5 |
| deer (roe) | Deer | same | same | 2,098 | idle walk run eat death | 1.0 |
| cat | Cat | Quaternius Animal Pack Vol.2 (FBX, converted) | QAL v1.0 (page says CC0), no credit | 807 | idle walk (no run, no death) | .3 |
| hare, hedgehog | none | no licensed animated model found | n/a | n/a | n/a | keep the instanced rig |
| pigeon, jackdaw, stork, owl, bat | none | tiny animated bird GLB not found within the budget | n/a | n/a | n/a | keep bird rig / bat points |

The Polyfork dog (CC-BY) and Khronos fox (CC-BY) were downloaded earlier and are not used: the Quaternius models cover the same species with more clips and need no credit line. **Credits added: none** (`CREDITS_ANIMALS` is an empty string in `animals2.js`; the game has no credits UI). A one-paragraph addendum is in `license-report.md`. Sources, hashes of intent and processing: `research/assets/animals/SOURCE.md`.

The Drive folder of the pack answered "quota exceeded", so the glTFs came from a GitHub copy of the same pack (named in SOURCE.md). The cat's animation exists only in FBX; there is no Blender here, so it was converted with three's FBXLoader + GLTFExporter in a headless page.

## How it works

- `pipeline/animals2.js` wraps four animals.js functions by renaming them with `rep` (`poseQuad_0`, `animHide_0`, `animSound_0`, `updateAnimals_0`) and defines wrappers of the same names in a block before `// ---------- boot ----------`.
- `poseQuad(a)`: a species with a loaded model and `a.d < 60 m` (kept until 68 m) gets a pooled rig (`ASSETS.clone` = SkeletonUtils clone, own `AnimationMixer`), the 8 instanced parts of its slot are zeroed and the rig is placed with the same ground height as `animBase` (`GY + surf + a.y`) and yaw `a.h`. Beyond 68 m, or with no model, `poseQuad_0` runs as before. Cap: `ANIMAL_N` (24).
- State to clip (cross-fade 12/s, weights sum to 1, a new rig snaps): `down` -> death (held on the last frame; cat has none, so it lies on its side); stopped -> idle (deer standing in `walk` mode: eat); `sp > 0.08` -> walk with time scale `sp/(2h)`; `mode==='run'` or `sp > 4.5h` -> gallop with time scale `sp/(9h)` (cat: walk at 1.8x). Dogs and fox play the bark clip for 1 s when `animSound` fires a `bark` while nearly still (a barking yard dog that is running keeps galloping). Freeze, stare, sit, hop and cross map through speed and mode, so they need no species code.
- Behaviours (schedules, crossing, flee in headlights, barking, `animRunOver` consequences) are not edited; the rig only reads the animal record.
- Robustness: a rig whose animal went to `hide` by any route is released on the next tick.
- Model sizes are normalised at load: the rest-pose bbox height of each model is scaled to the table above; feet on the ground via the bbox min.
- `AG` is declared with `var` because `updateAnimals` runs before the block is reached during boot (a `const` was a TDZ crash, found in the first run).
- Assets: not through `manifest.json` (not edited). The GLBs are about 160 KB each because of per-bone animation JSON, so the 700 KB budget needed deflate: `add_animals2.py` embeds them zlib-compressed in `<script id="agz_NAME">` blocks, and `agUnpack` inflates with `DecompressionStream` into the plain `asset_animal_NAME` block that `ASSETS.load` reads. Nothing waits on them: the instanced rig shows until the models decode.

## Budget and measurements

| | |
|---|---|
| processed GLBs | 686 KB raw, meshopt, one material (vertex colours), one draw call per animal |
| embedded in HTML | **397 KB** (base64 of deflated) + 5 KB JS; HTML 5,486,207 -> 5,897,684 B |
| build | deterministic (two builds byte-identical) |
| fps, Metal, `work/fps.mjs` | **60.3** (load 1,262 ms; base 1.1 s) |
| fps, Metal, 20 deer pinned in view | **60.1** (worst frame 16.8 ms), vs 60.2 without |
| draw calls | +1 per GLB animal (22 animals: 746 vs 724); the instanced rig costs a fixed 8 |
| CPU, 22-24 GLB animals (SwiftShader page) | updateAnimals avg 0.11-0.13 ms, worst 3.5-3.9 ms (first-frame clone) |

LOD at 60 m was not needed for draw calls (1 call each), it exists to keep skinning to the near animals.

## Tests

`work/test_animals2.mjs` (SwiftShader, scratch build): models decode with no console errors; per model: idle / walk / run / eat-or-idle / death clips switch with state change and one visible SkinnedMesh; shiba barks on `animSound`; real day species (dogs, cat) near the player are SkinnedMesh and none beyond 68 m; real night fox and deer near the player are SkinnedMesh; hare and hedgehog stay on the rig; LOD (rig zeroed near, restored far); a car hit on a GLB dog: heat +1 once, cash -40 once, mode down, death clip; no NaN bones; cost; 15 close-up shots.

```
assetsDecode {"models":{"cat":{"h":447.97,"clips":"idle/walk"},"shiba":{"h":3.09,...},"husky":...,"fox":...,"deer":{"h":4.27,"clips":"death/eat/run/idle/walk"}}}
clips_deer {"skinned":1,"vis":true,"seq":["idle","walk","run","eat"],"down":["death",1]}
clips_fox/shiba/husky {"skinned":1,"seq":["idle","walk","run","idle"],"down":["death",1]}
clips_cat {"skinned":1,"seq":["idle","walk","walk","idle"],"down":["idle",1]}
realDay {"species":["dog_lead","dog_yard","dog_lead_small","dog_lead_big","cat"],"near":4,"skinnedNear":4,"badNear":[],"farWithGlb":0}
realNight {"species":["fox","deer","hedgehog","cat","hare"],"near":3,"skinnedNear":3,"badNear":[]}
lod {"near":true,"nearInst":0,"mid":true,"far":false}
hitConsequences {"mode":"down","heat":1,"cash":460,"ups":1,"downs":1,"clip":"death"}
noNaN {"rigs":7,"bad":0}
cost {"animals":23,"glb":23,"avgMs":0.126,"callsWithGlb":1656,"callsWithout":1633}
errors []
PASS
```
On the same build: `test_animals` PASS, `test_animals_day` PASS, `test_animals_night` PASS (output in the session log: yard dog, leash, owner hit, stork, flock, deer freeze/bolt, deer hit all unchanged).

Shots: `research/prototypes/animals/shots/{shiba,husky,fox,deer,cat}_{idle,walk,run}.png` (gitignored by the shots rule).

## Limitations

- Hare, hedgehog and all birds and bats keep the box rig (no licensed animated model; Quaternius animal packs contain none). Cats run with a sped-up walk; the cat has no death clip.
- Colours are the models' own (shiba orange-brown, husky black/white, fox red, deer brown, cat white); the per-species `colours` of the box rig are ignored for GLB animals, so `dog_yard`'s four colours collapse to one husky.
- Slope tilt and body roll on slopes are not applied; the 'sit' of a cat on a fence and a dog sitting use the idle clip (no sit clip). A stag model and Idle_2/Eating variants are in the pack but unused to stay in budget.
- Feet slide slightly at the deer's 0.35 m/s grazing walk (clip time scale is clamped at .35).
- The processed GLBs sit in `research/assets/animals/built/` and are gitignored (QAL: raw files not redistributed); a fresh clone needs `research/assets/animals/build.mjs` (steps in SOURCE.md) before `add_animals2.py`, which asserts when the directory is empty. Same situation as the characters.
- The pack's glTFs were taken from a GitHub copy because the official Drive folder was over quota.

## Integration

1. Append `animals2` to the step list in `pipeline/build.sh` after `water2` (and `fight2`): `... water2 animals2`. Needs `assets` and `animals` before it (the script asserts).
2. Anchors it needs: `function poseQuad(a){`, `function animHide(a){`, `function animSound(a){`, `function updateAnimals(dt){`, `// ---------- boot ----------`, `</body>` (each unique in the full build). Nothing in `manifest.json` changed.
3. Add `work/test_animals2.mjs` to the suite. It needs network for the three addons, like the character test.
4. If a later step also wraps `updateAnimals`, order matters only in that `animals2` must come after `animals`.
