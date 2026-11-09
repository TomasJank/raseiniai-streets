"""Tinted shadows: shade is lit only by the sky fill, so a bluer fill and a warmer sun give cool shadows and warm light, violet at dusk.
usage: add_light.py page.html   (edits in place; run after add_engine.py)
"""
import sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)

SKY_FILL, DUSK_FILL, SUN, FILL_GAIN = '0x86a8e6', '0x8f78c8', '0xffd9aa', 1.35
rep("hemi.intensity=(.46+.18*day)*(1-.2*w);hemi.color.setHex(0xdde8f2).lerp(_c1.setHex(0x4a5a7e),night);",
    f"hemi.intensity=(.46+.18*day)*(1-.2*w)*{FILL_GAIN};hemi.color.setHex({SKY_FILL}).lerp(_c1.setHex({DUSK_FILL}),dusk*.7).lerp(_c1.setHex(0x4a5a7e),night);")
rep("sun.color.setHex(0xfff1dc)", f"sun.color.setHex({SUN})")
open(path, 'w', encoding='utf-8').write(h)
print('light ok')
