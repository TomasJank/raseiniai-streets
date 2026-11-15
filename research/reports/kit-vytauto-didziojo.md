# kit-vytauto-didziojo: Vytauto Didžiojo g. descriptions from photos (2026-11-15)

Files: `pipeline/streets/vytauto-didziojo.json` (looks, fences), `pipeline/kit/looks/vytauto-didziojo.json` (new, 3 houses). Scripts and proof in `pipeline/kit/sheets/vytauto-didziojo/`: `fetch.py`, `crops.py`, `camviews.py` (same-angle camera records), `topdown.mjs`, `segs.mjs`, `apply1.py` (the edits), `same_angle_1..5.jpg` (photo | before | after), `topdown_c3451.jpg`.
Photos: about 8,000 Mapillary frames within 65 m of the street were searched; frames were read from the 1024 px thumbnails and not copied into `refs/` (none saved, so no CREDITS lines).

## Houses
| id | change |
|---|---|
| c3512 | 4-storey block: brick-red ground floor (wall2 grey above, band 3.3), flat, h 12.8, auto balconies on |
| c3453 c3454 | 5-storey blocks: cream plaster [.86,.82,.75], flat, h 15 (brown stair bands not expressible) |
| c3459 c3456 c3514 c3448 | unchanged: photos too far or ambiguous |
| c3710 | pale green-white, 2 storeys (was 3), red hip roof |
| c3714 | pink-grey plaster, 2 storeys, red hip roof; front windows 5+5 (count is a guess, tree hides part) |
| c3716 | dark grey stone, red hip roof, h 10; iron grille (`mesh`, 1.5 m) along its street and corner walls |
| c3723 | pale pink, gable end to the street (ridge across), red-brown roof; camera frames could not be matched |
| c3709 | roof: low red-brown hip (guess from the eave edge), colour white-grey |
| c3451 | was a brown board 2-storey; photos: white boards, 1-storey, dark grey roof, ridge along the street; dense clipped hedge 1.4 m in front (new); chimney at 0.8 (guess) |
| c3519 | ochre-brown boards, dark roof, ridge along the street; existing front hedge raised to 1.4 m dense |
| c3446 | grey-brown boards, dark roof, ridge along Vytauto |
| c3475 | white weatherboard house, gable to the street, dark steep roof; front windows 2 + attic 1 (set back 30 m, seen only through its fence) |
| c2923 c2919 | roof and wall corrected from 3 to 4 daylight frames each; no same-angle frame |
| c2906 c4939 | checked, matches (teal panel block; cream stepped corner house); unchanged |
| c3715 | no photo |
| c2924 c2930 c2936 c2939 c2937 c2943 c2946 c2928 c7194 | belong to Dominikonų, Dubysos or Vilniaus files: not touched |
No photo: c3483 (hedge only), c7730 (identity unclear, probably the wooden houses by c3446), c7742 c3436 c2927 c2933 c3525 c3719.

## Fences and doubling
Generated yard fences (picket/mesh/hedge) exist only for house-kind buildings along cls 1/2 roads and cannot be switched off from the street file. I dumped them (`segs.mjs`, `world.hedgeSegs`) and looked top-down (`topdown_c3451.jpg`): at c3451 the generated red picket lies on the side-street frontage, my hedge on the Vytauto frontage, so nothing is doubled. The previous street file's hedges at c3519 stay (the photos show that hedge); I only raised the first to 1.4 m dense.

## Same-angle verdict (13 houses with frames)
Closer: c3512, c3710, c3714, c3716, c3446, c3451, c3519 (7). Slightly closer, colour only: c3453, c3454 (2). Cannot be judged (camera 10-30 m off, frame shows another wall): c3709, c3723, c3514, c3459 (4). Worse: 0.

## Bytes and tests
Street file +1,267 B compact, kit file 88 B compact (167 B pretty-printed), for 20 described houses (about 70 B each). `add_streets.py --check` and `add_kit.py --check` pass, two builds byte-identical, no `kit: ignored` warning for my ids. `test_kit.mjs` was run against v70 as base, which lacks the other agents' work, so its failures (c1417 c2019 c2026 c19 c2158 changed; c331 warnings) are not from this street; `test_streets.mjs` result for this street was not captured.

## What the vocabulary lacked
- Floor height per house (c3716, c3714 draw 3 to 4 rows where the real building has 2 to 3 tall storeys): 3 houses.
- Balcony colour for the automatic balconies (c3512 draws orange and green, real is grey glass): 1.
- Glazed full-width balcony band and stair-tower colour strips on the 5-storey blocks: 2 (c3453, c3454).
- Cross gable and hip-end with bay (c3451, c3519): 2. Complex outlines of 8+ edges (c3716, c3519, c3446, c2923) take no kit keys: 4.
- Porch with open timber frame (c3446): 1.
