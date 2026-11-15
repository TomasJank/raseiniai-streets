#!/bin/bash
# run_proof.sh page.html tag  bid:k ...
R=/Users/tomasjankauskas/Desktop/Projects/raseiniai-streets
page=$1;tag=$2;shift 2
python3 proof.py views_$tag.json "$@" 2>&1 | grep -v Warn
[ -d cs_before_$tag ] || node $R/pipeline/kit/camshots.mjs $R/work/build/v70.html views_$tag.json cs_before_$tag | tail -1
rm -rf cs_after_$tag; node $R/pipeline/kit/camshots.mjs $page views_$tag.json cs_after_$tag | tail -1
python3 $R/pipeline/kit/camsheet.py views_$tag.json cs_before_$tag cs_after_$tag sa_$tag.jpg 4
