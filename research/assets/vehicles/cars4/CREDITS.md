# cars4 sources

Sketchfab downloads chosen by the owner (picked on the review page, downloaded while signed in, 2026-11-11). The licence is
as listed on each model page ("CC Attribution" = CC BY 4.0, which needs the credit below). Modified for the game: rescaled to
the real length, re-centred, textures merged into one atlas and re-encoded, transparent glass made opaque and dark, fused
wheels cut out of the body so they can turn. The Audi 80 (#15) runs on the Toyota Corolla's (#84) wheel, scaled to
its 195/65 R15 tyre.

| file | model | author | page | licence | in the game |
|---|---|---|---|---|---|
| src/1.glb | Volkswagen Passat Variant B2 (low-poly) | Randonavt | https://sketchfab.com/3d-models/508ae8c05bc047dfaa08acc58b49c090 | CC BY 4.0 | yes |
| src/71.glb | Skoda Octavia 2001 Low Poly Pixel Art | kuuttisiitonen | https://sketchfab.com/3d-models/7f2a74dc21524af1a7d7a19faffbdfb8 | CC BY 4.0 | yes |
| src/96.glb | 1998 Ford Focus 1.8 Zetec 5dr | ImperialBlue3D | https://sketchfab.com/3d-models/f7df33b34f7246529b2d8b7d8e4b2903 | CC BY 4.0 | yes |
| src/84.glb | 1995 Toyota Corolla DX (E100) | ImperialBlue3D | https://sketchfab.com/3d-models/6ed25676dd3e460d849dfce9beb73972 | CC BY 4.0 | yes |
| src/172.glb | 2001 Honda Civic EX Sedan | ImperialBlue3D | https://sketchfab.com/3d-models/c85044cb3e294bd5a1043a20afd3e263 | CC BY 4.0 | yes |
| src/762.glb | 1997 Renault Clio Mk.2 | ImperialBlue3D | https://sketchfab.com/3d-models/e3bbb96f7a61412086868ea3b136de2c | CC BY 4.0 | yes |
| src/752.glb | 2000 Volkswagen Sharan | ImperialBlue3D | https://sketchfab.com/3d-models/51474e7e4c874acf926f175d258ee875 | CC BY 4.0 | no (converted, left out, see research/reports/cars4.md) |
| src/789.glb | 2003 Peugeot 206 | ImperialBlue3D | https://sketchfab.com/3d-models/289b123c3be8432aa1dabc97dfafc026 | CC BY 4.0 | yes |
| src/10.glb | 1998 Volkswagen Golf Mk4 | ImperialBlue3D | https://sketchfab.com/3d-models/ec7b2f2fd567419a965db5b07b777c0c | CC BY 4.0 | yes |
| src/15.glb | Audi 80 lowpoly | xoliul | https://sketchfab.com/3d-models/b3e18613e61a41b295052cf2b4b70099 | CC BY 4.0 | yes, also the player's starting car |
| src/18.glb | 1996 Audi A4 Sedan | ImperialBlue3D | https://sketchfab.com/3d-models/72e1f85d3fc74a85b2c9cd2069b6eb20 | CC BY 4.0 | yes |
| src/36.glb | BMW E46 1998 | slowpoly | https://sketchfab.com/3d-models/ecc42a37c7e2409b9fd05665512843ce | CC BY 4.0 | yes |

In-game credit line (added by `pipeline/add_cars4.py`):

> Cars from Sketchfab, CC BY 4.0: VW Passat B2 Variant by Randonavt; Škoda Octavia by kuuttisiitonen; Audi 80 by xoliul (on Toyota Corolla wheels by ImperialBlue3D); BMW E46 by slowpoly; VW Golf IV, Audi A4, Ford Focus, Toyota Corolla, Honda Civic, Renault Clio, Peugeot 206 by ImperialBlue3D (modified)

## Police car (2026-11-15)

| file | model | author | page | licence | in the game |
|---|---|---|---|---|---|
| ../../sketchfab/glb/3300.glb | 2005 Skoda Octavia (353,866 faces, 21 materials) | tonielpro520 | https://sketchfab.com/3d-models/2005-skoda-octavia-c31169ccfd354b6c9b6f09964c113ae3 | CC BY 4.0 | yes, the police car (key `octavia2_pol`) |

Modified: rescaled to 4.572 m, hidden geometry dropped, reduced to 20,000 / 3,600 triangles, glass made opaque, paint stored grey;
the Lithuanian police livery (white, green band, POLICIJA) is drawn by the game, not taken from any photo. Credited in the
current line as "Skoda Octavia" in the tonielpro520 group (`credit.py --write`).

Livery references only (not in the repo's page, not redistributed; files in `review/police/ref/`, gitignored):
- "Police car in Jonava.jpg", Bearas, 2011-12-30, CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Police_car_in_Jonava.jpg
- "Volkswagen Jetta police (Lithuania).jpg", David Holt, 2011-09-14, CC BY-SA 2.0, https://commons.wikimedia.org/wiki/File:Volkswagen_Jetta_police_(Lithuania).jpg
