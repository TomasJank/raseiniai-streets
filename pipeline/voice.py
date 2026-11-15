"""Lithuanian speech clips for every pedestrian dialogue line in a built page (TALKS, TALK_HM, TALK_BYE, street flavour).
Clips are cached in work/voice/{sha1(voice+text)}.webm and never regenerated; add_voice.py embeds them.
Edge (Ona, Leonas) covers every line; ElevenLabs voices are cast per conversation and replace them where a clip exists.

usage: voice.py page.html            Edge clips for every line (free, fast)
       voice.py --eleven page.html   ElevenLabs clips, one request at a time, in the order talk-back, conversations,
                                     street flavour; stops cleanly when the service refuses for quota, run again to continue
"""
import hashlib, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'work', 'voice')
FFMPEG = '/opt/homebrew/bin/ffmpeg'
# (female, male); a None male means the female clip played at MALE_RATE
EDGE = ('edge:lt-LT-OnaNeural', 'edge:lt-LT-LeonasNeural')
SAY = ('say:Ona', None)
MALE_RATE = .82
# displayed line -> text sent to the voice; the cache key stays the displayed line. Each one was checked with
# speech-to-text (research/voice_audition/check/report.md): ?/. give the intonation the line means, the comma
# and the split keep words from running together, the marks (~ = circumflex stress) are the dictionary stress.
SPOKEN = {
    'Ar nupirksi ledų.': 'Ar nupirksi ledų?',
    'Žiūrėjai vakar Žalgirį?': 'Žiūrėjai vakar, Žalgirį?',
    'Tingi, ko daugiau.': 'Tingi. Ko daugiau.',
    'Žiūrėk, kur eini, dėde!': 'Žiūrėk, kur eini! Dėde!',
}
# ElevenLabs stock voices the owner approved by ear (2026-11); a voice key is eleven:<name>:<id>:<model>
ELEVEN = {'bill': 'pqHfZKP75CvOlQylNhV4', 'callum': 'N2lVS1w4EtoT3dr4eOWO', 'brian': 'nPczCjzI2devNBz1zQrb',
          'liam': 'TX3LPaxmHKxFdv7VOQHJ', 'matilda': 'XrExE9yKIg1WjnnlVkGX', 'sarah': 'EXAVITQu4vr4xnSDxMaL',
          'alice': 'Xb7hH8MSUJpSbSDYk0k2'}
MODEL = {'sarah': 'eleven_v4'}  # everyone else eleven_v3
# Liam stays out of conversations: Whisper misheard him at twice the Edge rate on ten game lines (talk-back only)
WOMEN, MEN = ('matilda', 'sarah', 'alice'), ('bill', 'callum', 'brian')
LOUDNESS = -21.5  # LUFS; median of the Edge game clips is -20.8 (Ona) and -22.3 (Leonas)
LOG = os.path.join(CACHE, 'eleven.tsv')  # one row per request: time, voice, characters sent, credit headers
REJECT = os.path.join(CACHE, 'eleven_reject.tsv')  # voice<TAB>text the speech check refused twice; those stay on Edge


def lines(h):
    a = h.index('const TALKS=[')
    b = h.index(';', h.index('TALK_HM=[', a))
    r = h[a:b]
    out = [m.group(1).replace("\\'", "'") for m in re.finditer(r"'((?:[^'\\]|\\.)*)'", r) if r[m.end():m.end() + 2] != ',[']
    if 'const STREETS=' in h:
        s, _ = json.JSONDecoder().raw_decode(h, h.index('const STREETS=') + len('const STREETS='))
        out += [l for st in s for d in st.get('flavour', []) for l in d]
    return sorted(set(out))


def eleven(name):
    return 'eleven:%s:%s:%s' % (name, ELEVEN[name], MODEL.get(name, 'eleven_v3'))


def pick(seq, key, salt=''):
    return seq[int(hashlib.sha1((salt + key).encode()).hexdigest(), 16) % len(seq)]


def conversations(h):
    """Every conversation in speaking order: TALKS, the goodbye / moving-on / listening pools, then street flavour."""
    a = h.index('const TALKS=[')
    r = h[a:h.index(';', h.index('TALK_HM=[', a))]
    s = r"'(?:[^'\\]|\\.)*'"
    convs = [[x[1:-1].replace("\\'", "'") for x in re.findall(s, m.group(1))]
             for m in re.finditer(r"\[\s*((?:%s\s*,\s*)*%s)\s*\]" % (s, s), r)]  # innermost lists of strings
    if 'const STREETS=' in h:
        st, _ = json.JSONDecoder().raw_decode(h, h.index('const STREETS=') + len('const STREETS='))
        convs += [d for x in st for d in x.get('flavour', [])]
    return convs


def cast(h):
    """text -> (woman, man) ElevenLabs voice keys; one woman and one man per conversation, a repeated text keeps its first cast."""
    out = {}
    for c in conversations(h):
        key = '|'.join(c)
        who = (eleven(pick(WOMEN, key, 'f')), eleven(pick(MEN, key, 'm')))
        for t in c:
            out.setdefault(t, who)
    return out


def rejected():
    return {tuple(l.rstrip('\n').split('\t', 1)) for l in open(REJECT, encoding='utf-8')} if os.path.exists(REJECT) else set()


def clip(voice, text):
    return os.path.join(CACHE, hashlib.sha1((voice + text).encode()).hexdigest() + '.webm')


def backend():
    return EDGE if shutil.which('edge-tts') else SAY


class Quota(Exception):
    pass


def fetch_eleven(voice, text, raw):
    _, name, vid, model = voice.split(':')
    key = open(os.path.expanduser('~/.elevenlabs_key')).read().strip()
    req = urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=mp3_44100_64' % vid,
                                 data=json.dumps({'text': text, 'model_id': model, 'language_code': 'lt'}).encode(),
                                 headers={'xi-api-key': key, 'content-type': 'application/json'})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                open(raw, 'wb').write(r.read())
                cost = ' '.join('%s=%s' % kv for kv in r.headers.items() if re.search('char|credit|cost', kv[0], re.I))
            with open(LOG, 'a', encoding='utf-8') as f:
                f.write('%s\t%s\t%d\t%s\n' % (time.strftime('%Y-%m-%d %H:%M:%S'), voice, len(text), cost))
            return
        except urllib.error.HTTPError as e:
            body = e.read()[:300].decode('utf-8', 'replace')
            if e.code == 429 and 'concurrent' in body:
                time.sleep(5 * (attempt + 1))
                continue
            if e.code in (401, 402, 429) or 'quota' in body:
                raise Quota('%d %s' % (e.code, body))
            raise RuntimeError('%d %s' % (e.code, body))
    raise Quota('429 concurrent limit, gave up after retries')


def loudness(f):
    o = subprocess.run([FFMPEG, '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', o)
    return float(m[-1]) if m else None


def make(voice, text):
    out = clip(voice, text)
    eng, name = voice.split(':', 1)
    with tempfile.TemporaryDirectory() as t:
        raw = os.path.join(t, 'raw.aiff' if eng == 'say' else 'raw.mp3')
        gain = ''
        if eng == 'edge':
            subprocess.run(['edge-tts', '--voice', name, '--text', SPOKEN.get(text, text), '--write-media', raw], check=True, capture_output=True)
        elif eng == 'eleven':
            fetch_eleven(voice, text, raw)
            lu = loudness(raw)
            if lu is not None and lu > -70:  # match the Edge clips so a conversation does not jump in volume
                gain = ',volume=%.1fdB' % max(-12, min(12, LOUDNESS - lu))
        else:
            subprocess.run(['say', '-v', name, '-o', raw, text], check=True)
        # keeps 50 ms before the first and after the last sound above -50 dB: onsets ramp up 10-30 ms below the
        # threshold, and a cut right at it made the speech model (and maybe ears) lose first syllables
        trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05'
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', raw, '-af', '%s,areverse,%s,areverse%s' % (trim, trim, gain),
                        '-ac', '1', '-ar', '24000', '-c:a', 'libopus', '-b:a', '12k', '-application', 'voip', out + '.part.webm'], check=True)
    os.replace(out + '.part.webm', out)


def eleven_jobs(h):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from react.clips import eleven_wanted
    c = cast(h)
    talk = [(v, t) for conv in conversations(h)[:len(conversations(h)) - len(flavour(h))] for t in conv for v in c[t]]
    flav = [(v, t) for conv in flavour(h) for t in conv for v in c[t]]
    seen, out = set(), []
    for job in eleven_wanted() + talk + flav:
        if job not in seen:
            seen.add(job)
            out.append(job)
    return out


def flavour(h):
    if 'const STREETS=' not in h:
        return []
    st, _ = json.JSONDecoder().raw_decode(h, h.index('const STREETS=') + len('const STREETS='))
    return [d for x in st for d in x.get('flavour', [])]


def main_eleven(h):
    os.makedirs(CACHE, exist_ok=True)
    jobs = eleven_jobs(h)
    skip = rejected()
    todo = [j for j in jobs if j not in skip and not os.path.exists(clip(*j))]
    made = chars = 0
    try:
        for v, t in todo:
            make(v, t)
            made += 1
            chars += len(t)
    except Quota as e:
        print('eleven: the service refused (%s); stopped cleanly, run again later to continue' % e)
    left = [j for j in todo[made:]]
    print('eleven: %d clips made, %d characters sent this run; %d of %d wanted clips exist, %d to go (%d characters)'
          % (made, chars, len(jobs) - len(left) - len([j for j in jobs if j in skip]), len(jobs), len(left), sum(len(t) for _, t in left)))


def main():
    if sys.argv[1] == '--eleven':
        return main_eleven(open(sys.argv[2], encoding='utf-8').read())
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
