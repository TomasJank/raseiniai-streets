# drive3: every car drives like itself, and speed bumps (2026-11-15)

Owner's requests: "car speed should differ by car", and speed bumps ("gulintys policininkai"), usually with zebra stripes on them.

Files: `pipeline/drive3.js`, `pipeline/add_drive3.py`, `pipeline/drive3/perf.json` (specs), `pipeline/drive3/bumps.json` (bump list),
`work/test_drive3.mjs`, pictures in `research/prototypes/vehicles/drive3/`. `drive3` sits between `carsound` and `hud2` in
`pipeline/build.sh` (the one edit to that file). `fleet.json` and `add_cars4.py` are untouched: the specs live in `pipeline/drive3/`.

## 1. Per-car performance

### How it was before
Every car: top speed 37 m/s x surface x damage, pull 9.5 x surface x (1 - v/MAX), brake 20 m/s2, wall bounce -0.22, the same grip,
car-vs-car shove 60/40 regardless of size. Traffic eased toward 8-13 m/s at +4/-12 m/s2; the police toward 24 + 2.5 x stars
(+6 far away) at +10/-20 m/s2, i.e. the same pull at every speed. Engine sound: one set of gear bands [8, 15, 22, 29, 37] m/s for every car.

### Mapping specs onto the arcade model
The model shape stays (pull = A x (1 - v/T)); only the numbers become per car. The start car keeps today's numbers and every other
car scales from it, compressed so differences are felt but the slowest stays drivable:
- top speed T = 37 x (top / 177)^0.8 m/s (177 km/h = the Audi 80 2.0's real top). The HUD shows m/s x 3.6, so T x 3.6 is the "km/h" the player sees.
- pull A = 9.5 x (13.6 / t100)^0.6 (13.6 s = the Audi 80's real 0-100).
- brakes = 20 x (1250 / kg)^0.35, clamped 14-23 m/s2 (heavier: longer stops); wall bounce 0.22 x (1250/kg)^0.5 (heavier bounces less).
- car vs car: the overlap is split by mass (equal masses give today's 60/40), the hitter keeps more speed when heavier, and the shove
  carHitCar gives the other car is scaled by 2 x m_self/(m_self + m_other) (a van pushes a Punto about 1.4x as far as before, a Punto pushes a van about 0.6x).
- grip: rear-drive cars lose up to 15% grip with power-to-weight above 60 kW/t (E34 0.89, E46/E90 0.94, everything else 1.0), so they drift more easily.
- traffic: cruise x sqrt(T/37), pull min(4, 0.6 x A(1 - v/T)), brakes 0.6 x the car's brake.
- police (Skoda Octavia II 1.9 TDI): its own curve, capped at its T, no longer a flat 10 m/s2 at every speed. T 39.5 m/s and 0-100 in 4.64 s against the Audi's 37 m/s and 5.41 s.
- In game the scaling compresses the real spread: real 0-100 runs 7.9-18.5 s, game 3.4-9.0 s; real top 141-230 km/h, game 111-164 "km/h".
  The Sprinter is the slowest at 111 km/h and 9 s to 100, still drivable; the E34 is the fastest at 164 km/h and 3.4 s.

The edits are text swaps in the built page (each anchor asserted unique): `MAX=37*` -> per-car T, `9.5*SF.acc` -> A, the brake 20,
the grip line, the wall bounce, the car-vs-car shove (driveCar0); the traffic speed line (updateTraffic); the police speed line
(driveCop); the route bus's `target=9` (bump slow-down only); the gear bands of drive.js, updateAudio0 and carsound. carHitCar, ride
and spawnCars are wrapped at run time, and carsound's `csGear`/`csWant` are replaced at run time with versions that take the car.

### Engine sound
Each car's gears and ratios drive the gear bands (upshift where that gear reaches the shift rpm: petrol 93% of 5600, diesel 95% of
4000 at top speed in top gear) and the rpm (rpm = rpm at top x v/T x ratio/top-gear ratio). Diesel or petrol now follows the spec
(`CS.DIESEL` is rebuilt from it): diesel = Corolla 2.0 D estate, Sprinter, A4 TDI, Zafira DTI, V70 TDI, W124 200 D, W210 220 CDI,
Megane dCi, 406 HDi, police Octavia TDI, the bus; petrol = the rest (the Passat B3 is now the 1.8 petrol the brief named, before it played diesel).
Gear bands in m/s: Sprinter 5.1 / 9.4 / 15.7 / 23.1, Audi 80 7.7 / 12.9 / 20.9 / 28.9, E34 10.1 / 17 / 25.6 / 34.2; E90 and Megane have six gears.
The clips are unchanged.

### Specs, game values and what the game measured
Measured = `test_drive3` perModelTopAndAccel: each model as the player's car, full throttle from rest for 45 s at 1/60 s steps on a
straight with asphalt and collisions switched off (the town has no 600 m straight); "game 0-100" is the time to 27.78 m/s on the HUD.
All 21 drivable models within 1% of the values set (the test allows 10%).

| model | variant | top km/h | 0-100 s | kg | gears | fuel | ratios | game T m/s | game A | brake | bounce | grip | game 0-100 set | measured top | measured 0-100 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| e34 | BMW 525i 24V E34 192 hp, 5MT | 230 | 8.6 | 1480 | 5 | p | assumed | 45.63 | 12.51 | 18.9 | 0.2 | 0.89 | 3.42 | 45.63 | 3.42 |
| e90 | BMW 320i E90 150 hp, 6MT | 220 | 9.0 | 1395 | 6 | p | assumed | 44.03 | 12.17 | 19.2 | 0.21 | 0.94 | 3.61 | 44.03 | 3.6 |
| e46_roh | BMW 320i E46 150 hp sedan, 5MT | 219 | 9.9 | 1365 | 5 | p | sheet | 43.87 | 11.49 | 19.4 | 0.21 | 0.94 | 3.83 | 43.87 | 3.83 |
| accord7 | Honda Accord VII 2.0 i-VTEC 155 hp, 5MT | 217 | 9.2 | 1320 | 5 | p | assumed | 43.55 | 12.01 | 19.6 | 0.21 | 1 | 3.68 | 43.55 | 3.68 |
| punto1 | Fiat Punto I GT 1.4 Turbo 133 hp, 5MT | 205 | 7.9 | 1000 | 5 | p | assumed | 41.61 | 13.16 | 21.6 | 0.25 | 1 | 3.48 | 41.61 | 3.48 |
| v70 | Volvo V70 2.5 TDI 140 hp, 5MT | 200 | 10.2 | 1538 | 5 | d | assumed | 40.8 | 11.29 | 18.6 | 0.2 | 1 | 4.13 | 40.8 | 4.13 |
| w210 | Mercedes W210 E 220 CDI 125 hp, 5MT | 200 | 11.2 | 1415 | 5 | d | assumed | 40.8 | 10.67 | 19.2 | 0.21 | 0.99 | 4.37 | 40.8 | 4.37 |
| a4_b55 | Audi A4 B5 Avant 1.9 TDI 110 hp, 5MT | 192 | 11.5 | 1285 | 5 | d | assumed | 39.49 | 10.51 | 19.8 | 0.22 | 1 | 4.57 | 39.49 | 4.57 |
| octavia2_pol | Skoda Octavia II 1.9 TDI 105 hp, 5MT (police) | 192 | 11.8 | 1320 | 5 | d | assumed | 39.49 | 10.34 | 19.6 | 0.21 | 1 | 4.64 | 39.49 | 4.63 |
| p406 | Peugeot 406 2.0 HDi 110 hp sedan, 5MT | 190 | 12.5 | 1410 | 5 | d | assumed | 39.16 | 9.99 | 19.2 | 0.21 | 1 | 4.84 | 39.16 | 4.83 |
| megane2_gt | Renault Megane II Grandtour 1.5 dCi 106 hp, 6MT | 185 | 11.4 | 1260 | 6 | d | assumed | 38.33 | 10.56 | 19.9 | 0.22 | 1 | 4.68 | 38.33 | 4.68 |
| primera | Nissan Primera P11 1.6 16V 99 hp, 5MT | 180 | 12.0 | 1090 | 5 | p | assumed | 37.5 | 10.24 | 21.0 | 0.24 | 1 | 4.94 | 37.5 | 4.93 |
| audi80 | Audi 80 B4 2.0 E 90 hp, 5MT (start car) | 177 | 13.6 | 1190 | 5 | p | sheet | 37 | 9.5 | 20.3 | 0.23 | 1 | 5.41 | 37 | 5.42 |
| zafira_a | Opel Zafira A 2.0 DTI 16V 101 hp, 5MT | 175 | 14.0 | 1495 | 5 | d | assumed | 36.67 | 9.34 | 18.8 | 0.2 | 1 | 5.57 | 36.66 | 5.57 |
| passat_b3 | VW Passat B3 1.8 90 hp sedan, 5MT | 172 | 14.2 | 1155 | 5 | p | assumed | 36.16 | 9.26 | 20.6 | 0.23 | 1 | 5.71 | 36.16 | 5.7 |
| sedan79 | Toyota Corolla E100 1.3 XLi 75 hp (generic 1990s saloon) | 170 | 12.8 | 965 | 5 | p | assumed | 35.82 | 9.85 | 21.9 | 0.25 | 1 | 5.43 | 35.82 | 5.43 |
| p206_2000 | Peugeot 206 1.4 75 hp, 5MT | 170 | 13.8 | 950 | 5 | p | assumed | 35.82 | 9.42 | 22.0 | 0.25 | 1 | 5.68 | 35.82 | 5.68 |
| wagon79 | Toyota Corolla E100 2.0 D 72 hp wagon (generic 1990s estate) | 165 | 14.1 | 1135 | 5 | d | assumed | 34.98 | 9.3 | 20.7 | 0.23 | 1 | 5.95 | 34.98 | 5.95 |
| w124 | Mercedes W124 200 D 75 hp, 5MT | 160 | 18.5 | 1430 | 5 | d | assumed | 34.13 | 7.9 | 19.1 | 0.21 | 1 | 7.27 | 34.13 | 7.27 |
| ibiza2 | Seat Ibiza 6K 1.4 60 hp, 5MT | 157 | 15.0 | 895 | 5 | p | assumed | 33.62 | 8.96 | 22.5 | 0.26 | 1 | 6.57 | 33.62 | 6.57 |
| sprinter | Mercedes Sprinter 311 CDI 109 hp Kombi, 5MT | 141 | 18.5* | 2040 | 5 | d | assumed | 30.85 | 7.9 | 16.8 | 0.17 | 1 | 9.02 | 30.85 | 9 |
| aero_bus | Hyundai Aero Space coach, 6MT | 116* | - | 12000* | 6 | d | assumed | (scripted 9 m/s) | - | - | - | - | - | - | - |

Not driven: the route bus (scripted, not enterable; its spec feeds only its engine gears and the bump slow-down), the parked PAZ
(`ps1_bus`) and KamAZ (static meshes with wall outlines, never cars, so they cannot be driven). `sedan79`/`wagon79` are an unnamed
low-poly saloon and estate ("Model 79"); they look like a mid-1990s Corolla, so they take Corolla E100 specs.

### Sources (every number above; all catalogue aggregators, not manufacturer sheets, so treat them as +-5%)
- Audi 80 B4 2.0 E: auto-data.net (177 km/h, 13.6 s, 1190 kg) https://www.auto-data.net/en/audi-80-b4-typ-8c-2.0-90hp-4563 ; ratios 3.55/2.11/1.30/0.94/0.79 from Audiworld https://www.audiworld.com/model/80/91-80.shtml
- VW Passat B3 1.8: autodata1 (172 km/h, 14.2 s, 5MT) https://www.autodata1.com/en/car/volkswagen/passat/passat-b3-b4-18-90-hp/m:amp ; 1155 kg auto-data.net https://www.auto-data.net/en/volkswagen-passat-b3-1.8-90hp-8960
- Toyota Corolla E100 1.3 XLi: auto-data.net (170 km/h, 12.8 s, 965 kg) https://www.auto-data.net/en/toyota-corolla-vii-e100-1.3-xli-75hp-3349
- Toyota Corolla E100 wagon 2.0 D: auto-data.net (165 km/h, 14.1 s, 1135 kg, 5MT) https://www.auto-data.net/en/toyota-corolla-wagon-vii-e100-2.0-d-72hp-3362
- Nissan Primera P11 1.6: auto-data.net (180 km/h, 12 s, 1090 kg) https://auto-data.net/en/nissan-primera-p11-1.6-16v-99hp-614 ; 5MT AutoHints https://www.autohints.com/nissan-primera-p11-1.6-16v-99-hp-version-28080
- Seat Ibiza 6K 1.4: cars-data.com (157 km/h, 15.0 s, 895 kg) https://cars-data.com/en/seat/ibiza/1996-hatchback-7231/1-4i-e--15369/specs
- Mercedes Sprinter 311 CDI: 141 km/h ultimatespecs https://www.ultimatespecs.com/car-specs/Mercedes-Benz/154643/Mercedes-Benz-Sprinter-2000-L1-Kombi-311-CDI--35t.html ; 2005-2025 kg (L1H1 Kombi) and 109 PS https://www.ultimatespecs.com/car-specs/Mercedes-Benz/M16086/Sprinter-2006-L1H1-Kombi ; 5MT carsales https://www.carsales.com.au/research/mercedes-benz/sprinter/2005/311cdi . *No published 0-100 found (ADAC and autoplenum list none); 18.5 s is my estimate from its hp/t, equal to the W124 200 D's.
- Audi A4 B5 Avant 1.9 TDI 110: cars-data.com (192 km/h, 11.5 s; 1285 kg early FWD) https://cars-data.com/en/audi/a4/1996/avant-1-9-tdi-110hp-12385--12385/specs
- BMW 320i E46 (1998): cars-data.com / auto-data.net (219 km/h, 9.9 s, 1365 kg) https://www.auto-data.net/en/bmw-3-series-sedan-e46-320i-150hp-9982 ; ratios 3.67/2.00/1.41/1.00/0.74 Carsopedia https://carsopedia.com/en/catalog/bmw/3-series/e46-sedan/320i-13880/
- BMW 525i 24V E34: auto-data.net (230 km/h, 8.6 s, 1480 kg, 5MT) https://www.auto-data.net/en/bmw-5-series-e34-525i-24v-192hp-9672
- BMW 320i E90: auto-data.net / cars-data.com (220 km/h, 9.0 s manual, 1395 kg, 6MT) https://www.auto-data.net/en/bmw-3-series-sedan-e90-320i-150hp-9929 , https://www.carsales.com.au/research/bmw/3-series/2006/320i
- Opel Zafira A 2.0 DTI: autodata1 (175 km/h, 14 s; 1495 kg) https://www.autodata1.com/en/car/opel/zafira/zafira-a-t3000-20-16v-dti-101-hp
- Honda Accord VII 2.0 i-VTEC: cars-data.com (217 km/h, 9.2 s) https://cars-data.com/en/honda/accord/cm-2003-sedan/2-0i-sport-27546--27546 ; 1320 kg auto-data.net https://auto-data.net/en/honda-accord-vii-2.0-i-vtec-16v-155hp-12051
- Volvo V70 2.5 TDI: cars-data.com (200 km/h, 10.2 s manual, 1538 kg) https://cars-data.com/en/volvo/v70/1997/tdi-2-5-comfort-line-15984--15984/specs ; auto-abc https://www.auto-abc.eu/volvo-v70/v170-1997
- Mercedes W124 200 D: AutoHints (160 km/h, 18.5 s, 1430 kg, 5MT) https://www.autohints.com/mercedes-benz-w124-facelift-1989-200-d-75-hp-version-25589
- Mercedes W210 E 220 CDI: Carsopedia (200 km/h, 11.2 s; 1415 kg, 5MT) https://carsopedia.com/en/catalog/mercedes/e-class/w210/e-220-cdi-classic-53781/ . The model file is labelled E320; the CDI is what a Lithuanian W210 usually is, and carsound already played it as a diesel.
- Renault Megane II Grandtour 1.5 dCi 106: auto-data.net (185 km/h, 11.4 s, 1260 kg, 6MT) https://www.auto-data.net/en/renault-megane-ii-grandtour-1.5-dci-106hp-10552
- Peugeot 206 1.4: auto-data.net (170 km/h, 13.8 s) https://www.auto-data.net/en/compare?carId1=5249 ; 950 kg autodata1 https://autodata1.com/en/car/peugeot/206/206-facelift-2003-14i-75-hp
- Peugeot 406 2.0 HDi: autodata1 (190 km/h, 12.5 s, 1410 kg, 5MT) https://autodata1.com/en/car/peugeot/406/406-8-20-hdi-110-hp
- Fiat Punto I GT 1.4 Turbo (the model is the GT): auto-data.net (205 km/h, 7.9 s) https://auto-data.net/en/fiat-punto-i-176-gt-1.4-turbo-133hp-6993 ; 1000 kg thecarspec https://thecarspec.net/car-detail/fiat-punto-i-176-gt-14-turbo-133-hp-1993
- Skoda Octavia II 1.9 TDI (police): auto-data.net (192 km/h manual, 11.8 s) https://auto-data.net/en/skoda-octavia-ii-1.9-tdi-105hp-14213 ; 1320 kg base https://www.autodata1.com/en/car/skoda/octavia/octavia-ii-19-tdi-105-hp
- Hyundai Aero Space: engine Q310 (D6AB) per Wikipedia https://en.wikipedia.org/wiki/Hyundai_Aero . *116 km/h is a D6AV figure from the same search, mass and ratios assumed; none of it changes how the bus drives.
- Gear ratios marked "assumed" are typical sets for that gearbox type (VW/Audi 5-speed, Mercedes 5-speed RWD, 6-speed, van, coach), not
  verified per model: only the Audi 80 and E46 sets come from a page. The gear COUNT of every car is from its spec page.

### Chase check (straight line, open ground, one cop 40 m behind, full throttle 12 s; gap every 2 s)
Scratch script `chase.mjs` (scratchpad). Before drive3 every car gave the same numbers.

| car | stars | before (any car) | after |
|---|---|---|---|
| Sprinter (slowest) | 1 | 32 28 34 46 62 80 m | 36 28 25 26 31 37 m: the cop sits on it and only loses ground slowly |
| Sprinter | 3 | 32 18 14 16 21 29 m | 36 26 14 6 4 19 m: caught (ends at 13 vs 10 m/s, ramming range) |
| W124 200 D | 3 | as above | 37 29 20 15 15 16 m: held at 15 m |
| Audi 80 (start) | 1 / 3 | as above | 39 37 43 55 70 88 / 39 36 33 35 40 48 m |
| E34 (fastest) | 1 / 3 | as above | 43 52 72 100 132 167 / 43 51 62 80 102 127 m: pulls away |

The police chase target speed (24 + 2.5 x stars) is unchanged, so on a straight the Audi still edges away at low stars as before; the
Octavia's quicker pull shows out of corners and from rest. A slow stolen car gets caught, a fast one escapes on a straight and has to be
cut off by roadblocks (three stars and up), which is what the owner asked for.

## 2. Speed bumps

### Where they are
Queried again 2026-11-15. OpenStreetMap (Overpass, bbox 55.355,23.08,55.40,23.17): `traffic_calming` 6 table, 1 hump, 2 island (islands
are not bumps). Mapillary `map_features`: 39 `warning--road-bump--g1` + 12 `warning--uneven-road--g1` (same as the brief), clustered
within 110 m into 18 places; 7 of them sit next to an OSM bump. For every OSM bump and every sign-only place I took the Mapillary
frames 7-35 m away facing the spot (`frames.py`, contact sheets) and looked.

Placed (8; `pipeline/drive3/bumps.json`):

| id | kind | zebra | where / evidence |
|---|---|---|---|
| osm1201326587 | table 5 m | yes | town centre (game 14, 12); frames show the zebra |
| osm2027048698 | hump 0.9 m | yes | OSM hump tagged as zebra crossing; no usable frame within 35 m |
| osm4005481715 | table | yes | frames show the zebra by the blocks of flats |
| osm5825696875 | table | yes + teeth | frames show zebra and the white triangle line of a raised crossing |
| osm6952294986 | table | yes | OSM marked crossing table; the frames found are on the main road and do not show it |
| osm13814300916 | table | yes | frames show the zebra at the junction |
| osm14209512326 | table | no, teeth only | frames show a raised table marked only with a white triangle row |
| sign7 (55.38559, 23.11277) | table | no, teeth | 5 bump signs; frame 995539349807449 shows the triangle row about 10 m ahead (placed 10 m along the camera heading, snapped to the road) |

Skipped (no bump visible in the frames I checked): bump-sign places 1 (55.3727, 23.1203), 2 (55.3760, 23.1130), 11 (55.3787, 23.1078),
13 (55.3834, 23.1332), 15/16/17 (rural road at 55.398-55.400, 23.145-23.149, signs only, no marking); "uneven road" sign places 9, 10, 14
(that sign is not a bump). Clusters 0, 3, 4, 5, 6, 8, 12 are the signs of OSM bumps above.

### What they are in the game
- Table: 5 m long (1 m ramps each end, 3 m deck), 8 cm high, across the road width + 15 cm each side. Hump: 0.9 m, 7 cm, cos2 profile.
- One merged mesh for all eight (`D3.mesh`, 2,436 vertices, 1 draw call, vertex colours: deck in the road colour, white 0.5 m zebra
  stripes along the road, white triangle "teeth" up the ramps where the frames show them).
- There was no flat zebra marking in the game to remove (no step draws crossings); where a crossing sits on a table, its stripes are on the deck.
  At osm1201326587 an existing flat white line (a stop/edge line) is now under the deck.
- Their height is added to `world.surf`, which the wheel springs (`ride`), `syncCar`, pedestrians and the player on foot already read,
  so cars roll over them and people walk on the deck with no other change.
- Same-angle sheets (photo | before | after): `research/prototypes/vehicles/drive3/bumps_sheet.jpg` (6 bumps with a frame).

### Driving over
- On the way onto a bump each axle gets one kick through `kick()` (the existing ride state): strength s = D3.K x min(1.3, v/22)^2,
  vertical 1.5 s m/s, pitch 0.8 s (nose up on the front axle, down on the rear), x1.2 for a hump. D3.K = 1 is the one tuning number.
- Player only: camera `shake` = 0.95 s, and `carBumpSound(s)` (front axle full, rear 0.6).
- 72 km/h over the start table: airborne 0.23 s, body 27 cm above its rest height, shake 0.78, sounds 0.82 + 0.49, ride()'s landing thud.
  14 km/h: never airborne, body rises 8.6 cm (the deck itself), shake 0.03, sounds 0.03 / 0.02 (near silent).
- Sequences: `seq_fast.jpg` (72 km/h, every 2 frames, wheels clear of the deck in 6 frames) and `seq_slow.jpg` (14 km/h).
- Traffic slows to 4 m/s at a bump (cap sqrt(vb2 + 6 d) for the 45 m before it), police in a chase to 9 m/s, the route bus to 3 m/s.
  test: a traffic Audi crossed the sign7 table at 4.0 m/s, the same run without bumps at 11.7-12.7 m/s.

## 3. Tests (final build, one at a time, Metal)
Final build = `sh pipeline/build.sh`, 32,063,396 bytes (+14,551 over the pre-drive3 build); built twice, byte-identical.

`test_drive3`: PASS, 10 of 10 (bumpsPlacedOneMesh, perModelTopAndAccel 21 of 21 within 1%, heavierStopsLonger: from 25 m/s
Ibiza 13.7 m, Audi 15.2, W124 16.2, Sprinter 18.3; policeQuickerThanStartCar; aiSlowsBeforeBump; fastPassLiftsAndShakes;
slowPassRocksOnly; pedCrossesTable: 10.7 m in 6.2 s on the 8 cm deck, ends in walk mode 0.27 m from the far kerb; carsoundGears; noErrors).

Follow-up (coordinator): the two tests that encoded the old shared behaviour now read the game's own data, and still fail on a wrong car:
- `test_drive` engineFreqRisesWithSpeed takes its speeds from the player car's own gear bands (`d3Bands`; the old fixed ones on pre-drive3
  builds): rises inside gears 1-3, falls and gains a gear across each shift. PASS (Audi bands 7.7 / 12.9 / 20.9 / 28.9 m/s).
- `test_carsound`: the diesel check uses `D3.P[model].fuel` (the same spec the game reads); the upshift check requires at least half the drop
  the car's own ratio step implies from the rpm it shifted at (the rest is rpm smoothing and speed gained in the 0.3 s window), plus the gain cut.
  To make shifts crisper, the player's engine now holds the shift speed while drive.js's shift timer runs (clutch in), so the rpm falls to
  the new gear at once: drops 4535->3429, 4566->3408, 5107->3930 against implied 1839 / 1753 / 1414. 15 of 15.
- `test_drive3`: the pedestrian check now crosses every one of the 8 bumps (traffic lifted out for the run, the camera moved with the player so
  the crowd follows; a ped the crowd recycles before reaching the deck is swapped for the next nearest). 8/8, 4.5-11.6 s for 8-11 m, on the deck.
- Decks: every frame that shows a table shows asphalt (no pavers or concrete), so the deck keeps the road colour; a dark joint (9 cm, 0.55x
  the deck colour) at the foot and top of each ramp now draws the raised edge. `bumps_sheet.jpg` is the refreshed same-angle sheet.
- Fresh build twice, byte-identical; `test_drive` PASS, `test_carsound` 15/15, `test_drive3` PASS (run twice).
- Earlier full run on the first final build: `test_cars4`, `test_takepark`, `test_solid`, `test_streets` PASS; `test_perf` fails only its
  "4x slower CPU" check, the same on the pre-drive3 build (pre-existing, machine-dependent).

## 4. Gaps
- The deck uses the road's base colour (the frames show asphalt tables); the road has a texture, so the deck reads as a slightly different patch of asphalt.
- Mapillary positions are a few metres off, so at osm5825696875 the game zebra stands farther ahead than in the photo; I kept the OSM node.
- Only two gear-ratio sets are from a page; the rest are typical for the gearbox type. Ratios only shape the sound.
- The Sprinter's 0-100 is an estimate; the bus's top speed and mass are not its own.
- Traffic AI test found a usable straight graph edge only through the sign7 table; the other bumps use the same code path.
- Nobody here can hear: the sound checks are rpm and gear numbers.
