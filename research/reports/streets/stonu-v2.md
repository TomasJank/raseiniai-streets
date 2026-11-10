# Stonų g. re-pass v2 (2026-11-10)

File: `pipeline/streets/stonu.json` (only). Photos: the 36 frames in `refs/mapillary/stonu/`; 7 viewpoints used for the sheet (2025-12-08, 2026-03-12 x4, 2026-04-10, 2026-08-21), camera pose from Mapillary computed position and compass angle.
Sheet: `research/prototypes/streets/stonu/compare_v2.png` (photo | v45 | after, 7 rows).

## Changes
- Every guessed `roof` colour removed (37 looks), so orthophoto roofs show. One exception: c2317 got a photo-sampled dark grey `roof` back, because its orthophoto roof read red against a dark grey roof in the photo.
- c2204 (Lidl): `wall2` dark grey [.2,.22,.26], `band` 3.8 over a light wall (photo: dark upper box over glazed base).
- c3891, c2918 (5-storey silicate blocks): `balcony: true` (photo: stacked glazed loggias).
- c2198 (blue-grey boarded house, black tile roof): `ridge: across`, `chimney: true`, `roofSty: tiles`.
- c2195 (silicate, gable to road): `ridge: across`, `roofSty: asbestos`.
- c2331 (silicate, gable to road): `ridge: across`, `roofSty: asbestos` (`street` was tried and looked wrong against the photo).
- c2317: `roofSty: asbestos`.
- c2334 (white boarded house, green roof): `blankGable: true`, `roofSty: sheet`.
- Fences: #24 `wall` to `panel` col #a9a395 (concrete ornamental panel before c2331); #25 `wall` to `panel` col #aab0b2, h 1.4 (grey slat-and-post fence before c2198); #6 `picket` to `slat` col #6b5a50, h 1.6 (brown slat fence before c2334); #8 picket col #26282a (black iron fence before c2324).

## Checks
`add_streets.py --check` ok (37 looks, 27 fences); full chain built; `test_streets` PASS (stonu included, no errors); fps 60.3 (Metal).

## Not done / notes
- Views 10, 12, 13 (the 2026-08-21 frames at one shared GPS point) render off-road, so they are not on the sheet.
- No photo evidence for per-edge `faces`, `wall2` on houses, or dormer overrides, so none set.
- The Lidl blue-yellow sign wall and the green-roof solar house (2026-04-10) remain unexpressible.
