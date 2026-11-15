"""writes the owner-review descriptions into pipeline/streets/vilniaus.json (looks, one sign) and pipeline/kit/looks/vilniaus.json
(whole files, written to a temporary name, parsed back, then renamed). Rerunnable."""
import json, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')
ST, KT = os.path.join(R, 'streets', 'vilniaus.json'), os.path.join(R, 'kit', 'looks', 'vilniaus.json')
LOOKS = {
    'c2462': {'wall': [0.6, 0.6, 0.58], 'roof': [0.3, 0.18, 0.14], 'sty': 'plaster', 'windows': True, 'pitched': True, 'hip': False, 'h': 3.4, 'rh': 3.4, 'roofSty': 'corrugated', 'ridge': 'street'},
    'c2463': {'wall': [0.78, 0.79, 0.77], 'roof': [0.3, 0.3, 0.3], 'sty': 'plank', 'windows': True, 'pitched': True, 'hip': False, 'h': 2.9, 'rh': 2.8, 'roofSty': 'asbestos', 'ridge': 'street'},
    'c2464': {'wall': [0.42, 0.25, 0.19], 'roof': [0.32, 0.2, 0.16], 'sty': 'plank', 'windows': True, 'pitched': True, 'hip': False, 'h': 3.3, 'rh': 4.2, 'roofSty': 'tiles', 'ridge': 'street'},
    'c2465': {'wall': [0.86, 0.79, 0.56], 'roof': [0.45, 0.45, 0.43], 'sty': 'plank', 'windows': True, 'pitched': True, 'hip': False, 'h': 2.8, 'rh': 2.8, 'roofSty': 'asbestos', 'ridge': 'street'},
    'c2466': {'wall': [0.86, 0.63, 0.54], 'roof': [0.47, 0.47, 0.45], 'sty': 'plank', 'windows': True, 'pitched': True, 'hip': False, 'h': 3.4, 'rh': 3.2, 'roofSty': 'asbestos', 'ridge': 'street'},
    'c2022': {'wall': [0.86, 0.85, 0.8], 'roof': [0.27, 0.27, 0.29], 'sty': 'silicate', 'windows': True, 'pitched': True, 'hip': False, 'h': 3.6, 'rh': 4.0, 'roofSty': 'tiles', 'ridge': 'across'},
}
PATCH = {'c2514': {'ridge': 'across'}, 'c2914': {'ridge': 'street'}, 'c7170': {'h': 4.4, 'band': 3.4}, 'c1417': {'sty': 'plank'}}
SIGN = {'text': 'Tėjūla', 'll': [55.3787471, 23.1170251], 'hd': 217, 'w': 4.2, 'h': 0.8, 'y': 3.9, 'bg': '#f4f4f2', 'fg': '#3a9a3a'}
BROWN = [0.42, 0.25, 0.19]
KIT = {
    'c2462': {'front': 1, 'chim': [0.2], 'noTree': 12, 'winSize': 1.2,
              'xg': {'side': 'front', 'at': 0.225, 'w': 4.1, 'd': 0, 'rise': 0.95, 'win': [1, 1]},
              'door': {'side': 'front', 'at': 0.58, 'porch': 'recess'}, 'win': {'front': [[0.86]]},
              'balc': {'side': 'right', 'at': 0.5, 'w': 0.15, 'col': [0.45, 0.32, 0.22]}},
    'c2463': {'win': {'front': [[0.25, 0.83]], 'right': [3, 1]}, 'winSize': {'front': 1.1}, 'chim': [0.4], 'gable': [0.3, 0.27, 0.23], 'gableSty': 'boards'},
    'c2464': {'wings': [{'ridge': 'street', 'h': 3.3, 'rh': 4.2, 'd': 8.2}, {'roof': 'hip', 'h': 5.3, 'rh': 1.3}, {'ridge': 'street', 'h': 3.3, 'rh': 4.2}],
              'win': {'front': [[0.1, 0.76], [0.16]], 'right': [2, 1]}, 'winSize': 1.1, 'chim': [0.1],
              'door': {'side': 'front', 'at': 0.25, 'type': 'glass', 'col': [0.88, 0.9, 0.9], 'steps': True}},
    'c2465': {'win': {'front': [[0.16, 0.66]], 'right': [2, 1]},
              'roof2': {'at': [0, 0.5], 'side': 'both', 'col': [0.19, 0.2, 0.22], 'sty': 'tiles'},
              'walls': {'front': {'col': BROWN, 'sty': 'planks', 'at': [0, 0.33]}, 'left': {'col': BROWN, 'sty': 'planks'}}},
    'c2466': {'wings': [{'ridge': 'street', 'h': 3.4, 'rh': 3.2, 'd': 7.0}, {'ridge': 'street', 'h': 3.4, 'rh': 3.2}, {'ridge': 'street', 'h': 3.4, 'rh': 3.2}],
              'xg': {'side': 'front', 'at': 0.35, 'w': 4.3, 'up': 1.4, 'rise': 1.08, 'wall': [0.88, 0.85, 0.74], 'gable': [0.88, 0.85, 0.74], 'win': [[0.28, 0.72]]},
              'win': {'front': [[0.05, 0.14, 0.24, 0.46, 0.9]], 'right': [2, 1]}, 'door': {'side': 'front', 'at': 0.35, 'col': [0.42, 0.12, 0.1]},
              'gable': [0.75, 0.76, 0.74], 'gableSty': 'planks', 'chim': [0.3, 0.8],
              'walls': {'front': {'col': [0.9, 0.6, 0.56], 'at': [0, 0.33]}}},
    'c2022': {'halfHip': 0.35, 'win': {'front': [0, 1], 'left': [[0.5, 0.78]]}, 'winShape': {'front': 'wide'}, 'noFence': True, 'noTree': True,
              'ext': [{'side': 'front', 'at': 0.5, 'w': 1.0, 'd': 2.4, 'h': 2.8, 'roof': 'lean', 'sty': 'plank', 'wall': [0.3, 0.2, 0.14],
                       'win': [0.07, 0.21, 0.35, 0.65, 0.79, 0.93], 'door': 0.5, 'doorCol': [0.16, 0.11, 0.08]},
                      {'side': 'left', 'at': 0.2, 'w': 0.15, 'd': 2.0, 'h': 2.6, 'roof': 'lean', 'sty': 'plank', 'wall': [0.3, 0.2, 0.14], 'win': [1]}]},
    'c2514': {'front': 1, 'gable': [0.76, 0.69, 0.56], 'gableSty': 'brick', 'win': {'front': [2, 2, 1], 'right': [3, 1]},
              'balc': {'side': 'right', 'at': 0.72, 'w': 0.3, 'floor': 1, 'col': [0.32, 0.32, 0.3]}},
    'c2515': {'win': {'front': [0]}},
    'c2914': {'win': {'front': [[0.35, 0.82]], 'right': [2, 1]}, 'frame': [0.4, 0.25, 0.18], 'winSize': 1.0},
    'c1417': {'winSize': 'small'},
}


def write(path, d):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.write('\n')
    json.load(open(tmp, encoding='utf-8'))
    os.replace(tmp, path)


s = json.load(open(ST, encoding='utf-8'))
s['looks'].update({k: v for k, v in LOOKS.items()})
for k, v in PATCH.items():
    s['looks'][k].update(v)
s['signs'] = [g for g in s['signs'] if g['text'] != SIGN['text']] + [SIGN]
write(ST, s)
k = json.load(open(KT, encoding='utf-8'))
k.update(KIT)
write(KT, k)
print('ok')
