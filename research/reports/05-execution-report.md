# Multi-agent execution report (2026-11-09, round 3: v38 → v41)

## Team actually launched

| Agent | Model | Launched | Finished | Outcome | Tests | Merged as |
|---|---|---|---|---|---|---|
| chars | Opus | 16:55 | 19:25 | base64 asset pipeline + Quaternius-rigged mannequins behind the `poseAt` seam, 24 clips, 24 near-camera GLB people, instanced rig as LOD | test_chars + fight/people2/solid/animals PASS | steps `assets`, `chars` |
| gfx | Sonnet | 16:55 | 18:40 | GTAO, PCFSoft shadows, Sky.js daylight, sun path, Water.js lite mirror on 3 ponds; ACES/AgX, bloom, CSM measured and rejected | test_gfx PASS, solid PASS | `gfx`, `water2` |
| bld | Sonnet | 16:55 | 17:50 | atlas repaint + 5 Lithuanian styles, 314 balconies / 750 chimneys / 259 dormers instanced, 4 landmarks | test_facades PASS | `facades` |
| drive | Sonnet | 16:55 | 18:15 | sprung body, damage sag/smoke, brake lights, night spotlights, engine/gear/squeal/crunch audio, Rapier evidence note | test_drive PASS, playtest unchanged | `drive` |
| catalog | Haiku | 16:55 | 17:15 | asset catalogue + licence report; 2 downloads; Quaternius licence resolved by the orchestrator | n/a | reports |
| survey | Haiku | 16:55 | 17:30 | 24 repositories classified at code level | n/a | reports |
| combat2 | Sonnet | 19:40 | 20:45 | jab/cross/kick with frame windows, hitstop, combos, block, dodge, knockback, opponent AI windows/token/blocking, HUD | test_fight2 18/18, test_fight PASS | `fight2` |
| animals2 | Sonnet | 19:40 | 20:30 | Shiba, Husky, Fox, Deer, Cat GLB rigs behind the animal loop, deflate-embedded 397 KB | test_animals2 + animals/day/night PASS | `animals2` |
| integration | orchestrator (this session) | | | per-step gate: build ×2 + cmp, suites, fps.mjs, views, noclobber vNN, commit | | v39, v40, v41 |

No agent used Fable. Fable did the inspection, the strategic review, licence rulings and the integration gates (this session). No worktrees: the project was not a git repo at start; isolation was per-file ownership + scratchpad builds + noclobber copies, and it produced zero conflicts across 8 agents. `git init` was done at the start; every merge is a commit.

## Fable recommendations: adopted / rejected
Adopted: asset pipeline first; characters behind the seam with instanced LOD; combat sequenced after characters; graphics+water as one measured agent; buildings procedural; vehicles feel-only; explicit subagent models (1 Opus, 5 Sonnet, 2 Haiku).
Rejected or deferred by evidence: Rapier (vehicle agent's note: ~2 weeks, +2.7 MB wasm, police balance redo, no visible gain); colour management (graphics agent: palette retune required); realism-effects (pinned to three 0.151 + pmndrs postprocessing); GLB cars (procedural ones in style); Mixamo as primary (no Blender; QAL packs ship clips).

## Numbers
| | v38 (start) | v41 (end) |
|---|---|---|
| HTML size | 4.98 MB | 5.93 MB |
| fps, Metal 1280×720 | 60.3 (vsync) | 60.3 (vsync); render ~5 → ~8 ms |
| warm load | 1.0 s | 1.25 s |
| JS heap | 256 MB | 272-289 MB |
| draw calls (street, on foot) | 754 | ~784 + 1 per GLB animal |
| suites with assertions | 7 | 13 |

## Blockers and open items
- `test_talk` fails 1-4 random checks on every build including the base (unseeded random; a kid can be picked without its lead). Test-only, in the backlog.
- `test_solid` showed one random failure once and passed on rerun (position sampling); worth seeding.
- SwiftShader (test harness) fps halved by the two night spotlights; tests take about twice as long. Phones skip the spotlights.
- Fresh clones: the processed character and animal GLBs are now tracked so `build.sh` works from a checkout; that is why the GitHub repo is private (Quaternius QAL) and the game stays non-commercial (GlobalBuildingAtlas CC BY-NC).
- No kick clip exists on the shared skeleton; the kick is a procedural overlay. Faces are blank. Hare, hedgehog, birds and bats keep the box rigs.
- Phone path untested on a device.

## Usage
Subagent tokens (reported by the harness): chars 309k, gfx 281k, combat2 279k, survey 253k, animals2 247k, bld 239k, drive 199k, catalog 122k. Fable: this session only.
