# lmvil2: two blocks on Vilniaus g. rebuilt in Blender (2026-11-14, Sonnet trial)

Step `lmvil2`: c2909 and c2904. Files: `pipeline/lmvil2.js`, `pipeline/add_lmvil2.py`, `pipeline/lmvil2/{c2909,c2904}.glb`,
`research/assets/houses/vil2/` (`build_vil2.py`, `make.sh`, `tools/shots.mjs`, `tools/sheet.py`, `tools/views.json`, `shots/`),
`work/test_lmvil2.mjs`, reference photos in `refs/landmarks/vil2/` (credited in `refs/landmarks/CREDITS.tsv`).

## The brief's description was wrong for both buildings
The brief (from the street file's `looks`) said: three-storey flat-roofed blocks, two-tone salmon and grey, one with balconies, both
by `looks.c2909` / `looks.c2904`. The orthophoto and the street photos say otherwise.
- c2904 is a real three-storey salmon and grey block, but with a low hipped roof (solar panels on the street slope), not a flat roof.
  It is an L (two wings), not one slab.
- c2909 is not salmon and grey and has no balconies: it is a cream rendered house with dark steel roofs. The cream house with the
  canopy and balcony-like bay (Vilniaus g. 146, "Officeday") that I first took for it is c2910 (lmvil1's); the corner dots of c2910
  fall on it when the footprints are projected into the photos. The generated c2909 in the game was a four-storey block with
  balconies, which is also wrong. I built what the photos show and say so here rather than the brief's description.

How the buildings were identified: footprint corners (from `footprints.json`) projected into the Mapillary photos with the camera
position and the road heading (the EXIF compass of these dashcam photos is unreliable: 12, 359, 53 for photos that look along the road,
so the heading was taken from other photos of the same sequence: about 72 and 124 / 304 along the road). Photos used (all CC BY-SA,
reference only, in `refs/landmarks/vil2/`): 1621713682378349 and 1467021184570322 (c2904), 1637964323948645 (c2909), 1474179107556930
(c2910, to tell it apart).

## Plan, written before modelling
Frame (both models): x along the street-face edge from its left corner as seen from Vilniaus g., y back into the plot, z up from
`spec.y0`. Footprint corners are the game's own (`FX.recs`), the model's frame is the same formula the step uses.

### c2904 (footprint 8 corners, 38 x 17 m wing along the street plus a 43 x 17 m wing running north-east)
- Street face (south-west, 37.6 m): polygon edge pts3 to pts2. Ground floor cream plaster (to 3.2 m) over a dark brick plinth, first
  floor salmon brick (3.2 to 5.9), top floor grey plaster (5.9 to 8.4). Cream string courses at 3.2 and 5.9, cream pilasters at both ends
  and at 4.5 bays. Three storeys, one stair at each end of the face.
- Photo 1621: entrance with a small canopy at the left end, two large shop windows, double glazed door with a canopy right of the middle,
  windows one per bay on the upper floors, a glazed bay with a balcony slab at the top-left corner.
- Roof: low hip (12 degrees), dark steel grey; wing A ridge at 10.2 m (LiDAR top 10.2), wing B hip along its own axis (the south-east
  edge, 43 m); flat slab over the small annex at the north-west of wing B; solar panels (3 x 6) on the street slope of wing A.
- Faces I did not see: wing B's south-east face, both ends, the back: windows at a steady rhythm, no doors. Guesses.

### c2909 (19.4 x 14.1 m rectangle, street face = the long south-west edge pts1 to pts2)
- From photo 1637 (38 m away, from the south): a two-storey cream block over u 0..11 with a dark steel gable roof running along the
  street (30 degrees, ridge 9.7 m, chimney clad in dark profile metal), a cross-gable bay over u 4.2..9.8 with a blank cream wall and a
  glazed lean-to under it, a brown plaster panel left of the bay, and a one-storey wing over u 11..19.4 with its gable to the street.
- Wall material: cream render. Windows: one per storey left of the bay, two tall windows in the wing's gable. The "M"-shaped arched
  window surrounds of the wing are not modelled.
- Faces I did not see: both ends and the back of the block and the wing. Windows are a guess.

## Built
- c2904: 1,468 triangles, 2 draw calls (one glow material), `pipeline/lmvil2/c2904.glb` 63,220 B.
- c2909: 506 triangles, 2 draw calls, `pipeline/lmvil2/c2909.glb` 34,652 B.
- Windows are flat layers on the wall (white frame quad, glass quad inset, mullion, sill box on the street faces), no booleans: this
  kept two blocks at 7 to 10 times fewer triangles than a first version with real frames (10k triangles, 229 KB for c2904).
- Materials: Poly Haven CC0 textures already in the project (red_brick_03, plastered_wall, plaster_grey_04, red_brick,
  box_profile_metal_sheet, concrete_wall_006, roof_tiles_14 not used in the end), baked into one 1024 px WebP atlas per block (quality 80).
- Night: shop glass and a few windows share the town's night glow (`atlas_glow`).
- The step skips the generated building (`addBuilding`), and the facades step's balconies, chimney, dormers and shop glazing for the two
  records (`buildFacadeDetails` wrapped as `lmcivic` does). The footprints keep the collision walls, `inBuilding` and the minimap.
  Added colliders: c2909's glazed lean-to (three segments). Canopies (c2904: two 1.4 m canopies, c2909 none) are not solid.
- The existing hedge and railing in front of c2909 are left.

## Numbers
- Page with house5a and maxima: 28,782,063 B. With lmvil2: 28,918,083 B, +136,020 B for both (c2904 about 86 KB, c2909 about 50 KB,
  JS about 4 KB). Each block is under the 120 KB budget.
- Two full builds (`build.sh` + house5a + maxima + lmvil2): byte-identical.
- `work/test_lmvil2.mjs` (on the page): PASS, 11 checks (loaded and Lambert, lit windows, generated box and facade dressing gone inside
  both footprints, walking into c2904 blocked, c2909 lean-to solid, no console errors, builds identical).
- `node work/fps.mjs` on the page: 60.3 fps (Metal), load 4.3 s.
- `test_solid`: PASS (all). `test_facades`: PASS (landmarks church 1,066, cerkve 732, culture 3,216, maxima 1,103 triangles).
- `test_streets`: see the failure note below.

## Compared with the photos (sheets in `research/assets/houses/vil2/shots/`)
`sheet_c2904_1621.jpg`, `sheet_c2909_1637.jpg`: reference photo | game before | game after (photo 1467 of c2904 could not be matched: its position falls
behind the big grey two-storey building next to the junction in the game, so no sheet). Also
`sheet_c2909_1474.jpg` (c2910, not mine: shows the neighbour that I first took for c2909). Side views: `after_f04_*`, `after_f09_*`;
aerials `after_aer04.jpg`, `after_aer09.jpg`; night `after_n04.jpg`, `after_n09.jpg`; each with a `before_*` from the same camera.

What matches: c2904 is three storeys, salmon over cream with a grey top floor, the glazed corner bay with balcony slab at the top-left,
entrance canopy at the left end, double door with canopy right of the middle, big shop windows, low dark hip roof with panels. c2909 reads
like the photo: chimney volume with dark gable roof, cross-gable bay over a glazed lean-to, brown panel, one-storey wing with its gable to
the street, cream render.

What still differs:
- c2904: the photo's top floor has only a few big windows and one more window at the right; mine has one window per bay everywhere.
  The photo's roof edge carries a snow-guard railing: not modelled. The photo's pilaster is left of the door and a second long wall section
  continues right of it; in my model the pilasters sit at 0, 4.5 bays and the end, so the rhythm between pilasters is not the same.
  The photo's face looks about 28 m wide, the model's is 37.6 m (the footprint, so the photo's far end is probably wing B's face).
  The plinth shows as a dark red band 1 to 1.3 m high at the low (west) end because the ground falls 0.7 m below the floor there.
  The wall textures are dull next to the photo's strong brick red (the atlas is 1 texel per 3 cm on walls).
- c2909: the glass of the sunroom is a flat dark panel, the photo's is slanted panes with mullions. The wing's two arched windows with the
  M-shaped surround are plain rectangles. The cream renders slightly yellow in the game's light. No kiosk in front (not mine; the photo's
  Kebabai kiosk stands between the street and the building).
- The game camera cannot be put at the photo's position exactly (the Mapillary GPS is 10 to 25 m off against the footprints), so the
  "same viewpoint" views are matched by eye in the block's frame (`tools/views.json`); the before shots use the same cameras.
- Guessed, not seen: all faces except the street faces and one end of each block; heights of the floors; window sizes; chimney position
  on c2909's ridge; roof pitch of c2904 (from the LiDAR top 10.2 m and the visible low pitch).

Photos wanted: c2909, west gable end and back (seen from the lot behind or from Vilniaus g. looking east along the face); c2909, the
street face seen straight on without the kiosk (stand on the opposite pavement); c2904, the whole south-east face of wing B from the
road side of the junction, and the north end (annex).

## Failures and caveats
- `test_streets` FAILED on my first full page (`c3`, built 20:13): "4 street solids do not push a ped out", four consecutive street wall segments
  at about (-1900, 628), nowhere near Vilniaus g. The same page with both of my models removed (asset ids renamed) fails the same way, and
  a chain built later (`build.sh` + house5a + maxima, no lmvil2) passes, and that same later chain plus lmvil2 passes the same check
  (the test's push-out loop, run alone through `q.mjs`: bad = []). The two builds differ by 106 bytes, so another agent's live files
  (street JSON, which `build.sh` reads in place and which are modified in the working tree) changed between 20:13 and later. I read it as
  not caused by lmvil2, but I did not get a clean full `test_streets` run on the final chain: the machine is at load average 70 and the
  full test (30 s page-load limit, 300 s in a scratch copy) timed out; the first full run did complete (all other checks passed,
  `errors []`).
- Byte-identical builds: two chains built back to back were identical (28,918,083 B). A third build made later is 106 B different
  because of the other agents' file edits above, not because of this step. The GLBs themselves are byte-identical across Blender runs.
- The step is placed after `maxima` in my test chain only; `build.sh` is the integrator's. The step asserts only that `ASSETS` and
  `buildFacadeDetails` exist.
- `test_lmvil2` check "walking into the building" for c2909 stops 5.7 m out (the hedge/railing in front blocks first), so it does not
  exercise the footprint wall there; the c2904 check does. Canopies are not solid (c2904's two 1.4 m canopies).
- Page loads in my tests use a 300 s timeout (`work/test_lmvil2.mjs` has it); `test_solid`, `test_facades` ran with their own defaults and passed.
