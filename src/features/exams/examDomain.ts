/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { createId } from '../../lib/identifiers';
import type { Exam, Question } from '../../types/domain';

export interface ExamValidationIssue {
  readonly field: string;
  readonly message: string;
}

export function createQuestion(sequence: number): Question {
  return {
    id: createId('question'),
    prompt: `คำถามข้อที่ ${sequence}`,
    choices: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
    correctChoice: 0,
    points: 1,
  };
}

export function createExam(): Exam {
  const timestamp = new Date().toISOString();

  return {
    id: createId('exam'),
    title: 'ข้อสอบชุดใหม่',
    subject: '',
    gradeLevel: '',
    description: '',
    status: 'draft',
    questions: [createQuestion(1)],
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 0,
    syncState: 'local',
  };
}

export function validateExam(exam: Exam): readonly ExamValidationIssue[] {
  const issues: ExamValidationIssue[] = [];

  if (exam.title.trim().length < 2) {
    issues.push({ field: 'title', message: 'กรุณาตั้งชื่อข้อสอบอย่างน้อย 2 ตัวอักษร' });
  }

  if (exam.questions.length === 0) {
    issues.push({ field: 'questions', message: 'ข้อสอบต้องมีอย่างน้อย 1 ข้อ' });
  }

  exam.questions.forEach((question, index) => {
    if (question.prompt.trim().length === 0) {
      issues.push({ field: `question-${index}`, message: `ข้อ ${index + 1} ยังไม่มีคำถาม` });
    }
    if (question.choices.length < 2 || question.choices.some((choice) => choice.trim() === '')) {
      issues.push({
        field: `choices-${index}`,
        message: `ข้อ ${index + 1} ต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือกและห้ามเว้นว่าง`,
      });
    }
    if (question.correctChoice < 0 || question.correctChoice >= question.choices.length) {
      issues.push({ field: `answer-${index}`, message: `ข้อ ${index + 1} ยังไม่มีเฉลยที่ถูกต้อง` });
    }
    if (!Number.isFinite(question.points) || question.points <= 0) {
      issues.push({ field: `points-${index}`, message: `คะแนนข้อ ${index + 1} ต้องมากกว่า 0` });
    }
  });

  return issues;
}
