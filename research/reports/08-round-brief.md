# Round brief, 2026-11-13: people, cars, wall textures, props

The owner (Tomas) asked for four things, in his words: townsfolk hair and faces "look off (some have chopped hair, some women have dudes face)", people "change the looks" when he walks up to them, he wants "more variation", the cars should match the list he ticked, buildings should get real wall and roof textures, and street objects ("traffic lights, bushes or whatever") should come from Sketchfab.

The integrator is the session that launched you. Read this whole file, then `research/reports/01-architecture.md`, then the code you will touch inside a built page.

## How the game is built
- Repo: `/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets`. One HTML page, three.js 0.187 through an import map, no bundler.
- Source of truth is `work/build/v37.html` plus one `pipeline/add_<step>.py page.html` splice per step. `sh pipeline/build.sh /path/out.html` runs the whole chain in about 6 s. Current chain ends `... cars4 fixmoney marozas jump react fixpeds mhchars`; `index.html` is `work/build/v60.html`.
- A step's JS goes in `pipeline/<step>.js`, spliced before `// ---------- boot ----------`. Binary data is embedded as `<script type="application/octet-stream" id="asset_...">` base64 blocks and loaded through `ASSETS.load(name)` (`pipeline/assets.js`, GLTFLoader with the Meshopt decoder set).
- Later steps change earlier ones by wrapping functions (`const old=fn; fn=function(){...}`), not by editing the earlier file.
- Tests are `work/test_<step>.mjs page.html`. They write `_x.html` next to themselves, so copy them into your scratch directory and run them there. They load Playwright from `/Users/tomasjankauskas/Desktop/Projects/career-ops/` and run headless Chrome on SwiftShader. `node work/fps.mjs page.html` measures frame rate on the real GPU (60 fps today, 2.2 s load).

## Rules (hard)
1. Edit only the files listed as yours below. Never edit `pipeline/build.sh`, `index.html`, anything in `work/build/`, or another agent's files. Never commit, never push.
2. Build into your scratch directory: `/private/tmp/claude-501/-Users-tomasjankauskas-Desktop-Projects-career-ops/769a9647-8e41-40c2-82dd-3e07e6d36892/scratchpad/agents/<your name>/`. To test a step that is not in the chain yet, run `sh pipeline/build.sh out.html` and then your own `python3 pipeline/add_<step>.py out.html`.
3. Other agents are editing their files at the same time and `build.sh` reads them live. If a build or test fails inside a step that is not yours, wait a few minutes and retry; do not touch their files. Say so in your report if it keeps failing.
4. Scratch directories are wiped between sessions. Anything worth keeping (scripts, data, review sheets, your report) goes in the repo under your owned paths.
5. A build must be repeatable: two runs of the chain give byte-identical pages. No `Math.random()` in anything that decides how the world looks at load; use the game's `hash()`.
6. The repo is public. Use only CC0 and CC BY assets, record author and licence, and hand the integrator the exact credit text. No AGPL, no NC, no asset without a licence line, nothing from uploaders who look like game rips. Raw downloads stay out of git (`research/assets/**` binaries are ignored already).
7. Do not use the browser automation tools (`mcp__claude-in-chrome__*`, `mcp__playwright__*`): one browser is shared and the integrator is using it for Sketchfab downloads. Headless Playwright from a node script is fine.
8. Look at your own output. Every visual change needs before and after screenshots that you have opened and checked, saved under your owned paths. A passing test is not evidence that it looks right.
9. Budgets: the page is 25.3 MB today. People at most 12 MB of page, wall textures 1.5 MB, props 2 MB, cars 8 MB. Frame rate stays at 60 fps on `fps.mjs`. Start point stays on Vilniaus g.
10. Finish with `research/reports/<your name>.md` (what you did, what you measured, what is still wrong, the credit text) and a final message of at most 25 lines. State failures plainly; do not report something as working that you did not see working.

## Agents and ownership
| Agent | Owns |
|---|---|
| `people-gen` | `research/mh/scripts/`, `research/mh/web/`, `research/mh/glb/`, `research/mh/glb_player/`, `research/mh/out/`, `research/reports/people-gen.md` |
| `people-game` | `pipeline/mhchars.js`, `pipeline/add_mhchars.py`, `work/test_mhchars.mjs`, `research/mh/trial/`, `research/reports/people-game.md` |
| `cars` | `pipeline/cars4.js`, `pipeline/add_cars4.py`, `pipeline/cars4/`, `research/assets/vehicles/cars4/`, `work/test_cars4.mjs`, `research/reports/cars4.md` |
| `walls` | new step `tex`: `pipeline/tex.js`, `pipeline/add_tex.py`, `pipeline/tex/`, `work/test_tex.mjs`, `research/assets/textures/`, `research/reports/tex.md` |
| `props` | new step `props2`: `pipeline/props2.js`, `pipeline/add_props2.py`, `pipeline/props2/`, `work/test_props2.mjs`, `research/assets/sketchfab/props_*`, `research/reports/props2.md` |

The integrator owns `build.sh`, the builds, the downloads in `research/assets/sketchfab/glb/{i}.glb`, and merging.

## Contract between `people-gen` and `people-game`
`people-gen` writes one `research/mh/glb/crowd_NN.glb` and `crowd_NN.json` per person. `people-game` reads the JSON through `add_mhchars.py`. Fields:

```
{"file": "crowd_00.glb", "sex": "f"|"m", "age": "kid"|"adult"|"old", "band": "...", "desc": "...", "height": 1.62,
 "pal": {"skin": "e8b89a", "top": "7a2030", "legs": "2b3550", "shoe": "202020", "hair": "5a3a20" or null},
 "skirt": true|false, "bare_legs": true|false, "long_hair": true|false, "hat": true|false,
 "tint": ["material-name substrings of the garments whose colour may be shifted per person"],
 "credits": [{"asset": "...", "author": "...", "license": "CC BY 4.0"}]}
```

`pal` colours are sRGB hex of what the eye sees on the finished model (the mean of the lit texture, not the raw texture). `people-game` must still work on files that lack the new fields. 36 people: 3 girls, 10 women, 5 old women, 3 boys, 10 men, 5 old men.
