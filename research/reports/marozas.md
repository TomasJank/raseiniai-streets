# marozas: the player in an Adidas-style tracksuit (2026-11-11)

Owner: "mano personazas turetu buti marozas su adidas treningais". Step `marozas` (`pipeline/marozas.js` + `pipeline/add_marozas.py`) runs after `fixmoney`, the last step in `build.sh`. It needs fixgear.

## What the player wears

- Black (0x16171b) zip-up jacket and trousers. Three white stripes run down the outside of each sleeve, shoulder to wrist, and each leg, hip to ankle. A white zip line runs down the front. No logo, lettering or trefoil.
- White trainers with dark soles.
- A buzz cut: the outfit's hair mesh folds into the head, and the scalp above the hairline takes a dark stubble colour. Brows and eyes are kept. No hat.
- Young adult male build: the male `casual` outfit body.

## How

- The player always gets the male `casual` outfit (`PLAYER_LOOK.clo` is fixed) and fixed colours, so he looks the same on every load.
- The tracksuit is drawn in the outfit shader from each vertex's bind-pose position. Sleeve and leg axes come from the bind skeleton: in the T-pose an arm's top is the side that faces out once the arm hangs, and a leg's outside is its outer side. Stripes are skinned with the mesh, so they stay on the outside of the limbs as they bend.
- The T-shirt's bare forearms and neckline become jacket, and the belt becomes trousers.
- Only the player's own material is patched, through a `charPose` wrapper that marks the player's `clMake`. Pedestrians who roll the casual outfit in dark colours never get stripes, zip or buzz cut, so the tracksuit is **player-only**.
- No new mesh, texture or draw call: the player is still body plus face decal, 2 calls.

## Anchors

- `// ---------- boot ----------` gets marozas.js inserted before it.
- No existing function body is edited. Wrapped: `clMake`, `charPose`, `charTick`.
- `dress(PLAYER_I, …)` is called again from my block, which only changes the player's colours.

## Player states

- On foot: idle, walk, run, jab, cross, kick, guard/block and dodge (the dodge is a spine tilt on the same mesh), knocked down, getting up. All in `moves.jpg`; the test checks each pose.
- Drowning uses the same mannequin and clips (walk, sinking).
- Cars: entering and leaving is instant, and the game draws no driver. In a car the player is hidden (`personMesh.visible=false`), so there is nothing to dress there. `out_of_car.jpg` is the frame right after pressing E.
- The far instanced rig only draws the player before the outfits decode. It gets the black and white colours through `dress` but no stripes, which that rig cannot show.

## Gates

`work/test_marozas.mjs page.html [base.html]` (SwiftShader):
- playerOutfit: casual body, fixed colours, buzz cut on.
- stripesEveryPose: white pixels along each limb's projected bone segment, the player rendered alone on black. Left limbs are seen from the left, right limbs from the right (square-on, 45° ahead and behind, and from above). Covers idle, walk, run, jab, cross, kick, guard, down and getup; every limb has at least 12 pixels.
- pedestriansPlain: a dark casual pedestrian has no stripe pixels and not the player's shader.
- drawCalls: 2 for the player, the same as base.
- No page errors.

On the base page it fails playerOutfit and stripesEveryPose.

Other suite numbers are in the hand-back.

## What looks wrong

- From the chase camera (about 5 m behind) the stripes are 1-2 px wide. The leg stripes read; the sleeve stripes barely read from behind. I widened them from 0.8-1.0 cm to 1.1-1.5 cm; wider looked like piping.
- The back of the head fades from stubble to skin at the nape, which reads as a short fade.
- The jacket has no separate collar, so the collar edge was skipped. The zip line ends at the neckline.
- The trousers are the casual outfit's cut, slightly flared at the ankle; real trackies are cuffed.

## Files

`research/prototypes/characters/marozas/`: `standing.jpg` (front, left, back, right), `moves.jpg` (walk, run, jab, cross, kick, guard, down, getup), `out_of_car.jpg`, `chase_walk.jpg`, `chase_idle.jpg`, `before_chase_idle.jpg`.
