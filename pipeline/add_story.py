"""Story missions for friends around Raseiniai: green rings start a chain of pick-ups and drop-offs (story.js).

usage: add_story.py page.html   (edits in place; run last)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'story.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


marks = "const MARKS=()=>[...garages.map(g=>[g.x,g.z,MARK_COL.garage]),...races.map(r=>[r.x,r.z,MARK_COL.race])];\n"
rep(marks, marks.replace("MARK_COL.race])];", "MARK_COL.race]),...storyMarks.map(m=>[m.x,m.z,MARK_COL.story]),...(poker?[[poker.x,poker.z,MARK_COL.poker]]:[])];") + js)
rep("    races.push({x:s.x,z:s.z,name,cps,ring:r,sp:sign('Race · '+name,'race',s.x,s.z,5)});\n  }\n}\n",
    "    races.push({x:s.x,z:s.z,name,cps,ring:r,sp:sign('Race · '+name,'race',s.x,s.z,5)});\n  }\n  buildStory();\n}\n")
rep("  for(const r of races){r.ring.visible=r.sp.visible=", "  storyTick(c,slow);\n  for(const r of races){r.ring.visible=r.sp.visible=")
rep("  if(mission.stage==='pickup'){updatePickup(dt);return;}", "  if(mission.kind==='story'){updateStory(dt);return;}\n  if(mission.stage==='pickup'){updatePickup(dt);return;}")
rep("mission&&mission.kind==='taxi'?'Comfort':'Cargo'", "mission&&(mission.kind==='taxi'||mission.pax)?'Comfort':'Cargo'")
rep("else if(code==='KeyN'){if(race){endRace(false);return;}", "else if(code==='KeyN'){if(race){endRace(false);return;}if(mission&&mission.kind==='story'){endStory(false);return;}")
rep("  saved=null;\n}\nfunction updateRace(", "  if(mission&&mission.kind==='story')storyHud();\n  saved=null;\n}\nfunction updateRace(")
rep("<kbd>N</kbd><span>New job, or cancel a race</span>", "<kbd>N</kbd><span>New job, or cancel a race or a friend's errand</span>")
open(path, 'w', encoding='utf-8').write(h)
