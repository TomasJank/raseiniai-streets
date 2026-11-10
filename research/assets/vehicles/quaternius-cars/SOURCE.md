# Quaternius Cars Pack (sedan, saloon90, hatch, liftback + police, suv)

- Pack: https://quaternius.com/packs/cars.html, "Cars Pack", November 2018, Quaternius. The pack page says CC0; treated as
  **Quaternius Asset License v1.0** per the orchestrator ruling (embed in the game allowed, no credit required, raw files
  not redistributed: they stay gitignored).
- Downloaded 2026-11-09 from Poly Pizza's GLB conversions of the pack (no login; the pack itself is a Google Drive folder).
  Poly Pizza shows each as Quaternius, CC0 1.0.

| file | Poly Pizza page | GLB url | sha256 | tris | used as |
|---|---|---|---|---|---|
| Car_Cz6yDaUcM9.glb | https://poly.pizza/m/Cz6yDaUcM9 | https://static.poly.pizza/59a67a6c-490e-472e-bae6-5a4d2541f1c7.glb | bf00f2f0386a25aa310abc0424d22586e46a59ee6c737e6b375c97c9f01bd462 | 2,954 | `sedan` |
| SportsCar_OyqKvX9xNh.glb | https://poly.pizza/m/OyqKvX9xNh | https://static.poly.pizza/e6410e19-a88f-4158-bc91-c19fccf85028.glb | 2878182e9a17b809d45b0a184f51560eab755b2d7e3058bf02acbd5fcd0ca78b | 3,066 | `saloon90` (player's car) |
| Car_unqqkULtRU.glb | https://poly.pizza/m/unqqkULtRU | https://static.poly.pizza/d35173c8-6078-4367-8f87-b1f2599f0bb7.glb | e5f5fa41c4434383b20287725c0e9d757cbd0f059eedc342ec265d32a195fe39 | 3,124 | `hatch` |
| SportsCar_1mkmFkAz5v.glb | https://poly.pizza/m/1mkmFkAz5v | https://static.poly.pizza/34db1344-31cc-49ac-bc46-c055f68e39ca.glb | bbb1c718d2aaf5f4344e9fb2cd66d8332a998a515b09ddd4dfa14698d787124e | 3,148 | `liftback`, and the police Škoda stand-in |
| SUV_xsMtZhBkxL.glb | https://poly.pizza/m/xsMtZhBkxL | https://static.poly.pizza/e5fbf2ee-5c9e-47d5-8ab6-80cacd463baa.glb | 1a9ce2bba813dca5005abab09715b01b8b5f4a9c48d7260463afdfeb876aa8b6 | 3,294 | `suv` |

Not used from the pack: Police Car (US black/white livery) and Taxi (the sedan with a TAXI sign); see `../rejected/SOURCE.md`.
The Patreon-exclusive police SUV is not free.

Modifications (`../fleet/build.py`): materials mapped to paint / glass / trim / lamps (body colour becomes white paint
tinted by the game; DarkOrange becomes a .82 paint shade), glass recoloured to the game's sky-gradient glass, rear wheel pair
split by side, all four wheels replaced by one copy of the front +x wheel, body stretched to real dimensions per model
(listed in build.py), quantized.
