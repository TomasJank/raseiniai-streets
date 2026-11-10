# Vilniaus g. facade re-pass v2 (2026-11-10)

Only `pipeline/streets/vilniaus.json` changed. Photos: the existing 27 (2025-03-04 to 2026-10-14); no new coverage fetched.

## Keys set
| id | photo shows | set |
|---|---|---|
| c2909 | 3 storeys: salmon floors, grey-green top storey, balcony loggias | `wall2` [.78,.79,.72], `band` 6.7, `balcony` true |
| c2904 | same salmon/grey block family | `wall2` [.78,.79,.72], `band` 6.8 |
| c2941 | beige block with balconies | `balcony` true |
| c7618 | black timber cottage, gable end to the road, no windows on it | `blankGable`, `ridge` "across", `roofSty` asbestos |
| c1417 | grey asbestos roof | `roofSty` asbestos |
| c1418 | green sheet roof | `roofSty` sheet |
| c2910 c2911 c2913 c2185 c1525 | red/brown clay tile roofs | `roofSty` tiles |

## Roof colours removed (orthophoto shows)
20 guessed generic greys (no photo evidence): c2916 c2909 c2908 c2186 c2181 c7195 c7194 c2221 c5679 c2904 c2156 c7170 c7620 c2515 c2465 c2463 c2027 c214 c213 c2941. Roofs the photos justify (red tile, dark, green, brown) are kept.

## Evidence
Sheet: research/prototypes/streets/vilniaus/compare_v2.png (9 rows: photo | v45 | after).
Checks: `--check` ok (41 looks). Full chain built; `test_streets`: no failure on any vilniaus id; the only failures are 28 `LOOK.* missing` ids that belong to other streets (their files changed under the build, not mine). fps 60.3 (Metal), no console errors.

## Not done / backlog
- c2909 ground floor is cream in the photo, only two tones available.
- Dense hedge fences on the SW side not placed (no coordinates measured).
- Scaffolding on c2185 still not expressible.
