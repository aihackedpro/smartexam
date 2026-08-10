/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { describe, expect, it } from 'vitest';
import { a4PortraitAspectRatio, calculateA4Crop } from '../src/features/scanner/cameraGeometry';

describe('camera A4 crop', () => {
  it('ตัดด้านซ้ายและขวาของภาพแนวนอนให้อยู่กึ่งกลาง A4', () => {
    const crop = calculateA4Crop(1920, 1080);

    expect(crop.sourceY).toBe(0);
    expect(crop.sourceHeight).toBe(1080);
    expect(crop.sourceX).toBeGreaterThan(0);
    expect(crop.sourceWidth / crop.sourceHeight).toBeCloseTo(a4PortraitAspectRatio, 8);
    expect(crop.sourceX * 2 + crop.sourceWidth).toBeCloseTo(1920, 8);
  });

  it('ตัดด้านบนและล่างของภาพแนวตั้งที่แคบให้อยู่กึ่งกลาง A4', () => {
    const crop = calculateA4Crop(720, 1600);

    expect(crop.sourceX).toBe(0);
    expect(crop.sourceWidth).toBe(720);
    expect(crop.sourceY).toBeGreaterThan(0);
    expect(crop.sourceWidth / crop.sourceHeight).toBeCloseTo(a4PortraitAspectRatio, 8);
    expect(crop.sourceY * 2 + crop.sourceHeight).toBeCloseTo(1600, 8);
  });

  it('ปฏิเสธขนาดภาพที่ไม่ถูกต้อง', () => {
    expect(() => calculateA4Crop(0, 1080)).toThrow('ขนาดภาพจากกล้องไม่ถูกต้อง');
  });
});
