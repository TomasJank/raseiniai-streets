# Buildings and architecture (2026-11-09)

Step name `facades`: `pipeline/add_facades.py` (JS in `pipeline/facades.js`). Run after `streets` (streets set LOOK) and after `voice`. Build: `sh pipeline/build.sh out.html && python3 pipeline/add_facades.py out.html`. No existing file was edited.

## Result in one line
16-style procedural atlas, three new wall styles and two new roof patterns applied to every building without a hand-set look, 6 instanced detail kinds (314 balconies, 750 chimneys, 259 dormers, 4 shop frontages), four landmark meshes (Catholic church tower, Orthodox church domes, culture centre, Maxima XX). 10 extra draw calls, ~49k extra triangles, fps unchanged.

## Atlas (details in research/assets/textures/SOURCE.md)
- Painted on canvas at load, 2048 x 256, zero bytes embedded, no downloads (no licence issue).
- Original ids 0-10 kept and repainted (red clinker brick with per-brick tone, clay pantile, standing-seam steel, bitumen flat roof, window drip sills, stains, tileable tone noise + grain on everything).
- STY keys added: `silicate:11, panel:12, plank:13, corrugated:14, asbestos:15`. No existing key renamed; all 434 LOOK entries resolve (test checks it).
- Shader: the floor shading and night-window glow, which tested `vSty<7.5`, now also cover 11-13; roof tiles 14-15 stay unshaded.
- Style upgrade (`facadeRefine`, hooked on `buildingSpec`'s return): only for buildings whose LOOK has no own `sty`. brick with a light wall -> silicate; block -> panel; wood -> plank; industrial 50% -> corrugated; plaster/old houses and shops 70% get a Lithuanian pastel wall. Hand-set and street looks keep their style; their roofs may change pattern.
- Roofs (`roofSty`, replaces the two inline `rs=` expressions): red/brown -> clay tile; industrial, shop and half the sheds -> corrugated steel; other houses 55% asbestos, 45% standing seam.

## Details (one InstancedMesh each)
| kind | rule | count | tris each |
|------|------|-------|-----------|
| fx_balc | 4+ floors, single-part, not already a town.js loggia block, apartments/dormitory; 2 longest walls (second wall 50%), every other bay, floors 2 up, skipped where a neighbour is within 1.6 m | 314 | 60 |
| fx_chim | pitched 4-corner house <= 6.5 m with no LiDAR chimney, 75%, on the ridge | 750 | 72 |
| fx_dormB + fx_dormR | pitched houses with rise >= 1.8 m, 35%, one or both slopes; roof mesh takes the house roof colour | 259 | 60 + 14 |
| fx_shop + fx_fascia | shop/amenity/retail buildings: ground-floor glass band + coloured fascia on the wall nearest a road; band glows at night | 4 | 72 / 12 |
Sills and lintels skipped (the atlas draws them). Nothing is collidable. Total with landmarks: 10 draw calls (budget 12), 48,958 extra triangles (budget 300k). Shop count is low because few ways carry shop/amenity tags.

## Landmarks (`buildLandmarks`, called after `buildTown()` in buildExtra)
The footprint-extruded body stays; the generic centroid tower of the two churches is suppressed (`noTower` override, applied in `facadeRefine`, checked at the tower branch) and replaced:
- Švč. Mergelės Marijos Ėmimo į Dangų (c92, 436 tris): tower on the real tower point, pilasters, two string courses, arched belfry openings, cornice, flared red pyramid spire with ball and cross, arched portal with surround, steps and two niche windows, stone plinth round the footprint. Tower height is 65% of the old LOOK value to match the Mapillary photo.
- Švč. Trejybės cerkvė (c219, 732 tris): octagonal drum with eight arched windows, cornice, green onion dome, ball and eight-point cross, small lantern dome on the entrance end.
- Kultūros centras (c171, 3216 tris): two rows of framed windows on every open wall, roof parapet, canopied entrance on the road-side wall, rooftop plant.
- Maxima XX (c2134, 432 tris): mullioned glazed shopfront, canopied glass vestibule, blue and red fascia band, rooftop units.
Each is a single mesh, well under the 5k budget (the culture centre is the largest because of its window rows).

## Evidence
- `work/test_facades.mjs`: PASS. No console errors; STY keys + all LOOK sty resolve; atlas 2048 x 256; counts 314 / 750 / 259 / 4 all > 0 and within caps; 10 draw calls, 48,958 tris; four landmark meshes 50 < tris < 5000.
- Shots in `research/prototypes/buildings/shots/`: landmarks (`church*.png`, `cerkve*.png`, `culture.png`, `maxima.png`, `landmark_*`), facade close-ups (`facade_panel/plank/silicate/redbrick.png`), details (`detail_*.png`), `before/` and `after/` = `views.mjs` sets on the v38 build and this build (maxima, night, dusk, rain, aerial, church, car).
- `fps.mjs` real GPU: baseline 60.3 fps, 1098 ms warm load; with `facades` 60.3 fps, 1297 ms (the atlas paint and details add about 0.2 s).
- Views run clean (`errors []`).

## Limitations
- Landmark meshes are stylised massing built on the footprints; the church tower point comes from LOOK, the rest is derived from the footprint's bounding rectangle. The Orthodox dome heights assume the ridge runs along the long axis.
- Moving the generic church tower to my mesh changes the church label position: `labels.push` used the tower point, now it is the footprint centroid.
- Facade tiles are still one 3.2 m bay with the window at the same place, so bay rhythm is uniform; the atlas width is at the 2048 cap so tiles are 128 px.
- Shop frontages are few (4); extending the rule to named commercial buildings would need more tags or hand lists.
- Culture centre windows are boxes over the existing plaster tile; the real building is flatter grey modernist.
- `LOOK` was not touched (street looks keep their ids); new landmark behaviour lives in `FX.over` in facades.js.

## Integration
`add_facades.py` anchors: `sheet:9,flat:10};`, the whole `const facadeTex=(()=>{...})();` block, two `vSty<7.5` conditions in `facadeShader`, `function buildingSpec(`, its `return Object.assign({h,kind,...` line, two `rs=` roof expressions, the tower condition `area>150){`, `W.buildings.push(bo);addTo(bGrid,...)`, `buildStadium();buildTown();`. Each is `assert count==1`. Built and run on top of the full chain (`importmap ... voice`); a later step that edits these anchors would need to run before `facades`.
