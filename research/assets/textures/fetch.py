"""Downloads the Poly Haven (CC0) maps that pipeline/tex/make.py bakes into pipeline/tex/atlas.webp.

usage: python3 fetch.py [name ...]     (default: the textures in use; files land in raw/<name>/{diff,nor,ao}.jpg next to this script)
"""
import json, os, sys, urllib.request

USED = ['red_brick', 'whitewashed_brick', 'painted_plaster_wall', 'white_stucco_02', 'brown_planks_05', 'concrete_wall_006',
        'corrugated_iron_02', 'asbestos_sheet_02', 'roof_09', 'box_profile_metal_sheet', 'bitumen']
here = os.path.dirname(os.path.abspath(__file__))


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'texture-fetch/1.0'})).read()


for name in sys.argv[1:] or USED:
    d = os.path.join(here, 'raw', name)
    os.makedirs(d, exist_ok=True)
    files = json.loads(get('https://api.polyhaven.com/files/' + name))
    for key, out in (('Diffuse', 'diff'), ('nor_gl', 'nor'), ('AO', 'ao')):
        p = os.path.join(d, out + '.jpg')
        if key in files and not os.path.exists(p):
            open(p, 'wb').write(get(files[key]['1k']['jpg']['url']))
    info = json.loads(get('https://api.polyhaven.com/info/' + name))
    json.dump({'name': info['name'], 'authors': sorted(info['authors']), 'mm': info['dimensions']}, open(os.path.join(d, 'info.json'), 'w'))
    print(name, info['name'], sorted(info['authors']), [round(v) for v in info['dimensions']], sorted(os.listdir(d)))
