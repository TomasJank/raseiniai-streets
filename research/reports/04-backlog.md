# Prioritised implementation backlog (after v40 + wave 2)

Ordered by expected player-visible impact per unit of effort. S = hours, M = a day, L = several days.

| # | Item | Impact | Effort | Owner model | Notes |
|---|---|---|---|---|---|
| 1 | Combat upgrade (kick, block, dodge, knockback, hitstop, AI windows) | very high | M | Sonnet (wave 2, running) | on the new clips; test_fight must stay green |
| 2 | Animal GLBs (dog, fox, deer; others as licensed) | high | M | Sonnet (wave 2, running) | credits for CC-BY in-game |
| 3 | Kick/wave/stoop clips on the shared skeleton | high (combat feel) | M | Sonnet | FBX2glTF path or UAL Pro |
| 4 | Faces and hair variety on mannequins (texture atlas for heads, 6-8 hair meshes) | high | M | Sonnet | the two bodies look same-ish up close |
| 5 | Wet roads + puddles in rain (grainShader specular) | medium-high | S | Sonnet | weather already exists |
| 6 | Sound pass: footsteps by surface, punches, ambient town/birds/wind, dog bark samples | medium | S-M | Sonnet + Haiku for CC0 sourcing | Kenney audio needs manual download |
| 7 | Street props from Kenney City Kit where procedural ones are weak (bus shelters, playground) | medium | M | Sonnet | asset pipeline exists; manual Kenney download |
| 8 | Sky horizon seam + fog colour from sky | medium | S | Sonnet | gfx.js only |
| 9 | N8AO swap (-1 ms/frame) | low-medium | S | Sonnet | optional |
| 10 | test_talk determinism (seed) | low (quality) | S | Haiku | test-only |
| 11 | Yellow cylinder investigation | low | S | Haiku | |
| 12 | Phone-path verification of all new flags | medium (reach) | S | Sonnet | needs a device |
| 13 | Head yaw / lean on mannequins (look-at) | medium | S | Sonnet | bone override after mixer update |
| 14 | Ragdoll-lite on knockdown (procedural settle on bones) | low-medium | M | Opus design, Sonnet impl | only if combat feel demands it |
| 15 | Interior glimpses through shop glazing at night | low | M | Sonnet | parallax interior trick |
| 16 | Save position/car/time of day | low | S | Sonnet | from last round's optional list |
