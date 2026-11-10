# Animals for the animals2 step

Processed GLBs live in `built/animal_{deer,fox,shiba,husky,cat}.glb` (gitignored like every raw asset; rebuild with `build.mjs`, see below). `add_animals2.py` embeds them deflated.

## Quaternius Ultimate Animated Animals (deer, fox, shiba, husky)

- Pack: https://quaternius.com/packs/ultimateanimatedanimals.html (Quaternius). Treated as **Quaternius Asset License v1.0 ("QAL v1.0")** per the orchestrator ruling; the pack page and the bundled License.txt say CC0. No credit required. Raw files must not be redistributed, only embedded in the finished game.
- Got the glTF files from a GitHub copy of the pack (`xxfrigorizxx/The-Legacy-Of-Seroka`, `_tmp_quaternius_animals/glTF/`) because the pack's Google Drive folder returned "quota exceeded" on 2026-11-09. Same files as the Drive `glTF` folder (names, clip lists, 13 clips each).
- Files in `quaternius-ultimate-animated-animals/`: Deer.gltf, Fox.gltf, ShibaInu.gltf, Husky.gltf (+ Stag.gltf, unused) and License.txt. All 5 materials per animal are flat colours, no textures.
- Clips used: Idle, Walk, Gallop, Attack (bark, dogs and fox), Eating (deer), Death.

## Quaternius Animal Pack Vol.2 (cat)

- URL: https://opengameart.org/content/animated-animales-low-poly (Animal Pack Vol.2 by @Quaternius.zip, FBX), CC0 on the page, QAL v1.0 per the same ruling. No credit required.
- Only FBX has the animation; converted to GLB with three.js `FBXLoader` + `GLTFExporter` in a headless page (no Blender or FBX2glTF on this machine). Clips: Idle, Walking. No run clip, so the cat runs with its walk sped up.

## Not used

- `polyfork-dog-base/dog-base.glb` (CC-BY 4.0, Idle/Walk/Run) and `khronos-fox/Fox.glb` (CC-BY 4.0, Survey/Walk/Run): the Quaternius models cover the same species with more clips, no credit line, and a smaller download, so no CC-BY credit enters the game.
- Hare, hedgehog, bats, birds: no licensed animated model found (Quaternius animal packs have none); they keep the instanced rig.

## Processing (`build.mjs`, gltf-transform + meshoptimizer)

Keep the clips listed above (renamed idle/walk/run/eat/bark/death), drop scale channels and the translation of every joint but the two top ones, bake each material colour into COLOR_0 and merge to one material (one draw call per animal), strip UVs, weld, resample, quantize, meshopt. 807 to 2,098 triangles per animal. Source rig sizes are kept; the game scales them to real height at runtime.

    node build.mjs <node_modules with @gltf-transform/{core,extensions,functions} + meshoptimizer> <outdir> "deer=<src>=idle:Idle,walk:Walk,run:Gallop,eat:Eating,death:Death" ...
