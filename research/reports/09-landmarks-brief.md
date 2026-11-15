# Landmark round brief, 2026-11-14

The owner (Tomas) asked: "Would it be possible to build main buildings", then "Let's do more, main squares, some other buildings". The Blender method used for Vyšnių g. 5A and the Maxima is now applied to the town's main buildings and squares. Content choices are delegated to the integrator and to you; commits and pushes are not.

Read, in this order: this file, `08-round-brief.md` (sections "How the game is built" and "Rules (hard)": all of it applies), `house5a.md`, `maxima.md` (including its last section: what went wrong and how it was fixed), `landmarks2.md`.

## What went wrong last time (do not repeat it)
The Maxima was built twice from a wrong reading of one photo: a view taken from a corner was read as one flat front, so the entrance ended up in the middle of a wall instead of on the corner. A passing test did not catch it. So:
- Before modelling, fix the plan: which footprint edge each visible face is, where the entrance is, which way the building faces. Use the orthophoto and at least two street-level views. Write that down in your report first.
- A roofline that rises and then falls in a photo is a corner pointing at the camera.
- Mark every guess as a guess in the report. If a face has no evidence, build it plain and say so.

## Evidence
- Orthophoto: `python3 research/assets/houses/ortho_crop.py <building id | lat,lon> <half-size m> out.jpg` (north up, footprints outlined, corners numbered in `footprints.json` order). Processed crops may be kept in `refs/landmarks/<name>/` with a line in `refs/landmarks/CREDITS.tsv`.
- Footprints and tags: `research/geodata/footprints.json` (id `cNNNN` = the game's building id). LiDAR heights are in the built page.
- Mapillary: token in `~/.mapillary_token` (read it with your file tool, never print it, never put it in a report or a logged URL). Graph API v4 and `work/photomatch.mjs`: see `street-agent-brief.md` lines 10-11. Photos are CC BY-SA, reference only, credited in `CREDITS.tsv`.
- Wikimedia Commons: search the API for Raseiniai files; reference only, credited the same way.
- OpenStreetMap Overpass for squares, parks, monuments, paths (the local `osm_raw.json` holds buildings only).
- No Google Street View downloads, no screenshots of it in the repo.
- If a face that matters has no photo, list it in your report as "photo wanted: <building>, <which side>, seen from <where>". The owner can take one.

## Method
- One step per agent, several models in it if you have several. Blender headless 5.3 with `research/assets/houses/blendkit.py` (read-only for this round: if you need a change, copy the function into your own script). `gltfpack@0.25.0 -cc`, one atlas per model, embedded as a base64 asset, loaded through `ASSETS.load`.
- Your step removes what it replaces (the generated box, an earlier step's hand-made mesh) and keeps `world.landmarks.<name>` pointing at something, because `test_facades` looks for church, cerkve, culture and maxima.
- Colliders for everything solid; nothing may block a road, a door the story uses, or a parked car. Night look as in `maxima.js`.
- Build on: `sh pipeline/build.sh out.html`, then `python3 pipeline/add_house5a.py out.html`, `python3 pipeline/add_maxima.py out.html`, then your own step. Other agents' steps are not in your build.
- Public repo: CC0 textures already in the project only, plain lettering, no logos, no brand marks, no real tenant names.

## Budgets
- Each step adds at most 400 KB to the page (the page is 28.8 MB with house5a and maxima). 60 fps on `node work/fps.mjs`. Two builds byte-identical. Start point stays on Vilniaus g.

## Proof
- For each model: a game screenshot from the same place as your best reference photo, next to that photo, plus one from each side people can reach and one aerial. Before and after. Saved under your `research/assets/houses/<name>/shots/`. Open them and compare; keep working until the plan and the main features match.
- `work/test_<step>.mjs` passing, in the style of `test_maxima.mjs`.
- `research/reports/<step>.md`, and a final message of at most 20 lines: what was built, numbers (model bytes, page bytes added, fps, identical builds, test result), what differs from the photos, photos wanted, anything failing that you did not fix. State failures plainly.

## Agents and ownership
Each agent owns `pipeline/<step>.js`, `pipeline/add_<step>.py`, `pipeline/<step>/`, `work/test_<step>.mjs`, `research/reports/<step>.md`, its folders under `research/assets/houses/`, and its folder under `refs/landmarks/` (plus its own lines in `CREDITS.tsv`). Scratch: `.../scratchpad/agents/<step>/`.

| Step | Builds | House folders |
|---|---|---|
| `lmchurch` | Ėmimo į Dangų church (c92) and the Orthodox church (c219). The monastery stays as `landmarks2` made it. | `church/`, `cerkve/` |
| `lmsquare` | Žemaičio aikštė with the Žemaitis monument, and up to two more central squares or parks if the map and orthophoto show them | `squares/` |
| `lmcivic` | Municipality (c2159) and culture centre (c171) | `savivaldybe/`, `kultura/` |
| `lmstation` | Bus station (c5290) with its platforms and forecourt | `stotis/` |

The integrator owns `build.sh`, the builds, `blendkit.py`, `ortho_crop.py` and merging. Never edit another step's files (`landmarks2`, `facades`, `town`, `maxima`, ...): change their result from your own step by wrapping or removing at run time.

## Addendum: ordinary houses on Vilniaus g. (Sonnet trial)
The owner asked for "some sonnet agents to build some other less important houses in Vilniaus gatvė". Same method and rules as above, with these differences:
- Closest precedent is `house5a` (`research/reports/house5a.md`, `research/assets/houses/vysniu5a/build_house.py`), a house with its plot, not a landmark.
- Each house adds at most 120 KB to the page. Two houses per agent.
- The houses' current look is set in `pipeline/streets/vilniaus.json` (`looks.<id>`); do not edit that file, skip the generated building from your own step.
- Street photos: `refs/mapillary/vilniaus/` and the indexes `refs/mapillary/vilniaus_a.json`, `vilniaus_b.json`, `views_vil.json`; more through the Mapillary API as described above.

| Step | Candidates (build the two with the best photo evidence) | House folders |
|---|---|---|
| `lmvil1` | c2913, c2911, c2910 | `vil1/` |
| `lmvil2` | c2909, c2904 | `vil2/` |
| `lmvil3` | c2185, c1525, c2467, c2504 | `vil3/` |
