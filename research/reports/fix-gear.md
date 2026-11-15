# fix-gear: hats, caps, packs, bags, scarves and sticks on the outfit bodies (2026-11-10)

Step `fixgear` (`pipeline/fix_gear.js` + `pipeline/add_fixgear.py`), runs after `landmarks2`. Owner's report: "people wearing hats and bags look weird".

## What was wrong (before sheets: `research/prototypes/characters/gear/before_*.jpg`)

- **Hat / cap**: offsets were the old mannequin's head mapped onto the outfit heads, 4 cm too far forward and smaller than the hair. From the side a half dome on the forehead with hair through it, from behind no hat at all, a child's brim over the eyes. The colour list had a bright pink.
- **Shoulder bag**: a straight rod in front of the chest, the box a hand's width off the hip.
- **Backpack**: buried inside the male torso (invisible); on the women's `trek` outfit, which has its own pack, a second box.
- **Scarf**: the ring was inside every collar; only a "7"-shaped tail floated in front of the chest.
- **Stick**: rigid in the hand, tilted 24 degrees while walking, horizontal through the thighs when sitting, 0.9 m up beside the head on the phone or talking.
- Farmer and worker outfits have their own hats, so an instanced hat stacked a second one on top.

## What changed

All six parts stay one `InstancedMesh` each (no new draw calls). Their shapes are rebuilt at load in the old part frames, so the far instanced rig wears them too. Each outfit body gets its own part-to-bone offset, fitted from its vertices.

| Part | Change |
|---|---|
| hat | Knit beanie with a turned-up ribbed cuff. Fitted to each body's skull as a superellipsoid (p=2.6), with the brim lower at the back. Hair and ears above the brim are pulled inside the crown in the outfit vertex shader (5 lines, per-mannequin uniforms). The pink is now brown (`HATS`). |
| cap | Same crown fit and tuck, shallower crown, curved peak. |
| pack | Rounded pack curved to the back's measured curvature and leaning with it. Two straps follow the real shoulder contour to the armpits. Each outfit sits it as close as its own back allows (a hoodie's hood pushes it out). Hidden on `trek`. |
| bag | Crossbody: a strap from the right shoulder that follows the body section (a plane through the shoulder and the left hip), with the bag on the left hip. Thighs are left out of the section. |
| scarf | A soft wrap where the short neck meets the shoulders, front a little lower, plus two ends lying flat on the chest. |
| stick | Stands upright from the lower hand to the ground. When both hands are up (phone, talk, folded arms) or the person is sitting, it stands beside the right thigh. Per-frame matrix, near people only; the far rig keeps the old leaning stick. |
| own gear | farmer/worker: no instanced hat or cap. trek: no instanced pack. The instance is shrunk to a speck at its bone, as clothes.js does for coats. |
| outfits | Kids and pensioners never get the hard-hat `worker` outfit. Girls get `tee`/`dress`/`trek` only (the `clOutfit` wrapper). |

How the fit works: every outfit is posed in the idle clip (arms down) and its vertices are put back relative to the bind pose of `spine_03` (`Head` for head vertices). The torso pieces are then built from exact triangle sections of all outfits in "torso space" (each outfit's chest scaled onto the old rig's chest). That is why one shape fits both bodies and the old far rig. Load cost is one pass over 11 outfits after the outfits decode.

## Anchors and edits

- `let pedCold=0;` gets `HATS[HATS.indexOf(0xb03a6a)]=0x5a4038;` inserted before it. The colours are picked before any later module code runs; anchor text intact.
- `// ---------- boot ----------` gets fix_gear.js inserted before it.
- No existing function body is edited. Wrapped: `clMake`, `clOutfit`, `charInit`, `charTick`.

## Gates

`work/test_fixgear.mjs page.html [base.html]` (SwiftShader, ~5 min). On the base page it fails 6 of 7 checks: hairUnderHat 66% of crown vertices outside, hatSeenFromBehind 0%, gearOnBody (bag 8.7 cm off, pack 72% inside the body), noDoubleGear, stickOnGround (0.88 m off the ground), hatColours.

On the fixgear page (chain through `credits`, 2026-11-11):
- hairUnderHat: pass, 0% of crown vertices outside the hat or cap (walk and sit; men, women, kids, old).
- hatSeenFromBehind: pass, at least 99.7% hat colour above the hat's middle from the back and side.
- noDoubleGear: pass. stickOnGround: pass (tip within 2 mm of the ground, 3 degrees tilt). hatColours: pass.
- drawCalls: 18 for the six people on both pages.
- gearOnBody: **fails for the bag only**. Up to 13.9% of the bag's sampled vertices count as inside the body (women, idle and sit), against a 10% limit, because the strap crosses the hip. Pack worst is 0.5% inside, scarf 9%; contact and patch distances pass for all three.

Other suites: test_fixpeople, test_chars, test_people2, test_fight2, test_kick, test_fixground, test_solid, test_drive2 and test_streets pass. test_clothes passes all its checks, then times out on SwiftShader (screenshot / base page load) on the current heavy chain. `work/fps.mjs`: 60.3 fps on Metal for both base and fixgear. Page grows by 16,476 bytes. Two builds are byte-identical.

## Limitations

- The pack, strap and bag are rigid to `spine_03`. Where the bag strap crosses the front and back of the hip, it sinks a little into the hip in idle and sitting poses, up to 14% of bag vertices (gearOnBody fails on this). An earlier try that bent the strap ends up to the bag's top edge removed the sinking but left a visible kink, so it was reverted.
- The scarf and bag strap on the far rig sit up to ~4 cm off the old box torso at the hips and neck (sub-pixel beyond 60 m).
- The stick slides with the hand while walking; it is not planted per step.
- `test_fixwater` times out on the base page as well (it waits for `water.length`, which water3 no longer fills). Not caused by this step.
