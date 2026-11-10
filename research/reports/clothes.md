# clothes: real outfits on the pedestrians (2026-11-10)

Step `clothes` (`pipeline/clothes.js` + `pipeline/add_clothes.py`), appended after `drive2` in `build.sh`. No existing pipeline file is edited. It wraps `charInit`, `charMake`,
`charPose`, `charTick` (and `faceMat`) from chars.js / fix_people.js. Embedded: two deflated `agz_clothes_m` / `agz_clothes_f` blocks, 589 KB in the HTML (raw GLBs 347 KB + 302 KB).

## Decision

The orchestrator ruled out procedural clothes on the UAL mannequin after seeing the base body (ball joints, bodybuilder torso, splayed hands), so **route A** was built; route B
was not built or rendered. Route A source: Quaternius **Ultimate Modular Men / Women** (CC0 on Poly Pizza, treated as QAL v1.0 like the rest, see `research/assets/characters/townsfolk/SOURCE.md`).

Candidates looked at (rendered 6-up, `research/prototypes/characters/clothes/candidates_*.png`):

| Candidate | Result |
|---|---|
| Quaternius Ultimate Modular Men (11) and Women (10) | **chosen**: low-poly, ordinary proportions (head 1/8 of height), normal hands, no joint segments, 5-11k tris, 62-bone rig with a T-pose identical to the UAL mannequin's |
| Quaternius Universal Base Characters (free "Standard") | underwear base models only, no clothes: rejected without rendering |
| Quaternius Ultimate Animated Character Pack, KayKit, Kenney | not re-rendered: the first is the chibi/FBX-only pack already rejected in `characters.md`, KayKit adventurers and Kenney are chibi/blocky |

Of the 21 modular models 11 are used (everyday outfits): men Casual, Hoodie, Business Man (suit), Farmer, Beach, Worker; women Animated Woman (dress), Animated Woman (tee + trousers),
Suit, Worker, Adventurer (trek, used when the look carries a pack). Not used: armour, sci-fi, fantasy, costume, the 10k-tri men's Adventurer, the mohawks.

## How: re-rig instead of retarget

`SkeletonUtils.retargetClip` is not needed. All modular characters of one gender share one armature in a T-pose, and that T-pose is the UAL mannequin's (arms along x, legs
straight down, toes +z). `research/assets/characters/build_townsfolk.mjs`:

1. maps the 62 bones to the UAL names (`Hips,Body,Root -> pelvis`, `Abdomen/Torso/Chest -> spine_01..03`, `ShoulderL -> clavicle_l`, `UpperLegL -> thigh_l` ..., finger bones fold into the hand, IK targets drop);
2. keeps the UAL rest *rotations*, takes the character's joint positions (ankle/ball from the UAL, pelvis placed 1.5 cm under the thigh joint as on the UAL), and scales each gender so its thigh joint sits at the UAL's height (m 0.967, f 0.899);
3. rebinds the skin weights to those bones and writes every outfit of a gender as its own skinned mesh on one shared skeleton.

Result: the game's 24 clips and the kick (all UE-named rotation tracks plus the pelvis translation) play on the outfits unchanged, `hip` ratio = 1 for both genders. The walk, idle and a car-hit
death were checked on all 11 outfits (`rig_m_walk.png`, `rig_f.png`); no retargeted clip set is shipped.

Per vertex the build also writes: smooth normals (welded, 55 degree crease, so hems, collars and belts stay crisp, flat triangle fraction 3-5 %), a colour region in `TEXCOORD_0.x`/8
(0 skin, 1 shirt, 3 legs, 5 shoe, 6 hair, 7 fixed) classified from the material and the dominant bone, and a grey `COLOR_0` shade (authored luminance over the region's main colour).
Anything far from the main colour (white shirt under a dark jacket, belt, gloves, helmet) is region 7 and keeps its authored colour.

## What the game does (clothes.js)

- Outfit per look, picked once and kept: shorts (`shin == skin`) -> beach, `coat` -> suit/hoodie (suit for 65 % of men), skirt -> dress, `pack` (women) -> trek, old men lean to farmer, else a spread. `look.clo` is validated per gender.
- Colours from `charCols` through the same `rc` uniform scheme as chars.js (now 8 slots): skin, shirt (the coat colour for coat wearers), legs (the skirt colour for the dress), shoes, hair (grey for the old).
- The old `coat`, `skirt`, `long` hair and `tail` instanced parts are shrunk to a speck at their bone for outfit people (the outfit is the garment; `test_fixpeople.gearNearItsBone` still sees them near the bone). Hats, caps,
  packs, bags and scarves stay instanced gear, but with smooth shapes: beanie with a rolled brim, cap with a curved brim, rounded-box pack and bag, a thinner scarf. The swap is global, so far people (instanced rig) get the new shapes too. Offsets are re-measured on the new bones and then fitted (`CL.fit`).
- Face: the models have eyes and brows; the face decal now adds the mouth, a nose shade and the old's lines, measured on these heads (`faceMat` is replaced once the outfits are ready; before that the old decals stay).
- Kids: the adult outfits scaled by `look.s` plus the existing 1.32 head. The old: same outfits, grey hair colour and the existing stoop.
- LOD unchanged: within 60 m (max 24) people get an outfit, farther people and the taxi fare stay on the old instanced rig. Assets decode after the world shows, as before.

## Budgets

| | Budget | Actual |
|---|---|---|
| tris per outfit | <= 8k | 5.2k to 6.6k (men 5240-6574, women 5924-6808) |
| meshopt size per outfit | <= 120 KB | about 55 KB (6 men 347 KB, 5 women 302 KB) |
| embedded total | <= 1.5 MB | 589 KB |
| draw calls per ped | <= +2 | +0: body + face decal as before (measured 2.43 vs 2.27 per mannequin with the shadow pass, the difference is which gear the random looks carry, `test_clothes`) |
| fps | >= 55 | 60 (`work/fps.mjs`, Metal, M5 Pro); 24 mannequins: updatePeople 0.3 ms, charTick 0.12 ms (SwiftShader) |

## Tests (SwiftShader, build = base `build.sh` + `add_clothes.py`)

`node work/test_clothes.mjs page.html [base.html] [shotsDir]`: outfit mesh on every mannequin (12/12, kinds spread over casual, tee, dress, hoodie, suit, worker, farmer), smooth shading
(flat fraction m 0.042 / f 0.028), calf vertices follow the walk clip (moved 0.29 / 0.33 m, drift from the calf bone 0.1 mm), coat/skirt/long/tail shrunk on every mannequin and the new gear
meshes have 588-1176 tris, hat/cap sit 5-20 cm above the head bone, draw calls per ped against the base build, no console errors: PASS.
`test_chars` PASS, `test_kick` PASS (the kick clip plays on the outfits), `test_fixpeople` PASS (faces on every mannequin, region colours, gear near bones, car-hit tumble), `test_fight` PASS (one run failed `bystandersWatch`, a behaviour roll in
`updatePeople`; the rerun passed, and the first failures I saw were mine: a cached `look.clo` of the other gender, now validated).

## Before / after

`research/prototypes/characters/clothes/`: `A_before.png` / `A_after.png` (adult m/f, suit, dress, old with stick, kid; six-up), `B_before.png` / `B_after.png` (hats, packs, scarves, coat and skirt flags),
`rig_m_walk.png`, `rig_f.png` (all outfits at three walk phases, flat test colours), `candidates_modular.png`, `candidates_men2.png`.

## Limitations

- Eleven outfits for any number of people: variety is colour (skin, shirt, legs, shoes, hair from `look`), not cut. Some outfits carry colours of their own (hard hat, hi-vis vest, gloves, overall straps).
- Region borders blend over one triangle (shirt to belt to trousers), visible as a soft gradient at the waist of some outfits; `flat` interpolation looked worse (sawtooth) and was dropped.
- Kids are scaled adults with a bigger head; the old have grey hair and the stoop but no cane-matched clothes.
- `long` hair and ponytail looks are ignored for outfit people (the model has its own hair).
- The idle clip's wide stance and hanging open hands are the UAL clip, unchanged.
- Beyond 60 m people still use the old instanced rig (boxes), so the LOD switch pops more than before.
- `char_body_m/f` (the nude mannequins, 110 KB) stay embedded as the fallback until the outfits decode or if they fail; nothing else uses them.

## Integration notes

1. `build.sh`: append `clothes` after `drive2`. The step asserts chars + fixpeople are present.
2. `pipeline/extract_assets.py` does not restore the new blocks: add `agz_clothes_m` / `agz_clothes_f` -> `research/assets/characters/clothes_body_{m,f}.glb` (today every non-kick `agz_` block is written as an animal GLB).
3. A clean clone needs the two GLBs: regenerate with `build_townsfolk.mjs` from the 21 downloads (`townsfolk/SOURCE.md`) or restore from a built page.
4. Add `work/test_clothes.mjs` to the suite (needs network for the three addons, like the others). Run it with relative shot dirs: the other tests build `dir + out`, so an absolute path lands under `work/`.
