/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import Dexie, { type EntityTable } from 'dexie';
import type { AppSettings, Exam, ExamResult } from '../types/domain';

export class SmartExamDatabase extends Dexie {
  exams!: EntityTable<Exam, 'id'>;
  results!: EntityTable<ExamResult, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('SmartExam');
    this.version(1).stores({});
    this.version(2).stores({
      exams: 'id, updatedAt, status, syncState',
      results: 'id, examId, updatedAt, reviewStatus, syncState',
      settings: 'id, updatedAt',
    });
  }
}

export const database = new SmartExamDatabase();
