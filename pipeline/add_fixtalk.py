"""Talk repeats: companions (leader + followers) said goodbye and chatted again every minute, with the same few goodbye pairs and fillers.

usage: add_fixtalk.py page.html   (edits in place; run last)
"""
import os, sys

path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_talk.js'), encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep('// ---------- boot ----------', js + '\n// ---------- boot ----------')
rep('const bye=pick(TALK_BYE);', 'const bye=pickBye(mem.some(q=>q.lead),out);')
rep('pick(TALK_HM)', 'pick(TALK_HM.filter(f=>!out.some(o=>o[1]===f)))')
rep('talkRecent=[k,...talkRecent].slice(0,8)', 'talkRecent=[k,...talkRecent].slice(0,30)')
rep('if(F.length&&Math.random()<.6){startTalk(', 'if(F.length&&Math.random()<.6&&talkRested([p,...F])){startTalk(')
rep('p.chatT=60;p.tkT=0;p.lx=NaN;});', 'p.chatT=60;p.tkT=0;p.lx=NaN;p.lastTalk=pedClock;});')
open(path, 'w', encoding='utf-8').write(h)
print('fixtalk ok')
