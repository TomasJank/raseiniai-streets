# maxima: Maxima XX (Vilniaus g. 93) rebuilt in Blender (2026-11-14)

Second building made with the house5a method: the owner asked "use blender to build maxima". Not in `build.sh`; the integrator
appends `maxima` (independent of `house5a`; both together tested). Written as I went; numbers at the end.

## Files
- `research/assets/houses/blendkit.py`: the generic half of the house5a script (mesh accumulators, frames, boxes/prisms/quads/beams,
  text, CC0-texture materials, tile UVs, one-atlas colour x AO bake, GLB export) as an importable module. `vysniu5a/build_house.py`
  keeps its own copy and was not touched (it works; folding it onto the kit is a later clean-up).
- `research/assets/houses/maxima/build_maxima.py` (the model), `make.sh` (Blender + `gltfpack@0.25.0 -cc`), `tools/shots.mjs`
  (fixed cameras in the store frame), `tools/q.mjs`, `shots/` (before_*, after_*, `compare_before_after.jpg`).
- `pipeline/maxima.js`, `pipeline/add_maxima.py`, `pipeline/maxima/maxima.glb`, `work/test_maxima.mjs`.
- Sharing with house5a: two separate steps, not one table-driven step. The JS each needs is about 30 lines and differs in what it
  removes (house5a: generated yard; maxima: the base page's hand-made front and the facades step's shopfront), so a shared table
  would have been the bigger change. The shared code is the Blender side (`blendkit.py`).

## The building (local data only)
- OSM way 187735561 (name "Maxima XX", shop=supermarket, Vilniaus g. 93) is game building **c2134** (its corners in
  `footprints.json`). Footprint: a 66.58 x 45.14 m rectangle, corners (-415.23,-224.34), (-452.67,-169.29), (-415.23,-144.09),
  (-377.78,-199.14). LiDAR in the page: top 9.0 m, median 7.9 m; the hand-set look had 10.85 m.
- The car park is on the long south-east side, edge (-415.23,-144.09)-(-377.78,-199.14): the base page's own lot with painted
  bays and parked cars lies in front of it (and the facades step put its shopfront on that side too). Seen from the car park, the
  left end (-415.23,-144.09) is the low end: the ground falls 2.5 m along the front, from +1.6 to -0.8 around the store's
  mid-slope ground (y0 -5.45).
- What was there before: the code-built box (grey sheet look), the base page's hand-made Maxima block (v37, "from a picture taken
  on Stoties g.": a canvas-painted front with the chain's logo-like sign and real tenant brand names, an entrance canopy at the right
  corner on six posts, the lot, lamps, parked cars, the neighbour's end wall), and the facades step's `fx_maxima` shopfront.

## Built (from the description; guesses marked)
- Main box X 11..66.6, flat roof at y0+8.6 (7 m above the ground at the right end, 9 m at the left: the roof is level and the
  ground falls; *guess*: level roof), grey profiled-metal side and back walls, roof membrane with coping and four plant boxes (*guess*).
- Front in three parts: warm brown vertical wood-toned panels X 11..27 and 43..66.6, dark anthracite ribbed panelling X 27..43,
  25 cm lower. Two rows of three plain coloured tenant panels along its top (green, white, dark / white, purple, red), no text.
- Canopy X 25..45, 4 m deep, 0.45 m thick, dark charcoal, underside 3.5 m above the ground at its middle, held by three tie rods,
  no posts (*guess*). Under it: glazed shopfront in eight aluminium bays with a transom, sliding entrance doors in the middle two,
  cash machine left of the doors, white opening-hours plate reading "7-22" right of them.
- The name on each brown part, high: "MAXIMA" in plain blue capitals (Blender's default font) and two red X shapes made of crossed
  bars. No logo artwork, no tenant logos.
- Annex X 0..11, roof 4.4 m, light grey corrugated cladding, roller door (*guess*). Concrete retaining wall along X 19.2 where the
  lot ends (the base page's lot polygon stops there), steel railing on it, four steps at its end. **The game's ground has no real
  drop there**, so the wall reads as a low wall with a railing.
- Clear arched trolley shelter beside it (X 20.4..22.8, 4 m long, open ends), small glazed kiosk near the right end.
- Not added: parking bays, lamp posts, red/grey block paving: the base page already draws its lot with bays, cars, four tall
  double-arm lamps and stone strips in exactly that place. The white neighbour building is not mapped as part of this; its painted
  end wall from the base page stays as it was.
- Night: shop windows and kiosk glass glow warm, the name, X shapes and tenant panels glow their own colour (`ENV.night`).

## The step
- `addBuilding` skips c2134 (corner-checked). A two-line splice makes the base page's store dressing (walls, painted signs, the
  corner canopy and its six post colliders) conditional on the model being in the page; its lot, cars, lamps, sign pole and the
  neighbour's wall stay. `fx_maxima` is removed after `buildLandmarks` and `world.landmarks.maxima` points at the model's mesh
  (test_facades looks for it). Walls added for the retaining wall, the shelter's sides and the kiosk.
- Sharing: the walk-through, materials and atlas code are in `blendkit.py`; the JS steps are separate (above).

## Numbers (chain of 2026-11-14 + `add_house5a.py` + `add_maxima.py`)
- Model `pipeline/maxima/maxima.glb` 107,000 B (meshopt, one 1024 px WebP atlas), 2,772 triangles, 3 draw calls (walls, windows, signs).
- Page: both steps together add 405 KB (house5a 255 KB, maxima 146 KB of base64 + JS). Two full builds of the chain with both
  steps: byte-identical (28,570,541 B each).
- `node work/fps.mjs`: 60.3 fps (Metal), load 3.9 s.
- `work/test_maxima.mjs out.html out2.html`: PASS, 9 checks: builds identical; model loaded, Lambert, two night materials;
  `fx_maxima` gone and `world.landmarks.maxima` is the model; nothing else drawn inside the footprint or on the front strip from
  2.2 to 9.6 m (fails with 83 vertices when the base page's dressing is forced back on: checked; the lot's lamp heads at 10 m are
  left out on purpose); walking into the store is blocked; walking from the car park under the canopy reaches the doors; walking
  along the front where the old canopy posts stood is not blocked; retaining wall, trolley shelter side and kiosk are solid; no console errors.
- From scratch copies with both steps: `test_house5a` PASS (11), `test_solid` PASS (7), `test_props2` PASS (7), `test_tex` PASS (13),
  `test_facades` PASS (landmark maxima 1,101 tris), `test_parked2`: parked count unchanged (1,124 = 1,124) and all view checks
  PASS; its "aerial parked triangles <= 40% of baseline" check needs a baseline without the parked2 step, and the chain without
  parked2 does not load (later steps need it), so against the normal chain it reads ratio 1 by construction. Not caused by these steps.

## Compared with the description (looked at in `shots/compare_before_after.jpg`)
Matches: wide flat-roofed box about 8 m high seen across the car park; front in three parts, brown wood-toned panels left and right,
darker anthracite centre slightly lower with two rows of coloured tenant panels; long flat dark canopy over the centre and a little
onto each side; glazed shopfront and doors under it, cash machine left of the doors, "7-22" plate; the name twice in blue capitals
with two red X shapes; lower light-grey annex at the far left with a retaining wall, railing and steps; clear arched trolley shelter;
small glazed kiosk at the right; the car park, bays, lamps and paving are the game's own and line up; lit signs and windows at night.
Weak: the brown reads darker than "warm brown" in the game's light; the retaining wall has no real drop behind it (flat game
ground); letters are Blender's default font, not bold; the roof is level, so the front is 9 m tall at the low left end and 7 m at the right.
Guessed: part widths and heights, canopy depth and tie rods, the annex length and roller door, shelter and kiosk sizes and places,
tenant panel sizes, roof plant.

## Credit
Model original work. Textures Poly Haven CC0 (Box Profile Metal Sheet, Corrugated Iron 02, Brown Planks 05, Bitumen, Concrete Wall 006),
covered by the page's existing "Building textures: Poly Haven (CC0)" line. No logo artwork, no tenant marks, no advertising.

## Fixes after the first review (2026-11-14 afternoon)
- Brown parts were near-black: the cause was the bake, not the colour. The three front boxes sat in one object touching face to face;
  merged, the mesh was non-manifold, normal recalculation turned faces inward and the ambient-occlusion bake read 0 on them (the
  colour bake itself was right: 152,109,74). Each cladding part is now its own solid (`blendkit.make` says why). The brown is now a
  flat warm mid brown (sRGB 153,110,74) with dark 3 cm vertical panel joints every 1.2 m and faint grain, not the planks texture;
  in the game's daylight it reads warm mid brown, clearly lighter than the anthracite centre (`shots/after_front.jpg`, `after_canopy.jpg`).
- The name is heavy capitals with 2.1 m caps (a quarter of the 8.6 m wall), Blender's built-in font thickened with its outline offset
  (no font file shipped), fitted with the two red X's to each brown part, 16 cm deep, lit at night. Readable from the far side of the
  car park by day and night (`after_front.jpg`, `after_night.jpg`). The game's floating "Alaus Gvidui" mission label covers part of the
  left X's from that camera; that label is not part of the building. Small red slivers show on some letter sides close up (atlas bleed).
- Level roof: left as it is. The game's ground rises 1.4 m between X 19 and X 43 inside the car park itself (where the real lot is level),
  so the wall cannot be the same height along the front without changing the terrain, which belongs to the ground step. The retaining
  wall takes up the difference only left of X 19.
- Model now 115,428 B.

## Entrance rebuilt from the owner's second photo (pavement south of the car park, slightly right of centre)
**Superseded by "Entrance moved to the east corner" below**: this section read a corner view as one flat facade.
Positions as fractions f of the three-part front (0 = left end of the left brown part, X 11; 1 = right end, X 66.58):
- Parts: left brown 0..0.30, anthracite centre 0.30..0.63, right brown 0.63..1. The right brown part stands 0.8 m forward, so the
  entrance sits in a shallow inner corner with a clean vertical edge at 0.63. Centre top 0.1 m above the brown parts.
- Canopy: one thin (0.3 m) dark slab from 0.18 to 0.63, 4 m deep, 3.1 m above the ground at 0.40 (about 40 % of the wall).
- Entrance: dark glazed wall with mullions from 0.40 to 0.63 under the right part of the canopy, doors in its right half
  (centre X 42.36). Under the left part of the canopy the wall continues (brown, then anthracite) with the cash machine and the
  "7-22" plate just left of the glass. Low orange-red box against the left brown wall at 0.05..0.14.
- Above the canopy: tenant panels on the centre's left half only (three small on top: green, white, dark; a purple and a red
  below), the right half plain lighter grey panels.
- Name: left part in its left two thirds, upper half, then a white square with the two red X's; right part from near its left
  edge, upper half, then the two X's. Plain heavy lettering as before.
- Kiosk: grey glazed hut at 0.80, 4.5 to 6.5 m out. Trolley shelter: out in the car park at the far left by the retaining wall
  (X 19.8..22.2, 10.5 to 14.5 m out).
- Game marker: the "Alaus Gvidui" story mission's Maxima stop (green ring, label, the person who waits) came from `buildStory`
  in the base page (story.js), which puts it on the road nearest the building's name label, i.e. in front of the left wall.
  `maxima.js` wraps `buildStory` and moves that one stop to 7 m in front of the new doors, the waiting person at the doors; no
  other shop or mission trigger refers to the Maxima door (searched the page for every use of the name). story.js is not edited.
- Shots: `shots/before_photo2.jpg` / `after_photo2.jpg` (camera at the south edge of the lot, because the base page's low lot wall
  on the pavement line hides the lower front from the pavement itself), `after_canopy.jpg`, plus the earlier views. Checked bullet
  by bullet against the description: all placed as described.

## Entrance moved to the east corner (2026-11-14 evening)
The owner: "But isn't the entrance on the corner of the store". He was right. The two Street View photos were taken in the car park
on the diagonal off the east corner (game corner (-377.78,-199.14), model X = 66.58, Y = 0); the vertical edge where the roofline
peaks is that corner, so the "centre part" of the earlier model is really two faces. Rebuilt from those photos, the orthophoto and
the measurements handed over (plus or minus 2 m). X = metres along the south-east face from the south corner; Y = metres along the
north-east face from the east corner (the model frame; `pipeline/maxima.js` uses the same x, y).

Built:
- Grey corner box X 57..66.58 x Y 0..9.6, top 7.8 (0.8 m below the brown walls' 8.6), its own lower roof and coping; the main roof
  steps down to it. South-east face dark anthracite with the tenant panels in its upper part (two rows of three, plain colours, no
  text); north-east face plain lighter grey.
- Brown wood-toned walls, standing 0.3 m proud of the grey box: south-east X 11..57, north-east Y 9.6..45.14 (the whole rest of that
  face; it was plain grey sheet before).
- L-shaped dark canopy round the corner: south-east X 48..66.58 (9 m of it in front of the brown wall), north-east Y 0..10.5, 4 m deep,
  0.55 m thick, underside 2.8 m above the ground, no posts (*guess*: thickness, height, no posts; the photo shows none).
- Glazed shopfront under it wrapping the corner: south-east X 60..66.58, north-east Y 0..9, corner post at the corner. Sliding doors on
  the north-east side Y 1..4 next to the corner post (**guess**: the doors cannot be seen in the photos). Cash machine X 57.4..58.2 and
  the "7-22" plate at X 59.5, both on the grey box just left of the glass.
- Name: south-east "MAXIMA" X 29..44.5 then the XX board X 46..49.6; north-east "MAXIMA" Y 17.5..33 then the XX board Y 36.5..42.
  Letters 2.6 m tall, bottom 5.3 m over y0 (about 3.6 m above the ground), so the south-east XX board clears the canopy as in the photo.
  Both XX now sit on white boards (the photo shows a white board on both faces).
- Kiosk: free-standing in the north-east car park, 4 x 4 m, flat roof, X 77.58..81.58 x Y 0..4 (centre 13 m out, Y = 2). The old kiosk
  in front of the south-east face is gone.
- Unchanged: annex X 0..11 (the lower roofs in the orthophoto suggest about 14 m but they step in two levels, so I could not tell; left
  as it was), retaining wall, trolley shelter and orange crates at the south-west end.
- Atlas: the UV gap between islands went from 0.004 to 0.007 (`blendkit.bake_export(..., margin=)`, only maxima uses the kit). With
  the old gap, mipmaps bled the red X's into the grey box's coping and the door frames (a red line along the top of the corner box).

The step (`pipeline/maxima.js`): `MXR.door` is now (67, 2.5); colliders: the two brown walls' 0.3 m step, the crates, retaining wall,
shelter sides and the new kiosk (the old kiosk and the old 0.8 m brown step are gone). The story mission's Maxima stop is moved to
(73, 7), 6 m out from the corner doors and beside the kiosk rather than in line with it, the waiting person at the doors. Night glow
(shop windows, kiosk glass, signs) is per material, so it moved with the parts. `world.landmarks.maxima` is still the model's mesh.
What else is on the north-east side (checked in the page and in `shots/after_top.jpg`): the base page's lot covers it, its parking bays
along that face start at Y 13 (clear of the canopy), its lamp posts are at about (84.6, 13) and (49.6, -5) (outside the canopy; the
lamp heads are 10 m up), the neighbour's painted end wall is 26 m out at Y 17, the "Kebabai" building starts about 25 m out at Y 17.
The old corner canopy and its six posts are skipped already (the `mxrOn()` splice). Nothing stands inside the canopy, doors or kiosk:
the test's "nothing else drawn" check now covers the north-east canopy strip and the kiosk too (it fails with 162 vertices when the
base page's old dressing is forced back on).

Test (`work/test_maxima.mjs`), changed checks: "nothing else drawn" also covers the north-east canopy (X 65.6..71, Y -4.5..11) and the
kiosk; "store is blocked" now from both faces; "walk to the doors" now from the north-east car park to the corner doors (reaches
(66.91, 2.5)); "walk under the canopy" now along both faces; "story stop" now out from the corner doors; "kiosk solid" at its new place.

Numbers: model `pipeline/maxima/maxima.glb` 125,976 B (was 116,280 at the start of this round), 2,758 triangles, 3 draw calls. Page
28,782,063 B with house5a + maxima; the maxima step adds about 172 KB (base64 + JS). Two full builds: byte-identical. `fps.mjs`: 60.3 fps
(Metal), load 4.0 s. `test_maxima.mjs out.html out2.html`: PASS (10 checks).
Other tests on the same page: `test_solid` PASS, `test_props2` PASS, `test_house5a` PASS, `test_facades` no errors (landmark maxima
1,103 tris). `test_tex` not run (it needs a second chain without the tex step).

Shots (`shots/`): `after_corner.jpg` (the photo's place: 27 m out on the diagonal off the east corner, eye height, fov 40),
`after_se.jpg` / `after_ne.jpg` (each car park), `after_entrance.jpg` (under the canopy), `after_aerial.jpg`, `after_top.jpg`,
`after_night.jpg`; `before_*` the same cameras on the previous model; `compare_before_after.jpg` (corner view, before over after).

Compared with the photo (`after_corner.jpg` next to it): matches: the roofline peaks at the corner and drops to the grey box on both
sides, brown walls left and right with MAXIMA then XX on the left face and MAXIMA then XX on the right face, tenant panels top left of
the corner, canopy wrapping the corner with its left end under the left XX, dark glass round the corner, cash machine and plate left
of the glass, a lamp post in front of the left canopy end, kiosk at the right. Differs: the kiosk looks wider and closer in the game
(in the photo it is narrower and further right, below the right XX; in the game its roof reaches the XX board's bottom); the photo's
top tenant row has four boxes, the model three; the brown is smoother and more orange than the photo's darker wood; the letters are
Blender's default font, not the chain's lettering; the photo's grey box shows a vertical joint on its north-east face, the model none.
