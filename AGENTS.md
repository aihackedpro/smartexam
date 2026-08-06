# Repository Guidelines

## Project Scope

SmartExam คือระบบสร้างข้อสอบ พิมพ์กระดาษคำตอบ และตรวจด้วยมือถือสำหรับครูไทย พัฒนาเป็น Progressive Web App แบบ mobile-first รองรับการทำงานทั้ง online/offline การสร้างข้อสอบแบบการ์ด กระดาษคำตอบแบบฝนหรือกากบาท การสแกนตรวจ รายงานผล และการเพิ่ม DEMO/Activate Key ในอนาคต ข้อมูลต้องเป็น local-first และซิงก์เมื่อมีอินเทอร์เน็ต

ทำงานทีละ Phase ตามขอบเขตที่ได้รับ ห้ามเริ่ม Cloud backend หรือ AI API จนกว่าจะมีคำสั่ง และห้ามเปลี่ยนเทคโนโลยีหลักหรือเพิ่ม production dependency โดยไม่มีเหตุผลที่ชัดเจนและได้รับความเห็นชอบ

## Technology & Architecture

ใช้ React, TypeScript แบบ `strict`, Vite, Tailwind CSS, PWA, IndexedDB และฟอนต์ Noto Sans Thai แยกโค้ดตาม feature เช่น `src/features/exams/`, `src/features/scanning/` และ `src/features/reports/`; วางส่วนที่ใช้ร่วมกันใน `src/components/`, `src/lib/` หรือ `src/types/` และเก็บ assets ใน `public/` หรือ `src/assets/` ตามลักษณะการใช้งาน ห้ามรวม logic จำนวนมากไว้ในไฟล์เดียว

OpenCV.js สงวนไว้สำหรับงาน OMR ระยะถัดไป ส่วน Cloudflare Pages, Workers, D1 และ R2 ใช้เมื่อเข้าสู่ระยะ online เท่านั้น รักษาขอบเขตระหว่าง UI, domain logic, persistence และ synchronization ให้ชัดเจน

## Development Commands

เมื่อมี `package.json` แล้ว ให้ใช้ scripts ของโครงการเป็นหลัก:

- `npm run dev` — เปิด development server
- `npm run lint` — ตรวจ lint และกฎ TypeScript
- `npm run test` — รัน automated tests
- `npm run build` — ตรวจ type และสร้าง production build

หลังแก้ไขต้องรัน lint, test และ build ทุกครั้ง หาก command ยังไม่มีหรือรันไม่ได้ ให้รายงานตามจริง ห้ามอ้างว่าผ่านโดยไม่ได้ทดสอบ และห้ามติดตั้ง dependency เพิ่มเองนอกขอบเขตงาน

## Coding Style & Naming

ใช้ TypeScript แบบ strict และห้ามใช้ `any` เว้นแต่มีเหตุผลระบุไว้ชัดเจน ใช้ `PascalCase` สำหรับ component/type, `camelCase` สำหรับ function/variable และชื่อไฟล์ตาม convention เดียวกันทั้ง feature เขียนข้อความ UI เป็นภาษาไทยที่สั้น ชัด และเหมาะกับครู ฟังก์ชันสำคัญ โดยเฉพาะการให้คะแนน การบันทึก offline การ sync และการตีความผลสแกน ต้องมี test

ในไฟล์ซอร์สหลักและโมดูลที่พัฒนาขึ้นเอง ให้ใส่คอมเมนต์เครดิตต่อไปนี้ แต่ห้ามเพิ่มในไฟล์ generated หรือ dependency:

```text
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
```

## UI, Accessibility & Printing

ออกแบบ mobile-first ตั้งแต่ความกว้าง 320px และตรวจทั้งมือถือกับ desktop พื้นที่แตะต้องไม่น้อยกว่า 48px เมนูหลักด้านล่างมีไม่เกิน 5 รายการตามลำดับ: หน้าหลัก, สร้างข้อสอบ, สแกนตรวจ, รายงานผล, เพิ่มเติม

ใช้โทนน้ำเงินเข้ม เขียวมรกต ขาว และเทาอ่อน ในแนว Professional Educational Technology เน้นการ์ดขนาดใหญ่และอ่านง่าย ใช้ animation สุภาพประมาณ 150–250ms พร้อมรองรับ `prefers-reduced-motion` แสดงสถานะสำเร็จ รอตรวจ คำเตือน และข้อผิดพลาดให้แตกต่างชัดเจน ตรวจ keyboard accessibility, focus state และ contrast เสมอ กระดาษคำตอบต้องเป็นขาวดำ รักษาสัดส่วน และเหมาะกับการถ่ายเอกสาร

Footer ทุกหน้าต้องแสดงสามบรรทัด:

1. `ออกแบบและพัฒนาโดย`
2. `ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing` โดยทั้งข้อความลิงก์ไปที่ `https://www.facebook.com/suebsing` และไม่มีไอคอน Facebook
3. `Version 1.0 © 2026-2027 All Rights Reserved`

## Data, Security & Scanning Safety

รักษาความเป็นส่วนตัวของข้อมูลนักเรียน เก็บเฉพาะข้อมูลจำเป็นและหลีกเลี่ยงข้อมูลจริงใน fixture/log ห้ามใส่ API key, secret หรือรหัสฐานข้อมูลในซอร์ส ใช้ `.env.example` สำหรับตัวอย่างค่าเท่านั้น และห้าม commit `.env`

การสแกนที่ไม่ชัดเจนต้องมี confidence/สถานะรอตรวจและส่งให้ครูยืนยัน ห้ามเดาคำตอบโดยอัตโนมัติ การบันทึก local และการ sync ต้องทนต่อการปิดแอป เครือข่ายขาด และการ retry โดยไม่ทำข้อมูลสูญหายหรือซ้ำ

## Testing Guidelines

ตั้งชื่อ test ตามพฤติกรรม เช่น `exam-scoring.test.ts` และวางใกล้ feature หรือ mirror โครงสร้าง `src/` ทดสอบ happy path, edge case, offline/reconnect, persistence และกรณีผลสแกนกำกวม สำหรับ UI ให้ตรวจ responsive, keyboard, reduced motion, สถานะต่าง ๆ และ print preview/ขนาดกระดาษ

## Code Review Rules

ผู้ตรวจต้องพิจารณาเป็นพิเศษ:

- การรั่วไหลหรือเก็บข้อมูลนักเรียนเกินจำเป็น
- secret หรือ credential ที่ถูกใส่ในโค้ด
- การเดาคำตอบสแกนโดยไม่มี confidence และขั้นตอนให้ครู review
- ความเสี่ยงที่ข้อมูล offline สูญหาย ซ้ำ หรือ sync ผิด
- กระดาษคำตอบหรือ CSS สำหรับพิมพ์ผิดสัดส่วน
- flow, layout หรือพื้นที่แตะที่ไม่รองรับมือถือ 320px

## Change, Commit & Handoff Rules

ตรวจไฟล์และงานเดิมก่อนแก้ทุกครั้ง ห้ามลบหรือเขียนทับโดยไม่เข้าใจผลกระทบ จำกัดการเปลี่ยนแปลงให้อยู่ใน Phase และขอบเขตที่ได้รับ เมื่อส่งมอบให้สรุปไฟล์ที่แก้ คำสั่งที่รัน ผลทดสอบ และปัญหาที่ยังคงอยู่ตามจริง ห้าม commit หรือ push จนกว่าจะได้รับคำสั่งโดยตรง

เมื่อได้รับอนุญาตให้ commit ให้ใช้ข้อความแบบ imperative หรือ Conventional Commits เช่น `feat: add offline exam draft` Pull request ต้องอธิบายขอบเขต วิธีทดสอบ issue ที่เกี่ยวข้อง และแนบภาพเมื่อ UI เปลี่ยน
