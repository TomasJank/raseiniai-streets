# Integration roadmap (state at v40, 2026-11-09)

## How integration works here
There is no module graph to merge. The production artefact is `sh pipeline/build.sh out.html`: the frozen `work/build/v37.html` plus one `pipeline/add_*.py` splice per feature. Integrating a feature = adding its step name to the `for s in ...` line in `build.sh` in the right place, building twice, `cmp`, running the suites, measuring fps, cutting the next `work/build/vNN.html` with `set -o noclobber`, committing.

Current chain and why the order matters:

| step | files | anchors it patches | must be |
|---|---|---|---|
| importmap | add_importmap.py | first `<script type="module">` | first |
| cars solid talk fight people2 animals streets voice | 2026-11-09 round 2 | see each file | unchanged order |
| assets | assets.js, assets/manifest.json | adds `<script id="asset_*">` blocks + `ASSETS` | before chars/animals2 |
| chars | chars.js | `poseAt`, `hidePed`, `dress`, pedMesh flush, before `buildExtra` | after assets |
| facades | facades.js | `STY`, `facadeTex`, `facadeShader` conditions, `buildingSpec`, roof `rs=`, `buildTown();` | after streets (LOOK) |
| drive | drive.js | renames driveCar/walk/collideCar/updateAudio, block before `// ---------- boot` | after anything that patches those bodies |
| gfx | gfx.js | renderer flags line, `frame()` render call → `gfxRender()` | last-but-one |
| water2 | water2.js | `waterMat`/water mesh creation | last (needs final scene) |
| fight2 (wave 2) | fight2.js | wraps fight.js functions, block before boot | after water2 |
| animals2 (wave 2) | animals2.js, manifest append | wraps animal pose, before boot | after fight2 |

## What has to change in existing files for the remaining items
- **Wet roads in rain**: `grainShader` (road material) in v37 needs a specular/Fresnel term keyed on `ENV.wet`. New step `add_wet.py`, one `rep` on `grainShader`. Complexity: small.
- **Kick / wave / elderly stoop clips**: need clips on the Quaternius Universal skeleton. Either buy UAL Pro, retarget Mixamo FBX with FBX2glTF + gltf-transform (no Blender), or procedural overlays on `CHAR.list[i].bone`. Medium.
- **test_talk flake**: unseeded Math.random in the test; a kid picked without its lead gets hidden by people2. Seed the test or pick adults. Small, test-only.
- **Sky horizon seam** (pale band at aerial angles): blend fog colour from the Sky cube's horizon sample in `gfx.js`. Small.
- **Yellow cylinder** seen in some gfx views: unidentified marker/beam; find in `labels`/`beams` code. Small investigation.
- **N8AO instead of GTAO**: cheaper (-1 ms), needs a 156 KB embed; swap shown in `research/prototypes/graphics/n8ao_variant.py`. Small, optional.
- **Credits UI**: the game has a credits string (OSM, geoportal.lt, GlobalBuildingAtlas CC BY-NC, Copernicus DEM). Any CC-BY asset (Polyfork dog) must be appended there by `animals2`.
- **Phone path**: all new effects are flag-gated off on `PHONE`; untested on a device. Test on one phone before publishing a build.

## Licensing constraints that shape distribution
- Quaternius Asset License v1.0: embedding in the game is allowed, raw files may not be redistributed. The three processed GLBs are tracked for reproducible builds, so **the repository must stay private** or those files must move out before it goes public.
- The in-game credits cite GlobalBuildingAtlas (TUM) as **CC BY-NC 4.0**: non-commercial only. That binds the whole game, not just the repo.
- Mapillary reference photos in `refs/` are CC BY-SA 4.0 (eyes only, never shipped).
- OSM data: ODbL, credited in-game. Three.js, addons: MIT.
