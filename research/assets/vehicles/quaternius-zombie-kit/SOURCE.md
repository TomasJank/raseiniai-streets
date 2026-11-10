# Quaternius Zombie Apocalypse Kit (truck, pickup)

- Pack: https://quaternius.com/packs/zombieapocalypsekit.html, March 2024, Quaternius. Page says CC0; treated as
  **Quaternius Asset License v1.0** per the orchestrator ruling (embed allowed, no credit, raw files gitignored).
- Downloaded 2026-11-09 from Poly Pizza (Quaternius, CC0 1.0). Both use the kit's `Zombie_Atlas.png` palette texture.

| file | Poly Pizza page | GLB url | sha256 | tris | used as |
|---|---|---|---|---|---|
| Truck_cXw6oiFtZ8.glb | https://poly.pizza/m/cXw6oiFtZ8 | https://static.poly.pizza/f4b28921-b45e-4653-b54c-c3976e4ea0fe.glb | a5d107b5b06f8ca2d8d7e66ae6309f2e1a25cac577c5db8ebb661b3f0ca5ed8f | 7,474 | `truck` (small box truck) |
| PickupTruck_qn4grQgHm8.glb | https://poly.pizza/m/qn4grQgHm8 | https://static.poly.pizza/4e925a01-dbb8-4aab-848b-221306b835ea.glb | 9d6b2e33af0d37bf42b2e7af850949f4efd0ddbb9a88077812d152d8b4c1c3eb | 6,432 | `pickup` |

Modifications (`../fleet/build.py`): texture sampled into vertex colours; the cab colour (olive on the truck, blue on the
pickup) becomes paint; the 956-triangle wheels are replaced by the Quaternius sedan's 420-triangle wheel scaled to size
(brings both under 6k triangles: 5,330 and 4,288); wheels shrunk (`wr`) and bodies stretched to real dimensions; quantized.
