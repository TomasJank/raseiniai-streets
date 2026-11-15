"""perf2: frame cost on slower PCs. Matrix updates only for what moved, sub-pixel static meshes skipped in every pass, the AO
normal pass limited to 150 m, and automatic quality levels on every device (perf.js's phone-only pixel ratio step is replaced).
usage: add_perf2.py page.html   (edits in place; run last)
"""
import os, sys

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'perf2.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep('sh=d<130;', 'sh=d<PERF.tree;')
rep('t.L.geometry=d<150?', 't.L.geometry=d<PERF.hi?')
rep('t.Tk.visible=d<350;', 't.Tk.visible=d<PERF.trunk;')
a = h.index('  // ponytail: steps of .25 every 2 s, phones only')
b = h.index('renderer.setSize(innerWidth,innerHeight,false);}}\n}', a) + len('renderer.setSize(innerWidth,innerHeight,false);}}\n')
assert b - a < 700
h = h[:a] + h[b:]
rep('// ---------- boot ----------', js + '// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('perf2 ok')
