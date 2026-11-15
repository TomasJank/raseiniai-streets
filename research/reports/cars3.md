# cars3: a European fleet rebuilt from reference profiles (2026-11-10)

Owner's request: "research if we can find anything and nothing exists that we can use, improve these european models and
rebuild them, avoid american cars".

Result: no model could be sourced (the usable ones are behind a Sketchfab login, see 1). Ten cars were rebuilt with a new
builder from side photos traced on a metric grid, and they replace the cars2 GLB fleet in traffic, car parks and the police.
There are no American-style vehicles left in traffic or car parks. The player's starting Audi 80 is still the hand-built
one, as it was under cars2.

Build: `sh pipeline/build.sh out.html && python3 pipeline/add_fixgear.py out.html && python3 pipeline/add_cars3.py out.html`
(step `cars3`, after `fixgear`). Two builds are byte-identical.

## 1. Research log

What "usable" meant here:
- it is recognisably that specific car;
- it has 500 to 6,000 triangles. Cars2 cars are 2-3.3k and a building facade is a few hundred, so a car above about 6k would
  be the most detailed object on screen. A scan in the tens of thousands of triangles cannot be flat-shaded to match;
- its licence is CC0 or CC-BY, read on the asset's own page;
- the file can be downloaded by a script.

| where | searched | found | verdict |
|---|---|---|---|
| Sketchfab (API `v3/search`, downloadable, licence and face count read from `v3/models/{uid}`) | passat b5, golf 4 / mk4, audi a6 c5, audi 80, bmw e39, bmw e46, octavia, zafira, avensis, qashqai, transporter t5, astra g, corolla, vectra, fabia, mondeo, volvo v70, mercedes w210, "low poly european car", "ps1 car" (67 CC hits under 12k faces; contact sheet `scratchpad/agents/cars3/web/cands.jpg`) | strong, specific candidates (table below) | **blocked**: `GET /v3/models/{uid}/download` answers 401 without a signed-in account. Recorded for a manual download |
| OpenGameArt (fetched with a browser User-Agent; WebFetch gets 403) | psx-style-cars, german-70s-hatchback-lowpoly, low-poly-cars, lowpoly-cars | PSX Style Cars (CC0, 300-480 tris, generic estate/saloon/hatch/minivan); "German 70s hatchback" (CC-BY 4.0, a Golf Mk1); Quaternius car pack (already in cars2) | rejected: generic, or 1970s and outside 1988-2015 |
| Poly Pizza (search pages for wagon, estate, sedan, hatchback, golf, volkswagen, bmw, audi, van) | | generic or toy-style cars only; the cars2 round already took the best of them | rejected: not a specific car |
| itch.io | "Lowpoly BMW E46 Compact" (nickaruxe.itch.io/lowpoly-bmw-e46-compact) | 1,885 vertices, FBX | rejected: the page states no licence |
| CGTrader, Hum3D, 3DCadBrowser, RenderHub (web search for B5 Variant / Golf / Passat) | | paid or royalty-free licences; Hum3D is CAD-grade | rejected: not CC0 or CC-BY |
| Open games and GitHub (web search) | | no shipped period European cars under a free licence | none |

Sketchfab candidates worth downloading by hand (CC Attribution, as read on each model's API record; textured, one
material, so each would also need its texture baked to vertex colours). Pages:

| car | faces | author | page |
|---|---|---|---|
| 1998 Volkswagen Golf Mk4 | 5,420 | ImperialBlue3D | https://sketchfab.com/3d-models/none-ec7b2f2fd567419a965db5b07b777c0c |
| Audi 80 lowpoly (B4) | 4,014 | xoliul ("my old car, handpainted textures") | https://sketchfab.com/3d-models/none-b3e18613e61a41b295052cf2b4b70099 |
| BMW E46 1998 | 1,420 | slowpoly | https://sketchfab.com/3d-models/none-ecc42a37c7e2409b9fd05665512843ce |
| BMW 5 Series (E39) 1999 | 1,736 | elenaisakova248 | https://sketchfab.com/3d-models/none-dca3cecaf7524b0da0f295368d65fbd9 |
| Opel Astra G Sedan 2002 | 1,216 | elenaisakova248 | https://sketchfab.com/3d-models/none-a8528f9e30604d02915191524c28a41a |
| 2008 Volvo V70 | 2,668 | elenaisakova248 | https://sketchfab.com/3d-models/none-c85b744decd04cf597f43cc630e1d157 |
| Low Poly Volkswagen (10 cars: Passat 1999/2003/2004, Golf 2005/2009, T4 1999 ...) | 7,470 | elenaisakova248 | https://sketchfab.com/3d-models/none-24db62db678548f9a07b90b57fb1abbd |
| Low Poly car: BMW E39 | 2,131 | Ivan.Newman | https://sketchfab.com/3d-models/none-71c8e422929f42ebb69b132c086f1f13 |

Caution: elenaisakova248 uploads many branded cars that look like game rips. A CC-BY tag from a re-uploader does not prove
the uploader had the right to license them, so treat those four as doubtful. The ImperialBlue3D Golf, xoliul Audi 80 and
slowpoly E46 read as original work. Put a downloaded file in `research/assets/vehicles/cars3/` with its page and licence.
cars3's seam can take a GLB-backed model in place of a built one (same `{paint,trim,lamps,wheel,axles,track,r}` shape).

## 2. Route

I chose a new procedural builder, `buildCar3(M)` in `pipeline/cars3.js`, with one table per car in
`pipeline/cars3/{key}.js`. I did not use the Python GLB baker. Reasons:
- The old lofter's real fault was its one fixed section and its near-identical tables. The new builder is driven by each
  car's own traced outline: a top profile (nose, bonnet, screen, roof, rear screen or tailgate, boot), a bottom profile,
  a belt line, the screen and rear-glass zones, and a plan rounding. Saloon, estate, hatch, liftback, MPV, SUV and van
  then come from the data alone.
- Side windows, pillars, door shuts, handles, rub strips and lamps are 2D polygons draped onto the skin. Window shapes,
  the strongest side cue, follow the photo exactly.
- Each table is about 3.5 KB. The whole step adds 39.2 KB of JS, and the cars2 GLB blocks (942 KB) are dropped.
- It builds synchronously at boot, so no async loader is needed.

Tracing: `research/assets/vehicles/cars3/models.py` holds the pixel readings off `refs/cars/{key}/side.jpg` (scaled to
1200 px wide, read on zoomed grids). `trace.py` converts them:
- u is piecewise linear, so the axles land on the real wheelbase and the overhangs stretch to the real length;
- y is scaled so the roof, without rails, is the real height;
- options correct for perspective: a tilted ground line, the ratio of the two tyres' apparent sizes, and a known front
  overhang.

Lithuanian plates (frame, EU band, six characters) are on every car, front and rear, from the old builder's design.
Badges are simple: VW roundel, four Audi rings, BMW kidneys and roundel, Toyota oval, Škoda and Opel discs.

## 3. Fleet

Real figures: Wikipedia infoboxes (Passat B5, Golf Mk4, E39, E46, T5; de.wikipedia for the B4), plus cars-data.com,
cararac.com, Parkers and auto-data.net where Wikipedia had none. These are quoted in the search notes. Octavia III
liftback wheelbase 2,680 (CarExpert; 2,686 is the Combi). RAV4 length 4,395 includes the tailgate spare wheel. Modelled
values are from `test_cars3` (length over paint and trim, so the plates add 2-4 cm; height including rails).

| key | car | body | real L / H / WB (m) | modelled L / H / WB | tris (body + 4 wheels) | draw calls | traffic share |
|---|---|---|---|---|---|---|---|
| passat_b5 | VW Passat B5.5 Variant | estate, rails | 4.681 / 1.492 / 2.703 | 4.701 / 1.485 / 2.703 | 4,704 | 3 + shared wheel | 4/21 |
| golf4 | VW Golf IV 5-door | hatch | 4.149 / 1.444 / 2.511 | 4.176 / 1.444 / 2.511 | 4,580 | 3 | 3/21 |
| a6_c5 | Audi A6 C5 Avant | estate, rails | 4.796 / 1.465 / 2.760 | 4.831 / 1.456 / 2.760 | 5,544 | 3 | 3/21 |
| e39 | BMW 5 E39 | saloon | 4.775 / 1.435 / 2.830 | 4.802 / 1.435 / 2.830 | 4,648 | 3 | 2/21 |
| e46 | BMW 3 E46 | saloon | 4.471 / 1.415 / 2.725 | 4.500 / 1.415 / 2.725 | 4,324 | 3 | 2/21 |
| avensis | Toyota Avensis T27 Tourer | estate | 4.765 / 1.480 / 2.700 | 4.804 / 1.480 / 2.700 | 5,572 | 3 | 2/21 |
| octavia3 | Škoda Octavia III | liftback; also the police car | 4.659 / 1.461 / 2.680 | 4.695 / 1.461 / 2.680 | 4,250 | 3 (+ police extras as before) | 2/21 |
| zafira | Opel Zafira B | MPV, rails | 4.467 / 1.635 / 2.703 | 4.492 / 1.638 / 2.703 | 4,540 | 3 | 1/21 |
| rav4 | Toyota RAV4 XA30 (EU, spare on tailgate) | SUV, rails | 4.395 / 1.685 / 2.560 | 4.414 / 1.684 / 2.560 | 4,340 | 3 | 1/21 |
| t5 | VW Transporter T5 panel van | van | 4.892 / 1.935 / 3.000 | 4.910 / 1.935 / 3.000 | 4,942 | 3 | 1/21 |

Every model is within 1 % of its real length, height and wheelbase. The test limit is 3 %.
- Draw calls per car are paint, trim and lamps, as in cars2. Wheels are one InstancedMesh per model for the whole town
  (192 tris per wheel).
- Body triangles are 3.5-4.8k, about 1.5x a cars2 car. That is mostly window and plate subdivision (`drape` splits to
  0.3 m edges).
- Parked cars use the same 10 models through parked2, at 2 draws per model within 120 m.
- The traffic mix is about 60 % estates and saloons from VW, Audi, BMW, Toyota and Škoda, plus one hatch line, one MPV,
  one SUV and one van per 21. Parked cars use the same weights (hash of position).

Sheets (reference left, in-game right; side, front 3/4, rear 3/4), all under 230 KB, in
`research/prototypes/vehicles/cars3/{key}.jpg`. Also there: `fleet_sides.jpg` (all ten side on, same scale) and
`carpark_ingame.jpg` (the densest car park, 31 parked cars within 40 m). Some renders are mirrored to match the photo's
side; the car is symmetric.

My read of the sheets with the captions covered:
- **Side:** every one reads as its type, and these read as the specific car: the Passat B5 (estate glasshouse, black B/C
  pillars, rails), the A6 Avant (long, raked D-pillar, chrome belt), the Golf IV (short hatch, thick C-pillar), the
  Octavia III (liftback roof falling into a short tail), the Zafira (one-box MPV), the RAV4 (spare wheel) and the T5. The
  E39 and E46 are both BMW saloons and separate mostly by size and window line (silhouette IoU 0.92, the closest pair).
  The Avensis Tourer's nose is long and low next to the photo; it reads as a Japanese estate rather than, unmistakably,
  an Avensis.
- **Front and rear:** simplified. The grilles, lamp layouts and badges are right in kind (BMW kidneys and twin lamps, the
  Audi rings, the T5's three-bar grille), but noses are wedge-shaped where the real cars are bluff, and the lamps are flat
  shapes. The Golf and Passat read from the front; the Avensis, Zafira and Octavia need the badge to tell.

## 4. Seam (`pipeline/cars3.js` after `// ---- seam ----`)

`add_cars3.py` does two things:
- removes the 10 `asset_car2_*` script blocks (asserted 10), so `CARS2`'s IIFE leaves the fleet empty and `on:false`;
- inserts `CARS3_MODELS`, the tables, the builder and the seam before `// ---------- boot ----------`, with the anchor kept.

The `CARS3` IIFE then:
- builds the 10 models and one wheel InstancedMesh per model;
- `Object.assign(CARS2,{models,inst,police,on:true,lotPick})`;
- re-points every `CARS2.swap` entry, including `skodaGeo` to the police Octavia (with hood and roof heights read from
  its paint, as cars2 did);
- splices `TRAFFIC_GEOS` and `LOT_GEOS` in place.

Nothing else is touched:
- cars2's `makeCarMesh`, wheel instancing, police bar and parked pick run unchanged on these models;
- parked2, drive.js lamps and spotlights (fixfreeze's shared pair), dent and repair, breakLamps, water3 sinking,
  traffic and pathing are unchanged.

Anchors used: `// ---------- boot ----------` (insert only). No existing function body is edited. Geometries carry a
trivial index so code that reads `.index.count` still works.

## 5. Gates (SwiftShader unless noted; machine shared with four other agents)

`node work/test_cars3.mjs page.html`: **PASS**
```
realDimensions ok, max error 0.8 % (avensis, octavia3)
distinctSilhouettes ok, maxIoU 0.92 (e39 vs e46)
everyCarIsCars3 ok: 26 traffic, 1,097 parked across 10 lot models, police model octavia3; TRAFFIC_GEOS mix 4/3/3/2/2/2/2/1/1/1
platesFrontAndRear ok: every model has plate faces at +z and -z
stealCars3Car, wheelsTurnAndSteer ok (3.333 rad/m, 0.28 steer, instanced wheels drawn)
lampsAtNight ok: head and tail lamp vertices, spotlights 260/260 at night, uHead 1
parkedCarIsSolid ok: overlap before, none after 8 steps, 2.63 m apart
sinksInWater ok: drop -0.42 m, player ends on foot
errors []
```
All gates were rerun on the current chain (`build.sh` through `credits`, then `fixgear`, then `cars3`; page `x2.html`).
`test_cars3` gave the same numbers there (1,124 parked cars instead of 1,097, because bld2 added lots).

| suite | result |
|---|---|
| `test_cars2` | **PASS**, every check including `noHolesRear34` (black px 0-36 per view, arch gaps .027-.034 m) and `policeBar` (model octavia3, bar on the roof at 1.514) |
| `test_cars` | **PASS**: the old hand-built tables are untouched |
| `test_solid` | **PASS**, all passed |
| `test_water3` | **PASS**: traffic and police cars sink, none parked in water |
| `test_drive2` | **PASS**: turn rate p99 2.16, lane offset p95 0.16 m, 26 cars 0.168 ms per call |
| `test_fixfreeze` night | **PASS** |
| `test_fixfreeze` day | **FAIL** `no growth during hits` (+7 to +8 geometries during the 8 hits), sometimes also `max step < 50 ms`. The page without cars3 (`pre2.html`) fails the same check the same way (+8 and +11 geometries, and one 105 ms step). Not caused by this step: the count is renderer.info geometries that come into view as the stolen car drives, plus dent's per-car paint clone, which cars2 already had |
| `test_parked2` | every check passes except `aerialParkedTris<=40%`, whose ratio is 1.0 (8,352 vs 8,352). That check compares against a page *without* parked2; run against today's chain it compares parked2 with itself, so it cannot pass on any current page. Wrong by design here, not edited. Street-view parked triangles are 180k vs 110k with cars2 (heavier bodies), at the same 19 draw calls |
| `test_drive` | 10 of 11 checks ok. **FAIL** `curbBounceDecays` (peak heave 0.0067 m, 0.0023 m after 1.5 s). The page without cars3 gives byte-for-byte the same result, and the test drives the hand-built starting Audi 80. It passed on the chain before roads2/bld2/trees2 (0.0109 / 0.0015), so it came in with the new road surfaces, not with this step |


Metal (`work/fps.mjs`, current chain): 60.3 fps both before and after, which is the vsync cap. Load 2.26 s before, 2.31 s after. The car-park
probe (player parked at the densest lot, 31 parked cars within 40 m, 8 traffic cars moved into view) holds 60.2 fps
before and after. Page (current chain): 12,102,280 B before, 11,161,511 B after, which is 940,769 B smaller (the GLB blocks go, 39.2 KB of
JS comes in).

## 6. Open issues

- **No sourced models.** The Sketchfab files listed in 1 need a signed-in download by the owner.
- **Faces are the weak side.** The noses are too wedge-like and the lamps too flat compared with the photos. The next
  pass would be a front profile per car (bumper and lamp depth) in the tables.
- **Side reads.** The E39 and E46 differ mainly in size. The Avensis' nose is long; its front photo trace fought a
  Hilux parked behind it, and a cleaner side photo would fix it.
- **Visual shape only.** The physics chassis is still the Audi's, as under cars2, so the van and the SUV drive like a
  saloon.
- **Phone.** On `PHONE` the cars3 fleet is skipped, as cars2 was, and traffic falls back to the hand-built lofted cars
  (European models, no American ones).
- **Stale credit string.** `CREDITS_CARS` (cars2.js) still names the Poly by Google and PuKkBuMXDD models. It is not
  displayed anywhere, but those models are no longer shipped. cars3 needs no credit line: no third-party mesh. The
  reference photos are not embedded.
- **Size of `refs/cars/`.** It holds 30 reference photos (downscaled to 1,200 px, 7.4 MB) with `CREDITS.tsv` per car,
  and it is not gitignored.
