# lmsport: the sports centre (c19) in Blender (2026-11-15)

Step `lmsport`, prefix `LSP` / `lsp`, Addendum 2 of `09-landmarks-brief.md`. Built: the evidence was enough to fix the plan.

## Evidence (looked at before modelling)
- Footprint c19 (OSM "Raseinių kūno kultūros ir sporto centras", leisure=sports_centre), 17 corners, about 30 x 72 m, long axis
  north-east to south-west. Kalno school (c44) shares its west edge (corners 13-14) and continues west; the stadium oval and its fence
  (`buildStadium`, `STAD.poly`) lie south-east, 18.4 m from the outline at the nearest point. LiDAR in the page: top 10.4 m, median 8.7 m.
- Orthophoto (`refs/landmarks/sportas/ortho_c19_60.jpg`, and `ortho_c19_model_frame.jpg` resampled into the model frame with a 5 m grid):
  dark hall roof with solar panels and a ridge along the long axis; a light low-roof L round the north-east end and the north-west side;
  a flat link with a roof light; a hipped block at the south-west end against the school.
- Mapillary: 762 images within 160 m, every one on Savanorių g. north-east of the building (the brief's 129 "nearby" are positions,
  as lmpost found). Headings from the next frame. Behind a tree row, so only winter frames and the 2015 panoramas show the walls:
  2015 panoramas 195222292425928, 1585173365004941, 884047758810512 (north-east end, porch), 327617152109139, 497239254929637
  (south-east face); 2026 dashcam 918149667449649, 1419419936639599, 1389665322879814 (renovated north end, entrance door).
- Wikimedia Commons: "Raseinių kūno kultūros ir sporto centras.JPG" (Vilensija, 2013, CC BY-SA 3.0): the north corner from the path,
  the porch and the whole north-west side. This photo corrected my first reading (below).

## Plan (fixed before modelling, corrected once)
Frame: u along the north-east face from corner 0 (north corner) to corner 1, v into the building, z up from spec.y0.
| part | footprint | photos | built |
|---|---|---|---|
| low wing, north-east front | u 0..15.4, v 0..5.9 (protrudes 5.9 m, edge 0-1) | 2015 + 2026 | one storey, eave 4.0, low hip roof; grey render; two tall glazed bays by the porch, then plain, three narrow windows between white pilasters, plain to the east end |
| entrance | north corner | 2015 porch with a corner column; Commons; 2026 door | recessed porch u 0..2.6, v 0..2.8, column at the corner, glazed double door facing north-west onto the paved path, glazing facing north-east |
| two-storey part, north-east | u 8..28, v 5.9..9.5 (+ step 3-4-5) | 2015: 2x3 window group | eave 6.3, lean-to roof up to the hall; window group u 16.6..21.1; upper windows over the low wing |
| two-storey block, north-west | u 0..8, v 5.9..45.2 | Commons 2013 | eave 6.3; a big window below and a smaller one above per 3.5 m bay |
| hall | u 8..25.8, v 9.5..45.6 | all | walls to 9.6, 5 degree gable roof to 10.4 (LiDAR top), solar panels; clerestory row in brown frames above the north-west roof (Commons); south-east face (edge 5-6) white fins 2 m apart with narrow glass strips (2015) |
| south-west link and block | v 45.6..72 | none | flat link 4.5 m with a roof light; hipped block eave 6.5, ridge 10.0 (orthophoto plan); plain walls |

First reading wrong: from the dashcam alone I read the north-west side as a one-storey strip with the two-storey ring set back. The
Commons photo shows a full two-storey block to the footprint edge; heights were lowered to its proportions (ring eave 7.2 -> 6.3).
The front (the face people see from Savanorių g.) is the north-east end; the entrance is at the north corner, facing north-west.
No lettering: no photo shows a name on the building. The round panel on the 2026 wing front is left off (no emblems).

## Files
- `pipeline/lmsport.js`, `pipeline/add_lmsport.py`, `pipeline/lmsport/sportas.glb`, `work/test_lmsport.mjs`.
- `research/assets/houses/sportas/`: `build_sportas.py`, `civickit.py` / `webpq.py` (copies of lmpost's), `make.sh`, `tools/`
  (`shots.mjs`, `q.mjs`, `mly.py`, `seqhead.py` (headings from the next frame), `dl.py`, `campos.py`, `rectify.py`, `build_final.sh`),
  `shots/` (before_*, after_*, compare_*.jpg), `tests_2026-11-15.log`.
- `refs/landmarks/sportas/` and 13 lines in `refs/landmarks/CREDITS.tsv`.

## The step
- `addBuilding` skips c19 (anything whose middle is inside the outline or within 2 m; corner-checked); returns y0+10.4 for the label.
  `buildFacadeDetails` runs without its record. The footprint keeps collision, `inBuilding`, the minimap and the name label.
- Model placed with one matrix (glTF (u, z, v)), Lambert, night glow on the door and some windows (`ENV.night`). Walls added for the
  fins (0.4 m out of the south-east face).
- Story stop "sale" (SPOTS "Sporto centras": missions domux, kamuolys, vakaras) was on the stadium road 11 m off the blind
  south-east face; `buildStory` is wrapped to move it to the paved path 7 m out from the porch, the waiting person at the door.
- Kalno school, the stadium and the label are not touched. Nothing else is drawn inside the outline or within 2.5 m of it (test);
  the model does not leave the footprint except the 0.4 m fins and the roof overhangs (0.5 m), and no other landmark step builds here.

## Numbers (build.sh chain of 2026-11-15 with lmsport before perf2, `tools/build_final.sh`)
- Model 92,068 B (meshopt, one 1024 px WebP atlas at q72), 2,370 triangles, 2 draw calls.
- Page 30,393,894 -> 30,521,165 B (+127,271 B; after the wall fix below). Two builds byte-identical (one earlier pair differed because
  another agent changed `pipeline/streets/vilniaus.json` between the two builds; rebuilt back to back, identical).
- `fps.mjs` (Metal): 60.3 fps with the step (load 6.2 s), 60.3 without (6.4 s).
- `test_lmsport.mjs f1 f2`: PASS, 11 checks (identical; names once; model loaded; nothing else drawn in or within 2.5 m of the outline
  (fails with 168 vertices when the addBuilding skip is disabled: checked); school still drawn; stadium 18.4 m away; blocked from all
  four sides; walk from the path to the door; story stop and person placed; a car of radius 1 m drives from Savanorių g. to the stop
  and back; no console errors). Other steps' tests not run.

## Fix after review: wall tone (2026-11-15)
The walls read dark grey. Wall colours raised to the police station's and post office's values: render sRGB 0.93/0.93/0.91 (was
0.80) with the plaster texture's weight 0.15 (was 0.35), hall 0.92 (was 0.83), pilasters and fins 0.97. Roofs, plinth, fascia and window
frames unchanged. Shots now at 13:00 game time (were 15:00). Sunlit faces (south-east fins face, the two-storey part in `after_pano195`)
come out at luminance about 200-245, as the police station's sunlit front (about 210-240); faces turned away from the sun (the
north-east wing front, the north-west block) read light grey (about 100-130), as the police station's and post office's shaded faces
do: that is the game's lighting, not the material. Compare sheets refreshed.

## Compared with the photos (`shots/compare_*.jpg`: photo | before | after)
Matches: from Savanorių g. a two-storey grey block with a 2x3 window group on the left and a low hipped wing in front on the right,
the hall rising behind; from the path the corner porch with its column and the two-storey north-west block with two window rows,
clerestory windows above; fins on the south-east face; solar panels on the hall roof from the air.
Differs: the porch faces north-west and is in shadow in the afternoon, so it reads darker than the Commons photo; the dashcam
camera position could not be matched (the game's view from there sees the north-west face, the photo the corner); the 2026
cladding joints, gutters, downpipes, roof safety rails and the blue window panels of 2013 are not drawn; the round panel is left off.

## Guesses
The whole south-west part (link, hipped block, their heights and plain walls); the south-east face's window strips and fin count;
the north-east wing's east end (plain); window counts past the Commons photo's reach on the north-west block; the hall's 5 degree
roof (only the ridge line and LiDAR top are known); the porch depth; all heights to about +-0.5 m.

## Photos wanted
- photo wanted: sports centre (c19), south-east face, seen from the stadium road (fins, windows, doors to the stadium).
- photo wanted: sports centre (c19), south-west end, seen from the path between the school and the stadium (the hipped block).
- photo wanted: sports centre (c19), north-west side in 2026, seen from the paved path (is the 2013 two-storey front still as it was).

## Credit
Model original work. Textures Poly Haven CC0 (Plaster Grey 04, Concrete Wall 006, Box Profile Metal Sheet, Bitumen, Rough Concrete),
covered by the page's "Building textures: Poly Haven (CC0)" line. Reference photos only (Mapillary CC BY-SA 4.0, Commons CC BY-SA 3.0),
listed in `refs/landmarks/CREDITS.tsv`.
