# lmpublic: police station (c2158) in Blender; health centre (c170) not built (2026-11-15, written as I went)

Step `lmpublic`, prefix `LPU` / `lpu`, landmark round Addendum 2 (`09-landmarks-brief.md`). Files: `pipeline/lmpublic.js`,
`pipeline/add_lmpublic.py`, `pipeline/lmpublic/policija.glb`, `work/test_lmpublic.mjs`, `research/assets/houses/policija/`
(`build_policija.py`, `make.sh`, `tools/`, `shots/`), `refs/landmarks/policija/`, `refs/landmarks/pspc/` (12 lines in `refs/landmarks/CREDITS.tsv`).

## Evidence
Searched: Mapillary within 60 m of each footprint (police 670 images, health centre 380) and 110 m (health centre 652), with the
heading taken from the next frame of the same sequence (`research/assets/houses/policija/tools/mlyseq.py`: the stored compass is
off by up to 180 degrees on these dashcams); Mapillary panoramas within 200 m of the health centre; Wikimedia Commons (text search
"Raseiniai policija", "poliklinika", "pirminės sveikatos", and a 200 m geosearch round each building: nothing of either building).

**Police station, c2158** (OSM "Raseinių rajono policijos komisariatas", Maironio g.). Used (crops in `refs/landmarks/policija/`):
- Mapillary 1375431174488713, 1056279896966549 (2026-06, Maironio g. 40-45 m SSW, looking NE along the street): the south-east face
  from its south end to the entrance at its north-east end, the canopy, the green "POLICIJA" sign, three flagpoles, the culture centre beyond.
- 1701176107959358 (2026-03) and 1360596652200753 (2025-11), further SW: the south-east face receding, and the south-west end face
  with its small porch.
- 2015 panoramas (lakd) 770479510188109 (from the east: the whole south-east face, the entrance, the north-east end),
  283853386788733 and 1100336087127774 (from the SW: the south-west end face).
- Orthophoto (`ortho_c2158_45.jpg`, `ortho_frame_grid.jpg` with the model frame): two flat roofs, the lighter main wing with roof
  units along Maironio g., a darker lower block behind it, a light rectangle (the entrance canopy) at the east corner.
- LiDAR in the page (`t.lidar`, `t.parts`): top 12.6, median 12.3; parts: strip along the south-east face 12.5, rest of the main
  wing 12.3, the north block 8.8 (a point 9.8).

**Health centre, c170** (OSM "Raseinių pirminės sveikatos priežiūros centras"). The 206 positions within 30 m in the brief's table
are dashcam frames on the main road SE of it, all driving south-west; the building is 50 to 70 degrees right of the heading, outside
the frame (horizontal field about 68 degrees). From 62 to 83 m out it comes into the right edge, behind a row of trees: two leafless
frames (1399495785555839, 1828757271142777, `refs/landmarks/pspc/`) show part of one face of the north-east block: two storeys,
light beige cladding, white-framed windows, a small blue sign. Nothing shows the entrance, the south-west wing, the street side to
the south-west (no Mapillary there) or the park side; the 2015 panoramas are 130 m+ away on another road; Commons has nothing.

## Decision
- Police station: the photos fix the plan (below). Built.
- Health centre: **not built**. The photos fix neither the front nor the entrance, and one partly seen face of one of its three
  blocks is not enough to place the rest. The code-built box stays as it is. Photos wanted (below).

## Plan of the police station (fixed before modelling)
Model frame (as `lmcivic.js`): origin footprint corner 4 (the south corner), X along the south-east face to corner 3 (the east
corner, X = 33.03), Y into the building (north-west), Z up from the spec's mid-slope ground y0 (7.28). Footprint in this frame:
4 (0,0), 3 (33.03,0), 2 (32.98,5.82), 1 (35.27,5.82), 0 (35.10,30.0), 7 (19.48,30.0), 6 (19.59,13.57), 5 (-0.04,13.62).
The ground rises 1.35 m along the front, from -0.55 at the south corner to +0.8 at the east corner.

| face | footprint edge | photos | built |
|---|---|---|---|
| south-east, the front | 4-3, on Maironio g. | 2026 x4, 2015 x1 | as seen |
| south-west end | 5-4 | 2025 x1, 2015 x2 | as seen |
| north-east end of the main wing | 3-2 and 1 to Y 13.6 | 2015 x1 (from the east) | as seen |
| north block, north-east face beyond Y 13.6 | 1-0 | hidden by trees in the one photo | plain (**guess**) |
| north block NW and SW faces, main wing back | 0-7, 7-6, 6-5 | none | plain (**guess**) |

- **Main wing**: X 0..33.03 (Y 0..5.82) and X 0..35.27 (Y 5.82..13.6), three storeys, flat roof behind a parapet at Z 12.5 (LiDAR
  12.3 to 12.5 above the ground). White plaster. On the front each storey is a horizontal band of white-framed windows alternating
  with brown panels, white bands between the storeys, a brown plinth. Ortho: roof units on the roof.
- **Entrance**: the front's north-east end, ground floor X about 23.5 to 33 (2015 panorama measured 23.7 to 31.7; the 2026 photos show
  it to the corner): flat thin canopy with a light edge, glazed front with white frames, a double glass door, a notice board, a low
  ramp with a handrail at its north-east end. The green sign with white "POLICIJA" (an emblem on the real sign is left out) on the wall
  just above the canopy, right half (2015 measured X 27.4..31.4). Air-conditioning units on the wall above.
- **South-west end**: a porch at the south corner (small hipped metal canopy over a white box fascia, one dark door; green roof in
  2015, grey now), blank wall above it; one column of window pairs (two windows with a brown panel between) further north-west.
- **North-east end**: X 33.03 face (Y 0..5.82) blank white; the X 35.27 face: Y 5.82..about 9 white with window pairs in four rows
  (stair windows), Y 9..13.6 a dark brown plain section (the photo shows it in shade: its finish is a guess between brick and paint).
- **North block**: X 19.5..35.27, Y 13.6..30, LiDAR 8.8: two storeys, flat roof, Z 8.9. No photo: plain white walls with the
  brown plinth, no windows drawn (**guess**: the brief says faces nobody photographed are built plain).
- **Flagpoles**: three, in front of the entrance end on the lawn, the first next to the canopy's north-east end: plain flags (national
  tricolour, plain blue, plain dark blue; the real third flag carries an emblem). Positions **guessed** from the photos' order.
- Not modelled: the pine and the leafy trees (the game's trees are its own), the stone wall of the car park (not part of the building).

## What in the page points at these buildings (searched the built page for every name, id and point)
- Name labels (`world.labels`, from `addBuilding`): "Policijos komisariatas" and "Pirminės sveikatos priežiūros…" (shortName). They
  are the **delivery targets**: `newDelivery()` picks a label and sends the player to the nearest road node (class <= 2) to it, and
  the landmark tokens and `pickDest()` use them too. The labels stay (my `addBuilding` wrap returns the label height).
- The streets step's `maironio` sign "POLICIJA" (blue, at 55.38186,23.11846, 5.6 m up on the south-east face): replaced by the
  model's own green sign; removed at run time from `STREETS` before the world is built, only while the model is in the page.
- The hospital respawn (`hospitalSpot()`) uses **Raseinių ligoninė (c168)**, not the health centre; nothing to do here.
- Police cars spawn on road nodes round the player (`spawnCop0`), not at the station; the "cops" talk lines name no place.
- `LOOK.c2158` (white plaster, 11 m) only styles the code-built box, which the model replaces.

## Built (model `pipeline/lmpublic/policija.glb`, script `research/assets/houses/policija/build_policija.py`, `make.sh`)
- Main wing to a parapet at Z 12.5 (roof 0.4 below), step box at the north-east end, north block to Z 8.9, light and dark roof
  membranes, coping, five roof units (**guess**: number and places). Brown plinth round the whole base to Z 0.55.
- Front: three window rows (Z 1.6..3.4, 5.2..7.0, 8.8..10.6), 14 white-framed windows 1.3 m wide with 0.9 m brown panels between,
  from X 1.57; the ground row stops at X 23.5 where the entrance glazing starts. Six windows lit at night.
- Entrance X 23.5..32.9: glazing with white frames, double door at X 26..28.4 (centre 27.2), notice board, white pier at the corner,
  paved landing (0.2 m step), canopy X 23.3..33.3, 2.2 m deep, underside Z 3.45, no posts; handrail at the landing's north-east end;
  green sign X 28.2..30.6, Z 3.9..4.45 with "POLICIJA" in plain white capitals (Blender's built-in font), lit at night; four
  air-conditioning units. Door and board positions inside the glazing: **guess** to about 1 m.
- South-west end: porch at Y 0.5..3.9 (white fascia box, grey metal roof drawn as a gable, not hipped), dark door, landing and one
  step; window pairs with a brown panel at Y 5.7..9.3 on three floors.
- North-east end: blank face, stair windows in four rows (pairs) at Y 6.3..8.7, dark brown section Y 9..13.6.
- Flagpoles 8 m at (33.8,-3), (36,-5.5), (38.2,-8): plain dark blue, plain blue, national tricolour.

## The step (`pipeline/lmpublic.js`, `add_lmpublic.py`)
- `addBuilding` skips the three c2158 specs (and any id-less call whose middle is inside the outline; none was found) and returns
  y0 + 12.5, so the name label stays above the roof. `buildFacadeDetails` runs without the c2158 record.
- At module scope, only while the model is in the page, the streets step's blue "POLICIJA" sign (maironio, 55.38186,23.11846) is
  removed from `STREETS` before the world is built.
- `buildExtra` wrap: the model placed with one matrix, Lambert materials, `atlas_glow` (windows) and `atlas_sign` (sign) lit by
  `ENV.night`. Colliders: the handrail (wall) and the three flagpoles (round props, also in `world.solids`). The porch, landing and
  canopy have none (walkable / overhead). Top-level names: `LPU`, `lpuOn`, `lpuHere`, `lpuFrame`, `lpuBuild` (each once).
- Needs `assets` and `streets` before it; tested placed before `perf2` (copy of the build.sh loop in the scratch dir).

## Numbers (build.sh chain of 2026-11-15 with lmpublic before perf2)
- Model 115,348 B (meshopt, one 1024 px WebP atlas at q72), 3,736 triangles, 3 draw calls (atlas, glow, sign).
- Page 30,393,124 -> 30,551,079 B (+157,955 B). Two builds byte-identical.
- `fps.mjs` (Metal): 60.3 fps with and without the step; load 9.3 s with, 9.6 s without (machine shared).
- `work/test_lmpublic.mjs f1.html f2.html`: PASS, 12 checks (log `research/assets/houses/policija/tests_2026-11-15.log`).
  The "nothing else drawn" check was not re-run with the skip disabled. Other steps' tests not run.

## Compared with the photos (`shots/compare_photo_before_after.jpg`: photo | 2015 east view / before / after; `shots/compare_sides.jpg`)
Matches: three-storey white block along Maironio g., window bands with brown panels, flat roof and parapet, canopy with glazed
entrance at the north-east end, green POLICIJA sign above it, AC units, flagpoles beyond the corner, blank north-east end with the
stair windows and the dark section, the porch at the south corner of the south-west end with blank wall above and the window
pairs further on, the lower north block behind.
Differs: the game camera cannot stand where the dashcam stood (game road a few metres off), so framing differs; the game's
tree stands in front of the south end where the real one is a pine; the porch roof is a gable, not hipped; night windows read
pale rather than warm at that camera; letters are Blender's default font; no emblem on sign or flag (on purpose).

## Guessed faces
- North block: all faces (plain white, no windows), roof height from LiDAR only.
- Main wing back (north-west face) and the north-west part of the south-west end: plain.
- Flagpole positions, roof units, door/board positions in the glazing, dark section finish.

## Photos wanted
- photo wanted: police station (c2158), north-west and south-west faces of the north block, seen from the car park west of it.
- photo wanted: police station, north-east side beyond the stair, seen from the car park north-east of it.
- photo wanted: health centre (c170), the main entrance side, seen from wherever people walk in (the street on its south-west side or the yard south-east of it).
- photo wanted: health centre, south-east side (yard between the wings), seen from the main road or the yard.
- photo wanted: health centre, north-west (park) side, seen from the park path.

## Credit
Model original work. Textures Poly Haven CC0 (Plaster Grey 04, Painted Plaster Wall, Brick Wall 09, Concrete Wall 006 and 008,
Bitumen, Box Profile Metal Sheet), covered by the page's "Building textures: Poly Haven (CC0)" line. Reference photos Mapillary
CC BY-SA 4.0 and the ORT10LT orthophoto (reference only, `refs/landmarks/CREDITS.tsv`), not used in the model.
