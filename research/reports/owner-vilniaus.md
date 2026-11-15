# owner-vilniaus: Vilniaus g. houses after the owner's review (2026-11-15)

Spec: `11-owner-review.md`. Files changed: `pipeline/streets/vilniaus.json` (looks of c2462 c2463 c2464 c2465 c2466 c2022, `ridge` of
c2514 and c2914, c7170 height and band, c1417 style, one sign), `pipeline/kit/looks/vilniaus.json` (14 houses), `pipeline/kit.js`,
`pipeline/add_kit.py` (kit 3, see `kit.md`), `pipeline/kit/looks/_example.json`, README "House kit keys", `work/test_kit.mjs`.
All description edits are made by `pipeline/kit/sheets/owner/apply.py` (rerunnable, writes whole files via temp + rename).

Proof: `pipeline/kit/sheets/owner/<id>.jpg` (v71 above, now below: front, left, right, back square-on from 3.5 m, then the street side
at eye level from across the road; `views.py` + `shots.mjs` + `sheet.py`), `same_angle.jpg` (Mapillary frame | v71 | now, for c2514,
c2914, c7170; cameras in `same_angle.json` from `cam.py`). Back views of several houses are blocked by neighbours or fences.

Identity: c2463 is the light grey house between c2464 (110) and c2462 (106) on the orthophoto (order 2466, 2465, 2464, 2463, 2462
along the street, c2462 on the Bažnyčios g. corner); only roof, siding tone, two-window front, chimney and the boarded gable changed.

## Per house (against the description, line by line)
| house | matches now | still wrong / guessed |
|---|---|---|
| c2462 (106) | grey rough plaster, dark red-brown corrugated roof, ridge along the street, chimney near the left end; flush gabled bay on the left 45 % rising almost to the ridge with one window below and a smaller one in its gable; recessed dark doorway with a brick pier; one window right of it; windows 1.2 m; wooden balcony at attic level on the right gable end; green mesh fence (earlier pass); no trees (noTree 12 m) | the footprint's street wall is 9.2 m (description ~11 m), so the gable ends are wide and the roof flatter than "steep" (LiDAR rise 2.4 m kept). The right window is normal, not "wide low" (shape is per wall and would widen the bay window too). Pier side is a guess |
| c2463 (108) | light grey siding, dark asbestos roof, ridge along the street, chimney left of the middle, two 1.1 m street windows at 1/4 and 5/6, dark boarded gable with a window towards 106 | roller shutter not drawn; `gable` colours both gable ends (the NW one not seen); ground windows on the SE end = automatic count (3), a guess |
| c2464 (110) | dark red-brown siding everywhere, brown metal-tile roof; right 2/3 1.5 storeys (eaves 3.3, ridge 7.5) with one street window right of its middle, right gable 2 + 1 windows; left part two storeys (eaves 5.3) under its own low hip below the main ridge, window + white glazed door with a step below, one window upstairs; chimney where the parts meet; no second gable to the street; windows 1.1 m | the game's split puts the two-storey part at 32 % of the front (described 40 %); dark brown window surrounds, drive and gate not drawn |
| c2465 (112) | one storey, ridge along the street; right 2/3 pale yellow boards with old grey asbestos roof; left third red-brown siding (street wall stretch and the whole left end); dark graphite metal tile over the left half; one window in each part; right gable 2 + 1 | the brown part's window frame is white (frame colour is per house) |
| c2466 (114) | one storey, long, ridge along the street, grey asbestos roof, two chimneys; salmon boards (left third fresher); large cream wall dormer left of the middle, 30 % wide, two windows side by side, peak above the main ridge; ground floor window, window, window, dark red door, window, window; right gable salmon below, pale grey siding above with one window | chimney places are a guess (both over the left rectangle: `chim` uses the largest rectangle's ridge); right gable ground windows = 2 (not described) |
| c2022 (67) | white sand-lime brick, dark grey tiles, gable to the street, half-hipped gable; wide two-light gable window; shop front across the street side in dark brown timber with six windows and a dark door under its own lean-to; left wall two windows and a dark timber porch with a window; no fence, no trees | lean-to is not hipped at the ends; windows are plain, not multi-pane; the black sign boards and lettering are not drawn (street already has its 10 signs); door position in the shop front is a guess (middle) |
| c2514 (118) | ridge now across Vilniaus g., so the gable faces the street with 2 + 2 windows and the small window on top (frames 697673, 982247); balcony on the Gėlių g. side (frame 910803) now grey | the balcony railing is a solid panel (kit), not see-through iron |
| c2515 (120) | street wall blank (frames 557036, 937898 agree) | |
| c2914 (154) | ridge along the street again: frame 741232 shows the number plate on the eaves wall facing the road and the gable at the right with 2 + 1 windows; brown frames, smaller windows | the two street-wall window positions are read off one oblique frame |
| c7170 (128A) | one tall storey (4.4 m, was 3.2 in v71; the audit pass had made it 5.3, which drew a second row of windows), "Tėjūla" in plain green letters on a white panel on the Vilniaus g. face (frame 973566) | LiDAR mid-roof 5.3 m: 0.9 m lower, within the audit's 2 m; the white fascia with green border is still drawn as a green band |
| c1417 (96) | siding boards, small windows (automatic count, drawn by the kit at `small`) | colours unchanged (ochre below, cream above) |

c2915's fence untouched (owner asked).

## Heights
`audit_heights.py` on the final page flags none of these houses (2 flagged in town, neither mine).

## Tests (final build = build.sh, one at a time)
- `add_streets.py --check pipeline/streets/vilniaus.json` ok (42 looks, 10 signs); `add_kit.py --check` ok on every kit file
  (vilniaus 14 houses, _example).
- Two builds back to back byte-identical.
- `test_kit.mjs fin.html base.html fin2.html fold.html fnew.html`: all PASS, including oldDescriptionsUnchanged (40 of 40
  descriptions frozen at the start of kit 3 draw identical triangles), housesWithoutKeysUnchanged (8,272), invalidIgnored (new keys
  included), wallDormer, kit3Keys, cost (one mesh added, 32 tris per described house, no shadow, static). Test changes: kit-3 houses
  and checks; 41-house fill cap fixed (a negative slice once the live file had 42 houses); window "behind wall" tolerance 2 cm
  (windows on four-corner houses whose rectangle stands within 3 cm of the OSM line); span panels not counted as windows.
- `test_streets.mjs` PASS all 14 streets, no errors; `test_perf.mjs` ALL PASS (start 608 calls / 5.03 M tris); `test_solid.mjs` all passed.
- Page: kit code +10.2 KB; Vilniaus kit data 1.4 KB more (14 houses).
