# SmartExam

SmartExam คือ Progressive Web App แบบ mobile-first สำหรับช่วยครูไทยสร้างข้อสอบ
พิมพ์กระดาษคำตอบ ตรวจด้วยมือถือ และดูรายงานผล โดยเก็บข้อมูลแบบ local-first
ในอุปกรณ์ของครูและทำงานต่อได้เมื่อไม่มีอินเทอร์เน็ต

เวอร์ชันปัจจุบันรองรับ workflow ในเครื่องครบตั้งแต่สร้างข้อสอบจนถึงส่งออกคะแนน
การตรวจจากภาพใช้ OMR ใน browser ค้นหา marker สี่มุมและอ่านวงคำตอบอัตโนมัติ
โดยส่งเฉพาะผลกำกวมให้ครูยืนยัน ส่วน Cloud sync และระบบออก Activate Key ส่วนกลาง
ยังไม่เชื่อมบริการ production

## เทคโนโลยี

- React และ TypeScript แบบ strict บน Vite
- Tailwind CSS สำหรับระบบหน้าตาและ responsive layout
- React Router สำหรับการนำทาง
- Dexie สำหรับ IndexedDB แบบ local-first พร้อม migration และ transaction
- Zod สำหรับตรวจรูปแบบค่ากำหนด
- vite-plugin-pwa สำหรับ manifest, service worker และ offline app shell
- Vitest และ Testing Library สำหรับ automated tests
- ESLint และ Prettier สำหรับคุณภาพและรูปแบบโค้ด

## ความต้องการของเครื่อง

- Node.js รุ่นที่รองรับ Vite (แนะนำ Node.js 22 LTS หรือใหม่กว่า)
- npm

## ติดตั้งและเปิดใช้งาน

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดงใน terminal โดยปกติคือ `http://localhost:5173`

## คำสั่งสำคัญ

```bash
npm run dev          # เปิด development server
npm run preview      # เปิด production build สำหรับทดสอบ PWA
npm run lint         # ตรวจ ESLint
npm run test         # รัน automated tests หนึ่งครั้ง
npm run test:watch   # รัน tests แบบเฝ้าดูไฟล์
npm run build        # ตรวจ TypeScript และสร้าง production build
npm run format       # จัดรูปแบบไฟล์ด้วย Prettier
npm run format:check # ตรวจรูปแบบโดยไม่แก้ไฟล์
```

## ตัวแปรสภาพแวดล้อม

คัดลอก `.env.example` เป็น `.env` เมื่อจำเป็น ไฟล์ `.env` ถูก ignore และห้าม commit
ค่าที่เปิดเผยใน browser ต้องขึ้นต้นด้วย `VITE_` และห้ามใส่ secret

## โครงสร้างหลัก

```text
src/
├── app/                 # routing, app config และหน้าระดับแอป
├── components/          # UI ที่ใช้ร่วมกัน
├── database/            # IndexedDB schema, repository, backup และ restore
├── features/            # โค้ดแยกตามความสามารถของระบบ
├── services/            # ขอบเขต service ในอนาคต
├── styles/              # global styles และ design tokens
└── utils/               # utility ที่ใช้ร่วมกัน
tests/                   # tests ระดับ App Shell
docs/                    # เอกสารผลิตภัณฑ์และสถาปัตยกรรม
```

รายละเอียดเพิ่มเติมอยู่ใน [ข้อกำหนดผลิตภัณฑ์](docs/PRODUCT_REQUIREMENTS.md),
[สถาปัตยกรรม](docs/ARCHITECTURE.md), [แผนงาน](docs/ROADMAP.md) และ
[กลยุทธ์การทดสอบ](docs/TESTING_STRATEGY.md)

## ความสามารถหลัก

- สร้างข้อสอบปรนัย 2–5 ตัวเลือก กำหนดเฉลยและคะแนน พร้อม autosave/recovery
- พิมพ์กระดาษคำตอบขาวดำ A4 พร้อม marker สี่มุม
- เปิดกล้องพร้อมกรอบ A4 เป้า marker 4 มุม และเส้นกึ่งกลาง หรือเลือกภาพจากเครื่อง เพื่ออ่าน OMR อัตโนมัติ พร้อม confidence/รอตรวจ
- คำนวณคะแนนเฉพาะคำตอบที่ยืนยันแล้ว และตรวจทานรายการกำกวมภายหลัง
- รายงานคะแนนเฉลี่ย สูงสุด ต่ำสุด วิเคราะห์รายข้อ และส่งออก CSV
- ตรวจฟรี 10 แผ่นต่ออุปกรณ์ จากนั้นใช้ Activate Key แบบออฟไลน์เพื่อปลดจำกัด
- สำรอง/กู้คืนข้อมูลเป็น JSON โดยจำนวนแผ่นที่ใช้ไม่รีเซ็ตเมื่อลบผล

## การใช้งานแบบ PWA

Production build จะสร้าง web app manifest และ service worker เพื่อ cache app shell
หลังเปิดระบบออนไลน์สำเร็จอย่างน้อยหนึ่งครั้ง แอปสามารถเปิดหน้าพื้นฐานที่เคยติดตั้งไว้ได้เมื่อออฟไลน์
ฟอนต์ Noto Sans Thai ใช้ Google Fonts และจะถูก runtime cache หลังโหลดสำเร็จ

## ขอบเขตความปลอดภัย

- ภาพกระดาษคำตอบใช้แสดงชั่วคราวและไม่บันทึกลง IndexedDB
- ใช้รหัสผู้เข้าสอบแทนชื่อจริง และไม่มีข้อมูลนักเรียนจริงใน source/test
- คำตอบกำกวมไม่มีคะแนนจนกว่าครูจะยืนยัน
- ไฟล์สำรองอาจมีรหัสผู้เข้าสอบ ผู้ใช้ต้องเก็บในพื้นที่ส่วนตัว
- ไม่มี secret, AI API หรือข้อมูลที่ส่งไปยัง Cloud ในเวอร์ชันนี้

## เครดิต

ออกแบบและพัฒนาโดย<br>
[ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing](https://www.facebook.com/suebsing)<br>
Version 1.0 © 2026-2027 All Rights Reserved
