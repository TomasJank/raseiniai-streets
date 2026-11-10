# facades2: facade detail v2 (street-file knobs for buildings and fences)

Files: `pipeline/facades2.js`, `pipeline/add_facades2.py` (step `facades2`, append after `drive2`: `... fixground kick parked2 drive2 facades2`; `build.sh` is not edited, add the word there),
`pipeline/edge_ids.py` (new helper), `work/test_facades2.mjs`, `work/build_facades2_test.sh`, `work/facades2_test/f2a.json` + `f2b.json` (scratch street files that use every key).
Edited as allowed: `pipeline/add_streets.py` (validator, `ridge` direction emit, two fence styles) and `pipeline/streets/README.md` (new "Facade keys" section, fences row).
Shots: `research/prototypes/buildings/v2/` (24 PNG).

## New schema keys (street file, `looks.<id>`)

| key | value | effect |
|---|---|---|
| `wall2` | `[r,g,b]` 0..1 | colour above `band`, walls and gable ends; `wall` stays below |
| `band` | metres 0.5..60, default 3, needs `wall2` | height above the lowest corner where `wall2` starts |
| `faces` | `{"windows":[1,0,1,1]}`, one 0/1 per outline edge | 0 = same material, no windows, no balconies. Edge `i` = OSM vertex `i` to `i+1`; `python3 pipeline/edge_ids.py c4185` lists edges with length and compass side |
| `blankGable` | bool | no windows on both gable-end walls of a gable (not hip) roof |
| `balcony` | bool | `false` none, `true` forced (long walls, every other bay, 2nd floor up, needs windows and 2+ floors) |
| `chimney` | bool | `false` none, `true` one on the ridge of any 4-corner pitched roof |
| `dormer` | bool | `false` none, `true` forced on a 4-corner pitched roof (rise 1.2 m, span 5 m, ridge 6 m minimum) |
| `roofSty` | `tiles sheet flat corrugated asbestos` | roof material (clay tile, standing seam, bitumen, trapezoid steel, asbestos sheet); also on flat roofs |
| `ridge` | `"street"` or `"across"` | ridge along the nearest street (eaves to the road) or across it (gable ends to the road); 4-corner pitched roofs |

Fences (`fences[]`): new `style` values `panel` (concrete panel 1.8 m on a grey plinth with grey posts) and `slat` (dark wood slats 1.7 m, posts), `col` `"#rrggbb"` on any style, `dense: true` on `hedge` (two stacked layers, 1.15 m thick at the base).
All keys are validated by `add_streets.py --check` (unknown keys, ranges, `faces` length against the real outline, `dense` only on hedges). `--check` passes for all 14 existing street files and the built page differs from before only by the two new `STREET_FENCE` entries.

## How it works
- Two-tone: merged building geometry gets a `tone` vec4 attribute (`rgb`, `-(bandY+500)`); the GL default (0,0,0,1) means no band, so geometry that never sets it is untouched. `facadeShader` picks `tone.rgb` over the vertex colour above the band (`vY` varying), the window texture still multiplies on top. +8.6 MB of vertex data for 539k vertices.
- Per-face windows: the atlas is 2048x512 now (was 2048x256). Rows 2 and 3 repeat rows 0 and 1 painted without `win()`, so a masked wall keeps the same brick/plank/panel pattern and only loses glass and frames. A masked edge writes `sty+16` into the vertex style; the shader reads `bl=step(15.5,vSty)`. Paint order is arranged so the noise seed after the atlas is unchanged and the existing 16x2 tiles are pixel-identical.
- Balcony/chimney/dormer overrides read the look keys in `buildFacadeDetails` (patched by `rep` on the full build). Forced dormers bypass the 260 cap; the automatic dormer rule now stops at 239 so a street file's forced ones fit under the cap `test_facades` asserts.
- Ridge direction: `add_streets.py` turns `ridge` into a unit vector `rdir` (nearest centreline segment, or its normal) in the LOOK entry; `pitchOrder(p,s)` (shared by the roof builder and the chimney/dormer code) picks the corner order whose first edge is closest to it. `front` still wins.
- Fences: per-colour instance keys (`fence:style|#col`); `fence2()` draws the new styles from the same unit-box instances, so draw calls stay flat.

## Fixes
- `pitched:false` did not flatten: the data's `skel` (straight-skeleton hip) and `tops` (single slope) survived the look. Now cleared when a look says `pitched:false` (test: skeleton building c3799 has top = eave).
- Automatic balconies no longer fire on a building whose street look sets an explicit `sty` (balconies 300 -> 229 in the 14-street build; the street-file buildings that lost them are the ones the agents had restyled).
- X-shaped artefact (Kalno): reproduced in the Kalno "after" frame as dark X lines on gable ends of cross-gabled houses. Cause is the 0.5 m eaves overhang of each wing, whose dark underside pokes through the other wing's roof and gable. Every pitched part of a multi-wing house is flush with its walls now (553 houses; test asserts no eaves triangle leaves any footprint). The dormer mesh itself has no crossing faces (test checks all triangle pairs) and all 260 dormers of the earlier build sat within 0.45 m of the roof surface, so it is not the dormer.
- `brick` and the wall tint: no code change needed. The brick tile is neutral grey (asserted) and multiplied by `wall`, so `sty:"brick"` with `wall:[.86,.72,.4]` renders yellow brick (shot `brick_tint.png`). The red the Dominikonu agent saw is the automatic `BRICK` palette used when a look gives no `wall`, and the automatic brick-to-silicate swap for pale walls, which skips looks with their own `sty`. Documented in the README.

## Tests
`node work/test_facades2.mjs` (builds `work/facades2_test` itself with the whole chain plus `facades2`, needs the network for three.js): PASS, no console errors, 14 checks
- twoTone: `tone` attribute on c3823 equals `wall2`, band equals yb + 0.3 + 3.5; shader source has `vTone`; neutral buildings keep (0,0,0,1). twoToneRender: rendered pixels below the line are cream (r-g -4), above are red-brown (r-g 28).
- maskedFace: edge 1 of c4185 = 2 triangles with style >= 16, facing NE as `edge_ids.py` says; `blankGable` on c4161 = 4 triangles (both gables, both sides of the quad); c3823 none. Atlas: the blank plaster tile has 0 glass/frame texels, the normal one 4400.
- balconyOverride: c3823 (street `sty`) 0, c3828 `balcony:false` 0 (was 12), c3718 `balcony:true` 15; automatic total still 260.
- chimneyDormerOverride: forced dormers 2, forced chimney 1, `dormer:false` 0 (was 1), `chimney:false` 0 (was 1).
- roofFlattened, ridgeAcross (ridge edge parallel to `rdir`), brickTint, fences (all four `col` values present on instanced meshes), dormerFaces (6 triangles, 0 crossings), wingEaves, drawCalls (10 `fx_` calls, same as before).
Regression on the default 14-street build (`build.sh` + `facades2`): `test_facades` PASS (10 draw calls, 44k extra triangles, atlas 2048x512 <= 2048), `test_solid` PASS, `add_streets --check` ok x14. `test_streets` reports only "6 talks, json 5" for 8 streets, which the same test gives on the build without `facades2` (checked; extra talk lines from an earlier step); all looks resolve, all 2170 solids push out, 0 bad peds, no console errors.
Atlas: the 16x2 original tiles are byte-identical (hash of the old 2048x256 data equals the matching half of the new one). Deterministic: two builds of the page and two of the scratch street build compare byte-identical (`cmp`).

## fps
`node work/fps.mjs`: Metal 60.3 fps with `facades2` and 60.3 without (vsync cap); SwiftShader 1.3 for both (host load average ~90 from other sessions, no ranking possible). JS heap after a forced GC 307 MB vs 272 MB (atlas, `tone` attribute).

## Limitations
- `faces` and `blankGable` mask walls of a single-part building; houses built from `parts` (multi-wing) ignore them, as do `ridge`, `chimney` and `dormer` (4-corner single roofs only).
- Edge indices follow the OSM vertex order; if the build drops two vertices closer than 5 cm the index shifts (rare).
- `band` counts from the lowest footprint corner, so on a slope the line sits a little off a floor line. The change of colour is a hard edge at that height, no cornice.
- `balcony:true` ignores the town block (`blk`) loggia exclusion; balconies go on every other bay of the two longest walls, not per-wall.
- `ridge` needs the street file's own street to be the nearest centreline of the building, which `looks` ids (within 45 m) almost always satisfy.
- `dense` hedges are two stacked boxes, not a leafy volume; `col` on `panel` colours the panel only (plinth and posts stay grey).
- `add_roofs.py` (another agent, untracked) sets `roofSty` strings automatically; `facades2` reads the same convention. Its automatic value is ignored on flat roofs here (only a look's own `roofSty` retextures a flat roof). Order in `build.sh`: `facades2` before or after `add_roofs`; its anchors on `roofSty` are different from the ones used here but apply to the same function, so run `facades2` first if one of them ever fails.
- Still not expressible from the street reports: gate props, roof overhang amount, solar panels, removing an OSM building that does not exist, stepped lean-to volumes inside one footprint, cemetery wall with crossed pillars, per-wall billboard material.
