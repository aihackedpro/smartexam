/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly action?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl bg-navy-900 p-5 text-white shadow-navy sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
          <Icon aria-hidden="true" size={27} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-300">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100 sm:text-base">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
