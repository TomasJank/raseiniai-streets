# perf: frame cost on slower PCs (2026-11-14)

Step `perf2` (`pipeline/perf2.js`, `pipeline/add_perf2.py`), appended at the end of the chain, after `tex`.
The name `perf` was taken: `pipeline/perf.js` + `add_perf.py` are the v37-era step (tree LODs, phone pixel ratio) that is
baked into `work/build/v37.html` and tracked in git, so this step is `perf2`. Test: `work/test_perf.mjs page.html`.

## What the frame cost (measured, start point, full quality, Metal, 1280x720)
CPU profile of the build before this step, about 15 ms of JS per frame:

| item | ms per frame | share | what it was |
|---|---|---|---|
| GTAO normal pass | 6.4 | 44% | a second full scene render with `MeshNormalMaterial`. Inside it three.js **rendered the sun's shadow map again** (about 3 ms, 145-166 draw calls; the beauty pass had just made it and the normal pass never reads it), drew every far mesh, and fix_gfx's whole-scene `traverse` cost 1.1 ms |
| beauty pass | 6.3 | 42% | of which shadow map 3.0 ms |
| `updateMatrixWorld` | 2.0 | 14% | 10,000-16,000 `Matrix4.compose` a frame: every static object recomposed on both scene renders |
| game logic | about 2 | | people 0.9, traffic 0.6; not touched |

Draw calls by kind (beauty pass, start): props2 street objects 46% of all calls, 258 of them on objects beyond 500 m (bins,
benches, signs, hedge pieces a pixel or two wide in the fog). Trees were not the problem any more: perf.js's three crown
LODs (320/80/20 triangles at <150/<400/beyond m), near-only tree shadows and far plane at the fog already work; the census
that showed 21.5 M crown triangles counts every chunk at its high geometry, not what is drawn.

## What changed (all in `pipeline/perf2.js`, plus four one-value splices in perf.js's `perfTick` by `add_perf2.py`)
1. **Shadow map once a frame**: `shadowMap.autoUpdate` is off for the GTAO normal pass (set in its `_overrideVisibility`,
   restored in `_restoreVisibility`). Shadow draws per frame halved. No look change.
2. **AO normal pass limited to 150 m** for static world meshes, and one cheap walk replaces fix_gfx's traverse (same
   sprite and transparent no-depth hiding). Screenshots identical within noise.
3. **Matrices only for what moved**: `Object3D.updateMatrix` returns early when position, quaternion, scale and parent are
   unchanged since its last compose; `scene.updateMatrixWorld` runs once per frame instead of once per scene render.
   Composes per render: about 10,000 -> 3-7 with the loop paused, a few hundred in play (people bones, cars).
   This is a check, not a freeze, so nothing that moves can get stuck; the test checks every object's world matrix
   against its position after 90 real frames.
4. **Small far static meshes skipped**: a world mesh whose one instance would cover under 4 px at its distance leaves
   layer 0, so beauty, AO and shadow passes all skip it (its `visible` flag stays with the step that owns it). Re-checked
   every 0.25 s with perf.js's tree pass. Trees keep their own LOD.
5. **Automatic quality on every device** (replaces perf.js's phone-only pixel-ratio step). See below.

Not changed: tree crown shapes (already LOD'd), the far plane (already the fog + 60 m), triangle-heavy merged meshes
(buildings 213k triangles in every pass, terrain), people and cars (files owned by other agents, see "For the integrator").

## Before / after, full quality (level 0)
Load-independent, `test_perf` (one render, loop paused, traffic and people hidden):

| place | draw calls before -> after | triangles (M) before -> after |
|---|---|---|
| start (Vilniaus g.) | 1463 -> 582 | 8.19 -> 4.96 |
| Žemaičio aikštė | 1124 -> 554 | 6.37 -> 4.65 |
| Raseinių parkas | 699 -> 462 | 7.54 -> 5.77 |

With the game running (traffic and people in, so it varies with the crowd), median of 3 runs:
draw calls at the start 1958 -> 972, triangles 10.2 -> 6.5 M.

Render CPU per frame (`gfxRender` only, loop paused, median of 25, two runs each, interleaved):

| place | before | after |
|---|---|---|
| start | 8.4 / 8.8 ms | 4.5 / 4.4 ms |
| square | 7.5 / 7.4 | 4.6 / 4.5 |
| leafy street (park lane) | 6.8 / 6.0 | 3.4 / 4.9 |
| long view (main road) | 7.0 / 6.1 | 3.6 / 4.0 |

Frame rate on this Mac (Metal, vsync 60), CPU slowed with CDP `Emulation.setCPUThrottlingRate`, auto quality off so
both sides are full quality. The machine was shared with other agents, so these swing a lot between runs: medians of 3
runs, JS = time inside the rAF callback.

| place | fps x1 | JS ms x1 | fps x3 | fps x4 |
|---|---|---|---|---|
| start | 60 -> 60 | 10.1 -> 7.2 | 28.3 -> 38.9 | 20.2 -> 24.9 |
| square | 60 -> 60 | 9.1 -> 6.5 | 32.3 -> 43.9 | 23.4 -> 31.7 |
| leafy | 60 -> 60 | 6.9 -> 4.2 | 41.6 -> 58.1 | 28.1 -> 42.3 |
| long | 60 -> 60 | 9.7 -> 4.6 | 35.1 -> 59.5 | 23.9 -> 41.3 |

With automatic quality on (one run): x3 stays at level 0 (39.9 / 46.5 / 59.7 / 47.2 fps), x4 goes to level 2
(32.2 fps at the start, 35.9 at the square).

## Quality levels
Auto on every device: the median frame of each 2 s window; two windows over 25 ms step down, three under 17.9 ms step
back up. Hysteresis: a level that was too slow within 12 s of stepping up to it needs twice as many fast windows next
time (up to 30). A step down that does not make frames at least 10% shorter (a browser capped at 30 Hz) is undone and
held for a minute. Windows over 5 s (hidden tab, stall) and the first 6 s after the loader are not judged. Levels that
change nothing on a device (pixel ratio already 1, no AO on a phone) are stepped over.
`window.__GFX={level:n}` forces a level; `__GFX={auto:false}` keeps level 0; the other `__GFX` keys work as before
(level 0 is whatever they set).

| level | what changes | calls / Mtris at start (test) | render ms (start, square) | fps x3 / x4 (start) |
|---|---|---|---|---|
| 0 | full quality | 594 / 4.96 | 4.5, 4.6 | 38.9 / 24.9 (median) |
| 1 | pixel ratio at most 1 (only matters on high-DPI screens; this headless page is 1 already) | same | same | 47.2 / 32.4 |
| 2 | no ambient occlusion, and with it no half-float 4x MSAA target (the canvas keeps its own antialias) | 430 / 3.20 | 3.2, 3.4 | 48.6 / 35.0 |
| 3 | shadow map 2048 -> 1024, tree shadows to 70 m (was 130), things under 2 m radius cast within 35 m | 391 / 2.81 | 3.3, 3.0 | 48.5 / 36.6 |
| 4 | small-thing cull at 8 px, full tree crowns to 90 m (was 150), trunks to 200 m (was 350) | 333 / 2.59 | 3.4, 2.8 | 59.7 / 50.4 |
| 5 | no sun shadows, pixel ratio .75 | 221 / 1.78 | 1.7, 2.1 | 59.7 / 52.2 |

The level runs (one each) were taken later than the base runs, when the machine was less busy; compare them with each
other and with the draw-call and render-ms columns, which do not depend on load. Level 5 changes the lit shader variant,
so every material recompiles once (a hitch of up to a second or two on a slow PC, once).

## Pictures (opened and compared)
`research/reports/perf/pair_{start,leafy,square,long,aerial,far}.jpg`: before left, after right, full quality, tod 13,
traffic and people hidden, main loop stopped. Mean pixel difference before vs after equals before vs before (0.2-1.2,
from people and animals that were not hidden); the only visible difference found was a moving car in the park lane.
`levels_{start,square,aerial}.jpg`: before, level 0, 2, 3, 4, 5 (left to right, top to bottom).

## Tests on the final build
`work/test_perf.mjs`: today's chain without perf2 fails 5 (three budgets, matrix composes, no levels); with perf2 all
pass: budgets, composes 3-5, no stale world matrix among about 6,000 objects after 90 frames, 26/26 traffic cars move
and their meshes follow, people's bones move, the bus mesh is at the bus, each forced level changes what it says and
draw calls fall level by level, a hidden-tab gap does not step down, the stepping and back-off sequence, a 30 Hz cap is
undone, `__GFX.level=3` holds, 4x slower CPU steps down to level 2, full speed stays at level 0 (that last one needs an
idle machine).
Builds byte-identical twice. Start point unchanged. Page +7.2 KB.

Other suites on the final build: see the final section below.

## What still costs the most (level 0, start)
- People: each person is several skinned meshes, all casting shadows and all drawn in the AO pass: about 70 calls per
  pass near the start, so about 200 of the frame's 850-1100, varying with the crowd.
- Cars: every car part casts a shadow (about 55 shadow calls at the start).
- props2 near objects: about 120 beauty calls within 250 m (one InstancedMesh per model per 200 m cell).
- GPU side (not measurable here, the Mac GPU is idle): GTAO at full resolution on a 4x MSAA half-float target and the
  2048 shadow map. Levels 1-3 are the answer on an integrated GPU; untested on one.

## For the integrator (files I must not edit)
- `pipeline/mhchars.js` (people): cast shadows only for people within about 40 m of the camera, and only from the body
  mesh, not hair, clothes and shoes. Expected: about 50-100 fewer shadow calls a frame in a crowd.
- Optional, `pipeline/cars4.js`: shadows from the body and wheels only.

## Not verified
- Real weak hardware. The weak PC is stood in for by CDP CPU throttling on an Apple GPU, so a GPU-bound integrated
  graphics laptop (especially at Windows' 1.25-1.5 pixel ratio) is not measured; the levels address it in principle.
- A browser capped at 30 Hz is only tested with simulated windows.
