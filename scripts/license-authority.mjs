/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { getAuthorityStatus, issueLicense } from './license-authority-core.mjs';

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function printUsage() {
  console.log(`SmartExam License Authority

เปิดศูนย์ออกคีย์แบบหน้าจอ:
  npm run license:admin

ตรวจสถานะกุญแจ:
  npm run license:status

ออก Activate Key ผ่าน command line:
  npm run license:issue -- --device "SME-D1-..." --plan month
  npm run license:issue -- --device "SME-D1-..." --plan year
  npm run license:issue -- --device "SME-D1-..." --plan lifetime`);
}

async function runIssueCommand() {
  const result = await issueLicense({
    deviceCode: readArgument('--device'),
    plan: readArgument('--plan'),
    start: readArgument('--start'),
    licenseId: readArgument('--license-id'),
    customerReference: readArgument('--customer'),
  });
  console.log('\nออก Activate Key สำเร็จ');
  console.log(`License ID : ${result.claims.licenseId}`);
  console.log(`แพ็กเกจ    : ${result.claims.plan}`);
  console.log(`เริ่ม       : ${result.claims.issuedAt}`);
  console.log(`หมดอายุ    : ${result.claims.expiresAt ?? 'ตลอดอายุการใช้งาน'}`);
  console.log('\nActivate Key:\n');
  console.log(result.token);
}

try {
  const command = process.argv[2];
  if (command === 'issue') await runIssueCommand();
  else if (command === 'status') {
    const status = getAuthorityStatus();
    console.log('SmartExam License Authority: พร้อมออกคีย์');
    console.log(`Key ID: ${status.keyId}`);
    console.log(`Private key: ${status.storage} (ไม่อยู่ใน repository)`);
  } else printUsage();
} catch (error) {
  console.error(`\nผิดพลาด: ${error instanceof Error ? error.message : 'ไม่สามารถทำรายการได้'}`);
  process.exitCode = 1;
}
