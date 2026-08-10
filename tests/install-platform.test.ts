/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { describe, expect, it } from 'vitest';
import { detectInstallPlatform } from '../src/lib/installPlatform';

describe('install platform detection', () => {
  it('ตรวจพบ iPhone และ iPad รุ่นใหม่ที่รายงานตัวเป็น Mac', () => {
    expect(
      detectInstallPlatform({
        userAgent: 'Mozilla/5.0 (iPhone)',
        platform: 'iPhone',
        maxTouchPoints: 5,
      }),
    ).toBe('ios');
    expect(
      detectInstallPlatform({
        userAgent: 'Mozilla/5.0 Safari',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      }),
    ).toBe('ios');
  });

  it('ตรวจพบ Android', () => {
    expect(
      detectInstallPlatform({
        userAgent: 'Mozilla/5.0 (Linux; Android 15)',
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
      }),
    ).toBe('android');
  });

  it('ใช้คำแนะนำคอมพิวเตอร์สำหรับอุปกรณ์อื่น', () => {
    expect(
      detectInstallPlatform({
        userAgent: 'Mozilla/5.0 Chrome',
        platform: 'Win32',
        maxTouchPoints: 0,
      }),
    ).toBe('desktop');
  });
});
