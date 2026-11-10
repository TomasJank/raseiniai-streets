# Animal sounds for the sounds step

Embedded by `pipeline/add_sounds.py` as `rasAnim`: 11 mono 24 kHz Opus clips (32 kbit/s, peak-normalised to -2 dB), 31 KB raw, 41 KB base64 in the page. The `.ogg` clips and the raw downloads are gitignored like every raw asset; `cut.sh RAW_DIR` rebuilds the clips from the downloads below (unzipped into RAW_DIR, files keep their names). All sources were checked on 2026-11-10: every file downloads without login and the page licence list shows CC0 (OpenGameArt) or Public domain (Wikimedia Commons). No attribution is required for any of them. Nothing CC-BY, CC-BY-NC or unclear is used. Pixabay (403 to scripted fetch) and freesound (download needs login) were not used.

| clip | used by | source file, URL | author | licence | sha256 of the download |
|---|---|---|---|---|---|
| bark_med (bark 2 of the file, 0.5 to 0.76 s) | yard dogs, default bark | `dog_barking_mono.wav`, https://opengameart.org/content/dog-barking-mono | Brandon Morris | CC0 (page also lists OGA-BY 3.0; CC0 taken) | bbd0f908b3514dd3bd7d2bc04dcf64f8d360a161e7f43cac5d6761e7add79451 |
| bark_small (bark 4 of the same file, +35% pitch) | shiba, fox (+20% rate in code) | same file | same | same | same |
| bark_big (bark at 4.4 s of `dog_barking.wav`, lowpass 3.2 kHz, -15% pitch) | husky (`dog_lead_big`) | `dog_barking.wav` from the same page | same | same | 94b9180914ce6142599562e47a58b224c4ac81575056752df5fd48fb0e570701 |
| meow | cat | `Meow.ogg`, https://opengameart.org/content/meow | dino1489 | CC0 | ae35c578eb7e7bc33d1dc7b2532cf4cdc8dac27f8cf28c6d574fb3027be83d5f |
| caw | jackdaw/crow | `crow_caw.wav`, https://opengameart.org/content/crow-caw | Snabisch | CC0 | bba22883209b435905471d057160f1badae59b89a62e9a8b3199d7e327b17339 |
| coo | pigeon | `Dove_cooing.ogg`, https://commons.wikimedia.org/wiki/File:Dove_cooing.ogg | mary905 | Public domain | 84d92584f22b0655f78fe59aaff026e792300c4e63d45a69d48c907400bacc23 |
| hoot | owl | **same Dove_cooing.ogg**, a later phrase pitched down 32% and lowpassed at 1.8 kHz | mary905 | Public domain | same |
| snort | deer | `nose.ogg` in `80-CC0-creature-SFX_0.zip`, https://opengameart.org/content/80-cc0-creature-sfx | see the page (author not recorded here) | CC0 | zip 5d4002eea42f278e76543bb36e8ddd2cb978588a13271984191d8228f5d26768; nose.ogg c54f2937d705bda30a9618531d62752356ba9e1cae258687131e1582b36e53ce |
| snuffle | hedgehog | `ex1.mp3` in `felischaus_hedgehogexamples.zip`, https://opengameart.org/content/hedgehog-examples | felischaus | CC0 | zip c02c13cf105e64b99cff5a66ef07125abba25b6963ed69df3046771070f4ea05; ex1.mp3 c19b9813b2722f3078fdc205e23d3fb85ff8fc6ef84e86172334b4c03ecaed9c |
| squeak | bat | `bat_01.ogg` in `bat.zip`, https://opengameart.org/content/bat-screeches (README credits polymorpheva, freesound.org/s/104205) | polymorpheva | CC0 | zip 8a41cfeca5a3b184f4cf171d45faf0041715b6f9d402dcfe04c53369c05e0ab3; bat_01.ogg 46c05d9a33cd4b2e5514d25473066503b2fad4ea55eb5f76e43c010cba56ba7a |
| flap | stork, ravens, any bird | `wings_flap_large.ogg`, https://opengameart.org/content/large-wings-flap | michaelvanham | CC0 | 060d1e2b9403893c4aaff7148ea604c4bcfc6bf3e7bab44913a56429ff261a9c |

## Honest gaps

- No CC0 / public-domain owl hoot was found (OpenGameArt has none; the Wikimedia owl recordings are CC-BY-SA, so unusable). The owl is a PD dove coo pitched down. If a real tawny owl under CC0 turns up, replace the `hoot` line in `cut.sh`.
- No deer snort was found. The "nose" clip from the CC0 creature pack stands in; the pitch-down boar grunt (`boar_0.ogg`, https://opengameart.org/content/boar-0, CC0) is the alternative.
- Dog variants are one real small-room bark cut from one recording, pitched for small and big, plus one bark from the noisier long take for the big dog. There is no audio output on this machine, so the clips were chosen from their waveforms and spectrograms, not by ear: a listen to each is still worth doing.
- Ogg Opus decodes in Chrome, Firefox and Safari 18.4+; where `decodeAudioData` fails the clip is skipped and the synth plays.
