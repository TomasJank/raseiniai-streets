# fix-water: purple pond reflection and mismatched water

## Complaint 1, purple reflections
Water.js renders its mirror inside the water mesh's onBeforeRender. GTAOPass's normal/depth pass renders the same scene with `scene.overrideMaterial` set, so that hook also fires there, and the nested mirror render inherits the override: the mirror texture holds normal-map colours (rainbow trees, magenta roofs). water2.js skipped the mirror with one shared counter (`water2N++ % every`) across all 3 water bodies and every pass. Whether a body's beauty pass got a fresh mirror or one left by the normal pass depended on the parity of (bodies x passes) per frame. In the harness the counter advances 4 per frame, so some bodies sat on the wrong parity permanently.

Fix (pipeline/fix_water.js, pipeline/add_fixwater.py, appended to build.sh):
- each Water onBeforeRender returns immediately when `scene.overrideMaterial` is set;
- the skip is per body and per frame (`(frame+i) % every`), driven by a frame counter in `fixWater()` (called from gfxRender); the original counter is neutralised with `WATER2.every=1`;
- a body always renders its first mirror, so no frame samples an empty texture;
- time, sun direction and sun colour uniforms are refreshed every frame for every body.

Test: `work/test_fixwater.mjs`. For 12 shoreline viewpoints of the biggest pond it masks the pond's visible pixels (water drawn flat blue), then over 60 consecutive frames counts pond pixels with HSV S>0.5 and V>0.3.
- before: worst fraction 0.29, 0.30, 0.17, 0.12 in four views (FAIL)
- after: worst 0.019 in every view (PASS, threshold 0.03). The residue is identical before and after and static (shore and tree edge pixels), not override colour.

## Complaint 2, different textures
The Dubysa and the streams kept `waterMat` (vertex-colour Phong ripple), so they differed from the Water.js bodies. `fixWater()` wraps `waterMat.onBeforeCompile`: the same 4-layer scrolled normal-map sum (shared 128px map and world-space UVs, size .35, same time), the same Fresnel (rf0 .02, power 5), the same sun diffuse and specular and the same waterColor 0x1d4a4f scatter term. The reflection sample is the sky colour where there is no mirror. Neighbouring bodies share world UVs, so the pattern is continuous across a river/pond join. Phones (`planes:false`) are untouched: the wrapper only installs once Water.js bodies exist.

Shots: research/prototypes/water/fix/edge_before.png, edge_after.png (stream into pond; before was a light blue-grey ripple strip, after is the same dark teal Fresnel family as the pond). Script: research/prototypes/water/fix/shots.mjs.

## Checks (Metal, 1280x720)
- test_gfx: PASS, no console errors; 9.3-10.6 ms vs 9.7 ms before (within noise).
- test_solid: all passed.
- fps.mjs (Metal): 60.3 fps. (Its swiftshader fallback launch timed out under load; unrelated.)
- River-heavy view (edge shot) render median: 18.4 and 19.1 ms after vs 21.3 and 20.3 ms before, so no cost increase (the per-body mirror skip spreads the 3 mirrors across frames).

Not done: the `v42.html` base was not touched (build.sh chains from v37); old water2.js left as is.
