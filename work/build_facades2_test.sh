#!/bin/sh
# build.sh chain with the streets step reading a scratch dir: sh work/build_facades2_test.sh out.html [streetsDir]
set -e; root=$(cd "$(dirname "$0")/.." && pwd); out=${1:?out.html}; sd=${2:-$root/work/facades2_test}
cp "$root/work/build/v37.html" "$out"; cd "$root/pipeline"
for s in importmap cars solid talk fight people2 animals streets voice assets chars facades drive gfx water2 animals2 fight2 cars2 fixgfx fixpeople fixtalk fixwater fixground kick parked2 drive2 facades2; do
  if [ $s = streets ]; then python3 add_streets.py "$out" --dir "$sd"; else python3 add_$s.py "$out"; fi
done > /dev/null
