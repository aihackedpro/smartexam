/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Crown,
  Infinity as InfinityIcon,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Timer,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { useStoredData } from '../../hooks/useStoredData';
import {
  activateLicense,
  getActivationOverview,
  initialActivationOverview,
} from './licenseService';

const messengerUrl = 'https://m.me/suebsing';
const loadActivationOverview = () => getActivationOverview();

interface Notice {
  readonly tone: 'success' | 'error';
  readonly title: string;
  readonly message: string;
}

const plans = [
  {
    name: '1 เดือน',
    price: '19 บาท',
    detail: 'ใช้งานได้ 30 วัน',
    icon: Timer,
    featured: false,
  },
  {
    name: '1 ปี',
    price: '99 บาท',
    detail: 'ใช้งานได้ 365 วัน',
    icon: CalendarDays,
    featured: true,
  },
  {
    name: 'ตลอดอายุ',
    price: '199 บาท',
    detail: 'ไม่กำหนดวันหมดอายุ',
    icon: InfinityIcon,
    featured: false,
  },
] as const;

function formatExpiry(value: string | null): string {
  if (!value) return 'ไม่มีวันหมดอายุ';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}

export function ActivationPanel() {
  const { data: overview, reload } = useStoredData(
    loadActivationOverview,
    initialActivationOverview,
  );
  const [activationKey, setActivationKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [showPurchase, setShowPurchase] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function copyDeviceCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(overview.deviceCode);
      setCopyMessage('คัดลอก Key โปรแกรมแล้ว');
    } catch {
      setCopyMessage('เลือกข้อความ Key โปรแกรมแล้วกดคัดลอก');
    }
  }

  async function handleActivate(): Promise<void> {
    if (!activationKey.trim()) {
      setNotice({
        tone: 'error',
        title: 'ยังไม่ได้กรอก Activate Key',
        message: 'กรุณาวาง Activate Key ที่ได้รับจากผู้พัฒนาแล้วลองอีกครั้ง',
      });
      return;
    }

    setActivating(true);
    try {
      const result = await activateLicense(activationKey);
      setNotice({
        tone: result.success ? 'success' : 'error',
        title: result.success ? 'เปิดใช้งานสำเร็จ' : 'ไม่สามารถเปิดใช้งานได้',
        message: result.message,
      });
      if (result.success) {
        setActivationKey('');
        reload();
      }
    } finally {
      setActivating(false);
    }
  }

  return (
    <section
      aria-labelledby="activation-heading"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"
    >
      <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-emerald-800 p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-emerald-200 ring-1 ring-white/15">
              <KeyRound aria-hidden="true" size={28} />
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-300">Secure License • ECDSA P-256</p>
              <h2 id="activation-heading" className="text-2xl font-extrabold">
                Activate SmartExam
              </h2>
            </div>
          </div>
          <StatusBadge tone={overview.active ? 'success' : 'warning'}>
            {overview.active
              ? `เปิดใช้งานแล้ว • ${overview.planName}`
              : `ทดลอง ${overview.scanUsageCount}/10 แผ่น`}
          </StatusBadge>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-sky-100">
          ใบอนุญาตผูกกับกุญแจประจำการติดตั้งนี้และตรวจลายเซ็นแบบออฟไลน์ Activate Key
          ของเครื่องอื่นไม่สามารถนำมาใช้แทนกันได้
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {overview.active ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3 text-emerald-900">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={24} />
              <div>
                <p className="font-extrabold">อุปกรณ์นี้เปิดใช้งานแล้ว</p>
                <p className="mt-1 text-sm leading-6">
                  แพ็กเกจ {overview.planName} • {formatExpiry(overview.expiresAt)}
                </p>
                <p className="mt-1 text-xs text-emerald-700">License ID: {overview.licenseId}</p>
              </div>
            </div>
          </div>
        ) : null}

        {overview.message ? (
          <p
            role="alert"
            className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900 ring-1 ring-amber-200"
          >
            {overview.message}
          </p>
        ) : null}

        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-emerald-700">Key โปรแกรมประจำเครื่อง</p>
              <h3 className="mt-1 text-lg font-extrabold text-navy-900">
                ส่งรหัสนี้เพื่อขอ Activate Key
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              สร้างจากกุญแจประจำการติดตั้ง
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <textarea
              readOnly
              rows={3}
              value={overview.deviceCode}
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Key โปรแกรมประจำเครื่อง"
              className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono text-xs font-bold leading-5 text-navy-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="button"
              onClick={() => void copyDeviceCode()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-navy-800 px-4 font-bold text-navy-900 hover:bg-navy-50"
            >
              <Copy aria-hidden="true" size={19} /> คัดลอก
            </button>
          </div>
          {copyMessage ? (
            <p role="status" className="mt-2 text-xs font-semibold text-emerald-700">
              {copyMessage}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <label>
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Activate Key</span>
            <textarea
              value={activationKey}
              onChange={(event) => setActivationKey(event.target.value)}
              placeholder="วาง Activate Key ที่ขึ้นต้นด้วย SE2."
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs leading-5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <button
            type="button"
            disabled={activating || overview.loading}
            onClick={() => void handleActivate()}
            className="mt-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-navy-800 px-5 text-lg font-extrabold text-white hover:bg-navy-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:cursor-wait disabled:opacity-60"
          >
            <ShieldCheck aria-hidden="true" size={22} />
            {activating ? 'กำลังตรวจลายเซ็น…' : 'ตรวจสอบและเปิดใช้งาน'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPurchase(true)}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-lg font-extrabold text-white shadow-emerald hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
        >
          <MessageCircle aria-hidden="true" size={23} /> ซื้อระบบหรือขอ Activate Key
        </button>
      </div>

      {showPurchase ? (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-title"
            className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                <Crown aria-hidden="true" size={28} />
              </span>
              <button
                type="button"
                onClick={() => setShowPurchase(false)}
                aria-label="ปิดหน้าต่างซื้อระบบ"
                className="grid min-h-12 min-w-12 place-items-center rounded-xl text-slate-600 hover:bg-slate-100"
              >
                <X aria-hidden="true" size={24} />
              </button>
            </div>
            <p className="mt-4 text-sm font-bold text-emerald-700">SmartExam Professional</p>
            <h3 id="purchase-title" className="mt-1 text-2xl font-extrabold text-navy-900">
              เลือกแพ็กเกจที่เหมาะกับคุณ
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {plans.map(({ name, price, detail, icon: Icon, featured }) => (
                <article
                  key={name}
                  className={`rounded-2xl p-4 text-center ring-1 ${
                    featured
                      ? 'bg-emerald-50 ring-2 ring-emerald-500'
                      : 'bg-slate-50 ring-slate-200'
                  }`}
                >
                  <Icon aria-hidden="true" className="mx-auto text-navy-800" size={24} />
                  <p className="mt-2 font-extrabold text-navy-900">{name}</p>
                  <p className="mt-1 text-xl font-black text-emerald-700">{price}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                </article>
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-navy-50 p-3 text-sm leading-6 text-navy-900">
              กรุณาส่ง Key โปรแกรมที่แสดงบนหน้านี้ พร้อมแจ้งแพ็กเกจที่ต้องการผ่าน Messenger
            </p>
            <a
              href={messengerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0866ff] px-5 text-lg font-extrabold text-white hover:bg-[#075ce5]"
            >
              <MessageCircle aria-hidden="true" size={23} /> ติดต่อผ่าน Messenger
            </a>
          </section>
        </div>
      ) : null}

      {notice ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="activation-notice-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <span
              className={`mx-auto grid size-16 place-items-center rounded-2xl ${
                notice.tone === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {notice.tone === 'success' ? (
                <CheckCircle2 aria-hidden="true" size={32} />
              ) : (
                <KeyRound aria-hidden="true" size={31} />
              )}
            </span>
            <h3 id="activation-notice-title" className="mt-4 text-2xl font-extrabold text-navy-900">
              {notice.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="mt-5 min-h-12 w-full rounded-xl bg-navy-800 px-4 font-bold text-white hover:bg-navy-900"
            >
              ปิด
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}
