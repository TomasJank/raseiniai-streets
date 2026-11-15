"""Credit line for the data the map round brought in (GRPK is CC BY 4.0: attribution is a licence condition).
usage: add_credits.py page.html   (edits in place)
"""
import sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


rep('Roof colours derived from ORT10LT orthophoto, National Land Service (NŽT), geoportal.lt</div>',
    'Roof, ground, road and tree data derived from ORT10LT orthophoto 2024, National Land Service (NŽT), geoportal.lt · '
    'Land cover, water, buildings: GRPK © Lietuvos Respublikos aplinkos ministerija (CC BY 4.0)</div>')
rep("'© OpenStreetMap (ODbL) · NŽT · TUM (CC BY-NC) · Copernicus'", "'© OpenStreetMap (ODbL) · NŽT · GRPK © LR AM (CC BY 4.0) · TUM (CC BY-NC) · Copernicus'")
open(path, 'w', encoding='utf-8').write(h)
print('credits ok')
