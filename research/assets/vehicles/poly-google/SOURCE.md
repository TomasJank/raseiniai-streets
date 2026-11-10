# Poly by Google: "Car" and "Van" (estate, estate80)

- Author: Poly by Google (Google Poly archive, hosted by Poly Pizza). Licence **CC-BY 3.0**
  (https://creativecommons.org/licenses/by/3.0/). Credit required; it is in `CREDITS_CARS` in `pipeline/cars2.js` and in
  `research/reports/license-report.md`.
- Credit lines: `"Car" by Poly by Google [CC-BY] via Poly Pizza (https://poly.pizza/m/75h3mi6uHuC)`,
  `"Van" by Poly by Google [CC-BY] via Poly Pizza (https://poly.pizza/m/aT_24cDaW1a)`.
- Downloaded 2026-11-09.

| file | Poly Pizza page | GLB url | sha256 | tris | used as |
|---|---|---|---|---|---|
| Car_75h3mi6uHuC.glb | https://poly.pizza/m/75h3mi6uHuC | https://static.poly.pizza/0455317d-26c3-40cd-8a7d-de547ffdb9df.glb | adb3cd808e6c31f3dd895a081864abdcadd3689d769f276cc13f35388f07c380 | 2,050 | `estate` (80s/90s five-door estate) |
| Van_aT_24cDaW1a.glb | https://poly.pizza/m/aT_24cDaW1a | https://static.poly.pizza/43472d7d-283d-48be-991e-698440dea10f.glb | 21e57a7be6afbea279ed9acd91e2e0bb0ea0543100778386363eec9ccf9f6f5d | 1,946 | `estate80` (boxy 80s estate) |

Modifications (`../fleet/build.py`): single textured mesh; palette colours sampled into vertex colours and mapped (blue body
-> paint, light-blue glass -> game glass, orange -> lamps, white at the very ends -> lamps, grey -> chrome); the wheels are
split out of the merged mesh as islands that touch the ground and are round in side view (plus the rims inside them);
one wheel kept as the template; wheels shrunk (`wr` .8 / .75); bodies scaled from Poly units to real dimensions; quantized.
