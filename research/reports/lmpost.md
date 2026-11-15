# lmpost: the post office building (c2683) in Blender; Swedbank (c2940) not built (2026-11-14)

Step `lmpost`, landmark round, Addendum 2 of `09-landmarks-brief.md`. Written as I went.

## Evidence (looked at before modelling)
Images were placed by their position on the orthophoto and by what they show, not by their compass value: every dashcam
sequence here stores the heading wrong (frames stored as 183/204 degrees are driving north-east, frames stored as 108 are too).

**Post office, c2683** (OSM building with no tags; the OSM node "Raseinių paštas" lies inside it; Maironio g. 8).
- Mapillary 2015 panoramas (lakd): 2873320206215250 (road south-west of the entrance, the front square-on), 255203872959894
  (crossing at the north-east end), 2803938699918215, 313568330169948, 966079834136678 (from the south-west, the brick gable).
  2015: a yellow post plate over the doors at the top of a broad flight of steps in the glazed part.
- Mapillary 2025-2026 dashcam (VidmantasM_Siaures, MindaugasR_Vakaru): 1308208114440138, 1110984577779945, 1632277384773213,
  961496500236683, 2362316790896617 (driving north-east past the front: the current front, renovated glass part with tenant signs).
- Commons "2022, Smetonos ąžuolas, Raseiniai.JPG" (Vilensija, CC BY-SA 3.0): the front square-on from the park behind the oak.
- Orthophoto `refs/landmarks/pastas/ortho_c2683.jpg`.

**Is the "glass building" c2683?** Yes. c2683 is the building with the glass: a two-storey glass curtain wall across the south-west
part of its front. The 2015 panorama shows the post plate over the doors of that glass front, and the OSM node is inside the same
footprint. No neighbouring footprint has glass (c2687 and c2676 behind it are plain; c2696 across the side street is a pitched-roof block).

**Swedbank, c2940.** Not built: no photo shows it. Every Mapillary image within 30 m of its footprint (198) stands on the street
north-west of c2930/c2936 and looks along that street; c2930 stands between that street and the bank. The lane on the park side
(the bank's north-east face) has no images; the 2015 panoramas at the Maironio g. corner see c2932 (the BENU corner) and not the bank
behind it. Commons has no photo of it (geosearch 250 m, text search). The brief's "all sides" count was positions, not views.

## Plan for c2683 (fixed before modelling)
Frame: X along the front from footprint corner 1 (north-east end) to corner 0 (south-west end), 50.2 m; Y into the building
(12.4 m); Z up from the game's mid-slope ground y0. Seen from the street X runs left to right.
- **Front** = footprint edge 1-0 (north-west face), on Maironio g. and the park with the Žemaitis monument. The ground falls 2.1 m
  from the north-east end to the south-west end.
- **Storeys**: four, flat roof (LiDAR 13.5 m). Ground floor raised about 1.4 m above the pavement at the entrance (2015: about
  nine steps). Floors at Z 1.6, 4.5, 7.4, 10.3, roof 13.2, coping to 13.5.
- **Upper floors (all photos)**: light grey-white weathered panels, 13 bays of 3.86 m: per bay one wide white-framed window and a
  dark brown vertical panel. Ground floor of the north-east part the same.
- **Glass**: a two-storey curtain wall X 19.3..50.2 (from the 6th bay to the south-west end), 0.6 m proud of the wall, Z 1.5..7.6,
  dark blue-grey glass, dark frames, floor band at 4.5. Plain sign boards on it (the real ones carry tenant names: left plain).
- **Entrance**: doors at the north-east end of the glass (X 21..23.5). In front a landing, a straight flight of nine steps down to
  the pavement (2022 photo) and a ramp with railings running north-east along the front (2022 photo, 2025 frames).
- **Front strip**: grass bank behind a low fieldstone wall at the pavement (2022 photo).
- **North-east end**: a full-height glazed stair tower against the gable near the front (2015: open steel frame; 2022: glass-clad)
  and a low glazed porch beside it (2022 photo). Gable itself plain panel (2015).
- **South-west gable**: brown brick, blank (2015 panorama 966079834136678; its billboard is left out).
- **Roof**: flat membrane, light coping, a slim mobile mast near the south-west end (2015 panoramas).
- **Guessed** (no photo): the whole south-east (back) face (repeated window bays on four floors, a plain back door); the porch and
  tower sizes (from their share of the photo); the roof plant; wall depth of the stone bank.

## Files
- `pipeline/lmpost.js`, `pipeline/add_lmpost.py`, `pipeline/lmpost/pastas.glb`, `work/test_lmpost.mjs`.
- `research/assets/houses/pastas/`: `build_pastas.py` (Blender), `civickit.py` and `webpq.py` (copies of lmcivic's, so a change there
  cannot break this model), `make.sh`, `tools/` (`shots.mjs` fixed cameras, `q.mjs`, `mly.py`/`dl.py` Mapillary search and download,
  `gridcrop.py`, `campos.py` camera positions on the orthophoto, `build_final.sh` = build.sh's chain with lmpost before perf2),
  `shots/` (before_*, after_*, compare_photo/pano3/sw.jpg), `tests_2026-11-15.log`.
- `refs/landmarks/pastas/`, `refs/landmarks/swedbank/` and 9 lines in `refs/landmarks/CREDITS.tsv`.

## Built (c2683)
As in the plan above: four-storey flat-roofed block 50.2 x 12.4 m, roof 13.2, coping to 13.5; 13 bays of a wide white window and a
dark brown panel on all four floors of the north-east part and on floors 2-4 above the glass; two-storey dark blue-grey curtain wall
X 19.3..49.95, 0.6 m proud, 1.5 m panes, floor band with three plain light boards, a dark cap; glazed double doors at its north-east
end; landing, nine steps between cheek walls with handrails, a ramp along the front from X 6.5 to the landing with rails; a low
fieldstone wall 3.4 m out with gaps for the steps and the ramp foot; glazed stair tower and glazed porch at the north-east end;
blank brick south-west gable; light coping, roof membrane, mobile mast and plant boxes. Night: shop row, doors, porch and seven
windows glow with `ENV.night`. No lettering: the real tenant signs (ERGO and others) are names; the 2015 post plate is not in the
2025-26 photos, so it is not drawn.

## The step
- `addBuilding` skips c2683 (corner-checked); `buildFacadeDetails` runs without its record.
- `buildTown` is wrapped: c2683 is a "five-storey block" there, which drew loggia columns (instanced boxes outside `worldGroup`),
  stairwell doors with canopies and steps, and a yard mark that props2 turns into a playground in front of the building. The wrap
  empties that building's `blks` for the call only. The footprint keeps collision, `inBuilding`, the minimap.
- 19 wall segments: the glass front, landing sides and step cheeks, the ramp rail, the fieldstone wall, the tower and porch.

## Numbers
- Model `pipeline/lmpost/pastas.glb` 144,436 B (meshopt, one 1024 px WebP atlas at q72), 5,446 triangles, 2 draw calls.
- Page: +197,058 B (30,393,124 -> 30,590,182; budget 400 KB). Two builds of the chain with lmpost before perf2: byte-identical.
- `fps.mjs` (Metal): 60.3 fps with the step, load 9.9 s; 60.3 without, load 8.6 s (machine load about 25 from other agents).
- `test_lmpost.mjs f1 f2`: PASS, 11 checks (identical builds; names once; model loaded, Lambert, lit; nothing else drawn in or
  within 2.5 m of the outline; loggias and playground gone; solids off roads; blocked front/back/both ends; up the steps to the
  doors; through the wall gap and up the ramp; wall and tower solid; no console errors). With the buildTown skip removed it fails
  (204 loggia instances, 3 playground pieces). `test_solid` all passed, `test_facades` PASS (four landmarks still found).
- Names: `LPO`, `lpoOn`, `lpoNear`, `lpoEdge`, `lpoMine`, `lpoRec`, `lpoMat`, `lpoBuild`, each defined once in the page.

## Compared with the photos (`shots/compare_*.jpg`)
Matches: long four-storey block, flat roof with light coping; window plus dark panel rhythm; glass curtain wall two storeys high on
the south-west part of the front, standing proud, with doors at its north-east end; steps straight down to the pavement, ramp with
rails running north-east along the front; low stone wall at the pavement; glazed tower and porch at the north-east end; brick
south-west gable; mast on the roof.
Differs: the front faces north-west and is in shadow most of the day, so the wall reads greyer than the photos' white; the glass is
plain dark (no reflections, no shop interior); the real wall's peeling patches are a soft grime only; grass is the game's (the real
bank is lawn up to the wall top, the game's ground stays at pavement level behind the low wall); the tenant signs are blank boards;
the "NUOMA" letters in the upper windows are not drawn; the game's photo camera stands at the park edge, not behind the oak (game
trees hide the front from there).

## Guesses
Back (south-east) face entirely; tower and porch sizes and the porch door; window width; glass start at 19.3 m (counted bays in two
photos, about plus or minus 2 m); ramp length; mast position; roof plant; floor heights (from the 2015 step count and LiDAR).

## Photos wanted
- Paštas (c2683), south-east (back) side, seen from the yard / car park behind it.
- Paštas (c2683), north-east end, seen from the side street: tower and porch close up, and where the post office door is now.
- Swedbank (c2940), north-east side, seen from the parking lane along Žemaičio aikštė (the front with the bank's door).
- Swedbank (c2940), south-west side, seen from the yard behind it.
- Swedbank (c2940), seen from Žemaičio aikštė by the monument (the view the statue's arm points along).

## Credit
Model original work. Textures Poly Haven CC0 (Plaster Grey 04, Red Brick 03, Concrete Wall 006 and 008, Rough Concrete, Bitumen),
covered by the page's "Building textures: Poly Haven (CC0)" line. Reference photos only, credited in `refs/landmarks/CREDITS.tsv`.
