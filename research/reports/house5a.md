# house5a: Vyšnių g. 5A rebuilt in Blender (2026-11-14)

Trial of a new technique: one real building modelled in Blender, baked to one texture, and standing in for the code-built
house on its real footprint. The owner asked "can we rebuild Vyšnių 5a with Blender".

Status: done as a trial, not in `build.sh` (the integrator appends `house5a` after `tex`; it also works before `tex`).

## Files
- `research/assets/houses/vysniu5a/build_house.py`: the Blender script (headless, `blender -b --python build_house.py -- OUT_DIR`).
  It models the house, yard parts and fence, bakes colour and ambient occlusion into one atlas and exports a GLB.
- `research/assets/houses/vysniu5a/make.sh`: runs the script, then `npx gltfpack@0.25.0 -cc -kn -km -vpf` into `pipeline/house5a/house5a.glb`.
- `research/assets/houses/vysniu5a/tools/shots.mjs` (fixed cameras on the house, Metal, HUD hidden), `tools/q.mjs` (run an expression in a built page).
- `research/assets/houses/vysniu5a/shots/`: before (`before_*`) and after (`after_*`) shots from the same cameras.
- `pipeline/house5a.js`, `pipeline/add_house5a.py`: the step. `work/test_house5a.mjs`: the test.

## Where the house is (all from local data; the address was not sent anywhere)
- OSM way 173203569 (`addr:street` Vyšnių g., `addr:housenumber` 5A) is building **c1583** in the game: `research/geodata/extract.py`
  numbers buildings `c{index of the way in the page's rasData}`, and `footprints.json` holds c1583 with the same four corners
  (to 1e-6 degree rounding).
- Footprint in game metres: corners (64.32, 189.96), (72.42, 180.79), (81.72, 188.86), (73.62, 198.03): an almost square
  12.24 m x 12.31 m rectangle. Ground under it (game `GY`) falls 0.5 m from the front-left to the front-right corner
  (0.68 / 0.17) and rises 0.3 m to the back; the game's mid-slope ground `y0` is 0.576.
- Vyšnių g. (residential, 5.5 m) runs along the footprint edge (64.32, 189.96)-(72.42, 180.79); its centre line is 6.2 m from
  that wall. That edge is the street gable. Seen from the street, the left corner is (72.42, 180.79).
- LiDAR: the page carries `lidar: [8.5, 6]` (top, median) and a fitted roof `[2, 3.1, 5.2]` (eave 3.1 m, rise 5.2 m) with two
  point features at 8.8 m and 8.7 m. A 50° roof spanning the whole 12.24 m would rise 7.3 m, so the main body is narrower than
  the footprint: about 9.6 m, with the lean-to filling the rest on the left. One LiDAR feature sits 0.6 m right of that ridge
  line, 5.1 m back: the chimney (the description says a third of the way back; I drew it at 3.9 to 4.75 m).
- The code-built house already had a hand-set look from an earlier photo (`LOOK.c1583` in v37: white walls, burgundy gable,
  red roof, a front with balcony, attic triangle and a picket fence with a driveway gap left of the house). The step replaces it.
- Garage and outbuildings: the garage at the end of the drive is mapped: **c1594** (7.6 m x 9.0 m, 16 to 24 m behind the gable,
  LiDAR top 5.7 m). Nothing else of the plot is mapped. The generic yard code had made c1594 the owner of a gate gap and a
  driveway 1 m left of the house. c1588 (behind, 12 m to the right) and c1582 (left neighbour, 8 m left) belong to neighbours.

## How it is built
Frame: X right along the street gable from the front-left footprint corner, Y back, Z up from `y0`. All sizes in metres.
- Body 9.64 wide (X 2.6 to 12.24) x 12.31 deep, walls to 2.95, 49° gable roof to a ridge at 8.49; lean-to X 0 to 2.6 under a 15° roof
  that continues the left slope down to 2.17 at its outer edge; open porch on its front 6.2 m, store room behind.
- Walls are solid prisms with every window and door cut in by Blender booleans, so frames, glass and lace sit in real 13 to 16 cm reveals.
- Materials are procedural Cycles node trees over five Poly Haven CC0 textures already in `research/assets/textures/raw`
  (plaster, planks, asbestos sheet, box-profile metal, concrete), tinted by their luminance, plus noise-based rust patches,
  ridge darkening, plinth band, lace, foliage and flagstones. Everything is smart-UV-projected into one layout (small repeated
  parts such as pickets and balusters get 2 to 4x the texel density so they do not blur into their neighbours), then baked:
  diffuse colour (4 samples) and ambient occlusion (48 samples, a sloped ground plane fitted to the game's ground under it),
  multiplied, downscaled 2048 to 1024 and exported as WebP inside the GLB.
- Colours are given as what the eye should see (sRGB) and converted to linear for Blender, because the game shows the atlas
  as it is (`NoColorSpace`, no output encoding).

## The step `house5a`
- `addBuilding` is wrapped: for c1583 (only if its corner is where it should be, so another map is untouched) it draws nothing.
  The footprint still makes the collision walls, `inBuilding` and the minimap.
- The yard walk that draws generated garden fences skips buildings of the plot (c1583, c1594): one splice in `add_house5a.py`.
  `LOOK.c1594` makes the garage plain plaster with an asbestos roof and no windows; any `LOOK` also keeps the generic yard
  (driveway strip, parked car, vegetable bed) off it.
- `buildExtra` is wrapped: the walls (fence except the gateway, hedge, bay) are added at world build, the model is loaded
  through `ASSETS.load('house5a')` and placed with one matrix. Every material becomes `MeshLambertMaterial` with the atlas;
  `atlas_glow` (the bay window, one window on the right side, the middle upper window) adds a warm emissive term scaled by
  `ENV.night`, the same uniform the facade windows use. The drive is draped onto the ground vertex by vertex; fence posts and
  bays are `InstancedMesh`es, each bay sheared to follow the ground; hedge, junipers and garage doors stand on the ground.
- After the model loads the grass height map is redrawn, so no blades grow inside the house.

## Numbers (chain of 2026-11-14 + `add_house5a.py`)
- Model: `pipeline/house5a/house5a.glb` 192,368 B (meshopt, float positions, one 1024 px WebP atlas), 5,027 triangles
  (house 3,384; fence bay 226, post 22, gate leaf 168, each instanced; hedge 225; juniper 250 x 3; garage doors 108; drive 144).
- Page: 27,891,342 -> 28,154,290 B (+262,948 B: the base64 model and 6 KB of JS). Two builds of the chain are byte-identical.
- `node work/fps.mjs`: 60.3 fps (Metal), load 3.9 s.
- Draw calls added: about 9 (house atlas and glow, drive, three instanced fence meshes, hedge, junipers, doors).
- `work/test_house5a.mjs out.html out2.html`: PASS, 11 checks: builds identical; model loaded, Lambert, glow windows; fence/gate/drive
  drawn (11 posts, 9 bays, 2 leaves); nothing else drawn inside the footprint above 2 m (fails with 60 vertices when the
  addBuilding skip is disabled: checked); no generated yard fence or gap on the plot; walking (5 cm steps, game collision,
  r 0.35) into the house stops 0.35 m out, into the fence from the street both sides of the gate stops at the fence, into the
  hedge stops at it, into the bay stops at it; walking in through the gateway and up the drive to the garage is not blocked;
  no console errors.
- From scratch copies on the page with the step: `test_solid` PASS (all 7), `test_props2` PASS (all 7, two builds identical),
  `test_tex` PASS (all 13; page = chain without tex + house5a + tex, since the test rebuilds tex on its base),
  `test_facades` PASS. Log: `research/assets/houses/vysniu5a/tests_2026-11-14.log`.

## Compared with the description (looked at in `shots/compare_before_after.jpg`, `shots/compare_details.jpg`)
Matches (seen in the shots):
- Detached one-and-a-half-storey house, gable end to the street, steep roof (49°), long-side eaves at about 2.7 m.
- White plaster ground floor, slightly grey, darker plinth band at the floor line.
- Bay about 3 m wide, 1 m deep, left of centre, flat top as balcony floor, one window with a flower box in its front.
- Left of the bay: one small window with a flower box and "5A" painted top left. Right of the bay: blank wall with three small flower shelves.
- Burgundy horizontal boards from the top of the ground floor to the apex; three tall narrow white-framed windows above the bay;
  wooden balcony with flat orange-brown balusters on the bay; triangular white-framed attic window with one vertical bar; red-brown barge boards.
- Right side wall: two pairs of white-framed windows with grey sills, gutter along the eave, grey downpipe at the front corner.
- Roof: light grey wave sheet with large rust-red patches, darker toward the ridge; wooden ladder on the slope up to the chimney;
  tall rectangular dark charcoal ribbed chimney a third of the way back beside the ridge; TV aerial on the ridge.
- Left: roof continues down over a lean-to at a shallower pitch, open porch with burgundy posts and pointed wooden arches.
- Flagstone drive along the left side to the garage (mapped c1594) with red-brown double doors.
- Fence: red-brown flat-topped pickets with gaps, white square posts with flat caps, low white plinth; matching picket gate;
  tall dark thuja hedge from the gate to the house's left corner.
- Night: the bay window, one right-side window and the middle upper window glow with the same night uniform as the town.

Does not match, or weak:
- Lace curtains read as plain light-grey panes, not lace, at game distance.
- Junipers on the right are there but almost hidden behind the 1.2 m fence; from the street they read as a dark shape.
- The roof waves only show close up (4 cm per texel); further away the roof is a flat grey with patches.
- The game's grass blades stand in the yard and the porch, so short green spikes show against the walls (as everywhere in town).
- The garage roof is the code-built one (asbestos look, blue-grey in the game's light), not the house's weathered red-grey sheet.
- A tall LiDAR spruce stands 3 m right of the house and partly hides the right side wall from viewpoint 1. I left it: it is
  measured data, and the description does not say there is no tree.

Guessed (not in the description, chosen as typical):
- Body width 9.6 m and lean-to 2.6 m (from the LiDAR rise, not seen); porch 6.2 m deep, store room behind with a door and a small window.
- Window sizes and heights, the bay window's cross bars, T-bars on the side windows; the back wall (one window, one gable window, boards).
- Entrance door in the porch; the porch floor; garage door size and position; drive width and its line to the garage.
- Fence line 2.7 m in front of the gable (as the earlier photo-based look had it), its ends at 7.6 m left and 5.2 m right of the house;
  gate leaves drawn standing open (the gateway must be walkable).
- Flower colours, juniper count and places, hedge depth (0.8 m), aerial design.

## Credit
The model is original work. Textures: Poly Haven, CC0 (Painted Plaster Wall by Amal Kumar, Brown Planks 05 by Rob Tuytel,
Asbestos Sheet 02 by Amal Kumar, Box Profile Metal Sheet by Amal Kumar, Concrete Wall 006 by Charlotte Baglioni and Dario Barresi),
already covered by the page's line "Building textures: Poly Haven (CC0), polyhaven.com". No photo of the house is used anywhere.

## Doing another building the same way
1. Find its `c` index (match the OSM corners in `research/geodata/footprints.json`), its footprint, ground slope, LiDAR
   heights, the street side, and which plot neighbours are mapped (`tools/q.mjs`).
2. Copy `build_house.py`: change the dimensions block and the parts list (walls as solid prisms, `window()` for openings,
   the yard nodes). The bake, atlas, export and `make.sh` steps need no change.
3. Copy `house5a.js`/`add_house5a.py` with a new id, corner and plot list; the addBuilding skip, yard-walk splice,
   placement matrix, grounded nodes, instanced fence and walls carry over. A shared step that reads a table of
   `{id, corner, glb, walls}` would be the next step once there are two or three such houses.
4. Shoot the same views (`tools/shots.mjs`, edit the cameras) before and after, and run a copy of `test_house5a.mjs`.

## Correction 2026-11-14 (after the owner saw the shots)
The three upper gable windows were short: from the street only about 0.8 m showed above the balcony railing. Now 0.62 m wide and
2.12 m tall, from 8 cm above the balcony floor to 5.15 m (the boards stop at the roof line just above the outer ones), centres
0.74 m apart; about 1.25 m shows above the railing, roughly twice their width. Seen in `shots/a9_front.jpg`, `a9_front_right.jpg`,
`a9_balc.jpg`. Model now 189,496 B. `test_house5a` re-run on the new build (with maxima also in the page): see `maxima.md`.
