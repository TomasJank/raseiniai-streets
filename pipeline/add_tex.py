"""Wall and roof textures: 11 CC0 Poly Haven materials baked into one WebP strip (tex/atlas.webp, made by tex/make.py), sampled by
world position on the merged building mesh (tex.js). Colours, the facade atlas windows, two-tone walls and night windows are kept.

usage: add_tex.py page.html   (edits in place; run after the whole chain)
"""
import base64, json, os, sys

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'tex.js'), encoding='utf-8').read()
layers = json.load(open(os.path.join(here, 'tex', 'layers.json')))
raw = open(os.path.join(here, 'tex', 'atlas.webp'), 'rb').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


n0 = len(h)
rep('</body>', '<script type="application/octet-stream" id="tex_atlas">%s</script>\n</body>' % base64.b64encode(raw).decode())
rep('// ---------- boot ----------', 'const TEXL=%s;\n' % json.dumps(layers, separators=(',', ':')) + js + '// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('tex ok: %d layers, %d KB added' % (len(layers), (len(h) - n0) // 1024))
