# Agent board (orchestrator keeps this current)

Final: work/build/v43.html (2026-11-10 00:50) = v42 + fixwater fixground kick parked2 drive2 + 14 photo-matched streets + neural voices. Previous: v42: + cars2 fleet, fixgfx, fixpeople, fixtalk. v41 = before the bug round. v40 = before wave 2, v39 = before characters. Baseline: v38 = `sh pipeline/build.sh` (importmap step added 2026-11-09 16:50, no visual change, errors []). 60 fps Metal, 4.0 s cold load.

| Agent | Model | Status | Files | Tests | Blockers | Next |
|---|---|---|---|---|---|---|
| chars | opus | done + merged 19:30 (test_chars/fight/people2/solid/animals PASS, 60.3 fps, +454 KB; 24 GLB mannequins near camera, instanced rig beyond 70 m) | pipeline/assets.js add_assets.py chars.js add_chars.py work/test_chars.mjs research/*/characters | — | — | prototype → integrate behind poseAt |
| gfx | sonnet | done + merged 18:45 (test_gfx PASS, +3 ms/frame 720p, 60.3 fps, GTAO+soft shadows+Sky+Water.js ponds) | pipeline/gfx.js add_gfx.py water2.js add_water2.py work/test_gfx.mjs | — | — | measure each effect |
| bld | sonnet | done + merged into build.sh 17:55 (test_facades PASS, 60.3 fps) | pipeline/facades.js add_facades.py work/test_facades.mjs research/assets/textures | — | — | atlas + details + landmarks |
| drive | sonnet | done + merged 18:20 (test_drive PASS, fight/solid PASS, 60.3 fps; SwiftShader halved by 2 SpotLights, phones skip them) | pipeline/drive.js add_drive.py work/test_drive.mjs | — | — | suspension + audio |
| catalog | haiku | done 17:15 (2 downloads, licences resolved; see license-report addendum) | research/assets/* research/reports/asset-catalog.md license-report.md | n/a | — | — |
| survey | haiku | done 17:30 (24 repos classified; top: niulai-game combat MIT, N8AO CC0, CSM, Water2) | research/repositories research/reports/repositories.md | n/a | — | — |
| combat2 | sonnet | done + merged 20:50 (test_fight2 18/18, test_fight PASS, 60.3 fps) | pipeline/fight2.js add_fight2.py | | needs clips | |
| animals2 | sonnet | done + merged 20:35 (5 GLB species, 397 KB, all animal suites PASS, 60.3 fps) | pipeline/animals2.js add_animals2.py | | needs assets.js | |

| cars2 | opus | done + merged (10-model GLB fleet, holes fixed in build.py, test_cars2 PASS) |
| fixgfx | sonnet | done + merged (smoke quads, sun elevation) |
| fixpeople | sonnet | done + merged (faces, gear refit, car-hit tumble) |
| fixtalk | sonnet | done + merged (companion rest, goodbye rotation, test_talk2) |
| wave3 libs | sonnet | running (Yuka, pathfinding, InstancedMesh2, quarks, retarget, howler, troika, mesh-bvh, Sketchbook) |
| fixwater fixground kick parked2 drive2 | sonnet | done + merged in v43 |
| 14 street photo-match agents | sonnet | done + merged in v43 (Maironio 20, Jurbarko 36, Vilniaus 17, Stonų 13 buildings; outer streets thin coverage) |
