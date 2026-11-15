# lmstation: Raseinių autobusų stotis rebuilt in Blender (2026-11-14)

Step `lmstation`: the bus station (c5290) and its platform canopy (c7167) as one Blender model, with platforms, bays and forecourt.
Not in `build.sh`; it runs after `house5a` and `maxima` (independent of both). Written plan first, as the brief asks.

## Files
- `research/assets/houses/stotis/build_stotis.py` (the model, uses `blendkit.py` read-only), `make.sh` (Blender + `gltfpack@0.25.0 -cc`),
  `tools/shots.mjs` (fixed cameras in the station frame), `tools/q.mjs`, `shots/` (`before_*`, `after_*`, `compare_photo_before_after.jpg`).
- `pipeline/lmstation.js`, `pipeline/add_lmstation.py`, `pipeline/lmstation/stotis.glb`, `work/test_lmstation.mjs`.
- `refs/landmarks/stotis/` (two downscaled Commons photos and the orthophoto crop), three lines in `refs/landmarks/CREDITS.tsv`.

## Evidence
- Orthophoto (`refs/landmarks/stotis/ortho_c5290_60m.jpg`): one long flat roof running north-east to south-west. OSM maps it as two
  ways: c5290 (`amenity=bus_station`, 20.9 x 16.5 m, the enclosed box at the street end) and c7167 (`building=roof`, 30.4 m long,
  14.3 m tapering to 11.2 m wide, the canopy). There is a bus loop all round, a bus parked on the south-east side, two minibuses on the
  forecourt east of the box.
- Commons, both by Vilensija, 6 October 2019, CC BY-SA 3.0:
  - "Raseiniai, autob. stotis" (photo A), taken east of the box. It shows the south-east face and the north-east face.
  - "Raseiniai, a. stotis" (photo B), taken from the loop road north-west of the canopy's south-west end. Its Commons coordinates put
    the camera at frame (-33.5, 20.2), and the courthouse (c2157) is visible beyond the canopy on the right.
- Mapillary: 791 images within about 100 m, none closer than 85 m. All were taken on Vilniaus g. or in the Maxima car park, facing
  away from the station or blocked by the park trees. A 2015 panorama (lakd, 748993462439780) shows the station before its rebuild
  (beige box, buses parked north of the street). It does not show today's building, so it is not used for the look.
- Overpass did not answer (timed out), so OSM platform ways were not checked.

## The plan (settled before modelling)
Frame: origin at c5290's south corner, where the box meets the canopy on the bus side. X runs along the south-east face towards the
street, Y runs in towards the north-west. The box spans X 0..20.9 and the canopy X -30.4..0.
- **Street face: the north-east edge** of c5290 (c5290 corners 1 to 2). The street runs about 7 m beyond it. Photo A shows a
  white wall, a dark full-height strip with "RASEINIAI" stacked vertically in green, and then glass in the north corner under the
  roof slab, with slanted green struts.
- **Passenger entrance: the glazed north corner** of the north-east face, recessed under the roof slab. The doors face the street.
  *Guess*: the notch depth (6.6 m along the north-east face, 5 m along the north-west face) and the door position. The photo shows
  only the outer part, foreshortened.
- **South-east edge (arrivals).** Photo A shows a long white-tiled wall with three windows with blinds, two dark doors and
  "R A S E I N I A I" in spaced green capitals. A bus is parked under the canopy edge, there is an "ATVYKIMO AIKŠTELĖ" (arrival
  area) sign, and two orange barriers stand with their booms raised where the bus road leaves the street.
- **North-west edge (departures).** Photo B shows bays numbered 2 to 6 on dark boards on the posts (bay 1 is out of frame at the
  south-west end), a stepped kerb, benches, two hanging departure displays and green Y-shaped posts. The far end, at the box, is a
  glass hall wall. The game's moving bus uses this loop road and stops here.
- **Storeys and roof:** one tall storey and one flat roof slab, shared by the box and the canopy at the same top (5.6 m, *guess*
  from the door heights). The canopy has a tiled fascia about 1.1 m deep and a concrete soffit at 4.5 m.
- **Platforms:** one raised platform (14 cm) under the whole canopy. It has a stepped kerb with six bays on the north-west side, a
  straight kerb on the south-east (arrivals) side, and a pavement along the box's south-east face.
- **South-west face of the box (under the canopy).** From photo B: glass hall wall with doors on its north-west part, white tile
  with a window and a service door on its south-east part. *Guess* for the split point and the door.
- **North-west face of the box:** no photo, so it is built as a plain white-tiled wall.

## Built
- White glazed tile walls (procedural upright stretcher bond; at game distance they read as off-white), a blue-grey membrane roof with
  dark coping, an air handler and two vents on the box roof (*guess*: positions taken from small boxes on the orthophoto).
- South-east face: the three windows, two doors and the spaced green name, as in photo A. North-east face: the dark strip with the
  vertical green name and a low planter of shrubs along the wall. The planter is in photo A. Its length and the second short
  planter are *guesses*.
- Entrance notch: glass with mullions on both inner faces and doors facing the street. The roof slab spans the notch and overhangs
  0.6 m. Two slanted green struts stand under it (*guess*: their exact places).
- Canopy: Y-shaped lime-green posts in two rows of six, arms spread along the canopy. Only the north-west row is clear in photo B, so
  the south-east row is a *guess*. Dark bay boards 1 to 6 with white numerals face the departure road. Two amber departure displays
  hang beside bays 2 and 3, facing the bays.
- Benches: none were there before, so three benches stand behind the departure posts.
- Bay markings: short white dividers painted out from each step of the departure kerb, and a yellow warning strip along each bay's edge.
- Arrivals: a straight kerb, the sign on a post (lettering "ATVYKIMO / AIKSTELE", diacritics dropped because Blender's built-in font
  was not trusted with them), and the two orange barrier housings with their booms raised.
- No clock: neither photo shows one. No logos.
- Night: the hall glass and the office windows glow warm, and the displays glow amber (`ENV.night`, as in `maxima.js`).

## What the game had here, and what the step changes at run time (no other step's file edited)
Checked in a built page and in `pipeline/`:
- The c5290 code-built box (two-storey brick look). **Not drawn**: an `addBuilding` skip, corner-checked like maxima. Its footprint
  keeps the collision walls, `inBuilding` and the minimap.
- c7167 was drawn as a fuel-station canopy (base page `roofOnly`): a 0.75 m slab on four white pillars plus a 12 m asphalt apron.
  **Slab and pillars not drawn**: `addBuilding` calls taller than 0.5 m whose centre lies in c7167. The apron stays, as the forecourt.
- The generated yard fence (1.45 m black railing, 70 segments, with a gate gap). It ran across the south-east side at Y -4.7, round
  the south-west end and along the north-west side, which would have cut off the bays. **Removed**: one splice in `add_lmstation.py`
  makes the yard walk skip both buildings, the same way `house5a` does it.
- A props2 hay bale (`bale_a`) against the canopy, placed because c7167's kind is "shed". **Removed**: props2 site filters keep
  nothing on the station's ground except stop signs.
- The static minibus `ps1_bus` (cars4 `CARS4_STATIC`) stood on the north-west loop road at frame (-27, 18), about 1 m off the
  route's centre line, where the moving bus turns round. **Moved** to the arrivals side at (-15.2, -2.7), facing south-west like the
  bus in photo A, 2.3 m clear of the road.
- People waiting at "Raseiniai AS": the stop's waiting spot (`bus.at[].st.x/z`, read by `people.js`) was at the loop road's U-turn
  node, so people stood on the road edge. **Moved** onto the departure platform at bay 2, (-23, 5.9). The bus's own stop point and
  route are unchanged.
- Kept as they were: the moving bus `aero_bus` and its route (north-west road, U-turn west of the canopy); both stop signs. One sign
  is the loop's "Raseiniai AS" sign at (-31.6, 21.4). The other is the OSM-mapped sign at (-18.3, 13.7), which now stands at the tip
  of the departure kerb. Also kept: the street, the south-east bus road and the "Autobusų stotis" label. There were no props2 or
  `town` benches here.
- Dialogue: the `stop` talk lines ("Kada autobusas į Kauną?", "Iš stoties į Vilnių kada?" ...) still fit and are unchanged. There
  are no story points within 80 m.
- `world.landmarks.station` points at the model's mesh (new key; `test_facades` does not look for it).
- Colliders: 12 posts and 3 barrier/sign housings are round props (also pushed to `world.solids`), and 3 benches are walls. The box
  is solid through its footprint. The canopy area has no walls, so the platform is walkable end to end.

## Numbers (chain of 2026-11-14 + `add_house5a.py` + `add_maxima.py` + `add_lmstation.py`)
- Model `pipeline/lmstation/stotis.glb`: 218,628 B (meshopt, one 1024 px WebP atlas), 7,349 triangles, 2 draw calls (atlas, glow).
- Page: 28,782,063 -> 29,079,584 B (+297,521 B: base64 model and about 5 KB of JS). Two full builds are byte-identical.
- `node work/fps.mjs`: 60 fps (Metal, M5 Pro), load 5.8 s. The load time was measured while other agents' tests were running on
  the same host. For comparison, maxima.md reported 4.0 s for the chain without this step.

## Tests (all on the full chain + house5a + maxima + lmstation; logs were in scratch)
- `work/test_lmstation.mjs fullA.html fullB.html`: **PASS**, 13 checks:
  - builds are identical;
  - the model is loaded, uses Lambert materials and has glowing glass; `world.landmarks.station` is set;
  - nothing else is drawn over the box, canopy or kerb from 0.4 to 9 m (instanced meshes included);
  - there is no yard fence and no props2 site on the station ground;
  - the box is solid from the bus face and the street face;
  - the platform can be walked end to end under the canopy;
  - the platform can be reached between the posts from the departure bays and from the arrivals side;
  - waiting people stand on the departure platform;
  - all 15 posts and housings push the player out, and the benches stop the player;
  - every collider is at least 2.5 m from the bus route (5.3 m measured);
  - no collider stands on a road or path;
  - the minibus is in the arrivals area, 2.3 m off the road;
  - there are no console errors.
- `test_props2` (two builds) PASS 7/7. `test_streets` PASS (14 streets). `test_cars4` PASS.
- `test_solid` PASS 7/7. In the first run its `page.goto` hit Playwright's default 30 s load timeout: the page did not load in time on
  SwiftShader while the host was busy. I re-ran a scratch copy with a 240 s load timeout and changed nothing else; it passed.
  `work/test_solid.mjs` itself is unchanged. The same 30 s limit will fail it again whenever the host is loaded; that is not caused
  by this step.
- Not run: `test_facades` and `test_maxima`/`test_house5a` (not asked). The step does not touch `fx_*` meshes or the four landmark keys.

## Compared with the photos (`shots/compare_photo_before_after.jpg`: photo | before | after)
- Photo A (east): matches the long low white box, the flat roof line running on into the canopy, three windows then two doors on
  the south-east face, the spaced green name above the windows, the dark vertical name strip on the north-east face, the glazed
  north corner under the slab with green struts, the shrubs along the wall, the two raised barriers, and a bus under the canopy edge
  on the left.
  Differs: in the photo the tiles read clearly; in the game the walls are plain off-white. The letters are the default font, not
  the real face. The photo's lamp post and small signs are not modelled. The barrier housings are placed from the photo by eye.
- Photo B (north-west, along the departures): matches the cantilevered slab with its tiled fascia and concrete soffit, the green Y
  posts with numbered boards, the stepped kerb, benches, two displays, the glass hall wall at the far end, and the courthouse beyond.
  Differs: the real posts are thicker and less regular (some single slanted members), and the far end has a dense cluster of slanted
  green sticks next to the glass that I did not model as such. The real displays hang further out. Bay 1 sits at the canopy's
  south-west end (out of the photo's frame).
- Not checked against a photo: the north-west face of the box, the south-east post row, and the arrivals kerb line.

## Photos wanted
- Bus station (c5290), north-west side of the box (car-park side), seen from the loop road or the Maxima car park.
- Bus station, the glazed north corner entrance, seen face-on from the street on the north-east, to place the doors and struts.
- Bus station canopy, south-east (arrivals) side from the south, to confirm the second post row.

## Credit
The model is original work. Textures: Poly Haven CC0 (Bitumen, Concrete Wall 006, Box Profile Metal Sheet), already covered by the
page's "Building textures: Poly Haven (CC0)" line. The reference photos are not used in the page: Commons photos by Vilensija,
CC BY-SA 3.0, and the orthophoto ORT10LT (c) Nacionalinė žemės tarnyba. They are credited in `refs/landmarks/CREDITS.tsv`.
