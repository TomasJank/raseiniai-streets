# Vilniaus g. photo match (2026-11-09)

Photos: 27 in refs/mapillary/vilniaus/ (4 from last round, 23 new; 2025-03-04 to 2026-10-14, mostly dashcam, forward along the street). Coverage is three stretches only: SE end near Aušros tak. (lon 23.121), the centre around Tiesos/Gėlių g. (55.378, 23.118) and the NW run Vytauto Didžiojo to Stonų g. (23.109-23.113). The other ~200 buildings of the 3.8 km street have no usable photo and are untouched.
Poses use Mapillary `computed_compass_angle`/`computed_geometry` (the raw compass was ~80 degrees off on the newer dashcam sequences).

## Buildings changed (looks)
| id | photo shows | set |
|---|---|---|
| c1417 | ochre rendered cottage, grey asbestos gable roof | plaster [.80,.72,.55], roof grey, pitched 3.1/2.8 |
| c1418 | pale plank house, green sheet roof | plank, roof [.16,.42,.30], pitched |
| c1419 | pale plank house, dark roof | plank, dark roof |
| c1525 | two-storey beige house, dark red-brown hip roof | plaster, hip, h5.6 |
| c2467 | white two-storey, dark grey gable roof | plaster white, dark roof, h6 |
| c2504 | white house beside it, dark roof | same family |
| c2466 | small cream cottage, brown roof | plaster cream, pitched |
| c2022 | light grey brick house, dark tile hip roof, brown timber front | silicate, hip |
| c7618 | black timber gable cottage (was a flat shop box) | plank, dark, pitched 2.6 |
| c2908 | white veterinary pharmacy, low flat roof (was pitched grey brick) | shop, flat, h4.2, sign VETERINARIJOS VAISTINĖ |
| c2904 | salmon 3-storey block behind the lawn | plaster salmon, flat, h10.2 |
| c2909 | salmon/grey 3-storey block with balconies | plaster salmon, flat, h10 |
| c2910 | cream house, steep red tile roof | plaster cream, red roof, pitched |
| c2911, c2913 | cream houses with red tile roofs | cream, red roof |
| c2941 | beige flat-roofed block | plaster, flat, h7.2 |
| c2914 | yellow timber house, steep dark roof (was grey brick) | plank, dark roof |
| c2185 | house under scaffolding, grey, red roof | plaster grey, red hip roof, h7.5 |
Existing looks for the rest (c2515, c2026, c2186, c2221, c5679, shops, etc.) kept. Also: 2 flavour dialogues added (6 total), 1 sign (the vet pharmacy, text read off the photo). 17 buildings changed, 41 looks total.

## Evidence
Compare sheet: research/prototypes/streets/vilniaus/compare.png (11 rows: photo | before | after); before/ and after/ hold the renders.

## Engine backlog
- Facade bays are uniform; real balcony loggias, porch roofs, rooftop boxes on the salmon blocks (c2909, c2941) not expressible.
- A building's wall cannot take two colours (salmon lower floors, cream pilasters, grey top storey): c2909/c2904 read as one flat tone, and brick-looking atlas pushes salmon plaster toward saturated red.
- Dark-wood old cottages with a steep roof and no windows on the gable (c7618) cannot drop windows per face.
- Tall hedges and tree rows in front of houses (SW side) hide buildings; no hedge-by-id hook besides fences.
- Scaffolding on c2185 not expressible.
