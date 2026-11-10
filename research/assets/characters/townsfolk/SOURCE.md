# Townsfolk: sources and licences

Raw files here (`*.glb`, gitignored like every GLB under `research/assets/`) are the Quaternius **Ultimate Modular Men** and **Ultimate Modular Women** packs,
downloaded 2026-11-10 from their Poly Pizza bundles (single-model GLB links on static.poly.pizza; Poly Pizza marks each model Public Domain / CC0, the Quaternius
pack pages say CC0). Treated as **Quaternius Asset License v1.0** like the other Quaternius packs (see `../SOURCE.md`): embedding in the built game HTML is allowed,
the raw or processed files are not redistributed, so they stay out of git.

| Pack | Page | Models downloaded |
|---|---|---|
| Ultimate Modular Men Pack | https://poly.pizza/bundle/Ultimate-Modular-Men-Pack-ZiH8muWqwQ (https://quaternius.com/packs/ultimatemodularmen.html) | Adventurer, Astronaut, Beach Character, Farmer, Punk, SWAT, Hoodie Character, King, Business Man, Casual Character, Worker (11) |
| Ultimate Modular Women Pack | https://poly.pizza/bundle/Ultimate-Modular-Women-Pack-aCBDXDdTNN (https://quaternius.com/packs/ultimatemodularwomen.html) | Adventurer, Animated Woman x2, Hooded Adventurer, Punk, Sci-Fi Character, Soldier, Suit, Witch, Worker (10) |

File names are `Men_<model>_<poly.pizza id>.glb` / `Women_<model>_<id>.glb`. Used (everyday outfits only): men Casual, Hoodie, Business Man, Farmer, Beach, Worker;
women Animated Woman (dress), Animated Woman (tee and trousers), Suit, Worker, Adventurer. Not used: armour, sci-fi, fantasy and costume models, the 10k-tri Adventurer (men), the mohawks.

Rig facts the build relies on (checked on all 21 files): every character of one gender has the same 62-bone armature in the same T-pose, and that T-pose matches the
UAL mannequin's (arms along +-x, legs straight down, toes +z), so the UAL clips apply after a bone rename plus the character's own joint positions.

Built by `../build_townsfolk.mjs` into `../clothes_body_m.glb` and `../clothes_body_f.glb` (gitignored): see the header of that script.
Rebuild: `node ../build_townsfolk.mjs <node_modules with three@0.187, @gltf-transform/*, meshoptimizer> . ../body_m.glb ..`
