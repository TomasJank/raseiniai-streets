# Combat v2 (step `fight2`, 2026-11-09)

Owner: combat agent. New files only: `pipeline/fight2.js`, `pipeline/add_fight2.py`, `work/test_fight2.mjs`, `research/prototypes/combat/` (screenshots), this report. `fight.js`, `chars.js`, `build.sh` and every other pipeline file are untouched.

## What changed in play

Fighting now has a kick, a block, a dodge, knockback that moves people, hitstop, a jab > cross > kick chain, and opponents that circle, wait and attack in windows one at a time. Everything from v1 still holds (witnesses, heat after 8 s, group mates join, kids and the elderly never fight, bouncers, KO and -50 EUR); `work/test_fight.mjs` passes unchanged on the full build.

## Keys

| Key | Action |
|---|---|
| X or left click | punch. Pressed again during recovery: jab > cross > kick chain |
| Z | kick |
| hold B | block (front 120 degrees) |
| J, or double-tap A / D | dodge sideways, 1.2 m in 0.3 s |
| touch | KICK, BLOCK (hold), DODGE buttons in a second row above HIT / CAM / E |

KeyN (dodge in the spec) is already "new job / cancel race" in `press()`, so dodge is on J. Help panel lists the new keys.

## Moves (seconds of combat clock; hitstop freezes the clock)

| Move | Startup | Active | Recovery | Total | Dmg | Reach | Knockback | Stun | Hitstop | Victim clip |
|---|---|---|---|---|---|---|---|---|---|---|
| jab | 0 | .12 | .33 | .45 | 1 | 1.2 m | .45 m | .35 | 60 ms | hit_head |
| cross | .03 | .12 | .40 | .55 | 1 | 1.3 m | .8 m | .45 | 75 ms | hit_chest |
| kick | .22 | .12 | .46 | .80 | 2 | 1.4 m | 1.2 m | .6 | 90 ms | knockback |

- A hit lands only while the active window is open, checked each frame until it connects (once per move). Arc is +-40 degrees.
- jab has startup 0 and cross .03 because `test_fight.mjs` (unchanged) presses X and expects the hp drop one 33 ms step later, and expects the .45 s cooldown.
- Chain: a press inside recovery, or within .15 s after the move ends, runs the next move (jab > cross > kick > jab). A press during startup or active is ignored (no input buffer). The attacker steps up to .5 m toward the target so a chain can follow a hit that knocked the target back.
- A kick knocks down (mode `down`, 2.6 s, then getup and back to fight or flee) a target that was staggered or already hit in the chain; otherwise it staggers with a long knockback. hp 0 still means KO as before.
- People's attacks (jab, cross only) have startup .25 / .32 s so there is a telegraph to dodge or block, and 1 damage.
- Hitstop: both fighters' mannequin clips freeze (clip time, one-shot time and cross-fade weights) and the combat clock stops for 60-90 ms. Camera shake as before.
- Knockback is a decaying-free slide over .25 s using `world.inBuilding` per step (stops at a wall), then the existing `pedPush` resolves walls and props. Same for the player when hit (.45 / .8 m).

## Block, stamina, dodge

- Block: hold B, `guard` clip plus a procedural forward lean. Damage from the front 120 degrees is 0 and costs stamina (14, or 25 for a 2-damage move) with a small slide back; from behind it hurts normally. Holding drains 5/s. Empty stamina means the guard is broken and hits land. Walking while blocking is 35 % speed, while attacking 60 %.
- Stamina 100, regen 22/s after .8 s without blocking or dodging. Dodge costs 18.
- Dodge: 1.2 m smoothstep slide over .3 s, i-frames for the first .28 s, procedural side lean. Not allowed during a move's startup or active window, allowed to cancel recovery. i-frames also cover bouncer hits (fight.js calls the wrapped `hurtPlayer`).
- Opponents (hp >= 4, in `fight` mode) block 30 % of incoming hits (`cmb.rand` can be replaced for tests); bouncers too.

## Opponent AI (`mode==='fight'`)

- Hold 1.2-1.8 m: close in above 1.8 (3.6 m/s), back off under 1.2, circle sideways in between (1.6 m/s), flipping direction every 1-2.5 s.
- Attack windows: a per-fighter timer of 1.0-2.6 s, not a fixed cadence. When it fires the fighter needs the attack token, lunges to <= 1.25 m, then swings. The heading and approach freeze after the first 40 % of startup, so a dodge or sidestep makes it miss.
- Token: one attacker at a time, held through the whole move and .5 s after; a fighter that leaves `fight` mode drops it. This is what keeps two fighters from landing hits together.
- After two hits within 3 s the fighter backs off for 1.4 s and does not attack.
- At hp 1 with the player unhurt (player.hp 5) it flees (`pedFlee`, nerv 20) and does not return. Bouncers (fight.js objects) never flee and have 6 hp.
- Unchanged from v1: stagger > `next` fight/flee, group mates join, frail never fight, rejoin when the player leaves, is down, or is more than 20 m away.
- Heartbeat: a `fightEvent` every 1.5 s while any ped fights within 20 m, so witnesses and the 8 s heat rule see a continuous fight even when nobody swings; the watch ring is kept centred on the player.

## Kick clip

The free Quaternius Universal Animation Library 1 and 2 packs contain no kick (checked all 46 + 43 clips; closest are Sword_Attack, Melee_Hook, Roll, Slide). `clips.glb` belongs to the chars step, so no clip was added. The kick is a procedural overlay on `thigh_r`, `calf_r` and `spine_02` over the held `guard` pose: chamber (thigh -1.0, calf +1.7 rad) in the startup, snap (thigh -1.55, calf +.15) in the active window, recover over the recovery. Rotations are applied about axes in the mannequin's own frame after the mixer, so no clip edits. Block and dodge are likewise small spine/head overlays. Cost: only characters in those states, a few quaternion ops. Limitation: no support-leg or hip shift, so the kick reads as a leg lift with a body lean.

## Integration

- Add `fight2` after `water2` in `pipeline/build.sh`: `... drive gfx water2 fight2`.
- The patcher renames seven functions with `rep()` (all anchors unique in the full build): `punch`, `fightStep`, `hurtPlayer`, `updateFight`, `walk0` (to `walk0_`), `press`, `charAnim`, each to `name0`, and splices the block before `// ---------- boot ----------` (count 1 in the full build). Also adds three touch buttons before `id="tCam"` and four help lines after the X line.
- Requires `add_fight.py` and `add_chars.py` (asserted).
- Global names added: `MOVES PMOVES cmb ORDER arc2 foes alive nearestFoe hitstop nudge attack startMove playerMove landHit dmgPed frontOf startDodge aiInit tokFree cbar cst kickAmt rotB` and `_kq _kp _kv kSm`; none clash with the base build.

## Tests

Run on the full build (`build.sh` then `add_fight2.py`), SwiftShader, scripts copied to the scratchpad.

`node work/test_fight2.mjs` (18 checks, `ONLY=regex` runs a subset):
```
setup {"ok":true,"ready":true}
touchAndHud {"ok":true}
movesTable {"ok":true,"jab":{"dmg":1,"su":0,"ac":0.12,"rc":0.33,"reach":1.2,"kb":0.45,"stun":0.35,"hs":0.06,"rx":"hit_head"},"kick":{"dmg":2,"su":0.22,"ac":0.12,"rc":0.46,"reach":1.4,"kb":1.2,"stun":0.6,"hs":0.09,"rx":"knockback","down":1}}
kickTwoDamageKnocksDownStaggered {"ok":true,"staggeredVictim":{"hp":1,"mode":"down"},"hitAtS":0.208,"freshVictim":{"hp":1,"mode":"stagger"}}
kickKeyAndOnlyInActiveWindow {"ok":true,"move":"kick","hpDropsAtMoveT":0.224}
blockFrontNotBehind {"ok":true,"blocking":1,"hpFront":5,"hpBehind":4,"staminaDrain":14,"afterRelease":0,"hpNoBlock":4,"hpEmptyStamina":4}
dodgeIframesAvoidActiveWindow {"ok":true,"standing":{"hp":4,"moved":0.46,"dodged":0},"dodgeAtTelegraph":{"hp":5,"moved":1.2,"dodged":1},"iframeHp":5,"afterHp":4}
doubleTapDodge {"ok":true,"dist":1.2,"dur":0.3}
knockbackDisplacementAndBuildings {"ok":true,"displacement":{"jab":0.46,"cross":0.72,"kick":1.23},"wall":{"found":true,"insideFrames":0,"moved":0.46}}
hitstopFreezesClips {"ok":true,"frozenFrames":4,"hitstopS":0.075,"sample":[[0,0,"-"],[1,0,"hit_chest"],[1,0,"hit_chest"],[1,0,"hit_chest"],[1,0,"hit_chest"],[1,0,"hit_chest"],[0,0.016,"hit_chest"],[0,0.032,"hit_chest"]]}
comboJabCrossKick {"ok":true,"seq":["jab","cross","kick"],"earlyPressIgnored":true,"chain":3,"hp":95,"mode":"down"}
opponentBlocks30pct {"ok":true,"blockedLowRoll":{"hp":5,"blk":0.4},"hitHighRoll":{"hp":4,"blk":0},"lowHpNeverBlocks":{"hp":2,"blk":0},"blockRate":0.2825}
opponentBacksOffAfterTwoHits {"ok":true,"backedOff":false,"attackedWhileBacking":false,"dist0":1.8,"maxDist":4.04}
opponentFleesAtHp1OnlyWhenPlayerUnhurt {"ok":true,"hurtMode":"fight","unhurtMode":"flee"}
attackWindowsVaryAndNeverOverlap {"ok":true,"attacksA":15,"attacksB":16,"hits":31,"intervalMeanS":3.18,"intervalSdS":0.21,"minInterval":2.71,"maxInterval":3.53,"simultaneousStarts":0,"hitsWithin100ms":0,"fractionInBand":0.98}
hudShowsInFight {"ok":true,"visible":true,"bars":["100%","100%"],"staminaBar":"40%"}
errors []
PASS
```

`node work/test_fight.mjs` on the same build, unchanged: PASS (13 checks, last run `heatWithWitness` watch ring 7.4-9.7 m, `youngMaleFightsBack` player hurt at 1.5 s, `bouncers` PASS, errors []).

Fps (`node work/fps.mjs`, Metal, M5 Pro, 1280x720, idle street scene): **60.3** (baseline 60.3), load 1.2 s, heap 272 MB. The per-frame cost of fight2 is a few comparisons when nobody fights; during a fight it adds a handful of quaternion operations on the (at most 3) mannequins in kick, block or dodge. The harness fight scenes run on SwiftShader so they say nothing about fps; no GPU fight scene was timed.

Screens: `research/prototypes/combat/{kick,block,dodge}.png` (SwiftShader, taken by the test).

## Limitations

- Procedural kick: leg lift and body lean only, no hip or support-leg motion; looks stiff next to the authored punches. A real kick clip (UAL Pro, or any Mixamo-style kick retargeted to the UAL2 skeleton and added to `clips.glb` by the chars owner) would replace `kickAmt`/`rotB` for the leg.
- Dodge pose is a spine lean only (no crouch): dropping the pelvis needs a root offset the clips do not expose.
- Bouncers keep fight.js's own AI (instant 1.2 s cadence, no telegraph, no knockback, no knockdown); they get block rolls, 2-damage kicks and player block / dodge / i-frames, and they do not use the token.
- Peds only jab and cross; no ped kicks or blocks they can break.
- Block and dodge are player-only keys; a hit from a source other than a ped or bouncer in `hurtPlayer()` with no attacker is treated as frontal.
- Instanced (far / pre-GLB) people get the old arm-swing pose for attacks and none of the kick, block or dodge overlays.
- Double-tap A / D turns the player slightly before the dodge starts (A / D steer on foot).
- Attack interval between two fighters averages about 3 s (token plus .5 s gap plus the per-fighter timer); one fighter alone attacks about every 2 s. Tunable in `fightStep` (`A.atk`).
- The test harness releases `KeyB` through real keyboard events; touch BLOCK sets `KEY.KeyB` the same way as the arrow buttons.
