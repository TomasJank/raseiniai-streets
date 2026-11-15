#!/bin/sh
# fixture.sh /abs/base.html /abs/old.html /abs/new.html: base = build_with.sh ... none; old/new = base + the pre-kit-2 descriptions
# drawn by the kit before kit 2 / by the live kit
set -e; H=$(cd "$(dirname "$0")" && pwd); P=$(cd "$H/../../../.." && pwd)
cp "$1" "$2"; cp "$1" "$3"
python3 "$H/add_kit.py" "$2" --dir "$H/fixture/looks" --streets "$H/fixture/streets"
python3 "$P/${KIT_PY:-add_kit.py}" "$3" --dir "$H/fixture/looks" --streets "$H/fixture/streets"
