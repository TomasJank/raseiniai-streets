# trees2: missing trees and tree species (2026-11-10)

## What changed
- `pipeline/geo/trees2_map.py` (PIL only, deterministic, about 20 s; two runs give byte-identical output) writes `pipeline/geo/trees2_data.json`: the new trees and a species byte for every scanned (LiDAR) tree.
- `pipeline/trees2.js` + `pipeline/add_trees2.py` (step `trees2`, after `bld2`): add the new trees at run time through the game's own tests, give every tree a kind, and draw all trees (the old builder no longer runs).
- `work/test_trees2.mjs`.

### The finding that shaped this
The LiDAR tiles (`rasData.tr.cover`, 41 tiles of about 1 km) cover almost the whole play area: only a strip along the north edge and a few slivers are outside. The bare stream valleys and field edges are mostly inside the tiles. The scan simply has few or no trees there: shelter belts are lines of 5-9 m willows and alders that the old renderer drew as small lollipops (crown clamped to `h*.3+.5` while the scanned crowns are 3-7 m wide), and many belts and young plantations are missing altogether. The conifer flag is also missing on most of the spruce and pine: the forest by the Raseinių piliakalnis is near black in the photo and was drawn as light broadleaf blobs.
So the fill uses the orthophoto everywhere it exists, and the cadastre past its edge. No scanned tree is moved, removed or resized; new trees go only where no scanned tree explains the canopy.

### Where new trees go (density rules)
1. **Orthophoto canopy** (ORT10LT 2024, level 11 reduced to 1.25 m/px, the same frame as `ground_map.py`, whose `ortho_layer` is reused):
   - bright broadleaf canopy: `ground_map.py`'s own canopy mask (green and textured, not next to bright roofs);
   - dark canopy for conifers: luminance 18-82, texture > 5, green ≥ red. Used only inside GRPK forest (`ms0`) and tree-and-shrub (`sd15`) polygons and within about 10 m of water, and never within 15 m of a building: elsewhere a dark textured patch is as often a furrow, a ditch or a cast shadow (checked on the field pairs; furrows were the false positives).
   - minus what a scanned tree explains: a disc of crown radius + 1.2 m round each LiDAR tree, or 0.6 x crown + 0.5 m in forests, belts and by water, where a scanned crown is often a thicket the game draws narrower.
   - a jittered 4.4 m grid, thinned to about 4.6 m in forest, 4.4 m in belts, 4.8 m in open land, 5.5 m in built-up land (GRPK `pu0`).
2. **Past the photo's edge** (north strip, z < -2520): GRPK forest at 5 m, belts at 5.5 m with 30% gaps.
3. **Orchards** (GRPK `ms4`): rows along the polygon's longest edge, 6 m apart, 4.5 m in the row, 15% gaps, trees 2.8-4.4 m. Only where the scan has fewer than one tree per 150 m2: the old orchards and garden plots (school orchard on Kalnų g., the allotments) already have their scanned trees; rows are for the young plantations the scan missed (the one at about 1190,-1617 in game metres matches the photo's rows).
4. Offline, a new tree is dropped where a scanned tree crowds it (closer than 0.6 x the sum of the crown radii) and where another new tree is within 3.6 m (3 m in orchards).
5. At run time every new tree must also pass: inside the play box; no building at its trunk or 1.2 m round it (`world.inBuilding`, so `bld2`'s buildings count); not on a road, path, pavement or lot (`W.ground`) and more than half the width + 1 m from any road segment; not in water (`water3At`, and more than half the width + 0.8 m from a drawn stream); not on a pitch or the Žemaičio square paving; not crowded by an existing tree. `world.treesOnRoad` is unchanged (553): new trees are filtered before, not counted.

### Kinds
Eight kinds, three crown shapes, all in the existing faceted style (the original blob with its per-facet shading):

| kind | shape | how it differs | where |
|---|---|---|---|
| lime / maple / oak | round blob (the old one) | as before, crown may now follow the scanned crown up to `h*.36+.6` | streets, parks, yards, forest |
| birch | round blob, narrow and tall | fresher green, thin white trunk | yards, forests, belts |
| apple / plum | round blob, low and wide | short trunk | yards under 7.5 m, orchards |
| alder | round blob, dark oval | wide crown from the scan (`h*.5+.5`) | belts, waterside, low wide thickets |
| willow | weeping blob (lower half hangs out and down) | silver green | within 10 m of water, belts |
| pine | round blob, flat, high | tall orange-brown trunk | forests, some yards |
| spruce | three-tier cone | dark blue green | forests, yards |
| thuja | three-tier cone, narrow | small | yards, conifers under 7 m |

Assignment (`kind()` in `trees2_map.py`): GRPK class around the tree, within 10 m of water, LiDAR height and crown, and the conifer decision. Conifer: the LiDAR flag, overridden by the photo where it is clear and away from building shadows (over half the crown pixels dark canopy and under 20% bright → conifer; over 40% bright → broadleaf); 2,552 scanned trees changed. Low wide broadleaf crowns (h < 10 m, crown radius > 0.55 h) in belts, forests and open land become alder or willow thickets. The species shares inside each context are judgement, steered by Lithuanian forest statistics for forests (pine, birch, spruce and alders lead), not a survey of individual trees.

Rendering: per 320 m chunk one trunk mesh (per-instance trunk colour) and one crown mesh per shape present, each its own `TREES` entry sharing the chunk's trunk mesh, so `perfTick`'s three LODs, near-only shadows and trunk culling work unchanged (weeping and round crowns have the same LOD levels; the cone's far level is the single cone). `t.tk` / `t.cr` are set as before, so `snapTree` knocks any tree over. Crowns now whiten in snow on upward faces (`ENV.snow`); before this step trees did not react to snow at all (measured: crown saturation 0.51 → 0.41 in snow on the old page, 0.50 → 0.20 now). There was no autumn tint in the page to keep; night is lighting only and is unchanged.

## Counts (built page, desktop)
| | before | after |
|---|---|---|
| scanned (LiDAR) trees | 32,441 | 32,441 (same positions, heights, crowns; 2,552 conifer flags changed by the photo) |
| old OSM forest, park and cemetery fill | 274 | 274 |
| new from the photo / GRPK / orchards | 0 | 28,902 (32,506 shipped, run time drops 274 outside the box, 712 on roads, 304 in water, 13 on pitches, 2,301 crowded) |
| total | 32,715 | 61,617 |

By kind after: lime/maple/oak 18,483 · birch 11,468 · apple/plum 10,401 · alder 6,971 · willow 3,477 · pine 4,141 · spruce 5,990 · thuja 686.

## ez-tree
Evaluated `@dgreenheck/ez-tree` 1.1.0 (MIT) in the same Chromium/Metal, presets Ash/Aspen/Oak/Pine:
- 5,300-21,000 triangles per tree (Ash Medium 9,120 branch + 10,880 leaf; Oak Small 3,206 + 3,600). Ours: 320 at the near LOD, 80 and 20 further out, 42 for a spruce.
- Leaves are alpha-tested textured cards (alphaTest .3-.5) with photo bark textures: a different, near-photographic style, plus alpha-tested leaves in the shadow pass.
- The ES build is 4.0 MB because the textures are inlined (23.9 MB unpacked package).
- Generation is fast (4-19 ms per preset), so load time is not the issue.
Even as instanced templates, 60,000 trees at 10-20k triangles is out of reach (the whole frame is about 5 M triangles today), and it would not match the faceted style. Shapes are built in code instead (`blob`, `weep`, `tiers` in `trees2.js`, about 1 KB).

## Numbers
- Page bytes: 11,468,156 → 11,833,074 (+364,918: 356,170 B data as base64, 8.7 KB JS). Data: 7 bytes per new tree (x, z at 0.25 m, height, crown, kind) and one byte per scanned tree.
- Two builds byte-identical; two map runs byte-identical.
- `trees2Build` takes about 175 ms in the page (decode and match 32 ms, run-time filters about 80 ms, meshes 62 ms); the old tree builder was not timed separately.
- `work/fps.mjs` on Metal (1280x720, vsync cap), two pairs: base 60.3 fps / 1903 ms and 60.3 / 1951 ms; with trees2 60.3 / 2102 ms and 60.0 / 2022 ms (load +70 to +200 ms).
- Fixed camera views with the camera forced every frame (rAF fps; median of 30 readPixels-synced renders; draw calls; triangles incl. shadow pass), base → trees2:
  - raised 140 m over the piliakalnis forest: 60.3 → 60.3 fps, 8.4 → 8.1 ms, 565 → 944 calls, 4.08 → 5.21 M tris
  - raised 140 m over the north-west forest: 60.3 → 60.3, 10.6 → 10.5 ms, 548 → 936 calls
  - raised 90 m over the town (the worst found): 60.3 → 60.3, 10.9 → 12.5 ms, 727 → 1095 calls
  - street level: 60.3 → 60.3, 10.2 → 10.4 ms
  The draw-call rise is one crown mesh per crown shape per chunk; it costs about 1.5 ms where it shows.
- `test_gfx` render median 10.6 ms (p90 11.1).
- Gates on the full chain + trees2 (no `bld2` or `roads2` yet, they were not in the repo when I built):
  - `test_trees2` 8/8 PASS (two runs).
  - `test_water3` PASS (13/13; 61,617 trees, none in water).
  - `test_fixground` PASS, `test_gfx` PASS, `test_drive2` all ok, errors [], `test_streets` PASS (14 streets).
  - `test_solid`: first run failed "peds clear of solids" (one walking pedestrian inside a building at (-144,-165) at frame 600; no tree within 10 m of that point); reruns: base all passed twice, trees2 all passed twice. A random-pedestrian flake, not this step.
  - `test_ground`: desktop PASS; phone FAILS "rendered ground within 35% of the map colour" at the grass sample (-1440,-1800). Three *scanned* trees stand there (crowns 6-8 m, tree indices 4677/4690/4723, not new ones); the old renderer clamped their crowns narrower and the point showed between them. The test already tolerates a tree on one grass point in its snow check; the same tolerance (skip sample points under a tree's crown) is needed here. Not edited: `test_ground.mjs` is the ground step's file.
  - `test_facades2` builds its own page without this step; not run.
  - No console errors in any suite.
- Also applied after the current `roads2` and `bld2` (chain + roads2 + bld2 + trees2, built in my scratch, `build.sh` untouched): applies cleanly; 32,408 scanned trees (33 fewer: the old decode drops those inside `bld2`'s new buildings, as it always did), 28,892 added (10 more cut by new buildings), 61,574 total, no page errors.

## Anchors and edits
- Inserted before `function buildExtra(){`: `const TREES2=…;` and `trees2.js`.
- Inserted before `  if(trees.length){\n    // chunked so each block of trees is culled on its own` (inside `buildWorld`): `  trees2Build(trees,W,P,inBox,mm,TR);trees.length=0;\n`. The old builder below stays in the page but no longer runs (`trees` is empty); `W.trees` and `W.treeData` are set by `trees2Build` in the same order (old trees first, new appended).
- No existing function body edited.

## Comparison images (`research/prototypes/trees/`)
Top-down, before | after | orthophoto:
- `top_valley.jpg`, `top_forestout.jpg`: stream valley and forest in the north strip, outside the LiDAR tiles and past the level-11 photo (reference is the 2.6 m level-8 photo).
- `top_belt.jpg`: shelter belts along field ditches east of town.
- `top_orchard.jpg`: young orchard rows north-east of town.
- `top_forestSE.jpg`: the forest at the Raseinių piliakalnis (scanned, now with conifers from the photo).
- `top_centre.jpg`: town north of the park.
Eye level and raised, before | after: `eye_street.jpg`, `eye_residRaised.jpg` (yards with fruit trees, birch, thuja), `eye_park.jpg`, `eye_parkRaised.jpg`, `eye_forestEdge.jpg`, `eye_raisedForest.jpg`.

## Left / not verified
- Belts the photo shows as grey-green (willows not yet in leaf in a spring photo) are missed by the canopy masks; some belts stay thinner than the photo.
- Species shares are judgement; only conifer versus broadleaf is measured (photo). Pine versus spruce, and every broadleaf species, are assigned by context and a hash.
- Orchard row direction is the polygon's longest edge, not measured; row spacing is one value for all plantations.
- The visible credit line does not name GRPK or the 2024 orthophoto (the ground step only has them in a code comment); this step uses both too. Worth adding to `#credit` once, by whoever owns it.
- Phones get the same trees.

## Shape pass (2026-11-11): no more flat crowns
The first pass widened crowns toward the scanned crown radius. For fruit trees, alders and willows that gave crowns up to 9 m wide and 3-4 m thick on a 2 m trunk, fusing into slabs at eye level (the owner's "why trees look like this"; the Norfa tree at about -93,-197). In v49, 6,460 broadleaf crowns were wider than the tree was tall and 12,535 were less than 3/4 as thick as wide.

Rule now (`t2Shape` in `trees2.js`), r = crown radius, cv = crown half-height, h = tree height:
- lime/maple/oak: r ≤ 0.32h + 0.5, cv ≥ 1.05r (round or upright, as in v47)
- birch: r ≤ 0.2h + 0.3, cv ≥ 1.3r (narrow)
- apple/plum: r ≤ 0.48h (no wider than tall), cv ≥ 0.82r, trunk at least 1.2 m
- alder: r ≤ 0.3h + 0.3, cv ≥ 1.15r
- willow: r ≤ 0.42h + 0.3, cv ≥ 0.85r (the weeping crown hangs lower)
- pine: crown thicker (cv ≥ 0.75r, r ≤ 0.2h + 0.8)
- the second horizontal axis is now jittered only narrower (0.85-1.0 r, was 0.85-1.15)
- trunk 15-75% of the height for every broadleaf tree.

A broadleaf scanned crown 1.6 times wider than its drawn crown (several trees merged in the scan, or a thicket) gets one more tree (two at 2.3 times). They go round the scanned tree at 0.9-1.6 r, 78-95% of its height, same kind, through the same run-time tests as the other new trees. The scanned tree stays in place. That adds 12,141 trees (1,692 positions rejected by the tests).

Counts: shape parameters changed for 40,972 trees (lime/maple/oak 4,547, birch 11,462, apple/plum 10,385, alder 6,965, willow 3,475, pine 4,138; spruce and thuja unchanged), plus the narrower jitter on every broadleaf crown. Total now 73,715 (32,408 scanned + 274 old fill + 28,892 added + 12,141 splits). Willow colour is greener (was olive).

`test_trees2` has a new check on the drawn instance matrices of all 62,903 broadleaf crowns: 2r ≤ h + 0.5 m, cv ≥ 0.75r, trunk 15-75% of h. All 62,903 pass now; on v49, 6,460 were too wide and 12,535 too flat.

### Geometry growth in `test_fixfreeze` (v49)
Every chunk cloned the crown and trunk geometries, and the two far LOD levels too, for its bounding sphere: 795 crown entries x 3 plus 300 trunks. A clone is uploaded the first time a LOD switch draws it, so driving past new chunks during the hits uploaded new geometries. The integrator measured 1906 → 1964 on v49; v47 had the same pattern with fewer clones. Now every chunk shares the 9 crown geometries and the trunk, and the chunk sphere is set on the InstancedMesh itself (three 0.187 culls an InstancedMesh by `object.boundingSphere`), so culling is unchanged.

`test_fixfreeze`, geometry count base / after thefts / mid / end:
- without trees2: day 1089/1093/1095/1096, night 1159/1161/1167/1167
- fixed: day 215/216/216/216, night 284/285/287/288
- both PASS.
Renders match the per-chunk-clone version: mean pixel difference 0.00-0.07 of 255 over 7 eye views and 2 top-downs. The fixed views also got cheaper: draw calls 951 → 279 over the forest, synced render 9.9 → 6.4 ms.

Numbers, Metal, against the chain without trees2:
- Page 12,087,456 B (+1,382 over v49); two builds byte-identical, and the same as `sh pipeline/build.sh`.
- Load (3 runs each): no trees2 1938-2074 ms, v49 2103-2159 ms, fixed 2197-2237 ms.
- Fixed views: 60.3 fps in all four; synced render 6.4 / 6.1 / 7.5 / 5.8 ms (piliakalnis forest / north-west forest / town / street), against 10.1 / 10.8 / 12.2 / 9.9 ms in v49; 268-451 draw calls.

Pictures, v47 | v49 | fixed: `research/prototypes/trees/shape_{norfa,norfaEye,street,park,fruitYard,waterside,forestEdge}.jpg`.

Gates on the current chain (`sh pipeline/build.sh` output, same bytes as my build):
- `test_trees2`: PASS, all checks including the new crown-proportion check.
- `test_solid`: all passed.
- `test_water3`: PASS.
- `test_ground`: PASS, desktop and phone, with the integrator's updated "all but one sample" rule.
- `test_fixground`: PASS.
- `test_gfx`: PASS, render median 7.4 ms (p90 7.6).
- `test_drive2`: all ok, errors [].
- `test_streets`: PASS.
- `test_fixfreeze`: PASS, day and night.
