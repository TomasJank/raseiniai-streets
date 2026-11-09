# Raseiniai Streets

A browser game set in the real streets of Raseiniai, Lithuania: 6,675 OpenStreetMap building footprints on LiDAR terrain, drivable roads with traffic, police, missions, pedestrians who talk, fight back and call the police, animals by day and night, weather and a day/night cycle. One HTML file, three.js 0.187, no install.

**Play:** open the latest `work/build/vNN.html` in Chrome (desktop recommended). Internet is needed once for three.js and its addons from jsdelivr.

## Layout
- `work/build/v37.html` frozen base. `work/build/v40.html` latest (characters, facades, graphics, water, driving feel).
- `pipeline/` the real source: `build.sh` = v37 + one `add_*.py` splice per feature (`cars.js`, `fight.js`, `chars.js`, `facades.js`, `gfx.js`, `drive.js`, ...). `sh pipeline/build.sh out.html` rebuilds deterministically.
- `work/test_*.mjs` Playwright + SwiftShader assertion suites; `work/fps.mjs` real-GPU fps and load time; `work/views.mjs` fixed reference views.
- `research/` reports, licence report, asset catalogue, repository survey, prototypes. Start at `research/reports/00-fable-strategic-review.md` and `01-architecture.md`.

## Data and asset credits
OpenStreetMap contributors (ODbL) · geoportal.lt LiDAR · Copernicus DEM · GlobalBuildingAtlas, TUM (CC BY-NC 4.0) · three.js and addons (MIT) · Quaternius Universal Animation Library characters (Quaternius Asset License v1.0, embedded only) · Dog by Polyfork (https://polyfork.dev/asset/dog-base), CC BY 4.0 · Fox from Khronos glTF Sample Assets (CC BY 4.0). Full table: `research/reports/license-report.md`.

Because of the CC BY-NC data source and the QAL character files tracked for reproducible builds, this repository is private and the game is non-commercial.
