# Ground layer fighting (fix-ground, 2026-11-09)

Step: `pipeline/fix_ground.js` + `pipeline/add_fixground.py` (run after `fixwater`, not yet in build.sh; orchestrator appends it). Test: `work/test_fixground.mjs`. Shots: `research/prototypes/graphics/ground/{before,after}/`.

## Causes (v37 base, built HTML line numbers from the full build)
1. Stadium grass (b + c). `buildStadium` field (`pos GY+.07`, 5 m grid) was never passed to `W.sinkGround`, so the 24 m ground mesh (chords across a dish) stood above it on 390 of 1112 triangles, up to 40 cm. Visible as a grass-textured patch with blades over the pitch and track. The grass blade pass (`grassMap`, top-down height/mask render) saw the ground as the winner there: 1474 of 4131 texels (36%) on the oval were "grow grass".
2. Green sheet vs ground (c). `GR` polygons (draped at 8 m, y=.02) sit under the ground on 12097 of 113711 triangles, up to 1.2 m; `sinkGround` was only applied to `RD`/`WA`/`PV`/`SQ`/`LOT`/`YD`. Ground colour (gMat noise) and sheet colour pop against each other.
3. Green sheet vs road/water (c). GR's 8 m chords rise above the 8 m road ribbons and water sheets on 8914 of 27067 sampled layer triangles (66 of 4714 road triangles, up to 8 cm; water up to 28 cm). This is the grass-coming-out-of-the-road case. Blade map: 341 of 455649 road texels were grass.
4. Overlapping green polygons (park, forest, residential landuse) all at y=.02 fought each other: coplanar fights up to 0.39% of the 40 m frame (near-plane test).
Not causes: draw order/depth prepass (ortho blade pass is linear, depth fine), `logarithmicDepthBuffer` (off), grass spawn tests (the mask is correct; its inputs were wrong). Flicker over time in the stock static views is blade wind, not z-fighting. Roads vs ground were already clean (0 of 50124 samples poke). I did not need to bisect v38/v41: the defects are in the v37 base layering.

## Fix (new step only, no existing files edited)
- GR vertex bias by colour: generic landuse -1.2 cm, forest -0.6 cm (overlap order landuse < forest < other green).
- Every up-facing triangle of the non-green flat layers (roads, markings, water, pavements, field; buildings excluded via the `sty` attribute) is probed (vertices + centroid) against the green triangles; green vertices drop (welded by position) until they sit 2 cm below, only for 0 < overlap < 50 cm.
- `W.sinkGround` then pushes the ground under the green sheets and the stadium field (same mechanism as for roads).
- `perfTick` near plane: `near = clamp(.05 * height above ground, .4, 2.5)` (driver/car cameras keep .4). Patched numerics in the built HTML by `rep` with `assert count==1` on `buildLandmarks();buildStreets();`, `function buildExtra(){`, and the `camera.far` line.

## Numbers (`node work/test_fixground.mjs`, Metal GPU, 1280x720)
| metric | before | after |
|---|---|---|
| flicker (10 near-plane renders), worst of stadium + 6 roads x 3 heights | 0.388% (road, 40 m), stadium 40 m 0.117% | 0.0127% |
| blade-map texels grass on stadium oval | 1474/4131 | 0 |
| blade-map road texels grass (41 sites) | 341/455649 | 2 (0.0004%, two cls4 paths at one site) |
| green above road/water/field | 8914 tris, worst 28.4 cm | 0 |
| ground above green / field | 12097 / 390 tris | 0 / 0 |
| sky/underground pixels in ground half of frame | 0 | 0 |

test_gfx passes, test_solid passes (all; on the base it reports 1 failed, unrelated), fps 60.3 (base 60.3), load 1.9 s base vs 2.8 s with the step (cold; the step costs about 0.5-0.9 s at load: 27k layer triangles probed once). Re-run on top of the current chain through `fixwater`: all pass. The flicker metric works by rendering the same still view with 10 near planes; this only changes depth quantisation, so any changed pixel is a depth fight. The old "green pixels at road points" check cannot discriminate (cm-level poke), so it stays as a smoke check; the geometry assertions carry the proof.

## Caveats
- Ground now dips up to ~1.2 m in places under green sheets (never visible: the sheet is above it, no gaps measured).
- Props placed later than `buildStreets` are not probed.
