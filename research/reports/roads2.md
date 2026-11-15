# roads2: real road surfaces from the 2024 orthophoto (2026-11-10)

## What changed
- `pipeline/geo/roads2_classify.py` (PIL only, deterministic, about 3 s) reads the page's `rasData` (default: `work/build/v37.html`, which the whole chain shares), walks every road way's centreline at 2.5 m steps and takes the median of three 5x5-pixel patches inside the carriageway (centre and +-0.22 of the road width). Shade (mean below 120, it reads bluish like asphalt), glare, vegetation, red roofs and cars are dropped. A station is asphalt when blue minus red is at least +4, gravel or dirt when it is at most -4 and not green, otherwise undecided. A way takes the surface that wins at least 70% of its decisive stations (scaled down when more than half of the readable stations were undecided) and needs 4 decisive stations. Output `pipeline/geo/roads2_surface.json` (`set`, `overrides`, counts).
- `pipeline/add_roads2.py page.html` writes a `surface` tag onto those ways: it appends the new tag sets to the end of `rasData.t`, re-points `w[i][0]`, and re-serialises the block with `separators=(',',':'), ensure_ascii=False` (a round trip of the untouched block is byte-identical, so nothing else in it moves). Way indices and node indices are not touched; every way is checked against the recorded `highway` before it is written.
- No new game code. The existing handling does the rest: `t.surface` in `/^(gravel|unpaved|dirt|ground|...)$/` sets `unpaved`, which gives the road colour, no centre dashes, no sidewalks (`pave`), `world.ground` = 1 (gravel grip row of `SURF`: max .8, acc .85, grip .7, drag .7), the gravel tyre sound, the rumble and the camera shake. Minimap draws roads by class only, so it is unchanged.
- One colour edit, because the photo's gravel is clearly paler than the old unpaved colour (before/after pictures below): `unpaved?[.58,.54,.46]:` became `unpaved?[.68,.63,.54]:` (also paler for the 45 ways OSM already tagged unpaved).
- Dirt versus gravel: with the colour rule only 4 of 350 ways came out as brown dirt, so the class was dropped. Gravel and dirt are one class, `gravel`.

## Counts (1,284 drawn road ways; 23 `highway=proposed` ways are not drawn and not counted)
| | ways | km |
|---|---|---|
| kept their OSM tag (asphalt 131, paving_stones 73, unpaved 40, paved 8, gravel 3, grass 3, dirt 1, concrete 1) | 260 | 91.6 |
| classified asphalt (tag written; no visible change, asphalt is the default look) | 346 | 50.9 |
| classified gravel | 348 | 54.6 |
| `highway=track` with no readable photo evidence, written as `unpaved` (a track is unpaved by definition) | 12 | 3.7 |
| overrides of an explicit OSM tag | 1 | |
| left alone, mixed or ambiguous | 175 | |
| left alone, unreadable (canopy, shade, glare, too short) | 143 | |
| total left alone | 318 | 29.2 |

Tag sets 443 -> 591 (148 appended), 707 ways changed, page +10,290 B (11,468,156 -> 11,478,446).
Gravel by highway: service 222, residential 82, track 30, footway 7, path 4, unclassified 3. After the step, gravel or unpaved is about 76 km of the roughly 232 km of road (a third), where before it was about 17 km.

Overrides: way 7217 (service, OSM `unpaved`): the photo shows a grey paved drive, blue minus red +20 over 13 of 13 decisive stations, so it is written `asphalt`. Eight ways had a contradiction at 85% agreement; seven were dropped because blue minus red stayed under 12 (pale old asphalt and pale gravel overlap in this photo; ways 36, 142, 4892, 4893, 5625, 7178, 8108 keep their OSM `unpaved`/`gravel`, though 142 and 4892 look like pale asphalt to me).

## Accuracy (my own check, 40 ways drawn at random with `random.seed(2026)` from the 706 written, a 80 m crop of the photo each)
I agree with 31 of 40 (78%): asphalt 19 of 22, gravel 11 of 17, track default 1 of 1. The nine I could not confirm (ways 4776, 612, 8080, 4770, 3228, 294 as gravel; 7619, 5161, 5623 as asphalt) are all short or minor ways in yards, gardens and wood edges, where the OSM line sits off the visible surface or in grass; none is a street. The gravel streets seen in the comparison pictures (Stadiono g., Eglių g. and the lanes by the school) match the photo. In the contact sheets I looked at while tuning, ways with blue minus red below about -10 were nearly always beige or brown ground; the weak band is -4..+4 where pale old asphalt and fine gravel look the same. That band is not classified (stays tarmac).

## Tests and gates (`x.html` = full chain + roads2; SwiftShader unless noted)
- `work/test_roads2.mjs`: PASS. All 707 written ways exist, are roads and carry their surface (347 asphalt, 348 gravel, 12 unpaved); Stadiono g. (gravel) reads `surface=gravel, unpaved, world.ground=1`, Vilniaus g. (OSM asphalt) reads `asphalt, ground=2`; `SURF` grip .7 vs 1; the same 1.5 s of throttle gives 9.87 m/s on the gravel street and 11.77 m/s on the asphalt one; no console errors.
- `test_fixground` PASS, `test_solid` all passed, `test_streets` PASS (14 streets, errors []), `test_ground` PASS (phone and desktop), `test_water3` PASS, `test_drive2` all ok with `errors []`.
- `test_fixwater` times out waiting for `__g.water.length` (line 21). It does the same on the unmodified chain (`base.html`) and on `work/build/v47.html`, so it predates this step (water3 replaced the water2 plane list it reads). Not caused by roads2.
- `fps.mjs` on Metal: 60.3 fps, load 2014 ms (the machine was busy; v46/ground-step runs were 1.4 to 1.6 s). SwiftShader 1.3 fps.
- Two builds byte-identical; the classifier's output is identical on `v37.html` and on the full-chain page.
- `test_facades2` builds its own page without this step, not run.

## Anchors and edited strings
- Anchors: none (no JS added). `</script>` after `id="rasData">` is found by index; the block is re-serialised.
- One body edit, exact string: `unpaved?[.58,.54,.46]:` -> `unpaved?[.68,.63,.54]:` (in `ribbon(RD,pts,ri.w,y,...)`, `buildWorld`). `bld2` appends to the same block: `add_roads2.py` indexes ways and tag sets from the block as it finds it, so the two steps compose in either order (existing indices never move).

## Comparison images (`research/prototypes/roads2/`)
- `top_{A,B,C,D}.jpg`: v47 | roads2 | orthophoto, 500 m squares from a narrow-FOV camera (-300,-1500), (600,-1200), (-600,-900), (300,-1200). The difference is visible in C (beige lanes by the school and stadium) and subtle in the others, where most streets are asphalt both before and after.
- `top_{G,S}.jpg`: 160 m squares, the clearest pairs (a gravel lane and a village street on Eglių g. and Stadiono g.).
- `eye_{stadiono,egliu,liuteronu}.jpg`: street level, before | after.

## Not done / not verified
- The classifier cannot split a way: OSM ways that are partly paved keep one surface. Mixed ways (175) stay tarmac.
- Pale old asphalt versus fine gravel (blue minus red between -4 and +4) is not told apart. The orthophoto is a single spring image.
- No dirt/brown or fresh-dark-asphalt look: the data did not justify a second colour (4 dirt ways).
- Short yard and garden ways are the least reliable ones (see accuracy).
- Regenerate: `python3 pipeline/geo/roads2_classify.py` (needs `research/geodata/ortho/tiles`, gitignored), then the build.
