"""Builds audition.html: every engine candidate and car sound, clips embedded, on carsound.js's own crossfade code.

usage: python3 make_audition.py   (reads clips/ next to this file and pipeline/carsound.js)
"""
import base64, json, os

here = os.path.dirname(os.path.abspath(__file__))
js = open(os.path.join(here, '..', '..', '..', '..', 'pipeline', 'carsound.js'), encoding='utf-8').read()
core = js[:js.index('// ---- game ----')]
meta = json.load(open(os.path.join(here, 'clips', 'meta.json')))
clips = {n: base64.b64encode(open(os.path.join(here, 'clips', n + '.ogg'), 'rb').read()).decode() for n in sorted(meta)}
block = json.dumps({'meta': meta, 'clips': clips}, sort_keys=True, separators=(',', ':'))
CANDS = [
    dict(pre='p', kind='petrol', name='Petrol A: Ford Escort Mk3, 1985', tag='in the game now',
         note='One car, recorded with a phone inside it (freesound, escortmarius, CC0): a cold idle, standing revs, town and motorway driving and a full-throttle run through the gears. Loops pulling from 1900 to 5600 rpm and coasting from 2400 to 3600, idle 845.'),
    dict(pre='q', kind='petrol', name='Petrol B: Peugeot 404 Injection, 1960s', tag='alternative',
         note='Three microphones (cabin, bonnet contact mic, engine bay) mixed, driving mostly downhill (freesound, Sadiquecat, CC0). Rougher and more mechanical; road noise in the loops; no full-throttle stretches, so every loop is one list.'),
    dict(pre='d', kind='diesel', name='Diesel: VW New Beetle 1.9 TDI', tag='in the game now (vans, the bus, W124, W210, A4, Passat)',
         note='Standing revs held at steady rpm, phone near the car (freesound, Evilmikie, CC0). No load in these, so pulling and coasting differ only by loudness and the lowpass. The bus plays it 20% lower.'),
]
SHOTS = [('start_p', 'Start (petrol)'), ('stop_p', 'Switch off'), ('start_d', 'Start (diesel)'), ('door_open', 'Door open'), ('door_close', 'Door close'),
         ('handbrake', 'Handbrake'), ('crash_big', 'Crash, metal and glass'), ('crash_small', 'Small hit (pole, light touch)'), ('glass', 'Lamp glass'), ('bump', 'Speed bump')]
html = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Car sound audition</title><style>
:root{--bg:#f6f4ef;--fg:#1f2328;--mute:#5d646d;--card:#fff;--line:#d9d5cc;--acc:#b5531c}
@media (prefers-color-scheme:dark){:root{--bg:#16181b;--fg:#e8e6e1;--mute:#a1a7ae;--card:#1f2226;--line:#33373c;--acc:#f08a4b}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:960px;margin:0 auto;padding:24px 16px 64px}h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:0 0 6px}h2 small{color:var(--acc);font-weight:600;font-size:13px;margin-left:8px}
p{margin:6px 0;color:var(--mute)}section{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px;margin:14px 0}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}button{font:inherit;font-size:13px;padding:6px 10px;border-radius:6px;border:1px solid var(--line);background:var(--bg);color:var(--fg);cursor:pointer}
button:hover{border-color:var(--acc)}input[type=range]{width:min(420px,70vw);vertical-align:middle}.rr{font-variant-numeric:tabular-nums;color:var(--fg);min-height:1.5em}
ol{color:var(--mute);padding-left:20px}
</style></head><body><main>
<h1>Car sound audition</h1>
<p>Every sound the carsound step adds to the game. Use headphones or decent speakers: an engine loop is mostly below 300 Hz. The page runs the game's own crossfade code.</p>
<div class="row"><label>Volume <input type="range" id="vol" min="0" max="1" step="0.01" value="0.7"></label></div>
<section><h2>What to listen for</h2><ol>
<li>Each loop on its own: a click or a thump once a second or so means a bad seam.</li>
<li>Drag the rpm slider slowly from 850 to 5600, with and without throttle: the sound should rise smoothly with no jumps in character or loudness where one loop hands over to the next.</li>
<li>The simulated drive: three gear changes (the rpm falls at each), a steady cruise, then braking to idle.</li>
<li>Which petrol engine you prefer. Changing it in the game is one line: <code>const CS_PICK={petrol:'p',diesel:'d'}</code> at the top of pipeline/carsound.js (q = Peugeot 404).</li>
</ol></section>
<div id="engines"></div>
<section><h2>Other car sounds</h2><div class="row">''' + ''.join('<button data-shot="%s">%s</button>' % s for s in SHOTS) + '''</div>
<div class="row"><button data-hold="horn">Horn (hold)</button><button data-hold="squeal">Tyre squeal (hold)</button><button id="siren">Siren: play</button></div>
<p>Horn: a 2008 Fiat Panda; squeal: a Chrysler LHS cornering; siren: a Whelen wail (the game pans it towards the nearest police car). The speed bump is what carBumpSound(strength) plays, pitched up and louder for harder bumps.</p></section>
<p>Sources and licences: SOURCE.md next to this page. All CC0.</p>
</main>
<script type="application/json" id="rasCarSnd">''' + block + '''</script>
<script>''' + core + '\nconst CANDS=' + json.dumps(CANDS) + ';\n' + open(os.path.join(here, 'audition.js'), encoding='utf-8').read() + '''</script>
</body></html>'''
open(os.path.join(here, 'audition.html'), 'w', encoding='utf-8').write(html)
print('audition.html %.0f KB' % (len(html) / 1024))
