#!/bin/sh
# Regenerates the 36 townsfolk: GLB + JSON in research/mh/glb, then front/back/face shots and contact sheets in
# research/mh/out/review, measuring each person's on-screen colours (`pal`) into their JSON. Same command, same people.
# Needs blender (MPFB add-on), npx (gltfpack) and node with Playwright at career-ops/.
set -e
cd "$(dirname "$0")/.."
rm -f glb/crowd_*.glb glb/crowd_*.json
blender -b --python scripts/sheet.py -- crowd x.png export=glb > out/run_crowd.log 2>&1
grep '^STAT' out/run_crowd.log
python3 -m http.server 8818 --bind 127.0.0.1 > /dev/null 2>&1 &
server=$!
trap 'kill $server' EXIT
sleep 1
node web/review.mjs 8818 out/review glb pal
python3 scripts/pages.py out/review glb out/review/page 6 2
