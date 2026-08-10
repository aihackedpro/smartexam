/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { NavLink } from 'react-router-dom';
import { navigationItems } from '../app/navigation';

export function BottomNavigation() {
  return (
    <nav
      aria-label="เมนูหลัก"
      className="bottom-safe fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-3xl grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pt-1 shadow-nav backdrop-blur-lg sm:rounded-t-2xl sm:px-3"
    >
      {navigationItems.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            `flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[0.68rem] font-semibold leading-tight transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:min-h-16 sm:text-xs ${
              isActive
                ? 'bg-navy-50 text-navy-900'
                : 'text-slate-500 hover:bg-slate-100 hover:text-navy-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon aria-hidden="true" size={isActive ? 23 : 22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="truncate">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
