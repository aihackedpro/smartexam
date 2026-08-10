/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { describe, expect, it } from 'vitest';
import { scoreAnswers } from '../src/features/results/scoring';
import type { Exam, MarkedAnswer } from '../src/types/domain';

const exam: Exam = {
  id: 'exam-test',
  title: 'ชุดทดสอบ',
  subject: '',
  gradeLevel: '',
  description: '',
  status: 'ready',
  questions: [
    { id: 'q1', prompt: 'คำถามหนึ่ง', choices: ['ก', 'ข'], correctChoice: 0, points: 1 },
    { id: 'q2', prompt: 'คำถามสอง', choices: ['ก', 'ข'], correctChoice: 1, points: 2 },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  revision: 1,
  syncState: 'local',
};

describe('การให้คะแนนข้อสอบ', () => {
  it('รวมคะแนนเฉพาะคำตอบที่ครูยืนยันและตอบถูก', () => {
    const answers: readonly MarkedAnswer[] = [
      { questionId: 'q1', choice: 0, status: 'confirmed', confidence: 1 },
      { questionId: 'q2', choice: 0, status: 'confirmed', confidence: 1 },
    ];

    expect(scoreAnswers(exam, answers)).toEqual({ score: 1, maxScore: 3, needsReview: false });
  });

  it('ไม่เดาหรือให้คะแนนคำตอบกำกวมและส่งสถานะรอตรวจ', () => {
    const answers: readonly MarkedAnswer[] = [
      { questionId: 'q1', choice: 0, status: 'ambiguous', confidence: 0.45 },
      { questionId: 'q2', choice: 1, status: 'confirmed', confidence: 1 },
    ];

    expect(scoreAnswers(exam, answers)).toEqual({ score: 2, maxScore: 3, needsReview: true });
  });

  it('รองรับคำตอบว่างโดยไม่เพิ่มคะแนน', () => {
    expect(scoreAnswers(exam, [])).toEqual({ score: 0, maxScore: 3, needsReview: false });
  });
});
