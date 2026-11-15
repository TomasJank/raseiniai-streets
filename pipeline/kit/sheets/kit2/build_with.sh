#!/bin/sh
# build.sh's chain with the kit step swapped: build_with.sh /abs/out.html STEP [KITDIR]
#   STEP = kit (live), old (the kit before kit 2, kept in old/), none (no kit step). KITDIR = looks dir (default pipeline/kit/looks)
set -e; R=$(cd "$(dirname "$0")/../../.." && pwd); out=${1:?out.html}; step=${2:-kit}; dir=${3:-$R/kit/looks}
cd "$R"; cp ../work/build/v37.html "$out"
for s in $(sed -n 's/^for s in \(.*\); do.*/\1/p' build.sh); do
  if [ "$s" != kit ]; then python3 add_$s.py "$out"
  elif [ "$step" = old ]; then python3 kit/sheets/kit2/old/add_kit.py "$out" --dir "$dir"
  elif [ "$step" = kit ]; then python3 add_kit.py "$out" --dir "$dir"; fi
done
