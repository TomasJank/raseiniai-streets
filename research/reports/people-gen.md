# people-gen: 36 townsfolk, 2026-11-13

## What changed
I took over from an earlier agent that had been stopped. It had already rewritten most of `research/mh/scripts/sheet.py` (licence filter, wardrobe and hair allow-lists, sex-aware faces, a face zone that is spared from decimation, the hidden-skin rule, credits, `pages.py`, the `pal` measurement in `web/review.html`). None of it had been checked, so I ran it, looked at the output and fixed what was still wrong:

- **Textures were never shrunk, dyed or toned (bug).** The exporter took each texture from its alpha node, which still held the untouched original, so the GLBs shipped full-size originals. This undid the 256/512 px caps, the hair colours, the garment dyes and the skin-tone gain. The cause: a textured cloth ran 350 KB and up, and the old 18 people had the same fault. Now every image node that shows the texture gets the edited copy, and every texture is rewritten before export.
- **Meshopt compression.** Each GLB goes through `npx gltfpack@0.25.0 -cc -km -kn` straight after export. One skin, the 53 bone names and the material names stay; gltfpack drops the mesh node names. The game keys on `o.name + material.name`, and the material names carry the labels, so nothing is lost. `review.html` already had the Meshopt decoder.
- **afro01 dropped.** In every colour it read as tin foil or straw, and it was on four old people.
- **short03** (covers one eye) is now for teen boys and women only. It looked wrong on the worker.
- **Grey and white hair** keeps half its texture's contrast, so the dark strands no longer break it up.
- **One command:** `scripts/export.sh`.

## Fault list from the 18-person review: where each stands
1. Shredded hair and bald patches: no hair is decimated except `short01`/`short02` (0.5), `long01`/`elvs_hazel_hair`/`elvs_keylth_hair`/`elvs_lady_hippy_hair`/`elvs_short_daisy_hair` (0.5), `braid01` (0.4), `elvs_daisy_hair` (0.4) and `elvs_braid_bun` (0.15). The allow-list `HAIR` in `sheet.py` is per sex and age band. The test sheets for the allow-list are in `research/mh/out/allowlist/` (made by the earlier agent). No shredded hair is left in the 36.
2. Crumpled faces: the front of the head is a vertex group that keeps half its triangles, and the body and clothes pay for it. I see no crumpled mouths or noses in the 36 face shots.
3. Women's faces: head shapes, jaw, chin, nose and brow ranges are drawn per sex (`face()`, `SOFT`/`HARD`). All 18 women and girls read as female in the face shots.
4. Long bob on men: `elvs_short_side_do` is gone from every pool (98,660 triangles).
5. Eyes: the mesh and material are named **`eyeball`**. Brown irises are no longer drawn at all; eye colours are blue, grey, green, bluegreen, lightblue and ice. `review.html` leaves `/eye/` out of the brightening, like `mhchars.js`.
6. Glasses: dropped from the wardrobe.
7. Collar and seam holes: the garments' own delete-skin lists are no longer used. Skin is hidden only where ray tests say no one can see it. I see no holes in the 36 sheets.
8. `janexx_old_female_sweater`, `male_casualsuit03`, `elvs_male_shirt_untucked_bd1`, `mindfront_male_trousers_2` and the gaping tops are out. Warm tops never go with short bottoms, and skirts get flat shoes.
9. Licences: an asset is worn only if its `.mhclo` (or its material) says CC0 or CC BY and names an author. AGPL is refused. The four AGPL assets and the unlicensed ones never appear. Each JSON carries `credits`.

## Measured
- 36 people: 3 girls, 10 women, 5 old women, 3 boys, 10 men, 5 old men. Curvy: crowd_03, 04, 07. Buff: crowd_21, 25. No outfit (top + bottom, or a one-piece) is worn twice. Single garments are worn at most three times, and dyed ones get a different colour each time.
- Triangles per person: 11,245 to 13,962, mean 11,858 (`tris` in each JSON).
- Size on disk: 36 crowd GLBs = 6,353,696 bytes (136 to 214 KB each). The player `glb_player/marozas_00.glb` = 926,324 bytes, unchanged. Total **7.28 MB**, against the 9 MB budget.
- Repeatable: two full runs gave byte-identical GLBs and JSONs, including `pal`.
- The JSON has every contract field: `file sex age band desc height pal skirt bare_legs long_hair hat tint credits`. It also has `wear dye hair hair_colour tris`. `pal` is measured from the viewer's render.

## Regenerate
```
sh research/mh/scripts/export.sh
```
This runs `blender -b --python scripts/sheet.py -- crowd x.png export=glb`, then serves `research/mh` on port 8818 and runs `node web/review.mjs 8818 out/review glb pal` and `python3 scripts/pages.py out/review glb out/review/page 6 2`. It needs `npx` (for gltfpack) and Playwright at career-ops/.

Review sheets: `research/mh/out/review/page0.jpg` … `page5.jpg` (front, back and face for each person), plus the single shots. The old 18-person fault sheets are in `out/review/before18/`. `out/review/player_check.jpg` shows the player loading unchanged.

## Still wrong (seen on the sheets)
- crowd_12: `elvs_keylth_hair` has a few dark specks on the crown (card edges).
- crowd_05 and crowd_15: the `elvs_braid_bun` hairline is slightly ragged. It is decimated to 0.15 because the full style is heavy.
- crowd_21: a few white specks at the front hem of the t-shirt (from its texture).
- crowd_27 and crowd_30 (fedoras) have no hair under the hat, so the back of the head shows bald below the brim.
- crowd_00 and crowd_14 (`bob02`) and crowd_09 (`short03`) have a fringe over one eye. The style is drawn that way.
- Old men have only three hair styles (`short01`, `short02`, `short04`) or bald, now that afro01 is gone. That is the weakest spot for variety.
- I checked faces at review-shot size, not in the game at street distance.
- Player: not re-exported. If someone re-exports it with the current script, its textures will change (skin tone and caps now really apply), so check it if that happens.

## Credits (CC BY assets actually worn by the 36)
Everything else worn is CC0 (MakeHuman team, MRT/toigo, Cortu Johnstone, Joel Palmius, Namuhekam, AEthelraed_Unraed).

> Characters made with MakeHuman / MPFB (CC0). Clothing and hair: Elvaerwyn (CC BY): elvs_50s_updo, elvs_braid_bun, elvs_daisy_hair, elvs_hazel_hair, elvs_keylth_hair, elvs_lady_hippy_hair, elvs_maxwell_hair, elvs_short_daisy_hair, elvs_wavy_bob, elvs_disco_pants_skinny, elvs_flatshoe_bow1/buckle_1/gemmed1/plain1/pointy1, elvs_hooded_sweat_jacket1, elvs_jeans_bootcut, elvs_jeans_straight_leg, elvs_male_trouser; culturalibre (CC BY): culturalibre_sneakers; punkduck (CC BY 3.0): punkduck_comfortable_sneakers, punkduck_cycling_shoes, punkduck_female_tight_jeans, punkduck_running_shoes_01, punkduck_tennis_shoes; punkduck (CC BY 4.0): punkduck_male_classic_jeans; Mindfront (Sweden) (CC BY 4.0): mindfront_knitted_sweater_01, mindfront_knitted_sweater_02, mindfront_lusekofta, mindfront_male_trousers_1, mindfront_shoes_monk_strap_male, mindfront_shoes_oxford_male.

The Elvaerwyn and culturalibre files say only "CC_by"/"CC-BY" with no version.
