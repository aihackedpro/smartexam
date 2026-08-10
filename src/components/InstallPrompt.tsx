/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import {
  CheckCircle2,
  Download,
  MoreVertical,
  PlusSquare,
  Share2,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { detectInstallPlatform, type InstallPlatform } from '../lib/installPlatform';
import { getPwaInstallSnapshot, requestPwaInstall, subscribePwaInstall } from '../lib/pwaInstall';

interface InstallGuide {
  readonly title: string;
  readonly introduction: string;
  readonly steps: readonly string[];
}

const installGuides: Readonly<Record<InstallPlatform, InstallGuide>> = {
  ios: {
    title: 'ติดตั้งบน iPhone หรือ iPad',
    introduction: 'Apple กำหนดให้ติดตั้งผ่านเมนูแชร์ ทำเพียง 3 ขั้นตอนนี้',
    steps: [
      'เปิดหน้านี้ด้วย Safari',
      'กดปุ่มแชร์ด้านล่างของ Safari',
      'เลือก “เพิ่มไปยังหน้าจอโฮม” แล้วกด “เพิ่ม”',
    ],
  },
  android: {
    title: 'ติดตั้งบน Android',
    introduction: 'หากหน้าติดตั้งไม่เปิดอัตโนมัติ ให้ทำตาม 2 ขั้นตอนนี้',
    steps: [
      'กดเมนู ⋮ มุมขวาบนของเบราว์เซอร์',
      'เลือก “ติดตั้งแอป” หรือ “เพิ่มไปยังหน้าจอหลัก” แล้วกดยืนยัน',
    ],
  },
  desktop: {
    title: 'ติดตั้งบนคอมพิวเตอร์',
    introduction: 'หากหน้าติดตั้งไม่เปิดอัตโนมัติ ให้ทำตาม 2 ขั้นตอนนี้',
    steps: [
      'กดไอคอนติดตั้งที่ด้านขวาของแถบที่อยู่ หรือเปิดเมนูเบราว์เซอร์',
      'เลือก “ติดตั้ง SmartExam” แล้วกดยืนยัน',
    ],
  },
};

function GuideIcon({ platform }: { readonly platform: InstallPlatform }) {
  if (platform === 'ios') return <Share2 aria-hidden="true" size={24} />;
  if (platform === 'android') return <MoreVertical aria-hidden="true" size={24} />;
  return <PlusSquare aria-hidden="true" size={24} />;
}

export function InstallPrompt() {
  const { canPrompt, installed } = useSyncExternalStore(
    subscribePwaInstall,
    getPwaInstallSnapshot,
    getPwaInstallSnapshot,
  );
  const [showHelp, setShowHelp] = useState(false);
  const [installing, setInstalling] = useState(false);
  const platform = detectInstallPlatform();
  const guide = installGuides[platform];

  async function handleInstall(): Promise<void> {
    if (!canPrompt) {
      setShowHelp(true);
      return;
    }

    setInstalling(true);
    try {
      const result = await requestPwaInstall();
      if (result === 'unavailable') setShowHelp(true);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <section
      aria-labelledby="install-app-heading"
      className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-soft sm:p-6"
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-12 size-40 rounded-full bg-emerald-200/35 blur-2xl"
      />
      <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy-800 text-white shadow-navy">
            <Smartphone aria-hidden="true" size={28} />
          </span>
          <div>
            <p className="text-sm font-bold text-emerald-700">ติดตั้งครั้งเดียว ใช้งานได้ทุกวัน</p>
            <h2
              id="install-app-heading"
              className="mt-1 text-xl font-extrabold text-navy-900 sm:text-2xl"
            >
              ติดตั้ง SmartExam ลงเครื่อง
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              เปิดจากหน้าจอหลักได้ทันที ใช้งานเต็มจอ และทำงานออฟไลน์ได้หลังเปิดใช้งานครั้งแรก
            </p>
          </div>
        </div>

        {installed ? (
          <p className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-5 font-extrabold text-emerald-800 ring-1 ring-emerald-300">
            <CheckCircle2 aria-hidden="true" size={22} /> ติดตั้งเรียบร้อยแล้ว
          </p>
        ) : (
          <button
            type="button"
            disabled={installing}
            onClick={() => void handleInstall()}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-lg font-extrabold text-white shadow-emerald transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-64"
          >
            <Download aria-hidden="true" size={23} />
            {installing ? 'กำลังเปิดหน้าติดตั้ง…' : 'ติดตั้ง SmartExam ลงเครื่อง'}
          </button>
        )}
      </div>

      <p className="relative mt-4 flex items-center gap-2 border-t border-emerald-200/80 pt-3 text-xs font-semibold text-slate-600">
        <WifiOff aria-hidden="true" className="text-emerald-700" size={17} />
        ฟรี • ไม่ต้องดาวน์โหลดไฟล์ติดตั้ง • ข้อมูลข้อสอบอยู่ในเครื่องของคุณ
      </p>

      {showHelp ? (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-guide-title"
            aria-describedby="install-guide-description"
            className="w-full max-w-md rounded-3xl bg-white p-5 text-left shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
                <GuideIcon platform={platform} />
              </span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="ปิดคำแนะนำการติดตั้ง"
                className="grid min-h-12 min-w-12 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              >
                <X aria-hidden="true" size={24} />
              </button>
            </div>
            <h3 id="install-guide-title" className="mt-4 text-2xl font-extrabold text-navy-900">
              {guide.title}
            </h3>
            <p id="install-guide-description" className="mt-2 text-sm leading-6 text-slate-600">
              {guide.introduction}
            </p>
            <ol className="mt-5 space-y-3">
              {guide.steps.map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-800 font-extrabold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-5 min-h-14 w-full rounded-2xl bg-navy-800 px-5 font-extrabold text-white hover:bg-navy-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
            >
              เข้าใจแล้ว
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}
