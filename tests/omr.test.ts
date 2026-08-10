/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { describe, expect, it } from 'vitest';
import { classifyFillScores, templateBubblePosition } from '../src/features/scanner/omr';

describe('การตีความวงคำตอบ OMR', () => {
  it('อ่านวงที่เข้มและแยกจากตัวเลือกอื่นเป็นคำตอบยืนยัน', () => {
    const result = classifyFillScores([0.05, 0.62, 0.07, 0.04]);

    expect(result.status).toBe('confirmed');
    expect(result.choice).toBe(1);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('ไม่เดาเมื่อมีการระบายสองวงใกล้เคียงกัน', () => {
    const result = classifyFillScores([0.48, 0.45, 0.05, 0.04]);

    expect(result.status).toBe('ambiguous');
    expect(result.choice).toBeNull();
  });

  it('อ่านข้อที่ไม่ระบายเป็นคำตอบว่าง', () => {
    expect(classifyFillScores([0.04, 0.06, 0.03, 0.05]).status).toBe('unanswered');
  });

  it('คำนวณตำแหน่งสองคอลัมน์และสามสิบแถวตาม template', () => {
    const first = templateBubblePosition(0, 0, 4);
    const nextRow = templateBubblePosition(1, 0, 4);
    const nextColumn = templateBubblePosition(30, 0, 4);

    expect(nextRow.y).toBeGreaterThan(first.y);
    expect(nextColumn.x).toBeGreaterThan(first.x);
    expect(nextColumn.y).toBeCloseTo(first.y);
  });
});
