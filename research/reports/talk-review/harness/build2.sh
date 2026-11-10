#!/bin/sh
# scratch copy of pipeline/build.sh with fixtalk2 after streets; STOP=step ends the chain after that step
set -e; P=/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets/pipeline; out=${1:?out.html}
cp $P/../work/build/v37.html "$out"
for s in importmap cars solid talk fight people2 animals streets fixtalk2 voice assets chars facades drive gfx water2 animals2 fight2 cars2 fixgfx fixpeople fixtalk fixwater fixground kick parked2 drive2; do
  python3 $P/add_$s.py "$out"; [ "$s" = "${STOP:-}" ] && exit 0; done
