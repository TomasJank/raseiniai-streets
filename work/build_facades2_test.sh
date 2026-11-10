#!/bin/sh
# build.sh chain with the streets step reading a scratch dir: sh work/build_facades2_test.sh out.html [streetsDir]
set -e; root=$(cd "$(dirname "$0")/.." && pwd); out=${1:?out.html}; sd=${2:-$root/work/facades2_test}
cp "$root/work/build/v37.html" "$out"; cd "$root/pipeline"
for s in $(sed -n 's/^for s in \([^;]*\); do.*/\1/p' "$root/pipeline/build.sh"); do
  if [ $s = streets ]; then python3 add_streets.py "$out" --dir "$sd"; else python3 add_$s.py "$out"; fi
done > /dev/null
