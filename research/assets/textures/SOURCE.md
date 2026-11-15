# Building textures: sources

## Step `tex` (2026-11-13): wall and roof material textures

All eleven come from Poly Haven and are CC0 1.0 (public domain, no attribution required; credit given anyway).
Downloaded with `python3 fetch.py` in this directory: the 1k JPG diffuse, OpenGL normal and AO maps of each, through
`https://api.polyhaven.com/files/<id>`, into `raw/<id>/` (not in git). `pipeline/tex/make.py` bakes them into
`pipeline/tex/atlas.webp`, one 512 px tile per material, which `pipeline/add_tex.py` embeds in the page.

| layer | used for | Poly Haven asset | authors | URL | tile in game | licence |
|---|---|---|---|---|---|---|
| brick | red brick walls, chimneys | Red Brick (`red_brick`) | Rob Tuytel | https://polyhaven.com/a/red_brick | 1.4 m (7 cm course) | CC0 1.0 |
| silicate | white, yellow and grey silicate brick walls | Whitewashed Brick (`whitewashed_brick`) | Charlotte Baglioni | https://polyhaven.com/a/whitewashed_brick | 2.6 m (9.3 cm course) | CC0 1.0 |
| plaster | smooth painted plaster | Painted Plaster Wall (`painted_plaster_wall`) | Amal Kumar | https://polyhaven.com/a/painted_plaster_wall | 2.0 m | CC0 1.0 |
| roughcast | rough plaster (roughcast render) | White Stucco 02 (`white_stucco_02`) | Dimitrios Savva | https://polyhaven.com/a/white_stucco_02 | 1.2 m | CC0 1.0 |
| planks | horizontal boards on houses, vertical boards on sheds and barns | Brown Planks 05 (`brown_planks_05`) | Rob Tuytel | https://polyhaven.com/a/brown_planks_05 | 1.0 m (11 cm board) | CC0 1.0 |
| concrete | prefab panel blocks | Concrete Wall 006 (`concrete_wall_006`) | Charlotte Baglioni, Dario Barresi | https://polyhaven.com/a/concrete_wall_006 | 2.0 m | CC0 1.0 |
| corrugated | corrugated steel walls and roofs | Corrugated Iron 02 (`corrugated_iron_02`) | Jenelle van Heerden, Sergej Majboroda | https://polyhaven.com/a/corrugated_iron_02 | 2.7 m (10 cm wave) | CC0 1.0 |
| asbestos | asbestos-cement wave sheet roofs | Asbestos Sheet 02 (`asbestos_sheet_02`) | Amal Kumar | https://polyhaven.com/a/asbestos_sheet_02 | 1.8 m (14 cm wave) | CC0 1.0 |
| tiles | clay roof tile (pantile) | Roof 09 (`roof_09`) | Rob Tuytel | https://polyhaven.com/a/roof_09 | 2.7 m (25 cm tile, 39 cm row) | CC0 1.0 |
| profile | profiled (box-rib) metal roofing | Box Profile Metal Sheet (`box_profile_metal_sheet`) | Amal Kumar | https://polyhaven.com/a/box_profile_metal_sheet | 2.0 m (20 cm rib) | CC0 1.0 |
| bitumen | bitumen roll roofing on flat roofs | Bitumen (`bitumen`) | Rob Tuytel | https://polyhaven.com/a/bitumen | 3.0 m (1 m roll) | CC0 1.0 |

Credit line for the page: `Building textures: Poly Haven (CC0), polyhaven.com`

The tile sizes are the physical sizes Poly Haven lists, measured again from the baked tiles (the unit in brackets), except:
`silicate` (listed 2.0 m, a 7 cm course; drawn at 2.6 m because a silicate brick is 88 mm high), `roughcast` (listed 1.8 m; drawn
at 1.2 m so the grain is a few millimetres), `tiles` (listed 4.0 m, which made a pantile 36 cm wide; drawn at 2.7 m) and `bitumen`
(listed 20 m, which made each roll strip over 6 m wide; drawn at 3 m so a roll is about 1 m).

Tried and dropped: `brick_wall_09` (too mottled for silicate), `concrete_wall_008` (formwork lines fight the panel seams),
`clay_roof_tiles_02` (tiles only 11 cm wide), `red_brick_03`, `yellow_brick`, `beige_wall_001/002`, `rough_concrete`, `plaster_grey_04`, `green_rough_planks`,
`distressed_painted_planks`, `corrugated_iron`, `asbestos_sheet`, `roof_tiles`, `plastered_wall`, `painted_worn_brick`.
Neither Poly Haven nor ambientCG has a standing-seam roof; profiled sheet stands in for it.

## Step `facades` (2026-11-09): facade atlas

No texture was downloaded. All 16 facade/roof tiles (2048 x 256 atlas, 128 px per 3.2 m x 3 m tile, upper and ground row) are painted on a canvas at load by `pipeline/facades.js` (section `//#atlas`) from rectangles and a seeded generator, then given tileable value-noise tone and per-pixel grain. Nothing is embedded in the HTML, so the added size is the code only (~9 KB).

| col | STY key | content | origin |
|-----|---------|---------|--------|
| 0 | plaster | painted plaster, window with drip sill, stains | procedural (repaint of the v37 tile) |
| 1 | old | cornice, window head, brown plinth | procedural |
| 2 | shop | ground-floor glazing band | procedural (v37 layout) |
| 3 | block | plain block, floor line | procedural (v37 layout) |
| 4 | brick | red clinker, per-brick tone, light mortar | procedural |
| 5 | wood | boards | procedural (v37 layout) |
| 6 | industrial | cladding with ribbon window | procedural + stains |
| 7 | glass | curtain wall | procedural (v37 layout) |
| 8 | tiles | clay pantile roof, staggered rows | procedural |
| 9 | sheet | standing-seam steel roof | procedural |
| 10 | flat | bitumen roll roof, gravel | procedural |
| 11 | silicate | white/yellow silicate brick | procedural |
| 12 | panel | Soviet large-panel block, seams, rust runs | procedural |
| 13 | plank | boards, wide window casing with drip cap | procedural |
| 14 | corrugated | trapezoid steel profile | procedural |
| 15 | asbestos | asbestos-cement wave sheet, lichen | procedural |

Licence: original work, no third-party assets. Since step `tex` the atlas still draws the windows, doors, frames, plinths and
the plaster / block / panel paint; the brick, board, rib and roof-tile paint of columns 4, 5, 6, 8, 9, 10, 11, 13, 14, 15 is
replaced by the textures above.
