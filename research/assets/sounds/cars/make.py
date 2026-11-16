"""Clips for the carsound step from the recordings listed in SOURCE.md, as clips.json says.

usage: python3 make.py RAW_DIR OUT_DIR   (needs numpy; ffmpeg at /opt/homebrew/bin/ffmpeg)
Writes OUT_DIR/{name}.ogg (mono 24 kHz Opus) and OUT_DIR/meta.json:
  engine loops {name: [rpm, load, pre_s, len_s]}, tones (horn, squeal, siren) {name: [0, 0, pre_s, len_s]}, shots {name: 0}.

Engine loops:
Each loop: the firing frequency is tracked through the stretch (harmonic product spectrum, 10 ms steps), the stretch is
resampled so that frequency is constant (a tape-speed bend of at most a few per cent), a whole number of engine cycles
(4 firings = 2 revolutions) is taken, the length is fine-tuned to the best waveform match, and the last 40 ms are
crossfaded into the first so the seam is continuous. The clip carries PAD seconds of the loop's own wrap on both ends so
the codec never sees the seam; the game loops between pre_s and pre_s + len_s.
"""
import json, os, subprocess, sys
import numpy as np

FF = '/opt/homebrew/bin/ffmpeg'
SR = 24000
PAD = .06
# engine: name -> file, start s, end s, firing frequency guess Hz (a 4-cylinder fires at rpm/30), load (1 pulling, 0 coasting or no load)
# tone: name -> file, start s, end s, loop length guess s (fine-tuned by waveform match);  shot: name -> file, start s, end s, fade in s, fade out s
SPEC = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clips.json')))


def load(f, chan=None):
    af = ['-af', 'pan=mono|c0=c%d' % chan] if chan is not None else ['-ac', '1']
    b = subprocess.run([FF, '-v', 'error', '-i', f] + af + ['-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).astype(np.float64)


def track(x, fg, hop=.01, win=.25):
    """firing frequency every hop seconds, within -20%/+25% of fg and 6% of the previous value"""
    n = int(win * SR); H = int(hop * SR); w = np.hanning(n); N = 1 << 17
    fr = np.fft.rfftfreq(N, 1 / SR); T, F = [], []; prev = fg
    for i in range(0, len(x) - n, H):
        s = np.log(np.abs(np.fft.rfft(x[i:i + n] * w, N)) + 1e-9)
        tot = s.copy()
        for k in (2, 3, 4):
            tot[:len(s) // k] += s[::k][:len(s) // k]
        m = (fr > max(prev * .94, fg * .8)) & (fr < min(prev * 1.06, fg * 1.25))
        if not m.any(): m = (fr > fg * .8) & (fr < fg * 1.25)
        j = np.flatnonzero(m)[np.argmax(tot[m])]
        if 0 < j < len(tot) - 1:  # parabolic peak
            a, b, c = tot[j - 1], tot[j], tot[j + 1]; j = j + .5 * (a - c) / (a - 2 * b + c)
        prev = j * SR / N; T.append((i + n / 2) / SR); F.append(prev)
    # a median over 0.3 s drops brief jumps to a neighbouring harmonic, then a 0.1 s mean
    F = np.median(np.lib.stride_tricks.sliding_window_view(np.pad(F, 15, mode='edge'), 31), axis=1)
    F = np.convolve(np.pad(F, 5, mode='edge'), np.ones(11) / 11, 'valid')
    return np.array(T), F


def flatten(x, T, F):
    """resample so the tracked frequency becomes its median: output phase f_t * t follows the source phase"""
    ft = np.median(F); t = np.arange(len(x)) / SR
    f = np.interp(t, T, F); ph = np.cumsum(f) / SR
    tout = np.arange(0, ph[-1] / ft, 1 / SR)
    return np.interp(tout * ft, ph, t * SR), ft


def make(name, spec, raw):
    f, t0, t1, fg, ld = spec[:5]
    chan = spec[5] if len(spec) > 5 else None
    x = load(os.path.join(raw, f), chan)[int(t0 * SR):int(t1 * SR)]
    T, F = track(x, fg)
    pos, ft = flatten(x, T, F)
    y = np.interp(pos, np.arange(len(x)), x)
    cyc = 4 / ft  # seconds per engine cycle (2 revolutions)
    want = min(len(y) / SR - 2 * PAD - .1, 1.5)
    k = max(1, int(want / cyc)); L0 = int(round(k * cyc * SR)); X = int(.04 * SR); P = int(PAD * SR)
    s = (len(y) - L0 - X) // 2  # centred
    s = max(s, P)
    best, bl = -2, L0
    for L in range(L0 - int(.003 * SR), L0 + int(.003 * SR) + 1):  # fine-tune the length by waveform match over 30 ms
        a, b = y[s:s + 720], y[s + L:s + L + 720]
        c = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12)
        if c > best: best, bl = c, L
    L = bl
    loop = y[s:s + L].copy()
    r = np.linspace(0, 1, X)
    loop[:X] = y[s:s + X] * np.sin(r * np.pi / 2) + y[s + L:s + L + X] * np.cos(r * np.pi / 2)
    loop /= np.sqrt(np.mean(loop ** 2)) / .18  # equal RMS for every loop; the game sets loudness by rpm and load
    loop = np.clip(loop, -.98, .98)
    clip = np.concatenate([loop[-P:], loop, loop[:P]])
    return clip, dict(rpm=round(ft * 30), load=ld, pre=P / SR, len=L / SR, corr=round(float(best), 3), cycles=k,
                      bend=round(float(F.max() / F.min() - 1) * 100, 1), jump=round(float(abs(loop[0] - loop[-1])), 4))


def tone(name, spec, raw):
    f, t0, t1, lg = spec
    y = load(os.path.join(raw, f))[int(t0 * SR):int(t1 * SR)]
    X = int(min(.08, lg / 5) * SR); P = int(PAD * SR); s = P
    # coarse: the lag whose short spectra best repeat the first ones (hop 5 ms), then fine by waveform within +-6 ms
    H = int(.005 * SR); n = 512; w = np.hanning(n)
    S = np.array([np.log(np.abs(np.fft.rfft(y[i:i + n] * w)) + 1e-6) for i in range(0, len(y) - n, H)])
    S -= S.mean(1, keepdims=True); S /= np.linalg.norm(S, axis=1, keepdims=True) + 1e-9
    B = max(4, int(min(.25, lg / 3) / .005)); i0 = s // H
    lags = range(int(lg * .8 / .005), min(int(lg * 1.2 / .005), len(S) - i0 - B))
    lag = max(lags, key=lambda k: float(np.sum(S[i0:i0 + B] * S[i0 + k:i0 + k + B])))
    W = int(min(.03, lg / 6) * SR); a = y[s:s + W]; best, L = -2, lag * H
    for l in range(lag * H - int(.006 * SR), lag * H + int(.006 * SR)):
        b = y[s + l:s + l + W]; c = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12)
        if c > best: best, L = c, l
    loop = y[s:s + L].copy(); r = np.linspace(0, 1, X)
    loop[:X] = y[s:s + X] * np.sin(r * np.pi / 2) + y[s + L:s + L + X] * np.cos(r * np.pi / 2)
    loop *= .8 / np.abs(loop).max()
    return np.concatenate([loop[-P:], loop, loop[:P]]), dict(pre=P / SR, len=L / SR, corr=round(float(best), 3))


def shot(name, spec, raw):
    f, t0, t1, fi, fo = spec
    y = load(os.path.join(raw, f))[int(t0 * SR):int(t1 * SR)].copy()
    y -= y.mean(); n = len(y)
    y[:int(fi * SR) + 1] *= np.linspace(0, 1, int(fi * SR) + 1)
    y[n - int(fo * SR) - 1:] *= np.linspace(1, 0, int(fo * SR) + 1) ** 2
    return y * (10 ** (-2 / 20) / np.abs(y).max()), dict(dur=round(n / SR, 3))


def write(path, y, kbps):
    raw = (np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run([FF, '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libopus', '-b:a', '%dk' % kbps,
                    '-application', 'audio', '-frame_duration', '20', path], input=raw, check=True)


if __name__ == '__main__':
    raw, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True); meta = {}
    only = sys.argv[3:]
    for kind, fn, kb in (('engine', make, 40), ('tone', tone, 32), ('shot', shot, 32)):
        for name, spec in SPEC[kind].items():
            if only and name not in only: continue
            y, m = fn(name, spec, raw)
            write(os.path.join(out, name + '.ogg'), y, kb)
            meta[name] = [m['rpm'], m['load'], round(m['pre'], 6), round(m['len'], 6)] if kind == 'engine' else \
                [0, 0, round(m['pre'], 6), round(m['len'], 6)] if kind == 'tone' else 0
            print(name, m)
    old = json.load(open(os.path.join(out, 'meta.json'))) if only and os.path.exists(os.path.join(out, 'meta.json')) else {}
    old.update(meta)
    json.dump(old, open(os.path.join(out, 'meta.json'), 'w'), indent=1, sort_keys=True)
