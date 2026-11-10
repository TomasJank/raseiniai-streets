# Maironio g. re-pass (facade keys)

Photos: the 16 views of the first pass (refs/mapillary/maironio/, 2026-05 to 2026-09). Sheet (photo | v45 | after, 16 rows): research/prototypes/streets/maironio/compare_v2.png.

| id | photo shows | keys set |
|---|---|---|
| c2903, c2921 | cream upper walls over a dark red plinth, red clay hip roof | wall = plinth [.52,.24,.18], wall2 = old cream, band 1.0, roofSty tiles |
| c2920 | same plinth, ochre upper walls, glazed balcony | wall/wall2/band 1.0, balcony true |
| c2660 | cream lower floors, dark green top floor (JOSEDA corner side) | wall cream, wall2 green, band 6.0 |
| c2982 c2984 c3059 c3060 c3062 c7745 c5176 c5181 c3120 | silicate blocks with glazed balcony columns | balcony true |
| c2972 | green metal roof (predecessor, photo) | roofSty sheet |
| fence 55.3845 N | white mesh railing at the bus stop crossing | col #dfe3e1 |

Removed guessed `roof` (orthophoto shows through) on every look except c2903, c2921, c2972: c2660 c2703 c2698 c2705 c2713 c2714 c2722 c2962 c2960 c2982.. (all blocks) c3380 c5130 c5114 c2158 c2920 c3436 c3351.

Not set: blankGable, faces, ridge, chimney, dormer. No photo shows a blank gable or a gable-to-road house on an id of this file (the white gable house in view 1056 could not be matched to an id; the game's police building sits where the photo shows open ground).

Checks: `--check` ok (28 looks); test_streets: all maironio looks resolve, Maironio g. street resolves, pushOut and crowd clean; the only FAIL lines are LOOK.c1286/c1295/c1298/c1302/c1558/c1622 from another street's file; fps 60.3 (Metal).

Backlog: the grey-clad red-roof building beyond c2660 and the green one's neighbour belong to Dominikonu ids; JOSEDA two-tone is on c2660 only if that id is the green block (matched by position, not by sign).
