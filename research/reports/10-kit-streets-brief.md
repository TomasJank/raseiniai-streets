# Street descriptions round (kit step 2), 2026-11-15

The owner (Tomas): "what about the main streets, could we put together better descriptions from the photos, and get houses of the same size [in bytes] that look more like the real ones". Ordinary houses stay generated; this round makes each one's description match its photos. One agent per street.

Read, in this order: this file; `08-round-brief.md` (sections "How the game is built" and "Rules (hard)"); `kit.md` (what the kit keys are, how they are drawn, what they cannot say, and the honest read of the first 12 houses); `pipeline/streets/README.md` (all look keys, then the section "House kit keys") and `pipeline/streets/_example.json`, `pipeline/kit/looks/_example.json`; `street-agent-brief.md` for the Mapillary access rules.

## What you change
- `pipeline/streets/<slug>.json`, `looks.<id>`: the base look. Wall colour and material, storeys and height, roof shape, roof colour and material, ridge direction, hip or gable, two-tone walls. Fix these first: a wrong roof shape or wall colour is seen from 100 m, a window count from 20 m.
- `pipeline/kit/looks/<slug>.json`: kit keys (windows per wall and storey, attic windows, doors and porches, extensions, plinth, chimneys, dormers, balconies, gable boarding). A house needs a `looks` entry in the street file before it may have kit keys; add one if the house has none.
- Nothing else. Not `kit.js`, `add_kit.py`, `add_streets.py`, `build.sh`, `index.html`, `work/build/`, other streets' files, or any building that a model step draws (list in your prompt). Never commit or push.

## Evidence rule
Describe only what a photo shows. A wall nobody photographed gets no kit keys and keeps its automatic look. A house no photo shows is left as it is and listed as "no photo". Mark every guess in the report. Do not invent variety.

## Photos
- Local: `refs/mapillary/<slug>/` with `CREDITS.tsv`, camera records in `pipeline/kit/views/<slug>.json` (`python3 pipeline/kit/photo_views.py <slug>` makes them).
- There are many more on Mapillary than the local folder holds (thousands of frames along the main streets). Fetch what you need per house through the Graph API (token in `~/.mapillary_token`: read it with your file tool, never print it, never put it in a report or a logged URL). Known traps here: a bbox query over a large area silently truncates, so query in tiles of about 100 m; computed positions are 10 to 30 m off and compass angles up to 90 degrees off on some roads, so take the heading from the next frame of the same sequence and check every frame by eye; most frames are dashcam views along the road, so look for the frames where the car passes the house and the wall is seen at an angle of 45 degrees or more.
- Save the frames you rely on (at most three per house, 1024 px) under `refs/mapillary/<slug>/` with a line each in `CREDITS.tsv` (CC BY-SA 4.0, reference only). Wikimedia Commons the same way. No Google Street View.

## How to check a house
- Which wall is which: `python3 pipeline/add_kit.py --sides <id> ...` prints each wall's index, compass side, distance to the road and its name (front, back, left, right as seen from the street).
- Render: build a page (`sh pipeline/build.sh /abs/out.html`; it cds into `pipeline/`, so the path must be absolute), then `node pipeline/kit/shots.mjs page.html views.json outdir` renders photo viewpoints and square-on views of each wall (`{name, bid, edge, dist}`), and `python3 pipeline/kit/sheet.py before after out id=photo ...` makes "photo | before | after" sheets with the four sides. Judge each house square-on against the photo first, then from the photo's viewpoint. The first 12 kit houses were judged only from dashcam viewpoints that did not frame them, and proved nothing.
- Keep a house's change only if the after picture is closer to the photo than the before picture. If a key makes it worse (a dormer on the wrong slope, windows on a gable that the roof direction puts elsewhere), fix the base look or drop the key.
- `python3 pipeline/add_kit.py --check pipeline/kit/looks/<slug>.json` must pass, and the page must start with no `kit: ignored` warning for your street.

## Machine
Other agents share this Mac. One headless page at a time, `--use-angle=metal` in your own scripts, long timeouts. Scratch directories are wiped on reboot: keep scripts, view lists and sheets in the repo (`pipeline/kit/sheets/<slug>/`), and write `research/reports/kit-<slug>.md` as you go.

## Proof and report
- `pipeline/kit/sheets/<slug>/<id>.jpg` for every house you changed. Open them all.
- `research/reports/kit-<slug>.md`: a table of every house on the street (id, photos used, what was changed in the base look, kit keys added, guessed parts, or "no photo"), the page bytes added (budget about 100 to 300 B per described house), anything the vocabulary could not express with a count of how many houses needed it (that list decides what the kit learns next).
- Two builds byte-identical. `work/test_kit.mjs` and `work/test_streets.mjs` pass on your build (one at a time).
- Final message, at most 20 lines: houses changed, houses left for lack of photos, bytes, tests, the three houses that improved most and the three that still look wrong (with the reason), what the vocabulary lacks.

## Second pass additions (2026-11-15, after the Vilniaus g. trial)
The trial worked: of 16 houses re-described, 10 are clearly closer to their photos from the same camera, none worse. What it left out is now part of every street's job:

- **Fences and hedges.** Nearly every house in the photos has its own fence or hedge on the street side, and it is the first thing seen from the road. Describe it in the street file's `fences` (README schema: `picket`, `mesh`, `hedge`, `wall`, `panel`, `slat`, with `col`, `h`, `dense`), one polyline per plot front, only where a photo shows it, in the photo's type, height and colour. Leave gates open where the photo has a gate or a drive. First find out what already draws a fence or hedge at that plot (generated yard fences, `props2` hedges, another step) so that you replace it and do not double it; say in the report how you did that.
- **Details, fully.** Every house whose base look you fix also gets the kit keys its photos support: window counts per storey on each wall seen, the door and its porch or steps, balconies, dormers, chimneys, extensions, plinth, gable boarding. The trial put kit keys on 7 houses of 16 and left out things that were in plain sight (a balcony over an entrance).
- **Height and storeys.** Check `h` and the storey count against the photo for every house; a one-storey shop drawn as two storeys was missed in the trial.
- **Colour from the photo, not by eye.** Sample the wall and roof colours from the photo crop (median of a clean patch, not in shadow), then check the rendered house from the same camera and adjust until hue and saturation match; brightness differs with the weather. The trial's yellows and sands came out more saturated than the photos.
- **Wider photo search.** Before writing "no photo", look at frames from the side streets and from further off (up to 60 m), and at older sequences.
- **Same-angle proof (required).** For every house you change: the real photo, the game before and the game after, from the photo's camera and cut to the same box. Tools: `pipeline/kit/camshots.mjs` (renders a page from a list of cameras) and `pipeline/kit/camsheet.py` (makes the sheets); `pipeline/kit/sheets/vilniaus/crops.py` shows how the trial got each frame's camera position, true heading and the house's box. "Before" is `work/build/v70.html`. Save the sheets as `pipeline/kit/sheets/<slug>/same_angle*.jpg`, open them, and in the report sort the houses into "closer", "cannot be judged from these frames" and "worse". Undo anything that is worse.
- **What the vocabulary cannot say.** While you work, another agent is teaching the kit new words (a cross gable on the front and L or T roofs, outlines with eight or more corners, a tree to remove from a plot). Do not wait for them and do not edit `kit.js`: list in your report every house that needs one of them, with which, so a later pass can add the key.
- **Shared repo.** Other street agents build pages at the same time and every build reads every street file. Write your JSON files whole and valid (write to a temporary name, check it parses, then rename). If a build fails on another street's file, wait a minute and build again. "Two builds identical" is checked back to back.
