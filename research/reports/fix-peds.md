# fixpeds (2026-11-11)

Bug: `test_solid` "peds clear of solids" failed intermittently with a walking pedestrian inside a building.

Cause, not bld2: `pedTarget` puts a walker at `w/2 + .9` (+ lane) beside the road edge; if that is inside a building it retries at `w/2 + .5` and returns that even if it is also inside. Enumerating every cls<=1 road edge (2,453 edges, 60,052 samples, both sides, three lanes) on the full chain: road centrelines through buildings 0; pavement spots inside a building 381, on 36 edges, all in original OSM buildings, 0 in the 1,657 bld2 buildings. The three offender positions (-39.2,-167.6), (-144.2,-165.2), (-138.6,-188.7) are each inside an original `house` (not `b2`).

Fix: `pipeline/fix_peds.js` + `pipeline/add_fixpeds.py` (new files only, applied last): wraps `pedTarget`; when the result is inside a building it steps toward the road centre in 0.4 m steps on the same side, then the other side, skipping building and water points. Real buildings are untouched. Spots inside a building: 381 -> 0 (`work/test_fixpeds.mjs`, which also counts the base page).

Not reproduced: `test_solid` on the unchanged v55 chain passed 10 of 10 here (0 failures), and 10 of 10 with fixpeds, so the ten-run gate says nothing by itself; the enumeration above is the evidence.

bld2 colour bug: `bld2.js` called the game's random `pick` instead of `b2pick`; fixed at every call site. wallcol2 on the full chain: differ 1,151 of 8,321 before, 0 after; `test_bld2` now loads twice and compares walls, roofs, styles and heights.

## Second pass (2026-11-11): the walk step itself
Spot table (u0 = v55, unfixed): the four reported spots (-225.5,-63), (-39.2,-167.6), (-144.2,-165.2), (-138.6,-188.7) are each 2-8 cm inside the wall of an original `house` (not bld2), 1.7-2.1 m from a road edge (7 m for the second). Not pedestrian targets: a walker's straight step toward a clear target clips a house corner or wall.
Stress (`test_fixpeds.mjs`, 600 respawns x 40 steps of 0.033/0.1/0.25/0.5 s, random flee, knock-down and cower; 24,000 frames; counts walking pedestrians that enter a building):
| page | events | causes (previous mode > mode) |
|---|---|---|
| unfixed | 47 | stepPed walk>walk 30, flee>walk 5, placed from hide 5, other hide>walk 5, down>walk 1, other walk>walk 1 |
| target fix only (first pass) | about 21 per 500 respawns | walk step 16, flee 2, down 1, other 2 |
| with the guard | 0 | |
Fix: after `updatePeople`, a calm pedestrian (walk, cross, wait, idle, talk, goto not heading into a shop) inside a building returns to where he last stood clear (within 3 m) and, if walking, turns round; if there is no such spot he moves to the nearest free point within 6 m, else hides. Pedestrians heading into a shop to hide are left alone. Real-time frames up to 0.5 s are covered by the stress run.
