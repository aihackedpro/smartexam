# Architecture — SmartExam

## 1. หลักการ

SmartExam ใช้สถาปัตยกรรม feature-based และ local-first โดยแยกความรับผิดชอบระหว่าง UI,
domain logic, persistence และ synchronization ตั้งแต่เริ่มต้น เวอร์ชันปัจจุบันมี business logic
และ persistence ในเครื่องแล้ว

## 2. Technology Baseline

- **UI:** React, React Router, Lucide React และ Tailwind CSS
- **Language:** TypeScript แบบ strict
- **Build:** Vite
- **Local persistence:** IndexedDB ผ่าน Dexie
- **Validation:** Zod
- **PWA:** vite-plugin-pwa และ Workbox แบบ generateSW
- **Quality:** ESLint, Prettier, Vitest และ Testing Library

## 3. โครงสร้าง

```text
src/
├── app/              # composition root, routes, app config และหน้าทั่วไป
├── components/       # App Shell และ shared presentation components
├── features/
│   ├── exams/        # ข้อสอบและชุดข้อสอบ
│   ├── questions/    # คำถามและตัวเลือก
│   ├── answer-sheets/# กระดาษคำตอบและงานพิมพ์
│   ├── scanner/      # flow การสแกนในอนาคต (ยังไม่มี OMR)
│   ├── results/      # รายงานและผลตรวจ
│   └── licensing/    # ขอบเขตสงวนไว้ ยังไม่มี Activate Key
├── database/         # Dexie database และ migrations ในอนาคต
├── services/         # adapters และ synchronization boundary ในอนาคต
├── styles/           # design tokens, global CSS, accessibility behavior
└── utils/            # pure utilities ที่ใช้ข้าม feature
```

Feature ต้องไม่เข้าถึง implementation ภายในของ feature อื่นโดยตรง การใช้ร่วมกันให้ผ่าน type,
component หรือ service contract ที่อยู่ใน shared boundary

## 4. Runtime Flow

```text
index.html
  → src/main.tsx
    → BrowserRouter
      → AppRoutes
        → AppShell
          → Feature page
            → domain logic
            → repository
            → Dexie / IndexedDB
```

`main.tsx` ลงทะเบียน service worker ที่สร้างจาก Vite PWA plugin แต่ละ feature เรียก repository
แทนการเข้าถึง Dexie โดยตรง ภาพจากกล้องอยู่ใน object URL ชั่วคราวและไม่บันทึกลงฐานข้อมูล

## 5. IndexedDB Foundation

`SmartExamDatabase` ใช้ชื่อ database `SmartExam` โดย schema version 2 มี `exams`, `results`
และ `settings` การบันทึกเพิ่ม revision และกำหนด sync state เป็น pending เพื่อเตรียมเชื่อม outbox ในอนาคต

เมื่อเริ่ม persistence ต้องปฏิบัติตามหลักต่อไปนี้:

- transaction ต้อง atomic และทนต่อการปิดแอป
- ทุก record ที่ sync ได้ต้องมี stable identifier และ revision metadata
- retry ต้อง idempotent เพื่อไม่สร้างข้อมูลซ้ำ
- migration ต้องมี automated test และเส้นทางกู้คืน

## 6. PWA และ Offline App Shell

Vite PWA ใช้ `generateSW` เพื่อ precache ไฟล์ build และใช้ `index.html` เป็น navigation fallback
จึงเปิด UI shell เดิมได้หลังติดตั้ง/โหลดสำเร็จแล้ว Google Fonts ใช้ runtime cache;
หากยังไม่เคย cache ระบบจะ fallback ไปยัง system sans-serif โดยไม่ทำให้แอปหยุดทำงาน

## 7. Security และ Privacy Boundary

- ไม่มี secret หรือ credential ใน client bundle
- `.env` เป็น local-only และเฉพาะค่า `VITE_` ที่ตั้งใจเปิดเผยต่อ browser เท่านั้น
- ไม่มีข้อมูลนักเรียนจริงใน source, tests หรือเอกสาร และ UI แนะนำให้ใช้รหัสแทนชื่อ
- scanner เก็บ confidence/status และส่งผลกำกวมให้ครูตรวจโดยไม่ให้คะแนนอัตโนมัติ
- online backend และ sync เป็นขอบเขต Phase อนาคต ไม่รวมอยู่ในโครงปัจจุบัน

## 8. Architecture Decision Notes

- ใช้ route-level feature pages เพื่อลด coupling กับ App Shell
- ใช้ navigation config กลางเพื่อรักษาลำดับและชื่อเมนูให้สอดคล้องกัน
- ใช้ Zod ตรวจ app config เพื่อเตรียมรูปแบบ runtime validation
- ยังไม่เพิ่ม state management library เพราะ state ข้าม feature สื่อสารผ่าน repository event ขนาดเล็ก
- ยังไม่เพิ่ม OpenCV.js, API client หรือ Cloudflare package จนกว่าจะอนุมัติการอ่าน OMR และ online service
