# kit-vytauto-didziojo-2: second pass on Vytauto Didžiojo g. (2026-11-15)

Files: `pipeline/streets/vytauto-didziojo.json` (looks), `pipeline/kit/looks/vytauto-didziojo.json` (6 houses, 886 B compact). Proof: `pipeline/kit/sheets/vytauto-didziojo/same_angle_b_1.jpg`, `same_angle_b_2.jpg` (photo | v70 | now, 14 views), `views_same_angle_b.json`. Frames: `refs/mapillary/vytauto-didziojo/` (29 of mine, 1024 px, at most 3 per house) with lines in `refs/mapillary/CREDITS.tsv`.

## Item 1: shapes
| id | done | not done |
|---|---|---|
| c3716 | `wings` all four hip, h 9 (rh 3.4 on the two big ones); street look h 10 to 9. 3 window rows instead of 4; roofs stay. Photos show 2 tall storeys plus an attic floor, the kit cannot do 2 rows at h 9 | window counts per wall (no wall listed: lowering h alone left the wing roofs behind and one slab roofless, so the wings carry the height) |
| c3451 | `wings`: both along the street, the SW one lower (h 3.2, hip): one long roof with a low bay at the SW end, as in the 4 frames | window counts of the bay (no clear frame); chimney 0.8 from pass 1 kept. An `xg` bay was tried and drew nothing visible, dropped |
| c3446 | `win` on the SE long wall [[.25,.55,.84],[.3,.57,.84]] and a single door with canopy on the SW end (the porch). Counts and door place are guesses from one frame (606164) | the open timber-frame porch |
| c3519 | nothing. Tried `ridge street` (worse: a gable-end wall faces the camera) and low hip wings (no visible effect); reverted to pass 1 | cross gable / hip end: the frames do not show which wall carries it |
| c2923 | h 8 to 6.2 (2 storeys, auto windows now 2 rows), wall [1,1,.92] lighter; no kit key | the ribbon windows and the stepped front: `win` on this 12-edge outline failed `test_kit` (see below), so no per-wall windows; `wings` not used |

## Item 2: c3512
`balcony` removed; 4 `balc` entries, grey [.6,.62,.64], 2 stacks (at .9 and .78 on the front) on floors 1 and 2; 276 B compact. Within 300 B but only 4 of the real block's ~15 balconies, glass not sayable. Compared with none: kept (colour right, frames from the SE show the stacks). Candidate with 6 entries (floors 1 to 3) was 433 B, not used.

## Item 3: window rows
Rule found: kit rows = round((h - yb) / 3) per wall; automatic rows are about round(h/2.5); both fill the wall height, so rows can be set only through `h`. c3714: h 7.2 to 6.6, `win` on all four walls (front [5,5], back [5,5], left [3,3], right [3,3]): 2 rows. c3716: h 10 to 9, 3 rows (2 not possible without a 6 m house). A `windows: true` on c3714 blanked a wall, removed.

## Same-angle verdict (14 views, vs v70)
Closer: c3512 (2), c3714 (2), c3716 (2), c3451 (2), c2923 (2), c3446 (2, mostly pass 1's wall colour), c3519 frame 2. Cannot be judged: c3519 frame 1 (house at the frame edge). Worse: 0. c3446's door and right-wall windows are not visible from these cameras.

## Tests (on my build f1, two builds identical)
`add_streets.py --check` ok; `add_kit.py --check` ok (6 houses); no `kit: ignored` for my ids.
`test_kit.mjs`: 10 PASS, 2 FAIL, both only for c2027 (Vilniaus file, `win` e9 want 8 got 5): partsOnTheRightWall and oldDescriptionsUnchanged. All my houses pass. `test_streets.mjs`: no errors, PASS on all 14 streets including vytauto-didziojo.
Earlier build with `win` on c2923's 12 edges and rh on thin wings of c3716 failed partsOnTheRightWall for c2923/c3716; fixed by dropping them.

## What the vocabulary lacks
Storey height apart from h (c3716, c2923, c3714): 3. Glass balcony fronts and balcony density: 1. `win` on 12-edge outlines fails the masking check on walls whose rectangle sits more than 0.6 m off the OSM edge: c2923. Open timber porch: c3446.
