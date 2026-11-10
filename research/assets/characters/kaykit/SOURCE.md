# KayKit Character Animations: source of the kick

| | |
|---|---|
| Pack | KayKit : Character Animations 1.1 (Free), Kay Lousberg |
| Page | https://kaylousberg.itch.io/kaykit-character-animations (author's page; linked from https://kaylousberg.com/game-assets/character-animations) |
| Licence | CC0 1.0 (`License.txt` in the zip, and the itch page: "Creative Commons Zero v1.0 Universal"). Credit is optional: "Kay Lousberg, www.kaylousberg.com" |
| Downloaded | 2026-11-09 through the itch.io free-download flow (download_url, then file/15799903) |
| Zip sha256 | `65882f31f905ad2e953819648a59287cdeab8f623908d5ef701971d3758be20f` (14,858,957 bytes) |
| File used | `KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/Rig_Medium_CombatMelee.glb`, clip `Melee_Unarmed_Attack_Kick` |
| File sha256 | `c55e6ec1c79e83ae21d46fe1cd921c1b64be8b9a524a24517e51c6ba99231459` (byte-identical to the GitHub mirror used by the wave-3 retarget prototype) |

`Rig_Medium_CombatMelee.glb` here is the local build input and `../clips_kick.glb` the output of `../build_kick.mjs`; both stay out of git
(`*.glb` is ignored), as does the zip. Only this file, `License.txt` and the script are tracked.
Rebuild: `node ../build_kick.mjs <node_modules with three@0.187, @gltf-transform/*, meshoptimizer> Rig_Medium_CombatMelee.glb ../body_m.glb ..`
