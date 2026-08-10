/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { describe, expect, it } from 'vitest';
import { createExam, validateExam } from '../src/features/exams/examDomain';

describe('การตรวจความพร้อมข้อสอบ', () => {
  it('ข้อสอบเริ่มต้นผ่านกฎพื้นฐาน', () => {
    expect(validateExam(createExam())).toEqual([]);
  });

  it('แจ้งปัญหาเมื่อไม่มีชื่อ ไม่มีคำถาม หรือตั้งคะแนนไม่ถูกต้อง', () => {
    const source = createExam();
    const firstQuestion = source.questions[0];
    if (!firstQuestion) throw new Error('ข้อมูลทดสอบต้องมีคำถามเริ่มต้น');
    const invalid = {
      ...source,
      title: '',
      questions: [{ ...firstQuestion, prompt: '', points: 0 }],
    };
    const messages = validateExam(invalid).map((issue) => issue.message);

    expect(messages).toContain('กรุณาตั้งชื่อข้อสอบอย่างน้อย 2 ตัวอักษร');
    expect(messages).toContain('ข้อ 1 ยังไม่มีคำถาม');
    expect(messages).toContain('คะแนนข้อ 1 ต้องมากกว่า 0');
  });
});
