# landmarks2: church, monastery, cadastre towers (2026-11-10)

Step `landmarks2`: `pipeline/landmarks2.js`, `pipeline/add_landmarks2.py`, test `work/test_landmarks2.mjs`. References in `refs/landmarks/` (`CREDITS.tsv`), comparison sheets in `research/prototypes/landmarks/` (reference | before | after).

## Anchors and edits
- `function buildExtra(){`: the JS block is inserted before it, anchor kept (`rep(a, js + a)`).
- `buildLandmarks();buildStreets();`: `landmarks2();` appended after it, anchor kept.
- No existing function body edited.
- How the step wins: the block runs at module scope before `buildWorld`, so it writes `LOOK.c2475` and `LOOK.c92` before any spec is built; those beat the street files, `roofs` and the `facades` defaults. `landmarks2()` runs after `buildLandmarks()`, removes the facades church mesh (`fx_church`) and sets `world.landmarks.church` to the new mesh, so `test_facades` still finds a church landmark.
- Gotcha found: `facade2()` clears the LiDAR straight-skeleton roof of any building that has a LOOK with `pitched:false`. Skeleton buildings always have `pitched:false`, so a LOOK on one would flatten its roof. The monastery look sets `pitched:null` to keep its hip roofs.

## Landmarks
| landmark | evidence | before | built |
|---|---|---|---|
| Švč. M. Marijos Ėmimo į Dangų church (c92) | Mapillary 2109368932968039 (SSW), 1227518735934009 (E), 1651213589433261; Commons: Vilensija x2, E.giedraitis 2010 (north front), B.gliwa (distant NE view); orthophoto (two square roofs at the north corners, red nave roof); LiDAR top 23.2 m | white box with a 11 m skeleton roof, one generic tower with spire at the north end | twin towers on the north front at the outline's square corners (walls to 13.8 m, flared red pyramids to 21.6 m, ball and cross to 23.6 m); central north bay with pilasters, arched portal, two-tier baroque gable with concave volutes, cross to 24.2 m; nave 13.9 m wide to an 11.5 m cornice, red gable roof to 17.5 m, arched clerestory windows; south (chancel) gable with low pediment, concave volutes, attic, pinnacle cones, cross; lower side chapels (footprint body set to 6.5 m) with red lean-to roofs; door in the NE tower's east face. One mesh, 1,066 triangles |
| Former Dominican monastery (c2475) | Mapillary 950279124727962 (south side: weathered off-white plaster, pilaster strips, small multi-pane windows, red-brown clay tile hip roofs with dormers and chimneys); orthophoto (red tile U plan) | `industrial` kind, grey ribbed sheet-metal style, ribbon windows | `kind:civic`, `sty:old` (plaster with windows), wall [.80,.78,.71], roof [.52,.25,.18] clay tile, LiDAR hip skeleton kept, balconies off |

Heights for the church come from proportions measured on the distant Commons photo (cornice/nave length, pyramid/tower width) scaled to the OSM outline, and agree with LiDAR (top 23.2 m, median 17.1 m). Exact window counts and ornament are stylised, not counted off the photos.

## The 28 GRPK tower points (`pa6`)
Height from the shadow length on the orthophoto with tan(sun elevation) taken as 1.0. That is an estimate (sun about 46° for a mid-morning May flight), checked only against the church towers (about 22 m tall, about 23 m shadow). Expect ±20%. Diameter and colour come from the visible top.

| # | x, z | what it is | evidence | drawn |
|---|---|---|---|---|
| 0 | -1830, -630 | cylindrical tower (water tower likely) | 28 m shadow, uniform, grey-white top 2.6 m | cylinder 28 m, d 2.6, pale grey, cap ring |
| 1 | -2250, -1259 | Rožnovsky-type water tower | 13 m shadow, thin stem with a bulb at the end, rust-brown top | stem + tank 13 m, d 4.2 |
| 2 | -2299, -1170 | white silo/tank by a farm building | white cylinder 3.4 m with a dark rim, short shadow (about 10 m) | white cylinder 10 m |
| 3 | -449, -817 | square light tower, about 3 x 3 m (function unknown; a fire-station drill tower is the likely type) | pale square top displaced by about 8 m, shadow about 20 m partly on a roof | square tower 20 m, cap |
| 4, 5 | -631, -3374 / -633, -3336 | outside the game world (z < -2785) | - | nothing |
| 6 | -726, 1930 | cylindrical brick-coloured tower (water tower likely) | 26 m uniform shadow, salmon top 3.5 m | cylinder 26 m, brick colour |
| 7 | -805, 1884 | small cylindrical tower in a farmyard | 11 m shadow, 3 m wide | cylinder 11 m, grey |
| 8 | 1089, 1260 | red-white lattice telecom mast | red-white lattice visible (relief displacement about 28 m); a dotted shadow line running from the base, about 90 m long | square lattice 70 m, red/white bands, two platforms, antenna. **Height uncertain, 60-90 m** |
| 9 | 1101, -671 | round reservoir/tank, d 15.6 m, dark roof | plan visible; height not measurable (trees in the shadow area) | nothing |
| 10 | 1107, -1060 | small cylinder | 8.5 m shadow, grey top about 3 m | cylinder 8.5 m |
| 11 | 1498, 3727 | outside the world | - | nothing |
| 12, 21 | 16, -1170 / 38, -1173 | the two chimneys of the district boiler house (Raseinių rajoninė katilinė) | dark steel bars displaced about 15 m, shadows about 30-35 m across roofs | two dark steel chimneys 35 m, d 2.2 |
| 13 | 156, 2432 | tall cylindrical tower (water tower likely) | 34 m uniform shadow, white body, red top | cylinder 34 m, d 3 |
| 14 | 190, 2390 | Rožnovsky-type water tower | 14 m shadow with a bulb | stem + tank 14 m |
| 15, 16, 18, 19, 20 | far outside | outside the world | - | nothing |
| 17 | 2716, -1265 | in the world but outside orthophoto coverage | - | nothing |
| 22 | 45, 2691 | in the world but outside orthophoto coverage | - | nothing |
| 23 | 676, -1132 | red-white lattice telecom mast | red-white lattice displaced about 27 m (like #8); shadow lost on roofs | lattice 60 m. **Height uncertain** |
| 24 | 730, 895 | light concrete chimney | thin shadow about 40 m partly on roofs, white top | chimney 38 m, light grey |
| 25 | 851, -1291 | nothing identifiable at a building corner | - | nothing |
| 26 | 956, -975 | light concrete chimney, d about 2 m | bright shaft displaced 11.5 m; shadow hidden. Height from the displacement ratio of #12 (rough) | chimney 25 m |
| 27 | 999, -952 | short chimney on a boiler building's edge | shadow about 16 m | chimney 16 m (inside the building outline, so the building is its collision) |

16 structures drawn as one merged mesh (`lm2_towers`, 4,848 triangles). Each one outside a building outline is an `addProp` round solid and is pushed to `world.solids`, so `test_solid` walks into it too.

## Left alone, and why
- Žemaitis monument (Žemaičio aikštė): already a stepped white pedestal with a figure, built earlier from the owner's photo (`add_town.py`). Nothing better to add without a new photo.
- Orthodox church (cerkvė) and culture centre: already have photo-based landmark meshes from the `facades` step; not reworked this round (depth over breadth).
- Municipality, bus station, hospital, cemetery chapel: not touched. The street photos would support only colour changes, and those buildings are already covered by street files or other steps.
- The monastery's white lower east wing is part of the same OSM outline, so it shares the beige wall. The atlas draws one window row per 3 m, so the monastery shows three rows where the photo shows two tall storeys (the LiDAR wall height is 9.5 m).
- Church fence: the real one is red brick on a fieldstone base. It belongs to the street/fence data, which this step does not own.

## Numbers
All gates were run on the full current chain (`build.sh`) plus `add_landmarks2.py`. The pages are in the scratch directory.
- Page bytes: 10,189,794 -> 10,201,331 (+11,537 B, all JS; no data block).
- Two builds are byte-identical (`cmp`). No `Math.random` and no dates are used.
- fps (`work/fps.mjs`, Metal): 60.3 with and 60.3 without. Load time is 1,660 ms with the step; without it, 1,603 ms and 1,483 ms over two runs. SwiftShader runs 1.3 fps both ways (the host is shared).
- Draw calls: +2 (`lm2_church`, `lm2_towers`), -1 (`fx_church` removed). Triangles: +5.9k.
- `test_landmarks2`: PASS, 8 checks:
  - no page errors;
  - meshes present and the old church mesh gone;
  - church heights: tower top 23.6 m, top 24.2 m, ridge 17.5 m, eave 11.5 m;
  - twin towers on the north front;
  - church mesh at 1,066 triangles;
  - monastery: `sty` 1 (not 6 or 14), tile roof, skeleton kept, no balconies;
  - all 16 towers at their GRPK point with height within 0.6 m of the table;
  - all 15 towers outside buildings push the player out.
- Regression: `test_solid` PASS, `test_fixground` PASS, `test_fixwater` PASS, `test_drive2` (0 failed checks, `errors []`), `test_streets` PASS (all 14 streets), `test_facades` PASS. `test_facades` reads 9 `fx_` draw calls and still finds the church landmark (now `lm2_church`, 1,066 triangles).
- `test_facades2` PASS. It builds its own page from `build.sh`'s step list, which does not include `landmarks2` yet, so I ran a scratch copy of `build_facades2_test.sh` with `landmarks2` appended.

## Shops (second pass, 2026-11-10, on the chain ending `... landmarks2 roads2 bld2 trees2 credits`)
Asked after the owner's "why norfa is so black". I compared every labelled shop's game roof with the orthophoto (and with the `roofs` step's measured value in `ROOFS`), then searched Mapillary and Commons for wall photos.

| shop (id) | evidence | finding | change |
|---|---|---|---|
| Norfa XL (c2135) | Orthophoto: light flat membrane roof (measured [.83,.85,.81]), car park to the NE. No Mapillary image shows it (every nearby photo is a dashcam frame on the SW road, about 75 m away behind houses, or points elsewhere). No Commons photo | Hand-set look from `club.js` ("dark tiles", owner's photos): wall [.2,.21,.23], roof [.3,.3,.31]. The near-black 4,000 m² roof is what reads as black from above and in oblique views. The NORFA XL sign, the copper entrance block with the VAISTINĖ sign and the glazed doors already exist on the NE (car-park) face from `club.js` | Roof set to the orthophoto colour with the flat-roof tile. Walls lifted to anthracite [.3,.31,.33], keeping the owner-photo hue but no longer black. **Wall colour is unverified**; sign and entrance unchanged |
| Maxima XX (c2134) | Orthophoto roof [.45,.47,.48] vs game .36 | Brand facade from an earlier round; roof close | none |
| Maxima X (c3293) | Orthophoto: grey roof with a white low wing | Matches the wing look | none |
| IKI Raseiniai (c2181) | Orthophoto red roof = game roof (street look) | Correct | none |
| Lidl (c8100) | The 2024 orthophoto shows a construction field; the Mapillary photos (Aug 2026) show road works, not the store | No evidence for roof or walls | none (needs a photo) |
| Moki-veži, Vigatas | The labels sit outside any outline; the nearest building, c3358, has a solar-panel roof on the orthophoto, which the game draws as plain light corrugated | Which unit is which is not clear | none |
| BENU | The label is outside any outline; the nearest building, c3512, has a street-file look (another effort's photo work) | Not owned here | none |
| Fuel stations Baltic Petroleum, Milda, Prabauda, Žerminalis, Jozita | Orthophoto roofs within about .1 of the game (Prabauda's roof is part blue on the orthophoto). Milda's yellow walls come from `club.js`'s fuel-station work. No usable Mapillary frames: dashcam headings do not face the forecourts | No clear error backed by evidence | none |

Sheets: `norfa_top.jpg`, `norfa_air.jpg`, `norfa_carpark.jpg` (orthophoto | before | after). All-shops survey (orthophoto | game top | game oblique): `refs/landmarks/shops/ortho_vs_game_labelled_shops.jpg`.
`test_landmarks2` gained `norfa light roof, not near-black, signed`: roof mean > .7, wall mean > .25, `roofSty` flat, at least one canvas-texture sign within 2.5 m of the outline. It fails on the build without this change (roof .3, wall .21) and passes with it (roof .83, wall .31, three signs).

Gates for this pass (current `build.sh` chain, compared with `work/build/v49.html`, which is the same chain without this change):
- Page bytes: 12,086,074 -> 12,087,444 (+1,370 B). Two builds are byte-identical.
- fps (Metal): 60.3 with and 60.3 without; load 2,265 ms with, 2,211 ms without.
- PASS: `test_landmarks2` (9 checks, including the new Norfa check), `test_solid`, `test_fixground`, `test_drive2` (0 failed checks), `test_streets` (14 streets), `test_facades` (9 `fx_` calls, church landmark 1,066 tris).
- Fail on v49 too, so not caused by this change:
  - `test_fixwater` times out waiting for `water2List.length`, which is 0 on v49 itself (the water3 step replaced it).
  - `test_facades2` `wingEaves` reports 2 offenders: c3588 and c5531, both multi-wing houses. They are identical on v49 and the new build, neither touched here; c2135 is flat-roofed and is not in that check.

## Comparison images (`research/prototypes/landmarks/`)
`church_ssw.jpg`, `church_east.jpg` (game trees hide most of the church from that spot), `church_far_ne.jpg`, `church_north.jpg`, `church_top.jpg`, `monastery_ssw.jpg`, `tower_boiler_top.jpg`, `tower_mast8_top.jpg`, `tower_w0_top.jpg`, `towers_ground.jpg`.

## Questions only the owner can answer
- #3 (-449, -817): what is the square pale tower behind the garages (fire-station drill tower?).
- #8 and #23: how tall do the two red-white masts look (the shadow says up to about 90 m for #8; 70 m and 60 m are drawn)?
- #0, #6, #13: water towers or something else (silo, chimney)?
