/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

export type SyncState = 'local' | 'pending' | 'synced' | 'conflict';
export type ExamStatus = 'draft' | 'ready';
export type ReviewStatus = 'complete' | 'needs-review';
export type AnswerStatus = 'confirmed' | 'ambiguous' | 'unanswered';

export interface Question {
  readonly id: string;
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly correctChoice: number;
  readonly points: number;
}

export interface Exam {
  readonly id: string;
  readonly title: string;
  readonly subject: string;
  readonly gradeLevel: string;
  readonly description: string;
  readonly status: ExamStatus;
  readonly questions: readonly Question[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revision: number;
  readonly syncState: SyncState;
}

export interface MarkedAnswer {
  readonly questionId: string;
  readonly choice: number | null;
  readonly status: AnswerStatus;
  readonly confidence: number | null;
}

export interface ExamResult {
  readonly id: string;
  readonly examId: string;
  readonly examineeCode: string;
  readonly answers: readonly MarkedAnswer[];
  readonly score: number;
  readonly maxScore: number;
  readonly reviewStatus: ReviewStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revision: number;
  readonly syncState: SyncState;
}

export type LicenseStatus = 'demo' | 'activated';

export interface AppSettings {
  readonly id: 'app';
  readonly schoolName: string;
  readonly teacherName: string;
  readonly licenseStatus: LicenseStatus;
  readonly activationHint: string;
  readonly scanUsageCount: number;
  readonly updatedAt: string;
}

export interface SmartExamBackup {
  readonly format: 'smartexam-backup';
  readonly version: 1;
  readonly exportedAt: string;
  readonly exams: readonly Exam[];
  readonly results: readonly ExamResult[];
  readonly settings: AppSettings;
}
