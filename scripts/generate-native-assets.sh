#!/usr/bin/env bash

# ออกแบบและพัฒนาโดย
# ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
# ให้เครดิตผู้พัฒนาระบบ

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_icon="$project_root/public/icons/icon-512.png"
navy_color="0x0f3d5e"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ต้องติดตั้ง ffmpeg ก่อนสร้าง native assets" >&2
  exit 1
fi

render_icon() {
  local size="$1"
  local output="$2"
  local radius=$((size * 21 / 100))
  ffmpeg -loglevel error -y \
    -f lavfi -i "color=c=${navy_color}:s=${size}x${size}" \
    -i "$source_icon" \
    -filter_complex "[1:v]scale=${size}:${size},format=rgba[logo];nullsrc=s=${size}x${size},format=gray,geq=lum='if(lte(pow(max(abs(X-W/2)-W/2+${radius}\\,0)\\,2)+pow(max(abs(Y-H/2)-H/2+${radius}\\,0)\\,2)\\,pow(${radius}\\,2))\\,255\\,0)'[mask];[logo][mask]alphamerge[masked];[0:v][masked]overlay=0:0:format=auto,format=rgb24" \
    -frames:v 1 -update 1 "$output"
}

render_foreground() {
  local size="$1"
  local logo_size="$2"
  local output="$3"
  local radius=$((logo_size * 21 / 100))
  ffmpeg -loglevel error -y \
    -f lavfi -i "color=c=black@0.0:s=${size}x${size},format=rgba" \
    -i "$source_icon" \
    -filter_complex "[1:v]scale=${logo_size}:${logo_size},format=rgba[logo];nullsrc=s=${logo_size}x${logo_size},format=gray,geq=lum='if(lte(pow(max(abs(X-W/2)-W/2+${radius}\\,0)\\,2)+pow(max(abs(Y-H/2)-H/2+${radius}\\,0)\\,2)\\,pow(${radius}\\,2))\\,255\\,0)'[mask];[logo][mask]alphamerge[masked];[0:v][masked]overlay=(W-w)/2:(H-h)/2:format=auto,format=rgba" \
    -frames:v 1 -update 1 "$output"
}

render_splash() {
  local width="$1"
  local height="$2"
  local logo_size="$3"
  local output="$4"
  local radius=$((logo_size * 21 / 100))
  ffmpeg -loglevel error -y \
    -f lavfi -i "color=c=${navy_color}:s=${width}x${height}" \
    -i "$source_icon" \
    -filter_complex "[1:v]scale=${logo_size}:${logo_size},format=rgba[logo];nullsrc=s=${logo_size}x${logo_size},format=gray,geq=lum='if(lte(pow(max(abs(X-W/2)-W/2+${radius}\\,0)\\,2)+pow(max(abs(Y-H/2)-H/2+${radius}\\,0)\\,2)\\,pow(${radius}\\,2))\\,255\\,0)'[mask];[logo][mask]alphamerge[masked];[0:v][masked]overlay=(W-w)/2:(H-h)/2:format=auto,format=rgb24" \
    -frames:v 1 -update 1 "$output"
}

densities=(mdpi hdpi xhdpi xxhdpi xxxhdpi)
legacy_sizes=(48 72 96 144 192)
foreground_sizes=(108 162 216 324 432)
foreground_logo_sizes=(72 108 144 216 288)

for index in "${!densities[@]}"; do
  density="${densities[$index]}"
  legacy_size="${legacy_sizes[$index]}"
  foreground_size="${foreground_sizes[$index]}"
  foreground_logo_size="${foreground_logo_sizes[$index]}"
  output_dir="$project_root/android/app/src/main/res/mipmap-${density}"

  render_icon "$legacy_size" "$output_dir/ic_launcher.png"
  render_icon "$legacy_size" "$output_dir/ic_launcher_round.png"
  render_foreground "$foreground_size" "$foreground_logo_size" \
    "$output_dir/ic_launcher_foreground.png"
done

render_splash 480 320 128 "$project_root/android/app/src/main/res/drawable/splash.png"

portrait_widths=(320 480 640 960 1280)
portrait_heights=(480 720 960 1440 1920)
landscape_widths=(480 720 960 1440 1920)
landscape_heights=(320 480 640 960 1280)
logo_sizes=(128 192 256 384 512)

for index in "${!densities[@]}"; do
  density="${densities[$index]}"
  logo_size="${logo_sizes[$index]}"
  render_splash "${portrait_widths[$index]}" "${portrait_heights[$index]}" "$logo_size" \
    "$project_root/android/app/src/main/res/drawable-port-${density}/splash.png"
  render_splash "${landscape_widths[$index]}" "${landscape_heights[$index]}" "$logo_size" \
    "$project_root/android/app/src/main/res/drawable-land-${density}/splash.png"
done

render_icon 1024 \
  "$project_root/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
for suffix in "" "-1" "-2"; do
  render_splash 2732 2732 920 \
    "$project_root/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732${suffix}.png"
done

echo "สร้างไอคอนและ splash screen สำหรับ Android/iOS เรียบร้อยแล้ว"
