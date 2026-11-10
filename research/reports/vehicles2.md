# Vehicles 2: low-poly GLB fleet behind the car seam (2026-11-09)

Owner: Vehicle Models agent (Opus). Status: step `cars2` ready to integrate, appended after `fight2` (and after `fixgfx`,
which landed meanwhile). Nothing existing was edited except the two appends the brief allows: 10 sorted `car2_*` entries in
`pipeline/assets/manifest.json` and an addendum in `research/reports/license-report.md`.

Build: `sh pipeline/build.sh $S/x.html && python3 pipeline/add_cars2.py $S/x.html` (two builds byte-identical).

## 1. Fleet

Comparison sheet: `research/prototypes/vehicles/fleet/compare.png` (each fleet model next to the procedural car it replaces,
same camera as `playtest.mjs`'s car close-up, same paint, then the rejected candidates). Close-ups (front 3/4, side, rear 3/4)
of every model: `research/prototypes/vehicles/fleet/shots/` (written by `test_cars2.mjs`).

One style family: the Quaternius Cars Pack is the core (realistic proportions, real arches, separate wheels, named
materials). The classes it lacks come from flat-shaded models of the same tier; their glass, lamps and trim are recoloured to
the same palette, every body takes the game's paint colours.

| key | class | source | licence | tris (body + 4 wheels) | draw calls | size (m) | traffic share |
|---|---|---|---|---|---|---|---|
| `estate` | 80s/90s estate | Poly by Google "Car" | CC-BY 3.0 | 2,050 | 3 | 4.55 x 1.72 x 1.42 | 4/22 |
| `estate80` | boxy 80s estate | Poly by Google "Van" | CC-BY 3.0 | 1,946 | 3 | 4.8 x 1.8 x 1.55 | 2/22 |
| `sedan` | saloon | Quaternius Cars Pack "Car" | QAL v1.0 (CC0) | 2,952 | 3 | 4.6 x 1.76 x 1.42 | 3/22 |
| `saloon90` | 90s saloon (player's car) | Quaternius Cars Pack "Sports Car" (orange) | QAL v1.0 | 3,066 | 3 | 4.45 x 1.72 x 1.38 | 3/22 |
| `hatch` | 5-door hatchback | Quaternius Cars Pack "Car" (hatch) | QAL v1.0 | 3,124 | 3 | 4.0 x 1.7 x 1.45 | 3/22 |
| `liftback` | liftback; also the police Škoda stand-in | Quaternius Cars Pack "Sports Car" (white) | QAL v1.0 | 3,148 | 3 (+4 police parts, as before) | 4.62 x 1.8 x 1.46 | 2/22 |
| `suv` | compact SUV / crossover | Quaternius Cars Pack "SUV" | QAL v1.0 | 3,294 | 3 | 4.5 x 1.84 x 1.68 | 2/22 |
| `van` | panel van | PuKkBuMXDD "Generic Van" | CC-BY 3.0 | 3,225 | 3 | 4.9 x 1.9 x 1.98 | 1/22 |
| `truck` | small box truck | Quaternius Zombie Apocalypse Kit "Truck" | QAL v1.0 (CC0) | 5,330 | 3 | 5.6 x 2.05 x 2.75 | 1/22 |
| `pickup` | pickup | Quaternius Zombie Apocalypse Kit "Pickup Truck" | QAL v1.0 (CC0) | 4,288 | 3 | 5.1 x 1.85 x 1.75 | 1/22 |

Cars are 4.0-4.9 m (brief: 3.9-5.0). Draw calls are per car: paint, trim, lamps. The four wheels of every car of one model
are one InstancedMesh draw for the whole town (at most 10 wheel draws per frame). The procedural car was 8 meshes.

Rejected (rendered in the bottom rows of the sheet, files in `research/assets/vehicles/rejected/`, reasons in its SOURCE.md):
KayKit stationwagon (toy proportions, the Kenney/KayKit family), Quaternius police (US livery; the liftback with the game's
own livery reads closer to an Octavia), Quaternius taxi (the sedan plus a sign), Poly van (chunky, 5.6k tris), jeremy minibus
(open interior, no glass), two 12 m coaches (the car physics has one 4-wheel chassis with the Audi's footprint; a bus clips
through every corner, so "1 bus if available" is not met). Kenney's Car Kit was not fetched (kenney.nl blocks scripts,
itch.io needs a browser) and is the same chunky family as KayKit. No trademarked brand models: the sources are generic.

## 2. Preparing the GLBs (`research/assets/vehicles/fleet/build.py`)

Python 3 + Pillow, no npm (`glb.py` is a 120-line glTF reader). Per model: bake node transforms; sample palette textures into
vertex colours; map materials (or palette colours) to paint / glass / trim / lamps; find the wheels (named nodes, the rear
pair split by side; on the merged Google meshes, islands that touch the ground and are round in side view, plus the rims
inside them); turn the nose to +z; stretch the body to real dimensions; keep each wheel round (uniform scale, `wr` shrinks
the oversized Google/Zombie-kit wheels); put the hubs at the wheel radius so tyres touch y=0. The truck and pickup borrow the
sedan's 420-triangle wheel (their own were 956 each). Output per model: meshes `paint` (white = full body colour, .82 for a
second shade), `trim` (final colours, glass with the game's sky gradient), `lamps`, `wheel` (one, centred on its hub, outer
face +x), hub nodes, `extras {r, axles, track, dims}`. int16 mm positions (KHR_mesh_quantization), int8 normals, uint8
colours: 717 KB for all ten, 957 KB as base64. No meshopt/Draco: decoding them needs async loaders, and the cars must exist
synchronously when `startWorld` spawns them at boot (see 3). The files open in any glTF viewer.

## 3. Seam

`pipeline/cars2.js`, spliced before `// ---------- boot ----------`; `add_cars2.py` renames four functions and asserts that
`add_assets.py` embedded the `car2_*` blocks.

- **Decode at boot, synchronously.** `CARS2` reads the `asset_car2_*` base64 blocks with its own 15-line GLB reader into
  `BufferGeometry`s (no GLTFLoader, no addon import, no promise), so the first `spawnCars()` already makes GLB cars. Off on
  `PHONE` or if the blocks are missing: every wrapper then falls through to the procedural path.
- **Fleet arrays edited in place.** `TRAFFIC_GEOS` becomes the weighted fleet (22 entries), `LOT_GEOS` the 10 unique parked
  twins. Each fleet entry is a `G` object with the procedural one's fields (`paint`, `trim`, `axles`) plus `lamps`, `wheel`,
  `r`, `track`, `glb:true`. A swap map turns `carGeo` (player default) into `saloon90`, `skodaGeo` into the police liftback,
  and any other procedural geometry into `estate`.
- **`makeCarMesh(color,G)` (wraps `makeCarMesh0`).** Same object shape for every other system:
  `g.userData.body.children = [paint, trim, head, tail, lamps]`.
  - `[0]` paint mesh: `carMats[color]` Phong (vertex colours), or `policeM` for the police; dent, debris colour, respray
    (`children[0].material=`), drive.js's `susOf` bounding box all work on it unchanged.
  - `[1]` trim mesh with the shared `trimM`.
  - `[2]` head and `[3]` tail are empty `Object3D` stand-ins: `breakLamps`/`fixCar` toggle their `.visible`, drive.js
    assigns its cloned tail material to `children[3].material` and sets its colour for the brake light. `tail.material` starts
    as the shared `tailM`.
  - `[4]` one lamps mesh (unlit, per-car material clone sharing one program): `onBeforeRender` reads the stand-ins, head
    lamps x (head visible ? 1 : 0), tail lamps x tail.material.color x (tail visible). Smashed lamps go dark.
  - `g.userData.wheels`: four empty pivots in the procedural order (FL, FR, RL, RR; left at x<0 turned 180 deg), at the
    model's track and axles. `syncCar` spins/steers them, `poseCar` droops them exactly as before.
- **Wheels drawn by instancing.** `scene.onBeforeRender` (guarded against the nested water-reflection render) copies the pivot
  matrices of each visible car inside the camera frustum into its model's `InstancedMesh`, adding `r - WHEEL_R` to the pivot height so any wheel size
  sits on the ground; hidden cars (perfTick > 400 m, views.mjs, water reflection) get none. Cars register through
  `added`/`removed` events, so removed cops and rebuilt worlds leave nothing behind. Capacity 96 cars per model.
- **Police.** `policeExtras` runs as before; its hood lettering and bar are moved to this roof/hood height (read from the
  paint mesh). `spawnCop`/`makeCop` are wrapped to put the red/blue `c.bar` on the roof. `policeM`'s green band shader fits
  the liftback's doors unchanged; flashing, `copDown` and `removeCop` untouched.
- **Parked cars.** `addParkedCars` (wraps `addParkedCars0`) assigns each car a weighted model (hash of its position, so it
  is stable), then hides the 8-sided stand-in wheels the original adds, because each parked twin's trim already carries the
  model's four wheels. Per model: paint + trim + the hidden wheel mesh = 3 InstancedMeshes (2 drawn); the far silhouette
  beyond 120 m is unchanged.
- Untouched: `driveCar`, `syncCar`, `ride/poseCar`, collisions, traffic AI, sinking, tipping, smoke, drive.js, pedestrians,
  facades, renderer, fight code. `CREDITS_CARS` holds the CC-BY credit line.

## 4. Tests

`work/test_cars2.mjs` (SwiftShader; holds the page's frame loop with `mapOpen` so the player's car is not driven between
checks), on the full build + `add_cars2.py`:

```
assetsDecode {"ok":true,"models":10,"tris":{"estate":2050,"estate80":1946,"sedan":2952,"saloon90":3066,"hatch":3124,"liftback":3148,"suv":3294,"van":3225,"truck":5330,"pickup":4288}}
glbBacked {"ok":true,"player":"saloon90","traffic":26,"glbShare":1,"all":82,"allGlb":82}
drawCallsPerCar {"ok":true,"meshes":3}
wheelsSpinAndSteer {"ok":true,"spinPerMetre":[-3.333,3.333,-3.333,3.333],"steer":[0.28,0.28,0,0]}
wheelsDrawnOnGround {"ok":true,"tyreBottomAboveGround":[-0.005,-0.011,0.011,0.005],"instances":152,"visibleCars":82}
brakeLights {"ok":true,"tail":[0.55,1.8,0.55],"lampUniform":[0.55,1.8]}
breakAndFixLamps {"ok":true,"broken":[0,0],"fixed":[1,1]}
policeBar {"ok":true,"model":"liftback","roof":1.664,"bar":[1.729,1.729],"box":1.724}
parkedInstancing {"ok":true,"models":10,"meshes":31,"maxPerModel":3,"parked":1097,"cylinders":10,"cylVisible":0}
dentAndRepair {"ok":true,"movedCoords":672}
smokeWhenHurt {"ok":true,"visibleSmoke":10}
tipsOver {"ok":true,"maxRollRad":3.08}
shots 30 in research/prototypes/vehicles/fleet/shots/
sinksInWater {"ok":true,"drop":-0.42,"after":"foot"}
errors []
PASS
```

Existing tests on the same build:

```
test_drive.mjs (all 13 checks ok; excerpt):
setup {"ok":true,"audio":"running","gear":1}
brakeLightsChange {"ok":true,"idle":0.55,"braking":1.8,"released":0.55,"glowOpacity":0.9,"note":"tail material is MeshBasic, so colour (not emissive) is the lamp level"}
damageSagAndSmoke {"ok":true,"hp03":{"roll":0.042,"heave":-0.03,"pitch":0.021},"wispsAtHp07":18,"rollAfterRepair":0}
headlightsAtNight {"ok":true,"onIntensity":[260,260],"whenSmashed":0}
errors []
PASS

test_solid.mjs:
PASS peds clear of solids {"checked":990,"nearWorldSolids":0,"offenders":[]}
PASS walking into each new solid {"tried":409,"of":411,"offenders":[]}
PASS pole falls at 12 m/s {"at":[-110.4,-87.4],"down":true,"falling":1,"tilt":1.26,"hp":0.924,"closest":0.07}
PASS signal falls at 12 m/s {"at":[-306,-222.8],"down":true,"falling":1,"tilt":1.5,"hp":0.925,"closest":0.06}
PASS bus-stop sign falls at 12 m/s {"at":[-273.6,-187.8],"down":true,"falling":1,"tilt":1.48,"hp":0.925,"closest":0.02}
PASS pole stays up at 3 m/s {"at":[-277.6,-204.2],"down":false,"falling":0,"tilt":0,"hp":1,"closest":2.46}
PASS no page errors []
all passed

playtest.mjs: car_front/nose/rear/side, cop, drift, person PNGs written, errors []
  drift base  {speedBefore 16.6, speedAfter 14.1, maxSlipDeg 48.4, slidingFrames 30, skidQuads 57}
  drift cars2 {speedBefore 16.6, speedAfter 14.1, maxSlipDeg 48.4, slidingFrames 30, skidQuads 57}   identical
```

## 5. Performance and size

| | build.sh (no cars2) | + cars2 |
|---|---|---|
| `work/fps.mjs` Metal fps, 3 alternating runs | 60.3 / 60.3 / 60.3 | 60.3 / 60.3 / 60.3 |
| load (same runs, ms) | 1306 / 1287 / 1650 | 1683 / 1281 / 1265 |
| JS heap | 289 MB | 289 MB |
| one car in a close-up: draw calls, all passes (SwiftShader `renderer.info`, cheapest of 6 renders) | 12 (Audi 80: 8 meshes) | 8 (saloon90: 3 meshes + 1 shared wheel draw) |
| one car: triangles drawn | 5,660 | 4,440 |
| street view behind the start car, 82 cars in `world.cars`: draw calls for cars | 155 | 86 |
| same view: car triangles | 74.6k | 74.1k |
| HTML | 5,911,852 B | 6,900,700 B (+988,848: 979,979 B base64 GLBs + 8.9 KB JS) |

Baseline 60.3 fps is the vsync cap; the brief's floor is 55. Decode is synchronous at boot (10 small GLBs, no loaders);
load times are within run-to-run noise. Embedded: 717 KB raw, 957 KB base64 (budget 2 MB). Wheel instances are culled per
car against the camera frustum, so off-screen cars cost no wheel triangles.

## 6. Limitations

- Physics is unchanged, so every model drives on the Audi's chassis: contact points at ±.74 m / axles 1.33 and -1.22 m,
  corners and roof at 1.4 m, 1.1 m collision radius. The 5.6 m, 2.75 m tall truck and the van roll over and bump like a
  saloon; a bus is out for the same reason.
- No number plates: the procedural cars drew Lithuanian plates; these models have plate recesses in black. A per-model plate
  position table in build.py would add them (a colour heuristic picked grilles too, so it was dropped).
- Style is one tier, not one author: the two Poly by Google estates have round lamps and chrome bumpers (older, boxier),
  the Generic Van is a little cartoonish even after squeezing it to real dimensions.
- Smashed lamps go dark instead of disappearing. Parked cars beyond 120 m keep the generic procedural silhouette.
- Wheel instancing caps at 96 cars per model (the town has 82 cars in `world.cars`, 27 of the most common model); beyond
  that a car loses its wheels. `scene.onBeforeRender` is now taken; a later step that needs it must chain.
- The police lettering sits at the procedural hood angle (.18 rad), close to the liftback's but not measured.
- **Clean clone:** the manifest points at `research/assets/vehicles/fleet/built/*.glb`, which `.gitignore` excludes
  (`research/assets/**/*.glb`), the same situation as the characters. A fresh checkout must re-download the packs (URLs and
  sha256 in each SOURCE.md) and run `python3 -I fleet/build.py fleet/built` before `build.sh`.
- The `assets` step now embeds the fleet (957 KB) whether or not `cars2` runs, so add both together.

## 7. Integration note

Append `cars2` to the step list in `pipeline/build.sh` after `fight2` (it also runs after `fixgfx`; the anchors are the
four function heads `function makeCarMesh(color,G=carGeo){`, `function addParkedCars(list){`, `function spawnCop(){`,
`function makeCop(x,z,h){` and `// ---------- boot ----------`). It must run after `assets` (asserted). Add
`work/test_cars2.mjs` to the suite. Files added: `pipeline/cars2.js`, `pipeline/add_cars2.py`, `work/test_cars2.mjs`,
`research/assets/vehicles/{quaternius-cars,quaternius-zombie-kit,poly-google,pukkbumxdd-van,rejected}/SOURCE.md` (+ raw
GLBs, gitignored), `research/assets/vehicles/fleet/{build.py,glb.py,SOURCE.md}` (+ `built/*.glb`, gitignored),
`research/prototypes/vehicles/fleet/{compare.mjs,compare.png,shots/}`, this report.
