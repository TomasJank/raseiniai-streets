# Gintaro g. photo match

Photos: 38 Mapillary images in `refs/mapillary/gintaro/` (2025-10-28 to 2026-09, creators VidmantasM_Siaures, EdgarasM_Siaures, DariusD_Siaures, Agnius, MindaugasR_Vakaru, AlgirdasI_Vakaru), 13 MB, rows added to CREDITS.tsv.

Coverage: only the two ends of the 1.2 km street. The south end at Vilniaus g. (about 300 images, dashcam facing along the street) and the north end at Sodų g. (about 26). Nothing between z 50 and z 1000, and nothing on the Beržų g. stretch. Those buildings were left as they were.

| id | photo shows | set |
|---|---|---|
| c449 | two-storey yellow brick house, gable end to the street, dark green roof, concrete picket fence | silicate, wall [0.80,0.69,0.43], roof [0.22,0.31,0.24], h 5.6, rh 3.4, gable |
| c578 | small cream house, red steel roof, gable end to the street, behind a red panel fence | plaster [0.90,0.88,0.80], roof [0.52,0.17,0.14], h 3.0, rh 3.6, gable |
| c7452 | cream rough-cast two-storey block, flat roof, corner balcony (position inferred, not visible in the game render) | plaster [0.85,0.79,0.60], flat, h 6.4 |
| c1072 | white house with dark grey roof at the Sodų end, snow in the photos | plaster [0.88,0.88,0.84], roof [0.30,0.30,0.32], gable |
| c5272 | grey board shed at the Sodų end | plank [0.52,0.50,0.46], roof [0.34,0.34,0.36], h 2.6 |

Compare sheet: `research/prototypes/streets/gintaro/compare.png` (18 rows: photo | before | after). Before and after frames are in `before/` and `after/` beside it.

Confidence: c449 is a geometric match (photo 2026-10-14 hd57 sits 23 m south of it). c578 and c7452 are placed by bearing along the road axis and are less certain.

Engine backlog:
- Photomatch snaps the camera to the nearest road and the game's Gintaro/Vilniaus junction looks wider and greener than the photos, so rows do not line up pixel for pixel.
- Fence colour is not expressible: the red-brown concrete panel fences with grey plinth along the east side at the south end render as the default.
- Cream flat-roof block with cantilevered balcony and a cemetery wall of red brick with crossed pillars (west side at the Sodų end) have no engine form.
- Mapillary signs (blue bus-station totem) could not be read, so no new signs.
