/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { CircleHelp } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-soft sm:p-10">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-navy-800">
        <CircleHelp aria-hidden="true" size={30} />
      </span>
      <p className="mt-5 text-sm font-semibold text-emerald-700">ไม่พบหน้าที่ต้องการ</p>
      <h1 className="mt-1 text-2xl font-bold text-navy-900">ลิงก์นี้อาจยังไม่พร้อมใช้งาน</h1>
      <p className="mt-3 leading-7 text-slate-600">กลับไปยังหน้าหลักเพื่อเลือกงานที่ต้องการ</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-navy-800 px-5 font-semibold text-white transition hover:bg-navy-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
      >
        กลับหน้าหลัก
      </Link>
    </section>
  );
}
