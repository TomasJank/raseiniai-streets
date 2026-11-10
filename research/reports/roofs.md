# roofs step (orthophoto roof colours)

Files: `pipeline/add_roofs.py`, `work/test_roofs.mjs`, this report. No runtime file: the ~45 lines of JS live inside add_roofs.py. Shots: `research/prototypes/buildings/roofs/{before,after}/` (centre + d0..d5 district aerials at 120 m, `views_aerial.png` from views.mjs) and `side_by_side_20.png` (ortho crop | game before | game after, seed 7, conf >= 0.6).

## Position in build.sh
`roofs` goes directly after `facades` (anywhere later also works, it only needs facades.js present). It hooks `facadeRefine` (set roof colour on the finished spec) and `roofSty`. Order against `streets` does not matter: precedence is decided at runtime, not by who writes last.

## Precedence (runtime, in `roofsApply`)
Skipped when `LOOK[id]` has `roof` or `roofSty` (street files, club/landmark/story steps, hand looks), or the tour-video `tags.facade` carries a roof colour (`facade[1]`). Otherwise `spec.roof` = orthophoto colour. `LOOK` is not touched, so facadeRefine's `own`/pastel-wall logic and facades2's `LOOK[id]` gate are unaffected. Clay tile and standing seam (conf >= 0.6) also set `roofSty` to `'tiles'` / `'sheet'` (STY key strings, same convention add_facades2.py uses; there is no separate seam texture). Other classes keep the facades rule with the measured colour. Compatible with add_facades2.py in either order (checked by building both).

## Data
4,379 buildings (conf >= 0.5, footprint >= 12 m2; the ortho step already dropped tiny ones), 259 tile + 116 seam keys. Blob = `"idx:rrggbb[t|s];..."` sorted by id, 52,416 B (limit 120 KB), rgb at 1/255, deterministic. Source: `research/geodata/roofs.json` + `footprints.json` (no shapely/numpy needed, area by shoelace). Credit string gets "Roof colours derived from ORT10LT orthophoto, National Land Service (NŽT), geoportal.lt" (licence still unconfirmed per geodata.md; only derived colours ship, no imagery).

## Colour
The game has ColorManagement off and linear output, so vertex colours are displayed as written; no sRGB conversion applies. roofs.json is already gray-world corrected. GAIN = 0.85 (constant in add_roofs.py).
Measured on rendered 120 m aerials (7 views, pixels that changed between builds, ~340k px, median luminance): before 0.310, GAIN 1.0 0.560 (blown-out white-blue large roofs), GAIN 0.78 0.448, **GAIN 0.85 0.488**. Albedo luminance medians (all 6,664 specs): 0.367 before, 0.462 after; changed buildings 0.367 -> 0.557. So the roofs are about 50-55% brighter than the old procedural dark palette: the "within 15%" target cannot hold against the old defaults without discarding the photo; against the photo-implied look 0.85 sits between "too white" and "too dark". Tune GAIN (0.78 to 1.0) if the owner wants it darker or lighter. Histogram (albedo luma, 10 bins, changed buildings) before `0 0 982 1740 1178 164 0 0 0 0`, after `0 1 81 445 957 1084 961 359 176 0`; cool-hued roofs 8% -> 22%, warm 16% -> 8% (the old palette was red-brown heavy, the real town is grey/blue metal).
Side-by-side reads right for grey/blue metal, clay tile and white flat roofs; known weak spots: near-white roofs clip, and light "corrugated" class includes bare-ground misreads (geodata.md caveat).

## Test results (work/test_roofs.mjs after.html base.html)
- 4,064 buildings received a roof colour (>= 4,000); the other 315 already had a LOOK roof.
- 447 street-file roof looks, 466 LOOK roofs in all, 3 video-facade roofs: 0 overridden; c92/c219/c2661/c2134 landmarks unchanged.
- No console errors; deterministic (two builds byte-identical, matches test rebuild).
- test_facades PASS, test_streets PASS (all streets), `node work/fps.mjs` 60.3 fps (Metal, M5 Pro), views.mjs no errors.
