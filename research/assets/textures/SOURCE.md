# Facade atlas sources

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

Licence: original work, no third-party assets (CC0 sources ambientCG / polyhaven / Kenney were not needed).
