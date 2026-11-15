# kit-vilniaus-3: Vilniaus g., third pass (2026-11-15)

Files changed: `pipeline/streets/vilniaus.json` (the 11 fences only), `pipeline/kit/looks/vilniaus.json` (c2027, c2186, c2915, c2019). Sheets: `pipeline/kit/sheets/vilniaus/same_angle_3a..3f.jpg` (photo | v70 | now).

## 1. Fences
Dumped the generated garden segments (`hedgeSegs`) of the v70 page and of the current page. Where a plot had a generated segment run (c2514, c2463, c2465, c2026, c2911, c2914, c2915) the described fence now sits exactly on that run's line (same end points as the generated chain, so the kit's 1.5 m rule removes every piece); the 0.2 to 0.6 m shift towards the road is gone. Plots with no generated segment in v70 (c2462, c2515, c2910, c2019) keep their line. Thickness: the `dense` flag stays only where the photo shows a thick hedge (c2514, c2026, c2914); c2911 is a plain clipped hedge 1.4 m; c2915 is a panel at its real 1.8 m. The `col` of each hedge is kept (hedges now take colour).
Check on the final page: no generated segment lies beside a described fence. Left on the same line are continuations of the neighbouring plot (c2911: 2 segments, c2915: 2 segments past the fence's end), which are other plots' boundaries. c2514's end was extended 1 segment so no 1-segment stub is left.
No fence needed `noFence` (every one of the 11 has a fence or hedge in a photo).
Not done: driveway gaps of c2514 (generated line had a 4.7 m gap, the fence is continuous because the photo shows a continuous hedge at the corner), gate of c2465.

## 2. Shapes and details
| house | done | not done / reason |
|---|---|---|
| c2027 | `win right [4,4]` (edge 9, 10.6 m, 4 over 4 in frame 821202); `win "7" [0]` blanks the set-back wing's wall that was drawing a fifth automatic window | wings roof not set: the photos show a flat-looking dark eave, no gable to read |
| c2186 | `win front [[.18,.35,.55,.8],4]`, `right [0]` (blank end wall), `chim [.2,.4]` (two chimneys, frames 071302, 834539, 647790). Positions along the wall are read off oblique frames: guess | front door not added: hidden behind the hoarding; tried it, drew where nothing is seen, removed |
| c2915 | none | frames are night shots or 20 m away along the road; no wall can be counted |
| c2911, c2913, c2941 | none | frames 7 to 40 m, oblique, night, or showing the neighbour; cannot count windows or place a door |
| c2514 | none | `xg`: frames 910803 vs 982247/697673 disagree about which wall carries the gable (camera 10 to 30 m off), so a cross gable could not be placed; left out |
| c2465 | none | no cross gable in the frames (as the kit 2 agent said); front/right windows already there |
| c2464, c2466 | untouched | |

## 3. Trees
c2915: `noTree 14` (metres). `true` (the plot front) did not remove the tree that stands in front of the house in the photo's camera; 14 m does, and the house, white wall and red roof, now shows as in the photo. c2019: `noTree true`; in the same-angle view the trees visible are on other plots, nothing in front of c2019 was left to remove, so the frame is unchanged.

## 4. Same-angle verdict (13 houses: c2514 c2462 c2463 c2465 c2515 c2026 c2910 c2911 c2914 c2915 c2019 c2027 c2186)
- closer (4): c2462 (fence on the line, matches the photo's fence), c2465 (iron fence stands at the house front), c2514 (hedge at the plot front, as the photo), c2915 (tree gone, house visible)
- cannot be judged from these frames (9): c2463, c2515, c2026, c2910, c2911, c2914 (fence outside the frame or hidden by a generated tree), c2019, c2027 (the new wall is not in the frame), c2186 (windows differ in count but the game camera is 20 m off the photo's)
- worse: 0
Camera positions are 10 to 30 m off, so framing differs.

## Tests (final build, all run one at a time)
- `add_streets.py --check pipeline/streets/vilniaus.json`: ok (42 looks, 11 fences)
- `add_kit.py --check pipeline/kit/looks/vilniaus.json`: ok (12 houses)
- two builds back to back: byte-identical
- `test_kit.mjs`: 10 PASS (no errors, 8277 houses without keys unchanged, invalid ignored, cross gable, all keys, multiPart, fences incl. none left on a described fence, hedge colour, cost); FAIL partsOnTheRightWall and oldDescriptionsUnchanged. Of the part failures only c2027 is mine: `win` row counts 5 of 8 on edge 9 (the test counts windows 3 cm before the OSM edge; this outline's rectangle wall stands off the OSM edge, and the render shows 4 per row, correct). The others are c2714, c2923, c2984 (other streets' files, being edited by the other agents). oldDescriptionsUnchanged lists c2027 (I changed its description) and c2923 (another agent's).
- `test_streets.mjs`: `errors []`, PASS for all 14 streets including vilniaus.
