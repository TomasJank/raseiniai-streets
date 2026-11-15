# Step `tex`: wall and roof textures (agent `walls`, 2026-11-13)

Status: done, ready to add to the chain as the last step (`python3 pipeline/add_tex.py out.html` after `mhchars`).

Takeover note: the previous `walls` agent built everything below; I rebuilt, re-tested and re-shot it, judged it by eye,
and changed one thing: bitumen was drawn at 7 m per tile, which made each roll about 2.3 m wide and showed as three
broad pale bands on every flat roof. Now 3 m per tile (rolls about 1 m) with contrast 0.7.

## What went in
Eleven CC0 Poly Haven materials, baked by `pipeline/tex/make.py` into one 512 px per layer WebP strip
(`pipeline/tex/atlas.webp`, 243 KB; page grows by 332 KB with base64 and code). Layers: red brick, silicate brick,
smooth plaster, roughcast, planks (horizontal on houses, vertical on sheds/barns), prefab concrete, corrugated steel,
asbestos-cement wave sheet, clay roof tile, profiled metal roofing, bitumen roll roofing.
Sources, authors, URLs and tile scales: `research/assets/textures/SOURCE.md`. Re-download with `python3 research/assets/textures/fetch.py`.

## How it works
- `add_tex.py` runs after the whole chain: embeds the strip as `<script id="tex_atlas">` and splices `tex.js` before boot.
- `tex.js` wraps `addBuilding` to tag every triangle it pushed with a material index (`tex` vertex attribute), wraps
  `mkGeo` to attach the attribute to the merged building geometry, and wraps `buildWorld` to hook the building
  material's `onBeforeCompile`. Nothing in `facades.js` or other steps is edited.
- Texture coordinates come from world position and normal: walls use (along the wall, up); pitched roofs use
  (along the eaves, down the slope); flat roofs use the building's longest side (encoded in the fraction of `tex`).
  Scale is set in metres per layer (brick course 7 cm, silicate 9.3 cm, board 11 cm, pantile 25 cm, corrugation 10 cm,
  asbestos wave 14 cm, box rib 20 cm, bitumen roll 1.2 m).
- Each tile is normalised to mean 128, and the shader multiplies the building colour by tile/128, so every building
  keeps its colour and the far view (where mipmaps average the tile to its mean) is unchanged. Mipmaps + 8x anisotropy.
- Atlas styles whose painted tile drew the material itself (brick, boards, ribs, roof tiles) give that paint up for the
  texture (replaced by the paint's mean brightness); plaster, block and panel tiles keep theirs (seams, stains).
  Windows, doors, frames and plinths (atlas alpha 1) are untouched; the night glow is unchanged.

## How a building picks its material (`texWall`, `TEX_ROOF` in tex.js)
- Walls, from the facade style: brick -> red brick if the wall colour is clearly red, else silicate; silicate -> silicate;
  wood/plank -> planks (vertical boards for `kind==='shed'`); block/panel -> concrete; industrial/corrugated -> corrugated;
  asbestos -> asbestos; glass -> none; plaster/old -> smooth plaster (old always, others 50/50 by `hash(rid)`) or roughcast.
  Unstyled sheds: brownish -> boards, grey -> roughcast. Chimneys -> brick.
- Roofs, from the roof style key: tiles -> clay tile, sheet -> profiled metal, flat -> bitumen, corrugated -> corrugated,
  asbestos -> asbestos sheet. Unstyled flat roof tops in the roof colour -> bitumen.

## Measured (scratch builds, 2026-11-13)
- `work/test_tex.mjs tex.html base.html`: all 13 checks pass. Two builds byte-identical; +332 KB; every layer averages
  128; every material used (buildings per material: brick 1953, silicate 1793, plaster 3018, roughcast 3196, planks 1371,
  vertical boards 1353, concrete 341, corrugated 1159, asbestos 2418, tiles 829, profile 2322, bitumen 5818);
  85 % of building triangles textured; aerial mean colour within 0.1 of base; night lit-window count identical (1095).
  One run out of four failed the aerial check because the base page (no tex) rendered about 3 % darker that time; the
  next two runs passed with the same files, so it is a flake in the base render, not the step.
- From scratch copies, on the chain + tex: `test_facades` PASS, `test_bld2` PASS, `test_gfx` PASS.
  `test_facades2` (chain + tex): everything passes except `wingEaves` (2 overhanging of 551), which fails identically
  without tex, so it predates this step.
  `test_roofs` cannot run as written on today's chain: it needs a base built without `add_roofs`, and the chain no longer
  builds without it (`add_credits` and `add_cars4` look for its credit line). Run as tex-vs-base instead: 0 roof colours
  changed, street looks / look roofs / video facade roofs / landmarks all kept, no console errors.
- `fps.mjs` (Metal, M5 Pro), three alternating runs each: 60.3 fps both; load base 3.54 / 3.51 / 3.71 s, tex
  3.61 / 3.51 / 3.54 s (one earlier tex run took 4.49 s, the next 3.65 s; the machine is shared with other agents).
  No measurable load growth.

## Screenshots
`research/assets/textures/shots/before_*.png` and `after_*.png`, same cameras (`pipeline/tex/shots.mjs`): vilniaus,
vilniaus2, maironio, maironio2, flats, flats_brick, garages, hall, wooden, shed_boards, house_plaster, roof_tiles,
roof_asbestos, roof_bitumen, roofs, roofs2, close_brick/plank/silicate/corrugated/panel/plaster/plaster2 (3 m), night,
aerial, aerial_high. I opened all of them.
Reads as real material: red brick and silicate brick close up (courses, mortar, per-brick variation), plank and board
walls, roughcast, clay tile roofs, corrugated and profiled metal, asbestos wave sheet, prefab concrete (form-tie holes,
stains). From the air nothing changes in colour and there is no tiling grid or moire.

## What still looks wrong
- Smooth plaster is only a faint blotchy grain; from the street on Vilniaus g. and Maironio g. the plaster blocks look
  almost as before. That is mostly honest (smooth render is smooth) but it is the weakest change.
- Bitumen flat roofs read as roll strips only from close or low; from far they are a plain tint.
- Corrugated walls read as fine ribs; the waves are a little small for the shadow they should cast; there are no sheet
  end-laps, so long industrial walls look like one endless sheet.
- The prefab concrete is grimy; on a freshly painted block it may look too dirty.
- No standing-seam roof texture exists on Poly Haven or ambientCG; profiled sheet stands in.
- Textures follow world coordinates, so a brick course does not line up with window sills or wall corners, and a
  roof's tile rows start at an arbitrary height on each building.
- Not checked in motion: I judged shimmer from stills plus mipmaps and 8x anisotropy, not from a recorded drive.

## Credit text
`Building textures: Poly Haven (CC0), polyhaven.com` — per-texture authors in `research/assets/textures/SOURCE.md`.
`research/assets/textures/raw/` holds the downloaded JPGs (git-ignored) and a small `info.json` per texture (not ignored).
