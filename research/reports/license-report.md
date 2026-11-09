# Licence report (2026-11-09)

## Downloaded and usable

| asset | path | licence | attribution text | redistribution allowed | notes |
|---|---|---|---|---|---|
| Dog (Polyfork dog-base) | research/assets/animals/polyfork-dog-base/dog-base.glb | CC BY 4.0 (chosen from "CC-BY-4.0 OR LicenseRef-Polyfork") | Dog by Polyfork (https://polyfork.dev/asset/dog-base), CC BY 4.0 | yes, with credit and a note of changes | Polyfork .mjs modules are under the Polyfork licence only: do not use them. The Polyfork licence bars redistributing the files as assets; CC BY option is the one to rely on. |
| Fox (Khronos glTF-Sample-Assets) | research/assets/animals/khronos-fox/Fox.glb | CC-BY 4.0 (rigging, conversion); base model by PixelMannen | Fox by PixelMannen (https://opengameart.org/content/fox-and-shiba), rigging by tomkranis, glTF conversion by AsoboStudio and scurest, CC BY 4.0 | yes, with credit | The README also lists a CC0 line for the 2014 base model. Credit is kept because CC-BY applies to the composite. |

## Verbatim licence text (Polyfork)

From https://polyfork.dev/asset/dog-base (LICENCE_TXT on the page):

> THE MESH FILES (.glb, .fbx, .usdz, .usda, .obj, .mtl) are yours under either licence, your choice:
> 1. CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ Use, share, modify, re-upload and sell them, commercially too, as long as you credit Polyfork and say if you changed them. The credit line: Dog by Polyfork (https://polyfork.dev/asset/dog-base), CC BY 4.0
> 2. The Polyfork licence: no credit needed, but no redistributing the files.
> EVERYTHING ELSE here, the ES modules (.mjs) above all, is under the Polyfork licence only. CC BY does not cover it.
> The Polyfork licence: Use these files in personal and commercial projects: games, apps, websites, client work, products you sell. Modify freely. No attribution required. Do not resell or redistribute the files themselves as assets, or use them to build or train a COMMERCIAL 3D asset generator... Full terms: https://polyfork.dev/licensing

## Recommended but not downloaded (licence confirmed)

| asset | licence | attribution | notes |
|---|---|---|---|
| Kenney Car Kit, City Kit, Nature Kit, Animal Pack Redux, Interface Sounds | CC0 1.0 (per kenney.nl pages) | none required (optional credit "Kenney") | Download manually: the site blocks scripted requests. |
| Quaternius Ultimate Animated Animal Pack | conflicting: CC0 on pack page, QAL v1.0 on the licence page | depends | Not usable until the licence is confirmed in writing. |

## Flagged (not downloaded)

| asset | reason |
|---|---|
| Quaternius packs (all) | Licence page says QAL v1.0: no redistribution of the assets; pack pages say CC0. Conflict. Ask Quaternius. |
| three.js Stork, Parrot, Flamingo, Ferrari, Horse | No licence in GLB metadata or on the source page. Downloaded then deleted. |
| Khronos BrainStem | Poser EULA. |
| Khronos CesiumMan | CC-BY 4.0 but a human character (character category) and carries the Cesium logo trademark. |
| Freesound clips | No clip confirmed CC0. |
| OpenGameArt tyre squeal loop | CC-BY 3.0: usable with credit if accepted. |
| Mixamo | See below. Not downloaded. |
| Ready Player Me | See below. Not downloaded. |

## Mixamo (terms summary, not downloaded)

The Mixamo page loads only a placeholder for this client, so the Adobe FAQ text is taken from the search snippet of the official FAQ and community posts that quote it. Games are listed as permitted uses for both characters and animations. The restriction is on distributing the raw FBX or character files, and on selling only the characters or animation data. Whether in-app cosmetic skins or re-rigged characters on Patreon are allowed is not answered by the sources. Embedding converted GLBs inside the game: the FAQ allows use in games. Converted GLBs shipped as downloadable assets are the grey zone. A web game serving GLB files to every visitor should be treated as distributing the raw files, so the answer is not clear-cut. Confirm with Adobe. Source: https://helpx.adobe.com (Mixamo FAQ) and the Adobe Community thread https://community.adobe.com/t5/mixamo-discussions/mixamo-faq-licensing-royalties-ownership-eula-and-tos/td-p/13234775 .

## Ready Player Me (terms summary, not downloaded)

The docs and end-user terms disagree. Docs at https://docs.readyplayer.me/ready-player-me/support/terms-of-use say avatars made in the Avatar Creator are under a Creative Commons licence that covers non-commercial use (one version names CC BY-NC-SA 4.0 and asks for credit). The end-user terms say the avatar is for personal, non-commercial use. Commercial apps or games need developer or partner status to use the avatars. Embedding converted GLBs inside this game: not allowed under the non-commercial terms, and the game is not a partner app. Treat as no. Confirm with Ready Player Me. The primary URL readyplayer.me did not resolve from this environment.

## CREDITS (paste into the game)

```
Dog by Polyfork (https://polyfork.dev/asset/dog-base), CC BY 4.0 (state here if the model is modified).
Fox by PixelMannen (https://opengameart.org/content/fox-and-shiba), rigging by tomkranis (https://sketchfab.com/3d-models/low-poly-fox-by-pixelmannen-animated-371dea88d7e04a76af5763f2a36866bc), glTF conversion by AsoboStudio and scurest (https://github.com/KhronosGroup/glTF-Sample-Models/pull/150), CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Source: KhronosGroup glTF-Sample-Assets.
```

## Orchestrator addendum (2026-11-09 17:20): Quaternius licence resolved
Read directly from https://quaternius.com/license.html: **Quaternius Asset License v1.0** (last updated 2026-08-28). Grant: "Use, copy, and modify the Assets", "Incorporate the Assets (in original or modified form) into a Product", "No attribution is required". Restriction 3(a): no redistribution "as a standalone asset, asset pack, stock file, template, or similar product", but "It does not restrict distributing a completed Product that merely incorporates the Assets".
Verdict: Quaternius packs may be embedded in the built game HTML (a Product). Raw files stay out of git (`.gitignore` now excludes binaries under `research/assets/`). Record "QAL v1.0" in each SOURCE.md. The earlier "conflict" flag is withdrawn; the catalogue's Quaternius rows are usable.
Kenney: CC0, but kenney.nl refuses scripted downloads; download by hand or from Kenney's itch.io page.
