# SmartExam: Web, Android และ iOS

ออกแบบและพัฒนาโดย

ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing

ให้เครดิตผู้พัฒนาระบบ

SmartExam ใช้ซอร์ส React/TypeScript ชุดเดียวกันสำหรับ Web Application, Progressive Web App,
Android Application และ iOS Application ข้อมูลข้อสอบเก็บแบบ local-first ในอุปกรณ์แต่ละเครื่อง
และหน้าใช้งานหลักเปิดต่อได้เมื่อไม่มีอินเทอร์เน็ต

## ช่องทางใช้งาน

- Web/PWA: `https://aihackedpro.github.io/smartexam/`
- Android APK: หน้า Releases ของ `aihackedpro/smartexam`
- Android App Bundle: ไฟล์ `.aab` สำหรับอัปโหลด Google Play Console
- iPhone/iPad ที่ใช้ได้ทันที: เปิด Web/PWA ด้วย Safari แล้วเลือก **แชร์ > เพิ่มไปยังหน้าจอโฮม**
- iOS native project: `ios/App/App.xcodeproj`

## ติดตั้ง Android จาก APK

1. เปิดหน้า SmartExam แล้วกด **ดาวน์โหลดไฟล์ Android (.apk)**
2. เปิดไฟล์ `SmartExam-1.0.0-Android.apk`
3. หาก Android ถามสิทธิ์ติดตั้งจากเบราว์เซอร์ ให้เปิด **อนุญาตจากแหล่งนี้** แล้วกลับมากดติดตั้ง
4. เปิดแอปชื่อ **SmartExam** จากหน้าจอหลัก
5. เมื่อเริ่มสแกนครั้งแรก ให้กดอนุญาตใช้กล้อง

APK รองรับ Android 7.0 (API 24) ขึ้นไป ใช้ package ID `com.hackedpro.smartexam`
และเซ็นด้วยกุญแจ release ของ SmartExam เพื่อให้อัปเดตรุ่นต่อไปทับรุ่นเดิมได้

## ติดตั้งบน iPhone หรือ iPad ตอนนี้

1. เปิด `https://aihackedpro.github.io/smartexam/` ด้วย Safari
2. กดปุ่ม **แชร์** ของ Safari
3. เลือก **เพิ่มไปยังหน้าจอโฮม**
4. กด **เพิ่ม** แล้วเปิดไอคอน SmartExam จากหน้าจอโฮม
5. เปิดออนไลน์ครั้งแรกให้จบก่อน จากนั้น app shell และข้อมูลที่บันทึกในเครื่องใช้งานต่อแบบ offline ได้

วิธีนี้เป็น PWA ที่ติดตั้งได้จริงและไม่ต้องผ่าน App Store ส่วนไฟล์ `.ipa` สำหรับติดตั้ง native
บนอุปกรณ์จริงต้องเซ็นด้วย Apple Developer certificate และ provisioning profile ของเจ้าของบัญชี

## สร้างไฟล์ Android สำหรับเผยแพร่

ครั้งแรกบนเครื่องเจ้าของให้สร้างกุญแจเซ็น:

```bash
npm run android:signing:setup
```

จากนั้นสร้าง APK และ AAB:

```bash
npm run android:release
```

ไฟล์ผลลัพธ์อยู่ใน `release/` กุญแจเซ็นถูกเก็บนอก repository ที่
`/Users/hackedpro/Library/Application Support/SmartExam Android Signing/smartexam-release.jks`
และรหัสถูกเก็บใน macOS Keychain ต้องสำรองไฟล์ `.jks` อย่างปลอดภัยและห้ามอัปโหลดขึ้น GitHub

## สร้าง iOS native application

```bash
npm run ios:sync
npm run ios:open
```

จาก Xcode เลือก Team ของบัญชี Apple Developer ให้ Bundle Identifier คงเป็น
`com.hackedpro.smartexam` แล้ว Archive เพื่อส่ง TestFlight/App Store หรือ export `.ipa`
โครงการกำหนด iOS 15 ขึ้นไป พร้อมคำอธิบายสิทธิ์กล้องและคลังรูปแล้ว

## การตรวจสอบก่อนเผยแพร่

```bash
npm run format:check
npm run lint
npm run test
npm run build
npm run native:doctor
```

CI ตรวจ Android build และ iOS Simulator build จากโครงการ native ทุกครั้งที่เปิด Pull Request
หรือส่งโค้ดเข้า `main`
