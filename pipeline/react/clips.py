"""Clips for the reaction lines (lines.json) into the work/voice cache that add_react.py embeds.
Men speak with the male voice, women with the female one, kids with both (the clip follows the kid's look.male).

usage: python3 pipeline/react/clips.py   (needs edge-tts on PATH)
"""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from voice import EDGE, clip, eleven, make, pick, rejected  # noqa: E402

VOICES = {'kid': EDGE, 'man': EDGE[1:], 'oldm': EDGE[1:], 'woman': EDGE[:1], 'oldf': EDGE[:1]}
# ElevenLabs cast (female slot, male slot); kids get a woman's voice in both slots, the game pitches it up
CAST = {'man': (None, ('callum', 'brian', 'liam')), 'oldm': (None, ('bill',)), 'woman': (('sarah', 'alice'), None),
        'oldf': (('matilda',), None), 'kid': (('sarah', 'alice'), 'same')}


def eleven_slots(who, t):
    f, m = CAST[who]
    f = eleven(pick(f, t)) if f else None
    return f, (f if m == 'same' else eleven(pick(m, t)) if m else None)


def slots(who, t):
    """(female, male) voice keys to embed for a talk-back line: the ElevenLabs clip where it exists, else Edge."""
    el, ed, bad = eleven_slots(who, t), (EDGE[0] if EDGE[0] in VOICES[who] else None, EDGE[1] if EDGE[1] in VOICES[who] else None), rejected()
    if who == 'kid':
        ed = (EDGE[0], EDGE[0])
    return tuple(e if e and (e, t) not in bad and os.path.exists(clip(e, t)) else d for e, d in zip(el, ed))


def lines():
    L = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
    return sorted({(who, t) for pool in L.values() for who, ts in pool.items() for t in ts})


def eleven_wanted():
    return [(v, t) for who, t in lines() for v in dict.fromkeys(eleven_slots(who, t)) if v]


def wanted():
    return sorted({(v, t) for who, t in lines() for v in VOICES[who]})


if __name__ == '__main__':
    os.makedirs(os.path.dirname(clip(EDGE[0], '')), exist_ok=True)
    todo = [a for a in wanted() if not os.path.exists(clip(*a))]
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(lambda a: make(*a), todo))
    print('react voice ok: %d clips, %d made' % (len(wanted()), len(todo)))
