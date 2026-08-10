/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { ArrowRight, ClipboardPlus, Printer, ScanLine, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InstallPrompt } from '../../components/InstallPrompt';
import { listExams, listResults } from '../../database/repository';
import { useStoredData } from '../../hooks/useStoredData';
import type { Exam, ExamResult } from '../../types/domain';

interface QuickAction {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly icon: LucideIcon;
  readonly tone: 'primary' | 'emerald' | 'light';
}

const quickActions: readonly QuickAction[] = [
  {
    title: 'สร้างข้อสอบใหม่',
    description: 'เริ่มจัดชุดข้อสอบอย่างเป็นระบบ',
    path: '/exams',
    icon: ClipboardPlus,
    tone: 'primary',
  },
  {
    title: 'พิมพ์กระดาษคำตอบ',
    description: 'เตรียมแบบฟอร์มสำหรับห้องเรียน',
    path: '/answer-sheets',
    icon: Printer,
    tone: 'light',
  },
  {
    title: 'เริ่มสแกนตรวจ',
    description: 'เตรียมขั้นตอนตรวจด้วยโทรศัพท์',
    path: '/scanner',
    icon: ScanLine,
    tone: 'emerald',
  },
];

const toneClasses: Record<QuickAction['tone'], string> = {
  primary: 'bg-navy-800 text-white shadow-navy',
  emerald: 'bg-emerald-600 text-white shadow-emerald',
  light: 'border border-slate-200 bg-white text-navy-900 shadow-soft',
};

const loadExams = () => listExams();
const loadResults = () => listResults();

export function HomePage() {
  const { data: exams } = useStoredData(loadExams, [] as readonly Exam[]);
  const { data: results } = useStoredData(loadResults, [] as readonly ExamResult[]);
  const pendingReviewCount = results.filter(
    (result) => result.reviewStatus === 'needs-review',
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 px-5 py-6 text-white shadow-navy sm:px-8 sm:py-9">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex min-h-8 items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-medium text-sky-100 ring-1 ring-white/15">
            <WifiOff aria-hidden="true" size={16} />
            พร้อมสำหรับโหมดออฟไลน์
          </div>
          <p className="text-sm font-semibold tracking-wide text-emerald-300">
            SMARTEXAM • LOCAL-FIRST
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            เตรียมงานสอบให้เป็นเรื่องง่าย
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-sky-100 sm:text-lg">
            พื้นที่ทำงานสำหรับสร้างข้อสอบ เตรียมกระดาษคำตอบ และจัดการผลสอบของครูไทย ในระบบเดียว
          </p>
        </div>
      </section>

      <InstallPrompt />

      <section aria-labelledby="quick-actions-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-700">เริ่มต้นใช้งาน</p>
            <h2
              id="quick-actions-heading"
              className="mt-1 text-xl font-bold text-navy-900 sm:text-2xl"
            >
              งานที่ใช้บ่อย
            </h2>
          </div>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            พร้อมใช้งาน
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map(({ title, description, path, icon: Icon, tone }) => (
            <Link
              key={title}
              to={path}
              className={`group flex min-h-36 flex-col justify-between rounded-2xl p-5 transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${toneClasses[tone]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-xl bg-current/10 ring-1 ring-current/10">
                  <Icon aria-hidden="true" size={26} strokeWidth={2} />
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  size={22}
                />
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="overview-heading"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"
      >
        <p className="text-sm font-semibold text-emerald-700">ภาพรวมในเครื่องนี้</p>
        <h2 id="overview-heading" className="mt-1 text-lg font-bold text-navy-900">
          งานสอบของคุณ
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-navy-50 p-3 text-center">
            <p className="text-2xl font-black text-navy-900">{exams.length}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">ข้อสอบ</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
            <p className="text-2xl font-black text-emerald-700">{results.length}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">ผลตรวจ</p>
          </div>
          <div
            className={`rounded-2xl p-3 text-center ${pendingReviewCount ? 'bg-amber-50' : 'bg-slate-100'}`}
          >
            <p
              className={`text-2xl font-black ${pendingReviewCount ? 'text-amber-800' : 'text-slate-700'}`}
            >
              {pendingReviewCount}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">รอตรวจ</p>
          </div>
        </div>
      </section>
    </div>
  );
}
