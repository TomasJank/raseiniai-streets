# Asset catalogue (2026-11-09)

Scope: everything except characters and facade textures. Downloads limited to licences verified on the source page. Downloaded total: 1.5 MB (2 GLBs), well under the 300 MB cap.

Legend: fit = good / ok / poor for the stylised low-poly style. "flagged" = not downloaded, reason given.

## Animals

| name | source URL | licence | format | polys/size | animated? | fit | downloaded path or flagged reason | recommended use |
|---|---|---|---|---|---|---|---|---|
| Dog (Polyfork dog-base) | https://polyfork.dev/asset/dog-base | CC BY 4.0 (user's choice of two; alternative Polyfork licence) | GLB | 2,204 tris, 1.4 MB | Walk, Idle, Run | good | research/assets/animals/polyfork-dog-base/dog-base.glb | Dog, near and far LOD. Credit required. |
| Fox (Khronos Fox) | https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox | CC-BY 4.0 (rigging, conversion); base model credited to PixelMannen | GLB | 0.16 MB, one mesh | Survey, Walk, Run | ok (more realistic than stylised) | research/assets/animals/khronos-fox/Fox.glb | Fox. Credit required. |
| Animals pack, Quaternius "Ultimate Animated Animal Pack" (12 animals) | https://quaternius.com/packs/ultimateanimatedanimals.html | pack page says CC0; Quaternius licence page says QAL v1.0 (conflict) | FBX, OBJ, Blend, glTF | not stated | yes (Attack, Death, Kicks, Gallops, Walk, Jump, 12+ each) | good | flagged: licence conflict (CC0 on pack page vs QAL v1.0 on licence page; QAL forbids redistributing the assets) | Best source for cat/deer/fox/hare/hedgehog-like animals if the licence is confirmed in writing. |
| Quaternius "Farm Animal Pack" | https://quaternius.com/packs/farmanimal.html | same licence conflict as above | not verified | not verified | yes | ok | flagged: licence conflict | Only if the licence resolves to CC0. |
| Quaternius "Animated Cute Fish Pack" / "Animated Fish Pack" | https://quaternius.com/packs/cutefish.html | same licence conflict | not verified | not verified | yes | ok | flagged: licence conflict | Not needed for this game. |
| Kenney Animal Pack Redux | https://kenney.nl/assets/animal-pack-redux | CC0 (page) | not stated on page | not stated | not stated | ok (flat / low-poly toy style) | flagged: kenney.nl returns 403 to scripted clients, download not done; check files manually | Strong candidate for cat, pigeon-like shapes if the format and animation status check out. |
| Stork, Parrot, Flamingo (three.js examples) | https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf | no licence in GLB metadata; not found on the source | GLB | 77 to 97 KB | yes (1 clip each: storkFly_B_, parrot_A_, flamingo_flyA_) | good | flagged: no licence found; downloaded then deleted per policy | Stork, parrot, flamingo as silhouettes only after the licence is confirmed with three.js maintainers. |
| Bat, owl, hare, hedgehog, deer | none verified | none | none | none | none | none | flagged: not found in any verified CC0/MIT pack during this run | Hare and deer: check Kenney Animal Pack Redux manually. Bat and owl: gap. |

## Vehicles

| name | source URL | licence | format | polys/size | animated? | fit | downloaded path or flagged reason | recommended use |
|---|---|---|---|---|---|---|---|---|
| Kenney Car Kit | https://kenney.nl/assets/car-kit | CC0 (page) | not stated on page; wheel separation not stated | 45 files on page; poly count not stated | no | good (chunky low-poly, matches style) | flagged: kenney.nl returns 403 to scripted clients; download not done | Use the sedan/estate/van GLB shapes to replace only where the procedural cars look weak. Per the strategic review, procedural cars are kept. |
| Quaternius "Cars Pack" | https://quaternius.com/packs/cars.html | licence conflict (see above) | not verified | not verified | no | ok | flagged: licence conflict | Not used. |
| ferrari.glb (three.js) | https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/ferrari.glb | no licence found | GLB, 51 meshes, Draco | 1.7 MB | no | poor (realistic car) | flagged: no licence found; downloaded then deleted | Not used. |
| Bus, van, truck, European sedan | none verified | none | none | none | none | none | flagged: no CC0 candidate found in this run | Gap. Recommend the procedural approach stays. |

## Props & street furniture

| name | source URL | licence | format | polys/size | animated? | fit | downloaded path or flagged reason | recommended use |
|---|---|---|---|---|---|---|---|---|
| Kenney City Kit (Suburban / Commercial / Roads / Industrial) | https://kenney.nl/assets/city-kit-suburban (and siblings) | CC0 (per Kenney site) | not verified | not verified | no | good | flagged: kenney.nl 403 to scripted clients | Benches, lamps, bins, fences, bus stop, signs. Check each pack page manually. |
| Kenney Nature Kit | https://kenney.nl/assets/nature-kit | CC0 (per Kenney site) | not verified | not verified | no | good | flagged: kenney.nl 403 | Vegetation and small props. |
| Quaternius "Downtown City MegaKit", "Simple Buildings Pack", "Public Transport Pack", "Modular Streets Pack", "Furniture Pack" | https://quaternius.com/packs/ (index) | QAL v1.0 on licence page (conflict) | FBX/OBJ/Blend/glTF | not verified | no | ok | flagged: licence conflict | Not used. |
| Quaternius "Public Transport Pack" | https://quaternius.com/packs/publictransport.html | licence conflict | not verified | not verified | no | ok | flagged: licence conflict | Not used. |
| Bicycles, playground, bus stop | none verified | none | none | none | none | none | flagged: not found as CC0 in this run | Gap. |

## Vegetation

| name | source URL | licence | format | polys/size | animated? | fit | downloaded path or flagged reason | recommended use |
|---|---|---|---|---|---|---|---|---|
| Kenney Nature Kit | https://kenney.nl/assets/nature-kit | CC0 (per site) | not verified | not verified | no | good | flagged: 403 | Trees and bushes. |
| Quaternius "Stylized Nature MegaKit" / "Stylized Tree Pack" / "Simple Nature Pack" | https://quaternius.com/packs/stylizednaturemegakit.html | licence conflict | not verified | not verified | no | good | flagged: licence conflict | Not used. |

## Sounds

| name | source URL | licence | format | size/duration | fit | downloaded path or flagged reason | recommended use |
|---|---|---|---|---|---|---|---|
| Kenney Interface Sounds | https://kenney.nl/assets/interface-sounds | CC0 1.0 (confirmed on kenney.nl listing) | not stated; 100 files | not stated | ok (UI only) | flagged: not downloaded (kenney.nl 403) | UI clicks only. |
| Kenney Impact Sounds | https://kenney.nl (official page not found in search) | CC0 per third-party listings only | not verified | not verified | good for punches/crashes | flagged: official licence not verified | Check the official page before use. |
| Freesound clips (tyre squeal, crash, engine) | https://freesound.org/s/71741 , /s/690197 , /people/audible-edge/sounds/76806 , /s/237375 | not confirmed on pages; one squeal is CC-BY 3.0 on OpenGameArt | ogg/wav | not verified | ok | flagged: no clip confirmed CC0 | Run a manual CC0 filter on freesound.org advanced search; check each sound page licence. |
| OpenGameArt "car tire squeal skid loop" | https://opengameart.org/content/car-tire-squeal-skid-loop | CC-BY 3.0 | not verified | not verified | ok | flagged: attribution licence, not downloaded | Usable with credit only if the team accepts CC-BY. |

## three.js examples models (relevant)

| name | source URL | licence | format | animated? | fit | status | recommended use |
|---|---|---|---|---|---|---|---|
| Xbot.glb | https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Xbot.glb | Mixamo-derived (see section 7) | GLB, 2.9 MB | yes | good for retarget demos | flagged: not downloaded, character category | Retarget reference only. |
| Soldier.glb | https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Soldier.glb | Mixamo-derived | GLB, 2.2 MB | yes | ok | flagged: not downloaded, character category | Reference only. |
| Horse.glb | https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Horse.glb | not verified | GLB, 182 KB | yes | ok | flagged: no licence | Not used. |
| BrainStem (Khronos) | https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/BrainStem | Poser EULA | GLB | yes | poor | flagged: licence (Poser EULA), not usable | Not used. |
| CesiumMan (Khronos) | https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMan | CC-BY 4.0 (plus Cesium logo trademark) | GLB | yes | ok | flagged: human character, character category; logo trademark | Not used here. |

## Animations and characters: sourcing terms (summary, see license-report.md)

- Mixamo: animation and character use in games is allowed under the Adobe FAQ (verified via search snippet, not the live page). Raw FBX redistribution is not. Not downloaded. Treat as the fallback for missing clips.
- Ready Player Me: avatars are under restrictive terms (docs cite CC BY-NC-SA 4.0 for website-made avatars; commercial use needs developer/partner status). Not usable for this game without partner terms.

## Totals

- Downloaded: 2 assets (dog, fox), 1.5 MB.
- Flagged: every other row in the tables above, each with its reason.
