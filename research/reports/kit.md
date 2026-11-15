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
