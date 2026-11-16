# Recorded car sounds (step `carsound`, 2026-11-15)

Owner's request: more and more realistic car sounds, the engine above all. Before this step every car sound was synthesised (updateAudio0's looped four-pulse buffer pitched by rpm, drive.js's sawtooth body, the square-wave horn, the sawtooth-plus-LFO siren, noise bursts and decaying tones for crashes). Nothing of that is deleted: it is the fallback.

## Files

- `pipeline/carsound.js`, `pipeline/add_carsound.py`; `carsound` sits before `hud2` in `pipeline/build.sh` (the one edit to that file).
- `research/assets/sounds/cars/`: `SOURCE.md` (every source: URL, author, licence, sha256), `clips.json` (what is cut from where), `make.py` (cutter, numpy), `clips/meta.json` (rpm, load, loop points per clip), `make_audition.py` + `audition.js` -> `audition.html`, `check/render.mjs` + `check/plot.py` -> `check/*.png`. Raw downloads (`raw/`) and cut clips (`clips/*.ogg`) are gitignored like every raw asset; so are the check PNGs (the existing `research/assets/**/*.png` rule).
- `work/test_carsound.mjs`.

## Recordings

All CC0, all from freesound.org (its public HQ previews, fetched with curl, no account; the original-file download needs a login). OpenGameArt had one CC0 engine pack ("racing car engine sound loops"), six pitch-shifted copies of one start-up recording, so not a real rpm set; Wikimedia Commons had nothing usable under a free licence without share-alike.

- **Petrol, in the game: a 1985 Ford Escort Mk3** (escortmarius). The same person recorded one car many times with a phone inside it: a cold idle, standing revs, town driving, a motorway run, and a full-throttle run from a traffic light through five gears. Thirteen loops: idle 845 rpm, no-load 1070 and 1540, pulling 1910, 2333, 2824, 3459, 3854, 4828, 5643, coasting 2436, 2867, 3630. The right era for the Audi 80.
- **Petrol, alternative: Peugeot 404 Injection** (Sadiquecat), three mics mixed while driving downhill. Seven loops 1140 to 3635 rpm, all one list (no full-throttle stretch). Rougher, with road noise; its pitch tracking was the least steady (see Gaps). Audition page only.
- **Diesel, in the game: VW New Beetle 1.9 TDI** (Evilmikie): start, idle and revs held at steady rpm with clean harmonics. Six loops: 902 (idle), 1134, 1793, 2190, 2469, 3063 rpm, no load. Rejected diesel candidates: a TDI with the mic in the engine bay (fastson, broadband clatter, no usable pitch), a Belgian 1.9 TD interior (road noise over the engine), a Peugeot 3008 1.5 BlueHDi and a 2026 Sprinter (only fast blips, no holds).
- Other sounds: Chevrolet Lacetti 1.4 start and switch-off (interior), a Mercedes diesel start, a car door open and close, a handbrake ratchet, a 2008 Fiat Panda horn, a Chrysler LHS tyre squeal, a layered car crash (metal, grit, broken glass), a metal clank, a pane of glass, a Whelen wail siren, a car over a speed bump. Sources in `SOURCE.md`.
- Indicators: the game has none, so no ticking (the Escort's own relay recording is CC BY and would have fitted).

## How the loops are made (`make.py`)

For each stretch in `clips.json`: the firing frequency is tracked every 10 ms (harmonic product spectrum within -20%/+25% of a guess read off a spectrogram, then a 0.3 s median and a 0.1 s mean), the stretch is resampled so that frequency is constant (a tape-speed bend; the stretches bend 1 to 12%), a whole number of engine cycles (4 firings = 2 revolutions) of about 1.5 s is taken, its length fine-tuned within 3 ms to the best waveform match, and the last 40 ms are crossfaded (sine/cosine) into the start. Every loop is set to the same RMS (the game sets loudness by rpm and load). The clip carries 60 ms of the loop's own wrap on both sides, so the Opus encoder never sees the seam; the game loops between `pre` and `pre + len` (`AudioBufferSourceNode.loopStart/loopEnd`). Windows were moved twice to avoid transients that would have repeated once a loop (a tick in the town drive, a knock in the standing revs). Opus mono 24 kHz, 40 kbit/s for engines, 32 for the rest.

## How the crossfade works (`carsound.js`)

- Each engine is a list of loops by rpm with a load flag. Two crossfade lists: pulling (the pulling loops, extended below with the idle and no-load ones) and coasting (the coasting loops, extended above with the pulling ones), so both run from idle to 5600.
- At a given rpm, the two loops either side get an equal-power crossfade in log rpm; the two lists are mixed by load (also equal power). Each heard loop plays at rate rpm/its own rpm, clamped to 0.7-1.4 (`CS_RATE`); neighbouring loops are at most 1.6x apart, so the louder loop of a pair stays within about 0.8-1.25. Sources exist only while their loop has gain (started at a random point of the loop, stopped 0.6 s after going silent), so a voice runs two or three sources.
- Each voice: loops -> lowpass (opens with load and rpm) -> gain. Loudness `(.55+.45 load)(.55+rpm/7000)`.
- Player: the game's own rpm model (updateAudio0's bands and formula: first gear from idle, later gears back to about 2400 rpm, standing on the throttle 3500) driven by drive.js's gear with its hysteresis, smoothed the way updateAudio0 smooths it. On an upshift the rpm falls from about 5000 to about 3100 within 0.3 s and the voice dips to 35% for drive.js's 0.26 s torque cut (load 0 meanwhile); drive.js's gear clunk stays.
- Diesel: vans (Sprinter), the bus, and the W124, W210, A4 B5.5 and Passat B3 in traffic; the game's 850-5300 rpm becomes 900-3125. The bus plays the diesel 20% lower (a bigger engine).
- Traffic: one pool of 3 voices (`CS.N`) for the nearest moving cars within 70 m (the bus within 91 m) of the camera, each panned and attenuated like `soundAt`, with Doppler (+-10%) from the speed relative to the player's car; rpm and gear estimated from each car's speed with the same model, load from its acceleration. A voice keeps its car while the car stays among the nearest three.
- The choice of engine is one line at the top of `carsound.js`: `const CS_PICK={petrol:'p',diesel:'d'}` (`q` = Peugeot 404); `add_carsound.py` embeds only the sets named there.

## The rest

- Getting in: door shut, then the starter (petrol or diesel by car); the engine voice fades in as the start clip catches. Getting out: switch-off, door open, door shut.
- Horn (Q): the Panda's horn as a loop while held. Siren: the wail loop, gain by the distance to the nearest police car as before, panned towards it. Handbrake (Space in a car): the ratchet on each press. Tyre squeal: a recorded squeal loop following drive.js's sliding state, louder than its synth (gain^0.7, up to 0.45) and pitched by speed and slip.
- Crashes: building and car hits play the recorded crash (plus the clank above 12 m/s), pole hits the clank; the synthesised crunch is hushed while they play (tone and burst are muted for the duration of crashFX/carHitCar). A broken lamp plays the glass clip. drive.js's low impact thump stays.
- `carBumpSound(strength)` (0..1, also `window.carBumpSound`): the speed-bump clip, louder and pitched up for harder bumps; returns its duration. Synth thud if the clip is missing. For the `bumps` step.
- While the clips play, the synthesised engine, body oscillator, horn, siren and squeal are disconnected from the master bus; they reconnect if the clips are not ready. Everything goes through `snd.master`, so V (sound off), the hidden-tab suspend and no-sound-before-a-gesture work unchanged. Clips decode once (async `decodeAudioData`) after the first gesture.

## Size and cost

- 32 clips, 287 KB embedded; the page grows by 306,843 bytes (31,741,857 -> 32,048,700) with the code.
- `csUpdate` 0.007 ms a frame (300 calls). Levels on the master bus against the synth it replaces: idle -33.6 dB vs -33.9, standing on the throttle (3500 rpm) -24.0 vs -26.0.

## Checks

Pictures in `research/assets/sounds/cars/check/` (rendered in headless Chrome with OfflineAudioContext from the audition page, which runs the same code; plotted by `plot.py`):
- `seams_1..3.png`: every loop played three times through `loopStart/loopEnd`: the waveform 12 ms either side of the join and a spectrogram of the three passes with the joins marked. Joins are continuous; no vertical line at any join. The largest sample step within 3 samples of a join, against the largest anywhere else in the render: 0.02 to 0.74 for every game loop (the join is never the roughest point); 1.11 for the 404's q_1800 (audition only).
- `drive_p.png`, `drive_q.png`, `drive_d.png`: the simulated drive (idle, flat out through three gears, cruise, brake, idle): the harmonics follow the rpm curve (overlay rpm/30), each upshift is a fall in pitch with a dip in level, no steps where loops hand over.
- In the game page (test_carsound): each decoded loop continues past loopEnd as it does from loopStart (correlation 0.97 to 1.00 over 20 ms; siren 0.91, squeal 0.95), which also proves Chrome's Opus decoder keeps the timing.

## Tests (final build, one at a time)

Final build = `sh pipeline/build.sh` of the live pipeline with `carsound` before `hud2`, 32,048,700 bytes; built twice, byte-identical.

- `test_carsound` (Metal): 15 of 15. Block 287 KB; no block -> synth plays (engine gain 0.11, no voice); diesel clips that do not decode -> synth stays, real clips take over when good; all 32 clips decode and each loop continues past loopEnd as from loopStart; gains read back: 850 -> p_idle only, 2600 pulling -> p_2500 .63 / p_3000 .78, 3200 coasting -> p_c2800 .74 / p_c3600 .67, 5000 pulling -> p_4800 .94 / p_5600 .35; five upshifts each drop the rpm by 1,350 to 2,100 within 0.3 s and the voice to about a third; heard loops within 0.70-1.40, the loudest within 0.89-1.16; Sprinter, bus, W124, W210, A4, Passat diesel, the rest petrol; a traffic voice plays the bus on the diesel; pool of 3, at most 2 active and 9 sources seen; in: door_close + start_p, out: stop_p + door_open + door_close, crash: crash_big + crash_small with 0 oscillators, carBumpSound(.6) plays bump (0.59 s); V: master 0, every carsound output connected to the master, one-shots refused; hidden tab suspends, visible resumes; csUpdate 0.007 ms; no console errors.
- `test_perf`: ALL PASS (605 draw calls at the start, budget 620; the audio adds no draw calls).
- `test_sounds`: all 11 checks pass.
- `test_voice`: the stock 5 s wait for audio timed out at machine load 19 (the known load flake); with a 60 s wait 8 of 9 pass and "sfxAnimal makes nodes" fails, the known pre-existing failure (it expects oscillators, the sounds step plays samples once decoded); nothing in it touches car sound.
- The audition page, clicked through headless: 45 buttons, sliders and a drive, no page errors.

## Gaps

- Nobody here can hear: everything above rests on spectrograms, waveforms and graph read-backs. The owner should listen to the audition page.
- The Escort was recorded with a phone in the cabin, so the loops carry some cabin and road noise; the pulling loops come from three different takes (town, motorway, the full-throttle run), so timbre shifts a little between 2300 and 3500 rpm. The diesel has no loaded loops (standing revs only).
- The 404's loops come from a noisy mix and its pitch tracking wandered (bends up to 18%); kept as an option only.
- Traffic rpm is a guess from speed and acceleration; parked and abandoned cars are silent.
