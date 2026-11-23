# kit: more words for ordinary houses (step 1 of 2)

Status: done as step 1, not in `build.sh` (the integrator appends `kit` as the last step: `... props2 tex kit`).

## Files
- `pipeline/kit.js`, `pipeline/add_kit.py`: the step. `add_kit.py` also has `--check FILE` (validate a street's kit file) and
  `--sides ID ...` (each wall's index, length, compass side, distance to the road and side name).
- `pipeline/kit/looks/{slug}.json`: the descriptions, one file per street, keyed by building id (`_example.json` uses every key).
- `pipeline/kit/photo_views.py`: camera records (position, compass, focal) for `refs/mapillary/{slug}/*.jpg` from the Mapillary API,
  written to `pipeline/kit/views/{slug}.json` (done for 10 streets).
- `pipeline/kit/shots.mjs`: renders the game from those records (no road snapping unless `snap: true`) or square-on to one wall.
- `pipeline/kit/sheet.py`: photo | before | after sheets plus the house from four sides. Sheets: `pipeline/kit/sheets/`.
- `work/test_kit.mjs`; README section "House kit keys" in `pipeline/streets/README.md`.

## Why the keys are not in the street files
`add_streets.py` rejects any look key it does not know, and it is not mine to edit, so the keys live in
`pipeline/kit/looks/{slug}.json` (same ids; every id must have a look in the street file). If the integrator prefers them inside
`looks`, adding the 13 names to `LOOK_KEYS` in `add_streets.py` and having `add_kit.py` read them from there is a small change.

## Vocabulary
Chosen from about 40 houses in the Jurbarko, Stonų, Gintaro and Kalno photos. What differed most between photo and game, in order:
window count per wall (the game puts a window in every 3.2 m bay, real houses have two or three per wall and blank stretches),
gable-end attic windows (the game's gable triangles are always blank), side extensions and lean-tos, chimney place, dormers
(often one wide shed dormer), gable boarding in another colour, the grey plinth, entrance porches, balconies on the gable.
Doors are rarely visible from the road (fences, hedges), so they were described where seen or guessed (see below).

| key | value |
|---|---|
| `front` | edge index of the street wall when the automatic one (nearest a named street) is wrong |
| `win` | `{side: [row, ...]}`; a row is a count or a list of positions; rows past the wall storeys are the gable attic and loft |
| `winShape` | `normal wide narrow` |
| `frame` | frame colour of the described windows |
| `door` | `side at type(single double glass garage) col steps porch(none canopy closed)`, one or a list |
| `gable`, `gableSty` | colour and material of the gable triangles |
| `plinth`, `plinthH` | foundation strip colour and height |
| `ext` | `side at w d h roof(lean flat gable) wall roofCol glazed sty`, one or a list |
| `balc` | `side at w floor col` |
| `chim` | count or positions along the ridge (replaces the automatic and LiDAR chimneys) |
| `dorm` | `side n type(gable shed)` (replaces the automatic dormers) |

Sides: `front`, `back`, `left`, `right` (as seen from the street, facing the front) or an edge index; positions are fractions
from the left end of the wall as seen from outside. `add_kit.py --sides` prints the mapping.

## How it is drawn
- While a described house's walls are drawn (`addBuilding` wrapper) only three things change: the gable colour, the automatic
  chimney/dormers switched off when `chim`/`dorm` are given, and the start of its triangles is remembered.
- After the whole building is drawn (`facadeRec` wrapper) the parts are added on the OSM outline, so outlines the game splits into
  rectangles (`tags.parts`: 6 of the 12 houses) work too; heights and the roof come from the largest part, and a wall counts as a
  gable end or eaves wall when it lies on that part's gable or eaves line.
- Windows: the wall's styled triangles get the blank atlas tiles (the facades2 mask, `sty+16`), and each window is one quad that
  shows the window tile of the same atlas style and floor, tagged with the wall's `tex` material, so frame, glass, sill, night glow
  and the plaster or brick around it match the automatic windows. The frame colour is a per-vertex tint in the kit mesh's shader.
- Large parts go into the merged building mesh (cast shadows): extensions and closed porches (as small buildings through the
  same `addBuilding`, so they get atlas windows and `tex` textures), porch roofs, balconies, dormers. Small parts go into one extra
  mesh with a clone of the building material, `castShadow=false`, static matrix: window and door panels, steps, plinth, chimneys.
- Invalid values are dropped per key or per item and listed once: `console.warn('kit: ignored c1298.door; ...')`.

## Numbers
(filled in after the agent stopped, from `work/test_kit.mjs` on the v68 chain, 40 houses described)
- Added triangles: 3,167 over 39 fully described houses, 81 per house (budget 150). Kit mesh 1,726 triangles, one mesh, no shadow,
  static matrix. Draw calls not higher than without kit at the start view and from 600 m up.
- Page: +17.4 KB code, 1,241 B of data for the 12 houses (about 100 B per house).

## The 12 houses
Stonų c2331 c2332 c2334 c2337, Jurbarko c1298 c1302 c1401 c1274 c1484 c1629, Gintaro c449 c578. Sheets in `pipeline/kit/sheets/`
(regenerated on v68; `views.json` there is the camera list for `shots.mjs`).
Read of the sheets: the square-on views show the described parts where they were asked for (c1298 two front windows, attic window
and the shed dormer; c2337 closed porch with a glass door; c2331 fewer windows and a dormer). From the photo viewpoints the gain is
small: Mapillary's camera positions are a few metres off, so several game views do not frame the house the photo shows (c1484,
c1629, c578), and where they do the difference is a window count at 40 m. The vocabulary works; these 12 are not proof that a
described house reads as the real one from the street. A step-2 pass should check each house square-on, not from the dashcam view.

## Tests
`work/test_kit.mjs kit.html base.html [kit2.html]`: all pass on the v68 chain (builds identical, no errors, 8,278 houses without
keys unchanged, invalid values ignored with one warning, every key's part on the right wall, cost). The test runs on Metal (two
pages of this size never finish loading in one software-rendered browser) and with automatic quality off.

## Not expressible yet
- The roof direction itself. Two of the 12 houses (c2331 Stonų, c1274 Jurbarko) have the ridge turned 90 degrees from the photo
  by their street look's `ridge` / LiDAR fit; kit keys cannot turn it, so their gable windows land on the wrong walls.
- Window size per wall (one `winShape` per house), shutters, window bars, a door on an extension, porch columns, solar panels,
  aerials, satellite dishes, house numbers.
- Doors and steps are panels on the wall, not openings; extensions and porches are not solid for cars and people.
- Gable rows need a four-corner gable roof on the largest part; on hip roofs and skeleton roofs only wall rows work.

# kit 2: shape (2026-11-15)

Status: in `pipeline/kit.js` / `pipeline/add_kit.py` (replaced in one go after the checks below; the pre-kit-2 copies are kept in
`pipeline/kit/sheets/kit2/old/` for "before" builds). Scripts and sheets: `pipeline/kit/sheets/kit2/`
(`build_with.sh` = build.sh's chain with the kit step swapped or left out, `probe.mjs`, `sqviews.py`, `mont.py`, `same4.py`,
`views.json` + `photos/` = the proof cameras and frames).

## Keys added
| key | value | what it draws |
|---|---|---|
| `xg` | `side at w d rise wall gable roofCol win` | cross gable: a gabled box on an eaves wall, ridge at right angles, buried in the main roof where its ridge meets the slope; flush (`d` 0, drawn 0.12 m proud so the planes never coincide), a bay, or an L/T arm (long `d`); its gable takes `gable`/`gableSty`, its roof the main roof's material; `win` rows on its front (storeys, attic, loft). The main roof loses its eaves overhang, as facades2 already does for wings |
| `wings` | per rectangle: `ridge street/across`, `rh`, `h`, `roof gable/hip/flat` | the roof of each rectangle the game splits an 8+ corner outline into (`--sides` lists them) |
| `noTree` | `true`, a side, or metres | generated trees (LiDAR list + trees2) in the plot front / within r m are never planted: no crown, no trunk collision |
| `noFence` | `true` or a side | the generated garden boundary in that plot front goes (drawing, props2 hedge pieces, collision) |
| `roof2` | `at [from,to] side col sty` | a panel 4 cm over part of a gable roof in another colour/material |
| `walls` | `{side: {col, sty}}` | one wall and its gable triangle in another colour/texture |
| `shut` | colour | shutters beside every storey window the kit draws |
| `winShape` | now also `{side: shape}` | window size per wall |

Fences without a key: a street file's `fences` polyline removes every generated garden segment (the 5-value `hedgeSegs`) with both
ends within 1.5 m of it and parallel (|cos| > 0.9): out of `hedgeSegs` (so out of collision, dogs and foxes), out of `P2.yh`
(props2's hedge rows) and out of the merged double-sided fence meshes (vertical triangles and hedge tops on the segment). This runs
at the start of `buildExtra`, which the town calls inside `buildWorld` once `world` is set and before walls and hedge rows are made.
A described `hedge` with `col` tints its props2 pieces to that colour. On today's streets 47 generated segments go.

## Why 8+ corner outlines "were refused", and what was wrong
Nothing in the code refused them: `add_kit.py` had a check on `tags.parts`, but `street_ids.Town` reads only the OSM tag table, which
never holds the parts (`rasData.lp`), so the check never fired; the README said such houses were skipped, and the describing agents
believed it. What really happened on such houses: the game draws the outline as 2-3 LiDAR rectangles (`lp`) whose walls stand up to
0.25 m in or out of the OSM edges, while the kit masked automatic windows only within 5 cm of the OSM line and put its own 3 cm in
front of it. So on c2464/c2466 most walls kept their automatic windows and the kit's windows were hidden inside or floated in front;
gable rows, dormers and chimneys only knew the largest rectangle. Now (outlines with 8+ corners and 2+ rectangles only, so older
descriptions draw exactly as before): every rectangle wall on an OSM edge (parallel, within 0.6 m, overlapping) is masked, windows,
shutters and doors go 3 cm in front of the rectangle wall at their own position, `ext`/`balc` on the nearest rectangle wall, gable
rows/`dorm`/`xg` use the roof of the rectangle the wall belongs to. Still not on such houses: the plinth follows the OSM outline
(changing it would have changed c2027's existing plinth), so it is hidden where a rectangle wall stands outside; `chim` and `roof2`
use the largest rectangle; 5-7 corner outlines behave as before (two existing descriptions, c1629 and c2337, depend on that).

## Proof houses (Vilniaus g., `pipeline/kit/looks/vilniaus.json`)
| id | keys | against the photo |
|---|---|---|
| c2462 | `xg` left (the eaves wall to Vilniaus g.) at 0.25, 3.8 m, flush, rise 0.9, windows [1,1]; `noTree: true` | the flush cross gable with attic window at the NW end of the street wall now stands where frame 2429974844115834 has it; the three generated trees on the lawn to Bažnyčios g. are gone (the 2026-05 photo shows lilacs, no trees). Ground-floor window count under the gable is a guess. In frame 859445 the stored box frames the neighbour (camera 10-30 m off); c2462 is the grey house at its right edge, whose street-side gable is this cross gable |
| c2464 | `wings` all three along the street, the NW one lower (rh 2.6) | was three gables to the street with the middle one tallest; now one stepped roof along the street with its tall gable at the SE end, as the photo from the SE shows. The real roof is one continuous slope; the rectangles still step a little |
| c2465 | `roof2` NW half both slopes dark blue sheet | the photo's new blue-metal half over the old asbestos: reads right from the street. The NW half's brown boarded wall is not sayable (walls are per side, not per half) |
| c2466 | `wings` SE two rectangles 2 storeys (h 5.4, rh 3), NW one as it was, all ridges along the street | was three gables to the street; now a tall part at the SE end with its gable to the SE and a lower long roof to the NW, as in frames 1178399790939227 / 939227. Its upper storey is the street look's grey `wall2`, the photo's is cream (base look, not mine) |
The describing agent's c2465 "cross gable" is not in its frames as far as I can see (the yellow gable is the house's own end); none added.

## Numbers (final build, 29 described houses on today's streets, test with 40)
- Triangles: 42 per described house on average in the test (40 houses; 1,691 added, kit mesh 1,004); a cross gable is 18 building
  triangles + 2 per window, `wings` changes triangles but adds none, `roof2` 2 per slope, shutters 4 per window.
- Draw calls: kit adds exactly one mesh (the kit mesh, no shadow, static matrix), as before; fence and tree removal only remove.
  `test_perf.mjs` start view 610 calls / 5.03 M triangles (budget 620 / 5.4).
- Page: kit step adds 35,791 B (was 18,199): +17.6 KB code; data 2,377 B for 29 houses (old kit on the same files 1,992 B):
  the four proof houses' new keys are 385 B, about 96 B per house.

## Proof sheets
`pipeline/kit/sheets/kit2/same_angle_<id>.jpg` (photo | v70 | before kit 2 = live chain with the old kit | kit 2, same camera and box)
and `square_<id>.jpg` (square-on and 45-degree views of the changed walls, before kit 2 | kit 2). Mapillary camera positions are
10-30 m off, so the same-angle views of c2462 show the house from the Bažnyčios g. corner rather than from the photo's spot.

## Tests (final build = build.sh, 29 described houses)
- `work/test_kit.mjs fin.html base.html fin2.html old.html`: all PASS: two builds byte-identical; 8,277 houses without keys
  unchanged; every one of the 25 descriptions valid before kit 2 has the same building and kit triangles as with the old kit
  (hash per house; the 4 proof houses with new keys excluded); invalid values of every key (old and new) ignored with one warning;
  each key on the wall it names, from the geometry (cross gable drawn on the eaves wall at `at` with its windows 3 cm in front and
  refused on the gable end; wing ridges along the asked direction at the asked rise; flat wing flat; `walls` colour and texture;
  `roof2` panels; shutters; per-wall window width; no tree left in a `noTree` zone, no garden segment in a `noFence` zone; win,
  door, plinth, chim, gable, frame on c2466, 8 corners); fences (47 generated segments cut on today's streets, none left within
  1.5 m of a described fence, none of them in props2's hedge rows, none drawn, none in collision, the 13,517 others kept with walls);
  described hedge colour reaches its pieces; cost.
- The cost check no longer compares one render's draw calls (that varied by ~50 with traffic and perf2's cull tick): kit must add
  exactly one mesh to the scene, under 150 triangles per described house, without shadow, static.
- `test_perf.mjs` ALL PASS (start 610 calls / 5.03 M tris with kit 2, 605 / 5.03 with the old kit, same chain);
  `test_streets.mjs` no failure, no errors, all 14 streets; `test_solid.mjs` all passed.
- Pages are opened one at a time on Metal; `pipeline/kit/sheets/kit2/build_with.sh out.html old|kit|none` builds the chain with
  the old kit, the live one or none.

## Not done
- Close-board fence: `fences` styles are checked by `add_streets.py` (`FENCES`), not mine; a new style name needs a line there.
  (The street-side drawing would be a few lines in `fence2`.)
- Glazed veranda keeping its frame colour (c2022) and the windowless clad shop box with a glazed corner (c7170, c2908): the first
  needs the frame tint in the building material's shader (extensions are building-mesh, not kit-mesh), the second a new facade
  style; neither fits in a few lines.
- Plinth on 8+ corner houses still follows the OSM line (see above). `wings` cannot merge rectangles: a real single roof over
  three rectangles is drawn as three stepped roofs (c2464).
- c2465's brown boarded NW half (wall material per half wall); c2466's cream upper storey (base look `wall2`).

## kit 2, second round (after the street passes)
- `partsOnTheRightWall` miscounted windows on outlines the game splits into rectangles (c2027 "want 8 got 5"): it measured against
  the OSM line. It now finds the wall triangle actually drawn behind each window or door (3 / 4.5 cm behind it, facing the same way)
  and counts storey windows on styled walls, attic windows on gable triangles; a part with no wall behind it is "floating" (fail).
- `oldDescriptionsUnchanged` compared live descriptions, which street agents had since changed. It now compares the old kit with the
  live kit on a frozen fixture: `pipeline/kit/sheets/kit2/old/fixture/` (the 25 descriptions that existed when kit 2 started, and the
  street-look ids they need; `add_kit.py --streets` reads those), built by `old/fixture.sh base.html old.html new.html`.
- Kit fault found while restoring c2923 (12 edges): a `win` row of `[0]` on a short OSM edge did not blank it, because the rectangle
  wall drawn over that edge runs past it and its triangles' centres lie elsewhere. On 8+ corner outlines a wall triangle is now masked
  when it overlaps the edge by 0.3 m (before: when its centre lay on it). No live description changed by it (whole-mesh hash of the live
  descriptions, old kit vs new, identical).
- `xg` drawing nothing: c3451's bay was on the street wall while its look's `ridge` was `across`, so the wall was a gable end and the kit
  refused it with "has no roof slope over it" (in the console, not silent, but unclear). The message now says "is a gable end; a cross
  gable needs an eaves wall". Also, on outlines of 5-7 corners split into rectangles an `xg` only looked at the largest rectangle; it now
  takes any rectangle with an eaves wall on that edge. c3519's hip `wings` did change the two small rectangles (the test checks their
  rise and ridge); they stand at the back and side, hidden by the main block from every camera the agent had.
- Restored: c2984 wing 1 `rh` 1.8 (the agent's value before the test; the game caps it at 1.26 on that 1.8 m wing, so it draws the same),
  c2714 `win` front [4] (from the agent's scratch copy; the frames show mostly its gable end, so the count is the agent's, not
  re-checked), c2923's per-wall windows (`winShape` wide, 2 rows of 8/7/3/3/5/3 ribbon windows on edges 2/5/8/9/10/11, the short jogs
  blank; from the agent's script e13): the same-angle render now shows the ribbon windows of frames 950989774021969 / 1692676051896343.
  Not restored: c3451's `xg` (its wings now make the street wall an eaves wall, but the agent's final reading is a lower wing, not a bay),
  c3519's wings (no evidence in the frames either way).

# kit 3: what the owner's Vilniaus g. houses needed (2026-11-15)

Status: in `pipeline/kit.js` / `pipeline/add_kit.py` (developed as `kit_next`, replaced in one go after the checks below). The kit
before kit 3 and a frozen fixture of every description that existed when kit 3 started (40 houses, six streets) are in
`pipeline/kit/sheets/kit3/old/` (`fixture.sh base.html old.html new.html`). Scripts and proof: `pipeline/kit/sheets/owner/`.

## Keys added
| key | what it draws | cost |
|---|---|---|
| `winSize` (house or `{side: size}`; `small` .75, `normal`, `large` 1.3, or frame width in m) | storey windows of `win` rows at that size, centred where the atlas window sits; a wall with a size and no `win` row keeps its automatic count (one per 3.2 m bay) drawn by the kit | 2 tris per window (the automatic ones were part of the wall) |
| `halfHip` (true = .35, or .15..0.6) | four-corner gable roof: the top of each gable triangle cut off, ridge ends pulled in, a hip facet with its slope fill and eaves underside | 14 building tris per house |
| `walls` `at: [from, to]` | a panel over part of one wall (blank atlas tile, its own colour and `tex` material); windows inside it take its colour | 2 kit tris |
| `door` `porch: "recess"` | dark opening plus a brick pier, no leaf | 12 kit tris |
| `ext` `win`, `door`, `doorCol` | windows (masked front, extension's colour, style and material) and a door on the extension's front | 2 per window, 6-12 per door |
| `xg` `up`, `size`, `rise` up to 1.4 | wall dormer: box from the eaves, `up` m of wall then its gable, peak may stand above the main ridge; all its walls blank tiles, its `win` row 0 fills the band | as `xg` (18 tris) |
| `wings` `d` | rectangle drawn `d` m deep from the street, the rest behind with a flat roof at the same eaves (one more box); its roof is used for gable rows / cross gables | ~10 building tris |
| (no key) | on split outlines, `win` rows above a wall's storeys go on a taller rectangle standing at that position | 2 per window |

Every description valid before kit 3 draws the same triangles (fixture hash, 40 of 40 identical); no new draw call (kit still adds one
mesh, no shadow, static); small parts (windows, panels, recess, pier) are in the kit mesh; invalid values of the new keys warn and are
ignored. Test average 30 added triangles per described house (budget 150).

## Window size: what the automatic windows are
The atlas tile is one 3.2 m bay by one storey; the kit's windows used the same tile, so both are: frame 1.40 m wide on board walls
(`plank`/`wood`; casing 1.70 m), 1.45 m on `old`, 1.55 m on plaster, brick and silicate; glass 1.15 / 1.30 m. Height scales with the
storey: the frame is 68/128 of it. On one-storey houses the storey is the whole wall up to the eaves, so in today's town
(one-storey houses with a facade style: 1,795 plaster, 802 plank, 473 silicate, 223 brick, 19 wood) the median wall is 3.6-3.7 m
(p10 2.8, p90 4.3) and the automatic frame is 1.4-1.55 m wide and 1.9 m tall at the median (1.5 to 2.3 m). The owner's straight-on
views give 1.1-1.2 m wide windows on the old wooden houses, typically about 1.3-1.4 m tall. So the automatic windows of small
one-storey houses are oversized town-wide in the same way: about 20-30 % too wide and 35-40 % too tall at the median wall. Not changed
(the town default is not mine); `winSize` 1.1-1.2 per house fixes the described ones.

## Not done
- One window shape/size per wall: no per-window size, so c2462's "wide low" window and its bay window share a wall setting.
- Lean-to roof hipped at both ends (c2022's shop front is a plain lean-to); multi-pane glazing; per-window frame colour (c2465's
  dark-framed window in the brown part).
- `halfHip` only on houses the game draws as one rectangle; `chim` on split outlines still uses the largest rectangle's ridge.
- On four-corner houses whose LiDAR rectangle stands a few cm off the OSM line, kit windows can sit 1.3 cm (not 3 cm) in front
  of the wall; the test now allows 2 cm (pre-existing behaviour of the kit's offset rule, not changed to keep old houses identical).

# roofbug: the floating roof near the police station (2026-11-15)

## What it was
The owner's screenshot is c2707 (Maironio g. 18, 60 m from c2158), rectangle (wing) 1, the 8.2 m NE end of its street front. The
game's LiDAR fits that rectangle with a single slope (`tops` 3.2 m at the NE wall to 6.1 m at the inner wall). The street look set
`pitched` (h 5.0, rh 3.4, ridge street) and the kit wing only `ridge`, so `addBuilding` drew both: walls to the LiDAR `tops` (the dark
"wedge" with windows on its sloping top) and a gable at h = 5.0 m over the rectangle, 1.8 m above the low wall and under the high one.
`facades2` clears `tops` only when a look says `pitched: false`. The description was also wrong on its own: the photo
(2584711671923916) shows a steep gable to the street, ridge across, eaves about 3 m, top about 8.2 m (the LiDAR's top).

## Fix
- c2707: look h 3.0, rh 5.2, ridge across; wing 1 `{"ridge":"across","h":3.0,"rh":5.2,"roof":"gable"}` (wings 0 and 2, the low annex,
  unchanged). The photo's gable window is not drawn: on a split outline the kit centres gable rows on the whole OSM edge, so a window
  centred on one rectangle's gable is refused ("does not fit"); left for later.
- kit.js: on a described house, a part drawn pitched keeps no LiDAR `tops` (walls stop at the eaves under its roof), and an outline of
  5+ corners drawn whole gets no pitched roof (addBuilding roofed its first four corners); both are warned (`kit: ignored c….wings:
  rectangle k has a single-slope LiDAR roof …`) unless a wing's `roof` says it. Looks without kit keys are only warned
  (`kit: looks that pitch a roof their walls do not carry: …`), never redrawn, so houses without kit keys stay identical.
- add_kit.py: `wings` is accepted on a four-corner house too (one entry), so a photo's gable can override a single-slope LiDAR fit.

## The sweep (`roofsRestOnWalls` in work/test_kit.mjs)
Every described house (street looks and kit entries, 477 drawn) on the build as made: along each wall standing on the ground, every
0.5 m, the roof over a point 15 cm inside, its plane taken back to the wall line, against the wall's top (gable included): roof more
than 6 cm above it (unless the eaves 0.3 m out reach down to it), wall more than 0.3 m above the roof, no roof at all, and roof corners
more than 1.15 m from every wall outside the outline (door canopies are 1.1 m). On v74 it flags 17 houses, all one cause: `pitched`
over LiDAR `tops` (16) or over an unsplit 8-corner skeleton outline (c1622). It flags none after the fix. The fixture check now allows
a house to change only when the live kit warns about it, the sweep flags it on the old kit and not on the new (c2707 only).

## Houses
- From photos: c2707 (above), c7618 (black cottage, "gable end to the road" in kit-vilniaus: wing `roof gable`), c1624 ("pale yellow
  gable house": look roof keys deleted, wing 0 `roof gable` at the LiDAR height, the annex keeps its measured lean-to).
- Fallback, roof not told by any photo (look keys `pitched hip h rh ridge` deleted, the game's measured roof): c7174, c3752, c1622,
  c1850, c1858, c5129, c7400, c2189, c2913, c3590, c4552, c1835, c2205, c2270; and c2467 (drawn by the lmvil3 model, deleted so the
  fallback house is whole if the model is missing).
- Sheets: `pipeline/kit/sheets/roofbug/c2707.jpg` (v74 | fixed, owner's viewpoint and four sides), `sweep.jpg` (the 16 others, four
  diagonal views each; several of those views are blocked by trees or framed off the house).
