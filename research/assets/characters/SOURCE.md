# Characters: sources and licences

All three GLBs here are built by `build.mjs` from two Quaternius packs downloaded 2026-11-09. Nothing else is used.

| Pack | URL | Author | Licence | Downloaded file (sha256) |
|---|---|---|---|---|
| Universal Animation Library (Standard, 2025-03) | https://opengameart.org/content/universal-animation-library (mirror of https://quaternius.com/packs/universalanimationlibrary.html) | Quaternius | zip `License.txt` and OGA page: CC0 1.0. Quaternius site now: **Quaternius Asset License v1.0** (quaternius.com/license.html, 2026-08-28) | `universal_animation_librarystandard.zip` (18ff1a7215f4852b320203e8aaf02a1578b5c8eef9027fbaedfcedc7b85a3ac2) |
| Universal Animation Library 2 (Standard, 2026-01) incl. Female Mannequin | https://opengameart.org/content/universal-animation-library-2 | Quaternius | same as above (zip says CC0 1.0; site says QAL v1.0) | `universal_animation_library_2standard.zip` (ec0e40d6d78fe9aaad59e322f40865a8675c22f0745e291622e54520391a9217) |

Licence handling (orchestrator ruling 2026-11-09): treat both as **QAL v1.0**. Embedding in the built game HTML is allowed
("distributing a completed Product that merely incorporates the Assets"); redistributing the raw or processed files as assets,
including in a public repository, is not. So the `.glb` files in this folder stay out of git (only this file and `build.mjs`
are tracked); `build.mjs` regenerates them from the two zips. No credit is required; the report credits Quaternius anyway.

Also downloaded and **not used**: Ultimate Animated Character Pack (Nov 2019, Quaternius, https://opengameart.org/content/animated-characters-pack,
sha256 0295062cbc72da52ee804f39ac38694901a40458011f9b2638fc7ef13ed509da). Chibi proportions and FBX-only; rejected on style.

## Files

| File | From | Modifications |
|---|---|---|
| `body_m.glb` (55 KB) | UAL2 `Unreal-Godot/UAL2_Standard.glb`, mesh `Mannequin` | animations and UVs removed, both materials folded into one, welded, simplified 13,744 → 4,946 tris (meshoptimizer), quantized, EXT_meshopt_compression |
| `body_f.glb` (55 KB) | UAL2 `Female Mannequin/Unreal-Godot/Mannequin_F.glb` | same, 14,612 → 4,993 tris |
| `clips.glb` (224 KB) | 24 clips from UAL1 `Godot/AnimationLibrary_Godot_Standard.glb` and UAL2 `UAL2_Standard.glb`, on the UAL2 skeleton (no mesh) | renamed (table in `research/reports/characters.md`); UAL1 Rigify `DEF-*` bone names mapped to the UAL2 (UE-style) names, rest poses are identical; finger, scale and non-pelvis translation tracks dropped; resampled; meshopt-compressed |

Rebuild: `npm i @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 meshoptimizer@0.22` in any scratch
directory, unzip both packs, then
`node build.mjs <scratch>/node_modules "<ual1>/Godot/AnimationLibrary_Godot_Standard.glb" "<ual2>/Unreal-Godot/UAL2_Standard.glb" "<ual2>/Female Mannequin/Unreal-Godot/Mannequin_F.glb" .`
