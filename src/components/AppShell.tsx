/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { BookOpenCheck, CloudOff, Wifi } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { appConfig } from '../app/appConfig';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { BottomNavigation } from './BottomNavigation';
import { Footer } from './Footer';

export function AppShell() {
  const online = useOnlineStatus();

  return (
    <div className="min-h-dvh bg-app text-slate-900">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-white px-4 py-3 font-semibold text-navy-900 shadow-lg transition focus:translate-y-0"
      >
        ข้ามไปยังเนื้อหา
      </a>

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-800 text-white shadow-navy">
              <BookOpenCheck aria-hidden="true" size={25} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold tracking-tight text-navy-900">
                {appConfig.name}
              </p>
              <p className="truncate text-xs font-medium text-slate-500">
                ผู้ช่วยจัดการข้อสอบสำหรับครูไทย
              </p>
            </div>
          </div>
          <span
            className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold ring-1 max-[359px]:hidden ${
              online
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-amber-50 text-amber-800 ring-amber-200'
            }`}
          >
            {online ? (
              <Wifi aria-hidden="true" size={14} />
            ) : (
              <CloudOff aria-hidden="true" size={14} />
            )}
            {online ? 'LOCAL-FIRST' : 'ออฟไลน์'}
          </span>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
