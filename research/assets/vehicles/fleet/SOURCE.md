# Fleet build (processed GLBs for pipeline/cars2.js)

`build.py` (+ `glb.py`, a minimal glTF reader; Python 3 + Pillow, no npm) turns the downloaded GLBs listed in
`../quaternius-cars`, `../quaternius-zombie-kit`, `../poly-google`, `../pukkbumxdd-van` into `built/car2_{key}.glb`
(gitignored, like every asset binary; `pipeline/assets/manifest.json` points at them):

    cd research/assets/vehicles && python3 -I fleet/build.py fleet/built

Output layout (read synchronously by `pipeline/cars2.js`, also opens in any glTF viewer): meshes `paint`, `trim`, `lamps`,
`wheel` in car-local metres (+z nose, y up, ground y=0), hub nodes `wheel_fl/fr/rl/rr`, `extras` = wheel radius, axles,
track, dims, triangle counts. int16 mm positions (KHR_mesh_quantization), int8 normals, uint8 colours, uint16 indices.
Licences and per-file modifications: the SOURCE.md of each pack.

Where a wheel is shrunk (`wr` < 1: estate, estate80, van, truck, pickup), the arch is pulled in round the smaller wheel
(body points near a hub move towards it by the radius lost, fading over .35 m, kept 3 cm off the tyre); without it the open
wheel well read as a hole in the body.
