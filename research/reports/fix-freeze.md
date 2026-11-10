# fix-freeze: stolen car + car hits lags then sticks (v43)

## Root cause
`carLamps(c)` (pipeline/drive.js:22-30, built v43.html:6342-6350) builds two `THREE.SpotLight`s per car the player ever drives (`const sl=...new THREE.SpotLight`, drive.js:27) and nothing ever removes them. The starting car owns 2; every theft adds 2 more that stay in the scene at intensity 0.
three.js bakes the light count into every lit material's program, so each steal recompiles ~40 programs (102 -> 140+) and every fragment of every lit material loops over all spotlights afterwards. A steal costs one 130-216 ms hitch (first steal) up to a 1.7 s stall (a later steal while the scene is compiling heavier variants), and it gets worse with each theft (22 lights after 9 steals).
Hits are not the trigger: the hit path (runOver, fix_people tumble, chars clip switch, kick, fight2 wrappers) measured flat.

## Reproduction (probe: scratchpad/fixfreeze/probe.mjs, allcars.mjs, real.mjs; Metal GPU, 1280x720, real frame() functions stepped + gfxRender)
| scenario (v43) | result |
|---|---|
| steal 1 car, 8 hits in 30 s, per-step wall time | max 130-215 ms (always the first steps after the steal), mean 6.4 ms; lights 4 -> 6, programs 102 -> 140 |
| same, 0 hits | identical spike, programs 106 -> 145: the steal alone causes it |
| steal 9 different models in a row | lights 6, 8, 10 ... 22; one step of 1704 ms (saloon90, second steal) |
| hit windows (8 hits, heat 5.99, 5 cops, day and night) | max step 8 ms; objs/geo/tex flat after the steal |
| watchdog: step > 2 s | never hit on this M-series GPU; compile time scales with the machine, SwiftShader/slower GPUs will hang |

## Bisect table (suspect -> verdict)
| suspect | evidence | verdict |
|---|---|---|
| fix_people tumble / chars clips / kick wrapper | no loops (`while`/`for(;;)` grep: only drive2 aiPlan/aiSteer, both bounded); hit windows max 8 ms, skinned count stable | clear |
| drive2 pin / drive-through | loops bounded (g>3, q.push always grows) | clear |
| parked2 rebuild | no rebuild during steal/hits (geo count flat) | clear |
| per-car tail material / sprites | 2 sprites + 1 material per car, cached in c.lamps, bounded | minor, left |
| drive.js spotlights | lights 4 -> 6 per steal, +40 programs, 130 ms-1.7 s stall | ROOT CAUSE |

## Fix
pipeline/fix_freeze.js + pipeline/add_fixfreeze.py (append `fixfreeze` after `drive2` in build.sh). Wraps `carLamps`: the first pair ever built becomes the shared pair; a later car's freshly built pair is removed and the shared pair is re-parented onto whichever car the lamps are asked for (positions kept per car in `lamps.slp`). Light count stays constant, so no recompile on theft.

## Before / after (same probe, 4 thefts + 8 hits, 30 s)
| | v43 | with fixfreeze |
|---|---|---|
| lights after 4 thefts | 4 -> 12 | 4 -> 4 |
| max step | 131-135 ms | 32-35 ms |
| mean step | 5.8 ms | 5.7 ms |
| programs after theft | +40 | +12 (unrelated first-use variants) |
| growth during hits | none | none |
Night: headlamps still light on the stolen car (test asserts it).

## Proof
work/test_fixfreeze.mjs (day, and `night` arg): PASS both. Regression and fps results in the final message.
