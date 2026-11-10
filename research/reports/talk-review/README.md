# talk-review: "some of the conversations still don't make sense"

Content pass over every pedestrian dialogue. The fix-talk round had already ruled out sequencing bugs, so this pass looked at what is said, who says it, and whether it fits the place and time.

Files in this folder
- `lines.tsv`: every line before the fix (set, tag, strangers-only flag, script, line, speaker A/B/C, text, question mark, verdict kept/changed). `lines-after.tsv` is the same table after the fix.
- `before.md`: 40 simulated conversations on the current build, each marked ok or PROBLEM with the reason.
- `after.md`: 20 simulated conversations after the fix.
- `harness/`: `sim.mjs` (Playwright, real `pickTalk` + `tickGroups`, seeded), `build2.sh` (scratch copy of build.sh with the new step), `flavour_new.py` + `apply_flavour.py` (how the street JSONs were rewritten: only the `flavour` array changes, the rest of each file stays byte-identical), `tsv.py`, `notes.py`.

## Integrator: one build.sh change
Insert `fixtalk2` after `streets` and before `voice`:

    for s in importmap cars solid talk fight people2 animals streets fixtalk2 voice assets ...

New files: `pipeline/add_fixtalk2.py`, `pipeline/fix_talk2.js`. It keeps every anchor the later `fixtalk` step replaces (`const bye=pick(TALK_BYE);`, `pick(TALK_HM)`, `talkRecent=[k,...talkRecent].slice(0,8)`, the pedIdle `startTalk(` prefix), so `fixtalk` still applies after it. The clips for all new text are already cached in `work/voice`. Even before build.sh is changed, the new street flavour is voiced, because it comes in through `streets`.

## Counts
| | before | after |
|---|---|---|
| base scripts (TALKS) | 46 | 51 (incl. 5 new kid scripts) |
| street flavour scripts | 75 in 14 files | 67 |
| goodbye pairs / companion closers / fillers | 4 / (2 random fillers) / 4 | 4 / 4 pairs / 4 |
| line slots, unique texts | 459, 458 | 454, 454 |
| lines without a voice clip in the build | 80 (all street flavour, silent) | 0 |

Lines changed: 165 of the 459 old line slots changed text or tag, or were dropped with their script. That is 39 in TALKS (24 scripts; 5 of them are tag-only moves to `cold`/`nov`/`day`), 124 in street flavour, 1 goodbye and 1 filler. There are 160 new texts, including 20 kid lines and 8 companion closers. In the 40-conversation sample, 33 had at least one problem (`before.md`).

## Problems by category (before → after)
1. **Kids spoke adult lines.** When a parent stopped with its kid, any script could come up, and the kid took B's part. Examples: parent "Labas! Seniai matytas!" → kid "Visai gerai, dirbu."; kid "Žadėjo. Pyragą kepsiu."; parent to kid "Ką tu, velnias, čia veiki?". → There are 5 parent/kid scripts (`kid` tag), picked only when the kid is the second speaker, and the kid never gets anything else: "Pavargai? / Kojos skauda. / Dar truputį, jau beveik namie. / Paimk ant rankų." When a leader has an adult follower and a kid follower, the adult now speaks and the kid only adds fillers.
2. **Closers did not fit.** Companions closed with two random fillers, often ending on a question ("Tikrai?" / "Aha.", "Taip, taip." / "Tikrai?"). Two strangers parting were treated as companions and got no goodbye when one of them had a kid following, because the check was `mem.some(q=>q.lead)`. → Companions, meaning everyone else follows the first speaker, close with a new "let's go" pair (`TALK_GO`: "Nu ką, einam? / Einam.", "Gerai, judam toliau. / Judam.", "Ko čia stovim? Eime. / Eime, eime.", "Nu, pajudam. / Pajudam."). Strangers always say goodbye. "Einu, manęs laukia." → "Einu, manęs namie laukia.".
3. **One person said two lines in a row.** 41 of 121 scripts have an odd number of lines, so A said the last line and then the goodbye too ("Tai dar spėsim prieš tamsą." / "Tikrai?" from the same mouth). This happened in 9 of the 40 sample conversations. → The closing pair now starts with whoever did not say the last line.
4. **Fillers answered questions.** "Antrą jau?" → kid: "Tikrai?"; "Per dvi vietas?" → "Nu jo."; "Kada?" → "Aha.". → A filler only follows a statement. The question filler "Tikrai?", which nobody ever answered, is now "Va kaip.".
5. **Meeting talk between people walking together.** "Labas! Seniai matytas!", "Kur skubi?", "Palydėt? / Nereikia, čia netoli.", "Vėl iš klubo?", "Girdėjau, naują darbą radai?", "Ką tu, velnias, čia veiki?" came up between companions. → These 6 are marked strangers-only (third element `1`).
6. **Gender.** Each speaker's voice is a random man or woman, so gendered words broke. → They were rewritten neutral: "Seniai matytas!" → "Seniai nesimatėm!", "Pati nebesuprantu." → "Nieko ten nebesuprantu.", "Lapkritį? Drąsus." → "Tu? Dviračiu?", "Tu man dar penkis skolingas." → "Dar penkių neatidavei.", "Ko toks linksmas?" → "Ko čia šypsaisi?", "Žmona paėmė." → "Sūnus paėmė.", "Pats pasiimsi" → "Kojas turi, nueisi.", "Tai eik pėsčias" → "pėsčiom", "Tu? Pėsčias?" → "Tu? Pėsčiom?".
7. **Time and season contradictions.** The game uses the real month and has weather. Before → after: "Trečią nakties?" at 21:00 → "Tokiu laiku?"; "Dabar? Dar tik pietūs." at any hour → `day` tag + "Dar net ne vakaras."; "Tada sukam, kol saulė nenusileido." at 22:00 → "Ačiū, jau maniau, kad pasiklydau."; "Ar BENU dar atidaryta? / Iki šešių, spėsi." at night → "BENU rytoj dirba? / Dirba, nuo aštuonių."; "Alyvos jau žydi... Kaip kasmet, gegužę." in November → "Gražios alyvos... Gegužę žydės..."; "Lapkritis, ką tu nori." all year → `cold` tag (below 6 °C, not snowing) + "Ką tu nori, ne vasara."; Vėlinės → `nov` tag. Snow lines when there is no snow ("Prie Maironio vėl balta nuo sniego", "Ar jau valė sniegą") were replaced or removed. Also replaced: "Raseika vėl išsiliejo. Pavasarį visada taip." → "pavasarį vėl išsilies"; tujas "po Žolinės" (August) was removed; "šitam šalty" / "Šalta stovėt" were made neutral.
8. **Question and answer did not fit, or the logic was off.** "Gimnazijoj penktadienį koncertas. / Kada?" → "Kelintą?"; "Šiluvoj tiek žmonių buvo." (the asker narrating the trip) → "Daug žmonių buvo?"; "Kalno mokykloj dar mokaisi?" (one adult to another) → "Tavo mažasis dar Kalno mokykloj? / Ne, jau gimnazijoj. / Tai jau nebe mažasis."; "Ten dabar akcija." → "Kava dabar akcijoj."; "Neturiu spaudimo." (pressure) → "Neturiu sulčiaspaudės."; firewood is dearer, so "prie radiatoriaus sėdėsim" → "Tai žiemą su dviem megztiniais."; "not a blue zone / ant ženklo tik sustoti draudžiama" → "Gerai, o tai jau automato ieškojau."; pedestrians "88 km to Kaunas, we'll make it before dark" → "Tai pėsčiom gal neisim."; walkers saying "let's drive too" → "Tai ko mes čia tada einam."; "Jei picerija dirbs, eisiu" (to L klubas) → "Eisiu, jei kas eis kartu."; "Tik nesėsk, nes užsirauksi ant jų" (no meaning) → script removed; "what opened by Kudirkos / the fish ad / the hairdresser" (no answer) → removed. Stonų had two scripts that contradicted each other (the pavement is being dug until summer / the pavement is done) → the second was removed. Scripts that ended on a question the closer then ignored ("Tai ko klausi?") → "Tai ir neklausk.".
9. **Translated or guidebook phrasing.** "Bokšto gatvė jau už miesto, kur asfaltas baigiasi lauku." → "Čia jau beveik kaimas."; "Pas Kalno gatvės gyventojus visada paparčiai prie tvoros." → "Kaimynų paparčiai vėl per tvorą lenda. / O pas mane tik dilgėlės auga. / Tai ateik, prikasiu tau."; "Tie medžiai pakelėj seni kaip pati gatvė." → "Tos liepos pakelėj senesnės už mus."; "Mūsų krašte drožėjų netrūksta." → "Žemaitijoj drožėjų netrūksta."; "Rinkliavą už stovėjimą ... mokėjai?" → "Prie Jozitos už stovėjimą reikia mokėt?"; "Tai sveikinimai jam." → "Tai pasveikink nuo manęs."; "Ką ta tavo mašina?" → "Kaip tavo mašina?"; "Gal kašiuką palošiam" → "Gal kortom palošiam"; "Gal pisam alaus?" → "Gal trenkiam po bokalą?". The house descriptions (silicate bricks and a dark tile roof, a "white box" culture centre, yellow wooden houses "from another time") were replaced or dropped.
10. **Wrong place name.** "Joseda" on Maironio g.: the shop there in the game data is "Jozita". The other places named in flavour were checked against the map labels and street names (Prūdo g., Saulės g., Molynės g., Pieninės g., Swedbank by the square, BENU and the cerkvė on Vytauto Didžiojo, the station near Vilniaus g., Moki-veži and the komisariatas by Maironio/Vaižganto, the katilinė on Žemaičių).

Kept on purpose: the jokes that worked ("Nu, Pasatas.", "Trys mašinos prie šviesoforo. / Nu tai jau kamštis.", "Aš visada penkiasdešimt. / Nu jo, mačiau aš tave.", "Ne, iš bibliotekos."), every real place, and the street-specific gossip. Each street still has 3 to 6 talks.

## Logic in fix_talk2.js (small)
- `talkFits(t,mem)`: kid scripts if and only if the second speaker is a kid; strangers-only scripts never for companions. The pool also keeps a `fit` list, so the fallback when every fitting script is recent picks among fitting scripts instead of any script.
- New tags in `pickTalk`: `kid`, `cold`, `nov`.
- A filler is never inserted after a line ending in `?`.
- Closing pair: starts with the other speaker; companions (`talkComp`: everyone follows `mem[0]`) get `TALK_GO`. The later `fixtalk` step turns the goodbye call into `pickBye(mem.some(q=>q.lead),out)`, so `fix_talk2` sets `mem=[]` just before it. Companions have already returned at that point, which leaves only strangers. Goodbye rotation from `fixtalk` is unchanged.
- In `pedIdle`, an adult follower is sorted ahead of a kid follower.

## Proof
- `work/test_talk3.mjs page.html` (full build with fixtalk2). On 1400 `pickTalk` calls across 7 group kinds, all streets and labels, 6 times of day, 3 temperatures, 3 weathers and police heat, plus 14 real conversations through `tickGroups`, it checks: every tag resolves; 2 to 6 lines with no question at the end; no repeated line; fillers and closers are statements; speakers alternate, closing pair included; no filler after a question; strangers end with a goodbye pair; companions and a parent with a kid end with a let's-go pair; kid talks if and only if the kid is the second speaker; no meeting talk for companions; every tag gets picked; nobody speaks twice in a row in a real run; every one of the 454 lines has a clip in both voices; no page errors; it then runs `test_talk2`. Result: **all passed**.
- `work/test_talk2.mjs`: all passed. `work/test_talk.mjs`: all passed. `work/test_streets.mjs`: PASS for all 14 streets. `add_streets.py --check`: ok for every file.

## Voice clips
`voice.py` ran on the page with fixtalk2 applied (edge-tts, lt-LT Ona and Leonas) and made 326 clips (163 texts × 2 voices, 3 runs as wording settled; the few orphaned clips in the cache are harmless). The full build: `add_voice.py` reports `454 lines, 908 clips`, with **0 lines missing a clip**. The current build leaves 80 street lines silent.
