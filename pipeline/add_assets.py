"""Embeds the GLBs listed in assets/manifest.json as base64 <script id="asset_NAME"> blocks plus the ASSETS loader (assets.js).

usage: add_assets.py page.html   (edits in place; paths in the manifest are relative to the repository root)
"""
import base64, json, os, sys

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'assets.js'), encoding='utf-8').read()
man = json.load(open(os.path.join(here, 'assets', 'manifest.json'), encoding='utf-8'))


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


blocks, total = [], 0
for name in sorted(man):
    raw = open(os.path.join(here, '..', man[name]), 'rb').read()
    total += len(raw)
    blocks.append('<script type="application/octet-stream" id="asset_%s">%s</script>\n' % (name, base64.b64encode(raw).decode()))
rep('</body>', ''.join(blocks) + '</body>')
rep('function buildExtra(){', js + 'function buildExtra(){')
open(path, 'w', encoding='utf-8').write(h)
print('assets ok: %d files, %d KB raw, %d KB embedded' % (len(blocks), total // 1024, sum(map(len, blocks)) // 1024))
