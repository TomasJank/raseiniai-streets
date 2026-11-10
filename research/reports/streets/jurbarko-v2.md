# Jurbarko g. v2 (new facade keys, orthophoto roofs)

Photos: the same 19 Mapillary images (refs/mapillary/jurbarko/). Sheet: research/prototypes/streets/jurbarko/compare_v2.png (photo | v45 | after, 11 views: 0 1 2 4 5 6 8 10 14 15 17).

## Roofs
`roof` removed from 57 looks whose colour was a group guess (north and south rows); the orthophoto roof now shows (grey slate/asbestos tones read correctly). Kept `roof` only where a photo shows the colour: c1286 green, c1295 grey, c1298 dark, c1302 red, c1558 grey, c1622 light, c1624 light grey.

## Keys set
| id | photo | keys |
|----|-------|------|
| c1286 | green steel hip roof | roofSty sheet |
| c1295 | grey asbestos roof | roofSty asbestos |
| c1298 | yellow house, dark gable end to the camera, no chimney or dormer, balcony in the gable | roofSty asbestos, ridge street, chimney false, dormer false |
| c1302 | red steel roof, chimney on ridge, solar panel, no dormer | roofSty sheet, ridge street, chimney true, dormer false |
| c1558 | grey roof | roofSty asbestos |
| c1622 | light metal roof | roofSty sheet |

Fences: hedges 17 18 21 22 30 31 (south thuja rows, photos 14 15 17) now `dense` with col #3d5a35. New `slat` fence #3c3f42 in front of c1295 (dark slat fence, photos 1 and 3) and a `wall` fence 1.6 m col #b08a4e (yellow brick pillar fence in front of c1298, photos 4 5 6; flat box, no pillars or grille).

Not set: wall2/band, faces, blankGable, balcony (no building showed a clear two-tone, a blank gable wall or a balcony on a long wall; the c1298/c1302 balconies are on the gable end, which `balcony` cannot target). South rows: ridge left to the engine, the photos show eaves to the road already.

## Checks
`add_streets.py --check` ok (64 looks, 60 fences). Full chain built in scratchpad. test_streets: no Jurbarko failure, no console errors, crowd worst null; the run's overall FAIL is only `LOOK.c2317`/`c2331` missing, which belong to another street's file being edited in parallel (not mine). fps 60.3 on Metal (SwiftShader 1, load-bound).

## Backlog
Brick pillars with grille infill still no prop; balcony on a gable end; photomatch lands in front gardens on this street, so rows 0 and 2 are fences close up.
