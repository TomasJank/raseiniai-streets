"""LKS-94 (EPSG:3346) <-> lat/lon <-> game metres, no dependencies. Checked against the orthophoto: church and pond land on the same pixel.

Orthophoto tile grid (research/geodata/ortho/meta.json, level L, res m/px): tile (row, col) covers
x = OX + col*256*res .. , y = OY - row*256*res .. downwards, with OX, OY = -5122000, 10000100.
"""
import math

A, F, K0, LON_0, FE = 6378137.0, 1 / 298.257222101, 0.9998, math.radians(24), 500000
E2 = F * (2 - F)
EP2 = E2 / (1 - E2)
OX, OY = -5122000, 10000100
LAT0, LON0 = 55.377401, 23.120024700000002  # world.lat0 / world.lon0 in the built page
KX, KZ = 111320 * math.cos(LAT0 * math.pi / 180), 110540


def fwd(lat, lon):
    """lat/lon degrees -> LKS-94 easting, northing"""
    p, l = math.radians(lat), math.radians(lon) - LON_0
    n = A / math.sqrt(1 - E2 * math.sin(p) ** 2)
    t, c, a = math.tan(p) ** 2, EP2 * math.cos(p) ** 2, l * math.cos(p)
    m = A * ((1 - E2 / 4 - 3 * E2 ** 2 / 64 - 5 * E2 ** 3 / 256) * p - (3 * E2 / 8 + 3 * E2 ** 2 / 32 + 45 * E2 ** 3 / 1024) * math.sin(2 * p)
             + (15 * E2 ** 2 / 256 + 45 * E2 ** 3 / 1024) * math.sin(4 * p) - (35 * E2 ** 3 / 3072) * math.sin(6 * p))
    x = FE + K0 * n * (a + (1 - t + c) * a ** 3 / 6 + (5 - 18 * t + t * t + 72 * c - 58 * EP2) * a ** 5 / 120)
    y = K0 * (m + n * math.tan(p) * (a * a / 2 + (5 - t + 9 * c + 4 * c * c) * a ** 4 / 24 + (61 - 58 * t + t * t + 600 * c - 330 * EP2) * a ** 6 / 720))
    return x, y


def inv(x, y):
    lat, lon = 55.38, 23.1
    for _ in range(30):
        fx, fy = fwd(lat, lon)
        lat += (y - fy) / 111200
        lon += (x - fx) / (111320 * math.cos(math.radians(lat)))
    return lat, lon


def game_to_lks(gx, gz):
    return fwd(LAT0 - gz / KZ, LON0 + gx / KX)


def lks_to_game(x, y):
    lat, lon = inv(x, y)
    return (lon - LON0) * KX, -(lat - LAT0) * KZ


if __name__ == '__main__':
    x, y = game_to_lks(174.2, -117.5)  # the church
    gx, gz = lks_to_game(x, y)
    assert abs(gx - 174.2) < .05 and abs(gz + 117.5) < .05, (gx, gz)
    assert 444000 < x < 445000 and 6138000 < y < 6140000, (x, y)
    print('lks94 ok', round(x, 1), round(y, 1))
