/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import Dexie, { type EntityTable } from 'dexie';
import type {
  AppSettings,
  DeviceIdentityRecord,
  Exam,
  ExamResult,
  LicenseRecord,
} from '../types/domain';

export class SmartExamDatabase extends Dexie {
  exams!: EntityTable<Exam, 'id'>;
  results!: EntityTable<ExamResult, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  deviceIdentities!: EntityTable<DeviceIdentityRecord, 'id'>;
  licenses!: EntityTable<LicenseRecord, 'id'>;

  constructor() {
    super('SmartExam');
    this.version(1).stores({});
    this.version(2).stores({
      exams: 'id, updatedAt, status, syncState',
      results: 'id, examId, updatedAt, reviewStatus, syncState',
      settings: 'id, updatedAt',
    });
    this.version(3).stores({
      exams: 'id, updatedAt, status, syncState',
      results: 'id, examId, updatedAt, reviewStatus, syncState',
      settings: 'id, updatedAt',
      deviceIdentities: 'id, createdAt',
      licenses: 'id, updatedAt',
    });
  }
}

export const database = new SmartExamDatabase();
