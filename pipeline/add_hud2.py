"""hud2: a loading screen with real download progress, and the credits folded into one line that opens on click.
The page is one 30 MB file and the game's module script only runs once all of it has arrived, so the screen is driven by a
small classic script near the top that watches how far the parser has got.
usage: add_hud2.py page.html   (edits in place; run last, the progress table holds the offsets of every script block)
"""
import re, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()

CSS = """<style>
#boot{position:fixed;inset:0;z-index:40;display:grid;place-content:center;justify-items:center;gap:14px;background:var(--ink);text-align:center;padding:24px}
#boot b{font-family:var(--display);font-weight:900;font-size:56px;letter-spacing:.02em;text-transform:uppercase;color:var(--amber)}
#boot u{display:block;width:min(360px,70vw);height:6px;border-radius:3px;background:var(--line);overflow:hidden}
#boot i{display:block;height:100%;width:0;background:var(--amber);transition:width .2s linear}
#boot p{margin:0;font-size:14px;color:var(--fg);opacity:.85;max-width:560px}
@media not (pointer:coarse){
  #credit{left:50%;right:auto;transform:translateX(-50%);bottom:calc(6px + env(safe-area-inset-bottom,0px));pointer-events:auto;cursor:pointer;white-space:nowrap}
  #credit:not(.open){font-size:0}
  #credit:not(.open)::before{content:'© OpenStreetMap contributors · Credits';font-size:10.5px}
  #credit.open{white-space:normal;width:min(900px,92vw);max-height:60vh;overflow:auto;bottom:16px;z-index:25;opacity:1;font-size:12px;line-height:1.5;
    background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:12px 14px;text-shadow:none}
}
</style>
<div id="boot"><b>Raseiniai</b><u><i></i></u><p>Downloading the town…</p></div>
<script>(()=>{const B=document.getElementById('boot'),bar=B.querySelector('i'),msg=B.querySelector('p'),T=[__T__],N=__N__;let done=0;
const tick=()=>{if(done)return;let f=100;const sub=document.getElementById('placeSub');
  if(sub&&sub.textContent!=='Loading…'){done=1;requestAnimationFrame(()=>requestAnimationFrame(()=>B.remove()));return;}
  if(document.readyState==='loading'){const S=document.scripts,n=Math.min(S.length,T.length),s=S[n-1];
    f=Math.floor((T[n-1]+(s.firstChild?s.firstChild.length:0))/N*100);}
  // the game's script blocks the page as soon as the last byte is in, so the last percent already says what comes next
  if(f>98)f=100;bar.style.width=f+'%';msg.textContent=f<100?'Downloading the town… '+f+'%':'Building the town…';setTimeout(tick,150);};tick();
addEventListener('error',e=>{if(done||(e.target!==window&&e.target.tagName!=='SCRIPT'))return;done=1;
  msg.textContent='The game could not start'+(e.message?' ('+e.message+')':': a file failed to load')+'. Reload the page to try again.';},true);
})();</script>
"""
CREDIT_JS = "<script>document.getElementById('credit').onclick=e=>e.currentTarget.classList.toggle('open');</script>"

a = '<div id="stage"></div>\n'
assert h.count(a) == 1
m = re.search(r'<div class="hud" id="credit">.*?</div>', h, re.S)
# ElevenLabs' free plan asks for the credit
h = h[:m.end() - 6] + ' · Voices: ElevenLabs (elevenlabs.io), Microsoft Edge text-to-speech</div>' + CREDIT_JS + h[m.end():]
i = h.index(a) + len(a)


def starts(page):
    """Where each script element's text begins, in document.scripts order ('<script' inside a script's text is not a tag)."""
    out, p = [], 0
    while True:
        s = re.compile(r'<script[^>]*>').search(page, p)
        if not s:
            return out
        out.append(s.end())
        p = page.index('</script>', s.end()) + 9


# offsets are taken after a first insertion with a same-length placeholder table, so they are the final ones
n = len(starts(h)) + 1
page = h[:i] + CSS.replace('__T__', ','.join(['%9d' % 0] * n)).replace('__N__', '%10d' % 0) + h[i:]
T = starts(page)
assert len(T) == n
page = h[:i] + CSS.replace('__T__', ','.join('%9d' % t for t in T)).replace('__N__', '%10d' % len(page)) + h[i:]
open(path, 'w', encoding='utf-8').write(page)
print('hud2 ok: %d blocks' % n)
