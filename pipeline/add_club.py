"""L klubas (Dominikonų g. 6) with its neon sign, the Baldų centras / REDOS signs, AUTODALYS next door, Norfa XL with its
copper pharmacy entrance, and fights in the club's car park after dark (club.js). Styled by eye from the user's street photos.

usage: add_club.py page.html   (edits in place; run after add_story.py)
"""
import json, os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'club.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


# yellow sheet walls under a blue band (club), grey sheet (autodalys), dark tiles (Norfa XL)
rep("const LOOK={", "const LOOK={c2661:{wall:[.93,.77,.16],roof:[.17,.3,.6],sty:STY.sheet,windows:false},"
    "c2663:{wall:[.74,.76,.77],sty:STY.sheet,windows:false},c2135:{wall:[.2,.21,.23],roof:[.3,.3,.31],sty:STY.sheet,windows:false},")
# Aivaras's house, Gintaro g. 18, by eye from the user's Street View captures: dark red-brown clinker brick, steep red tile gable roof
rep("const LOOK={", "const LOOK={c708:{wall:[.45,.27,.22],roof:[.66,.27,.16],sty:STY.brick,pitched:true,hip:false,h:3.8,rh:4.7},")
# Gvidas's house, Žvyryno g. 2, by eye from Street View (Jun 2024): light silicate brick, low grey sheet gable roof
rep("const LOOK={", "const LOOK={c1826:{wall:[.86,.83,.73],roof:[.55,.56,.55],sty:STY.brick,pitched:true,hip:false,rh:2.2},")

# Žvyryno g. pavements, from the user's Street View capture and Mapillary 1622454445694158 (Mar 2026): paver pavement at
# the kerb on the south-west side, where the field is (houses face it from the north-east), and both sides past Gvidas's house;
# applied as OSM sidewalk tags (ways 5351 and 41 run south-east, so south-west is their right)
a = h.index('id="rasData">') + len('id="rasData">'); b = h.index('</script>', a)
d = json.loads(h[a:b])
for way, side in {5351: 'right', 41: 'right', 5352: 'both'}.items():
    t = dict(d['t'][d['w'][way][0]])
    assert t.get('name') == 'Žvyryno g.', t
    t['sidewalk'] = side
    d['t'].append(t)
    d['w'][way][0] = len(d['t']) - 1
h = h[:a] + json.dumps(d, separators=(',', ':'), ensure_ascii=False) + h[b:]

rep("  buildStory();\n", "  buildStory();buildClub();\n")
rep("  storyTick(c,slow);\n", "  storyTick(c,slow);updateClub(dt);\n")
rep("function buildStory(){", js + "function buildStory(){")
open(path, 'w', encoding='utf-8').write(h)
