"""Lithuanian speech clips for every pedestrian dialogue line in a built page (TALKS, TALK_HM, TALK_BYE, street flavour).
Clips are cached in work/voice/{sha1(voice+text)}.webm and never regenerated; add_voice.py embeds them.

usage: voice.py page.html
"""
import hashlib, json, os, re, shutil, subprocess, sys, tempfile, time
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'work', 'voice')
FFMPEG = '/opt/homebrew/bin/ffmpeg'
# (female, male); a None male means the female clip played at MALE_RATE
EDGE = ('edge:lt-LT-OnaNeural', 'edge:lt-LT-LeonasNeural')
SAY = ('say:Ona', None)
MALE_RATE = .82


def lines(h):
    a = h.index('const TALKS=[')
    b = h.index(';', h.index('TALK_HM=[', a))
    r = h[a:b]
    out = [m.group(1).replace("\\'", "'") for m in re.finditer(r"'((?:[^'\\]|\\.)*)'", r) if r[m.end():m.end() + 2] != ',[']
    if 'const STREETS=' in h:
        s, _ = json.JSONDecoder().raw_decode(h, h.index('const STREETS=') + len('const STREETS='))
        out += [l for st in s for d in st.get('flavour', []) for l in d]
    return sorted(set(out))


def clip(voice, text):
    return os.path.join(CACHE, hashlib.sha1((voice + text).encode()).hexdigest() + '.webm')


def backend():
    return EDGE if shutil.which('edge-tts') else SAY


def make(voice, text):
    out = clip(voice, text)
    eng, name = voice.split(':')
    with tempfile.TemporaryDirectory() as t:
        raw = os.path.join(t, 'raw.mp3' if eng == 'edge' else 'raw.aiff')
        if eng == 'edge':
            subprocess.run(['edge-tts', '--voice', name, '--text', text, '--write-media', raw], check=True, capture_output=True)
        else:
            subprocess.run(['say', '-v', name, '-o', raw, text], check=True)
        trim = 'silenceremove=start_periods=1:start_threshold=-50dB'
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', raw, '-af', '%s,areverse,%s,areverse' % (trim, trim),
                        '-ac', '1', '-ar', '24000', '-c:a', 'libopus', '-b:a', '12k', '-application', 'voip', out + '.part.webm'], check=True)
    os.replace(out + '.part.webm', out)


def main():
    h = open(sys.argv[1], encoding='utf-8').read()
    os.makedirs(CACHE, exist_ok=True)
    voices = backend()
    if voices is SAY:
        print('voice: edge-tts not found, using macOS Ona (pip3 install edge-tts gives better voices)')
    todo = [(v, t) for t in lines(h) for v in voices if v and not os.path.exists(clip(v, t))]
    t0 = time.time()
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(lambda a: make(*a), todo))
    print('voice ok: %d lines, %d clips made in %.1f s (%s)' % (len(lines(h)), len(todo), time.time() - t0, voices[0].split(':')[0]))


if __name__ == '__main__':
    main()
