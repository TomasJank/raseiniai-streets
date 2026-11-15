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
| `fences` | a polyline `ll` of 2+ points. It replaces the generated garden fence or hedge on its stretch (see "House kit keys", "Fences"). `style`: `picket` (pickets and rails, 1.1 m), `mesh` (see-through panel with posts every 2.5 m, 1.5 m), `hedge` (0.7 m thick, 1.3 m), `wall` (0.25 m, 1.6 m); `h` overrides the height, 0.2..4. Solid for cars and people. Also `panel` (concrete panel, 1.8 m, grey plinth and posts), `slat` (dark wooden slats, 1.7 m); `col` `"#rrggbb"` recolours the fence; `dense: true` (hedge only) makes it a thick two-layer hedge. |
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

## House kit keys (doors, windows per wall, porches, extensions, ...)

Step `kit` (`pipeline/kit.js`, `pipeline/add_kit.py`, last in the chain) adds the parts that make an ordinary house look
like the real one. Its keys do **not** go in this street file (`add_streets.py` rejects unknown look keys): they go in
`pipeline/kit/looks/{slug}.json`, keyed by the same building ids, and every id there must already have a look here.
`pipeline/kit/looks/_example.json` uses every key. All keys are optional; a house with none looks exactly as before.

```sh
python3 pipeline/add_kit.py --sides c1298            # the house's walls: index, length, compass, metres to the road, side name
python3 pipeline/add_kit.py --check pipeline/kit/looks/jurbarko.json
python3 pipeline/kit/photo_views.py jurbarko         # camera records of refs/mapillary/jurbarko/*.jpg -> pipeline/kit/views/
node pipeline/kit/shots.mjs page.html views.json outdir   # render the game from those photos, or square-on to one wall
```

### Sides

Every part sits on a wall, named by `side`:
- `front`: the wall nearest a named street (the smallest `road` in `--sides`, walls of 2 m or more). Corner houses: check it, and
  if the street front is another wall, set `"front": <edge index>`.
- `left` / `right`: as you **stand in the street looking at the front**. `back`: opposite the front.
- or an edge index (number, or a string like `"3"` as a `win` key) from `--sides`, for outlines with more than four walls.
`--sides` prints which edge each name resolves to; run it before writing a house and compare the compass directions with the photo
(the photo's compass angle is in `pipeline/kit/views/{slug}.json`: a camera looking SW sees walls that face NE).

Positions along a wall (`at`) are fractions 0..1 from the wall's **left end as you face that wall from outside**.
Storeys count from the ground; a 1.5-storey house with `h` 5 m still has two wall rows in the game, so give the upper row
as `0` when the real upper floor has no windows on that wall.

### Keys

| key | value | how to read it off a photo |
|---|---|---|
| `front` | edge index | only when the auto front (`--sides`) is not the wall on the street |
| `win` | `{side: [row0, row1, ...]}`, a row is a count (evenly spaced) or a list of `at` fractions | count the windows of each storey on each wall you can see. On a gable end (the triangle wall of a gable roof) the row after the last wall row is the attic, and one more is a small loft window near the apex: `[2, 1]` on a one-storey gable = two below, one in the gable. A wall listed here loses all its automatic windows; walls you do not list keep them. `[0]` = a blank wall |
| `winShape` | `normal` `wide` `narrow`, or `{side: shape}` | wide = triple / picture windows, narrow = tall slim ones; one value for the whole house, or one per wall (walls not named stay `normal`) |
| `frame` | `[r,g,b]` | window frame colour of the `win` windows (white PVC is the default; brown wood ~`[0.4,0.27,0.18]`) |
| `door` | object or list: `side`, `at` (number or list, default 0.5), `type` `single double glass garage`, `col`, `steps` true/false, `porch` `none canopy closed` | a door you can see. `canopy` = a small roof over it, `closed` = an enclosed entrance porch (small box with a gable roof, door on its front). A ground-floor window closer than ~0.75 m to a door is dropped |
| `gable` | `[r,g,b]` | colour of both gable triangles when it differs from the wall (boarded or painted gables) |
| `gableSty` | `boards` (vertical) `planks` (horizontal siding) `profile` (metal) `asbestos` `plaster` `roughcast` `brick` `silicate` | material of the gable triangles |
| `plinth` | `[r,g,b]` | foundation strip round the house, usually grey concrete `[0.45,0.45,0.43]` |
| `plinthH` | metres 0.1..1.5, default 0.5 | its height above the ground; count it in brick courses or against a door step |
| `ext` | object or list: `side`, `at` (centre, 0.5), `w` (share of the wall 0.1..1, 0.5), `d` (metres out 0.8..12, 3), `h` (wall height 2..8, 2.6), `roof` `lean flat gable` (lean), `wall`, `roofCol`, `glazed` true/false, `sty` `plaster brick silicate plank panel corrugated sheet none` | lean-to, boxy extension, glazed veranda, garage block built on to a wall. `glazed` = a veranda of glass |
| `balc` | object or list: `side`, `at`, `w` (share of the wall, 0.35), `floor` (1 = first upper floor; default the attic floor on a gable end, else 1), `col` (railing) | a balcony: slab, railing as a panel |
| `chim` | count 1..4 or list of fractions along the ridge | chimneys on the ridge, measured from the ridge end nearest the front wall's left corner (from the street end on a gable-front house, from the left on an eaves-front one). Replaces the automatic chimney |
| `dorm` | object or list: `side` (the wall under that roof slope), `n` (count, or windows of a shed dormer), `type` `gable shed` | dormers. Only on an eaves wall (not a gable end). `shed` = one wide box dormer with `n` windows. Replaces the automatic dormers |
| `xg` | object or list: `side` (an eaves wall), `at` (centre, 0.5), `w` (metres wide 1..16, default 40 % of the wall up to 4), `d` (metres its wall stands proud of the main wall 0..12, 0), `rise` (its ridge height over the eaves as a share of the main roof's 0.3..1, 1), `wall`, `gable`, `roofCol`, `win` (rows on its front, like `win`: storeys, then attic, then loft) | a **cross gable**: a gabled bay, wall dormer or wing whose ridge runs at right angles to the main ridge. Read it from a photo of the eaves side: where along the wall its gable sits (`at`), how wide its gable is at the eaves (`w`), whether its wall is flush (`d` 0: a wall dormer or flush gable) or comes forward (`d` = metres; a long `d` is the arm of an L or T plan), and whether its ridge reaches the main ridge (`rise` 1) or stops below it (0.8 = a little below). It takes the main roof's material and colour (`roofCol` overrides), `gable`/`gableSty`, and the wall colour (`wall` overrides). A house with an `xg` loses its main eaves overhang, as the game's own wings do |
| `wings` | list, one entry per rectangle the game draws the outline as (`--sides` prints them as "wing 0, wing 1, ..."), `null` = leave that one: `ridge` `street`/`across`, `rh` (rise 0.5..8), `h` (wall height 2.2..30), `roof` `gable hip flat` | **L, T and stepped houses** with 8 or more corners: the game splits such an outline into rectangles, each with its own roof, which often gives a row of gables to the street where the real house has one long roof, or the wrong part tall. Set each wing's ridge along or across the street, and its height. Example: a 1.5-storey house whose street front is three wings: `[{"ridge":"street"},{"ridge":"street","rh":2.6},{"ridge":"street"}]` |
| `noTree` | `true` (the plot between the front wall and the road), a side (the plot in front of that wall), or metres 0.5..30 (that far round the house) | a generated tree stands where the photo shows none: its crown and its collision go. Only generated trees (LiDAR list and trees2), not street-file props |
| `noFence` | `true` or a side | the photo shows no fence or hedge in front of that wall: the generated garden boundary there goes (drawing and collision). A fence the street file describes needs no key: see "Fences" below |
| `roof2` | object or list: `at` `[from, to]` (fractions along the ridge, measured like `chim`), `side` `front back both` (slope over the front wall, the other, or both), `col`, `sty` `tiles sheet flat corrugated asbestos` | a stretch of the main roof re-covered in another material or colour (new metal over half an old asbestos roof). Four-corner gable roofs only |
| `walls` | `{side: {col, sty}}`, `sty` as `gableSty` | one wall (and its gable triangle) in another colour or material: an old boarded gable end on a sided house |
| `shut` | `[r,g,b]` | shutters on both sides of every storey window the house's `win` rows draw (cross gable windows too) |
| `winSize` | `small` `normal` `large`, or the window frame's width in metres 0.4..3; one value or `{side: size}` | window size of the storey windows the kit draws. Left out, windows are drawn as before (the automatic window: frame 1.4 m wide on board walls, 1.55 m on plaster and brick, and as tall as about half the storey). A wall with a size but no `win` row keeps its automatic count (one per 3.2 m) and gets the smaller windows. Measure the frame against the wall: old wooden houses are mostly 1.0 to 1.2 m |
| `halfHip` | `true` (0.35) or the clipped share of the gable 0.15..0.6 | a half-hipped (jerkinhead) gable roof: the top of both gable triangles becomes a small hip. Four-corner gable roofs on houses the game draws as one rectangle |
| `walls` `at` | `{side: {col, sty, at: [from, to]}}` | only that stretch of the wall (storey walls, not the gable) in the other colour or material: a newer extension in other siding on one third of the street wall. Give that wall a `win` row as well: the stretch covers its automatic windows |
| `door` `porch: "recess"` | | a recessed entrance: a dark opening with a brick pier on its right, no door leaf |
| `ext` `win`, `door`, `doorCol` | `win` a row (count or list of positions), `door` a position 0..1 | windows and a door on the extension's front (a shop front, a porch with a window); the windows take the extension's wall colour and style |
| `xg` `up`, `size` | `up` metres 0.4..4; `size` as `winSize` | `up`: a **wall dormer** that starts at the eaves (its walls `up` metres high, then its gable), so the wall below keeps its own windows and door; `rise` over 1 (up to 1.4) puts its peak above the main ridge. Its `win` row 0 fills its wall band, row 1 is its gable. `size`: window size of its windows |
| `wings` `d` | metres 1..40 | that rectangle is drawn only `d` metres deep from the street; the rest behind it gets a flat roof at the same eaves. Use it when the game's split runs one rectangle from the street wall through a back annex, so its ridge sits further back than its neighbours' and the roof steps |

Gable windows, `chim`, `dorm`, `xg` and `roof2` need a pitched roof on four corners. On outlines with 8 or more corners that the
game draws as several rectangles, `win`, `door`, `plinth`, `chim`, `gable`, `gableSty`, `frame`, `ext`, `balc`, `walls`, `xg`, `dorm`
and gable rows work on the walls you name: windows and doors go on the rectangle wall drawn over each part of the OSM edge, and gable
rows, dormers and cross gables use the roof of the rectangle that wall belongs to. `chim` and `roof2` use the largest rectangle's
ridge. The plinth follows the OSM outline, so where a rectangle's wall stands a few centimetres outside it, the plinth is hidden on
that stretch. Hip roofs have no gable rows. On outlines of 5 to 7 corners the kit behaves as before kit 2 (largest rectangle only).

### Fences

Where a street file's `fences` entry runs along a generated garden boundary (the town's picket, mesh or hedge in front of nearly every
house), the generated one goes on that stretch: every generated segment with both ends within 1.5 m of the described line and running
the same way is removed from the drawing, from props2's hedge rows and from collision. No key is needed; put the described fence where
the photo has it. For a plot whose photo shows **no** fence, give the house `"noFence": true` (or a side) in its kit file. A described
`hedge` with `col` now takes that colour (props2's hedge models are bright green by themselves). There is no close-board fence style:
a new style name would have to be added to `add_streets.py`'s `FENCES`, which the kit does not own.

### Check it

Invalid values are ignored and listed once in the console (`kit: ignored c1298.door; ...`) and in the `add_kit.py` output.
Render the house before and after from the photo (`shots.mjs`, records from `pipeline/kit/views/`) and look: same door place,
same window count per wall, porch or extension on the same side. `node work/test_kit.mjs kit.html base.html` checks that every key
lands on the wall it names.

### Common mistakes

- Left and right swapped: they are as seen from the **street**, facing the front, not as seen in the photo.
- Counting the windows of two storeys in one row; a gable attic window put in row 0.
- Giving gable rows to an eaves wall (warning "row 2 of edge 1 has no wall"): look at which walls the ridge runs between.
- `dorm` on a gable end (warning "has no roof slope over it").
- Using the facades2 `faces` key and `win` on the same wall: `win` wins; you do not need both.
- `xg` on a gable end (warning "xg: edge 0 is a gable end; a cross gable needs an eaves wall"): a cross gable sits on an **eaves**
  wall, the one the roof slopes down to. With `wings`, it is the wing's own ridge that decides (`ridge` across makes the street wall a
  gable end). On outlines the game splits into rectangles, any rectangle with an eaves wall there will do.
- A wing that is narrow cannot rise as high as you ask: the game caps a roof's rise at 0.7 x its span, so `rh` 1.8 on a 1.8 m wing
  gives 1.26 m. A low wing behind or beside the main block may not be seen from the street at all; check it square-on first. `--sides` names walls by the nearest street; on a corner house the eaves side may be `left` or `right`.
- A cross gable seen at the very end of a wall is often just the main gable end seen at an angle: check the photo of the eaves side.
- `wings` counted in the wrong order: use the wing numbers `--sides` prints, not the order you see them in the photo.
- `wings` on a house of 4 corners: its roof is the street look's `ridge`, `rh` and `hip`.
- On a split outline, `win` rows above a wall's storeys go on the rectangle wall standing at that position when it is taller
  (the upstairs window of a two-storey wing on a one-storey street wall); elsewhere they are dropped with a warning.
- What cannot be said yet: the roof direction of a four-corner house (that is the street look's `ridge`), per-window size or
  shape (one per wall), a hipped lean-to, a frame colour per window,
  columns, solar panels, aerials, a glazed veranda that keeps its frame colour, a windowless clad shop box with a glazed corner,
  a close-board fence.
