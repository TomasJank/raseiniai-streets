# Recorded animal sounds

Owner complaint: the dog does not bark, it makes weird sounds. The synthesised bark (band-passed noise plus a sawtooth) read as noise. The step `sounds` replaces every synthesised animal call with a short recorded clip.

## What was added (no existing file touched)

- `pipeline/sounds.js`, `pipeline/add_sounds.py`: append `add_sounds.py` at the end of `build.sh` (integrator). Needs voice (renames its `sfxAnimal`) and animals (patches the one call site).
- `research/assets/sounds/`: `SOURCE.md` (URL, author, licence, sha256 per clip), `cut.sh` (recipe: trim, mono, 24 kHz, normalise to -2 dB, Opus 32 kbit/s), and the 11 `.ogg` clips (gitignored).
- `work/test_sounds.mjs`.

## How it works

`add_sounds.py` does three anchored replacements, each `assert count == 1` in the full build:
1. `function sfxAnimal(kind,x,z,o={}){const S=SFX_ANIMAL[kind];` becomes `sfxAnimal_0`, the untouched synth, kept as fallback.
2. `sfxAnimal(q.kind,a.x,a.z)` in animals.js's `animSound` gets a fourth argument `{sp:a.name}`, so the species reaches the sound. animals2's `animSound` wrapper still calls the original, so the bark clip animation is unchanged.
3. `sounds.js` is spliced before `function updateBells(){`; the clips go in `<script type="application/json" id="rasAnim">`.

The new `sfxAnimal` decodes the clips once through `AC` on its first call (`SND_ANIM.ready`). Until then, or when a clip failed to decode, it calls `sfxAnimal_0`. Otherwise it uses the game's own `soundAt(x,z,60,vol)` (gain node, StereoPanner, distance attenuation, master bus), then starts `AudioBufferSource`s at playback rate x (1 +- 15%). The return value is the duration in seconds, as before.

- Dogs: `dog_lead`, `dog_lead_small`, fox use `bark_small` (fox at +20% rate); `dog_lead_big` uses `bark_big`; `dog_yard` and anything else use `bark_med`. Yard dogs bark 2 to 4 times, others 1 or 2, with 0.12 to 0.22 s gaps and 10% rate drift per bark after the first.
- Flap plays the clip 3 times 0.15 s apart at x1.3 (a flurry). Meow, caw, coo, hoot, snort, snuffle, squeak play once. Volumes: bark .7/.8/1, meow .6, caw .6, coo .5, hoot .6, snort .7, snuffle .3, squeak .2, flap .4.

## Clips and licences

See `research/assets/sounds/SOURCE.md`. All CC0 (OpenGameArt) or Public domain (Wikimedia Commons). Total 31 KB raw, 41 KB embedded (budget 150 KB).

| clip | source | licence |
|---|---|---|
| bark_med, bark_small | OGA "Dog barking mono" (Brandon Morris), pitched | CC0 |
| bark_big | OGA same author, long take | CC0 |
| meow | OGA "Meow" (dino1489) | CC0 |
| caw | OGA "Crow caw" (Snabisch) | CC0 |
| coo, hoot | Commons "Dove cooing.ogg" (mary905), hoot pitched down | Public domain |
| snort | OGA "80 CC0 creature SFX", nose.ogg | CC0 |
| snuffle | OGA "Hedgehog examples" (felischaus) | CC0 |
| squeak | OGA "Bat screeches" (polymorpheva) | CC0 |
| flap | OGA "Large wings flap" (michaelvanham) | CC0 |

## Gaps

- No licensable owl hoot found: the owl is the dove coo pitched down. The deer snort is a creature-pack "nose" clip.
- No audio output here, so clip choice rested on waveforms and spectrograms. Listen once, especially to bark_big (cut from a noisy take) and hoot.
- Pixabay answered 403 to scripted fetches and freesound downloads need a login, so neither was used.

## Tests

See the final message for the output. `work/test_sounds.mjs` checks the block (11 clips, <= 150 KB), decoded durations > 0, node types per kind (BufferSource from the clip buffers, zero oscillators, one panner and one gain, panner into `snd.master`), species to variant, 2 to 4 yard bursts, rate within +-15%, silence beyond 60 m, `animSound` routing, synth fallback with a missing buffer, no console errors.
