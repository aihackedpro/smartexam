/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

interface StatusBadgeProps {
  readonly tone: 'success' | 'warning' | 'neutral' | 'danger';
  readonly children: React.ReactNode;
}

const toneClasses: Record<StatusBadgeProps['tone'], string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-bold ring-1 ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
