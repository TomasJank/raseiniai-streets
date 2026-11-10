"""Minimal glTF 2.0 binary reader for the fleet build: flattened triangles with world positions, normals, colours."""
import io, json, math, struct

from PIL import Image

FMT = {5126: ('f', 4), 5125: ('I', 4), 5123: ('H', 2), 5121: ('B', 1), 5122: ('h', 2), 5120: ('b', 1)}
NORM = {5121: 255, 5123: 65535, 5120: 127, 5122: 32767}
N = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def read(path):
    b = open(path, 'rb').read()
    assert b[:4] == b'glTF'
    jl = struct.unpack_from('<I', b, 12)[0]
    j = json.loads(b[20:20 + jl])
    o = 20 + jl
    return j, b[o + 8:o + 8 + struct.unpack_from('<I', b, o)[0]] if o < len(b) else b''


def accessor(j, bin_, i):
    a = j['accessors'][i]
    bv = j['bufferViews'][a['bufferView']]
    n = N[a['type']]
    f, size = FMT[a['componentType']]
    stride = bv.get('byteStride', size * n)
    base = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    out = [struct.unpack_from('<' + f * n, bin_, base + k * stride) for k in range(a['count'])]
    if a.get('normalized'):
        d = NORM[a['componentType']]
        out = [tuple(max(v / d, -1.0) for v in t) for t in out]
    return out


def mat_mul(a, b):
    return [sum(a[r + 4 * k] * b[k + 4 * c] for k in range(4)) for c in range(4) for r in range(4)]  # column-major


def node_matrix(n):
    if 'matrix' in n:
        return list(n['matrix'])
    t = n.get('translation', [0, 0, 0])
    x, y, z, w = n.get('rotation', [0, 0, 0, 1])
    s = n.get('scale', [1, 1, 1])
    r = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w),
         2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w),
         2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)]
    return [r[0] * s[0], r[1] * s[0], r[2] * s[0], 0, r[3] * s[1], r[4] * s[1], r[5] * s[1], 0,
            r[6] * s[2], r[7] * s[2], r[8] * s[2], 0, t[0], t[1], t[2], 1]


def xf(m, p, w=1):
    return tuple(m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r] * w for r in range(3))


def srgb(c):
    return tuple(min(1.0, max(0.0, v)) ** (1 / 2.2) for v in c[:3])


def triangles(path):
    """[{p:[3 xyz], n:[3 xyz], c:[3 rgb display 0..1], mat:name, node:name}] in world space"""
    j, bin_ = read(path)
    imgs = {}
    for i, im in enumerate(j.get('images', [])):
        bv = j['bufferViews'][im['bufferView']]
        imgs[i] = Image.open(io.BytesIO(bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGB')
    out = []

    def visit(ni, parent):
        n = j['nodes'][ni]
        m = mat_mul(parent, node_matrix(n))
        if 'mesh' in n:
            det = m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2])
            for pr in j['meshes'][n['mesh']]['primitives']:
                assert pr.get('mode', 4) == 4
                at = pr['attributes']
                P = [xf(m, p) for p in accessor(j, bin_, at['POSITION'])]
                NN = [xf(m, q, 0) for q in accessor(j, bin_, at['NORMAL'])] if 'NORMAL' in at else None
                UV = accessor(j, bin_, at['TEXCOORD_0']) if 'TEXCOORD_0' in at else None
                CC = accessor(j, bin_, at['COLOR_0']) if 'COLOR_0' in at else None
                I = [i[0] for i in accessor(j, bin_, pr['indices'])] if 'indices' in pr else list(range(len(P)))
                mat = j['materials'][pr['material']] if 'material' in pr else {}
                pb = mat.get('pbrMetallicRoughness', {})
                fac = pb.get('baseColorFactor', [1, 1, 1, 1])
                tex = imgs.get(j['textures'][pb['baseColorTexture']['index']]['source']) if 'baseColorTexture' in pb else None

                def col(k):
                    if tex is not None and UV:
                        u, v = UV[k]
                        px = tex.getpixel((int((u % 1) * tex.width) % tex.width, int((v % 1) * tex.height) % tex.height))
                        return tuple(px[q] / 255 * fac[q] ** (1 / 2.2) for q in range(3))
                    c = srgb(fac)
                    return tuple(c[q] * (CC[k][q] if CC else 1) for q in range(3))
                for t in range(0, len(I), 3):
                    a, b, c = I[t:t + 3]
                    if det < 0:
                        b, c = c, b
                    p = [P[a], P[b], P[c]]
                    u = [p[1][q] - p[0][q] for q in range(3)]
                    v = [p[2][q] - p[0][q] for q in range(3)]
                    f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
                    L = math.sqrt(sum(x * x for x in f))
                    if L < 1e-12:
                        continue
                    f = tuple(x / L for x in f)
                    if NN:
                        nn = []
                        for k in (a, b, c):
                            q = NN[k]
                            l = math.sqrt(sum(x * x for x in q)) or 1
                            nn.append(tuple(x / l for x in q))
                    else:
                        nn = [f, f, f]
                    out.append({'p': p, 'n': nn, 'c': [col(a), col(b), col(c)], 'mat': mat.get('name', ''), 'node': n.get('name', '')})
        for ch in n.get('children', []):
            visit(ch, m)

    I4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    for r in j['scenes'][j.get('scene', 0)]['nodes']:
        visit(r, I4)
    return out
