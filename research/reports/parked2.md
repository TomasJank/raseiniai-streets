# parked2: parked cars through InstancedMesh2 (wave-3 item 2)

Files: `pipeline/parked2.js`, `pipeline/add_parked2.py` (step `parked2`, append after `fixtalk` in build.sh: `parked2` is not in build.sh yet, run `python3 pipeline/add_parked2.py out.html` after it), `work/test_parked2.mjs`.

## What it does
- Importmap gains `bvh.js@0.0.13` and `@three.ez/instanced-mesh@0.3.16` (jsdelivr, pinned). The library is `import()`ed lazily; if the import fails the cars2 InstancedMesh path stays as is (warning in the console, no error).
- `addParkedCars` (the cars2 wrapper, renamed `addParkedCars1`) still fills `PARKED.cars`, so `parkedNear`, collision and everything else that reads the registry is unchanged. After it runs, its meshes and its 400 ms `split` timer are dropped and replaced by InstancedMesh2 meshes, which become `PARKED.meshes` (21 of them: paint and trim per model, plus one silhouette mesh). The library can arrive after the world is built; the load callback then rebuilds from `PARKED.cars`.
- Per model: paint (Phong, per-instance colour) and trim (wheels baked in) draw the same geometry and materials as before, within 120 m. One shared `parkedFar` silhouette mesh draws every car past 120 m. Nothing is drawn past 400 m horizontal (perfTick's car cull). Culling is the library's BVH frustum cull per instance; the distance split is an `onFrustumEnter` callback (3D distance for the 120 m LOD, ground-plane distance for the 400 m cut).
- Not used: the library's `addLOD`. Paint and trim are separate meshes and trim has no far level, so a callback split gives one silhouette draw instead of ten. Same result, fewer calls.

## Numbers (SwiftShader build, machine load average about 170 from other sessions)
Parked-car triangles drawn (analytic: `count x index/3` per mesh, 900 ms settle so the baseline's 400 ms split has caught up):

| view | before | after |
|---|---|---|
| street (densest block, 35 m back) | 167,287 to 182,543 tris, 7 to 15 calls | 109,543 tris, 19 calls |
| aerial (350 m over the parked-car centroid) | 180,195 to 182,543 tris, 15 calls | 8,208 tris (4.6%), 1 call |

Whole-scene triangles are 10 to 22 M in both builds and swing between runs by 2x (every-other-frame water pass), so they cannot show a parked-car change; the parked-only figure is the honest one. The street view draws more calls than before because culled-in models each keep a paint and a trim draw.

`node work/fps.mjs`: Metal 60.3 fps for both builds (vsync cap). SwiftShader gave 1.3 fps for both builds because the host was saturated; no SwiftShader ranking is possible from this run.

## Tests
`node work/test_parked2.mjs new.html base.html`: ALL PASS. Parked count 1,097 (unchanged); every car within 60 m and inside the frustum is drawn (street 19/19, aerial 1/1); max drawn ground distance 389 m (street) and 392 m (aerial); parked-only aerial triangles 4.6% of before; no console errors. `test_drive` PASS, `test_solid` all passed, `test_cars2` passes (`wheelsDrawnOnGround` failed once under load, 0.059 m, then passed on a rerun; the baseline passes too, it measures live cars' wheels, which this change does not touch).
Note: `test_cars2` `parkedInstancing` matches meshes by geometry identity; InstancedMesh2 clones geometries, so it finds none and passes vacuously (maxPerModel null).

## Caveats
- A 30 s `goto` in the existing tests times out when the host is overloaded; they were run from scratchpad copies with a longer timeout.
- Shadows from the new meshes were not inspected visually, only that nothing errors.
