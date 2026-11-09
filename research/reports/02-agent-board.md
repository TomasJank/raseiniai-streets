# Agent board (orchestrator keeps this current)

Baseline: v38 = `sh pipeline/build.sh` (importmap step added 2026-11-09 16:50, no visual change, errors []). 60 fps Metal, 4.0 s cold load.

| Agent | Model | Status | Files | Tests | Blockers | Next |
|---|---|---|---|---|---|---|
| chars | opus | launched 2026-11-09 | pipeline/assets.js add_assets.py chars.js add_chars.py work/test_chars.mjs research/*/characters | — | — | prototype → integrate behind poseAt |
| gfx | sonnet | launched | pipeline/gfx.js add_gfx.py water2.js add_water2.py work/test_gfx.mjs | — | — | measure each effect |
| bld | sonnet | launched | pipeline/facades.js add_facades.py work/test_facades.mjs research/assets/textures | — | — | atlas + details + landmarks |
| drive | sonnet | launched | pipeline/drive.js add_drive.py work/test_drive.mjs | — | — | suspension + audio |
| catalog | haiku | done 17:15 (2 downloads, licences resolved; see license-report addendum) | research/assets/* research/reports/asset-catalog.md license-report.md | n/a | — | — |
| survey | haiku | done 17:30 (24 repos classified; top: niulai-game combat MIT, N8AO CC0, CSM, Water2) | research/repositories research/reports/repositories.md | n/a | — | — |
| combat2 | sonnet | queued (after chars) | pipeline/fight2.js add_fight2.py | | needs clips | |
| animals2 | sonnet | queued (after chars) | pipeline/animals2.js add_animals2.py | | needs assets.js | |
