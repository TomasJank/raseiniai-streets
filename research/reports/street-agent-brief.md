# Street photo-match brief (wave 3, 2026-11-10)

You own exactly one street: `pipeline/streets/{slug}.json` (+ optional `{slug}.js` hook) and `refs/mapillary/{slug}/`. Nothing else. No git commits. Build only in your scratchpad dir.

Goal from the owner: "deep focus on how buildings look in the photo and in the game, try to match that." Street furniture is secondary; the facades, roofs, heights, colours and materials of the buildings along your street are the job.

## Inputs
- Read first: `pipeline/streets/README.md` (schema, coordinates, headings, `ctx` hook API, `--check`), `research/reports/01-architecture.md`, `research/reports/buildings.md` (new `STY` keys: `silicate`, `panel`, `plank`, `corrugated`, `asbestos`, plus the repainted originals; `roofSty`; what the facades step overrides: only buildings whose LOOK has no own `sty`, so an explicit `sty` in your file wins).
- `python3 pipeline/street_ids.py "{street}"` prints every building within 45 m: id, OSM kind, name, size, lat/lon, side. Ids marked `*` are styled by another step: leave them.
- Mapillary: token in `~/.mapillary_token` (read it with your file tool, never print it, never put it in a report or a URL you log). Graph API v4: `https://graph.mapillary.com/images?access_token=...&fields=id,geometry,compass_angle,captured_at,creator,thumb_2048_url&bbox=minLon,minLat,maxLon,maxLat&limit=...`, then download `thumb_2048_url`. Fetch images whose camera is within ~40 m of your centreline, facing the buildings (compass angle roughly perpendicular to the street, both sides). Save to `refs/mapillary/{slug}/{YYYY-MM-DD}_{id}.jpg`, append rows to `refs/mapillary/CREDITS.tsv` in its existing format (`file	credit	source	note`; credit `Images from Mapillary, CC BY-SA 4.0, by @{creator.username}`). Photos are reference only: never embedded, never traced into textures. Budget ≤ 40 photos, ≤ 25 MB per street.
- `work/photomatch.mjs` renders the game from a photo's lat/lon/heading (see `refs/mapillary/views_*.json` for the record format) so you can put photo and game side by side. Read it and reuse it from your scratchpad (copy it there; it writes `_x.html` beside itself). Full build for your tests: `sh pipeline/build.sh $S/x.html` (the chain already includes `streets` and `facades`; your JSON is picked up in place because you own it).

## Method
1. Walk the street in the photos. For each building block visible (aim for every building within 45 m that appears in at least one photo), note: material (silicate brick / red brick / plaster colour / Soviet panel / timber plank / sheet metal), wall colour (sample it from the photo, write hex or [r,g,b]), roof type (gable/hip/flat), roof material and colour (clay tile, corrugated, asbestos sheet, standing seam, bitumen), floors and approximate eave/ridge height, window rhythm, shop fronts and signs with their real names, fences and gates in front, notable props.
2. Render the game at the same spots (photomatch) BEFORE changes; save `research/prototypes/streets/{slug}/before/`.
3. Write the looks into your JSON: per building id `wall`, `roof`, `sty`, `pitched`/`hip`, `h`, `rh`, `windows`, and anything the schema allows; signs with the real shop names; fences where the photo shows them; `flavour` lines in Lithuanian about this street if you have fewer than 6. Keep ids inside your 45 m band; `--check` rejects a building another street file claims.
4. Render AFTER; produce `research/prototypes/streets/{slug}/compare.png`: photo | before | after rows for at least 10 buildings (or every building you touched if fewer). Look at it and iterate until the game reads like the photo at a glance (colour family, roof shape, height, material). Do not chase pixel accuracy.
5. Run `python3 pipeline/add_streets.py --check pipeline/streets/{slug}.json`, build the full chain, run `work/test_streets.mjs` (copy to scratchpad) for your slug, `node work/fps.mjs` ≥ 55, no console errors.
6. Report `research/reports/streets/{slug}.md`: photo count and dates, table of buildings changed (id → what the photo shows → what you set), the compare sheet path, anything the engine cannot express (write it as a backlog line, e.g. "mansard roof not supported").

## Rules
- Never edit v37/v4x builds, `build.sh`, any `add_*.py`, `facades.js`, another street's files, or `LOOK` ids printed with `*`.
- No `Math.random` in hooks (`ctx.hash`). Deterministic output.
- Do not invent businesses: a sign needs a photo or OSM tag behind it.
- If Mapillary has no coverage for a stretch, say so and leave those buildings as they are.
