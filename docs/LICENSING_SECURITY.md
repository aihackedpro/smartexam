# SmartExam Licensing Security

ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ

## Security model

SmartExam Version 1.0 ใช้ใบอนุญาตที่ลงลายเซ็น ECDSA P-256/SHA-256 แทน checksum เดิม
แอปลูกค้ามีเฉพาะ public key สำหรับตรวจลายเซ็น ส่วน private key ของเจ้าของไม่อยู่ใน source,
GitHub, PWA หรือไฟล์ Backup

การติดตั้งแต่ละชุดสร้าง key pair ประจำเครื่องผ่าน Web Crypto โดย private key เป็น
non-extractable `CryptoKey` ใน IndexedDB Key โปรแกรมเป็น SHA-256 fingerprint ของ public key
ใบอนุญาตจะผูกกับ fingerprint นี้และไม่สามารถใช้กับการติดตั้งอื่นตาม flow ปกติ

## Owner authority

private signing key ชุด `owner-2026-01` ถูกเก็บใน macOS Keychain ของเครื่องเจ้าของภายใต้
service `SmartExam License Authority v1` ห้ามคัดลอก private JWK ลง repository, source,
GitHub Actions secret ที่ไม่จำเป็น หรือระบบแชต

ตรวจสถานะ:

```bash
npm run license:status
```

เปิดศูนย์ออกคีย์แบบหน้าจอสำหรับเจ้าของ:

```bash
npm run license:admin
```

ระบบจะเปิดหน้าเว็บบน `127.0.0.1` เท่านั้น สุ่ม session token ใหม่ทุกครั้ง ตรวจ Origin,
ไม่เปิด CORS และไม่ส่ง private key ออกจาก Node process การออกคีย์แต่ละครั้งถูกบันทึกที่
`~/Library/Application Support/SmartExam License Authority/issued-licenses.jsonl`

ออกใบอนุญาต:

```bash
npm run license:issue -- --device "SME-D1-..." --plan month
npm run license:issue -- --device "SME-D1-..." --plan year
npm run license:issue -- --device "SME-D1-..." --plan lifetime
```

ระยะเวลาเริ่มนับจากเวลาที่ออกคีย์: `month` 30 วัน, `year` 365 วัน และ `lifetime`
ไม่มีวันหมดอายุ ควรบันทึก License ID, Key โปรแกรม, แพ็กเกจ, วันที่ออก และผู้ซื้อในทะเบียนขายส่วนตัว

## Backup and migration

Backup Version 2 ไม่รวม Activate Key, ใบอนุญาต, private device key, สถานะเปิดใช้งาน หรือจำนวนสิทธิ์
การ Restore จะรักษาโควตาและใบอนุญาตของเครื่องปลายทาง และนำกลับเฉพาะข้อมูลครู ข้อสอบ และผลตรวจ

หากผู้ใช้ล้าง Site Data, ถอน PWA หรือติดตั้งระบบปฏิบัติการใหม่ Device Key อาจสูญหาย
ต้องออกนโยบายย้ายเครื่องโดยยกเลิกใบอนุญาตเดิมในทะเบียนขายก่อนออกใบอนุญาตใหม่

## Threat boundaries

- ระบบปฏิเสธ token ที่ลายเซ็นผิด, ผิดเครื่อง, หมดอายุ, ใช้ key รุ่นอื่น หรือออกในอนาคต
- ระบบเก็บ `lastTrustedAt` และปฏิเสธเมื่อนาฬิกาย้อนกลับเกิน tolerance
- device private key ต้องพิสูจน์การ sign/verify ได้ก่อนยอมรับใบอนุญาต
- การแก้ `licenseStatus` ใน IndexedDB แบบเดิมไม่มีผล เพราะระบบไม่ใช้ field นี้แล้ว
- Backup ไม่สามารถ Activate เครื่องหรือรีเซ็ต trial quota ได้

PWA ที่ทำงานแบบ client-only ไม่สามารถป้องกันผู้โจมตีที่แก้ source แล้วสร้างสำเนาแอปใหม่ได้อย่างสมบูรณ์
การบังคับใช้ระดับสูงสุดต้องเพิ่ม authenticated backend, activation ledger, revocation และ periodic signed lease
ผ่าน Cloudflare Worker/Access/D1 โดย private signing key ต้องอยู่ใน secret manager เท่านั้น
