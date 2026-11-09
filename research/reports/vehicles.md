# Vehicles: driving feel and sound (2026-11-09)

Files added: `pipeline/drive.js`, `pipeline/add_drive.py`, `work/test_drive.mjs`, `research/prototypes/vehicles/{rapier.html,night_head.png,night_brake.png,rapier_headless.png}`, this report. Nothing existing was edited. Build: `sh pipeline/build.sh $S/x.html && python3 pipeline/add_drive.py $S/x.html`.

## 1. Current model (before this round)

1. `driveCar` is arcade: speed scalar `c.speed`, heading `c.h`, travel direction `c.trav` that chases `c.h` at a grip rate; `slip=h-trav`.
2. `SURF[gnd]` = `{max,acc,grip,drag}`: gravel/grass .6/.65/.5/2.2, dirt .8/.85/.7/.7, asphalt 1/1/1/0. Top speed 37 m/s x `SF.max` x damage factor; accel 9.5 x `SF.acc` x (1-v/MAX); brake 20, reverse cap -9.
3. Grip = 30 standing, 1.7 with handbrake, 4 when full-lock above 25 m/s, else 9; scaled by `(1-.3 wet-.5 snow) x SF.grip`. Yaw = steer x (2.9 handbrake / 2.05) x clamp(v/6) / (1+v/30).
4. `sliding` = slip > .17 rad above 5 m/s, or handbrake above 9, or braking from above 15 m/s. Drives skid quads and smoke (`tyreFX`) and the tyre noise.
5. Damage: `hp` 0..1. Below .6 a random-sign steering pull; max speed falls to 70% at hp 0; hp 0 = `dead`. `dent()` deforms the paint mesh, `breakLamps()` hides a lamp mesh, `fumes()` smokes grey below .55 and black below .25.
6. Collisions: `collideCar` (segment grid of building walls, 8 m props grid, wall segments) at two points 1.25 m fore/aft; impact above 8 m/s calls `hit/hurtCar/crashFX`, bounces `speed*=-.22`.
7. Important correction to the brief: the chassis is not a flat `syncCar` pose any more. `syncCar` samples 4 terrain points for pitch/roll, and `ride()/poseCar()` (v37) is already a 12-point spring-damper rigid body: pitch from longitudinal accel, roll from lateral accel, wheel droop, air time, tipping over. Camera follows `player.x/z` and `GY`, not `c.g`, so it never inherits body motion.
8. Audio already had: a looped 4-cylinder pulse buffer pitched by rpm (6 speed bands = gears, rpm sawtooth), tyre noise by slip, wind, gravel loop, `sCrunch/sThud` by closing speed in `crashFX`.
9. Headlight cones and ground pools (`beamM`, `poolM`) already existed on every car at night; brake lights, per-model suspension stiffness, wet-road sound, gear-shift dip, damage sag and a real light source did not.
10. Net: most of item 2 and 3 of the brief existed; I added what was missing as a layer on top rather than replace it.

## 2. What changed

`drive.js` is spliced before `// ---------- boot ----------` and wraps four functions by rename (`driveCar0`, `walk0`, `collideCar0`, `updateAudio0`). `syncCar` is not touched: the body layer lives on the `body` child group, which `syncCar/poseCar` never write, so no wrap was needed.

- **Sprung body (player car only)**: second spring-damper stage on `userData.body` (pitch, roll, heave) over the existing chassis ride. Pitch target from smoothed longitudinal accel, roll from lateral accel, heave from the chassis' vertical acceleration (`ride.vy`), so curbs and landings ring a second time. Stiffness from the model's paint-geometry height: `soft=clamp((H-1.35)/.35)`; natural frequency 2.5 Hz (low saloon) to 1.6 Hz (RAV4/Sportage), damping ratio .36 to .29, lean gain up to 1.9x. Impacts kick pitch/roll/heave velocity by closing speed. On foot the spring settles to rest.
- **Damage visuals**: below hp .75 the body sags (roll to the side of `sagSide`, heave down, nose dip), proportional to missing hp; repair returns it to zero. New light grey wisp stage for hp .55 to .8 (existing smoke starts at .55).
- **Brake lights**: player car gets its own clone of `tailM`; colour .55 idle (.8 at night) to 1.8 braking (S, or handbrake while moving) plus two additive glow sprites. Per-car material so traffic is unaffected.
- **Headlights**: two real `SpotLight`s on the player car, 260 cd, 60 m, angle .5, penumbra 1, on when night is above .35 (smoothstep), off when `lampsOut`, dead, or on foot. Skipped on `PHONE`. The old cone/pool meshes stay.
- **Audio**: sawtooth engine body oscillator at rpm/30 Hz (firing frequency) under the existing pulse loop; gear-shift torque cut (.16 to .26 s) with a clunk and hiss on throttled upshifts, shift hysteresis so a cruise at a band edge does not flap; tonal tyre squeal (sawtooth, bandpass) from the `sliding` state, pitched by speed and slip, 70% quieter off asphalt; wet-road hiss loop scaled by `ENV.wet` and speed on asphalt; gravel stone crackle by speed on gnd<2 (the loop already existed); `collideCar` wrapper adds a sub-bass thump and low crunch scaled by closing speed (`-(heading . normal) x speed`), debounced 0.3 s, also called for car-vs-car/parked hits via a speed-drop detector.

Not done: CC0 samples (synth was enough, no sound file embedded). Indicators skipped as asked.

## 3. Parameters

| Parameter | Value |
|---|---|
| body spring frequency | 2.5 Hz low car, down to 1.6 Hz SUV |
| damping ratio | .36 to .29 |
| pitch gain | .002 rad per m/s2 x (1..1.9), clamp +-.04 |
| roll gain | .0025 rad per m/s2 lateral x (1..2.1), clamp +-.04 |
| heave | .5 x chassis vertical accel, clamp +-.09 m |
| body pivot height | .35 m |
| sag at hp 0 | roll .07, nose .035, drop .05 m (onset hp .75) |
| brake lamp level | .55 idle, 1.8 braking, glow sprite .9 |
| spotlights | 260 cd, 60 m, .5 rad, penumbra 1, decay 1.5 |
| shift cut | .26 s up, .16 s down, gain floor .3 |
| engine osc | clamp(rpm/30, 28, 190) Hz |
| squeal | up to .045 gain, 780 + 7v + 500 slip Hz |
| wet hiss | up to .1 gain, highpass 3 kHz |
| impact thump | 100 to 55 Hz sweep down to 32 Hz |

## 4. Test output (`node work/test_drive.mjs build.html`, SwiftShader)

```
accelPitchesNoseUpThenSettles  total -0.0508 rad (nose up), body layer -0.0236, drift 1.5 to 3 s: 0.0057 rad  ok
hardBrakePitchesNoseDown       total +0.0813 rad, body +0.0485                                              ok
curbBounceDecays               .16 m step: peak body heave 0.0109 m, 1.5 s later 0.0015 m                   ok
engineFreqRisesWithSpeed       gear 1: 66 -> 110 -> 155 Hz (2, 4.5, 7 m/s); drops to 108 at the 2nd gear      ok
gearShiftCutsTorque            gears 1,2,3,4,5,6, 89 frames of torque cut                                    ok
brakeLightsChange              tail colour .55 -> 1.8 on KeyS -> .55 released, glow .9                      ok
skidGainWhileSliding           sliding, squeal target gain .0257 (node gain read back when ctx running)     ok
damageSagAndSmoke              hp .3: roll .042, heave -.03; hp .7 wisps 19; back to 0 after repair         ok
impactKicksBody                building wall hit, pitch velocity +1.0                                       ok
headlightsAtNight / ByDay      260,260 / 0,0; 0 with lampsOut                                                ok
errors []   PASS
```
Deviation: the brake lamp is `MeshBasicMaterial` (no `emissive`), so the test reads `.color`, which is the lamp level. `work/playtest.mjs` on the drive build: car_front/nose/rear/side, cop, drift, person PNGs written; drift numbers (16.6 -> 14.1 m/s, 48.4 deg, 30 sliding frames, 57 skid quads) are identical to the base build; no errors. Screenshots: `research/prototypes/vehicles/night_head.png`, `night_brake.png`. The hot white blob in front of the car is the pre-existing `poolM`; the spotlights add a soft wider wash.

## 5. Performance

Real GPU (Metal, 1280x720, `fpsm`, vsync-capped): base 60.7 fps, drive 60.7 fps; load 1.0 s vs 1.1 to 2.5 s (single 2.5 s run was disk-cache noise). SwiftShader daytime fps fell from 1.3 to 0.5 because two spotlights are in every Lambert/Phong shader even at intensity 0; that is the cost to watch on weak GPUs, hence the `PHONE` skip. Not measured: fps at night on a low-end GPU.

## 6. Rapier evidence note

Prototype: `research/prototypes/vehicles/rapier.html` (rapier3d-compat 0.14.0 from jsdelivr, `DynamicRayCastVehicleController`, flat plane, 14 dynamic boxes, a ramp, a wall). I could only run it headless: it loads, accelerates (2.7 to 13.6 m/s over 7.5 s in a slow software renderer, so not real time) and hits the wall without errors. I did not play it by hand, so "feel" below is judgement from the controller's known behaviour, not a playtest. Library quirk: the forward-axis setter is spelled `set setIndexForwardAxis`.

What it would take under this game:
- **6,675 building colliders**: the town is currently a segment grid (`collide`) plus 8 m props grid. Rapier needs static trimeshes or per-building cuboid/convex colliders; an extruded footprint is concave, so either ~6.7k trimesh colliders (memory in the tens of MB) or one merged trimesh per 100 m tile loaded as the player moves. 1 to 2 days with tiling.
- **Draped terrain**: a heightfield collider from the LiDAR DEM (one per tile) or the raycast suspension would hit the merged road/terrain meshes through `castRay`. `GY` + `world.surf` (road crown, kerbs) would need baking into that heightfield, or kerbs vanish. 1 day.
- **Props and knockables**: poles/signs/trees that fall (`add_solid.py`) are visual state machines on the 8 m grid; they would become dynamic bodies with joints or be kept as kinematic sensors that trigger the existing fall code. 1 to 2 days.
- **Traffic and police AI** read `c.speed`, `c.h`, `c.trav` and teleport-steer along graph edges; they would need either kinematic bodies for collisions or to stay outside the physics world. Every one of those fields would become derived from a body velocity, so the grip/drift tuning (`SURF`, handbrake slip) would be re-tuned from scratch. 3 to 5 days, and the chase and race balance tests would need re-baselining.
- **Pipeline**: Rapier is 2 MB of wasm; the game is a no-bundler single HTML, so it must be base64-embedded (+~2.7 MB) or loaded from the CDN, which breaks offline play.

What the player would gain: true rollovers, car-to-car momentum exchange, boxes and cones that tumble, wheels leaving the ground individually. What they would lose: the deterministic arcade handling the playtests and police pursuit were balanced on.

Recommendation: do not integrate. The existing `ride()` chassis already has contact springs, air time, tipping and landing thuds, and this round's layer adds per-model body motion at no measurable fps cost. If real vehicle-vs-vehicle momentum is wanted later, pilot Rapier only for a separate arena/stunt map with a handful of colliders, not the town.

## 7. Integration note

Step `drive`, after `voice` in `pipeline/build.sh`: `for s in importmap cars solid talk fight people2 animals streets voice drive`. It renames four anchors (`function driveCar(c,dt){`, `function walk(dt){`, `function collideCar(x,z,r,c){`, `function updateAudio(playing){`), so any step that patches the bodies of those functions by anchor must run before `drive` (the `add_solid.py` wall branch is inside `driveCar`'s body and is unaffected). It also relies on `drawMini` hook-free; tests inject at `function drawMini(){` as usual. Known limits: body layer is the player's car only (AI cars keep chassis-only ride); brake light applies to the car you are in; headlights follow the player's car and are off on foot.
