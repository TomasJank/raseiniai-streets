# Blender and AI tools: where they fit

Written 2026-11-12 after a conversation with Tomas. Nothing here is decided or started; it records ideas to pick up later.

## Blender

The map stays code-built. Python scripts turn OpenStreetMap, GRPK, lidar and orthophoto data into the town, and one command rebuilds it. Moving the map into Blender would lose that, lose the link to the real footprints, and grow the page.

Use Blender as a workshop for single models that the code then places:

- **Landmarks.** The church, the bus station, a monument, Norfa, Maxima. The code can only make boxes with roofs; a few real models would make the town read as Raseiniai.
- **Cleaning downloaded and generated models.** Cutting triangle counts, fixing fused wheels, shrinking textures. The detailed Sketchfab cars and any generated buildings need this step.
- **Street props.** Benches, bus shelters, kiosks, signs: modelled once, placed many times by the code.

Blender is already scripted for the people (`research/mh/scripts/sheet.py`, MakeHuman/MPFB). Reuse that headless pattern.

## AI tools worth trying

- **Voices, sound effects, music (ElevenLabs).** The biggest gap. Today's clips are free Edge voices, unchecked for pronunciation, and everyone sounds alike. Test five Lithuanian lines on the free plan first. Free plan about 10,000 credits a month; Starter about $6 a month for 30,000. All current lines are roughly 25,000 characters (estimate). Sound effects and music use credits at a different rate, not looked up.
- **Photo to 3D (Meshy, or free Hunyuan3D / TRELLIS demos).** For the 5 to 10 buildings specific to Raseiniai, from real photos of the town. Meshy's free plan is 100 credits a month, 10 to 30 credits a model, CC BY 4.0 with credit. Pro about $20 a month.
- **Image generation, for flat things only.** Shop signs, posters, billboards, facade and ground textures, a loading screen.

Prices are from third-party sites checked 2026-11-12 and did not fully agree; confirm on elevenlabs.io/pricing and meshy.ai/pricing before paying.

## Not worth it

- Generated cars (wobbly panels, fused wheels; the Sketchfab picks are better).
- Generated people (static; the MakeHuman ones are rigged).
- Generated ordinary houses (they will not match the real plots).

## Costs to remember

- The page is about 25 MB. Every added model must be reduced first.
- Generated textures have light and shadow painted in, which is what broke the car repaint.
- The repo is public, so free-tier licences (CC BY, public output) need a credit line and a check.
