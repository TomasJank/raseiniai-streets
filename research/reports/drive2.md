# drive2: pure-pursuit traffic cornering and handbrake counter-steer

Files: `pipeline/drive2.js`, `pipeline/add_drive2.py` (step `drive2`, run after `build.sh`; build.sh untouched), `work/test_drive2.mjs`.
Build: `sh pipeline/build.sh $S/x.html && python3 pipeline/add_drive2.py $S/x.html`. The edits are three `rep` calls (each `assert count==1`) plus the JS insert before `// ---------- boot ----------`.

## What changed

A. Traffic. In `updateTraffic` the "advance `ai.t` by speed*dt, then `aiPlace` lerps 25% toward the lane and 12% toward the edge heading" lines become `aiSteer(c,dt)`. The car now owns its position and heading:
- look-ahead `ld = 3 + 0.5*speed` m, walked along the lane polyline (edge, junction connector, next edges), with offset 1.7 m as before;
- yaw rate = `v*2*sin(alpha)/ld`, clamped to 2.8 rad/s and low-passed (8/s); position integrates along the heading;
- `ai.t` is now the projection of the car onto its edge (other code that reads it still works); the edge advances when within 2 m of its end or 2.5 m of the node;
- the node walk is planned 3 nodes ahead in `ai.q`; `aiNext` takes its next node from it (one `rep` on the random pick);
- `c.steer` follows yaw rate, so AI front wheels now turn and corner speed drops by up to 35% through the existing `target` line;
- `world.collide(…,1.05)` at +-1.25 m, as the player does; if a lane runs through a wall and pins the car for 1.5 s it drives through for 3 s instead of wedging forever.
`aiPlace` is kept for the spawn snap. Signals (`redAhead`), `blockedAhead`, stun and speed logic are untouched.

B. Drift. `driftCS(c)` is subtracted from the `yaw` line in `driveCar0`: while `sliding` and speed > 5, a yaw term toward `trav`, `3 * slip`, ramped in between 40 and 63 degrees of slip and by speed (5 to 10 m/s). The dead zone keeps the ordinary 30-frame handbrake turn almost unchanged.

## Numbers (same machine, heavily loaded by other sessions, so timings are noisy)

| | before | after |
|---|---|---|
| turn rate p99 (300 cars, 60 s, 1/60 s steps, after 5 s settle) | 6.25-6.33 rad/s | 2.15 |
| turn rate max | 22.6 | 2.4 |
| turn rate p99.9 | 17.5 | 2.3 |
| mid-edge lane offset, edges >= 30 m, t in .35-.65 (target 1.70) | 0 deviation by construction | mean 1.696, median dev 0.001 m, p95 0.17-0.23 m, p99 0.72-0.76 m |
| building-corner samples (4 corners of a 1.8x4 m box, moving cars, 10 Hz, 18,000 car-s) | 2,339-2,448 | 1,935 (ran 1,481 once) |
| `W.collide(c,1.0)` wall hits | 1,937-2,127 | 423-1,031 earlier build, 730 final (dominated by 1-2 pinned cars) |
| signal stop (red, 45 m approach) | stops 12.3 m before the node | stops 12.9 m before, never closer |
| blockedAhead (stopped car 16 m ahead) | min gap 3.9 m, speed 0, resumes at 11 m/s | min gap 4.45 m, speed 0, resumes at 11 m/s |
| updateTraffic, 26 cars | 0.094-0.097 ms/call | 0.121 ms/call |
| updateTraffic, 300 cars | 1.8-2.3 ms/call | 2.4-2.8 ms/call |
| drift (playtest snippet: speed after, max slip, sliding frames) | 14.1, 48.4 deg, 30 | 14.1, 44.9 deg (-7%), 30 |
| 4 s full lock + handbrake | max slip 131 deg (spins), 93 sliding frames | 91 deg, 77 sliding frames |
| handbrake only | unchanged | unchanged |

Turn-rate target met: p99 2.15 (<= 3), max 2.4 (<= 7). Lane offset is within 0.3 m of today's at the 95th percentile and the median; the p99/max tail (0.7 m / 2.9 m) is cars recovering after a bump or a wall push, not steady running.

Honest limits:
- Zero building clips is not reached, and the baseline does not reach it either (its lanes already pass through some outlines). Per moving sample the new code clips less (buildings -20%, walls -65% to -85%), but the count swings with a couple of pinned cars, and two runs of the same seed diverge, so no per-cell comparison is possible.
- 26-car cost rises by about 0.025 ms/frame (0.15% of a 16.7 ms frame).

## Regression
- `node work/test_drive.mjs x.html`: PASS (all checks; one run needed longer timeouts because the machine was saturated).
- `node work/test_solid.mjs x.html`: all passed.
- `node work/test_cars2.mjs x.html`: PASS.
- `node work/fps.mjs x.html`: 60.3 fps on the Metal renderer.
- `node work/test_drive2.mjs x.html [base.html]`: all checks ok on both pages; it also runs on the pre-drive2 page for the "before" column. Set `CELLS=file.json` to dump building-hit cells, `ONLY=drift` for the drift part, `CS='{"cs":3,"s0":.7}'` to tune.
