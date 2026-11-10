# Stonų g. photo match (2026-11-10)

Photos: 36 dashcam frames in `refs/mapillary/stonu/` (2025-12-19, 2026-01-30, 2026-03-12, 2026-04-10, 2026-06-04, 2026-08-21, 2026-10-14; 2025-06-18, 2025-12-08), @VidmantasM_Siaures, @MindaugasR_Vakaru, @Agnius, about 12 MB, rows in CREDITS.tsv.
Coverage: Vilniaus g. junction to the open fields past Plytinės g. (about 1.2 km). All frames look along the road, so only the near frontage and gables are readable; the far SW stretch (Molynės, Raseika) has no coverage and was left as is. Mapillary `compass_angle` is off by +-90 deg for these phone mounts; true heading was recovered from the road bearing and capture order.

Compare sheet: `research/prototypes/streets/stonu/compare.png` (photo | before | after, 14 views). Before shots: `research/prototypes/streets/stonu/before/`.

## Buildings changed (13 looks, 37 total in file)
| id | photo | set |
|---|---|---|
| c3891, c2918 | cream silicate-brick 4-5 storey blocks at Dubysos g. | silicate, wall [.82,.77,.68], h 13.5 (was 8.6) |
| c2204 | Lidl-side flat-roofed shop | shop, pale grey, flat, h 6.4 |
| c2195, c2250, c2317, c2331, c2324 | silicate-brick houses, steep dark-grey gable roofs | silicate, wall ~[.80,.76,.61], dark roof, h 3.4-3.6, rh 4.0-4.4 (c2195 was bright yellow plaster) |
| c2198 | light blue-grey weatherboard house, black tile roof | plank, [.72,.76,.80], roof [.20,.21,.24] (was green) |
| c2334 | grey-green boarded house, green-grey roof | plank |
| c2332 | orange rendered house, dark roof | plaster [.82,.52,.36] |
| c2189 | dark red-brown timber house, brown roof | plank, [.42,.20,.16] |

Also: 4 fences (concrete wall, grey wall, hedge) in front of those houses, 1 more Lithuanian dialogue (now 6). Signs, props, parking unchanged.

## Engine could not express (backlog)
- Sloped/ridge direction of pitched roofs is the engine's guess; real gables face the road, game ridges often run the other way.
- Fence colour/material: concrete decorative panels, dark horizontal slat fences, blue and green sheet-metal fences all render as one cream `wall`.
- Lidl: footprint in OSM is a 17x13 box, the real store is a long glazed box with a grey band; no blue-yellow sign wall.
- Roof overhang, dormer windows and the solar panels on the green-roof house (photo 2026-04-10) are not settable per building.
- 5-storey blocks: balconies/loggias with glazing are automatic only, no per-id control.
- Houses behind the pavement line (grey modern slat gates with concrete posts) have no gate prop.
