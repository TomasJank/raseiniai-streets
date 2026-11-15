# lmmaxx: Maxima X (building c3293) rebuilt in Blender (2026-11-14, written as I went)

Step `lmmaxx`, prefix `LMX` / `lmx`. Files: `pipeline/lmmaxx.js`, `pipeline/add_lmmaxx.py`, `pipeline/lmmaxx/lmmaxx.glb`,
`work/test_lmmaxx.mjs`, `research/assets/houses/maximax/` (`build_maximax.py`, `make.sh`, `tools/`, `shots/`),
`refs/landmarks/maximax/` (orthophoto crops, the Mapillary frames used, listed in `refs/landmarks/CREDITS.tsv`).

## Evidence
- Footprint `c3293` (OSM "Maxima X", shop=supermarket), six corners. Game metres: west corner A (402.96,-973.58), south corner
  B (414.66,-962.64), step p2 (418.89,-967.17), p3 (420.03,-966.17), east corner p4 (430.34,-977.12), north corner D (417.50,-989.06).
  Main rectangle 21.23 m (NW face) x 16.0 m (SW face); a 1.55 m strip on the SE side from p2 to the east corner.
  LiDAR in the page: top 7.5, median 7; parts 7.2 m (main rectangle, a point at 8.2) and 3.4 m (the strip, a point at 4.7).
  Ground within 0.27 m of the store's mid-slope y0 (5.99) all round.
- Orthophoto (`refs/landmarks/maximax/ortho_c3293_60.jpg`, `_120.jpg`, `ortho_grid.jpg`): flat dark grey roof with three or four
  small roof units, a white strip along the SE side (low annex roof plus the light SE wall, which the photo leans towards), the
  main road along the NW face, a side street along the SW face, the car park NE of the store, a service yard SE.
- Mapillary: 862 images in a 130 x 120 m box, almost all dashcam frames on the two roads (2025-09 to 2026-09) plus 2015 panoramas.
  Headings taken from the next frame's position. Used (saved in `refs/landmarks/maximax/`):
  - 2413460272482149, 4573767782906154 (main road SW of the store, looking NE): the NW face and the west corner.
  - 2646226002386723, 1097209355908024 (main road N of the store, looking SW): the NW face from its north end.
  - 1179395957607119, 1174154028080481, 951211167335198, 803478602745757, 1198532609147668 (side street S of the store, looking NW):
    the SW face, the south corner, the SE side with the low annex and the brick wall.
  - 740719349946812 (2015 panorama in the car park junction): the NE face, before the store was re-clad (plain grey, an outside
    steel stair). Nothing newer shows the NE face: every 2025-26 frame from the north has it at the edge of the frame or beyond.
- Wikimedia Commons: nothing for this store.

## Plan (fixed before modelling)
Model frame: origin at the north corner D, X along the NW face towards the west corner A (X = 21.23 at A), Y back into the store
(towards the SE), Z up from y0. Seen from the main road, X runs left to right.

| face | footprint edge | what the photos show | built |
|---|---|---|---|
| NW, the front | D-A, faces the main road | light grey horizontally ribbed cladding; a blue fascia band the whole length at about a third of the height with "MAXIMA" in white, its X red, and a white square with a red X at the right (west) end; under the band at the right end a dark grey panelled zone with a window, the glazed entrance doors and a small white address plate; the rest of the lower wall ribbed grey with two parcel lockers (orange, grey) standing against it; above the band at the right end a smooth grey panel that rises about 1 m above the ribbed parapet | as seen |
| SW | A-B, faces the side street | ribbed light grey cladding, plain, no openings, one white vertical trim strip mid-way; top level with the raised panel on the front, i.e. about 1 m above the front's parapet, all the way to the south corner | as seen |
| SE | B-p2-p3-p4 | a low white sheet annex (louvres, outdoor units) along the whole side with grey ribbed fence panels and yellow-black bollards in front; above it the old sand-lime brick wall of the hall, its top a little below the cladding; near the east end a taller brick part with a small window and an outdoor unit | as seen; positions along the side and the taller part's extent are guesses |
| NE | p4-D, faces the car park | 2015 only: plain grey wall, outside stair at the east end, low annex end | **guess**: plain ribbed grey (as the re-clad front), one plain door; no stair |

- Entrance: on the NW face, near the west corner (X about 17.8 to 19.4), under the fascia band; seen in four frames from both
  directions. Not on a corner and not on the car-park side. No canopy: the band projects a little.
- Storeys: one tall retail storey. Roof flat, membrane, behind parapets.
- Heights (from the photos' proportions with the LiDAR 7.2 m): front parapet 7.2, SW cladding and the corner panel 8.2 (LiDAR point
  8.2), band 2.4 to 3.45, brick wall top 6.8, annex 3.6 (LiDAR 3.4 / 4.7), taller brick part 8.6 (guess).
- Car park: NE of the store (the game's own ground). No trolley shelter or canopy is seen in any frame: none built.
- No story stop or shop marker refers to Maxima X in the page (searched); only the generic name label from `addBuilding`, which stays.

## Not built / photo wanted
- photo wanted: Maxima X, NE side (car-park face), seen from the car park.
- photo wanted: Maxima X, SE side (service yard), seen from the yard, to fix where the taller brick part stands and how deep the annex is.

## Built (model `pipeline/lmmaxx/lmmaxx.glb`, script `research/assets/houses/maximax/build_maximax.py`, `make.sh`)
- Hall X 0..21.23 x Y 0..16, flat membrane roof at 6.7 with four roof units. Front and NE parapet 7.2; the SW face is a taller ribbed
  screen to 8.2 the whole length, and it shows on the front as the smooth raised panel X 17.8..21.23 (the step seen in the photos).
- Front: light grey horizontal ribs; blue band 2.4..3.45 m, 0.45 m out, the whole length; "MAXIMA X" in plain white capitals, one
  colour (Blender's built-in font), right-aligned to X 20.8 (after review: the red X and the white X square were brand-mark artwork, removed). Under the band at X 14.4..21.23
  a dark panelled zone: window X 14.9..17.5 with a white "8-22" plate, double glass doors X 17.8..19.4 (centre 18.6), address
  plate. Parcel lockers X 9.2..14.0 (orange with a small roof, grey), plain colours, no marks.
- SW face: plain ribs, two white trim strips (mid-way, south corner).
- SE: sand-lime brick wall from the annex roof to 6.8 with a lighter bricked-up patch; taller brick part X 3..7.5 to 8.6 with a darker
  top, small window and outdoor unit (**guess**: place and depth); white annex to 3.6 along the footprint strip plus a 0.9 m deep part
  beyond the step to the south corner (**guess**: the photos show the annex starting at the corner, the footprint does not); grey
  ribbed fence panels in front, two louvres, an outdoor unit, two yellow-black bollards at a gap.
- NE face: plain ribs (**guess**, see above). No door drawn on it.
- Night: glass glows warm, band and lettering glow their own colour (`ENV.night`, as `maxima.js`).

## The step (`pipeline/lmmaxx.js`, `add_lmmaxx.py`)
- `addBuilding` skips both c3293 specs (they carry the north or the east corner) and the tall light-grey "wing" the `views` step
  drew along the SW side (an id-less call from corner A to corner B); returns y0+8.2 so the name label sits above the roof.
- Model placed with one matrix in `buildExtra`, Lambert materials, night glow. Walls for the annex part beyond the footprint, its
  fence, the lockers, the bollards; the footprint keeps the rest. No story stop or marker refers to this store; the name label stays.
- Top-level names: `LMX`, `lmxHere`, `lmxFrame`, `lmxBuild` (each once in the built page).

## Numbers (chain of build.sh 2026-11-15 with lmmaxx placed before perf2)
- Model 102,680 B (meshopt, one 1024 px WebP atlas), 2,560 triangles, 3 draw calls (walls, glass, band/name).
- Page 30,393,124 -> 30,535,693 B (+142,569 B, with the paving). Two builds byte-identical.
- `fps.mjs`: 60.3 fps (Metal) with and without the step; load 7.8 to 9.4 s both ways (machine busy; the SwiftShader pass timed out on both, not used).
- `work/test_lmmaxx.mjs f1.html f2.html`: PASS, 13 checks (identical builds; names defined once; model loaded, Lambert, two glow
  materials; old box and wing not drawn (triangle centroids inside the outline 1..9.5 m up: fails with 12 when the skip is disabled,
  checked); name label kept; store blocked from front, SW, NE; walk from the main road to the doors reaches (18.6, -0.35); lockers
  solid, pavement in front open; annex part and bollards solid; no console errors).
- Other steps' tests not run.

## Compared with the photos (`shots/compare_photo_before_after.jpg`: photo | before | after; `shots/after_sides.jpg`)
Matches: grey ribbed box on the corner, blue band along the front with the name near the west end (plain lettering; the real sign's red X and X square left out on purpose),
dark entrance zone with window and doors under it, raised panel at the west corner, lockers along the front; from the side street a
tall plain ribbed SW face, the low white annex with grey fence and louvre, beige brick wall above it, a taller brick part further on.
Differs: the game camera positions do not match the dashcam exactly (game roads differ by a few metres); ribs show only close up; letters are Blender's
default font; the annex fence is simplified to panels (no gate frame); no flag bracket, no road signs on the walls.
Guessed: NE face finish, taller brick part's place and depth, annex depth beyond the footprint step, roof units, all heights to
about +-0.5 m.

## Credit
Model original work. Textures Poly Haven CC0 (Corrugated Iron 02, Box Profile Metal Sheet, Whitewashed Brick, Bitumen), covered by
the page's existing "Building textures: Poly Haven (CC0)" line. Reference photos Mapillary CC BY-SA 4.0 (reference only, listed in
`refs/landmarks/CREDITS.tsv`), not used in the model.

## Paving (after review, 2026-11-15)
Grass tufts grew in front of the doors and across the shop window. `lmxPave` (same approach as `lmsquare`'s `lmsDrape`) lays a flat
skin of grey 20 x 10 cm concrete pavers 7 cm over the game's ground in 0.5 m cells, over the frame rectangles: the pavement along the
front out to the main road (x 0..29, y -14..0), round the west corner along the side street (x 21.23..29, y 0..26) and the SE service
yard (x -3..21.23, y 16..26); cells on a road (within 0.4 m of its edge) or inside any building outline are left out. The NE car park
is the game's own lot and is left as it is. No walls: walkable and drivable, nothing raised. Being a non-grass mesh over the ground it
keeps the grass map from growing tufts there. 2,058 cells.
Test: new check "front, west side and yard paved, no grass tuft inside the paving": it renders the grass map at the store and reads
it under every third cell: 686 sampled, 0 tufts; with the paving hidden before the map is drawn it reads 347 tufts (checked).
`work/test_lmmaxx.mjs f1 f2`: PASS (16 checks). Shots `after_entrance.jpg`, `after_front.jpg`, `after_se_yard.jpg` and the compare
sheets refreshed. fps not re-measured after this change. The yard paving is barely visible from the side street (the neighbour
building hides it); the lawn in the foreground of `after_se_yard.jpg` is the neighbour's plot, outside the paved area.
