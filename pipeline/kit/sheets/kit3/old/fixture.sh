#!/bin/sh
# fixture.sh /abs/base.html /abs/old.html /abs/new.html: base = a build without the kit step; old/new = base + every description that
# existed when kit 3 started (fixture/), drawn by the kit before kit 3 (old/kit.js) / by the live kit (KIT_PY, default add_kit.py)
set -e; H=$(cd "$(dirname "$0")" && pwd); P=$(cd "$H/../../../.." && pwd)
cp "$1" "$2"; cp "$1" "$3"
python3 "$H/add_kit.py" "$2" --dir "$H/fixture/looks" --streets "$H/fixture/streets"
python3 "$P/${KIT_PY:-add_kit.py}" "$3" --dir "$H/fixture/looks" --streets "$H/fixture/streets"
