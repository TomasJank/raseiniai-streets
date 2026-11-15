# props2: Sketchfab street objects (2026-11-13)

Status: done for street objects; structures left out (section 4). Second agent on this step; the first one wrote the step, the converter and 49 converted models and was stopped before it checked anything. I kept its work, looked at every model in the game, fixed what was wrong, and wrote the test.

## Files
- `pipeline/props2.js`, `pipeline/add_props2.py`: the step. Runs after the current chain (`... mhchars props2`); needs `assets`, `streets`, `jump`.
- `pipeline/props2/{key}.glb` + `props.json`: the converted models (46) and their table.
- `research/assets/sketchfab/props_convert.mjs`: Sketchfab GLB to game prop. `props_models.json`: the per-model table (source download, kind, real size, rotation, parts to keep). `props_cands.json`, `props_download.json`, `props_picks.*`: the extra 16 candidates the first agent found (numbers 3000-3015).
- `research/assets/sketchfab/props_tools/`: the look tools (`shot.mjs` street-level shots of placed models, `montage.mjs`, `q.mjs` page queries, `err.mjs`, `build.sh`).
- `work/test_props2.mjs`.

## 1. Inventory: street objects the game drew before props2 (build of 2026-11-13, chain ending `mhchars`)
Counted in the running page (`props_tools/inv.mjs`). "Solid" = in the collision grid; "jump" = `jump.js` lets the player over it when its top is under 1.0 m (running).

| object | count | positions from | solid / jump |
|---|---|---|---|
| street-file props (`STREETS`, per-street files): sign posts `post` | 72 (180 drawn incl. street hooks) | street files (OSM + hand placement) | knockable / top 2.6 |
| bollards | 22 | street files | round prop, top 0.9 (jumpable) |
| street lamps (street files) | 53 | street files | knockable, top 4.7 |
| benches (street files) | 38 | street files | wall, top 0.96 (jumpable) |
| bins (street files) | 64 (83 with hooks) | street files | round prop, top 0.8 (jumpable) |
| planters | 11 | street files | round prop, top 0.5 (jumpable) |
| bushes | 110 (180 with hooks) | street files | round prop, top 0.9 (jumpable) |
| electrical boxes `box` | 42 | street files | round prop, top 1.2 |
| small trees `treeS` | 61 (325 with hooks) | street files | prop (tree) |
| street-file fences: hedge 78, mesh 86, picket 116, wall 11, slat 2, panel 2 runs | 295 runs | street files | wall each segment, top = fence height (picket 1.1 jumpable) |
| road signs (street files, textured planes) | 93 | street files | none |
| park benches + mapped benches (`FAC.benches` 5) | 77 (`world.benches`) | park paths every 13 m, OSM benches | wall, top 0.96 |
| benches by block doors (town) | 61 | blocks of flats | wall |
| park lamps | 60 | park paths | knockable, top 4.6 |
| park bins | 39 | park paths | knockable, top 0.7 |
| bus stop signs | 13 (mapped `FAC.stops` 17) + 7 (bus loop `STOPS`) | OSM stops | knockable, top 2.6 |
| bus shelters (boxes + glass) | 9 | OSM stops with shelter tag | 3 walls |
| recycling bells (3 colours) | 23 sets | one per block of flats | wall |
| traffic lights | 3 junctions, 12 heads | OSM `SIGNALS` | prop, falls when hit |
| power/lamp poles on roads | 2,051 poles, 1,257 lamps | generated along roads | prop |
| yard hedges (box strips) | 14,077 segments, 26.4 km | house plots | wall |
| roadside railings | 912 | generated | wall |
| brick gate pillars | 74 | generated | prop |
| sports: hoops, nets, goals, masts 4, bleachers 1 | | OSM pitches | walls |
| cemetery: gravestones, pillars 852 | | OSM cemetery | walls |

OpenStreetMap data in the page that was **not drawn as an object** before props2:
- `CROSSINGS` (64 pedestrian crossings): used only for pedestrian behaviour; no crossing sign stood at any of them.
- `FAC.play` (1 mapped playground): nothing drew it.
- Junction priority (main road vs side street, from the road classes in the graph): no give-way or main-road signs.
- The OSM extract in the page carries no `waste_basket`, `post_box`, `recycling`, `street_lamp`, `bench` nodes beyond the 5 above, `playground` beyond the 1, `kiosk`, `power=*` or `fire_hydrant` tags at all: they were dropped when the page's data was made, so there is nothing more to draw from.

## 2. The step
- `add_props2.py` embeds each model as `asset_props2_{key}` and `PROPS2` (the table, without source fields), splices `props2.js` before boot, hooks the older builders, and appends the credit to the on-screen credit line.
- Models are one mesh in a unit box (x/z centred, y 0..1, front +z), one WebP atlas (256 px default), int16 positions, int8 normals, uint16 uvs, **meshopt-compressed** (`EXT_meshopt_compression`, decoded by the loader's Meshopt decoder), real size from `props_models.json` (`h`, `w` or `fit`). 46 models, 1.42 MB of base64 in the page.
- Drawing: one `InstancedMesh` per model per 200 m cell (frustum and fog cull most of town). Several models of one kind are variants picked per place by `hash()`, so builds are repeatable.
- Replacement, three paths:
  1. street-file kinds (bench, bin, lamp, bollard, planter, box, bush): `STREET_KINDS[k].s` and `.f` take the first model's size before the streets are built, so the street step's own walls, knockables and `jump.js` tops are the model's; the box mesh is hidden once the model loads and knockables fall as the model instance.
  2. older builders ask `p2Take(kind, ...)` first (park/door benches, park lamps and bins, bus shelters, mapped and bus-loop stop signs, recycling bells): true means props2 draws and makes it solid, so the builder skips its boxes and wall.
  3. new places from map data (`P2_SITES`).
  4. street-file fences of style hedge/picket/panel: one model panel repeated along each run, stretched to whole panels at the fence's own height; the street step keeps the wall and jump top.
  Traffic lights: the model replaces the pole and head on the game's own group (it still falls when hit); the three live lenses are moved onto the model. No signal logic was added or changed.
- Collision: knockable or small squarish things are round props, long thin ones a wall, the rest four walls; every collider's top is the model's height (P2.tops feeds `jumpTable`).

### What I changed from the first agent's version
- Two mapped stops a few metres apart (or a mapped stop on top of a bus-loop stop) drew two signs side by side and two shelters (seen at (-2101, 40) and (487, 495)). Now one sign within 10 m and one shelter within 15 m (`P2_GAP`).
- At (-2101, 40) the bus-loop sign stood inside the shelter footprint, so the model shelter was refused and the old box shelter was drawn. Shelters now ignore stop signs when checking for room and move any sign inside them to the shelter's end. All 9 box shelters are now models.
- Wells stood next to the car in the driveway: moved 5 m along the fence (was 3 m) and 3.5 m in.
- Dropped `fpanel_473` (Soviet Concrete Fence PO-2): it is a temporary site fence on feet, and repeated along a garden fence it showed gaps and loose panels. `fpanel_470` (Soviet Fence) now does all panel fences.
- Dropped `shelter_342`: no stop ever picked it, and the credit must name only what is drawn.
- `p2Solid` records each place's colliders (`q.col`) for the test.
- Shelters are few (8 placed), so they take the five shelter models in turn instead of by hash; dropped `shelter_341` too once the duplicate went and nothing picked it.
- `jump.js` adds a 0.96 m backrest top beside every park bench; next to a model bench (0.85 m) it sometimes matched the bench's wall (15 cases, found by the test). The wrapper drops those entries next to model benches.

## 4. Structures (garages, substations, sheds, barns, greenhouses): left out
- Garages and greenhouses in the page are cadastre buildings already restyled by `bld2` (garage = PASK 220 or `pa23`, greenhouse = `pa58`). They are part of the merged building mesh, the wall grid and `inBuilding`; standing a model in for one means removing that building from code that is not mine (and the `walls` agent is texturing it now). Placing the model over the box would double it. Not clean, so not done.
- Transformer substations, sheds, barns, the outhouse: the page has no position for any of them (no `power=*` tags in the extract; sheds/barns are cadastre buildings as above). Inventing positions for buildings-sized objects in a real town is a different thing from a dog house in a garden, so I did not.
- If the integrator wants them: the clean route is a `bld2` option that skips drawing a cadastre garage/greenhouse footprint and hands its rectangle to props2, which would place a model scaled to it with four walls of the same footprint.

## 3. What is placed (one build, `work/test_props2.mjs` counts)
| kind | model(s) used | placed | where |
|---|---|---|---|
| bench | USSR Bench (`bench_401`), Park Bench (`bench_355`) | 94 + 82 = 176 | every street-file, park, door and mapped bench |
| bin | Trash Can (white concrete urn, `bin_371`), Trash Can low poly (`bin_379`) | 53 + 69 = 122 | street-file and park bins |
| street lamp | `lamp_383`, `lamp_389`, `lamp_384` | 37 + 27 + 49 = 113 | street-file and park lamps; arm turned over the nearest road or path |
| bollard | Parking post | 22 | street files |
| planter | Lowpoly Flower Pot | 11 | street files |
| bush | Stylized Bush (tinted) | 180 | street files |
| electrical box | Electrical cabinet | 42 | street files |
| bus shelter | Soviet bus stop, Old Soviet Bus Stop, Soviet Bus Stop 2, Old Russian bus stop, Bus stop PSX | 2+2+2+1+1 = 8 | every mapped stop with a shelter (all 9 box shelters gone; one was a duplicate) |
| bus stop sign | Bus Sign | 16 | mapped stops and bus-loop stops, one per stop |
| kiosk | Simple 90's Kiosk | 4 | beside about half the stops |
| traffic light | traffic light + animation (`signal_3000`) | 12 | the 12 mapped signal heads (3 junctions); live lenses kept |
| crossing sign | Pedestrian Crossing Sign | 128 | both sides of each of the 64 mapped crossings |
| give way / main road | European Road Signs (two parts) | 78 / 168 | arms of junctions where a street meets a main road |
| recycling bells | Glass / Plastic / Cardboard recycling bin | 23 / 23 / 22 | the existing bell spots at blocks of flats |
| dumpster | Dumpster, Old Dumpster, PSX Dumpster (two) | 3+7+5+5 = 20 | beside the bells |
| playground | Rusty Soviet Slide, Seesaw, Soviet Rocket, USSR Swings, Swings, Merry-go-round, Climbing Frame | 8/10/8/11/11/11/10 | the mapped playground and behind every third block of flats |
| well | Old village well, well wooden Village | 57 + 43 = 100 | one house garden in twenty |
| mailbox | Wooden Mailboxes (stand only) | 284 | by one garden gate in eight |
| dog house | Dog House Free | 257 | one garden in eight |
| firewood | Wood log pile | 274 | against one shed in eight |
| hay bales | Hay Bales, hay bale | 34 + 28 | by one big shed in six |
| fences | psx style hedge / Wood fence / Soviet Fence | 916 / 589 / 38 panels | street-file hedge, picket and panel fences |

Not replaced (kept procedural): street-file sign posts `post`, small trees `treeS` (trees agent), mesh/wall/slat fences, yard hedge strips (26 km), roadside railings, power poles, gate pillars, sports and cemetery furniture. Downloaded but not used: the other playground, kiosk, mailbox, fence, bench and lamp candidates the first agent rejected on preview, the second traffic light (3001), hedge 3003, shrub 3004, and every structure (section 4).

## 5. Verification
- `work/test_props2.mjs out.html out2.html`: all PASS: two builds byte-identical; every model has its block; every props2 mesh loaded and shown; instances drawn = places collected per model; no replaced box drawn as well (street box meshes hidden, no box seat/lamp/bin/shelter roof/sign pole within 0.3 m of a model of that kind); every collider's jump top = model height (1,773 solid places); no console errors from props2; no unused model.
- From scratch copies against the props2 page: `test_jump` PASS, `test_landmarks2` PASS, `test_trees2` all PASS, `test_solid` all PASS except **"bus-stop sign falls at 12 m/s"**: its picker looks for the old group-built sign (`q.parts[0].obj`), which no longer exists. With the picker changed to the model sign (`q.parts[0][0].userData.props2==='stopsign'`, in a scratch copy) it PASSES: the model sign falls (tilt 1.48). The integrator should widen `isBusSign` in `test_solid.mjs` (not my file).
- `node work/fps.mjs`: 60.3 fps (metal), same as the base build at the same time; load 3.7 s vs 3.8 s base (machine heavily loaded by other agents).
- Page growth: 1,443,044 B (1.44 MB; 1,423,244 B of model blocks + 17.7 KB JS + credit), under the 2 MB budget.
- Page errors: one `mhPose` TypeError from the `mhchars` step, present in the base build too, not mine.

## Screenshots (opened and checked; in `research/assets/sketchfab/props_shots/`, not in git)
- Before/after at fixed views: `busstop_*`, `bells_*`, `signal_*`, `park_*`, `crossing_*`, `playground_*` (montages `ba1.jpg`, `ba2.jpg`).
- Two street-level shots of every model in place: `{key}_{n}.jpg` (montages `m3_1..8.jpg`), close-ups of signs, signals, lamps, planters, wells, mailboxes (`m4_1..3.jpg`).
- Seen and fixed from them: doubled stop signs and shelter, box shelter at the bus station stop, gap-toothed concrete fence, wells against driveway cars.
- Seen and accepted: the USSR bench has no backrest (that is the model); the flower pot tapers to its foot so its shadow makes it look raised (it stands on the ground: base 3 cm from the ground mesh); mailboxes stand just inside the gate.
- Not mine, seen in shots: a car body floating in the air near (1060, 183) and a loose car wheel near (-274, -188) (cars step); dark green box hedges along yards (procedural, not replaced).

## Credit text (exact, appended to the in-game credit line by `add_props2.py`)
Street objects from Sketchfab, CC BY 4.0 (modified): Stylized Bush by danielpetrov; Hay Bales by FrodoUndead; hay bale by GAIA.; Wood log pile - PS1 Low Poly by wersaus33; Soviet bus stop by Lordies; Old Soviet Bus Stop by GameDevNick; Soviet Bus Stop 2 by BeogradStudio; Old Russian bus stop by halkiridze; Bus stop PSX by Tesalo; USSR Bench, USSR Swings by se660745; Park Bech Low-poly by MaX3Dd; Trash Can by UnkaII; Trash Can. Low Poly by katykate; Dumpster by txnomod; Old Dumpster Low Poly by Michele.Passerino; PSX Style Dumpster Set by wooolvie; Street lamp (low poly), Electrical cabinet by pinokio21; Street Lamp by kraytongaming; Low Poly Psx Street lamp by SaukrDev; Simple 90's Kiosk by Vagabondare; Rusty Soviet Slide by shtran; Seesaw "Type-1" by targettius; Soviet Rocket Play Scape by OccamRendered; Swings, Bus Sign by decoratopia; European Road Signs by Satik64; Wooden Mailboxes by max_imum; Soviet Fence by ArtEast.; Wood Wooden fence Protector of the farm low poly, well wooden Village - 13MB by ahmagh2e; Old village well by Amagitsune; traffic light + animation by daniel.brueck; psx style hedge by valsekamerplant; Pedestrian Crossing Sign by Liquell; Glass recycling bin, Plastic recycling bin, Cardboard recycling bin by Bee.Lucas; Parking post by Art62; Lowpoly Flower Pot by l0wpoly; Merry-go-round by ashley.carboon; Children Climbing Frame T-shape by mira9; Dog House Free by donnichols

All 42 source models are Sketchfab "CC Attribution" (CC BY 4.0); uid of each is in `pipeline/props2/props.json` → `src.uid` (https://sketchfab.com/3d-models/{uid}).

## Not done / still wrong
- Structures (section 4): none placed.
- `test_solid` bus-stop-sign picker needs widening by the integrator (above).
- Mailboxes 284, dog houses 257, log piles 274 are many; the rates (1 in 8) are a taste call, easy to lower in `P2_SITES`.
- Crossing signs use the nearest carriageway; at a crossing near a junction the sign can stand on the corner of the side street.
- Street-file kinds share the first model's size (so the street step's colliders fit), so `bench_355` and `bin_379` are drawn slightly squashed to `bench_401`/`bin_371`'s footprint on street-file places.
- Build position: `props2` must be added after `mhchars` in `build.sh` by the integrator.

# Round 2 (2026-11-14): bushes and hedges ("now it is squares")

## What was square (counted in the v64-equivalent build, before this round)
| kind | count | from | drawn as | solid / jump |
|---|---|---|---|---|
| garden hedges along residential streets | 4,279 segments, 8,332 m, 1.2-1.8 m tall | town code in `v37` (`boundary()`, style `hedge`, half the Vilniaus g. gardens) | flat-sided dark green slabs 0.76 m thick, merged mesh | wall per segment (`hedgeSegs`), too tall to jump |
| street-file hedge fences | 78 runs (6 `dense`) | street files `fences` style `hedge` | my PSX hedge panels (`fhedge_3002`), 916: a leaf texture on a box, still square up close | wall, jump top = fence height |
| street-file bushes | 110 props, 180 drawn with hooks | street files `bush` key | Stylized Bush model (looked fine, but 180 clones) | round prop, top 0.9 |
| Žvyryno g. 2 tall hedge, Gintaro g. 18 thuja cones | 1 + 1 row | `club.js` story builds | box / 8-sided cones | not mine, untouched |
| Vyšnių g. 5A thuja hedge and junipers | 1 | `house5a.js` (not in chain) | its own | not mine, untouched |
| trees2 | | no shrubs (kind 7 thuja are trees) | | |

The downloads on disk do not fix it: 3002 and 3003 are textured boxes (3003 with rounded edges), 3004 is alpha cards with white fringes, the nature group has only the Stylized Bush.

## What I did
- `p2Plant()` in `props2.js` builds plants from faceted leafy lumps, the same low-poly look as the game's trees, in the unit box the models use, top exactly at 1 so the drawn height is the place's height. Three hedge looks, two variants each: **thuja** (dark blue-green, narrow tapering columns), **clipped** (mid green, flattened rounded top), **loose** (lighter, uneven lumps, wanders in depth). Three shrub shapes, two variants each: **round**, **mound** (low, wide), **upright**. Vertex colours darker low down and mottled per face; every place gets its own tint (lighter/darker, yellower/bluer) from `hash()`.
- Garden hedges: the town code's box is no longer drawn (`p2Hedge` hook in `add_props2.py`); the run is cut into pieces about one look-length long (overlapping 8 %), look chosen per garden by hash (thuja 50 %, clipped 30 %, loose 20 %), variant and a 180° turn per piece. Same line, same height; the existing walls stay, so collision is unchanged.
- Street-file hedge fences use the same three looks instead of the PSX panel (`fhedge_3002` dropped).
- Street-file bushes: Stylized Bush plus the six shrub variants, picked by hash; each bush gets its own turn and a width of 0.85-1.2x, and its round collider widens with it. Height stays at the street size, so the jump top still matches.
- Downloads (`bush_download.json`, numbers 3200-3205, CC BY, from the Sketchfab search API) were converted and looked at (`props_shots/bushes/shrubprev.jpg`): only **Low poly Bush (Buxus)** by arekusandoru.kurobe (3200) reads as a garden shrub, so it joins the bush variants (`shrub_3200`, 37 KB). Rejected: Currant bush (a bare stem with leaves), Simple bush (scraggly cut-out), Low Poly Stylized Bush/Shrub (a yellow dome), Low-Poly Shrub (a little tree), Street Shrubs A2 (in a pot). Their rows are in `props_cands.json`.
- Page: props2 is now 1.44 MB of model data plus 23 KB JS (the PSX hedge panel's 24 KB went, the Buxus 37 KB came); plants add no data, they are generated at load.

## Vyšnių g. 5A (`house5a.js`, not mine, not edited)
Its hedge could use these plants if it either (a) calls `p2Hedge([x0,z0],[x1,z1],height,key)` for each hedge side before `buildExtra` runs (the pieces are placed by `p2Build` and it keeps its own walls), and stops drawing its own hedge mesh; or (b) if it builds after `buildExtra`, I would add a `p2PlantAt(look, x, z, heading, [w,h,d])` call that places one piece at once. Its junipers could use the `upright` shrub the same way. What I need from it: the hedge as segments in world metres with a height, the juniper positions and sizes, and the order it runs in relative to `buildExtra`.

## Round 2 verification
- From scratch copies on the final build: `test_props2` all PASS (two builds byte-identical, 28,165,220 B), `test_solid` all PASS (its bus-stop picker had been widened by the integrator), `test_jump` PASS, `test_trees2` all PASS, `test_streets` PASS.
- `fps.mjs`: 60 fps (metal); load 3.7 s.
- Placed: garden and street hedge pieces 7,030 (thuja 3,568, clipped 2,361, loose 1,101); street bushes 180 (Stylized Bush 21, Buxus 24, six procedural shrubs 135).
- Shots, opened (in `props_shots/bushes/`): `before.jpg` and `after.jpg` (same six views: three garden hedges, a street-file hedge, two bushes), `plants.jpg` and `plants2.jpg` (each look in place, before and after the colour pass), `buxus.jpg`, `shrubprev.jpg`, `hedgeprev.jpg`.
- Still wrong / open: thuja pieces show their individual columns, a little more scalloped than a real clipped thuja wall; the Buxus is brighter than the procedural plants; the Žvyryno g. 2 hedge and Gintaro g. 18 thuja cones (`club.js`) and Vyšnių g. 5A (`house5a.js`) still draw their own; some street-file bushes sit outside the ground plane near z = -3,690 (street file data, existed before).

Credit addition (appended automatically by `add_props2.py`): "Low poly Bush (Buxus) by arekusandoru.kurobe". "psx style hedge by valsekamerplant" is no longer in the credit.

- Rechecked after the pause (2026-11-14): files intact (bench `back` offset kept), chain builds, two builds byte-identical (28,350,845 B), `test_props2` all PASS, street views unchanged (`props_shots/bushes/recheck.jpg`).
