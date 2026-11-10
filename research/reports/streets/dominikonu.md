# Dominikonų g. photo match (wave 3)

Photos: 26 Mapillary images in `refs/mapillary/dominikonu/` (2025-09-23 to 2026-09-28, creators VidmantasM_Siaures, LorenasM_Pietu, MindaugasR_Vakaru, SigitasV_Vakaru), 10 MB, credited in CREDITS.tsv.
Coverage: only the west end (Maironio g. / Vytauto Didžiojo g. corner, the square, first ~150 m east). No image within 30 m of the centreline east of Tiesos g.; those buildings (c2674, c2673, c2670, c2675, c2677, c2750 ...) were left as they were.

Compare sheet: `research/prototypes/streets/dominikonu/compare.png` (photo | before | after, 12 views); frames in `before/` and `after/`.

## Buildings changed
| id | photo shows | set |
|---|---|---|
| c2683 | 4-storey grey-beige plaster office, ribbon windows, flat roof, glazed ground floor | plaster [.78,.77,.72], h 13.5, flat (was shop, h 13) |
| c2930 | long cream 2-storey, dark red hip roof, dark window frames | plaster cream, hip roof [.38,.2,.16], h 7.5, rh 2.6 |
| c2932 | 2-storey, yellow rusticated-brick ground floor, cream peeling plaster above, flat roof | plaster [.9,.82,.62], h 7.5 |
| c2926 | stained khaki 3-storey plaster, garage doors | plaster [.72,.64,.47], h 9.5 (was red brick) |
| c2662 | white 3-storey plaster, flat | plaster [.9,.89,.84], h 9 (was brick) |
| c2648 | white plaster, lower than its neighbour | plaster [.9,.89,.84], h 8.5 (was brick) |

Mapping photo to id used building centres projected into the game camera; the street's red brick club (c2663, owned by the club step) stands where the photos show a khaki 3-storey block and was not touched. The other 37 looks are the earlier heuristic pass, unverified by photo.

## Test
`--check` ok. `test_streets.mjs`: no console errors, all looks resolve, talks picked, both views resolve, 0 bad pushes. Its one FAIL is the instanced-prop count (931 vs 38+458) because the scratch page was built with every street's files; not a Dominikonų issue. fps 60.3 (Metal).

## Engine backlog
- Facades step adds balconies to any 4+ floor block regardless of an explicit `sty`: c2683 keeps balconies, the real office has none.
- One wall colour per building: two-tone facades (yellow brick base + cream upper on c2932, glass ground floor on c2683) cannot be expressed.
- Ribbon window rhythm and dark window frames: window tile is uniform.
- Yellow brick gable end of c2683 and its billboard: no per-wall material.
- `brick` sty ignores the wall tint (always red clinker); a yellow/khaki brick needs `silicate` or a plain `plaster` stand-in.
- photomatch snaps cameras to the nearest road, which put two frames inside a building; sign text on shops (e.g. DUBYSA, Pepirka) not mapped to ids.
