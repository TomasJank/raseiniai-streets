# fix-talk: "they repeat random phrases sometimes" (and black dialog clouds)

Step `fixtalk`: pipeline/fix_talk.js + pipeline/add_fixtalk.py (append after `fixgfx` in build.sh). Tests: work/test_talk2.mjs, work/test_bubbles.mjs.
Probes (scratchpad, not shipped): fixtalk/probe2.mjs (targeted conversations), probe3.mjs (stationary soak, every group logged), ana.js.

## What was ruled out (logged, not assumed)
Targeted runs (36 conversations at 8-25 m, adults only, sound on and off) and 8-minute stationary soaks (50-60 groups per build) on v38, v40, v41:
- same line twice in a row: never. Line twice in one conversation: only the random TALK_HM filler ("Aha." / "Nu jo." / "Taip, taip." / "Tikrai?"), 1 of 52 groups.
- g.i going backwards, skipped lines, interleaved scripts (g.script replaced mid-talk), text != script[g.i]: 0 in all builds.
- goodbye-jump re-showing lines: never; the jump only skips forward.
- bubble not on the speaker / visible after its line: 0 (checked per frame, speaker position vs sprite position).
- voice: 378 lines, 378 distinct clip ids, no collisions; voiceLast text always equals the line on screen for the group in the test. Audio of other groups within 40 m is audible without a bubble (bubbles only < 30 m), which is by design.
- Math.random perturbation by character/animal loaders: pickTalk and group formation are not affected (seeded test_talk2 behaves identically across builds).
- Disturbances (hide a member, car-pass pedEvent, panic): group ends cleanly or continues with the remaining pair; no re-pick.

## Root cause (pre-existing, same in v38, v40, v41)
Companions (a leader with followers, p.lead) stop to chat via `pedIdle` (add_views.py:~350 `if(F.length&&Math.random()<.6){startTalk(...)}`), restore `p.lead=p.pair` afterwards and idleT is only 25-65 s. So the same walking pair holds a full conversation every ~60-90 s, each one a fresh greeting-style script and each one ending with "Na, bėgu. / Iki!" although they keep walking together. Logged pair 22+18: 5 conversations in 12000 steps (6.6 min); pair 27+28: 6; pair 20+17: "Parke krepšinį žaisim?" twice (steps 3744 and 6558). Repeat conversations by the same members: 35/60 groups (v38), 32/63 (v40), 25/57 (v41). Last round made every talk play to the end, which is why it is only noticeable now.
Contributing, all in pickTalk (add_views.py:~537-545):
- `talkRecent` remembers only the last 8 scripts globally, while tagged scripts (day/street/shop) have weight 4: in the soak "Eisi sekmadienį į bažnyčią", "Gimnazijoj penktadienį koncertas", "Turistai vėl klausė apie tankų mūšį" each opened 4 of 52 conversations.
- only 4 goodbye pairs and 4 fillers, picked with no memory: the same "Iki!" pairs close 100% of conversations (11/16/13/12 of 52).

## Fix (smallest change, new files only, anchors count==1 asserted)
- companions (`mem.some(q=>q.lead)` at pickTalk time) get a closing murmur from existing voiced TALK_HM lines instead of a goodbye pair; no new TTS needed.
- companions only start another talk after 150 s of rest (`p.lastTalk` stamped in startTalk, checked at the pedIdle call site; the else-branch is the existing "idle 3-9 s" path).
- `talkRecent` window 8 -> 30; goodbye pair never equals one of the last 2 used; fillers unique within a conversation; closers unique against the fillers.
Result, same 8-min stationary soak, v41 -> v41+fixtalk: groups 57 -> 33, repeat conversations by same members 25 -> 5, scripts with a duplicated line 0.
Not done (needs assets): more goodbye/filler variety. New lines need `voice.py` before `add_voice.py`; with fixtalk last they would be silent while the others speak.
Side observation: every voice id is the same for male and female (`say:Ona` fallback, male = same clip at rate .82), i.e. edge-tts was not installed when the clips were built, so all pedestrians share one voice. A rebuild of work/voice with `pip3 install edge-tts` would help the "something off" feel.

## Tests (full chain incl. fixgfx + fixtalk)
- work/test_talk2.mjs (seeded Math.random, adults only, never a kid without its lead): 30 conversations (2 and 3 members, strangers and companions), no repeated line, g.i 0..n-1 monotonic with no gaps, same script, ends with its closing pair, strangers say goodbye, companions never do, bubble on the speaker, 6 pulled-out-member runs end cleanly, rest gate, goodbye rotation, no page errors: all passed.
- test_talk (existing): all passed. test_chars: PASS. test_fight: PASS 2 of 3 runs on the fixtalk build (one run failed noHeatWithoutWitness `reading 'duration'` and groupMateJoins; the same file without fixtalk passed; unseeded, looks like the known flakiness, not the step, which touches only talk code). `node work/fps.mjs`: 60.3 fps (Metal), swiftshader 1.3 as always.

## Black dialog clouds
work/test_bubbles.mjs: puts 6 groups in front of the camera, screenshots, projects each visible bubble sprite to a screen rect and takes, per pooled sprite, the best frame (a bubble behind a person is legitimately partly dark): mean luminance > 110 and >= 25% light pixels (text makes "<2% near-black" impossible: ~10-20% of a bubble body is dark text).
- fixgfx build, tod 13: ok (best mean 161-192, light 46-67%); tod 22: sprites 0-2 sampled ok (mean 172-189), 5 bubbles visible in a screenshot at 22:01, all white (looked at it). Pool indices 3-5 are only sampled when large enough on screen; the screenshot shows 5 white.
- I could not reproduce black bubbles even on v41 (pre-fixgfx) in headless swiftshader at tod 13: the GTAO path evidently only bites on the real GPU/quality setting, so this harness cannot prove the fixgfx effect, only that nothing is black afterwards. No stale-texture or pool-reuse blackness found (texture is replaced whenever the map differs; opacity 1, color ffffff, toneMapped true, renderOrder 5 on all six). No second fix needed in fixtalk.
