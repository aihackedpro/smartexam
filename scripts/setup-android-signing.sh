#!/usr/bin/env bash

# ออกแบบและพัฒนาโดย
# ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
# ให้เครดิตผู้พัฒนาระบบ

set -euo pipefail

keychain_account="smartexam-release"
keychain_service="com.hackedpro.smartexam.android-signing"
keystore_dir="${SMARTEXAM_SIGNING_DIR:-$HOME/Library/Application Support/SmartExam Android Signing}"
keystore_path="$keystore_dir/smartexam-release.jks"
password_file="$(mktemp)"

cleanup() {
  rm -f "$password_file"
  unset SMARTEXAM_GENERATED_KEY_PASSWORD
}
trap cleanup EXIT

if ! command -v security >/dev/null 2>&1; then
  echo "สคริปต์นี้ต้องใช้ macOS Keychain (คำสั่ง security)" >&2
  exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
  echo "ไม่พบ keytool กรุณาติดตั้ง JDK ก่อน" >&2
  exit 1
fi

if [ -e "$keystore_path" ]; then
  if security find-generic-password -a "$keychain_account" -s "$keychain_service" >/dev/null 2>&1; then
    echo "พบกุญแจเซ็นแอปเดิมและรหัสใน Keychain แล้ว: $keystore_path"
    exit 0
  fi
  echo "พบไฟล์กุญแจ แต่ไม่พบรหัสใน Keychain หยุดเพื่อป้องกันการเขียนทับ" >&2
  exit 1
fi

if security find-generic-password -a "$keychain_account" -s "$keychain_service" >/dev/null 2>&1; then
  echo "พบรหัสใน Keychain แต่ไม่พบไฟล์กุญแจ หยุดเพื่อป้องกันการสร้างกุญแจคนละชุด" >&2
  exit 1
fi

mkdir -p "$keystore_dir"
chmod 700 "$keystore_dir"
openssl rand -base64 48 | tr -d '\n' > "$password_file"
chmod 600 "$password_file"
export SMARTEXAM_GENERATED_KEY_PASSWORD="$(<"$password_file")"

keytool -genkeypair \
  -keystore "$keystore_path" \
  -storetype PKCS12 \
  -storepass:env SMARTEXAM_GENERATED_KEY_PASSWORD \
  -keypass:env SMARTEXAM_GENERATED_KEY_PASSWORD \
  -alias smartexam \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -dname "CN=Pongwattana Suebsing, OU=SmartExam, O=hAcKEdpRO, L=Bangkok, ST=Bangkok, C=TH"

chmod 600 "$keystore_path"
security add-generic-password \
  -U \
  -a "$keychain_account" \
  -s "$keychain_service" \
  -w "$SMARTEXAM_GENERATED_KEY_PASSWORD" >/dev/null

echo "สร้างกุญแจเซ็น Android และเก็บรหัสใน macOS Keychain เรียบร้อยแล้ว"
echo "ตำแหน่งกุญแจ: $keystore_path"
echo "ต้องสำรองไฟล์นี้อย่างปลอดภัย เพราะแอปรุ่นถัดไปต้องใช้กุญแจชุดเดิม"
