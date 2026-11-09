# Animal species

`add_animals.py` splices `pipeline/animals.js` (the core) and then every `pipeline/animals/*.js`, concatenated in
`sorted(glob('animals/*.js'))` order, inside the game IIFE before `function buildExtra(){`. `updateAnimals(dt)` runs
from `updateExtra` every playing frame. `cat.js` is the reference species.

## File rules

- A species file adds `SPECIES.<name>={...}` (one or more) and top-level functions/consts named `<name>_...` only.
  `add_animals.py` fails the build on a name defined in two files or an unprefixed top-level name.
- No THREE objects, no meshes, no edits to other files. Everything visible goes through the shared rigs.
- Top-level code runs at page load, before the world exists: only declarations there, never `world`/`player` reads.
- `cat` is taken (fence cats, day and night). Do not define it again.

## SPECIES fields

| field | type, units | meaning |
|---|---|---|
| `rig` | `'quad'` \| `'bird'` \| `'bat'` | which pooled rig draws it |
| `scale` | m | body length (quad: nose to rump; bird: beak to tail). Bats ignore it |
| `legs` | × body length, default .5 | quad leg length (cat .42, deer ~.8, hedgehog ~.15) |
| `ears` | × default size, default 1 | quad ears; 0 hides them |
| `tail` | × default length, default 1 | quad tail (1 = half a body length); 0 hides it |
| `colours` | `[[main,trim],...]` hex | one palette picked per animal. quad: body/head/tail/ears = main, legs = trim. bird: body = main, wings = trim. Bats are dark points |
| `speed` | m/s | default flee speed (`fleeFrom`) |
| `n` | count, default 2 | most alive at once |
| `tod` | `[from,to]` game hours | spawn window, wraps past midnight (`[21,5]`); `[0,24]` = always |
| `where` | `'pavement'`\|`'fence'`\|`'field'`\|`'forest'`\|`'pole'`\|`'lamp'` | where `animPlace` spawns it (below) |
| `place(a)` | optional, returns bool | own spawn instead of `where`; set `a.x,a.z,a.y,a.h,a.mode`, keep the 35-150 m ring (`animFar(x,z)`) |
| `behave(a,dt)` | required | moves the animal; called every frame unless it is `down` |
| `hit` | `{cash, heat, dent}` | when the player's car runs it over: `cash` € fine, `heat` via `addHeat` (1 = one star), `dent` = car hp lost (0..1; also dents the body, depth `min(.12, dent*.6)` m) |
| `msg` | string | Lithuanian toast on a hit, e.g. `'Partrenkei katę'` |
| `sound` | `{kind, every:[min,max]}` | optional; see Sounds |
| `flap` | rad/s, default 14 | bird wing beat while `mode==='fly'` |

## The animal `a`

Engine-owned (read them, set only the ones marked *):

- `S` species object, `name`, `rig`, `i` pool slot
- `x, z`* world metres; `y`* height above ground in m (fence top, nest, lamp); `h`* heading, `atan2(dx,dz)` like peds
- `sp`* current speed m/s, drives the quad gait (`animGo` sets it from real movement); `phase` gait/flap phase
- `mode`* free string, but: `'hide'` = gone (set it to despawn), `'down'` = hit (engine-owned, 10 s then recycled),
  quad `'sit'` = loaf pose, bird `'fly'` = wings beat (anything else folds them). Anything else poses from `sp`
- `vx, vz`* velocity used by `animGo`; `timer`* free countdown
- `d` distance to the player in m (set before `behave`)
- `leave` true once the `tod` window closed; the engine hides it when out of view, > 70 m, or after 20 s
- spawn anchors: `seg` (fence `[x0,z0,x1,z1,top]`), `pole` (`world.poles` item; for `lamp` spawns the pole carrying that lamp, when the solid step is in), `lamp` (`[x,y,z]`), `green` (polygon pts), `e` (road edge)
- knocked-over poles: with the solid step a `world.poles` entry is the collision prop, so `a.pole.down===true` means it fell (its lamp is dark too).
  Anything perched on a pole (stork nest, owl) or orbiting its lamp (bats) must check `a.pole&&a.pole.down` every tick and fly off.
  The core already sets `a.leave` then (despawn when out of view, > 70 m or after 20 s) and never spawns on a fallen pole; the fly-off motion is yours.
- species extras: add them prefixed, `a.<name>_...` (see `a.cat_from`)

## Where

- `pavement`: on a pedestrian road edge (`edgesNear`, `e.w/2+.9` from the centreline), `mode 'walk'`
- `fence`: on a `world.hedgeSegs` segment, `y` = fence top (5th number; 1.3 when absent), `h` along it, `mode 'sit'`
- `field` / `forest`: a random point inside a non-forest / forest `world.green` polygon, `mode 'walk'`
- `pole`: on top of a `world.poles` pole, `y` 8.75, `mode 'perch'`
- `lamp`: 1 m beside a `world.lamps` head, `mode 'fly'`

Every placement is 35-150 m from the player, not ahead within 75 m, never inside a building (same as `pedPlace`).
Anything beyond 190 m is recycled.

## Helpers a species may call

- `animPlace(a,where)`, `animFar(x,z)`, `nearOf(list,at,x,z)` (grid lookup; `segAt`, `poleAt`, `lampAt` for `at`)
- `fleeFrom(a,x,z,sp=S.speed,t=3)`: run away from a point for `t` s (`mode 'run'`, plays the sound once)
- `animGo(a,dt)`: move by `vx,vz` through walls and props (`pedPush` on a `{x,z,mode:'walk'}` shim) and around buildings (turns 90° at a wall)
- `animWander(a,dt,sp)`: amble with pauses; `inLights(a)`: in the player's headlight cone at night (`ENV.night.value>.5`, 35 m)
- game: `world.inBuilding(x,z)`, `world.green` (`[[pts,isForest],...]`), `world.poles`, `world.lamps`, `world.hedgeSegs`,
  `edgesNear(x,z)`, `pip(x,z,pts)`, `GY(x,z)`, `peds`, `player`, `tod`, `ENV.night.value`, `toast(big,small)`, `pick`, `lerpAngle`, `clamp`
- `fight.victims` (fight step, if present) for a leashed dog whose owner is hit; guard with `typeof fight!=='undefined'`

## Sounds

`sound:{kind,every:[min,max]}` with `kind` one of `'bark','meow','caw','coo','hoot','snort','snuffle','squeak','flap'`.
The core calls `sfxAnimal(kind,x,z)` for animals within 60 m of the player: on a timer re-rolled per animal from `every`
(seconds), once on `fleeFrom`, once on a hit. `sfxAnimal` comes from `add_voice.py` (runs last); without it animals are silent.
A species that needs a sound at another moment calls `animSound(a)`.

## Budgets

`ANIMAL_N=24` quadrupeds, `BIRD_N=16` birds, `BAT_N=32` bat points, shared by all species; 12 draw calls in total
(8 quad parts + 3 bird parts + 1 Points). `updateAnimals` must average < 0.3 ms/frame with the quad pool full.
Keep `behave` O(1): no scans over `peds`/`world.*` per frame (do them on a timer or at spawn).

## Test

```sh
D=<your scratch dir>
cp work/build/v37.html $D/page.html && python3 pipeline/add_animals.py $D/page.html
cp work/test_animals.mjs $D/ && cd $D && node test_animals.mjs page.html
```

It must print `PASS` with `errors []`. It registers its own `zz_*` stub species (bird by day on poles, bats on lamps at
night, field and forest quads) and checks: pool limits, 190 m, no animal in a building, cats on fences, a cat leaves its
fence when the player walks up, one run-over costs heat and cash exactly once, day species gone at 23:00, field/forest
spawns land in the right polygon kind, and the time budget. Add your own assertions for your species to a copy, not to this file.
