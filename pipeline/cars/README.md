# Car models

Every car in the game is lofted by one builder, `buildCar(M,lot)` in `pipeline/cars.js`. Each file here adds one model:

```js
CAR_MODELS.passat_b5={name:'VW Passat B5 Variant',dims:[4.68,1.74,1.46],axles:[1.38,-1.32],
  lower:[...],upper:[...],side:[.66,-1.9],pillars:[[-.14,-.22],[-1.12,-1.2]],glass:[.36,-1.95],
  front(c){...},rear(c){...}};
```

Rules: the file is `cars/{key}.js` and holds that one statement, nothing else (no other top-level names; helpers live inside
the closures). `add_cars.py` concatenates `sorted(glob('cars/*.js'))` into the page and refuses a file that does not start a
line with `CAR_MODELS.{key}={`. Any field you leave out is taken from `audi80.js`, so read that file first: it is the
reference for every field.

## Units and axes

Metres. Car-local frame: +z is the nose, +x the right-hand side, y up from the ground. Wheels have radius `WHEEL_R=.3` and
sit at x = ±.74. Tables describe the right half; the builder mirrors it. Colours are linear RGB triples 0..1.

## Fields

| field | meaning | Audi value |
|---|---|---|
| `name` | display name | `'Audi 80 B3'` |
| `dims` | `[length, width, height]` of the real car; the test wants the built size within ±8 % (length and height over all body lists, width over `paint` only, so mirrors drawn in trim do not count) | `[4.39,1.7,1.4]` |
| `axles` | `[zFront, zRear]` wheel centres; arches are cut there and `makeCarMesh` and the parked cars put the wheels there | `[1.33,-1.22]` |
| `arch` | wheel-arch radius | `.385` |
| `lower` | lower body stations front to back: `[z, halfWidth, sillY, shoulderY, crownY]`; shoulder is the belt line (bottom of the glass), crown the top of the bonnet/boot at the centre line | 16 rows, 2.2 … -2.2 |
| `upper` | glasshouse stations front to back: `[z, roofY]`; `roofY` 0 closes the end at the shoulder (the base of the screen) | 16 rows, 1.04 … -1.45 |
| `side` | `[zFront, zRear]`: the side windows run between these z | `[.65,-1.3]` |
| `pillars` | list of `[z, z]` bands inside the side windows drawn as black pillars (order inside a pair does not matter) | `[[-.12,-.2],[-.95,-1.02]]` |
| `glass` | `[zFront, zRear]`: upper panels in front of `zFront` (screen) or behind `zRear` (back light) are glass, the rest is roof | `[.38,-.72]` |
| `strips` | list of `[a, b]` black trim strips, `a`/`b` = `[x,y,z]` | two door strips |
| `rings` | the four Audi rings front and rear | `true` (every other model `false`) |
| `lift` | added to shoulder and crown of every `lower` row (rounded to mm): a taller body on the same sills | `0` (`suv` uses `.14`) |
| `front(c)` | grille, head lamps, badges on the nose | Audi grille + lamps |
| `rear(c)` | tail lamps, boot/tailgate details, rear plate | Audi lamp band |
| `bumpers(c)` | bumpers (and the front plate if it sits on the bumper) | deep plastic bumpers |
| `doors(c)` | rub strip, shut lines, handles, painted mirrors | Audi doors |

Draw order is fixed: lower loft, upper loft, strips, `front`, rings, `rear`, `bumpers`, `doors`, mirror knob, plate knob,
arches, wheel. Inside a closure, draw with the helpers on `c`.

## Polish knobs

| knob | default | effect |
|---|---|---|
| `mirror` | `[.52,.97]` | `[z, y]` of the Audi's black mirror box (x .77-.92, .11 long, .09 tall). `null` = none; draw your own in `doors(c)` (Octavia does) |
| `plate` | `null` | `[[yF,zF],[yR,zR]]`: Lithuanian plates (`c.plate`) facing forward at the first, back at the second. Leave the plate out of your closures when you use it: the inherited Audi `bumpers`/`rear` draw plain white plates, so override them too |
| `grime` | `0` | 0..1, road dirt: darkens paint and trim vertex colours up to 45 % at the sill, fading out by y .55 |
| `lampW` | `1` | scales the x of every `head`/`tail` vertex; for small tweaks only (0.95-1.05), wrap-round corner pieces leave the body beyond that |

## The `c` object

Lists (each takes triangles): `paint` (body colour; the car's material tints the vertex colour), `trim` (vertex colour as
is: glass, black plastic, chrome, plates), `head` and `tail` (unlit, so they glow at night). `c.M` is the merged model.

Helpers:
- `quad(list, A, B, C, D, normal, col=PAINT, both=true)`: flat panel from four `[x,y,z]` points; `both` mirrors it to the left side, pass `false` for anything centred on x=0.
- `box(list, x0, x1, y0, y1, z0, z1, col)`: five-sided box (no bottom), mirrored.
- `tri(list, a, b, c, na, nb, nc, col)`: one triangle with per-vertex normals, not mirrored.
- `ring(cx, cy, z, r, col)`: flat ring on a face at z (faces +z or -z by sign of z), into trim.
- `bumper(pts, y0, y1, col)`: wraps a bumper from y0 to y1 along a plan outline `[[x,z],…]` (from the centre line out); `col===PAINT` goes to `paint`, anything else to `trim`.
- `plate(y, z, d)`: Lithuanian plate, bottom edge at y, face at z, `d` 1 forward / -1 back.
- `belt(z)`: shoulder height at z; `at(z)`: `[halfWidth, shoulderY]` at z. Use them to sit details on the body.
- `side`: the `[1,0,0]` normal for side panels.

Colours: `PAINT GLASS BLACK PLASTIC CHROME WHITE LENS AMBER CLEAR RED LAMP`. Trim triangles coloured exactly `GLASS` get the
sky gradient by height. `TAU` is global.

## Budget

Triangles (all five lists) at most 1.3 x the Audi: 1.3 x 2394 = 3112. The lot twin (`lot=true`) only coarsens the arches.

## Adding a model to the traffic

`TRAFFIC` in `pipeline/add_cars.py` is the fleet mix, one entry per share:
`['saloon','estate','estate','mpv','hatch','hatch','suv']`. Append your key (twice for a common car). Each listed key gets
`{key}Geo` and `{key}LotGeo` consts and its place in `TRAFFIC_GEOS`/`LOT_GEOS`; a model not listed is built only by the test.

## Testing one model

```sh
DIR=<your scratch dir>
cp work/build/v37.html $DIR/page.html && python3 pipeline/add_cars.py $DIR/page.html
cp work/test_cars.mjs $DIR/ && cd $DIR && node test_cars.mjs page.html passat_b5 [more keys]
```

It checks the twelve v37 geometries are still byte-identical, your key's tri count and size against `dims`, that the parked
cars stay within `3 x LOT_GEOS.length + 1` meshes, writes `shots_cars/{key}.png` and `{key}_rear.png`, prints `PASS` or
`FAIL` with the reasons and exits 1 on failure.
