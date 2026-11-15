# audit-c: LiDAR audit pass, Dominikonų, Vilniaus, Jurbarko, Maironio, Vytauto Didžiojo, Kęstučio (2026-11-15)

Method: orthophoto crop per house (`pipeline/kit/sheets/audit/c_ortho_<id>.jpg`, with `_raw`), page's own LiDAR (`rasData.lr`, `lh`). Where the roof fit is a 4-corner flat/gable/hip the height and roof were set from it; where the outline has more than 4 corners (pitched roofs cannot apply) `h`, `rh`, `pitched`, `hip` were deleted so the game uses the measured values. No street frame was fetched: no house here is in yesterday's reports with a clear daylight frame that contradicts the LiDAR (see the c2910, c2920, c7170 notes). Edits scripted in `research/reports/audit-c-fix.py`-equivalent (scratch). Error kinds: N = neighbour's look, S = wrong storeys, T = wrong type.

| id | look said | LiDAR | seen (ortho) | set |
|---|---|---|---|---|
| c2668 | 14.5 m flat block, grey block walls (N: the big flat building next door) | top 8.3 / median 7.6, 10 corners | small house, dark red hip roof | dims deleted, roof dark red, wall cream guess, sty plaster |
| c2687 | 10 m, 3 st | flat 5.0 (2 st) | long dark flat-roofed building behind the block | h 5.0 flat (S) |
| c2943 | 6 m pitched | flat fit 3.9 | small grey roof | dims deleted, roof grey (S) |
| c2930 | 7.5 m hip | 11.4 m median, 7 corners | big grey-white roofs | dims deleted, roof grey (S) |
| c2685 | 2.6 m flat sheet | hip fit, eaves 3.3, rise 3.3 | small teal roof | dims deleted, roof teal (S) |
| c7210 | 5.4 hip | hip, eaves 3.4, rise 2.6 | small house, grey roof | h 3.4 rh 2.6 hip (S) |
| c2684 | 3.4 flat | 5.4 m, 10 corners | teal-grey pitched roof | dims deleted, roof teal-grey (S) |
| c2504 | 5.6 gable | 3.4 m, 6 corners | small dark roof | dims deleted (S). Yesterday: no photo |
| c2185 | 7.5 hip | 5.6 m, 8 corners | red tile roof under scaffolding | dims deleted (S). Yesterday: no photo |
| c2941 | 7.2 flat, balcony | 4.1 m, 10 corners | small cottage | dims and balcony deleted (S, T). Yesterday: no photo |
| c2910 | 5.6 gable | hip fit, eaves 8.6, rise 3.3 | big maroon hip roof | h 8.6 rh 3.3 hip (S). Yesterday's "matches" was colours only (cream, red tile), kept |
| c2911 | 5.6 gable | 5.1 m, 8 corners | cottage | dims deleted (S). colours kept |
| c7170 | 3.2 m shop, one storey, green fascia (from a photo) | flat 5.3 | big flat grey box, shop | kept one storey and look; h 5.3 and fascia band 4.3 so the green stays a top strip (LiDAR height only) |
| c1667 c1672 c1650 c1633 c1637 | 4.6 to 5.2 m pitched | 3.6 to 4.5 m, 6 to 10 corners or flat fit | cottages in gardens | dims deleted (S) |
| c1844 | 5.2 gable | gable fit, eaves 3.0, rise 3.1 | blue-roofed cottage | h 3.0 rh 3.1 gable (S) |
| c2920 | 8 m, balcony | median 3.6 (top 10.0 is a tree/chimney), 10 corners | low long grey roof | dims and balcony deleted (S, T). Colours (red wall, ochre band) kept: yesterday's frames matched those, but the 8 m height was the old guess |
| c5130 | 6.5 m red corrugated flat | 10.4 m, 9 corners | large hall with a solar roof | h deleted (S). Wall red (no source) changed to grey as in the ortho, guess |
| c3436 | 5.0 flat | flat 2.2 | tiny dark flat roof, white edge | h 2.4 (S) |
| c3715 | 9 m three-storey pitched house (N/T) | flat 3.4 | low flat annex, grey roof, car park | h 3.4 flat, roof dark grey, wall plain light guess (T) |
| c5407 | 5.8 gable | 4.1 m, 11 corners | red cross-roofed house | dims deleted (S) |

Counts: 21 wrong storeys or height, 4 wrong building type (c2941, c2920, c3715, c2668), 2 look of a neighbour (c2668, c3715).

Still flagged after the change: only c2181 (IKI, excluded, old entry) and c2683 (model step). Audit on a page built from these files shows no other row on these six streets.

Noted, not mine: building v71 prints `kit: ignored c2982.xg` (maironio kit file, edge 0 is a gable end); present before my change.


**Correction by the integrator (2026-11-15):** c2668 is the large flat-roofed building itself (10 corners, LiDAR median 7.6 m), not the small red-roofed house beside it: `ortho_crop.py` prints a building's id at its first corner, which here lies next to that house, and the integrator's brief misread it. Its look is back to grey walls and a flat dark-grey roof, with the height left to the LiDAR (about 7.6 m, two storeys); the old 14.5 m was the only thing wrong with it.
