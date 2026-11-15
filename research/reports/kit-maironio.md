# kit-maironio: Maironio g. descriptions from photos (2026-11-15)

Files: `pipeline/streets/maironio.json` (looks, fences), `pipeline/kit/looks/maironio.json` (new, 5 houses).
Proof: `pipeline/kit/sheets/maironio/same_angle_1..4.jpg` (photo | game before | game after, same camera; 20 views of 10 houses), `views_proof.json`; scripts `fetch.py` (Mapillary tiles along the street), `mkviews.py` (camera and box per house), `cmp.py` (sheets).
Photos: 9,455 Mapillary frames in 55 m tiles along the whole street; up to 3 per house (8 to 62 m, 38 degrees off axis) rendered from their cameras against the old game. No new frames were saved under `refs/mapillary/` (the thumbnails stayed in scratch).

## Main finding
The five "silicate block" looks (h 13.5, balconies) on c2982, c2984, c3059, c3060, c3062 and on c3120, c5176, c5181, c7745 were wrong: that corner of the street (Maironio / Rytu / Vaizganto) is one-storey and 1.5-storey cottages with small outbuildings behind.

## Houses
| id | photos | base look | kit | guess |
|---|---|---|---|---|
| c2713 | 3 | cream siding, rust asbestos roof, gable to street, h 3.6 | win front [2,1], chim | |
| c2714 | 3 | mint green siding, dark asbestos roof, h 3.8 | none (8 edges) | cross gable not drawn |
| c2962 | 3 | black -> pale yellow boards, grey tile roof | win front 3, chim | |
| c2982 | 3 | block -> pale green boards, green sheet roof, h 3.4 | none (10 edges) | |
| c2984 | 3 | block -> charcoal boards, slate tile, h 3.2 | none (12 edges) | |
| c3059 | 3 | block -> grey-blue boards, dark tile hip | chim | |
| c3060 | 3 | block -> green boards, brown tile, ridge along street | chim | which of c3060/c3062 is green vs cream brick is read from crop centring (4 of 5 frames) |
| c3062 | 3 | block -> cream silicate brick, grey asbestos gable to street | win front [2,1], chim | see c3060; small gable balcony not drawn |
| c2709 | 3 | low shop: grey brick, dark tile hip, auto dormer off | none | frames mostly hedge |
| c2707 | 3 | dark grey boarded, h 4.5 | none (8 edges) | |
| c2959 | 1 | brick block -> cream plaster flat (administration annex) | none | |
| c2705 | 3 | wall white | none | scaffolded in most frames |
| c2711 | 2 | wall peach | none | |
| c3120 c5176 c5181 c7745 | aerial only | cottage / outbuildings with the roof colours seen from above, 1 storey | none | all guesses, no street photo |
| c2660 c2698 c2903 c2921 c2920 c2703 | 3 each | checked, left (upper green band, red plinth and ochre match) | | |
| c2972 c2960 c2722 c2725 c3089 c3050 c3371 c3406 c3350 c3468 c3459 c3353 c5504 c5505 c3429 c3380 | no usable frame (hedges, night, far) | unchanged | | no photo |
Not touched (model steps): c2683 c2158 c2159 c171 c92 c219 c3293. c2662 and c2932 belong to dominikonu.json: not described here.
Lamps, benches, signs and the lmsquare area were not touched.

## Fences (9 existing plot polylines, all replaced in place)
Doubling: the 9 street-file fences were the only fence data on these plots. I checked the town's generated yard fences (`world.hedgeSegs` dumped from a build): none within 16 m of any house above except 4 to 7 m next to c2714, c2984, c3059, c3120, c2926. So each old polyline was re-typed or split, never added to. Result: c2713 dense hedge 1.5; c2714 hedge 1.4 (was picket); c2959 mesh removed (photo shows no fence); c2962 low hedge 1.2 (was picket); 2962/2972 hedge kept; c2982 dense thuja 1.8; c2984 dark slat fence 1.5; c3059 and c3060 concrete panel 1.5/1.6 (was mesh, picket); c3062 dark iron mesh 1.6 (was hedge). Not described: fences of houses with no photo. Generated yard fences cannot be suppressed from these files, so a wrong generated fence beside c2714/c2984/c3059 may still show.

## Same-angle verdict (10 houses, 20 views)
Closer: c2982, c2984, c3059, c3060, c3062, c2962, c2713, c2707 (8). Cannot be judged: c2709 (frames show hedge and a neighbour), c2714 (frames far / night) (2). Worse: 0.
Colours were set by eye from the photos and then checked in the renders, not sampled as medians.

## Bytes and checks
Looks +934 B, fences -175 B, kit 180 B: about +940 B for 15 houses (about 63 B per house). Two builds byte-identical. `add_streets.py --check`, `add_kit.py --check` ok, no `kit: ignored`. `test_kit.mjs` (against a no-kit build): all PASS except `cost` (draw-call budget, caused by other streets' kit data in the shared chain, not these 5 houses). `test_streets.mjs`: PASS maironio.

## Vocabulary the kit lacks (houses)
Cross gable / L roof on 8+ edge outlines: c2714, c2707, c2962, c2982, c2984 (5). Suppress or replace the generated yard fence: c2714, c2984, c3059 (3). Solid close-board fence (slat draws open): c2984 (1). Two-tone wall with white lower storey: c2707, c2709 (2). Balcony drawn as a slab: c3062 (1).
