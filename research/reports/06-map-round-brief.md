# Map-fidelity round brief (2026-11-10)

Goal from the owner: "I want the map to look as close to my hometown Raseiniai as possible."

A top-down render of v46 next to the 2024 orthophoto showed the buildings and roads already sit within about 10 m of reality. What does not look like Raseiniai is everything between the buildings (uniform green ground, no field patchwork, no yards), the water (one pond where there are two, most ponds and ditches missing), and the landmarks (the church is a white box, the monastery beside it is rendered as grey sheet metal). This round fixes those three, one agent each.

## Agents and ownership (new files only)
| Agent | Step (build order) | Owns |
|---|---|---|
| ground | `ground` | `pipeline/ground.js`, `pipeline/add_ground.py`, `pipeline/geo/ground_map.py` and its outputs `pipeline/geo/ground_*`, `work/test_ground.mjs`, `research/reports/ground.md`, `research/prototypes/ground/` |
| water3 | `water3` | `pipeline/water3.js`, `pipeline/add_water3.py`, `work/test_water3.mjs`, `research/reports/water3.md`, `research/prototypes/water3/` |
| landmarks2 | `landmarks2` | `pipeline/landmarks2.js`, `pipeline/add_landmarks2.py`, `work/test_landmarks2.mjs`, `research/reports/landmarks2.md`, `research/prototypes/landmarks/`, `refs/landmarks/` |

The integrator (the session that launched you) appends the steps to `build.sh` after `sounds` in the order `ground water3 landmarks2`, runs the suites, copies the next `vNN.html` and commits. You never do any of that.

## Inputs already in the repo
- `pipeline/geo/grpk.json`: national reference cadastre (GRPK, CC BY 4.0, credit "GRPK (c) Lietuvos Respublikos aplinkos ministerija") for the whole ground plane, already in **game metres** `[x east, z south]`, the same frame as `world`, `GY(x,z)`, `player.x/z`. Keys:
  - `land` 1,347 polygons, `GKODAS`: `sd11` arable field (386), `sd2` meadow or pasture (375), `sd15` tree and shrub planting (271), `ms0` forest (167), `sd4` unused land (120), `ms4` orchard or garden (28).
  - `water` 462 polygons (`hd4` pond or lake, `hd9`), some named (`VARDAS`: Raseinių I/II/III tvenkinys, Prabaudos tvenkinys...). `streams` 666 centrelines with `PLOTIS` (width) and `TIPAS`. `shores` 507 lines, `bog` 12.
  - `built` 662 polygons: `pu0` urbanised (575), `pu3` industrial (52), `vk1` sports ground (21), `vp1` cemetery (6), `vg2` water treatment (7), `vg1` substation (1).
  - `towers` 28 points (`pa6`, tower-type structure, no further attributes), `names` 109 place-name points, `rides` 118 lines.
  - Polygons: `rings[0]` is the outer ring, further rings are holes (islands) or extra parts; rings are open (first point not repeated).
- `pipeline/geo/grpk_buildings.json`: 8,628 building footprints with purpose code `PASK`. Not used this round except for reference.
- `pipeline/geo/lks94.py`: LKS-94 <-> lat/lon <-> game metres with no dependencies, plus the orthophoto tile grid formula. `python3` on this machine has PIL and numpy; it has no pyproj, shapely or rasterio, so use this helper.
- Orthophoto ORT10LT 2024: 6,162 tiles at 0.2646 m/px in `research/geodata/ortho/tiles/{row}_{col}.jpg`, grid in `research/geodata/ortho/meta.json`, covering the town plus 60 m (lat 55.3545 to 55.4002, lon 23.0798 to 23.1603). The owner reports the rights holder said it is fine to use (2026-11-10). Ship derived, processed data with the credit "ORT10LT (c) Nacionalinė žemės tarnyba, 2024"; do not commit raw tiles and do not embed full-resolution imagery. `research/geodata/fetch_tiles.py` shows how to fetch more (browser User-Agent, 4 threads, the server throttles).
- Comparison tools in the integrator's scratchpad, copy them into your own scratch directory before use: `/private/tmp/claude-501/-Users-tomasjankauskas-Desktop-Projects-career-ops/3f527a5e-d32a-4610-b97b-d7897d36552c/scratchpad/rev/top.mjs` (top-down game render through a narrow-FOV camera, Metal GPU, labels and cars hidden; edit its `crops` list), `/private/tmp/claude-501/-Users-tomasjankauskas-Desktop-Projects-career-ops/3f527a5e-d32a-4610-b97b-d7897d36552c/scratchpad/rev/ortho.py` (the matching orthophoto crop), `/private/tmp/claude-501/-Users-tomasjankauskas-Desktop-Projects-career-ops/3f527a5e-d32a-4610-b97b-d7897d36552c/scratchpad/rev/shots.mjs` (street-level and oblique views). `/private/tmp/claude-501/-Users-tomasjankauskas-Desktop-Projects-career-ops/3f527a5e-d32a-4610-b97b-d7897d36552c/scratchpad/rev/centre_pair.jpg` and `church_pair.jpg` are the v46 baseline pairs, `centre_real_grpk.jpg` shows GRPK outlines over the orthophoto.
- Read first: `research/reports/01-architecture.md`, then the code you are about to touch in a built page.

## How the game is built (do not skip)
- Source of truth is `work/build/v37.html` plus one `pipeline/add_*.py` splice per step; `sh pipeline/build.sh out.html` runs the chain (1.6 s). The built page is one HTML file, three.js 0.187 from an importmap.
- Your step is a new `pipeline/add_{step}.py page.html` that edits a built page in place and prints `{step} ok`. It must apply to the output of the full current chain. Copy the shape of `pipeline/add_fixground.py`: a `rep(a, b)` helper guarded by `assert h.count(a) == 1`.
- **Insert, do not rewrite.** Three steps land in the same page this round. Put your code next to an anchor and leave the anchor text intact (`rep(a, js + a)`), wrap existing functions from your own block, and add your call next to an existing call. If you truly must change the body of an existing function, keep the edit to one line and list the exact string in your report so the integrator can check it against the other two steps.
- Useful anchors that occur exactly once in the current build: `function buildExtra(){` (code inserted before it is at module scope, after the world helpers), `buildLandmarks();buildStreets();` (post-world setup calls), `function drawMini(){` (where tests inject `window.__t`), `function inWater(x,z){`, `function water2Install(WA,polys,wg,GY){`, `const gMat=new THREE.MeshLambertMaterial({color:0x5f7246});` (ground material).
- Deterministic output: no `Math.random`, no dates; use the page's `hash`/`mulberry`. Building twice must give byte-identical files.
- Data goes into the page as a JSON or base64 `<script>` block or a JS constant written by your `add_*.py`. Keep it small: quantise, drop what you do not draw, and state the bytes added in your report.

## Working rules
- Scratch directory: `/private/tmp/claude-501/-Users-tomasjankauskas-Desktop-Projects-career-ops/3f527a5e-d32a-4610-b97b-d7897d36552c/scratchpad/agents/{you}/`. Build there: `sh pipeline/build.sh /private/tmp/claude-501/-Users-tomasjankauskas-Desktop-Projects-career-ops/3f527a5e-d32a-4610-b97b-d7897d36552c/scratchpad/agents/{you}/base.html`, then `cp base.html x.html && python3 pipeline/add_{step}.py x.html`. Never write into `work/build/`, never touch `index.html`, `build.sh`, any existing `add_*.py` or `.js`, `pipeline/streets/*`, or another agent's files. No git commands that change anything (no add, commit, stash, checkout).
- Tests follow `work/test_fixground.mjs` / `work/test_fixwater.mjs`: Playwright resolved from career-ops' `node_modules`, SwiftShader, inject `window.__t` before `function drawMini(){`, print one JSON line per check and `PASS` or the list of failures. Tests write `_x.html` beside themselves, so run copies from your scratch directory. Tests with timing thresholds are flaky under load (three agents share this machine): rerun before judging.
- Gates before you report: your new suite passes; the existing suites your change could affect still pass (at least `test_fixground`, `test_fixwater`, `test_solid`, `test_drive2`, `test_streets`, `test_facades2`); `node work/fps.mjs x.html` stays at or above 55 fps on Metal; no console errors; two builds byte-identical.
- Look at your result. Render before and after with the comparison tools and put the orthophoto beside it. Iterate until it reads like the photo at a glance; do not chase pixels. Save comparison images as JPEG under 400 KB each in your `research/prototypes/` folder.
- Style: the game is stylised low-poly with flat colours and a linear (non tone-mapped) palette. Match that; nothing photoreal.
- Do not invent. Every modelled feature needs GRPK, OSM, the orthophoto or a photo behind it. Say plainly what you could not verify.
- Code style from the owner: minimal comments (only what the code cannot say), no speculative config, smallest working solution, reuse helpers already in the page.
- Report in `research/reports/{step}.md`: what changed, before/after numbers (page bytes, fps, load time), anchors used and any body edited, what is left, comparison image paths. Your final message to the integrator is a short version of the same: files, gates with real numbers, open issues.

## Wave 2 (2026-11-10 evening)
Wave 1 is merged: `build.sh` now ends `... sounds ground water3 landmarks2` and its output is `work/build/v47.html`. Read `research/reports/ground.md`, `water3.md` and `landmarks2.md` for what those steps put in the page (`groundInstall`, the ground map textures, `world.w3` and `inWater`, the landmark meshes).

| Agent | Step (build order after `landmarks2`) | Owns |
|---|---|---|
| roads2 | `roads2` | `pipeline/add_roads2.py`, `pipeline/roads2.js` (only if code is needed), `pipeline/geo/roads2_*`, `work/test_roads2.mjs`, `research/reports/roads2.md`, `research/prototypes/roads2/` |
| bld2 | `bld2` | `pipeline/add_bld2.py`, `pipeline/bld2.js` (only if code is needed), `pipeline/geo/bld2_*`, `work/test_bld2.mjs`, `research/reports/bld2.md`, `research/prototypes/bld2/` |
| trees2 | `trees2` | `pipeline/trees2.js`, `pipeline/add_trees2.py`, `pipeline/geo/trees2_*`, `work/test_trees2.mjs`, `research/reports/trees2.md`, `research/prototypes/trees/` |
| fixgear | `fixgear` (last) | `pipeline/fix_gear.js`, `pipeline/add_fixgear.py`, `work/test_fixgear.mjs`, `research/reports/fix-gear.md`, `research/prototypes/characters/gear/` |

Extra rules for this wave:
- Two steps (`roads2`, `bld2`) change the `rasData` JSON block instead of code. Building ids used all over the pipeline are `'c'+index` into `rasData.w`, and the LiDAR tables (`lh`, `lr`, `lp`, `sk`, `gh`) are keyed by the same index, so existing ways must keep their index: append new ways, nodes and tag entries at the end, never insert or reorder. Compute every index when the step runs, from the block as it then is, because the other step may have appended before you. Re-serialise the block so that a build is still byte-deterministic, and confirm no later `rep()` anchor in any step depended on text you rewrote.
- `python3` here has PIL but no numpy, shapely, pyproj or rasterio.
- Four agents share this machine. Timing-based test checks will flake; rerun before judging, and do not report a timing failure as a regression until it fails three times in a row on an otherwise idle moment.
- The heap number from `work/fps.mjs` (`mem`) is bucketed and flips between two modes on identical pages. If you need heap, use CDP `Runtime.getHeapUsage` after `HeapProfiler.collectGarbage` (see `/private/tmp/claude-501/-Users-tomasjankauskas-Desktop-Projects-career-ops/3f527a5e-d32a-4610-b97b-d7897d36552c/scratchpad/integ/t/heap.mjs`).
| cars3 | `cars3` (after `fixgear`) | `pipeline/cars3.js`, `pipeline/cars3/`, `pipeline/add_cars3.py`, `work/test_cars3.mjs`, `research/reports/cars3.md`, `research/prototypes/vehicles/cars3/`, `research/assets/vehicles/cars3/`, `refs/cars/` |

(The `cars3` row belongs to the Wave 2 table above; it was added after the other four agents started. Five agents now share the machine.)
