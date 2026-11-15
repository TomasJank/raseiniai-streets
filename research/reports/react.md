# react: people answer back (2026-11-11)

Owner's request: "it would also be funny if i walk through people or hit them and they start talking to me like 'ka nori velnias?' 'tuoj prasileisi viena', 'issiusiu as tave i nameko planeta tuoj' ar kazka panasaus".

## What it does
On foot, when the player walks into a pedestrian (or jumps into one) or lands a punch or kick on one, that pedestrian snaps back with a short Lithuanian line. The line shows as a speech bubble over them and plays as a voice clip. A calm pedestrian stops and turns to face the player while saying it.

- **Bump:** the player comes within 0.6 m of a pedestrian's centre while moving towards them (|speed| > 0.5, heading towards them). The trigger re-arms once they are 1.2 m apart. If a pedestrian walks into a player who is standing still, nothing is said. Jumping counts because `jump` keeps `player.speed` set while he is in the air.
- **Hit:** wraps `dmgPed` (fight2). Every landed jab, cross or kick on a pedestrian goes through it; bouncers do not. The reaction runs after the hit has resolved, so a knocked-out victim (`mode==='down'`) stays silent. A victim who decides to fight back says a hit line as he squares up. A frail victim (kid, old person) says it during the stagger and keeps the bubble as they run off.
- **Facing:** while a line is up, a pedestrian in a calm mode (walk, idle, wait, stop, cross, goto, talk) turns to face the player. The walk modes are also held in place, with no edge change and no position change. People on a bench and people in a fight mode keep their own heading code.
- **Mid-conversation:** if the pedestrian is the speaker of a group line, that line and its clip are cut short (`voiceStop(g); g.say=0`). The group then holds its next line until the reaction has finished (`g.sw`). Afterwards the talk resumes normally.

## Cooldowns
| rule | number |
|---|---|
| one pedestrian, any line after a bump line | 6 s |
| a hit after that pedestrian's bump line | 1.5 s (a punch right after "Ką nori, velnias?" gets its answer) |
| a hit after that pedestrian's hit line | 6 s (only the first hit of a jab-cross-kick combo speaks) |
| escalation: a bump that is said within 30 s of their last bump | uses the `again` pool |
| reaction starts around the player | at most one per 1 s |
| the same line twice in a row | never (global; the last line is filtered out of the pool) |
| silent | `down`, `flee`, `cower`, `hide` |
| bubbles at once | 3, within 30 m of the camera |

Bubble time = max(1.2 + 0.07 × characters, clip length), the same formula dialogue uses.

## Lines (50; pipeline/react/lines.json)
Who speaks is decided by people2's `look`: kid; adult man; adult woman; old man; old woman. The male/female call is the same one `talkVoice` makes, so the pool always matches the voice.

### Bump
| who | line | gloss |
|---|---|---|
| kid | Ei! Mama, jis mane stumdo! | Hey! Mum, he's pushing me! |
| kid | Žiūrėk, kur eini, dėde! | Watch where you're going, mister! |
| kid | Ką, akių neturi? | What, got no eyes? |
| kid | Dėde, tu ką, aklas? | Mister, are you blind or what? |
| man | Ką nori, velnias? *(owner)* | What do you want, damn you? |
| man | Ei, ko stumdaisi? | Hey, what are you shoving for? |
| man | Brolau, tu ką, nematai? | Bro, can't you see? |
| man | Ko čia lendi, asile? | What are you barging in for, you donkey? |
| man | Ar tau gyvent nusibodo? | Are you tired of living? |
| woman | Ei! Atsiprašyt nemoki? | Hey! Don't you know how to say sorry? |
| woman | Kur tu žiūri, asile? | Where are you looking, you donkey? |
| woman | Nu žmogau, gatvė plati, o tu į mane. | Come on, man, the street's wide and you walk into me. |
| woman | Ar tu girtas, ar ką? | Are you drunk or what? |
| old man | Ką, gatvė per siaura? | What, is the street too narrow? |
| old man | Mano laikais už tokį dalyką per ausį gaudavai. | In my day you'd get a clip round the ear for that. |
| old man | Ir vėl koks prisigėręs. | Another drunk again. |
| old man | Lekia kaip į gaisrą, velnias. | Racing like he's off to a fire, the devil. |
| old woman | Jėzau Marija! Kur tu lendi? | Jesus, Mary! Where are you barging? |
| old woman | Nu jaunimas, nei atsiprašyt, nei nieko. | Young people: not a sorry, nothing. |
| old woman | Akių neturi, vaikeli? | Got no eyes, child? |
| old woman | Rupūže tu, vos manęs neparvertei! | You toad, you nearly knocked me over! |

### Again (a second bump from the same person)
| who | line | gloss |
|---|---|---|
| kid | Mama! Jis vėl! | Mum! He's doing it again! |
| kid | Pasakysiu tėčiui, jis tau parodys! | I'll tell my dad, he'll show you! |
| man | Tuoj prasileisi vieną. *(owner)* | You're about to catch one. |
| man | Išsiųsiu aš tave į Nameko planetą tuoj. *(owner)* | I'll send you to planet Namek in a second. |
| man | Dar kartą, ir skrisi iki pat Kauno. | Once more and you'll fly all the way to Kaunas. |
| man | Iš Nameko planetos pėsčiom grįši. | You'll be walking home from planet Namek. |
| woman | Dar kartą prisiliesi, ir vyrą pašauksiu. | Touch me once more and I'll call my husband. |
| woman | Tu man jau nusibodai, rupūže. | I'm sick of you already, you toad. |
| old man | Dar kartą, ir gausi lazda per nugarą. | Once more and you'll get my stick across your back. |
| old man | Aš armijoj tarnavau, matęs esu tokių kaip tu. | I served in the army, I've seen your sort. |
| old woman | Vėl tu? Tuoj gausi skėčiu per galvą! | You again? You'll get my umbrella over the head! |
| old woman | Policiją kviesiu, chuligane! | I'm calling the police, you hooligan! |

### Hit
| who | line | gloss |
|---|---|---|
| kid | Ai! Mama! | Ow! Mum! |
| kid | Ai! Viskas, pasakysiu mamai! | Ow! That's it, I'm telling mum! |
| kid | Tėti! Tėti, padėk! | Dad! Dad, help! |
| man | Duosiu tuoj malkų, draugams reikės drakono rutulius rinkt tavo. *(owner)* | I'll give you a beating in a moment, your friends will have to collect the dragon balls for you. |
| man | Ai! Nu tai dabar gausi! | Ow! Right, now you're going to get it! |
| man | Tu ką, velnias, gaut nori? Eik čia! | What, damn you, you want some? Come here! |
| man | Tuoj teks drakoną kviest, kad tave atgaivintų. | Someone will have to summon the dragon to bring you back. |
| man | Visus septynis drakono rutulius surinksi, kol atsigausi. | You'll have collected all seven dragon balls by the time you come round. |
| woman | Ai! Gyvulys tu! | Ow! You animal! |
| woman | Žmonės, kvieskit policiją! | People, call the police! |
| woman | Ai! Tuoj gausi rankine per galvą! | Ow! You'll get my handbag over the head! |
| old man | Ai, rupūže! Mano nugara! | Ow, you toad! My back! |
| old man | Chuliganai! Kur ta policija, kai reikia? | Hooligans! Where are the police when you need them? |
| old man | Ui! Kad tau rankos nudžiūtų! | Ouch! May your hands wither! |
| old woman | Gelbėkit! Žmonės, muša! | Help! People, he's hitting me! |
| old woman | Ai! Kad tave perkūnas nutrenktų! | Ow! May thunder strike you! |
| old woman | Kelti ranką prieš seną moterį? Gėda! | Raising your hand to an old woman? Shame! |

"Man" covers every adult man, so young and middle-aged men share the squaring-up and Dragon Ball lines.

## Voice
- `pipeline/react/clips.py` makes the clips with `pipeline/voice.py`'s own `make()` and `clip()`, into the same `work/voice/{sha1(voice+text)}.webm` cache, with the same edge-tts voices (`lt-LT-LeonasNeural` for men, `lt-LT-OnaNeural` for women) and the same 12 kbit/s Opus settings. Men's lines get only the male clip and women's lines only the female clip. Kids' lines get both, and the clip follows the kid's `look.male`, as it does in dialogue.
- `add_react.py` reads only the cache, so a build is deterministic. It merges the clips into the existing `rasVoice` block, using the same JSON serialisation as `add_voice.py`. A line without a cached clip still shows its bubble, and the step lists that line.
- Playback reuses `voiceInfo`, `voiceBuffer` and `soundAt`, with the same rate and per-person pitch jitter as `talkVoice`, and the same 40 m range. The clip stops if the speaker goes down or hides.
- **59 clips, 279,414 B of audio, 372,632 B as base64. The whole page grows by 383,406 B (13,245,536 to 13,628,942).**

## Anchors and edits
- `// ---------- boot ----------`: `const REACT_LINES=...` and `react.js` go in before it.
- The `rasVoice` JSON block is re-serialised with the new clips and lines added; existing entries are unchanged.
- The step wraps these functions by name: `updatePeople` (bump detection), `stepPed` (hold still and turn to face him), `dmgPed` (hit lines) and `pedBubbles` (draws its own 3 sprites, using `talkBubble` textures). People2's `stepPed` wrapper is kept, because react wraps whatever `stepPed` is at that point in the chain.
- **No existing function body is edited.**
- The step applies cleanly with `jump` both before and after it. The resulting pages are the same size (13,635,326 B).

## Gates (run 2026-11-11)
- `test_react` passed, all 14 checks, no page errors. It ran on `build.sh` plus react (chain without `jump`), on that page plus `add_jump.py` (twice), and on the final chain, which now ends in `jump`, plus react.
- `test_talk2`, `test_talk3`, `test_voice`, `test_fight2`, `test_kick`, `test_fixpeople` and `test_people2` passed. `test_jump` passed on a page with jump and react, in both orders.
- `test_talk` failed "4 nearby groups all get a bubble", and once also a "talk 60-80 m" timeout. The unmodified base fails the same checks in 2 of 3 runs. The player is in the car for that whole suite, and every react wrapper passes straight through unless a reaction is active, so this flake is not caused by react.
- One run of `test_react` on the jump page threw `Cannot read properties of undefined (reading 'duration')`, from a character clip lookup (`C[st.one].duration`). This happened once; the three runs since then passed.
- fps on Metal (M5 Pro, 1280×720): base 60.3 fps (2.27 s load); with react 60.3 fps (2.29 s load).
- Two builds are byte-identical.

## Files
`pipeline/react.js`, `pipeline/add_react.py`, `pipeline/react/lines.json`, `pipeline/react/clips.py`, `work/test_react.mjs`, `research/prototypes/characters/react/{bump,hit,sheet}.jpg`; 59 new clips in `work/voice/` (gitignored).

## Left open
- An adult man who is not `young` still gets the young-man lines. There is no separate pool for a middle-aged man.
- A pedestrian who walks into a player who is standing still says nothing.
- The Lithuanian was checked by reading it, not by a native listener. edge-tts may stress some words oddly ("asile", "rupūže", "Nameko"); nobody has listened to the clips here.
