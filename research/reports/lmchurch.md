# lmchurch: the Ėmimo į Dangų church and the Trejybės cerkvė as Blender models (2026-11-14)

Step `lmchurch` (landmark round, `09-landmarks-brief.md`). Not in `build.sh`; runs after `landmarks2` and `facades` (both are in the
chain already) and is independent of `house5a`, `maxima` and the other landmark steps. Tested on `build.sh` + `house5a` + `maxima` + `lmchurch`.

## Files
- `research/assets/houses/church/build_churches.py`: one Blender script for both models (`-- church|cerkve OUT_DIR`). It imports
  `blendkit.py` for materials, accumulators and the bake; its own primitives give every face an outward winding against a point
  inside the solid, and leave out faces nobody can see (see "Atlas" below). `make.sh` runs it and `gltfpack@0.25.0 -cc -kn -km -vpf`.
- `research/assets/houses/church/tools/shots.mjs`: fixed cameras in each building's frame, plus lat/lon cameras for Mapillary photos.
- `research/assets/houses/church/shots/`: `before_*`, `after_*`, and `compare_*.jpg` (reference photo | before | after).
- `pipeline/lmchurch.js`, `pipeline/add_lmchurch.py`, `pipeline/lmchurch/{church,cerkve}.glb`, `work/test_lmchurch.mjs`.
- `refs/landmarks/cerkve/`: two Commons photos, two Mapillary photos, an orthophoto crop (lines in `CREDITS.tsv`). The church
  references were already in `refs/landmarks/church/`. The `cerkve/` house folder named in the brief is not used: both models share
  the one script, so everything is under `church/`.

## The plan, fixed before modelling
### Church (c92)
Footprint projected on the outline's own axes (u north along the nave, from edge p0->p1, 10° east of north; v east). Model frame
X = v - 150, Y = u - 145. The outline is almost exactly orthogonal:
| part | X | Y | evidence |
|---|---|---|---|
| nave (14 m wide) | -6.87 .. 7.1 | -23.14 .. 14.3 | outline; orthophoto: one long red roof, ridge north-south |
| twin towers | W -12.9 .. -5.05, E 6.13 .. 14.6 | 14.3 .. 23.0 | outline corners 1-2 and 4-6; orthophoto: two square roofs at the north corners |
| central front bay | -5.05 .. 6.13 | to 24.0 (1 m forward) | outline points 2-5 |
| aisles (lean-to) | W to -11.64, E to 13.2 | 0.5 .. 14.3 | outline; Commons east view (arched windows, lean-to roof) |
| side chapels (gabled, ridge across the nave) | W to -14.54, E to 16.75 | -10.9 .. 0.5 | outline bulges 20-21 and 10-11; Commons SE view (east gable with cones) |
| sacristies (hip roofs) | W to -12.98, E to 15.6 | -20.4 .. -10.9 | outline; Commons SE/E views (low, red hip roof, door, small windows) |

Which way it faces: the main front (towers, gable, portal) is north, toward the street with the steps (2010 Commons photo is taken
from the north-west at the foot of those steps; the orthophoto shows the stair north-west of the front). The south end is the chancel
gable seen from Vytauto Didžiojo g. (Mapillary 2109368932968039). The east side is the one in both Vilensija photos (the north-east
tower with a door in its east face is on their right/left ends). The west side has no photo of its own except the distant Mapillary
view: **built as a mirror of the east side (guess)**.

Heights (above the footprint's mid-slope ground y0; the game's ground falls 2.3 m from the south end to the front): main cornice 11.5,
nave ridge 17.5 (LiDAR median 17.1), tower storey to 14.0, pyramids to 21.4, crosses to 23.4; front gable to 21.1 and cross to 24.0
(LiDAR top 23.2); aisle eaves 5.6 (roof to 7.7 at the nave), chapels 7.0 (ridge 9.3), sacristies 5.0 (hip to 7.0). Proportions read off
the distant Commons view from the north-east and the 2010 front view; agree with landmarks2's measurements.

### Cerkvė (c219)
Model frame X = v - 456, Y = u - 475, u along the outline edge p7->p6 (south-east to north-west), v across it.
| part | X | Y | evidence |
|---|---|---|---|
| bell tower (6 m square), front north-west | -3.06 .. 2.96 | 9.2 .. 15.3 | outline; orthophoto (spire top seen as a bright octagon at the north-west end) |
| refectory | -5.1 .. 5.43 | 1.4 .. 9.2 | outline; Commons 2011 (low part with 3 windows between tower and nave) |
| nave cube (13 x 13) with side porches | -6.35 .. 6.7 (porches to ±8) | -11.6 .. 1.4 (porches -7.3 .. -2.95) | outline; 2011 photo (porch centred on the tall block); orthophoto (square hip roof, drum in the middle) |
| altar part + apse | -6.05 .. 6.4, apse -3 .. 3.4 | -13.2 .. -11.6, apse to -15.1 | outline (chamfered apse); 2011 photo (lower block right of the nave) |

**The split between the nave cube and the altar part (Y = -11.6) is a guess**: the outline does not show it. I put the porches in the
middle of the cube, as in the 2011 photo, which gives a 3.5 m lower part including the 1.9 m apse; the photo's lower block is about that.
Heights from the 2011 photo scaled to LiDAR top 19.4 m (onion top): tower storeys 7.4 / 10.0, belfry to 13.0 with kokoshnik crowns,
tent spire to 17.6, onion to 19.75, cross to 21.15; nave walls 11.0, hip roof to 13.0, drum to 14.7, onion dome to 17.6, cross to 19.35;
refectory 6.8 (roof 8.9); altar part 6.3. Entrance: the tower portal facing the street (north-west); side doors in both porches.

## What was built
Church: white plaster, cream cornices and window surrounds, red sheet roofs, red downpipes (they show in every photo), dark crosses.
- North front: central bay with four pilasters, arched portal with three steps, arched window over it and two smaller ones beside;
  tower fronts with a tall arched window and corner pilasters; a two-tier gable (window in the first tier, a niche in the second, a small
  pediment, cross) with red cones at the tier corners; tower storeys with an arched opening on each free face, flared red pyramids,
  gold ball and cross. Door in the north-east tower's east face.
- Nave: windows in two rows over the sacristies (lower 2, upper 2 per side) and one row over the aisles (3 per side), none over the
  chapels (their roofs reach 9.3 m). **Window counts are stylised**: the photos show the rows, not reliably how many per bay.
- South gable: full-width end wall with four pilasters, a low pediment over its middle, shoulders up to an attic with a bell opening,
  a triangular top and cross, red cones on the corners.
- Chapels with their own pedimented gable, cones and a window; aisles with arched windows; sacristies with small square windows and a door.
Cerkvė: white plaster, grey plinth, grey galvanised roofs, silver onion domes, eight-pointed crosses. Tower: portal with an arched
kokoshnik surround and a light double door, side windows; a narrower second storey with small windows; octagonal belfry with
louvred arched openings on four faces and a kokoshnik over every face; octagonal tent spire, onion, cross. Nave cube with pilasters,
two window rows, a hip roof, an octagonal drum with eight arched windows and an onion dome; kokoshnik-topped porches on both long
sides; refectory with three windows a side; lower altar part with a hip roof and the apse.

Night: the glass of both models is its own material with a dim warm glow on the game's night uniform (`ENV.night`).

## The step (`pipeline/lmchurch.js`)
- `addBuilding` skips c92 and c219 (corner-checked, and only when the model is in the page); their footprints keep collision, `inBuilding`, the minimap.
- `buildExtra` is wrapped: after it, landmarks2's `lm2_church` and the facades step's `fx_cerkve` are removed, the models are placed
  with one matrix each, `world.landmarks.church` / `.cerkve` point at the models' atlas meshes (test_facades), and `world.lm2.church`
  is rewritten to describe the new model (test_landmarks2 reads it).
- **town.js puts instanced dark arched windows on every church outline** (`chWin`/`chArch`, colour 0x2f3a44). They showed through as
  dark arches next to the model's windows; the step zeroes the 89 instances that stand on these two outlines. Found only by searching
  the whole scene, not `worldGroup`.
- One collider added: the cerkvė's tower portal, which stands 0.7 m out of the outline. The church's steps (0.45 m) have none.
- Not touched: the monastery (c2475, 20 m west of the church; nothing of this step comes within 15 m of it), the churchyard wall.

## Atlas, and what went wrong on the way
- First bake: walls came out at about 2 px/m and the windows' ambient occlusion smeared into dark patches. Cause: about half of the
  baked area was faces nobody sees (box bottoms below ground, tops under roofs, the full-width slabs I had used for cornices and plinths).
  Fixed by leaving those faces out (cornices and plinths are now rings) and by not giving the window parts sides or backs.
- The dark arches that remained were town.js's windows (above), not the model.
- First budget pass was 600 KB; now 1024 px atlas for the church, 640 px for the cerkvė, WebP quality 56.

## Numbers (`build.sh` chain of 2026-11-14 + `add_house5a.py` + `add_maxima.py` + `add_lmchurch.py`)
- Models: `church.glb` 147,036 B (4,756 triangles, 1024 px WebP atlas), `cerkve.glb` 99,640 B (4,170 triangles, 640 px atlas); 2 draw
  calls each (atlas, glass). Removed: `lm2_church` (1 call), `fx_cerkve` (1 call), the code-built bodies of c92 and c219.
- Page: 28,782,063 -> 29,116,102 B (+334,039 B: base64 models and 5 KB of JS), under the 400 KB budget. Two full builds: byte-identical.
- `node work/fps.mjs` (Metal): 60 fps with the step, load 5.4 s; the same page without it read 56.8 fps in the same minute. The machine's
  load average was 25 to 45 during these runs (other agents), so treat both as "no measurable change". fps.mjs's SwiftShader pass timed
  out loading the page (30 s) for the step's page; it is not a gate.
- `work/test_lmchurch.mjs b1.html b2.html`: PASS, 12 checks: builds identical; both models loaded, Lambert, night glass; `lm2_church` and
  `fx_cerkve` gone and the landmarks are the models; nothing else drawn on either footprint (fails with 3,088 and 1,496 vertices when the
  town.js window hiding is switched off: checked); each church stops a walker within 0.6 m of its outline from four sides, starting
  inside the churchyard; the walk to the church's main door reaches the front wall; the cerkvė portal is solid; `world.lm2.church`
  describes the model; no console errors. On the page without the step it fails ("step present").
- Other tests on the same page (scratch copies; the page needs about 40 s to load on the loaded machine, so I raised the copies' 30 s
  `page.goto` timeout, nothing else changed): `test_facades` PASS (landmark triangles church 2,829, cerkve 2,472 by its count),
  `test_solid` PASS, `test_landmarks2` **FAIL 1 of 9**: the "meshes" check wants a mesh named `lm2_church`, which this step replaces by
  design. Its other eight checks pass, including the church heights and twin towers, which now read the new model through `world.lm2.church`.
  On the page without the step `test_landmarks2` passes. Changing that check belongs to the landmarks2 owner or the integrator.

## Compared with the photos (`shots/compare_*.jpg`)
Church, matches: twin towers at the north corners with a short storey above the main cornice and steep red pyramids with ball and cross;
the two-tier gable between them with cones at its corners and the cross on top; the arched portal in the central bay; pilasters on the
front; the long red nave roof with its ridge north-south; the south gable rising over the roof with a bell opening, cones and a cross;
on the east side, from south to north: low sacristy with a red hip roof, small square windows and a door, the chapel with its own
pedimented gable and red roof across the nave, the aisle with arched windows under a lean-to, the north-east tower with its east door;
two window rows on the nave above the sacristy, one above the aisle; red downpipes; white plaster and red-orange roofs.
Differs: the south gable's shoulders are convex quarter curves (the photos show S-curved ones; concave ones let the nave roof show
through above them); the front gable is plainer than the photo's (no scrolls, no statues niche detail); window counts per bay are
stylised; the west side is a mirror of the east (no photo); the real church stands on a terrace above the north street with long steps,
the game's ground simply slopes 2.3 m and the model sits on it; the churchyard wall in the game is the base page's cream wall with dark
red piers (a street-file fence drawn by props2, not this step's), the photos show red brick on a fieldstone base; the Mapillary view
from Vytauto Didžiojo g. cannot be matched from its GPS point, which is inside a house in the game, so `compare_ch_ssw` is shot from the road nearby.
Cerkvė, matches: bell tower at the street end with the arched portal, a narrower second storey, an octagonal belfry with louvred
openings and kokoshnik crowns, the grey tent spire, small onion and cross; the refectory with three windows a side; the tall nave cube
with porches on both long sides, a low hip roof, the drum with arched windows and the silver onion dome; the lower altar part with the apse;
white walls, grey roofs. Differs: the photo's nave cube has a raised central bay with its own cornice over the porch (not modelled);
the kokoshnik shapes are simple arcs; the drum is shorter than in the photo; LiDAR trees right beside it hide most of it from the street
views in the game (one crown touches the refectory roof), so `compare_ce_road` shows little of the church in either version.

## Photos wanted
- church, west side (chapel, aisle, sacristy), seen from the churchyard west of the church: the west side is a mirror of the east.
- church, north front close up from the steps' top: tower window layout and the portal (a tree hides it in the 2010 photo).
- cerkvė, south-east end (altar part and apse), seen from the park south-east of it: no photo, built plain.
- cerkvė, south-west side up close: the 2011 photo is the only one, and it is 15 years old.

## Credit
Models are original work. Textures: Poly Haven CC0 already in the project (Painted Plaster Wall, Box Profile Metal Sheet, Concrete Wall 006,
Brown Planks 05), covered by the page's "Building textures: Poly Haven (CC0)" line. Reference photos (not in the page): see `refs/landmarks/CREDITS.tsv`.
