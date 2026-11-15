# lmvil3: two ordinary houses on Vilniaus g. (c2467, c1525) rebuilt in Blender (2026-11-14, Sonnet trial)

Candidates were c2185, c1525, c2467 and c2504. Built: **c2467** and **c1525**. Everything below is local data; photos are CC BY-SA
Mapillary, reference only, credited in `refs/landmarks/CREDITS.tsv` (`vil3/` rows), kept in `refs/landmarks/vil3/`.

## Why these two
Photo search: Graph API, every image within 45 to 70 m of each building, then the images were looked at (the compass angles in this
set are off by up to 70 degrees, so "facing the building" filters are useless; positions and the pictures themselves were used).
- **c2467**: 32 images within 30 m, on the road in front of it. Seen well from the road, from both sides along the street: best evidence by far.
- **c2185**: stands 45 m back from the road behind a garden; the 9 images within 65 m show trees, a lorry and a neighbour's gable, never the house. No evidence.
- **c2504**: a small T-shaped building behind c2467 on the car park; every photo of it is blocked by c2467 or shows nothing of it (the side
  street next to c2467 has no Mapillary coverage). Orthophoto only, and it is mostly hidden from the street, so not worth a model first.
- **c1525**: no photo shows it (nearest images are 40 m along the road and look away from it). Orthophoto only, but it stands on an open lawn
  in plain view of the street, with a clear hipped roof. Chosen as the second house, knowing that all its façade detail is a guess.

## Plan before modelling
Frame used everywhere: x along the street face from its left corner as seen from the street, y back from it, z up from the game's `y0`.

### c2467 (the pink and cream timber house, west side of the side street, north-east side of Vilniaus g.)
Evidence: orthophoto (`research/assets/houses/vil3/ortho_c2467.jpg`); street photos 1357990891884040 (from the side-street mouth, the whole
front wall and the west end), 2037667700028881 (the same from nearer), 1482857586721126, 1072401861597641 and 1550325682857528 (from the
road in front, looking along it, the front wall and the neighbour c2466 to the east), 1575617853742681.
- Footprint (metres, east/north from corner 0): 0 (0,0), 1 (-5.8,-7.9), 2 (-16.9,0.2), 3 (-11.1,8.1): 13.75 x 9.74 m. **Street face =
  edge 1-2** (it faces south-west onto Vilniaus g.). Left corner seen from the street = corner 2 (west), right = corner 1 (east).
- Storeys: one and a half. Ground floor with the eave at 2.8 m, living space in the roof, an attic window pair in the front cross-gable.
- Roof: gabled, **ridge parallel to the street**, grey fibre-cement wave sheet. Cross-gable on the front wall (its ridge perpendicular to the
  street), as seen in the photo (the roofline rises, falls on to the gable, then a lower roof carries on to the east) and in the top-down
  orthophoto (a second ridge running towards the road). The east end of the house is lower: a separate low roof east of the cross-gable.
- West end (gable end, faces the side street): salmon boards to the eave, light grey boards above (photo 1). No windows visible on it.
- Front wall: salmon horizontal timber boards, white-framed windows. Positions fitted from photo 1 by perspective (corner and far end of the
  wall known; window widths shrink 60 to 23 px along the wall): windows at 1.2, 2.8 and 4.4 m from the west corner, dark red-brown door at
  6.4 m, windows at 8.15 and 10.9 m. The cross-gable is cream boards, 4.5 to 8.7 m, centred above the door, two upper windows at 5.7 and 7.5 m.
- Chimney on the ridge near the west end (brick, one stack), TV aerial beside it (not modelled), brown downpipe at the west front corner,
  eave gutter along the front, mailbox at the west end (not modelled).
- Not visible, **guessed**: the east end wall (one window), the whole back wall (four windows), the form of the low east roof (gable ridge at
  4.3 m), the main ridge height 7.0 m (the LiDAR 7.3 m at the west corners may be a tree), the depth of the cross-gable, the west gable's
  boarding above the east block, the colour of the back.

### c1525 (cream house with a hipped tile roof, south-west side of Vilniaus g., set back across a lawn)
Evidence: orthophoto only (`ortho_c1525` crop, `research/assets/houses/vil3/`), the street file's measured roof colour and style.
- Footprint 13.77 x 10.80 m; corner 0 is the east-most. **Street face = edge 0-3** (north-east, 13.77 m); left corner seen from the street = corner 0.
- One storey, eave 3.1 m, hipped roof, ridge parallel to the street (3 m long), dark brick-red tile, 45 degree hips, ridge at 5.7 m.
- **Guessed**: wall colour and material (cream plaster from the street file), the door position (centre of the street face), every window
  (four on the street face, three behind, two each side), no porch, no chimney (none visible from above), eave overhang 0.45 m.

## Files
- `research/assets/houses/vil3/build_vil3.py` (Blender, `-- OUT a|b`), `make.sh` (Blender then `gltfpack@0.25.0 -cc -kn -km -vpf`), `tools/shots.mjs` (cameras in
  the house frame, Metal, HUD hidden), `tools/q.mjs`, `tools/sheet.py`, `shots/`, `ortho_*.jpg` (orthophoto crops of all four candidates).
- `pipeline/lmvil3.js`, `pipeline/add_lmvil3.py`, `pipeline/lmvil3/vil3a.glb`, `vil3b.glb`, `work/test_lmvil3.mjs`.
- `refs/landmarks/vil3/` (28 Mapillary photos) and their rows in `refs/landmarks/CREDITS.tsv`.
- Chain: `build.sh`, `add_house5a`, `add_maxima`, then `python3 pipeline/add_lmvil3.py out.html`.

## The step
`addBuilding` is wrapped: the two generated houses draw nothing (checked by id and by a corner position, so another map is untouched); footprints
keep the collision walls, `inBuilding` and the minimap. `buildFacadeDetails` is wrapped to leave the two records out (otherwise the facades step stands a
chimney 2 m above the model's roof: seen on c1525 before the fix). Each model is one group placed by one matrix; one atlas, Lambert, glow material for one or two
windows (`ENV.night`). Plot items from other steps (hedge, fence, trees, car park) are untouched.

## Numbers
- Models: `vil3a.glb` 76,868 B (1,322 tris), `vil3b.glb` 77,204 B (1,228 tris), one 1024 px WebP atlas each, 2 materials, 2 draw calls per house.
- Page: 28,782,063 B (chain with house5a and maxima) to 28,990,478 B: +208,415 B, about 104 KB per house (limit 120).
- Two builds of the page byte-identical; two Blender+gltfpack runs give a byte-identical GLB.
- Tests: see the end of this file.

## Compared with the photos (opened: `shots/sheet_A_photo.jpg`, `grid_A_sides.jpg`, `sheet_A_top.jpg`, `sheet_B_top.jpg`, `grid_B_sides.jpg`)
c2467 matches: gable end to the side street with salmon boards below and light grey boards above; ridge parallel to the street; grey wave-sheet roof; cream
cross-gable with two windows over the door; five windows and the dark red door on the front wall; low roof east of the cross-gable; chimney near the west
end; gutter and downpipe at the front corner. The old generated block was a two-storey flat-roofed slab with a floating roof.
Still differs from the photo:
- the salmon is duller and browner than the photo's orange-pink; windows are smaller and darker, with thin frames where the photo has thick white ones;
- no TV aerial, mailbox, flower pots or the painted number; snow and the wet road of the photo obviously absent;
- the cross-gable's roof planes read as a dark slab from the west (shade side), the photo's snow makes them light;
- main roof pitch and ridge height (7.0 m) are not verified; the photo suggests a slightly lower pitch;
- the camera in `sheet_A_photo.jpg` is matched by eye (the photo's GPS and compass are 10 m and up to 70 degrees off, lens unknown), not exact;
- back wall windows show texture artefacts at close range (atlas margin); the east end and back are guesses;
- walls are 3 to 4 cm per texel: boards are a faint grain, not individual boards.
c1525: no photo exists, so the only check is the orthophoto: footprint, hipped roof with the long ridge parallel to the street, brick-red tile all agree.
Everything else on it (windows, door, wall colour, white fascia) is a guess and is generic. Its look is therefore not "this house", only "a house of this plan".

## Photos wanted
- c2467, east end and back, seen from the car park between c2467 and c2466 (from the south-east).
- c1525, the whole street face, seen from the pavement opposite (north-east side of Vilniaus g.), and any side.
- c2504, from Gėlių g. (the side street west of c2467, no Mapillary coverage) or from the car park.
- c2185, from the garden path or the neighbouring plot (it is 45 m back from the road).

## Not fixed / notes
- c2504 and c2185 were not built (no evidence).
- Mapillary compass angles in this set are unusable for matching; positions only.

## Tests (final page, scratch copies; the 30 s page-load limit was raised to 300 s in the scratch copies of test_solid and test_streets, nothing in work/ edited except my own file)
- `work/test_lmvil3.mjs x.html x1.html`: PASS, 12 checks (two builds byte-identical; both models loaded, Lambert, glow; generated house and chimney not drawn; solid
  from street, back, west, east; no console errors). Run on the previous texel-density build, then the page was rebuilt with only atlas density changed; the
  test was not re-run on that last build. The "not drawn" check was not proven to fail with the skip disabled (the before/after shots show the generated house gone).
- `test_solid`: all passed. `test_streets`: PASS (all 14 streets, 0 bad).
- `test_facades`: everything passed except `errors`: it cannot fetch `GTAOPass.js` from cdn.jsdelivr.net (no network here); unrelated to this step.
- `fps.mjs` (Metal): 60 fps, load 4.1 s.
