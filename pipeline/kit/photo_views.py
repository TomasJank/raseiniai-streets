"""Camera records for the street photos, for work/photomatch.mjs.

usage: photo_views.py dubysos [gintaro ...]   -> pipeline/kit/views/{slug}.json

Reads the Mapillary image ids from refs/mapillary/{slug}/*.jpg names and asks the Graph API for position, compass
angle and focal length (token in ~/.mapillary_token). Panoramas are skipped.
"""
import glob, json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
TOKEN = open(os.path.expanduser('~/.mapillary_token')).read().strip()
F = 'id,computed_geometry,geometry,computed_compass_angle,compass_angle,camera_parameters,camera_type,width,height'

os.makedirs(os.path.join(HERE, 'views'), exist_ok=True)
for slug in sys.argv[1:]:
    files = {os.path.basename(p).rsplit('_', 1)[-1][:-4]: p for p in sorted(glob.glob(os.path.join(ROOT, 'refs/mapillary', slug, '*.jpg')))
             if '_pano' not in p}
    files = {k.split('_')[-1]: v for k, v in files.items()}
    out, ids = [], list(files)
    for i in range(0, len(ids), 50):
        url = 'https://graph.mapillary.com/?ids=%s&fields=%s&access_token=%s' % (','.join(ids[i:i + 50]), F, TOKEN)
        d = json.load(urllib.request.urlopen(url, timeout=60))
        for k, r in d.items():
            g = (r.get('computed_geometry') or r['geometry'])['coordinates']
            cam = r.get('camera_parameters') or [0.75, 0, 0]
            if r.get('camera_type') not in (None, 'perspective', 'fisheye', 'brown'):
                continue
            out.append({'file': os.path.relpath(files[k], os.path.join(ROOT, 'refs/mapillary')), 'id': k, 'lat': g[1], 'lon': g[0],
                        'ang': r.get('computed_compass_angle', r.get('compass_angle')), 'cam': cam, 'type': 'perspective',
                        'w': r['width'], 'h': r['height']})
    out.sort(key=lambda r: r['file'])
    json.dump(out, open(os.path.join(HERE, 'views', slug + '.json'), 'w'), indent=1)
    print(slug, len(out), 'of', len(files))
