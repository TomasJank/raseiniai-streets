# usage: tsv.py before.json after.json outdir -> lines.tsv (every line before the fix + verdict) and lines-after.tsv
import json, sys
B, A, out = json.load(open(sys.argv[1]))['tables'], json.load(open(sys.argv[2]))['tables'], sys.argv[3]

def rows(t):
    r = []
    base = street = 0
    for e in t['TALKS']:
        tag, lines = e[0], e[1]
        src = 'street' if tag.startswith('street:') else 'TALKS'
        k = street if src == 'street' else base
        if src == 'street': street += 1
        else: base += 1
        for i, l in enumerate(lines):
            r.append(dict(set=src, tag=tag or '-', strangers_only='yes' if len(e) > 2 and e[2] else '', script=k, line=i,
                          speaker='AB'[i & 1], text=l, q='?' if l.endswith('?') else ''))
    for k, p in enumerate(t['TALK_BYE']):
        for i, l in enumerate(p): r.append(dict(set='TALK_BYE', tag='strangers', strangers_only='', script=k, line=i, speaker='AB'[i], text=l, q=''))
    for k, p in enumerate(t.get('TALK_GO') or []):
        for i, l in enumerate(p): r.append(dict(set='TALK_GO', tag='companions', strangers_only='', script=k, line=i, speaker='AB'[i], text=l, q=''))
    for k, l in enumerate(t['TALK_HM']):
        r.append(dict(set='TALK_HM', tag='filler', strangers_only='', script=k, line=0, speaker='C', text=l, q='?' if l.endswith('?') else ''))
    return r

cols = ['set', 'tag', 'strangers_only', 'script', 'line', 'speaker', 'text', 'q']
rb, ra = rows(B), rows(A)
after = {(r['set'], r['tag'], r['text']) for r in ra}
for r in rb:
    r['verdict'] = 'kept' if (r['set'], r['tag'], r['text']) in after else 'changed'
before = {(r['set'], r['tag'], r['text']) for r in rb}
for r in ra:
    r['verdict'] = 'kept' if (r['set'], r['tag'], r['text']) in before else 'new'
for name, rs in (('lines.tsv', rb), ('lines-after.tsv', ra)):
    with open(out + '/' + name, 'w', encoding='utf-8') as f:
        f.write('\t'.join(cols + ['verdict']) + '\n')
        for r in rs: f.write('\t'.join(str(r[c]) for c in cols + ['verdict']) + '\n')
def n(rs, s): return len({(r['set'], r['tag'], r['script']) for r in rs if r['set'] == s})
for name, rs in (('before', rb), ('after', ra)):
    print(name, 'lines', len(rs), 'unique', len({r['text'] for r in rs}), 'base scripts', n(rs, 'TALKS'), 'street scripts', n(rs, 'street'),
          'verdicts', {v: sum(r['verdict'] == v for r in rs) for v in ('kept', 'changed', 'new')})
