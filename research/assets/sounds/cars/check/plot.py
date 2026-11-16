"""Pictures of the loop seams and the simulated drives from render.mjs's wavs: python3 plot.py RENDER_DIR OUT_DIR (numpy, matplotlib)"""
import json, os, sys, wave, numpy as np, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
src, out = sys.argv[1], sys.argv[2]
rd = lambda f: (lambda w: np.frombuffer(w.readframes(w.getnframes()), '<i2') / 32768)(wave.open(os.path.join(src, f)))
J = json.load(open(os.path.join(src, 'frames.json'))); SR = 48000; lens = J['lens']
names = sorted(lens, key=lambda k: (k[0] if '_' in k else 'z', k))
stats = {}
for part in range(0, len(names), 12):
    grp = names[part:part + 12]
    fig, ax = plt.subplots(len(grp), 2, figsize=(16, 1.6 * len(grp)), gridspec_kw={'width_ratios': [1, 2.4]})
    for i, k in enumerate(grp):
        x = rd('seam_' + k + '.wav'); L = int(round(lens[k] * SR)); w = int(.012 * SR)
        d = np.abs(np.diff(x)); at = max(d[L - 3:L + 3].max(), d[2 * L - 3:2 * L + 3].max()); typ = np.delete(d, np.r_[L - 3:L + 3, 2 * L - 3:2 * L + 3]).max()
        stats[k] = round(float(at / typ), 2)
        t = (np.arange(-w, w) / SR) * 1000
        ax[i, 0].plot(t, x[L - w:L + w], lw=.7); ax[i, 0].axvline(0, color='r', lw=.6); ax[i, 0].set_title('%s seam (largest step there %.2fx the largest elsewhere)' % (k, stats[k]), fontsize=8)
        ax[i, 0].tick_params(labelsize=6)
        ax[i, 1].specgram(x, NFFT=2048, Fs=SR, noverlap=1792, cmap='magma', vmin=-120); ax[i, 1].set_ylim(0, 4000 if k[:2] in ('p_', 'q_', 'd_') else 12000)
        for s in (L, 2 * L): ax[i, 1].axvline(s / SR, color='c', lw=.6, ls='--')
        ax[i, 1].tick_params(labelsize=6)
    plt.tight_layout(); plt.savefig(os.path.join(out, 'seams_%d.png' % (part // 12 + 1)), dpi=60); plt.close()
F = np.array(J['frames'])
for f in sorted(os.listdir(src)):
    if not f.startswith('drive_'): continue
    x = rd(f); pre = f[6:-4]; kind = 'diesel' if pre == 'd' else 'petrol'
    rpm = F[:, 1] if kind == 'petrol' else 900 + (F[:, 1] - 850) * .5
    fig, ax = plt.subplots(3, 1, figsize=(16, 10), sharex=True)
    t = np.arange(len(x)) / SR
    ax[0].plot(t[::40], x[::40], lw=.4); ax[0].set_title('simulated drive, engine %s: idle, three gears flat out, cruise, brake, idle' % pre); ax[0].set_ylabel('wave')
    ax[1].specgram(x, NFFT=8192, Fs=SR, noverlap=7680, cmap='magma', vmin=-120); ax[1].set_ylim(0, 400)
    ax[1].plot(F[:, 0], rpm / 30, 'c', lw=.8, alpha=.7, label='rpm/30 (4-cylinder firing)'); ax[1].legend(fontsize=8); ax[1].set_ylabel('Hz')
    ax[2].plot(F[:, 0], F[:, 1], label='game rpm'); ax[2].plot(F[:, 0], F[:, 3] * 1000, label='gear x1000'); ax[2].plot(F[:, 0], F[:, 2] * 1000, label='load x1000')
    ax[2].plot(F[:, 0], F[:, 5] * 100, label='speed m/s x100'); ax[2].legend(fontsize=8, ncol=4); ax[2].grid(alpha=.3); ax[2].set_xlabel('s')
    plt.tight_layout(); plt.savefig(os.path.join(out, 'drive_%s.png' % pre), dpi=60); plt.close()
print(json.dumps(stats))
