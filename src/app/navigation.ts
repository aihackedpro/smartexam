/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { ChartNoAxesColumnIncreasing, ClipboardPlus, House, Menu, ScanLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  readonly label: string;
  readonly path: string;
  readonly icon: LucideIcon;
}

export const navigationItems: readonly NavigationItem[] = [
  { label: 'หน้าหลัก', path: '/', icon: House },
  { label: 'สร้างข้อสอบ', path: '/exams', icon: ClipboardPlus },
  { label: 'สแกนตรวจ', path: '/scanner', icon: ScanLine },
  { label: 'รายงานผล', path: '/results', icon: ChartNoAxesColumnIncreasing },
  { label: 'เพิ่มเติม', path: '/more', icon: Menu },
];
