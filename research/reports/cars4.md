# cars4: the owner's car list (2026-11-13)

The owner ticked which Sketchfab vehicles to keep (`research/assets/sketchfab/car_picks.json`: 32 keep, 47 drop) and
chose "Remove them now" for the dropped ones. This round puts exactly his list in the game, as far as each car converts
cleanly and its licence holds. Earlier rounds (trial, wheels, Audi 80 start car, paint colours) are summarised at the end.

Build: `sh pipeline/build.sh out.html` (step `cars4` is in the chain). Two builds are byte-identical.

## Stage 1: the kept low-poly cars

- **Dropped models are out.** `passat_b2`, `octavia1`, `golf4`, `a4_b5`, `e46`, `focus1`, `corolla_e100`, `civic7`,
  `clio2`, `p206` are no longer in traffic or car parks, and their data is no longer in the page. `corolla_e100` stays
  converted in `pipeline/cars4/` (not in the page) because the Audi 80 borrows its wheel at convert time (`wheelFrom`).
- **Wheels.** `allWheelsTurnAndSteer` passes for every model with the test unchanged in that check. The fix is in the
  converter (non-legacy path): rims, hubs and caps lying wholly inside a tyre's cylinder are moved into that wheel, the
  ground is taken from the tyres (not from a lower liner), and mirrored nodes are turned the right way out.
- **Model 79** is split into `sedan79` and `wagon79` (`node` option per body; the estate is turned 7 degrees in the file).
- **Sprinter (209)** drives as traffic, collides along its 5.9 m (`F.offs`, a row of circles as long as the vehicle).
  Its rear doors were missing (single-sided faces seen from behind); fixed with `cull 1`, which renders the model from
  ~120 directions offline and flips or drops faces by what is seen from outside.
- **Bus and Kamaz: what I chose and why.**
  - **Hyundai Aero Space coach (246) is the route bus.** The game already has one route bus (`buildBus`/`updateBus`)
    with its own driving, stops, an 11 m collision against the player, and traffic that queues behind its length
    (`busAhead`). The coach replaces its box mesh (`busMesh`), and its wheels spin with the distance driven. This lets a
    12 m vehicle drive without teaching cars2's five-circle traffic collision about buses.
  - **PS1 bus (248, a PAZ) and Kamaz (266) stand.** Placed in `mix.json` `static`: the PAZ on the platform bay of
    Raseinių autobusų stotis, the Kamaz on the yard east of the industrial shed at 55.3982, 23.0843 (the only OSM
    `building=industrial` in the data). Each is one mesh plus its outline as four walls (`addWall`), so it is solid.
    Traffic does not need them, and parked heavy vehicles are where they belong.
- **Colour.** Repainting needs either a flat paint material (`paintMat`: the paint is stored grey and the game colours it
  exactly) or a texture paint mask. `passat_b3` and `ibiza2` (and `sprinter`, `sedan79`, `wagon79`) are flat-paint models
  now, so every palette colour is exact on them. Checked by eye on every model in all 12 palette colours
  (`research/assets/vehicles/cars4/review/colours_*.jpg`; that folder is gitignored like all images under research/assets). Per-model fixes where a texture paint is not clean in every colour:
  - `tone: dark` (A4 B5.5 Avant: light colours show the photo's baked highlights) and `tone: light` (Peugeot 406: dark
    colours show white texture seams). Such a car shows its own colour instead of the palette colours it cannot take.
  - `own: "#hex"`: a garish file colour replaced (Volvo V70's pure green, E90's pure black).
  - `own_colour` in `mix.json`: BMW E34 keeps its black (a dark photo paint has nothing to carry).

## Stage 2: the detailed cars

**Pipeline** (`research/assets/vehicles/cars4/convert.mjs`, option `lod`):
1. Same normalise / atlas / wheel steps as the low-poly cars.
2. Hidden geometry goes first: the body is rendered with per-triangle ids from 121 directions (wheels from 60) on an
   offscreen target; triangles never hit are dropped (interiors, engines, underside clutter), triangles seen only from
   behind are reversed, and ones seen from both sides get a reversed twin. This removes 25 to 60 % before any reduction.
3. meshoptimizer 1.3 (`simplifyWithAttributes`, normals and UVs weighted so texture seams hold; escalating error, then
   Prune/Permissive, `simplifySloppy` as a last resort) reduces body and wheel separately: close-up 11,000 + 4 x 900
   triangles (8,000 for the three largest files), distant 2,100 + 4 x 100.
4. One 512 px JPEG atlas, shared by both versions. Distant version as `{key}.bin`, close-up deflated as `{key}_hi.bin`.

**How the game switches** (`pipeline/cars4.js`, already in place and kept): moving cars swap the body geometry in
`scene.onBeforeRender` at 40 m (back at 44 m, so it does not flicker), and their wheel instances move between two
InstancedMeshes at 42 m. Parked cars get a second InstancedMesh2 per detailed model drawn within 40 m, while the
distant one draws 40 to 120 m and parked2's flat silhouette beyond. The close-up data is inflated with
`DecompressionStream` after the world shows, so load time does not grow. A dent swaps in its own geometry and stays.

**Results** (page bytes = base64 of .bin + _hi.bin + .jpg + mask):

| key | model (#, author) | close-up tris body + 4 x wheel | distant | page KB |
|---|---|---|---|---|
| a4_b55 | Audi A4 B5.5 Avant (2057, Tomasoo) | 8,000 + 4 x 899 | 2,100 + 4 x 100 | 292 |
| e46_roh | BMW E46 1998 (2086, roh3d) | 5,023 + 4 x 925 | 2,099 + 4 x 99 | 217 |
| e34 | BMW 525i E34 (2102, UVZZZ) | 7,040 + 4 x 396 | 2,099 + 4 x 100 | 239 |
| e90 | BMW 320i E90 (2117, rifdanzz) | 6,116 + 4 x 900 | 2,100 + 4 x 99 | 169 |
| zafira_a | Opel Zafira 2002 (2145, tonielpro520) | 10,996 + 4 x 900 | 2,099 + 4 x 99 | 261 |
| accord7 | Honda Accord 2004 (2362, dirocris) | 10,314 + 4 x 899 | 2,084 + 4 x 100 | 230 |
| v70 | Volvo V70 (2235, bigslavehd) | 10,995 + 4 x 900 | 2,093 + 4 x 100 | 192 |
| w124 | Mercedes-Benz W124 (2251, San.Dro) | 10,999 + 4 x 900 | 2,097 + 4 x 100 | 228 |
| w210 | Mercedes-Benz E320 W210 (2262, homicivan53) | 11,000 + 4 x 899 | 2,100 + 4 x 100 | 250 |
| megane2_gt | Renault Megane Grand Tour 2006 (2299, tonielpro520) | 10,996 + 4 x 894 | 2,091 + 4 x 100 | 244 |
| p206_2000 | Peugeot 206 2000 (2325, tonielpro520) | 7,999 + 4 x 920 | 2,100 + 4 x 96 | 280 |
| p406 | Peugeot 406 1998 (2338, supercarmodels) | 7,996 + 4 x 897 | 2,100 + 4 x 100 | 316 |
| punto1 | Fiat Punto GT 1995 (2414, lionsharp) | 11,000 + 4 x 899 | 2,099 + 4 x 103 | 296 |

Low-poly models (one version): audi80 2,622 + 4 x 380 tris (210 KB raw with its Corolla wheel), passat_b3 5,042 + 4 x 863
(182 KB), sedan79 1,578 + 4 x 520 (68 KB), wagon79 1,804 + 4 x 584 (78 KB), primera 485 + 4 x 44 (~65 KB), ibiza2
3,721 + 4 x 268 (151 KB), sprinter 4,973 + 4 x 1,209 (192 KB), aero_bus 730 + 4 x 380 (83 KB), ps1_bus 244 (56 KB),
kamaz 1,425 (108 KB). All car data in the page: 4.49 MB (budget 8 MB).

Per-model fixes the detailed files needed (all in `models.json`): `split` where one mesh holds several tyres (Punto,
V70 rear axle, 406, Zafira, W210; without it the Zafira and W210 rode on their rims with the tyres 9 cm in the ground),
`spec-gloss` textures read by the converter (the Punto was white without), `crop` + `noShadow` (E34: three cars share
its meshes; the closed black one is used, its shadow card dropped), `hub` (406: hubs reaching into the wheel turn with
it), `glass` (V70, W124), `flip` (V70), `paintMat` (flat paints), `drop shadow` (Punto).

**Dropped detailed cars, and why** (also recorded as `dropped`/`why` in `models.json`):
- **2020 Passat B5, 2027 Passat B6, 2032 Touran, 2127 Astra G, 2166 Octavia, 2170 Fabia, 2203 Fiesta
  (romanian_guy_0069): game rips.** The files carry BeamNG.drive parts: `etk_engine_i6` (Passat B6), `pessima_engine` and
  `coupe_engine` (Fabia), and BeamNG damage meshes (`*_dam`, Astra, Octavia). The brief forbids uploaders who look like
  game rips.
- **2181 Ford Focus sedan (speedmodel): licence.** Its page says "This a old model around the google", so it is not the
  uploader's to license.
- **2288 Mercedes Sprinter 2006 (Max-7215): licence.** Its page says "This model is not free of rights. You must inform
  me of your usage", which contradicts the CC BY tag. (The game keeps the #209 Sprinter.)
- **2342 Citroen Xsara Picasso (tonielpro520): cannot be converted cleanly.** The download has no textures (one white
  material) and its wheels are fused into the body with no tyre the cutter can find.

Not dropped but worth a look by the owner: 2262 W210 (material names like a commercial model library's) and 2235 V70
(German material names, no description). Nothing in the files proves a rip, so they stay.

## Traffic mix (also the car-park mix), out of 33

audi80 2, passat_b3 2, sedan79 2, wagon79 2, primera 1, ibiza2 1, sprinter 1, a4_b55 2, e46_roh 2, e34 1, e90 1,
zafira_a 2, accord7 1, v70 2, w124 2, w210 2, megane2_gt 2, p206_2000 2, p406 2, punto1 1.
The route bus is the Aero Space coach; the PAZ and the Kamaz stand. The player still starts in the Audi 80 in its own grey.

## Credit text (exact; `research/assets/vehicles/cars4/credit.py --write` regenerates it)

> Cars from Sketchfab, CC BY 4.0: Audi 80 by xoliul; VW Passat B3, Mercedes Sprinter by kuwalol93; Lowpoly Sedan & Wagon by Han66st; Nissan Primera by unitygtt34; Seat Ibiza by ngon_3d; Audi A4 B5.5 Avant by Tomasoo; BMW E46 by roh3d; BMW 525i E34 by UVZZZ; BMW 320i E90 by rifdanzz; Opel Zafira, Renault Megane Grand Tour, Peugeot 206 by tonielpro520; Honda Accord by dirocris; Volvo V70 by bigslavehd; Mercedes-Benz W124 by San.Dro; Mercedes-Benz W210 by homicivan53; Peugeot 406 by supercarmodels; Fiat Punto by lionsharp; Hyundai Aero Space coach by ImperialBlue3D; PS1 styled bus by almondz2549; Kamaz by animara777; Toyota Corolla wheels by ImperialBlue3D (modified)

The line must end in " (modified)": a later step (`add_mhchars.py`) anchors on it.

## Converting a new download

```
# 1. add an entry to research/assets/vehicles/cars4/models.json, e.g.
#    {"i": 2999, "key": "golf3", "name": "VW Golf III", "L": 4.02, "WB": 2.475, "flip": 0, "lod": 1,
#     "author": "...", "credit": "VW Golf III"}
#    (L = real length in m; flip 1 if the nose points backwards; paintMat regex when the paint is a flat material)
cd research/assets/vehicles/cars4
node inspect.mjs ../../sketchfab/glb/2999.glb          # meshes, materials, sizes
node view.mjs ../../sketchfab/glb/2999.glb /tmp/v.jpg   # the download as it is
node convert.mjs golf3                                   # writes pipeline/cars4/golf3.* and fleet.json
# 2. add "golf3": 1 to "mix" in pipeline/cars4/mix.json, then
python3 credit.py --write
sh ../../../../pipeline/build.sh /tmp/x.html
node sheet.mjs /tmp/x.html /tmp/sheets golf3             # every palette colour, front and rear 3/4
```
All options are documented at the top of `convert.mjs` (crop/noShadow for files with several cars, split for meshes that
hold four tyres, cull, glass, drop/keep, own, tone, lod budgets).

## What still looks wrong

- **Distant versions (2,100 triangles) are rough up close**: crumpled fenders, the W124's front shows a white patch, the
  V70's headlamps go dark. They are only drawn beyond 40 m, where this does not show in the street shots.
- **Dark lamp glass** on the W210, 206 and Megane: their lamp lenses are see-through materials and become dark glass.
- **Photo dirt**: the A4 Avant and Punto textures carry baked dirt and dents; they read as old, used cars.
- **The A4 is limited to dark colours, the 406 to light ones** (`tone`), so each shows fewer colours than the rest.
- **Parked heavy vehicles**: one PAZ and one Kamaz only; the Kamaz yard is 3 km from the centre and rarely seen.
- **Wheels of the distant version** are 100 triangles: coarse but round enough at 40 m and beyond.
- `test_cars2`'s `glbBacked`, `breakAndFixLamps` and `noHolesRear34` fail, exactly as they do on v60: they test cars2-era
  rules (procedural start car, daytime broken-lamp glow, no back faces) that cars4 replaced.


## Lamps (2026-11-14): "now they are black mostly"

**What was dark, and why** (checked on every vehicle, front and back, light and dark paint, by day and night;
before/after sheets in `research/assets/vehicles/cars4/review/lamps/`):

| model | before | cause |
|---|---|---|
| accord7 | head and tail black | clear lamp lenses (transparent, untextured) were turned into dark window glass over the reflectors and red lamps |
| megane2_gt, p206_2000, zafira_a | head and tail black | the same, plus red lenses whose red is only in their name (Vidros_Vermelhos) |
| w210, w124 | head black (w210 tail too) | clear lens drawn dark over a good lamp texture |
| p406 | head and tail black | one glass mesh holds windows and lenses; under the lenses the body texture is dark |
| passat_b3 | no tail lamps; flat white heads | tail lamp faces pointed inward (single-sided); heads a flat white material |
| sedan79, wagon79, sprinter, v70 | heads flat white blobs | untextured white lamp materials |
| e46_roh | heads dark grey | the lamp is only a dark patch in the texture |
| ibiza2 | tails very dark red | the same |
| a4_b55, e34, e90, audi80, primera, punto1, buses, kamaz | readable | lamps in the texture, left as they are |

**The rule now (`convert.mjs`, lamp pass before the hidden-geometry cull):** an untextured piece (connected part of a
mesh) is a lamp when it sits within 0.7 m of the nose or tail, is shorter than 0.6 m along the car, narrower than
0.8 m, off the centre line (|x| > 0.22 m), above 0.12 m and below 78 % of the car's height, and at least 5 cm across.
Windows fail these tests (they are higher, wider or longer), so they stay dark glass.
- A see-through lens: red or amber by its colour, or by its name when its colour says nothing (red only at the tail),
  becomes that lamp. A clear lens is removed when what lies behind it is light (reflector, lamp texture; the texel under
  each vertex is sampled), otherwise it is drawn as the lamp.
- Flat white pieces at the front become headlamps, white at the back reversing lamps, red tail lamps, amber indicators.
- Lamps are drawn with a small pattern texture in the atlas (bright silver reflector with a ring and lens flutes; ribbed
  red; ribbed amber; white reverse), projected across each lamp, so they read as glass over a reflector, not a flat blob.
- `lampFaces` in `models.json` lays mirrored lamp faces over a lamp that is only a dark patch in the texture; each grid
  point is dropped onto the body so the face follows the shape (used on e46_roh heads and ibiza2 tails).
- `cull 1` for passat_b3 turns its inward-facing tail lamps round.
- Number plates are textured or sit on the centre line, so they are never touched.
- Night glow quads now sit on the main lamp found on each side (the biggest lamp piece and what is at its height, not
  the fog lamps), 60 % of its size, at most 24 x 12 cm; models without a detected lamp keep the raycast placement.
  Brake lights work as before (same quads). Checked at night on every car.

**Still not right:** e46 lamp faces are rectangles over teardrop lamps; p406 and ibiza2 tails are deep red rather than
bright; punto1 and a4_b55 keep their photo lamps (dirty but readable); buses and the Kamaz have no night glow (they are
not cars to the game). Size: car data +56 KB (4.49 to 4.54 MB).

Gates on the lamp build (two builds byte-identical, 27,886,653 B): `test_cars4` PASS (lamps glow by night only, brake
light works), `test_drive` PASS, `test_cars` PASS.

## Earlier rounds (2026-11-11/12, summary)

Trial with eleven ImperialBlue3D-era models; every car's wheels made to spin and steer (fused wheels cut out of the
body); the Audi 80 became the player's start car, on the Toyota Corolla's alloy wheel; per-model paint masks and a
12-colour Lithuanian palette for traffic and the 1,124 parked cars, stable across loads; the garage respray reaches the
textured paint. Those mechanisms are all still in place.

## Gates and measurements

Final page = `sh pipeline/build.sh` with this round's files: 26,065,282 B, two builds byte-identical; car data 4.49 MB.

| gate | result |
|---|---|
| `test_cars4` | **PASS** (20 traffic models; 13 detailed models switch at 40 m, all inside 15,500 / 2,600 triangles; van 8 circles; route bus is the coach; PAZ and Kamaz solid; 11 colours in traffic, 24 among parked cars; parked colours stable across loads; no page errors) |
| `test_drive` | **PASS** |
| `test_parked2` (baseline v60) | all pass except `aerialParkedTris<=40%` (ratio 1.0, the known baseline problem) |
| `test_cars` | **PASS** |
| `test_cars2` | `glbBacked`, `breakAndFixLamps`, `noHolesRear34` fail, the same three as on v60 (checked); all else passes |
| `work/fps.mjs` (Metal) | 60.3 fps, load 3.8 s |

Test changes in `work/test_cars4.mjs` (none weakens a check): the model count floor went from 11 to 7 (the fleet is the
owner's list now); the parked-mesh ceiling from 2 to 3 per model (a detailed model adds its close-up InstancedMesh2);
`wheelsTurnAndSteer` counts the close-up wheel instances too (a detailed car within 42 m draws its wheels there); and
new checks for the van, the route bus, the standing vehicles and the near/far switch. The previous agent's edits were
read line by line against the copy it started from.

Review images (gitignored, `research/assets/vehicles/cars4/review/`): `colours_{key}.jpg` (every model in every palette
colour), `detailed_near_far_1/2.jpg` (side, front, back of each detailed car, close-up and distant version),
`detailed_wheels.jpg`, `zafira_w210_wheels.jpg`, `street_carpark.jpg`, `route_bus.jpg`, `paz_kamaz.jpg`.

## Police car (2026-11-15): the 2005 Skoda Octavia

The owner's pick: "2005 Skoda Octavia" by tonielpro520 (Sketchfab #3300, CC BY 4.0,
https://sketchfab.com/3d-models/2005-skoda-octavia-c31169ccfd354b6c9b6f09964c113ae3). It is an Octavia II (A5) liftback,
the generation Lithuanian police drove in the late 2000s. It replaces the code-built Octavia III of `cars3` wherever a
police car appears: chasing cops (`spawnCop`), roadblocks (`makeCop`), and any other `skodaGeo` car.

**What the download carries.** 353,866 triangles, 21 materials, all flat colours: the only two textures are 128 px badge
images (`logo`, `logo0`). So nothing was taken from textures; the paint is the flat `car_paint` material (stored grey,
coloured by the game, as `paintMat` cars are), and the livery is drawn by the game on top of it.

**Conversion** (`models.json` key `octavia2_pol`, `police: 1`, `lod: [20000, 3600]`, `paintMat: ^car_paint$`; `convert.mjs`
now copies `police` into the fleet entry). Nothing else was needed: four separate tyres found, nose already to +z, lamps
found by the lamp pass (clear head lenses over light reflectors removed so the reflectors show; red tail lenses kept).
Hidden geometry 133,360 -> 70,937 body, 54,977 -> 44,154 wheel triangles.

| version | body | wheel | total (4 wheels) |
|---|---|---|---|
| close-up (within 40 m) | 19,999 | 899 | 23,595 |
| distant (beyond 44 m; phones always) | 3,599 | 100 | 3,999 |

Page: +433 KB (bin 115 KB, close-up 273 KB, 512 px atlas 38 KB, mask 3 KB, all base64). Draw calls: one body and one lamp
mesh per police car plus its bar parts (as before), wheels through one InstancedMesh per version (as every model).

**Wiring** (`cars4.js`, `add_cars4.py`, `mix.json`). `mix.json` names the model as `"police"` (never in `mix`; `add_cars4.py`
asserts it is flagged `police` and not in the mix) and holds its `livery`. In `CARS4`: the model becomes `CARS2.police` and
`CARS2.swap[skodaGeo]`, so cars2's `makeCarMesh`, `policeExtras`, `cars2Bar`, wheel instancing, the cop AI, dents, sinking,
the minimap and the 400 m cull all run on it unchanged. The close-up version is unpacked with the fleet's (not on phones).
The roof height under the bar is the full model's (1.417 m: the distant version's roof sits 6 cm lower, so it is not
measured from it); the bar's z is the middle of the flat of the roof (-0.13 m). `cars2Bar` is wrapped to put the red and
blue lamps there too. cars2's flat hood lettering plane is hidden (the bonnet lettering is in the paint now). A respray
keeps the livery. A cop car the player gets into is driven like any other car.

**Livery** (`cars4Police`, in the paint shader, both versions): white `#eef0ee`; a green band `#269b70` from 0.73 to 0.87 m
on every side-facing panel along the whole car (the waist/handle line, as on the references); POLICIJA in dark `#22272c`
plain bold capitals (canvas text, no emblem, no numbers) centred across both doors below the band, and across the bonnet,
reading from the front. Projected in the car's own frame (x for the sides, y for the bonnet) and limited to the paint mask,
so it follows the body, stays off glass, lamps and trim, and reads the right way round on both sides.

References (Wikimedia Commons, used for the band's height and colour only, not in the page):
- "Police car in Jonava.jpg" (Bearas, 2011-12-30, CC BY-SA 3.0): an Octavia II in this livery, band at the handle line,
  POLICIJA on bonnet and boot.
- "Volkswagen Jetta police (Lithuania).jpg" (David Holt, 2011-09-14, CC BY-SA 2.0): side view; band about 15 cm, from
  0.73 to 0.88 m, colour measured at about rgb(40, 155, 115).

**What differs from a real police Octavia II.** No coat-of-arms badge on the front doors, no unit number (K3087 / G20),
no trust-line phone number, no POLICIJA on the boot lid; the bar is the game's existing bar (a white box with a red and a
blue block), not the long Lithuanian bar; the door lettering is a choice (the references show the coat of arms there).

**Review.** `review/police/sheet.jpg` (gitignored): references, eight angles close up, eight distant (alone, from 60 m
through a long lens), four by night in each flash phase. `review/police/chase.jpg`, `street.jpg`: in the game.
Tools: `police_sheet.mjs page.html out.jpg`, `police_game.mjs page.html outdir`.

**cars3.** With this in place nothing draws the cars3 code-built models any more: cars4 already replaced the traffic and
parked fleet, and the police car was the last. `CARS3` still builds all ten at load (it runs before cars4). The step is
left in the chain for the integrator to decide.

**Gates** (page 31,732,018 B with every step's current files; two builds byte-identical):

| gate | result |
|---|---|
| `test_cars4` | **PASS**, with two new checks: `policeCar` (model `octavia2_pol`, liveried material, wheels spin 1/r and fronts steer .28, bar and box at roof 1.417 + .065 / .06 over z -0.131, close-up roof 1.409, flash phases R- and -B both seen, close-up within 40 m with 4 close-up wheel instances, distant at 70 m, 23,595 / 3,999 triangles, not in models, traffic, car parks or live traffic, `skodaGeo` maps to it) and `phoneGetsDistantOnly` (coarse pointer: no close-up version for the police car or any other) |
| `test_cars2` | `policeBar` fails: it requires the cars2-era `MeshPhongMaterial` (the bar itself is placed as it asks: 1.482 / 1.477 on roof 1.417). `glbBacked`, `breakAndFixLamps`, `noHolesRear34` fail as before (same on the page without this change). `wheelsDrawnOnGround` and `brakeLights` fail whenever the car `stealGlbCar` happens to take is a detailed model: on the page without this change with a Zafira taken both fail the same way; on this page with a V70 taken `brakeLights` passes. Not caused by the police car |
| `test_perf` | **ALL PASS** (start 602 calls / 5.0 M tris, budget 620 / 5.4) |
| `test_takepark` | **PASS** |

In the game: `review/police/chase.jpg` (one star, the cop 12 m behind the player, top-down camera),
`review/police/street.jpg` (a cop car on Vilniaus g.), `review/police/sheet.jpg` (the review sheet).

## Underbody (2026-11-15): "flipped, you look into the cabin"

The converted shells are made to be seen from above, and the hidden-geometry cull (views from 3 degrees up) dropped what
little underside the downloads had, so a car on its roof showed an open shell, floating seat backs and wheels on nothing.

**Run time, not the conversion.** Regenerating is byte-identical (checked: `sedan79` and `e90` rebuilt into a scratch
folder match `pipeline/cars4/` byte for byte), so the conversion was possible. It was not chosen because a baked floor
needs flat colours in each atlas: a model with no swatch cell (all its parts textured) would get a new slot, and the
converter's quarter-splitting would halve one of its photo images; and every .bin and .jpg would change, so every
earlier review sheet would go stale. At run time it costs no page data, only code (~5 KB of `cars4.js`).

**What `cars4Under` (in `cars4.js`, run on the body part of every .bin, close-up and distant) adds**, for every model with
separate wheels (all traffic models, the police car, the route bus):
- a floor pan at sill height (lowest body point out at the sides between the arches, +4 cm, so the sill hides it from the
  side), 5 cm inside the body's low half width per 10 cm, from 12 cm inside the low body's ends, notched at the wheels;
- per wheel a mud-coloured liner (8 segments) just inside the fender lip (the nearest body point above the hub) and an
  inner wall facing the wheel, so the arch reads closed from the side and from below;
- an axle beam per axle at hub height from tyre to tyre, an engine/gearbox block at the front, a fuel tank ahead of the
  rear axle, a muffler behind the rear axle and a pipe from the engine to just behind the floor, on the left.

Colours are flat (`CARS4_UNDER`): a vertex with u >= 2 takes colour u-2 in the paint shader (every cars4 material, the
police livery and the parked instances included). Every face points down or outward and is single sided, so from above
and through the windows nothing changes. It is merged into the body geometry: no new draw call, mesh or texture. It is
inside the body's silhouette, so the shadow keeps its shape; its triangles do go through the shadow pass with the body.
Size: 158 to 170 triangles per model and version (about 300 vertices), lowest point 13 to 28 cm above the ground.
Not done: `kamaz` and `ps1_bus` (wheels fused in the body, they only stand, they can never be flipped).

**Review** (`research/assets/vehicles/cars4/review/underbody/`, gitignored): `detailed.jpg` and `lowpoly_police_bus.jpg`,
one row per model: on its roof from behind and from the side, v73 before and this build after, the distant version from
60 m, and right way up after, from the low chase camera, nose up on a crest, and from the on-foot camera.
Tools: `underbody.mjs page.html outdir` (shots), `underbody_sheet.py beforedir afterdir outdir` (sheets).

**Test** (`work/test_cars4.mjs`): new `undersideClosed`: for all 22 models with wheels, both versions, a ray upward from
below the centre and below each axle hits the car; no underside vertex is below 3 cm or outside the body (its length, and
its half width within 15 cm along the car, or the narrower of the nearest widths fore and aft where a van's flat side has
no vertex near); at most 300 underside triangles. `detailedModelsSwitchByDistance` now counts its 15,500 / 2,600 budgets
without the underside (the converted model's budget), the underside under its own ceiling of 300.

**Still visible that should not be:** the downloads' own underside pieces (some suspension, the Primera's red floor
texture, the Accord's light underbody plate) show on top of the new floor where they hang lower than it; the exhaust tip
shows below the rear bumper from the low chase camera (as on a real car); `wheelsTurnAndSteer` fails when the stolen
car happens to be a detailed model, the same on v73 (it took an E46 there: 0 wheel instances), so not caused by this.

**Gates** (page 32,048,845 B with every step's current files; two builds byte-identical): `test_cars4` **PASS** (with
`undersideClosed`: 22 models, 158 to 170 underside triangles each); `test_perf` **PASS** on the fifth run: the draw calls
are the same as without this change (605 at the start, shadow pass +160 triangles), and its "4x slower CPU steps down
within 25 s" check fails on some runs both with and without this change (a build with the old `cars4.js` failed 2 of 3);
`test_takepark` **PASS**; `test_solid` **PASS**.
