# kit-vilniaus: Vilniaus g. descriptions from photos (2026-11-15)

Files changed: `pipeline/streets/vilniaus.json` (base looks), `pipeline/kit/looks/vilniaus.json` (new, 7 houses), `pipeline/kit/views/vilniaus.json` (camera records of the 27 local frames, made by `photo_views.py`).
Proof sheets: `pipeline/kit/sheets/vilniaus/<id>.jpg` (top: Mapillary crops of that house, then square-on before row, after row; four walls each) and `photoview_*.jpg` (photo | before | after from the photo's camera). Scripts: `crops.py` (cuts a house out of every frame that sees it), `ba.py` (sheet).
Frames relied on: 46 new, 1024 px, `refs/mapillary/vilniaus/2025-*/2026-*_<id>.jpg`, credited in `CREDITS.tsv` (CC BY-SA 4.0, reference only).

## Method (what was learned about this street's photos)
- Almost all Mapillary frames are dashcam views along the road. The usable ones are frames where the car passes a house, found by projecting every house into every frame of 6,000+ near the street (camera heading taken from the next frame of the sequence, not the stored compass). Heading 182 frames on this street are real (car heading S on a side street), the stored compass is right for most.
- Camera positions are 10-30 m off, so a house is named by its place in a row of neighbours plus the 2024 orthophoto (`research/assets/houses/ortho_crop.py`), never by one frame. Where two readings were possible it is marked "guess".
- Start point is the centroid of all buildings, i.e. the game origin (c2463 / c2462 / c2019 stand next to it).

## Houses (41 with a look at the start, plus 1 new)
| id | photos | base look changed | kit keys | guessed / notes |
|---|---|---|---|---|
| c2462 (new) | 5 frames + local 2026-10 shots | was a yellow brick 2-storey; photos show a grey-blue horizontal-board 1.5-storey with dark blue-grey sheet roof, ridge along the street: wall plank [.56,.6,.68], roof sheet, h 3.4, rh 3.4, ridge street | `chim [0.5]` | chimney place read from 2 frames; window counts left automatic |
| c2463 | 5 | white plaster -> beige-grey boards, blue-grey metal roof (aerial shows the same blue), h 2.9, ridge street | front windows 2 | old dark-green boarded gable end not expressible |
| c2464 | 5 | grey brick + red roof -> brown boarded wall, dark brown roof, 1.5 storeys (h 3.4) | none (8-edge outline) | one cross gable on the front is not drawn |
| c2465 | 5 | cream plaster -> yellow boards, old grey asbestos roof, h 2.8, ridge street | front windows 2 | the new blue-metal half of the roof is not expressible |
| c2466 | 5 | grey -> salmon brick ground floor, grey siding gables (wall2 band 2.8), dark grey roof | none (8-edge outline) | the small cream gable on its left is drawn grey |
| c2514 | 5 (Gėlių g. corner) | grey plaster, dark roof -> sand silicate brick, red-brown tile roof | gable colour = wall, brick | balcony on the long wall seen in 2 frames not added (wall unclear) |
| c2515 | 5 | cream brick cottage -> black-brown boards, dark weathered roof, gable end blank, ridge along the street | none | see c7618 |
| c2022 | 5 | grey hip block -> black timber, steep roof, ridge across the street; glazed veranda on the front | `ext` glazed lean-to on the front | identity: the 5 frames agree on a black timber house with a glazed veranda here, but the photo from -108,-79 also shows a cream brick house beside it; guess. The kit veranda draws as a grey box |
| c2026 | 5 | 1.5-storey brown roof -> cream 2-storey, low red hip roof | none | |
| c2019 | orthophoto only (hedges hide it in all frames) | roof dark grey -> red clay tile (bright red in the aerial) | none | wall untouched |
| c2027 | 5 | wall colour only (silicate brick) | stone plinth 0.9 m (seen in 1 frame) | real long wall has 4+4 windows, outline too complex to set |
| c1417 | 5 | upper wall2 cream boards over the ochre stucco | none | effect is small |
| c2186 | 5 | 3-storey grey block -> 2-storey ochre stucco, low grey hip roof | none | chimneys left automatic (the kit one drew as a tan pole) |
| c2908 | 5 (veterinary pharmacy) | 2 storeys -> 1 storey with a low hip roof | none | glass shopfront draws darker than the real white wall with posters |
| c2914 | 5 | roof dark -> grey asbestos, gable to the street | front windows 2 + attic 1 | |
| c2915 | 5 | roof brown -> red sheet, wall paler | none | |
| c2910 c2911 c2913 | 5 each | checked, matches (cream stucco, red tile); unchanged | | |
| c2916 | 5 | unchanged | | frames from 2025-26 show site cabins on this plot, the 2024 aerial a red-roofed house: left |
| c2504 | 1 frame, shows another house | unchanged | | cannot tell; its crop is the pink/grey house that belongs to c2466 |
| c7618 | none good | unchanged | | the black timber cottage the earlier agent saw is probably c2515 (just fixed); c7618 may now be wrong |
| c2185 | no frame | unchanged | | scaffolding, no photo from the road |
| c2941 c2221 c2156 c5679 c7620 c214 c213 c206 c204 c7195 c7194 c2514-region c1418 c1419 | none usable / frames show other houses | unchanged | | c1418 green sheet roof still matches |
| c7170 | 5 (Eurokos shop) | unchanged | | still wrong: real is a one-storey grey-clad shop with a green fascia and glazed corner, the game draws 2 storeys of windows |
| c2467 c2909 c2181 c2904 c1525 | not touched (model steps) | | | |

No photo (not added): c2490 c2494 c2495 c2502 c2042 c2020 c2021 (frames show hedges or other houses), all houses north-west of x -450 except the ones above.

## Bytes
Page 30,394,279 vs 30,393,124 B before: +1,155 B for 16 houses, about 72 B per house (kit data 1,241 -> 1,575 B, the rest is looks). Under the 100-300 B budget.

## Checks
`add_streets.py --check` ok (42 looks), `add_kit.py --check` ok (7 houses), two builds byte-identical, `test_kit.mjs` all PASS (8,278 houses unchanged, parts on the right wall), `test_streets.mjs` PASS for all streets including vilniaus. No `kit: ignored` warning.

## What the vocabulary lacked (houses needing it)
- Multi-wing outlines (8 or more edges) are refused: c2464, c2466, c2027, c2186 (4). The cross-gabled L-houses on this street are common.
- Cross gables on the front of a 1.5-storey roof: c2462, c2464, c2465, c2466 (4).
- Two roof materials or colours on one roof (old asbestos + new metal): c2465 (1).
- Glazed veranda that stands in front of a gable and keeps its frame colour: c2022 (kit `glazed` draws an opaque grey box).
- A windowless clad box with only a glazed corner (shops): c7170, c2908 (2). `windows:false` drops the shopfront too.
- Wall material per side (old boarded gable end next to siding): c2463 (1).
- Window size and shutters: seen on c2027, c2514 (2).

## What still looks wrong
c7170 (2 storeys instead of 1), c7618 and c2504 (unknown which real house they are), c2022 (identity and veranda are a guess), c2916 (house vs. cabins), c2467 (excluded; game orange, real white with dark roof), houses beyond the centre (no new photos fetched past x -740).
