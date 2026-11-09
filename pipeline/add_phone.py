"""Phone HUD: fewer controls and less text on touch screens. Drops the map stats line, Load map, Controls,
the horn button, the clock and the streak line; minimap goes top-left; credits shrink to one short line.

usage: add_phone.py page.html   (edits in place)
"""
import sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("@media (max-width:520px){", """@media (pointer:coarse){
  #placeSub,#bLoad,#bHelp,#tQ,#clock,#mBonus{display:none}
  #place{font-size:24px}
  #bl{top:calc(78px + env(safe-area-inset-top,0px));left:max(16px,env(safe-area-inset-left,0px));right:auto;bottom:auto}
  #mini{width:104px;height:104px}
  #mission{min-width:0;max-width:min(230px,52vw);padding:6px 10px}
  #mTarget{font-size:16px}
  #street{font-size:20px}
  #toast{top:34%;font-size:22px}
  #toast span{font-size:13px}
  #credit{left:max(16px,env(safe-area-inset-left,0px));right:auto;bottom:calc(98px + env(safe-area-inset-bottom,0px));font-size:9px;opacity:.55;max-width:45vw}
}
@media (pointer:coarse) and (orientation:landscape){
  #br{bottom:calc(16px + env(safe-area-inset-bottom,0px));right:calc(max(16px,env(safe-area-inset-right,0px)) + 168px)}
  #credit{bottom:calc(94px + env(safe-area-inset-bottom,0px))}
}
@media (max-width:520px){""")
rep("if(matchMedia('(max-width:700px)').matches)$('#help').hidden=true;",
    "if(matchMedia('(max-width:700px)').matches)$('#help').hidden=true;\n"
    "if(PHONE)$('#credit').textContent='© OpenStreetMap (ODbL) · NŽT · TUM (CC BY-NC) · Copernicus';")
open(path, 'w', encoding='utf-8').write(h)
