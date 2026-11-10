# Jurbarko g. (jurbarko)

Photos: 19 Mapillary images in refs/mapillary/jurbarko/ (2025-03-04, 2026-01-12, 2026-03-12, 2026-03-26, 2026-04-09, 2026-05-28, 2026-06-23, 2026-07-14), about 6 MB. Coverage is the north part (Alyvu/Gedimino junctions to Vilniaus g.) and 55.3720-55.3732 in the south; none for the middle block and none of the sideways facades, because the street is a through road photographed from the carriageway. Night, 360 and rural-stretch images were discarded.

Compare sheet: research/prototypes/streets/jurbarko/compare.png (photo | before | after, 10 views). Before renders: research/prototypes/streets/jurbarko/before/.

## Buildings changed
| id | photo | set |
|----|-------|-----|
| c1286 | cream plaster two-storey, green steel hip roof (photos 1, 2) | wall cream, roof green, hip, h 5.4 |
| c1295 | pale grey-beige 1.5-storey, grey asbestos gable (photo 1) | silicate, gable, grey roof |
| c1302 | beige house, steep red steel roof with solar panel, balcony (photo 2) | was a flat shed; silicate, red gable |
| c1298 | pale yellow plaster, steep dark gable, balcony, brick pillar fence (photos 4, 5, 6) | yellow plaster, dark roof, rh 3.9 |
| c1558 | dark brown timber house, grey roof (photo 11) | plank, brown, dark gable |
| c1622 | ochre timber house, light metal roof (photo 14) | plank, ochre, light grey gable |
| c1624 | pale yellow gable house (photo 14) | silicate cream, gable |
| c1629 c1631 c1633 c1635 c1637 c1639 c1650 c1653 c1657 c1667 c1672 | SE side, south: low cream/yellow/white gable houses behind tall thuja hedges (photos 15, 17, 18); game had boxy flat 2-storey blocks | pitched, h 4.6-5.2, rh 3.0-3.4, cream/yellow/white, mixed grey/brown/red roofs, every other one silicate |
| c1834 c1838 c1841 c1844 c1850 c1858 c1874 | NW side, south: white and yellow gables, dark grey/red roofs (photos 15, 17, 18) | same treatment |

Confidence: c1286, c1298, c1302, c1558, c1622 matched by bearing from the photo position; the two south groups are a group read (colour family and roof shape), not individually matched. Photo GPS puts the camera at junctions, so the north views look along the cross streets.

Also: 2 flavour dialogues added (6 total). No signs or places added: no shop names visible.

## Checks
--check ok; test_streets PASS jurbarko (no console errors); fps 60.3 on the real GPU (Metal), load 1.9 s; the swiftshader fallback run is meaningless on a loaded machine.

## Engine backlog
- Wall texture per bay: the yellow house balcony, pillar-and-grille fences (yellow brick pillars) have no prop kind.
- Roof material (asbestos, steel, tile) is a colour only from street JSON; no roof sty key.
- Gablet / cross-gable roofs (photos 4, 5) not expressible: one ridge only.
- Dark slatted fences in front of houses: no fence style with that look (hedge/picket/mesh/wall only, no colour).
- Photo registration: photomatch snaps camera to the road and often lands inside a front garden on this street.
