# windows: automatic windows at their real size (2026-11-15)

Owner: "windows too big" on several houses; yes to a town-wide fix. Sheets: `pipeline/kit/sheets/windows/`.

## Cause (named before the change)
- `work/build/v37.html` `facadeShader` (atlas lookup rewritten by `pipeline/add_facades2.py`, the `auv=` line): every wall
  fragment samples one atlas tile per 3.2 m bay and per storey, and the window is painted at a fixed share of that tile
  (`pipeline/facades.js`, `win()`: frame 62 x 66 of 128 px on plaster, brick and silicate, 56 x 68 on boards). The storey is
  `(eaves - yb) / round((eaves - yb) / 3)`, so on a one-storey house (wall under 4.5 m) the storey is the whole wall and the
  window grows with it: at the median 3.6 m wall the frame was 1.55 x 1.86 m (plaster) and 1.40 x 1.91 m (boards).
- `pipeline/kit.js` `stWin`: the kit's windows without `winSize` show the same tile region over a whole-storey quad, so they
  had the same size.
- Regenerating the atlas tile cannot fix it: the same tile serves a 3.0 m storey of a block and a 4.3 m one-storey wall.

## Fix
- `pipeline/facades2.js` (`WIN_FIX`, `winFix`, `winK`, `WIN_GLSL`) and two lines of `pipeline/add_facades2.py`:
  - Walls of one-storey `house` and `shed` buildings in a window style (plaster, old, brick, wood, silicate, plank) get their
    texture u shifted by `WIN_U` = 1024 (`fract` and therefore the tile are unchanged). Nothing else in the geometry changes.
  - In the shader, on those walls only, the metres per tile come from screen derivatives of the view position and the uv
    (exact on a plane), the window's box (frame, sill, lintel or casing) is shrunk to the wanted size about its centre with
    its bottom (the sill) kept where it was, and the wall around it is stretched to fill the tile (piecewise linear, mip
    gradients scaled with it). Glass, frames, the night glow (`tx` and `floor(vMapUv)` as before) and the gfx glass
    reflection all read the remapped texel, so they move with the window.
- `pipeline/kit.js`: `stWin` draws a one-storey house's window (no `winSize`) as the shrunk box quad with the same numbers
  (`winK`), so described houses without `winSize` match the automatic ones; `kitSized(id)` tells `winFix` which houses set
  a valid `winSize`.
- Not touched: `build.sh` (no new step), the atlas, textures, draw calls, every wall/roof/door/porch/kit part.

## New sizes (frame, metres)
| kind | before (3.6 m wall) | now |
|---|---|---|
| one-storey house/shed, plaster, brick, silicate | 1.55 x 1.86 | 1.20 x 1.35, frame bottom ~0.95 m above the wall foot |
| one-storey house/shed, plank/wood boards | 1.40 x 1.91 | 1.15 x 1.35 |
| one-storey house/shed, `old` | 1.45 x 2.25 | 1.20 x 1.40 |
| narrow bays / low walls | as before when already smaller | never enlarged (each axis only shrinks) |
| two storeys and up, blocks, panel, shop display windows, balcony doors, one-storey commercial/apartments | unchanged | unchanged |
| houses whose description sets `winSize` (c2462 c2463 c2464 c2914 c1417) | unchanged | unchanged, every wall |

Count and spacing per wall unchanged (one window per 3.2 m bay). The kit agents found real houses often have 2-3 windows and
blank stretches; that is a count question, per house, not clearly wrong town-wide, so left as it is.

## Multi-storey check against photos
Vytauto Didžiojo g. (`same_angle_vytauto_*.jpg`): c3714, c3723 (two-storey plaster), c3710, c3716 (three-storey), c3709 (four storeys),
c3453/c3454 (five-storey). The photos show about 1.4-1.5 m wide, 1.5 m tall windows on 3-3.3 m storeys; the game's 3.0 m
storey gives 1.55 x 1.59. Close enough, so multi-storey buildings and blocks are not changed.

## Counts (final build)
2,914 one-storey houses and 829 sheds in a window style get the new size (43,826 wall triangles flagged); 41 one-storey
`apartments`, 2 `commercial`, 1 `industrial` left alone.

## Proof (all in `pipeline/kit/sheets/windows/`, opened and checked)
- `same_angle_{vilniaus,maironio,vytauto}_N.jpg`: Mapillary frame | v72 (`work/build/v72.html`) | now, same camera and box
  (`camshots.mjs` + `camsheet.py`, labels changed to v72/now; camera lists `views_*.json`: Vilniaus = `kit2/views.json` +
  `owner/same_angle.json`, the other two as given). 30 houses: wooden one-storey (c2465 c2466 c2713 c2714 c2962 c2984
  c3059 c3060 c2982 c3451), plaster one-storey (c2462 c2709), winSize houses (c2462 c2464 c2914), two-storey (c2514 c2707
  c3062 c3446 c3519 c3714), three to five storeys and blocks (c3710 c3716 c3723 c3709 c3453 c3454 c3459 c3512 c3514), shop c7170.
  Several Maironio frames show sky or a blur (camera 10-30 m off, as the kit reports say); the readable ones are enough.
- `square_c2462..c2466.jpg`: Vilniaus g. 106-114 from four sides and the street (owner `views.json`, `owner/shots.mjs`), v72 / now.
  c2465 and c2466 (descriptions without `winSize`) now have 1.15 x 1.35 windows, as in their photos; c2462, c2463, c2464
  (`winSize`) are pixel-identical to the chain without this change on their own walls (diffs only on neighbours and the dog).
- `night.jpg`: four streets at 22:30, chain without the change | now. The glow sits in the smaller glass; no glow left on the wall.
- What reads right: one-storey windows now sit about 1/3 of the wall high with wall above and below, as in the photos (c2465,
  c2466, c3059, c3060, c3451). What still differs: the count per wall (one per bay) and, on some houses, real windows are
  lower than the game's sill because the game's wall foot (`yb`) is the lowest corner of the plot.

## Fixture update (separate step)
`work/test_kit.mjs` `oldDescriptionsUnchanged` compares the kit before kit 3 (`pipeline/kit/sheets/kit3/old/kit.js`) with
the live kit on the 40 frozen descriptions. With the change and the old reference: FAIL, 12 houses changed
(c2331 c2332 c2337 c2462 c2463 c2465 c2713 c2714 c2914 c2962 c3475 c578: their one-storey kit windows; in the frozen fixture
c2462/c2463/c2914 have no `winSize` yet). Example, c2465 street wall (plank, 3.35 m): frame 1.40 x 1.78 m on a 3.35 m quad
-> 1.15 x 1.35 m on a 1.59 m box quad. The same window rule was then put into the reference old kit (one block in its
`rowsOn`, marked "fixture update (windows step)"): 40 of 40 identical again.
`partsOnTheRightWall` winShape check: expected width now follows `winK` on one-storey houses (the test's c2463 copy gets a
`wide` wall with no `winSize`: 1.56 m quad, as computed).
Bug found by `invalidIgnored` and fixed: an invalid `winSize` ('huge') had exempted the house; `kitSized` now validates.

## Tests (final build = build.sh, one at a time, Metal)
- Two builds byte-identical (`cmp`).
- `test_kit` PASS (all checks, with the fixture as above).
- `test_streets` PASS 14 streets, no errors. `test_solid` all passed.
- `test_perf`: first run 1 FAILED ("4x slower CPU steps down to 2" got level 0, a timing check under CPU throttling); rerun
  ALL PASS (level 3), and the chain without the change ALL PASS too. Draw calls: no new mesh, material or texture.
- `test_facades` PASS on both (6 fx draw calls, atlas 2048x512).
- `test_facades2` FAIL fences, wingEaves on both, with and without this change (git stash of my three files): not caused
  here (wingEaves predates per `tex.md`).

## Files
`pipeline/facades2.js`, `pipeline/add_facades2.py` (2 reps), `pipeline/kit.js`, `work/test_kit.mjs`,
`pipeline/kit/sheets/kit3/old/kit.js` (fixture), `pipeline/kit/sheets/windows/` (sheets, view lists, `nightshots.mjs` =
camshots with a `tod` per view).
