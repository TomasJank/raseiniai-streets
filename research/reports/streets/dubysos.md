# Dubysos g. photo match

Photos: 14 Mapillary images in `refs/mapillary/dubysos/`, 2025-12-22 to 2026-09-06, all at the east end (lon 23.1100-23.1149, the Dariaus ir Girenas / Jaunimo crossings). Mapillary has no coverage for the west stretch (lon 23.103-23.109) or the far north-west primary section; those buildings were left as they were. Renders were made for 7 of the 14 photos (the machine was at load 150 and the other renders timed out).

## Buildings changed

| id | photo shows | set |
|---|---|---|
| c3731, c3736 | 5-storey peach/cream Soviet panel blocks behind a tall hedge | sty `panel`, wall peach [0.89,0.78,0.65], flat, h 15 |
| c3752, c3753 | 4-storey peach panel blocks (left of 2026-03-12 shots) | sty `panel`, wall peach, flat, h 12.5 (c3753 was a 1-storey plaster house) |
| c2928 | long 2-storey ochre brick building with dark grey hip roof and a white extension (2026-02-24, 2026-09-06 shots) | brick, wall [0.64,0.48,0.33], roof [0.30,0.30,0.31], hip, h 6.6 |

Building identification is by camera bearing and distance only; GPS of the photos is 5-15 m off, so c2928 and the c3752/c3753 match are probable, not certain. c3748, c3751 and c2923 also appear in the photos (beige-sided dormer house, panel block, peach bank-type building with green logo) but belong to other street files.

Compare sheet: `research/prototypes/streets/dubysos/compare.png` (7 rows, photo | before | after). Before/after renders beside it.

## Backlog (engine cannot express)
- Bank-type building at the east crossing: two-storey peach with entrance stairs, canopy and a green logo; no stairs/canopy prop, and the sign text is unreadable so no sign was added.
- 5-storey panel blocks keep a plain `panel` texture; balcony glazing rows and the vertical peach/beige colour banding are not expressible.
- Tall clipped hedge (2.5 m) along the north-side blocks is outside the 60 m prop band of this street's JSON points I could verify.
- Cladding on the dormer house (beige siding with dark shingles) has no `plank`-roof combination in `looks`.
