# Roadmap — SmartExam

Roadmap นี้แสดงสถานะการพัฒนาหลังยกระดับระบบจากโครงพื้นฐานเป็นเวอร์ชัน local-first ที่ใช้งานได้

## Phase 0 — Professional Project Foundation

สถานะ: **เสร็จแล้ว**

- Vite, React, TypeScript strict และ Tailwind CSS
- App Shell, navigation, placeholder pages และ responsive foundation
- PWA manifest, offline app shell และ IndexedDB schema เปล่า
- lint, tests, build, format และเอกสารโครงการ

## Phase 1 — Local Exam Authoring

สถานะ: **เสร็จแล้ว**

- domain model สำหรับข้อสอบ คำถาม ตัวเลือก และเฉลย
- สร้าง/แก้ไข draft แบบ local-first
- validation, autosave และ recovery เมื่อปิดแอป
- tests สำหรับ scoring rule และ persistence edge cases

- รองรับข้อสอบปรนัย 2–5 ตัวเลือก คะแนนรายข้อ และสถานะพร้อมใช้
- autosave ลง IndexedDB และ recovery draft ชั่วคราว

## Phase 2 — Printable Answer Sheets

สถานะ: **เสร็จแล้วสำหรับ A4**

- สร้างกระดาษคำตอบขาวดำตามจำนวนข้อและรูปแบบคำตอบ
- print CSS, ขนาดกระดาษ, marker และการตรวจ print preview
- รองรับการถ่ายเอกสารโดยไม่เสียสัดส่วน

- มี marker สี่มุม ช่องรหัสผู้เข้าสอบ และ print CSS แบบขาวดำ
- ต้องตรวจขนาดจริงกับเครื่องพิมพ์แต่ละรุ่นก่อนใช้งานจำนวนมาก

## Phase 3 — Assisted Scanning and Review

สถานะ: **เสร็จแล้วสำหรับกระดาษคำตอบ SmartExam สูงสุด 60 ข้อต่อแผ่น**

- เปิดกล้องและแนวทางจัดภาพ
- OMR ด้วย Canvas/integral image ค้นหา marker สี่มุมและอ่านความเข้มในวง
- confidence score, ambiguous state และหน้าครูยืนยัน
- ห้ามเดาคำตอบที่ไม่ชัดเจน

- เปิดกล้องมือถือในแอปพร้อมกรอบ A4 เป้า marker 4 มุม และเส้นกึ่งกลาง ตัดภาพตามกรอบก่อนวิเคราะห์โดยไม่บันทึกภาพ
- อ่านวงอัตโนมัติพร้อม confidence; ครูยืนยันคำตอบ เว้นว่าง หรือส่งรอตรวจได้
- ภาพต้องเห็น marker ครบสี่มุมและใช้ template ที่สร้างจาก SmartExam

## Phase 4 — Results and Local Reports

สถานะ: **เสร็จแล้ว**

- สรุปคะแนนและรายงานระดับห้อง/ข้อ
- export ที่ไม่เปิดเผยข้อมูลเกินจำเป็น
- audit ความถูกต้องของคะแนนและสถานะ review

- สรุปจำนวน คะแนนเฉลี่ย สูงสุด ต่ำสุด และผลตอบถูกรายข้อ
- ตรวจทานผลกำกวม คำนวณคะแนนใหม่ ลบผล และ export CSV

## Phase 5 — Licensing

สถานะ: **เสร็จแล้วสำหรับโควตาฟรี 10 แผ่นและการตรวจ Key แบบออฟไลน์**

- ตรวจฟรี 10 แผ่นต่ออุปกรณ์และ Activate เพื่อปลดจำกัด
- threat model และ UX สำหรับกรณี offline

- ตรวจรูปแบบ/checksum โดยไม่เก็บ Key เต็มและไม่ส่งออกจากอุปกรณ์
- ระบบออก Key, revoke และย้ายสิทธิ์ต้องใช้บริการออนไลน์ในอนาคต

## Phase 6 — Optional Online Services

สถานะ: **วาง metadata และ boundary แล้ว / ยังไม่มี production backend**

- ออกแบบ sync protocol, conflict resolution และ retry semantics
- ประเมิน Cloudflare Pages/Workers/D1/R2 เมื่อเข้าสู่ระยะ online
- security/privacy review ก่อนส่งข้อมูลออกจากอุปกรณ์

- record มี stable identifier, revision และ sync state
- มี JSON backup/restore แบบ transaction เป็น recovery path
- Cloudflare Workers/D1/R2, authentication, conflict resolution ข้ามอุปกรณ์ และ retry queue ยังไม่เริ่ม
