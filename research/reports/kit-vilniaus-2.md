# kit-vilniaus-2: second pass over Vilniaus g. (2026-11-15)

Files changed: `pipeline/streets/vilniaus.json` (11 fences, base looks), `pipeline/kit/looks/vilniaus.json` (c2514 balcony and gable, c2465 right wall). Scripts that made the edits: `pipeline/kit/sheets/vilniaus/work2/` (`mods.json`, `apply.py`, `proof.py`, `walls.py`, `chains.py`). Same-angle sheets: `pipeline/kit/sheets/vilniaus/same_angle_2a..2e.jpg` (photo | v70 | now).

## Fences (11) and how doubling was avoided
The base game already draws a boundary in front of every house on Vilniaus g. (70 % hedge, 15 % mesh, 15 % picket, random colour, with a driveway gap; `v37` "garden boundaries", about 7.5 m from the centreline). The street file cannot switch it off. I dumped the real segments from the running page (`hedgeSegs`, style read from the segment height) and compared per plot: where the generated one has the photo's type I added nothing; where it differs, my fence follows the same line and is taller or thicker so it covers it (dense hedge over mesh), or stands 0.2 to 0.6 m nearer the road (c2463 mesh, c2915 panel). Plots with no generated boundary got a new one. Not a clean replacement, the generated segment stays under mine.
Added: c2514 dense hedge 1.7, c2462 dark green mesh 1.1, c2463 dark green mesh 1.05, c2465 black iron picket 1.1 (front part only, gate not drawn), c2515 clipped hedge 1.25 (end part), c2026 dense thuja 2.2, c2910 black iron picket 1.2, c2914 dense hedge 1.6, c2915 dark green panel 1.5, c2911 hedge 1.6 (guess: which of c2910/c2911/c2913 owns the corner hedge), c2019 hedge 1.1 (guess). The hedge colour `col` is not used by the model hedge, so hedges render brighter green than the near-black real ones.
No fence for: c2022 (glazed veranda on the pavement), c2186 (hoarding is temporary), c2027 (front wall unclear), c7170, c2908, c1417 (shrubs seen only in one frame).

## Houses
| id | change |
|---|---|
| c7170 | h 5.0 to 3.2, one storey, light grey wall, green fascia (wall2 above 2.4 m). Now closer. |
| c7620 | h 4.6 to 3.4, light grey; guess: it is the next unit of the same shop row (order in frames 123582, 496701) |
| c2514 | wall and gable [.76,.69,.56] (were more saturated), roof darker [.32,.17,.14], balcony over the entrance on the front (SE) wall at 0.72, windows front [3,1]; hedge |
| c2515 | wall nearer black [.12,.10,.09]; hedge |
| c2026 | wall [.86,.82,.68], roof darker; thuja hedge |
| c2186 | wall warmer [.82,.70,.55] (the grey-olive of pass 1 was wrong against the tan stucco) |
| c1417 | wall back to ochre [.82,.70,.50]; pass 1 first made it greyer in the render, ochre matches the photo |
| c2914 | wall [.88,.82,.62]; hedge |
| c2465 | wall [.85,.78,.58]; windows right [2]; iron fence |
| c2908 | wall [.88,.87,.84] |
| c2910 c2911 c2913 | wall [.88,.85,.77] / [.9,.87,.78] |
| c2915 | wall [.92,.90,.86]; green panel fence |
Colours: sampled medians from photo crops are 20 to 40 % darker than the game under its light, so saturation and hue were matched by eye in the render from the photo camera, not by absolute value.

## Placed / not placed
Newly placed by the second pass: c2941 area only as far as a cream-boarded house with hedge at Pašažo g. (frame 315218), not assigned, nothing changed. Still no photo: c2916 (site cabins in 2025-26 frames, aerial shows a red roof), c2504, c7618, c2185, c2221, c2156, c5679, c214, c213, c206, c204 (Mapillary was not queried again, only the 470 cached frames, which have none of them). c2019 hidden by trees in every frame.
Not done for lack of time: Mapillary re-fetch, window counts per wall for most houses, doors and porches (c2910 porch seen but wall uncertain), dormers and chimneys.

## Same-angle verdict
Camera positions are 10 to 30 m off, so the game often looks at the house from a different side than the photo; verdicts are about colour, storeys, roof and hedge, not framing.
- closer (10): c2514, c2515, c2026, c2186, c2914, c2465, c1417, c7170, c2463, c2462
- cannot be judged (6): c2027, c2915, c2910, c2908, c2019, c2911 (camera inside another building or under a tree)
- worse: 0

## Vocabulary lacks (needs kit2 words)
- 8+ corner or `parts` outline: c2464, c2466 (front 5 windows plus door, upper cream gable with 2 windows), c2027 (4+4 windows long wall), c2186 (two chimneys and the 5-window end wall), c2915, c2911, c2913, c2941
- cross gable: c2462, c2464, c2465, c2466, c2514 (cross gable above the balcony)
- two roof materials: c2465
- remove a tree: none found
- hedge colour (model hedges ignore `col`): all hedges above
- fence replacing the generated one (no way to suppress it): every plot
