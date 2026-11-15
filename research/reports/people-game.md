# people-game: one person at every distance (2026-11-13)

Owner's complaint: people "change the looks" when he walks up to them, and he wants more variation.

## What was wrong
Far pedestrians are instanced figures coloured by `randomLook()`/`dress()` (people2.js). The nearest 24 within 60 m get a rigged
body, and `mhchars.js` draws a MakeHuman person over that rig. In v60 the MakeHuman person was picked from sex and age only
(`mhPick(look, i)`, by ped index), so the near person shared nothing with the far figure: other colours, other hair, and the far
figure's hat, cap, bag, pack, scarf, coat or stick vanished at the switch.

## What changed (all in `pipeline/mhchars.js`, `pipeline/add_mhchars.py`, `work/test_mhchars.mjs`)
- **One identity.** `randomLook` is wrapped: each new look is dealt a MakeHuman body (`look.mh`) round robin within sex and age, so
  every body is used and the street holds as few twins as it can. `mhPick` reads `look.mh`. Player and taxi fare are never dealt one.
- **Far figure built from the body.** At load every body is measured in its bind pose: per body region (chest, upper arm, forearm,
  hips, thigh, shin, foot, hair, hat) the colour drawn there after the MakeHuman brightening, the skirt hem, sleeve length and
  long hair. The instanced figure gets those colours, the skirt cone stretched to the real hem, long hair and hat only if the body
  has them. All old instanced gear (hat, cap, pack, bag, coat, scarf, ponytail, stick) is switched off on every look; the far hat
  shows only for the two bodies wearing a fedora. The chest colour is the colour most of the *front* of the chest has (a white
  shirt under a blue bib reads blue, not grey-blue); other regions use the mean (a patterned skirt reads as its blend).
- **Variation.** Each pedestrian gets a deterministic (from `hash`) colour change per tint group: tops/dresses/skirts (hue turn,
  saturation, brightness, sometimes a dye toward a muted colour), trousers (small hue turn, brightness), hair (shade; old people go
  grey, some dyed; a fair fraction blond). The near shader applies it to the materials named in the JSON `tint` list, and the far
  palette goes through the same 3x3 matrix, so both stay one person. Skin is never in a group. An empty `tint` list (12 of the 36
  new bodies, the one-piece suits) means only hair varies on those.
- **Eyes.** The `eyeball` (or old `low-poly`) material is exempt from the brightening; eyes now read as their own colour (`face.png`).
- **Height.** The far figure is scaled from the JSON `height` (clamped 1.5-1.9 m adults, 1.0-1.5 m kids, +-3 % per person) and
  the near body is scaled so its crown lands where the far figure's hair top is.
- **Arms out at the switch (found and fixed).** A newly made mannequin never got `st.snap`, so its clips faded in from the bind pose
  for about 0.2 s: every fresh near person flashed in an A-pose. `charMake` is wrapped to set `snap`; arms are down on the first
  frame now (checked: upper-arm direction y = -0.90 on frame one, was -0.47 rising over 6 frames).
- **Gear of near people** is parked 10 km down (as chars.js parks the body parts) instead of scaled to zero, so `test_people2`'s
  "every part drawn" check no longer trips on near people whose hat or hair the MakeHuman body draws.
- **Fallbacks.** Anything missing from a JSON is measured from the model at load (palette, skirt, long hair, hat); before the
  models decode the JSON palette is used. `add_mhchars.py` passes `pal, skirt, bare_legs, long_hair, hat, tint, hair` through
  and builds the credit line from the JSONs' `credits`. Material names are kept on the replacement materials (gltfpack drops node
  names, and the tint groups match on material names).

## Measured (new crowd: 36 bodies + player, `test_mhchars.mjs`, each body photographed at 62 m and 58 m through a 3.2 degree lens)
- Same body across the switch: 36/36. No NaN bones. All 36 bodies dealt over 400 respawns, none with the wrong sex/age.
- No old instanced gear on any far figure; far gear = near gear for all 36.
- Height near/far: within 3 % for 35 bodies; **crowd_05 is 6.9 % taller near** (her hair bun rises above the far figure's hair cap).
- Leg colour: 36/36 within tolerance (16 levels + 20 % of the brighter value).
- Top colour: 34/36. **crowd_06** (crop top: the near band crosses her bare midriff, the far torso is one colour, off by 35) and
  **crowd_04** (halter with a dark turtleneck collar; 15 to 24 depending on the tint drawn) fail. Both are the shape of the far figure,
  not a wrong colour.
- Player untouched (no tint, stripes on, far colour 16171b). Fare unchanged. Frame time: updatePeople 0.6 ms, mhchars 0.35 ms.
- Regression tests on the final build (36 new bodies): test_chars, test_fight2, test_kick, test_fixpeds, test_jump PASS;
  test_react PASS on one run, the other run crashed in `charAnim` on `C[st.one].duration` with `st.one` a number: `p.rx` is used
  both by the old flee code (a coordinate, people/talk step) and by fight2 (a hit-reaction clip name read when a mannequin is made
  after the hit). Not appearance code and not mine; reported to the integrator. `fps.mjs`: 60.3 fps, load 3.9 s on the M5 Pro.
  Two builds back to back are byte-identical.
- `test_people2` "snow at 13:00: >= 60 % coat or hat"
  now fails **by design**: the brief forbids far gear the near body lacks, and none of the 36 bodies wears a coat; only the two
  fedoras give hats. If winter coats are wanted, people-gen has to make coated bodies.

## What still pops at the switch (honest)
- **Silhouette and detail.** The far figure is cylinders: hair is a cap (plus a slab for long hair), so curly or big hair, buns and
  fringes appear at the switch; patterned dresses (florals, zebra, leopard) are one flat colour far away; bare shoulders, crop tops
  and open necklines are covered far away; the far hips block is a separate cylinder and often reads as a shorts-shaped patch.
- **Posture.** Far figures stand straight with arms at the sides; near ones play the UAL clips (idle stance is wider, hands out a
  little). Walk phase is shared, so walkers match well; standers change stance.
- **Shoes and socks** at the far figure take the measured shoe colour; white socks under a skirt are not shown.
- **Heights from people-gen:** six bodies are 1.94-2.28 m tall in their JSON (crowd_08, 11, 23, 25, 27, 33). Far and near both
  clamp to 1.9 m, so they still match each other, but those models are out of proportion for the town; worth a look by people-gen.
- Thin black eyebrow cards look spiky up close (alpha test on brow cards).

## Pictures (`research/mh/trial/switch-2026-11-13/`)
`switch_sheet.jpg` all 36 bodies, far (62 m) left and near (58 m) right; `switch_04/05/06/23/27.png` full size (the failures and two
good ones); `before_v60_ped0.png` the v60 switch for comparison (different person, different hair, a far backpack that vanishes);
`crowd.png` 6-40 m; `street.png` people from 45 to 75 m, across the switch; `face.png` eyes; `test_mhchars.log` the run.

## Phones (2026-11-14)
Owner: "the way ppl hold phone is weird, doesnt make sense".

**What was wrong** (`research/mh/trial/phone/before_sheet.jpg`, `before_04.jpg`, `before_23.jpg`, `before_23_hand_eye.png`). A pedestrian with `act.phone` got three different things:
- Far figure (pedAct): right forearm raised in front, head bowed, the instanced phone at that hand. Reads as texting.
- Near, standing: the hidden UAL rig played `Idle_TalkingPhone_Loop` (phone to the ear) and chars.js put the phone box on the
  *hidden rig's* `hand_r`. The MakeHuman arm is a different length, so the box floated a hand's width off the drawn hand, beside
  the cheek or shoulder, while the open hand waved next to the face and the other hand gestured. Side on it looked like a black
  slab stuck in the neck.
- Near, walking: the walk clip has no phone pose, so the box swung by the thigh next to an empty hand.
- The box was 7 x 14 x 1.4 cm (twice a phone's thickness). The switch at 60 m went from texting to talking.

**What it does now** (all in mhchars.js, wrapping; clothes.js and chars.js untouched)
- A near MakeHuman person with a phone looks down at it, like the far figure: right upper arm down, forearm bent up across the
  front, palm turned up towards the eyes, fingers closed round the phone's edges, head bowed, standing or walking.
  Bones are aimed after the retarget each frame, and the pose blends in and out over a quarter second.
- Standing phone users run the idle clip instead of the talking-on-the-phone clip (`charAnim` wrapped), and `watch` (filming) does
  the same, so the left arm no longer gestures.
- The phone is its own instanced mesh placed on the drawn palm: 7 x 15 x 0.8 cm. The UAL rig's phone is hidden for anyone with a
  MakeHuman body. Far figures keep the instanced phone at their own hand.
- Palm and curl directions came from looking at all four sign choices (`signs.png`); the measured vectors alone were ambiguous.
- `test_mhchars` has a `phoneInHand` check: for 5 bodies standing and walking the phone is within 6 cm of the palm centre, at
  unit scale, the hand between 10 and 60 cm below the neck, and no rig phone. A far figure shows the instanced phone and no near phone.

**Phone model.** Picked from the Sketchfab API: "Free Low Poly Smartphone" by warcool, uid 55d79c84e0d34d62865025349a754629,
CC BY 4.0, 248 triangles, one texture, generic (no logo). Listed in `research/assets/sketchfab/phone_download.json` as 3100.
The integrator downloaded it to `research/assets/sketchfab/glb/3100.glb` (182 KB); `add_mhchars.py` embeds it when the file is
there and adds the credit, else mhchars.js draws the 7 x 15 x 0.8 cm box. mhchars.js turns the model's biggest mesh so its length is
y and its thickness z, stretches it to 7 x 15 x 0.8 cm, and keeps its colour and emissive (lit screen) textures. Checked by eye
(`after_model_closeups.jpg`, `after_model_23_hand_eye.png`): the screen faces the eyes, the home button is at the wrist, it sits
in the palm with the fingertips over its top edge, and the size matches the hand. `MH_PHONE_FLIP` stays false. It is bright cyan,
the model's own colour, and easy to spot.

**Also fixed.** The MakeHuman alignment was cached per sex, but one sex has several UAL rigs (re-rigged outfits with different
bone sets), and a test run crashed in `mhPose` on a bone the cached alignment had and this rig did not. It is now cached per rig
bone set.

**Verified on the final build, with the model.** test_mhchars: same three known failures (tops of crowd_04 and 06, height of crowd_05),
new `phoneInHand` passes. test_chars, test_react (twice), test_fight2 (on a rerun; the first run timed out loading the page), and
test_kick pass; test_people2 has only its known snow/coat failure. fps.mjs: 60.3 fps (Metal). Two builds are byte-identical. Page +182 KB.

**Still not right.** Thumbs stay where the clip puts them (the phone shows between thumb and fingers rather than under the thumb).
A person turning a corner keeps the same arm, and people who were talking with a phone stop gesturing.

## Credit text
Townsfolk made with MakeHuman (MPFB); clothes and hair CC BY: culturalibre, Elvaerwyn, Mindfront (Sweden), punkduck
(built from the JSON `credits` by `add_mhchars.py`; the CC0 assets need no credit).
Once the phone is downloaded: Phone: "Free Low Poly Smartphone" by warcool (CC BY 4.0), added by `add_mhchars.py`.
