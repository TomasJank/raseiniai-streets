# Vytauto Didžiojo g. photo match (2026-11-10)

Photos: 21 Mapillary frames in refs/mapillary/vytauto-didziojo/ (2025-10-24, 2026-01-30, 2026-03-11, 2026-06-23, 2026-09-28, 2026-09-30), all dashcam frames looking SW along the street, coverage only from Ligoninės g. to V. Kudirkos g. (lat 55.3817-55.3839). The raw compass_angle is ~90 degrees off; computed_compass_angle (about 222-230) was used for the renders. 12 views rendered. Nothing photographed SW of Kudirkos or NE of Ligoninės: those buildings untouched.

| id | photo shows | set |
|---|---|---|
| c2906 | teal cement-panel 3-storey block, flat roof, Karpynė billboard on the NE end wall | wall teal, sty panel, h 10.5, flat, dark roof; sign KARPYNĖ |
| c3709 | white balconied 3-storey block, ground-floor shop | wall off-white, sty plaster, h 10.5, flat roof (was cream/orange old) |
| c3716 | dark grey stone building, red hip roof, columned ground floor | wall grey, red hip roof rh 3.5, h 11 |
| c4939 | cream corner building with white upper box, flat roof | wall cream, sty plaster, h 10, pitched false |
| c3715 | pale cream 3-storey, brown hip roof, balconies | cream, brown hip roof |
| c3714 | pale mint 2-3 storey, hip roof | mint wall, brown hip roof |
| c3710 | cream building, orange-red roof | cream, orange-red hip |

Plus 2 more Lithuanian flavour dialogues (6 total), one sign (Karpynė). Compare sheet: research/prototypes/streets/vytauto-didziojo/compare.png (photo | before | after, 12 rows). Before/after renders in before/ and after/.

## Engine backlog
- `pitched:false` on c4939 did not flatten its roof (still a hip).
- Corner modernist form (white box cantilevered over cream base) and flat-roof parapets not expressible.
- Ornate light-grey concrete balustrade fence in front of c3716: no style (picket/wall only), and frontage coordinates were not confident enough to place.
- Ground-floor maroon band and shopfront on the teal block; huge billboard art.
- Facade mapping used ray-casting of footprints vs camera pose; ids c3714/c3715/c3710 are the least certain.
