# Street files

One street = one `pipeline/streets/{slug}.json`, plus an optional `{slug}.js` hook for things the JSON cannot say.
`pipeline/add_streets.py` validates every file and merges them into the build; you never edit the HTML, `v37.html`,
any `add_*.py` or another street's files. Files whose name starts with `_` (like `_example.json`) are skipped by the build.

## Workflow

```sh
cd ~/Desktop/Projects/raseiniai-streets
python3 pipeline/street_ids.py "Kalno g."                    # buildings along the street, crossings, centreline ways
python3 pipeline/add_streets.py --check pipeline/streets/kalno.json
# build and test only your street in your scratch dir $DIR
mkdir -p $DIR/streets && cp pipeline/streets/kalno.* $DIR/streets/
cp work/build/v37.html $DIR/page.html && python3 pipeline/add_streets.py $DIR/page.html --dir $DIR/streets
cp work/test_streets.mjs $DIR/ && cd $DIR && node test_streets.mjs page.html $DIR/streets
```

`--check` also reads the other street files next to yours, so it catches a building two streets both claim.
The test writes `shots_streets/{slug}_1.png` and `_2.png` (your two views) next to itself; look at them.

`street_ids.py` prints one row per building whose bbox centre is within 45 m of the street's centreline:
`id kind name shop/amenity w×d x z lat lon dist side`. `kind` is the OSM `building` tag, `x z` are game metres
(x east, z south), `dist` is metres to the centreline, `side` is the compass side of the street the building is on.
A `*` after the id means another step already styles it in `LOOK`: leave it alone.

## Coordinates

- Positions are `[lat, lon]` only (lat ~55.38, lon ~23.12). The build converts them with the game's `LL`.
  Take them from `street_ids.py`, the crossings it prints, or Mapillary/OSM. Every point must be within 60 m of your street.
- Headings `hd` are degrees clockwise from north (0 north, 90 east, 180 south, 270 west) and name the way the
  object's front faces: a bench's seat faces `hd` (sitters look towards `hd`), a sign is readable from the `hd` side,
  a view's camera looks towards `hd`. A bench along a road faces the road, so its `hd` is the bearing from the bench to the road.
- Sizes are metres. A prop's `s` is `[across, up, depth]` with depth along `hd`.
- Never use `Math.random` in a hook; `ctx.hash(string)` gives a deterministic 0..1 so two builds are byte-identical.

## Schema

Unknown keys anywhere are errors. `street`, `slug` and `views` are required, everything else is optional.

```json
{
  "street": "Kalno g.",
  "slug": "kalno",
  "flavour": [["Line one.", "Reply.", "Line three."]],
  "looks": {"c3142": {"wall": [0.86, 0.78, 0.55], "roof": [0.55, 0.24, 0.17], "sty": "plaster", "windows": true,
                      "pitched": true, "hip": false, "h": 3.2, "rh": 3.4}},
  "props": [{"k": "bench", "ll": [55.3795494, 23.1400130], "hd": 152, "s": [1.7, 0.96, 0.5], "col": "#6b5038",
             "solid": true, "knock": false}],
  "signs": [{"text": "Kalno g.", "ll": [55.379248, 23.1395058], "hd": 242, "w": 0.9, "h": 0.25, "y": 2.35,
             "bg": "#1f5fae", "fg": "#ffffff"}],
  "fences": [{"style": "picket", "ll": [[55.3797612, 23.1416082], [55.3798028, 23.1419806]], "h": 1.1}],
  "parking": [{"ll": [[55.3800348, 23.1428519], [55.380138, 23.1437833]], "side": 0, "every": 6, "fill": 0.7}],
  "places": [{"name": "Kavinė X", "ll": [55.38, 23.12], "kind": "cafe"}],
  "views": [{"ll": [55.3794031, 23.1395405], "hd": 62}, {"ll": [55.3803614, 23.1467116], "hd": 245}]
}
```

| key | meaning |
|---|---|
| `street` | exact OSM highway name as `street_ids.py` takes it, e.g. `"Vytauto Didžiojo g."` |
| `slug` | lowercase ascii words joined by `-`; the file must be `{slug}.json` |
| `flavour` | pedestrian dialogues heard on this street, in Lithuanian. Each is a list of 2-6 lines, speakers alternating; a goodbye pair is added by the game. They join `TALKS` tagged `street:{slug}` and are picked (weight 4, like `day`/`shop` talks) when a group stands within 22 m of the street's centreline. |
| `looks` | building restyles keyed by id. Only ids `street_ids.py` prints for your street, never one marked `*`, never one another street file has. Keys: `wall`, `roof` `[r,g,b]` 0..1; `sty` one of `plaster old shop block brick wood industrial glass tiles sheet flat none` (facade texture, `none` = plain); `windows` true/false; `pitched`, `hip` true/false (pitched roof only works on 4-corner outlines); `h` wall height m 2.2..80; `rh` roof rise m 0..12. Anything left out keeps the game's own guess. More per-building keys (two-tone walls, per-face windows, balcony/chimney/dormer, roof material, ridge direction) are in "Facade keys" below. |
| `props` | street furniture, see the catalogue. `k` and `ll` required; `hd` default 0; `s` default the kind's size; `col` `"#rrggbb"`, default the kind's colour; `solid` default true; `knock` default false. |
| `signs` | flat panels with text, at most 10 per street. `text` 1-40 chars, `ll`, `hd` required; `w` 2.4, `h` 0.6, `y` (height of the centre above ground) 3.2, `bg` `#1f5fae`, `fg` `#fff` by default. Front face only, so put wall signs ~0.1 m in front of the wall, facing out. A free-standing sign needs a `post` prop under it. |
| `fences` | a polyline `ll` of 2+ points. `style`: `picket` (pickets and rails, 1.1 m), `mesh` (see-through panel with posts every 2.5 m, 1.5 m), `hedge` (0.7 m thick, 1.3 m), `wall` (0.25 m, 1.6 m); `h` overrides the height, 0.2..4. Solid for cars and people. Also `panel` (concrete panel, 1.8 m, grey plinth and posts), `slat` (dark wooden slats, 1.7 m); `col` `"#rrggbb"` recolours the fence; `dense: true` (hedge only) makes it a thick two-layer hedge. |
| `parking` | a row of parked cars from `ll[0]` to `ll[1]` (the row's centre line). `side` 0 = parallel, cars along the line; 1 / -1 = bays, noses to the right / left of the `ll[0]`→`ll[1]` direction. `every` metres per car (default 6 parallel, 2.6 bays), `fill` share of slots taken (default 0.6). Cars come from the game's own parked-car fleet and are solid. |
| `places` | named points that join the game's place labels (floating name, minimap, taxi/errand targets, ped destinations). `kind`: `shop cafe bank pharmacy school church monument bus_stop`. Skipped when a label of the same name is already within 60 m. Real places only. |
| `views` | exactly the two reference shots for the test: camera 2.2 m above `ll`, looking 30 m ahead towards `hd`. Put them on your street (pavement or verge); the test checks the game resolves both to your street name. |

### Props catalogue

One InstancedMesh per kind for all streets together, so props are cheap; each prop can still have its own `s` and `col`.

| `k` | default `s` m | colour | collides as |
|---|---|---|---|
| `bench` | 1.7 × 0.96 × 0.5 | `#6b5038` wood, dark legs | a 1.7 m wall segment |
| `bin` | 0.5 × 0.8 × 0.5 | `#2e4636` | circle r 0.25 |
| `lamp` | 0.5 × 4.7 × 0.5 | `#3a3f42` | pole, r 0.09 |
| `bollard` | 0.2 × 0.9 × 0.2 | `#3b3e40` | r 0.1 |
| `planter` | 1.2 × 0.5 × 1.2 | `#8d8a82` concrete | r 0.6 |
| `post` | 0.1 × 2.6 × 0.1 | `#8a8f93` | r 0.06 |
| `box` | 0.7 × 1.2 × 0.4 | `#9a9c94` utility cabinet | r 0.35 |
| `bush` | 1.2 × 0.9 × 1.2 | `#4a6b35` | r 0.5 |
| `treeS` | 2.2 × 4.5 × 2.2 | `#4f7a3a` crown, darker trunk | trunk, r 0.125 |

Collision footprints scale with `s`. A footprint more than twice as long as it is wide becomes a wall segment, otherwise a
circle. `solid: false` makes a prop walk-through and drive-through. `knock: true` registers it like a tree that snaps:
a car above 5 m/s knocks it over (`snap`, `minSp: 5`, `h` = its height); use it for bollards, bins, posts, small signs'
posts. Knocking needs the solid step (`add_solid.py`) in the build; on plain v37 the patcher prints a note and the prop
stays a fixed solid.

## Facade keys

More keys for a `looks` entry (step `facades2`, after `drive2` in `build.sh`). All optional; `--check` validates them.

| key | meaning |
|---|---|
| `wall2` | `[r,g,b]` colour of everything above `band`, walls and gable ends; `wall` stays below. Two-tone facades: yellow brick base under cream plaster, glass shop floor under a grey box. The window texture continues across the line. |
| `band` | metres above the lowest corner where `wall2` starts, 0.5..60, default 3 (one storey). Needs `wall2`. |
| `faces` | `{"windows": [1,0,1,1]}`: one 0/1 per outline edge, 0 = a plain wall of the same material with no windows (and no balconies). Edge `i` runs from outline vertex `i` to `i+1` in OSM order: `python3 pipeline/edge_ids.py c4185` prints each edge's length and the compass side it faces. The array must have exactly one entry per edge. |
| `blankGable` | `true`: both gable-end walls of a gable roof (not hip) get no windows. Nothing happens on flat or hip roofs. |
| `balcony` | `false` = no balconies, `true` = balconies on the long walls, every other bay, from the second floor up (needs windows and 2+ floors). Left out: the automatic rule, which no longer fires on a building whose street look sets `sty`. |
| `chimney` | `false` = none, `true` = one on the ridge of a 4-corner pitched roof (any kind, any height). Left out: the automatic 75 % rule on low houses. |
| `dormer` | `false` = none, `true` = a dormer (both slopes on long roofs) on a 4-corner pitched roof with at least 1.2 m rise, 5 m span, 6 m ridge. Left out: the automatic rule. |
| `roofSty` | roof material: `tiles` (clay), `sheet` (standing seam), `flat` (bitumen), `corrugated`, `asbestos`. Tinted by `roof`. Left out: the game's guess from the roof colour. |
| `ridge` | `"street"` = the ridge runs along the nearest street (eaves face the road), `"across"` = it runs across it (gable ends face the road). 4-corner pitched roofs only; the engine's guess is used where it is left out. |

`pitched: false` now flattens the roof for every building, including those the data gave a LiDAR hip or single slope. A brick wall tints with `wall` (the brick texture is neutral grey), so `sty: "brick"` with `wall: [.86,.72,.4]` is yellow brick; it is not always red.

## Hooks: `{slug}.js`

For layouts the JSON would make tedious (a row of 12 bollards, props spaced along a curve), write

```js
const kalno_gate=[[55.3799638,23.1420187],[55.3799965,23.1423296]];
function streetBuild_kalno(ctx){
  const [a,b]=kalno_gate.map(q=>ctx.LL(...q));
  for(let t=0;t<=1;t+=.25)ctx.put('bollard',{xz:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],col:'#c9c6bd'});
}
```

The function is `streetBuild_{slug with - as _}` and is called once per world build, after your JSON items, inside
`buildExtra` (so solids registered here survive). It gets only `ctx`:

| `ctx.` | |
|---|---|
| `LL(lat, lon)` | → `[x, z]` game metres |
| `GY(x, z)` | ground height at x, z |
| `put(k, o)` | adds a catalogue prop; `o` is a props entry without `k`, with `xz: [x, z]` allowed instead of `ll`. Counts in the test. |
| `sign(o)` | adds a sign; `o` is a signs entry, `xz` allowed instead of `ll`. Counts against nothing, but keep the street at 10. |
| `addWall(x0, z0, x1, z1)` | a solid segment (cars and people) |
| `addProp({x, z, r})` | a solid circle |
| `solid(x, z, w, d, hd)` | a solid `w × d` rectangle centred on x, z, `d` along `hd` degrees |
| `world` | read only: `world.street(x, z)`, `world.inBuilding(x, z)`, `world.labels`, ... |
| `STY`, `LOOK` | read only |
| `hash(string)` | deterministic 0..1 |

## Forbidden

- Editing `work/build/*`, `v37.html`, any `pipeline/add_*.py`, `pipeline/*.js` or another street's files.
- In a hook: `THREE.` anything (build through `ctx.put` / `ctx.sign`), writing to `LOOK`, top-level names that do not
  start with `{slug}_` (other than `streetBuild_{slug}`), `Math.random`, per-frame code, DOM access.
- `looks` ids that `street_ids.py` does not print for your street, ids marked `*`, ids in another street file.
- Invented places or shop names: signs and places come from the street itself (photos, OSM, Mapillary).

`--check` enforces the hook rules except per-frame code and DOM access, the ids, the schema and the 60 m distance;
the rest is on you.

## Done

1. `python3 pipeline/add_streets.py --check pipeline/streets/{slug}.json` passes and reports at least
   8 looks, 6 props, 2 signs, 2 views and some flavour dialogues in Lithuanian.
2. `node test_streets.mjs page.html $DIR/streets` prints `PASS {slug}` on a scratch build of v37 with your files:
   no console errors, every look in `LOOK`, instanced prop count = JSON + hook puts, your talks in `TALKS` and picked at
   your view point, both views resolve to your street, every solid pushes a ped out, no ped inside a street solid over
   600 frames, both view PNGs written.
3. You looked at both PNGs and they show your street.
