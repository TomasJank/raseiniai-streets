# fix-gfx: black smoke squares and dark buildings (v41)

Step name: `fixgfx` (pipeline/add_fixgfx.py + pipeline/fix_gfx.js), append after `cars2`. No existing pipeline file was edited.

## 1. Smoke: black squares behind the car
Reproduction (v41, Metal, hp=.2, car driven off, chase camera inside its own fume trail): 69% of the frame is pure black, a polygon with straight edges (research/prototypes/graphics/fix/smoke_before_v41.png). Fumes spawn at hp<.55 (more.js:114, colour 0x2a2a2a at hp<.25, extra.js `puff`); the sprites are 1.4-2 m from the chase camera, scale about 3.

Root cause: three GTAOPass._overrideVisibility (examples/jsm/postprocessing/GTAOPass.js) hides only Points and Lines before the normal/depth pass, which uses MeshNormalMaterial as override. Every Sprite (the 26-sprite `smoke` pool, play.js:62) and every transparent depthWrite:false mesh (ringOf rings, cpBeam) is therefore drawn as an opaque quad into the normal/depth buffer, and the AO pass shades the scene behind it as if it were a wall. gfx.js:15-17 adds the GTAOPass, so this started with v39.

Bisect (same camera, same trail):
| build / flag | black quads |
|---|---|
| v38 (no gfx) | no |
| v41 `ao:false` | no |
| v41 `sky:false` (ao on) | yes |
| v41 default | yes (69% black) |
| v41 + fixgfx | no (0.01%) |

Fix (fix_gfx.js, `gfxFix`, called at the top of the composer branch in gfxRender): wrap `gtao._overrideVisibility` so it also hides visible sprites and transparent depthWrite:false meshes for that pass only. They are still drawn normally in the beauty pass.

## 2. Dark buildings
Survey: 40 buildings (every Nth of world.buildings, 8-60 m wide), street-level shot 16 m off the wall at tod 13, central-crop mean luminance, v41 vs v38.
v41/v38 ratio: worst 0.57, 10th percentile 0.76, 24 of 40 buildings darker (houses, desaturated khaki instead of yellow/cream).

Bisect (v41 / v38 luminance ratio, buildings #9 #27 #6 #13 #21 #12 #19 #2):
| flag | ratios |
|---|---|
| default | .57 .67 .75 .76 .76 .77 .78 .79 |
| `ao:false` | .66 .69 .75 .79 .78 .79 .78 .80 |
| `sky:false` | .57 .66 .71 .76 .73 .73 .78 .77 |
| `ao:false, sky:false` | .66 .68 .71 .79 .74 .75 .78 .77 |
| `sunPath:false` | .91 1.0 .97 1.01 1.05 1.07 1.05 1.04 |
So AO and sky are not the cause (facade atlas is identical in v38 and v41: both "atlas v2").

Root cause: gfx.js `gfxRender`, `sunPath`: the sun elevation follows `70*sin(pi*(tod-6)/13.5)`, i.e. about 70 deg at midday, against a fixed 34.5 deg in v38 (offset 105,85,65). A vertical wall facing the sun gets n.l = cos(el): 0.34 instead of 0.82, so every sunlit wall drops 25-45% while the hemisphere ambient is unchanged.

Fix (patched in the built HTML by add_fixgfx.py, one value): cap the light elevation at `GFX_SUN_MAX=44` deg in the sun placement line `Math.max(el,12)` -> `Math.min(Math.max(el,12),GFX_SUN_MAX)`. The Sky.js sun position still uses the true elevation. After the fix: worst 0.81, 10th percentile 0.91, median 1.03.

## 3. Evidence and tests
Shots in research/prototypes/graphics/fix/: smoke_before_v41.png, smoke_after.png, walls_{9,27,6}_v38_v41_fixed.png (left to right: v38, v41, fixed).

work/test_fixgfx.mjs page.html [v38.html]:
- fixed build (v37 + full chain + cars2 + fixgfx): PASS smokeNoBlackQuads {blackPct .01, meanLum 98.8}; PASS wallLuminanceVsRef {worst .81, p10 .91, median 1.03}
- v41: FAIL smokeNoBlackQuads {blackPct 69.01}; FAIL wallLuminanceVsRef {worst .53, p10 .72}
- test_gfx.mjs: PASS. test_facades.mjs: no failures, 14 shots. fps.mjs (Metal): 60.3 fps, load 1.2 s.
