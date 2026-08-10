#!/usr/bin/env bash

# ออกแบบและพัฒนาโดย
# ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
# ให้เครดิตผู้พัฒนาระบบ

set -euo pipefail

build_mode="${1:-all}"
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
keychain_account="smartexam-release"
keychain_service="com.hackedpro.smartexam.android-signing"
default_keystore="$HOME/Library/Application Support/SmartExam Android Signing/smartexam-release.jks"

if [ "$build_mode" != "all" ] && [ "$build_mode" != "apk" ] && [ "$build_mode" != "bundle" ]; then
  echo "โหมดที่รองรับ: all, apk, bundle" >&2
  exit 1
fi

export SMARTEXAM_ANDROID_KEYSTORE="${SMARTEXAM_ANDROID_KEYSTORE:-$default_keystore}"
export SMARTEXAM_ANDROID_KEY_ALIAS="${SMARTEXAM_ANDROID_KEY_ALIAS:-smartexam}"

if [ ! -f "$SMARTEXAM_ANDROID_KEYSTORE" ]; then
  echo "ไม่พบกุญแจเซ็น Android ให้รัน npm run android:signing:setup ก่อน" >&2
  exit 1
fi

if [ -z "${SMARTEXAM_ANDROID_KEYSTORE_PASSWORD:-}" ]; then
  if ! command -v security >/dev/null 2>&1; then
    echo "กำหนด SMARTEXAM_ANDROID_KEYSTORE_PASSWORD สำหรับระบบที่ไม่มี macOS Keychain" >&2
    exit 1
  fi
  export SMARTEXAM_ANDROID_KEYSTORE_PASSWORD
  SMARTEXAM_ANDROID_KEYSTORE_PASSWORD="$(security find-generic-password -w -a "$keychain_account" -s "$keychain_service")"
fi

export SMARTEXAM_ANDROID_KEY_PASSWORD="${SMARTEXAM_ANDROID_KEY_PASSWORD:-$SMARTEXAM_ANDROID_KEYSTORE_PASSWORD}"

cd "$project_root"
npm run native:sync

gradle_tasks=()
if [ "$build_mode" = "all" ] || [ "$build_mode" = "apk" ]; then
  gradle_tasks+=(assembleRelease)
fi
if [ "$build_mode" = "all" ] || [ "$build_mode" = "bundle" ]; then
  gradle_tasks+=(bundleRelease)
fi

(cd android && ./gradlew "${gradle_tasks[@]}")

mkdir -p "$project_root/release"
if [ "$build_mode" = "all" ] || [ "$build_mode" = "apk" ]; then
  cp "$project_root/android/app/build/outputs/apk/release/app-release.apk" \
    "$project_root/release/SmartExam-1.0.0-Android.apk"
  shasum -a 256 "$project_root/release/SmartExam-1.0.0-Android.apk"
fi
if [ "$build_mode" = "all" ] || [ "$build_mode" = "bundle" ]; then
  cp "$project_root/android/app/build/outputs/bundle/release/app-release.aab" \
    "$project_root/release/SmartExam-1.0.0-Android.aab"
  shasum -a 256 "$project_root/release/SmartExam-1.0.0-Android.aab"
fi

unset SMARTEXAM_ANDROID_KEYSTORE_PASSWORD
unset SMARTEXAM_ANDROID_KEY_PASSWORD

echo "สร้าง Android release เรียบร้อยแล้วที่ $project_root/release"
