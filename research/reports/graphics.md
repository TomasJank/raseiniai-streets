# Graphics and water (2026-11-09)

Hardware: Apple M5 Pro, ANGLE/Metal, Chromium via Playwright. Test view: Maxima street view (`research/prototypes/graphics/bench.mjs`), peds and cars hidden, tod 13 / 19.6 / 23 and rain. "ms" is the median of 200 `renderer.render` (or composer) calls, each followed by a 1 px `readPixels` so the GPU is waited for. Baseline: 4.8-5.2 ms at 1280x720, 4.8-6.4 ms at 2560x1440 (the frame is largely CPU draw-call bound, so resolution barely moves it). Run-to-run noise is about +-0.7 ms; treat anything under 1 ms as zero.

## Results

| effect | cost ms @720p | cost ms @1440p | fps (real game loop, fps.mjs) | kept? | why |
|---|---|---|---|---|---|
| baseline (v37 + round pipeline) | 4.8-5.2 | 4.8-6.4 | 60.3 / 60.3 | - | vsync capped |
| PCFSoftShadowMap vs PCFShadowMap | ~0 | ~0 | - | yes (`softShadows`) | softer edge, no measurable cost |
| shadow map 1024 / 4096 (vs 2048) | ~0 / ~0 | ~0 / +0.3 | - | no (stays 2048) | no visible gain at a 190 m frustum; 4096 = 64 MB VRAM |
| tighter camera-following frustum | not changed | - | - | no | the sun already follows the player at +-95 m (0.09 m/texel); tightening loses shadow on mid-distance buildings |
| CSM (`three/addons/csm`) | not prototyped | - | - | no | each cascade re-renders the shadow casters; with the frame CPU-bound by draw calls that is +1 pass per cascade, and the current single cascade already covers the play area |
| GTAOPass via EffectComposer (HalfFloat, 4x MSAA target) | +2.3 to +3.0 | +4.3 to +5.6 | 60.3 / 60.3 | yes (`ao`) | wall bases, eaves, window reveals, tree trunks and car/ground contact get grounded; the biggest single change |
| N8AO (n8ao 1.10, Medium, `gammaCorrection:false`) | +1.2 to +1.8 | +2.8 to +3.3 | - | optional | softer and cheaper than GTAO (6.0-6.6 vs 7.1-7.8 ms @720p); not shipped because it needs a 156 KB bundle (`research/prototypes/graphics/n8ao.min.js`, esbuild of the repo source with `postprocessing` stubbed) embedded into the page. `halfRes` threw in `setupRenderTarget` on r187, so only Medium was measured |
| Sky.js (cubemap baked every ~1.6 game s, blended with the game gradient) | ~0 | ~0 | - | yes (`sky`) | soft clouds and a physical blue by day; the game's dusk, night and rain gradients are kept (see below) |
| sun direction follows tod (`sunPath`) | ~0 | ~0 | - | yes | shadows lengthen toward dusk; the sun used to stay at a fixed +105,+85,+65 offset all day (only its intensity and colour changed) |
| sRGB output + ACES / AgX | +0.4 | +1.0 | - | no (flag `tone`, off) | see Colour management |
| UnrealBloom on lamps at night | +0.5 | +1.5 | - | no | invisible on this palette (lamp halos are already bright sprites) and it rendered black when the composer target is multisampled |
| Water.js planar reflection, full scene in the mirror | +23 | - | - | no | far over budget |
| Water.js, "lite" mirror (no grass, instanced props, people, cars) | +5.3 per mirror frame | - | - | yes, with `every:2` | only while a pond is in view; average about +2.9 ms, worst frame +5.3 |
| everything shipped (`ao`+`softShadows`+`sky`+`sunPath`) | +2.5 to +3.2 | +5.4 to +6.4 | 60.3 / 60.3 | | 7.3-8.0 ms total @720p, 10.9-11.8 ms @1440p, well under the 18 ms of 55 fps |
| shipped + a pond in view | about +6 (avg) | - | - | | about 11-13 ms worst frame |

Real-game fps (`fps.mjs`, Metal): base 60.3 at 1280x720 and 60.3 at 2560x1440; with gfx+water2 60.3 at both. Cold load 1.0 s -> 1.1 s. JS heap in those runs: base 440 MB, gfx 256-468 MB (the numbers swing run to run; no growth attributable to gfx).

Because vsync hides the headroom, the ms columns are the real measure: the whole package costs about +3 ms per frame at 720p and +6 ms at 1440p on this GPU, leaving 10 ms of the 18 ms budget. An integrated or older GPU will see the AO pass cost more (it is fill-rate bound, scaling with pixel count: +2.7 ms to +5 ms here between 720p and 1440p), so keep `ao` off by default on PHONE (done) and consider an adaptive switch if an iGPU target matters.

## Visual judgement (shots in `research/prototypes/graphics/shots/`)

- `base1280_*.png` baseline, `ao720_*.png` AO only, `final_*.png` ao+soft+sky, `sunpath_*.png` + sunPath, `tone_aces_*.png` / `tone_aces04_*.png` tone mapping, `n8_*.png` N8AO, `base/` and `gfx_views/` the seven views.mjs views (see caveat), `views_planes_off/` same with water planes off. Water: `research/prototypes/water/water_off_*` (original), `water_on_*` (full mirror), `water_lite_*` (shipped).
- AO: the effect is quiet but everywhere. Radius 3 m, strength 2.2: the house base and eaves darken and the grass meets walls properly. Radius 1.6 / strength 1 (first try) was nearly invisible; do not go below those. No halos or edge artefacts on lamp sprites, rain or beams (GTAOPass hides Points and Lines itself).
- Sky: day is a clear step up (cloud layer, deeper blue); it is slightly more cyan than the old gradient. The fog colour stays the game's horizon colour, so distant buildings dissolve into a pale haze that meets the sky acceptably in the day views, but this is the weak spot: a hard far-horizon seam appears at some aerial angles (white band at the very top of `gfx_views/aerial.png`). Dusk, night and rain are the game's own three-colour gradient (same `_sk` colours, painted into the sky cube), so `dusk` and `night` are indistinguishable from the baseline. A first attempt that let Sky.js run all day gave an almost black dusk and was dropped.
- Shadows with sunPath: dusk shadows are long and the lit faces turn with the sun. Night keeps a 12 degree moon-like direction (clamped), so night shadows are low and long as well; if that is unwanted, raise the clamp in `gfxRender`.
- Water: the planar reflection on the town pond is the most visible gain of the round (trees, houses and sky mirrored with ripple distortion). It reads as quite glassy; lower the `distortionScale` (2.2) / raise it for a choppier look.
- Colour management (report only): `THREE.ColorManagement.enabled=false` is set in the game and the palette is authored as display values, so SRGBColorSpace plus ACES or AgX washes everything out (`tone_aces_day.png`) and at exposure 0.4 (`tone_aces04_day.png`) it is flat and grey. It would need a palette retune (saturation up, ground and sky colours re-picked, the gradient and facade atlas re-authored under the sRGB transfer); no exposure value reproduces the current look. Not recommended unless the palette is redone.

## Water

`water2.js` replaces the draped water sheet only where a body is large and flat, because Water.js assumes a plane. The test: the outline encloses at least 8000 m2 and the p10..p90 spread of the terrain height under it is under 1.8 m. On this map that is 3 bodies (the town pond at about 600,112, the pond at about 204,-287, and the one near -2865,-1646); the Dubysa and the 92 streams are sloped or 3 m wide and keep the original ripple/Fresnel `waterMat`. Triangles of the draped mesh inside a replaced outline are removed, and a `ShapeGeometry` of the outline is placed at the p90 height + 6 cm (water slightly above the noisy LiDAR surface). The normal map is a 128x128 procedural tileable texture (no network). Sun direction and colour follow the game sun each frame.

Cost handling: the mirror pass is the expensive part (+23 ms with the whole scene; the town is draw-call bound). `lite` hides grass, every non-tree InstancedMesh and cars during the mirror render (trees stay: they are the main reflected feature), and `every:2` refreshes the reflection on alternate frames. The reflection only renders while the water mesh is inside the frustum. Fallback when a reflection is too much: `planes:false` keeps the original water, or `lite:true,every:3`.

Water2.js (flow-map river, two extra renders) was not used: the river here is sloped, narrow, and a planar mirror cannot sit on it.

Limits: no islands (holes) in the replaced outline, so an island lower than the water plane would be covered; the mirror shows the same shadow state as the main frame; the reflection lags one frame on alternate frames at speed (invisible at 60 fps in testing, not examined above 30 m/s).

## Integration note

Pipeline order: `... voice`, then `gfx`, then `water2`:

```
for s in importmap cars solid talk fight people2 animals streets voice gfx water2; do python3 add_$s.py "$out"; done
```

Verified: `sh pipeline/build.sh $S/x.html && python3 pipeline/add_gfx.py $S/x.html && python3 pipeline/add_water2.py $S/x.html`. Both steps assert each anchor appears exactly once.

Anchors touched: `gfx` (the renderer `shadowMap.type ... outputColorSpace` line, `function frame(now){`, and the final `perfTick(dt);\n  renderer.render(scene,camera);\n}` of frame; it adds `gfxRender()`); `water2` (the line before `const waterMat=` and the `if(WA.pos.length){...waterMat...}` water mesh line). The old `waterMat` code is untouched and still builds the rivers.

Flags (top of `pipeline/gfx.js`, overridable in tests through `window.__GFX`):

| flag | default | meaning |
|---|---|---|
| `softShadows` | `!PHONE` | PCFSoftShadowMap |
| `shadowSize` | 2048 (1024 on PHONE) | sun shadow map size, same as before |
| `ao` | `!PHONE` | GTAOPass through EffectComposer (HalfFloat, 4x MSAA) |
| `aoRadius`, `aoStrength` | 3, 2.2 | AO tuning in metres / gain |
| `sky` | `!PHONE` | Sky.js baked to a cube, used as the background in full clear daylight |
| `skyExposure` | 0.7 | Sky.js exposure before the display curve |
| `sunPath` | true | sun direction follows `tod` (free, also on phones) |
| `tone`, `exposure` | false, 1 | `'aces'` or `'agx'` plus sRGB output; looks wrong without a palette retune, keep off |

`WATER2` (top of `pipeline/water2.js`, override with `window.__WATER2`): `planes` (`!PHONE`), `size` 512 (mirror RT), `lite` true, `every` 2, `minArea` 8000, `maxSpread` 1.8.

Facts for the integrator:
- Addons are loaded with dynamic `import()` inside `try`-less async blocks that fail soft: if the CDN is unreachable the game runs with the old renderer (AO and sky silently absent, water stays draped). Water.js can arrive after the world is built; `water2Job` handles that and rebuilds the water mesh.
- Anything else that calls `renderer.render(scene,camera)` directly (the existing `views.mjs`) bypasses AO and sky. `research/prototypes/graphics/views_gfx.mjs` is a copy that calls `gfxRender()`.
- Optional AO upgrade: swap `GTAOPass` for the N8AO bundle (see table). `research/prototypes/graphics/n8ao_variant.py` shows the exact swap; it needs a new embedded 156 KB file.

## Limitations and open items

- Wet-road specular during rain was not done: the road materials are Lambert with `grainShader` (not an anchor I own). `ENV.wet` already darkens grey surfaces; a specular term would belong in `grainShader`.
- Far fog vs Sky.js horizon seam (above).
- PHONE path (coarse pointer) was not run on a real device or emulated; it is flag-gated off, but its default code path is untested beyond reading.
- A yellow vertical cylinder is visible in some views (`gfx_views/aerial.png`, the sky-only dusk/night bench renders). It never appeared in the baseline shots and not in `views_planes_off/aerial.png`; I did not identify it. The views.mjs scene is not deterministic between runs (the church camera and pavement tint differed between two otherwise identical flag-off builds), so I cannot attribute it to a gfx change; worth a look by whoever owns markers/beams.
- Only one scene view (Maxima street) was timed; dense city views (aerial) may cost more for the AO normal pass.

## Tests

- `work/test_gfx.mjs page.html` (real GPU): no console errors, composer + GTAO exist, sky cube exists, 3 water planes exist, non-black frame at tod 13 (mean 156) and tod 23 (mean 20), render ms over 100 frames (median 7.9, p90 8.5 @720p). PASS.
- `work/test_solid.mjs` on the gfx+water2 build: all passed. `views.mjs` equivalents: all 7 views rendered with no errors on the baseline and on the gfx build (`views_gfx.mjs`).
