"""Drive 2 (drive2.js): pure-pursuit cornering for traffic, counter-steer during handbrake drifts.

usage: add_drive2.py page.html   (edits in place; run after build.sh, last step)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'drive2.js'), encoding='utf-8').read()


def rep(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:80])
    h = h.replace(old, new)


rep("""    let s=c.speed*dt,guard=0;
    while(s>0&&guard++<6){const rem=(1-c.ai.t)*c.ai.len;if(s<rem){c.ai.t+=s/c.ai.len;s=0;}else{s-=rem;if(!aiNext(c))break;}}
    aiPlace(c,false);syncCar(c);ride(c,dt);""", "    aiSteer(c,dt);syncCar(c);ride(c,dt);")
rep("const nk=opts[Math.floor(Math.random()*opts.length)],N=G.get(nk);",
    "const nk=(c.ai.q&&c.ai.q.length?c.ai.q.shift():null)||opts[Math.floor(Math.random()*opts.length)],N=G.get(nk);")
rep("const yaw=c.steer*(hand?2.9:2.05)*clamp(c.speed/6,-1,1)/(1+Math.abs(c.speed)/30);",
    "const yaw=c.steer*(hand?2.9:2.05)*clamp(c.speed/6,-1,1)/(1+Math.abs(c.speed)/30)-driftCS(c);")
rep("// ---------- boot ----------", js + "\n// ---------- boot ----------")

open(path, 'w', encoding='utf-8').write(h)
print('drive2 ok')
