"""kit-maironio-2: edits pipeline/streets/maironio.json looks + fences and pipeline/kit/looks/maironio.json. Idempotent, writes whole files via a temp name."""
import json, os
R = os.path.dirname(os.path.abspath(__file__)) + '/../../../'
SJ, KJ = R + 'streets/maironio.json', R + 'kit/looks/maironio.json'
S = json.load(open(SJ)); K = json.load(open(KJ))
L = S['looks']

def look(i, **kw): L[i].update(kw)
def kit(i, **kw): K.setdefault(i, {}).update(kw)

# c2714: cross-gabled mint house, gable to the street
look('c2714', wall=[0.77, 0.83, 0.74], roof=[0.22, 0.23, 0.27], pitched=True, hip=False, ridge='across', h=3.8, rh=3.8)
kit('c2714', wings=[{'ridge': 'across'}, {'ridge': 'across', 'rh': 2.2, 'h': 3.0}], chim=[0.5])
K['c2714'].pop('win', None)
# c2707: white lower floor, dark boarded upper floor, gable to the street
look('c2707', wall=[0.9, 0.89, 0.86], wall2=[0.29, 0.31, 0.33], band=2.7, pitched=True, hip=False, ridge='street', h=5.0, rh=3.4)
kit('c2707', wings=[{'ridge': 'street', 'h': 2.6, 'rh': 1.0}, {'ridge': 'street'}, {'ridge': 'street', 'h': 2.6, 'rh': 1.0}])
# c2709: white lower walls under a dark band
look('c2709', wall=[0.9, 0.88, 0.82], sty='plaster', wall2=[0.25, 0.27, 0.3], band=2.6, h=3.4)
# c2962: gable end to the street, 2 and 1 windows
look('c2962', pitched=True, hip=False, ridge='across')
kit('c2962', win={'front': [2, 1]}, wings=[{'ridge': 'across'}, {'ridge': 'street', 'rh': 2.4, 'h': 2.8}])
# c2982: one long ridge, flush cross gable with the big window, red door under a canopy on the SW wall
look('c2982', wall=[0.86, 0.89, 0.84])
kit('c2982', wings=[{'ridge': 'street', 'rh': 1.6, 'h': 2.6}, {'ridge': 'street'}, {'ridge': 'street', 'rh': 1.5, 'h': 2.6}, None],
    xg={'side': 'right', 'at': 0.7, 'w': 4, 'rise': 0.85, 'win': [1, 1]},
    door={'side': 'right', 'at': 0.2, 'type': 'single', 'col': [0.6, 0.12, 0.1], 'steps': True, 'porch': 'canopy'}, chim=[0.3, 0.7])
# c2984
look('c2984', ridge='street')
kit('c2984', wings=[{'ridge': 'street'}, {'ridge': 'street', 'rh': 1.2, 'h': 2.6}])
F = S['fences']
for f in F:
    if f['style'] == 'slat': f.update(style='wall', col='#5a5f66', h=1.5)
def ll(x, z): return [round(55.3826885 - (z + 584.5) / 110800, 7), round(23.1209567 + (x - 58.9) / 63354, 7)]
# c2714: only the two clipped hedge blocks the photos show in the plot front (drive between them)
front = [[[89.2, -594.7], [91.5, -592.2]], [[83.7, -601.0], [86.6, -597.7]]]
if ll(*front[0][0]) not in [f['ll'][0] for f in F]:
    for k, (p, q) in enumerate(front):
        F.append({'style': 'hedge', 'll': [ll(*p), ll(*q)], 'h': 1.6, 'dense': True, 'col': '#33442c'})
for i, c in zip((0, 1, 2, 3, 4), ('#4a4a30', '#34432e', '#6a5c48', '#6a5c48', '#2c4a32')):
    F[i]['col'] = c
kit('c2714', noFence='front')
kit('c2984', noFence=True)
kit('c3059', noFence='front')

json.dump(S, open(SJ + '.tmp', 'w'), indent=1, ensure_ascii=False); json.load(open(SJ + '.tmp')); os.replace(SJ + '.tmp', SJ)
json.dump(K, open(KJ + '.tmp', 'w'), indent=1); json.load(open(KJ + '.tmp')); os.replace(KJ + '.tmp', KJ)
