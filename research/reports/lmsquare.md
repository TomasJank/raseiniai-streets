# lmsquare: Žemaičio aikštė, the Žemaitis monument, Nepriklausomybės gynėjų aikštė (2026-11-14)

Step `lmsquare` for the landmark round. Not in `build.sh`; it needs only `assets` before it and is independent of house5a,
maxima and the other landmark steps (tested on chain + house5a + maxima + lmsquare).

## Files
- `pipeline/lmsquare.js`, `pipeline/add_lmsquare.py`, `pipeline/lmsquare/zemaitis.glb` (the monument model), `work/test_lmsquare.mjs`.
- `research/assets/houses/squares/build_zemaitis.py` (Blender, imports `blendkit.py` read-only; its own low-resolution `text()`),
  `make.sh` (Blender + `gltfpack@0.25.0 -cc`), `tools/shots.mjs` (fixed cameras, Metal), `tools/q.mjs`, `tools/ortho_grid.py`
  (orthophoto crop with a game-coordinate grid, so lawns and beds can be read off in game metres), `shots/` (before_*, after_*, compare_photo.jpg).
- `refs/landmarks/squares/`: four Commons photos of the monument, one 2015 Mapillary panorama, three gridded orthophoto crops; lines in `refs/landmarks/CREDITS.tsv`.

## Plan, fixed before modelling
Evidence: orthophoto (`ortho_zemaicio_grid_96m.jpg`), OSM (park way 170673752 "Žemaičio aikštė", memorial way 187957583 "Žemaitis",
artist Vincas Grybas, inscription tag), Commons photos 2009 (E.giedraitis, with a cyclist for scale), 2016 (Aidas U., close),
2020 (CD, from the lawn), 2022 (Zidikai1, from the front), Mapillary panorama 255203872959894 (2015, from the road south-east).
- The square is a rectangle about 92 x 72 m turned about 42° off north. Frame used everywhere: u along its south-east side towards
  the north-east, v towards the north-west, metres from the monument. Square: u -49.5..43, v -20.3..51.7.
- Monument at the OSM memorial centre (the game's old box stood 0.15 m away). Its sides are parallel to the square (the orthophoto
  shows the plinth as a square turned with the square). **The front with the inscription faces south-west (-u)**: every photo of
  the front has the municipality (c2159) straight behind the statue, and c2159's long south-west wall is parallel to the square's
  south-west side. The figure's right arm (viewer's left) points forward right, about 45° off the front: in the game that is due west.
- Orthophoto plan (guesses to about 2 m, trees hide much of it): the monument stands on a paved plaza that runs south-west in front
  of it (photos: 15 to 20 m of paving in front, then a low wall and a lawn); a big paved forecourt from the monument north-east to
  the municipality; two long dark flower beds side by side north-west of the plaza (u -25..-2.3 at v 30.5..33.5 and u -17..-1 at
  v 23.5..26.5); lawns under the trees: south-west (u -48.5..-21, v -15.5..20), along the south-east road on both sides of the path
  to the monument (v -15.5..-7), north (u 3..20, v 20..42, the lawn with conifers), west (u -48.5..-29, v 20..50.5) and along the
  north-west road (v 43..50.5).
- Monument proportions from the 2009 photo (most nearly square-on): plinth : base tier : pedestal : sculpture = 70 : 55 : 170 : 310 px.
  Scale from the man's height on the assumption that he is about 1.8 x life size, checked against the cyclist and the 6.5 m white
  blob on the orthophoto. Built: plinth 4.9 x 4.3 x 0.9 m (three courses of rough granite blocks, cobble apron 0.45 m), base tier
  3.4 x 2.9 x 0.7 with a front centre block 1.3 m wide, 0.35 m forward and 10 cm higher, pedestal 2.35 m with stepped corner piers,
  fins on the sides, cornice and top plate, sculpture 4.1 m (rock, bear, man 3.96 m). Top 8.07 m above the plaza.

## Built
- **Monument** (`zemaitis.glb`, 5,230 triangles, one 1024 px WebP atlas, one draw call). All white stone, granite plinth a little
  greyer, as in every photo (the old box monument was white too; the brief's "bronze-dark" option does not apply). Inscription
  "AMŽIAIS / BUDĖJAU / IR VĖL / NEPRIKLAUSOMYBĘ / LAIMĖJAU / 1918-1933" in plain lettering on the front panel (it is readable in
  the photos and in the OSM inscription tag), slightly grey so it reads. Figure low-poly: legs, shirt with belt, long open-hanging
  coat to below the knee, coat flap on the left side, head with hair, right arm out forward right and slightly raised, left hand
  down on the bear's head; the bear crouches at his left and behind, head at his hip; a rock under his right foot.
- **Old monument removed**: the two instanced meshes `buildStadium` drew (colours e7e5de / c9c6bd) and their four 7.5 m walls.
  New collider: the 4.9 x 4.3 plinth.
- **Square ground**: `sqLayout` is wrapped and returns the real lawns (six rectangles in the frame, each with a 2.5 m cut at the
  corner nearest the monument so the town step's bench rule keeps working). The ground step draws them, the town step puts its
  benches round them and trees2 keeps the trees that stand in them; nothing of those steps is edited. On top: a draped paving mesh
  over the square minus lawns and beds (warm grey-brown 20 x 10 cm pavers in running bond, canvas texture), off the roads and 5 m clear
  of c2159; the two beds as dark mulch with red-leaved and green plants.
- **Nepriklausomybės gynėjų aikštė** (second square, OSM way 1037185679, place=square on Vilniaus g. by Maxima XX): chosen because the
  orthophoto shows a clear, recognisable 35 x 33 m plaza of light concrete slabs with darker slabs set in it, beds round it, and it is
  central (Vilniaus g., the main street). Added: the slab plaza (1 m slabs, about a fifth darker) and five dark beds, drawn over the
  ground mesh another step already draws for this square (it stands 13 cm up, so the overlay is at 16 cm). That step's triangle
  lawns outside the plaza are left as they are.
- **Raseinių parkas** (third candidate): not rebuilt. It is a wooded park whose plan the game already draws (green, paths, the
  basketball courts); the only distinct features (two terraced flower beds and steps in its middle) are under trees on the orthophoto
  and I have no photo of them. It borders the culture centre (c171) and the Orthodox church (c219) being rebuilt.
- No new lamps, flagpoles or fountains: the base page's three flagpoles in front of the municipality and the parks code's lamps along
  the paths are where the photos show them; OSM has no fountain on either square (the one fountain node is in the pond park south-east).

## Borders with other agents' buildings
- Žemaičio aikštė's north-east forecourt borders the **municipality (c2159, lmcivic)**. Nothing of this step is within 5 m of its walls
  (the paving mesh skips cells within 5 m; checked by the test). The integrator should check the join: the forecourt paving stops
  5 m short of the building, where the ground step's own paving shows.
- Nepriklausomybės gynėjų aikštė borders none of the rebuilt buildings.

## Numbers (chain of 2026-11-14 + house5a + maxima + lmsquare; final build after the arm fix)
- Model `pipeline/lmsquare/zemaitis.glb` 202,852 B (meshopt, one 1024 px WebP atlas), 5,230 triangles, 1 draw call. Overlays: 1 paving
  mesh, 1 slab-plaza mesh, 7 bed meshes (flat). Old monument: 2 instanced draw calls removed.
- Page 29,061,131 B; the step adds about 279 KB (base64 model + 8.5 KB JS). Two full builds byte-identical (`cmp`).
- `node work/fps.mjs`: 60.3 fps (Metal), measured on the build before the arm fix (same triangle count); load 10.3 s while other
  agents' builds were running on the machine (not re-measured quiet).
- `work/test_lmsquare.mjs full5.html full6.html`: PASS, 10 checks (builds identical; model loaded, Lambert, landmark `zemaitis`; the right
  arm points at Swedbank: principal direction of the forearm and hand vertices in the game, 1.8° off; it reads 31.6° on the build
  before the fix, so the check fails there; old box monument removed and nothing else drawn over the plinth 1.2 to 9 m up; walking into
  it stops at the plinth from four sides; walking past it 3.4 m out, where the old 7.5 m walls stood, is open; six lawns, no bench on the
  plinth or in a bed, no tree on the plinth; paving, beds and slab plaza are the top surface; nothing laid within 5 m of
  c92/c219/c2159/c171/c5290; no console errors).
- Other tests on the final build (full5/full6): `test_solid` PASS (all 7), `test_props2` PASS (all 7, builds identical 29,061,131 B),
  `test_streets` PASS (14 streets), `test_trees2` PASS (all 9).
- Test copies run from the scratch directory with a 240 s `page.goto` timeout (the default 30 s timed out once while the machine was
  loaded); the repo tests are not edited.

## Compared with the photos (`shots/compare_photo.jpg`: photo | before | after, 2022 and 2009 viewpoints)
Matches: low granite plinth with block courses, white base tier with a forward centre block, tall pedestal with piers and cornice,
inscription panel, the figure with the outstretched right arm and the bear at his left, overall height against the municipality
behind, white stone; the plaza paving in front, lawns at the right with benches, the municipality and flagpoles behind.
Differs: the figure is a stylised low-poly body (no folds in the coat, no face, no sandal straps); the bear is a few rounded lumps;
the coat hangs as a closed shell, so the legs show only at the front; the paving pattern is uniform (the photos show darker brown
bands framing paving fields); the low stone retaining wall between the plaza and the south-west lawn (2020 photo) is not built
(a 0.5 m wall would need gaps for every path; left out rather than risk blocking people).
**Arm aimed at Swedbank (owner's request, `add_town.py` line 37), restored after review**: the base stays turned with the square;
only the right arm is turned (`build_zemaitis.py`, vector `d`): 14.2° right of straight ahead, towards Swedbank (Dominikonų g. 2A)
70.8 m in front and 17.9 m to the figure's right. Shoulders, collar and coat turn 8° and the head 14° with it. From the front the arm
now comes towards the camera, so it reads shorter than in the photos, where it points about 45° to the side.
Nepriklausomybės gynėjų aikštė: the slab plaza reads very light from above (the orthophoto is light too); the playground and benches
of the other step stand on it, and its triangle lawns outside the plaza are not real.
Guessed: every lawn and bed edge (to about 2 m), the plinth depth (4.3), pier and fin sizes, the bear's pose behind the figure,
the arm angle, the slab colours and the beds' plants on Nepriklausomybės gynėjų aikštė.

## Photos wanted
- Žemaičio aikštė, the flower beds north-west of the monument, seen from the monument (what is planted, kerbs, height).
- Žemaičio aikštė, the monument's back (north-east side), seen from the municipality steps.
- Nepriklausomybės gynėjų aikštė, the plaza seen from Vilniaus g. (slab pattern, the white cross-shaped object on the north lawn).

## Credit
Model original work. Textures Poly Haven CC0 (Rough Concrete and White Stucco 02, both by Dimitrios Savva), already covered by the page's "Building textures:
Poly Haven (CC0)" line. Paving, slab and bed textures are drawn in code. Photos are reference only (credits in `refs/landmarks/CREDITS.tsv`).
