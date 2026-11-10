# Online geodata for Raseiniai buildings (2026-11-10)

Everything is under `research/geodata/`; nothing in the pipeline or game was touched, no imagery is embedded.

## Summary
| Source | Exists for Raseiniai | Useful | Verdict |
|---|---|---|---|
| NZT orthophoto ORT10LT 2024-2026 (tile service) | yes, full cover, sharp | roof colour for 6,666 buildings | **do it** (licence to confirm, see below) |
| 3D buildings / LOD2 | LOD2 only Telsiai, Kaunas, Marijampole, Alytus; Raseiniai at best LOD1 in a viewer; no download | no | dead end |
| OSM building tags | 5 of 6,656 buildings carry any of the wanted tags | no | nothing to gain |
| Wikimedia Commons / KartaView / KVR | thin / blocked / blocked | reference only | manual use only |

## 1. Orthophoto
- Endpoint (no auth, needs a non-default User-Agent, python-urllib default gets 403):
  `https://www.geoportal.lt/arcgis/rest/services/NZT/ORT10LT_2024_2026/MapServer` (ArcGIS cached tiles, REST `/tile/{L}/{row}/{col}`, also OGC WMTS at `.../MapServer/WMTS/1.0.0/WMTSCapabilities.xml`). CRS LKS94 / EPSG:3346, origin (-5122000, 10000100), 256 px tiles. Service text: "ORT10LT 2024-2026 ... parengtas pagal 2024 m. ortofoto medziaga", copyright "(c) Nacionaline zemes tarnyba prie Aplinkos ministerijos (c) VsI SSVA". Older cycles are separate services (`ORT10LT_2021_2023`, `_2018_2020`, ...). The old `/mapproxy/nzt_ort10lt` WMS now returns 401.
- Best real resolution is level 11, 0.2646 m/px. Level 12 (0.132 m) exists but is just an upsampled blur (compared side by side).
- Downloaded: 6,162 tiles, 66 MB (74 MB on disk) in `research/geodata/ortho/tiles/{row}_{col}.jpg`, `ortho/meta.json` holds the grid. Covers the whole footprint extent plus 60 m (lat 55.3545-55.4002, lon 23.0798-23.1603), i.e. wider than the town bbox. Script: `fetch_tiles.py` (4 threads; the server throttles in bursts).
- **Licence: NOT confirmed.** data.gov.lt (the open-data catalogue) was unreachable from here (timeouts / connection refused). A search snippet says its entry for the 2025 ORT10LT edition lists "Creative Commons Attribution 4.0", but I could not open the page, so I cannot quote it. The geoportal.lt copyright page (fetched) names the copyright holder, "ORT10LT ... (c) National Land Service under the Ministry of Environment", and states **no licence**. The LEI download page (geoportal.lt news "2022 m. ir 2023 m. ortofotografiniai zemelapiai") states no reuse terms either. The 2021-2023 service description says "Be sutikimo publikuoti duomenis, naudoti paslauga kitose aplikacijose draudziama" (using the service in other applications without consent is forbidden); the 2024-2026 description has no such sentence. Older (2011-2013) NZT terms forbade redistributing ORT10LT and derivatives. Status: the owner should open data.gov.lt "ORT10LT" in a browser and copy the licence line, or mail pagalba@geoportal.lt. Until then treat the downloaded tiles as internal working data and ship only derived colours (single RGB per building = facts about the world, no pixels).
- Image caveats: flown spring 2024, leaf-on is partial. It is not a true ortho: tall roofs are shifted by 1-3 m, handled by a 1 m footprint erosion. A global blue cast exists (median roof RGB 155,150,168), corrected with a gray-world gain (1.027, 1.062, 0.948).

### Roof prototype (`roofs.py` -> `roofs.json`, `roofs_sheet.png`)
Method: footprints from `rasData` (equirectangular around the data centre in `buildWorld` is a local approximation of lat/lon, so I sampled with the true lat/lon -> EPSG:3346 transform from the same lat/lon, same footprints; footprints with `building` tag, closed ways, 6,666 of the 6,675 the game extrudes, the 9 missing are the sub-4 m2 / non-building filters). Erode 1 m, drop shaded pixels (lum < 55) and vegetation (green dominant), keep the brighter 60 % (sunlit slope; the shaded slope is dark and blue-shifted), median RGB, classify by HSV/luminance, confidence = pixel count x colour homogeneity x non-masked share x distance from class boundary.

Results (6,666 buildings):
- conf >= 0.5: **4,379** (66 %), 4,133 of them with eroded area >= 12 m2; conf >= 0.7: 1,974 (30 %); conf >= 0.3: 6,219.
- Class counts: light/"corrugated" 3,626, grey/"asbestos" 2,069, "standing seam" (saturated blue/green metal) 435, "clay tile" (red/brown) 397, dark/"bitumen" 139.

Honest reading of the contact sheet (50 crops, 10 per class, yellow = footprint, swatch = proposed colour):
- **Red/orange tile and metal-tile roofs: reliable**, colour is right, classification right. Only 397 (6 %) though, most of Raseiniai's roofs are grey or dark brown.
- **The RGB itself is good for nearly all roofs** with a visible roof; dark brown and dark grey ones read as plausible albedo.
- **The material class is only trustworthy for clay tile and blue/green metal.** Grey vs dark vs light is a brightness threshold, not a material: many "asbestos"/"bitumen" crops are dark metal tile or shingle, and "corrugated" (light) catches bare ground, sandy plots, demolished lots and a few mis-registered footprints (OSM footprint offset from the image by a few metres). So use `rgb` broadly but `sty` only for clay/standing-seam, and map the rest to the game's default pitched look.
- A true shed/flat vs gable distinction is not possible from colour; LiDAR heights in rasData already carry the roof shape.

## 2. 3D buildings / LOD2
- planuojustatau.lt "3D Lietuvos zemelapis" (operated by VsI Statybos sektoriaus vystymo agentura, viewer `maps.planuojustatau.lt/map3d/tiiis_3d`): page text says "LOD2 detalumo lygio pastatai pateikiami Telsiu, Kauno, Marijampoles ir Alytaus miestu teritorijose"; the rest of the country is LOD1 (box extrusions, i.e. what we already have). Raseiniai is not in the LOD2 list.
- No CityGML/SHP download is offered. The terms of use (maps.planuojustatau.lt/map3d/bnzn-js-api/assets/help/consent.html) allow viewing and "atsisiusti duomenu fragmentus" for personal use but forbid copying/reselling, bulk extraction of "visus zemelapiu duomenis arba duomenu fragmentus" and building other map datasets (2.3.1-2.3.3). Not usable. `lod2.json` was therefore not produced. Vilnius has its own LOD2 effort; irrelevant here.
- I did not find an INSPIRE BU (Buildings) download for Raseiniai; the INSPIRE record I tried to open had an expired certificate.

## 3. OSM tags
Overpass, 2026-11-10 snapshot, bbox 55.3545,23.0797,55.4003,23.1604: 6,656 `building` ways (6,516 plain `yes`, 59 garages, 48 greenhouse).
- `building:colour` 0, `building:material` 0, `roof:colour` 0, `roof:material` 0, `roof:shape` 5 (3 gabled, 1 hipped, 1 flat), `building:levels` 4, `roof:levels` 3.
- `osm_tags.json` holds those 5 ways keyed by OSM way id with the matching game id. Important: **the game ids `c####` are NOT OSM ids**, they are the array index into `rasData.w` (`'c'+i` in `builtInWays`); OSM way ids are not kept in the page, so I matched by footprint centroid (< 5 m): all 5 matched (c2182, c2909, c2910, c5133, c5679). Coverage 0.08 %; OSM gives nothing here.

## 4. Reference-only imagery (nothing bulk-downloaded)
- Wikimedia Commons: `Category:Raseiniai` (https://commons.wikimedia.org/wiki/Category:Raseiniai): 1 file + 13 subcategories (Culture, Economy, Education, Geography, History, Public services, Religion, Streets, Transport, Views, ...). `Category:Buildings in Raseiniai`: 9 files + 7 subcats; `Category:Streets in Raseiniai`: 1 file + 1 subcat. Total file count and licences across subcats not obtained: the API rate-limited me (HTTP 429) after the first calls. Commons files are individually CC BY / CC BY-SA / public domain (check each); usable as visual reference, shipping requires per-file attribution.
- KartaView: could not determine coverage. `api.kartaview.org/2.0/sequence` answers "Restricted access!", `api.openstreetcam.org` has a hostname/certificate mismatch (I did not bypass it). Check https://kartaview.org/map/@55.3814,23.1168,15z by eye. Photos are CC BY-SA.
- Kulturos vertybiu registras https://kvr.kpd.lt/ : returns HTTP 403 to non-browser clients, so I could not count Raseiniai entries or inspect photo/material fields or terms. Wikidata has 0 heritage-designated items under Raseiniai (query on P1435 + P131), so no shortcut there. Needs a manual browser look; expect a few dozen town objects with a photo and a short description, unverified.

## 5. Licence table
| Source | Licence | Derive colours/geometry | Ship | Attribution |
|---|---|---|---|---|
| ORT10LT 2024-2026 tiles | unconfirmed; data.gov.lt reportedly CC BY 4.0 (not verified), geoportal page names only the (c) holder | per-building median colours: very likely fine, confirm first | shipping pixels: no (not verified); shipping derived colours: after confirmation | "Ortofotografinis zemelapis ORT10LT (c) Nacionaline zemes tarnyba prie Aplinkos ministerijos, 2024" |
| planuojustatau 3D / LOD2 | proprietary terms of use | no (2.3.2, 2.3.3) | no | n/a |
| OSM buildings/tags | ODbL 1.0 | yes | yes, derived data is fine (already used) | "(c) OpenStreetMap contributors" |
| Wikimedia Commons | per file (CC BY, CC BY-SA, PD) | as reference only | per file with attribution | per file author + licence |
| KartaView | CC BY-SA 4.0 (project terms) | reference | avoid | "KartaView contributors" |
| KVR (kvr.kpd.lt) | unknown, page blocked to bots | reference | no | n/a |

## Proposal: `pipeline/add_roofs.py`
Input: `research/geodata/roofs.json` (move to `pipeline/roofs.json` when accepted; regenerate with `roofs.py`). The ids are `c####` = index into `rasData.w`, the same keys `add_streets.py` already resolves for LOOK, so no re-matching is needed.
1. Load roofs; keep entries with `conf >= 0.5` and a footprint area >= 12 m2 (about 4,100 buildings). Quantise `rgb` to 4 bits per channel so the splice stays small (~25 KB).
2. Splice a `ROOFS` map into the page, and in `buildingSpec`/the LOOK assignment set `look.roof = rgb` (hex) when the building has no explicit entry from a street file; set `roofSty` only when `sty` is `clay tile` or `standing seam` with `conf >= 0.6`, otherwise leave the default. Use the same `rep(old,new)` + `assert h.count(old)==1` anchor style as the other add_*.py.
3. Precedence, lowest first: procedural default < roofs.json < `pipeline/streets/*.json` looks (explicit, hand-checked) < photo-matched looks. Implement as "apply roofs.json first, then the street step overwrites", so build order is `add_roofs.py` before `add_streets.py`.
4. Do not apply the colour raw: sunlit-slope RGB includes sun, so multiply by ~0.85 when it is a lit palette (the game uses LinearSRGB without tone mapping), check on 10 buildings.
5. Test: a deterministic-build check plus an assert that every id in roofs.json exists.

## Next step
Get the licence line confirmed (open data.gov.lt "ORT10LT" in a browser, or mail pagalba@geoportal.lt), then run `add_roofs.py` limited to the 397 clay-tile and 435 metal roofs plus RGB for the rest, and eyeball 10 streets.
