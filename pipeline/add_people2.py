"""People look: kids (always with an adult they follow), adults, the old (slow, stooped, some with a stick);
clothes by weather and season; hats, caps, backpacks, bags, long coats, scarves, ponytails and walking sticks
as eight more instanced parts (27 in all). Looks are rolled again each time a person appears.
usage: add_people2.py page.html   (edits in place)
"""
import os, sys
path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'people2.js'), encoding='utf-8').read().strip()
def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)
def body(name):
    i = h.index(name); k = h.index('{', i); d = 0
    for j in range(k, len(h)):
        d += h[j] == '{'
        d -= h[j] == '}'
        if d == 0:
            return h[i:j + 1]

rep(body('function dress(i,cols){') + '\n', '')
rep(body('function randomLook(i){') + '\n', '')
a = 'const PARTS=['
i = h.index(a) + len(a) - 1; d = 0
for j in range(i, len(h)):
    d += h[j] == '['
    d -= h[j] == ']'
    if d == 0:
        break
parts = h[h.index(a):j + 1]
rep(parts, js + '\n' + parts[:-1] + ",...GEAR];PARTS[7].c2=PARTS[10].c2='fore';PARTS[13].c2=PARTS[16].c2='shin'")
# appended parts have no joint angle in poseAt's table
rep('_pj.set(ang[k],', '_pj.set(ang[k]||0,')
open(path, 'w', encoding='utf-8').write(h)
print('people2 ok')
