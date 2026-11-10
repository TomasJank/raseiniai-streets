# Žvyryno g. photo match (2026-11-10)

Photos: 25 Mapillary frames in refs/mapillary/zvyryno (2025-02-10 to 2026-10-14, 8 MB), credited in CREDITS.tsv. All are dashcam frames looking along the street; coverage is only the NW end (lon 23.107), the Jazminų to Bažnyčios stretch, and the SE end (Vilties to Klevų). The middle stretch and the proposed ways in the west have no coverage and were left as they are.

Most frames show trees, fields and the road; only three show buildings that can be tied to ids.

| id | photo shows | set |
|---|---|---|
| c1829 | 2-storey tan silicate brick house, dark grey gable roof, dark window frames (#12, #13) | sty silicate, wall [.74,.68,.56], roof [.24,.25,.27], h 5.6, rh 3.2 |
| c2206 | cream house, dark grey-brown roof, attic, chimney (#2) | wall [.86,.82,.68], roof [.30,.27,.28], h 5.4, rh 3.4 |
| c2241 | cream gable-end house, dark roof (#2, far left) | plaster, wall [.82,.77,.66], roof [.28,.28,.30], pitched, h 3.2, rh 3.6 |

Also added 2 Lithuanian flavour dialogues (6 total). Compare sheet: research/prototypes/streets/zvyryno/compare.png (photo | before | after, 3 rows, the three buildings touched). Before renders: research/prototypes/streets/zvyryno/before/.

Checks: add_streets --check ok (28 looks, 79 props, 8 signs, 6 flavour); test_streets PASS zvyryno on v37 + street scratch build; fps 60.3 (Metal), no console errors.

Backlog (engine cannot express):
- fence colour and material (photos show brick-and-stone-post fences with mesh, concrete-post fences with hedge, blue sheet-metal fence); fences only have style.
- Photo GPS is off the road, so the game camera snaps to a different side; one right-hand wooden house in #2 has no unambiguous id and was not touched.
- Roof tile colour per roof pattern (dark metal tile vs standing seam) is not selectable.
