# Before: 40 simulated conversations (current build, real pickTalk + tickGroups)

Seeded run of `harness/sim.mjs` (seed 777) on a build of `pipeline/build.sh` before this pass. Places cycle through the 14 street files and the shops/station/church/square labels, times 8/13/17/22, group types: strangers of 2 and 3, companions of 2 and 3 (a leader with followers), a parent with a kid, two strangers one of whom has a kid following. A/B/C = speaker, (m/f/kid) = who it is. Marks are a native reading.

Flagged: 33 of 40.

**1. Bokšto g., 8:00, strangers2**

    A (f) Parke krepšinį žaisim?
    B (m) Vakare, prie Vytauto Didžiojo.
    A (f) Pasiimk kamuolį.
    B (m) Mano nuleistas.
    A (f) Gerai, susimatysim.
    B (m) Iki, iki!

> ok

**2. Vytauto Didžiojo g., 8:00, companions2**

    A (f) Turistai vėl klausė apie tankų mūšį.
    B (f) Apie keturiasdešimt pirmus?
    A (f) Tą patį, prie Dubysos.
    B (f) Istorija, ką padarysi.
    A (f) Aha.
    B (f) Nu jo.

> PROBLEM: closer: two companions end on two murmurs (Aha. / Nu jo.); grammar: 'Apie keturiasdešimt pirmus?' has no noun and the wrong case

**3. Dubysos g., 8:00, strangers3**

    A (m) Prie šviesoforo vėl eilė iki pat Dariaus ir Girėno.
    B (m) Pusė valandos ir tos pačios mašinos.
    C (f) Taip, taip.
    A (m) O pėsčiom per penkias minutes būčiau mieste.
    B (m) Taip, bet krepšiai sunkūs.
    A (m) Na, bėgu.
    B (m) Iki!

> PROBLEM: logic: 'Pusė valandos ir tos pačios mašinos' says nothing; two pedestrians say 'on foot I'd be in town in five minutes' while on foot

**4. Gintaro g., 8:00, kid**

    A (m) Kas čia prie Aivaro vartų vėl stovi?
    B (kid) Draugai atvažiavo, visą vakarą muzika.
    A (m) Kad tik iki dvyliktos.
    B (kid) Jaunimas, ką padarysi.
    A (m) Nu jo.
    B (kid) Tikrai?

> PROBLEM: kid: the child answers with adult lines (Draugai atvažiavo..., Jaunimas, ką padarysi); closer ends on a question (Tikrai?)

**5. Vilniaus g., 8:00, companions3**

    A (f) Labas! Seniai matytas!
    B (m) Labas! Kaip gyveni?
    A (f) Po truputį. O tu?
    B (m) Visai gerai, dirbu.
    C (f) Aha.
    A (f) Tikrai?
    B (m) Nu jo.

> PROBLEM: context: 'Labas! Seniai matytas!' between two people walking together; gender: 'matytas' is masculine whoever is addressed; closer ends on 'Tikrai?' / 'Nu jo.'

**6. Kalno g., 8:00, strangers+kid**

    A (m) Kiek čia iki Kauno?
    B (m) Aštuoniasdešimt aštuoni, ženklas rodo.
    A (m) Tai dar spėsim prieš tamsą.
    A (m) Tikrai?
    B (m) Aha.

> PROBLEM: logic: pedestrians 88 km from Kaunas 'will make it before dark'; structure: A says two lines in a row (3-line script + goodbye); closer: strangers who part get murmurs instead of a goodbye because one has a kid following

**7. Kęstučio g., 13:00, strangers2**

    A (m) Rugsėjį į Šilines važiavai?
    B (f) Važiavau, kaip kasmet.
    A (m) Šiluvoj tiek žmonių buvo.
    B (f) Visa Lietuva suvažiuoja.
    A (m) Einu, manęs laukia.
    B (f) Sėkmės!

> PROBLEM: logic: the asker narrates the pilgrimage he just asked about (Šiluvoj tiek žmonių buvo)

**8. Maironio g., 13:00, companions2**

    A (m) Parke vėl lapus grėbia.
    B (f) Prie cerkvės jau švaru.
    A (m) Rudenį tai kasdien grėbt reiktų.
    A (m) Taip, taip.
    B (f) Aha.

> PROBLEM: season: leaf raking 'every day in autumn' heard in any month (the game uses the real month); structure: A speaks twice

**9. Stonų g., 13:00, strangers3**

    A (f) Sunkvežimiai nuo ryto zuja pro langus.
    B (f) Iš tų sandėlių prie Dariaus ir Girėno.
    C (m) Tikrai?
    A (f) Stiklai dreba.
    B (f) Užtat žmonėms darbo yra.
    C (m) Nu jo.
    A (f) Nu, laikykis.
    B (f) Tu irgi!

> PROBLEM: filler: 'Tikrai?' is a question nobody answers

**10. Birutės g., 13:00, kid**

    A (f) Anūkai atvažiuos per šventes?
    B (kid) Žadėjo. Pyragą kepsiu.
    A (f) Kokį?
    B (kid) Obuolių, aišku.
    A (f) Nu jo.
    B (kid) Taip, taip.

> PROBLEM: kid: a child is asked about grandchildren and answers 'Žadėjo. Pyragą kepsiu.'

**11. Vilniaus g., 13:00, companions3**

    A (f) Iš stoties į Vilnių kada?
    B (f) Rodos, aštuntą.
    A (f) Ilgai važiuot.
    B (f) Trys valandos, ne mažiau.
    C (m) Taip, taip.
    A (f) Aha.
    B (f) Tikrai?

> PROBLEM: closer: ends on a question (Tikrai?)

**12. Vytauto Didžiojo g., 13:00, strangers+kid**

    A (m) Žiūrėjai vakar Žalgirį?
    B (f) Žiūrėjau. Vos laimėjo.
    C (kid) Nu jo.
    A (m) Paskutinį kėlinį vos atsilaikė.
    B (f) Svarbu, kad laimėjo.
    A (m) Aha.
    B (f) Taip, taip.

> PROBLEM: closer: two strangers part with murmurs instead of a goodbye (a kid follows one of them)

**13. Žemaičių g., 17:00, strangers2**

    A (m) Kaimynas vėl tujas sodina palei tvorą.
    B (m) Jau ir taip kaip tvirtovė, nieko nesimato.
    A (m) Tai gal todėl ir sodina.
    A (m) Gerai, susimatysim.
    B (m) Iki, iki!

> PROBLEM: structure: A says two lines in a row

**14. Žvyryno g., 17:00, companions2**

    A (m) Į Maximą per Stoties eisi?
    B (f) Einu. Ko tau reikia?
    A (m) Duonos ir pieno, jei nesunku.
    A (m) Nu jo.
    B (f) Taip, taip.

> PROBLEM: context: 'Are you going to Maxima? What do you need?' between two people walking together; structure: A speaks twice

**15. V. Kudirkos g., 17:00, strangers3**

    A (m) Važiuoji į Kauną magistrale?
    B (f) Taip, valanda kelio.
    A (m) Ten vėl remontai.
    B (f) Tai anksčiau išvažiuosiu.
    A (m) Na, bėgu.
    B (f) Iki!

> ok

**16. Vytauto Didžiojo g., 17:00, kid**

    A (f) Girdėjai, kas atsidarė prie Kudirkos?
    B (kid) Ten, kur žuvies reklama ant sienos.
    A (f) Karpynė ta, per visą namo galą.
    A (f) Taip, taip.
    B (kid) Tikrai?

> PROBLEM: logic: three lines that do not answer each other (what opened / the fish ad / the hairdresser); kid answers; structure: A twice; closer ends on a question

**17. Sporto g., 17:00, companions3**

    A (m) Ką pirkai?
    B (m) Duonos ir pieno.
    A (m) Aš tik kavos užbėgau.
    B (m) Ten dabar akcija.
    A (m) Aha.
    B (m) Taip, taip.

> PROBLEM: logic: 'Ten dabar akcija.' has no referent

**18. Tiesos g., 17:00, strangers+kid**

    A (m) Per Vėlines kapinėse buvai?
    B (m) Buvau. Tiek žvakių, gražu.
    C (kid) Tikrai?
    A (m) Ir žmonių pilna.
    B (m) Visi savus aplankė.
    A (m) Nu jo.
    B (m) Taip, taip.

> PROBLEM: season: Vėlinės talk in any month; closer: strangers part with murmurs

**19. (off-street, near IKI Raseiniai), 22:00, strangers2**

    A (f) Einam prie tvenkinio pasivaikščiot?
    B (f) Prie Prūdo gatvės?
    A (f) Taip, ten ramu.
    B (f) Einam, tik apsirenk šilčiau.
    A (f) Einu, manęs laukia.
    B (f) Sėkmės!

> ok

**20. Turgaus g., 22:00, companions2**

    A (f) Vėlu jau.
    B (m) Nu, laikas namo.
    A (f) Palydėt?
    B (m) Nereikia, čia netoli.
    A (f) Taip, taip.
    B (m) Tikrai?

> PROBLEM: context: 'Shall I walk you home? No need' between two people who then keep walking together; closer ends on a question

**21. (off-street, near Raseinių autobusų stotis), 22:00, strangers3**

    A (f) Gal kašiuką palošiam pas Aivarą?
    B (m) Vėl? Praeitą kartą viską pralošiau.
    A (f) Šįkart atsilošim.
    B (m) Nu jo, žinom tuos atsilošimus.
    C (m) Nu jo.
    A (f) Nu, laikykis.
    B (m) Tu irgi!

> PROBLEM: word: 'kašiukas' is not a Lithuanian word

**22. Bokšto g., 22:00, kid**

    A (m) Ar šitas posūkis į Saulės gatvę?
    B (kid) Taip, už tų eglių.
    A (m) Tada sukam, kol saulė nenusileido.
    A (m) Tikrai?
    B (kid) Taip, taip.

> PROBLEM: time: 'before the sun sets' at 22:00; kid: a parent asks the child for directions; structure: A twice

**23. Vytauto Didžiojo g., 22:00, companions3**

    A (m) Rugsėjį į Šilines važiavai?
    B (m) Važiavau, kaip kasmet.
    A (m) Šiluvoj tiek žmonių buvo.
    B (m) Visa Lietuva suvažiuoja.
    A (m) Nu jo.
    B (m) Aha.

> ok

**24. Vilniaus g., 22:00, strangers+kid**

    A (f) Girdėjai, dar vieną šviesoforą pastatė?
    B (m) Antrą jau?
    C (kid) Tikrai?
    A (f) Trečią!
    B (m) Nu, didmiestis.
    A (f) Taip, taip.
    B (m) Nu jo.

> PROBLEM: filler: 'Tikrai?' straight after the question 'Antrą jau?'; closer: strangers part with murmurs

**25. Gintaro g., 8:00, strangers2**

    A (f) Kas čia prie Aivaro vartų vėl stovi?
    B (m) Draugai atvažiavo, visą vakarą muzika.
    A (f) Kad tik iki dvyliktos.
    B (m) Jaunimas, ką padarysi.
    A (f) Na, bėgu.
    B (m) Iki!

> ok

**26. Vilniaus g., 8:00, companions2**

    A (m) Kodėl tie turėklai prie šaligatvio tokie aukšti?
    B (f) Kad žmonės neperbėgtų per gatvę.
    A (m) Man jie labiau kaip suoliukai atrodo.
    B (f) Tik nesėsk, nes užsirauksi ant jų.
    A (m) Tikrai?
    B (f) Aha.

> PROBLEM: word: 'užsirauksi ant jų' means nothing; closer ends on a question

**27. Kalno g., 8:00, strangers3**

    A (f) Alyvos jau žydi prie tvoros.
    B (f) Kaip kasmet, gegužę.
    A (f) Reikės šakelę nusiskinti.
    A (f) Einu, manęs laukia.
    B (f) Sėkmės!

> PROBLEM: season: lilacs 'in bloom now, as every May' in November; structure: A twice

**28. Kęstučio g., 8:00, kid**

    A (m) Kur skubi?
    B (kid) Pas gydytoją.
    A (m) Kas atsitiko?
    B (kid) Nieko, tik patikrinimas.
    A (m) Tikrai?
    B (kid) Aha.

> PROBLEM: kid: a parent asks its own child 'Where are you rushing?' and the child is off to the doctor

**29. Maironio g., 8:00, companions3**

    A (m) Vilniaus gatvėj vėl kamštis.
    B (m) Raseiniuose kamštis? Juokauji.
    A (m) Trys mašinos prie šviesoforo.
    B (m) Nu tai jau kamštis.
    C (f) Nu jo.
    A (m) Aha.
    B (m) Taip, taip.

> ok

**30. Stonų g., 8:00, strangers+kid**

    A (m) Raseika prie Molynės vėl išsiliejo.
    B (f) Pavasarį visada taip.
    C (kid) Taip, taip.
    A (m) Rūsį užpylė?
    B (f) Dar ne, bet maišus jau prisipyliau.
    A (m) Tikrai?
    B (f) Nu jo.

> PROBLEM: season: the river 'flooded again, always in spring' in November; closer: strangers part with murmurs

**31. Birutės g., 13:00, strangers2**

    A (m) Gal pisam alaus?
    B (f) Dabar? Dar tik pietūs.
    A (m) Tai ir ką?
    B (f) Nu... vieną.
    A (m) Nu, laikykis.
    B (f) Tu irgi!

> PROBLEM: register: 'Gal pisam alaus?' is not how anyone says it

**32. Vilniaus g., 13:00, companions2**

    A (f) Einam prie tvenkinio pasivaikščiot?
    B (m) Prie Prūdo gatvės?
    A (f) Taip, ten ramu.
    B (m) Einam, tik apsirenk šilčiau.
    A (f) Nu jo.
    B (m) Taip, taip.

> ok

**33. Vytauto Didžiojo g., 13:00, strangers3**

    A (m) Kalno mokykloj dar mokaisi?
    B (f) Ne, jau gimnazijoj.
    C (m) Nu jo.
    A (m) Žemaičio?
    B (f) Taip, dvyliktoj klasėj.
    A (m) Nu, laikykis.
    B (f) Tu irgi!

> PROBLEM: logic: an adult asks another adult if they still go to primary school; 'Žemaičio?' names a gymnasium that is not on the map

**34. Žemaičių g., 13:00, kid**

    A (f) Labas! Seniai matytas!
    B (kid) Labas! Kaip gyveni?
    A (f) Po truputį. O tu?
    B (kid) Visai gerai, dirbu.
    A (f) Nu jo.
    B (kid) Tikrai?

> PROBLEM: kid: a parent greets its own child 'Long time no see' and the child says 'I'm working'

**35. Stoties g., 13:00, companions3**

    A (m) Rugsėjį į Šilines važiavai?
    B (f) Važiavau, kaip kasmet.
    A (m) Šiluvoj tiek žmonių buvo.
    B (f) Visa Lietuva suvažiuoja.
    A (m) Tikrai?
    B (f) Aha.

> PROBLEM: closer ends on a question

**36. V. Kudirkos g., 13:00, strangers+kid**

    A (m) Ko toks linksmas?
    B (f) Algą gavau.
    C (kid) Aha.
    A (m) Tai statai alų!
    B (f) Nu jau ne, ji jau baigėsi.
    A (m) Tikrai?
    B (f) Nu jo.

> PROBLEM: gender: 'Ko toks linksmas?' to a woman; clumsy: 'Nu jau ne, ji jau baigėsi'; closer: strangers part with murmurs

**37. Vytauto Didžiojo g., 17:00, strangers2**

    A (m) Einam per parką iki Žemaičio?
    B (m) Einam, paskui kebabų prie Vilniaus.
    A (m) Tu vis apie tuos kebabus.
    A (m) Nu, laikykis.
    B (m) Tu irgi!

> PROBLEM: structure: A says two lines in a row

**38. Sporto g., 17:00, companions2**

    A (m) Eisi sekmadienį į bažnyčią?
    B (m) Eisiu, į dešimtą.
    A (m) Tai ten ir susitiksim.
    A (m) Taip, taip.
    B (m) Aha.

> PROBLEM: structure: A says two lines in a row

**39. (off-street, near Norfa), 17:00, strangers3**

    A (m) Matei, kaip tas su Pasatu parkavosi?
    B (m) Per dvi vietas?
    C (m) Nu jo.
    A (m) Per tris!
    B (m) Nu, Pasatas.
    A (m) Na, bėgu.
    B (m) Iki!

> PROBLEM: filler: 'Nu jo.' straight after the question 'Per dvi vietas?'

**40. Vilniaus g., 17:00, kid**

    A (f) Ką tu, velnias, čia veiki?
    B (kid) Nu stoviu.
    A (f) Matau, kad stovi.
    B (kid) Tai ko klausi?
    A (f) Taip, taip.
    B (kid) Nu jo.

> PROBLEM: kid/register: a parent to its own child 'Ką tu, velnias, čia veiki?'
