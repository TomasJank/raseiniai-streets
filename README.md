# Raseiniai Streets

A browser game set in the real streets of Raseiniai, Lithuania: 6,675 OpenStreetMap building footprints on LiDAR terrain, drivable roads with traffic, police, missions, pedestrians who talk, fight back and call the police, animals by day and night, weather and a day/night cycle. One HTML file, three.js 0.187, no install.

**Play:** open `index.html` (same file as the latest `work/build/vNN.html`) in Chrome (desktop recommended). Internet is needed once for three.js and its addons from jsdelivr.

## Layout
- `work/build/v37.html` frozen base. `work/build/v46.html` latest (characters, combat v2, animals, facades, graphics, water, driving feel).
- `pipeline/` the real source: `build.sh` = v37 + one `add_*.py` splice per feature (`cars.js`, `fight.js`, `chars.js`, `facades.js`, `gfx.js`, `drive.js`, ...). `sh pipeline/build.sh out.html` rebuilds deterministically.
- `work/test_*.mjs` Playwright + SwiftShader assertion suites; `work/fps.mjs` real-GPU fps and load time; `work/views.mjs` fixed reference views.
- `research/` reports, licence report, asset catalogue, repository survey, prototypes. Start at `research/reports/00-fable-strategic-review.md` and `01-architecture.md`.

## Data and asset credits
OpenStreetMap contributors (ODbL) · geoportal.lt LiDAR · Copernicus DEM · GlobalBuildingAtlas, TUM (CC BY-NC 4.0) · three.js and addons (MIT) · Quaternius Universal Animation Library characters (Quaternius Asset License v1.0, embedded only) · Dog by Polyfork (https://polyfork.dev/asset/dog-base), CC BY 4.0 · Fox from Khronos glTF Sample Assets (CC BY 4.0). Full table: `research/reports/license-report.md`.

The game is non-commercial (CC BY-NC data source). The processed Quaternius character and animal GLBs are not in the repository (their licence forbids redistributing raw files); run `python3 pipeline/extract_assets.py work/build/v46.html` once after cloning to restore them from the shipped build, then `sh pipeline/build.sh out.html` reproduces it byte for byte.
