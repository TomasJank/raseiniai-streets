# lmcivic: the municipality and the culture centre rebuilt in Blender (2026-11-14)

Step `lmcivic`, landmark round (brief `09-landmarks-brief.md`). Not in `build.sh`; the integrator appends `add_lmcivic.py` after
`maxima` (it only needs `assets` and `facades`). Tested on `build.sh` + `add_house5a.py` + `add_maxima.py` + `add_lmcivic.py`.

## Files
- `pipeline/lmcivic.js`, `pipeline/add_lmcivic.py`, `pipeline/lmcivic/savivaldybe.glb`, `pipeline/lmcivic/kultura.glb`, `work/test_lmcivic.mjs`.
- `research/assets/houses/savivaldybe/`: `build_savivaldybe.py`, `civickit.py` (ground grid, windows, parapets on top of `blendkit.py`,
  which was not changed), `webpq.py` (re-encodes the atlas WebP at quality 72 inside the GLB: blendkit exports at 88), `make.sh`,
  `tools/shots.mjs` (fixed cameras for both buildings), `tools/mly.py`, `tools/dl.py` (Mapillary search and download; the token is
  read from `~/.mapillary_token` and never printed), `tools/gridcrop.py` (orthophoto with the model-frame grid), `shots/`, `tests_2026-11-14.log`.
- `research/assets/houses/kultura/`: `build_kultura.py`, `make.sh`, `shots/`.
- `refs/landmarks/lmcivic/`: resized reference photos and orthophoto crops, 10 lines added to `refs/landmarks/CREDITS.tsv`.

## Evidence
- Orthophoto crops with the model frame drawn on (`refs/landmarks/lmcivic/*_ortho_*`), LiDAR heights and parts from the page.
- Municipality: Commons "1. Raseiniai, savivaldybė.JPG" (Vilensija, 2019, CC BY-SA 3.0) and Mapillary 1644165183274649, both taken
  20-25 m south of the south corner; Commons "Raseiniu savivaldybe 2009.jpg" (from Žemaičio aikštė, behind the monument).
- Culture centre: Mapillary 961796256720748 and 1790921029021025 (south-east street), 847727804247276 (Vaižganto g. by the car park),
  3222808164545471 (far view of the north-west side). Commons has no photo of it.
- Mapillary dashcam compass values in this area are unreliable: several sequences store a heading reversed or perpendicular to the
  direction of travel. Every photo was placed from its content (police station, street signs, the square), not from its heading.

## Plans (fixed before modelling)
Frames: both are glTF frames as in `maxima.js` (x along a footprint edge, y into the building, z up from `spec.y0`).

**Municipality, c2159.** x from footprint corner 8 (west end of the long front) to corner 7 (south corner), 39.74 m.
- Main front: the long south-west edge 8-7, facing Žemaičio aikštė. The street photos are taken from beyond corner 7, so the long
  face recedes to the left and the entrance block is at the near (right) end.
- Main block x 0..39.74, depth 12.6: three storeys, 13 window bays of 2.95 m, hipped red-brown metal roof (eave 10.4, ridge 14.2;
  LiDAR parts 13.7 / 14.7), four small wall gables with one window each on the front slope (x 3.7, 12.7, 21.7, 30.7; orthophoto
  triangles, three seen in the photo, the fourth hidden by the spruce).
- Entrance block x 39.74..48.47, y 4.23..12.6: the outline steps back 4.23 m behind the front here (corners 7-6-5-4). Four storeys of
  large grey panels with vertical groove bands, parapet 12.8 m with red-brown coping, a red pyramid to 16.6 m with the national flag
  (LiDAR top 15.5). Two tall narrow windows on its south-east face.
- Entrance: in the recess, facing the square (south-west face of the entrance block). Flat dark canopy filling the recess and a little
  beyond the block's corner (the orthophoto shows its grey roof there), raised landing 0.75 m, six steps down to the square, a ramp
  with railings along the canopy front to the south-east, glazed double doors with side lights, two plain plaques. No posts.
- Three white flagpoles 3.4 m in front of the long front near the entrance, a low plain board on two posts, a 4.6 m paved apron in
  front of the steps.
- North-east wing x 15.6..26.3, y 12.6..31.1: two storeys under a hipped roof (LiDAR 10.6, rise 2.6), car-park side.

**Culture centre, c171.** x from corner 12 (west end of the car-park face) to corner 11 (south corner), 32.13 m.
- Faces: south-west on the car park (Vaižganto g.), south-east on the street past the police station, north-east on the park,
  north-west on the plaza. White plaster everywhere, flat roofs with light coping and thin roof railings (photos).
- Masses (LiDAR skeleton heights): two-storey ring on the whole outline (7.0), foyer block x -13.9..-4.5 (9.6), auditorium
  x -4.5..5 (14.8), side stages x 5..16.5 (11.5), stage tower x 5.3..16.2, y 7..32 (19.4).
- South-east face: service wing with a row of tall narrow first-floor windows, a few below, a dark loading door, two outside steel
  stairs to first-floor doors (photos).
- South-west face: mostly blank with one large window pair near the south corner; the one-storey bay (corners 12-13-14) with a large
  glazed window (photo 847727804247276).
- Entrance: **guess**. The outline has a one-storey projection on the north-west face (corners 16-19, LiDAR 3.8 m) facing the plaza;
  it is built as a glazed porch with a flat canopy and three steps down to the plaza. No photo shows that face.

## The step
- `addBuilding` is wrapped: any call whose polygon middle lies inside either outline or within 5 m of it (the parts, and the views
  step's wing, gables, canopy and the c171 tower) draws nothing while the model is in the page. `addTri` is wrapped for triangles
  whose middle is inside an outline (the old c171 spire is four loose triangles). Outlines keep collision walls, `inBuilding`, the
  minimap and the name labels.
- `buildFacadeDetails` runs with both records filtered out of `FX.recs` (no balconies, chimneys, dormers on c2159).
- `buildExtra` is wrapped: models placed with one matrix each, Lambert materials, `atlas_glow` lit by `ENV.night`. When the culture
  model has loaded, `fx_culture` is removed and `world.landmarks.culture` is the model's main mesh (2,527 tris by test_facades' count).
- Colliders: the landing's south-east side and the ramp's outer wall (steps left open toward the square), the sign board, three
  flagpoles (round props, also in `world.solids`), both outside stairs of the culture centre.

## Numbers
- Models: `savivaldybe.glb` 122,548 B (3,311 tris), `kultura.glb` 117,688 B (3,866 tris), one 1024 px WebP atlas each, 2 draw calls each.
- Page: 28,782,063 -> 29,108,204 B (+326,141 B, budget 400 KB). Two full builds byte-identical.
- `fps.mjs` (Metal): 54, 56 and 60.3 fps on three runs of the page with the step while other agents kept the machine at load 40-50;
  the page without the step measured 60 in the same period. Load 5.5-6 s (6.3 s without the step, same load).
- `test_lmcivic.mjs b1.html b2.html`: PASS, 14 checks (identical builds; models loaded and lit; nothing else drawn inside either outline,
  meshes and instances; step solids off roads; both buildings blocked on every side tried; walking up the steps under the canopy
  reaches the doors; ramp, flagpole and south-east end solid; culture stairs solid; porch reachable; fx_culture gone and the culture
  landmark is the model; no console errors). With the `addBuilding` skip disabled the "nothing else drawn" checks fail (20 and 7 vertices).
- `test_facades` PASS (landmark culture 2,527 tris), `test_solid` PASS (all), `test_streets` PASS (14 streets). The first `test_solid`
  run timed out in `page.goto` (30 s) under the machine load; my copy with `{timeout:0}` passed. Log: `savivaldybe/tests_2026-11-14.log`.

## Compared with the photos (`*/shots/compare_*.jpg`: photo | before | after; plus before/after from every reachable side and aerial)
Municipality matches: long three-storey grey front with red-brown downpipes and eave trim, wall gables on the front slope, the taller
flat-roofed entrance block with pyramid and flag, dark flat canopy over the doors, steps between low side walls, ramp with railings to
the right, three flagpoles in front of the long face. Differs: the wall reads bluer and flatter than the photo's warm light grey
siding; the photo's spruce and planters are not modelled; the photo shows the entrance block's big face more frontally than the game
camera does (photo position uncertain by a few metres).
Culture centre matches (street and car-park views): white stepped volumes with the stage tower highest, roof railings, low service wing
with narrow windows, outside steel stair and loading door on the street, blank car-park face with a big window. Differs: the real
building's north-west block extends well past the OSM outline (orthophoto), so the game's north-west face and porch stand inside the
real building's footprint; window counts on the north-east and north-west faces are guesses.

## Guesses (no evidence)
- c2159: back and north-west end windows, the whole north-east wing (height from LiDAR only), flag colours other than the national
  flag (plain blue, plain green-white-green: no artwork), the ramp's length and fall, plaque and board contents (plain).
- c171: the north-west entrance porch and its steps, all north-east and north-west windows, the stair and loading-door positions
  along the south-east face (order from the photos, metres guessed), rooftop plant.

## Photos wanted
- Kultūros centras, north-west side (the plaza side), seen from the plaza: where is the main entrance?
- Kultūros centras, north-east side, seen from the park.
- Savivaldybė, north-east side and wing, seen from the car park.

## For the integrator / lmsquare
- Žemaičio aikštė lies directly in front of the municipality's long front: it belongs to `lmsquare`. My parts on that side end 4.6 m
  out (apron, flagpoles at 3.4 m, sign board at 2.4 m); the ramp ends 4.2 m past the south-east wall.
- The base page (or another step) already has three tall flagpoles out on the square west of the municipality; mine stand close to the
  facade as in the photo. If the square step keeps its own, the two sets may look like duplicates.
- The plaza north-west of the culture centre goes with that building's (guessed) entrance; I built only the porch steps and a 3.8 m apron.

## Credit
Models are original work. Textures Poly Haven CC0 (Plaster Grey 04, Concrete Wall 006 and 008, Box Profile Metal Sheet, Rough Concrete,
Painted Plaster Wall, Bitumen, Corrugated Iron 02), covered by the page's "Building textures: Poly Haven (CC0)" line. No photo is
used in the models; the reference photos are credited in `refs/landmarks/CREDITS.tsv`.
