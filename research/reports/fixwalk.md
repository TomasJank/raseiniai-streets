# fixwalk: people through cars, buildings and objects; feet in the ground (2026-11-14)

Owner: "Also ppl still go through cars, buildings or objects sometimes, my feet goes into ground".

## Root causes
1. **Walk-throughs.** The game moves a person, calls `pedPush` on everyone and then draws them (`updatePeople`); the fixpeds building guard ran *after* that, so a person it corrected had already been drawn inside the wall. Followers (`walk` with a `lead`, placed 0.65 m beside the leader with no building check) were drawn inside houses for many seconds at a time, the guard putting them back after every frame. Pedestrians also had no car collision at all: the 28 cars `spawnCars` parks along residential streets stand at `w/2+1.05`, right on the pavement line walkers use (`w/2+0.9`), so walkers passed straight through them, and flee/cross/knock-down went through stopped and moving cars and the bus. Knocked-down people skipped `pedPush` and slid through benches and fences.
2. **Feet.** The MakeHuman body is posed by retargeting rotations from the hidden Quaternius rig and placing its pelvis at its own rest height plus the clip's travel. Its legs and feet then do not end where the rig's do: the rig's sole sits on the ground (lowest rig vertex -0.01 to 0 m), the MakeHuman sole 3-9 cm below it, for the player and townsfolk alike. Not the vertical offset of the rig, not the height scaling, not the ground sampling (the root is exactly on `GY+surf`).

## What changed
- `pipeline/fix_peds.js` (step `fixpeds`): the second block now wraps `pedPush` instead of `updatePeople`, so it acts before anyone is drawn. Everyone except hidden, seated and shop-entering people is kept 0.25 m off building walls (`world.collide`) and out of every car, parked car and the bus (capsule push, the same shape the player's walk uses; the player's own car moving over 2.5 m/s is left to `runOver`). The old guard (back to the last clear spot within 3 m, a walker turns round, else nearest free spot within 6 m, else hide) now runs there too, for every mode. Knocked-down people also get the wall/prop push.
- `pipeline/mhchars.js`: `mhInit` records up to 32 sole vertices per body (bind pose, within 1 cm of the lowest vertex); `mhPose` ends by moving the body so its lowest sole vertex is at the rig's sole (rig foot/ball bone height minus its rest height), and never below the ground at the person's spot. Every near MakeHuman figure, player included, goes through `mhPose`.
- No new step, `build.sh` untouched. Page +1.5 KB.

## Measured (`work/test_fixwalk.mjs`)
Drawn positions (what `poseAt` received), 5 places (start, Maxima, Norfa, bus station, Žemaičio aikštė), 13:00, seeded random. "Stirred" = every 1.5 s someone near the player flees or is knocked down at 3-9 m/s. Through = the person's centre inside a building, a car body (4.2 x 1.6 m), a wall line (<0.1 m) or a prop; touching = the 0.22 m body overlaps one.

| run (40 s per place) | samples | through before | through after | touching before | touching after |
|---|---|---|---|---|---|
| calm | 222,881 / 219,488 | 1,446 (followers in buildings 835, walkers in buildings 610) | 0 | 212 | 5 |
| stirred | 224,499 / 227,084 | 2,094 (walkers 1,180 and followers 733 in buildings, knocked-down in buildings 172, through fences 7) | 0 | 1,053 | 49 |

An earlier 60 s survey, counted on positions after the frame instead of drawn ones, also found walkers inside kerb-parked cars (72-385 samples per run) and crossers inside stopped/moving traffic (42+17); none after.

Feet: lowest drawn vertex minus the ground at the person's spot ("body"); in brackets, minus the ground right under that vertex.

| case | before | after |
|---|---|---|
| player flat stand | -0.060 (-0.062) | 0.000 (-0.003) |
| player flat walk / run | -0.075 / -0.076 | -0.007 / -0.004 |
| player slope (9 %) stand / walk / run | -0.058 / -0.090 / -0.109 | 0.000 / -0.008 / -0.010 (-0.035 / -0.030 / -0.019) |
| player kerb (pavement, surf 0.14) stand / walk / run | -0.056 / -0.070 / -0.096 | 0.000 / -0.007 / -0.002 |
| player jump, landing | -0.054 | 0.000 |
| townsfolk walking (min, n 86 / 221) | -0.071, median -0.049 | -0.027, median -0.001 |
| townsfolk crossing | | -0.024 |

Pictures (opened and checked), `research/prototypes/characters/fixwalk/`: `before_feet.png` (shoe soles cut by the pavement) / `after_feet.png` (whole shoes on it); `before_car.png` (a walker's head and shoulders sticking out of the roof of a kerb-parked car) / `after_car.png` (the walker steps round it on the road side; spawnCars places its cars with `Math.random`, so the two pages picked different cars).

## Gates
RESULTS_PLACEHOLDER

## Still wrong / not done
- On a slope, a foot's far end is up to 3.5 cm into the ground (the body is placed at the ground under its centre; no foot IK). Same for the old rig.
- Seated MakeHuman people: the feet are matched, so the seat contact may shift by a few cm; not measured.
- The far instanced figures were not measured for feet (they are the old rig, unchanged).
- Paving from steps not in the chain (lmsquare, the Blender buildings) was not measured.
- Bodies still brush the bus while walking past it (34-41 samples per stirred run, shallow) and a follower brushes a parked car corner (3-7).
- `spawnCars` still parks its 28 cars on the pavement line; walkers now go round them, onto the road edge.
