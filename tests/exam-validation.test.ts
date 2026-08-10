/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { describe, expect, it } from 'vitest';
import { createExam, createQuestion, validateExam } from '../src/features/exams/examDomain';
import { isExamReadyForScanning, maxQuestionsPerAnswerSheet } from '../src/lib/answerSheetLayout';

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

  it('ไม่อนุญาตทำข้อสอบพร้อมใช้เมื่อเกินขนาดกระดาษ OMR หนึ่งแผ่น', () => {
    const exam = {
      ...createExam(),
      questions: Array.from({ length: maxQuestionsPerAnswerSheet + 1 }, (_, index) =>
        createQuestion(index + 1),
      ),
    };

    expect(validateExam(exam).map((issue) => issue.message)).toContain(
      `กระดาษคำตอบหนึ่งแผ่นรองรับสูงสุด ${maxQuestionsPerAnswerSheet} ข้อ กรุณาแบ่งเป็นหลายชุด`,
    );
  });

  it('ส่งเข้าสแกนเฉพาะข้อสอบพร้อมใช้ที่อยู่ในขนาดหนึ่งแผ่น', () => {
    expect(isExamReadyForScanning(1, 'draft')).toBe(false);
    expect(isExamReadyForScanning(0, 'ready')).toBe(false);
    expect(isExamReadyForScanning(maxQuestionsPerAnswerSheet, 'ready')).toBe(true);
    expect(isExamReadyForScanning(maxQuestionsPerAnswerSheet + 1, 'ready')).toBe(false);
  });
});
