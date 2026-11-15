"""The credit line for the models in pipeline/cars4/mix.json, from the author and credit fields in fleet.json.
usage: python3 credit.py        prints the line        python3 credit.py --write   also stores it in mix.json
"""
import json, os, sys
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..', 'pipeline', 'cars4')
fleet, cfg = json.load(open(os.path.join(d, 'fleet.json'))), json.load(open(os.path.join(d, 'mix.json')))
by = {}
for k in list(cfg['mix']) + ([cfg['bus']] if cfg.get('bus') else []) + list(cfg.get('static', {})) + ([cfg['police']] if cfg.get('police') else []):
    f = fleet[k]
    name = f['credit']
    by.setdefault(f['author'], [])
    if name not in by[f['author']]:
        by[f['author']].append(name)
# the Audi 80 runs on the Toyota Corolla's (#84) wheels
wheels = any(fleet[k].get('wheelFrom') == 'corolla_e100' for k in cfg['mix'])
line = ('Cars from Sketchfab, CC BY 4.0: ' + '; '.join(', '.join(v) + ' by ' + a for a, v in by.items())
        + ('; Toyota Corolla wheels by ImperialBlue3D' if wheels else '') + ' (modified)')
print(line)
if '--write' in sys.argv:
    cfg['credit'] = line
    json.dump(cfg, open(os.path.join(d, 'mix.json'), 'w'), indent=1, ensure_ascii=False)
    open(os.path.join(d, 'mix.json'), 'a').write('\n')
