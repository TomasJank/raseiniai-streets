"""Pedestrian talks play to the goodbye: talkers are never culled for population, a car passing close only makes them
step aside and come back, a timeout jumps to the goodbye pair, and six bubbles can show at once.

usage: add_talk.py page.html   (edits in place)
"""
import sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep("if(d>190||(active>want+2&&d>90&&!p.lead&&CALM[p.mode]))",
    "if(d>190||(active>want+2&&d>90&&!p.lead&&CALM[p.mode]&&p.mode!=='talk'))")
rep("end:120,script:pickTalk(mem,cx,cz)};",
    "end:0,script:pickTalk(mem,cx,cz)};g.end=Math.min(90,20+g.script.reduce((s,l)=>s+2+l[1].length*.07,0));")
# p.back: stepped aside from a car mid-talk; nerv>=9 means real panic, which ends their part
rep("g.mem=g.mem.filter(p=>p.mode==='talk'&&p.grp===g);g.end-=dt;g.say-=dt;",
    "g.mem=g.mem.filter(p=>p.grp===g&&(p.mode==='talk'||p.back&&p.nerv<9&&(p.mode==='flee'||p.mode==='cower')));g.end-=dt;g.say-=dt;"
    "if(g.end<=0&&g.i<g.script.length-2){g.i=g.script.length-3;g.sw=0;g.end=15;}")
# hold the next line while someone is away or walking back, at most 4 s
rep("if((g.sw-=dt)<=0&&++g.i<g.script.length){",
    "if((g.sw-=dt)<=0&&!(g.sw>-4&&g.mem.some(p=>p.mode!=='talk'||p.gait>.1))&&++g.i<g.script.length){")
rep("function pedRejoin(p){",
    "function pedRejoin(p){if(p.back){p.back=0;if(p.grp&&p.grp.mem.includes(p)){p.mode='talk';p.fall=0;p.hop=0;return;}}")
rep("  pedPush(p);\n  dodge(p,M);",
    "  pedPush(p);\n  {const tk=p.mode==='talk';dodge(p,M);if(tk&&p.mode!=='talk'&&p.mode!=='down')p.back=1;}")
# a 0.95 s sidestep from a passing car is not panic; only real flights spread it
rep("if((p.panicT-=dt)<=0){p.panicT=.6;pedEvent(p.x,p.z,10,3);}",
    "if(p.timer>1&&(p.panicT-=dt)<=0){p.panicT=.6;pedEvent(p.x,p.z,10,3);}")
# a spot blocked by a wall or a neighbouring group is never reached: after 1 s without progress, talk from where they stand
rep("const g=p.grp;if(!g)pedRejoin(p);else{const d=gotoStep(p,dt);if(d>.12){rate=5.4*p.sp;gait=.5;}",
    "const g=p.grp;if(!g)pedRejoin(p);else{const ox=p.x,oz=p.z,mv=Math.hypot(ox-p.lx,oz-p.lz);p.lx=ox;p.lz=oz;const d=gotoStep(p,dt);"
    "if(d>.12){rate=5.4*p.sp;gait=.5;if(mv>p.sp*dt*.3)p.tkT=0;else if((p.tkT+=dt)>1){p.tx=ox;p.tz=oz;}}")
rep("p.dest=null;p.chatT=60;});", "p.dest=null;p.chatT=60;p.tkT=0;p.lx=NaN;});")
rep("if(d>far){far=d;p=q;}", "if(d>far&&q.mode!=='talk'){far=d;p=q;}")
rep("for(let i=0;i<3;i++){const s=new THREE.Sprite(", "for(let i=0;i<6;i++){const s=new THREE.Sprite(")

open(path, 'w', encoding='utf-8').write(h)
print('talk ok')
