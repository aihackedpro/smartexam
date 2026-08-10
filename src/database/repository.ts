/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { z } from 'zod';
import type { AppSettings, Exam, ExamResult, SmartExamBackup } from '../types/domain';
import { database } from './database';

const defaultSettings: AppSettings = {
  id: 'app',
  schoolName: '',
  teacherName: '',
  licenseStatus: 'demo',
  activationHint: '',
  updatedAt: new Date(0).toISOString(),
};

const dataChangeEvent = 'smartexam:data-change';

const questionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string(),
  choices: z.array(z.string()).min(2).max(5),
  correctChoice: z.number().int().nonnegative(),
  points: z.number().positive(),
});

const examSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  subject: z.string(),
  gradeLevel: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'ready']),
  questions: z.array(questionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  revision: z.number().int().nonnegative(),
  syncState: z.enum(['local', 'pending', 'synced', 'conflict']),
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  choice: z.number().int().nonnegative().nullable(),
  status: z.enum(['confirmed', 'ambiguous', 'unanswered']),
  confidence: z.number().min(0).max(1).nullable(),
});

const resultSchema = z.object({
  id: z.string().min(1),
  examId: z.string().min(1),
  examineeCode: z.string(),
  answers: z.array(answerSchema),
  score: z.number().nonnegative(),
  maxScore: z.number().nonnegative(),
  reviewStatus: z.enum(['complete', 'needs-review']),
  createdAt: z.string(),
  updatedAt: z.string(),
  revision: z.number().int().nonnegative(),
  syncState: z.enum(['local', 'pending', 'synced', 'conflict']),
});

const settingsSchema = z.object({
  id: z.literal('app'),
  schoolName: z.string(),
  teacherName: z.string(),
  licenseStatus: z.enum(['demo', 'activated']),
  activationHint: z.string(),
  updatedAt: z.string(),
});

const backupSchema = z.object({
  format: z.literal('smartexam-backup'),
  version: z.literal(1),
  exportedAt: z.string(),
  exams: z.array(examSchema),
  results: z.array(resultSchema),
  settings: settingsSchema,
});

export function parseExamRecord(source: unknown): Exam | null {
  const result = examSchema.safeParse(source);
  return result.success ? result.data : null;
}

function notifyDataChange(): void {
  window.dispatchEvent(new Event(dataChangeEvent));
}

export function subscribeToDataChanges(listener: () => void): () => void {
  window.addEventListener(dataChangeEvent, listener);
  return () => window.removeEventListener(dataChangeEvent, listener);
}

export async function listExams(): Promise<readonly Exam[]> {
  return database.exams.orderBy('updatedAt').reverse().toArray();
}

export async function getExam(id: string): Promise<Exam | undefined> {
  return database.exams.get(id);
}

export async function saveExam(exam: Exam): Promise<Exam> {
  const saved: Exam = {
    ...exam,
    updatedAt: new Date().toISOString(),
    revision: exam.revision + 1,
    syncState: 'pending',
  };
  await database.exams.put(saved);
  notifyDataChange();
  return saved;
}

export async function deleteExam(id: string): Promise<void> {
  await database.transaction('rw', database.exams, database.results, async () => {
    await database.results.where('examId').equals(id).delete();
    await database.exams.delete(id);
  });
  notifyDataChange();
}

export async function listResults(examId?: string): Promise<readonly ExamResult[]> {
  if (examId) return database.results.where('examId').equals(examId).reverse().sortBy('updatedAt');
  return database.results.orderBy('updatedAt').reverse().toArray();
}

export async function saveResult(result: ExamResult): Promise<ExamResult> {
  const saved: ExamResult = {
    ...result,
    updatedAt: new Date().toISOString(),
    revision: result.revision + 1,
    syncState: 'pending',
  };
  await database.results.put(saved);
  notifyDataChange();
  return saved;
}

export async function deleteResult(id: string): Promise<void> {
  await database.results.delete(id);
  notifyDataChange();
}

export async function getSettings(): Promise<AppSettings> {
  return (await database.settings.get('app')) ?? defaultSettings;
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const saved = { ...settings, updatedAt: new Date().toISOString() };
  await database.settings.put(saved);
  notifyDataChange();
  return saved;
}

export async function createBackup(): Promise<SmartExamBackup> {
  const [exams, results, settings] = await Promise.all([listExams(), listResults(), getSettings()]);
  return {
    format: 'smartexam-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    exams,
    results,
    settings,
  };
}

export async function restoreBackup(source: string): Promise<SmartExamBackup> {
  const parsed: unknown = JSON.parse(source);
  const backup = backupSchema.parse(parsed);

  await database.transaction(
    'rw',
    database.exams,
    database.results,
    database.settings,
    async () => {
      await Promise.all([
        database.exams.clear(),
        database.results.clear(),
        database.settings.clear(),
      ]);
      await database.exams.bulkPut(backup.exams);
      await database.results.bulkPut(backup.results);
      await database.settings.put(backup.settings);
    },
  );
  notifyDataChange();
  return backup;
}
