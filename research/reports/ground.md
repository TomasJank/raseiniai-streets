# ground: real ground colours (2026-11-11, third pass: crisp up close)

## What changed
- `pipeline/geo/ground_map.py` (PIL only, deterministic, about 45 s) writes two maps:
  - `ground_in.webp`: 4096², 1.25 m/px, game ±2560 m, from the 2024 orthophoto ORT10LT level 11 (0.26 m, reduced 4x).
  - `ground_out.webp`: 1024², 7.1 m/px, game ±3620 m, from 144 level-8 tiles (2.6 m). These live in `research/geodata/ortho/tiles/L8/` (gitignored); `--fetch` downloads them again.
- Masks:
  - OSM (v37 rasData) and GRPK footprints, grown by 2.5 m.
  - Tree canopy: pixels that are green and textured.
  - Cast shadows: dark pixels within 20 m of a roof or canopy.
- **Surface classes (second pass).** The photo decides where each surface is; the palette decides its colour.
  - Every photo colour (after removing haze) is classed as grass, soil and beds, gravel/dirt/stubble, paving/sand, or asphalt. Deep shade counts as unknown.
  - A bright pixel within 6 m of a footprint counts as unknown too: it is a roof the footprint missed, because the photo leans.
  - Masked and unknown pixels take the class most common around them (pull-push per class, then argmax). Grass gets a +40/255 bias, so a masked pixel stays lawn unless clearly surrounded by something else. It is never a grey average.
  - Each class is painted in its palette colour, varied ±6% by the photo's local light/dark.
  - Inside built-up land (GRPK `built` polygons grown by 15 m, feathered) the town palette is used alone. Lawn is (90,124,56), about (99,136,70) on screen, more saturated than v46's ground.
  - Outside built-up land, the farm palette is blended 50/50 with the graded photo of the first pass. This keeps the field patchwork and the photo's own variety, but cleaner and greener at eye level.
- GRPK land cover only fills where the photo has nothing usable nearby (forest interiors) and past the photo's edge.
- Water: GRPK water plus OSM natural=water/riverbank/reservoir/basin, and surface GRPK streams (`hc*`). All are painted dark neutral (64,64,54) and grown 3 m. Nothing is blue.
- **Crisp at eye level (third pass).** A 1.25 m map magnified a few metres from the camera blurs every class edge over a metre or more, and WebP's half-resolution chroma doubles that. The fix has two parts:
  - The inner map's alpha channel now carries the town class exactly: `255-16k` for TOWN key k, 255 for no class. WebP alpha is lossless.
  - The shader takes the class of the nearest texel. Its sampling grid is wobbled by value noise (0.6 and 2.1 cycles/m, about ±0.8 texel), so the edge is an organic line, neither a staircase nor a blur. It paints that class's palette colour, keeping only ±10% of the map's light/dark.
  - Outside town (fields), the nearest texel's colour is used wherever the bilinear and nearest colours differ by more than .02–.05.
  - All of this fades back to plain bilinear sampling once a texel covers more than about one screen pixel, so top-down and distant views are unchanged.
  - The in-class shading from the photo is ±6% (was ±12%), so lawns are not blotchy.
  - On the phone the 4096→2048 downscale is nearest (`imageSmoothingEnabled=false`), so class codes are never averaged into a third class.
  - The town palette reaches the shader from `ground_map.TOWN` via `add_ground.py` (`GMAP_TOWN`).
- `pipeline/ground.js` + `pipeline/add_ground.py` otherwise as in the first pass:
  - Embeds the two WebP files and wraps the ground material's `onBeforeCompile`: map colour × fine noise goes in before `grainShader`'s grain, so wet and snow still apply.
  - The OSM green-sheet mesh now shares the ground material.
  - `buildGrass` is wrapped so blades grow only where the map is green.
  - The phone gets a 2048 inner map.

## Anchors (all kept intact)
- `</body>`: the two data blocks go in before it.
- `function buildExtra(){`: the `ground.js` code goes in before it.
- `buildLandmarks();buildStreets();` becomes `buildLandmarks();buildStreets();groundInstall();fixGround();`
- No existing function body was edited.

## Numbers (third pass; "after" = v49 with only this step's files swapped in)
- Page bytes: v49 12,086,074 → 12,337,510 (+251,436 B, from the lossless class alpha). The whole ground step is now 1,057 KB of WebP, about 1.41 MB as base64. The full current chain builds to 12,338,892 B.
- fps / load on Metal (`work/fps.mjs`), two pairs: v49 60.3 fps / 2122 ms and 60.3 / 2109 ms; after 60.3 / 2109 ms and 60.3 / 2086 ms.
- Heap: retained after a forced GC (precise memory, `t/mem.mjs`) is 343 MB for v49 and 343 MB after.
- Tufts, share of blade-map texels that grow grass within 20 m:

  | Spot | v49 | after |
  |---|---|---|
  | church lawn | .659 | .590 |
  | south courtyard | .576 | .532 |
  | Jurbarko g. yard | .565 | .536 |
  | field edge | .884 | .881 |

  Small gravel and soil specks that bilinear filtering used to dissolve into lawn are now their own crisp patches, so they lose their tufts. On lawn the density is unchanged.
- Builds and map runs: two builds of the full chain are byte-identical; two runs of `ground_map.py` give byte-identical WebP files.
- Tests on the full chain:
  - `test_ground` PASS on desktop and phone, with a new check that the class alpha is present.
  - `test_fixground` PASS, `test_solid` all passed, `test_drive2` all ok with no errors, `test_water3` PASS, `test_landmarks2` PASS, `test_roads2` PASS (run from `work/`, it reads repo-relative paths).
  - `test_fixwater` times out waiting for `water2` meshes on unmodified v49 too: water3 replaced them. That is not from this step.

## Comparison images (`research/prototypes/ground/`)
- Eye level, v49 | after:
  - `eye_garages.jpg` and `eye_yard_town1.jpg` (the two bld2 spots)
  - `eye_church.jpg`, `eye_south.jpg`, `eye_jurbarko.jpg`, `eye_field.jpg`
  - `phone_eye_yard_town1.jpg`: the phone path, after only.
- `top_{centre,church,south,country,edge}.jpg`: v49 | after | orthophoto. They are indistinguishable at that scale, as intended.

## Left / not verified
- Town yards come out greener than the photo, by design (lawn default).
- Gravel and paving patches are flat colour plus the existing grain. There is no extra in-class texture.
- Fields (no class alpha) are only crisp where neighbouring texels differ clearly. Large uniform fields stay smooth, which reads fine at eye level.
- Seen while comparing, not mine: building wall colours in v49 change from one load to the next (the same house was yellow on one load and green-yellow on another). Something in a later step is not deterministic per load.
- GRPK stream codes `op*` (piped) and `fhc*` (through a lake) were inferred from how they lie on the photo, not from a code list.
- The orthophoto is a spring image.
- The seam at the photo's edge is soft but visible as a resolution change.
