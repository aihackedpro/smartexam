/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { DatabaseBackup, Download, Save, Settings, Upload } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { createBackup, getSettings, restoreBackup, saveSettings } from '../../database/repository';
import { ActivationPanel } from '../../features/licensing/ActivationPanel';
import { useStoredData } from '../../hooks/useStoredData';
import type { AppSettings } from '../../types/domain';
const loadSettings = () => getSettings();
const initialSettings: AppSettings = {
  id: 'app',
  schoolName: '',
  teacherName: '',
  scanUsageCount: 0,
  updatedAt: new Date(0).toISOString(),
};

function downloadBackupFile(source: string): void {
  const url = URL.createObjectURL(new Blob([source], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `smartexam-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function MorePage() {
  const { data: storedSettings, loading } = useStoredData(loadSettings, initialSettings);
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [message, setMessage] = useState('');
  const settings = draft ?? storedSettings;

  async function handleSaveSettings(): Promise<void> {
    const saved = await saveSettings(settings);
    setDraft(saved);
    setMessage('บันทึกการตั้งค่าในเครื่องแล้ว');
  }

  async function handleBackup(): Promise<void> {
    const backup = await createBackup();
    downloadBackupFile(JSON.stringify(backup, null, 2));
    setMessage('สร้างไฟล์สำรองแล้ว โปรดเก็บไฟล์ไว้ในตำแหน่งที่ปลอดภัย');
  }

  async function handleRestore(file: File | undefined): Promise<void> {
    if (!file) return;
    if (
      !window.confirm(
        'การกู้คืนจะแทนที่ข้อสอบ ผลตรวจ และการตั้งค่าทั้งหมดในเครื่องนี้ ดำเนินการต่อหรือไม่?',
      )
    )
      return;
    try {
      await restoreBackup(await file.text());
      setDraft(null);
      setMessage('กู้คืนข้อมูลจากไฟล์สำรองเรียบร้อยแล้ว');
    } catch {
      setMessage('ไฟล์สำรองไม่ถูกต้องหรือเสียหาย จึงไม่มีการเปลี่ยนแปลงข้อมูล');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ข้อมูลบนอุปกรณ์นี้"
        title="เพิ่มเติม"
        description="ตั้งค่าข้อมูลบนเอกสาร สำรองและกู้คืนข้อมูล รวมถึงตรวจสถานะการเปิดใช้งาน"
        icon={Settings}
      />

      {loading ? (
        <p role="status" className="p-5 text-center">
          กำลังอ่านการตั้งค่า…
        </p>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-navy-50 text-navy-800">
            <Settings aria-hidden="true" size={24} />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-700">ข้อมูลผู้ใช้งาน</p>
            <h2 className="text-xl font-extrabold text-navy-900">ชื่อบนเอกสาร</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-sm font-bold text-slate-700">ชื่อสถานศึกษา</span>
            <input
              value={settings.schoolName}
              onChange={(event) => setDraft({ ...settings, schoolName: event.target.value })}
              className="min-h-12 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="ไม่บังคับ"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-bold text-slate-700">ชื่อครูผู้สอน</span>
            <input
              value={settings.teacherName}
              onChange={(event) => setDraft({ ...settings, teacherName: event.target.value })}
              className="min-h-12 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="ไม่บังคับ"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void handleSaveSettings()}
          className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
        >
          <Save aria-hidden="true" size={19} /> บันทึกการตั้งค่า
        </button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <DatabaseBackup aria-hidden="true" size={25} />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Local-first</p>
              <h2 className="text-xl font-extrabold text-navy-900">สำรองและกู้คืน</h2>
            </div>
          </div>
          <StatusBadge tone="success">ข้อมูลอยู่ในเครื่อง</StatusBadge>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          ไฟล์สำรองรวมข้อสอบ ผลตรวจ และชื่อบนเอกสาร แต่ไม่รวม Activate Key, Device Key หรือโควตา
          โปรดเก็บในพื้นที่ส่วนตัวเพราะอาจมีรหัสผู้เข้าสอบ
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void handleBackup()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy-800 px-4 font-bold text-white hover:bg-navy-900"
          >
            <Download aria-hidden="true" size={19} /> ดาวน์โหลดไฟล์สำรอง
          </button>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-navy-800 px-4 font-bold text-navy-900 hover:bg-navy-50">
            <Upload aria-hidden="true" size={19} /> กู้คืนจากไฟล์
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => void handleRestore(event.target.files?.[0])}
            />
          </label>
        </div>
      </section>

      <ActivationPanel />

      {message ? (
        <p role="status" className="rounded-xl bg-navy-50 p-4 font-semibold text-navy-900">
          {message}
        </p>
      ) : null}
    </div>
  );
}
