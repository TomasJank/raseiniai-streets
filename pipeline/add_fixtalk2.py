"""Dialogue content pass: lines that were not natural Lithuanian, answers that did not fit their question, adult lines given
to kids, greetings between people who walk together, fillers after questions, a speaker saying two lines in a row.
Street flavour is fixed in pipeline/streets/*.json; this step fixes the base TALKS, TALK_BYE and TALK_HM.

usage: add_fixtalk2.py page.html   (edits in place; after `streets`, before `voice`, so voice.py makes clips for new text)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_talk2.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


# (old script entry, new one); a trailing 1 marks a talk only strangers have (fix_talk2.js talkFits)
FIX = [
    ("['',['Labas! Seniai matytas!','Labas! Kaip gyveni?','Po truputį. O tu?','Visai gerai, dirbu.']]",
     "['',['Labas! Seniai nesimatėm!','Labas! Kaip gyveni?','Po truputį. O tu?','Nieko, dirbu.'],1]"),
    ("['shop',['Ką pirkai?','Duonos ir pieno.','Aš tik kavos užbėgau.','Ten dabar akcija.']]",
     "['shop',['Ką pirkai?','Duonos ir pieno.','Aš tik kavos užbėgau.','Kava dabar akcijoj.']]"),
    ("['stop',['Kada autobusas į Kauną?','Rodos, po dvidešimt minučių.','Dar spėsiu kavos išgert.']]",
     "['stop',['Kada autobusas į Kauną?','Rodos, po dvidešimt minučių.','Dar spėsiu kavos išgert.','Spėsi, jis vis tiek vėluos.']]"),
    ("['',['Šalta šiandien.','Lapkritis, ką tu nori.','Kad bent sniego būtų.','Dar pasnigs, pamatysi.']]",
     "['cold',['Šalta šiandien.','Ką tu nori, ne vasara.','Kad bent sniego būtų.','Dar pasnigs, pamatysi.']]"),
    ("['day',['Kaip vaikams mokykloj?','Gerai, tik namų darbų daug.','Mūsų irgi. Ta matematika...','Pati nebesuprantu.']]",
     "['day',['Kaip vaikams mokykloj?','Gerai, tik namų darbų daug.','Mūsų irgi. Ta matematika...','Nieko ten nebesuprantu.']]"),
    ("['',['Girdėjau, naują darbą radai?','Taip, Kaune. Kasdien važinėju.','Toli gi.','Bet moka geriau.']]",
     "['',['Girdėjau, naują darbą radai?','Taip, Kaune. Kasdien važinėju.','Toli gi.','Bet moka geriau.'],1]"),
    ("['',['Degalai vėl pabrango.','Dviračiu važinėsiu.','Lapkritį? Drąsus.','Arba pėsčiom.']]",
     "['',['Degalai vėl pabrango.','Dviračiu važinėsiu.','Tu? Dviračiu?','Nu tai pėsčiom.']]"),
    ("['',['Ką ta tavo mašina?','Vėl servise. Pasatas sensta.','Tai gal Zafirą pirk.','Juokauji? Dar blogiau.']]",
     "['',['Kaip tavo mašina?','Vėl servise. Pasatas sensta.','Tai gal Zafirą pirk.','Juokauji? Dar blogiau.']]"),
    ("['night',['Vėlu jau.','Nu, laikas namo.','Palydėt?','Nereikia, čia netoli.']]",
     "['night',['Vėlu jau.','Nu, laikas namo.','Palydėt?','Nereikia, čia netoli.'],1]"),
    ("['',['Girdėjai apie Petrą?','Ne, o kas?','Vedė! Rugsėjį.','Tai sveikinimai jam.']]",
     "['',['Girdėjai apie Petrą?','Ne, o kas?','Vedė! Rugsėjį.','Tai pasveikink nuo manęs.']]"),
    ("['',['Kur skubi?','Pas gydytoją.','Kas atsitiko?','Nieko, tik patikrinimas.']]",
     "['',['Kur skubi?','Pas gydytoją.','Kas atsitiko?','Nieko, tik patikrinimas.'],1]"),
    ("['day',['Gimnazijoj penktadienį koncertas.','Kada?','Šeštą vakaro.','Ateisim su vaikais.']]",
     "['day',['Gimnazijoj penktadienį koncertas.','Kelintą?','Šeštą vakaro.','Ateisim su vaikais.']]"),
    ("['',['Per Vėlines kapinėse buvai?','Buvau. Tiek žvakių, gražu.','Ir žmonių pilna.','Visi savus aplankė.']]",
     "['nov',['Per Vėlines kapinėse buvai?','Buvau. Tiek žvakių, gražu.','Ir žmonių pilna.','Visi savus aplankė.']]"),
    ("['',['Turistai vėl klausė apie tankų mūšį.','Apie keturiasdešimt pirmus?','Tą patį, prie Dubysos.','Istorija, ką padarysi.']]",
     "['',['Turistai vėl klausė apie tankų mūšį.','Tą, keturiasdešimt pirmų metų?','Tą patį, prie Dubysos.','Istorija, ką padarysi.']]"),
    ("['',['Rugsėjį į Šilines važiavai?','Važiavau, kaip kasmet.','Šiluvoj tiek žmonių buvo.','Visa Lietuva suvažiuoja.']]",
     "['',['Rugsėjį į Šilines važiavai?','Važiavau, kaip kasmet.','Daug žmonių buvo?','Visa Lietuva suvažiavo.']]"),
    ("['',['Žemaitis vėl su balandžiais.','Kiekvieną dieną jie ten.','Kas nors kepurę jam uždėtų.','Šalta gi žmogui.']]",
     "['cold',['Žemaitis vėl su balandžiais.','Kiekvieną dieną jie ten.','Kas nors kepurę jam uždėtų.','Šalta gi žmogui.']]"),
    ("['day',['Kalno mokykloj dar mokaisi?','Ne, jau gimnazijoj.','Žemaičio?','Taip, dvyliktoj klasėj.']]",
     "['',['Tavo mažasis dar Kalno mokykloj?','Ne, jau gimnazijoj.','Tai jau nebe mažasis.','Dvyliktoj klasėj jau.']]"),
    ("['',['Gal pisam alaus?','Dabar? Dar tik pietūs.','Tai ir ką?','Nu... vieną.']]",
     "['day',['Gal trenkiam po bokalą?','Dabar? Dar net ne vakaras.','Tai ir ką?','Nu... vieną.']]"),
    ("['night',['Gal kašiuką palošiam pas Aivarą?','Vėl? Praeitą kartą viską pralošiau.','Šįkart atsilošim.','Nu jo, žinom tuos atsilošimus.']]",
     "['night',['Gal kortom palošiam pas Aivarą?','Vėl? Praeitą kartą viską pralošiau.','Šįkart atsilošim.','Nu jo, žinom tuos atsilošimus.']]"),
    ("['',['Ką tu, velnias, čia veiki?','Nu stoviu.','Matau, kad stovi.','Tai ko klausi?']]",
     "['',['Ką tu, velnias, čia veiki?','Nu stoviu.','Matau, kad stovi.','Tai ir neklausk.'],1]"),
    ("['',['Paskolink dešimt eurų.','Tu man dar penkis skolingas.','Tai bus penkiolika.','Ką tu, velnias...']]",
     "['',['Paskolink dešimt eurų.','Dar penkių neatidavei.','Tai bus penkiolika.','Ką tu, velnias...']]"),
    ("['night',['Vėl iš klubo?','Ne, iš bibliotekos.','Trečią nakties?','Daug skaityt reikėjo.']]",
     "['night',['Vėl iš klubo?','Ne, iš bibliotekos.','Tokiu laiku?','Daug skaityt reikėjo.'],1]"),
    ("['',['Ko toks linksmas?','Algą gavau.','Tai statai alų!','Nu jau ne, ji jau baigėsi.']]",
     "['',['Ko čia šypsaisi?','Algą gavau.','Tai statai alų!','Ką tu, jos jau nebėra.']]"),
    ("['',['Kur tavo mašina?','Žmona paėmė.','Tai kaip dabar?','Pėsčiom, kaip senais laikais.']]",
     "['',['Kur tavo mašina?','Sūnus paėmė.','Tai kaip dabar?','Pėsčiom, kaip senais laikais.']]"),
]
for a, b in FIX:
    rep(a, b)

# a parent and the kid walking with it (A = the adult, B = the kid); only picked when the kid is the second speaker
KID = """['kid',['Pavargai?','Kojos skauda.','Dar truputį, jau beveik namie.','Paimk ant rankų.']],
['kid',['Duok ranką, eisim per gatvę.','Aš jau ne darželyje.','Vis tiek duok.','Gerai jau, gerai.']],
['kid',['Ko tyli?','Galvoju.','Apie ką?','Ar nupirksi ledų.']],
['kid',['Kaip mokykloj sekasi?','Normaliai.','O pažymiai?','Irgi normaliai.']],
['kid',['Nebėk prie kelio!','Aš tik į balą.','Batai bus šlapi.','Jie jau šlapi.']],
"""
rep("const TALKS=[\n", "const TALKS=[\n" + KID)
rep("['Einu, manęs laukia.','Sėkmės!']],", "['Einu, manęs namie laukia.','Sėkmės!']],\n"
    "TALK_GO=[['Nu ką, einam?','Einam.'],['Gerai, judam toliau.','Judam.'],['Ko čia stovim? Eime.','Eime, eime.'],['Nu, pajudam.','Pajudam.']],")
rep("TALK_HM=['Aha.','Tikrai?','Nu jo.','Taip, taip.'];", "TALK_HM=['Aha.','Va kaip.','Nu jo.','Taip, taip.'];")

rep("let talkRecent=[];", "let talkRecent=[];\n" + js)
rep("'':1,day:tod>=6&&tod<20",
    "'':1,kid:1,cold:(weather.temp??MONTH_T[new Date().getMonth()])<6&&weather.kind!=='snow',nov:new Date().getMonth()===10,day:tod>=6&&tod<20")
rep("const pool=[];TALKS.forEach((t,k)=>{if(tag[t[0]]&&!talkRecent.includes(k))for(let w=t[0]?4:1;w--;)pool.push(k);});",
    "const pool=[],fit=[];TALKS.forEach((t,k)=>{if(tag[t[0]]&&talkFits(t,mem)){fit.push(k);if(!talkRecent.includes(k))for(let w=t[0]?4:1;w--;)pool.push(k);}});")
rep("pool.length?pick(pool):Math.floor(Math.random()*TALKS.length)", "pool.length?pick(pool):pick(fit)")
rep("if(mem.length>2&&i&1&&Math.random()<.35)", "if(mem.length>2&&i&1&&!l.endsWith('?')&&Math.random()<.35)")
# the closing pair starts with whoever did not say the last line; mem=[]: the later fixtalk step turns the goodbye call
# into pickBye(mem.some(q=>q.lead)), and a stranger who walks with a kid has a lead, so only companions skip the goodbye
rep("const bye=pick(TALK_BYE);out.push([0,bye[0]],[1,bye[1]]);return out;}",
    "const s=TALKS[k][1].length&1;if(talkComp(mem)){const c=pickGo();out.push([s,c[0]],[1-s,c[1]]);return out;}"
    "mem=[];const bye=pick(TALK_BYE);out.push([s,bye[0]],[1-s,bye[1]]);return out;}")
# an adult follower speaks before a kid follower, so a kid gets kid talks only when it is the parent's sole company
rep("startTalk([p,...F],(p.x+F[0].x)/2", "startTalk([p,...F.sort((a,b)=>talkKid(a)-talkKid(b))],(p.x+F[0].x)/2")

open(path, 'w', encoding='utf-8').write(h)
print('fixtalk2 ok')
