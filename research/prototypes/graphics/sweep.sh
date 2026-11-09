#!/bin/sh
# usage: sweep.sh page.html  -> one JSON line per config and resolution (all effects off unless named)
P=$1; O='"ao":false,"softShadows":false'
run(){ for r in "1280 720" "2560 1440"; do node "$(dirname $0)/bench.mjs" $P $r "{$2}" $3; done; }
run base "$O"
run soft '"ao":false,"softShadows":true'
run sh1024 "$O,\"shadowSize\":1024"
run sh4096 "$O,\"shadowSize\":4096"
run ao '"ao":true,"softShadows":false'
run tone "$O,\"tone\":true"
run bloom "$O,\"bloom\":true"
run sky "$O,\"sky\":true"
run sunpath "$O,\"sunPath\":true"
run all '"ao":true,"softShadows":true,"bloom":true,"sky":true,"sunPath":true'
