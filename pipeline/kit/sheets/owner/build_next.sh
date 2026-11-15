#!/bin/sh
# build.sh's chain with the kit step live, or left out: build_next.sh /abs/out.html [next|old|none]: live kit, the kit before kit 3, none
set -e; R=$(cd "$(dirname "$0")/../../.." && pwd); out=${1:?out.html}; step=${2:-next}
cd "$R"; cp ../work/build/v37.html "$out"
for s in $(sed -n 's/^for s in \([^;]*\); do.*/\1/p' build.sh); do
  if [ "$s" != kit ]; then python3 add_$s.py "$out" >/dev/null
  elif [ "$step" = next ]; then python3 add_kit.py "$out"
  elif [ "$step" = old ]; then python3 kit/sheets/kit3/old/add_kit.py "$out"; fi
done
