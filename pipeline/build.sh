#!/bin/sh
# v37 + the 2026-11 round. Usage: sh pipeline/build.sh /path/out.html
set -e; cd "$(dirname "$0")"; out=${1:?out.html}
cp ../work/build/v37.html "$out"
for s in cars solid talk fight people2 animals streets voice; do python3 add_$s.py "$out"; done
