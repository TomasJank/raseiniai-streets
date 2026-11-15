# lmshops: Lidl (c8100) and IKI (c2181) rebuilt in Blender (2026-11-14, night)

Step `lmshops` (prefix `LSH` / `lsh`), Addendum 2 of `09-landmarks-brief.md`. Written as I go: evidence and plan first, then the build.

## Files
- `research/assets/houses/lidl/` (`build_lidl.py`, `shopkit.py` (helpers for both builders, on top of the read-only `blendkit.py`),
  `make.sh`, `tools/shots.mjs` for both shops (`node shots.mjs page.html lidl|iki outDir prefix`), `tools/q.mjs`, `shots/`) and
  `research/assets/houses/iki/` (`build_iki.py`, `make.sh`, `shots/`).
- `pipeline/lmshops.js`, `pipeline/add_lmshops.py`, `pipeline/lmshops/lidl.glb`, `pipeline/lmshops/iki.glb`, `work/test_lmshops.mjs`.
- `refs/landmarks/lidl/`, `refs/landmarks/iki/` (orthophoto crops, downscaled Mapillary frames), lines in `refs/landmarks/CREDITS.tsv`.

## Evidence
Mapillary: the API returns a truncated set for a large bbox (1,436 images for the whole area against 4,173 when queried in
0.001-degree tiles), so I queried in tiles. Positions of the dashcam frames here are off by 10 to 30 m and the compass angle by up to
90 degrees; I took the heading from the next frame and checked every frame by eye. Every usable image is a dashcam frame by
VidmantasM_Siaures (CC BY-SA 4.0). No Commons photo of either shop.

### Lidl (c8100)
- The 2024 orthophoto shows a construction field (`refs/landmarks/lidl/ortho_c8100_60m.jpg`): no roof evidence. The store opened in
  2026: frames up to 2026-08 show it under construction, the October frames show it open.
- Seen in six frames of two drives on Vilniaus g., 2026-10-14:
  - westbound, east of the store (1853840195893300, 2195532451321993, 1014676478325518, 1141597848266646): the whole north-east
    face over the scaffolded house c2186, the north corner with the name board and the entrance canopy, the car park beyond it;
  - eastbound, from the junction (1124093480066401, 1579660247265681, 2379298292605940): the north-east face from its north end,
    glazing with the lit shop inside, the name board near the north corner, a light grey pier at the corner.
- Footprint (game frame, origin the east corner, x along the north-east face to the north corner, y in): main hall 39.5 x 42.3 m,
  a rear strip x 0..33 to y 57, a loading wing x -5..8 to y 64.
- LiDAR parts in the page: hall 7.5 m, rear strip 9.1 m, loading wing 7.8 m. The game's ground falls 1.6 m from the front to y 57,
  so 7.5 at the front and 9.1 at the back are one level roof.
- OSM service roads in the page: a drive along the north-east face (y -8), one along the east face (x -2.7), a car park loop north-west
  of the store (x 48..84). Vilniaus g. runs at y -26.

### IKI (c2181)
- 2026-08-07 a car drove into the IKI car park and stood there for ten minutes: 1879323796361239 .. 1060782403066952 show the whole
  north-east face from the east end, straight on and from the west end; 1043535368087602 from the road; 3655450894612478 the west end
  against the yellow house c2182. Orthophoto `refs/landmarks/iki/ortho_c2181_28m.jpg`: red sheet roof, ridge along the front, a
  cross wing at the back of the west part, the roof continuing over c2222 (the south-west wing, not mine).
- LiDAR: top 10.6 m, median 8.5; parts: the east part a ridge roof (eave 6.5, rise 3.8 as fitted), the west part a ridge across (6.9, 1.9).

## The plan (fixed before modelling)
### Lidl
- **Front: the north-east face** (footprint edge east corner -> north corner, 39.5 m), facing Vilniaus g. 26 m away, with one row of
  parking and the drive between. Full-height glazing in narrow aluminium bays (all frames show glass wherever the face is visible),
  a dark anthracite fascia of vertical ribbed metal above it, about as tall as the glazing. Glazing 0..4.0 m, fascia to 7.5 m (LiDAR).
- **Entrance: the north corner**, facing the car park on the north-west. The frames show the name board at the north end of the
  front, a light grey canopy slab projecting past the north corner and a light pier at the corner. *Guess*: the doors on the north-west
  face under the canopy (no frame looks at that face); canopy 5.5 m out, 14 m along the face.
- **Storeys and roof:** one tall storey, flat roof level at 7.5 m over the hall and the rear strip; the loading wing lower (6.2).
  Roof colour unknown (orthophoto older than the store): light grey membrane, *guess*.
- **Name:** "LIDL" in plain capitals on a plain board on the fascia near the north corner (the real board carries the chain's mark;
  only the name is drawn).
- **Car park:** north-west of the store and along the front; the game already draws a lot there (the base page's lot with bays
  and cars). Not changed.
- **Faces with no photo** (south-east, south-west, the rear strip and the loading wing): built plain: the anthracite fascia band
  continues, grey sandwich panels below, one roller door on the loading wing (*guess*).

### IKI
- **Front: the north-east face** (east corner -> west end, 26.8 m), facing the car park and Vilniaus g. Ground storey grey
  horizontal siding (about 3.0 m), upper storey beige vertical-rib cladding (about 2.4 m) with windows framed by slanted trim,
  red-brown corrugated sheet roof with gutters, eave about 5.4 m.
- **Entrance:** glazed double door with two side lights at 9.5..14.7 m from the east corner, the "IKI 8-21" plate above.
  From the east: a two-pane shop window (2.3..7.1 m), the door, the big name board (16.2..20.4 m, white with "IKI" in plain green
  capitals: the real board carries the chain's mark, only the name is drawn), a shop window (20.4..23 m), four poster frames, a
  plain yellow sign panel high up (23..25.5 m, its tenant name not drawn). Upper windows at 2.3..3.5, 11.6..14.8, 20.4..22.7, 25.7..26 m.
- **Roof:** ridge along the front over the full width (span 19.85 m, ridge 9.1 m, about 20 degrees), gable at the east end; a cross
  wing with its ridge running back over the west part (x 12.3..26.8, to y 31). *Guess*: the cross wing's ridge height (8.2 m).
- **East end:** seen at an angle: grey siding with a narrow window, beige gable with a window. **West end** against the yellow house
  (3 m passage): grey siding. **Back (south-west) and the cross wing's sides:** no photo, built plain grey siding.
- The neighbouring yellow house c2182 (Lafa pizza) and the south-west wing c2222 are not part of this step.

## Built
Frames as in the plan; z from the game's ground at the origin. Both models: original work, Blender's built-in font for the
lettering, procedural materials (stripe joints drawn in the face plane) plus Poly Haven CC0 textures already in the project
(bitumen, concrete_wall_006), baked to one 1024 px atlas per model (`blendkit.bake_export`), `gltfpack@0.25.0 -cc`.
### Lidl (`research/assets/houses/lidl/build_lidl.py`)
- Hall x 0..39.5, y 0..42.3 and the rear strip to y 57: one level roof at 7.5 m (light grey membrane, dark coping), loading wing
  x -5..8, y 51..64 with its roof at 6.2.
- Dark anthracite vertical-ribbed cladding everywhere from 4.0 m up (the fascia band in the photos runs round the north corner).
- Front: glazing 0.6..38.7 m in 1.25 m bays with a transom at 3 m, a dark pier at the east corner, a light grey pier at the north
  corner. "LIDL" in plain yellow capitals on a plain blue board x 33.2..36.6 on the fascia.
- North corner: light grey canopy slab x 37.8..45.6, y -1.4..14.6, 0.6 m thick at 4.0..4.6 m, on two slim posts at x 45.2
  (*guess*: depth, length, posts). Under it, glazing on the north-west face y 0.6..14 with doors at 5.5..8.5 (*guess*).
- Faces nobody photographed (north-west beyond the canopy, south-west, south-east, the rear strip, the loading wing): grey sandwich
  panels under the dark band, concrete plinth. Built plain.
- In front: a 1.6 m paver strip along the glass and one row of parking bays (2.5 m, painted lines) out to the mapped drive at y -8
  (cars are parked there in the photos). The north-west car park is the base page's own lot and is unchanged.
- Night: glazing glows warm, the board and letters glow.
### IKI (`research/assets/houses/iki/build_iki.py`)
- Front block x 0..26.8, y 0..19.85, back wing x 12.25..26.95 to y 31.1. Grey horizontal lap siding to 3.0 m, beige vertical-rib
  cladding 3.0..5.4 on the front and the east end, white trim between.
- Roof: red-brown corrugated sheet, ridge along the front at 9.1 m (about 20 degrees), gables at both ends (east gable beige,
  west gable grey), 0.45 m eaves; the back wing's ridge runs back at 8.1 m and meets the main roof in two valleys. Ridge caps,
  front gutter, two red-brown downpipes at the front corners, a brick chimney near the east end (both seen in the photos).
- Front, from the east: two-pane shop window (one light, one dark pane; the other tenants' posters are not drawn), door unit
  (double glass door between two side lights with the shop's own green-yellow posters, plain), the white "IKI 8-21" plate
  above it, the white name board with "iki" in plain green letters (the real board's diamond and heart are not drawn), a shop window,
  four poster frames, a plain yellow panel high up (the real one carries another tenant's name, not drawn), upper windows at the
  measured places with white frames, two slanted white trims. The blue "LANGAI ..." sign of another business is left out.
- East end: a narrow ground-floor window and one window in the gable (both seen at an angle). West end, back and the back wing:
  plain grey siding (no photo).
- Night: shop glass, side lights and the letters glow.

## The step (`pipeline/lmshops.js`, `pipeline/add_lmshops.py`)
- `addBuilding` skips every part of c8100 and c2181 whose centre lies inside the footprint stored in the step (so the LiDAR-split
  parts of the Lidl all go); `buildFacadeDetails` runs without the two records (no generated shop glazing, chimneys, dormers on
  them). The footprints keep their collision walls, `inBuilding` and the minimap, so both shops are solid without new walls.
- `buildExtra` is wrapped: each model is placed with one matrix (origin at `GY` of the east corner), materials become
  `MeshLambertMaterial` on the atlas, the glow material adds the `ENV.night` term as in `maxima.js`; the two canopy posts are
  round props pushed to `world.solids`. `world.landmarks.lidl` and `world.landmarks.iki` point at the models (new keys).
- What else was there, checked in the page: the "Lidl" and "IKI Raseiniai" labels (kept), the base page's car parks with bays and
  parked cars (kept), the mapped drives (kept; nothing the step adds stands on them, posts 1.27 m clear). No yard fence (commercial
  buildings get none), no story stop, no props2 piece on either footprint. The IKI's south-west wing c2222 stays the code-built
  white box with a red roof.
- Top-level names: `LSH`, `lshAt`, `lshInPoly`, `lshOf`, `lshBuild`, each declared once in the built page.

## Numbers (chain of 2026-11-15 00:20 with `lmshops` placed before `perf2`)
- Models: `pipeline/lmshops/lidl.glb` 84,668 B (1,488 triangles), `pipeline/lmshops/iki.glb` 96,328 B (2,326 triangles); 2 draw
  calls each (atlas, glow).
- Page: 30,393,124 -> 30,638,544 B (+245,420 B: two base64 models and 4 KB of JS). Two full builds byte-identical (`cmp`).
- `node work/fps.mjs`: 60.3 fps (Metal), load 8.6 s with the step (6.4 s without, minutes apart; host load average 22 from other
  agents). The SwiftShader leg of `fps.mjs` hit Playwright's 30 s `goto` timeout on the page with the step while the host was busy
  (it took 35.7 s on the page without it); not a build error.

## Tests
- `work/test_lmshops.mjs fullA.html fullB.html`: **PASS**, 13 checks: builds identical; names prefixed and unique; both models loaded,
  Lambert, glow material, landmark key; nothing else drawn over either footprint 0.6..11 m up (fails with 9 and 67 vertices when the
  `addBuilding` skip is disabled: checked); walking into the Lidl blocked from the front and the car park face; from the car park
  under the canopy to the entrance glass (stops at 39.92); the paver strip along the glass and the walk under the canopy open; the
  canopy posts solid and 1.27 m off the roads; walking into the IKI blocked from the front and the east end; from the car park to the
  IKI doors (stops 0.35 m out) and along the whole front; no console errors.
- On the same page: `test_facades` PASS (landmarks church, cerkve, culture, maxima found), `test_solid` all passed (scratch copy with a
  300 s load timeout; the repo file is unchanged).

## Compared with the photos (`research/assets/houses/*/shots/compare_photo_before_after.jpg`: photo | before | after)
- Lidl: matches the long low dark box, the full-length glazing under a fascia of about the same height, the name board near the north
  end, the light canopy at the north corner, the car park beyond it, parked cars along the front. Differs: the photos' glass shows the
  bright interior and reflections, the game's is a flat dark grey; the board is a plain blue board with plain letters, not the chain's
  roundel; the house c2186 in front of it is a 3-storey box in the game, a 2-storey hip-roofed house under scaffolding in the photos
  (not mine); grass instead of the photos' paved verge between the drive and the road.
- IKI: matches the long two-band front (grey siding, beige ribbed upper band), the red-brown sheet roof with its eave along the front
  and the gable at the east end, the door, plate, name board, windows and yellow panel in their measured places, the chimney, the
  downpipes, the yellow house c2182 at the west end. Differs: at 14:00 game time the front faces away from the sun, so the beige band
  reads darker than in the overcast photo; the upper windows' slanted trim is only hinted; the posters are flat colours; the parked
  cars of the base page's lot stand close to the doors; the south-west wing c2222 keeps its code-built white walls.

## Guessed faces
- Lidl: the north-west face beyond the canopy, the whole south-west and south-east faces, the rear strip and the loading wing
  (plain panels); the entrance doors' position, the canopy's depth and posts; the roof colour.
- IKI: the back (south-west) wall, the back wing's walls and gable, the west end above the ground floor; the back wing's ridge height.

## Photos wanted
- Lidl (c8100), north-west face and the entrance under the canopy, seen from the car park on the north-west.
- Lidl, south-east face and the loading wing, seen from the drive along the east side.
- Lidl, roof colour: any high view (or a newer orthophoto).
- IKI (c2181), back (south-west) side and the back wing, seen from the yard on the south-east.

## Credit
The models are original work. Textures: Poly Haven CC0 (Bitumen, Concrete Wall 006), covered by the page's "Building textures:
Poly Haven (CC0)" line. The reference photos are not used in the page: Mapillary images by @VidmantasM_Siaures, CC BY-SA 4.0, and the
orthophoto ORT10LT (c) Nacionalinė žemės tarnyba, credited in `refs/landmarks/CREDITS.tsv` (11 lines for `lidl/` and `iki/`).
