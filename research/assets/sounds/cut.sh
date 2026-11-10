#!/bin/sh
# usage: sh cut.sh RAW_DIR  (RAW_DIR holds the downloads listed in SOURCE.md, unzipped); writes the mono 24 kHz Opus clips next to this script
set -e; W=$(mktemp -t cut).wav; trap 'rm -f "$W"' EXIT; cd "$(dirname "$0")"; R=${1:?raw dir}; F=/opt/homebrew/bin/ffmpeg
# name src start dur filters; peak-normalised to -2 dB, 4 ms in / 25 ms out fades
cut(){ n=$1 s=$2 ss=$3 t=$4 f=$5
  $F -v error -y -ss $ss -t $t -i "$R/$s" -ac 1 -af "aresample=24000,highpass=f=70,$f,afade=t=in:d=0.004,afade=t=out:st=$(echo "$t" | awk '{print $1-0.025}'):d=0.025" -ar 24000 "$W"
  g=$($F -hide_banner -nostats -i "$W" -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-*[0-9.]*\) dB.*/\1/p')
  $F -v error -y -i "$W" -af "volume=$(echo "$g" | awk '{print -2-$1}')dB" -c:a libopus -b:a 32k -application audio -ar 24000 $n.ogg; }
rs(){ echo "asetrate=$((24000*$1/100)),aresample=24000"; }  # pitch by percent (clip is already 24 kHz; resample first)
cut bark_med    dog_barking_mono.wav 0.50 0.26 anull
cut bark_small  dog_barking_mono.wav 1.62 0.42 "$(rs 135)"
cut bark_big    dog_barking.wav      4.42 0.50 "lowpass=f=3200,$(rs 85)"
cut meow        Meow.ogg             0.00 0.45 anull
cut caw         crow_caw.wav         0.00 0.55 anull
cut coo         Dove_cooing.ogg      1.40 1.35 anull
cut hoot        Dove_cooing.ogg      3.70 1.25 "$(rs 68),lowpass=f=1800"
cut snort       x_80-CC0-creature-SFX_0/nose.ogg 0.00 0.30 anull
cut snuffle     x_felischaus_hedgehogexamples/ex1.mp3 0.78 0.75 anull
cut squeak      x_bat/ogg/bat_01.ogg 0.12 0.30 anull
cut flap        wings_flap_large.ogg 0.00 0.45 "$(rs 150)"
