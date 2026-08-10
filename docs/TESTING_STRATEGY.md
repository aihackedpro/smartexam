# Testing Strategy — SmartExam

## 1. เป้าหมาย

การทดสอบต้องสร้างความมั่นใจว่า UI ใช้งานได้จริงบนอุปกรณ์เป้าหมาย ข้อมูล local-first ไม่สูญหาย
และผลตรวจ/คะแนนไม่ถูกเดาหรือคำนวณผิด เมื่อ feature เหล่านั้นเริ่มพัฒนา

## 2. Testing Pyramid

### Unit tests

ใช้กับ pure domain logic เช่น validation, scoring, normalization, confidence thresholds
และ conflict resolution ต้องครอบคลุม happy path, boundary และ invalid input

### Component tests

ใช้ Testing Library ทดสอบจากมุมมองผู้ใช้:

- role, label และข้อความภาษาไทย
- keyboard navigation และ focus state ที่สำคัญ
- สถานะสำเร็จ รอตรวจ คำเตือน และข้อผิดพลาด
- route และ active navigation

### Integration tests

เมื่อเริ่ม persistence ให้ทดสอบ IndexedDB transaction, migration, app restart, quota/error path,
offline/reconnect และ retry โดยไม่สร้างข้อมูลซ้ำ

### End-to-end และ visual checks

ทดสอบ flow สำคัญบน browser จริง ตรวจอย่างน้อยที่ 320px, 375px, 768px และ desktop
รวมถึง keyboard, reduced motion และ print preview สำหรับกระดาษคำตอบ

## 3. Coverage ปัจจุบัน

มี automated tests สำหรับ:

- App Shell และหัวข้อหน้าหลัก
- เมนูหลักครบ 5 รายการ
- การนำทางและ `aria-current`
- ปุ่มงานหลัก 3 รายการ
- Footer และเครดิตครบถ้วน
- scoring ที่ยืนยันแล้ว คำตอบว่าง และคำตอบกำกวม
- OMR fill classification และพิกัด template สองคอลัมน์
- validation ของข้อสอบและ Activate Key: ลายเซ็น, ผิดเครื่อง, หมดอายุ และเวลาไม่ถูกต้อง
- IndexedDB persistence, revision, scan quota, transaction delete และ backup/restore แบบ idempotent

นอกจากนี้ตรวจ build output ว่ามี web manifest, service worker และไอคอน PWA

## 4. กฎสำหรับ Phase อนาคต

- การให้คะแนนต้องมี test ก่อนเชื่อม UI
- การบันทึก offline ต้องทดสอบการปิดแอปกลาง transaction และการเปิดใหม่
- sync ต้องทดสอบ duplicate delivery, out-of-order update และ reconnect
- ผลสแกนกำกวมต้องถูกส่งเป็นสถานะรอตรวจ ไม่แปลงเป็นคำตอบอัตโนมัติ
- ห้ามใช้ข้อมูลนักเรียนจริงใน test หรือ snapshot
- print layout ต้องตรวจขนาดจริงและความคมชัดหลังถ่ายเอกสาร

## 5. Quality Gate

ก่อนส่งมอบการเปลี่ยนแปลงทุกครั้งต้องรัน:

```bash
npm run lint
npm run test
npm run build
```

ต้องรายงานคำสั่งและผลตามจริง หากคำสั่งใดไม่สามารถรันได้ให้ระบุ blocker โดยห้ามสรุปว่าผ่าน
