"""Tick pages for the owner: every phrase the game says (phrases.html) and the cars now in the game (cars.html).
Run from the repo root after a build: python3 research/phrases/make.py [page.html]"""
import html, json, os, re, subprocess, sys
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
h = open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'index.html'), encoding='utf-8').read()
a = h.index('const TALKS=[')
depth, q, i = 0, None, a
while True:
    c = h[i]
    if q:
        if c == '\\': i += 1
        elif c == q: q = None
    elif c in '\'"`': q = c
    elif c in '[{(': depth += 1
    elif c in ']})': depth -= 1
    elif c == ';' and depth == 0: break
    i += 1
stmt = h[a:i + 1]
names = re.findall(r'(?:const |,)\s*(TALK\w*)=', stmt)
T = json.loads(subprocess.run(['node', '-e', stmt + 'console.log(JSON.stringify({%s}))' % ','.join(names)], capture_output=True, text=True, check=True).stdout)
streets, _ = json.JSONDecoder().raw_decode(h, h.index('const STREETS=') + len('const STREETS='))
react = json.load(open(os.path.join(root, 'pipeline/react/lines.json')))
items, secs = {}, []
def sec(title, note, rows):
    secs.append((title, note, rows))
    for i, t in rows: items[i] = t
WHO = {'kid': 'a child with a parent', 'shop': 'near a shop', '': 'anyone'}
talks = T.pop('TALKS')
sec('Conversations', 'Each row is one whole conversation between two people; unticking removes all of it.',
    [('T%d' % k, ('[%s] ' % WHO.get(t[0], t[0])) + ' / '.join(t[1])) for k, t in enumerate(talks)])
for n, v in T.items():
    sec({'TALK_HM': 'Listening noises', 'TALK_BYE': 'Goodbyes', 'TALK_GO': 'Moving on'}.get(n, n), 'Short lines used inside or at the end of conversations.',
        [('%s%d' % (n[5:], k), ' / '.join(x) if isinstance(x, list) else x) for k, x in enumerate(v)])
for si, st in enumerate(streets):
    if st.get('flavour'):
        sec('Street talk: ' + str(st.get('name') or st.get('id') or si), 'Said only on this street.', [('F%d_%d' % (si, k), ' / '.join(d)) for k, d in enumerate(st['flavour'])])
KIND = {'bump': 'when you walk into them', 'again': 'when you do it again', 'hit': 'when you hit them'}
PPL = {'kid': 'children', 'man': 'men', 'woman': 'women', 'oldm': 'old men', 'oldf': 'old women'}
for kind, by in react.items():
    for who, ls in by.items():
        sec('Talk-back, %s: %s' % (PPL.get(who, who), KIND.get(kind, kind)), 'One of these is said each time.', [('R_%s_%s_%d' % (kind, who, k), t) for k, t in enumerate(ls)])
json.dump(items, open(os.path.join(root, 'research/phrases/phrases.json'), 'w'), ensure_ascii=False, indent=0)
CSS = '''body{font:14px system-ui;margin:16px;background:#f4f4f2;color:#222;max-width:1100px}h2{margin:26px 0 4px;font-size:17px}p{margin:0 0 8px;color:#555}
label{display:block;background:#fff;border-left:4px solid #c33;margin:3px 0;padding:5px 8px;cursor:pointer;opacity:.55}label:has(input:checked){border-color:#2a7;opacity:1}
#bar{position:sticky;top:0;background:#f4f4f2;padding:8px 0;z-index:1;border-bottom:1px solid #ccc}button{font:inherit;padding:6px 12px}
.g{display:grid;grid-template-columns:1fr;gap:10px}.t{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.g label{border:2px solid #c33;border-radius:6px}.g label:has(input:checked){border-color:#2a7}img{width:100%;display:block;border-radius:4px;margin-top:4px}small{color:#666}'''
JS = '''<script>const B=[...document.querySelectorAll('input[type=checkbox]')],K='%s';
try{const s=JSON.parse(localStorage.getItem(K)||'null');if(s)for(const b of B)b.checked=!s.includes(b.value);}catch(e){}
const upd=()=>{n.textContent=B.filter(b=>b.checked).length+' of '+B.length;try{localStorage.setItem(K,JSON.stringify(B.filter(b=>!b.checked).map(b=>b.value)));}catch(e){}};
document.addEventListener('change',upd);upd();
copy.onclick=()=>{navigator.clipboard.writeText('%s: '+(B.filter(b=>!b.checked).map(b=>b.value).join(' ')||'none'));copy.textContent='Copied, paste it to Claude';};</script>'''
body = ''.join('<h2>%s (%d)</h2><p>%s</p>%s' % (html.escape(t), len(rows), html.escape(note),
       ''.join('<label><input type=checkbox value="%s" checked> %s</label>' % (i, html.escape(x)) for i, x in rows)) for t, note, rows in secs)
open(os.path.join(root, 'research/phrases/phrases.html'), 'w').write(
    '<!doctype html><meta charset=utf-8><title>Game phrases</title><style>%s</style><div id=bar><b>Phrases in the game</b> · keeping: <span id=n></span> · <button id=copy>Copy what I removed</button></div>'
    '<p>Ticked (green) = keep. Untick anything you want gone, then press the button and paste the result to Claude. Your ticks are remembered if you reload.</p>%s%s'
    % (CSS, body, JS % ('phrases1', 'remove phrases')))
mix = json.load(open(os.path.join(root, 'pipeline/cars4/mix.json'))); fleet = json.load(open(os.path.join(root, 'pipeline/cars4/fleet.json')))
tot = sum(mix['mix'].values())
def car(k, role):
    # three pictures per model, made by research/assets/vehicles/cars4/three.mjs
    pic = '<div class=t>%s</div>' % ''.join('<img loading=lazy src="../assets/vehicles/cars4/review3/%s_%d.jpg">' % (k, n) for n in (1, 2, 3))
    return '<label><input type=checkbox value="%s" checked> <b>%s</b> <small>%s</small>%s</label>' % (k, html.escape((fleet.get(k) or {}).get('name') or k), role, pic)
rows = [car(k, 'traffic and car parks, %d in %d' % (w, tot)) for k, w in mix['mix'].items()]
flat = lambda v: [v] if isinstance(v, str) else list(v) if isinstance(v, (list, dict)) else []
rows += [car(k, 'the route bus') for k in flat(mix.get('bus'))] + [car(k, 'parked, one place') for k in flat(mix.get('static'))]
open(os.path.join(root, 'research/phrases/cars.html'), 'w').write(
    '<!doctype html><meta charset=utf-8><title>Cars in the game</title><style>%s</style><div id=bar><b>Cars in the game now</b> · keeping: <span id=n></span> · <button id=copy>Copy what I removed</button></div>'
    '<p>Three pictures per car: front, side and back, each in a different paint colour it gets in the game. Ticked (green) = keep. Untick the ones you want out, press the button and paste the result to Claude.</p><div class=g>%s</div>%s'
    % (CSS, ''.join(rows), JS % ('carsingame1', 'remove cars')))
print('phrases:', len(items), 'rows in', len(secs), 'sections; cars:', len(rows))
