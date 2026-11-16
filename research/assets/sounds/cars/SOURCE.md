# Car sounds for the carsound step

Embedded by `pipeline/add_carsound.py` as `rasCarSnd`: mono 24 kHz Opus clips (engine loops 40 kbit/s, the rest 32 kbit/s) cut by `make.py` as `clips.json` says, written to `clips/` with `clips/meta.json`. The `.ogg` files (raw downloads in `raw/` and the cut clips) are gitignored like every raw asset; `make.py`, `clips.json` and `clips/meta.json` are tracked. Rebuild: download the files below into `raw/` (names as in the table), then `python3 make.py raw clips` (needs numpy) and `python3 make_audition.py`.

Every source is **CC0** (checked on each freesound page on 2026-11-15, plus the upstream file of the one derived clip). No attribution is required; the page's credit line says "Car sounds: freesound.org (CC0)" as a courtesy. freesound's original-file download needs a login, so the files are the site's public high-quality previews (Ogg Vorbis, about 192 kbit/s), fetched with curl from `https://cdn.freesound.org/previews/{id/1000}/{id}_{user id}-hq.ogg`. No account was used.

## Engines

| set | clips | source | author | file in raw/ | sha256 |
|---|---|---|---|---|---|
| p (game) | p_idle | 1985 Ford Escort Mk3, idling after a cold start, phone in the car, https://freesound.org/people/escortmarius/sounds/141458/ | escortmarius | fs141458_2527354.ogg | f3c5cb90128f2318ec5eac55dfaf5cdc92ac36a802f7f6854cab8e313185bded |
| p | p_1100 | same car, standing revs, https://freesound.org/people/escortmarius/sounds/141269/ | escortmarius | fs141269_2527354.ogg | 06a7cdcd0f8dbe5b94c9fb6c7dcc275e8766fcd8e812ebaedc48c156bbe22544 |
| p | p_1500, p_3500, p_4800, p_5600 | same car, full acceleration from a traffic light through five gears, https://freesound.org/people/escortmarius/sounds/141459/ | escortmarius | fs141459_2527354.ogg | 5c187077195e946582b3b0c2b2fe4f5eda6cbb95e327bc8da050be82d9c27b00 |
| p | p_1900 | same car, town driving, https://freesound.org/people/escortmarius/sounds/141267/ | escortmarius | fs141267_2527354.ogg | 29a7ec151749ebe929261cd90c79ff872ca28b17fe7fba09525478f0060f2ca9 |
| p | p_2500, p_3000, p_4100, p_c2300, p_c2800, p_c3600 | same car, motorway driving, https://freesound.org/people/escortmarius/sounds/141266/ | escortmarius | fs141266_2527354.ogg | 926e28a61c61f46e353081c38f5bc4b794b296e94dfc918a92a0415c4b9bc84b |
| q (audition only) | q_* | Peugeot 404 Injection driving, three mics mixed, https://freesound.org/people/Sadiquecat/sounds/647561/ | Sadiquecat | fs647561_5287430.ogg | 937c88138eb713e5cab52535ab60265217a74e815543405bcb8710ec4bffe3ab |
| d (game) | d_* | VW New Beetle TDI (1.9 TDI) start, idle and held revs, https://freesound.org/people/Evilmikie/sounds/448217/ | Evilmikie | fs448217_8690770.ogg | 4ab1e9771719d10c2e80f0cc9f273e0e3d8d9744bb364991dc6c168db806dd57 |

Clip names carry the measured rpm (firing frequency x 30 for a four-cylinder; `meta.json` has the exact value), `c` = coasting. Engines `escortmarius/141526`, `141527`, `141530` and `141534` on the same account are a Formula Ford, not the Escort, and are not used.

## Other sounds

| clip | source | author | file in raw/ | sha256 |
|---|---|---|---|---|
| start_p, stop_p | Chevrolet Lacetti 1.4, interior, start and stop, https://freesound.org/people/AlexanderChe/sounds/362944/ | AlexanderChe | fs362944_6598647.ogg | fc9db08280775ff5587bc61810210decfbcac1170cacc30aaa034cebde9b1551 |
| start_d | Mercedes diesel start, outside, https://freesound.org/people/PITFACTORY/sounds/213729/ | PITFACTORY | fs213729_4000697.ogg | bded8c29b11134997675179899104e5d9c174a4a9bd1b5dd498a9654ab3867b0 |
| door_open, door_close | car door open and close, https://freesound.org/people/NachtmahrTV/sounds/556691/ | NachtmahrTV | fs556691_5620304.ogg | fd32c106c56bb53ce3442aaaec9a9ceb3b046356561363931fe86299fa33e8be |
| handbrake | handbrake applied from inside, https://freesound.org/people/greatsoundstube/sounds/629323/ | greatsoundstube | fs629323_13885154.ogg | 8362f8a4a65ce33baec63586efd438ebfdfc358ec7ccb53007700c556bd6e8e6 |
| horn | 2008 Fiat Panda horn from inside, https://freesound.org/people/misperpodcast/sounds/733553/ | misperpodcast | fs733553_15877364.ogg | 57acadcd0ceae116949ffac4313af891b767268d173deef13b8b7a1a41d3fb58 |
| squeal | 1996 Chrysler LHS tyre squeal 2 of 4, https://freesound.org/people/audible-edge/sounds/71737/ | audible-edge | fs71737_995351.ogg | a2fd2f294c1adafc99e9f487d675ffaaef30e71c235e77d81105d426b992d02e |
| crash_big | layered car crash (metal cabinet, grit, broken glass), https://freesound.org/people/squareal/sounds/237375/ | squareal | fs237375_1502374.ogg | 37ae23c264a02eda12d0539a215efb1223a77ad8f0cfe5727a1cfda62e0ad5aa |
| crash_small | "Clank Car Crash Collision", https://freesound.org/people/qubodup/sounds/151624/ (made from https://freesound.org/people/sagetyrtle/sounds/40158/, also CC0) | qubodup | fs151624_71257.ogg | 7dae26f7a5a8a9e0c2e9efe6bcc8c82b10e5b1820927b8a4a5787f721dd73d02 |
| glass | "Hard Glass Break 3", https://freesound.org/people/ElevatorFan2020/sounds/861044/ | ElevatorFan2020 | fs861044_14269391.ogg | 4bf8257b2c903fae9da8506fac30af633a611004a8f6b78f28097ee4441bbc3e |
| siren | Whelen wail, miked at the siren box, https://freesound.org/people/Jefflix/sounds/157867/ | Jefflix | fs157867_2859370.ogg | 8cae00642eebbc009868e822ee0448aa5f5c25a2484d939d14018d4e280f77d6 |
| bump | a car over a speed bump, Helsinki, https://freesound.org/people/menfa/sounds/837875/ | menfa | fs837875_13669249.ogg | 241c50b2e6677c83dbeb50036430f600ed992c7f0a74b3fe953d48ae10f95d5f |

Not used: the Escort's turn-signal relay (`escortmarius/240127`, `240128`) is CC BY 4.0 and the game has no indicators.
