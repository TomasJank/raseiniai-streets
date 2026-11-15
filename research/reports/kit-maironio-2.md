# kit-maironio-2: Maironio g., second pass with the kit-2 words (2026-11-15)

Files: `pipeline/streets/maironio.json`, `pipeline/kit/looks/maironio.json`. Edits are scripted in `pipeline/kit/sheets/maironio/apply2.py` (idempotent). Proof: `pipeline/kit/sheets/maironio/same_angle_b1..4.jpg` (photo | v70 | now, same camera, 16 views of 8 houses), `views_b.json`.

## 1. Shapes
Checked empirically from the photo cameras: a wing's `ridge: street` puts the gable on the wall facing the street edge of that rectangle only when the rectangle is laid that way, so the direction was set per house by rendering and comparing with the photo, not by reading the word.
| house | roof now | note |
|---|---|---|
| c2714 | gabled, dark grey asbestos, `wings` [main, side bay lower] | bay roof is the same colour as the main roof (photo: lighter grey, not sayable per wing); windows left automatic: `win` on its eaves wall did not pass `test_kit` (`partsOnTheRightWall`, masked false on this 2-rectangle outline), so it was dropped |
| c2707 | tall gabled middle wing, two low wings | gable now faces the street as in the photos; upper-floor window row is the automatic one |
| c2962 | gable to the street (`ridge across`), `win front [2,1]`, small annex wing lower | guess: ground windows 2 |
| c2982 | one long ridge, eaves wall with a red door under a canopy on the SW wall (`door right 0.2`), flush cross gable with the big window (`xg right 0.7`, windows [1,1]), two chimneys, wall lightened | the cross gable and door sit behind a tree in the proof frames: not judged |
| c2984 | ridge along the street, main gable to Maironio, lower front wing (rh 1.2: a 1.8 m wing cannot rise 1.8, `test_kit` checks it) | |
No dormers added: none seen in a photo except the shed dormer of c2982, which is not on a wall the kit can name from these frames (guess left out).

## 2. Two-tone walls
c2707: wall white plank, `wall2` dark grey from 2.7 m, the low wings are below the band so stay white. c2709: wall cream plaster (was grey brick), `wall2` dark above 2.6 m, h 3.4. c2709 frames show mostly hedge, the dark band is a guess from the clinic's dark roof edge.

## 3. Fences
Dumped `world.hedgeSegs` from a running page and drew them top-down with the described lines (`top.py`, scratch). c2714: the plot front had two generated 1.5 m pieces in front of the front wall and one at the left; the photos show two clipped hedge blocks with the drive between, so `noFence: front` plus two described dense hedges. c3059: three generated pieces 3.5 m in front of the front wall that no photo shows: `noFence: front`. c2984: no generated piece was left within 20 m of its front after kit 2 (described fence f5 removed them); `noFence: true` kept as a safety. c2984's fence was the open `slat` drawing, the photo has a solid close-board fence: changed to `wall` style, colour grey-blue, 1.5 m.
Hedge colours from the photos: c2713 olive-brown, c2714 dark green, c2962 bare brown (winter frames), the hedge along 2962/2972 the same, c2982 dark thuja green.

## c3060 / c3062 swap
Not swapped as far as the frames show: in two frames (37574951935423280, 1185332023558364) the game puts the cream brick gable house (c3062) at the left and the green boards (c3060) nearer at the right, as in the photos. Position error of the cameras (10 to 30 m) means this is read from the order, not measured. Left as is.

## 4. Proof
See the final message of the run for the verdict and tests.

## Vocabulary the kit still lacks
- A wing's roof colour (c2714 bay is lighter grey than the main roof): 1 house.
- `win` on an 8-corner, 2-rectangle outline whose front wall is the rectangle's long wall (c2714): drawn but `test_kit` cannot find it: 1 house.
- Close-board fence style (c2984 uses `wall`): 1.
- Hedge behind a fence (c2984 photo shows the hedge top above the fence): 1.
