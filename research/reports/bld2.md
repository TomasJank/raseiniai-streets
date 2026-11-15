# bld2: cadastre buildings (2026-11-10, wave 2)

Files: `pipeline/add_bld2.py`, `pipeline/bld2.js`, `pipeline/geo/bld2_build.py` (offline matcher, needs the ORT10LT tiles, not run by the build), `pipeline/geo/bld2_data.json` (81,504 B, committed output of the matcher), `work/test_bld2.mjs`, this report, `research/prototypes/bld2/`.
Build position: after `landmarks2` (needs `roofs`: it reads `ROOFS`), either side of `roads2`: `... landmarks2 bld2`.

## Match (GRPK `grpk_buildings.json`, 8,628 footprints, against the 6,666 OSM building ways; 6,664 are drawn)
Overlap by 0.5 m grid sampling of each polygon against the other source, not centroid distance.

| | count |
|---|---|
| cadastre footprints covered >= 50% by OSM (matched) | 6,079 (363 of them lie over several OSM buildings) |
| cadastre covered 10-50% (partial: extension, or a split drawn differently) | 297, left alone |
| cadastre-only (< 10% covered) | 2,252: 460 inside the OSM extract, 1,792 outside |
| OSM buildings covered >= 50% by cadastre (matched) | 6,139 (306 of them split into several cadastre footprints) |
| OSM covered 10-50% | 160 |
| game-only (OSM, < 10% covered) | 367, untouched |

## Added buildings: 1,657 (406 in the OSM extract, 1,251 outside it)
Candidates were the 2,252 cadastre-only footprints within the ground plane (+-3,600 m; 456 are beyond). Dropped, in order: class `pa6` towers 27 (landmarks2 has them), under 6 m2, round tanks/silos 28 (more than 12 vertices, under 150 m2), overlapping an OSM building 21 or an earlier added one 13, on a road 7, within 1 m of water 5 (GRPK ponds, OSM water, surface streams), OSM draws the same building a few metres off (an unmatched OSM building within 10 m of similar area) 7, photo shows vegetation 10 or bare soil/sand 21. Each footprint is also given a roof colour from the orthophoto.
Orthophoto test: the interior (0.6 m eroded) of the footprint in ORT10LT level 11 (tiles for the ring outside the town fetched into scratch, not committed). Rejected if more than 35% of pixels are green-dominant, or the mean is warm soil/sand (r > g > b, r - b >= 10; roofs here are blue-shifted).
By-eye check (below): the filter is lenient. It rejects bare lots and meadow but keeps demolished-foundation lots and buildings under trees.

Classes of what was added: no PASK 1,126 (+74 with an unconfirmed code), PASK 110/140 dwellings 376, 240 farm outbuildings 64, garages 9, 266 garden houses 4, greenhouses 4. Unclassified ones are sorted by area: under 45 m2 small outbuilding (500), 45-250 m2 unclassified building (580), 250 m2 and up farm hall (120).
Nodes, ways and tag entries are appended to `rasData` (ways 8,289 -> 9,946, nodes 52,473 -> 62,822, tags 443 -> 451); nothing existing moves. Every added way has tag `bld2:<class>` and an OSM-style `building` value (`garages`, `greenhouse`, `farm_auxiliary`, `shed`, `house`, `apartments`, `yes`), so they go through `buildWorld` like any building: drawn in the merged mesh, in `bGrid` and the wall grid (solid), in `mm.buildings` (minimap), `W.buildings`/`inBuilding` (trees, pedestrians, cars).

## Height rule
No LiDAR exists for them, so height comes from kind and footprint. Garage 2.5-3.0 m (hash); greenhouse 2.3; small outbuilding (< 30 m2: 2.4 m, rising to 3.5 m at 120 m2, plus 0-0.3 m hash); hall (>= 150 m2) 4.4 m rising to 6.0 m at 700 m2; garden house 2.7-3.2; unclassified 45-250 m2 3.1-3.6 m (single storey); PASK 110/120/140 dwellings keep the game's own house rule (4.6-6.2 m, 9-15 m apartments). Reason for the last: the 2,088 LiDAR-measured buildings the cadastre calls 110 have a median wall height of 5.5 m (deciles 3.6 to 7.3), so the game's house rule matches the data; the cadastre does not give storeys. Eaves heights here, a pitched roof adds on top (as for every building).

## Use codes (PASK)
GRPK spec D1-415 (Aplinkos ministras 2023-12-18, table 18): PASK is the building's main use from the Real Estate Cadastre and/or Infostatyba. Code meanings are from the Registrų centras classifier "NTR paskirčių tipai" (get.data.gov.lt, ntr_paskirtys/NtrPaskirtiesTipas, dated 2024-10-31). The portal blocked this machine, so only the codes a search returned are confirmed:

| PASK | meaning | count in GRPK | used for |
|---|---|---|---|
| 110 | Vienbučių (single-family) | 2,874 | dwelling, unchanged |
| 120 | Dvibučių (two-family) | 21 | dwelling, unchanged |
| 140 | Daugiabučių (multi-apartment) | 144 | apartments tag on added ones |
| 220 | Garažų (garages) | 290 | garage look |
| 240 | Pagalbinio ūkio (auxiliary farm) | 355 | barn/shed look (hall if >= 150 m2) |
| 266 | Mėgėjų sodų (amateur gardens) | 379 | garden-house look |
| 150, 202, 210, 212, 214, 216, 218, 222, 224, 225, 228, 230, 232, 234, 236, 264, 292, 294, 296, 498, 590 | not confirmed | 401 together | nothing; only area decides |
| none | | 4,164 (4,096 `pa0`, 32 `pa23` garages, 27 `pa6` towers, 9 `pa58` greenhouses) | class `GKODAS` only |
`GKODAS`: `pa23` garage, `pa58` greenhouse, `pa6` tower (skipped), `pa0` building (GRPK spec, same table). Garage = `pa23` or PASK 220; greenhouse = `pa58`.

## Look of outbuildings (`pipeline/bld2.js`, hooked by wrapping `buildingSpec`)
Applies to added buildings and to existing ones the cadastre classes g/h/f/a with at least half overlap (670 existing buildings), unless `LOOK[id]` exists (street files, landmark, club, story steps: skipped entirely) or the LiDAR-measured wall height is 5 m or more (two storeys stay what they were). Photo roof colours from the roofs step are never changed (test checks all of them); their roof pattern is left alone too. Added buildings get a photo roof colour.
- garage: shed, flat roof, windowless walls in corrugated (45%), concrete panel (30%) or brick (25%); roof bitumen or standing seam (when no photo roof); 2.5-3.0 m.
- greenhouse: glass style (the existing atlas tile), pale green, low pitched roof, 2.3 m.
- 240 farm outbuilding / small unclassified: shed in board, corrugated or brick, windowless when small or board; roof asbestos or corrugated; 150 m2 and up become the `industrial` kind with corrugated or panel walls.
- 266 garden house: shed kind with windows in board, plaster (pastel) or brick; pitched when it has four corners.
- chimney, dormer and balcony are switched off on all of them (the `facades2` knobs).
Existing buildings changed: 604 of 670 coded ones differ (kind 387, wall style 526, height 41, 24 lost a pitched roof). Kind changes: house to shed 345, house to industrial 15, apartments to shed 12, commercial to shed 9, commercial to industrial 3, industrial to shed 2, apartments to industrial 1. The other 66 were already what the code says or were two-storey, or had a street look.

## What I looked at (against ORT10LT 2024, footprint outlines on the photo)
| sample | n | judged right | unsure | wrong |
|---|---|---|---|---|
| added, in town (random) | 24 | 21 | 3 (tiny roof, shaded) | 0 |
| added, outside (random) | 24 | 24 | 0 | 0 |
| first filter sample, before the photo test (48 random cadastre-only in town) | 48 | 39 had a visible building | | 9 were meadow, tank, sand, foundations or trees; the photo test rejects 6 of those 9 |
| restyled garage (g) | 24 | 23 | 1 (a large L-shaped complex) | 0 |
| restyled farm (f) | 24 | 16 | 8 (house-sized roofs the cadastre calls auxiliary farm) | 0 |
| restyled garden (a) | 24 | 22 | 2 | 0 |
| restyled greenhouse (h) | 7 | 7 | 0 | 0 |
So 48 added (45 right, 3 unsure) and 79 restyled (68 right, 11 unsure, none clearly wrong). The unsure farm ones are the weak spot: PASK 240 can sit on a house-sized building and it then becomes a windowless shed.
Not checked: the 1,251 outside buildings beyond the 24 sampled, and nothing at all was compared for whether OSM's own `building=yes` classes were right.

## Pictures (`research/prototypes/bld2/`)
Top-down, left to right ORT10LT, game before, game after: `topdown_town1.jpg` and `topdown_town2.jpg` (dense yards west of the centre), `topdown_farm2.jpg` (farmstead outside the OSM extract: empty field before), `topdown_ind1.jpg` (garage and works yard) and `topdown_ind2.jpg` (works yard). Street level before/after: `street_garages`, `street_greenhouse`, `street_yard_town1`, `street_yard_town2`, `street_farmstead`.
Roofs of added and existing buildings come out light grey against the photo's darker roofs; that is the `roofs` step's gain, not changed here.

## Gates (final page `final.html` = full chain + bld2, Metal GPU where a test uses it; machine load 40-70 from the other agents)
- `test_bld2`: PASS, 17 checks (index stability of `w`, `t`, `n` and the LiDAR tables; all 6,664 existing buildings keep id and position; 1,657 added are drawn, found by `inBuilding`, solid by `collide`, overlap no existing or other added building, no road, no `water3At` point; 13 garage-row buildings in garage styles; 7 greenhouses in the glass style; 0 street-look buildings changed; 0 photo roof colours changed; no console errors).
- `test_solid` PASS (810 peds clear of solids, 434 of 436 walked into new solids, poles fall). `test_streets` PASS (14 streets, 2,175 pushOut 0 bad). `test_facades` PASS (9 draw calls, 51,090 extra tris, 310 balconies, 900 chimneys, 239 dormers). `test_landmarks2` PASS. `test_ground` PASS. `test_water3` PASS (also: no tree or car in water). `test_drive2` exit 0.
- `test_roofs`: every check PASS except `afterMatchesFreshBuild`, which rebuilds with `build.sh` and compares; it fails until `bld2` is in `build.sh` (my page has 1,657 more ways). Needed a copy with `../pipeline/streets` resolvable.
- `test_fixwater`: FAILS on the wave-1 page too (its wait for `__g.water.length` times out because water3 replaced the water list); not caused by this step.
- `test_fixground` PASS. `test_facades2` not run (it builds from `work/facades2_test`, no page argument).
- Builds: two builds byte-identical. Page 11,468,156 -> 11,710,713 B (+242,557: about 209 KB in `rasData`, 27.9 KB class table, 5 KB code).
- `fps.mjs` Metal: before 60.3 fps / load 1,952 and 1,910 ms, after 60.3 fps / 1,954 and 1,938 ms (vsync-capped, so spare headroom is hidden; load noisy under the shared machine). Buildings drawn 6,664 -> 8,321. JS heap not measured (the `mem` field flips between buckets, 307/496 before, 527 after).

## Edits to existing code (all one line, all in `buildWorld`; exact strings)
1. `let pool=ways.filter(w=>w.tags.building);` -> `let pool=ways.filter(w=>w.tags.building&&!w.tags.bld2);` (keeps lat0/lon0, the bbox centre, from moving when buildings outside the OSM extract are added).
2. `if(!inBox(pts[0][0],pts[0][1],100))continue;` -> `if(!inBox(pts[0][0],pts[0][1],t.bld2?900:100))continue;` (added buildings up to the ground plane edge).
Inserted before `function buildExtra(){`: `const BLD2D="..."` and `bld2.js` (module scope). `bld2.js` ends with `{const bs=buildingSpec;buildingSpec=(w,pts,area)=>bld2Look(bs(w,pts,area),w,pts,area);}`, a wrapper around the function declaration, so it composes with the `facades`, `facades2` and `roofs` edits inside it. `add_bld2.py` also rewrites the `rasData` JSON block (parse, append, `json.dumps(separators=(',',':'),ensure_ascii=False)`; unchanged data round-trips byte-identical), computing every index from the block as it is when the step runs.
New global names: `BLD2D BLD2 B2_METAL B2_BOARD B2_BLOCK b2pick bld2Look`.

## Not done, not known
- Only the six PASK codes above are confirmed; 21 other codes (401 buildings) read as "no code".
- Heights of added buildings are a rule, not measured. Dwellings outside the town take the game's 4.6-6.2 m, which is right on average but not per house; added dwellings are flat-roofed unless they have four corners.
- Added buildings under tree canopy or demolished lots can slip the photo filter (3 of 24 sampled in town were unsure). No roads are added outside the OSM extract, so the farmsteads stand in fields with no track (roads2's job).
- Garages are windowless boxes without doors; the atlas has no garage door tile.
- The matcher (`bld2_build.py`) is not part of the build and needs the orthophoto tiles under `research/geodata/ortho/tiles` plus the ring outside the town (`fetch_tiles.py` only fetched the town extent; I fetched 1,382 more level-11 tiles into the scratch folder and passed it as an extra argument).
- `data.gov.lt` licence of the ORT10LT tiles is unchanged from geodata.md; only per-building colours ship. GRPK credit: "GRPK (c) Lietuvos Respublikos aplinkos ministerija, CC BY 4.0" (the data file carries it); the page credit string was not edited.
