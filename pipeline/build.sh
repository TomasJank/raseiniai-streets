#!/bin/sh
# v37 + the 2026-11 round. Usage: sh pipeline/build.sh /path/out.html
set -e; cd "$(dirname "$0")"; out=${1:?out.html}
cp ../work/build/v37.html "$out"
for s in importmap cars solid talk fight people2 animals streets voice assets chars facades drive gfx water2 animals2 fight2 cars2 fixgfx fixpeople; do python3 add_$s.py "$out"; done
