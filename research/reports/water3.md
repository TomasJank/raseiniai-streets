# water3: cadastre water, one matte surface, drowning (2026-11-10)

## What changed
- `pipeline/water3.js`, `pipeline/add_water3.py` (step `water3`, after `sounds`), `work/test_water3.mjs`.
- Geometry: 265 GRPK ponds (all of `water` inside the play area with 60 m2 or more; 286 exist, 21 smaller dropped) replace the 13 hand-traced/OSM outlines, all of which GRPK covers. Islands are holes (7 over 300 m2). Streams: GRPK `PLOTIS` 8 m or more, or named, 143 runs after cutting them where they enter a pond, drawn at 0.45 x PLOTIS (min 2.5 m; the cadastre gives the channel, not the water). Streams within 7 m of an existing OSM line are skipped.
- Level: each pond is a flat sheet at the 25th percentile of the terrain along its shore (+4 cm). The DEM slopes up to 6 m across a lake (Paklanių) and the draped sheet that was there ground through the terrain: that is the "broken fragments" of Raseinių II. Triangles are split to 12 m so `sinkGround` lowers every 24 m ground cell under the sheet; grass triangles under a pond are dropped.
- Consumers: `mm.water`, `W.ponds` (holes), `mm.waterLines`, minimap, `inWater` all read the new set. Trees use the existing `W.ponds` filter, parked cars are filtered in `addParkedCars` and swept after `spawnCars`, pavement walking targets flip to the other side of the street when one side is in water (`pedTarget`).
- Look: `WATER2.planes=false` (no Water.js import, no mirror render, no planar reflection pass). The matte look of the pond by the church (Fresnel over the sky colour, scrolled normal map, sun glint) now lives on `waterMat` itself, installed independently of the old `fixWater`, so rivers, streams and every pond share it, phones included.
- Drowning on foot: deeper than 1.2 m from the bank (ponds and rivers 8 m+) starts a 2.2 s sequence (splash, flailing arms, sinking, fade), then the player wakes on the last dry spot (else nearest land), heat cleared like the car sinking. Reuses `fight.pDown` to freeze input and `fade`/`splash`/`toast`.
- Cars: any car in water (traffic, police, abandoned) glides, noses down and sinks like the player's car. Police are removed (`removeCop`, `updatePolice` respawns while wanted); traffic comes back on a drivable street 150 m+ from the player; other cars are removed. The player's own sequence (`sinkStep`, hospital) is untouched.

## Anchors and edited bodies
Inserted: `function buildExtra(){` (module block before it), `  for(const A of [RD,MK,GR])if(A.pos.length){` (call `water3Build(WA,GR,mm,W,GY);` before it).
Edited, one line each:
- `const WATER2={planes:!PHONE,` -> `const WATER2={planes:false,`
- in `inWater`: `for(const p of W.water||[]){if(!pip(x,z,p))continue;const o=(W.ponds||[]).find(q=>q.p===p);if(!o||!o.H.some(r=>pip(x,z,r)))return true;}` -> `if(water3At(x,z))return true;`
Wrapped by assignment from the water3 block: `walk`, `posePlayer`, `updateTraffic`, `driveCop`, `addParkedCars`, `spawnCars`, `pedTarget`.

## Left alone
Dead code from `water2.js` and `fix_water.js` stays in the page (about 10 KB, nothing runs); retire with the `water2` and `fixwater` steps.

## Numbers (Metal 1280x720 for fps, SwiftShader for suites)
- Page: 10,189,794 -> 10,294,703 bytes (+104,909: 91 KB of ponds/streams data, 14 KB code). Water.js was a CDN import, not embedded, so removing the mirror saves a request and the planar passes, not bytes.
- `fps.mjs`: 60.3 -> 60.0 fps (vsync cap), load 1.59 s -> 1.82 s, JS heap not compared (shared machine). `water3Build` takes 57 ms. `test_gfx` render median 8.3 ms. Three mirror renders (every second frame each) are gone.
- Two builds byte-identical. No console errors in any suite.
- `test_water3` 13/13, `test_fixground` PASS, `test_solid` all passed, `test_streets` PASS, `test_gfx` PASS, `test_world2` errors [], `test_facades2` PASS (run with water3 appended to its build list), `test_drive2` all ok including traffic300 after traffic cars were kept in the stun branch while sinking (first version nulled `c.ai` and broke the test: a car overshot a dead end into a 16 x 18 m pond).
- `test_fixwater` fails by design: it waits for `water2List` bodies (`__g.water.length`) and masks the Water.js pond; both are gone. Retire it with the `water2` and `fixwater` steps. `test_gfx` "water planes exist when on" now passes vacuously (`WATER2.planes` is false).

## Cut-offs
Ponds 60 m2 and up (265 of 286; 14 m x 5 m and smaller dropped, about 5,200 vertices total, 57 ms). Streams: `PLOTIS` 8 m or more or named (and 3 m or wider/unspecified), 143 runs. `PLOTIS` 6 m ditches (34 km in the play area) are not drawn: the orthophoto shows no water in them at 0.26 m/px, and 2.7 m wide stripes across fields would be invented.

## Not done / unverified
- Minimap fills islands as water (it draws outer rings only).
- Two hedge segments end in new ponds (of 13,410); left.
- Shallow band 1.2 m and the 2.2 s sequence are judgement, played only by a script; nobody has walked into a pond by hand. Sinking looks (pose, ring splash) were not screenshotted from the game camera.
- Named stream widths are unverified against the orthophoto; stream paths beyond the orthophoto's coverage (outer play area) are GRPK only.
- Pond level is the 25th percentile of the shore terrain; on the steep Paklanių and Prabaudos banks the sheet sits below the bank top (ground cells are lowered under it), which looks like a bank, not a measured water level.
- The `ground` agent's bank colour is not in this build; I removed grass triangles under ponds, so the ground mesh colour shows at the shore until that lands.
- Comparison renders use a 30 degree camera, not the integrator's 8 degree one: at 3.3 km height the depth buffer cannot separate a flat sheet from the ground 3 cm beneath it and shows blocky holes that do not exist in the game.
- Images: research/prototypes/water3/ centre_before_vs_ortho.jpg, centre_after_vs_ortho.jpg, raseiniai3_after_vs_ortho.jpg, prabaudos_after_vs_ortho.jpg.
