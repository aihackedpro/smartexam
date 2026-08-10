/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { describe, expect, it } from 'vitest';
import {
  normalizeActivationKey,
  validateActivationKey,
} from '../src/features/licensing/licenseDomain';

describe('Activate Key แบบออฟไลน์', () => {
  it('จัดรูปแบบตัวพิมพ์และช่องว่างก่อนตรวจ', () => {
    expect(normalizeActivationKey(' se1-ab12-cd34-xy ')).toBe('SE1-AB12-CD34-XY');
  });

  it('ปฏิเสธรูปแบบที่ไม่ถูกต้องและ key ที่ checksum ไม่ตรง', () => {
    expect(validateActivationKey('ไม่ใช่-key')).toBe(false);
    expect(validateActivationKey('SE1-AB12-CD34-XX')).toBe(false);
  });

  it('ยอมรับ key ที่มีรูปแบบและ checksum ถูกต้อง', () => {
    expect(validateActivationKey('SE1-AB12-CD34-UC')).toBe(true);
  });
});
