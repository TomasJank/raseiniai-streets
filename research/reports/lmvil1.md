# lmvil1: two ordinary houses on Vilniaus g. in Blender (2026-11-14)

Sonnet trial of the house5a method on ordinary houses. Built: **c2910** and **c2911**. Not built: **c2913**.

## Files
- `research/assets/houses/vil1/build_vil1.py` (Blender, `-- c2910|c2911 OUT`), `make.sh` (both models, then `gltfpack@0.25.0 -cc -kn -km -vpf` into `pipeline/lmvil1/`).
- `research/assets/houses/vil1/tools/shots.mjs` (game views from world coordinates or from a photo's lat/lon with the true heading, optional building labels with `LABELS=c2913,c2911,...`), `tools/q.mjs`.
- `research/assets/houses/vil1/shots/{before,after}/`: same cameras; `compare_c2910.jpg`, `compare_c2911.jpg` are "reference photo | game before | game after" from the photo's viewpoint; `aerials.jpg`.
- `pipeline/lmvil1.js`, `pipeline/add_lmvil1.py`, `pipeline/lmvil1/{c2910,c2911}.glb`, `work/test_lmvil1.mjs`.
- `refs/landmarks/vil1/`: four reference photos (credited in `CREDITS.tsv`) and the two orthophoto crops.

## Which two, and why
Candidates by the street file: c2913, c2911, c2910 (cream plaster, red tiles). I looked at about 40 dashcam photos along the road. Mapillary's `compass_angle` is wrong in this sequence (off by 50 to 100 degrees); the true heading comes from the next frame's position (116 deg going ESE, 296 deg going WNW). With that and snapping the camera to the right-hand lane, `photomatch`-style renders line up with the photos (labels on the game's buildings made the order along the road checkable).

Order along the road, west to east, north side: c2913, c2941 (behind), c2911, a gap, c2910, then c2909 (brick, lmvil2). All photos are along the road, so every face is seen at 35 to 80 degrees, never from straight across.
- **c2910**: seen in a dozen ESE frames with its west wall, canopy and roof. Chosen.
- **c2911**: seen in about ten WNW frames at the right edge, glazed ground floor, dormer, dark roof. Chosen.
- **c2913**: a steep brown plank cottage with a dormer behind a hedge; partly hidden, wood not plaster. Left alone.

LiDAR (`FX.recs[].t`): c2910 top 12.5 m, roof fit eave 8.6 m, rise 3.3 m, tag 3 levels. c2911 top 6.1 m, parts with eave 2.7 m and rise 3.6 m.

## Plans (written before modelling)
Model frame: X east along the street wall from its west corner, Y back (north), Z up from `spec.y0`. Street edge = the south edge (larger game z).

**c2910** footprint 11.25 m (street wall) x 16.85 m deep, long axis perpendicular to the road. Street edge: footprint corners 3 to 2 (world (-510.16,-352.79) to (-499.98,-347.92)). Door: ground floor of the street wall, east third (guess for the exact place; the canopy runs the full width, seen in photos). 3 storeys plus roof. Roof: gable roof, ridge along the long axis so the street wall is the gable (from the ortho roof lines, the gable end with two small windows seen in two frames, and the LiDAR rise of 3.3 m over a 5.6 m half width). Walls cream plaster, roof dark brown tile with a stepped block of solar panels on the west slope (photos and ortho both show it). Flat canopy over the ground floor with two posts. Windows seen: west wall about 4 bays x 3 floors.

**c2911** footprint main body 9.7 m x 7.7 m, street edge corners 5 to 4 (world (-529.77,-366.5) to (-521.04,-362.29)), rear wing 4.75 m x 2.3 m. Door at the east end of the street wall (guess). 1.5 storeys, eave 2.7 m, ridge 6.1 m. Roof ridge parallel to the road, dark grey-brown, wide eaves. Glazed ground floor band along the street wall of white-framed multi-pane windows (about 5 seen), cream clapboard box dormer with one window on the street slope near the east end. Walls cream. Ground floor plinth.

## Built
- c2910: 3,416 triangles, 86,832 B. Plaster walls with cut window and door reveals (frames, glass, sills in the reveals), tile roof with overhang, gutters and a downpipe at two corners, solar panels, canopy with posts and an entrance slab, plinth, windows on all four faces.
- c2911: 1,414 triangles, 47,120 B. Same technique: walls with a 5-window glazed band and door, dormer, rear wing, gutters, plinth, step.
- Textures: Poly Haven CC0 already in `research/assets/textures/raw` (painted plaster, clay roof tiles, asbestos sheet, brown planks, concrete). One 1024 px WebP atlas each (quality 38 to fit the page budget); window glass is the night-glow material as in house5a.
- Step `lmvil1` (`pipeline/lmvil1.js`): `addBuilding` is wrapped to skip every part of c2910 and c2911 (only when the building is where it should be and the model is in the page); the footprints keep their collision walls, `inBuilding` and the minimap. The model is placed with one matrix. Fences, hedges, trees, cars of other steps are untouched.

## Numbers
- Models: 86,832 + 47,120 B. Page added (same chain with and without the step): **181,121 B**; c2910 about 117.7 KB with its share of the JS, c2911 about 63.4 KB. Both under 120 KB. The first c2910 export was 160 KB and had to be cut (fewer windows on the unseen east and back faces, no panel frames, WebP quality 38).
- Two builds of `build.sh` + house5a + maxima + lmvil1: byte-identical (28,965,341 B).
- `node work/fps.mjs` (Metal): 60.3 fps, load 4.3 s. Draw calls added: 2 meshes with 2 materials each at most.
- `work/test_lmvil1.mjs`: PASS, 8 checks (builds identical; both models loaded, Lambert, glow material; generated box not drawn, verified to fail with 5 and 84 vertices when the `addBuilding` skip is disabled; walking at the street wall and the west wall from outside stops at the footprint; no console errors).
- `test_solid` PASS (all 7), `test_facades` PASS, `test_streets` FAIL on a far-away wall that also fails without the step (last section).

## Compared with the photos (looked at in `shots/compare_c2910.jpg`, `compare_c2911.jpg`)
Matches: c2910 reads as a tall cream house with a dark gable roof and solar panels and a canopy over the ground floor, next to the brick block, as in the ESE frames. c2911 reads as the low cream house with a glazed ground floor band, dormer and dark broad roof at the right edge of the WNW frames, with the plank cottage behind it.

Still differs, plainly:
1. **Identity of c2910 is not settled.** The frames put a brick 3-storey building with a grey top floor and terrace right next to the cream house. LiDAR (12.5 m) and `building:levels=3` fit either. The orthophoto (solar panels on a red-brown roof) and another agent's note both point to the cream house, so I built that. If the brick building is c2910 the model is the wrong house.
2. **Identity of c2911 vs c2913.** Based on projected bearings from GPS that is 10 to 15 m off. Moderately sure (the glazed house is at the right bearing for c2911 and the cottage for c2913), not certain.
3. c2910: the ground floor in the photos has a lower flat-roofed wing in front and large shop windows with a pink-beige wall; mine is a single box with a canopy and plain cream. Roof is a smooth dark red-brown, tile pattern only close up. Window rhythm on the street wall (three per row) is a guess. Photos show a flat roofed projecting top-floor volume on the brick neighbour, not on this house, so none was built.
4. c2911: window count (5), their size, the dormer position and the door are guesses; the photos show them at a 40 degree angle only. Real walls may be plank cladding on the upper part. No porch, no chimney (none seen).
5. Both: east and back faces are not photographed and are built plain with regular windows (guess). Ground heights are fitted by hand from four corner values.
6. The road, fence and trees around come from other steps and do not match the photos (the real plots have hedges and a tall fence; the game has the street's generic fence and lawn).

## Photos wanted
- c2910, street (south) face straight on, from the pavement opposite, to settle ridge direction, the lower wing and the window rhythm.
- c2910, east side from the gap towards c2909 (shows which of the two neighbours is brick).
- c2911, street face straight on from across the road; its east end (door, dormer).

## Failures
- `test_streets`: FAIL "4 street solids do not push a ped out", walls at about (-1900, 628), 1,400 m from these houses. **It fails the same way on the same chain without my step** (house5a + maxima only, built at the same time). An earlier run of the chain from 19:48 passed, so another step's street edits since then caused it. Not mine, not fixed.
- Page loads here need more than the 30 s / 120 s older tests allow; `test_solid`, `test_facades`, `test_streets` and `fps.mjs` were run from scratch copies with 300 s timeouts (nothing else edited). `fps.mjs` needs an absolute page path.
